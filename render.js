// Enhanced Product Rendering System for SmartDeals Pro

// Main function to render products with enhanced features
function renderProducts(filterCategory = null, containerId = 'product-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = "";

  const filteredProducts = filterCategory
    ? products.filter(p => p.category === filterCategory)
    : products;

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-search" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or browse our categories.</p>
      </div>
    `;
    return;
  }

  filteredProducts.forEach(product => {
    const productCard = createProductCard(product);
    container.appendChild(productCard);
  });
}

// Function to create enhanced product card
function createProductCard(product) {
  const div = document.createElement("div");
  div.className = "product-card";
  
  const discountBadge = product.discount > 0 ? 
    `<div class="discount-badge">-${product.discount}%</div>` : '';
  
  const originalPrice = product.originalPrice && product.originalPrice !== product.price ? 
    `<span class="original-price">${product.originalPrice}</span>` : '';
  
  const stars = generateStars(product.rating);
  
  const features = product.features ? 
    product.features.slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('') : '';

  div.innerHTML = `
    ${discountBadge}
    <div class="product-image-container">
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <div class="product-overlay">
        <button class="quick-view-btn" onclick="showProductDetails(${product.id})">
          <i class="fas fa-eye"></i> Quick View
        </button>
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-title">${product.name}</h3>
      <div class="product-rating">
        <div class="stars">${stars}</div>
        <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
      </div>
      <p class="product-description">${product.description}</p>
      <div class="product-features">
        ${features}
      </div>
      <div class="product-price">
        ${originalPrice}
        <span class="current-price">${product.price}</span>
      </div>
      <div class="product-buttons">
        <a href="${product.link}" target="_blank" class="btn btn-primary btn-small" onclick="trackClick('${product.name}', '${product.category}')">
          <i class="fas fa-shopping-cart"></i> Buy Now
        </a>
        <button class="btn btn-outline btn-small" onclick="addToWishlist(${product.id})">
          <i class="fas fa-heart"></i> Save
        </button>
      </div>
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
  
  featuredProducts.forEach(product => {
    const productCard = createProductCard(product);
    container.appendChild(productCard);
  });
}

// Function to show product details in modal
function showProductDetails(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const modal = document.createElement('div');
  modal.className = 'product-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${product.name}</h2>
        <button class="close-modal" onclick="closeModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="modal-image">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="modal-info">
          <div class="product-rating">
            <div class="stars">${generateStars(product.rating)}</div>
            <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
          </div>
          <p class="product-description">${product.description}</p>
          <div class="product-features">
            <h4>Key Features:</h4>
            <ul>
              ${product.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          <div class="product-price">
            ${product.originalPrice && product.originalPrice !== product.price ? 
              `<span class="original-price">${product.originalPrice}</span>` : ''}
            <span class="current-price">${product.price}</span>
          </div>
          <div class="modal-buttons">
            <a href="${product.link}" target="_blank" class="btn btn-primary" onclick="trackClick('${product.name}', '${product.category}')">
              <i class="fas fa-shopping-cart"></i> Buy Now
            </a>
            <button class="btn btn-outline" onclick="addToWishlist(${product.id})">
              <i class="fas fa-heart"></i> Add to Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

// Function to close modal
function closeModal() {
  const modal = document.querySelector('.product-modal');
  if (modal) {
    modal.remove();
  }
}

// Function to add product to wishlist
function addToWishlist(productId) {
  const product = products.find(p => p.id === productId);
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
  return products.filter(product => 
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
  
  if (filename.includes('smartwatch')) {
    renderProducts('smartwatch');
  } else if (filename.includes('fashion')) {
    renderProducts('fashion');
  } else if (filename.includes('small-electrical') || filename.includes('electronic')) {
    renderProducts('electrical');
  } else if (filename.includes('gaming')) {
    renderProducts('gaming');
  } else if (filename.includes('home-garden')) {
    renderProducts('home-garden');
  } else if (filename.includes('index') || filename === '' || filename === '/') {
    // Homepage - render featured products
    if (document.getElementById('featuredProductsGrid')) {
      renderFeaturedProducts();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  autoRenderProducts();
  
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

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderProducts,
    renderFeaturedProducts,
    createProductCard,
    showProductDetails,
    addToWishlist,
    trackClick,
    searchProducts,
    renderSearchResults
  };
}
