import { useState } from "react";
import "../styles/Topbar.css";
import {
  Bell,
  Search,
  ShoppingCart,
  Settings,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { initials } from "../utils/helpers";

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
  seller = false,
  moderation = false,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "orders",
      title: "Order update",
      text: "Your order #ORD-1005 is being processed.",
      time: "10 min ago",
      read: false,
    },
    {
      id: 2,
      type: "deals",
      title: "New deal available",
      text: "Wireless Headphones are now 35% off.",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "messages",
      title: "Message received",
      text: "Juan Dela Cruz sent you a message.",
      time: "2 hours ago",
      read: true,
    },
  ]);
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const searchPlaceholder =
    seller ?
      "Search for products, orders, or customers..."
    : "Search for products, brands and more...";

  // Opening the panel marks the demo notifications as seen in one state update.
  const toggleNotifications = () => {
    setNotificationsOpen((isOpen) => !isOpen);
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  };
  const openNotification = (type) => {
    setNotificationsOpen(false);
    onNotification?.(type);
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

      <div className="top-actions">
        {!moderation && (
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
                  width: 290,
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
                  <strong style={{ fontSize: 13 }}>Notifications</strong>
                  <small style={{ color: "var(--muted)", fontSize: 10 }}>
                    {unreadCount} unread
                  </small>
                </div>
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => openNotification(notification.type)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 0",
                      borderTop: "1px solid var(--line)",
                      background:
                        notification.read ? "transparent" : "var(--mint)",
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
                      {notification.time}
                    </small>
                  </button>
                ))}
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
            onClick={() => setProfileOpen(!profileOpen)}
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
                <>
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
                </>
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
