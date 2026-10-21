import { ShieldAlert } from "lucide-react";

export default function RestrictedPopup({ restriction, onClose }) {
  if (!restriction) return null;

  const row = {
    display: "grid",
    gridTemplateColumns: "90px 1fr",
    gap: 16,
    padding: "12px 0",
    borderTop: "1px solid #e5e7eb",
    fontSize: 14,
  };
  const key = { color: "#6b7280" };
  const value = { color: "#111827", fontWeight: 500 };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restricted-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, .6)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          width: "min(460px, 100%)",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <ShieldAlert size={20} color="#d94b58" />
          <h3
            id="restricted-title"
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Account restricted
          </h3>
        </div>

        <div style={{ padding: "20px 24px 8px" }}>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#4b5563",
            }}
          >
            Your account has been restricted by an administrator. You can sign
            in again once the restriction ends.
          </p>

          <div style={row}>
            <span style={key}>Reason</span>
            <span style={value}>{restriction.reason}</span>
          </div>
          <div style={row}>
            <span style={key}>Starts</span>
            <span style={value}>{restriction.startDate}</span>
          </div>
          <div style={{ ...row, borderBottom: "1px solid #e5e7eb" }}>
            <span style={key}>Ends</span>
            <span style={value}>{restriction.endDate || "No end date"}</span>
          </div>

          <p style={{ fontSize: 12, color: "#6b7280", margin: "14px 0 0" }}>
            If you think this is a mistake, contact support@vendora.com.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "14px 24px",
            marginTop: 16,
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 6,
              background: "#10a37f",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
