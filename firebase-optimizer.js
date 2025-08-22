// Firebase Optimizer - Centralized Firebase Management for Better Performance
// This script handles all Firebase operations with optimized connection and fallback mechanisms

class FirebaseOptimizer {
  constructor() {
    this.db = null;
    this.auth = null;
    this.isInitialized = false;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.connectionTimeout = 5000;
    this.offlineMode = false;
    this.cachedData = new Map();
    
    // Firebase configuration
    this.config = {
      apiKey: "AIzaSyBJqBEWDdBlfv5xAjgcvqput1KC1NzKvlU",
      authDomain: "smart-deals-pro.firebaseapp.com",
      projectId: "smart-deals-pro",
      storageBucket: "smart-deals-pro.firebasestorage.app",
      messagingSenderId: "680016915696",
      appId: "1:680016915696:web:4b3721313ea0e2e3342635",
      measurementId: "G-HV5N0LQJTG"
    };
    
    this.init();
  }

  async init() {
    try {
      console.log('Firebase Optimizer: Initializing...');
      
      // Wait for Firebase SDK to be available
      if (typeof firebase === 'undefined') {
        console.log('Firebase Optimizer: Waiting for Firebase SDK...');
        await this.waitForFirebase();
      }
      
      // Initialize Firebase if not already done
      if (!firebase.apps.length) {
        firebase.initializeApp(this.config);
        console.log('Firebase Optimizer: Firebase initialized');
      }
      
      this.db = firebase.firestore();
      this.auth = firebase.auth();
      
      // Enable offline persistence for better performance
      try {
        await this.db.enablePersistence({ 
          synchronizeTabs: true,
          cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });
        console.log('Firebase Optimizer: Offline persistence enabled');
      } catch (err) {
        console.warn('Firebase Optimizer: Persistence failed, using memory cache:', err);
      }
      
      this.isInitialized = true;
      this.offlineMode = false;
      console.log('Firebase Optimizer: Initialization complete');
      
      // Dispatch ready event
      document.dispatchEvent(new Event('firebase-optimizer-ready'));
      
    } catch (error) {
      console.error('Firebase Optimizer: Initialization failed:', error);
      this.offlineMode = true;
      this.handleOfflineMode();
    }
  }

  waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  }

  handleOfflineMode() {
    console.log('Firebase Optimizer: Running in offline mode');
    this.offlineMode = true;
    
    // Load cached data immediately
    this.loadCachedData();
    
    // Dispatch offline event
    document.dispatchEvent(new Event('firebase-offline'));
  }

  loadCachedData() {
    try {
      // Load products from localStorage
      const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      if (cachedProducts.length > 0) {
        this.cachedData.set('products', cachedProducts);
        console.log('Firebase Optimizer: Loaded', cachedProducts.length, 'cached products');
        
        // Update global products array
        if (window.productStateManager) {
          window.productStateManager.updateProducts(cachedProducts);
        }
        if (typeof window.products === 'undefined') {
          window.products = cachedProducts;
        }
        
        // Dispatch products ready event
        document.dispatchEvent(new Event('products-ready'));
      }
      
      // Load user data
      const cachedUser = localStorage.getItem('smartdeals_currentUser');
      if (cachedUser) {
        this.cachedData.set('currentUser', JSON.parse(cachedUser));
      }
      
    } catch (error) {
      console.error('Firebase Optimizer: Error loading cached data:', error);
    }
  }

  // Optimized product listener with retry mechanism
  async setupProductListener(callback) {
    if (!this.isInitialized || this.offlineMode) {
      console.log('Firebase Optimizer: Using cached data for products');
      this.loadCachedData();
      return null;
    }

    try {
      console.log('Firebase Optimizer: Setting up product listener...');
      
      const listener = this.db.collection('products')
        .orderBy('createdAt', 'desc')
        .limit(100) // Increased limit for better coverage
        .onSnapshot(
          (snapshot) => {
            console.log('Firebase Optimizer: Received', snapshot.size, 'products');
            
            const products = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Filter out user-submitted products for homepage
            const filteredProducts = products.filter(product => {
              return !product.submittedBy && !product.id?.toString().startsWith('local_');
            });
            
            // Update cached data
            this.cachedData.set('products', filteredProducts);
            this.cachedData.set('allProducts', products);
            
            // Update global state
            if (window.productStateManager) {
              window.productStateManager.updateProducts(filteredProducts);
            }
            if (typeof window.products === 'undefined') {
              window.products = filteredProducts;
            }
            if (typeof window.allProductsIncludingUserSubmitted === 'undefined') {
              window.allProductsIncludingUserSubmitted = products;
            }
            
            // Save to localStorage for offline use
            localStorage.setItem('products', JSON.stringify(filteredProducts));
            localStorage.setItem('allProducts', JSON.stringify(products));
            localStorage.setItem('products_updated', Date.now().toString());
            
            // Call callback if provided
            if (callback && typeof callback === 'function') {
              callback(filteredProducts, products);
            }
            
            // Dispatch events
            document.dispatchEvent(new Event('products-updated'));
            document.dispatchEvent(new Event('products-ready'));
            document.dispatchEvent(new Event('firebase-connected'));
            
            // Reset retry counter on success
            this.connectionRetries = 0;
            
          },
          (error) => {
            console.error('Firebase Optimizer: Product listener error:', error);
            this.handleConnectionError();
          }
        );
      
      return listener;
      
    } catch (error) {
      console.error('Firebase Optimizer: Failed to setup product listener:', error);
      this.handleConnectionError();
      return null;
    }
  }

  handleConnectionError() {
    this.connectionRetries++;
    
    if (this.connectionRetries <= this.maxRetries) {
      console.log(`Firebase Optimizer: Retrying connection (${this.connectionRetries}/${this.maxRetries})...`);
      
      setTimeout(() => {
        this.setupProductListener();
      }, this.retryDelay);
      
    } else {
      console.warn('Firebase Optimizer: Max retries reached, switching to offline mode');
      this.offlineMode = true;
      this.handleOfflineMode();
    }
  }

  // User registration with Firebase
  async registerUser(userData) {
    if (!this.isInitialized || this.offlineMode) {
      console.log('Firebase Optimizer: User registration in offline mode');
      return this.registerUserOffline(userData);
    }

    try {
      console.log('Firebase Optimizer: Registering user with Firebase...');
      
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = {
        ...userData,
        id: Date.now().toString(),
        joinDate: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        lastNotification: null,
        isActive: true
      };

      const docRef = await this.db.collection('users').add(user);
      console.log('Firebase Optimizer: User registered with ID:', docRef.id);
      
      // Cache user data locally
      this.cachedData.set('currentUser', { ...user, firestoreId: docRef.id });
      localStorage.setItem('smartdeals_currentUser', JSON.stringify({ ...user, firestoreId: docRef.id }));
      
      return { success: true, id: docRef.id, user: { ...user, firestoreId: docRef.id } };
      
    } catch (error) {
      console.error('Firebase Optimizer: User registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  registerUserOffline(userData) {
    try {
      console.log('Firebase Optimizer: Registering user offline...');
      
      const user = {
        ...userData,
        id: 'local_' + Date.now().toString(),
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastNotification: null,
        isActive: true,
        offline: true
      };
      
      // Store locally
      this.cachedData.set('currentUser', user);
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(user));
      
      // Store in pending registrations for later sync
      const pendingRegistrations = JSON.parse(localStorage.getItem('pendingRegistrations') || '[]');
      pendingRegistrations.push(user);
      localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));
      
      return { success: true, id: user.id, user: user, offline: true };
      
    } catch (error) {
      console.error('Firebase Optimizer: Offline registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    if (!this.isInitialized || this.offlineMode) {
      return null;
    }

    try {
      const snapshot = await this.db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
      
    } catch (error) {
      console.error('Firebase Optimizer: Error getting user by email:', error);
      return null;
    }
  }

  // Sync offline data when connection is restored
  async syncOfflineData() {
    if (this.offlineMode || !this.isInitialized) {
      return;
    }

    try {
      console.log('Firebase Optimizer: Syncing offline data...');
      
      // Sync pending registrations
      const pendingRegistrations = JSON.parse(localStorage.getItem('pendingRegistrations') || '[]');
      if (pendingRegistrations.length > 0) {
        console.log('Firebase Optimizer: Syncing', pendingRegistrations.length, 'pending registrations');
        
        for (const user of pendingRegistrations) {
          try {
            await this.db.collection('users').add(user);
            console.log('Firebase Optimizer: Synced user:', user.id);
          } catch (error) {
            console.error('Firebase Optimizer: Failed to sync user:', user.id, error);
          }
        }
        
        // Clear pending registrations
        localStorage.removeItem('pendingRegistrations');
      }
      
      console.log('Firebase Optimizer: Offline data sync complete');
      
    } catch (error) {
      console.error('Firebase Optimizer: Offline data sync failed:', error);
    }
  }

  // Check connection status
  async checkConnection() {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Try to access Firestore
      await this.db.collection('products').limit(1).get();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get cached data
  getCachedData(key) {
    return this.cachedData.get(key) || null;
  }

  // Clear cache
  clearCache() {
    this.cachedData.clear();
    localStorage.removeItem('products');
    localStorage.removeItem('allProducts');
    localStorage.removeItem('products_updated');
  }
}

// Initialize Firebase Optimizer
let firebaseOptimizer;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Firebase Optimizer: DOM ready, initializing...');
  firebaseOptimizer = new FirebaseOptimizer();
});

// Make it globally available
window.firebaseOptimizer = firebaseOptimizer;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseOptimizer;
}