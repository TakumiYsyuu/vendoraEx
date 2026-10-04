import { Heart, Star } from "lucide-react";
import ProductArt from "../components/ProductArt";
import { money } from "../utils/helpers";

// ---------- ProductCard ----------
function ProductCard({ p, openProduct, add, isWishlisted, toggleWishlist }) {
  return (
    <article className="product-card" onClick={() => openProduct(p)}>
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
        <button
          className="add-btn"
          onClick={(e) => {
            e.stopPropagation();
            add(p);
          }}
        >
          Add to Cart
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
