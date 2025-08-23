// Comprehensive Product Catalog for SmartDeals Pro - now with REAL-TIME Firebase Firestore

// Product State Management System
class ProductStateManager {
  constructor() {
    this.products = [];
    this.productMap = new Map();
    this.listeners = [];
  }

  // Generate a unique, consistent ID for products
  generateProductId(product) {
    // If product already has a valid ID, use it
    if (product.id && typeof product.id === 'string' && product.id.length > 0) {
      return product.id;
    }
    
    // Generate UUID based on product data to ensure consistency
    const data = (product.title || product.name || '') + 
                 (product.link || '') + 
                 (product.category || '') + 
                 (product.price || '');
    
    // Simple UUID-like generation based on content hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    const hashStr = Math.abs(hash).toString(36);
    return `prod_${hashStr}_${timestamp}`;
  }

  // Add or update a product in the state
  addProduct(productData) {
    const id = this.generateProductId(productData);
    const normalizedProduct = this.normalizeProduct(productData, id);
    
    // Update in array
    const existingIndex = this.products.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
      this.products[existingIndex] = normalizedProduct;
    } else {
      // Add new product to the beginning (most recent first)
      this.products.unshift(normalizedProduct);
    }
    
    // Update in map for fast lookup
    this.productMap.set(id, normalizedProduct);
    
    return normalizedProduct;
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

  // Get maximum allowed products (for reviews page only)
  getMaxProductsForReviews() {
    return 20;
  }

  // Check if at product limit (for reviews page only)
  isAtProductLimitForReviews() {
    return this.products.length >= this.getMaxProductsForReviews();
  }

  // Update products from external source (Firebase, localStorage)
  updateProducts(newProducts) {
    this.products = [];
    this.productMap.clear();
    
    const toJsDate = (val) => {
      try {
        if (!val) return new Date(0);
        if (typeof val?.toDate === 'function') return val.toDate(); // Firestore Timestamp
        if (typeof val === 'number') return new Date(val);
        if (typeof val === 'string') return new Date(val);
        return new Date(0);
      } catch (_) {
        return new Date(0);
      }
    };
    
    // Sort products by creation date (newest first) before adding
    const sortedProducts = newProducts.sort((a, b) => {
      const dateA = toJsDate(a.createdAt);
      const dateB = toJsDate(b.createdAt);
      return dateB - dateA;
    });
    
    // Add all products (no global limit)
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
    // Normalize createdAt to ISO string for consistent sorting/rendering
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
      
      // Convert to string and remove currency symbols
      let priceStr = String(price).replace(/[$₨₹€£¥]/g, '').trim();
      
      // Handle common price formats
      priceStr = priceStr.replace(/[,\s]/g, ''); // Remove commas and spaces
      
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
      'James Anderson', 'Sarah Lee', 'John Davis', 'Amanda Clark', 'Daniel Martinez',
      'Olivia Harris', 'Matthew Lewis', 'Sophia Young', 'Benjamin Hall', 'Ava King',
      'William Wright', 'Mia Scott', 'Ethan Green', 'Isabella Adams', 'Alexander Baker'
    ];
    const reviewTemplates = [
      `Absolutely love my {product}! Highly recommended for anyone in the USA!`,
      `Great value for money. {product} exceeded my expectations!`,
      `Fast shipping and the quality is top-notch. Will buy again.`,
      `I was skeptical at first, but {product} is worth every penny.`,
      `Customer service was excellent and the product works perfectly.`,
      `This is the best {product} I've ever used.`,
      `My family and friends are impressed with my new {product}.`,
      `Five stars! Will recommend to everyone.`,
      `The design and features are amazing.`,
      `Perfect for my needs. Thank you!`
    ];
    const reviewCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 reviews (reduced from 3-4)
    const usedNames = [];
    const reviews = [];
    for (let i = 0; i < reviewCount; i++) {
      let name;
      do {
        name = names[Math.floor(Math.random() * names.length)];
      } while (usedNames.includes(name));
      usedNames.push(name);
      const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
      reviews.push({
        name,
        text: template.replace('{product}', productName),
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        timestamp: Date.now() - Math.floor(Math.random() * 10000000000) // Add timestamp for sorting
      });
    }
    return reviews;
  }

  // Add a new review to a product with automatic limit management
  addReviewToProduct(productId, reviewData) {
    const product = this.getProductById(productId);
    if (!product) {
      console.error('Product not found:', productId);
      return false;
    }

    // Ensure productReviews array exists
    if (!product.productReviews) {
      product.productReviews = [];
    }

    // Create new review with timestamp
    const newReview = {
      name: reviewData.name,
      text: reviewData.text,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      timestamp: Date.now()
    };

    // Add new review to the beginning of the array (most recent first)
    product.productReviews.unshift(newReview);

    // Maintain maximum of 5 reviews per product
    const MAX_REVIEWS = 5;
    if (product.productReviews.length > MAX_REVIEWS) {
      // Remove oldest reviews (from the end of array)
      product.productReviews = product.productReviews.slice(0, MAX_REVIEWS);
    }

    // Update the product in our state
    this.addProduct(product);
    
    // Persist changes
    persistProductReviews();
    
    return true;
  }
}

// Create global product state manager
const productStateManager = new ProductStateManager();

// Global function to add a review to any product
function addProductReview(productId, reviewData) {
  return productStateManager.addReviewToProduct(productId, reviewData);
}

// Global function to get reviews for a product
function getProductReviews(productId) {
  const product = productStateManager.getProductById(productId);
  return product ? product.productReviews || [] : [];
}

// Global function to get current product count
function getProductCount() {
  return productStateManager.getProductCount();
}

// Global function to check if at product limit (for reviews page only)
function isAtProductLimitForReviews() {
  return productStateManager.isAtProductLimitForReviews();
}

// Global function to get max products allowed (for reviews page only)
function getMaxProductsForReviews() {
  return productStateManager.getMaxProductsForReviews();
}

// Always expose products array for backward compatibility
window.products = [];
let firestoreListener = null; // To track the real-time listener

// Load from local storage immediately to show products right away
const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
const cachedAllProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');

if (cachedProducts.length > 0) {
  productStateManager.updateProducts(cachedProducts);
  window.products = productStateManager.getAllProducts();
  console.log('Loaded cached products immediately:', window.products.length);
}

if (cachedAllProducts.length > 0) {
  window.allProductsIncludingUserSubmitted = cachedAllProducts;
  console.log('Loaded cached all products immediately:', window.allProductsIncludingUserSubmitted.length);
}

// Dispatch event immediately for cached data
if (cachedProducts.length > 0 || cachedAllProducts.length > 0) {
  setTimeout(() => {
    document.dispatchEvent(new Event('products-ready'));
    if (typeof window.autoRenderProducts === 'function') {
      window.autoRenderProducts();
    }
  }, 100);
}

// --- 1. Helpers ------------------------------------------------------------
function normalizeProduct(prod, idx = 0) {
  // Use product state manager for consistent normalization
  return productStateManager.addProduct(prod);
}

// Global function to get product by ID (for use by other scripts)
window.getProductById = function(id) {
  return productStateManager.getProductById(id);
};

function loadFirebase(callback) {
  // If Firebase Optimizer is available and ready, use it
  if (window.firebaseOptimizer && window.firebaseOptimizer.isInitialized) {
    console.log('Firebase Optimizer already available, proceeding...');
    callback();
    return;
  }
  
  // If the SDK is already present we can move on immediately
  if (window.firebase && firebase.firestore) {
    console.log('Firebase SDK already loaded, proceeding...');
    callback();
    return;
  }

  // Show cached products immediately while Firebase loads
  const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
  if (cachedProducts.length > 0) {
    console.log('Loading cached products immediately...');
    productStateManager.updateProducts(cachedProducts);
    window.products = productStateManager.getAllProducts();
    document.dispatchEvent(new Event('products-ready'));
  }

  // Wait for Firebase Optimizer to be ready
  if (window.firebaseOptimizer) {
    console.log('Waiting for Firebase Optimizer to be ready...');
    const waitForOptimizer = () => {
      if (window.firebaseOptimizer && window.firebaseOptimizer.isInitialized) {
        console.log('Firebase Optimizer ready, proceeding...');
        callback();
      } else {
        setTimeout(waitForOptimizer, 100);
      }
    };
    waitForOptimizer();
    return;
  }

  // Load Firebase SDK in parallel with a longer timeout for better reliability
  const loadTimeout = setTimeout(() => {
    console.warn('Firebase loading timeout - using cached data only');
    // Show cached products immediately
    const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (cachedProducts.length > 0) {
      productStateManager.updateProducts(cachedProducts);
      window.products = productStateManager.getAllProducts();
      document.dispatchEvent(new Event('products-ready'));
    }
    if (typeof window.autoRenderProducts === 'function') {
      window.autoRenderProducts();
    }
  }, 8000); // Increased timeout from 2s to 8s for better reliability

  // Dynamically add the Firebase SDK scripts with faster CDN
  const appScript = document.createElement('script');
  appScript.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js';
  appScript.onload = () => {
    const storeScript = document.createElement('script');
    storeScript.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js';
    storeScript.onload = () => {
      clearTimeout(loadTimeout);
      console.log('Firebase SDK loaded successfully');
      callback();
    };
    storeScript.onerror = () => {
      clearTimeout(loadTimeout);
      console.error('Failed to load Firebase Firestore SDK');
      // Still try to show cached products
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    };
    document.head.appendChild(storeScript);
  };
  appScript.onerror = () => {
    clearTimeout(loadTimeout);
    console.error('Failed to load Firebase App SDK');
    // Still try to show cached products
    if (typeof window.autoRenderProducts === 'function') {
      window.autoRenderProducts();
    }
  };
  document.head.appendChild(appScript);
}

// Real-time Firebase listener function with improved connection handling
function connectToFirebase() {
  console.log('Attempting Firebase connection...');
  
  // Use a longer timeout for the initial connection
  const connectionTimeout = setTimeout(() => {
    console.warn('Firebase connection timeout - proceeding with cached data');
    // Load cached products immediately
    const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (cachedProducts.length > 0) {
      productStateManager.updateProducts(cachedProducts);
      window.products = productStateManager.getAllProducts();
      document.dispatchEvent(new Event('products-ready'));
    }
    document.dispatchEvent(new Event('firebase-timeout'));
  }, 5000); // Increased timeout from 800ms to 5s for more reliable connections
  
  // Fallback to original Firebase setup if Firebase Optimizer is not available
  console.log('Firebase Optimizer not available, using fallback setup...');
  
  const firebaseConfig = {
    apiKey: "AIzaSyBJqBEWDdBlfv5xAjgcvqput1KC1NzKvlU",
    authDomain: "smart-deals-pro.firebaseapp.com",
    projectId: "smart-deals-pro",
    storageBucket: "smart-deals-pro.firebasestorage.app",
    messagingSenderId: "680016915696",
    appId: "1:680016915696:web:4b3721313ea0e2e3342635",
    measurementId: "G-HV5N0LQJTG"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  // Enable offline persistence for faster loading
  try {
    db.enablePersistence({ synchronizeTabs: true });
    console.log('Firebase offline persistence enabled');
  } catch (err) {
    console.warn('Firebase persistence failed:', err);
  }

  // Set up real-time listener with optimized query
  firestoreListener = db.collection('products')
    .orderBy('createdAt', 'desc')
    .limit(50) // Limit initial load for faster performance
    .onSnapshot(
      (snapshot) => {
        clearTimeout(connectionTimeout);
        console.log('Firebase connected! Received', snapshot.size, 'products');
        
        // Get Firebase products
        const firebaseProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter out user-submitted products for homepage display
        // User-submitted products should only appear on marketplace page
        const filteredFirebaseProducts = firebaseProducts.filter(product => {
          // Exclude products that were submitted by users (have submittedBy field)
          // or have local_ prefix in ID (locally stored user submissions)
          return !product.submittedBy && !product.id?.toString().startsWith('local_');
        });
        
        let allProducts = filteredFirebaseProducts;
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        
        // Filter local products as well
        const filteredLocalProducts = localProducts.filter(product => {
          return !product.submittedBy && !product.id?.toString().startsWith('local_');
        });
        
        // If we have cached products and Firebase is empty, keep cached (filtered)
        if (filteredFirebaseProducts.length === 0 && filteredLocalProducts.length > 0) {
          allProducts = filteredLocalProducts;
        } else if (filteredFirebaseProducts.length > 0) {
          // Merge Firebase with any additional local products (both filtered)
          const firebaseIds = new Set(filteredFirebaseProducts.map(p => p.id));
          const additionalLocal = filteredLocalProducts.filter(p => !firebaseIds.has(p.id));
          allProducts = [...filteredFirebaseProducts, ...additionalLocal];
        }
        
        productStateManager.updateProducts(allProducts);
        
        // Update global products array for backward compatibility
        const previousCount = window.products?.length || 0;
        window.products = productStateManager.getAllProducts();
        
        // Also maintain a separate array with ALL products (including user-submitted) for marketplace
        window.allProductsIncludingUserSubmitted = firebaseProducts; // Full unfiltered list
        
        console.log(`Products updated: ${previousCount} → ${window.products.length}`);
        console.log(`All products (including user-submitted): ${window.allProductsIncludingUserSubmitted.length}`);
        
        // Save filtered products to localStorage for caching (homepage)
        localStorage.setItem('products', JSON.stringify(window.products));
        // Save all products for marketplace
        localStorage.setItem('allProducts', JSON.stringify(window.allProductsIncludingUserSubmitted));
        localStorage.setItem('products_updated', Date.now().toString());

        // Notify any listeners
        document.dispatchEvent(new Event('products-updated'));
        document.dispatchEvent(new Event('products-ready'));
        document.dispatchEvent(new Event('firebase-connected'));

        // Auto-render if function is available
        if (typeof window.autoRenderProducts === 'function') {
          window.autoRenderProducts();
        }

        // If there's a specific render function on the page, call it
        if (typeof renderProducts === 'function') {
          renderProducts();
        }
      },
      (error) => {
        clearTimeout(connectionTimeout);
        console.error('Firebase listener error:', error);
        document.dispatchEvent(new Event('firebase-error'));
        
        // Fallback to cached data
        const fallbackProducts = JSON.parse(localStorage.getItem('products') || '[]');
        if (fallbackProducts.length > 0) {
          productStateManager.updateProducts(fallbackProducts);
          window.products = productStateManager.getAllProducts();
          document.dispatchEvent(new Event('products-ready'));
          if (typeof window.autoRenderProducts === 'function') {
            window.autoRenderProducts();
          }
        }
      }
    );
}

// Global function to reinitialize Firebase connection (for retry mechanisms)
window.initializeFirebaseConnection = function() {
  console.log('Reinitializing Firebase connection...');
  if (typeof connectToFirebase === 'function') {
    connectToFirebase();
  }
};

// Initialize real-time Firebase connection
function initProducts() {
  connectToFirebase();
}

// Automatically initialize products when script loads
(function() {
  console.log('Products.js loaded, auto-initializing...');
  
  // Load cached products immediately for faster display
  const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
  if (cachedProducts.length > 0) {
    console.log('Loading cached products immediately:', cachedProducts.length);
    productStateManager.updateProducts(cachedProducts);
    window.products = productStateManager.getAllProducts();
    document.dispatchEvent(new Event('products-ready'));
  }
  
  // Start Firebase connection
  initProducts();
  
  // Fallback: If no products after 3 seconds, load example products
  setTimeout(() => {
    if (!window.products || window.products.length === 0) {
      console.log('No products loaded, adding example products for demonstration...');
      
      const exampleProducts = [
        {
          id: 'boys-1',
          name: "Blue Boys T-Shirt",
          category: "boys",
          price: "$19.99",
          originalPrice: "$29.99",
          discount: 33,
          platform: "Amazon",
          affiliate: true,
          image: "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?w=300&h=300&fit=crop",
          link: "#",
          submissionDate: new Date().toISOString(),
          createdAt: new Date()
        },
        {
          id: 'girls-1',
          name: "Pink Girls Dress",
          category: "girls-fashion",
          price: "$24.99",
          originalPrice: "$39.99",
          discount: 38,
          platform: "Amazon",
          affiliate: true,
          image: "https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=300&h=300&fit=crop",
          link: "#",
          submissionDate: new Date().toISOString(),
          createdAt: new Date()
        },
        {
          id: 'tech-1',
          name: "Wireless Bluetooth Headphones",
          category: "electronics",
          price: "$49.99",
          originalPrice: "$79.99",
          discount: 38,
          platform: "Amazon",
          affiliate: true,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
          link: "#",
          submissionDate: new Date().toISOString(),
          createdAt: new Date()
        },
        {
          id: 'watch-1',
          name: "Smartwatch Pro",
          category: "smartwatches",
          price: "$199.99",
          originalPrice: "$299.99",
          discount: 33,
          platform: "Amazon",
          affiliate: true,
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
          link: "#",
          submissionDate: new Date().toISOString(),
          createdAt: new Date()
        },
        {
          id: 'home-1',
          name: "Smart Home Device",
          category: "home-garden",
          price: "$89.99",
          originalPrice: "$119.99",
          discount: 25,
          platform: "Amazon",
          affiliate: true,
          image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop",
          link: "#",
          submissionDate: new Date().toISOString(),
          createdAt: new Date()
        }
      ];
      
      // Add through state manager to ensure proper ID handling
      productStateManager.updateProducts(exampleProducts);
      window.products = productStateManager.getAllProducts();
      
      // Save to localStorage for future use
      localStorage.setItem('products', JSON.stringify(window.products));
      
      // Trigger rendering
      document.dispatchEvent(new Event('products-ready'));
      console.log('Example products loaded:', window.products.length);
    }
  }, 3000);
})();

// Check if cached data is fresh (less than 1 hour old)
function shouldRefreshCache() {
  const lastUpdated = localStorage.getItem('products_updated');
  if (!lastUpdated) return true;
  
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  return (Date.now() - parseInt(lastUpdated)) > oneHour;
}

// Always load Firebase for real-time updates, but show cached data immediately
loadFirebase(initProducts);

// Cleanup function to remove listener when page unloads
window.addEventListener('beforeunload', () => {
  if (firestoreListener) {
    console.log('Cleaning up Firebase listener...');
    firestoreListener();
  }
});

// After window.products is set/updated, persist reviews for all products
function persistProductReviews() {
  if (!window.products) return;
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  window.products.forEach((p, idx) => {
    if (!products[idx]) return;
    products[idx].productReviews = p.productReviews;
  });
  localStorage.setItem('products', JSON.stringify(products));
}

// ----------------- Existing helper APIs (still required by the rest of the code) --------------
function getProductsByCategory(category) {
  return (window.products || []).filter(p => p.category === category);
}

function getFeaturedProducts() {
  // Return only pre-existing featured products, exclude user-submitted products
  // User-submitted products should only appear on marketplace page
  const allProducts = window.products || [];
  const preExistingProducts = allProducts.filter(product => {
    // Exclude products that were submitted by users (have submittedBy field)
    // or have local_ prefix in ID (locally stored user submissions)
    return !product.submittedBy && !product.id?.toString().startsWith('local_');
  });
  
  // Return the 6 most recently added pre-existing products
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

// Function to get all products including user-submitted ones (for marketplace page)
function getAllProductsIncludingUserSubmitted() {
  // This function is specifically for marketplace page to show ALL products
  if (window.allProductsIncludingUserSubmitted) {
    return window.allProductsIncludingUserSubmitted;
  }
  
  // Fallback to localStorage if not loaded yet
  try {
    const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
    if (allProducts.length > 0) {
      return allProducts;
    }
  } catch (e) {
    console.error('Error loading all products from localStorage:', e);
  }
  
  // Final fallback to regular products
  return window.products || [];
}

// Make this function globally available
window.getAllProductsIncludingUserSubmitted = getAllProductsIncludingUserSubmitted;

// ---- Example Products for Category Testing ----
// These are example products to demonstrate the category filtering functionality
// In a real environment, products would come from Firebase Firestore

// Removed: Duplicate example products loading - now handled in auto-initialization above
