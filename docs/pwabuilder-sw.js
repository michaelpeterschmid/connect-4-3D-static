// pwabuilder-sw.js
// PWABuilder-style service worker with offline fallback + app shell precache.
const CACHE = "pwabuilder-offline-v1";
const OFFLINE_FALLBACK_PAGE = "offline.html";
const PRECACHE_URLS = [
  "index.html",
  "connect4.gif",
  "cube_green.png",
  "cube_green_preview.png",
  "cube_red.png",
  "cube_red_preview.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "manifest.json",
  "offline.html",
  "online_game.png",
  "privacy_policy.html",
  "pwabuilder-sw-register.js",
  "real_game.png",
  "script.js",
  "style.css",
  "sw.js"
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE_URLS.map(u => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('index.html', fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE);
        const cached = await cache.match('index.html');
        if (cached) return cached;
        const offline = await cache.match(OFFLINE_FALLBACK_PAGE);
        if (offline) return offline;
        throw err;
      }
    })());
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(req.destination) || /\.(css|js|png|jpg|jpeg|gif|webp|svg|json|ico)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const resp = await fetch(req);
      if (resp && resp.ok && (resp.type === 'basic' || resp.type === 'cors')) {
        cache.put(req, resp.clone());
      }
      return resp;
    })());
    return;
  }
});
