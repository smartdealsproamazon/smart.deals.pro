// Firebase Authentication & User Registration Service
// SmartDeals Pro - Enhanced with better error handling and timeout management

class FirebaseAuthService {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.authStateListeners = [];
    
    // Initialize the service
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Firebase Auth Service...');
      
      // Wait for Firebase to be available
      await this.waitForFirebase();
      
      // Wait for Firebase service to be ready
      await this.waitForFirebaseService();
      
      this.isInitialized = true;
      console.log('Firebase Auth Service initialized successfully');
      
      // Set up auth state listener
      this.setupAuthStateListener();
      
    } catch (error) {
      console.error('Firebase Auth Service failed to initialize:', error);
      this.isInitialized = false;
    }
  }

  async waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkFirebase = () => {
        attempts++;
        
        if (typeof firebase !== 'undefined' && firebase.auth) {
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

  setupAuthStateListener() {
    if (!this.isInitialized || !window.firebaseService) {
      console.error('Cannot setup auth state listener - service not initialized');
      return;
    }

    window.firebaseService.auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      
      // Notify all listeners
      this.authStateListeners.forEach(listener => {
        try {
          listener(user);
        } catch (error) {
          console.error('Error in auth state listener:', error);
        }
      });
    });
  }

  // Register new user with improved error handling and timeout
  async registerUser(userData) {
    try {
      console.log('Starting user registration...');
      
      // Ensure service is initialized
      if (!this.isInitialized) {
        throw new Error('Firebase Auth Service not initialized');
      }

      if (!window.firebaseService || !window.firebaseService.auth) {
        throw new Error('Firebase Auth not available');
      }

      const { email, password, ...profileData } = userData;

      // Validate required fields
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      console.log('Creating user account...');
      
      // Create user account with timeout
      const userCredential = await Promise.race([
        window.firebaseService.auth.createUserWithEmailAndPassword(email, password),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registration timeout - please try again')), 30000)
        )
      ]);
      
      const user = userCredential.user;
      console.log('User account created:', user.uid);

      // Update display name
      if (profileData.firstName || profileData.lastName) {
        console.log('Updating user profile...');
        await user.updateProfile({
          displayName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
        });
      }

      // Save user registration data to dedicated userRegistrations collection
      console.log('Saving user registration data to Firestore...');
      const userRegistrationData = {
        // User Identity
        uid: user.uid,
        email: user.email,
        
        // Personal Information (from registration form)
        personalInfo: {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
          phone: profileData.phone || '',
          dateOfBirth: profileData.dateOfBirth || '',
          gender: profileData.gender || ''
        },
        
        // Location Information
        locationInfo: {
          country: profileData.country || '',
          city: profileData.city || '',
          address: profileData.address || ''
        },
        
        // Account Settings
        accountInfo: {
          accountType: 'user', // user, affiliate, admin
          isActive: true,
          isVerified: false,
          registrationDate: window.firebaseService.getTimestamp(),
          lastLogin: window.firebaseService.getTimestamp(),
          registrationSource: 'website'
        },
        
        // User Preferences (from registration form)
        preferences: {
          newsletter: profileData.newsletter !== false,
          notifications: true,
          marketingEmails: profileData.newsletter !== false,
          interests: profileData.interests || []
        },
        
        // Profile Setup (can be updated later)
        profile: {
          avatar: '',
          bio: '',
          website: '',
          socialLinks: {
            facebook: '',
            instagram: '',
            twitter: ''
          }
        },
        
        // User Statistics
        stats: {
          productsSubmitted: 0,
          ordersPlaced: 0,
          totalSpent: 0,
          referrals: 0,
          loginCount: 1
        }
      };

      // Save to userRegistrations collection with timeout
      await Promise.race([
        window.firebaseService.setDocument('userRegistrations', user.uid, userRegistrationData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registration data save timeout')), 15000)
        )
      ]);

      console.log('User registration data saved to userRegistrations collection');

      // Also save simplified user data to users collection for backward compatibility
      const basicUserData = {
        uid: user.uid,
        email: user.email,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
        country: profileData.country || '',
        city: profileData.city || '',
        accountType: 'user',
        isActive: true,
        joinDate: window.firebaseService.getTimestamp()
      };

      await Promise.race([
        window.firebaseService.setDocument('users', user.uid, basicUserData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Basic user data save timeout')), 15000)
        )
      ]);

      console.log('Basic user data saved to users collection');

      // Create affiliate data structure for dashboard compatibility
      console.log('Creating affiliate data structure...');
      const affiliateData = {
        uid: user.uid,
        personalInfo: {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: user.email,
          phone: profileData.phone || '',
          country: profileData.country || ''
        },
        experience: {
          level: 'beginner',
          platforms: [],
          revenue: ''
        },
        onlinePresence: {
          website: '',
          facebook: '',
          instagram: '',
          youtube: '',
          tiktok: '',
          strategy: ''
        },
        agreements: {
          terms: true,
          marketing: profileData.newsletter !== false,
          quality: true
        },
        status: 'active',
        registrationDate: window.firebaseService.getTimestamp(),
        lastUpdate: window.firebaseService.getTimestamp(),
        affiliateId: this.generateAffiliateId()
      };

      // Save affiliate data
      await Promise.race([
        window.firebaseService.setDocument('affiliateRegistrations', user.uid, affiliateData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Affiliate data save timeout')), 15000)
        )
      ]);

      console.log('Affiliate data saved to Firestore');

      // Save comprehensive registration data to localStorage for dashboard compatibility
      const currentUser = {
        name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
        email: user.email,
        type: 'user',
        uid: user.uid,
        phone: profileData.phone || '',
        country: profileData.country || '',
        city: profileData.city || '',
        registeredAt: new Date().toISOString()
      };
      
      // Save complete registration data separately for profile management
      const registrationData = {
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: user.email,
        phone: profileData.phone || '',
        country: profileData.country || '',
        city: profileData.city || '',
        dateOfBirth: profileData.dateOfBirth || '',
        gender: profileData.gender || '',
        interests: profileData.interests || [],
        newsletter: profileData.newsletter !== false,
        registeredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('smartdeals_affiliateRegistered', 'true');
      localStorage.setItem('smartdeals_affiliateData', JSON.stringify(affiliateData));
      localStorage.setItem('smartdeals_userRegistrationData', JSON.stringify(registrationData));

      // Send email notification about new registration
      if (window.emailNotificationService && window.emailNotificationService.isReady()) {
        // Convert affiliateData to the expected format for email service
        const emailData = {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: user.email,
          phone: profileData.phone || '',
          country: profileData.country || '',
          city: profileData.city || '',
          dateOfBirth: profileData.dateOfBirth || '',
          gender: profileData.gender || '',
          interests: profileData.interests || [],
          newsletter: profileData.newsletter !== false,
          accountType: 'affiliate',
          uid: user.uid
        };
        await window.emailNotificationService.sendRegistrationNotification(emailData);
      } else {
        // Fallback to the old method
        await this.sendRegistrationNotification(affiliateData);
      }

      // Send verification email
      try {
        console.log('Sending verification email...');
        await user.sendEmailVerification();
        console.log('Verification email sent');
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError);
        // Don't fail registration if email verification fails
      }

      console.log('User registration completed successfully');
      return {
        success: true,
        user: user,
        userData: userDocData,
        affiliateData: affiliateData,
        message: 'Registration successful! Please check your email for verification.'
      };

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered. Please use a different email or sign in.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email registration is not enabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many registration attempts. Please wait a few minutes and try again.';
          break;
        default:
          if (error.message.includes('timeout')) {
            errorMessage = error.message;
          } else {
            errorMessage = `Registration failed: ${error.message}`;
          }
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

  // Send registration notification email
  async sendRegistrationNotification(affiliateData) {
    try {
      console.log('Sending registration notification email...');
      
      // Create email data
      const emailData = {
        to: 'smartdealsproamazon@gmail.com',
        subject: 'New User Registration - SmartDeals Pro',
        body: `
New User Registration Details:

Personal Information:
- Name: ${affiliateData.personalInfo.firstName} ${affiliateData.personalInfo.lastName}
- Email: ${affiliateData.personalInfo.email}
- Phone: ${affiliateData.personalInfo.phone || 'Not provided'}
- Country: ${affiliateData.personalInfo.country || 'Not provided'}

Registration Details:
- Affiliate ID: ${affiliateData.affiliateId}
- Registration Date: ${new Date().toLocaleString()}
- Status: ${affiliateData.status}

Additional Information:
- Newsletter Subscription: ${affiliateData.agreements.marketing ? 'Yes' : 'No'}
- User ID: ${affiliateData.uid}

This user has been automatically registered and can access the dashboard.
        `,
        timestamp: window.firebaseService.getTimestamp(),
        userEmail: affiliateData.personalInfo.email,
        userName: `${affiliateData.personalInfo.firstName} ${affiliateData.personalInfo.lastName}`,
        affiliateId: affiliateData.affiliateId
      };

      // Save to Firebase collection for email processing
      await window.firebaseService.addDocument('emailNotifications', emailData);
      
      console.log('Registration notification queued successfully');
      
      // For immediate testing, also log to console
      console.log('=== REGISTRATION NOTIFICATION ===');
      console.log('To: smartdealsproamazon@gmail.com');
      console.log('Subject:', emailData.subject);
      console.log('Content:', emailData.body);
      console.log('===================================');
      
    } catch (error) {
      console.error('Failed to send registration notification:', error);
      // Don't fail registration if email notification fails
    }
  }

  // Sign in user with improved error handling
  async signInUser(email, password) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase Auth Service not initialized');
      }

      if (!window.firebaseService || !window.firebaseService.auth) {
        throw new Error('Firebase Auth not available');
      }

      console.log('Signing in user...');
      
      const userCredential = await Promise.race([
        window.firebaseService.auth.signInWithEmailAndPassword(email, password),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign in timeout - please try again')), 15000)
        )
      ]);
      
      const user = userCredential.user;
      console.log('User signed in successfully:', user.uid);

      // Update last login time
      try {
        await window.firebaseService.setDocument('users', user.uid, {
          lastLogin: window.firebaseService.getTimestamp()
        });
      } catch (updateError) {
        console.warn('Failed to update last login time:', updateError);
      }

      return {
        success: true,
        user: user,
        message: 'Sign in successful!'
      };

    } catch (error) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'Sign in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please wait a few minutes and try again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          if (error.message.includes('timeout')) {
            errorMessage = error.message;
          } else {
            errorMessage = `Sign in failed: ${error.message}`;
          }
      }

      return {
        success: false,
        error: error.code || 'unknown',
        message: errorMessage
      };
    }
  }

  // Sign out user
  async signOutUser() {
    try {
      if (!this.isInitialized || !window.firebaseService) {
        throw new Error('Firebase Auth Service not initialized');
      }

      await window.firebaseService.auth.signOut();
      console.log('User signed out successfully');
      
      return {
        success: true,
        message: 'Signed out successfully'
      };

    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.code || 'unknown',
        message: 'Sign out failed. Please try again.'
      };
    }
  }

  // Get current user
  getCurrentUser() {
    if (!this.isInitialized || !window.firebaseService) {
      return null;
    }
    return window.firebaseService.getCurrentUser();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      if (!this.isInitialized || !window.firebaseService) {
        throw new Error('Firebase Auth Service not initialized');
      }

      await window.firebaseService.auth.sendPasswordResetEmail(email);
      console.log('Password reset email sent');
      
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      };

    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait a few minutes and try again.';
          break;
        default:
          errorMessage = `Password reset failed: ${error.message}`;
      }

      return {
        success: false,
        error: error.code || 'unknown',
        message: errorMessage
      };
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Update Firebase Auth profile
      if (profileData.displayName) {
        await user.updateProfile({
          displayName: profileData.displayName
        });
      }

      // Update Firestore user data
      const updateData = {};
      if (profileData.firstName) updateData.firstName = profileData.firstName;
      if (profileData.lastName) updateData.lastName = profileData.lastName;
      if (profileData.phone) updateData.phone = profileData.phone;
      if (profileData.country) updateData.country = profileData.country;
      if (profileData.city) updateData.city = profileData.city;
      if (profileData.address) updateData.address = profileData.address;
      if (profileData.dateOfBirth) updateData.dateOfBirth = profileData.dateOfBirth;
      if (profileData.gender) updateData.gender = profileData.gender;
      if (profileData.interests) updateData.interests = profileData.interests;

      if (Object.keys(updateData).length > 0) {
        await window.firebaseService.setDocument('users', user.uid, updateData);
      }

      return {
        success: true,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.code || 'unknown',
        message: `Profile update failed: ${error.message}`
      };
    }
  }

  // Delete user account
  async deleteUserAccount() {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Delete user data from Firestore
      await window.firebaseService.deleteDocument('users', user.uid);

      // Delete Firebase Auth account
      await user.delete();

      return {
        success: true,
        message: 'Account deleted successfully'
      };

    } catch (error) {
      console.error('Account deletion error:', error);
      return {
        success: false,
        error: error.code || 'unknown',
        message: `Account deletion failed: ${error.message}`
      };
    }
  }

  // Add auth state change listener
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && window.firebaseService && window.firebaseService.isReady();
  }
}

// Create and export the service
const firebaseAuthService = new FirebaseAuthService();

// Make it globally available
window.firebaseAuthService = firebaseAuthService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseAuthService;
}