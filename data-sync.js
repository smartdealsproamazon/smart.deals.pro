// SmartDeals Pro Data Synchronization System
// Syncs data with GitHub Pages site: https://smartdealsproamazon.github.io/smart.deals.pro/

class DataSyncManager {
  constructor() {
    this.sourceUrl = 'https://smartdealsproamazon.github.io/smart.deals.pro/';
    this.fallbackUrl = 'https://smartdealsproamazon.github.io/smart.deals.pro/products.json';
    this.localStorageKey = 'smartdeals_synced_data';
    this.lastSyncKey = 'smartdeals_last_sync';
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.syncIntervalId = null;
    this.isOnline = navigator.onLine;
    
    this.initializeSync();
  }

  async initializeSync() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored, syncing data...');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Gone offline, using cached data');
    });

    // Initial sync
    await this.syncData();
    
    // Start periodic sync
    this.startPeriodicSync();
  }

  startPeriodicSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    
    this.syncIntervalId = setInterval(() => {
      if (this.isOnline) {
        this.syncData();
      }
    }, this.syncInterval);
  }

  async syncData() {
    if (!this.isOnline) {
      console.log('Offline - using cached data');
      return this.getCachedData();
    }

    try {
      console.log('Syncing data from GitHub Pages...');
      
      // Try to fetch the main site data
      let data = await this.fetchSiteData();
      
      if (!data) {
        // Fallback to products.json if available
        data = await this.fetchFallbackData();
      }

      if (data) {
        this.cacheData(data);
        this.updateLastSync();
        this.notifyDataUpdate(data);
        console.log('Data sync successful');
        return data;
      } else {
        console.log('Sync failed, using cached data');
        return this.getCachedData();
      }
    } catch (error) {
      console.error('Sync error:', error);
      return this.getCachedData();
    }
  }

  async fetchSiteData() {
    try {
      // Fetch the main site page
      const response = await fetch(this.sourceUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      return this.extractDataFromHTML(html);
    } catch (error) {
      console.warn('Failed to fetch main site:', error);
      return null;
    }
  }

  async fetchFallbackData() {
    try {
      // Try to fetch JSON data
      const response = await fetch(this.fallbackUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Fallback fetch failed:', error);
    }
    return null;
  }

  extractDataFromHTML(html) {
    try {
      // Create a temporary DOM to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const extractedData = {
        products: [],
        categories: [],
        deals: [],
        timestamp: Date.now()
      };

      // Extract products from product cards
      const productCards = doc.querySelectorAll('.product-card, [data-product], .deal-item');
      productCards.forEach(card => {
        const product = this.extractProductFromElement(card);
        if (product) {
          extractedData.products.push(product);
        }
      });

      // Extract categories
      const categoryLinks = doc.querySelectorAll('.category-card, [data-category]');
      categoryLinks.forEach(link => {
        const category = this.extractCategoryFromElement(link);
        if (category) {
          extractedData.categories.push(category);
        }
      });

      // Extract deals
      const dealElements = doc.querySelectorAll('.deal-card, [data-deal]');
      dealElements.forEach(deal => {
        const dealData = this.extractDealFromElement(deal);
        if (dealData) {
          extractedData.deals.push(dealData);
        }
      });

      return extractedData;
    } catch (error) {
      console.error('Error extracting data from HTML:', error);
      return null;
    }
  }

  extractProductFromElement(element) {
    try {
      const title = element.querySelector('h3, .product-title, [data-title]')?.textContent?.trim();
      const price = element.querySelector('.price, [data-price]')?.textContent?.trim();
      const originalPrice = element.querySelector('.original-price, [data-original-price]')?.textContent?.trim();
      const image = element.querySelector('img')?.src;
      const link = element.querySelector('a')?.href || element.href;
      const rating = element.querySelector('.rating, [data-rating]')?.textContent?.trim();
      const discount = element.querySelector('.discount, [data-discount]')?.textContent?.trim();

      if (title) {
        return {
          id: this.generateId(title),
          title,
          price,
          originalPrice,
          image,
          link,
          rating,
          discount,
          category: this.extractCategory(element),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.warn('Error extracting product:', error);
    }
    return null;
  }

  extractCategoryFromElement(element) {
    try {
      const name = element.querySelector('h3, .category-name')?.textContent?.trim();
      const link = element.href || element.querySelector('a')?.href;
      const image = element.querySelector('img')?.src;
      const description = element.querySelector('p, .category-description')?.textContent?.trim();

      if (name) {
        return {
          id: this.generateId(name),
          name,
          link,
          image,
          description,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.warn('Error extracting category:', error);
    }
    return null;
  }

  extractDealFromElement(element) {
    try {
      const title = element.querySelector('h3, .deal-title')?.textContent?.trim();
      const discount = element.querySelector('.discount, .deal-percentage')?.textContent?.trim();
      const validUntil = element.querySelector('.valid-until, [data-valid-until]')?.textContent?.trim();
      const code = element.querySelector('.coupon-code, [data-code]')?.textContent?.trim();

      if (title) {
        return {
          id: this.generateId(title),
          title,
          discount,
          validUntil,
          code,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.warn('Error extracting deal:', error);
    }
    return null;
  }

  extractCategory(element) {
    // Try to determine category from various sources
    const categoryAttr = element.dataset.category;
    if (categoryAttr) return categoryAttr;

    const categoryClass = Array.from(element.classList).find(cls => 
      cls.includes('category-') || cls.includes('cat-')
    );
    if (categoryClass) return categoryClass.replace(/^(category-|cat-)/, '');

    // Try to extract from URL or parent elements
    const link = element.querySelector('a')?.href;
    if (link) {
      const match = link.match(/\/([^\/]+)\.html/);
      if (match) return match[1];
    }

    return 'general';
  }

  generateId(text) {
    // Generate a simple ID from text
    return text.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  cacheData(data) {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  getCachedData() {
    try {
      const cached = localStorage.getItem(this.localStorageKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  updateLastSync() {
    localStorage.setItem(this.lastSyncKey, Date.now().toString());
  }

  getLastSync() {
    const lastSync = localStorage.getItem(this.lastSyncKey);
    return lastSync ? parseInt(lastSync) : null;
  }

  notifyDataUpdate(data) {
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('datasynced', { 
      detail: { data, timestamp: Date.now() } 
    }));
  }

  // Public API methods
  async getProducts() {
    const data = await this.syncData();
    return data?.products || [];
  }

  async getCategories() {
    const data = await this.syncData();
    return data?.categories || [];
  }

  async getDeals() {
    const data = await this.syncData();
    return data?.deals || [];
  }

  async forceSync() {
    return await this.syncData();
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.getLastSync(),
      syncInterval: this.syncInterval
    };
  }

  destroy() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
  }
}

// Initialize data sync manager
const dataSyncManager = new DataSyncManager();

// Export for use in other scripts
window.DataSyncManager = DataSyncManager;
window.dataSyncManager = dataSyncManager;

// Listen for data sync events
window.addEventListener('datasynced', (event) => {
  console.log('Data synced:', event.detail);
  
  // Update UI if products are displayed
  if (typeof updateProductDisplay === 'function') {
    updateProductDisplay(event.detail.data);
  }
});

console.log('Data Sync Manager initialized');