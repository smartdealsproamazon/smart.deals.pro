// Cache Refresh Script for SmartDeals Pro
// Handles cache management and refresh functionality

(function() {
  'use strict';
  
  console.log('Cache refresh script loaded');
  
  // Function to clear specific cache items
  function clearCache(type = 'all') {
    try {
      switch(type) {
        case 'products':
          localStorage.removeItem('products');
          localStorage.removeItem('allProducts');
          localStorage.removeItem('products_updated');
          console.log('Products cache cleared');
          break;
        case 'user':
          localStorage.removeItem('user');
          localStorage.removeItem('userProfile');
          console.log('User cache cleared');
          break;
        case 'all':
        default:
          // Clear all SmartDeals related cache
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('product') || key.includes('user') || key.includes('smart')) {
              localStorage.removeItem(key);
            }
          });
          console.log('All cache cleared');
          break;
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  
  // Function to refresh cache with version check
  function refreshCache() {
    const currentVersion = '1.0.0'; // Update this when making changes
    const cachedVersion = localStorage.getItem('cache_version');
    
    if (cachedVersion !== currentVersion) {
      console.log('Cache version mismatch, clearing cache');
      clearCache('all');
      localStorage.setItem('cache_version', currentVersion);
    }
  }
  
  // Auto-refresh on load
  refreshCache();
  
  // Make functions globally available
  window.clearCache = clearCache;
  window.refreshCache = refreshCache;
  
  // Add cache management UI if needed
  if (window.location.search.includes('debug=true')) {
    const cacheControls = document.createElement('div');
    cacheControls.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 12px;">
        <strong>Cache Controls</strong><br>
        <button onclick="clearCache('products')">Clear Products</button>
        <button onclick="clearCache('user')">Clear User</button>
        <button onclick="clearCache('all')">Clear All</button>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
    document.body.appendChild(cacheControls);
  }
})();