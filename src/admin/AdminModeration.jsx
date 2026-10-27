import { useState, useMemo, useEffect } from "react";
import "../styles/AdminModeration.css";
import { ClipboardList, Eye, Store, Users, ShieldCheck } from "lucide-react";

import Status from "../components/Status";
import StaffManage from "./StaffManage";
import ShopAndProduct from "./PoductBoard";
import UserManage from "./UserManage";
import ReportManage from "./ReportManage";
import AdminOrders from "./AdminOrders";
import { fetchAllOrders } from "../logic/orders";
import ShopApprovalContainer from "./ShopApprovalContainer";
import { fetchApplications } from "../logic/verificationAdmin";

import {
  getAdminStaff,
  saveAdminStaff,
  setStaffRestriction,
  deleteAdminStaff,
} from "../logic/staff";

import {
  getAdminOrders,
  getAdminProducts,
  getAdminStats,
  getAdminSettings,
  getAdminUsers,
  getSellers,
  saveAdminSettings,
  saveAdminUser,
  setUserRestriction,
  fetchReports,
  decideReport,
} from "../logic/admin";
import { initials } from "../utils/helpers";

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  attention = false,
  size = "sm",
  className = "",
}) {
  const iconTone =
    attention ?
      "text-amber-600 bg-amber-100"
    : "text-emerald-600 bg-emerald-100";
  return (
    <article
      className={`h-full flex flex-col rounded-xl border p-5 shadow-sm ${"border-gray-200 bg-white"} ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <strong
        className={`mt-3 font-semibold text-gray-900 ${size === "lg" ? "text-5xl" : "text-3xl"}`}
      >
        {value}
      </strong>
      <small
        className={`mt-auto pt-4 text-xs font-semibold ${"text-gray-400"}`}
      >
        {detail}
      </small>
    </article>
  );
}

function Dashboard({
  stats,
  reports,
  sellers,
  orders,
  applications,
  go,
  user,
}) {
  const pendingApplications = applications.filter(
    (application) => application.status === "Pending",
  );

  const activities = [
    ...reports.map((report) => ({
      label: "Product report",
      subject: report.seller,
      status: report.status,
      date:
        report.createdAt ?
          new Date(report.createdAt).toLocaleDateString()
        : "Current",
    })),
    ...orders.map((order) => ({
      label: `Order ${order.id}`,
      subject: order.customer || "Customer",
      status: order.status,
      date: order.date,
    })),
    ...sellers.map((seller) => ({
      label: "Seller account",
      subject: seller.name,
      status: seller.verified ? "Verified" : "Pending",
      date: "Current",
    })),
  ].slice(0, 5);

  const quickActions = [
    ["Manage Users", "View and restrict marketplace accounts", "users", Users],
    [
      "Review Orders",
      "Monitor marketplace order activity",
      "orders",
      ClipboardList,
    ],

    ["Review Shops", "Manage sellers and products", "shops-products", Store],

    [
      "Shop Approval",
      "Review seller applications",
      "shop-Request",
      ClipboardList,
    ],
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-welcome">
        <div>
          <h1>System Status & Operations</h1>
          <p>
            High-level monitoring of platform users, vendor stores, and system
            performance.
          </p>
        </div>
        <span aria-hidden="true">V</span>
      </section>
      <section className="admin-stat-grid" aria-label="Marketplace totals">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          detail="Active accounts"
        />
        <StatCard
          icon={Store}
          label="Verified Sellers"
          value={stats.activeSellers}
          detail="Approved shops"
        />
        <StatCard
          icon={ClipboardList}
          label="Orders Today"
          value={stats.ordersToday}
          detail="Placed today"
        />
        <StatCard
          icon={ShieldCheck}
          label="Pending Reviews"
          value={stats.pendingReviews}
          detail="Needs attention"
          attention
        />
      </section>
      <section className="admin-dashboard-grid">
        <div className="admin-activity table-card">
          <div className="admin-card-heading">
            <h2>Pending Shop Approvals</h2>
            <button className="text-btn" onClick={() => go("shop-Request")}>
              View all
            </button>
          </div>
          {pendingApplications.length ?
            <table>
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Owner</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingApplications.slice(0, 5).map((application) => (
                  <tr key={application.id}>
                    <td>{application.shopName}</td>
                    <td>{application.ownerName}</td>
                    <td>{application.submittedAt}</td>
                    <td>
                      <Status>{application.status}</Status>
                    </td>
                    <td>
                      <button
                        className="text-btn"
                        onClick={() => go("shop-Request")}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          : <EmptyState
              icon={Store}
              title="No pending applications"
              description="New seller applications will appear here for review."
            />
          }
        </div>
        <div className="admin-quick-actions table-card">
          <h2>Quick Actions</h2>
          {quickActions.map(([title, description, target, Icon]) => (
            <button key={target} onClick={() => go(target)}>
              <Icon size={17} />
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminModeration({ page, go, user }) {
  const [reports, setReports] = useState([]);
  const [reportList, setReportList] = useState([]);
  const [notice, setNotice] = useState("");

  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);

  const stats = {
    ...getAdminStats(reports),
    totalUsers: users.length,
    activeSellers: applications.filter((a) => a.status === "Approved").length,
    pendingReviews: applications.filter((a) => a.status === "Pending").length,
    ordersToday: orders.filter(
      (o) => new Date(o.createdAt).toDateString() === new Date().toDateString(),
    ).length,
  };

  const loadAdminData = async () => {
    try {
      const [usersData, sellersData, productsData, staffData, ordersData] =
        await Promise.all([
          getAdminUsers(),
          getSellers(),
          getAdminProducts(),
          getAdminStaff(),
          getAdminOrders(),
        ]);

      setUsers(Array.isArray(usersData) ? usersData : usersData?.users || []);

      setSellers(Array.isArray(sellersData) ? sellersData : []);

      setAdminProducts(Array.isArray(productsData) ? productsData : []);

      setStaff(Array.isArray(staffData) ? staffData : []);

      setOrders(
        Array.isArray(ordersData) ?
          ordersData.map((o) => ({
            id: o.code,
            customer: o.buyerName,
            date: new Date(o.createdAt).toLocaleDateString(),
            createdAt: o.createdAt,
            total: o.total,
            status: o.status,
          }))
        : [],
      );
    } catch (error) {
      console.error("Failed to load admin data:", error);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Refresh when the page changes, so the dashboard's pending list is current after approving
  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch((error) => console.error("Failed to load applications:", error));
  }, [page]);

  // Load real reports from the database when the Reports tab opens
  useEffect(() => {
    if (page !== "admin-reports") return;
    fetchReports()
      .then(setReportList)
      .catch((error) => console.error("Failed to load reports:", error));
  }, [page]);

  const handleReportDecision = async (report, decision) => {
    try {
      await decideReport(report.id, decision);
      setReportList(await fetchReports());
      setNotice(`Report #${report.id} ${decision}`);
      return {};
    } catch (error) {
      console.error("Failed to save decision:", error);
      return { error: error.message || "Failed to save decision." };
    }
  };

  const handleUserRestriction = async (user, details) => {
    try {
      const result = await setUserRestriction(
        user.id,
        !user.restricted,
        details,
      );

      if (!result?.error) {
        setNotice(
          user.restricted ?
            `Restored: ${user.name}`
          : `Restricted: ${user.name}`,
        );
        await loadAdminData();
      }

      return result;
    } catch (error) {
      console.error("Failed to update user restriction:", error);
      return { error: "Failed to update restriction." };
    }
  };

  const handleSaveUser = async (user) => {
    try {
      const result = await saveAdminUser(user);

      if (!result.error) {
        setNotice(
          user.existingEmail ? `Updated: ${user.name}` : `Added: ${user.name}`,
        );

        await loadAdminData();
      }

      return result;
    } catch (error) {
      console.error("Failed to save user:", error);

      return {
        error: "Failed to save user.",
      };
    }
  };

  const handleStaffRestriction = async (member) => {
    try {
      await setStaffRestriction(member.id, !member.restricted);

      setNotice(
        member.restricted ?
          `Restored: ${member.name}`
        : `Restricted: ${member.name}`,
      );

      await loadAdminData();
    } catch (error) {
      console.error("Failed to update staff restriction:", error);
    }
  };

  const handleSaveStaff = async (member) => {
    try {
      const result = await saveAdminStaff(member);

      if (!result.error) {
        setNotice(
          member.existingEmail ?
            `Updated: ${member.name}`
          : `Added: ${member.name}`,
        );

        await loadAdminData();
      }

      return result;
    } catch (error) {
      console.error("Failed to save staff:", error);

      return {
        error: "Failed to save staff.",
      };
    }
  };

  const handleDeleteStaff = async (member) => {
    try {
      const result = await deleteAdminStaff(member.id);

      if (!result.error) {
        setNotice(`Deleted: ${member.name}`);
        await loadAdminData();
      }

      return result;
    } catch (error) {
      console.error("Failed to delete staff:", error);
      return { error: "Failed to delete staff." };
    }
  };

  const handleSaveProduct = async (product, changes) => {
    console.warn("updateSellerProduct is not connected yet.");

    return {
      error: "Product update is not connected to the backend yet.",
    };
  };

  const handleSaveSettings = (settings) => saveAdminSettings(settings);

  if (page === "admin-dashboard") {
    return (
      <Dashboard
        stats={stats}
        reports={reports}
        sellers={sellers}
        orders={orders}
        applications={applications}
        go={go}
        user={user}
      />
    );
  }

  if (page === "users") {
    return (
      <UserManage
        users={users}
        onSaveUser={handleSaveUser}
        onToggleRestriction={handleUserRestriction}
      />
    );
  }

  if (page === "admin-reports") {
    return (
      <ReportManage
        reports={reportList}
        onDecision={handleReportDecision}
        go={go}
      />
    );
  }

  if (page === "manage-staff") {
    return (
      <StaffManage
        staff={staff}
        onSaveStaff={handleSaveStaff}
        onToggleRestriction={handleStaffRestriction}
        onDeleteStaff={handleDeleteStaff}
      />
    );
  }

  if (page === "orders") {
    return <AdminOrders />;
  }

  if (page === "shops-products") {
    return (
      <ShopAndProduct
        products={adminProducts}
        onSaveProduct={handleSaveProduct}
      />
    );
  }

  if (page === "shop-Request") {
    return <ShopApprovalContainer />;
  }

  return (
    <div className="admin-page">
      <div className="page-title">
        <div>
          <h1>Settings</h1>
          <p>
            This administrator workspace is ready for its backend configuration.
          </p>
        </div>
      </div>

      <EmptyState
        icon={ShieldCheck}
        title="No configuration available"
        description="Connect the backend to manage this area."
      />
    </div>
  );
}
