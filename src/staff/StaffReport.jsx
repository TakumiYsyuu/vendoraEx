import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Eye, MessageSquare, X } from "lucide-react";
import "../styles/StaffReport.css";

/* Set USE_MOCK = false once the /api/staff/reports routes exist. */
const USE_MOCK = true;
const API = "/api/staff/reports";

/* ---------- API layer (adapt paths/auth to your server) ---------- */

async function request(path = "", options = {}) {
  const token = localStorage.getItem("token"); // change if you store auth elsewhere
  const res = await fetch(API + path, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

const ago = (mins) => new Date(Date.now() - mins * 60000).toISOString();

let mockDb = [
  {
    id: "R-1042",
    subject: "Seller never shipped my order",
    category: "Non-delivery",
    status: "open",
    assignee: null,
    createdAt: ago(35),
    reporter: { name: "Maria Santos" },
    target: { type: "Seller", name: "GadgetHub Manila" },
    description:
      "I paid 12 days ago and the seller keeps saying it ships tomorrow. Order #88213.",
    finalReport: null,
  },
  {
    id: "R-1041",
    subject: "Listing looks like a counterfeit",
    category: "Counterfeit product",
    status: "in_review",
    assignee: "You",
    createdAt: ago(300),
    reporter: { name: "Paolo Reyes" },
    target: { type: "Product", name: "Air Runner X sneakers" },
    description:
      "The box and stitching are fake. Photos are attached to the order.",
    finalReport: null,
  },
  {
    id: "R-1038",
    subject: "Buyer is sending abusive messages",
    category: "Harassment",
    status: "resolved",
    assignee: "You",
    createdAt: ago(2900),
    reporter: { name: "Lena's Bakeshop" },
    target: { type: "Buyer", name: "user_48213" },
    description: "This buyer keeps cursing at us after a refund was denied.",
    finalReport: {
      outcome: "ban",
      summary:
        "Chat logs confirm repeated abusive messages after two warnings. Recommending a permanent ban.",
      at: ago(2600),
    },
  },
];

const mockUpdate = (id, fn) => {
  mockDb = mockDb.map((r) => (r.id === id ? fn(r) : r));
  return Promise.resolve(structuredClone(mockDb.find((r) => r.id === id)));
};

const api = {
  list: () => (USE_MOCK ? Promise.resolve(structuredClone(mockDb)) : request()),
  claim: (id) =>
    USE_MOCK ?
      mockUpdate(id, (r) => ({ ...r, status: "in_review", assignee: "You" }))
    : request(`/${id}/claim`, { method: "PATCH" }),
  finalize: (id, outcome, summary) =>
    USE_MOCK ?
      mockUpdate(id, (r) => ({
        ...r,
        status: "resolved",
        finalReport: { outcome, summary, at: new Date().toISOString() },
      }))
    : request(`/${id}/final`, {
        method: "POST",
        body: JSON.stringify({ outcome, summary }),
      }),
};

/* ---------- Labels and helpers ---------- */

const STATUS = { open: "Open", in_review: "In review", resolved: "Resolved" };

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

const timeAgo = (iso) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .list()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const replace = (updated) =>
    setReports((list) => list.map((r) => (r.id === updated.id ? updated : r)));
  return { reports, loading, error, setError, replace };
}

/* ---------- Small pieces ---------- */

const Status = ({ value }) => (
  <span className={`sr-status sr-${value}`}>{STATUS[value]}</span>
);

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

function ReportTable({ rows, loading, onOpen, empty }) {
  return (
    <table>
      <thead>
        <tr>
          <th>REPORT</th>
          <th>REPORTER</th>
          <th>REPORTED</th>
          <th>SUBMITTED</th>
          <th>STATUS</th>
          <th>ACTION</th>
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr>
            <td colSpan="6">Loading reports…</td>
          </tr>
        )}
        {!loading && rows.length === 0 && (
          <tr>
            <td colSpan="6">{empty}</td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <strong className="sr-title">{r.subject}</strong>
              <small className="sr-sub">
                {r.id} · {r.category}
              </small>
            </td>
            <td>{r.reporter.name}</td>
            <td>
              {r.target.name}
              <small className="sr-sub">{r.target.type}</small>
            </td>
            <td>{timeAgo(r.createdAt)}</td>
            <td>
              <Status value={r.status} />
            </td>
            <td>
              <button className="text-btn" onClick={() => onOpen(r.id)}>
                <Eye size={13} /> {r.status === "resolved" ? "View" : "Review"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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

/* ---------- Case dialog: report details + final report ---------- */

function CaseDialog({ report, go, onClose, onChange, onToast }) {
  const [outcome, setOutcome] = useState("none");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const summaryOk = summary.trim().length >= 20;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      onChange(await action());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitFinal = async () => {
    if (await run(() => api.finalize(report.id, outcome, summary.trim()))) {
      onToast(
        needsAdmin(outcome) ?
          "Final report sent to admins"
        : "Final report submitted",
      );
    }
  };

  const openMessages = () => {
    onClose();
    if (go) go("staff-messages");
  };

  return (
    <div className="admin-dialog-backdrop sr-backdrop" onMouseDown={onClose}>
      <div
        className="admin-user-dialog sr-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Report ${report.id}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-heading">
          <div>
            <h2>{report.subject}</h2>
            <p>
              {report.id} · {report.category} · Submitted{" "}
              {timeAgo(report.createdAt)}
            </p>
          </div>
          <button
            className="admin-dialog-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sr-dialog-grid">
          {/* Left: what was reported */}
          <section className="sr-side" aria-label="Report details">
            <div className="sr-facts">
              <div>
                <span>Reporter</span>
                <strong>{report.reporter.name}</strong>
              </div>
              <div>
                <span>Reported</span>
                <strong>{report.target.name}</strong>
              </div>
              <div>
                <span>Handler</span>
                <strong>{report.assignee || "Unclaimed"}</strong>
              </div>
              <div>
                <span>Status</span>
                <Status value={report.status} />
              </div>
            </div>

            <div className="sr-concern">
              <h3>Reporter's concern</h3>
              <p>{report.description}</p>
            </div>

            <div className="sr-actions">
              {report.status === "open" && (
                <button
                  className="outline"
                  disabled={busy}
                  onClick={() => run(() => api.claim(report.id))}
                >
                  Claim this report
                </button>
              )}
              <button className="outline sr-msg-btn" onClick={openMessages}>
                <MessageSquare size={14} /> Message complainant
              </button>
              <button className="outline sr-msg-btn" onClick={openMessages}>
                <MessageSquare size={14} /> Message the accused
              </button>
            </div>
          </section>

          {/* Right: final report */}
          <aside className="sr-side" aria-label="Final report">
            <h3>Final report</h3>
            {report.finalReport ?
              <div className={`sr-final sr-o-${report.finalReport.outcome}`}>
                <strong>{OUTCOMES[report.finalReport.outcome]}</strong>
                <p>{report.finalReport.summary}</p>
                <small>Submitted {timeAgo(report.finalReport.at)}</small>
                {needsAdmin(report.finalReport.outcome) && (
                  <small className="sr-handoff">
                    Sent to admins for a decision
                  </small>
                )}
              </div>
            : <div className="sr-field-group">
                <label htmlFor="sr-outcome">Outcome</label>
                <OutcomeSelect value={outcome} onChange={setOutcome} />

                <label htmlFor="sr-summary">Summary of the concern</label>
                <textarea
                  id="sr-summary"
                  rows={5}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="What happened, what you checked, and why you chose this outcome"
                />
                <small className={summaryOk ? "sr-hint ok" : "sr-hint"}>
                  {summaryOk ?
                    "Ready to submit"
                  : `Add at least ${20 - summary.trim().length} more characters`
                  }
                </small>

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
                  Submit final report
                </button>
              </div>
            }
            {error && <p className="admin-form-error">{error}</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reports page ---------- */

function ReportsPage({ reports, loading, openCase }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c = { all: reports.length, open: 0, in_review: 0, resolved: 0 };
    reports.forEach((r) => (c[r.status] += 1));
    return c;
  }, [reports]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q ||
          [r.subject, r.id, r.reporter.name, r.target.name].some((t) =>
            t.toLowerCase().includes(q),
          )),
    );
  }, [reports, filter, query]);

  const filters = [
    ["all", "All"],
    ["open", "Open"],
    ["in_review", "In review"],
    ["resolved", "Resolved"],
  ];

  return (
    <div className="admin-page admin-moderation">
      <div className="page-title admin-page-title">
        <div>
          <h1>Reports</h1>
          <p>
            Review concerns from buyers and sellers, then submit a final report
            for each case.
          </p>
        </div>
        <input
          className="sr-search"
          type="search"
          placeholder="Search reports, people, IDs"
          aria-label="Search reports"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="sr-filters" role="tablist" aria-label="Filter by status">
        {filters.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`outline small ${filter === key ? "on" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="table-card">
        <ReportTable
          rows={rows}
          loading={loading}
          onOpen={openCase}
          empty="No reports match. Try another filter or clear the search."
        />
      </div>
    </div>
  );
}

/* ---------- Entry point ---------- */

export default function StaffReport({ go }) {
  const { reports, loading, error, setError, replace } = useReports();
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
          onClose={() => setOpenId(null)}
          onChange={replace}
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
