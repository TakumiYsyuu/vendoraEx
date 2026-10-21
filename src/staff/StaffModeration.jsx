import { useMemo } from "react";
import {
  ClipboardList,
  Eye,
  Flag,
  MessageSquare,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Status from "../components/Status";
import Messages from "../components/Messages";
import StaffReport from "./StaffReport";

import { getReports } from "../logic/moderation";
import { getAdminStats } from "../logic/admin";

const RESOLVED_STATUSES = ["resolved", "closed", "banned", "dismissed"];
const isResolved = (report) =>
  RESOLVED_STATUSES.includes(String(report.status || "").toLowerCase());

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <article className="h-full flex flex-col rounded-xl border p-5 shadow-sm border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <strong className="mt-3 font-semibold text-gray-900 text-3xl">
        {value}
      </strong>
      <small className="mt-auto pt-4 text-xs font-semibold text-gray-400">
        {detail}
      </small>
    </article>
  );
}

function StaffDashboard({ go }) {
  const reports = useMemo(() => getReports(), []);
  const stats = getAdminStats(reports) || {};

  const openReports = reports.filter((report) => !isResolved(report));
  const resolvedReports = reports.filter(isResolved);

  const quickActions = [
    [
      "Review Reports",
      "Open, reply to, and resolve concerns",
      "staff-reports",
      Flag,
    ],
    [
      "Messages",
      "Chat with customers about their concerns",
      "staff-messages",
      MessageSquare,
    ],
    ["Delivery", "Follow up on order deliveries", "staff-delivery", Truck],
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-welcome">
        <div>
          <h1>Support Desk Overview</h1>
          <p>
            Review customer concerns and reports, and keep marketplace activity
            moving.
          </p>
        </div>
        <span aria-hidden="true">V</span>
      </section>

      <section className="admin-stat-grid" aria-label="Support totals">
        <StatCard
          label="Open Reports"
          value={openReports.length}
          detail="Waiting for review"
        />
        <StatCard
          label="Resolved Reports"
          value={resolvedReports.length}
          detail="Closed concerns"
        />
        <StatCard
          label="Orders Today"
          value={stats.ordersToday ?? 0}
          detail="Placed today"
        />
        <StatCard
          label="Pending Reviews"
          value={stats.pendingReviews ?? 0}
          detail="Needs attention"
        />
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-activity table-card">
          <div className="admin-card-heading">
            <h2>Reports Needing Attention</h2>
            <button className="text-btn" onClick={() => go("staff-reports")}>
              View all
            </button>
          </div>
          {openReports.length ?
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Seller</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openReports.slice(0, 5).map((report, index) => (
                  <tr key={report.id ?? index}>
                    <td>Product report</td>
                    <td>{report.seller || "Unknown seller"}</td>
                    <td>
                      {report.createdAt ?
                        new Date(report.createdAt).toLocaleDateString()
                      : "Current"}
                    </td>
                    <td>
                      <Status>{report.status}</Status>
                    </td>
                    <td>
                      <button
                        className="text-btn"
                        onClick={() => go("staff-reports")}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          : <EmptyState
              icon={ShieldCheck}
              title="No open reports"
              description="New customer concerns will appear here for review."
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

function DeliveryPage() {
  return (
    <div className="admin-page">
      <div className="page-title">
        <div>
          <h1>Delivery</h1>
          <p>Follow up on order deliveries and delivery concerns.</p>
        </div>
      </div>
      <EmptyState
        icon={ClipboardList}
        title="Delivery is not set up yet"
        description="Delivery tracking will appear here once it is connected."
      />
    </div>
  );
}

export default function StaffModeration({ page, go, user }) {
  if (page === "staff-reports")
    return <StaffReport page="staff-reports" go={go} />;
  if (page === "staff-messages") return <Messages user={user} seller />;
  if (page === "staff-delivery") return <DeliveryPage />;
  return <StaffDashboard go={go} />;
}
