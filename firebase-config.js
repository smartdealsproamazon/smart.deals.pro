// Simple Firebase Configuration for SmartDeals Pro
// This file handles all Firebase operations in a clean, simple way

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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get Firestore database
const db = firebase.firestore();

// Enable offline persistence for better performance
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log('Firebase offline persistence enabled');
  })
  .catch((err) => {
    console.warn('Firebase persistence failed:', err);
  });

// Firebase Collections
const collections = {
  products: db.collection('products'),
  users: db.collection('users'),
  productSubmissions: db.collection('productSubmissions')
};

// Simple Firebase Service Class
class FirebaseService {
  constructor() {
    this.db = db;
    this.collections = collections;
    this.isConnected = false;
    this.connectionCheck();
  }

  // Check Firebase connection
  async connectionCheck() {
    try {
      await this.db.collection('products').limit(1).get();
      this.isConnected = true;
      console.log('Firebase connected successfully');
      document.dispatchEvent(new Event('firebase-connected'));
    } catch (error) {
      this.isConnected = false;
      console.warn('Firebase connection failed:', error);
      document.dispatchEvent(new Event('firebase-offline'));
    }
  }

  // Get all products in real-time
  getProductsRealtime(callback) {
    console.log('Setting up real-time products listener...');
    
    return this.collections.products
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('Real-time products received:', products.length);
          
          // Filter out user-submitted products for homepage
          const filteredProducts = products.filter(product => {
            return !product.submittedBy && !product.id?.toString().startsWith('local_');
          });
          
          // Store all products for marketplace
          const allProducts = products;
          
          // Update global variables
          window.products = filteredProducts;
          window.allProductsIncludingUserSubmitted = allProducts;
          
          // Save to localStorage for offline use
          localStorage.setItem('products', JSON.stringify(filteredProducts));
          localStorage.setItem('allProducts', JSON.stringify(allProducts));
          localStorage.setItem('products_updated', Date.now().toString());
          
          // Call callback with products
          if (callback && typeof callback === 'function') {
            callback(filteredProducts, allProducts);
          }
          
          // Dispatch events
          document.dispatchEvent(new Event('products-updated'));
          document.dispatchEvent(new Event('products-ready'));
          
        },
        (error) => {
          console.error('Products listener error:', error);
          // Fallback to cached data
          this.loadCachedProducts();
        }
      );
  }

  // Load cached products from localStorage
  loadCachedProducts() {
    try {
      const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      if (cachedProducts.length > 0) {
        console.log('Loading cached products:', cachedProducts.length);
        window.products = cachedProducts;
        document.dispatchEvent(new Event('products-ready'));
      }
    } catch (error) {
      console.error('Error loading cached products:', error);
    }
  }

  // Register new user
  async registerUser(userData) {
    try {
      console.log('Registering user:', userData.email);
      
      // Check if user already exists
      const existingUser = await this.collections.users
        .where('email', '==', userData.email)
        .limit(1)
        .get();
      
      if (!existingUser.empty) {
        throw new Error('User with this email already exists');
      }

      // Create user object
      const user = {
        ...userData,
        id: Date.now().toString(),
        joinDate: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Add to Firebase
      const docRef = await this.collections.users.add(user);
      console.log('User registered successfully:', docRef.id);
      
      // Store user data locally
      const userWithId = { ...user, firestoreId: docRef.id };
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(userWithId));
      
      return { success: true, user: userWithId };
      
    } catch (error) {
      console.error('User registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Submit product from user
  async submitProduct(productData) {
    try {
      console.log('Submitting product:', productData.title);
      
      // Create product object
      const product = {
        ...productData,
        id: 'user_' + Date.now().toString(),
        submittedBy: productData.userEmail || 'anonymous',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        isUserSubmitted: true
      };

      // Add to Firebase
      const docRef = await this.collections.productSubmissions.add(product);
      console.log('Product submitted successfully:', docRef.id);
      
      return { success: true, productId: docRef.id };
      
    } catch (error) {
      console.error('Product submission failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const snapshot = await this.collections.users
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get all product submissions
  async getProductSubmissions() {
    try {
      const snapshot = await this.collections.productSubmissions
        .orderBy('submittedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    } catch (error) {
      console.error('Error getting product submissions:', error);
      return [];
    }
  }

  // Update product status
  async updateProductStatus(productId, status) {
    try {
      await this.collections.productSubmissions.doc(productId).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Product status updated:', productId, status);
      return { success: true };
      
    } catch (error) {
      console.error('Error updating product status:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create global Firebase service instance
let firebaseService;

// Initialize when Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase to be available
  const waitForFirebase = () => {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      firebaseService = new FirebaseService();
      window.firebaseService = firebaseService;
      console.log('Firebase service initialized');
      
      // Start real-time products listener
      firebaseService.getProductsRealtime((filteredProducts, allProducts) => {
        console.log('Products loaded:', filteredProducts.length);
        console.log('All products:', allProducts.length);
      });
      
    } else {
      setTimeout(waitForFirebase, 100);
    }
  };
  
  waitForFirebase();
});

// Make it globally available
window.FirebaseService = FirebaseService;