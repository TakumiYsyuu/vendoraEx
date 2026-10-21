const WISHLIST_API =
  (import.meta.env.VITE_URL || "http://localhost:5000/api") + "/wishlist";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("vendora_token")}`,
});

async function wishlistRequest(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...authHeader(), ...options.headers },
    });
  } catch {
    throw new Error("Could not reach the server.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

export const fetchWishlist = async () => {
  const data = await wishlistRequest(WISHLIST_API);
  return data.ids.map(Number);
};

export const addToWishlist = (id) =>
  wishlistRequest(`${WISHLIST_API}/${id}`, { method: "POST" });

export const removeFromWishlist = (id) =>
  wishlistRequest(`${WISHLIST_API}/${id}`, { method: "DELETE" });
