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
  Plus,
  ArrowLeft,
  Pencil,
  Eye,
  Trash2,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import ProductArt from "../components/ProductArt";
import Status from "../components/Status";
import Messages from "../components/Messages";
import { money, initials, sameOrderId } from "../utils/helpers";
import { orders } from "../data/products";
import { syncBuyerOrderStatus } from "../logic/orders";

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
        {items.map(([I, label, key]) => (
          <button
            className={page === key ? "active" : ""}
            key={key}
            onClick={() => {
              setPage(key);
              setMobileOpen(false);
            }}
          >
            <I size={17} />
            {label}
            {(key === "seller-orders" || key === "messages") && (
              <em>{key === "seller-orders" ? 3 : 2}</em>
            )}
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
function DashboardHeader({ title, subtitle, action }) {
  return (
    <div className="dash-banner">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="banner-art">V</div>
      {action}
    </div>
  );
}

// ---------- Stat ----------
function Stat({ title, value, trend, note }) {
  return (
    <div className="stat">
      <span>{title}</span>
      <strong>{value}</strong>
      <b className={trend.includes("attention") ? "warn" : ""}>{trend}</b>
      <small>{note}</small>
    </div>
  );
}

// ---------- OrdersTable ----------
function OrdersTable({
  compact = false,
  orders: orderList = orders,
  onStatusChange,
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          {!compact && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {orderList.slice(0, compact ? 5 : 6).map((o) => (
          <tr key={o.id}>
            <td>
              <b>{o.id}</b>
            </td>
            <td>{o.customer}</td>
            <td>{money(o.total)}</td>
            <td>
              {onStatusChange ?
                <select
                  value={o.status}
                  onChange={(e) => onStatusChange(o.id, e.target.value)}
                  style={{
                    padding: "5px 8px",
                    border: "1px solid var(--line)",
                    borderRadius: 5,
                    fontSize: 11,
                    color: "var(--text)",
                    background: "#fff",
                  }}
                >
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
              : <Status>{o.status}</Status>}
            </td>
            {!compact && (
              <td>
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
  const firstName = user.name.trim().split(/\s+/)[0];
  const sellerKey = `vendora-seller-orders-${user.email}`;
  const sellerOrders = JSON.parse(localStorage.getItem(sellerKey) || "[]");
  const sellerProducts = JSON.parse(
    localStorage.getItem(`vendora-products-${user.email}`) || "[]",
  );
  return (
    <div>
      <DashboardHeader
        title={`Good morning, ${firstName}! 👋`}
        subtitle="Here's what's happening with your shop today."
        action=""
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
          value={
            sellerOrders.filter(
              (order) =>
                order.status === "Processing" || order.status === "Pending",
            ).length
          }
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
                .map((p) => (
                  <div key={p.id}>
                    <ProductArt p={p} />
                    <span>
                      <b>{p.name}</b>
                      <small>{p.sold || 0} sold</small>
                    </span>
                    <span className="spark">〰</span>
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

// ---------- SellerProducts ----------
function SellerProducts({ user, go }) {
  const storageKey = `vendora-products-${user.email}`;
  const [productList, setProductList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      return [];
    }
  });
  const [tab, setTab] = useState("All");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(productList));
  }, [productList, storageKey]);
  const visibleProducts = productList.filter(
    (product) =>
      tab === "All" ||
      (tab === "Active" && product.stock > 0) ||
      (tab === "Out of Stock" && product.stock === 0) ||
      (tab === "Draft" && product.draft),
  );
  const startEdit = (product) => {
    setEditing(product);
    setViewing(null);
  };
  const removeProduct = (id) =>
    setProductList((list) => list.filter((product) => product.id !== id));
  const confirmRemoval = () => {
    removeProduct(pendingRemoval.id);
    setPendingRemoval(null);
  };
  const saveEdit = (e) => {
    e.preventDefault();
    setProductList((list) =>
      list.map((product) => (product.id === editing.id ? editing : product)),
    );
    setEditing(null);
  };
  if (viewing)
    return (
      <div>
        <button className="back-btn" onClick={() => setViewing(null)}>
          <ArrowLeft size={16} /> Back to products
        </button>
        <div className="detail">
          <div className="detail-gallery">
            <ProductArt p={viewing} large />
          </div>
          <div className="detail-copy">
            <span className="pill">{viewing.category}</span>
            <h1>{viewing.name}</h1>
            <p className="desc">
              Sold by your shop. This preview shows how the product is presented
              to customers.
            </p>
            <strong>{money(viewing.price)}</strong>
            <p>Stock available: {viewing.stock}</p>
            <button className="primary" onClick={() => startEdit(viewing)}>
              <Pencil size={15} /> Edit Product
            </button>
          </div>
        </div>
      </div>
    );
  if (editing)
    return (
      <div>
        <button className="back-btn" onClick={() => setEditing(null)}>
          <ArrowLeft size={16} /> Back to products
        </button>
        <div className="form-card">
          <h2>Edit Product</h2>
          <form className="fields" onSubmit={saveEdit}>
            <label>
              Product Name
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label>
              Price
              <input
                type="number"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Stock Quantity
              <input
                type="number"
                value={editing.stock}
                onChange={(e) =>
                  setEditing({ ...editing, stock: Number(e.target.value) })
                }
              />
            </label>
            <button className="primary" type="submit">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    );
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>My Products</h1>
          <p>Manage your product listings and inventory.</p>
        </div>
        <button className="primary" onClick={() => go("add-product")}>
          <Plus size={17} /> Add Product
        </button>
      </div>
      <div className="tabs">
        {["All", "Active", "Out of Stock", "Draft"].map((filter) => (
          <button
            key={filter}
            className={tab === filter ? "selected" : ""}
            onClick={() => setTab(filter)}
          >
            {filter} (
            {
              productList.filter(
                (product) =>
                  filter === "All" ||
                  (filter === "Active" && product.stock > 0) ||
                  (filter === "Out of Stock" && product.stock === 0) ||
                  (filter === "Draft" && product.draft),
              ).length
            }
            )
          </button>
        ))}
      </div>
      <div className="seller-products">
        {visibleProducts.map((p) => (
          <div className="seller-product" key={p.id}>
            <ProductArt p={p} />
            <button className="more">
              <MoreVertical size={17} />
            </button>
            <h3>{p.name}</h3>
            <strong>{money(p.price)}</strong>
            <small>Stock: {p.stock}</small>
            <span className="active-dot">
              {p.stock > 0 ? "● Active" : "● Out of Stock"}
            </span>
            <div className="product-actions">
              <button
                onClick={() => startEdit(p)}
                aria-label={`Edit ${p.name}`}
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setViewing(p)}
                aria-label={`View ${p.name}`}
              >
                <Eye size={15} />
              </button>
              <button
                onClick={() => setPendingRemoval(p)}
                aria-label={`Remove ${p.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!visibleProducts.length && (
          <div className="empty">
            <Package size={32} />
            <h3>No products in this view</h3>
          </div>
        )}
        <button className="add-tile" onClick={() => go("add-product")}>
          <Plus size={25} />
          <span>Add New Product</span>
        </button>
      </div>
      {pendingRemoval && (
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
            style={{ width: "min(380px,100%)", margin: 0 }}
          >
            <h2>Remove product?</h2>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>
              Are you sure you want to remove{" "}
              <strong>{pendingRemoval.name}</strong> from your products?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 18,
              }}
            >
              <button
                className="outline"
                onClick={() => setPendingRemoval(null)}
              >
                Keep Product
              </button>
              <button
                className="primary"
                style={{ background: "#d94b58" }}
                onClick={confirmRemoval}
              >
                Remove Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- SellerOrders ----------
function SellerOrders({ user }) {
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const sellerOrderKey = `vendora-seller-orders-${user.email}`;
  const [sellerOrders, setSellerOrders] = useState(() =>
    JSON.parse(localStorage.getItem(sellerOrderKey) || "[]"),
  );
  useEffect(() => {
    const showOrder = (e) => setSelectedOrder(e.detail);
    window.addEventListener("view-order", showOrder);
    return () => window.removeEventListener("view-order", showOrder);
  }, []);
  useEffect(
    () => localStorage.setItem(sellerOrderKey, JSON.stringify(sellerOrders)),
    [sellerOrderKey, sellerOrders],
  );
  const updateStatus = (id, status) => {
    setSellerOrders((list) =>
      list.map((order) =>
        sameOrderId(order.id, id) ? { ...order, status } : order,
      ),
    );
    syncBuyerOrderStatus(id, status);
  };
  const visibleOrders =
    filter === "All" ? sellerOrders : (
      sellerOrders.filter((order) => order.status === filter)
    );
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Orders</h1>
          <p>Track and manage your customer orders.</p>
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
            {status} (
            {status === "All" ?
              sellerOrders.length
            : sellerOrders.filter((order) => order.status === status).length}
            )
          </button>
        ))}
      </div>
      <div className="table-card">
        {visibleOrders.length ?
          <OrdersTable orders={visibleOrders} onStatusChange={updateStatus} />
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
            style={{ width: "min(430px,100%)", margin: 0 }}
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
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              Customer:{" "}
              <strong style={{ color: "var(--text)" }}>
                {selectedOrder.customer}
              </strong>
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              Status: <Status>{selectedOrder.status}</Status>
            </p>
            <h3 style={{ fontSize: 13, marginTop: 18 }}>Products purchased</h3>
            {(selectedOrder.products || []).map((product) => (
              <div className="summary-product" key={product}>
                <span>{product}</span>
              </div>
            ))}
            <div className="total" style={{ marginTop: 14 }}>
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

// ---------- Analytics ----------
function Analytics() {
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Analytics</h1>
          <p>Understand your store performance.</p>
        </div>
      </div>
      <div className="stats">
        <Stat title="Sales" value="₱12,480" trend="+12%" note="last 7 days" />
        <Stat title="Orders" value="18" trend="+20%" note="last 7 days" />
        <Stat
          title="Conversion"
          value="4.8%"
          trend="+0.6%"
          note="vs. last period"
        />
        <Stat title="Visitors" value="1,284" trend="+16%" note="last 7 days" />
      </div>
      <div className="chart-card">
        <h2>Sales Overview</h2>
        <div className="chart">
          <div className="chart-line"></div>
          {[12, 38, 28, 55, 45, 70, 64, 88, 78, 96].map((h, i) => (
            <i key={i} style={{ height: h + "%" }} />
          ))}
        </div>
        <div className="chart-labels">
          <span>Apr 20</span>
          <span>Apr 22</span>
          <span>Apr 24</span>
          <span>Apr 26</span>
        </div>
      </div>
    </div>
  );
}

// ---------- AddProduct ----------
function AddProduct({ go, onSave }) {
  const [product, setProduct] = useState({
    name: "",
    category: "Electronics",
    description: "",
    price: "",
    stock: "",
    discount: "",
  });
  const [image, setImage] = useState("");
  const update = (e) =>
    setProduct({ ...product, [e.target.name]: e.target.value });
  const readImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target.result);
    reader.readAsDataURL(file);
  };
  const save = (e) => {
    e.preventDefault();
    const discount = Number(product.discount) || 0;
    if (
      product.name.trim() &&
      Number(product.price) > 0 &&
      discount >= 0 &&
      discount < 100
    )
      onSave({
        ...product,
        image,
        name: product.name.trim(),
        price: Number(product.price),
        stock: Number(product.stock) || 0,
        discount,
      });
  };
  const discountPercent = Number(product.discount) || 0;
  const originalPrice =
    discountPercent > 0 && Number(product.price) > 0 ?
      Math.round(Number(product.price) / (1 - discountPercent / 100))
    : Number(product.price) || 0;
  const savings = Math.max(0, originalPrice - (Number(product.price) || 0));
  return (
    <div>
      <button className="back-btn" onClick={() => go("products")}>
        <ArrowLeft size={16} /> My Products
      </button>
      <div className="page-title">
        <div>
          <h1>Add New Product</h1>
          <p>Create a listing for your store.</p>
        </div>
      </div>
      <form onSubmit={save}>
        <div className="form-grid">
          <div className="form-card">
            <h2>Product Images</h2>
            <label
              className="upload"
              style={{ cursor: "pointer", overflow: "hidden" }}
            >
              {image ?
                <img
                  src={image}
                  alt="Product preview"
                  style={{ width: "100%", height: 130, objectFit: "contain" }}
                />
              : <>
                  <span style={{ fontSize: 24 }}>▧</span>
                  <b>Click to upload an image</b>
                  <small>PNG, JPG up to 5MB</small>
                </>
              }
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={readImage}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <div className="form-card">
            <h2>Basic Information</h2>
            <div className="fields">
              <label>
                Product Name
                <input
                  name="name"
                  value={product.name}
                  onChange={update}
                  placeholder="Enter product name"
                  required
                />
              </label>
              <label>
                Category
                <select
                  name="category"
                  value={product.category}
                  onChange={update}
                >
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home & Living</option>
                  <option>Beauty & Health</option>
                  <option>Sports & Outdoors</option>
                  <option>Toys & Games</option>
                  <option>Groceries</option>
                </select>
              </label>
              <label className="wide">
                Description
                <textarea
                  name="description"
                  value={product.description}
                  onChange={update}
                  placeholder="Tell us about your product..."
                />
              </label>
            </div>
          </div>
          <div className="form-card">
            <h2>Pricing & Inventory</h2>
            <div className="fields three">
              <label>
                Price
                <input
                  name="price"
                  type="number"
                  min="1"
                  value={product.price}
                  onChange={update}
                  placeholder="₱ 0.00"
                  required
                />
              </label>
              <label>
                Stock Quantity
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={product.stock}
                  onChange={update}
                  placeholder="Enter quantity"
                  required
                />
              </label>
              <label>
                Discount (%)
                <input
                  name="discount"
                  type="number"
                  min="0"
                  max="99"
                  value={product.discount}
                  onChange={update}
                  placeholder="e.g. 20"
                />
                <small
                  style={{
                    display: "block",
                    marginTop: 5,
                    color: "var(--muted)",
                    fontSize: 10,
                  }}
                >
                  Enter 20 for 20% off
                </small>
              </label>
            </div>
            {discountPercent > 0 && (
              <p
                style={{
                  margin: "12px 0 0",
                  color: "var(--green)",
                  fontSize: 12,
                }}
              >
                Customer saves {money(savings)} ({discountPercent}% off).
                Original price: {money(originalPrice)}.
              </p>
            )}
          </div>
        </div>
        <div className="form-actions">
          <button
            className="outline"
            type="button"
            onClick={() => go("products")}
          >
            Cancel
          </button>
          <button className="primary" type="submit">
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- ShopSettings ----------
function ShopSettings({ user, onUpdate }) {
  const [shop, setShop] = useState({
    name: user.shopName || `${user.name}'s Shop`,
    email: user.shopEmail || user.email,
    description:
      user.shopDescription || "Quality products and everyday essentials.",
  });
  const [saved, setSaved] = useState(false);
  const update = (e) => {
    setShop({ ...shop, [e.target.name]: e.target.value });
    setSaved(false);
  };
  const save = (e) => {
    e.preventDefault();
    onUpdate({
      shopName: shop.name,
      shopEmail: shop.email,
      shopDescription: shop.description,
    });
    setSaved(true);
  };
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Shop Settings</h1>
          <p>Manage your store profile and preferences.</p>
        </div>
      </div>
      <form className="form-card settings-card" onSubmit={save}>
        <div className="settings-avatar">{initials(shop.name)}</div>
        <div className="fields">
          <label>
            Shop Name
            <input name="name" value={shop.name} onChange={update} />
          </label>
          <label>
            Shop Email
            <input
              type="email"
              name="email"
              value={shop.email}
              onChange={update}
            />
          </label>
          <label className="wide">
            Shop Description
            <textarea
              name="description"
              value={shop.description}
              onChange={update}
            />
          </label>
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

// ---------- SellerRoutes ----------
export function SellerRoutes({ user, page, go, updateUser, onSaveProduct }) {
  if (page === "products") return <SellerProducts user={user} go={go} />;
  if (page === "seller-orders") return <SellerOrders user={user} />;
  if (page === "analytics") return <Analytics />;
  if (page === "messages") return <Messages user={user} seller />;
  if (page === "settings")
    return <ShopSettings user={user} onUpdate={updateUser} />;
  if (page === "add-product")
    return <AddProduct go={go} onSave={onSaveProduct} />;
  return <SellerDashboard user={user} go={go} />;
}
