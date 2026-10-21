import { useState, useMemo } from "react";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { initials } from "../utils/helpers";
import "../styles/staffManage.css";

const FILTERS = ["All", "Active", "Restricted"];

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// The API returns DB column names (fullname, phone_num, is_restricted);
// older callers used name / phone / restricted. Read either.
const nameOf = (member) => member.fullname ?? member.name ?? "";
const phoneOf = (member) => member.phone_num ?? member.phone ?? "";
const isRestricted = (member) =>
  Boolean(Number(member.is_restricted ?? member.restricted ?? 0));

const StatusPill = ({ restricted }) => (
  <span className={`st-status ${restricted ? "st-restricted" : "st-active"}`}>
    {restricted ? "Restricted" : "Active"}
  </span>
);

export default function StaffManage({
  staff = [],
  onSaveStaff,
  onToggleRestriction,
  onDeleteStaff,
}) {
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(
    () => ({
      All: staff.length,
      Active: staff.filter((m) => !isRestricted(m)).length,
      Restricted: staff.filter(isRestricted).length,
    }),
    [staff],
  );

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Restricted" ?
          isRestricted(member)
        : !isRestricted(member));
      const matchesSearch =
        !q ||
        nameOf(member).toLowerCase().includes(q) ||
        member.email?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [staff, query, filter]);

  const closeEditor = () => {
    if (saving) return;
    setEditor(null);
  };

  const openEditor = (mode, member) => {
    setFormError("");
    setEditor({ mode, member });
    setDraft(
      member ?
        {
          name: nameOf(member),
          email: member.email ?? "",
          phone: phoneOf(member),
          password: "",
        }
      : { name: "", email: "", phone: "", password: "" },
    );
  };

  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const submitStaff = async (event) => {
    event.preventDefault();
    if (saving) return;

    setFormError("");
    setSaving(true);
    try {
      const result = await onSaveStaff({
        ...draft,
        fullname: draft.name,
        id: editor?.mode === "edit" ? editor.member.id : undefined,
        existingEmail: editor?.mode === "edit" ? editor.member.email : "",
      });
      if (result?.error) {
        setFormError(result.error);
        return;
      }
      setEditor(null);
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Could not save staff member.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (member) => {
    setDeleteError("");
    setDeleteTarget(member);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await onDeleteStaff(deleteTarget);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error?.response?.data?.message ||
          error?.message ||
          "Could not delete staff member.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const hasSearch = query.trim() !== "";

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Staff Management</h1>
          <p>Manage staff accounts and access across Vendora.</p>
        </div>
        <button
          className="primary admin-addStaff"
          onClick={() => openEditor("create")}
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-tabs" role="tablist" aria-label="Filter staff">
          {FILTERS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={filter === name}
              className={`st-tab ${filter === name ? "on" : ""}`}
              onClick={() => setFilter(name)}
            >
              {name}
              <span className="st-count">{counts[name]}</span>
            </button>
          ))}
        </div>

        <label className="st-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search staff"
          />
          {hasSearch && (
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
      </div>

      <div className="table-card st-card">
        {staff.length === 0 ?
          <EmptyState
            icon={Users}
            title="No staff accounts"
            description="Staff members you add will appear here."
          />
        : filteredStaff.length === 0 ?
          <EmptyState
            icon={Search}
            title="No matching staff"
            description="Try a different search or filter."
          />
        : <div className="st-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => {
                  const restricted = isRestricted(member);
                  return (
                    <tr key={member.id ?? member.email}>
                      <td>
                        <div className="st-person">
                          <span className="st-avatar" aria-hidden="true">
                            {initials(nameOf(member))}
                          </span>
                          <strong>{nameOf(member)}</strong>
                        </div>
                      </td>
                      <td className="st-muted">{member.email}</td>
                      <td>
                        <StatusPill restricted={restricted} />
                      </td>
                      <td>
                        <div className="st-actions">
                          <button
                            type="button"
                            className="st-btn"
                            onClick={() => openEditor("view", member)}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            className="st-btn"
                            onClick={() => openEditor("edit", member)}
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            className={`st-btn ${restricted ? "st-btn-good" : "st-btn-warn"}`}
                            onClick={() => onToggleRestriction(member)}
                          >
                            {restricted ?
                              <ShieldCheck size={13} />
                            : <ShieldOff size={13} />}
                            {restricted ? "Restore" : "Restrict"}
                          </button>
                          <button
                            type="button"
                            className="st-icon-btn"
                            aria-label={`Delete ${nameOf(member)}`}
                            title="Delete"
                            onClick={() => openDelete(member)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </div>

      {editor && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={closeEditor}
        >
          <section
            className="admin-user-dialog st-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-staff-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="admin-staff-dialog-title">
                  {editor.mode === "create" ?
                    "Add staff"
                  : editor.mode === "edit" ?
                    "Edit staff"
                  : "Staff details"}
                </h2>
                <p>
                  {editor.mode === "create" ?
                    "Create a staff account for the Vendora admin workspace."
                  : "Review the staff member's account details and access status."
                  }
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={closeEditor}
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
                    <StatusPill restricted={isRestricted(editor.member)} />
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
                  <button className="primary" onClick={closeEditor}>
                    Close
                  </button>
                </div>
              </>
            : <form className="admin-user-form" onSubmit={submitStaff}>
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
                {editor.mode === "create" && (
                  <label>
                    Temporary password
                    <input
                      name="password"
                      type="password"
                      value={draft.password}
                      onChange={updateDraft}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
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
                  <button type="button" onClick={closeEditor} disabled={saving}>
                    Cancel
                  </button>
                  <button className="primary" type="submit" disabled={saving}>
                    {saving ?
                      "Saving..."
                    : editor.mode === "create" ?
                      "Add staff"
                    : "Save changes"}
                  </button>
                </div>
              </form>
            }
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="admin-dialog-backdrop st-backdrop"
          role="presentation"
          onMouseDown={closeDelete}
        >
          <section
            className="admin-user-dialog st-dialog st-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-staff-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="admin-staff-delete-title">Delete staff</h2>
                <p>
                  Permanently delete <strong>{nameOf(deleteTarget)}</strong> (
                  {deleteTarget.email})? This can't be undone.
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={closeDelete}
              >
                ×
              </button>
            </div>
            {deleteError && (
              <p className="admin-form-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="admin-dialog-actions">
              <button type="button" onClick={closeDelete} disabled={deleting}>
                Cancel
              </button>
              <button
                className="primary st-danger"
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
