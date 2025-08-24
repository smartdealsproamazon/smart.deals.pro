// Firebase Configuration and Initialization
// SmartDeals Pro - Real-time Product Management System

// Firebase configuration - ACTUAL PRODUCTION CONFIG
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
let app, db, auth, storage;

// Wait for Firebase SDK to be available before initializing
function waitForFirebaseSDK() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;
    
    function checkSDK() {
      attempts++;
      
      if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        console.log('Firebase SDK loaded successfully');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('Firebase SDK failed to load after maximum attempts');
        reject(new Error('Firebase SDK not available'));
      } else {
        setTimeout(checkSDK, 100);
      }
    }
    
    checkSDK();
  });
}

// Improved Firebase initialization with better error handling
function initializeFirebaseWithRetry(retries = 3) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Initializing Firebase...');
      
      // Initialize Firebase App
      app = firebase.initializeApp(firebaseConfig);
      
      // Initialize services
      db = firebase.firestore(app);
      auth = firebase.auth(app);
      storage = firebase.storage(app);
      
      // Configure Firestore settings for better performance
      if (db && db.settings) {
        db.settings({
          cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
          ignoreUndefinedProperties: true
        });
      }
      
      // Enable offline persistence for better performance
      if (db && db.enablePersistence) {
        db.enablePersistence({ 
          synchronizeTabs: true,
          forceOwnership: false 
        }).then(() => {
          console.log('Firebase persistence enabled');
        }).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
          } else {
            console.warn('Firebase persistence failed:', err);
          }
        });
      }
      
      console.log('Firebase initialized successfully');
      resolve({ app, db, auth, storage });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      
      if (retries > 0) {
        console.log(`Retrying Firebase initialization... (${retries} attempts left)`);
        setTimeout(() => {
          initializeFirebaseWithRetry(retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(error);
      }
    }
  });
}

// Start initialization process
async function startFirebaseInitialization() {
  try {
    console.log('Waiting for Firebase SDK...');
    await waitForFirebaseSDK();
    console.log('Firebase SDK ready, initializing...');
    await initializeFirebaseWithRetry();
    console.log('Firebase initialization complete');
    
    // Notify other scripts that Firebase is ready
    window.dispatchEvent(new CustomEvent('firebase-ready'));
  } catch (error) {
    console.error('Firebase initialization failed after all retries:', error);
    // Notify that Firebase failed
    window.dispatchEvent(new CustomEvent('firebase-failed', { detail: error }));
  }
}

// Start the initialization process
startFirebaseInitialization();

// Firebase service wrapper
class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.isInitialized = false;
    
    // Set up event listeners for when Firebase is ready
    window.addEventListener('firebase-ready', () => {
      this.db = db;
      this.auth = auth;
      this.storage = storage;
      this.isInitialized = true;
      console.log('FirebaseService updated with initialized services');
    });
    
    // If Firebase is already initialized, set it up immediately
    if (db && auth) {
      this.db = db;
      this.auth = auth;
      this.storage = storage;
      this.isInitialized = true;
    }
  }

  // Check if Firebase is ready
  isReady() {
    return this.isInitialized && this.db && this.auth;
  }

  // Get timestamp
  getTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Real-time listener helper
  onSnapshot(collection, callback, errorCallback) {
    if (!this.isReady()) {
      console.error('Firebase not initialized');
      return null;
    }
    
    return this.db.collection(collection).onSnapshot(callback, errorCallback);
  }

  // Add document with auto-generated ID
  async addDocument(collection, data) {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }
    
    return await this.db.collection(collection).add({
      ...data,
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp()
    });
  }

  // Set document with specific ID
  async setDocument(collection, docId, data) {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }
    
    return await this.db.collection(collection).doc(docId).set({
      ...data,
      updatedAt: this.getTimestamp()
    }, { merge: true });
  }

  // Get document by ID
  async getDocument(collection, docId) {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }
    
    const doc = await this.db.collection(collection).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  // Get all documents in collection
  async getCollection(collection, orderBy = 'createdAt', direction = 'desc') {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }
    
    const snapshot = await this.db.collection(collection)
      .orderBy(orderBy, direction)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Delete document
  async deleteDocument(collection, docId) {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }
    
    return await this.db.collection(collection).doc(docId).delete();
  }

  // Upload file to storage
  async uploadFile(file, path) {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }
    
    const storageRef = this.storage.ref(path);
    const uploadTask = await storageRef.put(file);
    return await uploadTask.ref.getDownloadURL();
  }
}

// Create global Firebase service instance after DOM is ready
let firebaseService;

// Initialize service when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  firebaseService = new FirebaseService();
  window.firebaseService = firebaseService;
  console.log('FirebaseService instance created and attached to window');
});

// Also create immediately if DOM is already ready
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already ready
  firebaseService = new FirebaseService();
  window.firebaseService = firebaseService;
  console.log('FirebaseService instance created immediately (DOM already ready)');
}

// Make firebase available globally
if (typeof window !== 'undefined') {
  window.firebase = firebase;
}