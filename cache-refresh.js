// Enhanced cache refresh mechanism for favicon updates
// Automatically clears old cache and forces reload of new favicon assets

async function clearFaviconCache() {
  try {
    if ('caches' in window) {
      // Get all cache names
      const cacheNames = await caches.keys();
      
      // Delete all old caches
      const deletePromises = cacheNames.map(cacheName => {
        if (cacheName.includes('smartdeals-v2') || cacheName.includes('smartdeals-v1') || cacheName.includes('smartdeals-v3') || cacheName.includes('smartdeals-v4')) {
          console.log('Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        }
      });
      
      await Promise.all(deletePromises);
      console.log('Old caches cleared successfully');
    }
    
    // Clear favicon-related assets from browser cache
    const faviconUrls = [
      '/favicon.ico',
      '/favicon-16x16.png', 
      '/favicon-32x32.png',
      '/favicon-192x192.png',
      '/favicon-512x512.png',
      '/logo.svg',
      '/site.webmanifest'
    ];
    
    // Force reload favicon assets
    faviconUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url + '?v=' + Date.now();
      document.head.appendChild(link);
      setTimeout(() => document.head.removeChild(link), 1000);
    });
    
    console.log('Favicon cache refresh completed');
  } catch (error) {
    console.error('Cache refresh failed:', error);
  }
}

// Auto-run cache refresh if needed
if (localStorage.getItem('favicon-cache-cleared') !== 'v5-fixed-favicon-regenerated') {
  clearFaviconCache().then(() => {
    localStorage.setItem('favicon-cache-cleared', 'v5-fixed-favicon-regenerated');
  });
}

// Export for manual use if needed
window.clearFaviconCache = clearFaviconCache;