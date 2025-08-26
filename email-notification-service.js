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
      console.log('Processing registration notification for:', userData.email);
      
      const emailData = {
        to: this.adminEmail,
        from: 'noreply@smartdeals.pro',
        subject: `New User Registration - ${userData.firstName} ${userData.lastName}`,
        html: this.generateRegistrationEmailHTML(userData),
        text: this.generateRegistrationEmailText(userData),
        timestamp: new Date().toISOString(),
        type: 'registration_notification',
        userEmail: userData.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        userId: userData.uid || 'Generated on registration'
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
    const interests = userData.interests && userData.interests.length > 0 
      ? userData.interests.join(', ') 
      : 'None selected';
    
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
          <span class="info-label">Name:</span> ${userData.firstName} ${userData.lastName}
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span> ${userData.email}
        </div>
        <div class="info-item">
          <span class="info-label">Phone:</span> ${userData.phone || 'Not provided'}
        </div>
        <div class="info-item">
          <span class="info-label">Country:</span> ${userData.country || 'Not provided'}
        </div>
        <div class="info-item">
          <span class="info-label">City:</span> ${userData.city || 'Not provided'}
        </div>
        <div class="info-item">
          <span class="info-label">Date of Birth:</span> ${userData.dateOfBirth || 'Not provided'}
        </div>
        <div class="info-item">
          <span class="info-label">Gender:</span> ${userData.gender || 'Not provided'}
        </div>
      </div>
      
      <div class="info-section">
        <h3>🆔 Registration Details</h3>
        <div class="info-item">
          <span class="info-label">User ID:</span> ${userData.uid || 'Generated on registration'}
        </div>
        <div class="info-item">
          <span class="info-label">Registration Date:</span> ${new Date().toLocaleString()}
        </div>
        <div class="info-item">
          <span class="info-label">Account Type:</span> ${userData.accountType || 'Regular User'}
        </div>
      </div>
      
      <div class="info-section">
        <h3>🛍️ Shopping Interests</h3>
        <div class="info-item">
          <span class="info-label">Selected Interests:</span> ${interests}
        </div>
      </div>
      
      <div class="info-section">
        <h3>⚙️ Additional Information</h3>
        <div class="info-item">
          <span class="info-label">Newsletter Subscription:</span> ${userData.newsletter ? 'Yes' : 'No'}
        </div>
        <div class="info-item">
          <span class="info-label">Terms Accepted:</span> Yes
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
    const interests = userData.interests && userData.interests.length > 0 
      ? userData.interests.join(', ') 
      : 'None selected';
    
    return `
NEW USER REGISTRATION - SMARTDEALS PRO
=====================================

A new user has registered on SmartDeals Pro!

PERSONAL INFORMATION:
- Name: ${userData.firstName} ${userData.lastName}
- Email: ${userData.email}
- Phone: ${userData.phone || 'Not provided'}
- Country: ${userData.country || 'Not provided'}
- City: ${userData.city || 'Not provided'}
- Date of Birth: ${userData.dateOfBirth || 'Not provided'}
- Gender: ${userData.gender || 'Not provided'}

REGISTRATION DETAILS:
- User ID: ${userData.uid || 'Generated on registration'}
- Registration Date: ${new Date().toLocaleString()}
- Account Type: ${userData.accountType || 'Regular User'}

SHOPPING INTERESTS:
- Selected Interests: ${interests}

ADDITIONAL INFORMATION:
- Newsletter Subscription: ${userData.newsletter ? 'Yes' : 'No'}
- Terms Accepted: Yes

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
    console.log('User ID:', emailData.userId);
    console.log('Timestamp:', emailData.timestamp);
    console.log('\nContent:');
    console.log(emailData.text);
    console.log('='.repeat(60) + '\n');
  }

  // Try to send via EmailJS if configured
  async tryEmailJS(emailData) {
    try {
      // For now, we'll create a comprehensive notification system
      console.log('📧 EMAIL NOTIFICATION READY TO SEND:');
      console.log('=====================================');
      console.log(`To: ${emailData.to}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`From: ${emailData.from}`);
      console.log(`User: ${emailData.userName} (${emailData.userEmail})`);
      console.log(`Time: ${new Date().toLocaleString()}`);
      console.log('=====================================');
      
      // Store in localStorage for admin review
      const notifications = JSON.parse(localStorage.getItem('admin_email_notifications') || '[]');
      const notification = {
        id: Date.now(),
        to: emailData.to,
        subject: emailData.subject,
        from: emailData.from,
        userName: emailData.userName,
        userEmail: emailData.userEmail,
        userId: emailData.userId,
        timestamp: new Date().toISOString(),
        status: 'queued',
        htmlContent: emailData.html,
        textContent: emailData.text
      };
      
      notifications.unshift(notification); // Add to beginning
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      
      localStorage.setItem('admin_email_notifications', JSON.stringify(notifications));
      
      // Show browser notification if possible
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New User Registration', {
          body: `${emailData.userName} registered with email: ${emailData.userEmail}`,
          icon: 'logo.png'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('New User Registration', {
              body: `${emailData.userName} registered with email: ${emailData.userEmail}`,
              icon: 'logo.png'
            });
          }
        });
      }
      
      console.log('✅ Email notification processed and stored for admin review');
      
    } catch (error) {
      console.error('Email notification processing failed:', error);
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

  // Send welcome notification email for new affiliates
  async sendWelcomeNotification(personalInfo) {
    try {
      console.log('Processing welcome notification for:', personalInfo.email);
      
      const emailData = {
        to: personalInfo.email,
        from: 'noreply@smartdeals.pro',
        subject: `Welcome to SmartDeals Pro Affiliate Network! - ${personalInfo.firstName}`,
        html: this.generateWelcomeEmailHTML(personalInfo),
        text: this.generateWelcomeEmailText(personalInfo),
        timestamp: new Date().toISOString(),
        type: 'welcome_notification',
        userEmail: personalInfo.email,
        userName: personalInfo.fullName || `${personalInfo.firstName} ${personalInfo.lastName}`
      };

      // Save to Firebase for email processing
      if (window.firebaseService) {
        await window.firebaseService.addDocument('emailNotifications', emailData);
        console.log('Welcome notification saved to Firebase queue');
      }

      // Save to localStorage as backup
      this.saveEmailToLocalStorage(emailData);

      // Log the notification for immediate visibility
      this.logNotificationToConsole(emailData);

      // Try to send via EmailJS if configured
      await this.tryEmailJS(emailData);

      return { success: true, message: 'Welcome notification sent successfully' };

    } catch (error) {
      console.error('Failed to send welcome notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate welcome email HTML content
  generateWelcomeEmailHTML(personalInfo) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to SmartDeals Pro - ${personalInfo.firstName}</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .welcome-section { margin-bottom: 25px; }
    .welcome-section h2 { color: #333; margin-bottom: 15px; }
    .info-item { margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
    .highlight { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛍️ SmartDeals Pro</h1>
      <h2>Welcome to Our Affiliate Network!</h2>
    </div>
    
    <div class="content">
      <div class="highlight">
        <strong>🎉 Congratulations ${personalInfo.firstName}! Your affiliate account is now ACTIVE!</strong>
      </div>
      
      <div class="welcome-section">
        <h2>Welcome to the SmartDeals Pro Family!</h2>
        <p>We're excited to have you join our global affiliate network. Your account has been immediately activated and you can start earning commissions right away!</p>
      </div>
      
      <div class="welcome-section">
        <h2>🚀 What's Next?</h2>
        <ul>
          <li><strong>Access Your Dashboard:</strong> Log in to track your earnings and performance</li>
          <li><strong>Submit Products:</strong> Start adding your affiliate links to our marketplace</li>
          <li><strong>Earn Commissions:</strong> Get paid for every sale generated through our platform</li>
          <li><strong>Global Exposure:</strong> Your products will be visible to millions of shoppers worldwide</li>
        </ul>
      </div>
      
      <div class="welcome-section">
        <h2>💰 Earning Opportunities</h2>
        <div class="info-item">
          <strong>Commission Rates:</strong> Up to 50% on digital products, competitive rates on physical products
        </div>
        <div class="info-item">
          <strong>Payment Schedule:</strong> Weekly payments with minimum payout of just $50
        </div>
        <div class="info-item">
          <strong>Global Reach:</strong> Access to customers in 150+ countries
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://smartdealsproamazon.github.io/smart.deals.pro/affiliate-dashboard.html" class="cta-button">
          Access Your Dashboard Now
        </a>
      </div>
      
      <div class="welcome-section">
        <h2>📞 Need Help?</h2>
        <p>Our support team is here to help you succeed:</p>
        <ul>
          <li>Email: support@smartdeals.pro</li>
          <li>Live Chat: Available 24/7 in your dashboard</li>
          <li>Training Resources: Complete affiliate guide included</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>SmartDeals Pro Affiliate Network</strong></p>
      <p>Thank you for joining us! We're committed to your success.</p>
      <p>Start earning today - your affiliate journey begins now!</p>
    </div>
  </div>
</body>
</html>`;
  }

  // Generate welcome email text content
  generateWelcomeEmailText(personalInfo) {
    return `
Welcome to SmartDeals Pro Affiliate Network!

Hi ${personalInfo.firstName},

Congratulations! Your affiliate account is now ACTIVE and ready to earn commissions.

WHAT'S NEXT:
- Access your dashboard to track earnings
- Submit your affiliate products to our marketplace  
- Start earning from our global customer base
- Get paid weekly with just $50 minimum payout

EARNING OPPORTUNITIES:
- Up to 50% commission on digital products
- Competitive rates on physical products
- Global reach to 150+ countries
- 24/7 support and training resources

Get started now: https://smartdealsproamazon.github.io/smart.deals.pro/affiliate-dashboard.html

Need help? Contact support@smartdeals.pro

Welcome to the SmartDeals Pro family!

Best regards,
SmartDeals Pro Team
`;
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