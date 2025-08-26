# Firebase Affiliate Registration Setup

## Overview

This document outlines the complete setup for Firebase affiliate registration collection in SmartDeals Pro. The system includes a dedicated service for managing affiliate registrations with proper data structure, validation, and security rules.

## 🏗️ Architecture

### Collection Structure
- **Collection Name**: `affiliateRegistrations`
- **Service File**: `firebase-affiliate-service.js`
- **Security Rules**: `firestore-security-rules.txt`
- **Integration**: `affiliate-register.html`

### Data Schema

```javascript
{
  // Unique identifiers
  affiliateId: "AFF123456ABCDEF",
  documentId: "firebase-generated-id",
  
  // Personal Information
  personalInfo: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    country: "US",
    fullName: "John Doe"
  },

  // Marketing Experience
  experience: {
    level: "intermediate", // beginner|intermediate|advanced|expert
    platforms: ["facebook", "instagram", "youtube"],
    monthlyRevenue: "1000-5000",
    yearsActive: 2
  },

  // Online Presence
  onlinePresence: {
    website: "https://example.com",
    socialMedia: {
      facebook: "https://facebook.com/user",
      instagram: "@username",
      youtube: "https://youtube.com/channel",
      tiktok: "@username"
    },
    marketingStrategy: "Detailed strategy description"
  },

  // Agreement confirmations
  agreements: {
    termsAccepted: true,
    marketingConsent: true,
    qualityStandards: true,
    agreementDate: "2025-01-28T10:30:00.000Z"
  },

  // Status and metadata
  status: {
    registrationStatus: "pending", // pending|approved|rejected|suspended
    approvalDate: null,
    approvedBy: null,
    rejectionReason: null,
    accountActive: false
  },

  // Timestamps
  timestamps: {
    createdAt: "2025-01-28T10:30:00.000Z",
    updatedAt: "2025-01-28T10:30:00.000Z",
    registrationDate: "2025-01-28T10:30:00.000Z",
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
    registrationSource: "website",
    userAgent: "Browser user agent string",
    ipAddress: null,
    referralSource: "https://referring-site.com",
    utmParameters: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: ""
    }
  }
}
```

## 🚀 Setup Instructions

### 1. Firebase Configuration

Ensure your `firebase-config.js` is properly configured with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. Deploy Security Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the content from `firestore-security-rules.txt`
3. Replace existing rules with the new content
4. Click "Publish" to deploy

### 3. Include Service Files

Add the affiliate service to your HTML pages:

```html
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="firebase-affiliate-service.js"></script>
```

### 4. Test the Setup

Use the test page `test-affiliate-firebase.html` to verify everything is working:

1. Open the test page in your browser
2. Check service status
3. Test collection access
4. Test registration functionality
5. Test data retrieval

## 🔧 Service API

### FirebaseAffiliateService Methods

#### Registration
```javascript
// Register new affiliate
const result = await window.firebaseAffiliateService.registerAffiliate(formData);
```

#### Data Retrieval
```javascript
// Get affiliate by email
const affiliate = await window.firebaseAffiliateService.getAffiliateByEmail(email);

// Get affiliate by ID
const affiliate = await window.firebaseAffiliateService.getAffiliateById(affiliateId);

// Get all affiliates with pagination
const result = await window.firebaseAffiliateService.getAllAffiliates(limit, startAfter, status);

// Get collection statistics
const stats = await window.firebaseAffiliateService.getAffiliateStats();
```

#### Management (Admin Functions)
```javascript
// Update affiliate status
await window.firebaseAffiliateService.updateAffiliateStatus(affiliateId, 'approved', 'admin-id');

// Delete affiliate (admin only)
await window.firebaseAffiliateService.deleteAffiliate(affiliateId);
```

#### Service Status
```javascript
// Check if service is ready
const isReady = window.firebaseAffiliateService.isReady();
```

## 🔒 Security Features

### Validation
- Required field validation
- Email format validation
- Phone number validation
- Data structure validation
- Terms acceptance requirement

### Access Control
- Public registration (no auth required)
- Admin-only status updates
- Read access for authenticated users
- Secure delete operations

### Data Protection
- Structured data validation
- Input sanitization
- Error handling
- Fallback to localStorage

## 📊 Collection Statistics

The service provides real-time statistics:
- Total registrations
- Pending approvals
- Approved affiliates
- Rejected applications
- Active accounts

## 🔄 Form Integration

### Basic Usage in HTML Forms

```javascript
// Collect form data
const formData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  country: 'US',
  experience: 'intermediate',
  platforms: ['facebook', 'instagram'],
  revenue: '1000-5000',
  website: 'https://example.com',
  // ... other fields
  terms: true,
  marketing: true,
  quality: true
};

// Register affiliate
try {
  const result = await window.firebaseAffiliateService.registerAffiliate(formData);
  
  if (result.success) {
    console.log('Registration successful:', result.affiliateId);
    // Redirect to dashboard
    window.location.href = 'affiliate-dashboard.html';
  } else {
    console.error('Registration failed:', result.message);
  }
} catch (error) {
  console.error('Error:', error.message);
}
```

## 🚨 Error Handling

The service includes comprehensive error handling:

```javascript
// Service errors
- 'Firebase Affiliate Service not ready'
- 'An affiliate account with this email already exists'
- 'Missing required fields: firstName, lastName, email'
- 'Invalid email format'
- 'Phone number must be at least 8 digits'

// Firebase errors
- Network connectivity issues
- Permission denied
- Collection access errors
- Document not found
```

## 📈 Performance Considerations

### Optimization Features
- Batch operations for statistics
- Pagination for large datasets
- Indexed queries for fast lookups
- Local storage fallback
- Connection retry logic

### Best Practices
- Use pagination for listing affiliates
- Index frequently queried fields
- Monitor Firestore usage
- Implement caching where appropriate

## 🔧 Maintenance

### Regular Tasks
1. Monitor affiliate registration statistics
2. Review pending applications
3. Update security rules as needed
4. Clean up test data
5. Monitor Firebase usage

### Troubleshooting
1. Check browser console for errors
2. Verify Firebase configuration
3. Test with `test-affiliate-firebase.html`
4. Review Firestore security rules
5. Check network connectivity

## 📝 Changelog

### v1.0.0 (2025-01-28)
- Initial Firebase affiliate registration service
- Complete data schema implementation
- Security rules setup
- Form integration
- Test page creation
- Documentation

## 🎯 Future Enhancements

### Planned Features
- Admin dashboard for affiliate management
- Email notification system
- Advanced analytics
- Bulk operations
- Export functionality
- Performance metrics tracking

### Integration Opportunities
- User authentication system
- Payment processing
- Commission tracking
- Product assignment
- Performance reporting

## 📞 Support

For issues or questions:
1. Check the test page for service status
2. Review browser console for errors
3. Verify Firebase configuration
4. Check security rules
5. Contact development team

---

**Note**: This setup provides a robust foundation for affiliate registration with Firebase. The system is designed to be scalable, secure, and maintainable.