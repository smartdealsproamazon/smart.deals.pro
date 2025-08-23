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

// Improved Firebase initialization with better error handling
function initializeFirebaseWithRetry(retries = 3) {
  return new Promise((resolve, reject) => {
    try {
      // Initialize Firebase App
      app = firebase.initializeApp(firebaseConfig);
      
      // Initialize services
      db = firebase.firestore(app);
      auth = firebase.auth(app);
      storage = firebase.storage(app);
      
      // Configure Firestore settings for better performance
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true
      });
      
      // Enable offline persistence for better performance
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

// Start initialization
initializeFirebaseWithRetry().catch(error => {
  console.error('Firebase initialization failed after all retries:', error);
});

// Firebase service wrapper
class FirebaseService {
  constructor() {
    this.db = db;
    this.auth = auth;
    this.storage = storage;
    this.isInitialized = !!db;
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

// Create global Firebase service instance
const firebaseService = new FirebaseService();

// Export for use in other files
window.firebaseService = firebaseService;
window.firebase = firebase;