import { useEffect, useState } from "react";
import { Eye, Flag, MessageSquare, ShieldCheck, Truck } from "lucide-react";

import Messages from "../components/Messages";
import StaffReport from "./StaffReport";
import StaffDelivery from "./StaffDelivery";
import { fetchReports } from "../logic/admin";

const STATUS_LABEL = {
  pending: "Open",
  reviewed: "In review",
  escalated: "Awaiting admin",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

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
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports()
      .then(setReports)
      .catch((err) => console.error("Failed to load reports:", err));
  }, []);

  const count = (status) => reports.filter((r) => r.status === status).length;
  const waiting = reports.filter(
    (r) => r.status === "pending" || (r.status === "reviewed" && r.claimedByMe),
  );

  const quickActions = [
    [
      "Review Reports",
      "Claim, review, and submit final reports",
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
          value={count("pending")}
          detail="Waiting to be claimed"
        />
        <StatCard
          label="In Review"
          value={count("reviewed")}
          detail="Being handled by staff"
        />
        <StatCard
          label="Awaiting Admin"
          value={count("escalated")}
          detail="Needs an admin decision"
        />
        <StatCard
          label="Resolved"
          value={count("resolved")}
          detail="Closed concerns"
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
          {waiting.length ?
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Reported</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {waiting.slice(0, 5).map((report) => (
                  <tr key={report.id}>
                    <td>{report.subject}</td>
                    <td>{report.reportedName}</td>
                    <td>
                      {report.createdAt ?
                        new Date(report.createdAt).toLocaleDateString()
                      : "Current"}
                    </td>
                    <td>
                      <span className={`rp-status rp-${report.status}`}>
                        {STATUS_LABEL[report.status] || report.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-btn"
                        onClick={() => go("staff-reports")}
                      >
                        <Eye size={14} />{" "}
                        {report.status === "pending" ? "Review" : "Continue"}
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

export default function StaffModeration({ page, go, user }) {
  const [messageTarget, setMessageTarget] = useState("");

  const openChat = (target) => {
    setMessageTarget(target);
    go("staff-messages");
  };

  if (page === "staff-reports")
    return <StaffReport go={go} onMessage={openChat} />;
  if (page === "staff-messages")
    return (
      <Messages
        role={user?.role}
        target={messageTarget}
        onTargetHandled={() => setMessageTarget("")}
        onGoHome={() => go("staff-dashboard")}
      />
    );
  if (page === "staff-delivery") return <StaffDelivery />;
  return <StaffDashboard go={go} />;
}
