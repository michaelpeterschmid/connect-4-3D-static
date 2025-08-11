// Registers the PWABuilder service worker and shows update/offline toasts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('pwabuilder-sw.js', { scope: './' }).catch(console.error);
  });
}
try {
  import('https://cdn.jsdelivr.net/npm/@pwabuilder/pwaupdate')
    .then(() => {
      const el = document.createElement('pwa-update');
      el.swpath = 'pwabuilder-sw.js';
      document.body.appendChild(el);
    })
    .catch(() => {});
} catch(e) {}
