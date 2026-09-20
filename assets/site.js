/*
  Set this to Athevia's public App Store URL once Apple creates the live listing.
  Example: https://apps.apple.com/app/athevia/id1234567890
  Until then the site intentionally shows "App Store release coming soon".
*/
const APP_STORE_URL = "";

const downloadLinks = document.querySelectorAll('.js-download-link');
const storeNotes = document.querySelectorAll('.js-store-note');

if (APP_STORE_URL) {
  downloadLinks.forEach(link => {
    link.href = APP_STORE_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  storeNotes.forEach(note => note.textContent = 'Available on the App Store.');
} else {
  downloadLinks.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
  }));
}

document.querySelector('#year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
