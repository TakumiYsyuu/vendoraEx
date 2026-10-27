import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin, Package, Store, User } from "lucide-react";
import { money, formatDate } from "../logic/orders";
import "../styles/orderDetails.css";

const STATUS_CLASS = {
  "In Transit": "dl-transit",
  "Out for Delivery": "dl-out",
  Completed: "dl-done",
  Cancelled: "dl-cancelled",
};

const TIMELINE = [
  ["Placed", "createdAt"],
  ["Accepted", "acceptedAt"],
  ["In transit", "transitAt"],
  ["Out for delivery", "outForDeliveryAt"],
  ["Completed", "completedAt"],
  ["Cancelled", "cancelledAt"],
];

function ItemThumb({ src }) {
  return (
    <span className="dl-thumb">
      {src && (
        <img
          src={src}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling.style.display = "grid";
          }}
        />
      )}
      <span
        className="dl-thumb-fallback"
        style={{ display: src ? "none" : "grid" }}
        aria-hidden="true"
      >
        <Package size={18} />
      </span>
    </span>
  );
}

function InfoCard({ icon: Icon, title, lines }) {
  return (
    <div className="dl-info">
      <div className="dl-info-head">
        <Icon size={14} aria-hidden="true" />
        <span>{title}</span>
      </div>
      {lines.map((line, i) => (
        <p key={i} className={i === 0 ? "dl-info-main" : ""}>
          {line}
        </p>
      ))}
    </div>
  );
}

export default function OrderDetails({ order, onClose }) {
  useEffect(() => {
    if (!order) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;

  const steps = TIMELINE.filter(([, key]) => order[key]);

  return createPortal(
    <div
      className="admin-dialog-backdrop st-backdrop dl-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="admin-user-dialog st-dialog dl-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-heading">
          <div>
            <h2 id="order-dialog-title">
              {order.code}
              <span
                className={`dl-title-pill ${STATUS_CLASS[order.status] || ""}`}
              >
                {order.status}
              </span>
            </h2>
            <p>Placed {formatDate(order.createdAt)}</p>
          </div>
          <button
            className="admin-dialog-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {order.status === "Cancelled" && order.cancelReason && (
          <div className="dl-reason">
            <strong>Reason for cancellation</strong>
            <p>{order.cancelReason}</p>
          </div>
        )}

        <div className="dl-body">
          <div className="dl-info-grid">
            <InfoCard
              icon={User}
              title="Buyer"
              lines={[order.buyerName, order.buyerEmail].filter(Boolean)}
            />
            <InfoCard
              icon={Store}
              title="Shop"
              lines={[order.shopName, order.shopAddress || "No pickup address"]}
            />
            <InfoCard
              icon={MapPin}
              title="Deliver to"
              lines={[
                order.shipName || "—",
                order.shipPhone || "—",
                order.shipAddress || "",
              ].filter(Boolean)}
            />
          </div>

          <div className="dl-items-wrap">
            <h3 className="dl-section">Items</h3>
            <ul className="dl-items">
              {(order.items ?? []).map((i) => (
                <li key={i.id}>
                  <ItemThumb src={i.image} />
                  <div className="dl-item-text">
                    <strong>{i.name}</strong>
                    <span className="st-muted">
                      {money(i.price)} × {i.quantity}
                    </span>
                  </div>
                  <strong className="dl-item-price">
                    {money(i.price * i.quantity)}
                  </strong>
                </li>
              ))}
            </ul>

            <dl className="dl-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{money(order.shippingFee)}</dd>
              </div>
              <div className="dl-total-row">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="dl-time-wrap">
            <h3 className="dl-section">Timeline</h3>
            <ol className="dl-timeline">
              {steps.map(([label, key], i) => (
                <li
                  key={key}
                  className={i === steps.length - 1 ? "current" : ""}
                >
                  <span className="dl-dot" aria-hidden="true" />
                  <span className="dl-step-label">{label}</span>
                  <span className="st-muted">{formatDate(order[key])}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="admin-dialog-actions">
          <button className="primary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
