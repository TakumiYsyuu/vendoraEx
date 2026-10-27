import Status from "./Status";
import { money, formatDate } from "../logic/orders";

// party: "buyer" | "seller" | "both"  -> which name column(s) to show
export default function OrderTable({
  orders,
  party = "seller",
  onView,
  renderActions,
  empty = "No orders yet.",
}) {
  if (!orders.length) return <p className="orders-empty">{empty}</p>;

  return (
    <div className="orders-table-wrap">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order</th>
            {(party === "buyer" || party === "both") && <th>Buyer</th>}
            {(party === "seller" || party === "both") && <th>Shop</th>}
            <th>Items</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.code}</strong>
              </td>
              {(party === "buyer" || party === "both") && (
                <td>{o.buyerName}</td>
              )}
              {(party === "seller" || party === "both") && (
                <td>{o.shopName}</td>
              )}
              <td>
                {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
              </td>
              <td>{money(o.total)}</td>
              <td>{formatDate(o.createdAt)}</td>
              <td>
                <Status>{o.status}</Status>
              </td>
              <td className="orders-actions">
                <button className="ord-btn ghost" onClick={() => onView(o)}>
                  Details
                </button>
                {renderActions?.(o)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
