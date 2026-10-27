const BASE = (import.meta.env.VITE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  "",
);

const getToken = () =>
  localStorage.getItem("vendora_token") ||
  sessionStorage.getItem("vendora_token");

async function request(path = "", options = {}) {
  const res = await fetch(`${BASE}/cart${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false)
    throw new Error(data.message || "Cart request failed.");
  return data;
}

export const fetchCart = () => request().then((d) => d.items);

export const addCartItem = (productId, quantity = 1) =>
  request("", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });

export const setCartQuantity = (productId, quantity) =>
  request(`/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });

export const removeCartItem = (productId) =>
  request(`/${productId}`, { method: "DELETE" });

export const clearCartItems = () => request("", { method: "DELETE" });
