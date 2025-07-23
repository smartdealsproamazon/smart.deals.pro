// Comprehensive Product Catalog for SmartDeals Pro - now backed by Firebase Firestore

// Always expose an (initially empty) array so other scripts can reference it immediately
window.products = [];

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
    productReviews: prod.productReviews || generateRandomReviews(prod.title || prod.name)
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

function initProducts() {
  // TODO: Replace the placeholder values with your own Firebase project credentials
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

  // Set a timeout for Firebase loading
  const timeoutId = setTimeout(() => {
    console.warn('Firebase taking too long, using cached data only');
    if (window.products.length === 0) {
      const fallbackProducts = JSON.parse(localStorage.getItem('products') || '[]');
      window.products = fallbackProducts.map((p, idx) => normalizeProduct(p, idx));
      document.dispatchEvent(new Event('products-ready'));
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    }
  }, 3000); // 3 second timeout

  db.collection('products').orderBy('createdAt', 'desc').get()
    .then(snapshot => {
      clearTimeout(timeoutId);
      const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const local = JSON.parse(localStorage.getItem('products') || '[]');
      const combined = [...local, ...remote];

      // Remove duplicates based on ID
      const uniqueProducts = combined.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      window.products = uniqueProducts.map((p, idx) => normalizeProduct(p, idx));
      persistProductReviews();

      // Save to localStorage for next time
      localStorage.setItem('products', JSON.stringify(uniqueProducts));
      localStorage.setItem('products_updated', Date.now().toString());

      console.log('Updated products from Firebase:', window.products.length);

      // Notify any listeners (render.js for example)
      document.dispatchEvent(new Event('products-ready'));

      // If a rendering helper is already available, invoke it immediately so the UI updates
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    })
    .catch(err => {
      clearTimeout(timeoutId);
      console.error('Failed to fetch products from Firestore:', err);
      // Fallback to local storage only so the page still works offline
      if (window.products.length === 0) {
        window.products = (JSON.parse(localStorage.getItem('products') || '[]'))
          .map((p, idx) => normalizeProduct(p, idx));
      }
      
      document.dispatchEvent(new Event('products-ready'));
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    });
}

// Check if cached data is fresh (less than 1 hour old)
function shouldRefreshCache() {
  const lastUpdated = localStorage.getItem('products_updated');
  if (!lastUpdated) return true;
  
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  return (Date.now() - parseInt(lastUpdated)) > oneHour;
}

// Only load Firebase if we need fresh data or no cached data exists
if (cachedProducts.length === 0 || shouldRefreshCache()) {
  loadFirebase(initProducts);
} else {
  console.log('Using fresh cached data, skipping Firebase load');
}

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
