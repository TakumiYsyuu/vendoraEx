import { useState, useMemo, useEffect } from "react";
import { Plus, Search, X, Eye, Users } from "lucide-react";
import Status from "../components/Status";

const ROLE_FILTERS = [
  { value: "all", label: "All roles" },
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "restricted", label: "Restricted" },
];

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function UserManage({ users, onSaveUser, onToggleRestriction }) {
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    accountType: "Buyer",
    password: "",
  });
  const [formError, setFormError] = useState("");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    return () => {
      setQuery("");
      setRoleFilter("all");
      setStatusFilter("all");
    };
  }, []);

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
          accountType: user.type,
          password: "",
        }
      : { name: "", email: "", accountType: "Buyer", password: "" },
    );
  };
  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };
  const submitUser = (event) => {
    event.preventDefault();
    const result = onSaveUser({
      ...draft,
      existingEmail: editor?.mode === "edit" ? editor.user.email : "",
    });
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditor(null);
  };

  const roleLabel =
    ROLE_FILTERS.find((opt) => opt.value === roleFilter)?.label ?? "Role";
  const statusLabel =
    STATUS_FILTERS.find((opt) => opt.value === statusFilter)?.label ?? "Status";

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

        <div className="flex items-center gap-2">
          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="flex w-32 items-center justify-between gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <span className="truncate">{roleLabel}</span>
              <svg
                className="h-3.5 w-3.5 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <ul
              tabIndex={-1}
              className="dropdown-content menu z-10 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            >
              <li>
                <a
                  onClick={() => setRoleFilter("all")}
                  className={`rounded-md text-sm text-gray-700 ${
                    roleFilter === "all" ?
                      "bg-emerald-50 font-medium text-emerald-700"
                    : ""
                  }`}
                >
                  All roles
                </a>
              </li>
              <li>
                <a
                  onClick={() => setRoleFilter("buyer")}
                  className={`rounded-md text-sm text-gray-700 ${
                    roleFilter === "buyer" ?
                      "bg-emerald-50 font-medium text-emerald-700"
                    : ""
                  }`}
                >
                  Buyer
                </a>
              </li>
              <li>
                <a
                  onClick={() => setRoleFilter("seller")}
                  className={`rounded-md text-sm text-gray-700 ${
                    roleFilter === "seller" ?
                      "bg-emerald-50 font-medium text-emerald-700"
                    : ""
                  }`}
                >
                  Seller
                </a>
              </li>
            </ul>
          </div>

          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="flex w-32 items-center justify-between gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <span className="truncate">{statusLabel}</span>
              <svg
                className="h-3.5 w-3.5 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <ul
              tabIndex={-1}
              className="dropdown-content menu z-10 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            >
              <li>
                <a
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-md text-sm text-gray-700 ${
                    statusFilter === "all" ?
                      "bg-emerald-50 font-medium text-emerald-700"
                    : ""
                  }`}
                >
                  All status
                </a>
              </li>
              <li>
                <a
                  onClick={() => setStatusFilter("active")}
                  className={`rounded-md text-sm text-gray-700 ${
                    statusFilter === "active" ?
                      "bg-emerald-50 font-medium text-emerald-700"
                    : ""
                  }`}
                >
                  Active
                </a>
              </li>
              <li>
                <a
                  onClick={() => setStatusFilter("restricted")}
                  className={`rounded-md text-sm text-gray-700 ${
                    statusFilter === "restricted" ?
                      "bg-emerald-50 font-medium text-emerald-700"
                    : ""
                  }`}
                >
                  Restricted
                </a>
              </li>
            </ul>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-2.5 py-2.5 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="table-card admin-users-table overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {users.length === 0 ?
          <EmptyState
            icon={Users}
            title="No registered users"
            description="New buyer registrations will appear here."
          />
        : filteredUsers.length === 0 ?
          <div className="empty flex flex-col items-center gap-1 py-14 text-center">
            <h3 className="text-sm font-semibold text-gray-900">
              No matching users
            </h3>
            <p className="text-sm text-gray-500">
              Try a different search or change the filters.
            </p>
          </div>
        : <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.email}
                    className="border-b border-gray-100 last:border-0 hover:bg-emerald-50/30"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900 text-sm">
                      {user.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-700">
                        {user.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Status>
                        {user.restricted ? "Restricted" : "Active"}
                      </Status>
                    </td>
                    <td className="admin-user-actions px-5 py-3.5">
                      <div className="admin-user-action-row flex items-center gap-4">
                        <button
                          className="text-btn flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                          onClick={() => openEditor("view", user)}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          className="text-btn text-gray-500 hover:text-gray-800"
                          onClick={() => openEditor("edit", user)}
                        >
                          Edit
                        </button>
                        <button
                          className={`text-btn font-medium ${
                            user.restricted ?
                              "text-emerald-600 hover:text-emerald-700"
                            : "text-red-500 hover:text-red-600"
                          }`}
                          onClick={() => onToggleRestriction(user)}
                        >
                          {user.restricted ? "Restore" : "Restrict"}
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
                  <span>Role</span>
                  <strong>{draft.accountType}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <Status>
                    {editor.user.restricted ? "Restricted" : "Active"}
                  </Status>
                </div>
                <button className="primary" onClick={() => setEditor(null)}>
                  Close
                </button>
              </div>
            : <form className="admin-user-form" onSubmit={submitUser}>
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
                    {editor.mode === "create" ? "Add User" : "Save changes"}
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
