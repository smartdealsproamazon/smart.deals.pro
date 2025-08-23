// Demo Product Cleanup Script
// This script removes all demo/sample products from localStorage and prevents them from showing

(function() {
  'use strict';
  
  console.log('🔄 Starting demo product cleanup...');
  
  // Check if this appears to be a fresh session (site data cleared)
  function isFreshSession() {
    const hasAnyProducts = localStorage.getItem('products');
    const hasAnyCache = localStorage.getItem('allProducts');
    const hasTimestamp = localStorage.getItem('products_updated');
    
    // If no cache exists at all, this is likely a fresh session
    return !hasAnyProducts && !hasAnyCache && !hasTimestamp;
  }
  
  // Function to identify demo products (more strict criteria)
  function isDemoProduct(product) {
    if (!product) return true;
    
    // More specific demo indicators
    const demoIndicators = [
      'Demo Product', 'Example Product', 'Sample Product', 'Test Product'
    ];
    
    const demoIdPatterns = [
      'prod_sample_', 'demo_', 'sample_', 'test_', 'temp_'
    ];
    
    // Check name/title for exact demo indicators (more strict)
    const name = (product.name || product.title || '').toLowerCase();
    const hasExactDemoName = demoIndicators.some(indicator => 
      name.includes(indicator.toLowerCase())
    );
    
    // Check ID for demo patterns
    const id = (product.id || '').toString().toLowerCase();
    const hasDemoId = demoIdPatterns.some(pattern => 
      id.includes(pattern)
    );
    
    // Check for obvious placeholder links (but be more lenient during loading)
    const hasPlaceholderLink = product.link === '#' || 
                              product.link === '' ||
                              (product.link && product.link.includes('placeholder'));
    
    // More strict: only remove if multiple indicators are present or very obvious demo
    const isObviousDemo = hasExactDemoName || hasDemoId;
    const isPossibleDemo = hasPlaceholderLink && (hasExactDemoName || hasDemoId);
    
    return isObviousDemo || isPossibleDemo;
  }
  
  // Clean up products from localStorage
  function cleanupLocalStorage() {
    // If this is a fresh session, be more cautious
    const freshSession = isFreshSession();
    
    if (freshSession) {
      console.log('🔍 Fresh session detected - being cautious with demo cleanup');
      // In fresh sessions, only remove very obvious demo products
      // This prevents accidentally removing real products during initial Firebase loading
      setTimeout(() => {
        performCleanup(true); // cautious mode
      }, 3000); // Wait 3 seconds for Firebase to start loading
      return;
    }
    
    performCleanup(false); // normal mode
  }
  
  function performCleanup(cautiousMode = false) {
    try {
      // Clean up 'products' key
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      let filteredProducts;
      
      if (cautiousMode) {
        // In cautious mode, only remove very obvious demo products
        filteredProducts = products.filter(product => {
          const isDemoResult = isDemoProduct(product);
          // Only remove if it's obviously demo AND has demo ID patterns
          const id = (product.id || '').toString().toLowerCase();
          const hasObviousDemoId = ['prod_sample_', 'demo_', 'sample_', 'test_'].some(pattern => 
            id.includes(pattern)
          );
          return !(isDemoResult && hasObviousDemoId);
        });
      } else {
        filteredProducts = products.filter(product => !isDemoProduct(product));
      }
      
      if (filteredProducts.length !== products.length) {
        localStorage.setItem('products', JSON.stringify(filteredProducts));
        console.log(`🗑️ Removed ${products.length - filteredProducts.length} demo products from 'products' cache${cautiousMode ? ' (cautious mode)' : ''}`);
      }
      
      // Clean up 'allProducts' key
      const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
      let filteredAllProducts;
      
      if (cautiousMode) {
        filteredAllProducts = allProducts.filter(product => {
          const isDemoResult = isDemoProduct(product);
          const id = (product.id || '').toString().toLowerCase();
          const hasObviousDemoId = ['prod_sample_', 'demo_', 'sample_', 'test_'].some(pattern => 
            id.includes(pattern)
          );
          return !(isDemoResult && hasObviousDemoId);
        });
      } else {
        filteredAllProducts = allProducts.filter(product => !isDemoProduct(product));
      }
      
      if (filteredAllProducts.length !== allProducts.length) {
        localStorage.setItem('allProducts', JSON.stringify(filteredAllProducts));
        console.log(`🗑️ Removed ${allProducts.length - filteredAllProducts.length} demo products from 'allProducts' cache${cautiousMode ? ' (cautious mode)' : ''}`);
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
            let filtered;
            if (cautiousMode) {
              filtered = data.filter(product => {
                const isDemoResult = isDemoProduct(product);
                const id = (product.id || '').toString().toLowerCase();
                const hasObviousDemoId = ['prod_sample_', 'demo_', 'sample_', 'test_'].some(pattern => 
                  id.includes(pattern)
                );
                return !(isDemoResult && hasObviousDemoId);
              });
            } else {
              filtered = data.filter(product => !isDemoProduct(product));
            }
            
            if (filtered.length !== data.length) {
              localStorage.setItem(key, JSON.stringify(filtered));
              console.log(`🗑️ Removed ${data.length - filtered.length} demo products from '${key}' cache${cautiousMode ? ' (cautious mode)' : ''}`);
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
  function cleanupGlobalProducts(cautiousMode = false) {
    try {
      // Clean up window.products
      if (window.products && Array.isArray(window.products)) {
        const originalLength = window.products.length;
        
        if (cautiousMode) {
          // In cautious mode, only remove very obvious demo products
          window.products = window.products.filter(product => {
            const isDemoResult = isDemoProduct(product);
            const id = (product.id || '').toString().toLowerCase();
            const hasObviousDemoId = ['prod_sample_', 'demo_', 'sample_', 'test_'].some(pattern => 
              id.includes(pattern)
            );
            return !(isDemoResult && hasObviousDemoId);
          });
        } else {
          window.products = window.products.filter(product => !isDemoProduct(product));
        }
        
        if (window.products.length !== originalLength) {
          console.log(`🗑️ Removed ${originalLength - window.products.length} demo products from window.products${cautiousMode ? ' (cautious mode)' : ''}`);
        }
      }
      
      // Clean up window.allProductsIncludingUserSubmitted
      if (window.allProductsIncludingUserSubmitted && Array.isArray(window.allProductsIncludingUserSubmitted)) {
        const originalLength = window.allProductsIncludingUserSubmitted.length;
        
        if (cautiousMode) {
          window.allProductsIncludingUserSubmitted = window.allProductsIncludingUserSubmitted.filter(product => {
            const isDemoResult = isDemoProduct(product);
            const id = (product.id || '').toString().toLowerCase();
            const hasObviousDemoId = ['prod_sample_', 'demo_', 'sample_', 'test_'].some(pattern => 
              id.includes(pattern)
            );
            return !(isDemoResult && hasObviousDemoId);
          });
        } else {
          window.allProductsIncludingUserSubmitted = window.allProductsIncludingUserSubmitted.filter(product => !isDemoProduct(product));
        }
        
        if (window.allProductsIncludingUserSubmitted.length !== originalLength) {
          console.log(`🗑️ Removed ${originalLength - window.allProductsIncludingUserSubmitted.length} demo products from window.allProductsIncludingUserSubmitted${cautiousMode ? ' (cautious mode)' : ''}`);
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
  
  // Determine if we should use cautious mode
  const isFresh = isFreshSession();
  
  // Run cleanup immediately (cautious if fresh session)
  if (isFresh) {
    console.log('🔍 Fresh session detected - starting cautious demo cleanup');
    // For fresh sessions, wait a bit before cleaning to let Firebase start loading
    setTimeout(() => {
      cleanupLocalStorage();
      cleanupGlobalProducts(true); // cautious mode
    }, 2000);
  } else {
    cleanupLocalStorage();
    cleanupGlobalProducts(false); // normal mode
  }
  
  // Run cleanup when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cleanupGlobalProducts(isFresh);
    });
  } else {
    cleanupGlobalProducts(isFresh);
  }
  
  // Run cleanup periodically to catch any new demo products
  setInterval(() => {
    // After initial load, use normal cleanup mode
    const currentlyFresh = isFreshSession();
    cleanupLocalStorage();
    cleanupGlobalProducts(currentlyFresh);
  }, 30000); // Check every 30 seconds
  
  console.log(`✅ Demo product cleanup completed and monitoring active${isFresh ? ' (cautious mode for fresh session)' : ''}`);
  
})();