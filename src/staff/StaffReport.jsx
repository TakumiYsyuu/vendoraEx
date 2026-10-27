import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Flag,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { initials } from "../utils/helpers";
import { fetchReports, claimReport, submitFinalReport } from "../logic/admin";
import "../styles/staffManage.css";
import "../styles/userManage.css";
import "../styles/Reportmanage.css";
import "../styles/StaffReport.css";

/* ---------- Labels and helpers ---------- */

const STATUS_TABS = [
  ["all", "All"],
  ["pending", "Open"],
  ["reviewed", "In review"],
  ["escalated", "Awaiting admin"],
  ["resolved", "Resolved"],
];

const STATUS_LABEL = {
  pending: "Open",
  reviewed: "In review",
  escalated: "Awaiting admin",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const SOURCE_OPTIONS = [
  ["all", "All sources"],
  ["form", "Form"],
  ["ai", "AI assistant"],
];

const OUTCOMES = {
  none: "No violation found",
  warn: "Warning issued",
  suspend: "Suspension recommended",
  ban: "Ban recommended",
};

const OUTCOME_HINTS = {
  none: "The report doesn't break any rules",
  warn: "Warn the account, no further action",
  suspend: "Admins decide on suspending the account",
  ban: "Admins decide on banning the account",
};

const needsAdmin = (outcome) => outcome === "ban" || outcome === "suspend";

const ROLE_LABEL = { shopper: "Buyer", seller: "Seller" };

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setReports(await fetchReports());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { reports, loading, error, setError, reload: load };
}

/* ---------- Small pieces ---------- */

const StatusPill = ({ status }) => (
  <span className={`rp-status rp-${status}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

const SourcePill = ({ source }) => (
  <span className={`rp-source rp-source-${source}`}>
    {source === "ai" ?
      <Bot size={12} />
    : <FileText size={12} />}
    {source === "ai" ? "AI" : "Form"}
  </span>
);

const OutcomePill = ({ outcome }) =>
  outcome ?
    <span className={`rp-outcome rp-o-${outcome}`}>{OUTCOMES[outcome]}</span>
  : <span className="st-muted">—</span>;

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Notice({ error, onClose }) {
  if (!error) return null;
  return (
    <p className="admin-form-error sr-notice" role="alert">
      {error}{" "}
      <button className="text-btn" onClick={onClose}>
        Dismiss
      </button>
    </p>
  );
}

/* ---------- Outcome dropdown ---------- */

function OutcomeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation(); // close the menu only, not the whole dialog
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="sr-select" ref={wrapRef}>
      <button
        type="button"
        id="sr-outcome"
        className={`sr-select-btn ${open ? "open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <i className={`sr-dot sr-d-${value}`} aria-hidden="true" />
        <span>{OUTCOMES[value]}</span>
        <ChevronDown size={15} className="sr-chev" aria-hidden="true" />
      </button>

      {open && (
        <ul className="sr-select-menu" role="listbox" aria-label="Outcome">
          {Object.keys(OUTCOMES).map((key) => (
            <li key={key} role="option" aria-selected={key === value}>
              <button
                type="button"
                className={key === value ? "on" : ""}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
              >
                <i className={`sr-dot sr-d-${key}`} aria-hidden="true" />
                <span>
                  <strong>{OUTCOMES[key]}</strong>
                  <small>{OUTCOME_HINTS[key]}</small>
                </span>
                {key === value && <Check size={14} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Case dialog ---------- */

function CaseDialog({ report, go, onMessage, onClose, onUpdated, onToast }) {
  const [outcome, setOutcome] = useState("none");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const summaryOk = summary.trim().length >= 0;

  const claimedByOther = report.status === "reviewed" && !report.claimedByMe;
  const canFinalize = report.status === "reviewed" && report.claimedByMe;
  const hasFinal = !!report.staffOutcome;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (action, message) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await onUpdated();
      onToast(message);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      await onUpdated(); // someone else may have changed it
    } finally {
      setBusy(false);
    }
  };

  const claim = () => run(() => claimReport(report.id), "Report claimed");

  const submitFinal = () =>
    run(
      () => submitFinalReport(report.id, outcome, summary.trim()),
      needsAdmin(outcome) ?
        "Final report sent to admins"
      : "Final report submitted",
    );

  // Opens a chat with the complainant or the accused
  const message = (target) => {
    onClose();
    if (onMessage) onMessage(target);
    else if (go) go("staff-messages");
  };

  return (
    <div
      className="admin-dialog-backdrop st-backdrop sr-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="admin-user-dialog st-dialog sr-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-report-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-heading">
          <div>
            <h2 id="staff-report-title">{report.subject}</h2>
            <p>
              Report #{report.id} · submitted {formatDateTime(report.createdAt)}
            </p>
          </div>
          <button
            className="admin-dialog-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="rp-badges">
          <StatusPill status={report.status} />
          <SourcePill source={report.source} />
        </div>

        <div className="sr-dialog-grid">
          {/* Left: what was reported */}
          <section className="sr-side" aria-label="Report details">
            <div className="admin-user-details">
              <div>
                <span>Reported by</span>
                <strong>
                  {report.reporterEmail || `User #${report.reporterId}`} (
                  {ROLE_LABEL[report.reporterRole] || report.reporterRole})
                </strong>
              </div>
              <div>
                <span>Reported person or store</span>
                <strong>{report.reportedName}</strong>
              </div>
              <div>
                <span>Reported email</span>
                <strong>{report.reportedEmail || "—"}</strong>
              </div>
              <div>
                <span>Order ID</span>
                <strong>{report.orderId || "—"}</strong>
              </div>
              <div>
                <span>Handler</span>
                <strong>
                  {report.handlerName ?
                    report.claimedByMe ?
                      `${report.handlerName} (you)`
                    : report.handlerName
                  : "Unclaimed"}
                </strong>
              </div>
            </div>

            {report.aiSummary && (
              <div className="rp-block">
                <span>AI summary</span>
                <p>{report.aiSummary}</p>
              </div>
            )}

            <div className="rp-block">
              <span>Reporter's concern</span>
              <p>{report.details}</p>
            </div>

            {report.claimedByMe && report.status !== "pending" && (
              <div className="sr-actions">
                <button
                  className="outline sr-msg-btn"
                  onClick={() =>
                    message({
                      id: report.reporterId,
                      name: report.reporterEmail || "",
                    })
                  }
                >
                  <MessageSquare size={14} /> Message complainant
                </button>
                <button
                  className="outline sr-msg-btn"
                  onClick={() =>
                    message(
                      report.reportedUserId ?
                        { id: report.reportedUserId, name: report.reportedName }
                      : report.reportedName,
                    )
                  }
                >
                  <MessageSquare size={14} /> Message the accused
                </button>
              </div>
            )}
          </section>

          {/* Right: claim / final report */}
          <aside className="sr-side" aria-label="Final report">
            <h3>Final report</h3>

            {hasFinal ?
              <div className="sr-final">
                <OutcomePill outcome={report.staffOutcome} />
                <p>{report.staffSummary}</p>
                <small>Submitted {formatDateTime(report.finalAt)}</small>
                {report.status === "escalated" && (
                  <small className="sr-handoff">
                    Sent to admins for a decision
                  </small>
                )}
                {report.adminDecision && (
                  <small className="sr-handoff">
                    Admin {report.adminDecision} this recommendation
                    {report.deciderName ? ` (${report.deciderName})` : ""}
                  </small>
                )}
              </div>
            : report.status === "pending" ?
              <div className="sr-field-group">
                <p className="sr-hint">
                  Claim this report to start reviewing it. Once claimed, other
                  staff can't take it.
                </p>
                <button className="primary" disabled={busy} onClick={claim}>
                  {busy ? "Claiming..." : "Claim this report"}
                </button>
              </div>
            : claimedByOther ?
              <p className="sr-hint">
                {report.handlerName || "Another staff member"} is handling this
                report.
              </p>
            : canFinalize ?
              <div className="sr-field-group">
                <label htmlFor="sr-outcome">Outcome</label>
                <OutcomeSelect value={outcome} onChange={setOutcome} />

                <label htmlFor="sr-summary">Summary of the concern</label>
                <textarea
                  id="sr-summary"
                  rows={5}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  maxLength={2000}
                  placeholder="What happened, what you checked, and why you chose this outcome"
                />

                {needsAdmin(outcome) && (
                  <p className="sr-warn">
                    Admins review this before any account is{" "}
                    {outcome === "ban" ? "banned" : "suspended"}.
                  </p>
                )}

                <button
                  className={`primary ${outcome === "ban" ? "sr-danger" : ""}`}
                  disabled={busy || !summaryOk}
                  onClick={submitFinal}
                >
                  {busy ? "Submitting..." : "Submit final report"}
                </button>
              </div>
            : <p className="sr-hint">No final report for this case.</p>}

            {error && (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            )}
          </aside>
        </div>

        <div className="admin-dialog-actions rp-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------- Reports page ---------- */

function ReportsPage({ reports, loading, openCase }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const statusCounts = useMemo(() => {
    const counts = { all: reports.length };
    for (const [value] of STATUS_TABS) {
      if (value !== "all")
        counts[value] = reports.filter((r) => r.status === value).length;
    }
    return counts;
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      const matchesSearch =
        !q ||
        r.subject?.toLowerCase().includes(q) ||
        r.reportedName?.toLowerCase().includes(q) ||
        r.reporterEmail?.toLowerCase().includes(q) ||
        r.orderId?.toLowerCase().includes(q) ||
        String(r.id).includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesSource = sourceFilter === "all" || r.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [reports, query, statusFilter, sourceFilter]);

  const hasActiveFilters =
    query.trim() !== "" || statusFilter !== "all" || sourceFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
  };

  const actionLabel = (r) =>
    r.status === "pending" ? "Review"
    : r.status === "reviewed" && r.claimedByMe ? "Continue"
    : "View";

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Reports</h1>
          <p>
            Claim a report, talk to both sides, then submit a final report for
            each case.
          </p>
        </div>
      </div>

      <div className="st-toolbar">
        <div className="st-tabs" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={statusFilter === value}
              className={`st-tab ${statusFilter === value ? "on" : ""}`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
              <span className="st-count">{statusCounts[value]}</span>
            </button>
          ))}
        </div>

        <div className="um-filters">
          <select
            className="um-select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Filter by source"
          >
            {SOURCE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <label className="st-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subject, name or order"
              aria-label="Search reports"
            />
            {query && (
              <button
                type="button"
                className="st-search-clear"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </label>

          {hasActiveFilters && (
            <button type="button" className="um-reset" onClick={clearFilters}>
              <X size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="table-card st-card">
        {loading ?
          <EmptyState
            icon={Flag}
            title="Loading reports…"
            description="Fetching the latest reports."
          />
        : reports.length === 0 ?
          <EmptyState
            icon={Flag}
            title="No reports yet"
            description="Reports from buyers and sellers will appear here."
          />
        : filteredReports.length === 0 ?
          <EmptyState
            icon={Search}
            title="No matching reports"
            description="Try a different search or change the filters."
          />
        : <div className="st-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Reported</th>
                  <th>Reporter</th>
                  <th>Handler</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="rp-subject">
                        <strong>{r.subject}</strong>
                        <small>
                          #{r.id}
                          {r.orderId ? ` · Order ${r.orderId}` : ""}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="st-person">
                        <span className="st-avatar" aria-hidden="true">
                          {initials(r.reportedName)}
                        </span>
                        <strong>{r.reportedName}</strong>
                      </div>
                    </td>
                    <td className="st-muted">
                      {r.reporterEmail || `User #${r.reporterId}`}
                      <small className="rp-role">
                        {ROLE_LABEL[r.reporterRole] || r.reporterRole}
                      </small>
                    </td>
                    <td className="st-muted">
                      {r.handlerName ?
                        r.claimedByMe ?
                          "You"
                        : r.handlerName
                      : "Unclaimed"}
                    </td>
                    <td>
                      <StatusPill status={r.status} />
                    </td>
                    <td className="st-muted">{formatDateTime(r.createdAt)}</td>
                    <td>
                      <div className="st-actions">
                        <button
                          type="button"
                          className="st-btn"
                          onClick={() => openCase(r.id)}
                        >
                          <Eye size={13} /> {actionLabel(r)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}

/* ---------- Entry point ---------- */

// Props:
//   go         navigate to another staff page
//   onMessage  optional: opens a chat with a person. Receives a user
//              ({ id, name }) or just a name string.
export default function StaffReport({ go, onMessage }) {
  const { reports, loading, error, setError, reload } = useReports();
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const current = reports.find((r) => r.id === openId) || null;

  return (
    <>
      <Notice error={error} onClose={() => setError("")} />

      <ReportsPage reports={reports} loading={loading} openCase={setOpenId} />

      {current && (
        <CaseDialog
          report={current}
          go={go}
          onMessage={onMessage}
          onClose={() => setOpenId(null)}
          onUpdated={reload}
          onToast={setToast}
        />
      )}
      {toast && (
        <div className="admin-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
