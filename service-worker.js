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
    }).then(() => {
      return self.clients.claim();
    })
  );
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
        self.skipWaiting(); // Prisiljava novog SW-a da se odmah aktivira
        console.log('Service Worker: SKIP_WAITING received, activating immediately.');

        // Opcionalno, ali preporučeno: Pošalji poruku klijentu da se sam osvježi
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then(clientList => {
                for (const client of clientList) {
                    // Provjeri da je to trenutni klijent (aplikacija) i pošalji mu poruku
                    if (client.url === self.location.origin + '/' && 'focus' in client) { // Prilagodite client.url ako je potrebno za poddirektorij
                        client.postMessage({ type: 'RELOAD_PAGE' });
                        break;
                    }
                }
            })
        );
    }
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
            networkResponse => {
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
      })
  );
});
