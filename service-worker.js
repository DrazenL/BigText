// service-worker.js

const CACHE_NAME = new URL(self.location).searchParams.get('v') || 'my-pwa-cache-default';

const urlsToCache = [
  './',
  './index.html',
  './icon-128x128.png',
  './icon-512x512.png',
  './manifest.webmanifest',
  './custom.js',
  './favicon.ico'
];

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating with cache version:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== 'my-pwa-cache-default') {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // self.clients.claim(); // Uklanjamo ovo ako koristimo SKIP_WAITING na poruku
});

self.addEventListener('install', event => {
  console.log('Service Worker: Installing with cache version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Cache addAll failed:', error);
      })
  );
});

// Dodan listener za poruke
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting(); // Ova linija prisiljava novog SW-a da se odmah aktivira
        console.log('Service Worker: SKIP_WAITING received, activating immediately.');
    }
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        // Važno: Ako resurs nije u kešu, pokušaj ga dohvatit s mreže
        return fetch(event.request).then(
            networkResponse => {
                // I dodaj ga u keš za buduće korištenje
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                return networkResponse;
            }
        );
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed or item not in cache:', error);
        // Opcionalno: Možeš vratiti neku offline fallback stranicu za određene zahtjeve
        // return caches.match('/offline.html');
      })
  );
});
// service-worker.js

// ... sav tvoj postojeći kod ...

// Force update: v1.0.21