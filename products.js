// Comprehensive Product Catalog for SmartDeals Pro - now backed by Firebase Firestore

// Always expose an (initially empty) array so other scripts can reference it immediately
window.products = [];

// --- 1. Helpers ------------------------------------------------------------
function normalizeProduct(prod, idx = 0) {
  return {
    id: prod.id || idx + 1,
    name: prod.title,
    price: `$${parseFloat(prod.price || 0).toFixed(2)}`,
    originalPrice: `$${parseFloat(prod.originalPrice || prod.price || 0).toFixed(2)}`,
    image: prod.imageData || prod.image,
    link: prod.link,
    category: prod.category || 'uncategorized',
    rating: prod.rating || 5,
    reviews: prod.reviews || 0,
    description: prod.description,
    features: prod.features || [],
    discount: prod.discount || 0,
    featured: Boolean(prod.featured)
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
    document.head.appendChild(storeScript);
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

  db.collection('products').orderBy('createdAt', 'desc').get()
    .then(snapshot => {
      const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const local = JSON.parse(localStorage.getItem('products') || '[]');
      const combined = [...local, ...remote];

      window.products = combined.map((p, idx) => normalizeProduct(p, idx));

      // Notify any listeners (render.js for example)
      document.dispatchEvent(new Event('products-ready'));

      // If a rendering helper is already available, invoke it immediately so the UI updates
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    })
    .catch(err => {
      console.error('Failed to fetch products from Firestore:', err);
      // Fallback to local storage only so the page still works offline
      window.products = (JSON.parse(localStorage.getItem('products') || '[]'))
        .map((p, idx) => normalizeProduct(p, idx));
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
    });
}

// Kick things off
loadFirebase(initProducts);

// ----------------- Existing helper APIs (still required by the rest of the code) --------------
function getProductsByCategory(category) {
  return (window.products || []).filter(p => p.category === category);
}

function getFeaturedProducts() {
  return (window.products || []).filter(p => p.featured || p.rating >= 4.7).slice(0, 6);
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
