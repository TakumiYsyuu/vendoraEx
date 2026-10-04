import "../styles/BuyerDashboard.css";
import { useState } from "react";
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
  CheckCircle2,
} from "lucide-react";
import ProductArt from "../components/ProductArt";
import Messages from "../components/Messages";
import { money, initials } from "../utils/helpers";
import { loadProductReviews } from "../logic/reviews";
import ProductGrid from "./ProductGrid";
import ReviewSheet from "./ReviewSheet";
import ReportSheet from "./ReportSheet";
import SellerStore from "./SellerStore";
import Cart from "./Cart";
import Checkout from "./Checkout";
import BuyerOrders from "./BuyerOrders";

export { ReviewSheet, ReportSheet };

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
