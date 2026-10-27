import { useState, useMemo, useRef } from "react";
import {
  CalendarDays,
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
  X,
} from "lucide-react";
import { initials } from "../utils/helpers";
import "../styles/staffManage.css";
import "../styles/userManage.css";

const ROLE_TABS = [
  ["all", "All"],
  ["buyer", "Buyers"],
  ["seller", "Sellers"],
];

const STATUS_OPTIONS = [
  ["all", "All status"],
  ["active", "Active"],
  ["restricted", "Restricted"],
];

const EMPTY_DRAFT = {
  name: "",
  email: "",
  phone: "",
  accountType: "Buyer",
  password: "",
};

function toInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toInput(d);
}

function formatDateTime(value) {
  if (!value) return "No end date";
  return new Date(value).toLocaleString("en-US", {
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

const StatusPill = ({ restricted }) => (
  <span className={`st-status ${restricted ? "st-restricted" : "st-active"}`}>
    {restricted ? "Restricted" : "Active"}
  </span>
);

const RolePill = ({ type }) => (
  <span className={`um-role um-${String(type || "").toLowerCase()}`}>
    {type}
  </span>
);

function DateTimeField({ id, name, value, min, onChange }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    try {
      inputRef.current?.showPicker();
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="um-datetime">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="datetime-local"
        value={value}
        min={min}
        onChange={onChange}
      />
      <button
        type="button"
        aria-label="Open calendar"
        title="Pick date and time"
        onClick={openPicker}
      >
        <CalendarDays size={16} />
      </button>
    </div>
  );
}

export default function UserManage({ users, onSaveUser, onToggleRestriction }) {
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [restrictTarget, setRestrictTarget] = useState(null);
  const [restrictDraft, setRestrictDraft] = useState({
    reason: "",
    startDate: "",
    endDate: "",
  });
  const [restrictError, setRestrictError] = useState("");

  const [unrestrictTarget, setUnrestrictTarget] = useState(null);
  const [unrestrictError, setUnrestrictError] = useState("");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const roleCounts = useMemo(() => {
    const count = (role) =>
      users.filter((u) => u.type?.toLowerCase() === role).length;
    return {
      all: users.length,
      buyer: count("buyer"),
      seller: count("seller"),
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q);
      const matchesRole =
        roleFilter === "all" || user.type?.toLowerCase() === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "restricted" ? user.restricted : !user.restricted);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const hasActiveFilters =
    query.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const openEditor = (mode, user) => {
    setFormError("");
    setEditor({ mode, user });
    setDraft(
      user ?
        {
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          accountType: user.type,
          password: "",
        }
      : EMPTY_DRAFT,
    );
  };

  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const submitUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await onSaveUser({
      ...draft,
      id: editor?.mode === "edit" ? editor.user.id : undefined,
      existingEmail: editor?.mode === "edit" ? editor.user.email : "",
    });
    setSaving(false);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    setEditor(null);
  };

  const openRestrict = (user) => {
    setRestrictError("");
    setRestrictTarget(user);
    setRestrictDraft({
      reason: "",
      startDate: toInput(new Date()),
      endDate: addDays(7),
    });
  };

  const updateRestrictDraft = (event) => {
    const { name, value } = event.target;
    setRestrictDraft((current) => ({ ...current, [name]: value }));
  };

  const submitRestrict = async (event) => {
    event.preventDefault();
    const { reason, startDate, endDate } = restrictDraft;
    if (!reason.trim() || !startDate || !endDate) {
      setRestrictError("Reason, start, and end are all required.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setRestrictError("The end must be after the start.");
      return;
    }
    setSaving(true);
    const result = await onToggleRestriction(restrictTarget, restrictDraft);
    setSaving(false);
    if (result?.error) {
      setRestrictError(result.error);
      return;
    }
    setRestrictTarget(null);
  };

  const openUnrestrict = (user) => {
    setUnrestrictError("");
    setUnrestrictTarget(user);
  };

  const confirmUnrestrict = async () => {
    setSaving(true);
    const result = await onToggleRestriction(unrestrictTarget);
    setSaving(false);
    if (result?.error) {
      setUnrestrictError(result.error);
      return;
    }
    setUnrestrictTarget(null);
  };

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>User Management</h1>
          <p>
            Manage user accounts, roles, and access permissions across Vendora.
          </p>
        </div>
        <button
          className="primary admin-addStaff"
          onClick={() => openEditor("create")}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-tabs" role="tablist" aria-label="Filter by role">
          {ROLE_TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={roleFilter === value}
              className={`st-tab ${roleFilter === value ? "on" : ""}`}
              onClick={() => setRoleFilter(value)}
            >
              {label}
              <span className="st-count">{roleCounts[value]}</span>
            </button>
          ))}
        </div>

        <div className="um-filters">
          <select
            className="um-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map(([value, label]) => (
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
              placeholder="Search name or email"
              aria-label="Search users"
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
        {users.length === 0 ?
          <EmptyState
            icon={Users}
            title="No registered users"
            description="New buyer registrations will appear here."
          />
        : filteredUsers.length === 0 ?
          <EmptyState
            icon={Search}
            title="No matching users"
            description="Try a different search or change the filters."
          />
        : <div className="st-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id ?? user.email}>
                    <td>
                      <div className="st-person">
                        <span className="st-avatar" aria-hidden="true">
                          {initials(user.name)}
                        </span>
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td className="st-muted">{user.email}</td>
                    <td>
                      <RolePill type={user.type} />
                    </td>
                    <td
                      title={
                        user.restricted ?
                          `${user.restrictionReason} (until ${formatDateTime(user.restrictionEnd)})`
                        : undefined
                      }
                    >
                      <StatusPill restricted={user.restricted} />
                    </td>
                    <td>
                      <div className="st-actions">
                        <button
                          type="button"
                          className="st-btn"
                          onClick={() => openEditor("view", user)}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          type="button"
                          className="st-btn"
                          onClick={() => openEditor("edit", user)}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        {user.restricted ?
                          <button
                            type="button"
                            className="st-btn st-btn-good"
                            onClick={() => openUnrestrict(user)}
                          >
                            <ShieldCheck size={13} /> Unrestrict
                          </button>
                        : <button
                            type="button"
                            className="st-btn st-btn-warn"
                            onClick={() => openRestrict(user)}
                          >
                            <ShieldOff size={13} /> Restrict
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {editor && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={() => setEditor(null)}
        >
          <section
            className="admin-user-dialog st-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="admin-user-dialog-title">
                  {editor.mode === "create" ?
                    "Add User"
                  : editor.mode === "edit" ?
                    "Edit user"
                  : "Account details"}
                </h2>
                <p>
                  {editor.mode === "create" ?
                    "Create a buyer or seller account for the marketplace."
                  : "Review the account details and access status."}
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setEditor(null)}
              >
                ×
              </button>
            </div>

            {editor.mode === "view" ?
              <>
                <div className="st-profile">
                  <span className="st-avatar st-avatar-lg" aria-hidden="true">
                    {initials(draft.name)}
                  </span>
                  <div>
                    <strong>{draft.name}</strong>
                    <StatusPill restricted={editor.user.restricted} />
                  </div>
                </div>
                <div className="admin-user-details">
                  <div>
                    <span>Email</span>
                    <strong>{draft.email}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{draft.phone || "—"}</strong>
                  </div>
                  <div>
                    <span>Role</span>
                    <RolePill type={draft.accountType} />
                  </div>
                  {editor.user.restricted && (
                    <>
                      <div className="um-full">
                        <span>Restriction reason</span>
                        <strong>{editor.user.restrictionReason}</strong>
                      </div>
                      <div>
                        <span>Starts</span>
                        <strong>
                          {formatDateTime(editor.user.restrictionStart)}
                        </strong>
                      </div>
                      <div>
                        <span>Ends</span>
                        <strong>
                          {formatDateTime(editor.user.restrictionEnd)}
                        </strong>
                      </div>
                    </>
                  )}
                  <button className="primary" onClick={() => setEditor(null)}>
                    Close
                  </button>
                </div>
              </>
            : <form className="admin-user-form um-form" onSubmit={submitUser}>
                <label>
                  Full name
                  <input
                    name="name"
                    value={draft.name}
                    onChange={updateDraft}
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    value={draft.email}
                    onChange={updateDraft}
                    disabled={editor.mode === "edit"}
                    autoComplete="email"
                    required
                  />
                </label>
                {editor.mode === "create" && (
                  <label>
                    Phone number
                    <input
                      name="phone"
                      type="tel"
                      value={draft.phone}
                      onChange={updateDraft}
                      autoComplete="tel"
                      required
                    />
                  </label>
                )}
                <label>
                  Role
                  <select
                    name="accountType"
                    value={draft.accountType}
                    onChange={updateDraft}
                  >
                    <option>Buyer</option>
                    <option>Seller</option>
                  </select>
                </label>
                {editor.mode === "create" && (
                  <label>
                    Temporary password
                    <input
                      name="password"
                      type="password"
                      value={draft.password}
                      onChange={updateDraft}
                      autoComplete="new-password"
                      minLength="8"
                      required
                    />
                  </label>
                )}
                {formError && (
                  <p className="admin-form-error" role="alert">
                    {formError}
                  </p>
                )}
                <div className="admin-dialog-actions">
                  <button type="button" onClick={() => setEditor(null)}>
                    Cancel
                  </button>
                  <button className="primary" type="submit" disabled={saving}>
                    {saving ?
                      "Saving..."
                    : editor.mode === "create" ?
                      "Add User"
                    : "Save changes"}
                  </button>
                </div>
              </form>
            }
          </section>
        </div>
      )}

      {restrictTarget && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={() => setRestrictTarget(null)}
        >
          <section
            className="admin-user-dialog st-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restrict-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="restrict-dialog-title">Restrict account</h2>
                <p>
                  <strong>{restrictTarget.name}</strong> ({restrictTarget.email}
                  ) will not be able to sign in during this period.
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setRestrictTarget(null)}
              >
                ×
              </button>
            </div>

            <form
              className="admin-user-form um-form"
              onSubmit={submitRestrict}
              noValidate
            >
              <label className="um-full">
                Reason
                <textarea
                  name="reason"
                  value={restrictDraft.reason}
                  onChange={updateRestrictDraft}
                  maxLength={500}
                  rows={3}
                  placeholder="Explain why this account is being restricted"
                />
                <span className="um-counter">
                  {restrictDraft.reason.length}/500
                </span>
              </label>

              <label>
                Start
                <DateTimeField
                  id="restrict-start"
                  name="startDate"
                  value={restrictDraft.startDate}
                  onChange={updateRestrictDraft}
                />
              </label>
              <label>
                End
                <DateTimeField
                  id="restrict-end"
                  name="endDate"
                  value={restrictDraft.endDate}
                  min={restrictDraft.startDate}
                  onChange={updateRestrictDraft}
                />
              </label>

              <div className="um-presets um-full">
                <span>Quick set:</span>
                {[
                  ["1 day", 1],
                  ["7 days", 7],
                  ["30 days", 30],
                ].map(([text, days]) => (
                  <button
                    key={days}
                    type="button"
                    className="um-preset"
                    onClick={() =>
                      setRestrictDraft((d) => ({
                        ...d,
                        endDate: addDays(days),
                      }))
                    }
                  >
                    {text}
                  </button>
                ))}
              </div>

              {restrictError && (
                <p className="admin-form-error" role="alert">
                  {restrictError}
                </p>
              )}

              <div className="admin-dialog-actions">
                <button type="button" onClick={() => setRestrictTarget(null)}>
                  Cancel
                </button>
                <button
                  className="primary st-danger"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Restricting..." : "Restrict account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {unrestrictTarget && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={() => setUnrestrictTarget(null)}
        >
          <section
            className="admin-user-dialog st-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unrestrict-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="unrestrict-dialog-title">Unrestrict account</h2>
                <p>
                  <strong>{unrestrictTarget.name}</strong> will be able to sign
                  in again right away.
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setUnrestrictTarget(null)}
              >
                ×
              </button>
            </div>

            {unrestrictTarget.restrictionReason && (
              <div className="um-reason-box">
                <div>
                  <span>Reason</span>
                  <strong>{unrestrictTarget.restrictionReason}</strong>
                </div>
                <div>
                  <span>Start</span>
                  <strong>
                    {formatDateTime(unrestrictTarget.restrictionStart)}
                  </strong>
                </div>
                <div>
                  <span>End</span>
                  <strong>
                    {formatDateTime(unrestrictTarget.restrictionEnd)}
                  </strong>
                </div>
              </div>
            )}

            {unrestrictError && (
              <p className="admin-form-error" role="alert">
                {unrestrictError}
              </p>
            )}

            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setUnrestrictTarget(null)}>
                Cancel
              </button>
              <button
                className="primary"
                type="button"
                disabled={saving}
                onClick={confirmUnrestrict}
              >
                {saving ? "Saving..." : "Unrestrict"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
