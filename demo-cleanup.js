// Demo Product Cleanup Script
// This script removes all demo/sample products from localStorage and prevents them from showing

(function() {
  'use strict';
  
  console.log('🔄 Starting demo product cleanup...');
  
  // Function to identify demo products
  function isDemoProduct(product) {
    if (!product) return true;
    
    // Check various demo indicators
    const demoIndicators = [
      'Demo', 'Example', 'Sample', 'Test', 'Temporary'
    ];
    
    const demoIdPatterns = [
      'prod_sample_', 'demo_', 'sample_', 'test_'
    ];
    
    // Check name/title for demo indicators
    const name = (product.name || product.title || '').toLowerCase();
    const hasDemoName = demoIndicators.some(indicator => 
      name.includes(indicator.toLowerCase())
    );
    
    // Check ID for demo patterns
    const id = (product.id || '').toString();
    const hasDemoId = demoIdPatterns.some(pattern => 
      id.includes(pattern)
    );
    
    // Check for placeholder links
    const hasPlaceholderLink = !product.link || 
                              product.link === '#' || 
                              product.link === '' ||
                              product.link.includes('placeholder');
    
    return hasDemoName || hasDemoId || hasPlaceholderLink;
  }
  
  // Clean up products from localStorage
  function cleanupLocalStorage() {
    try {
      // Clean up 'products' key
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const filteredProducts = products.filter(product => !isDemoProduct(product));
      
      if (filteredProducts.length !== products.length) {
        localStorage.setItem('products', JSON.stringify(filteredProducts));
        console.log(`🗑️ Removed ${products.length - filteredProducts.length} demo products from 'products' cache`);
      }
      
      // Clean up 'allProducts' key
      const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
      const filteredAllProducts = allProducts.filter(product => !isDemoProduct(product));
      
      if (filteredAllProducts.length !== allProducts.length) {
        localStorage.setItem('allProducts', JSON.stringify(filteredAllProducts));
        console.log(`🗑️ Removed ${allProducts.length - filteredAllProducts.length} demo products from 'allProducts' cache`);
      }
      
      // Clean up any other product-related keys
      const keysToCheck = [
        'featured_products',
        'cached_products',
        'product_cache',
        'products_cache'
      ];
      
      keysToCheck.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(data)) {
            const filtered = data.filter(product => !isDemoProduct(product));
            if (filtered.length !== data.length) {
              localStorage.setItem(key, JSON.stringify(filtered));
              console.log(`🗑️ Removed ${data.length - filtered.length} demo products from '${key}' cache`);
            }
          }
        } catch (e) {
          // Ignore errors for optional keys
        }
      });
      
    } catch (error) {
      console.error('❌ Error cleaning up localStorage:', error);
    }
  }
  
  // Clean up global product arrays
  function cleanupGlobalProducts() {
    try {
      // Clean up window.products
      if (window.products && Array.isArray(window.products)) {
        const originalLength = window.products.length;
        window.products = window.products.filter(product => !isDemoProduct(product));
        if (window.products.length !== originalLength) {
          console.log(`🗑️ Removed ${originalLength - window.products.length} demo products from window.products`);
        }
      }
      
      // Clean up window.allProductsIncludingUserSubmitted
      if (window.allProductsIncludingUserSubmitted && Array.isArray(window.allProductsIncludingUserSubmitted)) {
        const originalLength = window.allProductsIncludingUserSubmitted.length;
        window.allProductsIncludingUserSubmitted = window.allProductsIncludingUserSubmitted.filter(product => !isDemoProduct(product));
        if (window.allProductsIncludingUserSubmitted.length !== originalLength) {
          console.log(`🗑️ Removed ${originalLength - window.allProductsIncludingUserSubmitted.length} demo products from window.allProductsIncludingUserSubmitted`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error cleaning up global products:', error);
    }
  }
  
  // Override localStorage.setItem to prevent demo products from being saved
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    try {
      // Check if this is a product-related key
      if (key.includes('product') || key.includes('Product')) {
        const data = JSON.parse(value);
        if (Array.isArray(data)) {
          const filtered = data.filter(product => !isDemoProduct(product));
          if (filtered.length !== data.length) {
            console.log(`🚫 Prevented ${data.length - filtered.length} demo products from being saved to '${key}'`);
            value = JSON.stringify(filtered);
          }
        }
      }
    } catch (e) {
      // If parsing fails, proceed with original value
    }
    
    // Call original setItem
    return originalSetItem.call(this, key, value);
  };
  
  // Run cleanup immediately
  cleanupLocalStorage();
  cleanupGlobalProducts();
  
  // Run cleanup when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cleanupGlobalProducts();
    });
  } else {
    cleanupGlobalProducts();
  }
  
  // Run cleanup periodically to catch any new demo products
  setInterval(() => {
    cleanupLocalStorage();
    cleanupGlobalProducts();
  }, 30000); // Check every 30 seconds
  
  console.log('✅ Demo product cleanup completed and monitoring active');
  
})();