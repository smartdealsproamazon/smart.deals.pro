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
    console.log('Products array not available, showing loading state');
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>Loading products...</h3>
        <p>Getting the latest deals for you...</p>
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
        <a href="product-submission.html" class="btn btn-primary" style="margin-top: 1rem;">Submit a Product</a>
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

// Function to create enhanced product card
function createProductCard(product) {
  const div = document.createElement("div");
  div.className = "product-card";
  
  // Add data attributes so existing filters on some pages work
  div.setAttribute('data-category', product.category || '');
  const numericPrice = parseFloat((product.price || '').toString().replace('$','')) || 0;
  div.setAttribute('data-price', numericPrice);
  
  const discountBadge = product.discount > 0 ? 
    `<div class="discount-badge">-${product.discount}%</div>` : '';
  
  const originalPrice = product.originalPrice && product.originalPrice !== product.price ? 
    `<span class="original-price">${product.originalPrice}</span>` : '';
  
  const stars = generateStars(product.rating);
  
  const features = product.features ? 
    product.features.slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('') : '';

  // Modern timer for USA Flash Sale products
  let timerHTML = '';
  if (product.category === 'usa-flash-sale' && product.timer && product.createdAt) {
    const timerId = `timer-${product.id}`;
    timerHTML = `
      <div class="modern-timer" id="${timerId}">
        <span class="timer-label">Flash Sale Ends In:</span>
        <span class="timer-value">--:--:--</span>
      </div>
    `;
    setTimeout(() => {
      startProductTimer(timerId, product.createdAt, product.timer, div);
    }, 0);
  }

  // Make the entire card clickable to open product detail page
  div.style.cursor = 'pointer';
  div.addEventListener('click', function(e) {
    // Don't trigger if clicking on buttons or links
    if (e.target.closest('a, button')) {
      return;
    }
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    window.location.href = `product-detail.html?id=${String(product.id)}&ref=${encodeURIComponent(currentPage)}`;
  });

  div.innerHTML = `
    ${discountBadge}
    <div class="product-image-container">
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <div class="product-overlay">
        <button class="view-details-btn" onclick="event.stopPropagation(); const currentPage = window.location.pathname.split('/').pop() || 'index.html'; window.location.href='product-detail.html?id=${String(product.id)}&ref=' + encodeURIComponent(currentPage)">
          <i class="fas fa-eye"></i> View Details
        </button>
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-title">${product.name}</h3>
      <div class="product-rating">
        <div class="stars">${stars}</div>
        <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
      </div>
      <div class="product-features">
        ${features}
      </div>
      <div class="product-price">
        ${originalPrice}
        <span class="current-price">${product.price}</span>
      </div>
      ${timerHTML}
      <div class="product-buttons">
        <a href="${product.link}" target="_blank" class="btn btn-primary btn-small" onclick="event.stopPropagation(); trackClick('${product.name}', '${product.category}')">
          <i class="fas fa-shopping-cart"></i> Buy Now
        </a>
        <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); addToWishlist(${product.id})">
          <i class="fas fa-heart"></i> Save
        </button>
        <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); const currentPage = window.location.pathname.split('/').pop() || 'index.html'; window.location.href='product-detail.html?id=${String(product.id)}&ref=' + encodeURIComponent(currentPage)">
          <i class="fas fa-info-circle"></i> Details
        </button>
      </div>
    </div>
  `;
  
  return div;
}

// Modern timer logic for each product
function startProductTimer(timerId, createdAt, timerMinutes, productCardDiv) {
  const timerElem = document.getElementById(timerId);
  if (!timerElem) return;
  const timerValueElem = timerElem.querySelector('.timer-value');
  const endTime = createdAt + timerMinutes * 60 * 1000;
  function updateTimer() {
    const now = Date.now();
    const diff = endTime - now;
    if (diff <= 0) {
      // Hide product card when timer expires
      if (productCardDiv && productCardDiv.parentNode) {
        productCardDiv.parentNode.removeChild(productCardDiv);
      }
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    let display = '';
    if (days > 0) {
      display = `${days}d ${hours.toString().padStart(2, '0')}:${minutes
        .toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      display = `${hours.toString().padStart(2, '0')}:${minutes
        .toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    timerValueElem.textContent = display;
  }
  updateTimer();
  const interval = setInterval(() => {
    if (!document.body.contains(timerElem)) {
      clearInterval(interval);
      return;
    }
    updateTimer();
  }, 1000);
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

// Auto-render products based on page URL
function autoRenderProducts() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  
  console.log(`Auto-rendering for page: ${filename}`);
  console.log('Products available:', window.products ? window.products.length : 0);
  
  // Log all available categories for debugging
  if (window.products && window.products.length > 0) {
    const categories = [...new Set(window.products.map(p => p.category))];
    console.log('Available categories:', categories);
  }
  
  if (filename.includes('smartwatch')) {
    console.log('Rendering smartwatch products');
    renderProducts('smartwatch');
  } else if (filename.includes('fashion')) {
    console.log('Rendering fashion products');
    renderProducts('fashion');
  } else if (filename.includes('small-electrical') || filename.includes('electronic')) {
    console.log('Rendering electrical products');
    renderProducts('electrical');
  } else if (filename.includes('gaming')) {
    console.log('Rendering gaming products');
    renderProducts('gaming');
  } else if (filename.includes('home-garden')) {
    console.log('Rendering home-garden products');
    renderProducts('home-garden');
  } else if (filename.includes('index') || filename === '' || filename === '/') {
    console.log('Rendering featured products for homepage');
    // Homepage - render featured products
    if (document.getElementById('featuredProductsGrid')) {
      renderFeaturedProducts();
    }
  } else {
    console.log(`No specific rendering rule for page: ${filename}`);
  }
}

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

// Listen for real-time product updates and re-render automatically
document.addEventListener('products-updated', function () {
  console.log('Real-time products update received, re-rendering...');
  autoRenderProducts();
  
  // Show subtle update indicator
  showRealtimeUpdateIndicator();
});

// Function to show a subtle indicator that products were updated in real-time
function showRealtimeUpdateIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'realtime-update-indicator';
  indicator.innerHTML = '<i class="fas fa-sync-alt"></i> Updated';
  
  document.body.appendChild(indicator);
  
  // Auto-remove after 2 seconds
  setTimeout(() => {
    if (indicator.parentElement) {
      indicator.remove();
    }
  }, 2000);
  
  // Add CSS if not already present
  if (!document.getElementById('realtime-indicator-styles')) {
    const style = document.createElement('style');
    style.id = 'realtime-indicator-styles';
    style.textContent = `
      .realtime-update-indicator {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        z-index: 9999;
        animation: slideInLeft 0.3s ease-out, fadeOut 0.3s ease-out 1.7s forwards;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .realtime-update-indicator i {
        animation: spin 1s linear;
      }
      
      @keyframes slideInLeft {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateX(-100%);
        }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderProducts,
    renderFeaturedProducts,
    createProductCard,
    addToWishlist,
    trackClick,
    searchProducts,
    renderSearchResults
  };
}
