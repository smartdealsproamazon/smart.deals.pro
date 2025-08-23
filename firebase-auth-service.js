// Firebase Authentication & User Registration Service
// SmartDeals Pro - Complete user management system

class FirebaseAuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.isInitialized = false;
    
    // Wait for Firebase to be ready
    this.waitForFirebase();
  }

  async waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (window.firebaseService && window.firebaseService.isReady()) {
        this.isInitialized = true;
        console.log('Firebase Auth Service initialized');
        this.setupAuthListener();
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.isInitialized) {
      console.error('Firebase Auth Service failed to initialize');
    }
  }

  // Setup authentication state listener
  setupAuthListener() {
    if (!this.isInitialized) return;

    window.firebaseService.auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        this.currentUser = user;
        
        // Get additional user data from Firestore
        try {
          const userData = await this.getUserData(user.uid);
          this.currentUser.userData = userData;
        } catch (error) {
          console.error('Error getting user data:', error);
        }
        
        console.log('User signed in:', user.email);
      } else {
        // User is signed out
        this.currentUser = null;
        console.log('User signed out');
      }
      
      // Notify all listeners
      this.notifyAuthListeners(this.currentUser);
    });
  }

  // Register new user
  async registerUser(userData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase Auth Service not initialized');
      }

      const { email, password, ...profileData } = userData;

      // Create user account
      const userCredential = await window.firebaseService.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update display name
      await user.updateProfile({
        displayName: `${profileData.firstName} ${profileData.lastName}`
      });

      // Save additional user data to Firestore
      const userDocData = {
        uid: user.uid,
        email: user.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
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
          newsletter: true,
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

      await window.firebaseService.setDocument('users', user.uid, userDocData);

      // Send verification email
      await user.sendEmailVerification();

      console.log('User registered successfully:', user.uid);
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
      }

      return {
        success: false,
        error: error.code,
        message: errorMessage
      };
    }
  }

  // Sign in user
  async signInUser(email, password) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase Auth Service not initialized');
      }

      const userCredential = await window.firebaseService.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update last login
      await this.updateUserData(user.uid, {
        lastLogin: window.firebaseService.getTimestamp()
      });

      console.log('User signed in successfully:', user.email);
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
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
      }

      return {
        success: false,
        error: error.code,
        message: errorMessage
      };
    }
  }

  // Sign out user
  async signOutUser() {
    try {
      await window.firebaseService.auth.signOut();
      return {
        success: true,
        message: 'Signed out successfully!'
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        message: 'Sign out failed. Please try again.'
      };
    }
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userData = await window.firebaseService.getDocument('users', uid);
      return userData;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Update user data
  async updateUserData(uid, updateData) {
    try {
      await window.firebaseService.setDocument('users', uid, updateData);
      console.log('User data updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await window.firebaseService.auth.sendPasswordResetEmail(email);
      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Password reset failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is signed in
  isSignedIn() {
    return !!this.currentUser;
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUser?.userData?.accountType === 'admin';
  }

  // Check if user is affiliate
  isAffiliate() {
    return this.currentUser?.userData?.accountType === 'affiliate';
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    
    // Call immediately with current state
    if (this.isInitialized) {
      callback(this.currentUser);
    }
  }

  // Notify all auth listeners
  notifyAuthListeners(user) {
    this.authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      if (!this.currentUser) {
        throw new Error('No user signed in');
      }

      // Update Firebase Auth profile
      if (profileData.displayName) {
        await this.currentUser.updateProfile({
          displayName: profileData.displayName
        });
      }

      // Update Firestore data
      const updateData = {};
      if (profileData.firstName) updateData.firstName = profileData.firstName;
      if (profileData.lastName) updateData.lastName = profileData.lastName;
      if (profileData.phone) updateData.phone = profileData.phone;
      if (profileData.country) updateData.country = profileData.country;
      if (profileData.city) updateData.city = profileData.city;
      if (profileData.address) updateData.address = profileData.address;
      if (profileData.dateOfBirth) updateData.dateOfBirth = profileData.dateOfBirth;
      if (profileData.gender) updateData.gender = profileData.gender;
      if (profileData.bio) updateData['profile.bio'] = profileData.bio;
      if (profileData.website) updateData['profile.website'] = profileData.website;

      await this.updateUserData(this.currentUser.uid, updateData);

      return { success: true, message: 'Profile updated successfully!' };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: 'Failed to update profile. Please try again.' };
    }
  }

  // Get all users (Admin only)
  async getAllUsers() {
    try {
      if (!this.isAdmin()) {
        throw new Error('Unauthorized: Admin access required');
      }

      const users = await window.firebaseService.getCollection('users', 'joinDate', 'desc');
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Delete user account
  async deleteUserAccount(uid = null) {
    try {
      const targetUid = uid || this.currentUser?.uid;
      
      if (!targetUid) {
        throw new Error('No user to delete');
      }

      // Delete user data from Firestore
      await window.firebaseService.deleteDocument('users', targetUid);

      // If deleting current user, delete Firebase Auth account
      if (!uid && this.currentUser) {
        await this.currentUser.delete();
      }

      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Error deleting user account:', error);
      return { success: false, message: 'Failed to delete account. Please try again.' };
    }
  }
}

// Create global instance
const firebaseAuthService = new FirebaseAuthService();

// Export for use in other files
window.firebaseAuthService = firebaseAuthService;