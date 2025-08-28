// Firebase Products Service - Real-time Product Management
// SmartDeals Pro - Handles all product operations with Firebase

class FirebaseProductsService {
  constructor() {
    this.listeners = [];
    this.productsCache = {
      featured: [],
      categories: {},
      userProducts: []
    };
    this.isInitialized = false;
    
    // Wait for Firebase to be ready
    this.waitForFirebase();
  }

  // Normalize arbitrary category labels to consistent slugs used across the site
  normalizeCategorySlug(rawCategory) {
    const value = String(rawCategory || '').toLowerCase().trim();
    if (!value) return 'uncategorized';

    const cleaned = value
      .replace(/&/g, ' and ')
      .replace(/_/g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const aliases = {
      'women': 'girls-fashion',
      'womens': 'girls-fashion',
      "women-s": 'girls-fashion',
      'ladies': 'girls-fashion',
      'female': 'girls-fashion',
      'girls': 'girls-fashion',

      'men': 'boys-fashion',
      'mens': 'boys-fashion',
      "men-s": 'boys-fashion',
      'male': 'boys-fashion',
      'boys': 'boys-fashion',

      'home': 'home-garden',
      'garden': 'home-garden',
      'home-and-garden': 'home-garden',
      'home-garden': 'home-garden',

      'small-appliances': 'small-electrical',
      'appliances': 'small-electrical',
      'small-electrical': 'small-electrical',

      'usa-flash-sale': 'usa-discount',
      'usa-deals': 'usa-discount',
      'us-discount': 'usa-discount'
    };

    if (aliases[cleaned]) return aliases[cleaned];

    return cleaned;
  }

  async waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (window.firebaseService && window.firebaseService.isReady()) {
        this.isInitialized = true;
        console.log('Firebase Products Service initialized');
        this.setupRealtimeListeners();
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.isInitialized) {
      console.error('Firebase Products Service failed to initialize');
    }
  }

  // Setup real-time listeners for all product collections
  setupRealtimeListeners() {
    if (!this.isInitialized) return;

    // Listen to featured products
    this.listenToFeaturedProducts();
    
    // Listen to category products
    this.listenToCategoryProducts();
    
    // Listen to user submitted products
    this.listenToUserProducts();
  }

  // Real-time listener for featured products
  listenToFeaturedProducts() {
    const unsubscribe = window.firebaseService.db.collection('featuredProducts')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        this.productsCache.featured = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Updated featured products: ${this.productsCache.featured.length} items`);
        this.notifyListeners('featured', this.productsCache.featured);
      }, (error) => {
        console.error('Error listening to featured products:', error);
      });

    this.listeners.push(unsubscribe);
  }

  // Real-time listener for category products
  listenToCategoryProducts() {
    const unsubscribe = window.firebaseService.db.collection('categoryProducts')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        // Group products by normalized category
        const grouped = {};
        snapshot.docs.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          const slug = this.normalizeCategorySlug(data.category);
          if (!grouped[slug]) grouped[slug] = [];
          grouped[slug].push(data);
        });

        this.productsCache.categories = grouped;

        // Notify per category for listeners that care about a single category
        Object.entries(grouped).forEach(([slug, products]) => {
          console.log(`Updated ${slug} products: ${products.length} items`);
          this.notifyListeners('category', { category: slug, products });
        });
        // Also notify that categories payload changed
        this.notifyListeners('categories_all', grouped);
      }, (error) => {
        console.error('Error listening to category products:', error);
      });

    this.listeners.push(unsubscribe);
  }

  // Real-time listener for user submitted products
  listenToUserProducts() {
    const unsubscribe = window.firebaseService.db.collection('userProducts')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        this.productsCache.userProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Updated user products: ${this.productsCache.userProducts.length} items`);
        this.notifyListeners('userProducts', this.productsCache.userProducts);
      }, (error) => {
        console.error('Error listening to user products:', error);
      });

    this.listeners.push(unsubscribe);
  }

  // Add featured product (Admin only)
  async addFeaturedProduct(productData) {
    try {
      const product = {
        ...productData,
        type: 'featured',
        status: 'active',
        views: 0,
        clicks: 0
      };

      const docRef = await window.firebaseService.addDocument('featuredProducts', product);
      console.log('Featured product added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding featured product:', error);
      throw error;
    }
  }

  // Add category product (Admin only)
  async addCategoryProduct(productData) {
    try {
      const product = {
        ...productData,
        type: 'category',
        status: 'active',
        views: 0,
        clicks: 0
      };

      const docRef = await window.firebaseService.addDocument('categoryProducts', product);
      console.log('Category product added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding category product:', error);
      throw error;
    }
  }

  // Add user submitted product
  async addUserProduct(productData, userInfo) {
    try {
      const product = {
        ...productData,
        type: 'user_submitted',
        status: 'pending', // Requires admin approval
        submittedBy: userInfo,
        views: 0,
        clicks: 0
      };

      const docRef = await window.firebaseService.addDocument('userProducts', product);
      console.log('User product added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding user product:', error);
      throw error;
    }
  }

  // Get featured products (cached)
  getFeaturedProducts() {
    return this.productsCache.featured;
  }

  // Get category products (cached)
  getCategoryProducts(category) {
    const slug = this.normalizeCategorySlug(category);
    return this.productsCache.categories[slug] || [];
  }

  // Get all category products (cached)
  getAllCategoryProducts() {
    return this.productsCache.categories;
  }

  // Get user products (cached)
  getUserProducts() {
    return this.productsCache.userProducts;
  }

  // Update product views
  async updateProductViews(collection, productId) {
    try {
      const productRef = window.firebaseService.db.collection(collection).doc(productId);
      await productRef.update({
        views: window.firebase.firestore.FieldValue.increment(1),
        lastViewed: window.firebaseService.getTimestamp()
      });
    } catch (error) {
      console.error('Error updating product views:', error);
    }
  }

  // Update product clicks
  async updateProductClicks(collection, productId) {
    try {
      const productRef = window.firebaseService.db.collection(collection).doc(productId);
      await productRef.update({
        clicks: window.firebase.firestore.FieldValue.increment(1),
        lastClicked: window.firebaseService.getTimestamp()
      });
    } catch (error) {
      console.error('Error updating product clicks:', error);
    }
  }

  // Delete product
  async deleteProduct(collection, productId) {
    try {
      await window.firebaseService.deleteDocument(collection, productId);
      console.log('Product deleted:', productId);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Subscribe to product updates
  subscribe(callback) {
    this.listeners.push(callback);
  }

  // Notify all listeners
  notifyListeners(type, data) {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        try {
          listener(type, data);
        } catch (error) {
          console.error('Error in product listener:', error);
        }
      }
    });
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners = [];
  }

  // Search products
  searchProducts(query, type = 'all') {
    const lowerQuery = query.toLowerCase();
    let results = [];

    if (type === 'all' || type === 'featured') {
      const featuredResults = this.productsCache.featured.filter(product =>
        product.title?.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery) ||
        product.category?.toLowerCase().includes(lowerQuery)
      );
      results = results.concat(featuredResults);
    }

    if (type === 'all' || type === 'category') {
      Object.values(this.productsCache.categories).forEach(categoryProducts => {
        const categoryResults = categoryProducts.filter(product =>
          product.title?.toLowerCase().includes(lowerQuery) ||
          product.description?.toLowerCase().includes(lowerQuery) ||
          product.category?.toLowerCase().includes(lowerQuery)
        );
        results = results.concat(categoryResults);
      });
    }

    if (type === 'all' || type === 'user') {
      const userResults = this.productsCache.userProducts.filter(product =>
        product.title?.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery) ||
        product.category?.toLowerCase().includes(lowerQuery)
      );
      results = results.concat(userResults);
    }

    return results;
  }
}

// Create global instance
const firebaseProductsService = new FirebaseProductsService();

// Export for use in other files
window.firebaseProductsService = firebaseProductsService;