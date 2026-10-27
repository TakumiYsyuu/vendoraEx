import { useMemo, useState } from "react";
import { Eye, PackageSearch, Search, X } from "lucide-react";
import Status from "../components/Status";
import useOrders from "../logic/useOrders";
import {
  fetchAllOrders,
  ORDER_STATUSES,
  money,
  formatDate,
} from "../logic/orders";
import { initials } from "../utils/helpers";
import "../styles/AdminModeration.css";
import "../styles/staffManage.css";
import "../styles/userManage.css";
import "../styles/adminOrders.css";

const TABS = ["All", ...ORDER_STATUSES];

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function AdminOrders() {
  const { orders, loading, error } = useOrders(fetchAllOrders);
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
        o.code?.toLowerCase().includes(q) ||
        o.buyerName?.toLowerCase().includes(q) ||
        o.shopName?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [orders, tab, query]);

  const hasActiveFilters = tab !== "All" || query.trim() !== "";
  const clearFilters = () => {
    setTab("All");
    setQuery("");
  };

  return (
    <div className="admin-page ao-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>All Orders</h1>
          <p>Track and review every order placed across Vendora.</p>
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
              placeholder="Search order, buyer or shop"
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
            description="Orders placed by buyers will appear here."
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
                  <th>Buyer</th>
                  <th>Shop</th>
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
                          {initials(order.buyerName || "Buyer")}
                        </span>
                        <strong>{order.buyerName}</strong>
                      </div>
                    </td>
                    <td className="st-muted">{order.shopName}</td>
                    <td>{money(order.total)}</td>
                    <td className="st-muted">{formatDate(order.createdAt)}</td>
                    <td
                      title={
                        order.status === "Cancelled" && order.cancelReason ?
                          `Reason: ${order.cancelReason}`
                        : undefined
                      }
                    >
                      <span className="ao-nowrap">
                        <Status>{order.status}</Status>
                      </span>
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
            aria-labelledby="admin-order-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="admin-order-dialog-title">Order {viewing.code}</h2>
                <p>Review the buyer, shop, delivery details and items.</p>
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
                  <span>Reason for cancellation</span>
                  <strong>{viewing.cancelReason}</strong>
                </div>
              </div>
            )}

            <div className="admin-order-summary">
              <div>
                <span>Buyer</span>
                <strong>{viewing.buyerName}</strong>
              </div>
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
                <span className="ao-nowrap">
                  <Status>{viewing.status}</Status>
                </span>
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

            {viewing.items?.length > 0 && (
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
            )}

            <div className="admin-dialog-actions">
              <button
                className="primary"
                type="button"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
