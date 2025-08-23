// Product Restoration Script
// This script ensures products are loaded properly after site data is cleared

(function() {
  'use strict';
  
  console.log('🔄 Starting product restoration...');
  
  // Fallback products to ensure something is always displayed
  const fallbackProducts = [
    {
      id: 'fallback_1',
      name: 'Wireless Bluetooth Headphones',
      title: 'Premium Wireless Bluetooth Headphones with Noise Cancellation',
      price: '79.99',
      originalPrice: '129.99',
      discount: '38%',
      link: 'https://amzn.to/wireless-headphones-2024',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      category: 'electronics',
      rating: 4.5,
      reviews: 1250,
      description: 'High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality.',
      features: ['Noise Cancellation', '30hr Battery', 'Fast Charging', 'Premium Sound'],
      inStock: true,
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fallback_2',
      name: 'Smart Fitness Watch',
      title: 'Advanced Smart Fitness Watch with Heart Rate Monitor',
      price: '149.99',
      originalPrice: '199.99',
      discount: '25%',
      link: 'https://amzn.to/smart-fitness-watch-2024',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      category: 'electronics',
      rating: 4.7,
      reviews: 892,
      description: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS, and 7-day battery life.',
      features: ['Heart Rate Monitor', 'GPS Tracking', '7-day Battery', 'Waterproof'],
      inStock: true,
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fallback_3',
      name: 'Portable Power Bank',
      title: '20000mAh Portable Power Bank with Fast Charging',
      price: '29.99',
      originalPrice: '49.99',
      discount: '40%',
      link: 'https://amzn.to/portable-power-bank-2024',
      image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
      category: 'electronics',
      rating: 4.3,
      reviews: 2100,
      description: 'High-capacity power bank with fast charging technology. Compatible with all devices.',
      features: ['20000mAh Capacity', 'Fast Charging', 'Multiple Ports', 'LED Display'],
      inStock: true,
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fallback_4',
      name: 'Wireless Phone Charger',
      title: 'Fast Wireless Charging Pad for All Qi-Enabled Devices',
      price: '24.99',
      originalPrice: '39.99',
      discount: '37%',
      link: 'https://amzn.to/wireless-charger-2024',
      image: 'https://images.unsplash.com/photo-1592659762303-90081d34b277?w=400',
      category: 'electronics',
      rating: 4.4,
      reviews: 756,
      description: 'Convenient wireless charging pad with fast charging technology and sleek design.',
      features: ['Fast Wireless Charging', 'Universal Compatibility', 'LED Indicator', 'Non-Slip Base'],
      inStock: true,
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fallback_5',
      name: 'Bluetooth Speaker',
      title: 'Portable Bluetooth Speaker with Deep Bass',
      price: '39.99',
      originalPrice: '69.99',
      discount: '43%',
      link: 'https://amzn.to/bluetooth-speaker-2024',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
      category: 'electronics',
      rating: 4.6,
      reviews: 1580,
      description: 'Compact portable speaker with powerful bass, waterproof design, and 12-hour battery life.',
      features: ['Deep Bass', 'Waterproof', '12hr Battery', 'Compact Design'],
      inStock: true,
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fallback_6',
      name: 'USB-C Cable Set',
      title: '3-Pack Fast Charging USB-C Cables',
      price: '19.99',
      originalPrice: '34.99',
      discount: '43%',
      link: 'https://amzn.to/usb-c-cables-2024',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      category: 'electronics',
      rating: 4.2,
      reviews: 945,
      description: 'Durable USB-C cables with fast charging and data transfer capabilities. 3-pack with different lengths.',
      features: ['Fast Charging', 'Data Transfer', '3 Different Lengths', 'Durable Design'],
      inStock: true,
      verified: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  // Check if products exist in localStorage
  function hasExistingProducts() {
    try {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
      
      // Filter out any remaining demo products
      const realProducts = products.filter(product => 
        !product.id?.includes('demo_') &&
        !product.id?.includes('prod_sample_') &&
        !product.name?.toLowerCase().includes('demo') &&
        !product.name?.toLowerCase().includes('example') &&
        product.link !== '#'
      );
      
      return realProducts.length > 0;
    } catch (error) {
      console.error('Error checking existing products:', error);
      return false;
    }
  }
  
  // Load fallback products
  function loadFallbackProducts() {
    try {
      console.log('🔄 Loading fallback products...');
      
      // Set products in localStorage
      localStorage.setItem('products', JSON.stringify(fallbackProducts));
      localStorage.setItem('allProducts', JSON.stringify(fallbackProducts));
      localStorage.setItem('products_updated', Date.now().toString());
      
      // Set global products array
      if (window.productStateManager) {
        window.productStateManager.updateProducts(fallbackProducts);
        window.products = window.productStateManager.getAllProducts();
      } else {
        window.products = fallbackProducts;
      }
      
      console.log(`✅ Loaded ${fallbackProducts.length} fallback products`);
      
      // Trigger products-ready event
      document.dispatchEvent(new Event('products-ready'));
      
      // Auto-render if function is available
      if (typeof window.autoRenderProducts === 'function') {
        window.autoRenderProducts();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error loading fallback products:', error);
      return false;
    }
  }
  
  // Check Firebase connection and load products
  async function checkFirebaseAndLoadProducts() {
    console.log('🔍 Checking Firebase connection...');
    
    let firebaseAttempts = 0;
    const maxFirebaseAttempts = 10;
    
    // Wait for Firebase to be available
    while (firebaseAttempts < maxFirebaseAttempts) {
      if (window.firebase && window.firebaseService && window.firebaseService.isReady()) {
        console.log('✅ Firebase is ready, attempting to load products...');
        
        try {
          // Try to get products from Firebase
          const firebaseProducts = await window.firebaseService.getCollection('products');
          
          if (firebaseProducts && firebaseProducts.length > 0) {
            console.log(`✅ Loaded ${firebaseProducts.length} products from Firebase`);
            
            // Filter out demo products
            const realFirebaseProducts = firebaseProducts.filter(product => 
              !product.id?.includes('demo_') &&
              !product.id?.includes('prod_sample_') &&
              !product.name?.toLowerCase().includes('demo') &&
              !product.name?.toLowerCase().includes('example')
            );
            
            if (realFirebaseProducts.length > 0) {
              // Store in localStorage
              localStorage.setItem('products', JSON.stringify(realFirebaseProducts));
              localStorage.setItem('allProducts', JSON.stringify(realFirebaseProducts));
              localStorage.setItem('products_updated', Date.now().toString());
              
              // Update global products
              if (window.productStateManager) {
                window.productStateManager.updateProducts(realFirebaseProducts);
                window.products = window.productStateManager.getAllProducts();
              } else {
                window.products = realFirebaseProducts;
              }
              
              console.log(`✅ Successfully restored ${realFirebaseProducts.length} real products from Firebase`);
              document.dispatchEvent(new Event('products-ready'));
              
              if (typeof window.autoRenderProducts === 'function') {
                window.autoRenderProducts();
              }
              
              return true;
            }
          }
          
          console.log('⚠️ No real products found in Firebase, using fallback products');
          return loadFallbackProducts();
          
        } catch (error) {
          console.error('❌ Error loading from Firebase:', error);
          console.log('🔄 Using fallback products due to Firebase error');
          return loadFallbackProducts();
        }
      }
      
      firebaseAttempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('⚠️ Firebase not available after timeout, using fallback products');
    return loadFallbackProducts();
  }
  
  // Main restoration function
  async function restoreProducts() {
    console.log('🚀 Starting product restoration process...');
    
    // Check if we already have products
    if (hasExistingProducts()) {
      console.log('✅ Products already exist, no restoration needed');
      return;
    }
    
    console.log('📭 No products found, starting restoration...');
    
    // Try to load from Firebase first, fallback to local products
    const restored = await checkFirebaseAndLoadProducts();
    
    if (restored) {
      console.log('🎉 Product restoration completed successfully!');
      
      // Show success message if there's a status element
      const statusElement = document.getElementById('status');
      if (statusElement) {
        statusElement.textContent = '✅ Products restored successfully!';
        statusElement.className = 'status success';
      }
    } else {
      console.error('❌ Product restoration failed');
    }
  }
  
  // Auto-start restoration when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreProducts);
  } else {
    restoreProducts();
  }
  
  // Also listen for Firebase ready event
  window.addEventListener('firebase-ready', () => {
    console.log('🔥 Firebase ready event received, checking products...');
    if (!hasExistingProducts()) {
      restoreProducts();
    }
  });
  
  // Expose restore function globally for manual use
  window.restoreProducts = restoreProducts;
  
  console.log('✅ Product restoration script loaded and ready');
  
})();