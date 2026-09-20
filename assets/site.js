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


// Manual carousel: no autoplay, with keyboard, touch and button navigation.
const carousel = document.querySelector('.app-carousel');
if (carousel) {
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('[data-carousel-index]')];
  const controls = carousel.querySelector('.carousel-controls');
  const status = carousel.querySelector('[data-carousel-status]');
  let current = 0;
  const showSlide = index => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => { dot.setAttribute('aria-current', String(i === current)); });
    status.textContent = slides[current].getAttribute('aria-label');
  };
  controls.hidden = false;
  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => showSlide(current - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => showSlide(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
  carousel.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') showSlide(0);
    else if (event.key === 'End') showSlide(slides.length - 1);
    else showSlide(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let touchStart = null;
  carousel.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || !event.target.closest('.screenshot-crop')) { touchStart = null; return; }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  carousel.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  carousel.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
}
