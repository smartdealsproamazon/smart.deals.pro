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

      // Save additional user data to Firestore
      console.log('Saving user data to Firestore...');
      const userDocData = {
        uid: user.uid,
        email: user.email,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
        country: profileData.country || '',
        city: profileData.city || '',
        address: profileData.address || '',
        dateOfBirth: profileData.dateOfBirth || '',
        gender: profileData.gender || '',
        interests: profileData.interests || [],
        accountType: 'user', // user, affiliate, admin
        isActive: true,
        isVerified: false,
        joinDate: window.firebaseService.getTimestamp(),
        lastLogin: window.firebaseService.getTimestamp(),
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
        preferences: {
          newsletter: profileData.newsletter !== false,
          notifications: true,
          marketingEmails: false
        },
        stats: {
          productsSubmitted: 0,
          ordersPlaced: 0,
          totalSpent: 0,
          referrals: 0
        }
      };

      // Save to Firestore with timeout
      await Promise.race([
        window.firebaseService.setDocument('users', user.uid, userDocData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Data save timeout - account created but data not saved')), 15000)
        )
      ]);

      console.log('User data saved to Firestore');

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