// Firebase Performance Monitor - Tracks Firebase performance and connection metrics
class FirebasePerformanceMonitor {
  constructor() {
    this.metrics = {
      connectionTime: 0,
      firstProductLoad: 0,
      totalProducts: 0,
      cacheHits: 0,
      cacheMisses: 0,
      offlineMode: false,
      connectionRetries: 0,
      lastSync: null
    };
    
    this.startTime = Date.now();
    this.connectionStartTime = null;
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor Firebase Optimizer events
    document.addEventListener('firebase-optimizer-ready', () => {
      this.recordConnectionSuccess();
    });

    document.addEventListener('firebase-offline', () => {
      this.metrics.offlineMode = true;
      this.logMetric('Offline mode activated');
    });

    document.addEventListener('products-ready', () => {
      this.recordProductsLoaded();
    });

    document.addEventListener('firebase-connected', () => {
      this.recordConnectionSuccess();
    });

    // Monitor localStorage for cache performance
    this.monitorCachePerformance();
    
    // Monitor connection retries
    this.monitorConnectionRetries();
    
    // Periodic performance report
    setInterval(() => {
      this.generatePerformanceReport();
    }, 30000); // Every 30 seconds
  }

  startConnectionTimer() {
    this.connectionStartTime = Date.now();
    this.logMetric('Connection attempt started');
  }

  recordConnectionSuccess() {
    if (this.connectionStartTime) {
      this.metrics.connectionTime = Date.now() - this.connectionStartTime;
      this.metrics.offlineMode = false;
      this.metrics.lastSync = new Date().toISOString();
      this.logMetric(`Connection successful in ${this.metrics.connectionTime}ms`);
    }
  }

  recordProductsLoaded() {
    if (!this.metrics.firstProductLoad) {
      this.metrics.firstProductLoad = Date.now() - this.startTime;
      this.logMetric(`First products loaded in ${this.metrics.firstProductLoad}ms`);
    }
    
    if (window.products) {
      this.metrics.totalProducts = window.products.length;
    }
  }

  monitorCachePerformance() {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    
    Storage.prototype.getItem = function(key) {
      const value = originalGetItem.call(this, key);
      if (key === 'products' || key === 'allProducts') {
        if (value) {
          window.firebasePerformanceMonitor?.recordCacheHit();
        } else {
          window.firebasePerformanceMonitor?.recordCacheMiss();
        }
      }
      return value;
    };
    
    Storage.prototype.setItem = function(key, value) {
      if (key === 'products' || key === 'allProducts') {
        window.firebasePerformanceMonitor?.recordCacheUpdate();
      }
      return originalSetItem.call(this, key, value);
    };
  }

  monitorConnectionRetries() {
    // Override Firebase Optimizer retry method to track retries
    if (window.firebaseOptimizer) {
      const originalHandleConnectionError = window.firebaseOptimizer.handleConnectionError;
      window.firebaseOptimizer.handleConnectionError = (...args) => {
        this.metrics.connectionRetries++;
        this.logMetric(`Connection retry ${this.metrics.connectionRetries}`);
        return originalHandleConnectionError.apply(window.firebaseOptimizer, args);
      };
    }
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  recordCacheUpdate() {
    this.logMetric('Cache updated');
  }

  logMetric(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Firebase Monitor ${timestamp}] ${message}`);
    
    // Also log to performance log if available
    if (window.performanceLog) {
      window.performanceLog.log(message);
    }
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      connectionTime: this.metrics.connectionTime,
      firstProductLoad: this.metrics.firstProductLoad,
      totalProducts: this.metrics.totalProducts,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100,
      offlineMode: this.metrics.offlineMode,
      connectionRetries: this.metrics.connectionRetries,
      lastSync: this.metrics.lastSync
    };

    console.log('=== Firebase Performance Report ===');
    console.log('Connection Time:', report.connectionTime + 'ms');
    console.log('First Product Load:', report.firstProductLoad + 'ms');
    console.log('Total Products:', report.totalProducts);
    console.log('Cache Hit Rate:', report.cacheHitRate.toFixed(2) + '%');
    console.log('Offline Mode:', report.offlineMode);
    console.log('Connection Retries:', report.connectionRetries);
    console.log('Last Sync:', report.lastSync);
    console.log('===================================');

    // Store report in localStorage for analysis
    const reports = JSON.parse(localStorage.getItem('firebase_performance_reports') || '[]');
    reports.push(report);
    
    // Keep only last 100 reports
    if (reports.length > 100) {
      reports.splice(0, reports.length - 100);
    }
    
    localStorage.setItem('firebase_performance_reports', JSON.stringify(reports));
  }

  getPerformanceSummary() {
    return {
      connectionTime: this.metrics.connectionTime,
      firstProductLoad: this.metrics.firstProductLoad,
      totalProducts: this.metrics.totalProducts,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100,
      offlineMode: this.metrics.offlineMode,
      connectionRetries: this.metrics.connectionRetries
    };
  }

  resetMetrics() {
    this.metrics = {
      connectionTime: 0,
      firstProductLoad: 0,
      totalProducts: 0,
      cacheHits: 0,
      cacheMisses: 0,
      offlineMode: false,
      connectionRetries: 0,
      lastSync: null
    };
    this.startTime = Date.now();
    this.connectionStartTime = null;
    this.logMetric('Metrics reset');
  }
}

// Initialize performance monitor
let firebasePerformanceMonitor;

document.addEventListener('DOMContentLoaded', () => {
  firebasePerformanceMonitor = new FirebasePerformanceMonitor();
  window.firebasePerformanceMonitor = firebasePerformanceMonitor;
});

// Make it globally available
window.FirebasePerformanceMonitor = FirebasePerformanceMonitor;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebasePerformanceMonitor;
}