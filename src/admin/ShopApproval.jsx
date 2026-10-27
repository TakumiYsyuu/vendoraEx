import { useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Eye,
  FileText,
  Search,
  Store,
  X,
} from "lucide-react";
import "../styles/shopApproval.css";

const TABS = ["All", "Pending", "Approved", "Declined"];

const STATUS_CLASS = {
  Pending: "sa-pending",
  Approved: "sa-approved",
  Declined: "sa-declined",
};

const StatusPill = ({ value }) => (
  <span className={`sa-status ${STATUS_CLASS[value] || "sa-pending"}`}>
    {value}
  </span>
);

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

const isImage = (doc) =>
  /^(data:image\/|blob:)/.test(doc.url || "") ||
  /\.(png|jpe?g|webp|gif)$/i.test(doc.url || "");

export default function ShopApproval({
  applications,
  onApprove,
  onDecline,
  onLoadDocuments,
}) {
  const [tab, setTab] = useState("Pending");
  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [docs, setDocs] = useState(null); // null = not loaded yet
  const [docsLoading, setDocsLoading] = useState(false);

  const counts = useMemo(
    () =>
      TABS.reduce((acc, name) => {
        acc[name] =
          name === "All" ?
            applications.length
          : applications.filter((a) => a.status === name).length;
        return acc;
      }, {}),
    [applications],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      const matchesTab = tab === "All" || a.status === tab;
      const matchesSearch =
        !q ||
        a.shopName?.toLowerCase().includes(q) ||
        a.ownerName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [applications, tab, query]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const openReview = async (application) => {
    setReviewing(application);
    setDeclining(false);
    setReason("");
    setError("");
    setDocs(null);
    if (!onLoadDocuments) return;
    setDocsLoading(true);
    try {
      setDocs(await onLoadDocuments(application));
    } catch (err) {
      setError(err.message || "Couldn't load the documents.");
    } finally {
      setDocsLoading(false);
    }
  };

  const closeReview = () => {
    setReviewing(null);
    setDeclining(false);
    setReason("");
    setError("");
    setDocs(null);
  };

  const approve = async () => {
    setBusy(true);
    const result = await onApprove(reviewing);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    showNotice(`${reviewing.shopName} approved.`);
    closeReview();
  };

  const decline = async (event) => {
    event.preventDefault();
    if (reason.trim().length < 5) {
      setError("Tell the seller why the application was declined.");
      return;
    }
    setBusy(true);
    const result = await onDecline(reviewing, reason.trim());
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    showNotice(`${reviewing.shopName} declined.`);
    closeReview();
  };

  const isPending = reviewing?.status === "Pending";
  const shownDocs = docs ?? reviewing?.documents ?? [];

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Shop Approval</h1>
          <p>Review seller applications and their submitted requirements.</p>
        </div>
      </div>

      <div className="sa-toolbar">
        <div
          className="sa-tabs"
          role="tablist"
          aria-label="Filter applications"
        >
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              className={`sa-tab ${tab === name ? "on" : ""}`}
              onClick={() => setTab(name)}
            >
              {name}
              <span className="sa-count">{counts[name]}</span>
            </button>
          ))}
        </div>

        <label className="sa-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop, owner or email"
            aria-label="Search applications"
          />
        </label>
      </div>

      <div className="table-card sa-card">
        {applications.length === 0 ?
          <EmptyState
            icon={Store}
            title="No shop applications"
            description="Seller applications will appear here once they are submitted."
          />
        : visible.length === 0 ?
          <EmptyState
            icon={Store}
            title="Nothing to show"
            description="No applications match this tab or search."
          />
        : <div className="sa-scroll">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Owner</th>
                  <th>Submitted</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((application) => {
                  const fileCount = application.documents?.length || 0;
                  return (
                    <tr key={application.id}>
                      <td>
                        <div className="sa-shop">
                          <span className="sa-shop-icon" aria-hidden="true">
                            <Store size={15} />
                          </span>
                          <strong>{application.shopName}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="sa-owner">
                          <span>{application.ownerName}</span>
                          <small>{application.email}</small>
                        </div>
                      </td>
                      <td className="sa-date">{application.submittedAt}</td>
                      <td>
                        <span className="sa-docs">
                          <FileText size={12} />
                          {fileCount} file{fileCount === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td>
                        <StatusPill value={application.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`sa-review ${application.status === "Pending" ? "" : "quiet"}`}
                          onClick={() => openReview(application)}
                        >
                          <Eye size={13} />
                          {application.status === "Pending" ? "Review" : "View"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </div>

      {notice && (
        <div className="admin-toast" role="status">
          {notice}
        </div>
      )}

      {reviewing && (
        <div
          className="admin-dialog-backdrop sa-backdrop"
          role="presentation"
          onMouseDown={closeReview}
        >
          <section
            className="admin-user-dialog sa-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-approval-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="shop-approval-title">{reviewing.shopName}</h2>
                <p>
                  {isPending ?
                    "Check the details and documents before you decide."
                  : "This application has already been reviewed."}
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={closeReview}
              >
                ×
              </button>
            </div>

            <div className="admin-user-details">
              <div>
                <span>Owner</span>
                <strong>{reviewing.ownerName}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{reviewing.email}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{reviewing.phone || "Not provided"}</strong>
              </div>
              <div>
                <span>Status</span>
                <StatusPill value={reviewing.status} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span>Shop description</span>
                <strong style={{ fontWeight: 500 }}>
                  {reviewing.description || "Not provided"}
                </strong>
              </div>
            </div>

            <h3 className="sa-section-title">Submitted requirements</h3>
            {docsLoading ?
              <p className="sa-muted">Loading documents…</p>
            : shownDocs.length ?
              <div className="sa-doc-grid">
                {shownDocs.map((doc) => (
                  <figure key={doc.label} className="sa-doc">
                    {isImage(doc) ?
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="sa-doc-img"
                        aria-label={`Open ${doc.label} in a new tab`}
                      >
                        <img src={doc.url} alt={doc.label} />
                      </a>
                    : <div className="sa-doc-img sa-doc-empty">
                        <FileText size={26} />
                      </div>
                    }
                    <figcaption className="sa-doc-foot">
                      <span>{doc.label}</span>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          Open <ExternalLink size={11} />
                        </a>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            : <p className="sa-muted">
                This seller has not uploaded any documents.
              </p>
            }

            {reviewing.status === "Declined" && reviewing.declineReason && (
              <div className="sa-reason">
                <strong>Reason for declining</strong>
                {reviewing.declineReason}
              </div>
            )}

            {error && (
              <p className="admin-form-error sa-error" role="alert">
                {error}
              </p>
            )}

            {isPending && !declining && (
              <div className="admin-dialog-actions sa-actions">
                <button
                  type="button"
                  className="sa-decline-btn"
                  disabled={busy}
                  onClick={() => {
                    setDeclining(true);
                    setError("");
                  }}
                >
                  <X size={14} /> Decline
                </button>
                <button
                  className="primary"
                  type="button"
                  disabled={busy}
                  onClick={approve}
                >
                  <Check size={14} /> Approve shop
                </button>
              </div>
            )}

            {isPending && declining && (
              <form onSubmit={decline} className="sa-decline-form">
                <label htmlFor="sa-reason-input">Reason for declining</label>
                <textarea
                  id="sa-reason-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Example: The ID photo is blurry. Upload a clear copy and apply again."
                  rows={3}
                />
                <div className="admin-dialog-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setDeclining(false);
                      setError("");
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="primary sa-danger"
                  >
                    Decline application
                  </button>
                </div>
              </form>
            )}

            {!isPending && (
              <div className="admin-dialog-actions sa-actions">
                <button className="primary" type="button" onClick={closeReview}>
                  Close
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
