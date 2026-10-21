const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);

export async function getStorefrontProducts() {
  const res = await fetch(`${API}/api/products`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return data.products.map((p) => ({
    ...p,
    images: p.images.map((url) =>
      url.startsWith("http") ? url : `${API}${url}`,
    ),
    image: p.images[0] ? `${API}${p.images[0]}` : null,
  }));
}
