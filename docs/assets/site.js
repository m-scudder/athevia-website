// Set the verified public listing URL here when Athevia is available.
const APP_STORE_URL = "";

if (APP_STORE_URL) {
  document.querySelectorAll('.js-download-link').forEach(link => {
    link.href = APP_STORE_URL;
    link.textContent = link.dataset.liveLabel || 'Download on the App Store';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  document.querySelectorAll('.js-store-note').forEach(note => {
    note.textContent = 'Available on the App Store.';
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#primary-navigation');
if (menuButton && navigation) {
  const closeMenu = () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  };
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) {
      closeMenu();
      menuButton.focus();
    }
  });
}


// Automatic carousel with manual selection and interaction-aware pausing.
const carousel = document.querySelector('.app-carousel');
if (carousel) {
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('[data-carousel-index]')];
  const status = carousel.querySelector('[data-carousel-status]');
  const playback = carousel.querySelector('[data-carousel-playback]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, timer = null, paused = motion.matches;
  let hovered = false, focused = false, touching = false, visible = true;
  let touchStart = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = null;
    if (paused || hovered || focused || touching || !visible || document.hidden || slides.length < 2) return;
    timer = setTimeout(() => showSlide(current + 1, false), 5000);
  };
  const showSlide = (index, announce = true) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    // Automatic changes stay silent for screen readers.
    status.textContent = announce ? slides[current].getAttribute('aria-label') : '';
    schedule();
  };
  const updatePlayback = () => {
    playback.textContent = paused ? 'Play' : 'Pause';
    playback.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    schedule();
  };
  carousel.querySelector('.carousel-controls').hidden = false;
  playback.addEventListener('click', () => {
    paused = !paused;
    if (!paused) { hovered = false; focused = false; }
    updatePlayback();
  });
  dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
  carousel.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    showSlide(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  carousel.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { hovered = true; schedule(); }
  });
  carousel.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') { hovered = false; schedule(); }
  });
  carousel.addEventListener('focusin', () => { focused = true; schedule(); });
  carousel.addEventListener('focusout', event => {
    if (!carousel.contains(event.relatedTarget)) { focused = false; schedule(); }
  });
  carousel.addEventListener('touchstart', event => {
    touching = true; schedule();
    touchStart = event.touches.length === 1 && event.target.closest('.screenshot-crop')
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  carousel.addEventListener('touchend', event => {
    if (touchStart && event.changedTouches.length) {
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(current + (dx < 0 ? 1 : -1));
    }
    touchStart = null; touching = event.touches.length > 0; schedule();
  }, { passive: true });
  carousel.addEventListener('touchcancel', () => { touchStart = null; touching = false; schedule(); }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', event => {
    if (event.matches) { paused = true; updatePlayback(); }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; schedule();
    }, { threshold: 0 }).observe(carousel);
  }
  updatePlayback();
}
