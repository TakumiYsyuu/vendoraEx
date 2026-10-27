import { Heart, Star } from "lucide-react";
import ProductArt from "../components/ProductArt";
import { money } from "../utils/helpers";

const LOW_STOCK = 5;

// Small stock label shown on every product card
function StockLabel({ stock }) {
  const amount = Number(stock) || 0;
  const out = amount <= 0;
  const low = !out && amount <= LOW_STOCK;
  const color =
    out ? "#dc2626"
    : low ? "#d97706"
    : "#16a34a";

  return (
    <small
      style={{
        display: "block",
        margin: "4px 0 6px",
        fontSize: 11,
        fontWeight: 600,
        color,
      }}
    >
      {out ?
        "Out of stock"
      : low ?
        `Only ${amount} left`
      : `${amount} in stock`}
    </small>
  );
}

// ---------- ProductCard ----------
function ProductCard({ p, openProduct, add, isWishlisted, toggleWishlist }) {
  const soldOut = (Number(p.stock) || 0) <= 0;

  return (
    <article
      className="product-card"
      style={soldOut ? { opacity: 0.85 } : undefined}
      onClick={() => openProduct(p)}
    >
      <div className="card-image">
        <ProductArt p={p} />
        <button
          className="heart"
          aria-label={
            isWishlisted ?
              `Remove ${p.name} from wishlist`
            : `Add ${p.name} to wishlist`
          }
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist?.(p.id);
          }}
        >
          <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        {p.old > p.price && (
          <span className="discount">
            {Math.round((1 - p.price / p.old) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="product-info">
        <h3>{p.name}</h3>
        <small
          style={{
            display: "block",
            marginBottom: 6,
            color: "var(--muted)",
            fontSize: 10,
          }}
        >
          Sold by {p.seller}
        </small>
        <div className="rating">
          <Star size={14} fill="currentColor" /> {p.rating}{" "}
          <span>({p.reviews})</span>
        </div>
        <strong>{money(p.price)}</strong>
        <del>{money(p.old)}</del>
        <StockLabel stock={p.stock} />
        <button
          className="add-btn"
          disabled={soldOut}
          style={soldOut ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (!soldOut) add(p);
          }}
        >
          {soldOut ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

// ---------- ProductGrid ----------
export default function ProductGrid({
  products,
  openProduct,
  add,
  wishlistIds,
  toggleWishlist,
}) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          p={p}
          openProduct={openProduct}
          add={add}
          isWishlisted={wishlistIds?.includes(p.id)}
          toggleWishlist={toggleWishlist}
        />
      ))}
    </div>
  );
}
