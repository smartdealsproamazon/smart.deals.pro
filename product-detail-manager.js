// Product Detail Manager - Robust system for handling product details
// This ensures correct product details are always shown for the requested product

class ProductDetailManager {
  constructor() {
    this.currentProductId = null;
    this.currentProduct = null;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.initialized = false;
  }

  // Initialize the product detail manager
  init() {
    if (this.initialized) return;
    
    console.log('Initializing Product Detail Manager...');
    this.currentProductId = this.getQueryParam('id');
    
    if (!this.currentProductId) {
      this.showError('No Product Selected', 'Please select a product to view its details.');
      return;
    }

    console.log(`Product Detail Manager initialized for product ID: ${this.currentProductId}`);
    this.loadProductDetails();
    this.initialized = true;
  }

  // Get URL query parameter
  getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Load product details with robust retry mechanism
  async loadProductDetails() {
    console.log(`Loading product details for ID: ${this.currentProductId}`);
    
    // Try multiple methods to get the product
    let product = await this.findProduct();
    
    if (product) {
      this.currentProduct = product;
      this.renderProduct(product);
      console.log(`Successfully loaded product: ${product.name}`);
    } else if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Product not found, retry ${this.retryCount}/${this.maxRetries}...`);
      setTimeout(() => this.loadProductDetails(), 500);
    } else {
      console.error(`Product with ID ${this.currentProductId} not found after ${this.maxRetries} retries`);
      this.showError('Product Not Found', `The product you're looking for doesn't exist or may have been removed.`);
    }
  }

  // Find product using multiple methods
  async findProduct() {
    // Method 1: Use global getProductById function (most reliable)
    if (window.getProductById) {
      const product = window.getProductById(this.currentProductId);
      if (product) {
        console.log(`Found product using getProductById: ${product.name}`);
        return product;
      }
    }

    // Method 2: Search in window.products array
    if (window.products && window.products.length > 0) {
      const product = window.products.find(p => String(p.id) === String(this.currentProductId));
      if (product) {
        console.log(`Found product in products array: ${product.name}`);
        return product;
      }
    }

    // Method 3: Try loading from localStorage
    try {
      const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      if (cachedProducts.length > 0) {
        const product = cachedProducts.find(p => String(p.id) === String(this.currentProductId));
        if (product) {
          console.log(`Found product in localStorage: ${product.name || product.title}`);
          return product;
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }

    // Method 4: Wait for products-ready event
    if (!window.products || window.products.length === 0) {
      console.log('Waiting for products to load...');
      return new Promise((resolve) => {
        const handler = () => {
          document.removeEventListener('products-ready', handler);
          const product = this.findProductInCurrentState();
          resolve(product);
        };
        document.addEventListener('products-ready', handler);
      });
    }

    return null;
  }

  // Find product in current state (synchronous)
  findProductInCurrentState() {
    if (window.getProductById) {
      const product = window.getProductById(this.currentProductId);
      if (product) return product;
    }

    if (window.products && window.products.length > 0) {
      return window.products.find(p => String(p.id) === String(this.currentProductId));
    }

    return null;
  }

  // Render the product details
  renderProduct(product) {
    const contentDiv = document.getElementById('productContent');
    if (!contentDiv) {
      console.error('Product content container not found');
      return;
    }

    // Safe price display function
    const safeDisplayPrice = (price) => {
      if (!price) return '$0.00';
      const priceStr = String(price);
      if (priceStr.includes('NaN') || priceStr === 'undefined' || priceStr === 'null') {
        return '$0.00';
      }
      return priceStr.startsWith('$') ? priceStr : `$${priceStr}`;
    };

    const displayPrice = safeDisplayPrice(product.price);
    const displayOriginalPrice = safeDisplayPrice(product.originalPrice);

    // Calculate discount if original price exists
    let discountHTML = '';
    const discountValue = parseInt(product.discount) || 0;
    if (discountValue > 0) {
      discountHTML = `<span class="discount-badge">-${discountValue}% OFF</span>`;
    }

    // Generate features HTML
    let featuresHTML = '';
    if (product.features && product.features.length > 0) {
      featuresHTML = `
        <div class="product-features">
          <h3 class="features-title">Key Features</h3>
          <div class="feature-list">
            ${product.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
          </div>
        </div>
      `;
    }

    contentDiv.innerHTML = `
      <div class="product-detail-header">
        <div class="product-basic-info">
          <div class="product-image-section">
            <img src="${product.image}" alt="${product.name}" class="product-main-image" />
          </div>
          
          <div class="product-info-section">
            <h1 class="product-title">${product.name}</h1>
            
            <div class="product-rating">
              <div class="stars">${this.generateStars(product.rating)}</div>
              <span class="rating-text">${product.rating} out of 5 (${product.reviews} reviews)</span>
            </div>
            
            <div class="product-price-section">
              <span class="current-price">${displayPrice}</span>
              ${product.originalPrice && product.originalPrice !== product.price && !displayOriginalPrice.includes('$0.00') ? `<span class="original-price">${displayOriginalPrice}</span>` : ''}
              ${discountHTML}
            </div>
          </div>
        </div>
        
        <div class="product-description">
          <strong>Product Description:</strong><br>
          ${product.description}
        </div>
        
        <div class="product-features-actions">
          <div class="product-features-container">
            ${featuresHTML}
          </div>
          
          <div class="product-actions">
            <a href="${product.link}" target="_blank" rel="noopener noreferrer" class="btn-primary">
              <i class="fas fa-shopping-cart"></i> Buy Now
            </a>
            <a href="products.html" class="btn-secondary" id="backButtonSecondary">
              <i class="fas fa-arrow-left"></i> Back to Products
            </a>
          </div>
        </div>
      </div>
    `;

    // Show reviews if available
    if (product.productReviews && product.productReviews.length > 0) {
      this.renderReviews(product.productReviews);
    }

    // Update navigation
    this.updateNavigation();
  }

  // Generate star rating HTML
  generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star"></i>';
      } else if (i - 0.5 <= rating) {
        stars += '<i class="fas fa-star-half-alt"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }

  // Render product reviews
  renderReviews(reviews) {
    const reviewsSection = document.getElementById('reviewsSection');
    const reviewsContainer = document.getElementById('reviewsContainer');
    
    if (!reviewsSection || !reviewsContainer) return;
    
    const reviewsHTML = reviews.map(review => `
      <div class="review-card">
        <div class="review-header">
          <span class="reviewer-name">${review.name}</span>
          <span class="review-date">${review.date}</span>
        </div>
        <div class="review-text">${review.text}</div>
      </div>
    `).join('');
    
    reviewsContainer.innerHTML = reviewsHTML;
    reviewsSection.style.display = 'block';
  }

  // Show error message
  showError(title, message) {
    const contentDiv = document.getElementById('productContent');
    if (!contentDiv) return;

    contentDiv.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h2>${title}</h2>
        <p>${message}</p>
        <a href="products.html" class="btn-primary" style="margin-top: 1rem;">
          <i class="fas fa-arrow-left"></i> Back to Products
        </a>
      </div>
    `;
  }

  // Update navigation based on referrer
  updateNavigation() {
    const referrer = this.getQueryParam('ref');
    const browserReferrer = document.referrer;
    
    let backUrl = 'products.html';
    let backText = 'Back to Products';
    
    // Check URL parameter first (most reliable)
    if (referrer) {
      backUrl = referrer;
      // Determine text based on referrer page
      if (referrer.includes('fashion')) {
        backText = 'Back to Fashion';
      } else if (referrer.includes('gaming')) {
        backText = 'Back to Gaming';
      } else if (referrer.includes('smartwatch')) {
        backText = 'Back to Smartwatches';
      } else if (referrer.includes('small-electrical')) {
        backText = 'Back to Electronics';
      } else if (referrer.includes('home-garden')) {
        backText = 'Back to Home & Garden';
      } else if (referrer.includes('deals')) {
        backText = 'Back to Deals';
      } else if (referrer.includes('index.html') || referrer === '/' || referrer === '') {
        backText = 'Back to Home';
      }
    } 
    // Fallback to browser referrer if no URL parameter
    else if (browserReferrer && browserReferrer.includes(window.location.hostname)) {
      const referrerFilename = browserReferrer.split('/').pop().split('?')[0];
      if (referrerFilename && referrerFilename !== 'product-detail.html') {
        backUrl = referrerFilename;
        
        // Set appropriate text based on referrer filename
        if (referrerFilename.includes('fashion')) {
          backText = 'Back to Fashion';
        } else if (referrerFilename.includes('gaming')) {
          backText = 'Back to Gaming';
        } else if (referrerFilename.includes('smartwatch')) {
          backText = 'Back to Smartwatches';
        } else if (referrerFilename.includes('small-electrical')) {
          backText = 'Back to Electronics';
        } else if (referrerFilename.includes('home-garden')) {
          backText = 'Back to Home & Garden';
        } else if (referrerFilename.includes('deals')) {
          backText = 'Back to Deals';
        } else if (referrerFilename.includes('index.html') || referrerFilename === '') {
          backText = 'Back to Home';
        }
      }
    }
    
    // Update all back buttons
    const backButton = document.getElementById('backButton');
    const backButtonSecondary = document.getElementById('backButtonSecondary');
    
    if (backButton) {
      backButton.href = backUrl;
      backButton.innerHTML = `<i class="fas fa-arrow-left"></i> ${backText}`;
    }
    
    if (backButtonSecondary) {
      backButtonSecondary.href = backUrl;
      backButtonSecondary.innerHTML = `<i class="fas fa-arrow-left"></i> ${backText}`;
    }
    
    console.log(`Navigation updated: Back to ${backUrl} with text "${backText}"`);
  }

  // Get current product (for external use)
  getCurrentProduct() {
    return this.currentProduct;
  }

  // Get current product ID (for external use)
  getCurrentProductId() {
    return this.currentProductId;
  }
}

// Create global instance
window.productDetailManager = new ProductDetailManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing Product Detail Manager...');
  window.productDetailManager.init();
});

// Also initialize when products are ready
document.addEventListener('products-ready', function() {
  console.log('Products ready, ensuring product details are loaded...');
  if (window.productDetailManager && !window.productDetailManager.getCurrentProduct()) {
    window.productDetailManager.loadProductDetails();
  }
});