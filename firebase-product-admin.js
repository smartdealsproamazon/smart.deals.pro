// Firebase Product Admin - Real Product Management
// SmartDeals Pro - Add real products to Firebase

// Wait for Firebase to be ready
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebaseService && window.firebaseService.isReady()) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.firebaseService && window.firebaseService.isReady()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

// Real product data - High-quality affiliate products
const realProducts = [
  {
    name: "Sony WH-1000XM4 Wireless Noise Canceling Headphones",
    price: "$279.99",
    originalPrice: "$349.99",
    discount: 20,
    category: "electronics",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charging.",
    features: ["Active Noise Cancellation", "30-hour battery life", "Quick charging", "Touch controls"],
    rating: 4.8,
    reviews: 1250,
    status: "active"
  },
  {
    name: "Apple Watch Series 8 GPS 45mm",
    price: "$399.99",
    originalPrice: "$499.99",
    discount: 20,
    category: "smartwatches",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "Advanced health monitoring with temperature sensing, cycle tracking, and crash detection.",
    features: ["Health monitoring", "GPS tracking", "Water resistant", "18-hour battery"],
    rating: 4.7,
    reviews: 890,
    status: "active"
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    price: "$89.99",
    originalPrice: "$119.99",
    discount: 25,
    category: "home-garden",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "7-in-1 multi-functional pressure cooker that replaces 7 kitchen appliances.",
    features: ["Pressure cooking", "Slow cooking", "Rice cooking", "Steaming"],
    rating: 4.6,
    reviews: 2100,
    status: "active"
  },
  {
    name: "Nike Air Max 270 Running Shoes",
    price: "$129.99",
    originalPrice: "$150.00",
    discount: 13,
    category: "sports",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "Maximum comfort with the tallest Air unit yet for all-day comfort.",
    features: ["Air Max cushioning", "Breathable mesh", "Rubber outsole", "Lightweight"],
    rating: 4.5,
    reviews: 1560,
    status: "active"
  },
  {
    name: "Samsung 65-inch QLED 4K Smart TV",
    price: "$997.99",
    originalPrice: "$1299.99",
    discount: 23,
    category: "electronics",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "Quantum Dot technology delivers 100% color volume with incredible brightness.",
    features: ["4K resolution", "QLED technology", "Smart TV", "HDR"],
    rating: 4.8,
    reviews: 890,
    status: "active"
  },
  {
    name: "Dyson V15 Detect Cordless Vacuum",
    price: "$649.99",
    originalPrice: "$749.99",
    discount: 13,
    category: "home-garden",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "Laser technology reveals hidden dust and powerful suction removes it all.",
    features: ["Laser technology", "60-minute runtime", "HEPA filtration", "Cordless"],
    rating: 4.7,
    reviews: 1200,
    status: "active"
  },
  {
    name: "Adidas Ultraboost 22 Running Shoes",
    price: "$179.99",
    originalPrice: "$220.00",
    discount: 18,
    category: "sports",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "Responsive Boost midsole and Primeknit+ upper for ultimate comfort.",
    features: ["Boost midsole", "Primeknit+ upper", "Continental rubber", "Responsive"],
    rating: 4.6,
    reviews: 980,
    status: "active"
  },
  {
    name: "Canon EOS R6 Mirrorless Camera",
    price: "$2399.99",
    originalPrice: "$2499.99",
    discount: 4,
    category: "electronics",
    platform: "Amazon",
    affiliate: true,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
    link: "https://amzn.to/3QK8X2Y",
    description: "20.1MP full-frame CMOS sensor with Dual Pixel CMOS AF II.",
    features: ["20.1MP sensor", "4K video", "Dual Pixel AF", "5-axis stabilization"],
    rating: 4.9,
    reviews: 450,
    status: "active"
  }
];

// Add a single sample product - DISABLED to prevent demo products
window.addSampleProduct = async function() {
  console.log('Sample product addition has been disabled to prevent demo products from appearing');
  if (typeof addLog === 'function') {
    addLog('🚫 Sample product addition disabled - no demo products will be added', 'warning');
  }
  return {
    success: false,
    error: 'Sample product addition has been disabled'
  };
  
  // Original code commented out to prevent demo products
  /*
  try {
    await waitForFirebase();
    
    // Select a random real product
    const randomProduct = realProducts[Math.floor(Math.random() * realProducts.length)];
    
    // Add timestamp
    const productData = {
      ...randomProduct,
      createdAt: window.firebaseService.getTimestamp(),
      submissionDate: new Date().toISOString(),
      views: 0,
      clicks: 0
    };
    
    // Add to Firebase
    const docRef = await window.firebaseService.addDocument('products', productData);
    
    console.log('Product added successfully:', docRef.id);
    
    return {
      success: true,
      product: productData,
      id: docRef.id
    };
    
  } catch (error) {
    console.error('Error adding product:', error);
    return {
      success: false,
      error: error.message
    };
  }
  */
};

// Add multiple products - DISABLED to prevent demo products
window.addMultipleProducts = async function(count = 3) {
  console.log('Multiple product addition has been disabled to prevent demo products from appearing');
  if (typeof addLog === 'function') {
    addLog('🚫 Multiple product addition disabled - no demo products will be added', 'warning');
  }
  return [{
    success: false,
    error: 'Multiple product addition has been disabled'
  }];
  
  // Original code commented out to prevent demo products
  /*
  try {
    await waitForFirebase();
    
    const results = [];
    const productsToAdd = realProducts.slice(0, count);
    
    for (const product of productsToAdd) {
      try {
        const productData = {
          ...product,
          createdAt: window.firebaseService.getTimestamp(),
          submissionDate: new Date().toISOString(),
          views: 0,
          clicks: 0
        };
        
        const docRef = await window.firebaseService.addDocument('products', productData);
        results.push({
          success: true,
          product: productData,
          id: docRef.id
        });
        
        // Small delay between additions
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Error adding multiple products:', error);
    return [{
      success: false,
      error: error.message
    }];
  }
  */
};

// Get all products from Firebase
window.getAllProducts = async function() {
  try {
    await waitForFirebase();
    
    const products = await window.firebaseService.getCollection('products', 'createdAt', 'desc');
    
    return {
      success: true,
      products: products
    };
    
  } catch (error) {
    console.error('Error getting products:', error);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
};

// Delete all products (use with caution)
window.deleteAllProducts = async function() {
  try {
    await waitForFirebase();
    
    const products = await window.firebaseService.getCollection('products');
    let deletedCount = 0;
    
    for (const product of products) {
      try {
        await window.firebaseService.deleteDocument('products', product.id);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting product ${product.id}:`, error);
      }
    }
    
    return {
      success: true,
      deletedCount: deletedCount
    };
    
  } catch (error) {
    console.error('Error deleting products:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Initialize admin functionality
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Firebase Product Admin loaded');
  
  // Wait for Firebase to be ready
  await waitForFirebase();
  
  // Update status
  if (typeof updateStatus === 'function') {
    updateStatus('firebase', 'connected', 'Connected to Firebase');
    updateStatus('realtime', 'connected', 'Real-time updates active');
  }
  
  // Check existing products
  try {
    const result = await window.getAllProducts();
    if (result.success) {
      if (typeof updateStatus === 'function') {
        updateStatus('products', 'connected', `${result.products.length} products loaded`);
      }
      if (typeof addLog === 'function') {
        addLog(`📦 Found ${result.products.length} products in database`, 'success');
      }
    }
  } catch (error) {
    console.error('Error checking products:', error);
  }
});

// Auto demo functionality - DISABLED to prevent demo products
window.startAutoDemo = function() {
  console.log('Auto demo functionality has been disabled to prevent demo products from appearing');
  if (typeof addLog === 'function') {
    addLog('🚫 Auto demo functionality disabled - no demo products will be added', 'warning');
  }
  return;
  
  // Original code commented out to prevent demo products
  /*
  if (window.autoDemoInterval) {
    clearInterval(window.autoDemoInterval);
    window.autoDemoInterval = null;
    if (typeof addLog === 'function') {
      addLog('🛑 Auto demo stopped', 'info');
    }
    return;
  }
  
  window.autoDemoInterval = setInterval(async () => {
    try {
      const result = await window.addSampleProduct();
      if (result.success) {
        if (typeof addLog === 'function') {
          addLog(`✅ Auto-added: ${result.product.name}`, 'success');
        }
      }
    } catch (error) {
      if (typeof addLog === 'function') {
        addLog(`❌ Auto-add failed: ${error.message}`, 'error');
      }
    }
  }, 10000); // Add product every 10 seconds
  
  if (typeof addLog === 'function') {
    addLog('🚀 Starting auto demo - adding product every 10 seconds', 'info');
  }
  */
};

// Sample products loading DISABLED - only show real Firebase products
// window.loadSampleProductsToDisplay = function() { ... }

// Auto-load sample products DISABLED - only show real Firebase products
// document.addEventListener('DOMContentLoaded', function() {
//   // Try to load sample products immediately
//   if (!window.loadSampleProductsToDisplay()) {
//     // If not successful, retry after a short delay
//     setTimeout(() => {
//       window.loadSampleProductsToDisplay();
//     }, 500);
//   }
// });

// Export functions for global access
window.firebaseProductAdmin = {
  addSampleProduct: window.addSampleProduct,
  addMultipleProducts: window.addMultipleProducts,
  getAllProducts: window.getAllProducts,
  deleteAllProducts: window.deleteAllProducts,
  startAutoDemo: window.startAutoDemo
  // loadSampleProductsToDisplay: DISABLED - only show real Firebase products
};