// Comprehensive Product Catalog for SmartDeals Pro

// Build the products array dynamically from localStorage submissions so that
// the site only shows real user-added items (no hard-coded demo data).

const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');

// Normalize the stored objects so the rest of the site (render.js, etc.) can
// work without any further changes.
const products = storedProducts.map((prod, idx) => ({
  // Generate a simple incremental id if one wasn't supplied previously
  id: prod.id || idx + 1,
  name: prod.title,
  // Convert the numeric/string price into the "$xx.xx" format used
  // throughout the UI. If parsing fails we fall back to "0.00".
  price: `$${parseFloat(prod.price || 0).toFixed(2)}`,
  originalPrice: `$${parseFloat(prod.originalPrice || prod.price || 0).toFixed(2)}`,
  image: prod.imageData,
  link: prod.link,
  category: prod.category || 'uncategorized',
  rating: prod.rating || 5,
  reviews: prod.reviews || 0,
  description: prod.description,
  features: prod.features || [],
  discount: prod.discount || 0,
  featured: Boolean(prod.featured)
}));

// Expose globally so the existing rendering helpers continue to work
window.products = products;

// Helper function to get products by category
function getProductsByCategory(category) {
  return products.filter(product => product.category === category);
}

// Helper function to get featured products
function getFeaturedProducts() {
  return products.filter(product => product.featured || product.rating >= 4.7).slice(0, 6);
}

// Helper function to get products on sale
function getProductsOnSale() {
  return products.filter(product => product.discount > 0);
}

// Helper function to search products
function searchProducts(query) {
  const searchTerm = query.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.features.some(feature => feature.toLowerCase().includes(searchTerm))
  );
}
