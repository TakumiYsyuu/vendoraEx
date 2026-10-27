import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  PackageSearch,
  Search,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import Status from "../components/Status";
import OrderDetails from "../components/OrderDetails";
import useOrders from "../logic/useOrders";
import {
  fetchSellerOrders,
  acceptOrder,
  rejectOrder,
  sendOrderToTransit,
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

export default function SellerOrders() {
  const { orders, loading, error, busyId, run } = useOrders(fetchSellerOrders);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState(null);

  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

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
        o.buyerName?.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [orders, tab, query]);

  const hasActiveFilters = tab !== "All" || query.trim() !== "";
  const clearFilters = () => {
    setTab("All");
    setQuery("");
  };

  const openReject = (order) => {
    setReason("");
    setReasonError("");
    setRejecting(order);
  };

  const submitReject = async (event) => {
    event.preventDefault();
    if (reason.trim().length < 5) {
      setReasonError("Please give a reason (at least 5 characters).");
      return;
    }
    const ok = await run(rejecting.id, () =>
      rejectOrder(rejecting.id, reason.trim()),
    );
    if (ok) {
      setRejecting(null);
      setViewing(null);
    }
  };

  const accept = async (order) => {
    const ok = await run(order.id, () => acceptOrder(order.id));
    if (ok) setViewing(null);
  };

  const sendTransit = async (order) => {
    const ok = await run(order.id, () => sendOrderToTransit(order.id));
    if (ok) setViewing(null);
  };

  const renderActions = (order) => (
    <>
      {order.status === "Pending" && (
        <>
          <button
            type="button"
            className="st-btn st-btn-good"
            disabled={busyId === order.id}
            onClick={() => accept(order)}
          >
            <Check size={13} /> Accept
          </button>
          <button
            type="button"
            className="st-btn st-btn-warn"
            disabled={busyId === order.id}
            onClick={() => openReject(order)}
          >
            <XCircle size={13} /> Reject
          </button>
        </>
      )}
      {order.status === "Processing" && (
        <button
          type="button"
          className="st-btn st-btn-good"
          disabled={busyId === order.id}
          onClick={() => sendTransit(order)}
        >
          <Truck size={13} /> Transit
        </button>
      )}
    </>
  );

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Orders</h1>
          <p>Accept new orders, then send them out for delivery.</p>
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
              placeholder="Search order, buyer or item"
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
            description="Orders from buyers will appear here."
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
                          {initials(order.buyerName || "Buyer")}
                        </span>
                        <strong>{order.buyerName}</strong>
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
                        {renderActions(order)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Shared order dialog (same one staff uses) */}
      <OrderDetails
        order={rejecting ? null : viewing}
        onClose={() => setViewing(null)}
        actions={renderActions}
      />

      {rejecting && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={() => setRejecting(null)}
        >
          <section
            className="admin-user-dialog st-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="reject-dialog-title">Reject order</h2>
                <p>
                  Order <strong>{rejecting.code}</strong> will be cancelled and
                  the buyer will see your reason.
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setRejecting(null)}
              >
                ×
              </button>
            </div>

            <form
              className="admin-user-form um-form"
              onSubmit={submitReject}
              noValidate
            >
              <label className="um-full">
                Reason
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setReasonError("");
                  }}
                  maxLength={500}
                  rows={3}
                  placeholder="Explain why you are rejecting this order"
                />
                <span className="um-counter">{reason.length}/500</span>
              </label>

              {reasonError && (
                <p className="admin-form-error" role="alert">
                  {reasonError}
                </p>
              )}

              <div className="admin-dialog-actions">
                <button type="button" onClick={() => setRejecting(null)}>
                  Cancel
                </button>
                <button
                  className="primary st-danger"
                  type="submit"
                  disabled={busyId === rejecting.id}
                >
                  {busyId === rejecting.id ? "Rejecting..." : "Reject order"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
