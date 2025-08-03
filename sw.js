/**
 * SmartDeals Pro Service Worker - Mobile Performance Optimized
 * Version 2.1 - Enhanced caching for mobile performance
 */

const CACHE_NAME = 'smartdeals-pro-v2.1-mobile-optimized';
const STATIC_CACHE = 'smartdeals-static-v2.1';
const DYNAMIC_CACHE = 'smartdeals-dynamic-v2.1';
const IMAGE_CACHE = 'smartdeals-images-v2.1';

// Critical resources to cache immediately (above-the-fold)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/mobile-performance-optimizer.js',
  '/logo.svg',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Static assets with long cache lifetime
const STATIC_ASSETS = [
  '/products.html',
  '/deals.html',
  '/about.html',
  '/contact.html',
  '/cache-refresh.js',
  '/data-sync.js',
  '/products.js',
  '/render.js',
  '/performance-optimizer.js'
];

// Image assets for optimized caching
const IMAGE_ASSETS = [
  '/logo.png',
  '/logo.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/icon-144x144.png',
  '/icon-168x168.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker for mobile optimization...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources first (highest priority)
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching critical assets...');
        return cache.addAll(CRITICAL_ASSETS.map(url => new Request(url, {
          cache: 'reload' // Force fresh fetch for critical assets
        })));
      }),
      
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache images with compression hints
      caches.open(IMAGE_CACHE).then(cache => {
        console.log('[SW] Caching image assets...');
        return cache.addAll(IMAGE_ASSETS);
      })
    ]).then(() => {
      console.log('[SW] Mobile-optimized service worker installed successfully');
      return self.skipWaiting(); // Force activation
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating mobile-optimized service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Mobile-optimized service worker activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - implement performance-first caching strategy
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (except fonts and CDN resources)
  if (url.origin !== location.origin && 
      !url.hostname.includes('googleapis.com') &&
      !url.hostname.includes('gstatic.com') &&
      !url.hostname.includes('cdnjs.cloudflare.com')) {
    return;
  }
  
  // Handle different types of requests with optimized strategies
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isCriticalAsset(request)) {
    event.respondWith(handleCriticalAsset(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isFontRequest(request)) {
    event.respondWith(handleFontRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle image requests with WebP optimization
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful image responses
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Image fetch failed:', error);
    // Return a placeholder or offline image if available
    return caches.match('/offline-placeholder.svg') || new Response('', { status: 404 });
  }
}

// Handle critical assets with cache-first strategy
async function handleCriticalAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve from cache immediately for better performance
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Critical asset fetch failed:', error);
    return new Response('', { status: 503 });
  }
}

// Handle static assets with stale-while-revalidate
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {}); // Silently fail background updates
    
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', error);
    return new Response('', { status: 503 });
  }
}

// Handle font requests with long-term caching
async function handleFontRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache fonts for a long time
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Font fetch failed:', error);
    return new Response('', { status: 404 });
  }
}

// Handle dynamic requests with network-first
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Dynamic request fetch failed, trying cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('', { status: 503 });
  }
}

// Utility functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

function isCriticalAsset(request) {
  const url = new URL(request.url);
  return CRITICAL_ASSETS.some(asset => url.pathname === asset || url.href === asset);
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         /\.(css|js|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

function isFontRequest(request) {
  return request.destination === 'font' ||
         /\.(woff|woff2|ttf|eot|otf)$/i.test(new URL(request.url).pathname) ||
         new URL(request.url).hostname.includes('fonts.g');
}

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'OPTIMIZATION_UPDATE') {
    console.log('[SW] Received optimization update:', event.data);
    
    // Implement additional optimization strategies based on message
    if (event.data.cacheStrategy === 'performance-first') {
      // Preload critical resources
      preloadCriticalResources();
    }
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Preload critical resources for better mobile performance
async function preloadCriticalResources() {
  const cache = await caches.open(CACHE_NAME);
  
  // Preload most important pages
  const criticalPages = ['/products.html', '/deals.html'];
  
  for (const page of criticalPages) {
    try {
      const response = await fetch(page);
      if (response.ok) {
        await cache.put(page, response);
      }
    } catch (error) {
      console.log('[SW] Preload failed for:', page);
    }
  }
}

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync for data updates
  console.log('[SW] Performing background sync for mobile optimization');
}

// Push notifications (if needed for mobile engagement)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New deals available!',
      icon: '/icon-192x192.png',
      badge: '/icon-144x144.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Deals',
          icon: '/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'SmartDeals Pro', options)
    );
  }
});

console.log('[SW] Mobile-optimized service worker loaded successfully');
