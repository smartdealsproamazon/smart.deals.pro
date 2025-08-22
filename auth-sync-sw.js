// SmartDeals Pro Authentication Sync Service Worker
// Handles cross-device authentication synchronization

const CACHE_NAME = 'smartdeals-auth-v1';
const AUTH_CACHE_NAME = 'smartdeals-auth-data';

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('Auth Sync Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/sign-in.html',
        '/user-auth.js'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Auth Sync Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUTH_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - handle authentication data sync
self.addEventListener('fetch', (event) => {
  // Handle authentication data requests
  if (event.request.url.includes('auth-sync')) {
    event.respondWith(handleAuthSync(event.request));
  } else {
    // Handle regular requests
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Handle authentication synchronization
async function handleAuthSync(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'get-session':
        return await getSessionData();
      case 'set-session':
        const sessionData = await request.json();
        return await setSessionData(sessionData);
      case 'clear-session':
        return await clearSessionData();
      case 'sync-devices':
        return await syncDevices();
      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Auth sync error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Get session data from cache
async function getSessionData() {
  try {
    const cache = await caches.open(AUTH_CACHE_NAME);
    const response = await cache.match('session-data');
    
    if (response) {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting session data:', error);
    return new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Set session data in cache
async function setSessionData(sessionData) {
  try {
    const cache = await caches.open(AUTH_CACHE_NAME);
    const response = new Response(JSON.stringify(sessionData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put('session-data', response);
    
    // Broadcast to other tabs/windows
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'AUTH_SYNC',
          action: 'session-updated',
          data: sessionData
        });
      });
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error setting session data:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Clear session data from cache
async function clearSessionData() {
  try {
    const cache = await caches.open(AUTH_CACHE_NAME);
    await cache.delete('session-data');
    
    // Broadcast to other tabs/windows
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'AUTH_SYNC',
          action: 'session-cleared'
        });
      });
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error clearing session data:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Sync devices
async function syncDevices() {
  try {
    const cache = await caches.open(AUTH_CACHE_NAME);
    const response = await cache.match('session-data');
    
    if (response) {
      const sessionData = await response.json();
      
      // Broadcast to all clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'AUTH_SYNC',
            action: 'sync-request',
            data: sessionData
          });
        });
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing devices:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'AUTH_SYNC') {
    switch (event.data.action) {
      case 'register-client':
        console.log('Client registered for auth sync');
        break;
      case 'session-update':
        setSessionData(event.data.data);
        break;
      case 'session-clear':
        clearSessionData();
        break;
    }
  }
});

console.log('Auth Sync Service Worker loaded');