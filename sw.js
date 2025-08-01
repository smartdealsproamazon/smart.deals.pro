const CACHE_NAME = 'smartdeals-v4-new-logo-favicon-update';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/products.js',
  '/render.js',
  '/data-sync.js',
  '/logo.svg',
  '/logo.png',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/site.webmanifest',
  // Add key pages
  '/products.html',
  '/deals.html',
  '/about.html',
  '/contact.html'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  // Skip waiting to immediately activate new service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache with new favicon files');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Activate event - cleanup old caches and take control immediately
self.addEventListener('activate', function(event) {
  // Take control of all clients immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache to refresh favicon:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});