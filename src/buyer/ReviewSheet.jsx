import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { saveReview } from "../logic/reviews";

export default function ReviewSheet({ user }) {
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  useEffect(() => {
    const open = (e) => {
      setProduct(e.detail);
      setRating(0);
      setComment("");
    };
    window.addEventListener("open-review", open);
    return () => window.removeEventListener("open-review", open);
  }, []);
  if (!product) return null;
  const submit = (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return;
    saveReview(user, product, rating, comment);
    setProduct(null);
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        background: "rgba(7,26,46,.5)",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        className="form-card"
        role="dialog"
        aria-modal="true"
        style={{ width: "min(430px,100%)", margin: 0 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Rate {product.name}</h2>
          <button
            type="button"
            className="icon-only"
            onClick={() => setProduct(null)}
          >
            <X size={17} />
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          How was the quality of this product?
        </p>
        <div style={{ display: "flex", gap: 5, margin: "16px 0" }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} stars`}
              onClick={() => setRating(value)}
              style={{
                fontSize: 28,
                color: value <= rating ? "#f2b84b" : "#cbd5dc",
              }}
            >
              ★
            </button>
          ))}
        </div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
          Comment
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience"
            required
            style={{
              display: "block",
              width: "100%",
              minHeight: 90,
              marginTop: 7,
              padding: 10,
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          />
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            className="outline"
            onClick={() => setProduct(null)}
          >
            Cancel
          </button>
          <button className="primary" type="submit" disabled={!rating}>
            Submit Review
          </button>
        </div>
      </form>
    </div>
  );
}
