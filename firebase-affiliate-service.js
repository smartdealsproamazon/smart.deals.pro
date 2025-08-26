// Firebase Affiliate Registration Service
// SmartDeals Pro - Affiliate Management System

class FirebaseAffiliateService {
  constructor() {
    this.collectionName = 'affiliateRegistrations';
    this.initialized = false;
    this.init();
  }

  // Initialize the service
  async init() {
    try {
      await this.waitForFirebase();
      this.db = firebase.firestore();
      this.initialized = true;
      console.log('Firebase Affiliate Service initialized successfully');
    } catch (error) {
      console.error('Firebase Affiliate Service initialization failed:', error);
    }
  }

  // Wait for Firebase to be available
  waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkFirebase = () => {
        attempts++;
        
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Firebase not available after maximum attempts'));
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      
      checkFirebase();
    });
  }

  // Check if service is ready
  isReady() {
    return this.initialized && this.db;
  }

  // Generate unique affiliate ID
  generateAffiliateId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AFF${timestamp.slice(-6)}${random}`;
  }

  // Validate affiliate data
  validateAffiliateData(data) {
    const required = ['firstName', 'lastName', 'email', 'phone', 'country'];
    const missing = required.filter(field => !data[field] || data[field].trim() === '');
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Phone validation (basic)
    if (data.phone && data.phone.length < 8) {
      throw new Error('Phone number must be at least 8 digits');
    }

    return true;
  }

  // Create affiliate registration document structure
  createAffiliateDocument(formData) {
    this.validateAffiliateData(formData);

    const affiliateId = this.generateAffiliateId();
    const now = new Date();

    return {
      // Unique identifiers
      affiliateId: affiliateId,
      documentId: null, // Will be set after Firestore save
      
      // Personal Information
      personalInfo: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        country: formData.country,
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      },

      // Marketing Experience
      experience: {
        level: formData.experience || 'beginner',
        platforms: Array.isArray(formData.platforms) ? formData.platforms : [],
        monthlyRevenue: formData.revenue || 'under-1000',
        yearsActive: this.calculateYearsFromExperience(formData.experience)
      },

      // Online Presence
      onlinePresence: {
        website: formData.website ? formData.website.trim() : '',
        socialMedia: {
          facebook: formData.facebook ? formData.facebook.trim() : '',
          instagram: formData.instagram ? formData.instagram.trim() : '',
          youtube: formData.youtube ? formData.youtube.trim() : '',
          tiktok: formData.tiktok ? formData.tiktok.trim() : ''
        },
        marketingStrategy: formData.strategy ? formData.strategy.trim() : ''
      },

      // Agreement confirmations
      agreements: {
        termsAccepted: formData.terms || false,
        marketingConsent: formData.marketing || false,
        qualityStandards: formData.quality || false,
        agreementDate: now.toISOString()
      },

      // Status and metadata
      status: {
        registrationStatus: 'pending', // pending, approved, rejected, suspended
        approvalDate: null,
        approvedBy: null,
        rejectionReason: null,
        accountActive: false
      },

      // Timestamps
      timestamps: {
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        registrationDate: now.toISOString(),
        lastLoginAt: null,
        lastActivityAt: null
      },

      // Performance metrics (for future use)
      metrics: {
        totalSales: 0,
        totalCommission: 0,
        activeProducts: 0,
        conversionRate: 0,
        totalClicks: 0,
        totalViews: 0
      },

      // Additional metadata
      metadata: {
        registrationSource: 'website',
        userAgent: navigator.userAgent || '',
        ipAddress: null, // Would need backend service to capture
        referralSource: document.referrer || '',
        utmParameters: this.extractUtmParameters()
      }
    };
  }

  // Extract UTM parameters from URL
  extractUtmParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_content: urlParams.get('utm_content') || '',
      utm_term: urlParams.get('utm_term') || ''
    };
  }

  // Calculate years from experience level
  calculateYearsFromExperience(level) {
    const mapping = {
      'beginner': 0,
      'intermediate': 2,
      'advanced': 5,
      'expert': 10
    };
    return mapping[level] || 0;
  }

  // Register new affiliate
  async registerAffiliate(formData) {
    try {
      if (!this.isReady()) {
        throw new Error('Firebase Affiliate Service not ready');
      }

      // Check if affiliate already exists
      const existingAffiliate = await this.getAffiliateByEmail(formData.email);
      if (existingAffiliate) {
        throw new Error('An affiliate account with this email already exists');
      }

      // Create affiliate document
      const affiliateDocument = this.createAffiliateDocument(formData);

      // Save to Firestore
      const docRef = await this.db.collection(this.collectionName).add(affiliateDocument);
      
      // Update document with Firestore document ID
      await docRef.update({
        documentId: docRef.id,
        'timestamps.updatedAt': new Date().toISOString()
      });

      affiliateDocument.documentId = docRef.id;

      console.log('Affiliate registered successfully:', docRef.id);

      // Save to localStorage as backup
      this.saveToLocalStorage(affiliateDocument);

      // Send welcome email (if email service available)
      try {
        await this.sendWelcomeEmail(affiliateDocument);
      } catch (emailError) {
        console.warn('Welcome email failed to send:', emailError);
      }

      return {
        success: true,
        affiliateId: affiliateDocument.affiliateId,
        documentId: docRef.id,
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

  // Get affiliate by email
  async getAffiliateByEmail(email) {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const snapshot = await this.db.collection(this.collectionName)
        .where('personalInfo.email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };

    } catch (error) {
      console.error('Error getting affiliate by email:', error);
      throw error;
    }
  }

  // Get affiliate by ID
  async getAffiliateById(affiliateId) {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const snapshot = await this.db.collection(this.collectionName)
        .where('affiliateId', '==', affiliateId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };

    } catch (error) {
      console.error('Error getting affiliate by ID:', error);
      throw error;
    }
  }

  // Update affiliate status
  async updateAffiliateStatus(affiliateId, status, approvedBy = null, rejectionReason = null) {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const affiliate = await this.getAffiliateById(affiliateId);
      if (!affiliate) {
        throw new Error('Affiliate not found');
      }

      const updateData = {
        'status.registrationStatus': status,
        'timestamps.updatedAt': new Date().toISOString()
      };

      if (status === 'approved') {
        updateData['status.approvalDate'] = new Date().toISOString();
        updateData['status.approvedBy'] = approvedBy;
        updateData['status.accountActive'] = true;
      } else if (status === 'rejected') {
        updateData['status.rejectionReason'] = rejectionReason;
        updateData['status.accountActive'] = false;
      }

      await this.db.collection(this.collectionName).doc(affiliate.id).update(updateData);

      console.log(`Affiliate ${affiliateId} status updated to ${status}`);
      return { success: true, message: `Status updated to ${status}` };

    } catch (error) {
      console.error('Error updating affiliate status:', error);
      throw error;
    }
  }

  // Get all affiliates with pagination
  async getAllAffiliates(limit = 50, startAfter = null, status = null) {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      let query = this.db.collection(this.collectionName)
        .orderBy('timestamps.createdAt', 'desc');

      if (status) {
        query = query.where('status.registrationStatus', '==', status);
      }

      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      query = query.limit(limit);

      const snapshot = await query.get();
      
      const affiliates = [];
      snapshot.forEach(doc => {
        affiliates.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        affiliates,
        hasMore: snapshot.docs.length === limit,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };

    } catch (error) {
      console.error('Error getting affiliates:', error);
      throw error;
    }
  }

  // Save to localStorage as backup
  saveToLocalStorage(affiliateData) {
    try {
      const savedAffiliates = JSON.parse(localStorage.getItem('affiliateRegistrations') || '[]');
      savedAffiliates.push(affiliateData);
      localStorage.setItem('affiliateRegistrations', JSON.stringify(savedAffiliates));
      
      // Save current user session
      const currentUser = {
        name: affiliateData.personalInfo.fullName,
        email: affiliateData.personalInfo.email,
        affiliateId: affiliateData.affiliateId,
        type: 'affiliate',
        registeredAt: affiliateData.timestamps.createdAt
      };
      
      localStorage.setItem('smartdeals_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('smartdeals_affiliateRegistered', 'true');
      
      console.log('Affiliate data saved to localStorage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Send welcome email
  async sendWelcomeEmail(affiliateData) {
    try {
      const emailData = {
        _subject: 'Welcome to SmartDeals Pro Affiliate Program',
        name: affiliateData.personalInfo.fullName,
        email: affiliateData.personalInfo.email,
        affiliateId: affiliateData.affiliateId,
        registrationDate: new Date(affiliateData.timestamps.createdAt).toLocaleDateString()
      };

      const response = await fetch('https://formsubmit.co/ajax/smartdealsproamazon@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('Welcome email sent successfully');
      } else {
        throw new Error('Email service response not ok');
      }

    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  // Delete affiliate (admin function)
  async deleteAffiliate(affiliateId) {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const affiliate = await this.getAffiliateById(affiliateId);
      if (!affiliate) {
        throw new Error('Affiliate not found');
      }

      await this.db.collection(this.collectionName).doc(affiliate.id).delete();
      
      console.log(`Affiliate ${affiliateId} deleted successfully`);
      return { success: true, message: 'Affiliate deleted successfully' };

    } catch (error) {
      console.error('Error deleting affiliate:', error);
      throw error;
    }
  }

  // Get affiliate statistics
  async getAffiliateStats() {
    try {
      if (!this.isReady()) {
        throw new Error('Service not ready');
      }

      const [totalSnapshot, pendingSnapshot, approvedSnapshot, rejectedSnapshot] = await Promise.all([
        this.db.collection(this.collectionName).get(),
        this.db.collection(this.collectionName).where('status.registrationStatus', '==', 'pending').get(),
        this.db.collection(this.collectionName).where('status.registrationStatus', '==', 'approved').get(),
        this.db.collection(this.collectionName).where('status.registrationStatus', '==', 'rejected').get()
      ]);

      return {
        total: totalSnapshot.size,
        pending: pendingSnapshot.size,
        approved: approvedSnapshot.size,
        rejected: rejectedSnapshot.size,
        active: approvedSnapshot.docs.filter(doc => doc.data().status.accountActive).length
      };

    } catch (error) {
      console.error('Error getting affiliate stats:', error);
      throw error;
    }
  }
}

// Initialize the service when the script loads
window.firebaseAffiliateService = new FirebaseAffiliateService();

// Make it available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseAffiliateService;
}