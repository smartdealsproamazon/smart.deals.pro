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
      this.products.push(normalizedProduct);
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

  // Update products from external source (Firebase, localStorage)
  updateProducts(newProducts) {
    this.products = [];
    this.productMap.clear();
    
    newProducts.forEach(product => {
      this.addProduct(product);
    });
    
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
      category: prod.category || 'uncategorized',
      rating: isNaN(parseFloat(prod.rating)) ? 5 : parseFloat(prod.rating),
      reviews: isNaN(parseInt(prod.reviews)) ? 0 : parseInt(prod.reviews),
      description: prod.description || '',
      features: Array.isArray(prod.features) ? prod.features : [],
      discount: isNaN(parseInt(prod.discount)) ? 0 : parseInt(prod.discount),
      featured: Boolean(prod.featured),
      productReviews: prod.productReviews || this.generateRandomReviews(prod.title || prod.name || 'Product'),
      createdAt: prod.createdAt || new Date().toISOString()
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
    const reviewCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 reviews
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
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      });
    }
    return reviews;
  }
}

// Create global product state manager
const productStateManager = new ProductStateManager();

// Always expose products array for backward compatibility
window.products = [];
let firestoreListener = null; // To track the real-time listener

// Load from local storage immediately to show products right away
const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
if (cachedProducts.length > 0) {
  productStateManager.updateProducts(cachedProducts);
  window.products = productStateManager.getAllProducts();
  console.log('Loaded cached products immediately:', window.products.length);
  // Dispatch event immediately for cached data
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
  // If the SDK is already present we can move on immediately
  if (window.firebase && firebase.firestore) {
    callback();
    return;
  }

  // Dynamically add the Firebase SDK scripts so we don't have to touch every HTML page
  const appScript = document.createElement('script');
  appScript.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js';
  appScript.onload = () => {
    const storeScript = document.createElement('script');
    storeScript.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js';
    storeScript.onload = callback;
    storeScript.onerror = () => {
      console.error('Failed to load Firebase Firestore SDK');
      // Still try to show cached products
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    };
    document.head.appendChild(storeScript);
  };
  appScript.onerror = () => {
    console.error('Failed to load Firebase App SDK');
    // Still try to show cached products
    if (typeof window.autoRenderProducts === 'function') {
      window.autoRenderProducts();
    }
  };
  document.head.appendChild(appScript);
}

// Real-time Firebase listener function
function setupRealtimeProductListener() {
  console.log('Setting up real-time Firebase listener...');
  
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

  // Set up real-time listener
  firestoreListener = db.collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        console.log('Real-time update received from Firebase:', snapshot.size, 'products');
        
        // Get Firebase products
        const firebaseProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get local products (if any)
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        
        // Combine and process through state manager
        const combined = [...localProducts, ...firebaseProducts];
        productStateManager.updateProducts(combined);
        
        // Update global products array for backward compatibility
        const previousCount = window.products.length;
        window.products = productStateManager.getAllProducts();
        
        console.log(`Products updated: ${previousCount} → ${window.products.length}`);
        
        // Save to localStorage for caching
        localStorage.setItem('products', JSON.stringify(window.products));
        localStorage.setItem('products_updated', Date.now().toString());

        // Notify any listeners
        document.dispatchEvent(new Event('products-updated'));
        document.dispatchEvent(new Event('products-ready'));

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
        console.error('Real-time listener error:', error);
        // Fallback to cached data
        if (window.products.length === 0) {
          const fallbackProducts = JSON.parse(localStorage.getItem('products') || '[]');
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

// Initialize real-time Firebase connection
function initProducts() {
  setupRealtimeProductListener();
}

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
  // Return the 6 most recently added products
  return (window.products || []).slice(0, 6);
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

// ---- Example Products for Category Testing ----
// These are example products to demonstrate the category filtering functionality
// In a real environment, products would come from Firebase Firestore

// Add example products if none exist (for testing/demonstration purposes)
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Firebase to load, then add examples if no products exist
    setTimeout(() => {
      if (!window.products || window.products.length === 0) {
        console.log('No products found, adding example products for demonstration...');
        
        const exampleProducts = [
          {
            id: 'boys-1',
            name: "Blue Boys T-Shirt",
            category: "boys",
            price: 19.99,
            originalPrice: 24.99,
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
            description: "Comfortable cotton t-shirt for boys",
            features: ["100% Cotton", "Machine Washable", "Comfortable Fit"],
            discount: 20,
            rating: 4.5,
            reviews: 15,
            link: "#"
          },
          {
            id: 'boys-2',
            name: "Boys Denim Jeans",
            category: "boys",
            price: 39.99,
            originalPrice: 49.99,
            image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop",
            description: "Durable denim jeans for active boys",
            features: ["Durable Denim", "Adjustable Waist", "Classic Fit"],
            discount: 20,
            rating: 4.7,
            reviews: 22,
            link: "#"
          },
          {
            id: 'girls-1',
            name: "Pink Girls Dress",
            category: "girls",
            price: 29.99,
            originalPrice: 39.99,
            image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=300&h=300&fit=crop",
            description: "Beautiful pink dress perfect for special occasions",
            features: ["Soft Fabric", "Elegant Design", "Perfect for Parties"],
            discount: 25,
            rating: 4.8,
            reviews: 18,
            link: "#"
          },
          {
            id: 'girls-2',
            name: "Girls Fashion Leggings",
            category: "girls",
            price: 15.99,
            originalPrice: 19.99,
            image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop",
            description: "Comfortable and stylish leggings for girls",
            features: ["Stretchy Material", "Comfortable Waistband", "Multiple Colors"],
            discount: 20,
            rating: 4.6,
            reviews: 12,
            link: "#"
          },
          {
            id: 'electronic-1',
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
            link: "#"
          }
        ];
        
        // Add through state manager to ensure proper ID handling
        productStateManager.updateProducts(exampleProducts);
        window.products = productStateManager.getAllProducts();
        
        console.log(`Added ${exampleProducts.length} example products`);
        console.log('Example products by category:');
        const categories = [...new Set(window.products.map(p => p.category))];
        categories.forEach(cat => {
          const count = window.products.filter(p => p.category === cat).length;
          console.log(`- ${cat}: ${count} products`);
        });
        
        // Trigger rendering
        document.dispatchEvent(new Event('products-ready'));
        if (typeof window.autoRenderProducts === 'function') {
          window.autoRenderProducts();
        }
      }
    }, 2000); // Wait 2 seconds for Firebase
  });
}
