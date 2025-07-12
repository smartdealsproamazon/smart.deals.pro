/**
 * Facebook Configuration File
 * Update these settings with your Facebook App details
 */

const FacebookConfig = {
  // 🔥 IMPORTANT: Replace with your actual Facebook App ID
  // Get this from: https://developers.facebook.com/ → Your App → Settings → Basic
  appId: 'YOUR_FACEBOOK_APP_ID',

  // 🔥 IMPORTANT: Replace with your Facebook Page ID (optional)
  // Get this from: https://www.facebook.com/YourPage/about → Page Info → Page ID
  pageId: 'YOUR_FACEBOOK_PAGE_ID',

  // Auto-posting settings
  enableAutoPost: true,
  debugMode: false,

  // Post customization
  postSettings: {
    includeEmojis: true,
    includeHashtags: true,
    includeProductImage: true,
    includeWebsiteLink: true,
    
    // Custom message prefix (optional)
    customPrefix: "🛍️ New Deal Alert! 🛍️",
    
    // Custom message suffix (optional)
    customSuffix: "Visit SmartDeals Pro for more amazing deals! 🚀",
  },

  // Category-specific settings
  categories: {
    smartwatch: {
      emoji: '⌚',
      hashtags: ['#Smartwatch', '#WearableTech', '#Fitness'],
      customMessage: 'Latest smartwatch deals!'
    },
    fashion: {
      emoji: '👗',
      hashtags: ['#Fashion', '#Style', '#Clothing'],
      customMessage: 'Trendy fashion finds!'
    },
    electrical: {
      emoji: '⚡',
      hashtags: ['#Electronics', '#Tech', '#Gadgets'],
      customMessage: 'Amazing tech deals!'
    },
    gaming: {
      emoji: '🎮',
      hashtags: ['#Gaming', '#GamerLife', '#VideoGames'],
      customMessage: 'Epic gaming deals!'
    },
    'home-garden': {
      emoji: '🏠',
      hashtags: ['#HomeDecor', '#Garden', '#HomeImprovement'],
      customMessage: 'Home & garden essentials!'
    }
  },

  // Notification settings
  notifications: {
    showSuccessNotifications: true,
    showErrorNotifications: true,
    autoHideDelay: 5000, // milliseconds
    position: 'top-right' // top-right, top-left, bottom-right, bottom-left
  },

  // Advanced settings
  advanced: {
    // Facebook API version
    apiVersion: 'v18.0',
    
    // Request timeout (milliseconds)
    requestTimeout: 30000,
    
    // Retry attempts for failed posts
    retryAttempts: 3,
    
    // Permissions to request
    permissions: [
      'public_profile',
      'pages_manage_posts',
      'pages_read_engagement',
      'publish_to_groups'
    ]
  }
};

// Export configuration
window.FacebookConfig = FacebookConfig;

// Auto-update Facebook Integration settings
document.addEventListener('DOMContentLoaded', function() {
  if (window.FacebookIntegration) {
    // Update integration with config values
    window.FacebookIntegration.appId = FacebookConfig.appId;
    window.FacebookIntegration.pageId = FacebookConfig.pageId;
    window.FacebookIntegration.enableAutoPost = FacebookConfig.enableAutoPost;
    window.FacebookIntegration.debugMode = FacebookConfig.debugMode;
    
    console.log('Facebook configuration loaded successfully');
    
    if (FacebookConfig.debugMode) {
      console.log('Facebook Config:', FacebookConfig);
    }
  }
});

/**
 * Quick Setup Instructions:
 * 
 * 1. Go to https://developers.facebook.com/
 * 2. Create a new app or select existing app
 * 3. Copy your App ID from Settings → Basic
 * 4. Replace 'YOUR_FACEBOOK_APP_ID' above with your actual App ID
 * 5. Save this file
 * 6. Refresh your website
 * 7. Click "Connect Facebook" to authorize
 * 8. Test by adding a product - it should auto-post to Facebook!
 * 
 * For detailed instructions, see: facebook-setup-guide.md
 */