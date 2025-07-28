// Comprehensive Product Catalog for SmartDeals Pro - now with REAL-TIME Firebase Firestore

// Always expose an (initially empty) array so other scripts can reference it immediately
window.products = [];
let firestoreListener = null; // To track the real-time listener

// Load from local storage immediately to show products right away
const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
if (cachedProducts.length > 0) {
  window.products = cachedProducts.map((p, idx) => normalizeProduct(p, idx));
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
  return {
    id: prod.id || idx + 1,
    name: prod.title || prod.name,
    price: `$${parseFloat(prod.price || 0).toFixed(2)}`,
    originalPrice: `$${parseFloat(prod.originalPrice || prod.price || 0).toFixed(2)}`,
    image: prod.imageData || prod.image,
    link: prod.link,
    category: prod.category || 'uncategorized',
    rating: prod.rating || 5,
    reviews: prod.reviews || 0,
    description: prod.description || '',
    features: prod.features || [],
    discount: prod.discount || 0,
    featured: Boolean(prod.featured),
    productReviews: prod.productReviews || generateRandomReviews(prod.title || prod.name),
    createdAt: prod.createdAt || new Date().toISOString()
  };
}

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
        
        // Combine and deduplicate
        const combined = [...localProducts, ...firebaseProducts];
        const uniqueProducts = combined.filter((product, index, self) =>
          index === self.findIndex(p => p.id === product.id)
        );

        // Update global products array
        const previousCount = window.products.length;
        window.products = uniqueProducts.map((p, idx) => normalizeProduct(p, idx));
        
        console.log(`Products updated: ${previousCount} → ${window.products.length}`);
        
        // Notification functionality removed

        persistProductReviews();

        // Save to localStorage for caching
        localStorage.setItem('products', JSON.stringify(uniqueProducts));
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
          window.products = fallbackProducts.map((p, idx) => normalizeProduct(p, idx));
          document.dispatchEvent(new Event('products-ready'));
          if (typeof window.autoRenderProducts === 'function') {
            window.autoRenderProducts();
          }
        }
      }
    );
}

// Notification functionality removed

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

// Helper: Generate random reviews for a product
function generateRandomReviews(productName) {
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
        
        // Normalize and add to products array
        window.products = exampleProducts.map((p, idx) => normalizeProduct(p, idx));
        
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
