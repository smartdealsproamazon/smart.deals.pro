// Comprehensive Product Catalog for SmartDeals Pro
const products = [
  // Smartwatches Category
  {
    id: 1,
    name: "Apple Watch Series 9 GPS",
    price: "$399.99",
    originalPrice: "$429.99",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=300&fit=crop",
    link: "https://amzn.to/4iV3IX1",
    category: "smartwatch",
    rating: 4.8,
    reviews: 2543,
    description: "The most advanced Apple Watch yet with new health features and brighter display.",
    features: ["S9 Chip", "Health Monitoring", "45mm Display", "All-Day Battery"],
    discount: 7
  },
  {
    id: 2,
    name: "Samsung Galaxy Watch 6 Classic",
    price: "$329.99",
    originalPrice: "$399.99",
    image: "https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?w=400&h=300&fit=crop",
    link: "https://amzn.to/3FakN1A",
    category: "smartwatch",
    rating: 4.6,
    reviews: 1876,
    description: "Premium smartwatch with rotating bezel and comprehensive health tracking.",
    features: ["Rotating Bezel", "Sleep Coaching", "Heart Rate Monitor", "GPS"],
    discount: 18
  },
  {
    id: 3,
    name: "Fitbit Versa 4",
    price: "$179.99",
    originalPrice: "$199.99",
    image: "https://images.unsplash.com/photo-1576243345792-2e1e684c6c80?w=400&h=300&fit=crop",
    link: "https://amzn.to/fitness-tracker",
    category: "smartwatch",
    rating: 4.4,
    reviews: 3210,
    description: "Fitness-focused smartwatch with built-in GPS and 6+ day battery life.",
    features: ["Built-in GPS", "6+ Day Battery", "40+ Exercise Modes", "Music Storage"],
    discount: 10
  },

  // Fashion Category
  {
    id: 4,
    name: "Levi's 511 Slim Jeans",
    price: "$59.99",
    originalPrice: "$79.99",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop",
    link: "https://amzn.to/levis-jeans",
    category: "fashion",
    rating: 4.5,
    reviews: 8765,
    description: "Classic slim-fit jeans in premium denim with stretch comfort.",
    features: ["Slim Fit", "Stretch Denim", "Multiple Washes", "Durable"],
    discount: 25
  },
  {
    id: 5,
    name: "Nike Air Max 270",
    price: "$119.99",
    originalPrice: "$150.00",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    link: "https://amzn.to/nike-airmax",
    category: "fashion",
    rating: 4.7,
    reviews: 5432,
    description: "Iconic lifestyle sneaker with Max Air cushioning and breathable mesh.",
    features: ["Max Air Unit", "Breathable Mesh", "Lightweight", "All-Day Comfort"],
    discount: 20
  },
  {
    id: 6,
    name: "Ray-Ban Aviator Sunglasses",
    price: "$129.99",
    originalPrice: "$154.99",
    image: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=300&fit=crop",
    link: "https://amzn.to/rayban-aviator",
    category: "fashion",
    rating: 4.9,
    reviews: 12890,
    description: "Classic aviator sunglasses with polarized lenses and gold frame.",
    features: ["Polarized Lenses", "UV Protection", "Gold Frame", "Classic Design"],
    discount: 16
  },

  // Electronics Category
  {
    id: 7,
    name: "Apple AirPods Pro (2nd Gen)",
    price: "$199.99",
    originalPrice: "$249.99",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop",
    link: "https://amzn.to/airpods-pro",
    category: "electrical",
    rating: 4.8,
    reviews: 15467,
    description: "Wireless earbuds with active noise cancellation and spatial audio.",
    features: ["Active Noise Cancellation", "Spatial Audio", "H2 Chip", "6 Hours Battery"],
    discount: 20
  },
  {
    id: 8,
    name: "Amazon Echo Dot (5th Gen)",
    price: "$39.99",
    originalPrice: "$49.99",
    image: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&h=300&fit=crop",
    link: "https://amzn.to/echo-dot",
    category: "electrical",
    rating: 4.6,
    reviews: 87654,
    description: "Smart speaker with Alexa, improved sound quality and smart home hub.",
    features: ["Alexa Built-in", "Smart Home Hub", "Improved Sound", "Voice Control"],
    discount: 20
  },
  {
    id: 9,
    name: "Anker PowerBank 20000mAh",
    price: "$45.99",
    originalPrice: "$59.99",
    image: "https://images.unsplash.com/photo-1609592718686-2d958f8a6b22?w=400&h=300&fit=crop",
    link: "https://amzn.to/anker-powerbank",
    category: "electrical",
    rating: 4.7,
    reviews: 23456,
    description: "High-capacity portable charger with fast charging and multiple ports.",
    features: ["20000mAh Capacity", "Fast Charging", "Multiple Ports", "LED Display"],
    discount: 23
  },

  // Gaming Category
  {
    id: 10,
    name: "PlayStation 5 Console",
    price: "$499.99",
    originalPrice: "$499.99",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop",
    link: "https://amzn.to/ps5-console",
    category: "gaming",
    rating: 4.9,
    reviews: 34567,
    description: "Next-gen gaming console with 4K gaming and ultra-fast SSD.",
    features: ["4K Gaming", "Ultra-Fast SSD", "Ray Tracing", "3D Audio"],
    discount: 0
  },
  {
    id: 11,
    name: "Xbox Wireless Controller",
    price: "$54.99",
    originalPrice: "$64.99",
    image: "https://images.unsplash.com/photo-1588317176678-7ee5f8a8c1a4?w=400&h=300&fit=crop",
    link: "https://amzn.to/xbox-controller",
    category: "gaming",
    rating: 4.8,
    reviews: 12345,
    description: "Wireless gaming controller with enhanced comfort and precision.",
    features: ["Wireless", "Enhanced Comfort", "Precision Control", "40 Hour Battery"],
    discount: 15
  },
  {
    id: 12,
    name: "Razer DeathAdder V3 Gaming Mouse",
    price: "$79.99",
    originalPrice: "$99.99",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop",
    link: "https://amzn.to/razer-mouse",
    category: "gaming",
    rating: 4.7,
    reviews: 8765,
    description: "High-precision gaming mouse with 30K DPI sensor and ergonomic design.",
    features: ["30K DPI Sensor", "Ergonomic Design", "Ultra-lightweight", "90 Hour Battery"],
    discount: 20
  },

  // Home & Garden Category
  {
    id: 13,
    name: "Ninja Foodi Personal Blender",
    price: "$69.99",
    originalPrice: "$89.99",
    image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop",
    link: "https://amzn.to/ninja-blender",
    category: "home-garden",
    rating: 4.6,
    reviews: 5678,
    description: "Personal blender with powerful motor and to-go cups for smoothies.",
    features: ["Powerful Motor", "To-Go Cups", "Easy Cleanup", "Compact Design"],
    discount: 22
  },
  {
    id: 14,
    name: "Dyson V15 Detect Vacuum",
    price: "$649.99",
    originalPrice: "$749.99",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    link: "https://amzn.to/dyson-vacuum",
    category: "home-garden",
    rating: 4.8,
    reviews: 3456,
    description: "Cordless vacuum with laser dust detection and powerful suction.",
    features: ["Laser Dust Detection", "Powerful Suction", "Cordless", "Up to 60 Min Runtime"],
    discount: 13
  },
  {
    id: 15,
    name: "Philips Hue Smart Light Bulbs",
    price: "$149.99",
    originalPrice: "$199.99",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop",
    link: "https://amzn.to/philips-hue",
    category: "home-garden",
    rating: 4.7,
    reviews: 15678,
    description: "Smart LED bulbs with millions of colors and voice control compatibility.",
    features: ["16 Million Colors", "Voice Control", "App Control", "Energy Efficient"],
    discount: 25
  },

  // Additional Featured Products
  {
    id: 16,
    name: "MacBook Air M2",
    price: "$1099.99",
    originalPrice: "$1199.99",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
    link: "https://amzn.to/macbook-air-m2",
    category: "electrical",
    rating: 4.9,
    reviews: 7890,
    description: "Ultra-thin laptop with M2 chip, all-day battery, and stunning display.",
    features: ["M2 Chip", "18-Hour Battery", "13.6-inch Display", "Ultra-thin Design"],
    discount: 8,
    featured: true
  },
  {
    id: 17,
    name: "iPhone 15 Pro",
    price: "$999.99",
    originalPrice: "$999.99",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
    link: "https://amzn.to/iphone-15-pro",
    category: "electrical",
    rating: 4.8,
    reviews: 23456,
    description: "Pro smartphone with titanium design, advanced cameras, and A17 Pro chip.",
    features: ["Titanium Design", "A17 Pro Chip", "Pro Camera System", "Action Button"],
    discount: 0,
    featured: true
  },
  {
    id: 18,
    name: "Sony WH-1000XM5 Headphones",
    price: "$349.99",
    originalPrice: "$399.99",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    link: "https://amzn.to/sony-headphones",
    category: "electrical",
    rating: 4.8,
    reviews: 12345,
    description: "Industry-leading noise canceling headphones with premium sound quality.",
    features: ["Industry-Leading Noise Canceling", "30-Hour Battery", "Premium Sound", "Multipoint Connection"],
    discount: 13,
    featured: true
  }
];

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
