// SVG Placeholder Image for broken/missing URLs
const PLACEHOLDER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGQUY1RUMiLz48dGV4dCB4PSI1MCIgeT0iNTIiIGZvbnQtZmFtaWx5PSInQ2luemVsJywgc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc2l6ZT0iOSIgZmlsbD0iIzVDMDYxRSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U1ZBUk5BTSBTSUxLUzwvdGV4dD48cmVjdCB4PSI1IiB5PSI1IiB3aWR0aD0iOTAiIGhlaWdodD0iOTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4=";

// DOM Elements
const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const adminHeader = document.getElementById("admin-header");
const loginForm = document.getElementById("login-form");
const loginErrorMsg = document.getElementById("login-error-msg");
const logoutBtn = document.getElementById("logout-btn");

const productsListTbody = document.getElementById("products-list-tbody");
const productsEmptyState = document.getElementById("products-empty-state");
const btnAddSaree = document.getElementById("btn-add-saree");

// Modal Elements
const modalProduct = document.getElementById("modal-product");
const modalTitle = document.getElementById("modal-title");
const productForm = document.getElementById("product-form");
const productFormId = document.getElementById("product-form-id");
const prodName = document.getElementById("prod-name");
const prodCategory = document.getElementById("prod-category");
const prodPrice = document.getElementById("prod-price");
const specFabric = document.getElementById("spec-fabric");
const specColor = document.getElementById("spec-color");
const specOccasion = document.getElementById("spec-occasion");
const prodStock = document.getElementById("prod-stock");
const prodImage = document.getElementById("prod-image");
const prodDesc = document.getElementById("prod-desc");

const modalCloseBtn = document.getElementById("modal-close-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

// Delete Confirmation Modal Elements
const modalConfirmDelete = document.getElementById("modal-confirm-delete");
const confirmDeleteText = document.getElementById("confirm-delete-text");
const confirmDeleteCloseBtn = document.getElementById("confirm-delete-close-btn");
const confirmDeleteCancelBtn = document.getElementById("confirm-delete-cancel-btn");
const confirmDeleteYesBtn = document.getElementById("confirm-delete-yes-btn");

let productToDeleteId = null;
let productToDeleteName = null;

// Init Application
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupEventListeners();
});

// Authentication handlers
function checkAuth() {
  const isLoggedIn = localStorage.getItem("svarnam_admin_logged_in") === "true";
  if (isLoggedIn) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginView.style.display = "block";
  dashboardView.style.display = "none";
  adminHeader.style.display = "none";
}

function showDashboard() {
  loginView.style.display = "none";
  dashboardView.style.display = "block";
  adminHeader.style.display = "flex";
  
  // Render active tab content
  const activeTabBtn = document.querySelector(".tab-toggle.active");
  const activeTab = activeTabBtn ? activeTabBtn.getAttribute("data-tab") : "tab-products";
  
  if (activeTab === "tab-products") {
    renderInventory();
  } else {
    renderOrders();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (username === "admin" && password === "admin123") {
    localStorage.setItem("svarnam_admin_logged_in", "true");
    loginErrorMsg.style.display = "none";
    loginForm.reset();
    showDashboard();
    showToast("Successfully logged into Merchant Portal");
  } else {
    loginErrorMsg.style.display = "flex";
  }
}

function handleLogout() {
  localStorage.removeItem("svarnam_admin_logged_in");
  showLogin();
  showToast("Logged out successfully");
}

// Event Listeners setup
function setupEventListeners() {
  loginForm.addEventListener("submit", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  
  btnAddSaree.addEventListener("click", () => openModal());
  modalCloseBtn.addEventListener("click", closeModal);
  modalCancelBtn.addEventListener("click", closeModal);
  
  productForm.addEventListener("submit", handleFormSubmit);

  // Close modal when clicking outside content box
  modalProduct.addEventListener("click", (e) => {
    if (e.target === modalProduct) {
      closeModal();
    }
  });

  // Delete Confirmation Modal actions
  confirmDeleteCloseBtn.addEventListener("click", closeDeleteModal);
  confirmDeleteCancelBtn.addEventListener("click", closeDeleteModal);
  
  modalConfirmDelete.addEventListener("click", (e) => {
    if (e.target === modalConfirmDelete) {
      closeDeleteModal();
    }
  });

  confirmDeleteYesBtn.addEventListener("click", () => {
    if (productToDeleteId) {
      try {
        console.log(`Attempting to delete product ID: ${productToDeleteId}, Name: ${productToDeleteName}`);
        const success = deleteProduct(productToDeleteId);
        if (success) {
          console.log(`Successfully deleted product ID: ${productToDeleteId}`);
          renderInventory();
          showToast(`Deleted "${productToDeleteName}" from catalog`);
        } else {
          console.error(`Delete failed: Product ID "${productToDeleteId}" not found in local storage.`);
          alert(`Error: Could not delete "${productToDeleteName}". Product ID not found.`);
        }
      } catch (error) {
        console.error("Error in handleDelete confirmation:", error);
        alert(`An error occurred while deleting "${productToDeleteName}": ${error.message}`);
      }
    }
    closeDeleteModal();
  });

  // Tab toggling handler
  const tabButtons = document.querySelectorAll(".tab-toggle");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      
      // Switch active tab button styling
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Switch active tab content section
      document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
      });
      document.getElementById(tabId).classList.add("active");
      
      // Load specific tab data
      if (tabId === "tab-products") {
        renderInventory();
      } else if (tabId === "tab-orders") {
        renderOrders();
      }
    });
  });
}

// Render Inventory List
function renderInventory() {
  const products = getProducts();
  productsListTbody.innerHTML = "";
  
  if (products.length === 0) {
    productsEmptyState.style.display = "block";
    document.getElementById("products-table").style.display = "none";
    return;
  }
  
  productsEmptyState.style.display = "none";
  document.getElementById("products-table").style.display = "table";
  
  products.forEach(product => {
    const tr = document.createElement("tr");
    
    // Formatting price to Indian Rupees
    const formattedPrice = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(product.price);
    
    // Stock Status configuration
    const isAvailable = product.inStock && product.stockCount > 0;
    const stockBadgeClass = isAvailable ? "in-stock" : "out-of-stock";
    const stockText = isAvailable ? `In Stock (${product.stockCount})` : "Out of Stock";
    
    // Image handling - use main image URL or fallback SVG
    const imgUrl = product.image ? product.image : PLACEHOLDER_SVG;
    
    tr.innerHTML = `
      <td>
        <img src="${imgUrl}" class="product-thumbnail" alt="${product.name}" 
             onerror="this.onerror=null; this.src='${PLACEHOLDER_SVG}';">
      </td>
      <td>
        <div class="product-name-category">
          <span class="product-name">${product.name}</span>
          <span class="product-category">Weave: ${product.category}</span>
        </div>
      </td>
      <td>
        <span class="product-price">${formattedPrice}</span>
      </td>
      <td>
        <span class="stock-badge ${stockBadgeClass}">
          <i class="material-icons-round">fiber_manual_record</i>
          <span>${stockText}</span>
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-action edit" data-id="${product.id}" aria-label="Edit Saree">
            <i class="material-icons-round">edit</i>
          </button>
          <button class="btn-action delete" data-id="${product.id}" aria-label="Delete Saree">
            <i class="material-icons-round">delete</i>
          </button>
        </div>
      </td>
    `;
    
    // Attach event listeners to actions
    tr.querySelector(".edit").addEventListener("click", () => openModal(product));
    tr.querySelector(".delete").addEventListener("click", () => handleDelete(product.id, product.name));
    
    productsListTbody.appendChild(tr);
  });
}

// Modal actions
function openModal(product = null) {
  productForm.reset();
  modalProduct.classList.add("active");
  
  if (product) {
    modalTitle.innerText = "Edit Saree Catalog Details";
    productFormId.value = product.id;
    prodName.value = product.name;
    prodCategory.value = product.category || "Kanchipuram";
    prodPrice.value = product.price;
    specFabric.value = (product.specs && product.specs.fabric) ? product.specs.fabric : "";
    specColor.value = (product.specs && product.specs.color) ? product.specs.color : "";
    specOccasion.value = (product.specs && product.specs.occasion) ? product.specs.occasion : "";
    prodStock.value = product.stockCount;
    prodImage.value = product.image ? product.image : "";
    prodDesc.value = product.description || "";
  } else {
    modalTitle.innerText = "Add New Saree to Catalog";
    productFormId.value = "";
    prodStock.value = 5;
  }
}

function closeModal() {
  modalProduct.classList.remove("active");
}

// Form Submission (Add/Edit Saree)
function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = productFormId.value;
  const name = prodName.value.trim();
  const category = prodCategory.value;
  const price = parseInt(prodPrice.value);
  const fabric = specFabric.value.trim();
  const color = specColor.value.trim();
  const occasion = specOccasion.value.trim();
  const stock = parseInt(prodStock.value);
  const image = prodImage.value.trim();
  const description = prodDesc.value.trim();
  
  const inStock = stock > 0;
  
  const specs = {
    fabric: fabric,
    color: color,
    occasion: occasion,
    zari: "Authentic Zari Work",
    blouse: "Yes",
    length: "5.5 Meters"
  };
  
  if (id) {
    // Edit mode
    const oldProduct = getProductById(id);
    const updated = {
      id: id,
      name: name,
      category: category,
      price: price,
      image: image,
      images: [image], // detail view support
      description: description,
      specs: specs,
      inStock: inStock,
      stockCount: stock,
      isFeatured: oldProduct ? oldProduct.isFeatured : false
    };
    
    updateProduct(updated);
    showToast(`Updated saree details: "${name}"`);
  } else {
    // Add mode
    const newId = `prod-${Date.now()}`;
    const product = {
      id: newId,
      name: name,
      category: category,
      price: price,
      image: image,
      images: [image], // detail view support
      description: description,
      specs: specs,
      inStock: inStock,
      stockCount: stock,
      isFeatured: false
    };
    
    addProduct(product);
    showToast(`Added new saree to catalog: "${name}"`);
  }
  
  closeModal();
  renderInventory();
}

// Delete item
function handleDelete(id, name) {
  productToDeleteId = id;
  productToDeleteName = name;
  confirmDeleteText.innerHTML = `Are you sure you want to delete <strong>"${name}"</strong> from the inventory?`;
  modalConfirmDelete.classList.add("active");
}

function closeDeleteModal() {
  modalConfirmDelete.classList.remove("active");
  productToDeleteId = null;
  productToDeleteName = null;
}

// Toast System
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <i class="material-icons-round" style="font-size: 18px; color: var(--color-gold);">info</i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Remove after animation finishes
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// ==========================================================================
// ORDERS TAB OPERATIONS
// ==========================================================================

function getOrders() {
  const stored = localStorage.getItem("svarnam_orders");
  return stored ? JSON.parse(stored) : [];
}

function saveOrders(ordersList) {
  localStorage.setItem("svarnam_orders", JSON.stringify(ordersList));
}

function renderOrders() {
  const ordersGrid = document.getElementById("orders-list-grid");
  const ordersEmptyState = document.getElementById("orders-empty-state");
  ordersGrid.innerHTML = "";
  
  const allOrders = getOrders();
  if (allOrders.length === 0) {
    ordersEmptyState.style.display = "block";
    ordersGrid.style.display = "none";
    return;
  }
  
  ordersEmptyState.style.display = "none";
  ordersGrid.style.display = "grid";
  
  // Newest orders first (orders are stored newest-first in localStorage by the app)
  const sortedOrders = allOrders;
  
  sortedOrders.forEach(order => {
    const card = document.createElement("div");
    card.className = "order-card";
    
    // Formatting total order value
    const formattedTotal = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(order.total);
    
    // Normalize status (Pending, Packed, Shipped, Delivered)
    let currentStatus = "Pending";
    if (order.status) {
      const normalized = order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase();
      if (["Pending", "Packed", "Shipped", "Delivered"].includes(normalized)) {
        currentStatus = normalized;
      }
    }
    
    // Build order items list content
    let itemsHtml = "";
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const itemPriceFormatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0
        }).format(item.price);
        
        const itemImg = item.image ? item.image : PLACEHOLDER_SVG;
        
        itemsHtml += `
          <div class="order-item-row">
            <div class="order-item-details">
              <img src="${itemImg}" class="order-item-thumb" alt="${item.name}"
                   onerror="this.onerror=null; this.src='${PLACEHOLDER_SVG}';">
              <div>
                <span style="font-weight:600; display:block; color:var(--color-text);">${item.name}</span>
                <span style="font-size:0.75rem; color:var(--color-text-muted);">Qty: ${item.quantity} × ${itemPriceFormatted}</span>
              </div>
            </div>
            <span style="font-weight:600; color:var(--color-maroon);">${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.price * item.quantity)}</span>
          </div>
        `;
      });
    }
    
    const customer = order.customer || {};
    const custName = customer.name || "N/A";
    const custPhone = customer.phone || "N/A";
    const custAddress = customer.address || "N/A";
    const custCity = customer.city || "";
    const custState = customer.state || "";
    const custPincode = customer.pincode || "";
    const fullAddress = `${custAddress}${custCity ? ', ' + custCity : ''}${custState ? ', ' + custState : ''}${custPincode ? ' - ' + custPincode : ''}`;
    
    const statusClass = currentStatus.toLowerCase();
    
    card.innerHTML = `
      <div class="order-card-header">
        <span class="order-id">Order ID: #${order.id}</span>
        <span class="order-date">${order.date || ''}</span>
      </div>
      <div class="order-card-body">
        <div class="customer-info-block">
          <h4>Customer Information</h4>
          <div class="info-line"><span class="info-label">Name:</span> <strong>${custName}</strong></div>
          <div class="info-line"><span class="info-label">Phone:</span> ${custPhone}</div>
          <div class="info-line"><span class="info-label">Address:</span> ${fullAddress}</div>
        </div>
        <div class="order-items-block">
          <h4>Items Ordered</h4>
          <div class="order-items-list-container">
            ${itemsHtml}
          </div>
        </div>
      </div>
      <div class="order-card-footer">
        <div class="order-total-price">
          Total Amount: ${formattedTotal}
        </div>
        <div class="order-status-control">
          <span class="status-indicator ${statusClass}" id="status-badge-${order.id}">
            <i class="material-icons-round" style="font-size:10px;">fiber_manual_record</i>
            <span>${currentStatus}</span>
          </span>
          <select class="status-select" data-order-id="${order.id}">
            <option value="Pending" ${currentStatus === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Packed" ${currentStatus === "Packed" ? "selected" : ""}>Packed</option>
            <option value="Shipped" ${currentStatus === "Shipped" ? "selected" : ""}>Shipped</option>
            <option value="Delivered" ${currentStatus === "Delivered" ? "selected" : ""}>Delivered</option>
          </select>
        </div>
      </div>
    `;
    
    // Attach change listener to dropdown status select
    const select = card.querySelector(".status-select");
    select.addEventListener("change", (e) => {
      const newStatus = e.target.value;
      updateOrderStatus(order.id, newStatus);
    });
    
    ordersGrid.appendChild(card);
  });
}

function updateOrderStatus(orderId, newStatus) {
  const allOrders = getOrders();
  const index = allOrders.findIndex(o => o.id === orderId || String(o.id) === String(orderId));
  
  if (index !== -1) {
    allOrders[index].status = newStatus;
    saveOrders(allOrders);
    
    // Update badge class and text immediately
    const badge = document.getElementById(`status-badge-${orderId}`);
    if (badge) {
      badge.className = `status-indicator ${newStatus.toLowerCase()}`;
      badge.querySelector("span").innerText = newStatus;
    }
    
    showToast(`Order #${orderId} status updated to ${newStatus}`);
  }
}
