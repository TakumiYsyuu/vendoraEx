import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import ProductArt from "../components/ProductArt";
import { money } from "../utils/helpers";
import OrderSummary from "./OrderSummary";

export default function Cart({ cart, setCart, quantities, setQuantities, go }) {
  const qtyOf = (id) => quantities[id] || 1;
  const subtotal = cart.reduce((sum, p) => sum + p.price * qtyOf(p.id), 0);
  const shipping = cart.length ? 50 : 0;
  const itemCount = cart.reduce((sum, p) => sum + qtyOf(p.id), 0);

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    setQuantities({ ...quantities, [id]: 0 });
  };
  const changeQuantity = (id, delta) => {
    const next = qtyOf(id) + delta;
    if (next <= 0) removeItem(id);
    else setQuantities({ ...quantities, [id]: next });
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>
            Your Cart <span className="count">{itemCount}</span>
          </h1>
          <p>Review your items before checkout</p>
        </div>
      </div>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((p) => (
            <div className="cart-item" key={p.id}>
              <div className="cart-thumb">
                <ProductArt p={p} />
              </div>
              <div className="cart-name">
                <h3>{p.name}</h3>
                <small>
                  {p.category} · Sold by {p.seller}
                </small>
                <small className="cart-unit">{money(p.price)} each</small>
              </div>
              <div className="qty cart-qty">
                <button
                  onClick={() => changeQuantity(p.id, -1)}
                  aria-label={`Decrease ${p.name}`}
                >
                  <Minus size={14} />
                </button>
                <b>{qtyOf(p.id)}</b>
                <button
                  onClick={() => changeQuantity(p.id, 1)}
                  aria-label={`Increase ${p.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
              <strong className="cart-line-total">
                {money(p.price * qtyOf(p.id))}
              </strong>
              <button
                className="delete cart-remove"
                onClick={() => removeItem(p.id)}
                aria-label={`Remove ${p.name}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!cart.length && (
            <div className="empty">
              <ShoppingCart size={38} />
              <h3>Your cart is empty</h3>
              <button className="primary" onClick={() => go("categories")}>
                Continue Shopping
              </button>
            </div>
          )}
          {cart.length > 0 && (
            <button className="continue" onClick={() => go("categories")}>
              <ArrowLeft size={15} /> Continue Shopping
            </button>
          )}
        </div>
        <OrderSummary subtotal={subtotal} shipping={shipping} go={go} />
      </div>
    </div>
  );
}
