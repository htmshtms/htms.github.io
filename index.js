document.addEventListener("DOMContentLoaded", () => {
  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const fadeElements = document.querySelectorAll('.fade-in, .slide-up');
  fadeElements.forEach(el => observer.observe(el));

  // Parallax effect for hero image
  const heroImg = document.querySelector('.hero-img-overlay');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (heroImg && scrollY < window.innerHeight) {
      // Create a smooth parallax shift
      heroImg.style.transform = `scale(1.15) translateY(${scrollY * 0.3}px)`;
    }
  });

  /*
    Canvas Line Trail
    A smooth, continuous fading line following the mouse using HTML5 Canvas.
  */
  class CanvasLineTrail {
    constructor() {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.prefersReducedMotion) return;

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'cursorCanvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '9999';
      document.body.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');
      this.points = [];

      this.resize();
      window.addEventListener('resize', () => this.resize());

      window.addEventListener('mousemove', (e) => {
        const lastPoint = this.points[this.points.length - 1];
        if (lastPoint) {
          const dx = e.clientX - lastPoint.x;
          const dy = e.clientY - lastPoint.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 2) {
            const steps = Math.floor(dist / 2);
            for (let i = 1; i <= steps; i++) {
              this.points.push({
                x: lastPoint.x + dx * (i / steps),
                y: lastPoint.y + dy * (i / steps),
                life: 1.0
              });
            }
          } else {
            this.points.push({ x: e.clientX, y: e.clientY, life: 1.0 });
          }
        } else {
          this.points.push({ x: e.clientX, y: e.clientY, life: 1.0 });
        }
      });

      this.render();
    }

    resize() {
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
    }

    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.points.length; i++) {
        this.points[i].life -= 0.035;
      }

      while (this.points.length > 0 && this.points[0].life <= 0) {
        this.points.shift();
      }

      for (let i = 1; i < this.points.length; i++) {
        const p1 = this.points[i - 1];
        const p2 = this.points[i];

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);

        this.ctx.strokeStyle = `rgba(255, 68, 114, ${p2.life})`;
        this.ctx.lineWidth = 4 * p2.life;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      }

      requestAnimationFrame(() => this.render());
    }
  }

  new CanvasLineTrail();



  // Hero Dot Interaction
  const heroDot = document.getElementById('heroInteractionBtn');
  const heroSection = document.querySelector('.header');

  if (heroDot && heroSection) {
    heroDot.addEventListener('mouseenter', () => {
      const rect = heroDot.getBoundingClientRect();
      const heroRect = heroSection.getBoundingClientRect();

      const x = rect.left - heroRect.left + rect.width / 2;
      const y = rect.top - heroRect.top + rect.height / 2;

      const ripple = document.createElement('div');
      ripple.classList.add('hero-ripple');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      heroSection.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 1500);
    });
  }

  /*
    Typewriter Effect
    Extracts text and <br> nodes, clears the container, and types out characters
    sequentially. Uses IntersectionObserver to pause when off-screen and respects
    prefers-reduced-motion.
  */
  class Typewriter {
    constructor(element, speed = 90, pause = 1400) {
      this.element = element;
      this.speed = speed;
      this.pause = pause;
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.queue = [];
      Array.from(this.element.childNodes).forEach((node, index, arr) => {
        if (node.nodeType === Node.TEXT_NODE) {
          let text = node.textContent.replace(/[\r\n]+/g, '').replace(/\s{2,}/g, ' ');
          if (index === 0) text = text.trimStart();
          if (index === arr.length - 1) text = text.trimEnd();

          for (const char of text) {
            this.queue.push({ type: 'char', char });
          }
        } else if (node.nodeName === 'BR') {
          this.queue.push({ type: 'br' });
        }
      });

      this.originalHTML = this.element.innerHTML;
      this.element.innerHTML = '';

      this.container = document.createElement('span');
      this.element.appendChild(this.container);

      this.caret = document.createElement('span');
      this.caret.className = 'typewriter-caret';
      this.caret.textContent = '|';
      this.element.appendChild(this.caret);

      this.isRunning = false;
      this.currentIndex = 0;

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!this.isRunning && !this.prefersReducedMotion) {
              this.isRunning = true;
              this.typeNext();
            }
          } else {
            this.isRunning = false;
            clearTimeout(this.timeout);
          }
        });
      });

      if (this.prefersReducedMotion) {
        this.element.innerHTML = this.originalHTML;
      } else {
        this.observer.observe(this.element);
      }
    }

    typeNext() {
      if (!this.isRunning) return;

      if (this.currentIndex < this.queue.length) {
        const item = this.queue[this.currentIndex];
        if (item.type === 'char') {
          this.container.appendChild(document.createTextNode(item.char));
        } else if (item.type === 'br') {
          this.container.appendChild(document.createElement('br'));
        }
        this.currentIndex++;
        this.timeout = setTimeout(() => this.typeNext(), this.speed);
      } else {
        this.timeout = setTimeout(() => {
          if (this.isRunning) {
            this.container.innerHTML = '';
            this.currentIndex = 0;
            this.typeNext();
          }
        }, this.pause);
      }
    }
  }

  document.querySelectorAll('.problem-text').forEach(el => {
    new Typewriter(el, 10, 2000);
  });


  /*
    Spotlight Effect
    A circular cut-out follows the cursor, revealing what's behind a dark scrim.
  */
  class Spotlight {
    constructor(element) {
      this.element = element;
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.prefersReducedMotion) return;

      this.mouseX = element.offsetWidth / 2;
      this.mouseY = element.offsetHeight / 2;
      this.currentX = this.mouseX;
      this.currentY = this.mouseY;
      this.isVisible = false;
      this.isHovering = false;
      this.ease = 0.15;

      this.element.addEventListener('mousemove', (e) => {
        const rect = this.element.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
      });

      this.element.addEventListener('mouseenter', () => {
        this.isHovering = true;
      });

      this.element.addEventListener('mouseleave', () => {
        this.isHovering = false;
        // Gently return to center when mouse leaves
        this.mouseX = this.element.offsetWidth / 2;
        this.mouseY = this.element.offsetHeight / 2;
      });

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
          if (this.isVisible) this.render();
        });
      });
      this.observer.observe(this.element);
    }

    render() {
      if (!this.isVisible) return;

      this.currentX += (this.mouseX - this.currentX) * this.ease;
      this.currentY += (this.mouseY - this.currentY) * this.ease;

      this.element.style.setProperty('--x', `${this.currentX}px`);
      this.element.style.setProperty('--y', `${this.currentY}px`);

      requestAnimationFrame(() => this.render());
    }
  }

  const valuesContainer = document.querySelector('.values-container');
  if (valuesContainer) {
    new Spotlight(valuesContainer);
  }

  /*
    Ripple Button Effect
    A material-style click ripple — circular wave from the press point.
  */
  class RippleButton {
    constructor(element, duration = 700) {
      this.element = element;
      this.duration = duration;
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Ensure button has relative positioning and overflow hidden
      if (getComputedStyle(this.element).position === 'static') {
        this.element.style.position = 'relative';
      }
      this.element.style.overflow = 'hidden';

      this.element.addEventListener('click', (e) => {
        if (this.prefersReducedMotion) return;
        this.createRipple(e);
      });
    }

    createRipple(e) {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple');

      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      ripple.style.animationDuration = `${this.duration}ms`;

      this.element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, this.duration);
    }
  }

  document.querySelectorAll('.btn-primary').forEach(btn => {
    new RippleButton(btn, 700);
  });

  /*
    Ripple / Distortion on Hover
    The cursor leaves a wake of expanding wavefronts — water under your fingertip.
    Uses HTML5 Canvas for performance.
  */
  class RippleWake {
    constructor(tracker, container) {
      this.tracker = tracker;
      this.container = container;
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.prefersReducedMotion) return;

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ripple-wake-canvas';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      this.params = {
        speed: 0.55,
        freq: 32,
        amp: 0.05,
        life: 2.8
      };

      this.drops = [];
      this.resize();

      window.addEventListener('resize', () => this.resize());
      this.tracker.addEventListener('mousemove', (e) => this.addDrop(e));

      this.lastTime = performance.now();
      this.render(this.lastTime);
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    addDrop(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.drops.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        age: 0
      });
    }

    render(time) {
      const dt = (time - this.lastTime) / 1000; // Delta time in seconds
      this.lastTime = time;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.drops.length - 1; i >= 0; i--) {
        const drop = this.drops[i];
        drop.age += dt * this.params.speed;

        if (drop.age > this.params.life) {
          this.drops.splice(i, 1);
          continue;
        }

        // Draw expanding ring
        const currentRadius = drop.age * this.params.freq * 10;

        // Decay amplitude over life
        const alpha = Math.max(0, 1 - (drop.age / this.params.life));

        this.ctx.beginPath();
        this.ctx.arc(drop.x, drop.y, currentRadius, 0, Math.PI * 2);

        // Thickness expands slightly
        this.ctx.lineWidth = 1 + currentRadius * 0.02;

        // Color with amplitude and alpha
        this.ctx.strokeStyle = `rgba(255, 68, 114, ${this.params.amp * alpha})`; // #ff4472
        this.ctx.stroke();
      }

      requestAnimationFrame((t) => this.render(t));
    }
  }

  const header = document.querySelector('.header');
  const heroBg = document.querySelector('.hero-bg');
  if (header && heroBg) {
    new RippleWake(header, heroBg);
  }

  const teamHeader = document.querySelector('.team-hero');
  const teamHeroBg = document.querySelector('.team-hero-bg');
  if (teamHeader && teamHeroBg) {
    new RippleWake(teamHeader, teamHeroBg);
  }

  const prodHeader = document.querySelector('.prod-hero');
  const prodHeroBg = document.querySelector('.prod-hero-bg');
  if (prodHeader && prodHeroBg) {
    new RippleWake(prodHeader, prodHeroBg);
  }

  // Apple Style Scroll Interaction for Problem Section
  const appleScrollSection = document.querySelector('.apple-scroll-section');
  const appleScrollContent = document.querySelector('.apple-scroll-content');

  if (appleScrollSection && appleScrollContent) {
    window.addEventListener('scroll', () => {
      const rect = appleScrollSection.getBoundingClientRect();
      const scrollEnd = rect.height - window.innerHeight;

      let progress = -rect.top / scrollEnd;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      let opacity = 0;
      let scale = 0.95;

      if (progress < 0.3) {
        const p = progress / 0.3;
        const ease = 1 - Math.pow(1 - p, 3);
        opacity = ease;
        scale = 0.95 + (0.05 * ease);
      } else if (progress < 0.7) {
        opacity = 1;
        scale = 1;
      } else {
        const p = (progress - 0.7) / 0.3;
        const ease = p * p;
        opacity = 1 - ease;
        scale = 1 + (0.05 * ease);
      }

      appleScrollContent.style.opacity = opacity;
      appleScrollContent.style.transform = `scale(${scale})`;
    });
  }
});
