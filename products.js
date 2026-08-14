const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Royal Sapphire Blue Kanchipuram Silk Saree",
    price: 18500,
    category: "Kanchipuram",
    image: "images/kanchipuram_blue.png",
    images: ["images/kanchipuram_blue.png", "images/kanchipuram_pink.png", "images/banarasi_red.png"],
    description: "Handcrafted by master weavers, this royal sapphire blue Kanchipuram silk saree features classic gold and silver zari checks, a heavy pallu depicting traditional motifs, and a matching unstitched blouse piece. Ideal for grand bridal and festive occasions.",
    specs: {
      fabric: "Pure Mulberry Silk (100%)",
      color: "Royal Sapphire Blue & Gold",
      occasion: "Wedding & Festive",
      zari: "Pure Gold & Silver Zari",
      blouse: "Yes (80cm Unstitched)",
      length: "5.5 Meters + 0.8m Blouse"
    },
    inStock: true,
    stockCount: 5,
    isFeatured: true
  },
  {
    id: "prod-2",
    name: "Radiant Sunset Orange Banarasi Brocade Saree",
    price: 15200,
    category: "Banarasi",
    image: "images/banarasi_orange.png",
    images: ["images/banarasi_orange.png", "images/banarasi_red.png", "images/paithani_silver.png"],
    description: "An exquisite sunset orange Banarasi saree woven in fine Katan silk and featuring elaborate gold brocade embroidery (zari work) with floral vines. Perfect for grand reception and evening wear.",
    specs: {
      fabric: "Katan Silk",
      color: "Sunset Orange & Metallic Gold",
      occasion: "Festive & Wedding",
      zari: "Fine Metallic Zari Threads",
      blouse: "Yes (Contrast Silk)",
      length: "5.5 Meters + 0.8m Blouse"
    },
    inStock: true,
    stockCount: 3,
    isFeatured: true
  },
  {
    id: "prod-3",
    name: "Sterling Silver Paithani Silk Saree",
    price: 21000,
    category: "Paithani",
    image: "images/paithani_silver.png",
    images: ["images/paithani_silver.png", "images/kanchipuram_blue.png", "images/banarasi_orange.png"],
    description: "A gorgeous sterling silver-grey Paithani saree with the signature heavy gold tissue pallu embellished with colorful hand-woven peacock and lotus motifs, representing Maharashtra's royal heritage.",
    specs: {
      fabric: "Handloom Pure Silk",
      color: "Sterling Silver Grey & Gold Pallu",
      occasion: "Wedding & Festive",
      zari: "Pure Silver & Gold Thread",
      blouse: "Yes (Silver Grey Silk)",
      length: "5.5 Meters + 0.8m Blouse"
    },
    inStock: true,
    stockCount: 4,
    isFeatured: true
  },
  {
    id: "prod-4",
    name: "Blush Pink Kanchipuram Silk Saree",
    price: 19800,
    category: "Kanchipuram",
    image: "images/kanchipuram_pink.png",
    images: ["images/kanchipuram_pink.png", "images/kanchipuram_blue.png", "images/paithani_silver.png"],
    description: "A premium blush pink Kanchipuram silk saree featuring ornate gold floral vines and intricate zari borders. Decorated with detailed temple panels, it offers a romantic and majestic drape.",
    specs: {
      fabric: "Double Warp Kanchipuram Silk",
      color: "Blush Pink & Warm Gold",
      occasion: "Wedding & Festive",
      zari: "Pure Gold Zari Work",
      blouse: "Yes (Matching Pink)",
      length: "5.5 Meters + 0.8m Blouse"
    },
    inStock: true,
    stockCount: 6,
    isFeatured: true
  },
  {
    id: "prod-5",
    name: "Crimson Red Banarasi Silk Saree",
    price: 16500,
    category: "Banarasi",
    image: "images/banarasi_red.png",
    images: ["images/banarasi_red.png", "images/banarasi_orange.png", "images/kanchipuram_pink.png"],
    description: "A classic crimson red Banarasi saree crafted with pure Katan silk, adorned with rich gold floral zari vines across the body. Its rich border and grand pallu offer a timeless bridal elegance.",
    specs: {
      fabric: "Pure Katan Silk",
      color: "Crimson Red & Antique Gold",
      occasion: "Festive & Bridal",
      zari: "Premium Gold Zari",
      blouse: "Yes (Crimson Red)",
      length: "5.5 Meters + 0.8m Blouse"
    },
    inStock: true,
    stockCount: 5,
    isFeatured: false
  },
  {
    id: "prod-6",
    name: "Heritage Silver Tissue Paithani Saree",
    price: 23500,
    category: "Paithani",
    image: "images/paithani_silver.png",
    images: ["images/paithani_silver.png", "images/banarasi_red.png", "images/kanchipuram_blue.png"],
    description: "An extraordinary silver tissue Paithani saree with an opulent gold zari border and elaborate pallu depicting royal motifs. Designed for discerning saree connoisseurs.",
    specs: {
      fabric: "Handwoven Tissue Silk",
      color: "Sterling Silver & Gold Tissue",
      occasion: "Grand Wedding & Reception",
      zari: "Fine Real Gold & Silver Zari",
      blouse: "Yes (Running Silk)",
      length: "5.5 Meters + 0.8m Blouse"
    },
    inStock: true,
    stockCount: 2,
    isFeatured: false
  }
];

// Helper functions for Database operations
function getProducts() {
  const stored = localStorage.getItem("svarnam_products");
  if (!stored) {
    localStorage.setItem("svarnam_products", JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  let parsed = JSON.parse(stored);
  // Migration to update products with latest imagery and details
  let updated = false;
  parsed = parsed.map(p => {
    const initial = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
    if (initial) {
      p.name = initial.name;
      p.category = initial.category;
      p.image = initial.image;
      p.images = initial.images;
      p.description = initial.description;
      p.specs = initial.specs;
      updated = true;
    } else {
      if (!p.images) {
        p.images = [p.image];
        updated = true;
      }
      if (p.specs && !p.specs.length) {
        p.specs.length = "5.5 Meters";
        updated = true;
      }
    }
    return p;
  });
  if (updated) {
    saveProducts(parsed);
  }
  return parsed;
}

function saveProducts(products) {
  localStorage.setItem("svarnam_products", JSON.stringify(products));
}

function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id);
}

function addProduct(product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

function updateProduct(updatedProduct) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === updatedProduct.id);
  if (index !== -1) {
    products[index] = updatedProduct;
    saveProducts(products);
    return true;
  }
  return false;
}

function deleteProduct(id) {
  const products = getProducts();
  const initialLength = products.length;
  const filtered = products.filter(p => String(p.id) !== String(id));
  saveProducts(filtered);
  return filtered.length < initialLength;
}
