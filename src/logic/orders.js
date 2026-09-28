import { sameOrderId } from "../utils/helpers";

const SHIPPING_FEE = 50;
const LEGACY_ORDER_ID = "#ORD-688556";

// Storage reads are guarded so malformed demo data never crashes the order screens.
function readOrderList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value;
  } catch {
    // A backend implementation would log or report this invalid payload.
  }
  return [];
}

function formatOrderDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getProductQuantity(product, quantities) {
  return quantities[product.id] || 1;
}

function getOrderTotal(products, quantities) {
  return products.reduce(
    (total, product) =>
      total + product.price * getProductQuantity(product, quantities),
    0,
  );
}

export function purgeLegacyOrders() {
  Object.keys(localStorage)
    .filter(
      (key) =>
        key.startsWith("vendora-orders-") ||
        key.startsWith("vendora-seller-orders-"),
    )
    .forEach((key) => {
      const orders = readOrderList(key);
      const currentOrders = orders.filter(
        (order) => order.id !== LEGACY_ORDER_ID,
      );
      localStorage.setItem(key, JSON.stringify(currentOrders));
    });
}

export function loadPurchaseCategories(user) {
  if (!user?.email) return [];
  return readOrderList(`vendora-last-categories-${user.email}`);
}

function groupProductsBySeller(cart) {
  return cart.reduce((groups, product) => {
    if (!product.sellerEmail) return groups;
    if (!groups[product.sellerEmail]) groups[product.sellerEmail] = [];
    groups[product.sellerEmail].push(product);
    return groups;
  }, {});
}

// Creates buyer and seller order records. Replace these storage writes with order API calls later.
export function placeOrder({ user, cart, quantities }) {
  if (!user?.email || !cart.length) return [];

  const categories = [...new Set(cart.map((product) => product.category))];
  localStorage.setItem(
    `vendora-last-categories-${user.email}`,
    JSON.stringify(categories),
  );

  const now = new Date();
  const deliveryDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const orderId = `#ORD-${Date.now().toString().slice(-6)}`;
  const merchandiseTotal = getOrderTotal(cart, quantities);
  const order = {
    id: orderId,
    customer: user.name,
    date: formatOrderDate(now),
    expectedDate: formatOrderDate(deliveryDate),
    total: merchandiseTotal + SHIPPING_FEE,
    status: "Processing",
    products: cart.map((product) => ({
      productId: product.id,
      name: product.name,
      image: product.image,
      shop: product.seller,
      price: product.price,
      quantity: getProductQuantity(product, quantities),
    })),
  };

  const buyerKey = `vendora-orders-${user.email}`;
  localStorage.setItem(
    buyerKey,
    JSON.stringify([...readOrderList(buyerKey), order]),
  );

  Object.entries(groupProductsBySeller(cart)).forEach(
    ([sellerEmail, products]) => {
      const sellerKey = `vendora-seller-orders-${sellerEmail}`;
      const sellerOrder = {
        id: orderId,
        customer: user.name,
        date: order.date,
        total: getOrderTotal(products, quantities),
        status: "Processing",
        products: products.map((product) => product.name),
      };
      localStorage.setItem(
        sellerKey,
        JSON.stringify([...readOrderList(sellerKey), sellerOrder]),
      );
    },
  );
  return categories;
}

// Seller status updates are mirrored to buyer records; a backend should scope this per seller shipment.
export function syncBuyerOrderStatus(id, status) {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("vendora-orders-"))
    .forEach((key) => {
      const nextOrders = readOrderList(key).map((order) => {
        if (!sameOrderId(order.id, id)) return order;
        return { ...order, status };
      });
      localStorage.setItem(key, JSON.stringify(nextOrders));
    });
}
