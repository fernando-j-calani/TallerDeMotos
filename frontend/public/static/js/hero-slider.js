document.addEventListener('DOMContentLoaded', function () {
  const slides = document.querySelectorAll('.hero-slider .slide');
  const indicators = document.querySelectorAll('.slider-indicators .indicator');
  let current = 0;
  let timer = null;
  const delay = 5000;

  function goTo(index) {
    slides.forEach((s, i) => {
      const activeNow = i === index;
      s.classList.toggle('active', activeNow);
      s.classList.toggle('animate', false);
      s.setAttribute('aria-hidden', activeNow ? 'false' : 'true');
    });
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));
    // trigger text animation slightly after activation for smoother effect
    const active = slides[index];
    setTimeout(() => active && active.classList.add('animate'), 80);
    current = index;
  }

  function next() {
    let nxt = (current + 1) % slides.length;
    goTo(nxt);
  }

  indicators.forEach(ind => {
    ind.addEventListener('click', () => {
      const idx = parseInt(ind.dataset.index, 10);
      goTo(idx);
      resetTimer();
    });
  });

  function startTimer() {
    timer = setInterval(next, delay);
  }
  function resetTimer() {
    if (timer) clearInterval(timer);
    startTimer();
  }

  // Pause on hover to let users read content
  const sliderEl = document.querySelector('.hero-slider');
  if (sliderEl) {
    sliderEl.addEventListener('mouseenter', () => { if (timer) clearInterval(timer); });
    sliderEl.addEventListener('mouseleave', () => { resetTimer(); });
  }

  // Initialize
  goTo(0);
  startTimer();
  
  // Parallax effect on scroll for hero slider background
  const slider = document.querySelector('.hero-slider');
  if (slider) {
    window.addEventListener('scroll', () => {
      const rect = slider.getBoundingClientRect();
      slides.forEach(s => {
        // smoother parallax: clamp amount and scale with viewport
        const speed = 0.02; // subtle effect
        const maxShift = 12; // percent max shift
        const y = Math.max(-window.innerHeight, Math.min(window.innerHeight, rect.top));
        const shift = (y * speed) / (window.innerHeight / 100); // percent units
        const clamped = Math.max(-maxShift, Math.min(maxShift, shift));
        s.style.backgroundPosition = `center ${50 + clamped}%`;
      });
    }, { passive: true });
  }
});
