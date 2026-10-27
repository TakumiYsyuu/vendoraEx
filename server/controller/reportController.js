import db from "../config/db.js";

const STATUSES = ["pending", "reviewed", "escalated", "resolved", "dismissed"];
const OUTCOMES = ["none", "warn", "suspend", "ban"];
const DECISIONS = ["accepted", "rejected"];

const needsAdmin = (outcome) => outcome === "suspend" || outcome === "ban";

const clean = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const validId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function saveReport({
  user,
  source,
  reportedName,
  reportedEmail,
  orderId,
  subject,
  details,
  aiSummary,
}) {
  const [result] = await db.query(
    `INSERT INTO reports
       (reporter_id, reporter_role, source, reported_name, reported_email,
        order_id, subject, details, ai_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.userId,
      user.role,
      source,
      clean(reportedName, 100),
      clean(reportedEmail, 120) || null,
      clean(orderId, 40) || null,
      clean(subject, 100),
      clean(details, 3000),
      aiSummary ? clean(aiSummary, 2000) : null,
    ],
  );
  return result.insertId;
}

export async function createReport(req, res) {
  try {
    const { reportedName, reportedEmail, orderId, subject, details } =
      req.body || {};

    const name = clean(reportedName, 100);
    const email = clean(reportedEmail, 120);
    const order = clean(orderId, 40);
    const subj = clean(subject, 100);
    const body = clean(details, 1500);

    if (name.length < 2)
      return res
        .status(400)
        .json({ message: "Enter the name of the person or store." });
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: "Enter a valid email address." });
    if (order && !/^[A-Za-z0-9_-]+$/.test(order))
      return res.status(400).json({
        message:
          "Order ID can only contain letters, numbers, dashes and underscores.",
      });
    if (subj.length < 5)
      return res
        .status(400)
        .json({ message: "Subject must be at least 5 characters." });
    if (body.length < 20)
      return res
        .status(400)
        .json({ message: "Please add more detail about what happened." });

    const id = await saveReport({
      user: req.user,
      source: "form",
      reportedName: name,
      reportedEmail: email,
      orderId: order,
      subject: subj,
      details: body,
    });

    res.status(201).json({ success: true, report: { id } });
  } catch (err) {
    console.error("Create report error:", err);
    res
      .status(500)
      .json({ message: "Your report could not be saved. Please try again." });
  }
}

export async function listReports(req, res) {
  try {
    const where = [];
    const params = [];

    if (STATUSES.includes(req.query.status)) {
      where.push("r.status = ?");
      params.push(req.query.status);
    }
    if (["form", "ai"].includes(req.query.source)) {
      where.push("r.source = ?");
      params.push(req.query.source);
    }

    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [rows] = await db.query(
      `SELECT r.*,
          u.email    AS reporter_email,
          h.fullname AS handler_name,
          d.fullname AS decider_name,
          ru.id      AS reported_user_id
     FROM reports r
     LEFT JOIN users u  ON u.id = r.reporter_id
     LEFT JOIN users h  ON h.id = r.reviewed_by
     LEFT JOIN users d  ON d.id = r.decided_by
     LEFT JOIN users ru ON ru.email = r.reported_email
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const reports = rows.map((r) => ({
      id: r.id,
      source: r.source,
      status: r.status,
      reporterId: r.reporter_id,
      reporterRole: r.reporter_role,
      reporterEmail: r.reporter_email,
      reportedName: r.reported_name,
      reportedEmail: r.reported_email,
      reportedUserId: r.reported_user_id,
      orderId: r.order_id,
      subject: r.subject,
      details: r.details,
      aiSummary: r.ai_summary,
      handlerId: r.reviewed_by,
      handlerName: r.handler_name,
      claimedByMe: r.reviewed_by === req.user.userId,
      claimedAt: r.reviewed_at,
      staffOutcome: r.staff_outcome,
      staffSummary: r.staff_summary,
      finalAt: r.final_at,
      adminDecision: r.admin_decision,
      decidedBy: r.decided_by,
      deciderName: r.decider_name,
      decidedAt: r.decided_at,
      createdAt: r.created_at,
    }));

    res.json({ success: true, reports });
  } catch (err) {
    console.error("List reports error:", err);
    res.status(500).json({ message: "Could not load reports." });
  }
}

export async function claimReport(req, res) {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report." });

    const [result] = await db.query(
      `UPDATE reports
          SET status = 'reviewed', reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ? AND status = 'pending'`,
      [req.user.userId, id],
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query("SELECT id FROM reports WHERE id = ?", [
        id,
      ]);
      if (!rows.length)
        return res.status(404).json({ message: "Report not found." });
      return res.status(409).json({
        message: "This report was already claimed by another staff member.",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Claim report error:", err);
    res.status(500).json({ message: "Could not claim the report." });
  }
}

export async function submitFinalReport(req, res) {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report." });

    const { outcome } = req.body || {};
    const summary = clean(req.body?.summary, 2000);

    if (!OUTCOMES.includes(outcome))
      return res.status(400).json({ message: "Choose an outcome." });
    if (!summary)
      return res.status(400).json({ message: "Add a short summary." });

    const nextStatus = needsAdmin(outcome) ? "escalated" : "resolved";

    const [result] = await db.query(
      `UPDATE reports
          SET staff_outcome = ?, staff_summary = ?, final_at = NOW(), status = ?
        WHERE id = ? AND status = 'reviewed' AND reviewed_by = ?`,
      [outcome, summary, nextStatus, id, req.user.userId],
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query("SELECT id FROM reports WHERE id = ?", [
        id,
      ]);
      if (!rows.length)
        return res.status(404).json({ message: "Report not found." });
      return res.status(403).json({
        message:
          "Only the staff member who claimed this report can submit its final report.",
      });
    }

    res.json({ success: true, status: nextStatus });
  } catch (err) {
    console.error("Final report error:", err);
    res.status(500).json({ message: "Could not submit the final report." });
  }
}

export async function decideReport(req, res) {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report." });

    const { decision } = req.body || {};
    if (!DECISIONS.includes(decision))
      return res.status(400).json({ message: "Choose accept or reject." });

    const [result] = await db.query(
      `UPDATE reports
          SET admin_decision = ?, decided_by = ?, decided_at = NOW(),
              status = 'resolved'
        WHERE id = ? AND status = 'escalated'`,
      [decision, req.user.userId, id],
    );

    if (result.affectedRows === 0)
      return res
        .status(409)
        .json({ message: "This report is not waiting for a decision." });

    res.json({ success: true });
  } catch (err) {
    console.error("Decide report error:", err);
    res.status(500).json({ message: "Could not save your decision." });
  }
}

export async function updateReportStatus(req, res) {
  try {
    const id = validId(req.params.id);
    const { status } = req.body || {};

    if (!id) return res.status(400).json({ message: "Invalid report." });
    if (!STATUSES.includes(status))
      return res.status(400).json({ message: "Invalid status." });

    const [result] = await db.query(
      "UPDATE reports SET status = ? WHERE id = ?",
      [status, id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Report not found." });

    res.json({ success: true });
  } catch (err) {
    console.error("Update report error:", err);
    res.status(500).json({ message: "Could not update the report." });
  }
}
