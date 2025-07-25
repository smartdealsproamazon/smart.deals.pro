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
        
        // Show notification for new products (only after initial load)
        if (previousCount > 0 && window.products.length > previousCount) {
          const newProductsCount = window.products.length - previousCount;
          showNewProductNotification(newProductsCount);
        }

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

// Function to show notification when new products are added
function showNewProductNotification(count) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'new-product-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-sparkles"></i>
      <span>${count} new product${count > 1 ? 's' : ''} added!</span>
      <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
  
  // Add CSS if not already present
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .new-product-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        animation: slideInNotification 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .notification-content i.fa-sparkles {
        color: #ffd700;
        font-size: 18px;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      .notification-close:hover {
        background-color: rgba(255,255,255,0.2);
      }
      
      @keyframes slideInNotification {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @media (max-width: 768px) {
        .new-product-notification {
          top: 10px;
          right: 10px;
          left: 10px;
          padding: 12px 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }
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
