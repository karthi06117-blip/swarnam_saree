// SVG Placeholder Image for broken/missing URLs
const PLACEHOLDER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGQUY1RUMiLz48dGV4dCB4PSI1MCIgeT0iNTIiIGZvbnQtZmFtaWx5PSInQ2luemVsJywgc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc2l6ZT0iOSIgZmlsbD0iIzVDMDYxRSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U1ZBUk5BTSBTSUxLUzwvdGV4dD48cmVjdCB4PSI1IiB5PSI1IiB3aWR0aD0iOTAiIGhlaWdodD0iOTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4=";

// Application State
let cart = [];
let orders = [];
let currentFilterCategory = "All";
let currentFilterPriceRange = "all";
let currentFilterColor = "all";
let searchQuery = "";
let sortOrder = "default";
let selectedProductQty = 1;
let previousView = "home";

const ADMIN_EMAIL = "karthi06117@gmail.com";
const ADMIN_PASSWORD = "@KARTHI0607";
const AUTH_STORAGE_KEY = "svarnam_auth_user";
const USERS_STORAGE_KEY = "svarnam_users";

// Dom Elements
const views = {
  home: document.getElementById("view-home"),
  shop: document.getElementById("view-shop"),
  detail: document.getElementById("view-product-detail"),
  cart: document.getElementById("view-cart"),
  checkout: document.getElementById("view-checkout"),
  confirmation: document.getElementById("view-confirmation"),
  admin: document.getElementById("view-admin")
};

const navItems = document.querySelectorAll(".bottom-nav-item");
const cartBadgeCount = document.getElementById("cart-badge-count");
const cartBadgeNav = document.getElementById("cart-badge-nav");
const contentScrollContainer = document.getElementById("app-content-scroll");

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  setupAuthUI();
  setupUserMenu();

  if (isUserLoggedIn() || isAdminLoggedIn()) {
    showAppShell();
  } else {
    showLoginScreen();
  }

  loadCart();
  loadOrders();
  
  initNavigation();
  initHomeView();
  initShopView();
  initDetailView();
  initCartView();
  initCheckoutView();
  initAdminView();
  updateCartBadges();
  renderFeaturedProducts();
});

/* ==========================================================================
   STATE MANAGEMENT HELPERS
   ========================================================================== */
function loadCart() {
  const stored = localStorage.getItem("svarnam_cart");
  cart = stored ? JSON.parse(stored) : [];
}

function saveCart() {
  localStorage.setItem("svarnam_cart", JSON.stringify(cart));
  updateCartBadges();
}

function loadOrders() {
  const stored = localStorage.getItem("svarnam_orders");
  orders = stored ? JSON.parse(stored) : [];
}

function saveOrders() {
  localStorage.setItem("svarnam_orders", JSON.stringify(orders));
}

function updateCartBadges() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty > 0) {
    if (cartBadgeCount) {
      cartBadgeCount.innerText = totalQty;
      cartBadgeCount.style.display = "flex";
    }
    if (cartBadgeNav) {
      cartBadgeNav.innerText = totalQty;
      cartBadgeNav.style.display = "flex";
    }
  } else {
    if (cartBadgeCount) cartBadgeCount.style.display = "none";
    if (cartBadgeNav) cartBadgeNav.style.display = "none";
  }
  if (!window.svarnamState) window.svarnamState = {};
  window.svarnamState.cartCount = totalQty;
  window.dispatchEvent(new CustomEvent("svarnam:cartupdate", { detail: { count: totalQty } }));
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  container.appendChild(toast);
  
  // Remove after animation completes
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// Global exports for React Dock Integration
window.navigateTo = navigateTo;
window.showToast = showToast;

/* ==========================================================================
   ROUTING / SPA NAVIGATION
   ========================================================================== */
function navigateTo(viewId, params = {}) {
  // Capture previous view if not entering detail/checkout/confirmation directly
  const activeView = Object.keys(views).find(key => views[key].classList.contains("active"));
  if (activeView && !["detail", "checkout", "confirmation"].includes(activeView)) {
    previousView = activeView;
  }

  // Toggle hide-nav class on phone screen container
  const phoneScreen = document.getElementById("phone-screen");
  if (phoneScreen) {
    if (["detail", "checkout", "confirmation"].includes(viewId)) {
      phoneScreen.classList.add("hide-nav");
    } else {
      phoneScreen.classList.remove("hide-nav");
    }
  }

  // Hide all views
  Object.values(views).forEach(view => view.classList.remove("active"));
  
  // Show target view
  if (views[viewId]) {
    views[viewId].classList.add("active");
  }
  
  // Scroll to top of content
  if (contentScrollContainer) contentScrollContainer.scrollTop = 0;

  // Dispatch custom event for React Dock
  if (!window.svarnamState) window.svarnamState = {};
  window.svarnamState.activeView = viewId;
  window.dispatchEvent(new CustomEvent("svarnam:viewchange", { detail: { viewId } }));
  
  // Update Bottom Nav Highlighting
  navItems.forEach(item => {
    const target = item.getAttribute("data-target");
    if (target === viewId || (viewId === "detail" && target === "shop") || (viewId === "checkout" && target === "cart") || (viewId === "confirmation" && target === "cart")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Call View Setup Functions if needed
  if (viewId === "home") {
    renderFeaturedProducts();
  } else if (viewId === "shop") {
    // If category param is passed, update filters
    if (params.category) {
      currentFilterCategory = params.category;
      
      // Update filter tabs UI in shop
      const tabs = document.querySelectorAll("#shop-category-tabs .filter-tab");
      tabs.forEach(tab => {
        if (tab.getAttribute("data-category") === params.category) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });
    }
    updateFilterBadgeCount();
    renderShopProducts();
  } else if (viewId === "detail") {
    setupProductDetail(params.productId);
  } else if (viewId === "cart") {
    renderCart();
  } else if (viewId === "checkout") {
    setupCheckout();
  } else if (viewId === "confirmation") {
    setupConfirmation(params.order);
  } else if (viewId === "admin") {
    renderAdminProducts();
    renderAdminOrders();
  }
}

function initNavigation() {
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");
      if (target === "admin") {
        window.location.href = "admin.html";
        return;
      }
      navigateTo(target);
    });
  });
  
  document.getElementById("header-cart-btn").addEventListener("click", () => {
    navigateTo("cart");
  });
}

function setupAuthUI() {
  const loginForm = document.getElementById("auth-login-form");
  const signupForm = document.getElementById("auth-signup-form");
  const loginToggle = document.getElementById("auth-toggle-login");
  const signupToggle = document.getElementById("auth-toggle-signup");
  const authError = document.getElementById("auth-error-msg");
  const signupError = document.getElementById("signup-error-msg");

  if (!loginForm || !signupForm || !loginToggle || !signupToggle) return;

  loginToggle.addEventListener("click", () => {
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
    loginToggle.classList.add("active");
    signupToggle.classList.remove("active");
    authError.style.display = "none";
    signupError.style.display = "none";
  });

  signupToggle.addEventListener("click", () => {
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
    signupToggle.classList.add("active");
    loginToggle.classList.remove("active");
    authError.style.display = "none";
    signupError.style.display = "none";
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("auth-email").value.trim().toLowerCase();
    const password = document.getElementById("auth-password").value;

    if (email === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      localStorage.setItem("svarnam_admin_logged_in", "true");
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = "admin.html";
      return;
    }

    const users = getUsers();
    const match = users.find(user => user.email.toLowerCase() === email && user.password === password);

    if (match) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email: match.email, name: match.name }));
      localStorage.removeItem("svarnam_admin_logged_in");
      authError.style.display = "none";
      showAppShell();
      return;
    }

    authError.style.display = "block";
  });

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;

    if (!name || !email || !phone || !password) {
      signupError.textContent = "Please complete all fields.";
      signupError.style.display = "block";
      return;
    }

    const users = getUsers();
    const exists = users.some(user => user.email.toLowerCase() === email);
    if (exists) {
      signupError.textContent = "This email is already registered.";
      signupError.style.display = "block";
      return;
    }

    users.push({ name, email, phone, password });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    signupError.style.display = "none";
    signupForm.reset();
    loginToggle.click();
    showToast("Account created successfully. Please log in.");
  });
}

function setupUserMenu() {
  const menuButton = document.getElementById("header-menu-btn");
  const menuPanel = document.getElementById("user-menu-panel");
  const logoutButton = document.getElementById("user-menu-logout");

  if (!menuButton || !menuPanel || !logoutButton) return;

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menuPanel.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuPanel.setAttribute("aria-hidden", String(!isOpen));
  });

  logoutButton.addEventListener("click", () => {
    logoutCurrentUser();
  });

  document.addEventListener("click", (event) => {
    if (!menuPanel.contains(event.target) && !menuButton.contains(event.target)) {
      menuPanel.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuPanel.setAttribute("aria-hidden", "true");
    }
  });
}

function logoutCurrentUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("svarnam_admin_logged_in");
  const menuPanel = document.getElementById("user-menu-panel");
  const menuButton = document.getElementById("header-menu-btn");

  if (menuPanel) {
    menuPanel.classList.remove("open");
    menuPanel.setAttribute("aria-hidden", "true");
  }

  if (menuButton) {
    menuButton.setAttribute("aria-expanded", "false");
  }

  showLoginScreen();
}

function getUsers() {
  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  return existing ? JSON.parse(existing) : [];
}

function isUserLoggedIn() {
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
}

function isAdminLoggedIn() {
  return localStorage.getItem("svarnam_admin_logged_in") === "true";
}

function showLoginScreen() {
  const loginScreen = document.getElementById("login-screen");
  const appShell = document.getElementById("app-shell");
  if (loginScreen) loginScreen.style.display = "flex";
  if (appShell) appShell.style.display = "none";
}

function showAppShell() {
  const loginScreen = document.getElementById("login-screen");
  const appShell = document.getElementById("app-shell");
  if (loginScreen) loginScreen.style.display = "none";
  if (appShell) appShell.style.display = "block";
  navigateTo("home");
}

/* ==========================================================================
   HOME VIEW
   ========================================================================== */
function initHomeView() {
  // Category circular link clicks
  const categoryCards = document.querySelectorAll(".category-card");
  categoryCards.forEach(card => {
    card.addEventListener("click", () => {
      const cat = card.getAttribute("data-category");
      navigateTo("shop", { category: cat });
    });
  });
  
  // Home View All categories link
  document.getElementById("home-view-all-categories").addEventListener("click", () => {
    navigateTo("shop", { category: "All" });
  });

  // Home Featured see all link
  document.getElementById("home-view-featured").addEventListener("click", () => {
    navigateTo("shop", { category: "All" });
  });
}

function renderFeaturedProducts() {
  const products = getProducts();
  const featured = products.filter(p => p.isFeatured).slice(0, 4);
  const grid = document.getElementById("home-featured-grid");
  
  grid.innerHTML = "";
  
  featured.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "saree-card";
  
  // Format price
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(product.price);
  
  card.innerHTML = `
    <div class="saree-card-img">
      <img src="${product.image || PLACEHOLDER_SVG}" loading="lazy" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src=PLACEHOLDER_SVG;" class="lazy-img" alt="${product.name}">
      <span class="saree-badge">${product.category}</span>
      <span class="saree-stock-badge ${product.inStock && product.stockCount > 0 ? 'in-stock' : 'out-of-stock'}">
        ${product.inStock && product.stockCount > 0 ? 'In Stock' : 'Out of Stock'}
      </span>
    </div>
    <div class="saree-card-info">
      <h3 class="saree-card-title">${product.name}</h3>
      <div class="saree-card-bottom">
        <span class="saree-card-price">${formattedPrice}</span>
        <div class="saree-card-actions">
          <button class="saree-card-view-btn" data-id="${product.id}">View</button>
          <button class="saree-card-btn" aria-label="Add to cart" data-id="${product.id}">
            <i class="material-icons-round" style="font-size: 18px;">shopping_cart</i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Clicking anywhere on card opens detail page (except add-to-cart button)
  card.addEventListener("click", () => {
    navigateTo("detail", { productId: product.id });
  });
  
  card.querySelector(".saree-card-view-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    navigateTo("detail", { productId: product.id });
  });
  
  card.querySelector(".saree-card-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!product.inStock || product.stockCount <= 0) {
      showToast(`Out of Stock: ${product.name}`);
      return;
    }
    addToCart(product.id, 1);
    showToast(`Added: ${product.name}`);
  });
  
  return card;
}

/* ==========================================================================
   SHOP VIEW
   ========================================================================== */
function initShopView() {
  // Category tabs filtering (quick filters)
  const tabs = document.querySelectorAll("#shop-category-tabs .filter-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilterCategory = tab.getAttribute("data-category");
      
      // Update badge count
      updateFilterBadgeCount();
      renderShopProducts();
    });
  });
  
  // Sort selector
  document.getElementById("shop-sort-select").addEventListener("change", (e) => {
    sortOrder = e.target.value;
    renderShopProducts();
  });
  
  // Home Search input - navigate to shop with search query
  const homeSearchInput = document.getElementById("home-search-input");
  if (homeSearchInput) {
    homeSearchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
    });
    
    homeSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQuery = e.target.value.toLowerCase().trim();
        showView("view-shop");
        renderShopProducts();
      }
    });
  }
  
  // Search input
  document.getElementById("shop-search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderShopProducts();
  });

  // Filter Toggle Drawer Button
  const filterToggleBtn = document.getElementById("filter-toggle-btn");
  const filterDrawer = document.getElementById("modal-filter-drawer");
  const drawerClose = document.getElementById("drawer-close");
  const drawerClear = document.getElementById("drawer-clear-btn");
  const drawerApply = document.getElementById("drawer-apply-btn");
  
  let tempCategory = "All";
  let tempPriceRange = "all";
  let tempColor = "all";
  
  filterToggleBtn.addEventListener("click", () => {
    tempCategory = currentFilterCategory;
    tempPriceRange = currentFilterPriceRange;
    tempColor = currentFilterColor;
    
    syncDrawerUI(tempCategory, tempPriceRange, tempColor);
    filterDrawer.classList.add("active");
  });
  
  drawerClose.addEventListener("click", () => {
    filterDrawer.classList.remove("active");
  });
  
  filterDrawer.addEventListener("click", (e) => {
    if (e.target === filterDrawer) {
      filterDrawer.classList.remove("active");
    }
  });

  // Fabric selection in drawer
  document.querySelectorAll("#drawer-filter-fabric .drawer-tag").forEach(tag => {
    tag.addEventListener("click", () => {
      document.querySelectorAll("#drawer-filter-fabric .drawer-tag").forEach(t => t.classList.remove("active"));
      tag.classList.add("active");
      tempCategory = tag.getAttribute("data-value");
      updateDrawerApplyButtonCount(tempCategory, tempPriceRange, tempColor);
    });
  });
  
  // Price range selection in drawer
  document.querySelectorAll("#drawer-filter-price .drawer-tag").forEach(tag => {
    tag.addEventListener("click", () => {
      document.querySelectorAll("#drawer-filter-price .drawer-tag").forEach(t => t.classList.remove("active"));
      tag.classList.add("active");
      tempPriceRange = tag.getAttribute("data-value");
      updateDrawerApplyButtonCount(tempCategory, tempPriceRange, tempColor);
    });
  });
  
  // Color selection in drawer
  document.querySelectorAll("#drawer-filter-color .drawer-color-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#drawer-filter-color .drawer-color-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      tempColor = pill.getAttribute("data-value");
      updateDrawerApplyButtonCount(tempCategory, tempPriceRange, tempColor);
    });
  });
  
  // Clear drawer filters
  drawerClear.addEventListener("click", () => {
    tempCategory = "All";
    tempPriceRange = "all";
    tempColor = "all";
    syncDrawerUI(tempCategory, tempPriceRange, tempColor);
  });
  
  // Apply drawer filters
  drawerApply.addEventListener("click", () => {
    currentFilterCategory = tempCategory;
    currentFilterPriceRange = tempPriceRange;
    currentFilterColor = tempColor;
    
    // Sync quick category tabs
    const scrollTabs = document.querySelectorAll("#shop-category-tabs .filter-tab");
    scrollTabs.forEach(t => {
      if (t.getAttribute("data-category") === currentFilterCategory) {
        t.classList.add("active");
      } else {
        t.classList.remove("active");
      }
    });
    
    updateFilterBadgeCount();
    renderShopProducts();
    filterDrawer.classList.remove("active");
  });
}

function renderShopProducts() {
  const products = getProducts();
  const grid = document.getElementById("shop-products-grid");
  grid.innerHTML = "";
  
  // Apply Category Filter
  let filtered = products;
  if (currentFilterCategory !== "All") {
    filtered = filtered.filter(p => p.category === currentFilterCategory);
  }
  
  // Apply Price Filter
  if (currentFilterPriceRange !== "all") {
    filtered = filtered.filter(p => {
      if (currentFilterPriceRange === "under-10k") return p.price < 10000;
      if (currentFilterPriceRange === "10k-15k") return p.price >= 10000 && p.price <= 15000;
      if (currentFilterPriceRange === "15k-20k") return p.price >= 15000 && p.price <= 20000;
      if (currentFilterPriceRange === "over-20k") return p.price > 20000;
      return true;
    });
  }
  
  // Apply Color Filter
  if (currentFilterColor !== "all") {
    filtered = filtered.filter(p => {
      const pColor = (p.specs && p.specs.color) ? p.specs.color.toLowerCase() : "";
      return pColor.includes(currentFilterColor) || p.name.toLowerCase().includes(currentFilterColor);
    });
  }
  
  // Apply Search Filter
  if (searchQuery !== "") {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      (p.specs && p.specs.color.toLowerCase().includes(searchQuery))
    );
  }
  
  // Apply Sorting
  if (sortOrder === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortOrder === "newest" || sortOrder === "default") {
    filtered.sort((a, b) => {
      const getVal = (p) => {
        if (p.id.startsWith("prod-") && p.id.length > 10) {
          const ts = parseInt(p.id.split("-")[1]);
          if (!isNaN(ts)) return ts;
        }
        const num = parseInt(p.id.split("-")[1]);
        if (!isNaN(num)) return num;
        return 0;
      };
      return getVal(b) - getVal(a);
    });
  }
  
  // Check empty state
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--color-text-muted);">
        <i class="material-icons-round" style="font-size: 40px; margin-bottom: 10px; opacity: 0.5;">search_off</i>
        <p>No sarees found matching your criteria.</p>
      </div>
    `;
    return;
  }
  
  // Render cards
  filtered.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

function updateFilterBadgeCount() {
  const badge = document.getElementById("filter-badge-count");
  let count = 0;
  if (currentFilterCategory !== "All") count++;
  if (currentFilterPriceRange !== "all") count++;
  if (currentFilterColor !== "all") count++;
  
  if (count > 0) {
    badge.innerText = count;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

function syncDrawerUI(cat, price, col) {
  // Fabric tags
  document.querySelectorAll("#drawer-filter-fabric .drawer-tag").forEach(tag => {
    if (tag.getAttribute("data-value") === cat) {
      tag.classList.add("active");
    } else {
      tag.classList.remove("active");
    }
  });
  
  // Price tags
  document.querySelectorAll("#drawer-filter-price .drawer-tag").forEach(tag => {
    if (tag.getAttribute("data-value") === price) {
      tag.classList.add("active");
    } else {
      tag.classList.remove("active");
    }
  });
  
  // Color pills
  document.querySelectorAll("#drawer-filter-color .drawer-color-pill").forEach(pill => {
    if (pill.getAttribute("data-value") === col) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });
  
  // Update result count dynamically in Apply button
  updateDrawerApplyButtonCount(cat, price, col);
}

function updateDrawerApplyButtonCount(cat, price, col) {
  const products = getProducts();
  let count = 0;
  
  products.forEach(p => {
    const matchesCat = cat === "All" || p.category === cat;
    
    let matchesPrice = true;
    if (price === "under-10k") {
      matchesPrice = p.price < 10000;
    } else if (price === "10k-15k") {
      matchesPrice = p.price >= 10000 && p.price <= 15000;
    } else if (price === "15k-20k") {
      matchesPrice = p.price >= 15000 && p.price <= 20000;
    } else if (price === "over-20k") {
      matchesPrice = p.price > 20000;
    }
    
    let matchesColor = true;
    if (col !== "all") {
      const pColor = (p.specs && p.specs.color) ? p.specs.color.toLowerCase() : "";
      matchesColor = pColor.includes(col) || p.name.toLowerCase().includes(col);
    }
    
    if (matchesCat && matchesPrice && matchesColor) {
      count++;
    }
  });
  
  document.getElementById("drawer-apply-btn").innerText = `Apply Filters (${count} Items)`;
}

/* ==========================================================================
   PRODUCT DETAIL VIEW
   ========================================================================== */
function initDetailView() {
  const backBtn = document.getElementById("detail-back-btn");
  backBtn.addEventListener("click", () => {
    navigateTo(previousView);
  });
  
  // Quantity buttons
  document.getElementById("detail-qty-minus").addEventListener("click", () => {
    if (selectedProductQty > 1) {
      selectedProductQty--;
      document.getElementById("detail-qty-input").value = selectedProductQty;
    }
  });
  
  document.getElementById("detail-qty-plus").addEventListener("click", () => {
    const productId = document.getElementById("detail-add-to-cart-btn").getAttribute("data-product-id");
    const product = getProductById(productId);
    if (product) {
      const cartItem = cart.find(item => item.productId === productId);
      const currentCartQty = cartItem ? cartItem.quantity : 0;
      if (selectedProductQty + currentCartQty < product.stockCount) {
        selectedProductQty++;
        document.getElementById("detail-qty-input").value = selectedProductQty;
      } else {
        showToast(`Stock limit reached (${product.stockCount} max)`);
      }
    }
  });
  
  // Add to cart action
  document.getElementById("detail-add-to-cart-btn").addEventListener("click", () => {
    const productId = document.getElementById("detail-add-to-cart-btn").getAttribute("data-product-id");
    const product = getProductById(productId);
    if (product) {
      const cartItem = cart.find(item => item.productId === productId);
      const currentCartQty = cartItem ? cartItem.quantity : 0;
      
      if (currentCartQty + selectedProductQty > product.stockCount) {
        showToast(`Cannot add. Exceeds available stock (${product.stockCount} max)`);
        return;
      }
      
      addToCart(productId, selectedProductQty);
      showToast("Added to cart");
      
      // Reset details qty selector
      selectedProductQty = 1;
      document.getElementById("detail-qty-input").value = selectedProductQty;
    }
  });

  // Specs/Care Tab switching
  const tabs = document.querySelectorAll(".tabs-header .tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const paneId = tab.getAttribute("data-tab");
      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      document.getElementById(paneId).classList.add("active");
    });
  });
}

function setupProductDetail(productId) {
  const product = getProductById(productId);
  if (!product) {
    navigateTo("shop");
    return;
  }
  
  selectedProductQty = 1;
  document.getElementById("detail-qty-input").value = selectedProductQty;
  document.getElementById("detail-add-to-cart-btn").setAttribute("data-product-id", product.id);
  
  // Fill details with animation class toggle for image fade-in
  const mainImg = document.getElementById("detail-product-image");
  mainImg.classList.remove("loaded");
  mainImg.src = product.image || PLACEHOLDER_SVG;
  mainImg.onerror = function() {
    this.onerror = null;
    this.src = PLACEHOLDER_SVG;
  };
  mainImg.alt = product.name;
  setTimeout(() => mainImg.classList.add("loaded"), 50);

  document.getElementById("detail-product-category").innerText = product.category;
  document.getElementById("detail-product-title").innerText = product.name;
  document.getElementById("detail-product-desc").innerText = product.description;
  
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(product.price);
  document.getElementById("detail-product-price").innerText = formattedPrice;
  
  // Stock Status Indicator
  const stockIndicator = document.getElementById("detail-product-stock");
  const addBtn = document.getElementById("detail-add-to-cart-btn");
  
  stockIndicator.className = "stock-indicator";
  if (!product.inStock || product.stockCount <= 0) {
    stockIndicator.classList.add("out-of-stock");
    stockIndicator.querySelector("span").innerText = "Out of Stock";
    addBtn.disabled = true;
    addBtn.querySelector("span").innerText = "Sold Out";
  } else if (product.stockCount <= 2) {
    stockIndicator.classList.add("low-stock");
    stockIndicator.querySelector("span").innerText = `Only ${product.stockCount} Left!`;
    addBtn.disabled = false;
    addBtn.querySelector("span").innerText = "Add to Cart";
  } else {
    stockIndicator.classList.add("in-stock");
    stockIndicator.querySelector("span").innerText = "In Stock";
    addBtn.disabled = false;
    addBtn.querySelector("span").innerText = "Add to Cart";
  }
  
  // Specifications
  document.getElementById("spec-fabric").innerText = product.specs.fabric || "Pure Handloom Silk";
  document.getElementById("spec-color").innerText = product.specs.color || "Traditional Shade";
  document.getElementById("spec-occasion").innerText = product.specs.occasion || "Wedding & Festive";
  document.getElementById("spec-zari").innerText = product.specs.zari || "Genuine Threads";
  document.getElementById("spec-blouse").innerText = product.specs.blouse || "Yes";
  document.getElementById("spec-length").innerText = product.specs.length || "5.5 Meters";

  // Render Image Gallery Thumbnails
  const thumbContainer = document.getElementById("detail-thumbnails");
  thumbContainer.innerHTML = "";
  const productImages = product.images || [product.image];
  
  if (productImages.length > 1) {
    productImages.forEach((imgSrc, idx) => {
      const img = document.createElement("img");
      img.src = imgSrc || PLACEHOLDER_SVG;
      img.onerror = function() {
        this.onerror = null;
        this.src = PLACEHOLDER_SVG;
      };
      img.alt = `${product.name} View ${idx + 1}`;
      img.className = "thumbnail-img" + (idx === 0 ? " active" : "");
      
      img.addEventListener("click", () => {
        document.querySelectorAll(".thumbnail-img").forEach(el => el.classList.remove("active"));
        img.classList.add("active");
        
        mainImg.classList.remove("loaded");
        mainImg.src = imgSrc || PLACEHOLDER_SVG;
        mainImg.onerror = function() {
          this.onerror = null;
          this.src = PLACEHOLDER_SVG;
        };
        setTimeout(() => mainImg.classList.add("loaded"), 50);
      });
      thumbContainer.appendChild(img);
    });
    thumbContainer.style.display = "flex";
  } else {
    thumbContainer.style.display = "none";
  }

  // Render similar products grid ("You May Also Like")
  const allProducts = getProducts();
  let similarProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  
  if (similarProducts.length < 3) {
    const fallbackProducts = allProducts.filter(p => p.id !== product.id && !similarProducts.some(sp => sp.id === p.id)).slice(0, 4 - similarProducts.length);
    similarProducts.push(...fallbackProducts);
  }
  
  const similarGrid = document.getElementById("detail-similar-grid");
  similarGrid.innerHTML = "";
  
  similarProducts.forEach(sp => {
    const card = createProductCard(sp);
    similarGrid.appendChild(card);
  });
}

/* ==========================================================================
   CART OPERATIONS & VIEW
   ========================================================================== */
function initCartView() {
  document.getElementById("cart-shop-now-btn").addEventListener("click", () => {
    navigateTo("shop");
  });
  
  const checkoutBtnSticky = document.getElementById("cart-checkout-btn-sticky");
  if (checkoutBtnSticky) {
    checkoutBtnSticky.addEventListener("click", () => {
      navigateTo("checkout");
    });
  }
}

function addToCart(productId, qty) {
  const index = cart.findIndex(item => item.productId === productId);
  if (index !== -1) {
    cart[index].quantity += qty;
  } else {
    cart.push({ productId, quantity: qty });
  }
  saveCart();
}

function changeCartQty(productId, delta) {
  const index = cart.findIndex(item => item.productId === productId);
  if (index !== -1) {
    const newQty = cart[index].quantity + delta;
    if (newQty < 1) {
      return; // Do not allow quantity below 1
    }
    const product = getProductById(productId);
    if (product && newQty > product.stockCount) {
      showToast(`Stock limit reached (${product.stockCount} max)`);
      return;
    }
    cart[index].quantity = newQty;
    saveCart();
    renderCart();
  }
}

function removeCartItem(productId) {
  cart = cart.filter(item => item.productId !== productId);
  saveCart();
  renderCart();
  showToast("Item removed from basket");
}

function renderCart() {
  const emptyView = document.getElementById("cart-empty-view");
  const contentView = document.getElementById("cart-content-view");
  const itemsContainer = document.getElementById("cart-items-container");
  const stickyBar = document.getElementById("cart-sticky-bar");
  
  if (cart.length === 0) {
    emptyView.style.display = "flex";
    contentView.style.display = "none";
    if (stickyBar) stickyBar.style.display = "none";
    return;
  }
  
  emptyView.style.display = "none";
  contentView.style.display = "block";
  if (stickyBar) stickyBar.style.display = "block";
  itemsContainer.innerHTML = "";
  
  let subtotal = 0;
  
  cart.forEach(item => {
    const product = getProductById(item.productId);
    if (!product) return;
    
    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;
    
    const formattedPrice = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(product.price);
    
    const formattedItemTotal = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(itemTotal);
    
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${product.image || PLACEHOLDER_SVG}" class="cart-item-img" alt="${product.name}" onerror="this.onerror=null; this.src=PLACEHOLDER_SVG;">
      <div class="cart-item-details">
        <div>
          <span class="cart-item-category">${product.category}</span>
          <h4 class="cart-item-name">${product.name}</h4>
        </div>
        <div class="cart-item-price-row">
          <div style="display: flex; flex-direction: column;">
            <span class="cart-item-price">${formattedItemTotal}</span>
            <span style="font-size: 0.7rem; color: var(--color-text-muted);">₹${product.price.toLocaleString('en-IN')} each</span>
          </div>
          
          <div class="qty-selector" style="transform: scale(0.9); transform-origin: right center;">
            <button class="qty-btn dec-btn">−</button>
            <span class="qty-input" style="line-height: 32px; display: inline-block;">${item.quantity}</span>
            <button class="qty-btn inc-btn">+</button>
          </div>
        </div>
      </div>
      <button class="cart-item-remove" aria-label="Remove item"><i class="material-icons-round">delete_outline</i></button>
    `;
    
    // Wire up events
    row.querySelector(".dec-btn").addEventListener("click", () => changeCartQty(product.id, -1));
    row.querySelector(".inc-btn").addEventListener("click", () => changeCartQty(product.id, 1));
    row.querySelector(".cart-item-remove").addEventListener("click", () => removeCartItem(product.id));
    row.querySelector(".cart-item-img").addEventListener("click", () => navigateTo("detail", { productId: product.id }));
    
    itemsContainer.appendChild(row);
  });
  
  // Calculate Taxes & Totals (Grand Total = Subtotal for simplicity)
  const grandTotal = subtotal;
  
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
  
  document.getElementById("cart-summary-subtotal").innerText = formatter.format(subtotal);
  document.getElementById("cart-summary-total").innerText = formatter.format(grandTotal);
  
  // Render order tracking
  renderOrderTracking();
}

/* ==========================================================================
   ORDER TRACKING
   ========================================================================== */
function renderOrderTracking() {
  const trackingSection = document.getElementById("order-tracking-section");
  const trackingList = document.getElementById("order-tracking-list");
  
  const orders = loadOrdersFromStorage();
  
  if (!orders || orders.length === 0) {
    trackingSection.style.display = "none";
    return;
  }
  
  trackingSection.style.display = "block";
  trackingList.innerHTML = "";
  
  // Show last 3 orders
  orders.slice(-3).reverse().forEach(order => {
    const orderDate = new Date(order.date).toLocaleDateString('en-IN');
    const statusClass = order.status || 'pending';
    
    const item = document.createElement("div");
    item.className = "order-tracking-item";
    item.innerHTML = `
      <div class="order-tracking-left">
        <div class="order-id-small">Order #${order.id}</div>
        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px;">${orderDate}</div>
        <div class="order-status-badge ${statusClass}">${order.status || 'Pending'}</div>
      </div>
      <div class="order-tracking-arrow"><i class="material-icons-round">arrow_forward_ios</i></div>
    `;
    
    item.addEventListener("click", () => openOrderDetailsModal(order));
    trackingList.appendChild(item);
  });
}

function openOrderDetailsModal(order) {
  let modal = document.getElementById("order-details-modal");
  
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "order-details-modal";
    modal.className = "order-details-modal";
    document.body.appendChild(modal);
  }
  
  const statusClass = order.status || 'pending';
  const orderDate = new Date(order.date).toLocaleDateString('en-IN');
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
  
  let itemsList = "";
  if (order.items && order.items.length > 0) {
    itemsList = order.items.map(item => `
      <div class="order-detail-item">
        <div class="order-detail-label">${item.name} (Qty: ${item.quantity})</div>
        <div class="order-detail-value">${formatter.format(item.price * item.quantity)}</div>
      </div>
    `).join("");
  }
  
  // Determine timeline status
  let timelineSteps = "";
  const steps = [
    { label: "Order Placed", status: "completed" },
    { label: "Processing", status: statusClass === "pending" ? "active" : "completed" },
    { label: "Shipped", status: statusClass === "shipped" ? "active" : (statusClass === "delivered" ? "completed" : "pending") },
    { label: "Delivered", status: statusClass === "delivered" ? "active" : "pending" }
  ];
  
  timelineSteps = steps.map(step => `
    <div class="timeline-step ${step.status}">
      <div class="timeline-dot"></div>
      <div class="timeline-text ${step.status}">${step.label}</div>
    </div>
  `).join("");
  
  modal.innerHTML = `
    <div class="order-details-content">
      <div class="order-details-header">
        <h2 class="order-details-title">Order #${order.id}</h2>
        <button class="order-details-close">&times;</button>
      </div>
      
      <div class="order-detail-item">
        <div class="order-detail-label">Status</div>
        <div class="order-detail-value" style="text-transform: uppercase; font-weight: 700; color: var(--color-maroon);">${order.status || 'Pending'}</div>
      </div>
      
      <div class="order-detail-item">
        <div class="order-detail-label">Order Date</div>
        <div class="order-detail-value">${orderDate}</div>
      </div>
      
      <div class="order-status-timeline">
        <h4>📍 Order Progress</h4>
        ${timelineSteps}
      </div>
      
      <div class="order-detail-item">
        <div class="order-detail-label">Shipping Address</div>
        <div class="order-detail-value">
          ${order.customer.name}<br>
          ${order.customer.address}<br>
          ${order.customer.city}, ${order.customer.state} ${order.customer.pincode}
        </div>
      </div>
      
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--color-gold);">
        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--color-maroon); margin-bottom: 10px; text-transform: uppercase;">Items</h4>
        ${itemsList}
      </div>
      
      <div class="order-detail-item" style="border-top: 2px solid var(--color-gold); margin-top: 15px; padding-top: 15px;">
        <div class="order-detail-label" style="font-weight: 700; font-size: 0.9rem;">Order Total</div>
        <div class="order-detail-value" style="font-weight: 700; font-size: 1rem; color: var(--color-maroon);">${formatter.format(order.total)}</div>
      </div>
    </div>
  `;
  
  modal.classList.add("active");
  
  modal.querySelector(".order-details-close").addEventListener("click", () => {
    modal.classList.remove("active");
  });
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
}

function loadOrdersFromStorage() {
  try {
    const stored = localStorage.getItem("svarnam_orders");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error loading orders:", e);
    return [];
  }
}

/* ==========================================================================
   CHECKOUT FLOW
   ========================================================================== */
function validateCheckoutForm() {
  let isValid = true;
  
  const nameInput = document.getElementById("checkout-name");
  const phoneInput = document.getElementById("checkout-phone");
  const addressInput = document.getElementById("checkout-address");
  const cityInput = document.getElementById("checkout-city");
  const stateInput = document.getElementById("checkout-state");
  const pincodeInput = document.getElementById("checkout-pincode");
  
  const setError = (input, msg) => {
    const errorEl = document.getElementById(`error-${input.id}`);
    if (msg) {
      input.classList.add("is-invalid");
      if (errorEl) {
        errorEl.innerText = msg;
        errorEl.style.display = "block";
      }
      isValid = false;
    } else {
      input.classList.remove("is-invalid");
      if (errorEl) {
        errorEl.innerText = "";
        errorEl.style.display = "none";
      }
    }
  };
  
  // Name validation
  if (!nameInput.value.trim()) {
    setError(nameInput, "Full Name is required");
  } else {
    setError(nameInput, "");
  }
  
  // Phone validation (exactly 10 digits)
  const phoneVal = phoneInput.value.trim().replace(/\D/g, "");
  if (!phoneInput.value.trim()) {
    setError(phoneInput, "Mobile Number is required");
  } else if (phoneVal.length !== 10) {
    setError(phoneInput, "Phone number must be exactly 10 digits");
  } else {
    setError(phoneInput, "");
  }
  
  // Address validation
  if (!addressInput.value.trim()) {
    setError(addressInput, "Delivery Address is required");
  } else {
    setError(addressInput, "");
  }
  
  // City validation
  if (!cityInput.value.trim()) {
    setError(cityInput, "City is required");
  } else {
    setError(cityInput, "");
  }
  
  // State validation
  if (!stateInput.value.trim()) {
    setError(stateInput, "State is required");
  } else {
    setError(stateInput, "");
  }
  
  // Pincode validation (exactly 6 digits)
  const pinVal = pincodeInput.value.trim().replace(/\D/g, "");
  if (!pincodeInput.value.trim()) {
    setError(pincodeInput, "Pincode is required");
  } else if (pinVal.length !== 6) {
    setError(pincodeInput, "Pincode must be exactly 6 digits");
  } else {
    setError(pincodeInput, "");
  }
  
  return isValid;
}

function initCheckoutView() {
  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateCheckoutForm()) {
      submitOrder();
    }
  });
  
  // Clear errors on input
  const inputs = [
    document.getElementById("checkout-name"),
    document.getElementById("checkout-phone"),
    document.getElementById("checkout-address"),
    document.getElementById("checkout-city"),
    document.getElementById("checkout-state"),
    document.getElementById("checkout-pincode")
  ];
  
  inputs.forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        const errorEl = document.getElementById(`error-${input.id}`);
        input.classList.remove("is-invalid");
        if (errorEl) {
          errorEl.innerText = "";
          errorEl.style.display = "none";
        }
      });
    }
  });
}

function setupCheckout() {
  if (cart.length === 0) {
    navigateTo("cart");
    return;
  }
  
  const itemsSummaryContainer = document.getElementById("checkout-items-summary");
  if (itemsSummaryContainer) {
    itemsSummaryContainer.innerHTML = "";
  }
  
  // Calculate Totals
  let subtotal = 0;
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
  
  cart.forEach(item => {
    const product = getProductById(item.productId);
    if (product) {
      const cost = product.price * item.quantity;
      subtotal += cost;
      
      if (itemsSummaryContainer) {
        const itemRow = document.createElement("div");
        itemRow.style.display = "flex";
        itemRow.style.justifyContent = "space-between";
        itemRow.style.marginBottom = "6px";
        itemRow.innerHTML = `
          <span>${product.name} <strong>x${item.quantity}</strong></span>
          <span style="font-weight: 600;">${formatter.format(cost)}</span>
        `;
        itemsSummaryContainer.appendChild(itemRow);
      }
    }
  });
  
  const grandTotal = subtotal;
  document.getElementById("checkout-grand-total").innerText = formatter.format(grandTotal);
}

function submitOrder() {
  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  const city = document.getElementById("checkout-city").value.trim();
  const state = document.getElementById("checkout-state").value.trim();
  const pincode = document.getElementById("checkout-pincode").value.trim();
  
  // Calculate Totals for order entry
  let subtotal = 0;
  const itemsSummaryList = [];
  
  cart.forEach(item => {
    const product = getProductById(item.productId);
    if (product) {
      const cost = product.price * item.quantity;
      subtotal += cost;
      itemsSummaryList.push({
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: item.quantity,
        price: product.price
      });
      
      // Update DB Stock Count (decrement stock)
      const updatedProduct = { ...product };
      updatedProduct.stockCount = Math.max(0, product.stockCount - item.quantity);
      if (updatedProduct.stockCount === 0) {
        updatedProduct.inStock = false;
      }
      updateProduct(updatedProduct);
    }
  });
  
  const grandTotal = subtotal;
  
  const orderId = `SV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderDate = new Date().toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' });
  
  const order = {
    id: orderId,
    date: orderDate,
    customer: { name, phone, address, city, state, pincode },
    items: itemsSummaryList,
    total: grandTotal,
    status: "pending" // pending, shipped, delivered, cancelled
  };
  
  // Add to database
  orders.unshift(order); // Add to beginning (newest first)
  saveOrders();
  
  // Reset cart
  cart = [];
  saveCart();
  
  // Reset form
  document.getElementById("checkout-form").reset();
  
  // Navigate to confirmation page
  navigateTo("confirmation", { order: order });
}

/* ==========================================================================
   ORDER CONFIRMATION VIEW
   ========================================================================== */
function setupConfirmation(order) {
  if (!order) {
    navigateTo("home");
    return;
  }
  
  document.getElementById("confirm-order-id").innerText = order.id;
  document.getElementById("confirm-customer-phone").innerText = order.customer.phone;
  
  const listContainer = document.getElementById("confirm-items-summary");
  listContainer.innerHTML = "";
  
  order.items.forEach(item => {
    const p = document.createElement("div");
    p.className = "order-item-line";
    p.innerHTML = `
      <span>${item.name} <strong>x${item.quantity}</strong></span>
      <span>₹${(item.price * item.quantity).toLocaleString("en-IN")}</span>
    `;
    listContainer.appendChild(p);
  });
  
  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(order.total);
  
  document.getElementById("confirm-total-amount").innerText = formattedTotal;
  
  // Setup continue button
  document.getElementById("confirm-continue-shopping-btn").onclick = () => {
    navigateTo("home");
  };
}

/* ==========================================================================
   MERCHANT ADMIN DASHBOARD
   ========================================================================== */
function initAdminView() {
  // Tab buttons switching
  const tabs = document.querySelectorAll(".admin-nav-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const paneId = tab.getAttribute("data-tab");
      document.querySelectorAll(".admin-tab-content").forEach(pane => {
        pane.classList.remove("active");
      });
      document.getElementById(paneId).classList.add("active");
    });
  });
  
  // Add product button modal opener
  document.getElementById("admin-add-product-btn").addEventListener("click", () => {
    openAdminProductModal();
  });
  
  // Modal closers
  document.getElementById("modal-product-close").addEventListener("click", closeAdminProductModal);
  document.getElementById("modal-product-cancel").addEventListener("click", closeAdminProductModal);
  
  // Image upload handling for mobile admin
  const imageUploadArea = document.getElementById("image-upload-area");
  const imageInput = document.getElementById("admin-prod-images");
  
  if (imageUploadArea && imageInput) {
    imageUploadArea.addEventListener("click", () => imageInput.click());
    
    imageUploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      imageUploadArea.style.background = "#FFE9E9";
    });
    
    imageUploadArea.addEventListener("dragleave", () => {
      imageUploadArea.style.background = "#F5F5F5";
    });
    
    imageUploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      imageUploadArea.style.background = "#F5F5F5";
      handleAdminImageFiles(e.dataTransfer.files);
    });
    
    imageInput.addEventListener("change", (e) => {
      handleAdminImageFiles(e.target.files);
    });
  }
  
  // AI Write Description button
  const aiWriteBtn = document.getElementById("admin-ai-write-btn");
  if (aiWriteBtn) {
    aiWriteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      generateAdminAIDescription();
    });
  }
  
  // Modal Submit
  document.getElementById("admin-product-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitAdminProductForm();
  });
}

// Handle image file uploads with preview
function handleImageFiles(files) {
  const gallery = document.getElementById("image-gallery-preview");
  const urlsInput = document.getElementById("prod-images-urls");
  
  let uploadedImages = urlsInput.value ? urlsInput.value.split('\n').filter(u => u.trim()) : [];
  
  Array.from(files).forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        uploadedImages.push(dataUrl);
        urlsInput.value = uploadedImages.join('\n');
        
        // Add preview thumbnail
        const thumb = document.createElement('div');
        thumb.style.position = 'relative';
        thumb.style.width = '80px';
        thumb.style.height = '80px';
        thumb.innerHTML = `
          <img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 2px solid var(--color-maroon);">
          <button type="button" style="position: absolute; top: -8px; right: -8px; background: var(--color-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">×</button>
        `;
        
        thumb.querySelector('button').addEventListener('click', (e) => {
          e.preventDefault();
          uploadedImages.splice(uploadedImages.indexOf(dataUrl), 1);
          urlsInput.value = uploadedImages.join('\n');
          thumb.remove();
        });
        
        gallery.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    }
  });
}

// Generate AI Description
function generateAIDescription() {
  const name = document.getElementById("admin-prod-name").value;
  const category = document.getElementById("admin-prod-category").value;
  const color = document.getElementById("admin-spec-color").value;
  const fabric = document.getElementById("admin-spec-fabric").value;
  const zari = document.getElementById("admin-spec-zari").value;
  const occasion = document.getElementById("admin-spec-occasion").value;
  const descTextarea = document.getElementById("admin-prod-desc");
  
  if (!color) {
    showToast("Please fill in the Color Shade first");
    return;
  }
  
  if (window.AIDescriptionGenerator) {
    const aiDescription = window.AIDescriptionGenerator.generate(name, category, color, fabric, zari, occasion);
    descTextarea.value = aiDescription;
    showToast("✨ AI-generated description created!");
  } else {
    showToast("AI generator not loaded. Please refresh the page.");
  }
}

// Handle image file uploads with preview (Mobile Admin)
function handleAdminImageFiles(files) {
  const gallery = document.getElementById("image-gallery-preview");
  const urlsInput = document.getElementById("admin-prod-images-urls");
  
  let uploadedImages = urlsInput.value ? urlsInput.value.split('\n').filter(u => u.trim()) : [];
  
  Array.from(files).forEach((file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        uploadedImages.push(dataUrl);
        urlsInput.value = uploadedImages.join('\n');
        
        // Add preview thumbnail
        const thumb = document.createElement('div');
        thumb.style.position = 'relative';
        thumb.style.width = '80px';
        thumb.style.height = '80px';
        thumb.innerHTML = `
          <img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 2px solid var(--color-maroon);">
          <button type="button" style="position: absolute; top: -8px; right: -8px; background: var(--color-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">×</button>
        `;
        
        thumb.querySelector('button').addEventListener('click', (e) => {
          e.preventDefault();
          uploadedImages.splice(uploadedImages.indexOf(dataUrl), 1);
          urlsInput.value = uploadedImages.join('\n');
          thumb.remove();
        });
        
        gallery.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    }
  });
}

// Generate AI Description (Mobile Admin)
function generateAdminAIDescription() {
  const name = document.getElementById("admin-prod-name").value;
  const category = document.getElementById("admin-prod-category").value;
  const color = document.getElementById("admin-spec-color").value;
  const fabric = document.getElementById("admin-spec-fabric").value;
  const zari = document.getElementById("admin-spec-zari").value;
  const occasion = document.getElementById("admin-spec-occasion").value;
  const descTextarea = document.getElementById("admin-prod-desc");
  
  if (!color) {
    showToast("Please fill in the Color Combination first");
    return;
  }
  
  if (window.AIDescriptionGenerator) {
    const aiDescription = window.AIDescriptionGenerator.generate(name, category, color, fabric, zari, occasion);
    descTextarea.value = aiDescription;
    showToast("✨ AI-generated description created!");
  } else {
    showToast("AI generator not loaded. Please refresh the page.");
  }
}

function renderAdminProducts() {
  const products = getProducts();
  const list = document.getElementById("admin-products-list");
  list.innerHTML = "";
  
  products.forEach(product => {
    const priceText = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(product.price);
    
    const card = document.createElement("div");
    card.className = "admin-item-card";
    card.innerHTML = `
      <img src="${product.image}" class="admin-item-img" alt="">
      <div class="admin-item-details">
        <h4 class="admin-item-name">${product.name}</h4>
        <div class="admin-item-price">${priceText}</div>
        <div class="admin-item-stock">Weave: ${product.category} | Stock: ${product.stockCount} pcs</div>
      </div>
      <div class="admin-item-actions">
        <button class="admin-action-icon edit" aria-label="Edit product"><i class="material-icons-round">edit</i></button>
        <button class="admin-action-icon delete" aria-label="Delete product"><i class="material-icons-round">delete</i></button>
      </div>
    `;
    
    // Events
    card.querySelector(".edit").addEventListener("click", () => openAdminProductModal(product));
    card.querySelector(".delete").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
        deleteProduct(product.id);
        renderAdminProducts();
        showToast("Product deleted successfully");
        renderFeaturedProducts(); // refresh home if active
      }
    });
    
    list.appendChild(card);
  });
}

function openAdminProductModal(product = null) {
  const modal = document.getElementById("modal-admin-product");
  const form = document.getElementById("admin-product-form");
  const modalTitle = document.getElementById("modal-product-title");
  const gallery = document.getElementById("image-gallery-preview");
  const imagesUrls = document.getElementById("admin-prod-images-urls");
  
  // Clear form and gallery
  form.reset();
  gallery.innerHTML = "";
  imagesUrls.value = "";
  modal.classList.add("active");
  
  if (product) {
    modalTitle.innerText = "Edit Saree Details";
    document.getElementById("admin-form-product-id").value = product.id;
    document.getElementById("admin-prod-name").value = product.name;
    document.getElementById("admin-prod-category").value = product.category;
    document.getElementById("admin-prod-price").value = product.price;
    document.getElementById("admin-prod-desc").value = product.description;
    document.getElementById("admin-prod-stock").value = product.stockCount;
    
    // Populate images
    const productImages = product.images || [product.image];
    imagesUrls.value = productImages.join('\n');
    
    // Show image gallery previews
    productImages.forEach((imgUrl) => {
      if (imgUrl) {
        const thumb = document.createElement('div');
        thumb.style.position = 'relative';
        thumb.style.width = '80px';
        thumb.style.height = '80px';
        thumb.innerHTML = `
          <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 2px solid var(--color-maroon);" onerror="this.src='${PLACEHOLDER_SVG}';">
          <button type="button" style="position: absolute; top: -8px; right: -8px; background: var(--color-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">×</button>
        `;
        
        thumb.querySelector('button').addEventListener('click', (e) => {
          e.preventDefault();
          let urls = imagesUrls.value.split('\n').filter(u => u.trim());
          urls = urls.filter(u => u !== imgUrl);
          imagesUrls.value = urls.join('\n');
          thumb.remove();
        });
        
        gallery.appendChild(thumb);
      }
    });
    
    if (product.specs) {
      document.getElementById("admin-spec-fabric").value = product.specs.fabric || "";
      document.getElementById("admin-spec-color").value = product.specs.color || "";
      document.getElementById("admin-spec-occasion").value = product.specs.occasion || "";
      document.getElementById("admin-spec-zari").value = product.specs.zari || "";
      document.getElementById("admin-spec-blouse").value = product.specs.blouse || "";
    }
  } else {
    modalTitle.innerText = "Add New Saree to Catalog";
    document.getElementById("admin-form-product-id").value = "";
    document.getElementById("admin-prod-stock").value = 5;
  }
}

function closeAdminProductModal() {
  document.getElementById("modal-admin-product").classList.remove("active");
}

function submitAdminProductForm() {
  const id = document.getElementById("admin-form-product-id").value;
  const name = document.getElementById("admin-prod-name").value.trim();
  const category = document.getElementById("admin-prod-category").value;
  const price = parseInt(document.getElementById("admin-prod-price").value);
  const desc = document.getElementById("admin-prod-desc").value.trim();
  const stock = parseInt(document.getElementById("admin-prod-stock").value);
  
  // Get multiple images from mobile admin form
  const imagesUrls = document.getElementById("admin-prod-images-urls").value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
  
  // Also check for any additional URLs pasted in the textarea
  const additionalUrls = document.getElementById("admin-prod-image-urls").value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
  
  // Combine images (uploaded first, then additional URLs)
  let allImages = [...imagesUrls, ...additionalUrls];
  allImages = [...new Set(allImages)]; // Remove duplicates
  
  if (allImages.length === 0) {
    showToast("Please add at least one image");
    return;
  }
  
  const primaryImage = allImages[0];
  
  const specs = {
    fabric: document.getElementById("admin-spec-fabric").value.trim() || "Pure Silk",
    color: document.getElementById("admin-spec-color").value.trim() || "Traditional Shade",
    occasion: document.getElementById("admin-spec-occasion").value.trim() || "Bridal & Festive",
    zari: document.getElementById("admin-spec-zari").value.trim() || "Gold Zari Border",
    blouse: document.getElementById("admin-spec-blouse").value.trim() || "Yes",
    length: "5.5 Meters"
  };
  
  const inStock = stock > 0;
  
  if (id) {
    // Edit Mode
    const oldProduct = getProductById(id);
    const updated = {
      id,
      name,
      category,
      price,
      image: primaryImage,
      images: allImages,
      description: desc,
      specs,
      inStock,
      stockCount: stock,
      isFeatured: oldProduct ? oldProduct.isFeatured : false
    };
    updateProduct(updated);
    showToast("Product updated successfully");
  } else {
    // Add Mode
    const newId = `prod-${Date.now()}`;
    const product = {
      id: newId,
      name,
      category,
      price,
      image: primaryImage,
      images: allImages,
      description: desc,
      specs,
      inStock,
      stockCount: stock,
      isFeatured: false
    };
    addProduct(product);
    showToast("✨ New Saree added to catalog");
  }
  
  closeAdminProductModal();
  renderAdminProducts();
  renderFeaturedProducts(); // refresh home if active
}

function renderAdminOrders() {
  const list = document.getElementById("admin-orders-list");
  list.innerHTML = "";
  
  if (orders.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--color-text-muted);">
        <i class="material-icons-round" style="font-size: 40px; margin-bottom: 10px; opacity: 0.5;">receipt_long</i>
        <p>No customer orders placed yet.</p>
      </div>
    `;
    return;
  }
  
  orders.forEach(order => {
    const priceText = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(order.total);
    
    const card = document.createElement("div");
    card.className = "order-card";
    
    // Compile items list
    let itemsHtml = "";
    order.items.forEach(item => {
      itemsHtml += `
        <div class="order-item-line">
          <span>${item.name} <strong>x${item.quantity}</strong></span>
          <span>₹${(item.price * item.quantity).toLocaleString("en-IN")}</span>
        </div>
      `;
    });
    
    card.innerHTML = `
      <div class="order-card-header">
        <span class="order-card-id">${order.id}</span>
        <span class="order-card-date">${order.date}</span>
      </div>
      <div class="order-card-body">
        <div class="order-customer-info">
          <strong>Customer:</strong> ${order.customer.name}<br>
          <strong>Phone:</strong> ${order.customer.phone}<br>
          <strong>Address:</strong> ${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}
        </div>
        <div class="order-items-list">
          ${itemsHtml}
        </div>
      </div>
      <div class="order-card-footer">
        <span class="order-total-price">${priceText}</span>
        <div>
          <select class="order-status-select" data-id="${order.id}">
            <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
            <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
            <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
          <span class="order-status-badge ${order.status}">${order.status}</span>
        </div>
      </div>
    `;
    
    // Status update listener
    const select = card.querySelector(".order-status-select");
    const badge = card.querySelector(".order-status-badge");
    
    select.addEventListener("change", (e) => {
      const newStatus = e.target.value;
      
      // Update order status in state & DB
      order.status = newStatus;
      saveOrders();
      
      // Update UI badge
      badge.className = `order-status-badge ${newStatus}`;
      badge.innerText = newStatus;
      
      showToast(`Order ${order.id} marked as ${newStatus}`);
    });
    
    list.appendChild(card);
  });
}
