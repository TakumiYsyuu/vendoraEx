import { money } from "../utils/helpers";

export default function OrderSummary({ subtotal, shipping, go }) {
  return (
    <aside className="summary">
      <h2>Order Summary</h2>
      <div>
        <span>Subtotal</span>
        <b>{money(subtotal)}</b>
      </div>
      <div>
        <span>Shipping</span>
        <b>{shipping ? money(shipping) : "Free"}</b>
      </div>
      <hr />
      <div className="total">
        <span>Total</span>
        <b>{money(subtotal + shipping)}</b>
      </div>
      <input placeholder="Enter promo code" />
      <button className="primary full" onClick={() => go("checkout")}>
        Proceed to Checkout
      </button>
      <button className="outline full" onClick={() => go("categories")}>
        Continue Shopping
      </button>
    </aside>
  );
}
