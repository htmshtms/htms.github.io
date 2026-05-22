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
});
