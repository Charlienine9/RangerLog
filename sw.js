// RangerLog Service Worker — v1.4
const CACHE_NAME = 'rangerlog-v1.4';

// Core files cached on install
const CORE = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Pass through: external requests (CDN, Google Sheets, etc.)
  if (!url.startsWith(self.location.origin)) return;

  // Pass through: GeoJSON — always fetch fresh so map updates aren't stale
  if (url.includes('export.geojson')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response.ok && event.request.method === 'GET') {
              caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for navigation requests
            if (event.request.mode === 'navigate') return caches.match('/index.html');
          });
      })
  );
});
