// Comprehensive Product Catalog for SmartDeals Pro - now with REAL-TIME Firebase Firestore

// Product State Management System
class ProductStateManager {
  constructor() {
    this.products = [];
    this.productMap = new Map();
    this.listeners = [];
    this.firebaseConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
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
    const sortedProducts = newProducts
      .map(product => ({
        ...product,
        createdAt: toJsDate(product.createdAt),
        submissionDate: toJsDate(product.submissionDate)
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    sortedProducts.forEach(product => {
      const id = this.generateProductId(product);
      const normalizedProduct = this.normalizeProduct(product, id);
      this.products.push(normalizedProduct);
      this.productMap.set(id, normalizedProduct);
    });
  }

  // Normalize product data structure
  normalizeProduct(productData, id) {
    return {
      id: id,
      name: productData.name || productData.title || 'Untitled Product',
      title: productData.title || productData.name || 'Untitled Product',
      price: productData.price || '$0.00',
      originalPrice: productData.originalPrice || productData.price || '$0.00',
      discount: productData.discount || 0,
      category: productData.category || 'uncategorized',
      platform: productData.platform || 'Amazon',
      affiliate: productData.affiliate !== false,
      image: productData.image || 'https://via.placeholder.com/300x300?text=Product+Image',
      link: productData.link || '#',
      description: productData.description || '',
      features: productData.features || [],
      rating: productData.rating || 4.5,
      reviews: productData.reviews || 0,
      submissionDate: productData.submissionDate || new Date().toISOString(),
      createdAt: productData.createdAt || new Date(),
      submittedBy: productData.submittedBy || null,
      status: productData.status || 'active',
      views: productData.views || 0,
      clicks: productData.clicks || 0
    };
  }

  // Add listener for product updates
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.products);
      } catch (error) {
        console.error('Error in product listener:', error);
      }
    });
  }

  // Mark Firebase as connected
  setFirebaseConnected(connected) {
    this.firebaseConnected = connected;
    console.log(`Firebase connection status: ${connected ? 'Connected' : 'Disconnected'}`);
  }

  // Check if Firebase is connected
  isFirebaseConnected() {
    return this.firebaseConnected;
  }

  // Increment connection attempts
  incrementConnectionAttempts() {
    this.connectionAttempts++;
    return this.connectionAttempts;
  }

  // Reset connection attempts
  resetConnectionAttempts() {
    this.connectionAttempts = 0;
  }

  // Check if max connection attempts reached
  hasReachedMaxAttempts() {
    return this.connectionAttempts >= this.maxConnectionAttempts;
  }
}

// Create global product state manager
const productStateManager = new ProductStateManager();

// Firebase connection variables
let firestoreListener = null;
let connectionTimeout = null;

// Connect to Firebase with improved error handling and retry logic
function connectToFirebase() {
  console.log('Connecting to Firebase...');
  
  // Increment connection attempts
  const attempts = productStateManager.incrementConnectionAttempts();
  console.log(`Firebase connection attempt ${attempts}/${productStateManager.maxConnectionAttempts}`);
  
  // Check if we've reached max attempts
  if (productStateManager.hasReachedMaxAttempts()) {
    console.error('Max Firebase connection attempts reached. Using cached data only.');
    loadCachedProducts();
    return;
  }

  // Set connection timeout
  connectionTimeout = setTimeout(() => {
    console.warn('Firebase connection timeout. Retrying...');
    setTimeout(connectToFirebase, 2000);
  }, 10000);

  // Wait for Firebase to be available
  if (typeof firebase === 'undefined') {
    console.log('Firebase not loaded yet, waiting...');
    setTimeout(connectToFirebase, 1000);
    return;
  }

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBJqBEWDdBlfv5xAjgcvqput1KC1NzKvlU",
    authDomain: "smart-deals-pro.firebaseapp.com",
    projectId: "smart-deals-pro",
    storageBucket: "smart-deals-pro.firebasestorage.app",
    messagingSenderId: "680016915696",
    appId: "1:680016915696:web:4b3721313ea0e2e3342635",
    measurementId: "G-HV5N0LQJTG"
  };

  try {
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
      .limit(100) // Increased limit for better product coverage
      .onSnapshot(
        (snapshot) => {
          clearTimeout(connectionTimeout);
          productStateManager.setFirebaseConnected(true);
          productStateManager.resetConnectionAttempts();
          
          console.log('Firebase connected! Received', snapshot.size, 'products');
          
          // Get Firebase products
          const firebaseProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Include all products for display - both admin and user-submitted
          // Note: Previously user-submitted products were filtered out, but now we show all products
          const filteredFirebaseProducts = firebaseProducts.filter(product => {
            // Only exclude demo/test products, not user-submitted ones
            return !product.id?.toString().startsWith('local_') && 
                   !product.title?.includes('Demo') && 
                   !product.title?.includes('Test') &&
                   !product.name?.includes('Demo') && 
                   !product.name?.includes('Test');
          });
          
          let allProducts = filteredFirebaseProducts;
          const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
          
          // Filter local products as well - include user-submitted products
          const filteredLocalProducts = localProducts.filter(product => {
            return !product.id?.toString().startsWith('local_') && 
                   !product.title?.includes('Demo') && 
                   !product.title?.includes('Test') &&
                   !product.name?.includes('Demo') && 
                   !product.name?.includes('Test');
          });
          
          // If we have Firebase products, use them (don't fall back to demo)
          if (filteredFirebaseProducts.length > 0) {
            allProducts = filteredFirebaseProducts;
            console.log(`Using ${filteredFirebaseProducts.length} real Firebase products`);
          } else if (filteredLocalProducts.length > 0) {
            // Only use cached products if they're not demo products
            const nonDemoProducts = filteredLocalProducts.filter(product => 
              !product.name?.includes('Demo') && 
              !product.name?.includes('Example') &&
              !product.title?.includes('Demo') &&
              !product.title?.includes('Example') &&
              !product.id?.includes('prod_sample_') &&
              !product.id?.includes('demo_') &&
              product.link !== '#'
            );
            if (nonDemoProducts.length > 0) {
              allProducts = nonDemoProducts;
              console.log(`Using ${nonDemoProducts.length} cached non-demo products`);
            } else {
              console.log('No real products found, will show empty state');
              allProducts = [];
            }
          } else {
            console.log('No products found in Firebase or cache');
            allProducts = [];
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
          productStateManager.setFirebaseConnected(false);
          document.dispatchEvent(new Event('firebase-error'));
          
          // Retry connection after delay
          setTimeout(() => {
            if (!productStateManager.hasReachedMaxAttempts()) {
              connectToFirebase();
            } else {
              loadCachedProducts();
            }
          }, 3000);
        }
      );
  } catch (error) {
    clearTimeout(connectionTimeout);
    console.error('Firebase initialization error:', error);
    productStateManager.setFirebaseConnected(false);
    
    // Retry connection after delay
    setTimeout(() => {
      if (!productStateManager.hasReachedMaxAttempts()) {
        connectToFirebase();
      } else {
        loadCachedProducts();
      }
    }, 3000);
  }
}

// Load cached products (non-demo only)
function loadCachedProducts() {
  console.log('Loading cached products...');
  const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
  
  // Filter out demo products from cache
  const nonDemoProducts = cachedProducts.filter(product => 
    !product.name?.includes('Demo') && 
    !product.name?.includes('Example') &&
    !product.title?.includes('Demo') &&
    !product.title?.includes('Example') &&
    !product.id?.includes('prod_sample_') &&
    !product.id?.includes('demo_') &&
    product.link !== '#'
  );
  
  if (nonDemoProducts.length > 0) {
    productStateManager.updateProducts(nonDemoProducts);
    window.products = productStateManager.getAllProducts();
    console.log(`Loaded ${nonDemoProducts.length} cached non-demo products`);
  } else {
    console.log('No non-demo products in cache, showing empty state');
    window.products = [];
  }
  
  document.dispatchEvent(new Event('products-ready'));
  
  // Auto-render if function is available
  if (typeof window.autoRenderProducts === 'function') {
    window.autoRenderProducts();
  }
}

// Global function to add a review to any product
function addProductReview(productId, reviewData) {
  const product = productStateManager.getProductById(productId);
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
  productStateManager.addProduct(product);
  
  // Persist changes
  persistProductReviews();
  
  return true;
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
  
  // Dynamic timeout based on session type - longer for fresh sessions
  const checkFreshSession = () => {
    const hasAnyProducts = localStorage.getItem('products');
    const hasAnyCache = localStorage.getItem('allProducts');
    const hasTimestamp = localStorage.getItem('products_updated');
    return !hasAnyProducts && !hasAnyCache && !hasTimestamp;
  };
  
  const isFreshSession = checkFreshSession();
  const connectionTimeoutDuration = isFreshSession ? 8000 : 5000; // 8s for fresh, 5s for normal
  
  console.log(`Setting Firebase connection timeout: ${connectionTimeoutDuration}ms ${isFreshSession ? '(fresh session)' : '(cached session)'}`);
  
  const connectionTimeout = setTimeout(() => {
    console.warn(`Firebase connection timeout after ${connectionTimeoutDuration}ms - proceeding with cached data`);
    // Load cached products immediately
    const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (cachedProducts.length > 0) {
      productStateManager.updateProducts(cachedProducts);
      window.products = productStateManager.getAllProducts();
      document.dispatchEvent(new Event('products-ready'));
    }
    document.dispatchEvent(new Event('firebase-timeout'));
  }, connectionTimeoutDuration);
  
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

        // Include all products for display - both admin and user-submitted
        // Note: Previously user-submitted products were filtered out, but now we show all products
        const filteredFirebaseProducts = firebaseProducts.filter(product => {
          // Only exclude demo/test products, not user-submitted ones
          return !product.id?.toString().startsWith('local_') && 
                 !product.title?.includes('Demo') && 
                 !product.title?.includes('Test') &&
                 !product.name?.includes('Demo') && 
                 !product.name?.includes('Test');
        });
        
        let allProducts = filteredFirebaseProducts;
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        
        // Filter local products as well - include user-submitted products
        const filteredLocalProducts = localProducts.filter(product => {
          return !product.id?.toString().startsWith('local_') && 
                 !product.title?.includes('Demo') && 
                 !product.title?.includes('Test') &&
                 !product.name?.includes('Demo') && 
                 !product.name?.includes('Test');
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
  
  // Enhanced Firebase loading timeout - longer for fresh sessions
  const checkFreshSession = () => {
    const hasAnyProducts = localStorage.getItem('products');
    const hasAnyCache = localStorage.getItem('allProducts');
    const hasTimestamp = localStorage.getItem('products_updated');
    return !hasAnyProducts && !hasAnyCache && !hasTimestamp;
  };
  
  const isFreshSession = checkFreshSession();
  const timeoutDuration = isFreshSession ? 10000 : 5000; // 10s for fresh, 5s for normal
  
  console.log(`Setting Firebase timeout: ${timeoutDuration}ms ${isFreshSession ? '(fresh session)' : '(cached session)'}`);
  
  setTimeout(() => {
    if (!window.products || window.products.length === 0) {
      console.log(`No real products loaded after ${timeoutDuration}ms timeout, showing empty state instead of demo products`);
      window.products = [];
      document.dispatchEvent(new Event('products-ready'));
      
      // Auto-render if function is available
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    }
  }, timeoutDuration);
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
  // Return the newest REAL products from Firebase database only
  const allProducts = window.products || [];
  
  // Filter to only show genuine products (exclude all demo/sample/test products)
  const realProducts = allProducts.filter(product => {
    // Only include products that are genuine (not demo, sample, or test)
    return product && 
           product.name && 
           product.image && 
           !product.id?.toString().startsWith('demo_') && 
           !product.id?.toString().startsWith('sample_') && 
           !product.id?.toString().startsWith('prod_sample_') && 
           !product.title?.includes('Demo') && 
           !product.title?.includes('Test') &&
           !product.title?.includes('Sample') &&
           !product.name?.includes('Demo') && 
           !product.name?.includes('Test') &&
           !product.name?.includes('Sample') &&
           !product.name?.includes('Example') &&
           product.link !== '#' && // Exclude products with placeholder links
           !product.image?.includes('placeholder') && // Exclude placeholder images
           !product.image?.includes('via.placeholder.com'); // Exclude placeholder.com images
  });
  
  // Sort by creation date (newest first) and return the top 6
  const sortedProducts = realProducts.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  console.log(`Showing ${sortedProducts.length} real products in featured section`);
  return sortedProducts.slice(0, 6);
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
