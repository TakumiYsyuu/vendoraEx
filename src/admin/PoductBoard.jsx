import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Store, X } from "lucide-react";
import "../styles/ProductBoard.css";

const BASE = (import.meta.env.VITE_URL ?? "http://localhost:5000/api").replace(
  /\/api\/?$/,
  "",
);

// Handles: array, JSON string, data URL, full URL, or a "/uploads/..." path
function getImage(product) {
  let raw = product.images ?? product.image ?? product.img;
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

const formatPrice = (price) => `₱${Number(price || 0).toLocaleString()}`;

function stockLevel(stock) {
  const n = Number(stock || 0);
  if (n === 0) return { label: "Out of stock", tone: "out" };
  if (n <= 5) return { label: `Low stock · ${n} left`, tone: "low" };
  return { label: `${n} in stock`, tone: "ok" };
}

function ProductArt({ product }) {
  const [failed, setFailed] = useState(false);
  const src = getImage(product);
  return (
    <div className="sp-art" style={{ background: product.bg }}>
      {src && !failed ?
        <img src={src} alt={product.name} onError={() => setFailed(true)} />
      : <span aria-hidden="true">{product.icon || "📦"}</span>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="sp-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function ShopAndProduct({ products }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [seller, setSeller] = useState("all");
  const [category, setCategory] = useState("all");

  const sellers = useMemo(
    () => [...new Set(products.map((p) => p.seller).filter(Boolean))].sort(),
    [products],
  );
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (seller === "all" || p.seller === seller) &&
        (category === "all" || p.category === category) &&
        (!q ||
          p.name?.toLowerCase().includes(q) ||
          p.seller?.toLowerCase().includes(q)),
    );
  }, [products, query, seller, category]);

  const hasFilters = query.trim() || seller !== "all" || category !== "all";
  const clearFilters = () => {
    setQuery("");
    setSeller("all");
    setCategory("all");
  };

  const totalUnits = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowCount = products.filter((p) => Number(p.stock || 0) <= 5).length;

  // Close the details dialog with Escape
  useEffect(() => {
    if (!selectedProduct) return;
    const onKey = (e) => e.key === "Escape" && setSelectedProduct(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedProduct]);

  return (
    <div className="sp-page">
      <header className="sp-header">
        <h1>Shops & Products</h1>
        <p>Everything sellers currently have listed on the marketplace.</p>
      </header>

      {products.length > 0 && (
        <dl className="sp-summary">
          <div>
            <dt>Sellers</dt>
            <dd>{sellers.length}</dd>
          </div>
          <div>
            <dt>Listings</dt>
            <dd>{products.length}</dd>
          </div>
          <div>
            <dt>Units in stock</dt>
            <dd>{totalUnits.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Low or out of stock</dt>
            <dd>{lowCount}</dd>
          </div>
        </dl>
      )}

      {products.length > 0 && (
        <div className="sp-filters">
          <label className="sp-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by product or seller"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search listings"
            />
          </label>
          <select
            className="sp-select"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            aria-label="Filter by seller"
          >
            <option value="all">All sellers</option>
            {sellers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="sp-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button className="sp-reset" onClick={clearFilters}>
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {!products.length ?
        <EmptyState
          icon={Store}
          title="No marketplace listings"
          description="Seller products will appear here once they are created."
        />
      : !visible.length ?
        <EmptyState
          icon={Search}
          title="No listings match"
          description="Try a different search or clear the seller and category filters."
        />
      : <section className="sp-grid" aria-label="Marketplace listings">
          {visible.map((product) => {
            const level = stockLevel(product.stock);
            return (
              <article
                className="sp-card"
                key={`${product.sellerEmail || product.seller}-${product.id}`}
              >
                <ProductArt product={product} />
                <div className="sp-card-body">
                  <h2>{product.name}</h2>
                  <strong className="sp-price">
                    {formatPrice(product.price)}
                  </strong>
                  <p className="sp-seller">Sold by {product.seller}</p>
                  <span className={`sp-stock sp-stock-${level.tone}`}>
                    {level.label}
                  </span>
                </div>
                <button
                  className="sp-view"
                  onClick={() => setSelectedProduct(product)}
                >
                  <Eye size={15} /> View details
                </button>
              </article>
            );
          })}
        </section>
      }

      {selectedProduct && (
        <div
          className="sp-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedProduct(null)}
        >
          <section
            className="sp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sp-dialog-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="sp-close"
              aria-label="Close"
              onClick={() => setSelectedProduct(null)}
            >
              <X size={18} />
            </button>
            <ProductArt product={selectedProduct} />
            <div className="sp-dialog-body">
              <h2 id="sp-dialog-title">{selectedProduct.name}</h2>
              <strong className="sp-price">
                {formatPrice(selectedProduct.price)}
              </strong>
              <dl className="sp-facts">
                <div>
                  <dt>Seller</dt>
                  <dd>{selectedProduct.seller}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{selectedProduct.category || "Uncategorised"}</dd>
                </div>
                <div>
                  <dt>Stock</dt>
                  <dd>{Number(selectedProduct.stock || 0)} available</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className="sp-stock sp-stock-ok sp-status">
                      Active
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
