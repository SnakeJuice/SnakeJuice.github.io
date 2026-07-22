/**
 * Main UI Logic & Smooth Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Smooth Navbar Scroll & Active State Update
  const header = document.querySelector('.header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.background = 'rgba(7, 9, 14, 0.88)';
      header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)';
    } else {
      header.style.background = 'rgba(7, 9, 14, 0.65)';
      header.style.boxShadow = 'none';
    }
  }, { passive: true });

  // 2. Intersection Observer for Scroll Animations
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Apply initial fade-in styles to project & skill cards
  const animatedElements = document.querySelectorAll('.project-card, .skill-card, .section-header');
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
});
