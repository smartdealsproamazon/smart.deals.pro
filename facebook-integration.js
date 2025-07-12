/**
 * Facebook Integration System for SmartDeals Pro
 * Handles automatic posting when products are added and Facebook profile connection
 */

class FacebookIntegration {
  constructor() {
    this.appId = 'YOUR_FACEBOOK_APP_ID'; // Replace with your actual Facebook App ID
    this.pageId = 'YOUR_FACEBOOK_PAGE_ID'; // Replace with your Facebook Page ID
    this.accessToken = null;
    this.isInitialized = false;
    this.userProfile = null;
    this.enableAutoPost = true;
    
    // Initialize Facebook SDK
    this.initializeFacebookSDK();
  }

  /**
   * Initialize Facebook SDK
   */
  initializeFacebookSDK() {
    return new Promise((resolve, reject) => {
      // Load Facebook SDK
      if (document.getElementById('facebook-jssdk')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.fbAsyncInit = () => {
          FB.init({
            appId: this.appId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          
          this.isInitialized = true;
          this.checkLoginStatus();
          resolve();
        };
      };

      script.onerror = (error) => {
        console.error('Failed to load Facebook SDK:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Check if user is logged in to Facebook
   */
  checkLoginStatus() {
    if (!this.isInitialized) return;

    FB.getLoginStatus((response) => {
      if (response.status === 'connected') {
        this.accessToken = response.authResponse.accessToken;
        this.getUserProfile();
        this.updateFooterLinks();
      } else {
        console.log('User is not logged in to Facebook');
      }
    });
  }

  /**
   * Login to Facebook
   */
  loginToFacebook() {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        reject(new Error('Facebook SDK not initialized'));
        return;
      }

      FB.login((response) => {
        if (response.authResponse) {
          this.accessToken = response.authResponse.accessToken;
          this.getUserProfile();
          this.updateFooterLinks();
          resolve(response);
        } else {
          reject(new Error('User cancelled login or did not fully authorize'));
        }
      }, {
        scope: 'pages_manage_posts,pages_read_engagement,publish_to_groups,public_profile'
      });
    });
  }

  /**
   * Get user profile information
   */
  getUserProfile() {
    if (!this.accessToken) return;

    FB.api('/me', { fields: 'name,id,picture' }, (response) => {
      if (response && !response.error) {
        this.userProfile = response;
        localStorage.setItem('facebookProfile', JSON.stringify(response));
        console.log('Facebook profile loaded:', response);
      }
    });
  }

  /**
   * Update all Facebook links in the footer to point to user's profile
   */
  updateFooterLinks() {
    if (!this.userProfile) return;

    const facebookLinks = document.querySelectorAll('a[aria-label="Facebook"]');
    facebookLinks.forEach(link => {
      link.href = `https://www.facebook.com/${this.userProfile.id}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  /**
   * Auto-post product to Facebook when added
   */
  async autoPostProduct(productData) {
    if (!this.enableAutoPost || !this.accessToken) {
      console.log('Auto-posting disabled or not authenticated');
      return;
    }

    try {
      const postContent = this.createProductPost(productData);
      const result = await this.postToFacebook(postContent);
      
      if (result.success) {
        console.log('Product successfully posted to Facebook:', result.postId);
        this.showNotification('Product posted to Facebook successfully!', 'success');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to post to Facebook:', error);
      this.showNotification('Failed to post to Facebook: ' + error.message, 'error');
      throw error;
    }
  }

  /**
   * Create formatted post content for product
   */
  createProductPost(productData) {
    const categoryEmojis = {
      'smartwatch': '⌚',
      'fashion': '👗',
      'electrical': '⚡',
      'gaming': '🎮',
      'home-garden': '🏠'
    };

    const emoji = categoryEmojis[productData.category] || '🛍️';
    const hashtags = this.generateHashtags(productData);
    
    const postText = `${emoji} New Product Alert! ${emoji}

🔥 ${productData.title}
💰 Price: $${productData.price}
📱 Category: ${productData.category.charAt(0).toUpperCase() + productData.category.slice(1)}

${productData.description}

✅ Get this amazing deal now!
🔗 Shop here: ${productData.link}

#SmartDealsPro ${hashtags}

---
Find more amazing deals at SmartDeals Pro! 🚀`;

    return {
      message: postText,
      link: productData.link,
      picture: productData.imageUrl,
      name: productData.title,
      caption: 'SmartDeals Pro - Best Deals Online',
      description: productData.description
    };
  }

  /**
   * Generate relevant hashtags for the product
   */
  generateHashtags(productData) {
    const baseHashtags = ['#AffiliateMarketing', '#OnlineDeals', '#Shopping'];
    const categoryHashtags = {
      'smartwatch': ['#Smartwatch', '#WearableTech', '#Fitness'],
      'fashion': ['#Fashion', '#Style', '#Clothing'],
      'electrical': ['#Electronics', '#Tech', '#Gadgets'],
      'gaming': ['#Gaming', '#GamerLife', '#VideoGames'],
      'home-garden': ['#HomeDecor', '#Garden', '#HomeImprovement']
    };

    const categoryTags = categoryHashtags[productData.category] || [];
    return [...baseHashtags, ...categoryTags].join(' ');
  }

  /**
   * Post content to Facebook
   */
  postToFacebook(postContent) {
    return new Promise((resolve, reject) => {
      if (!this.accessToken) {
        reject(new Error('No access token available'));
        return;
      }

      // Post to user's timeline (for personal profile)
      FB.api('/me/feed', 'POST', postContent, (response) => {
        if (response && !response.error) {
          resolve({
            success: true,
            postId: response.id,
            response: response
          });
        } else {
          reject(new Error(response.error ? response.error.message : 'Unknown error'));
        }
      });
    });
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `facebook-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fab fa-facebook-f"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .facebook-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
      }
      
      .facebook-notification.success {
        border-left: 4px solid #4CAF50;
      }
      
      .facebook-notification.error {
        border-left: 4px solid #f44336;
      }
      
      .facebook-notification .notification-content {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
      }
      
      .facebook-notification i {
        color: #1877F2;
        font-size: 18px;
      }
      
      .facebook-notification span {
        flex: 1;
        font-size: 14px;
        color: #333;
      }
      
      .facebook-notification button {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 4px 8px;
        border-radius: 4px;
      }
      
      .facebook-notification button:hover {
        background: #f0f0f0;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;

    if (!document.querySelector('#facebook-notification-styles')) {
      style.id = 'facebook-notification-styles';
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Setup Facebook connection UI
   */
  setupFacebookUI() {
    // Create Facebook connection button
    const facebookButton = document.createElement('button');
    facebookButton.id = 'facebook-connect-btn';
    facebookButton.innerHTML = `
      <i class="fab fa-facebook-f"></i>
      Connect Facebook
    `;
    facebookButton.className = 'facebook-connect-btn';
    facebookButton.onclick = () => this.loginToFacebook();

    // Add styles for the button
    const style = document.createElement('style');
    style.textContent = `
      .facebook-connect-btn {
        background: #1877F2;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.3s ease;
        margin: 10px;
      }
      
      .facebook-connect-btn:hover {
        background: #166FE5;
      }
      
      .facebook-connect-btn i {
        font-size: 18px;
      }
    `;

    document.head.appendChild(style);
    return facebookButton;
  }

  /**
   * Initialize Facebook integration for the site
   */
  init() {
    // Check if user profile is stored
    const storedProfile = localStorage.getItem('facebookProfile');
    if (storedProfile) {
      this.userProfile = JSON.parse(storedProfile);
      this.updateFooterLinks();
    }

    // Setup connection button (you can place this anywhere on your site)
    const connectButton = this.setupFacebookUI();
    
    // Add to footer or admin panel
    const footer = document.querySelector('.main-footer');
    if (footer) {
      footer.appendChild(connectButton);
    }

    console.log('Facebook Integration initialized');
  }
}

// Initialize Facebook Integration
const facebookIntegration = new FacebookIntegration();

// Export for use in other files
window.FacebookIntegration = facebookIntegration;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  facebookIntegration.init();
});