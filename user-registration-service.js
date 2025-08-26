// User Registration Service for SmartDeals Pro
// Handles both regular user registration and affiliate registration with Firebase

class UserRegistrationService {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing User Registration Service...');
      
      // Wait for Firebase to be available
      await this.waitForFirebase();
      
      // Wait for Firebase service to be ready
      await this.waitForFirebaseService();
      
      this.isInitialized = true;
      console.log('User Registration Service initialized successfully');
      
    } catch (error) {
      console.error('User Registration Service failed to initialize:', error);
      this.isInitialized = false;
    }
  }

  async waitForFirebase() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30;
      
      const checkFirebase = () => {
        attempts++;
        
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          console.log('Firebase SDK loaded successfully');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn('Firebase SDK not available, continuing with limited functionality');
          resolve();
        } else {
          setTimeout(checkFirebase, 500);
        }
      };
      
      checkFirebase();
    });
  }

  async waitForFirebaseService() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30;
      
      const checkService = () => {
        attempts++;
        
        if (window.firebaseService && window.firebaseService.isReady()) {
          console.log('Firebase Service ready');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn('Firebase Service not ready, continuing with limited functionality');
          resolve();
        } else {
          setTimeout(checkService, 500);
        }
      };
      
      checkService();
    });
  }

  // Register a regular user
  async registerUser(userData) {
    try {
      console.log('Starting user registration...');
      
      if (!this.isInitialized) {
        throw new Error('User Registration Service not initialized');
      }

      // Validate required fields
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      // Create Firebase user account
      let firebaseUser = null;
      if (window.firebaseService && window.firebaseService.auth) {
        try {
          const userCredential = await window.firebaseService.auth.createUserWithEmailAndPassword(
            userData.email, 
            userData.password
          );
          firebaseUser = userCredential.user;
          console.log('Firebase user account created:', firebaseUser.uid);
        } catch (authError) {
          console.error('Firebase authentication error:', authError);
          throw new Error(`Account creation failed: ${authError.message}`);
        }
      }

      // Prepare user data for database
      const userDocument = {
        // Personal Information
        personalInfo: {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email,
          phone: userData.phone || '',
          country: userData.country || '',
          city: userData.city || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || ''
        },
        
        // Account Information
        accountInfo: {
          uid: firebaseUser ? firebaseUser.uid : this.generateUserId(),
          accountType: 'user',
          status: 'active',
          emailVerified: firebaseUser ? firebaseUser.emailVerified : false,
          createdAt: window.firebaseService ? window.firebaseService.getTimestamp() : new Date().toISOString(),
          lastLogin: window.firebaseService ? window.firebaseService.getTimestamp() : new Date().toISOString()
        },
        
        // Preferences
        preferences: {
          interests: userData.interests || [],
          newsletter: userData.newsletter || false,
          notifications: userData.notifications || false
        },
        
        // Metadata
        metadata: {
          registrationSource: 'website',
          lastUpdate: window.firebaseService ? window.firebaseService.getTimestamp() : new Date().toISOString()
        }
      };

      // Save to Firebase Firestore
      let documentId = null;
      if (window.firebaseService && window.firebaseService.isReady()) {
        try {
          const docRef = await window.firebaseService.addDocument('users', userDocument);
          documentId = docRef.id;
          console.log('User data saved to Firestore with ID:', documentId);
        } catch (firestoreError) {
          console.error('Firestore save error:', firestoreError);
          // Continue without throwing error to allow fallback
        }
      }

      // Save to localStorage as fallback
      this.saveUserToLocalStorage(userDocument);

      // Send welcome email if possible
      try {
        await this.sendWelcomeEmail(userData.email, userData.firstName);
      } catch (emailError) {
        console.warn('Welcome email failed:', emailError);
        // Don't fail registration if email fails
      }

      return {
        success: true,
        uid: userDocument.accountInfo.uid,
        documentId: documentId,
        data: userDocument,
        message: 'Account created successfully! Welcome to SmartDeals Pro!'
      };

    } catch (error) {
      console.error('User registration error:', error);
      
      return {
        success: false,
        error: error.code || 'registration_failed',
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  // Register an affiliate
  async registerAffiliate(affiliateData) {
    try {
      console.log('Starting affiliate registration...');
      
      if (!this.isInitialized) {
        throw new Error('User Registration Service not initialized');
      }

      // Validate required fields
      if (!affiliateData.email || !affiliateData.firstName || !affiliateData.lastName) {
        throw new Error('Name and email are required');
      }

      // Create affiliate registration document
      const affiliateDocument = {
        // Personal Information
        personalInfo: {
          firstName: affiliateData.firstName || '',
          lastName: affiliateData.lastName || '',
          email: affiliateData.email.toLowerCase(),
          phone: affiliateData.phone || '',
          country: affiliateData.country || ''
        },
        
        // Experience Information
        experience: {
          level: affiliateData.experience || '',
          platforms: affiliateData.platforms || [],
          revenue: affiliateData.revenue || ''
        },
        
        // Online Presence
        onlinePresence: {
          website: affiliateData.website || '',
          facebook: affiliateData.facebook || '',
          instagram: affiliateData.instagram || '',
          youtube: affiliateData.youtube || '',
          tiktok: affiliateData.tiktok || '',
          strategy: affiliateData.strategy || ''
        },
        
        // Agreements
        agreements: {
          terms: affiliateData.terms || false,
          marketing: affiliateData.marketing || false,
          quality: affiliateData.quality || false
        },
        
        // Status and IDs
        status: 'pending_approval',
        affiliateId: this.generateAffiliateId(),
        
        // Timestamps
        registrationDate: window.firebaseService ? window.firebaseService.getTimestamp() : new Date().toISOString(),
        lastUpdate: window.firebaseService ? window.firebaseService.getTimestamp() : new Date().toISOString(),
        
        // Metadata
        metadata: {
          registrationSource: 'website',
          ipAddress: await this.getClientIP(),
          userAgent: navigator.userAgent
        }
      };

      // Save to Firebase Firestore
      let documentId = null;
      if (window.firebaseService && window.firebaseService.isReady()) {
        try {
          const docRef = await window.firebaseService.addDocument('affiliateRegistrations', affiliateDocument);
          documentId = docRef.id;
          console.log('Affiliate registration saved to Firestore with ID:', documentId);
        } catch (firestoreError) {
          console.error('Firestore save error:', firestoreError);
          // Continue without throwing error to allow fallback
        }
      }

      // Save to localStorage as fallback
      this.saveAffiliateToLocalStorage(affiliateDocument);

      // Send confirmation email
      try {
        await this.sendAffiliateConfirmationEmail(affiliateData.email, affiliateData.firstName);
      } catch (emailError) {
        console.warn('Confirmation email failed:', emailError);
        // Don't fail registration if email fails
      }

      return {
        success: true,
        affiliateId: affiliateDocument.affiliateId,
        documentId: documentId,
        data: affiliateDocument,
        message: 'Affiliate registration submitted successfully! We will review your application and get back to you within 24-48 hours.'
      };

    } catch (error) {
      console.error('Affiliate registration error:', error);
      
      return {
        success: false,
        error: error.code || 'registration_failed',
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  // Generate unique user ID
  generateUserId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `USER${timestamp.slice(-6)}${random}`;
  }

  // Generate unique affiliate ID
  generateAffiliateId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AFF${timestamp.slice(-6)}${random}`;
  }

  // Save user to localStorage as fallback
  saveUserToLocalStorage(userData) {
    try {
      // Save to users array
      const savedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      savedUsers.push(userData);
      localStorage.setItem('registeredUsers', JSON.stringify(savedUsers));
      
      // Save current user info
      const currentUser = {
        name: `${userData.personalInfo.firstName} ${userData.personalInfo.lastName}`,
        email: userData.personalInfo.email,
        uid: userData.accountInfo.uid,
        type: 'user',
        registeredAt: new Date().toISOString()
      };
      
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('smartdeals_userRegistered', 'true');
      
      console.log('User data saved to localStorage as fallback');
      return true;
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
      return false;
    }
  }

  // Save affiliate to localStorage as fallback
  saveAffiliateToLocalStorage(affiliateData) {
    try {
      // Save to affiliates array
      const savedAffiliates = JSON.parse(localStorage.getItem('affiliateRegistrations') || '[]');
      savedAffiliates.push(affiliateData);
      localStorage.setItem('affiliateRegistrations', JSON.stringify(savedAffiliates));
      
      // Save current user info
      const currentUser = {
        name: `${affiliateData.personalInfo.firstName} ${affiliateData.personalInfo.lastName}`,
        email: affiliateData.personalInfo.email,
        affiliateId: affiliateData.affiliateId,
        type: 'affiliate',
        registeredAt: new Date().toISOString()
      };
      
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('smartdeals_affiliateRegistered', 'true');
      localStorage.setItem('smartdeals_affiliateData', JSON.stringify(affiliateData));
      
      console.log('Affiliate data saved to localStorage as fallback');
      return true;
    } catch (error) {
      console.error('Failed to save affiliate to localStorage:', error);
      return false;
    }
  }

  // Get client IP address
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Failed to get client IP:', error);
      return 'unknown';
    }
  }

  // Send welcome email to new user
  async sendWelcomeEmail(email, firstName) {
    try {
      // This would integrate with your email service
      console.log(`Sending welcome email to ${email} for ${firstName}`);
      // Implementation would depend on your email service (SendGrid, Mailgun, etc.)
      return true;
    } catch (error) {
      console.error('Welcome email failed:', error);
      throw error;
    }
  }

  // Send confirmation email to affiliate
  async sendAffiliateConfirmationEmail(email, firstName) {
    try {
      // This would integrate with your email service
      console.log(`Sending affiliate confirmation email to ${email} for ${firstName}`);
      // Implementation would depend on your email service
      return true;
    } catch (error) {
      console.error('Affiliate confirmation email failed:', error);
      throw error;
    }
  }

  // Check if user exists by email
  async checkUserExists(email) {
    try {
      if (window.firebaseService && window.firebaseService.isReady()) {
        const snapshot = await window.firebaseService.db.collection('users')
          .where('personalInfo.email', '==', email.toLowerCase())
          .get();
        
        return !snapshot.empty;
      }
      
      // Fallback to localStorage check
      const savedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return savedUsers.some(user => user.personalInfo.email.toLowerCase() === email.toLowerCase());
      
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Check if affiliate exists by email
  async checkAffiliateExists(email) {
    try {
      if (window.firebaseService && window.firebaseService.isReady()) {
        const snapshot = await window.firebaseService.db.collection('affiliateRegistrations')
          .where('personalInfo.email', '==', email.toLowerCase())
          .get();
        
        return !snapshot.empty;
      }
      
      // Fallback to localStorage check
      const savedAffiliates = JSON.parse(localStorage.getItem('affiliateRegistrations') || '[]');
      return savedAffiliates.some(affiliate => affiliate.personalInfo.email.toLowerCase() === email.toLowerCase());
      
    } catch (error) {
      console.error('Error checking affiliate existence:', error);
      return false;
    }
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    
    if (password.length < minLength) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!hasUpperCase) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!hasLowerCase) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!hasNumbers) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    
    return { valid: true, message: 'Password is strong' };
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized;
  }
}

// Create and export the service
const userRegistrationService = new UserRegistrationService();

// Make it globally available
window.userRegistrationService = userRegistrationService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = userRegistrationService;
}