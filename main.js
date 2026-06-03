document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for anchor links with offset for fixed header
  const headerHeight = 64; // Height of the fixed header
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: targetPosition - headerHeight,
          behavior: 'smooth'
        });
      }
    });
  });

  // Intersection Observer for scroll animations (fade-up effect)
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Stop observing once visible
      }
    });
  }, observerOptions);

  // Observe all elements with .fade-up class
  document.querySelectorAll('.fade-up').forEach(element => {
    observer.observe(element);
  });

  // Optional parallax effect on hero background
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      heroBg.style.transform = `translateY(${scrollPos * 0.4}px)`;
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

  document.querySelectorAll('.value-text').forEach(el => {
    new Typewriter(el, 50, 2000);
  });
});
