const CACHE_NAME = 'pwa-cache-v1';
const FILES_TO_CACHE = [
  '/',                // index.html
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/script.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // alle weiteren Assets: Bilder, Sounds, ...
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request)
      .then(cached => cached || fetch(evt.request))
  );
});
