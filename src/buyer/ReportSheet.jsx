import { useState } from "react";
import { X } from "lucide-react";
import { addReport } from "../logic/moderation";

export default function ReportSheet({ product, user, onClose }) {
  const [reason, setReason] = useState("Scam or counterfeit product");
  const [details, setDetails] = useState("");
  const submit = (e) => {
    e.preventDefault();
    addReport({ product, user, reason, details });
    onClose();
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
          <h2>Report {product.seller}</h2>
          <button type="button" className="icon-only" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Report a concern about {product.name}.
        </p>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
          Reason
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginTop: 7,
              padding: 10,
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          >
            <option>Scam or counterfeit product</option>
            <option>Misleading listing</option>
            <option>Unsafe or prohibited product</option>
            <option>Other concern</option>
          </select>
        </label>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            marginTop: 14,
          }}
        >
          Details
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
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
          <button type="button" className="outline" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}
