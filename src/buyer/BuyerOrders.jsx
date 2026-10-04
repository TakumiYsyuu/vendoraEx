import { useEffect, useState } from "react";
import { Package, X } from "lucide-react";
import Status from "../components/Status";
import { money } from "../utils/helpers";

export default function BuyerOrders({ user }) {
  const orderKey = `vendora-orders-${user.email}`;
  const [orderList, setOrderList] = useState(() =>
    JSON.parse(localStorage.getItem(orderKey) || "[]"),
  );
  useEffect(
    () => localStorage.setItem(orderKey, JSON.stringify(orderList)),
    [orderKey, orderList],
  );
  useEffect(() => {
    const refresh = (event) => {
      if (event.key === orderKey && event.newValue)
        setOrderList(JSON.parse(event.newValue));
    };
    const refreshVisible = () =>
      setOrderList(JSON.parse(localStorage.getItem(orderKey) || "[]"));
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [orderKey]);
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order changes stay local to this buyer and are persisted by the effect above.
  const cancelOrder = (id) =>
    setOrderList((list) => list.filter((order) => order.id !== id));
  const requestReturn = (id) =>
    setOrderList((list) =>
      list.map((order) =>
        order.id === id ? { ...order, status: "Return Requested" } : order,
      ),
    );

  // Reviews use the existing review sheet, so React owns the button state.
  const rateDeliveredOrder = (order) => {
    const product = order.products?.[0];
    if (product)
      window.dispatchEvent(new CustomEvent("open-review", { detail: product }));
  };
  const visibleOrders = orderList.filter(
    (order) => filter === "All" || order.status === filter,
  );
  const getOrderCount = (status) =>
    status === "All" ?
      orderList.length
    : orderList.filter((order) => order.status === status).length;

  const renderOrderAction = (order) => {
    if (["Processing", "Pending"].includes(order.status))
      return (
        <button className="text-btn" onClick={() => cancelOrder(order.id)}>
          Cancel Order
        </button>
      );
    if (order.status === "Delivered")
      return (
        <button className="text-btn" onClick={() => requestReturn(order.id)}>
          Refund / Return
        </button>
      );
    return (
      <span style={{ fontSize: 11, color: "var(--muted)" }}>No actions</span>
    );
  };
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>My Orders</h1>
          <p>Track and manage your purchases</p>
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
            {status} ({getOrderCount(status)})
          </button>
        ))}
      </div>
      <div className="table-card">
        {visibleOrders.length ?
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>View</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.id}</b>
                  </td>
                  <td>{o.date}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <Status>{o.status}</Status>
                  </td>
                  <td>
                    <button
                      className="text-btn"
                      onClick={() => setSelectedOrder(o)}
                    >
                      View
                    </button>
                  </td>
                  <td>
                    {o.status === "Delivered" ?
                      <button
                        className="outline small"
                        onClick={() => rateDeliveredOrder(o)}
                      >
                        ☆ Rating
                      </button>
                    : <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        Available after delivery
                      </span>
                    }
                  </td>
                  <td>{renderOrderAction(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            style={{
              width: "min(520px,100%)",
              maxHeight: "85vh",
              overflowY: "auto",
              margin: 0,
            }}
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
            <div className="summary-product">
              <span>Status</span>
              <b>
                <Status>{selectedOrder.status}</Status>
              </b>
            </div>
            <div className="summary-product">
              <span>Order date</span>
              <b>{selectedOrder.date}</b>
            </div>
            <div className="summary-product">
              <span>Expected arrival</span>
              <b>{selectedOrder.expectedDate || "3–5 days after shipment"}</b>
            </div>
            <h3 style={{ fontSize: 13, marginTop: 18 }}>Products purchased</h3>
            {(selectedOrder.products || []).map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                {product.image ?
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: 54,
                      height: 54,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                : <div className="avatar">📦</div>}
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 12 }}>
                    {product.name}
                  </strong>
                  <small
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: "var(--muted)",
                      fontSize: 11,
                    }}
                  >
                    Shop: {product.shop}
                  </small>
                  <small
                    style={{
                      display: "block",
                      marginTop: 3,
                      color: "var(--muted)",
                      fontSize: 11,
                    }}
                  >
                    Qty: {product.quantity} · {money(product.price)} each
                  </small>
                </div>
                <b>{money(product.price * product.quantity)}</b>
              </div>
            ))}
            <div className="total" style={{ marginTop: 16 }}>
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
