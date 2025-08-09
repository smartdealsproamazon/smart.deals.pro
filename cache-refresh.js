// Enhanced cache refresh mechanism for favicon and logo updates
// Automatically clears old cache and forces reload of new favicon and logo assets

async function clearFaviconCache() {
  try {
    if ('caches' in window) {
      // Get all cache names
      const cacheNames = await caches.keys();
      
      // Delete all old caches including the v5 cache with corrupted favicons
      const deletePromises = cacheNames.map(cacheName => {
        if (cacheName.includes('smartdeals-v2') || 
            cacheName.includes('smartdeals-v1') || 
            cacheName.includes('smartdeals-v3') || 
            cacheName.includes('smartdeals-v4') ||
            cacheName.includes('smartdeals-v5')) {
          console.log('Clearing old cache with corrupted favicons:', cacheName);
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
      '/logo.png',
      '/logo-social.png',
      '/site.webmanifest'
    ];
    
    // Force reload favicon assets with cache busting
    const timestamp = Date.now();
    faviconUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url + '?v=' + timestamp;
      document.head.appendChild(link);
      setTimeout(() => document.head.removeChild(link), 1000);
    });
    
    // Force refresh of existing favicon links in the document
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => {
      const href = link.href;
      if (href.includes('favicon') || href.includes('logo.svg')) {
        // Remove cache busting parameter if it exists
        const cleanHref = href.split('?')[0];
        // Add new cache busting parameter
        link.href = cleanHref + '?v=' + timestamp;
      }
    });
    
    // Force refresh of main logo images in the document
    const logoImages = document.querySelectorAll('img[src*="logo"]');
    logoImages.forEach(img => {
      const src = img.src;
      if (src.includes('logo.svg') || src.includes('logo.png') || src.includes('logo-social.png')) {
        // Remove cache busting parameter if it exists
        const cleanSrc = src.split('?')[0];
        // Add new cache busting parameter
        img.src = cleanSrc + '?v=' + timestamp;
      }
    });
    
    console.log('Logo and favicon cache refresh completed with proper files');
  } catch (error) {
    console.error('Cache refresh failed:', error);
  }
}

// Auto-run cache refresh if needed
if (localStorage.getItem('favicon-cache-cleared') !== 'v7-logo-cache-fix') {
  clearFaviconCache().then(() => {
    localStorage.setItem('favicon-cache-cleared', 'v7-logo-cache-fix');
    console.log('Logo and favicon cache cleared - new logo files loaded');
  });
}

// Function to refresh logo on page load if needed
function refreshLogo() {
  const timestamp = Date.now();
  const logoImages = document.querySelectorAll('img[src*="logo"]');
  logoImages.forEach(img => {
    const src = img.src;
    if (src.includes('logo.svg') || src.includes('logo.png') || src.includes('logo-social.png')) {
      // Only add cache buster if not already present
      if (!src.includes('?v=')) {
        img.src = src + '?v=' + timestamp;
      }
    }
  });
}

// Refresh logo when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshLogo);
} else {
  refreshLogo();
}

// Export for manual use if needed
window.clearFaviconCache = clearFaviconCache;
window.refreshLogo = refreshLogo;