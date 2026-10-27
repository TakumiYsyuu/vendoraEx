import { useState, useMemo } from "react";
import { Eye, PackageCheck, Search, Truck, X } from "lucide-react";
import OrderDetails from "../components/OrderDetails";
import useOrders from "../logic/useOrders";
import { fetchStaffOrders, markReadyToDeliver } from "../logic/orders";
import { initials } from "../utils/helpers";
import Status from "../components/Status";

const TABS = [
  ["In Transit", "In Transit"],
  ["Out for Delivery", "Out for Delivery"],
  ["Completed", "Completed"],
];

const EMPTY_COPY = {
  "In Transit": "Orders that are on their way to the hub will appear here.",
  "Out for Delivery": "Orders handed to a rider will appear here.",
  Completed: "Delivered orders will appear here.",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTotal(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : `₱${n.toLocaleString("en-PH")}`;
}

const nameOf = (o, party) =>
  (party === "seller" ? o.shopName : o.buyerName) || "—";

const orderNo = (o) => o.code || `#${o.id}`;

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function PersonCell({ name }) {
  return (
    <div className="st-person">
      <span className="st-avatar" aria-hidden="true">
        {initials(String(name))}
      </span>
      <strong>{name}</strong>
    </div>
  );
}

export default function StaffDelivery() {
  const { orders, loading, error, busyId, run } = useOrders(fetchStaffOrders);
  const [tab, setTab] = useState("In Transit");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState(null);

  const counts = useMemo(() => {
    const result = {};
    TABS.forEach(([value]) => {
      result[value] = orders.filter((o) => o.status === value).length;
    });
    return result;
  }, [orders]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (o.status !== tab) return false;
      if (!q) return true;
      return (
        String(orderNo(o)).toLowerCase().includes(q) ||
        String(nameOf(o, "buyer")).toLowerCase().includes(q) ||
        String(nameOf(o, "seller")).toLowerCase().includes(q)
      );
    });
  }, [orders, tab, query]);

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Delivery Dashboard</h1>
          <p>Track orders in transit and hand them off for delivery.</p>
        </div>
      </div>

      <div className="st-toolbar">
        <div className="st-tabs" role="tablist" aria-label="Filter by status">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={`st-tab ${tab === value ? "on" : ""}`}
              onClick={() => setTab(value)}
            >
              {label}
              <span className="st-count">{counts[value]}</span>
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
              aria-label="Search deliveries"
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
            icon={Truck}
            title="Loading deliveries…"
            description="Fetching the latest orders."
          />
        : shown.length === 0 ?
          query.trim() ?
            <EmptyState
              icon={Search}
              title="No matching orders"
              description="Try a different search."
            />
          : <EmptyState
              icon={Truck}
              title="Nothing here right now"
              description={EMPTY_COPY[tab]}
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
                {shown.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{orderNo(o)}</strong>
                    </td>
                    <td>
                      <PersonCell name={nameOf(o, "buyer")} />
                    </td>
                    <td>
                      <PersonCell name={nameOf(o, "seller")} />
                    </td>
                    <td>{formatTotal(o.total)}</td>
                    <td className="st-muted">
                      {formatDate(o.createdAt ?? o.date)}
                    </td>
                    <td>
                      <Status>{o.status}</Status>
                    </td>
                    <td>
                      <div className="st-actions">
                        <button
                          type="button"
                          className="st-btn"
                          onClick={() => setViewing(o)}
                        >
                          <Eye size={13} /> View
                        </button>
                        {o.status === "In Transit" && (
                          <button
                            type="button"
                            className="st-btn st-btn-good"
                            disabled={busyId === o.id}
                            onClick={() =>
                              run(o.id, () => markReadyToDeliver(o.id))
                            }
                          >
                            <PackageCheck size={13} />
                            {busyId === o.id ? "Saving..." : "Ready to deliver"}
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

      <OrderDetails order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
