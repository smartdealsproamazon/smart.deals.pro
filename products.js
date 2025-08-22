// Simple Products Management for SmartDeals Pro
// This file now works with the clean Firebase configuration

// Product State Manager (simplified)
class ProductStateManager {
  constructor() {
    this.products = [];
    this.productMap = new Map();
    this.listeners = [];
  }

  // Add or update a product in the state
  addProduct(productData) {
    const id = productData.id || this.generateProductId(productData);
    const normalizedProduct = this.normalizeProduct(productData, id);
    
    // Update in array
    const existingIndex = this.products.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
      this.products[existingIndex] = normalizedProduct;
    } else {
      this.products.unshift(normalizedProduct);
    }
    
    // Update in map for fast lookup
    this.productMap.set(id, normalizedProduct);
    
    return normalizedProduct;
  }

  // Generate a unique ID for products
  generateProductId(product) {
    const data = (product.title || product.name || '') + 
                 (product.link || '') + 
                 (product.category || '') + 
                 (product.price || '');
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const timestamp = Date.now().toString(36);
    const hashStr = Math.abs(hash).toString(36);
    return `prod_${hashStr}_${timestamp}`;
  }

  // Get product by exact ID
  getProductById(id) {
    return this.productMap.get(String(id));
  }

  // Get all products
  getAllProducts() {
    return [...this.products];
  }

  // Get current product count
  getProductCount() {
    return this.products.length;
  }

  // Update products from external source (Firebase, localStorage)
  updateProducts(newProducts) {
    this.products = [];
    this.productMap.clear();
    
    const toJsDate = (val) => {
      try {
        if (!val) return new Date(0);
        if (typeof val?.toDate === 'function') return val.toDate();
        if (typeof val === 'number') return new Date(val);
        if (typeof val === 'string') return new Date(val);
        return new Date(0);
      } catch (_) {
        return new Date(0);
      }
    };
    
    // Sort products by creation date (newest first)
    const sortedProducts = newProducts.sort((a, b) => {
      const dateA = toJsDate(a.createdAt);
      const dateB = toJsDate(b.createdAt);
      return dateB - dateA;
    });
    
    // Add all products
    sortedProducts.forEach(product => {
      const id = this.generateProductId(product);
      const normalizedProduct = this.normalizeProduct(product, id);
      this.products.push(normalizedProduct);
      this.productMap.set(id, normalizedProduct);
    });
    
    console.log(`Loaded ${sortedProducts.length} products`);
    
    this.notifyListeners();
  }

  // Add listener for product updates
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Notify all listeners of updates
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.products));
  }

  // Normalize product data with consistent structure
  normalizeProduct(prod, id) {
    // Normalize createdAt to ISO string
    let createdAtIso;
    try {
      if (prod.createdAt && typeof prod.createdAt.toDate === 'function') {
        createdAtIso = prod.createdAt.toDate().toISOString();
      } else if (typeof prod.createdAt === 'number') {
        createdAtIso = new Date(prod.createdAt).toISOString();
      } else if (typeof prod.createdAt === 'string') {
        const d = new Date(prod.createdAt);
        createdAtIso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      } else {
        createdAtIso = new Date().toISOString();
      }
    } catch (_) {
      createdAtIso = new Date().toISOString();
    }

    // Helper function to safely parse price
    const safeParsePrice = (price) => {
      if (price === null || price === undefined || price === '') {
        return 0;
      }
      
      let priceStr = String(price).replace(/[$₨₹€£¥]/g, '').trim();
      priceStr = priceStr.replace(/[,\s]/g, '');
      
      const numPrice = parseFloat(priceStr);
      return isNaN(numPrice) ? 0 : numPrice;
    };

    const normalizedPrice = safeParsePrice(prod.price);
    const normalizedOriginalPrice = safeParsePrice(prod.originalPrice || prod.price);

    return {
      id: id,
      name: prod.title || prod.name || 'Untitled Product',
      price: `$${normalizedPrice.toFixed(2)}`,
      originalPrice: `$${normalizedOriginalPrice.toFixed(2)}`,
      image: prod.imageData || prod.image || '',
      link: prod.link || '#',
      platform: prod.platform || 'amazon',
      category: prod.category || 'uncategorized',
      rating: isNaN(parseFloat(prod.rating)) ? 5 : parseFloat(prod.rating),
      reviews: isNaN(parseInt(prod.reviews)) ? 0 : parseInt(prod.reviews),
      description: prod.description || '',
      features: Array.isArray(prod.features) ? prod.features : [],
      discount: isNaN(parseInt(prod.discount)) ? 0 : parseInt(prod.discount),
      featured: Boolean(prod.featured),
      productReviews: prod.productReviews || this.generateRandomReviews(prod.title || prod.name || 'Product'),
      createdAt: createdAtIso
    };
  }

  // Generate random reviews for a product
  generateRandomReviews(productName) {
    const names = [
      'Emily Johnson', 'Michael Smith', 'Jessica Brown', 'David Miller', 'Ashley Wilson',
      'James Anderson', 'Sarah Lee', 'John Davis', 'Amanda Clark', 'Daniel Martinez'
    ];
    
    const reviewTemplates = [
      `Absolutely love my {product}! Highly recommended!`,
      `Great value for money. {product} exceeded my expectations!`,
      `Fast shipping and the quality is top-notch. Will buy again.`,
      `I was skeptical at first, but {product} is worth every penny.`,
      `Customer service was excellent and the product works perfectly.`
    ];
    
    const reviews = [];
    for (let i = 0; i < 3; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
      const review = template.replace('{product}', productName);
      
      reviews.push({
        name: name,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        comment: review,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return reviews;
  }
}

// Create global product state manager
const productStateManager = new ProductStateManager();
window.productStateManager = productStateManager;

// Global function to get product by ID
window.getProductById = function(id) {
  return productStateManager.getProductById(id);
};

// Simple product loading function
function loadProducts() {
  console.log('Loading products...');
  
  // If Firebase service is available, use it
  if (window.firebaseService && window.firebaseService.isConnected) {
    console.log('Using Firebase service for products');
    // Firebase service will automatically update products via real-time listener
  } else {
    console.log('Firebase not available, loading from cache');
    // Load from localStorage cache
    const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (cachedProducts.length > 0) {
      productStateManager.updateProducts(cachedProducts);
      window.products = productStateManager.getAllProducts();
      document.dispatchEvent(new Event('products-ready'));
    }
  }
}

// Initialize products when Firebase is ready
document.addEventListener('firebase-connected', () => {
  console.log('Firebase connected, products should be loading...');
});

document.addEventListener('products-ready', () => {
  console.log('Products ready event received');
  
  // Auto-render if function is available
  if (typeof window.autoRenderProducts === 'function') {
    window.autoRenderProducts();
  }

  // If there's a specific render function on the page, call it
  if (typeof renderProducts === 'function') {
    renderProducts();
  }
});

// Load products when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, loading products...');
  
  // Wait a bit for Firebase to initialize, then load products
  setTimeout(() => {
    loadProducts();
  }, 1000);
});

// Helper functions for backward compatibility
function getProductsByCategory(category) {
  return (window.products || []).filter(p => p.category === category);
}

function getFeaturedProducts() {
  const allProducts = window.products || [];
  const preExistingProducts = allProducts.filter(product => {
    return !product.submittedBy && !product.id?.toString().startsWith('local_');
  });
  
  return preExistingProducts.slice(0, 6);
}

function getProductsOnSale() {
  return (window.products || []).filter(p => p.discount > 0);
}

function searchProducts(query) {
  const term = query.toLowerCase();
  return (window.products || []).filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.description.toLowerCase().includes(term) ||
    (p.features || []).some(f => f.toLowerCase().includes(term))
  );
}

function getAllProductsIncludingUserSubmitted() {
  if (window.allProductsIncludingUserSubmitted) {
    return window.allProductsIncludingUserSubmitted;
  }
  
  try {
    const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
    if (allProducts.length > 0) {
      return allProducts;
    }
  } catch (e) {
    console.error('Error loading all products from localStorage:', e);
  }
  
  return window.products || [];
}

// Make functions globally available
window.getProductsByCategory = getProductsByCategory;
window.getFeaturedProducts = getFeaturedProducts;
window.getProductsOnSale = getProductsOnSale;
window.searchProducts = searchProducts;
window.getAllProductsIncludingUserSubmitted = getAllProductsIncludingUserSubmitted;

// Add example products if none exist (for testing)
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      if (!window.products || window.products.length === 0) {
        console.log('No products found, adding example products...');
        
        const exampleProducts = [
          {
            id: 'example-1',
            name: "Smart Phone",
            category: "electronics",
            price: 299.99,
            originalPrice: 399.99,
            image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
            description: "Latest smartphone with amazing features",
            features: ["High-Quality Camera", "Long Battery Life", "Fast Performance"],
            discount: 25,
            rating: 4.9,
            reviews: 45,
            link: "#",
            platform: "amazon"
          },
          {
            id: 'example-2',
            name: "Wireless Headphones",
            category: "electronics",
            price: 89.99,
            originalPrice: 129.99,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
            description: "Premium wireless headphones with noise cancellation",
            features: ["Noise Cancellation", "Long Battery Life", "Premium Sound"],
            discount: 31,
            rating: 4.7,
            reviews: 128,
            link: "#",
            platform: "amazon"
          }
        ];
        
        productStateManager.updateProducts(exampleProducts);
        window.products = productStateManager.getAllProducts();
        
        document.dispatchEvent(new Event('products-ready'));
      }
    }, 2000);
  });
}
