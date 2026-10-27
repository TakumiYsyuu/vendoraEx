import { useState, useMemo } from "react";
import { Bot, Eye, FileText, Flag, Search, X } from "lucide-react";
import { initials } from "../utils/helpers";
import "../styles/staffManage.css";
import "../styles/userManage.css";
import "../styles/reportManage.css";

const STATUS_TABS = [
  ["all", "All"],
  ["escalated", "Needs decision"],
  ["pending", "Open"],
  ["reviewed", "In review"],
  ["resolved", "Resolved"],
];

const STATUS_LABEL = {
  pending: "Open",
  reviewed: "In review",
  escalated: "Needs decision",
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

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

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

// Props:
//   reports     array from GET /api/reports (camelCase fields)
//   onDecision  async (report, "accepted" | "rejected") => { error? }
//   go          optional: navigate to another admin page (used for "Open Users")
export default function ReportManage({ reports = [], onDecision, go }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  // Read from the live list so the dialog shows the new status after saving
  const selected = reports.find((r) => r.id === selectedId) || null;

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

  const openReport = (report) => {
    setActionError("");
    setSelectedId(report.id);
  };

  const decide = async (decision) => {
    if (!selected || saving) return;
    setSaving(true);
    setActionError("");
    const result = await onDecision(selected, decision);
    setSaving(false);
    if (result?.error) setActionError(result.error);
  };

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Reports</h1>
          <p>
            Review staff recommendations and decide on suspensions and bans.
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
        {reports.length === 0 ?
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
                  <th>Staff outcome</th>
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
                    <td>
                      <OutcomePill outcome={r.staffOutcome} />
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
                          onClick={() => openReport(r)}
                        >
                          <Eye size={13} />{" "}
                          {r.status === "escalated" ? "Decide" : "View"}
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

      {selected && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedId(null)}
        >
          <section
            className="admin-user-dialog st-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="report-dialog-title">{selected.subject}</h2>
                <p>
                  Report #{selected.id} · submitted{" "}
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setSelectedId(null)}
              >
                ×
              </button>
            </div>

            <div className="rp-badges">
              <StatusPill status={selected.status} />
              <SourcePill source={selected.source} />
            </div>

            <div className="admin-user-details">
              <div>
                <span>Reported person or store</span>
                <strong>{selected.reportedName}</strong>
              </div>
              <div>
                <span>Reported email</span>
                <strong>{selected.reportedEmail || "—"}</strong>
              </div>
              <div>
                <span>Order ID</span>
                <strong>{selected.orderId || "—"}</strong>
              </div>
              <div>
                <span>Reported by</span>
                <strong>
                  {selected.reporterEmail || `User #${selected.reporterId}`} (
                  {ROLE_LABEL[selected.reporterRole] || selected.reporterRole})
                </strong>
              </div>
              <div>
                <span>Handled by</span>
                <strong>{selected.handlerName || "Unclaimed"}</strong>
              </div>
            </div>

            {selected.aiSummary && (
              <div className="rp-block">
                <span>AI summary</span>
                <p>{selected.aiSummary}</p>
              </div>
            )}

            <div className="rp-block">
              <span>Reporter's concern</span>
              <p>{selected.details}</p>
            </div>

            {selected.staffOutcome && (
              <div className="rp-block">
                <span>Staff final report</span>
                <div className="rp-final">
                  <OutcomePill outcome={selected.staffOutcome} />
                  <p>{selected.staffSummary}</p>
                  <small>
                    {selected.handlerName ? `${selected.handlerName} · ` : ""}
                    {formatDateTime(selected.finalAt)}
                  </small>
                </div>
              </div>
            )}

            {selected.adminDecision && (
              <p className="rp-updated">
                You {selected.adminDecision} this recommendation on{" "}
                {formatDateTime(selected.decidedAt)}
                {selected.deciderName ? ` (${selected.deciderName})` : ""}.
              </p>
            )}

            {selected.status === "escalated" && (
              <p className="rp-updated">
                Accepting records your decision and marks the report resolved.
                To restrict the account itself, use the Users page.
              </p>
            )}

            {actionError && (
              <p className="admin-form-error" role="alert">
                {actionError}
              </p>
            )}

            <div className="admin-dialog-actions rp-actions">
              <button type="button" onClick={() => setSelectedId(null)}>
                Close
              </button>
              {selected.status === "escalated" && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => decide("rejected")}
                  >
                    Reject recommendation
                  </button>
                  <button
                    className="primary"
                    type="button"
                    disabled={saving}
                    onClick={() => decide("accepted")}
                  >
                    {saving ? "Saving..." : "Accept recommendation"}
                  </button>
                </>
              )}
              {selected.adminDecision === "accepted" && go && (
                <button
                  className="primary"
                  type="button"
                  onClick={() => go("users")}
                >
                  Open Users
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
