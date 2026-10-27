export const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "In Transit",
  "Out for Delivery",
  "Completed",
  "Cancelled",
];

const BASE = (import.meta.env.VITE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  "",
);

const getToken = () =>
  localStorage.getItem("vendora_token") ||
  sessionStorage.getItem("vendora_token");

async function request(path = "", options = {}) {
  const res = await fetch(`${BASE}/orders${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false)
    throw new Error(data.message || "Something went wrong.");
  return data;
}

const patch = (id, action, body) =>
  request(`/${id}/${action}`, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });

// ---------- kept from the old file (used by App.jsx) ----------
const SHIPPING_FEE = 50;

export function purgeLegacyOrders() {
  // Orders live in the database now: remove the old demo data from localStorage.
  Object.keys(localStorage)
    .filter(
      (key) =>
        key.startsWith("vendora-orders-") ||
        key.startsWith("vendora-seller-orders-"),
    )
    .forEach((key) => localStorage.removeItem(key));
}

export function loadPurchaseCategories(user) {
  if (!user?.email) return [];
  try {
    const v = JSON.parse(
      localStorage.getItem(`vendora-last-categories-${user.email}`) || "[]",
    );
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// ---------- buyer ----------
// Now async: App.jsx must await it (see the patch notes).
export async function placeOrder({ user, cart, quantities, shipping }) {
  if (!user?.email || !cart.length) return [];
  const data = await request("", {
    method: "POST",
    body: JSON.stringify({
      items: cart.map((p) => ({
        productId: p.id,
        quantity: quantities[p.id] || 1,
      })),
      shipping,
    }),
  });
  localStorage.setItem(
    `vendora-last-categories-${user.email}`,
    JSON.stringify(data.categories || []),
  );
  return data.categories || [];
}

export const fetchMyOrders = () => request("/mine").then((d) => d.orders);
export const markOrderReceived = (id) => patch(id, "received");

// ---------- seller ----------
export const fetchSellerOrders = () => request("/seller").then((d) => d.orders);
export const acceptOrder = (id) => patch(id, "accept");
export const rejectOrder = (id, reason) => patch(id, "reject", { reason });
export const sendOrderToTransit = (id) => patch(id, "transit");

// ---------- staff ----------
export const fetchStaffOrders = () => request("/staff").then((d) => d.orders);
export const markReadyToDeliver = (id) => patch(id, "ready");

// ---------- admin ----------
export const fetchAllOrders = (status) =>
  request(
    status ? `/admin?status=${encodeURIComponent(status)}` : "/admin",
  ).then((d) => d.orders);

// ---------- shared ----------
export const fetchOrder = (id) => request(`/${id}`).then((d) => d.order);

export const money = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export const formatDate = (d) =>
  d ?
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  : "—";

export function syncBuyerOrderStatus() {}

export { SHIPPING_FEE };
