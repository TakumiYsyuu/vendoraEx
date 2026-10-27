import "../styles/Navigation.css";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  UsersRound,
  Users,
  X,
  FileUser,
  Flag,
  MessageSquare,
  Truck,
} from "lucide-react";
import { initials } from "../utils/helpers";

const adminNavigation = [
  ["admin-dashboard", "Dashboard", LayoutDashboard],
  ["manage-staff", "Staff Management", UsersRound],
  ["users", "Users", Users],
  ["shops-products", "Shops & Products", Store],
  ["orders", "Orders", ShoppingBag],
  ["shop-Request", "Shop Approvals", FileUser],
  ["admin-reports", "Reports", Flag],
];

const staffNavigation = [
  ["staff-dashboard", "Dashboard", LayoutDashboard],
  ["staff-reports", "Reports", Flag],
  ["staff-messages", "Messages", MessageSquare],
  ["staff-delivery", "Delivery", Truck],
];

export default function ModerationSidebar({
  user,
  page,
  setPage,
  mobileOpen,
  setMobileOpen,
  onLogout,
}) {
  const isAdmin = user.role === "admin";
  const navigationItems = isAdmin ? adminNavigation : staffNavigation;
  const roleLabel = isAdmin ? "Administrator" : "Staff";
  const avatarLabel = isAdmin ? "AD" : initials(user.name);

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileOpen(false);
  };

  return (
    <aside className={`sidebar moderation-side ${mobileOpen ? "open" : ""}`}>
      <div className="brand side-brand">
        <span className="brand-mark">V</span>
        <span>Vendora</span>
      </div>
      <button
        className="close-mobile"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      >
        <X />
      </button>

      <nav>
        {navigationItems.map(([key, label, Icon]) => (
          <button
            className={page === key ? "active" : ""}
            key={key}
            onClick={() => navigate(key)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="mini-profile">
          <div className="avatar">{avatarLabel}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{roleLabel}</small>
          </div>
        </div>
        <button onClick={onLogout}>
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
