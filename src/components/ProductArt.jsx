import { useState } from "react";
import "../styles/ProductArt.css";

// VITE_URL ends with /api, but /uploads is served from the server root
const BASE = (import.meta.env.VITE_URL ?? "http://localhost:5000/api").replace(
  /\/api\/?$/,
  "",
);

// Accepts: array, JSON string, data URL, full URL, or a "/uploads/..." path.
// Looks at p.image first (what this component used before), then p.images / p.img.
function getImage(p) {
  let raw = p.image ?? p.images ?? p.img;
  if (Array.isArray(raw)) raw = raw[0];
  else if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      raw = JSON.parse(raw)[0];
    } catch {
      /* keep raw */
    }
  }
  if (!raw || typeof raw !== "string") return "";
  raw = raw.trim();
  if (/^(https?:|data:|blob:)/.test(raw)) return raw;
  return `${BASE}/${raw.replace(/^\/+/, "")}`;
}

export default function ProductArt({ p, large = false }) {
  const [failed, setFailed] = useState(false);
  const src = getImage(p);

  // Product media can come from an uploaded image or the fallback product icon.
  const renderProductMedia = () => {
    if (src && !failed)
      return (
        <img
          src={src}
          alt={p.name}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    return <span>{p.icon || "📦"}</span>;
  };

  return (
    <div
      className={"product-art " + (large ? "large" : "")}
      style={{ background: p.bg }}
    >
      {renderProductMedia()}
    </div>
  );
}
