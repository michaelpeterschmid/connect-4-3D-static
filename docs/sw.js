// sw.js (replace your file)
const CACHE_NAME = 'pwa-cache-v2';
const APP_SHELL = [
  './',               // resolves to docs/index.html
  './index.html',
  './manifest.json',
  './style.css',
  './script.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './offline.html',
];


self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Use Request(..., {cache: 'reload'}) so we don’t cache a redirected/old entry
    await cache.addAll(APP_SHELL.map(u => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first for navigations (HTML), with offline fallback.
// Cache-first for same-origin static assets.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  // 1) HTML navigations
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Try preload (if enabled by the browser), then network, then cache, then offline page
        const preload = await event.preloadResponse;
        if (preload) return preload;

        const network = await fetch(req);
        // Optionally update cache with fresh HTML
        const cache = await caches.open(CACHE_NAME);
        cache.put('/', network.clone()).catch(() => {});
        return network;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        // Serve last known index or the offline page
        return (await cache.match('./')) ||
               (await cache.match('./index.html')) ||
               (await cache.match('./offline.html'));
      }
    })());
    return;
  }

  // 2) Static assets (same-origin)
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (/\.(?:css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
      event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached; // cache-first
        try {
          const network = await fetch(req);
          cache.put(req, network.clone()).catch(() => {});
          return network;
        } catch {
          // As a tiny bonus, fall back to icon if an image is missing
          if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
            const fallbackIcon = await cache.match('/icons/icon-192.png');
            if (fallbackIcon) return fallbackIcon;
          }
          throw;
        }
      })());
      return;
    }
  }

  // 3) Everything else: try cache, then network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
