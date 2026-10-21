import "../src/styles/App.css";
import { useEffect, useRef, useState } from "react";
import { products } from "./data/products";

import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import Forget from "./auth/Forget";
import Topbar from "./components/Topbar";
import ModerationSidebar from "./components/ModerationSidebar";

import {
  BuyerSidebar,
  BuyerRoutes,
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

import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "./logic/wishlist";

import {
  fetchStorefrontProducts,
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
  const [wishlistIds, setWishlistIds] = useState([]);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState("");
  const [reportProduct, setReportProduct] = useState(null);
  const [storefrontProducts, setStorefrontProducts] = useState([]); // CHANGED
  const userEmail = user?.email || "";
  const isModerator = user?.role === "admin" || user?.role === "staff";

  const refreshProducts = () =>
    fetchStorefrontProducts()
      .then((list) => {
        setStorefrontProducts(list);
      })
      .catch((err) => console.error("Failed to load products:", err));

  useEffect(() => {
    if (!userEmail) {
      setStorefrontProducts([]);
      return;
    }
    refreshProducts();
  }, [userEmail]);

  useEffect(() => {
    purgeLegacyOrders();
  }, []);
  const [purchaseCategories, setPurchaseCategories] = useState(() =>
    user ? loadPurchaseCategories(user) : [],
  );

  // CHANGED: storefrontProducts now comes from state (database), not localStorage
  const filteredStorefront = filterProducts(storefrontProducts, query);

  const skipClear = useRef(false);
  useEffect(() => {
    if (skipClear.current) {
      skipClear.current = false;
      return;
    }
    setQuery("");
  }, [page]);

  const handleSearch = (value) => {
    setQuery(value);
    const browsing = ["home", "categories", "deals", "wishlist"];
    if (value.trim() && !browsing.includes(page)) {
      skipClear.current = true;
      setPage("categories");
    }
  };

  const go = (nextPage) => setPage(nextPage);

  // Category selection also returns the buyer to the storefront product section.
  const selectCategory = (category) => {
    if (page !== "home") skipClear.current = true;
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

  // Load this user's wishlist from the database
  useEffect(() => {
    if (!userEmail) {
      setWishlistIds([]);
      return;
    }
    fetchWishlist()
      .then(setWishlistIds)
      .catch((err) => console.error("Failed to load wishlist:", err));
  }, [userEmail]);

  // Updates the heart instantly, then saves; undoes it if the save fails
  const toggleWishlist = (id) => {
    const saved = wishlistIds.includes(id);
    setWishlistIds((ids) =>
      saved ? ids.filter((i) => i !== id) : [...ids, id],
    );
    (saved ? removeFromWishlist(id) : addToWishlist(id)).catch(() => {
      setWishlistIds((ids) =>
        saved ? [...ids, id] : ids.filter((i) => i !== id),
      );
    });
  };

  const cartCount = cart.reduce(
    (total, p) => total + (quantities[p.id] || 1),
    0,
  );
  // Reset account-specific state before loading data for the newly signed-in user.
  const login = (nextUser, remember) => {
    const storedUser = persistLogin(nextUser, remember);
    setUser(storedUser);
    setWishlistIds([]);
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
    refreshProducts(); // CHANGED: was setProductVersion
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
    setStorefrontProducts([]); // CHANGED
    setMobileOpen(false);
    setPage("home");
  };

  const switchMode = () => {
    if (mode === "buyer") {
      setMode("seller");
      setPage("seller-dashboard");
      return;
    }
    refreshProducts(); // CHANGED: reload so new seller products show up
    setMode("buyer");
    setPage("home");
  };

  const renderAuthScreen = () => {
    if (authView === "register")
      return (
        <RegisterPage
          onRegister={login}
          onGoToLogin={() => setAuthView("login")}
        />
      );

    if (authView === "forgot")
      return <Forget onBackToLogin={() => setAuthView("login")} />;

    return (
      <LoginPage
        onLogin={login}
        onGoToRegister={() => setAuthView("register")}
        onGoToForgotPassword={() => setAuthView("forgot")}
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
          onSearch={handleSearch}
          query={query}
          onAccountSettings={() => setPage("account-settings")}
          onSwitchMode={switchMode}
          onNotification={(type) => {
            if (type === "messages") setPage("messages");
            else if (type === "orders") setPage("orders");
            else setPage(mode === "seller" ? "seller-dashboard" : "home");
            setMobileOpen(false);
          }}
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

        <div className="app-content">{renderContent()}</div>
      </main>
    </div>
  );
}
