const CACHE_NAME = 'strain-engineering-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './Projects.html',
  './Engineering%20Services.html',
  './Training%20Courses.html',
  './Farming%20Services.html',
  './Refreshco%20Water%20And%20Beverages.html',
  './About.html',
  './css/site.css',
  './js/site.js',
  './images/strain-engineering-logo.svg',
  './images/logo.jpg',
  './images/bck1.jpg',
  './images/bck3.jpeg'
];

// Install event - precache critical shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache item failed to load:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first for static assets, network-first for HTML
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only cache GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // For HTML navigations: Network-first with cache fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // For static assets (CSS, JS, images, fonts): Cache-first with network fallback & background update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      });
    })
  );
});
