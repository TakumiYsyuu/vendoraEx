import { useState, useMemo, useEffect } from "react";
import { Plus, Search, X, Eye, Users } from "lucide-react";
import Status from "../components/Status";

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function StaffManage({
  staff,
  onSaveStaff,
  onToggleRestriction,
}) {
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    return () => {
      setQuery("");
    };
  }, []);

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (member) =>
        member.name?.toLowerCase().includes(q) ||
        member.email?.toLowerCase().includes(q),
    );
  }, [staff, query]);

  const hasActiveFilters = query.trim() !== "";

  const clearFilters = () => setQuery("");

  const openEditor = (mode, member) => {
    setFormError("");
    setEditor({ mode, member });
    setDraft(
      member ?
        { name: member.name, email: member.email, password: "" }
      : { name: "", email: "", password: "" },
    );
  };
  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };
  const submitStaff = (event) => {
    event.preventDefault();
    const result = onSaveStaff({
      ...draft,
      existingEmail: editor?.mode === "edit" ? editor.member.email : "",
    });
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditor(null);
  };

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <label className="flex items-center gap-2 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 self-start rounded-lg px-2.5 py-2.5 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500 sm:self-auto"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="table-card admin-users-table overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {staff.length === 0 ?
          <EmptyState
            icon={Users}
            title="No staff accounts"
            description="Staff members you add will appear here."
          />
        : filteredStaff.length === 0 ?
          <div className="empty flex flex-col items-center gap-1 py-14 text-center">
            <h3 className="text-sm font-semibold text-gray-900">
              No matching staff
            </h3>
            <p className="text-sm text-gray-500">Try a different search.</p>
          </div>
        : <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr
                    key={member.email}
                    className="border-b border-gray-100 last:border-0 hover:bg-emerald-50/30"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <Status>
                        {member.restricted ? "Restricted" : "Active"}
                      </Status>
                    </td>
                    <td className="admin-user-actions px-5 py-3.5">
                      <div className="admin-user-action-row flex items-center gap-4">
                        <button
                          className="text-btn flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                          onClick={() => openEditor("view", member)}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          className="text-btn text-gray-500 hover:text-gray-800"
                          onClick={() => openEditor("edit", member)}
                        >
                          Edit
                        </button>
                        <button
                          className={`text-btn font-medium ${
                            member.restricted ?
                              "text-emerald-600 hover:text-emerald-700"
                            : "text-red-500 hover:text-red-600"
                          }`}
                          onClick={() => onToggleRestriction(member)}
                        >
                          {member.restricted ? "Restore" : "Restrict"}
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

      {editor && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={() => setEditor(null)}
        >
          <section
            className="admin-user-dialog"
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
                onClick={() => setEditor(null)}
              >
                ×
              </button>
            </div>
            {editor.mode === "view" ?
              <div className="admin-user-details">
                <div>
                  <span>Name</span>
                  <strong>{draft.name}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{draft.email}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <Status>
                    {editor.member.restricted ? "Restricted" : "Active"}
                  </Status>
                </div>
                <button className="primary" onClick={() => setEditor(null)}>
                  Close
                </button>
              </div>
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
                {editor.mode === "create" && (
                  <label>
                    Temporary password
                    <input
                      name="password"
                      type="password"
                      value={draft.password}
                      onChange={updateDraft}
                      autoComplete="new-password"
                      minLength="6"
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
                  <button className="primary" type="submit">
                    {editor.mode === "create" ? "Add staff" : "Save changes"}
                  </button>
                </div>
              </form>
            }
          </section>
        </div>
      )}
    </div>
  );
}
