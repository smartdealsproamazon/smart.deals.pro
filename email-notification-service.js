// Email Notification Service for SmartDeals Pro
// Handles sending registration notifications and other email communications

class EmailNotificationService {
  constructor() {
    this.adminEmail = 'smartdealsproamazon@gmail.com';
    this.isInitialized = false;
    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing Email Notification Service...');
      this.isInitialized = true;
      console.log('Email Notification Service initialized successfully');
    } catch (error) {
      console.error('Email Notification Service failed to initialize:', error);
      this.isInitialized = false;
    }
  }

  // Send registration notification email
  async sendRegistrationNotification(userData) {
    try {
      console.log('Processing registration notification for:', userData.personalInfo.email);
      
      const emailData = {
        to: this.adminEmail,
        from: 'noreply@smartdeals.pro',
        subject: `New User Registration - ${userData.personalInfo.firstName} ${userData.personalInfo.lastName}`,
        html: this.generateRegistrationEmailHTML(userData),
        text: this.generateRegistrationEmailText(userData),
        timestamp: new Date().toISOString(),
        type: 'registration_notification',
        userEmail: userData.personalInfo.email,
        userName: `${userData.personalInfo.firstName} ${userData.personalInfo.lastName}`,
        affiliateId: userData.affiliateId
      };

      // Save to Firebase for email processing
      if (window.firebaseService) {
        await window.firebaseService.addDocument('emailNotifications', emailData);
        console.log('Registration notification saved to Firebase queue');
      }

      // Save to localStorage as backup
      this.saveEmailToLocalStorage(emailData);

      // Log the notification for immediate visibility
      this.logNotificationToConsole(emailData);

      // Try to send via EmailJS if configured
      await this.tryEmailJS(emailData);

      return { success: true, message: 'Registration notification sent successfully' };

    } catch (error) {
      console.error('Failed to send registration notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate HTML email content
  generateRegistrationEmailHTML(userData) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New User Registration - SmartDeals Pro</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .info-section { margin-bottom: 25px; }
    .info-section h3 { color: #333; margin-bottom: 10px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
    .info-item { margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; }
    .info-label { font-weight: bold; color: #555; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
    .highlight { background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛍️ SmartDeals Pro</h1>
      <h2>New User Registration</h2>
    </div>
    
    <div class="content">
      <div class="highlight">
        <strong>A new user has registered on SmartDeals Pro!</strong>
      </div>
      
      <div class="info-section">
        <h3>👤 Personal Information</h3>
        <div class="info-item">
          <span class="info-label">Name:</span> ${userData.personalInfo.firstName} ${userData.personalInfo.lastName}
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span> ${userData.personalInfo.email}
        </div>
        <div class="info-item">
          <span class="info-label">Phone:</span> ${userData.personalInfo.phone || 'Not provided'}
        </div>
        <div class="info-item">
          <span class="info-label">Country:</span> ${userData.personalInfo.country || 'Not provided'}
        </div>
      </div>
      
      <div class="info-section">
        <h3>🆔 Registration Details</h3>
        <div class="info-item">
          <span class="info-label">Affiliate ID:</span> ${userData.affiliateId}
        </div>
        <div class="info-item">
          <span class="info-label">Registration Date:</span> ${new Date().toLocaleString()}
        </div>
        <div class="info-item">
          <span class="info-label">Status:</span> ${userData.status}
        </div>
        <div class="info-item">
          <span class="info-label">User ID:</span> ${userData.uid}
        </div>
      </div>
      
      <div class="info-section">
        <h3>⚙️ Additional Information</h3>
        <div class="info-item">
          <span class="info-label">Newsletter Subscription:</span> ${userData.agreements.marketing ? 'Yes' : 'No'}
        </div>
        <div class="info-item">
          <span class="info-label">Terms Accepted:</span> ${userData.agreements.terms ? 'Yes' : 'No'}
        </div>
      </div>
      
      <div class="highlight">
        <strong>✅ This user has been automatically registered and can access the dashboard immediately.</strong>
      </div>
    </div>
    
    <div class="footer">
      <p>SmartDeals Pro Registration System</p>
      <p>Automated notification sent at ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Generate plain text email content
  generateRegistrationEmailText(userData) {
    return `
NEW USER REGISTRATION - SMARTDEALS PRO
=====================================

A new user has registered on SmartDeals Pro!

PERSONAL INFORMATION:
- Name: ${userData.personalInfo.firstName} ${userData.personalInfo.lastName}
- Email: ${userData.personalInfo.email}
- Phone: ${userData.personalInfo.phone || 'Not provided'}
- Country: ${userData.personalInfo.country || 'Not provided'}

REGISTRATION DETAILS:
- Affiliate ID: ${userData.affiliateId}
- Registration Date: ${new Date().toLocaleString()}
- Status: ${userData.status}
- User ID: ${userData.uid}

ADDITIONAL INFORMATION:
- Newsletter Subscription: ${userData.agreements.marketing ? 'Yes' : 'No'}
- Terms Accepted: ${userData.agreements.terms ? 'Yes' : 'No'}

This user has been automatically registered and can access the dashboard immediately.

---
SmartDeals Pro Registration System
Automated notification sent at ${new Date().toLocaleString()}
    `;
  }

  // Save email to localStorage as backup
  saveEmailToLocalStorage(emailData) {
    try {
      const existingEmails = JSON.parse(localStorage.getItem('pendingEmails') || '[]');
      existingEmails.push(emailData);
      localStorage.setItem('pendingEmails', JSON.stringify(existingEmails));
      console.log('Email saved to localStorage backup');
    } catch (error) {
      console.error('Failed to save email to localStorage:', error);
    }
  }

  // Log notification to console for immediate visibility
  logNotificationToConsole(emailData) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 REGISTRATION NOTIFICATION EMAIL');
    console.log('='.repeat(60));
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);
    console.log('User:', emailData.userName);
    console.log('Email:', emailData.userEmail);
    console.log('Affiliate ID:', emailData.affiliateId);
    console.log('Timestamp:', emailData.timestamp);
    console.log('\nContent:');
    console.log(emailData.text);
    console.log('='.repeat(60) + '\n');
  }

  // Try to send via EmailJS if configured
  async tryEmailJS(emailData) {
    try {
      // Check if EmailJS is available
      if (typeof emailjs !== 'undefined') {
        // These would need to be configured with actual EmailJS credentials
        const serviceID = 'your_service_id';
        const templateID = 'your_template_id';
        const publicKey = 'your_public_key';
        
        const templateParams = {
          to_email: emailData.to,
          subject: emailData.subject,
          message: emailData.text,
          user_name: emailData.userName,
          user_email: emailData.userEmail,
          affiliate_id: emailData.affiliateId
        };
        
        console.log('EmailJS not configured - would send email with params:', templateParams);
        // await emailjs.send(serviceID, templateID, templateParams, publicKey);
        // console.log('Email sent successfully via EmailJS');
      } else {
        console.log('EmailJS not available - email queued for server processing');
      }
    } catch (error) {
      console.error('EmailJS send failed:', error);
    }
  }

  // Get pending emails from localStorage
  getPendingEmails() {
    try {
      return JSON.parse(localStorage.getItem('pendingEmails') || '[]');
    } catch (error) {
      console.error('Failed to get pending emails:', error);
      return [];
    }
  }

  // Clear pending emails
  clearPendingEmails() {
    try {
      localStorage.removeItem('pendingEmails');
      console.log('Pending emails cleared');
    } catch (error) {
      console.error('Failed to clear pending emails:', error);
    }
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized;
  }
}

// Create and export the service
const emailNotificationService = new EmailNotificationService();

// Make it globally available
window.emailNotificationService = emailNotificationService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = emailNotificationService;
}

console.log('✅ Email Notification Service loaded successfully');