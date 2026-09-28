import "../src/styles/App.css";
import { useEffect, useState } from "react";
import { products } from "./data/products";

import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import Topbar from "./components/Topbar";
import ModerationSidebar from "./components/ModerationSidebar";

import {
  BuyerSidebar,
  BuyerRoutes,
  CategoryNav,
  ReviewSheet,
  ReportSheet,
} from "./buyer/BuyerDashboard";

import { SellerSidebar, SellerRoutes } from "./seller/SellerDashboard";

import AdminModeration from "./admin/AdminModeration";
import StaffModeration from "./staff/StaffModeration";

import {
  loadStoredUser,
  persistLogin,
  persistUserUpdate,
  clearStoredUser,
} from "./logic/auth";
import { loadWishlist, saveWishlist } from "./logic/wishlist";
import {
  getStorefrontProducts,
  filterProducts,
  saveSellerProduct,
} from "./logic/products";
import {
  purgeLegacyOrders,
  loadPurchaseCategories,
  placeOrder,
} from "./logic/orders";

export default function App() {
  const [user, setUser] = useState(() => loadStoredUser());
  const [authView, setAuthView] = useState("login");
  const [mode, setMode] = useState(() => {
    const stored = loadStoredUser();
    return stored?.role === "seller" ? "seller" : "buyer";
  });
  const [page, setPage] = useState(() => {
    if (user?.role === "admin") return "admin-dashboard";
    if (user?.role === "staff") return "staff-dashboard";
    if (user?.role === "seller") return "seller-dashboard";
    return "home";
  });
  const [selected, setSelected] = useState(products[0]);
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [wishlistIds, setWishlistIds] = useState(() => loadWishlist(user));
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState("");
  const [reportProduct, setReportProduct] = useState(null);
  const [, setProductVersion] = useState(0);
  const userEmail = user?.email || "";
  const isModerator = user?.role === "admin" || user?.role === "staff";

  // Removes obsolete demo orders once when the app first starts.
  useEffect(() => {
    purgeLegacyOrders();
  }, []);
  const [purchaseCategories, setPurchaseCategories] = useState(() =>
    user ? loadPurchaseCategories(user) : [],
  );

  // Read listings on each app render; the refresh counter above forces a render after seller changes.
  const storefrontProducts = userEmail ? getStorefrontProducts() : [];
  const filteredStorefront = filterProducts(storefrontProducts, query);

  const go = (nextPage) => setPage(nextPage);

  // Category selection also returns the buyer to the storefront product section.
  const selectCategory = (category) => {
    setQuery(category);
    setPage("home");
    setTimeout(
      () =>
        document
          .getElementById("featured-products")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  };
  const openProduct = (product) => {
    setSelected(product);
    setPage("product");
  };
  // Keeps one cart entry per product and stores the selected quantity separately.
  const add = (p, quantity = 1) => {
    const amount = Math.max(1, Number(quantity) || 1);
    setCart((c) => (c.some((x) => x.id === p.id) ? c : [...c, p]));
    setQuantities((q) => ({ ...q, [p.id]: (q[p.id] || 0) + amount }));
  };
  const toggleWishlist = (id) =>
    setWishlistIds((ids) =>
      ids.includes(id) ? ids.filter((itemId) => itemId !== id) : [...ids, id],
    );
  useEffect(() => {
    if (!userEmail) return;
    saveWishlist(userEmail, wishlistIds);
  }, [userEmail, wishlistIds]);
  const cartCount = cart.reduce(
    (total, p) => total + (quantities[p.id] || 1),
    0,
  );
  // Reset account-specific state before loading data for the newly signed-in user.
  const login = (nextUser, remember) => {
    const storedUser = persistLogin(nextUser, remember);
    setUser(storedUser);
    setWishlistIds(loadWishlist(storedUser));
    setPurchaseCategories(loadPurchaseCategories(storedUser));
    setCart([]);
    setQuantities({});
    setQuery("");
    setMode(storedUser.role === "seller" ? "seller" : "buyer");
    setPage(
      storedUser.role === "admin" ? "admin-dashboard"
      : storedUser.role === "staff" ? "staff-dashboard"
      : storedUser.role === "seller" ? "seller-dashboard"
      : "home",
    );
    setAuthView("login");
  };
  const updateUser = (nextUser) => setUser(persistUserUpdate(user, nextUser));
  const addSellerProduct = (product) => {
    saveSellerProduct(user, product);
    // Local storage does not trigger React renders, so refresh the buyer catalogue explicitly.
    setProductVersion((version) => version + 1);
    setPage("products");
  };
  const handlePlaceOrder = () => {
    // Prevent an empty cart from creating a placeholder order.
    if (!cart.length) {
      setPage("cart");
      return;
    }
    setPurchaseCategories(placeOrder({ user, cart, quantities }));
    setCart([]);
    setQuantities({});
    setPage("orders");
  };
  const logout = () => {
    clearStoredUser();
    setUser(null);
    setCart([]);
    setQuantities({});
    setWishlistIds([]);
    setPurchaseCategories([]);
    setMobileOpen(false);
    setPage("home");
  };

  const switchMode = () => {
    if (mode === "buyer") {
      setMode("seller");
      setPage("seller-dashboard");
      return;
    }
    // Reload seller listings before returning to the buyer catalogue.
    setProductVersion((version) => version + 1);
    setMode("buyer");
    setPage("home");
  };

  // Explicit auth routing keeps each screen ready for a separate backend endpoint.
  const renderAuthScreen = () => {
    if (authView === "register")
      return (
        <RegisterPage
          onRegister={login}
          onGoToLogin={() => setAuthView("login")}
        />
      );

    return (
      <LoginPage
        onLogin={login}
        onGoToRegister={() => setAuthView("register")}
      />
    );
  };

  const renderSidebar = () => {
    if (user.role === "admin" || user.role === "staff")
      return (
        <ModerationSidebar
          user={user}
          page={page}
          setPage={go}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onLogout={logout}
        />
      );
    if (mode === "buyer")
      return (
        <BuyerSidebar
          user={user}
          page={page}
          setPage={go}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onLogout={logout}
          cartCount={cartCount}
        />
      );
    return (
      <SellerSidebar
        user={user}
        page={page}
        setPage={go}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={logout}
      />
    );
  };

  // Each role owns its route renderer, keeping backend role checks easy to mirror later.
  const renderContent = () => {
    if (user.role === "admin")
      return <AdminModeration page={page} go={go} user={user} />;
    if (user.role === "staff")
      return <StaffModeration page={page} go={go} user={user} />;
    if (mode === "seller")
      return (
        <SellerRoutes
          user={user}
          page={page}
          go={go}
          updateUser={updateUser}
          onSaveProduct={addSellerProduct}
        />
      );
    return (
      <BuyerRoutes
        user={user}
        page={page}
        go={go}
        selected={selected}
        setSelected={setSelected}
        cart={cart}
        setCart={setCart}
        quantities={quantities}
        setQuantities={setQuantities}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
        add={add}
        openProduct={openProduct}
        storefrontProducts={storefrontProducts}
        filteredStorefront={filteredStorefront}
        purchaseCategories={purchaseCategories}
        selectCategory={selectCategory}
        messageTarget={messageTarget}
        setMessageTarget={setMessageTarget}
        setReportProduct={setReportProduct}
        updateUser={updateUser}
        onPlaceOrder={handlePlaceOrder}
      />
    );
  };

  if (!user) return renderAuthScreen();

  return (
    <div className="app-shell">
      {renderSidebar()}
      <main className="app-main">
        <Topbar
          user={user}
          onMenu={() => setMobileOpen(true)}
          onSearch={setQuery}
          onAccountSettings={() => setPage("account-settings")}
          onSwitchMode={switchMode}
          onNotification={(type) => setPage(type)}
          onLogout={logout}
          onCart={() => setPage("cart")}
          cartCount={cartCount}
          seller={mode === "seller"}
          moderation={isModerator}
        />
        {!isModerator && <ReviewSheet user={user} />}
        {reportProduct && (
          <ReportSheet
            product={reportProduct}
            user={user}
            onClose={() => setReportProduct(null)}
          />
        )}
        {!isModerator &&
          mode === "buyer" &&
          (page === "home" || page === "categories") && (
            <CategoryNav
              context={page === "home" ? "home" : "categories"}
              page={page}
              query={query}
              onCategory={
                page === "categories" ?
                  (category) => {
                    setQuery(category);
                    setPage("categories");
                  }
                : selectCategory
              }
            />
          )}
        {!isModerator && (
          <div className="app-modebar">
            <div>
              <span className="app-mode-label">DEMO PROTOTYPE</span>
              <strong>
                {mode === "buyer" ? "Customer Storefront" : "Seller Center"}
              </strong>
            </div>
          </div>
        )}
        <div className="app-content">{renderContent()}</div>
      </main>
    </div>
  );
}
