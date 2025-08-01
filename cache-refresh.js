// Force Cache Refresh for Favicon Update
// This script helps clear old cached favicons and forces PWA to use new icons

async function clearFaviconCache() {
  if ('serviceWorker' in navigator) {
    try {
      // Get all cache names
      const cacheNames = await caches.keys();
      
      // Delete all old caches
      const deletePromises = cacheNames.map(cacheName => {
        if (cacheName.includes('smartdeals-v2') || cacheName.includes('smartdeals-v1') || cacheName.includes('smartdeals-v3')) {
          console.log('Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        }
      });
      
      await Promise.all(deletePromises);
      
      // Unregister old service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
      
      // Register new service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await registration.update();
      
      console.log('Cache cleared and service worker updated for favicon refresh');
      
      // Force reload to apply changes
      window.location.reload(true);
      
    } catch (error) {
      console.error('Error clearing favicon cache:', error);
    }
  }
}

// Auto-run cache refresh if needed
if (localStorage.getItem('favicon-cache-cleared') !== 'v4-new-logo-favicon-update') {
  clearFaviconCache().then(() => {
    localStorage.setItem('favicon-cache-cleared', 'v4-new-logo-favicon-update');
  });
}

// Export for manual use
window.clearFaviconCache = clearFaviconCache;