// Firebase User Service - Manages user registration and affiliate data in Firebase
class FirebaseUserService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.init();
  }

  async init() {
    // Wait for Firebase to be loaded
    if (typeof firebase === 'undefined') {
      console.log('Waiting for Firebase to load...');
      await this.waitForFirebase();
    }

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

    this.db = firebase.firestore();
    console.log('Firebase User Service initialized');
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

  // Register a new user
  async registerUser(userData) {
    try {
      if (!this.db) {
        await this.init();
      }

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
      console.log('User registered with ID:', docRef.id);
      
      return { success: true, id: docRef.id, user: { ...user, firestoreId: docRef.id } };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: error.message };
    }
  }

  // Register an affiliate
  async registerAffiliate(affiliateData) {
    try {
      if (!this.db) {
        await this.init();
      }

      // Generate unique affiliate ID
      const affiliateId = 'AFF' + Date.now().toString().slice(-6);
      
      const affiliate = {
        ...affiliateData,
        affiliateId: affiliateId,
        status: 'active',
        level: 'starter',
        registrationDate: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        // Initialize default analytics
        analytics: {
          views: 0,
          profileVisits: 0,
          clicks: 0,
          totalEarnings: 0
        },
        // Initialize default product stats
        productStats: {
          total: 0,
          active: 0,
          pending: 0,
          rejected: 0
        }
      };

      const docRef = await this.db.collection('affiliates').add(affiliate);
      console.log('Affiliate registered with ID:', docRef.id);
      
      return { success: true, id: docRef.id, affiliate: { ...affiliate, firestoreId: docRef.id } };
    } catch (error) {
      console.error('Error registering affiliate:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      if (!this.db) {
        await this.init();
      }

      const snapshot = await this.db.collection('users').where('email', '==', email).get();
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  // Get affiliate by email
  async getAffiliateByEmail(email) {
    try {
      if (!this.db) {
        await this.init();
      }

      const snapshot = await this.db.collection('affiliates').where('personalInfo.email', '==', email).get();
      if (snapshot.empty) {
        return { success: false, affiliate: null };
      }

      const doc = snapshot.docs[0];
      return { success: true, affiliate: { id: doc.id, ...doc.data() } };
    } catch (error) {
      console.error('Error getting affiliate by email:', error);
      return { success: false, error: error.message };
    }
  }

  // Update affiliate analytics
  async updateAffiliateAnalytics(affiliateId, analyticsData) {
    try {
      if (!this.db) {
        await this.init();
      }

      await this.db.collection('affiliates').doc(affiliateId).update({
        analytics: analyticsData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating affiliate analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's products
  async getUserProducts(userId) {
    try {
      if (!this.db) {
        await this.init();
      }

      const snapshot = await this.db.collection('products')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, products };
    } catch (error) {
      console.error('Error getting user products:', error);
      return { success: false, error: error.message };
    }
  }

  // Authenticate user (sign in)
  async authenticateUser(email, password) {
    try {
      if (!this.db) {
        await this.init();
      }

      const user = await this.getUserByEmail(email);
      if (!user || user.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.db.collection('users').doc(user.id).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, user };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return { success: false, error: error.message };
    }
  }
}

// Global instance
window.firebaseUserService = new FirebaseUserService();

// Helper function for timeout
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
}