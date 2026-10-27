import { ArrowLeft, Banknote, Check, MapPin, Truck } from "lucide-react";
import ProductArt from "../components/ProductArt";
import { money } from "../utils/helpers";
import "../styles/checkout.css";

// Standard delivery only, Cash on Delivery only.
const SHIPPING_FEE = 50;

export default function Checkout({ user, cart, quantities, go, onPlaceOrder }) {
  const qtyOf = (id) => quantities[id] || 1;
  const subtotal = cart.reduce((sum, p) => sum + p.price * qtyOf(p.id), 0);
  const shipping = cart.length ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;
  const itemCount = cart.reduce((sum, p) => sum + qtyOf(p.id), 0);

  return (
    <div className="co-page">
      <button className="co-back" onClick={() => go("cart")}>
        <ArrowLeft size={16} /> Back to cart
      </button>

      <div className="co-head">
        <h1>Checkout</h1>
        <p>Confirm your details and place your order.</p>
      </div>

      <div className="co-steps" aria-label="Checkout progress">
        <span className="co-step done">
          <b>
            <Check size={13} />
          </b>
          Cart
        </span>
        <span className="co-step-line" />
        <span className="co-step on">
          <b>2</b>
          Checkout
        </span>
        <span className="co-step-line" />
        <span className="co-step">
          <b>3</b>
          Confirmation
        </span>
      </div>

      <div className="co-layout">
        <div className="co-main">
          <section className="co-card">
            <div className="co-card-head">
              <h2>Shipping address</h2>
              <button
                type="button"
                className="co-link"
                onClick={() => go("account-settings")}
              >
                {user.address ? "Change" : "Add address"}
              </button>
            </div>
            <div className="co-address">
              <span className="co-icon">
                <MapPin size={20} />
              </span>
              <div>
                <strong>{user.name}</strong>
                <p className={user.address ? "" : "missing"}>
                  {user.address ||
                    "No address yet. Add one in Account Settings."}
                </p>
                <p className={user.phone ? "" : "missing"}>
                  {user.phone || "No phone number yet."}
                </p>
              </div>
            </div>
          </section>

          <section className="co-card">
            <h2 style={{ marginBottom: 14 }}>Delivery method</h2>
            <div className="co-option">
              <span className="co-icon">
                <Truck size={20} />
              </span>
              <span className="co-option-text">
                <strong>Standard Shipping</strong>
                <small>Arrives in 3–5 days</small>
              </span>
              <span className="co-option-price">{money(SHIPPING_FEE)}</span>
            </div>
          </section>

          <section className="co-card">
            <h2 style={{ marginBottom: 14 }}>Payment method</h2>
            <div className="co-option">
              <span className="co-icon">
                <Banknote size={20} />
              </span>
              <span className="co-option-text">
                <strong>Cash on Delivery</strong>
                <small>Pay in cash when your order arrives</small>
              </span>
              <span className="co-check" aria-hidden="true">
                <Check size={13} />
              </span>
            </div>
            <p className="co-note">
              Please prepare the exact amount of {money(total)} for the rider.
            </p>
          </section>
        </div>

        <aside className="co-summary">
          <h2>
            Order summary ({itemCount} {itemCount === 1 ? "item" : "items"})
          </h2>

          <ul className="co-items">
            {cart.map((p) => (
              <li className="co-item" key={p.id}>
                <span className="co-thumb">
                  <ProductArt p={p} />
                  <span className="co-qty">{qtyOf(p.id)}</span>
                </span>
                <span className="co-item-text">
                  <strong>{p.name}</strong>
                  <small>{money(p.price)} each</small>
                </span>
                <span className="co-item-total">
                  {money(p.price * qtyOf(p.id))}
                </span>
              </li>
            ))}
          </ul>

          <div className="co-rows">
            <div className="co-row">
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="co-row">
              <span>Shipping</span>
              <b>{money(shipping)}</b>
            </div>
            <div className="co-row total">
              <span>Total</span>
              <b>{money(total)}</b>
            </div>
          </div>

          {!user.address && (
            <p className="co-warn" role="alert">
              Add your delivery address in Account Settings to place an order.
            </p>
          )}

          <button
            className="co-place"
            onClick={onPlaceOrder}
            disabled={!cart.length || !user.address}
          >
            Place Order · {money(total)}
          </button>
        </aside>
      </div>
    </div>
  );
}
