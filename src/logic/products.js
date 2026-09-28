function readProductList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value;
  } catch {
    // A backend implementation would return a structured storage/API error here.
  }
  return [];
}

function isSellerBanned(email) {
  return localStorage.getItem(`vendora-banned-${email}`) === "true";
}

// Collects marketplace listings while excluding sellers restricted by moderation.
export function getStorefrontProducts() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("vendora-products-"))
    .flatMap((key) => {
      const sellerEmail = key.replace("vendora-products-", "");
      if (isSellerBanned(sellerEmail)) return [];
      return readProductList(key).map((product) => ({
        ...product,
        sellerEmail: product.sellerEmail || sellerEmail,
      }));
    });
}

export function filterProducts(list, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return list;
  return list.filter((product) => {
    const name = product.name.toLowerCase();
    const category = product.category.toLowerCase();
    return name.includes(normalizedQuery) || category.includes(normalizedQuery);
  });
}

function getOriginalPrice(price, discount) {
  if (!discount) return price;
  return Math.round(price / (1 - discount / 100));
}

// Saves a seller listing locally; replace this with a product-creation API call later.
export function saveSellerProduct(user, product) {
  const key = `vendora-products-${user.email}`;
  const discount = Number(product.discount) || 0;
  const newProduct = {
    ...product,
    id: Date.now(),
    sellerEmail: user.email,
    seller: user.shopName || `${user.name}'s Shop`,
    old: getOriginalPrice(product.price, discount),
    discount,
    rating: 0,
    reviews: 0,
    sold: 0,
    icon: "📦",
    bg: "linear-gradient(135deg,#edf4ef,#fff)",
  };
  localStorage.setItem(
    key,
    JSON.stringify([...readProductList(key), newProduct]),
  );
  return newProduct;
}

// Updates the seller-owned listing in the same storage record used by the storefront.
export function updateSellerProduct({ sellerEmail, productId, changes }) {
  const name = changes.name?.trim();
  const price = Number(changes.price);
  const stock = Number(changes.stock);
  if (!sellerEmail) return { error: "This listing has no seller account." };
  if (!name) return { error: "Enter a product name." };
  if (!Number.isFinite(price) || price < 0)
    return { error: "Enter a valid price." };
  if (!Number.isInteger(stock) || stock < 0)
    return { error: "Enter a valid stock quantity." };

  const key = `vendora-products-${sellerEmail}`;
  let updatedProduct;
  const nextProducts = readProductList(key).map((product) => {
    if (String(product.id) !== String(productId)) return product;
    updatedProduct = {
      ...product,
      name,
      category: changes.category?.trim() || product.category,
      price,
      stock,
    };
    return updatedProduct;
  });
  if (!updatedProduct) return { error: "The listing could not be found." };
  localStorage.setItem(key, JSON.stringify(nextProducts));
  return { product: updatedProduct };
}
