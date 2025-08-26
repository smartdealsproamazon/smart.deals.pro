// Enhanced Product Rendering System for SmartDeals Pro

// Main function to render products with enhanced features and real-time updates
function renderProducts(filterCategory = null, containerId = 'product-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.log(`Container with ID "${containerId}" not found`);
    return;
  }
  
  // Clear previous content
  container.innerHTML = "";

  // Ensure we have products array
  if (!window.products || window.products.length === 0) {
    console.log('Products array not available, showing enhanced loading state');
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6; margin-bottom: 1rem;"></i>
        <h3>Loading Latest Products...</h3>
        <p>Fetching amazing deals from our global marketplace...</p>
        <div class="loading-progress" style="width: 100%; max-width: 300px; margin: 1rem auto;">
          <div class="progress-bar" id="loadingProgress" style="height: 4px; background: #3b82f6; border-radius: 2px; width: 0%; transition: width 0.3s ease;"></div>
        </div>
        <div class="realtime-status" style="margin-top: 1rem; padding: 0.5rem; background: #f0f9ff; border-radius: 6px; color: #1e40af;">
          <i class="fas fa-wifi"></i>
          <span id="connectionStatus">Connecting to real-time updates...</span>
        </div>
        <div style="margin-top: 1rem; font-size: 0.9rem; color: #6b7280;">
          <p>• Real-time product updates</p>
          <p>• Global marketplace access</p>
          <p>• Verified affiliate products</p>
        </div>
      </div>
    `;
    
    // Start enhanced progress animation
    animateEnhancedLoadingProgress();
    
    // Set up retry mechanism
    setTimeout(() => {
      if (!window.products || window.products.length === 0) {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
          statusEl.innerHTML = '<span style="color: #f59e0b;">Retrying connection...</span>';
        }
        // Try to trigger products loading again
        if (typeof window.initializeFirebaseConnection === 'function') {
          window.initializeFirebaseConnection();
        }
      }
    }, 5000);
    
    return;
  }

  console.log(`Filtering products by category: ${filterCategory}`);
  console.log('Available products:', window.products.length);
  
  const filteredProducts = filterCategory
    ? window.products.filter(p => {
        console.log(`Product "${p.name}" has category: "${p.category}"`);
        return p.category === filterCategory;
      })
    : window.products;

  console.log(`Filtered products count: ${filteredProducts.length}`);

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-search" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>No products found</h3>
        <p>No products available in this category yet. Try submitting a product or check back later!</p>
        <a href="product-submission-verification.html" class="btn btn-primary" style="margin-top: 1rem;">Submit a Product</a>
      </div>
    `;
    return;
  }

  // Animate products appearing
  filteredProducts.forEach((product, index) => {
    const productCard = createProductCard(product);
    productCard.style.opacity = '0';
    productCard.style.transform = 'translateY(20px)';
    container.appendChild(productCard);
    
    // Stagger animation
    setTimeout(() => {
      productCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      productCard.style.opacity = '1';
      productCard.style.transform = 'translateY(0)';
    }, index * 50);
  });
  
  console.log(`Rendered ${filteredProducts.length} products in ${containerId}`);
}

// Function to animate loading progress
function animateLoadingProgress() {
  const progressBar = document.getElementById('loadingProgress');
  if (!progressBar) return;
  
  let width = 0;
  const interval = setInterval(() => {
    width += Math.random() * 10;
    if (width >= 90) {
      width = 90;
      clearInterval(interval);
    }
    progressBar.style.width = width + '%';
  }, 100);
}

// Function to create enhanced product card (matching marketplace demo design)
function createProductCard(product) {
  const div = document.createElement("div");
  div.className = "affiliate-product-card";
  
  // Add data attributes so existing filters on some pages work
  div.setAttribute('data-category', product.category || '');
  
  // Safe price parsing with validation
  const safeParsePriceForAttribute = (priceStr) => {
    if (!priceStr) return 0;
    const cleanPrice = String(priceStr).replace(/[$₨₹€£¥,\s]/g, '');
    const numPrice = parseFloat(cleanPrice);
    return isNaN(numPrice) ? 0 : numPrice;
  };
  
  const numericPrice = safeParsePriceForAttribute(product.price);
  div.setAttribute('data-price', numericPrice);
  
  // Safe price display with validation
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
  
  // Create original price with strikethrough styling (matching demo)
  const originalPriceHTML = product.originalPrice && 
                           product.originalPrice !== product.price && 
                           !displayOriginalPrice.includes('$0.00') ? 
    `<span style="text-decoration: line-through; color: #9ca3af; font-size: 1rem; margin-left: 0.5rem;">${displayOriginalPrice}</span>` : '';
  
  // Create badges similar to demo products
  const badges = [];
  
  // Platform badge
  if (product.platform) {
    badges.push(`<span class="badge platform">${product.platform}</span>`);
  } else {
    badges.push(`<span class="badge platform">Amazon</span>`);
  }
  
  // Category badge
  if (product.category) {
    badges.push(`<span class="badge commission">${product.category}</span>`);
  }
  
  // Discount badge
  if (product.discount && product.discount > 0) {
    badges.push(`<span class="badge featured">${product.discount}% OFF</span>`);
  }
  
  // Rating badge if high rating
  if (product.rating && product.rating >= 4.5) {
    badges.push(`<span class="badge featured">⭐ Top Rated</span>`);
  }
  
  const badgesHTML = badges.length > 0 ? 
    `<div class="product-badges">${badges.join('')}</div>` : '';
  
  // Create description from features or use existing description
  let description = product.description || '';
  if (!description && Array.isArray(product.features) && product.features.length > 0) {
    description = product.features.slice(0, 2).join('. ') + '.';
  }
  if (!description) {
    description = `High-quality ${product.category || 'product'} with excellent features and great value for money.`;
  }
  
  // Affiliate info section removed as requested

  // Make the entire card clickable to open product detail page
  div.style.cursor = 'pointer';
  div.addEventListener('click', function(e) {
    // Don't trigger if clicking on buttons or links
    if (e.target.closest('a, button')) {
      return;
    }
    // Enhanced product linking with validation and scroll position saving
    if (product && product.id) {
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const productId = encodeURIComponent(String(product.id));
      
      // Save current scroll position before navigating
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      localStorage.setItem('scrollPosition_' + currentPage, scrollPosition.toString());
      console.log(`Saving scroll position ${scrollPosition} for page ${currentPage}`);
      
      console.log(`Navigating to product detail for ID: ${product.id}`);
      window.location.href = `product-detail.html?id=${productId}&ref=${encodeURIComponent(currentPage)}`;
    } else {
      console.error('Product ID not available for navigation', product);
    }
  });

  div.innerHTML = `
    <div class="product-image-container">
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" 
           onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop';">
    </div>
    <div class="product-content">
      <h3 class="product-title">${product.name}</h3>
      <div class="product-price">${displayPrice}${originalPriceHTML}</div>
      ${badgesHTML}
      <p class="product-description">${description}</p>
      <button class="product-cta" onclick="event.stopPropagation(); trackClick('${product.name}', '${product.category}'); window.open('${product.link}', '_blank')">
        🛒 Buy Now - ${displayPrice}
      </button>
    </div>
  `;
  
  return div;
}



// Function to generate star ratings
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  
  if (halfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }
  
  return stars;
}

// Function to render featured products on homepage
function renderFeaturedProducts() {
  const featuredProducts = getFeaturedProducts();
  const container = document.getElementById('featuredProductsGrid');
  
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!window.products || window.products.length === 0) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>Loading featured products...</h3>
      </div>
    `;
    return;
  }
  
  featuredProducts.forEach((product, index) => {
    const productCard = createProductCard(product);
    productCard.style.opacity = '0';
    productCard.style.transform = 'translateY(20px)';
    container.appendChild(productCard);
    
    setTimeout(() => {
      productCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      productCard.style.opacity = '1';
      productCard.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

// Removed modal functionality - now using dedicated product detail pages

// Function to add product to wishlist
function addToWishlist(productId) {
  const product = window.products.find(p => String(p.id) === String(productId));
  if (!product) return;
  
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showNotification(`${product.name} added to wishlist!`, 'success');
  } else {
    showNotification(`${product.name} is already in your wishlist!`, 'info');
  }
}

// Function to show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Function to track clicks for analytics
function trackClick(productName, category) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'click', {
      event_category: 'Product',
      event_label: productName,
      custom_parameter: category
    });
  }
  
  console.log(`Product clicked: ${productName} in ${category}`);
}

// Function to search products
function searchProducts(query) {
  const searchTerm = query.toLowerCase();
  return window.products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.features.some(feature => feature.toLowerCase().includes(searchTerm)) ||
    product.category.toLowerCase().includes(searchTerm)
  );
}

// Function to render search results
function renderSearchResults(query) {
  const searchResults = searchProducts(query);
  const container = document.getElementById('searchResults') || document.getElementById('product-container');
  
  if (!container) return;
  
  container.innerHTML = '';
  
  if (searchResults.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>No results found for "${query}"</h3>
        <p>Try different keywords or browse our categories.</p>
      </div>
    `;
    return;
  }
  
  searchResults.forEach(product => {
    const productCard = createProductCard(product);
    container.appendChild(productCard);
  });
}

// Function to render USA Flash Sale products with proper filtering
function renderUSAFlashSaleProducts() {
  const container = document.getElementById('usaProductsGrid');
  if (!container) {
    console.log('USA products grid container not found');
    return;
  }
  
  // Clear previous content
  container.innerHTML = "";

  // Ensure we have products array
  if (!window.products || window.products.length === 0) {
    console.log('Products array not available, showing loading state');
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>Loading Flash Sale Products...</h3>
        <p>Getting the latest USA deals for you...</p>
        <div class="loading-progress">
          <div class="progress-bar" id="loadingProgress"></div>
        </div>
        <div class="realtime-status">
          <i class="fas fa-wifi"></i>
          <span>Connecting to real-time updates...</span>
        </div>
      </div>
    `;
    
    // Start progress animation
    animateLoadingProgress();
    return;
  }

  console.log('Filtering USA flash sale products...');
  console.log('Available products:', window.products.length);
  
  // Only show products specifically tagged as usa-flash-sale
  let usaProducts = window.products.filter(p => p.category === 'usa-flash-sale');
  
  console.log(`Found ${usaProducts.length} USA flash sale products`);

  if (usaProducts.length === 0) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-flag" style="font-size: 3rem; color: #3b82f6; margin-bottom: 1rem;"></i>
        <h3>No USA Flash Sale Products Available</h3>
        <p>Currently, no products have been specifically added to the USA Flash Sale category. Products need to be submitted through our <a href="product-submission.html" style="color: #3b82f6; text-decoration: underline;">product submission form</a> with the "USA Flash Sale" category selected.</p>
        <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 8px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
          <h4 style="margin-top: 0; color: #374151;">To add USA Flash Sale products:</h4>
          <ol style="color: #6b7280; margin: 0; padding-left: 1.5rem;">
            <li>Go to the <a href="product-submission.html" style="color: #3b82f6;">Product Submission</a> page</li>
            <li>Fill in the product details</li>
            <li>Select "USA Flash Sale" from the category dropdown</li>
            <li>Enter a discount percentage</li>
            <li>Submit the product</li>
          </ol>
        </div>
        <div style="margin-top: 2rem;">
          <a href="product-submission.html" class="btn btn-primary" style="margin-right: 1rem;">Add Flash Sale Product</a>
          <a href="deals.html" class="btn btn-secondary">Browse All Products</a>
        </div>
      </div>
    `;
    return;
  }

  // Show the special USA flash sale header
  const headerDiv = document.createElement('div');
  headerDiv.className = 'usa-flash-sale-header';
  headerDiv.innerHTML = `
    <div class="flash-sale-notice">
      <i class="fas fa-bolt"></i>
      <span>🇺🇸 Exclusive USA Flash Sale Products (${usaProducts.length} ${usaProducts.length === 1 ? 'Deal' : 'Deals'} Available)</span>
    </div>
  `;
  container.appendChild(headerDiv);

  // Animate products appearing
  usaProducts.forEach((product, index) => {
    const productCard = createProductCard(product);
    productCard.style.opacity = '0';
    productCard.style.transform = 'translateY(20px)';
    
    // Add USA flash sale styling
    productCard.classList.add('usa-flash-sale-card');
    
    container.appendChild(productCard);
    
    // Stagger animation
    setTimeout(() => {
      productCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      productCard.style.opacity = '1';
      productCard.style.transform = 'translateY(0)';
    }, index * 50);
  });
  
  console.log(`Successfully rendered ${usaProducts.length} USA flash sale products`);
}

// Auto-render products based on page URL with enhanced category detection
function autoRenderProducts() {
  const currentPage = window.location.pathname;
  const filename = currentPage.split('/').pop();
  
  console.log(`Auto-rendering for page: ${filename}`);
  console.log('Products available:', window.products ? window.products.length : 0);
  
  // Detect which page is open and set category filter
  let selectedCategory = "";
  
  if (currentPage.includes("boys-fashion.html")) {
    selectedCategory = "boys";
    console.log('Detected boys-fashion.html page, filtering for "boys" category');
  } else if (currentPage.includes("girls-fashion.html")) {
    selectedCategory = "girls";
    console.log('Detected girls-fashion.html page, filtering for "girls" category');
  } else if (filename.includes('fashion') && !filename.includes('boys-fashion') && !filename.includes('girls-fashion')) {
    // Legacy fashion.html page - keep using girls-fashion for backward compatibility
    selectedCategory = "girls-fashion";
    console.log('Detected legacy fashion.html page, filtering for "girls-fashion" category');
  }
  
  // Log all available categories for debugging
  if (window.products && window.products.length > 0) {
    const categories = [...new Set(window.products.map(p => p.category))];
    console.log('Available categories:', categories);
  }
  
  // Filter products by category before rendering
  const filteredProducts = selectedCategory
    ? (window.products || []).filter(product => product.category === selectedCategory)
    : (window.products || []);
    
  console.log(`Category filter "${selectedCategory}" - Found ${filteredProducts.length} products`);
  
  if (filename.includes('marketplace')) {
    console.log('Marketplace page detected - auto-rendering disabled (handled by marketplace.html)');
    return;
  } else if (filename.includes('boys-fashion')) {
    console.log('Boys fashion page detected - auto-rendering disabled');
    return;
  } else if (filename.includes('girls-fashion')) {
    console.log('Girls fashion page detected - auto-rendering disabled');
    return;
  } else if (filename.includes('smartwatch')) {
    console.log('Rendering smartwatch/boys fashion products (legacy)');
    renderProducts('boys-fashion');
  } else if (filename.includes('fashion') && !filename.includes('boys-fashion') && !filename.includes('girls-fashion')) {
    console.log('Legacy fashion page detected - auto-rendering disabled');
    return;
  } else if (filename.includes('small-electrical') || filename.includes('electronic')) {
    console.log('Rendering electrical products');
    renderProducts('electrical');
  } else if (filename.includes('gaming')) {
    console.log('Rendering gaming products');
    renderProducts('gaming');
  } else if (filename.includes('home-garden')) {
    console.log('Rendering home-garden products');
    renderProducts('home-garden');
  } else if (filename.includes('usa-discount')) {
    console.log('Rendering USA flash sale products');
    renderUSAFlashSaleProducts();
  } else if (filename.includes('index') || filename === '' || filename === '/') {
    console.log('Rendering featured products for homepage');
    // Homepage - render featured products
    if (document.getElementById('featuredProductsGrid')) {
      renderFeaturedProducts();
    }
    // Also render all products if there's a general product container
    if (document.getElementById('product-container') && !document.getElementById('featuredProductsGrid')) {
      console.log('Rendering all products on homepage');
      displayProducts(window.products || []);
    }
  } else {
    console.log(`No specific rendering rule for page: ${filename}`);
  }
}

// Display filtered products function (used by category filtering)
function displayProducts(filteredProducts) {
  const container = document.getElementById('product-container');
  if (!container) {
    console.log('Product container not found');
    return;
  }
  
  // Hide loading message if it exists
  const loadingMessage = document.getElementById('loadingMessage');
  if (loadingMessage) {
    loadingMessage.style.display = 'none';
  }
  
  // Clear previous content
  container.innerHTML = '';
  
  console.log(`Displaying ${filteredProducts.length} filtered products`);
  
  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-search" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>No products found</h3>
        <p>No products available in this category yet. Try submitting a product or check back later!</p>
        <a href="product-submission-verification.html" class="btn btn-primary" style="margin-top: 1rem;">Submit a Product</a>
      </div>
    `;
    return;
  }
  
  // Animate products appearing
  filteredProducts.forEach((product, index) => {
    const productCard = createProductCard(product);
    productCard.style.opacity = '0';
    productCard.style.transform = 'translateY(20px)';
    container.appendChild(productCard);
    
    // Stagger animation
    setTimeout(() => {
      productCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      productCard.style.opacity = '1';
      productCard.style.transform = 'translateY(0)';
    }, index * 50);
  });
  
  console.log(`Successfully displayed ${filteredProducts.length} products`);
}

// Make displayProducts globally accessible
window.displayProducts = displayProducts;

// Enhanced initialization with immediate rendering
function initializeRenderer() {
  console.log('Initializing renderer...');
  
  // Try to render immediately if products are available
  if (window.products && window.products.length > 0) {
    console.log('Products already available, rendering immediately');
    autoRenderProducts();
    return;
  }
  
  // Set up faster retry mechanism
  let retryCount = 0;
  const maxRetries = 30; // 15 seconds total
  const retryInterval = 200; // 200ms between retries - much faster
  
  const retryTimer = setInterval(() => {
    retryCount++;
    console.log(`Retry ${retryCount}/${maxRetries} - checking for products...`);
    
    if (window.products && window.products.length > 0) {
      console.log('Products found on retry, rendering...');
      clearInterval(retryTimer);
      autoRenderProducts();
    } else if (retryCount >= maxRetries) {
      console.log('Max retries reached, showing error state...');
      clearInterval(retryTimer);
      
      // Show helpful error message
      const container = document.getElementById('product-container') || document.getElementById('featuredProductsGrid');
      if (container) {
        container.innerHTML = `
          <div class="no-products">
            <i class="fas fa-wifi" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
            <h3>Connection Issue</h3>
            <p>Having trouble loading products. Please check your internet connection.</p>
            <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
              <i class="fas fa-redo"></i> Try Again
            </button>
          </div>
        `;
      }
    }
  }, retryInterval);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing renderer...');
  initializeRenderer();
  
  // Add search functionality
  const searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = this.querySelector('input[type="search"]').value;
      if (query) {
        renderSearchResults(query);
      }
    });
  }
});

// Re-render automatically once the product catalogue finishes loading
document.addEventListener('products-ready', function () {
  console.log('Products ready event received, auto-rendering...');
  autoRenderProducts();
});

// Real-time update functionality removed for fashion pages

// Real-time update indicator functionality removed

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderProducts,
    renderFeaturedProducts,
    renderUSAFlashSaleProducts,
    createProductCard,
    addToWishlist,
    trackClick,
    searchProducts,
    renderSearchResults,
    displayProducts,
    autoRenderProducts
  };
}

// Function to animate enhanced loading progress
function animateEnhancedLoadingProgress() {
  const progressBar = document.getElementById('loadingProgress');
  if (!progressBar) return;
  
  let width = 0;
  const interval = setInterval(() => {
    if (window.products && window.products.length > 0) {
      // Products loaded, complete the progress
      width = 100;
      progressBar.style.width = width + '%';
      clearInterval(interval);
      return;
    }
    
    width += Math.random() * 8 + 2; // Faster progress
    if (width >= 85) {
      width = 85; // Don't complete until products actually load
    }
    progressBar.style.width = width + '%';
  }, 150); // Faster updates
  
  // Safety cleanup after 10 seconds
  setTimeout(() => {
    clearInterval(interval);
    if (progressBar) {
      progressBar.style.width = '90%';
    }
  }, 10000);
}
