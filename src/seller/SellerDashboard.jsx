import { useEffect, useState } from "react";
import "../styles/SellerDashboard.css";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  MessageCircle,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import ProductArt from "../components/ProductArt";
import Status from "../components/Status";
import Messages from "../components/Messages";
import { money, initials, sameOrderId } from "../utils/helpers";
import { syncBuyerOrderStatus } from "../logic/orders";
import Stat from "./Stat";
import SellerProducts from "./SellerProducts";
import Analytics from "./Analytics";
import AddProduct from "./AddProduct";
import ShopSettings from "./ShopSettings";

const ORDER_FILTERS = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];
const ORDER_STATUSES = ORDER_FILTERS.slice(1);

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
    [BarChart3, "Analytics", "analytics"],
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

// ---------- OrdersTable ----------
function OrdersTable({ orders, compact = false, onStatusChange }) {
  const rows = compact ? orders.slice(0, 5) : orders;
  return (
    <table>
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          {!compact && <th></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id}>
            <td>
              <b>{o.id}</b>
            </td>
            <td>{o.customer}</td>
            <td>{money(o.total)}</td>
            <td>
              {onStatusChange ?
                <select
                  className="status-select"
                  value={o.status}
                  onChange={(e) => onStatusChange(o.id, e.target.value)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              : <Status>{o.status}</Status>}
            </td>
            {!compact && (
              <td className="cell-action">
                <button
                  className="outline small"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("view-order", { detail: o }),
                    )
                  }
                >
                  View
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------- SellerDashboard ----------
function SellerDashboard({ user, go }) {
  const sellerOrders = readList(`vendora-seller-orders-${user.email}`);
  const sellerProducts = readList(`vendora-products-${user.email}`);
  const pendingCount = sellerOrders.filter(
    (order) => order.status === "Processing" || order.status === "Pending",
  ).length;

  return (
    <div>
      <DashboardHeader
        title="Store Overview"
        subtitle="Here’s your daily shop performance and order activity."
      />
      <div className="stats">
        <Stat
          title="Total Sales"
          value={money(
            sellerOrders.reduce((sum, order) => sum + order.total, 0),
          )}
          trend={sellerOrders.length ? "New orders" : "No orders"}
          note="from customer orders"
        />
        <Stat
          title="Total Orders"
          value={sellerOrders.length}
          trend={sellerOrders.length ? "Needs attention" : "No orders"}
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
          note=""
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
            <OrdersTable compact orders={sellerOrders} />
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

// ---------- SellerOrders ----------
function SellerOrders({ user }) {
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const sellerOrderKey = `vendora-seller-orders-${user.email}`;
  const [sellerOrders, setSellerOrders] = useState(() =>
    readList(sellerOrderKey),
  );

  useEffect(() => {
    const showOrder = (e) => setSelectedOrder(e.detail);
    window.addEventListener("view-order", showOrder);
    return () => window.removeEventListener("view-order", showOrder);
  }, []);

  useEffect(() => {
    localStorage.setItem(sellerOrderKey, JSON.stringify(sellerOrders));
  }, [sellerOrderKey, sellerOrders]);

  const updateStatus = (id, status) => {
    setSellerOrders((list) =>
      list.map((order) =>
        sameOrderId(order.id, id) ? { ...order, status } : order,
      ),
    );
    syncBuyerOrderStatus(id, status);
  };

  const countFor = (status) =>
    status === "All" ?
      sellerOrders.length
    : sellerOrders.filter((order) => order.status === status).length;

  const visibleOrders =
    filter === "All" ? sellerOrders : (
      sellerOrders.filter((order) => order.status === filter)
    );

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Orders</h1>
          <p>Track, fulfill, and manage your customer orders.</p>
        </div>
      </div>

      <div className="tabs">
        {ORDER_FILTERS.map((status) => (
          <button
            key={status}
            className={filter === status ? "selected" : ""}
            onClick={() => setFilter(status)}
          >
            {status}
            <span className="tab-count">{countFor(status)}</span>
          </button>
        ))}
      </div>

      <div className="table-card">
        {visibleOrders.length ?
          <OrdersTable orders={visibleOrders} onStatusChange={updateStatus} />
        : <div className="empty">
            <Package size={32} />
            <h3>
              No {filter === "All" ? "" : filter.toLowerCase() + " "}orders
            </h3>
          </div>
        }
      </div>

      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="form-card modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>Order {selectedOrder.id}</h2>
              <button
                className="modal-close"
                aria-label="Close"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-meta">
              <p>
                Customer: <strong>{selectedOrder.customer}</strong>
              </p>
              <p>
                Status: <Status>{selectedOrder.status}</Status>
              </p>
            </div>
            <h3 className="modal-sub">Products purchased</h3>
            {(selectedOrder.products || []).map((product) => (
              <div className="summary-product" key={product}>
                <span>{product}</span>
              </div>
            ))}
            <div className="total">
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

// ---------- SellerRoutes ----------
export function SellerRoutes({ user, page, go, updateUser, onSaveProduct }) {
  if (page === "products") return <SellerProducts user={user} go={go} />;
  if (page === "seller-orders") return <SellerOrders user={user} />;
  if (page === "analytics") return <Analytics />;
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
