function renderProducts(filterCategory = null) {
  const container = document.getElementById("product-container");
  container.innerHTML = "";

  const filteredProducts = filterCategory
    ? products.filter(p => p.category === filterCategory)
    : products;

  if (filteredProducts.length === 0) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }

  filteredProducts.forEach(product => {
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <a href="${product.link}" target="_blank">Buy Now</a>
    `;
    container.appendChild(div);
  });
}

// Detect page and load relevant products
const path = window.location.pathname;
if (path.includes("fashion")) {
  renderProducts("fashion");
} else if (path.includes("smart")) {
  renderProducts("smartwatch");
} else if (path.includes("small")) {
  renderProducts("electrical");
} else {
  renderProducts(); // Home page
}
