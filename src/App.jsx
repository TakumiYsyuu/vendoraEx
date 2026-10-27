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
  saveProfile,
  fetchProfile,
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

import {
  fetchCart,
  addCartItem,
  setCartQuantity,
  removeCartItem,
} from "./logic/cart";

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
  const [storefrontProducts, setStorefrontProducts] = useState([]);
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

  // Sessions saved before the address existed don't have it yet: refresh from the server
  useEffect(() => {
    if (!userEmail || isModerator) return;
    fetchProfile()
      .then((p) => setUser((u) => (u ? persistUserUpdate(u, p) : u)))
      .catch(() => {});
  }, [userEmail]);
  const [purchaseCategories, setPurchaseCategories] = useState(() =>
    user ? loadPurchaseCategories(user) : [],
  );

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

  // ---------- CART (saved in the database) ----------
  // Loads the saved cart from the server into the cart + quantities state.
  const reloadCart = () =>
    fetchCart()
      .then((items) => {
        setCart(items.map(({ quantity, ...product }) => product));
        setQuantities(
          Object.fromEntries(items.map((item) => [item.id, item.quantity])),
        );
      })
      .catch((err) => console.error("Failed to load cart:", err));

  useEffect(() => {
    if (!userEmail || isModerator) {
      setCart([]);
      setQuantities({});
      return;
    }
    reloadCart();
  }, [userEmail]);

  // Keeps one cart entry per product, updates the screen instantly, then saves it.
  const add = (p, quantity = 1) => {
    const amount = Math.max(1, Number(quantity) || 1);
    setCart((c) => (c.some((x) => x.id === p.id) ? c : [...c, p]));
    setQuantities((q) => ({ ...q, [p.id]: (q[p.id] || 0) + amount }));
    addCartItem(p.id, amount)
      .then(reloadCart) // picks up the real quantity (the server limits it to the stock)
      .catch((err) => {
        alert(err.message);
        reloadCart();
      });
  };

  // Cart.jsx still calls setCart / setQuantities. These wrappers do the same
  // thing as before AND save the change (remove item / new quantity) in the database.
  const syncSetCart = (next) => {
    const nextCart = typeof next === "function" ? next(cart) : next;
    const keep = new Set(nextCart.map((p) => p.id));
    cart
      .filter((p) => !keep.has(p.id))
      .forEach((p) => removeCartItem(p.id).catch(reloadCart));
    setCart(nextCart);
  };

  const syncSetQuantities = (next) => {
    const nextQuantities = typeof next === "function" ? next(quantities) : next;
    Object.keys(nextQuantities).forEach((id) => {
      if (nextQuantities[id] === quantities[id]) return;
      const save =
        nextQuantities[id] > 0 ?
          setCartQuantity(id, nextQuantities[id])
        : removeCartItem(id);
      save.catch(reloadCart);
    });
    setQuantities(nextQuantities);
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
  // Buyer Account Settings: save to the database first, then update the screen
  const saveBuyerProfile = async (profile) => {
    const saved = await saveProfile(profile);
    setUser(persistUserUpdate(user, { ...profile, ...saved }));
  };
  const addSellerProduct = (product) => {
    saveSellerProduct(user, product);
    refreshProducts();
    setPage("products");
  };

  const handlePlaceOrder = async () => {
    // Prevent an empty cart from creating a placeholder order.
    if (!cart.length) {
      setPage("cart");
      return;
    }
    try {
      if (!user.address) {
        alert("Please add your delivery address in Account Settings first.");
        setPage("account-settings");
        return;
      }
      const categories = await placeOrder({
        user,
        cart,
        quantities,
        shipping: {
          name: user.name,
          phone: user.phone,
          address: user.address,
        },
      });
      setPurchaseCategories(categories);
      setCart([]); // the server already removed these items from the saved cart
      setQuantities({});
      setPage("orders");
      refreshProducts(); // stock changed
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
    setCart([]);
    setQuantities({});
    setWishlistIds([]);
    setPurchaseCategories([]);
    setStorefrontProducts([]);
    setMobileOpen(false);
    setPage("home");
  };

  const switchMode = () => {
    if (mode === "buyer") {
      setMode("seller");
      setPage("seller-dashboard");
      return;
    }
    refreshProducts();
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
        setCart={syncSetCart}
        quantities={quantities}
        setQuantities={syncSetQuantities}
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
        updateUser={saveBuyerProfile}
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
