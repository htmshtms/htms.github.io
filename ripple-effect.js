/**
 * Core idea:
 * This component creates a "water ripple / distortion" effect on an HTML5 Canvas without relying on heavy WebGL libraries.
 * As the user moves the cursor, it registers "drops" with a set lifespan. A render loop iterates through
 * these drops, drawing expanding concentric circles (wavefronts) whose opacity decays over time.
 * The parameters (speed, freq, amp, life) control the expansion rate, spacing, thickness, and duration of the ripples.
 */
class RippleEffect {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      speed: 0.55,
      freq: 32,
      amp: 0.05,
      life: 2.8,
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
    this.container.insertBefore(this.canvas, this.container.firstChild);
    
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.width = 0;
    this.height = 0;
    
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
    }
    
    if (this.isActive) {
      requestAnimationFrame(this.render);
    }
  }
  
  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  
  onMouseMove(e) {
    if (!this.isActive) return;
    
    // Only process drops if the navigation is open (visible)
    const style = window.getComputedStyle(this.container);
    if (style.visibility === 'hidden' || style.opacity === '0') return;

    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.drops.push({
      x, y,
      age: 0,
      maxLife: this.options.life * 60 // converting seconds to approx frames
    });
  }
  
  render() {
    if (!this.isActive) return;
    
    // Pause heavy loops if hidden
    const style = window.getComputedStyle(this.container);
    if (style.visibility === 'visible' && style.opacity !== '0') {
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      const baseRadiusSpeed = this.options.speed * 12;
      const ringSpacing = this.options.freq;
      const maxLineWidth = this.options.amp * 150;
      
      for (let i = this.drops.length - 1; i >= 0; i--) {
        let drop = this.drops[i];
        drop.age += 1;
        
        if (drop.age > drop.maxLife) {
          this.drops.splice(i, 1);
          continue;
        }
        
        let progress = drop.age / drop.maxLife;
        let alpha = 1.0 - Math.pow(progress, 1.2); 
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        
        // Draw expanding wavefronts
        for (let r = 0; r < 3; r++) {
          let radius = drop.age * baseRadiusSpeed - r * ringSpacing;
          if (radius > 0) {
            this.ctx.lineWidth = Math.max(0.1, maxLineWidth * (1 - r/3) * alpha);
            this.ctx.beginPath();
            this.ctx.arc(drop.x, drop.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
          }
        }
      }
    } else {
      // Clear drops if closed
      this.drops = [];
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    requestAnimationFrame(this.render);
  }
}

function initRipple() {
  const navOverlay = document.querySelector('.nav-overlay');
  if (navOverlay) {
    new RippleEffect(navOverlay, {
      speed: 0.55,
      freq: 32,
      amp: 0.05,
      life: 2.8
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRipple);
} else {
  initRipple();
}
