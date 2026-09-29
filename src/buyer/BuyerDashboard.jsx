import "../styles/BuyerDashboard.css";
import { useEffect, useState } from "react";
import {
  Home,
  Grid2X2,
  Tag,
  Package,
  Heart,
  MessageCircle,
  ShoppingCart,
  Settings,
  LogOut,
  X,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  ArrowLeft,
  Flag,
  ChevronRight,
  Trash2,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import ProductArt from "../components/ProductArt";
import Status from "../components/Status";
import Messages from "../components/Messages";
import { money, initials } from "../utils/helpers";
import { loadProductReviews, saveReview } from "../logic/reviews";
import { addReport } from "../logic/moderation";

// ---------- BuyerSidebar ----------
export function BuyerSidebar({
  user,
  page,
  setPage,
  mobileOpen,
  setMobileOpen,
  onLogout,
  cartCount,
}) {
  const items = [
    [Home, "Home", "home"],
    [Grid2X2, "Categories", "categories"],
    [Tag, "Deals", "deals"],
    [Package, "My Orders", "orders"],
    [Heart, "Wishlist", "wishlist"],
    [MessageCircle, "Messages", "messages"],
    [ShoppingCart, "Cart", "cart"],
  ];
  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileOpen(false);
  };

  return (
    <aside className={"sidebar buyer-side " + (mobileOpen ? "open" : "")}>
      <div className="brand side-brand">
        <span className="brand-mark">V</span>
        <span>Vendora</span>
      </div>
      <button className="close-mobile" onClick={() => setMobileOpen(false)}>
        <X />
      </button>
      <nav>
        {items.map(([I, label, key]) => (
          <button
            className={page === key ? "active" : ""}
            key={key}
            onClick={() => navigate(key)}
          >
            <I size={17} />
            {label}
            {key === "cart" && cartCount > 0 && <em>{cartCount}</em>}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="mini-profile">
          <div className="avatar">{initials(user.name)}</div>
          <div>
            <strong>{user.name}</strong>
            <small>Buyer</small>
          </div>
        </div>
        <button onClick={() => navigate("account-settings")}>
          <Settings size={17} />
          Account Settings
        </button>
        <button onClick={onLogout}>
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </aside>
  );
}

// ---------- CategoryRow ----------
function CategoryRow({ onCategory }) {
  const cats = [
    ["📱", "Electronics"],
    ["👕", "Fashion"],
    ["🏠", "Home & Living"],
    ["💄", "Beauty & Health"],
    ["⚽", "Sports & Outdoors"],
    ["🎮", "Toys & Games"],
    ["🛒", "Groceries"],
  ];
  return (
    <div className="category-row">
      {cats.map(([icon, label]) => (
        <button key={label} onClick={() => onCategory?.(label)}>
          <span>{icon}</span>
          <small>{label}</small>
        </button>
      ))}
    </div>
  );
}

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
function ProductGrid({
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

// ---------- HomePage ----------
function HomePage({
  products,
  purchaseCategories,
  openProduct,
  add,
  wishlistIds,
  toggleWishlist,
  onCategory,
  go,
}) {
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const recommendedProducts =
    purchaseCategories.length ?
      products.filter((product) =>
        purchaseCategories.includes(product.category),
      )
    : products;
  const featuredProducts =
    showAllFeatured ? recommendedProducts : recommendedProducts.slice(0, 6);
  return (
    <div>
      <section className="hero">
        <div>
          <span className="pill">WELCOME TO VENDORA</span>
          <h1>
            Shop Smarter,
            <br />
            Live Better.
          </h1>
          <p>
            Discover amazing products, exclusive deals,
            <br />
            and trusted sellers — all in one place.
          </p>
          <button className="primary" onClick={() => go("categories")}>
            Shop Now <ChevronRight size={17} />
          </button>
        </div>
        <div className="hero-art">
          <div className="storefront">V</div>
          <span className="floating f1">%</span>
          <span className="floating f2">🛍️</span>
          <span className="floating f3">✦</span>
        </div>
      </section>
      <CategoryRow onCategory={onCategory} />
      <section id="featured-products" className="section-head">
        <div>
          <h2>
            {purchaseCategories.length ?
              "Based on your last purchase"
            : "Featured Products"}
          </h2>
          <p>
            {purchaseCategories.length ?
              `Products from ${purchaseCategories.join(" and ")}`
            : "Discover products picked for you"}
          </p>
        </div>
        <button
          className="text-btn"
          onClick={() => setShowAllFeatured(!showAllFeatured)}
        >
          {showAllFeatured ? "Show less" : "View all"}{" "}
          <ChevronRight size={15} />
        </button>
      </section>
      <ProductGrid
        products={featuredProducts}
        openProduct={openProduct}
        add={add}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
      />
    </div>
  );
}

// ---------- Catalog ----------
function Catalog({
  products,
  openProduct,
  add,
  categoryMode,
  deals,
  wishlist,
  wishlistIds,
  toggleWishlist,
}) {
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>
            {wishlist ?
              "Wishlist"
            : deals ?
              "Today's Deals"
            : categoryMode ?
              "All Products"
            : "Products"}
          </h1>
          <p>
            Showing {products.length} of {products.length} products
          </p>
        </div>
        <select>
          <option>Sort by: Featured</option>
          <option>Price: Low to High</option>
          <option>Rating</option>
        </select>
      </div>
      <div className="catalog-layout">
        <ProductGrid
          products={products}
          openProduct={openProduct}
          add={add}
          wishlistIds={wishlistIds}
          toggleWishlist={toggleWishlist}
        />
      </div>
    </div>
  );
}

// ---------- ProductDetail ----------
function ProductDetail({
  p,
  add,
  go,
  isWishlisted,
  toggleWishlist,
  onChatSeller,
  onOpenSeller,
  onReport,
}) {
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("Description");
  const [reviews] = useState(() => loadProductReviews(p));

  const addSelectedQuantity = () => add(p, qty);
  const averageRating =
    reviews.length ?
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : p.rating;
  const reviewCount = reviews.length || p.reviews;
  return (
    <div>
      <button className="back-btn" onClick={() => go("categories")}>
        <ArrowLeft size={16} /> Back to products
      </button>
      <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 12 }}>
        Sold by <strong style={{ color: "var(--text)" }}>{p.seller}</strong>
      </p>
      <div className="detail">
        <div className="detail-gallery">
          <ProductArt p={p} large />
          <div className="thumbs">
            <ProductArt p={p} />
            <ProductArt p={p} />
            <ProductArt p={p} />
          </div>
        </div>
        <div className="detail-copy">
          <span className="pill">{p.category}</span>
          <h1>{p.name}</h1>
          <div className="rating big">
            <Star size={17} fill="currentColor" /> {averageRating.toFixed(1)}{" "}
            <span>({reviewCount} reviews)</span>
          </div>
          <div className="price-line">
            <strong>{money(p.price)}</strong>
            <del>{money(p.old)}</del>
            <span className="discount">
              {Math.round((1 - p.price / p.old) * 100)}% OFF
            </span>
          </div>
          <p className="desc">
            High-quality product designed for comfort, reliability and everyday
            use. Carefully selected from trusted sellers on Vendora.
          </p>
          <ul className="check-list">
            <li>Bluetooth 5.0 / reliable performance</li>
            <li>Up to 20 hours battery life</li>
            <li>Comfortable all-day design</li>
            <li>Secure payment protection</li>
          </ul>
          <div className="buy-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>
                <Minus size={15} />
              </button>
              <b>{qty}</b>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button className="primary grow" onClick={addSelectedQuantity}>
              Add to Cart
            </button>
            <button className="outline icon-only">
              <Heart />
            </button>
          </div>
          <div className="trust">
            <span>
              <Truck /> Free Shipping
            </span>
            <span>
              <RotateCcw /> 7 Days Return
            </span>
            <span>
              <ShieldCheck /> Secure Payment
            </span>
          </div>
        </div>
      </div>
      <div
        className="form-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 18,
          marginBottom: 0,
        }}
      >
        <button
          onClick={() => onOpenSeller?.(p)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
          }}
        >
          <div className="avatar">{initials(p.seller)}</div>
          <div>
            <small
              style={{ display: "block", color: "var(--muted)", fontSize: 11 }}
            >
              Sold by
            </small>
            <strong style={{ display: "block", marginTop: 3, fontSize: 14 }}>
              {p.seller}
            </strong>
            <small
              style={{ display: "block", color: "var(--green)", fontSize: 11 }}
            >
              Verified seller
            </small>
          </div>
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="outline small"
            onClick={() => onChatSeller?.(p.seller)}
          >
            <MessageCircle size={14} /> Chat with Seller
          </button>
          <button
            className="outline small"
            onClick={() => toggleWishlist?.(p.id)}
          >
            <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} />{" "}
            {isWishlisted ? "Saved" : "Save item"}
          </button>
          <button className="outline small" onClick={onReport}>
            <Flag size={14} /> Report
          </button>
        </div>
      </div>
      <div className="tabs">
        {["Description", "Specifications", "Reviews"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "selected" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <section className="form-card" style={{ marginTop: 16 }}>
        {activeTab === "Description" && (
          <div>
            <h2>About this product</h2>
            <p className="desc">
              {p.name} is a carefully selected {p.category.toLowerCase()}{" "}
              product designed for dependable everyday use. Enjoy quality
              materials, practical features, and secure delivery through
              Vendora.
            </p>
            <ul className="check-list">
              <li>Quality checked by the seller</li>
              <li>Ready to ship from a trusted store</li>
              <li>Covered by Vendora buyer protection</li>
            </ul>
          </div>
        )}
        {activeTab === "Specifications" && (
          <div>
            <h2>Specifications</h2>
            <div className="summary-product">
              <span>Category</span>
              <b>{p.category}</b>
            </div>
            <div className="summary-product">
              <span>Availability</span>
              <b>{p.stock} in stock</b>
            </div>
            <div className="summary-product">
              <span>Items sold</span>
              <b>{p.sold}</b>
            </div>
            <div className="summary-product">
              <span>Product rating</span>
              <b>{p.rating} / 5</b>
            </div>
          </div>
        )}
        {activeTab === "Reviews" && (
          <div>
            <h2>Customer Reviews</h2>
            <div className="rating big">
              <Star size={17} fill="currentColor" /> {averageRating.toFixed(1)}{" "}
              <span>from {reviewCount} reviews</span>
            </div>
            {reviews.length ?
              reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: "14px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <strong>{review.name}</strong>
                  <div className="rating">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "var(--muted)",
                      fontSize: 12,
                    }}
                  >
                    {review.comment}
                  </p>
                </div>
              ))
            : <p style={{ color: "var(--muted)", fontSize: 12 }}>
                No customer reviews yet.
              </p>
            }
          </div>
        )}
      </section>
    </div>
  );
}

// ---------- ReviewSheet ----------
export function ReviewSheet({ user }) {
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  useEffect(() => {
    const open = (e) => {
      setProduct(e.detail);
      setRating(0);
      setComment("");
    };
    window.addEventListener("open-review", open);
    return () => window.removeEventListener("open-review", open);
  }, []);
  if (!product) return null;
  const submit = (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return;
    saveReview(user, product, rating, comment);
    setProduct(null);
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        background: "rgba(7,26,46,.5)",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        className="form-card"
        role="dialog"
        aria-modal="true"
        style={{ width: "min(430px,100%)", margin: 0 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Rate {product.name}</h2>
          <button
            type="button"
            className="icon-only"
            onClick={() => setProduct(null)}
          >
            <X size={17} />
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          How was the quality of this product?
        </p>
        <div style={{ display: "flex", gap: 5, margin: "16px 0" }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} stars`}
              onClick={() => setRating(value)}
              style={{
                fontSize: 28,
                color: value <= rating ? "#f2b84b" : "#cbd5dc",
              }}
            >
              ★
            </button>
          ))}
        </div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
          Comment
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience"
            required
            style={{
              display: "block",
              width: "100%",
              minHeight: 90,
              marginTop: 7,
              padding: 10,
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          />
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            className="outline"
            onClick={() => setProduct(null)}
          >
            Cancel
          </button>
          <button className="primary" type="submit" disabled={!rating}>
            Submit Review
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- SellerStore ----------
function SellerStore({ seller, products, openProduct, add, onReport }) {
  return (
    <div>
      <button className="back-btn" onClick={() => window.history.back()}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="page-title">
        <div>
          <h1>{seller}</h1>
          <p>Seller shop and available products</p>
        </div>
        <button className="outline small" onClick={onReport}>
          <Flag size={14} /> Report Shop
        </button>
      </div>
      <ProductGrid products={products} openProduct={openProduct} add={add} />
      {!products.length && (
        <div className="empty">
          <Package size={32} />
          <h3>This shop has no available products</h3>
        </div>
      )}
    </div>
  );
}

// ---------- ReportSheet ----------
export function ReportSheet({ product, user, onClose }) {
  const [reason, setReason] = useState("Scam or counterfeit product");
  const [details, setDetails] = useState("");
  const submit = (e) => {
    e.preventDefault();
    addReport({ product, user, reason, details });
    onClose();
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        background: "rgba(7,26,46,.5)",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        className="form-card"
        role="dialog"
        aria-modal="true"
        style={{ width: "min(430px,100%)", margin: 0 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Report {product.seller}</h2>
          <button type="button" className="icon-only" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Report a concern about {product.name}.
        </p>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
          Reason
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginTop: 7,
              padding: 10,
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          >
            <option>Scam or counterfeit product</option>
            <option>Misleading listing</option>
            <option>Unsafe or prohibited product</option>
            <option>Other concern</option>
          </select>
        </label>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            marginTop: 14,
          }}
        >
          Details
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
            style={{
              display: "block",
              width: "100%",
              minHeight: 90,
              marginTop: 7,
              padding: 10,
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          />
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button type="button" className="outline" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- OrderSummary ----------
function OrderSummary({ subtotal, shipping, go }) {
  return (
    <aside className="summary">
      <h2>Order Summary</h2>
      <div>
        <span>Subtotal</span>
        <b>{money(subtotal)}</b>
      </div>
      <div>
        <span>Shipping</span>
        <b>{shipping ? money(shipping) : "Free"}</b>
      </div>
      <hr />
      <div className="total">
        <span>Total</span>
        <b>{money(subtotal + shipping)}</b>
      </div>
      <input placeholder="Enter promo code" />
      <button className="primary full" onClick={() => go("checkout")}>
        Proceed to Checkout
      </button>
      <button className="outline full" onClick={() => go("categories")}>
        Continue Shopping
      </button>
    </aside>
  );
}

// ---------- Cart ----------
function Cart({ cart, setCart, quantities, setQuantities, go }) {
  const subtotal = cart.reduce(
      (sum, p) => sum + p.price * (quantities[p.id] || 1),
      0,
    ),
    shipping = cart.length ? 50 : 0;
  const changeQuantity = (id, delta) => {
    const next = (quantities[id] || 1) + delta;
    if (next <= 0) {
      setCart(cart.filter((item) => item.id !== id));
      setQuantities({ ...quantities, [id]: 0 });
    } else setQuantities({ ...quantities, [id]: next });
  };
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>
            Your Cart{" "}
            <span className="count">
              {cart.reduce((sum, p) => sum + (quantities[p.id] || 1), 0)}
            </span>
          </h1>
          <p>Review your items before checkout</p>
        </div>
      </div>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((p) => (
            <div className="cart-item" key={p.id}>
              <ProductArt p={p} />
              <div className="cart-name">
                <h3>{p.name}</h3>
                <small>
                  {p.category} · Sold by {p.seller}
                </small>
              </div>
              <div className="qty">
                <button
                  onClick={() => changeQuantity(p.id, -1)}
                  aria-label={`Decrease ${p.name}`}
                >
                  <Minus size={14} />
                </button>
                <b>{quantities[p.id] || 1}</b>
                <button
                  onClick={() => changeQuantity(p.id, 1)}
                  aria-label={`Increase ${p.name}`}
                >
                  +
                </button>
              </div>
              <strong>{money(p.price * (quantities[p.id] || 1))}</strong>
              <button
                className="delete"
                onClick={() => {
                  setCart(cart.filter((item) => item.id !== p.id));
                  setQuantities({ ...quantities, [p.id]: 0 });
                }}
                aria-label={`Remove ${p.name}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!cart.length && (
            <div className="empty">
              <ShoppingCart size={38} />
              <h3>Your cart is empty</h3>
              <button className="primary" onClick={() => go("categories")}>
                Continue Shopping
              </button>
            </div>
          )}
          <button className="continue" onClick={() => go("categories")}>
            <ArrowLeft size={15} /> Continue Shopping
          </button>
        </div>
        <OrderSummary subtotal={subtotal} shipping={shipping} go={go} />
      </div>
    </div>
  );
}

// ---------- Checkout ----------
function Checkout({ user, cart, quantities, go, onPlaceOrder }) {
  const total =
    cart.reduce((sum, p) => sum + p.price * (quantities[p.id] || 1), 0) +
    (cart.length ? 50 : 0);
  return (
    <div>
      <button className="back-btn" onClick={() => go("cart")}>
        <ArrowLeft size={16} /> Back to cart
      </button>
      <div className="checkout-steps">
        <span className="done">1 Shipping</span>
        <span>2 Payment</span>
        <span>3 Confirmation</span>
      </div>
      <div className="checkout-layout">
        <div>
          <div className="form-card">
            <h2>Shipping Address</h2>
            <div className="address">
              <MapPin />
              <div>
                <b>{user.name}</b>
                <p>
                  {user.address || "Add your address in Account Settings"}
                  <br />
                  {user.phone || "Add your phone number in Account Settings"}
                </p>
              </div>
              <button
                className="text-btn"
                onClick={() => go("account-settings")}
              >
                Change
              </button>
            </div>
          </div>
          <div className="form-card">
            <h2>Delivery Method</h2>
            <label className="radio">
              <input type="radio" defaultChecked name="ship" />{" "}
              <span>
                Standard Shipping <small>3–5 days</small>
              </span>
              <b>₱50</b>
            </label>
            <label className="radio">
              <input type="radio" name="ship" />{" "}
              <span>
                Express Shipping <small>1–2 days</small>
              </span>
              <b>₱120</b>
            </label>
          </div>
          <div className="form-card">
            <h2>Payment Method</h2>
            <label className="radio">
              <input type="radio" defaultChecked name="pay" />{" "}
              <span>Cash on Delivery</span>
            </label>
            <label className="radio">
              <input type="radio" name="pay" />{" "}
              <span>GCash / Card / PayPal</span>
            </label>
          </div>
        </div>
        <aside className="summary">
          <h2>Order Summary</h2>
          {cart.map((p) => (
            <div className="summary-product" key={p.id}>
              <span>
                {p.name} × {quantities[p.id] || 1}
              </span>
              <b>{money(p.price * (quantities[p.id] || 1))}</b>
            </div>
          ))}
          <hr />
          <div className="total">
            <span>Total</span>
            <b>{money(total)}</b>
          </div>
          <button className="primary full" onClick={onPlaceOrder}>
            Place Order
          </button>
        </aside>
      </div>
    </div>
  );
}

// ---------- BuyerOrders ----------
function BuyerOrders({ user }) {
  const orderKey = `vendora-orders-${user.email}`;
  const [orderList, setOrderList] = useState(() =>
    JSON.parse(localStorage.getItem(orderKey) || "[]"),
  );
  useEffect(
    () => localStorage.setItem(orderKey, JSON.stringify(orderList)),
    [orderKey, orderList],
  );
  useEffect(() => {
    const refresh = (event) => {
      if (event.key === orderKey && event.newValue)
        setOrderList(JSON.parse(event.newValue));
    };
    const refreshVisible = () =>
      setOrderList(JSON.parse(localStorage.getItem(orderKey) || "[]"));
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [orderKey]);
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order changes stay local to this buyer and are persisted by the effect above.
  const cancelOrder = (id) =>
    setOrderList((list) => list.filter((order) => order.id !== id));
  const requestReturn = (id) =>
    setOrderList((list) =>
      list.map((order) =>
        order.id === id ? { ...order, status: "Return Requested" } : order,
      ),
    );

  // Reviews use the existing review sheet, so React owns the button state.
  const rateDeliveredOrder = (order) => {
    const product = order.products?.[0];
    if (product)
      window.dispatchEvent(new CustomEvent("open-review", { detail: product }));
  };
  const visibleOrders = orderList.filter(
    (order) => filter === "All" || order.status === filter,
  );
  const getOrderCount = (status) =>
    status === "All" ?
      orderList.length
    : orderList.filter((order) => order.status === status).length;

  const renderOrderAction = (order) => {
    if (["Processing", "Pending"].includes(order.status))
      return (
        <button className="text-btn" onClick={() => cancelOrder(order.id)}>
          Cancel Order
        </button>
      );
    if (order.status === "Delivered")
      return (
        <button className="text-btn" onClick={() => requestReturn(order.id)}>
          Refund / Return
        </button>
      );
    return (
      <span style={{ fontSize: 11, color: "var(--muted)" }}>No actions</span>
    );
  };
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>My Orders</h1>
          <p>Track and manage your purchases</p>
        </div>
      </div>
      <div className="tabs">
        {[
          "All",
          "Pending",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
        ].map((status) => (
          <button
            key={status}
            className={filter === status ? "selected" : ""}
            onClick={() => setFilter(status)}
          >
            {status} ({getOrderCount(status)})
          </button>
        ))}
      </div>
      <div className="table-card">
        {visibleOrders.length ?
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>View</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.id}</b>
                  </td>
                  <td>{o.date}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <Status>{o.status}</Status>
                  </td>
                  <td>
                    <button
                      className="text-btn"
                      onClick={() => setSelectedOrder(o)}
                    >
                      View
                    </button>
                  </td>
                  <td>
                    {o.status === "Delivered" ?
                      <button
                        className="outline small"
                        onClick={() => rateDeliveredOrder(o)}
                      >
                        ☆ Rating
                      </button>
                    : <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        Available after delivery
                      </span>
                    }
                  </td>
                  <td>{renderOrderAction(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        : <div className="empty">
            <Package size={32} />
            <h3>No {filter.toLowerCase()} orders</h3>
          </div>
        }
      </div>
      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "grid",
            placeItems: "center",
            background: "rgba(7,26,46,.45)",
            padding: 20,
          }}
        >
          <div
            className="form-card"
            role="dialog"
            aria-modal="true"
            style={{
              width: "min(520px,100%)",
              maxHeight: "85vh",
              overflowY: "auto",
              margin: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Order {selectedOrder.id}</h2>
              <button
                className="icon-only"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="summary-product">
              <span>Status</span>
              <b>
                <Status>{selectedOrder.status}</Status>
              </b>
            </div>
            <div className="summary-product">
              <span>Order date</span>
              <b>{selectedOrder.date}</b>
            </div>
            <div className="summary-product">
              <span>Expected arrival</span>
              <b>{selectedOrder.expectedDate || "3–5 days after shipment"}</b>
            </div>
            <h3 style={{ fontSize: 13, marginTop: 18 }}>Products purchased</h3>
            {(selectedOrder.products || []).map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                {product.image ?
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: 54,
                      height: 54,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                : <div className="avatar">📦</div>}
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 12 }}>
                    {product.name}
                  </strong>
                  <small
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: "var(--muted)",
                      fontSize: 11,
                    }}
                  >
                    Shop: {product.shop}
                  </small>
                  <small
                    style={{
                      display: "block",
                      marginTop: 3,
                      color: "var(--muted)",
                      fontSize: 11,
                    }}
                  >
                    Qty: {product.quantity} · {money(product.price)} each
                  </small>
                </div>
                <b>{money(product.price * product.quantity)}</b>
              </div>
            ))}
            <div className="total" style={{ marginTop: 16 }}>
              <span>Total</span>
              <b>{money(selectedOrder.total)}</b>
            </div>
            <button
              className="primary full"
              onClick={() => setSelectedOrder(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- AccountSettings ----------
function AccountSettings({ user, onUpdate }) {
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: user.address || "",
    age: user.age || "",
    sex: user.sex || "",
  });
  const [notifications, setNotifications] = useState({
    orders: true,
    deals: true,
    messages: false,
  });
  const [saved, setSaved] = useState(false);
  const updateProfile = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };
  const toggleNotification = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    setSaved(false);
  };

  return (
    <div className="buyer-account-settings">
      <div className="page-title">
        <div>
          <h1>Account Settings</h1>
          <p>Manage your personal information and communication preferences.</p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUpdate(profile);
          setSaved(true);
        }}
      >
        <div className="form-card">
          <h2>Personal Information</h2>
          <div className="fields">
            <label>
              Full Name
              <input
                name="name"
                value={profile.name}
                onChange={updateProfile}
              />
            </label>
            <label>
              Email Address
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={updateProfile}
              />
            </label>
            <label>
              Phone Number
              <input
                name="phone"
                value={profile.phone}
                onChange={updateProfile}
              />
            </label>
            <label>
              Address
              <input
                name="address"
                value={profile.address}
                onChange={updateProfile}
                placeholder="Enter your address"
              />
            </label>
            <label>
              Age
              <input
                name="age"
                type="number"
                min="1"
                max="120"
                value={profile.age}
                onChange={updateProfile}
                placeholder="Enter your age"
              />
            </label>
            <label>
              Sex
              <select name="sex" value={profile.sex} onChange={updateProfile}>
                <option value="">Select sex</option>
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </select>
            </label>
          </div>
        </div>
        <div className="form-card">
          <h2>Notifications</h2>
          {[
            [
              "orders",
              "Order updates",
              "Get status changes for your purchases.",
            ],
            [
              "deals",
              "Deals and recommendations",
              "Receive curated offers from Vendora.",
            ],
            ["messages", "Messages", "Be notified when sellers reply."],
          ].map(([key, title, description]) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span>
                <strong style={{ display: "block", fontSize: 13 }}>
                  {title}
                </strong>
                <small
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "var(--muted)",
                    fontSize: 11,
                  }}
                >
                  {description}
                </small>
              </span>
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={() => toggleNotification(key)}
                style={{ width: 17, height: 17, accentColor: "var(--green)" }}
              />
            </label>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="primary" type="submit">
            Save Changes
          </button>
          {saved && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "var(--green)",
                fontSize: 12,
              }}
            >
              <CheckCircle2 size={16} /> Changes saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// ---------- BuyerRoutes ----------
export function BuyerRoutes({
  user,
  page,
  go,
  selected,
  setSelected,
  cart,
  setCart,
  quantities,
  setQuantities,
  wishlistIds,
  toggleWishlist,
  add,
  openProduct,
  storefrontProducts,
  filteredStorefront,
  purchaseCategories,
  selectCategory,
  messageTarget,
  setMessageTarget,
  setReportProduct,
  updateUser,
  onPlaceOrder,
}) {
  if (page === "product")
    return (
      <ProductDetail
        p={selected}
        add={add}
        go={go}
        isWishlisted={wishlistIds.includes(selected.id)}
        toggleWishlist={toggleWishlist}
        onChatSeller={(seller) => {
          setMessageTarget(seller);
          go("messages");
        }}
        onOpenSeller={(seller) => {
          setSelected(seller);
          go("seller-store");
        }}
        onReport={() => setReportProduct(selected)}
      />
    );
  if (page === "seller-store")
    return (
      <SellerStore
        seller={selected.seller}
        products={storefrontProducts.filter(
          (product) => product.seller === selected.seller,
        )}
        openProduct={openProduct}
        add={add}
        onReport={() => setReportProduct(selected)}
      />
    );
  if (page === "cart")
    return (
      <Cart
        cart={cart}
        setCart={setCart}
        quantities={quantities}
        setQuantities={setQuantities}
        go={go}
      />
    );
  if (page === "checkout")
    return (
      <Checkout
        user={user}
        cart={cart}
        quantities={quantities}
        go={go}
        onPlaceOrder={onPlaceOrder}
      />
    );
  if (page === "orders") return <BuyerOrders user={user} />;
  if (page === "categories")
    return (
      <Catalog
        products={filteredStorefront}
        openProduct={openProduct}
        add={add}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
        categoryMode
      />
    );
  if (page === "deals")
    return (
      <Catalog
        products={filteredStorefront.filter(
          (product) => product.old > product.price,
        )}
        openProduct={openProduct}
        add={add}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
        deals
      />
    );
  if (page === "wishlist")
    return (
      <Catalog
        products={filteredStorefront.filter((product) =>
          wishlistIds.includes(product.id),
        )}
        openProduct={openProduct}
        add={add}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
        wishlist
      />
    );
  if (page === "messages")
    return <Messages user={user} target={messageTarget} />;
  if (page === "account-settings")
    return <AccountSettings user={user} onUpdate={updateUser} />;
  return (
    <HomePage
      products={filteredStorefront}
      purchaseCategories={purchaseCategories}
      openProduct={openProduct}
      add={add}
      wishlistIds={wishlistIds}
      toggleWishlist={toggleWishlist}
      onCategory={selectCategory}
      go={go}
    />
  );
}
