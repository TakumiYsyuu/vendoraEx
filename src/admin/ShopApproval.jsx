import { useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  FileText,
  Search,
  Store,
  Eye,
  X,
} from "lucide-react";
import Status from "../components/Status";

const TABS = ["All", "Pending", "Approved", "Declined"];

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
  /^data:image\//.test(doc.url || "") ||
  /\.(png|jpe?g|webp|gif)$/i.test(doc.url || "");

export default function ShopApproval({ applications, onApprove, onDecline }) {
  const [tab, setTab] = useState("Pending");
  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

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

  const openReview = (application) => {
    setReviewing(application);
    setDeclining(false);
    setReason("");
    setError("");
  };

  const closeReview = () => {
    setReviewing(null);
    setDeclining(false);
    setReason("");
    setError("");
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

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Shop Approval</h1>
          <p>Review seller applications and their submitted requirements.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                tab === name ?
                  "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
            >
              {name} ({counts[name]})
            </button>
          ))}
        </div>

        <label className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop, owner or email"
            className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="table-card overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
        : <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Shop</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Documents</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-emerald-50/30"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {application.shopName}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      <div>{application.ownerName}</div>
                      <div className="text-xs text-gray-400">
                        {application.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {application.submittedAt}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {application.documents?.length || 0} file
                      {application.documents?.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Status>{application.status}</Status>
                    </td>
                    <td className="admin-user-actions px-5 py-3.5">
                      <button
                        className="text-btn flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                        onClick={() => openReview(application)}
                      >
                        <Eye size={14} />
                        {application.status === "Pending" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
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
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={closeReview}
        >
          <section
            className="admin-user-dialog admin-product-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-approval-title"
            onMouseDown={(event) => event.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto" }}
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
                <Status>{reviewing.status}</Status>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span>Business address</span>
                <strong>{reviewing.address || "Not provided"}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span>Shop description</span>
                <strong style={{ fontWeight: 500 }}>
                  {reviewing.description || "Not provided"}
                </strong>
              </div>
            </div>

            <h3 className="mb-2 mt-5 text-sm font-semibold text-gray-900">
              Submitted requirements
            </h3>
            {reviewing.documents?.length ?
              <ul className="grid gap-2">
                {reviewing.documents.map((doc) => (
                  <li
                    key={doc.label}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5"
                  >
                    {isImage(doc) ?
                      <img
                        src={doc.url}
                        alt={doc.label}
                        className="h-12 w-12 shrink-0 rounded-md border border-gray-100 object-cover"
                      />
                    : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-gray-100 text-gray-400">
                        <FileText size={20} />
                      </span>
                    }
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                      {doc.label}
                    </span>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Open <ExternalLink size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            : <p className="text-sm text-gray-500">
                This seller has not uploaded any documents.
              </p>
            }

            {reviewing.status === "Declined" && reviewing.declineReason && (
              <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <strong className="block text-xs">Reason for declining</strong>
                {reviewing.declineReason}
              </div>
            )}

            {error && (
              <p className="admin-form-error mt-4" role="alert">
                {error}
              </p>
            )}

            {isPending && !declining && (
              <div className="admin-dialog-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDeclining(true);
                    setError("");
                  }}
                  className="flex items-center gap-1"
                  style={{ color: "#cf5260", borderColor: "#f3c9cf" }}
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
              <form onSubmit={decline} className="mt-5">
                <label className="grid gap-1.5 text-xs font-bold text-gray-600">
                  Reason for declining
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Example: The business permit is expired. Upload a valid copy and apply again."
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-normal text-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <div className="admin-dialog-actions" style={{ marginTop: 12 }}>
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
                    className="primary"
                    style={{ background: "#d94b58" }}
                  >
                    Decline application
                  </button>
                </div>
              </form>
            )}

            {!isPending && (
              <div className="admin-dialog-actions" style={{ marginTop: 20 }}>
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
