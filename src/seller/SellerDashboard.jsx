import { useEffect, useState } from "react";
import "../styles/SellerDashboard.css";
import {
  Home,
  Package,
  ShoppingCart,
  MessageCircle,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import ProductArt from "../components/ProductArt";
import Status from "../components/Status";
import Messages from "../components/Messages";
import { initials } from "../utils/helpers";
import { fetchSellerOrders, money } from "../logic/orders";
import Stat from "./Stat";
import SellerProducts from "./SellerProducts";
import SellerOrders from "./SellerOrders";
import AddProduct from "./AddProduct";
import ShopSettings from "./ShopSettings";

const readList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

// ---------- SellerSidebar ----------
export function SellerSidebar({
  user,
  page,
  setPage,
  mobileOpen,
  setMobileOpen,
  onLogout,
}) {
  const items = [
    [Home, "Dashboard", "seller-dashboard"],
    [Package, "My Products", "products"],
    [ShoppingCart, "Orders", "seller-orders"],
    [MessageCircle, "Messages", "messages"],
    [Settings, "Shop Settings", "settings"],
  ];
  return (
    <aside className={"sidebar seller-side " + (mobileOpen ? "open" : "")}>
      <div className="brand side-brand">
        <span className="brand-mark">V</span>
        <span>Vendora</span>
      </div>
      <button className="close-mobile" onClick={() => setMobileOpen(false)}>
        <X />
      </button>
      <nav>
        {items.map(([Icon, label, key]) => (
          <button
            className={page === key ? "active" : ""}
            key={key}
            onClick={() => {
              setPage(key);
              setMobileOpen(false);
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="mini-profile">
          <div className="avatar">{initials(user.name)}</div>
          <div>
            <strong>{user.name}</strong>
            <small>Seller</small>
          </div>
        </div>
        <button onClick={onLogout}>
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </aside>
  );
}

// ---------- DashboardHeader ----------
function DashboardHeader({ title, subtitle }) {
  return (
    <div className="dash-banner">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="banner-art">V</div>
    </div>
  );
}

// ---------- Recent orders (dashboard preview, read-only) ----------
function RecentOrdersTable({ orders }) {
  return (
    <div className="recent-orders-wrap">
      <table className="recent-orders">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 5).map((o) => (
            <tr key={o.id}>
              <td>
                <b>{o.code}</b>
              </td>
              <td>{o.buyerName}</td>
              <td>{money(o.total)}</td>
              <td>
                <span className="status-cell">
                  <Status>{o.status}</Status>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- SellerDashboard ----------
function SellerDashboard({ user, go }) {
  const [sellerOrders, setSellerOrders] = useState([]);
  const sellerProducts = readList(`vendora-products-${user.email}`);

  useEffect(() => {
    fetchSellerOrders()
      .then(setSellerOrders)
      .catch((err) => console.error("Failed to load seller orders:", err));
  }, []);

  const pendingCount = sellerOrders.filter(
    (order) => order.status === "Pending",
  ).length;
  const totalSales = sellerOrders
    .filter((order) => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);

  return (
    <div>
      <DashboardHeader
        title="Store Overview"
        subtitle="Here’s your daily shop performance and order activity."
      />
      <div className="stats">
        <Stat
          title="Total Sales"
          value={money(totalSales)}
          trend={sellerOrders.length ? "Completed orders" : "No orders"}
          note="from customer orders"
        />
        <Stat
          title="Total Orders"
          value={sellerOrders.length}
          trend={sellerOrders.length ? "Total orders" : "No orders"}
          note="from customers"
        />
        <Stat
          title="Active Products"
          value={sellerProducts.filter((product) => product.stock > 0).length}
          trend={sellerProducts.length ? "No change" : "No products"}
          note={`out of ${sellerProducts.length}`}
        />
        <Stat
          title="Pending Orders"
          value={pendingCount}
          trend="Needs attention"
          note="awaiting your response"
        />
      </div>
      <div className="seller-grid">
        <div className="table-card">
          <div className="card-head">
            <h2>Recent Orders</h2>
            <button className="text-btn" onClick={() => go("seller-orders")}>
              View all
            </button>
          </div>
          {sellerOrders.length ?
            <RecentOrdersTable orders={sellerOrders} />
          : <div className="empty">
              <Package size={32} />
              <h3>No customer orders yet</h3>
            </div>
          }
        </div>
        <div className="table-card">
          <div className="card-head">
            <h2>Top Selling Products</h2>
            <button className="text-btn" onClick={() => go("products")}>
              View all
            </button>
          </div>
          {sellerProducts.length ?
            <div className="top-products">
              {sellerProducts
                .slice()
                .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                .slice(0, 5)
                .map((p, i) => (
                  <div key={p.id}>
                    <i className="rank">{i + 1}</i>
                    <ProductArt p={p} />
                    <div className="top-info">
                      <b>{p.name}</b>
                      <small>{money(p.price)}</small>
                    </div>
                    <span className="top-sold">{p.sold || 0} sold</span>
                  </div>
                ))}
            </div>
          : <div className="empty">
              <Package size={32} />
              <h3>No products created yet</h3>
              <button className="primary" onClick={() => go("add-product")}>
                Add Product
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export function SellerRoutes({ user, page, go, updateUser, onSaveProduct }) {
  if (page === "products") return <SellerProducts user={user} go={go} />;
  if (page === "seller-orders") return <SellerOrders />;
  if (page === "messages")
    return (
      <Messages role={user.role} onGoHome={() => go("seller-dashboard")} />
    );
  if (page === "settings")
    return <ShopSettings user={user} onUpdate={updateUser} />;
  if (page === "add-product")
    return <AddProduct go={go} onSave={onSaveProduct} />;
  return <SellerDashboard user={user} go={go} />;
}
