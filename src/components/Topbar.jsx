import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Settings,
  LogOut,
  Menu,
  Trash2,
  CheckCheck,
  Search,
  X,
} from "lucide-react";
import { initials } from "../utils/helpers";
import "../styles/Topbar.css";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications,
} from "../logic/notifications";

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function Topbar({
  user,
  onMenu,
  onSearch,
  onAccountSettings,
  onLogout,
  onSwitchMode,
  onNotification,
  onCart,
  cartCount = 0,
  query = "",
  seller = false,
  moderation = false,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.length - unreadCount;
  const showNotifications = !moderation || user?.role === "staff";
  const showSearch = !seller && !moderation;

  const loadNotifications = useCallback(async () => {
    if (!user?.id || !showNotifications) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
      setError("");
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotifications]);

  // Load on mount, then refresh every 30 seconds
  useEffect(() => {
    setLoading(true);
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Runs an optimistic update; reloads from the server if the request fails
  const optimistic = async (updateState, apiCall) => {
    updateState();
    try {
      await apiCall();
    } catch {
      setError("Something went wrong. Please try again.");
      loadNotifications();
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen((isOpen) => !isOpen);
    setProfileOpen(false);
  };

  const openNotification = (notification) => {
    if (notification.read) return;
    optimistic(
      () =>
        setNotifications((items) =>
          items.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        ),
      () => markNotificationRead(notification.id),
    );
  };

  const markAllRead = () =>
    optimistic(
      () =>
        setNotifications((items) => items.map((n) => ({ ...n, read: true }))),
      () => markAllNotificationsRead(user.id),
    );

  const removeNotification = (id) =>
    optimistic(
      () => setNotifications((items) => items.filter((n) => n.id !== id)),
      () => deleteNotification(id),
    );

  const clearRead = () =>
    optimistic(
      () => setNotifications((items) => items.filter((n) => !n.read)),
      () => deleteReadNotifications(user.id),
    );

  const smallBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    color: "var(--green)",
    cursor: "pointer",
  };

  return (
    <header
      className="topbar"
      style={{ position: "sticky", top: 0, zIndex: 20 }}
    >
      <button className="mobile-menu" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <div className="brand">
        <span className="brand-mark">V</span>
        <span>Vendora</span>
      </div>

      {showSearch && (
        <div className="searchbox" role="search">
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onSearch("")}
            placeholder="Search products or categories"
            aria-label="Search products"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={() => onSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="top-actions">
        {showNotifications && (
          <div style={{ position: "relative" }}>
            <button
              className="icon-btn"
              aria-label="Open notifications"
              aria-expanded={notificationsOpen}
              onClick={toggleNotifications}
            >
              <Bell size={19} />
              {unreadCount > 0 && <b>{unreadCount}</b>}
            </button>

            {notificationsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                style={{
                  position: "absolute",
                  right: 0,
                  top: 42,
                  width: 310,
                  padding: 14,
                  background: "#fff",
                  color: "var(--text)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  boxShadow: "var(--shadow)",
                  zIndex: 30,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13 }}>Notifications</strong>
                    <small
                      style={{
                        marginLeft: 6,
                        color: "var(--muted)",
                        fontSize: 10,
                      }}
                    >
                      {unreadCount} unread
                    </small>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {unreadCount > 0 && (
                      <button style={smallBtn} onClick={markAllRead}>
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                    {readCount > 0 && (
                      <button
                        style={{ ...smallBtn, color: "#d94b58" }}
                        onClick={clearRead}
                      >
                        <Trash2 size={12} /> Clear read
                      </button>
                    )}
                  </div>
                </div>

                {loading && (
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>
                    Loading...
                  </p>
                )}
                {error && (
                  <p style={{ fontSize: 11, color: "#d94b58" }}>{error}</p>
                )}
                {!loading && !error && notifications.length === 0 && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      padding: "12px 0",
                      textAlign: "center",
                    }}
                  >
                    No notifications yet.
                  </p>
                )}

                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        borderTop: "1px solid var(--line)",
                        background:
                          notification.read ? "transparent" : "var(--mint)",
                      }}
                    >
                      <button
                        onClick={() => openNotification(notification)}
                        style={{
                          flex: 1,
                          display: "block",
                          padding: "10px 0",
                          background: "transparent",
                          textAlign: "left",
                        }}
                      >
                        <strong style={{ display: "block", fontSize: 11 }}>
                          {notification.title}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            marginTop: 3,
                            fontSize: 11,
                            color: "var(--muted)",
                          }}
                        >
                          {notification.text}
                        </span>
                        <small
                          style={{
                            display: "block",
                            marginTop: 4,
                            color: "var(--muted)",
                            fontSize: 10,
                          }}
                        >
                          {timeAgo(notification.createdAt)}
                        </small>
                      </button>

                      {notification.read && (
                        <button
                          aria-label="Delete notification"
                          title="Delete"
                          onClick={() => removeNotification(notification.id)}
                          style={{
                            padding: "10px 4px 10px 8px",
                            color: "#d94b58",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <button
            className="avatar"
            aria-label={`Open ${user.name} profile`}
            title={user.name}
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
          >
            {initials(user.name)}
          </button>
          {profileOpen && (
            <div
              role="dialog"
              aria-label="User profile"
              style={{
                position: "absolute",
                right: 0,
                top: 44,
                width: 235,
                padding: 16,
                background: "#fff",
                color: "var(--text)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                boxShadow: "var(--shadow)",
                zIndex: 30,
              }}
            >
              <style>{`.profile-option{border-radius:5px;transition:background .15s ease,color .15s ease}.profile-option:hover{background:var(--mint)!important;color:var(--green)!important}`}</style>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div className="avatar">{initials(user.name)}</div>
                <div>
                  <strong style={{ display: "block", fontSize: 13 }}>
                    {user.name}
                  </strong>
                  <small
                    style={{
                      display: "block",
                      marginTop: 3,
                      color: "var(--muted)",
                      fontSize: 11,
                    }}
                  >
                    {user.email}
                  </small>
                </div>
              </div>

              {!moderation && (
                <button
                  className="profile-option"
                  onClick={onAccountSettings}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "9px 6px",
                    fontSize: 12,
                    textAlign: "left",
                  }}
                >
                  <Settings size={15} /> Account Settings
                </button>
              )}
              <button
                className="profile-option"
                onClick={onLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "9px 6px",
                  fontSize: 12,
                  textAlign: "left",
                  color: "#d94b58",
                }}
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
