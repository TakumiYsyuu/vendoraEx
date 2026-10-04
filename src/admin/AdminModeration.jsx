import { useState, useMemo, useEffect } from "react";
import "../styles/AdminModeration.css";
import {
  ClipboardList,
  Download,
  Eye,
  Pencil,
  Plus,
  Store,
  Users,
  Search,
  ShieldOff,
  ShieldCheck,
  X,
} from "lucide-react";

import Status from "../components/Status";
import StaffManage from "./StaffManage";
import ShopAndProduct from "./PoductBoard";
import UserManage from "./UserManage";
import ShopApproval from "./ShopApproval";

import {
  getReports,
  saveReports,
  getSellers,
  banSeller,
} from "../logic/moderation";

import {
  getAdminStaff,
  saveAdminStaff,
  setStaffRestriction,
} from "../logic/staff";

import {
  getAdminOrders,
  getAdminProducts,
  getAdminStats,
  getAdminSettings,
  getAdminUsers,
  saveAdminSettings,
  saveAdminUser,
  setUserRestriction,
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
          label="Active Sellers"
          value={stats.activeSellers}
          detail="Shops not restricted"
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

function OrdersPage({ orders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const formatPrice = (price) => `₱${Number(price || 0).toLocaleString()}`;
  const exportReport = () => {
    const escapeValue = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = orders.map((order) =>
      [
        order.id,
        order.customer || "Customer",
        order.date,
        Number(order.total || 0).toFixed(2),
        order.status,
        (order.products || [])
          .map((product) =>
            typeof product === "string" ? product : product.name,
          )
          .join(", "),
      ]
        .map(escapeValue)
        .join(","),
    );
    const report = [
      "Order ID,Customer,Date,Total,Status,Products",
      ...rows,
    ].join("\n");
    const file = new Blob([report], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "vendora-orders-report.csv";
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="admin-page admin-orders-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Orders</h1>
          <p>Monitor orders placed across the marketplace.</p>
        </div>
        <button
          className="outline admin-export-report"
          onClick={exportReport}
          disabled={!orders.length}
        >
          <Download size={15} /> Export Report
        </button>
      </div>
      <div className="table-card">
        {orders.length ?
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer || "Customer"}</td>
                  <td>{order.date}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <Status>{order.status}</Status>
                  </td>
                  <td>
                    <button
                      className="text-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        : <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="Orders placed by buyers will appear here."
          />
        }
      </div>
      {selectedOrder && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedOrder(null)}
        >
          <section
            className="admin-user-dialog admin-order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="admin-order-dialog-title">Order {selectedOrder.id}</h2>
                <p>Review the buyer, order status, and purchased items.</p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>
            <div className="admin-order-summary">
              <div>
                <span>Customer</span>
                <strong>{selectedOrder.customer || "Customer"}</strong>
              </div>
              <div>
                <span>Order date</span>
                <strong>{selectedOrder.date}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatPrice(selectedOrder.total)}</strong>
              </div>
              <div>
                <span>Status</span>
                <Status>{selectedOrder.status}</Status>
              </div>
            </div>
            <div className="admin-order-items">
              <h3>Items</h3>
              {selectedOrder.products?.length ?
                selectedOrder.products.map((product, index) => (
                  <div
                    key={`${typeof product === "string" ? product : product.productId}-${index}`}
                  >
                    <span>
                      {typeof product === "string" ?
                        product
                      : `${product.name} × ${product.quantity}`}
                    </span>
                    {typeof product !== "string" && (
                      <strong>
                        {formatPrice(product.price * product.quantity)}
                      </strong>
                    )}
                  </div>
                ))
              : <p>No item information saved for this order.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function AdminModeration({ page, go, user }) {
  const [reports, setReports] = useState(() => getReports());
  const [notice, setNotice] = useState("");

  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]);

  const [applications, setApplications] = useState([
    {
      id: 1,
      shopName: "Sample Shop",
      ownerName: "Juan Dela Cruz",
      email: "juan@example.com",
      phone: "0917 000 0000",
      address: "123 Rizal St, Manila",
      description: "Handmade home goods.",
      submittedAt: "Sep 27, 2026",
      status: "Pending",
      documents: [
        { label: "Business permit", url: "" },
        { label: "Valid ID", url: "" },
      ],
    },
  ]);

  const stats = {
    ...getAdminStats(reports),
    totalUsers: users.length,
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

      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUserRestriction = async (user) => {
    try {
      await setUserRestriction(user.email, !user.restricted);

      setNotice(
        user.restricted ? `Restored: ${user.name}` : `Restricted: ${user.name}`,
      );

      await loadAdminData();
    } catch (error) {
      console.error("Failed to update user restriction:", error);
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
      await setStaffRestriction(member.email, !member.restricted);

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

  const handleSaveProduct = async (product, changes) => {
    console.warn("updateSellerProduct is not connected yet.");

    return {
      error: "Product update is not connected to the backend yet.",
    };
  };

  const handleApprove = async (application) => {
    setApplications((list) =>
      list.map((a) =>
        a.id === application.id ? { ...a, status: "Approved" } : a,
      ),
    );
    return {};
  };

  const handleDecline = async (application, declineReason) => {
    setApplications((list) =>
      list.map((a) =>
        a.id === application.id ?
          { ...a, status: "Declined", declineReason }
        : a,
      ),
    );
    return {};
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

  if (page === "manage-staff") {
    return (
      <StaffManage
        staff={staff}
        onSaveStaff={handleSaveStaff}
        onToggleRestriction={handleStaffRestriction}
      />
    );
  }

  if (page === "orders") {
    return <OrdersPage orders={orders} />;
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
    return (
      <ShopApproval
        applications={applications}
        onApprove={handleApprove}
        onDecline={handleDecline}
      />
    );
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
