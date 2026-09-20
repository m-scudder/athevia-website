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
