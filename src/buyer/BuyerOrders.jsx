import { useMemo, useState } from "react";
import { CheckCircle2, Eye, PackageSearch, Search, X } from "lucide-react";
import Status from "../components/Status";
import useOrders from "../logic/useOrders";
import {
  fetchMyOrders,
  markOrderReceived,
  money,
  formatDate,
} from "../logic/orders";
import { initials } from "../utils/helpers";
import "../styles/AdminModeration.css";
import "../styles/staffManage.css";
import "../styles/userManage.css";

const TABS = [
  "All",
  "Pending",
  "Processing",
  "In Transit",
  "Out for Delivery",
  "Completed",
  "Cancelled",
];

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function BuyerOrders() {
  const { orders, loading, error, busyId, run } = useOrders(fetchMyOrders);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState(null);

  const counts = useMemo(() => {
    const result = { All: orders.length };
    TABS.slice(1).forEach((t) => {
      result[t] = orders.filter((o) => o.status === t).length;
    });
    return result;
  }, [orders]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesTab = tab === "All" || o.status === tab;
      const matchesSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.shopName?.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [orders, tab, query]);

  const hasActiveFilters = tab !== "All" || query.trim() !== "";
  const clearFilters = () => {
    setTab("All");
    setQuery("");
  };

  const receive = async (order) => {
    const ok = await run(order.id, () => markOrderReceived(order.id));
    if (ok && viewing?.id === order.id) setViewing(null);
  };

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>My Orders</h1>
          <p>Track your orders and confirm them once they arrive.</p>
        </div>
      </div>

      <div className="st-toolbar">
        <div className="st-tabs" role="tablist" aria-label="Filter by status">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`st-tab ${tab === t ? "on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
              <span className="st-count">{counts[t]}</span>
            </button>
          ))}
        </div>

        <div className="um-filters">
          <label className="st-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, shop or item"
              aria-label="Search orders"
            />
            {query && (
              <button
                type="button"
                className="st-search-clear"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </label>

          {hasActiveFilters && (
            <button type="button" className="um-reset" onClick={clearFilters}>
              <X size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="admin-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="table-card st-card">
        {loading ?
          <EmptyState
            icon={PackageSearch}
            title="Loading orders"
            description="Please wait a moment."
          />
        : orders.length === 0 ?
          <EmptyState
            icon={PackageSearch}
            title="No orders yet"
            description="Orders you place will appear here."
          />
        : shown.length === 0 ?
          <EmptyState
            icon={Search}
            title="No matching orders"
            description="Try a different search or another status."
          />
        : <div className="st-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Shop</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.code}</strong>
                    </td>
                    <td>
                      <div className="st-person">
                        <span className="st-avatar" aria-hidden="true">
                          {initials(order.shopName || "Shop")}
                        </span>
                        <strong>{order.shopName}</strong>
                      </div>
                    </td>
                    <td className="st-muted">
                      {order.items
                        .map((i) => `${i.name} ×${i.quantity}`)
                        .join(", ")}
                    </td>
                    <td>{money(order.total)}</td>
                    <td className="st-muted">{formatDate(order.createdAt)}</td>
                    <td
                      title={
                        order.status === "Cancelled" && order.cancelReason ?
                          `Reason: ${order.cancelReason}`
                        : undefined
                      }
                    >
                      <Status>{order.status}</Status>
                    </td>
                    <td>
                      <div className="st-actions">
                        <button
                          type="button"
                          className="st-btn"
                          onClick={() => setViewing(order)}
                        >
                          <Eye size={13} /> View
                        </button>
                        {order.status === "Out for Delivery" && (
                          <button
                            type="button"
                            className="st-btn st-btn-good"
                            disabled={busyId === order.id}
                            onClick={() => receive(order)}
                          >
                            <CheckCircle2 size={13} />{" "}
                            {busyId === order.id ?
                              "Saving..."
                            : "Order Received"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {viewing && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={() => setViewing(null)}
        >
          <section
            className="admin-user-dialog st-dialog admin-order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-order-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="buyer-order-dialog-title">Order {viewing.code}</h2>
                <p>Review your order status and purchased items.</p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setViewing(null)}
              >
                ×
              </button>
            </div>

            {viewing.status === "Cancelled" && viewing.cancelReason && (
              <div className="um-reason-box">
                <div>
                  <span>Reason from the seller</span>
                  <strong>{viewing.cancelReason}</strong>
                </div>
              </div>
            )}

            <div className="admin-order-summary">
              <div>
                <span>Shop</span>
                <strong>{viewing.shopName}</strong>
              </div>
              <div>
                <span>Order date</span>
                <strong>{formatDate(viewing.createdAt)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{money(viewing.total)}</strong>
              </div>
              <div>
                <span>Status</span>
                <Status>{viewing.status}</Status>
              </div>
            </div>

            <div className="admin-order-items">
              <h3>Deliver to</h3>
              <div>
                <span>Name</span>
                <strong>{viewing.shipName || viewing.buyerName}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>
                  {viewing.shipPhone || viewing.buyerPhone || "—"}
                </strong>
              </div>
              <div>
                <span>Address</span>
                <strong>{viewing.shipAddress || "No address provided"}</strong>
              </div>
            </div>

            <div className="admin-order-items">
              <h3>Items</h3>
              {viewing.items.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              ))}
              <div>
                <span>Shipping</span>
                <strong>{money(viewing.shippingFee)}</strong>
              </div>
            </div>

            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setViewing(null)}>
                Close
              </button>
              {viewing.status === "Out for Delivery" && (
                <button
                  className="primary"
                  type="button"
                  disabled={busyId === viewing.id}
                  onClick={() => receive(viewing)}
                >
                  {busyId === viewing.id ? "Saving..." : "Order Received"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
