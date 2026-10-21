import db from "../config/db.js";

const STATUSES = ["pending", "reviewed", "resolved", "dismissed"];
const clean = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

// Saves one report. Used by both the manual form and the AI assistant.
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

// POST /api/reports  (buyers and sellers, from the manual form)
export async function createReport(req, res) {
  try {
    const { reportedName, reportedEmail, orderId, subject, details } =
      req.body || {};

    if (!clean(reportedName, 100))
      return res
        .status(400)
        .json({ message: "Enter the name of the person or store." });
    if (!clean(subject, 100))
      return res.status(400).json({ message: "Enter a subject." });
    if (!clean(details, 3000))
      return res.status(400).json({ message: "Tell us what happened." });
    if (
      clean(reportedEmail, 120) &&
      !/^\S+@\S+\.\S+$/.test(clean(reportedEmail, 120))
    )
      return res.status(400).json({ message: "Enter a valid email address." });

    const id = await saveReport({
      user: req.user,
      source: "form",
      reportedName,
      reportedEmail,
      orderId,
      subject,
      details,
    });

    res.status(201).json({ success: true, report: { id } });
  } catch (err) {
    console.error("Create report error:", err);
    res
      .status(500)
      .json({ message: "Your report could not be saved. Please try again." });
  }
}

// GET /api/reports?status=pending&source=ai&limit=50&offset=0  (staff, admin)
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

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [rows] = await db.query(
      `SELECT r.*, u.email AS reporter_email
         FROM reports r
         LEFT JOIN users u ON u.id = r.reporter_id
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
      orderId: r.order_id,
      subject: r.subject,
      details: r.details,
      aiSummary: r.ai_summary,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
    }));

    res.json({ success: true, reports });
  } catch (err) {
    console.error("List reports error:", err);
    res.status(500).json({ message: "Could not load reports." });
  }
}

// PATCH /api/reports/:id  { status }  (staff, admin)
export async function updateReportStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isInteger(id) || id < 1)
      return res.status(400).json({ message: "Invalid report." });
    if (!STATUSES.includes(status))
      return res.status(400).json({ message: "Invalid status." });

    const [result] = await db.query(
      `UPDATE reports
          SET status = ?,
              reviewed_by = ?,
              reviewed_at = ${status === "pending" ? "NULL" : "NOW()"}
        WHERE id = ?`,
      [status, status === "pending" ? null : req.user.userId, id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Report not found." });

    res.json({ success: true });
  } catch (err) {
    console.error("Update report error:", err);
    res.status(500).json({ message: "Could not update the report." });
  }
}
