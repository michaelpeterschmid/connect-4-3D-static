// pwabuilder-sw.js
const CACHE = "pwabuilder-offline-v7";
const OFFLINE_FALLBACK_PAGE = "offline.html";
const PRECACHE_URLS = ["index.html","offline.html","script.js","style.css","manifest.json","cube_red.png","cube_green.png","icons/icon-192.png","icons/icon-512.png"];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(PRECACHE_URLS.map(u => new Request(u, {cache:'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('index.html');
      if (cached) {
        // Update in background
        e.waitUntil(fetch('index.html').then(r => { if (r.ok) cache.put('index.html', r.clone()); }).catch(() => {}));
        return cached;
      }
      try {
        const net = await fetch(req);
        cache.put('index.html', net.clone());
        return net;
      } catch (err) {
        const off = await cache.match(OFFLINE_FALLBACK_PAGE);
        if (off) return off;
        throw err;
      }
    })());
    return;
  }

  if (['script','style','image','font'].includes(req.destination) || /\.(css|js|png|jpg|jpeg|gif|webp|svg|json|ico)$/i.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const resp = await fetch(req);
        if (resp && resp.ok && (resp.type === 'basic' || resp.type === 'cors')) cache.put(req, resp.clone());
        return resp;
      } catch (err) {
        return hit || Response.error();
      }
    })());
  }
});
