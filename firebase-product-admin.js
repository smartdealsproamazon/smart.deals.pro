// Firebase Product Administration - Real-time Product Management for Lago
// This file provides functions to add, update, and manage products in Firebase Firestore

class FirebaseProductAdmin {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    // Wait for Firebase to be loaded
    if (typeof firebase === 'undefined') {
      console.log('Waiting for Firebase to load...');
      await this.waitForFirebase();
    }

    const firebaseConfig = {
      apiKey: "AIzaSyBJqBEWDdBlfv5xAjgcvqput1KC1NzKvlU",
      authDomain: "smart-deals-pro.firebaseapp.com",
      projectId: "smart-deals-pro",
      storageBucket: "smart-deals-pro.firebasestorage.app",
      messagingSenderId: "680016915696",
      appId: "1:680016915696:web:4b3721313ea0e2e3342635",
      measurementId: "G-HV5N0LQJTG"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    this.db = firebase.firestore();
    console.log('Firebase Product Admin initialized');
  }

  waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  }

  // Add a new product to Firebase (will trigger real-time updates)
  async addProduct(productData) {
    try {
      if (!this.db) {
        await this.init();
      }

      // Use the product state manager to generate consistent IDs
      let productId = productData.id;
      if (!productId && window.productStateManager) {
        productId = window.productStateManager.generateProductId(productData);
      } else if (!productId) {
        productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const product = {
        ...productData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        id: productId
      };

      const docRef = await this.db.collection('products').add(product);
      console.log('Product added with ID:', docRef.id);
      
      return { success: true, id: docRef.id, product };
    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing product
  async updateProduct(productId, updateData) {
    try {
      if (!this.db) {
        await this.init();
      }

      const updatePayload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('products').doc(productId).update(updatePayload);
      console.log('Product updated:', productId);
      
      return { success: true, id: productId };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a product
  async deleteProduct(productId) {
    try {
      if (!this.db) {
        await this.init();
      }

      await this.db.collection('products').doc(productId).delete();
      console.log('Product deleted:', productId);
      
      return { success: true, id: productId };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all products (for admin purposes)
  async getAllProducts() {
    try {
      if (!this.db) {
        await this.init();
      }

      const snapshot = await this.db.collection('products').orderBy('createdAt', 'desc').get();
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, products };
    } catch (error) {
      console.error('Error getting products:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper function to create sample product
  createSampleProduct() {
    const categories = ['smartwatch', 'fashion', 'electronics', 'gaming', 'home-garden'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const sampleProducts = {
      smartwatch: {
        name: 'Ultra Smart Watch Pro',
        price: 299.99,
        originalPrice: 399.99,
        description: 'Advanced smartwatch with health monitoring and GPS tracking',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        link: 'https://example.com/smartwatch',
        features: ['Heart Rate Monitor', 'GPS Tracking', 'Water Resistant', '7-day Battery'],
        discount: 25,
        rating: 4.8,
        reviews: 156
      },
      fashion: {
        name: 'Premium Designer Jacket',
        price: 149.99,
        originalPrice: 199.99,
        description: 'Stylish and comfortable designer jacket for all seasons',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        link: 'https://example.com/jacket',
        features: ['Water Resistant', 'Breathable Fabric', 'Multiple Pockets', 'Adjustable Hood'],
        discount: 25,
        rating: 4.6,
        reviews: 89
      },
      electronics: {
        name: 'Wireless Noise-Canceling Headphones',
        price: 199.99,
        originalPrice: 299.99,
        description: 'Premium wireless headphones with active noise cancellation',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        link: 'https://example.com/headphones',
        features: ['Active Noise Cancellation', '30-hour Battery', 'Bluetooth 5.0', 'Quick Charge'],
        discount: 33,
        rating: 4.9,
        reviews: 234
      },
      gaming: {
        name: 'Pro Gaming Mechanical Keyboard',
        price: 129.99,
        originalPrice: 179.99,
        description: 'High-performance mechanical keyboard for gaming enthusiasts',
        image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
        link: 'https://example.com/keyboard',
        features: ['Mechanical Switches', 'RGB Backlight', 'Anti-Ghosting', 'Aluminum Frame'],
        discount: 28,
        rating: 4.7,
        reviews: 178
      },
      'home-garden': {
        name: 'Smart Home Security Camera',
        price: 89.99,
        originalPrice: 129.99,
        description: 'Wireless security camera with night vision and mobile app',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        link: 'https://example.com/camera',
        features: ['1080p HD Video', 'Night Vision', 'Motion Detection', 'Cloud Storage'],
        discount: 31,
        rating: 4.5,
        reviews: 92
      }
    };

    return {
      ...sampleProducts[category],
      category,
      featured: Math.random() > 0.7
    };
  }
}

// Global functions for easy access
window.firebaseAdmin = new FirebaseProductAdmin();

// Convenience functions for console testing
window.addSampleProduct = async function() {
  const admin = window.firebaseAdmin;
  const sampleProduct = admin.createSampleProduct();
  const result = await admin.addProduct(sampleProduct);
  
  if (result.success) {
    console.log('✅ Sample product added successfully!', result.product);
    alert('Sample product added! You should see it appear in real-time on the site.');
  } else {
    console.error('❌ Failed to add product:', result.error);
    alert('Failed to add product: ' + result.error);
  }
  
  return result;
};

window.addMultipleProducts = async function(count = 3) {
  console.log(`Adding ${count} sample products...`);
  const results = [];
  
  for (let i = 0; i < count; i++) {
    const admin = window.firebaseAdmin;
    const sampleProduct = admin.createSampleProduct();
    const result = await admin.addProduct(sampleProduct);
    results.push(result);
    
    // Add a small delay between products
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`✅ Added ${successful}/${count} products successfully!`);
  alert(`Added ${successful}/${count} products! Watch them appear in real-time!`);
  
  return results;
};

window.getAllProducts = async function() {
  const admin = window.firebaseAdmin;
  const result = await admin.getAllProducts();
  
  if (result.success) {
    console.log('📦 All products in Firebase:', result.products);
    console.table(result.products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price
    })));
  } else {
    console.error('❌ Failed to get products:', result.error);
  }
  
  return result;
};

// Instructions for users
console.log(`
🚀 Firebase Real-time Product Admin loaded!

Quick commands to test real-time updates:

1. addSampleProduct() - Add a single random product
2. addMultipleProducts(3) - Add 3 random products with delay
3. getAllProducts() - View all products in Firebase

Example:
> addSampleProduct()
> addMultipleProducts(5)

Products will appear in real-time on your site without refresh! 🎉
`);