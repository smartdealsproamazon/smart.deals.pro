/**
 * SmartDeals Pro Performance Optimizer
 * Comprehensive performance optimization script
 */

(function() {
  'use strict';

  // Critical Performance Features
  const PerformanceOptimizer = {
    
    // Initialize all optimizations
    init: function() {
      this.optimizeImages();
      this.prefetchResources();
      this.optimizeForms();
      this.setupIntersectionObserver();
      this.optimizeScrolling();
      this.setupCriticalResourceHints();
    },

    // Optimize image loading
    optimizeImages: function() {
      // Convert images to lazy loading if not already done
      const images = document.querySelectorAll('img:not([loading])');
      images.forEach(img => {
        if (img.getBoundingClientRect().top > window.innerHeight) {
          img.loading = 'lazy';
        } else {
          img.loading = 'eager';
        }
      });

      // Add WebP support detection
      const webpSupported = (function() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') > -1;
      })();

      if (webpSupported) {
        document.documentElement.classList.add('webp-supported');
      }
    },

    // Setup Intersection Observer for advanced lazy loading
    setupIntersectionObserver: function() {
      if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                img.classList.add('loaded');
                lazyImageObserver.unobserve(img);
              }
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
          lazyImageObserver.observe(img);
        });
      }
    },

    // Prefetch critical resources
    prefetchResources: function() {
      const criticalPages = [
        'products.html',
        'deals.html',
        'about.html',
        'contact.html'
      ];

      // Prefetch on user interaction
      let prefetchTriggered = false;
      const prefetchOnInteraction = () => {
        if (prefetchTriggered) return;
        prefetchTriggered = true;

        criticalPages.forEach(page => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = page;
          document.head.appendChild(link);
        });

        // Prefetch critical CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'prefetch';
        cssLink.href = 'style.css';
        document.head.appendChild(cssLink);
      };

      ['mousedown', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, prefetchOnInteraction, { 
          once: true, 
          passive: true 
        });
      });
    },

    // Optimize form handling
    optimizeForms: function() {
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
          const submitBtn = form.querySelector('[type="submit"]');
          if (submitBtn && !submitBtn.disabled) {
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            
            // Re-enable after 3 seconds if still disabled
            setTimeout(() => {
              if (submitBtn.disabled) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
              }
            }, 3000);
          }
        });
      });
    },

    // Optimize scrolling performance
    optimizeScrolling: function() {
      let ticking = false;
      
      function updateScrollPosition() {
        // Add scroll-based optimizations here
        ticking = false;
      }

      function requestTick() {
        if (!ticking) {
          requestAnimationFrame(updateScrollPosition);
          ticking = true;
        }
      }

      window.addEventListener('scroll', requestTick, { passive: true });
    },

    // Setup critical resource hints
    setupCriticalResourceHints: function() {
      // DNS prefetch for external resources
      const externalDomains = [
        '//fonts.googleapis.com',
        '//fonts.gstatic.com',
        '//cdnjs.cloudflare.com'
      ];

      externalDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      });
    },

    // Critical CSS injection for above-the-fold content
    injectCriticalCSS: function() {
      const criticalCSS = `
        .header { display: flex; align-items: center; }
        .logo { max-height: 40px; width: auto; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .btn { display: inline-flex; align-items: center; justify-content: center; }
      `;
      
      const style = document.createElement('style');
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PerformanceOptimizer.init());
  } else {
    PerformanceOptimizer.init();
  }

  // Expose to global scope for debugging
  window.PerformanceOptimizer = PerformanceOptimizer;

})();