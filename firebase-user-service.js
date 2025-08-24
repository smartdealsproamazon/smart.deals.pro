// Firebase User Service for SmartDeals Pro
// Specialized service for user registration and management

class FirebaseUserService {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Initialize the service
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Firebase User Service...');
      
      // Wait for Firebase to be available
      await this.waitForFirebase();
      
      // Wait for Firebase service to be ready
      await this.waitForFirebaseService();
      
      this.isInitialized = true;
      console.log('Firebase User Service initialized successfully');
      
    } catch (error) {
      console.error('Firebase User Service failed to initialize:', error);
      this.isInitialized = false;
    }
  }

  async waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkFirebase = () => {
        attempts++;
        
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          console.log('Firebase SDK loaded successfully');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Firebase SDK not available after maximum attempts'));
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      
      checkFirebase();
    });
  }

  async waitForFirebaseService() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkService = () => {
        attempts++;
        
        if (window.firebaseService && window.firebaseService.isReady()) {
          console.log('Firebase Service ready');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Firebase Service not ready after maximum attempts'));
        } else {
          setTimeout(checkService, 100);
        }
      };
      
      checkService();
    });
  }

  // Register affiliate with complete data structure
  async registerAffiliate(affiliateData) {
    try {
      console.log('Starting affiliate registration...');
      
      // Ensure service is initialized
      if (!this.isInitialized) {
        throw new Error('Firebase User Service not initialized');
      }

      if (!window.firebaseService || !window.firebaseService.isReady()) {
        throw new Error('Firebase Service not available');
      }

      // Create affiliate registration document
      const registrationData = {
        personalInfo: {
          firstName: affiliateData.firstName || '',
          lastName: affiliateData.lastName || '',
          email: affiliateData.email || '',
          phone: affiliateData.phone || '',
          country: affiliateData.country || ''
        },
        experience: {
          level: affiliateData.experience || '',
          platforms: affiliateData.platforms || [],
          revenue: affiliateData.revenue || ''
        },
        onlinePresence: {
          website: affiliateData.website || '',
          facebook: affiliateData.facebook || '',
          instagram: affiliateData.instagram || '',
          youtube: affiliateData.youtube || '',
          tiktok: affiliateData.tiktok || '',
          strategy: affiliateData.strategy || ''
        },
        agreements: {
          terms: affiliateData.terms || false,
          marketing: affiliateData.marketing || false,
          quality: affiliateData.quality || false
        },
        status: 'pending_approval',
        registrationDate: window.firebaseService.getTimestamp(),
        lastUpdate: window.firebaseService.getTimestamp(),
        affiliateId: this.generateAffiliateId()
      };

      console.log('Saving affiliate registration to Firebase...');
      
      // Save to Firebase with timeout
      const docRef = await Promise.race([
        window.firebaseService.addDocument('affiliateRegistrations', registrationData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registration save timeout - please try again')), 15000)
        )
      ]);

      console.log('Affiliate registration saved successfully with ID:', docRef.id);

      return {
        success: true,
        affiliateId: registrationData.affiliateId,
        documentId: docRef.id,
        data: registrationData,
        message: 'Registration successful! Your application is being reviewed.'
      };

    } catch (error) {
      console.error('Affiliate registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('timeout')) {
        errorMessage = error.message;
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Registration failed: ${error.message}`;
      }

      return {
        success: false,
        error: error.code || 'unknown',
        message: errorMessage
      };
    }
  }

  // Generate unique affiliate ID
  generateAffiliateId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AFF${timestamp.slice(-6)}${random}`;
  }

  // Save user data to localStorage as fallback
  saveToLocalStorage(userData) {
    try {
      // Save affiliate registration data
      const savedRegistrations = JSON.parse(localStorage.getItem('affiliateRegistrations') || '[]');
      savedRegistrations.push(userData);
      localStorage.setItem('affiliateRegistrations', JSON.stringify(savedRegistrations));
      
      // Save current user info
      const currentUser = {
        name: `${userData.personalInfo.firstName} ${userData.personalInfo.lastName}`,
        email: userData.personalInfo.email,
        type: 'affiliate',
        affiliateId: userData.affiliateId,
        registeredAt: new Date().toISOString()
      };
      
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('smartdeals_affiliateRegistered', 'true');
      localStorage.setItem('smartdeals_affiliateData', JSON.stringify(userData));
      
      console.log('Data saved to localStorage as fallback');
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  // Get affiliate registration by ID
  async getAffiliateRegistration(affiliateId) {
    try {
      if (!this.isInitialized || !window.firebaseService) {
        throw new Error('Service not initialized');
      }

      const snapshot = await window.firebaseService.db.collection('affiliateRegistrations')
        .where('affiliateId', '==', affiliateId)
        .get();

      if (snapshot.empty) {
        return { success: false, message: 'Affiliate not found' };
      }

      const doc = snapshot.docs[0];
      return {
        success: true,
        data: { id: doc.id, ...doc.data() }
      };

    } catch (error) {
      console.error('Error getting affiliate registration:', error);
      return { success: false, error: error.message };
    }
  }

  // Get affiliate registration by UID
  async getAffiliateRegistrationByUID(uid) {
    try {
      if (!this.isInitialized || !window.firebaseService) {
        throw new Error('Service not initialized');
      }

      const doc = await window.firebaseService.getDocument('affiliateRegistrations', uid);
      
      if (!doc.exists()) {
        return { success: false, message: 'Affiliate not found' };
      }

      return {
        success: true,
        data: { id: doc.id, ...doc.data() }
      };

    } catch (error) {
      console.error('Error getting affiliate registration by UID:', error);
      return { success: false, error: error.message };
    }
  }

  // Get affiliate registration by email
  async getAffiliateRegistrationByEmail(email) {
    try {
      if (!this.isInitialized || !window.firebaseService) {
        throw new Error('Service not initialized');
      }

      const snapshot = await window.firebaseService.db.collection('affiliateRegistrations')
        .where('personalInfo.email', '==', email)
        .get();

      if (snapshot.empty) {
        return { success: false, message: 'Affiliate not found' };
      }

      const doc = snapshot.docs[0];
      return {
        success: true,
        data: { id: doc.id, ...doc.data() }
      };

    } catch (error) {
      console.error('Error getting affiliate registration by email:', error);
      return { success: false, error: error.message };
    }
  }

  // Update affiliate status
  async updateAffiliateStatus(documentId, status) {
    try {
      if (!this.isInitialized || !window.firebaseService) {
        throw new Error('Service not initialized');
      }

      await window.firebaseService.setDocument('affiliateRegistrations', documentId, {
        status: status,
        lastUpdate: window.firebaseService.getTimestamp()
      });

      return { success: true, message: 'Status updated successfully' };

    } catch (error) {
      console.error('Error updating affiliate status:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && window.firebaseService && window.firebaseService.isReady();
  }

  // Show user-friendly message
  showMessage(message, type = 'info') {
    const messageElement = document.getElementById(type === 'error' ? 'errorMessage' : 'successMessage');
    const otherElement = document.getElementById(type === 'error' ? 'successMessage' : 'errorMessage');
    
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.display = 'block';
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (otherElement) {
      otherElement.style.display = 'none';
    }
    
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// Create and export the service
const firebaseUserService = new FirebaseUserService();

// Make it globally available
window.firebaseUserService = firebaseUserService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseUserService;
}