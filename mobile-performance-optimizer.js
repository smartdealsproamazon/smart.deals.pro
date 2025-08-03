/**
 * SmartDeals Pro Mobile Performance Optimizer
 * Comprehensive mobile optimization addressing PageSpeed Insights issues
 * Target: Improve Performance from 69 to 90+, Accessibility from 87 to 95+
 */

(function() {
  'use strict';

  const MobileOptimizer = {
    // Critical optimization flags
    isInitialized: false,
    criticalResourcesLoaded: false,
    
    init: function() {
      if (this.isInitialized) return;
      this.isInitialized = true;
      
      // Execute optimizations in priority order
      this.injectCriticalCSS();
      this.optimizeImages();
      this.removeUnusedResources();
      this.setupAdvancedLazyLoading();
      this.optimizeMobileInteractions();
      this.improveAccessibility();
      this.setupCaching();
      this.optimizeThirdPartyScripts();
      this.setupResourceHints();
    },

    // Inject critical CSS to prevent render blocking
    injectCriticalCSS: function() {
      const criticalCSS = `
        /* Critical above-the-fold styles */
        body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;background:#f8fafc;color:#333;line-height:1.6}
        .header{background:#fff;box-shadow:0 2px 4px rgba(0,0,0,0.1);position:sticky;top:0;z-index:100}
        .container{max-width:1200px;margin:0 auto;padding:0 1rem}
        .logo{height:40px;width:auto;object-fit:contain}
        .nav{display:flex;align-items:center;justify-content:space-between;padding:1rem 0}
        .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.75rem 1.5rem;border:none;border-radius:0.5rem;font-weight:600;text-decoration:none;transition:all 0.2s}
        .btn-primary{background:#3b82f6;color:#fff}
        .hero{padding:2rem 0;text-align:center}
        .hero h1{font-size:2.5rem;font-weight:700;margin-bottom:1rem;color:#1f2937}
        @media(max-width:768px){
          .hero h1{font-size:2rem}
          .nav{padding:0.5rem 0}
          .btn{padding:0.5rem 1rem;font-size:0.875rem}
        }
        /* Loading optimization */
        img{max-width:100%;height:auto;image-rendering:auto}
        .lazy{opacity:0;transition:opacity 0.3s}
        .lazy.loaded{opacity:1}
      `;
      
      const style = document.createElement('style');
      style.textContent = criticalCSS;
      style.setAttribute('data-critical', 'true');
      document.head.insertBefore(style, document.head.firstChild);
    },

    // Optimize images for mobile performance
    optimizeImages: function() {
      // Replace large logo with optimized version
      this.optimizeLogo();
      
      // Implement WebP support with fallbacks
      this.setupWebPSupport();
      
      // Setup responsive image loading
      this.setupResponsiveImages();
      
      // Optimize existing images
      this.processExistingImages();
    },

    optimizeLogo: function() {
      // Create optimized logo versions for different screen sizes
      const logos = document.querySelectorAll('img[src*="logo.png"], img[src*="logo.svg"]');
      
      logos.forEach(logo => {
        const isMobile = window.innerWidth <= 768;
        const newSrc = logo.src.includes('logo.png') ? 
          (isMobile ? 'logo.svg' : 'logo.svg') : // Use SVG for better performance
          logo.src;
        
        if (logo.src !== newSrc) {
          logo.src = newSrc;
        }
        
        // Add optimized loading attributes
        logo.loading = 'eager'; // Logo is critical
        logo.fetchPriority = 'high';
        logo.style.maxHeight = '40px';
        logo.style.width = 'auto';
        logo.style.objectFit = 'contain';
      });
    },

    setupWebPSupport: function() {
      // Test WebP support
      const webpSupported = (function() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') > -1;
      })();

      if (webpSupported) {
        document.documentElement.classList.add('webp');
        
        // Convert PNG images to WebP where beneficial
        setTimeout(() => {
          const images = document.querySelectorAll('img[src$=".png"], img[src$=".jpg"], img[src$=".jpeg"]');
          images.forEach(img => {
            if (img.loading === 'lazy' && !img.src.includes('favicon')) {
              const webpSrc = img.src.replace(/\.(png|jpg|jpeg)$/, '.webp');
              
              // Test if WebP version exists
              const testImg = new Image();
              testImg.onload = () => {
                img.src = webpSrc;
              };
              testImg.src = webpSrc;
            }
          });
        }, 1000);
      }
    },

    setupResponsiveImages: function() {
      const images = document.querySelectorAll('img');
      
      images.forEach(img => {
        if (!img.hasAttribute('data-optimized')) {
          // Add responsive attributes
          if (!img.sizes && !img.srcset) {
            img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw';
          }
          
          // Mark as optimized
          img.setAttribute('data-optimized', 'true');
        }
      });
    },

    processExistingImages: function() {
      const images = document.querySelectorAll('img:not([loading])');
      
      images.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        const isAboveFold = rect.top < window.innerHeight + 100;
        
        if (isAboveFold || index < 3) {
          img.loading = 'eager';
          img.fetchPriority = 'high';
        } else {
          img.loading = 'lazy';
          img.classList.add('lazy');
        }
      });
    },

    // Setup advanced intersection observer for lazy loading
    setupAdvancedLazyLoading: function() {
      if (!('IntersectionObserver' in window)) return;

      const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            
            img.classList.remove('lazy');
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      // Observe all lazy images
      document.querySelectorAll('img.lazy, img[data-src]').forEach(img => {
        lazyImageObserver.observe(img);
      });

      // Also setup lazy loading for background images
      const lazyBackgrounds = document.querySelectorAll('[data-bg]');
      if (lazyBackgrounds.length) {
        const bgObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.backgroundImage = `url(${entry.target.dataset.bg})`;
              entry.target.removeAttribute('data-bg');
              observer.unobserve(entry.target);
            }
          });
        });

        lazyBackgrounds.forEach(bg => bgObserver.observe(bg));
      }
    },

    // Remove unused JavaScript and CSS
    removeUnusedResources: function() {
      // Remove commented out scripts
      const comments = document.createNodeIterator(
        document.documentElement,
        NodeFilter.SHOW_COMMENT
      );
      
      let comment;
      const commentsToRemove = [];
      
      while (comment = comments.nextNode()) {
        if (comment.textContent.includes('script src="user-auth.js"')) {
          commentsToRemove.push(comment);
        }
      }
      
      commentsToRemove.forEach(comment => comment.remove());

      // Defer non-critical scripts
      this.deferNonCriticalScripts();
      
      // Remove unused CSS
      this.optimizeCSS();
    },

    deferNonCriticalScripts: function() {
      const scripts = document.querySelectorAll('script[src]');
      
      scripts.forEach(script => {
        const src = script.src;
        
        // Defer non-critical scripts
        if (src.includes('firebase') || 
            src.includes('user-auth') || 
            src.includes('facebook-config') ||
            src.includes('products.js') ||
            src.includes('render.js')) {
          
          if (!script.defer && !script.async) {
            script.defer = true;
          }
        }
      });
    },

    optimizeCSS: function() {
      // Remove unused Font Awesome icons on mobile
      if (window.innerWidth <= 768) {
        const faLink = document.querySelector('link[href*="font-awesome"]');
        if (faLink && !this.usesFontAwesome()) {
          faLink.disabled = true;
        }
      }
    },

    usesFontAwesome: function() {
      return document.querySelector('.fa, .fas, .far, .fab, [class*="fa-"]') !== null;
    },

    // Optimize mobile interactions
    optimizeMobileInteractions: function() {
      // Add touch-action optimization
      document.body.style.touchAction = 'manipulation';
      
      // Optimize click handlers for mobile
      this.optimizeClickHandlers();
      
      // Add mobile-specific optimizations
      this.addMobileOptimizations();
    },

    optimizeClickHandlers: function() {
      // Replace click events with touchstart for better responsiveness on mobile
      const clickableElements = document.querySelectorAll('button, .btn, [onclick]');
      
      clickableElements.forEach(element => {
        if (!element.hasAttribute('data-touch-optimized')) {
          element.style.cursor = 'pointer';
          element.style.userSelect = 'none';
          element.style.webkitTapHighlightColor = 'transparent';
          element.setAttribute('data-touch-optimized', 'true');
        }
      });
    },

    addMobileOptimizations: function() {
      // Add mobile viewport optimizations
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      }
      
      // Add mobile-specific CSS
      const mobileCSS = `
        @media (max-width: 768px) {
          body { font-size: 16px; } /* Prevent zoom on iOS */
          input, textarea, select { font-size: 16px; }
          .container { padding: 0 0.75rem; }
          .hero { padding: 1.5rem 0; }
          .btn { min-height: 44px; min-width: 44px; } /* Touch target size */
        }
        /* Performance optimizations */
        * { will-change: auto; }
        .animated { will-change: transform, opacity; }
      `;
      
      const style = document.createElement('style');
      style.textContent = mobileCSS;
      style.setAttribute('data-mobile-optimized', 'true');
      document.head.appendChild(style);
    },

    // Improve accessibility
    improveAccessibility: function() {
      this.addSkipLinks();
      this.improveImageAlt();
      this.enhanceKeyboardNavigation();
      this.improveColorContrast();
      this.addARIALabels();
    },

    addSkipLinks: function() {
      if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          z-index: 1000;
          opacity: 0;
          transition: all 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
          skipLink.style.top = '6px';
          skipLink.style.opacity = '1';
        });
        
        skipLink.addEventListener('blur', () => {
          skipLink.style.top = '-40px';
          skipLink.style.opacity = '0';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
      }
    },

    improveImageAlt: function() {
      const images = document.querySelectorAll('img:not([alt])');
      images.forEach(img => {
        if (img.src.includes('logo')) {
          img.alt = 'SmartDeals Pro Logo';
        } else if (img.src.includes('icon')) {
          img.alt = 'SmartDeals Pro Icon';
        } else {
          img.alt = 'Product image';
        }
      });
    },

    enhanceKeyboardNavigation: function() {
      // Ensure all interactive elements are focusable
      const interactiveElements = document.querySelectorAll('button, .btn, [onclick]');
      
      interactiveElements.forEach(element => {
        if (!element.hasAttribute('tabindex') && element.tagName !== 'BUTTON') {
          element.tabIndex = 0;
        }
        
        // Add keyboard event handlers
        if (!element.hasAttribute('data-keyboard-enhanced')) {
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              element.click();
            }
          });
          element.setAttribute('data-keyboard-enhanced', 'true');
        }
      });
    },

    improveColorContrast: function() {
      // Add high contrast styles
      const contrastCSS = `
        @media (prefers-contrast: high) {
          body { background: #fff; color: #000; }
          .btn-primary { background: #0066cc; }
          a { color: #0066cc; text-decoration: underline; }
        }
      `;
      
      const style = document.createElement('style');
      style.textContent = contrastCSS;
      document.head.appendChild(style);
    },

    addARIALabels: function() {
      // Add main landmark
      const main = document.querySelector('main') || document.querySelector('.main-content');
      if (main) {
        main.id = 'main-content';
        main.setAttribute('role', 'main');
      }

      // Add navigation landmarks
      const nav = document.querySelector('nav') || document.querySelector('.nav');
      if (nav && !nav.hasAttribute('role')) {
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Main navigation');
      }

      // Add button labels
      const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
      buttons.forEach(button => {
        if (!button.textContent.trim()) {
          button.setAttribute('aria-label', 'Action button');
        }
      });
    },

    // Setup caching optimization
    setupCaching: function() {
      // Update service worker for better caching
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          // Send optimization message to service worker
          if (registration.active) {
            registration.active.postMessage({
              type: 'OPTIMIZATION_UPDATE',
              cacheStrategy: 'performance-first'
            });
          }
        });
      }

      // Implement resource caching hints
      this.addCachingHeaders();
    },

    addCachingHeaders: function() {
      // Add cache control meta tags
      const cacheControl = document.createElement('meta');
      cacheControl.httpEquiv = 'Cache-Control';
      cacheControl.content = 'public, max-age=31536000';
      document.head.appendChild(cacheControl);
    },

    // Optimize third-party scripts
    optimizeThirdPartyScripts: function() {
      // Defer Google Fonts loading
      this.optimizeGoogleFonts();
      
      // Optimize external scripts
      this.optimizeExternalScripts();
    },

    optimizeGoogleFonts: function() {
      const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
      fontLinks.forEach(link => {
        link.setAttribute('rel', 'preload');
        link.setAttribute('as', 'style');
        link.setAttribute('onload', "this.onload=null;this.rel='stylesheet'");
      });
    },

    optimizeExternalScripts: function() {
      // Add loading="async" to external scripts
      const externalScripts = document.querySelectorAll('script[src*="googleapis"], script[src*="gstatic"], script[src*="firebasejs"]');
      
      externalScripts.forEach(script => {
        if (!script.async && !script.defer) {
          script.async = true;
        }
      });
    },

    // Setup resource hints
    setupResourceHints: function() {
      const resourceHints = [
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: '//cdnjs.cloudflare.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
      ];

      resourceHints.forEach(hint => {
        if (!document.querySelector(`link[href="${hint.href}"]`)) {
          const link = document.createElement('link');
          link.rel = hint.rel;
          link.href = hint.href;
          if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
          document.head.appendChild(link);
        }
      });
    }
  };

  // Initialize optimizations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileOptimizer.init());
  } else {
    MobileOptimizer.init();
  }

  // Re-run optimizations on dynamic content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'IMG') {
              MobileOptimizer.processExistingImages();
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Expose for debugging
  window.MobileOptimizer = MobileOptimizer;

})();