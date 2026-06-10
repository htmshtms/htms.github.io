/**
 * Core idea:
 * "Flow Field / Domain Warp" effect using a WebGL fragment shader.
 * It uses nested Fractal Brownian Motion (FBM) to create an organic, 
 * slowly morphing background. The domain (coordinates) of each noise layer 
 * is warped by the previous layer, creating a fluid, smoke-like motion.
 */
class FlowEffect {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      speed: 0.08,
      warp: 4.0,
      contrast: 1.25,
      mousePull: 0.25,
      ...options
    };
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '0'; 
    this.canvas.style.opacity = '0.5'; // Blend with the dark overlay
    
    this.container.insertBefore(this.canvas, this.container.firstChild);
    
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.warn('WebGL not supported');
      return;
    }
    
    this.width = 0;
    this.height = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.startTime = Date.now();
    
    this.initShader();
    this.initBuffers();
    
    this.resize = this.resize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.render = this.render.bind(this);
    
    window.addEventListener('resize', this.resize);
    this.container.addEventListener('mousemove', this.onMouseMove);
    
    this.resize();
    this.isActive = true;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      this.isActive = false;
      this.canvas.style.display = 'none';
    }
    
    if (this.isActive) {
      requestAnimationFrame(this.render);
    }
  }
  
  initShader() {
    const gl = this.gl;
    
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    
    const fsSource = `
      precision highp float;
      
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec2 iMouse;
      
      uniform float uSpeed;
      uniform float uWarp;
      uniform float uContrast;
      uniform float uMouse;
      
      // Hash function
      float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
      }
      
      // 2D Noise
      float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      // FBM
      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
              value += amplitude * noise(p);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }
      
      void main() {
          vec2 uv = gl_FragCoord.xy / iResolution.xy;
          uv.y = 1.0 - uv.y; 
          
          // Aspect ratio correction
          vec2 p = uv * 2.0 - 1.0;
          p.x *= iResolution.x / iResolution.y;
          
          // Mouse influence
          vec2 mouse = iMouse / iResolution.xy * 2.0 - 1.0;
          mouse.x *= iResolution.x / iResolution.y;
          
          float t = iTime * uSpeed;
          
          // Mouse pull logic
          float dist = length(p - mouse);
          vec2 pull = normalize(p - mouse) * exp(-dist * 3.0) * uMouse;
          // Avoid NaN when p == mouse
          if(dist < 0.001) pull = vec2(0.0);
          
          vec2 pWarped = p + pull;
          
          // Domain warping: f(p) = fbm(p + fbm(p + fbm(p)))
          vec2 q = vec2(
              fbm(pWarped * uWarp + vec2(0.0, 0.0) + t),
              fbm(pWarped * uWarp + vec2(5.2, 1.3) + t)
          );
          
          vec2 r = vec2(
              fbm(pWarped * uWarp + uWarp * q + vec2(1.7, 9.2) + t * 1.5),
              fbm(pWarped * uWarp + uWarp * q + vec2(8.3, 2.8) + t * 1.5)
          );
          
          float f = fbm(pWarped * uWarp + uWarp * r + t * 2.0);
          
          // Contrast
          f = f * uContrast;
          
          // Output single grayscale channel
          float v = mix(0.1, 0.9, f);
          gl_FragColor = vec4(vec3(v), 1.0); 
      }
    `;
    
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
      gl.deleteProgram(this.program);
    }
    
    this.locations = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      iTime: gl.getUniformLocation(this.program, 'iTime'),
      iResolution: gl.getUniformLocation(this.program, 'iResolution'),
      iMouse: gl.getUniformLocation(this.program, 'iMouse'),
      uSpeed: gl.getUniformLocation(this.program, 'uSpeed'),
      uWarp: gl.getUniformLocation(this.program, 'uWarp'),
      uContrast: gl.getUniformLocation(this.program, 'uContrast'),
      uMouse: gl.getUniformLocation(this.program, 'uMouse'),
    };
  }
  
  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  initBuffers() {
    const gl = this.gl;
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    
    // Fullscreen quad
    const positions = [
      -1.0,  1.0,
      -1.0, -1.0,
       1.0,  1.0,
       1.0, -1.0,
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  }
  
  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    // Support high DPI displays
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  
  onMouseMove(e) {
    if (!this.isActive) return;
    
    const style = window.getComputedStyle(this.container);
    if (style.visibility === 'hidden' || style.opacity === '0') return;

    const rect = this.container.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }
  
  render() {
    if (!this.isActive) return;
    
    const style = window.getComputedStyle(this.container);
    if (style.visibility === 'visible' && style.opacity !== '0') {
      const gl = this.gl;
      
      gl.useProgram(this.program);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(this.locations.position);
      gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
      
      const currentTime = (Date.now() - this.startTime) / 1000.0;
      
      gl.uniform1f(this.locations.iTime, currentTime);
      gl.uniform2f(this.locations.iResolution, this.canvas.width, this.canvas.height);
      gl.uniform2f(this.locations.iMouse, this.mouseX * (window.devicePixelRatio || 1), this.mouseY * (window.devicePixelRatio || 1));
      
      gl.uniform1f(this.locations.uSpeed, this.options.speed);
      gl.uniform1f(this.locations.uWarp, this.options.warp);
      gl.uniform1f(this.locations.uContrast, this.options.contrast);
      gl.uniform1f(this.locations.uMouse, this.options.mousePull);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    requestAnimationFrame(this.render);
  }
}

function initFlow() {
  const navOverlay = document.querySelector('.nav-overlay');
  if (navOverlay) {
    new FlowEffect(navOverlay, {
      speed: 0.08,
      warp: 4.0,
      contrast: 1.25,
      mousePull: 0.25
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlow);
} else {
  initFlow();
}
