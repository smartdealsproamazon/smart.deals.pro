// Firebase Affiliate Service for SmartDeals Pro
// Specialized service for affiliate registration and management

class FirebaseAffiliateService {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Initialize the service
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Firebase Affiliate Service...');
      
      // Wait for Firebase to be available
      await this.waitForFirebase();
      
      // Wait for Firebase service to be ready
      await this.waitForFirebaseService();
      
      this.isInitialized = true;
      console.log('Firebase Affiliate Service initialized successfully');
      
    } catch (error) {
      console.error('Firebase Affiliate Service failed to initialize:', error);
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
          console.warn('Firebase SDK not available after maximum attempts');
          resolve(); // Resolve instead of reject to allow fallback
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
          console.warn('Firebase Service not ready after maximum attempts');
          resolve(); // Resolve instead of reject to allow fallback
        } else {
          setTimeout(checkService, 100);
        }
      };
      
      checkService();
    });
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && window.firebaseService && window.firebaseService.isReady();
  }

  // Register affiliate with immediate active status
  async registerAffiliate(affiliateData) {
    try {
      console.log('Starting affiliate registration...');
      
      // Ensure service is initialized
      if (!this.isInitialized) {
        throw new Error('Firebase Affiliate Service not initialized');
      }

      if (!window.firebaseService || !window.firebaseService.isReady()) {
        throw new Error('Firebase Service not available');
      }

      // Create affiliate registration document with active status
      const registrationData = {
        personalInfo: {
          firstName: affiliateData.firstName || '',
          lastName: affiliateData.lastName || '',
          fullName: `${affiliateData.firstName || ''} ${affiliateData.lastName || ''}`.trim(),
          email: affiliateData.email || '',
          phone: affiliateData.phone || '',
          country: affiliateData.country || ''
        },
        experience: {
          level: affiliateData.experience || 'beginner',
          platforms: affiliateData.platforms || [],
          revenue: affiliateData.revenue || 'under-1000'
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
        status: {
          registrationStatus: 'active', // Set to active immediately
          approvalDate: window.firebaseService.getTimestamp(),
          isActive: true,
          canEarn: true
        },
        timestamps: {
          createdAt: window.firebaseService.getTimestamp(),
          updatedAt: window.firebaseService.getTimestamp(),
          lastLogin: null
        },
        affiliateId: this.generateAffiliateId(),
        metrics: {
          totalEarnings: 0,
          totalClicks: 0,
          totalConversions: 0,
          productsSubmitted: 0,
          activeProducts: 0
        }
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

      // Save to localStorage for immediate access
      this.saveToLocalStorage({...registrationData, documentId: docRef.id});

      // Send welcome email notification
      if (window.emailNotificationService && window.emailNotificationService.isReady()) {
        try {
          await window.emailNotificationService.sendWelcomeNotification(registrationData.personalInfo);
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError);
          // Don't fail registration if email fails
        }
      }

      return {
        success: true,
        affiliateId: registrationData.affiliateId,
        documentId: docRef.id,
        data: registrationData,
        message: 'Welcome to SmartDeals Pro! Your affiliate account is now active and ready to earn commissions.'
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

  // Get affiliate statistics
  async getAffiliateStats() {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const affiliates = await window.firebaseService.getCollection('affiliateRegistrations', 1000);
      
      const stats = {
        total: affiliates.length,
        active: affiliates.filter(a => a.status?.registrationStatus === 'active').length,
        pending: affiliates.filter(a => a.status?.registrationStatus === 'pending_approval').length,
        approved: affiliates.filter(a => a.status?.registrationStatus === 'active').length,
        rejected: affiliates.filter(a => a.status?.registrationStatus === 'rejected').length
      };

      return stats;
    } catch (error) {
      console.error('Failed to get affiliate stats:', error);
      return { total: 0, active: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }

  // Get all affiliates with pagination
  async getAllAffiliates(limit = 50) {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const affiliates = await window.firebaseService.getCollection('affiliateRegistrations', limit);
      
      return {
        success: true,
        affiliates: affiliates,
        count: affiliates.length
      };
    } catch (error) {
      console.error('Failed to get affiliates:', error);
      return {
        success: false,
        affiliates: [],
        count: 0,
        error: error.message
      };
    }
  }

  // Get affiliate by email
  async getAffiliateByEmail(email) {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const affiliates = await window.firebaseService.queryCollection('affiliateRegistrations', 'personalInfo.email', '==', email, 1);
      
      return affiliates.length > 0 ? affiliates[0] : null;
    } catch (error) {
      console.error('Failed to get affiliate by email:', error);
      return null;
    }
  }

  // Save affiliate data to localStorage as fallback
  saveToLocalStorage(affiliateData) {
    try {
      // Save affiliate registration data
      const savedRegistrations = JSON.parse(localStorage.getItem('affiliateRegistrations') || '[]');
      savedRegistrations.push(affiliateData);
      localStorage.setItem('affiliateRegistrations', JSON.stringify(savedRegistrations));
      
      // Save current user info
      const currentUser = {
        name: affiliateData.personalInfo.fullName,
        email: affiliateData.personalInfo.email,
        type: 'affiliate',
        affiliateId: affiliateData.affiliateId,
        status: 'active',
        registeredAt: new Date().toISOString()
      };
      
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('smartdeals_affiliateRegistered', 'true');
      localStorage.setItem('smartdeals_affiliateData', JSON.stringify(affiliateData));
      
      console.log('Affiliate data saved to localStorage');
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }
}

// Initialize the service when the script loads
if (typeof window !== 'undefined') {
  window.firebaseAffiliateService = new FirebaseAffiliateService();
}