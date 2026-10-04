import { ArrowLeft, MapPin } from "lucide-react";
import { money } from "../utils/helpers";

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard Shipping", eta: "3–5 days", fee: 50 },
  { id: "express", label: "Express Shipping", eta: "1–2 days", fee: 120 },
];

const PAYMENT_OPTIONS = [
  { id: "cod", label: "Cash on Delivery" },
  { id: "online", label: "GCash / Card / PayPal" },
];

export default function Checkout({ user, cart, quantities, go, onPlaceOrder }) {
  const qtyOf = (id) => quantities[id] || 1;
  const total =
    cart.reduce((sum, p) => sum + p.price * qtyOf(p.id), 0) +
    (cart.length ? 50 : 0);

  return (
    <div>
      <button className="back-btn" onClick={() => go("cart")}>
        <ArrowLeft size={16} /> Back to cart
      </button>
      <div className="checkout-steps">
        <span className="done">1 Shipping</span>
        <span>2 Payment</span>
        <span>3 Confirmation</span>
      </div>
      <div className="checkout-layout">
        <div>
          <div className="form-card">
            <h2>Shipping Address</h2>
            <div className="address">
              <MapPin />
              <div>
                <b>{user.name}</b>
                <p>
                  {user.address || "Add your address in Account Settings"}
                  <br />
                  {user.phone || "Add your phone number in Account Settings"}
                </p>
              </div>
              <button
                className="text-btn"
                onClick={() => go("account-settings")}
              >
                Change
              </button>
            </div>
          </div>

          <div className="form-card">
            <h2>Delivery Method</h2>
            {DELIVERY_OPTIONS.map((option, index) => (
              <label className="radio" key={option.id}>
                <input type="radio" name="ship" defaultChecked={index === 0} />
                <span className="radio-text">
                  <strong>{option.label}</strong>
                  <small>{option.eta}</small>
                </span>
                <b>{money(option.fee)}</b>
              </label>
            ))}
          </div>

          <div className="form-card">
            <h2>Payment Method</h2>
            {PAYMENT_OPTIONS.map((option, index) => (
              <label className="radio" key={option.id}>
                <input type="radio" name="pay" defaultChecked={index === 0} />
                <span className="radio-text">
                  <strong>{option.label}</strong>
                </span>
              </label>
            ))}
          </div>
        </div>

        <aside className="summary">
          <h2>Order Summary</h2>
          {cart.map((p) => (
            <div className="summary-product" key={p.id}>
              <span>
                {p.name} × {qtyOf(p.id)}
              </span>
              <b>{money(p.price * qtyOf(p.id))}</b>
            </div>
          ))}
          <hr />
          <div className="total">
            <span>Total</span>
            <b>{money(total)}</b>
          </div>
          <button
            className="primary full"
            onClick={onPlaceOrder}
            disabled={!cart.length}
          >
            Place Order
          </button>
        </aside>
      </div>
    </div>
  );
}
