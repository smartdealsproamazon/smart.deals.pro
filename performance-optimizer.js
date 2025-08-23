// Enhanced Performance Optimizer for SmartDeals Pro
// Optimized for faster loading and better user experience

class SmartDealsPerformanceOptimizer {
  constructor() {
    this.preloadedPages = new Set();
    this.criticalPages = ['boys-fashion.html', 'girls-fashion.html', 'deals.html'];
    this.init();
  }

  init() {
    this.setupPreloading();
    this.optimizeImages();
    this.setupServiceWorker();
    this.cacheProducts();
    this.setupFastNavigation();
  }

  // Preload critical pages on user interaction
  setupPreloading() {
    let preloadTriggered = false;
    
    const triggerPreload = () => {
      if (preloadTriggered) return;
      preloadTriggered = true;
      
      this.criticalPages.forEach(page => {
        if (!this.preloadedPages.has(page)) {
          this.preloadPage(page);
        }
      });
    };

    // Trigger on first user interaction
    ['mousedown', 'touchstart', 'keydown', 'scroll'].forEach(event => {
      document.addEventListener(event, triggerPreload, { once: true, passive: true });
    });

    // Also trigger after 2 seconds if no interaction
    setTimeout(triggerPreload, 2000);
  }

  preloadPage(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    this.preloadedPages.add(url);
    console.log(`Preloaded: ${url}`);
  }

  // Optimize images with lazy loading and compression
  optimizeImages() {
    // Setup intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px' // Start loading 50px before entering viewport
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Enhanced service worker for better caching
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      // Only register service worker if not on marketplace page to prevent conflicts
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage.includes('marketplace')) {
        console.log('Skipping service worker registration on marketplace page');
        return;
      }
      
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('Enhanced SW registered');
          
          // Force update check
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          });
        })
        .catch(error => console.log('SW registration failed:', error));
    }
  }

  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed; 
        bottom: 20px; 
        left: 20px; 
        background: #10b981; 
        color: white; 
        padding: 16px 20px; 
        border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); 
        z-index: 1002;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <i class="fas fa-sync-alt"></i>
        <div>
          <div style="font-weight: 600;">Update Available</div>
          <div style="font-size: 12px; opacity: 0.9;">Refresh for the latest features</div>
        </div>
        <button onclick="window.location.reload()" style="
          background: rgba(255,255,255,0.2); 
          border: none; 
          color: white; 
          padding: 6px 12px; 
          border-radius: 4px; 
          cursor: pointer;
          font-size: 12px;
        ">Refresh</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent; 
          border: none; 
          color: white; 
          cursor: pointer;
          padding: 4px;
        ">×</button>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 10000);
  }

  // Cache products for faster access
  cacheProducts() {
    // Check if we have fresh cached data
    const lastUpdate = localStorage.getItem('products_cached_at');
    const cacheAge = lastUpdate ? Date.now() - parseInt(lastUpdate) : Infinity;
    const maxAge = 30 * 60 * 1000; // 30 minutes

    if (cacheAge > maxAge) {
      // Preload products if cache is stale
      this.preloadProductData();
    }
  }

  async preloadProductData() {
    try {
      // Remove any existing demo/sample products from localStorage
      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const filteredProducts = existingProducts.filter(product => {
        // Remove products with demo/sample indicators
        return !product.id?.includes('prod_sample_') &&
               !product.title?.includes('Demo') &&
               !product.name?.includes('Demo') &&
               !product.id?.includes('demo_');
      });
      
      // Update localStorage with filtered products (removing demo products)
      if (filteredProducts.length !== existingProducts.length) {
        localStorage.setItem('products', JSON.stringify(filteredProducts));
        localStorage.setItem('products_cached_at', Date.now().toString());
        console.log(`Removed ${existingProducts.length - filteredProducts.length} demo products from cache`);
      }
    } catch (error) {
      console.warn('Product preloading failed:', error);
    }
  }

  // Setup fast navigation with prefetch on hover
  setupFastNavigation() {
    let hoverTimeout;
    
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]');
      if (!link || !link.href.includes('.html')) return;
      
      hoverTimeout = setTimeout(() => {
        const url = new URL(link.href).pathname.split('/').pop();
        if (!this.preloadedPages.has(url)) {
          this.preloadPage(url);
        }
      }, 100); // Preload after 100ms hover
    });

    document.addEventListener('mouseout', (e) => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    });
  }

  // Optimize form submissions
  optimizeForms() {
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', function(e) {
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          const originalText = submitBtn.textContent;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
          
          // Re-enable after 3 seconds (failsafe)
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }, 3000);
        }
      });
    });
  }

  // Monitor performance and log metrics
  monitorPerformance() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            console.log('Performance Metrics:', {
              'Page Load Time': `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`,
              'DOM Content Loaded': `${Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)}ms`,
              'First Paint': this.getFirstPaint()
            });
          }
        }, 0);
      });
    }
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? `${Math.round(firstPaint.startTime)}ms` : 'Not available';
  }
}

// Initialize performance optimizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.performanceOptimizer = new SmartDealsPerformanceOptimizer();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartDealsPerformanceOptimizer;
}