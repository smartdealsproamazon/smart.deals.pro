// Facebook Configuration for SmartDeals Pro
const FACEBOOK_CONFIG = {
  appId: 'YOUR_FACEBOOK_APP_ID', // Replace with your Facebook App ID
  version: 'v18.0',
  accessToken: 'YOUR_PAGE_ACCESS_TOKEN', // Replace with your Facebook Page Access Token
  pageId: 'YOUR_PAGE_ID', // Replace with your Facebook Page ID
  
  // Post template settings
  postTemplate: {
    hashtagsEnabled: true,
    includeAffiliateDisclosure: true,
    includeWebsiteLink: true,
    useDirectAmazonLink: true, // Post will redirect directly to Amazon product page
    defaultHashtags: [
      '#SmartDeals', '#BestDeals', '#AffiliateMarketing', '#OnlineDeals',
      '#TechDeals', '#ShopSmart', '#ProductReviews', '#BestPrice'
    ]
  },
  
  // Amazon affiliate compliance
  amazonCompliance: {
    disclosureText: "As an Amazon Associate, I earn from qualifying purchases. This means I may earn a commission if you click on a link and make a purchase, at no additional cost to you.",
    requireDisclosure: true,
    showPriceDisclaimer: true
  }
};

// Category-specific hashtags
const CATEGORY_HASHTAGS = {
  'smartwatch': ['#Smartwatch', '#WearableTech', '#FitnessTracker', '#HealthTech', '#Apple', '#Samsung'],
  'fashion': ['#Fashion', '#Style', '#Clothing', '#Accessories', '#Trendy', '#OOTD'],
  'electrical': ['#Electronics', '#Gadgets', '#TechReview', '#Innovation', '#HomeElectronics'],
  'gaming': ['#Gaming', '#GamerLife', '#PlayStation', '#Xbox', '#Nintendo', '#PCGaming'],
  'home-garden': ['#HomeDecor', '#Garden', '#HomeImprovement', '#HomeDesign', '#Outdoor']
};

// Facebook API helper functions
class FacebookPoster {
  constructor() {
    this.config = FACEBOOK_CONFIG;
    this.isInitialized = false;
  }

  // Initialize Facebook SDK
  async initializeFacebook() {
    return new Promise((resolve, reject) => {
      if (typeof FB !== 'undefined') {
        FB.init({
          appId: this.config.appId,
          version: this.config.version,
          cookie: true,
          xfbml: true
        });
        this.isInitialized = true;
        resolve();
      } else {
        reject(new Error('Facebook SDK not loaded'));
      }
    });
  }

  // Create Facebook post content
  createPostContent(productData) {
    const { title, description, price, category, link } = productData;
    
    // Get category-specific hashtags
    const categoryHashtags = CATEGORY_HASHTAGS[category] || [];
    const allHashtags = [...this.config.postTemplate.defaultHashtags, ...categoryHashtags];
    
    // Build post content
    let postContent = `🔥 NEW DEAL ALERT! 🔥\n\n`;
    postContent += `${title}\n\n`;
    postContent += `💰 Special Price: $${price}\n`;
    postContent += `🚀 Click to buy directly on Amazon!\n\n`;
    postContent += `${description}\n\n`;
    
    // Add affiliate disclosure (Amazon compliance)
    if (this.config.amazonCompliance.requireDisclosure) {
      postContent += `📝 ${this.config.amazonCompliance.disclosureText}\n\n`;
    }
    
    // Add hashtags
    if (this.config.postTemplate.hashtagsEnabled) {
      postContent += allHashtags.slice(0, 10).join(' ') + '\n\n';
    }
    
    // Add direct Amazon product link
    if (this.config.postTemplate.includeWebsiteLink) {
      postContent += `🛒 BUY NOW ON AMAZON - Limited Time Offer!\n`;
      postContent += `⚡ Fast shipping with Prime!\n`;
      postContent += `🌐 More exclusive deals: https://smartdealspro.com`;
    }
    
    return postContent;
  }

  // Post to Facebook Page
  async postToFacebookPage(productData, imageData) {
    if (!this.isInitialized) {
      await this.initializeFacebook();
    }

    const postContent = this.createPostContent(productData);
    
    try {
      // First upload the image
      const imageResponse = await this.uploadImage(imageData);
      
      if (imageResponse && imageResponse.id) {
        // Create post with image and direct Amazon link
        const postData = {
          message: postContent,
          link: productData.link, // Direct Amazon product link
          attached_media: [{
            media_fbid: imageResponse.id
          }]
        };
        
        const response = await this.makePostRequest(postData);
        return response;
      } else {
        // Post without image but with direct Amazon link
        const postData = {
          message: postContent,
          link: productData.link // Direct Amazon product link
        };
        
        const response = await this.makePostRequest(postData);
        return response;
      }
    } catch (error) {
      console.error('Facebook posting error:', error);
      throw error;
    }
  }

  // Upload image to Facebook
  async uploadImage(imageData) {
    const formData = new FormData();
    
    // Convert base64 to blob
    const blob = this.dataURLtoBlob(imageData);
    formData.append('source', blob);
    formData.append('access_token', this.config.accessToken);
    
    const response = await fetch(`https://graph.facebook.com/${this.config.version}/${this.config.pageId}/photos`, {
      method: 'POST',
      body: formData
    });
    
    return await response.json();
  }

  // Make post request to Facebook
  async makePostRequest(postData) {
    const url = `https://graph.facebook.com/${this.config.version}/${this.config.pageId}/feed`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...postData,
        access_token: this.config.accessToken
      })
    });
    
    return await response.json();
  }

  // Convert data URL to blob
  dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

// Export for use in other files
window.FacebookPoster = FacebookPoster;
window.FACEBOOK_CONFIG = FACEBOOK_CONFIG;