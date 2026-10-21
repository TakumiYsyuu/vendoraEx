import { ShieldAlert, Clock, XCircle, X } from "lucide-react";
import "../styles/VerificationRequiredModal.css";

const CONTENT = {
  not_verified: {
    Icon: ShieldAlert,
    title: "Verify your account first",
    text: "You need to submit your ID and get approved by our admin team before you can sell products.",
    action: "Verify Now",
  },
  pending: {
    Icon: Clock,
    title: "Verification under review",
    text: "Your documents are being reviewed. You'll be able to add products once an admin approves them.",
    action: "View Status",
  },
  rejected: {
    Icon: XCircle,
    title: "Verification was rejected",
    text: "Please check the reason in Shop Settings, correct your details, and resubmit.",
    action: "Fix & Resubmit",
  },
};

export default function VerificationRequiredModal({
  status,
  onClose,
  onGoToSettings,
}) {
  const { Icon, title, text, action } = CONTENT[status] || CONTENT.not_verified;

  return (
    <div className="vr-overlay" onClick={onClose} role="presentation">
      <div
        className="vr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vr-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="vr-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="vr-icon">
          <Icon size={28} />
        </div>
        <h3 id="vr-title">{title}</h3>
        <p>{text}</p>
        <div className="vr-actions">
          <button type="button" className="vr-secondary" onClick={onClose}>
            Not now
          </button>
          <button type="button" className="vr-primary" onClick={onGoToSettings}>
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}
