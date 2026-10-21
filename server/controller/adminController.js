import bcrypt from "bcryptjs";
import db from "../config/db.js";
import { readAsDataUrl } from "../utils/saveImage.js";
import { createNotification } from "../notifications.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const RESTRICTABLE_ROLES = "('shopper', 'seller', 'staff')";

// Accepts "2026-10-20" or "2026-10-20T15:30" and returns "YYYY-MM-DD HH:mm:ss"
function toSqlDateTime(value, endOfDay = false) {
  if (!value || typeof value !== "string") return null;
  if (value.includes("T")) return `${value.replace("T", " ")}:00`.slice(0, 19);
  return `${value} ${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export const getUserStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT role, COUNT(*) AS count FROM users WHERE role != 'admin' GROUP BY role`,
    );

    const counts = { shopper: 0, seller: 0, staff: 0 };
    rows.forEach((row) => {
      counts[row.role] = row.count;
    });

    const total = counts.shopper + counts.seller + counts.staff;

    res.json({
      success: true,
      total,
      shoppers: counts.shopper,
      sellers: counts.seller,
      staff: counts.staff,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, fullname, email, phone_num, role, is_active,
         restriction_reason, restriction_start, restriction_end,
         (restriction_start IS NOT NULL AND restriction_start <= NOW()
           AND (restriction_end IS NULL OR restriction_end >= NOW())) AS is_restricted
       FROM users
       WHERE role IN ('shopper', 'seller')`,
    );
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const createUser = async (req, res) => {
  try {
    const { fullname, email, phone, phone_num, password, role } = req.body;
    const phoneValue = (phone || phone_num || "").trim();

    if (!fullname || !email || !phoneValue || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email." });
    }
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8 to 72 characters.",
      });
    }
    if (!["shopper", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (fullname, email, phone_num, password, role, verification_status)
       VALUES (?, ?, ?, ?, ?, 'verified')`,
      [fullname.trim(), email.trim(), phoneValue, hashedPassword, role],
    );
    res.status(201).json({
      success: true,
      user: { id: result.insertId, fullname, email, role, is_active: 1 },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, role } = req.body;
    if (!fullname || !["shopper", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid data." });
    }
    const [result] = await db.query(
      "UPDATE users SET fullname = ?, role = ? WHERE id = ? AND role IN ('shopper', 'seller')",
      [fullname, role, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const setUserRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const { restricted, reason, startDate, endDate } = req.body;
    if (typeof restricted !== "boolean") {
      return res.status(400).json({ success: false, message: "Invalid data." });
    }

    // Lift the restriction
    if (!restricted) {
      const [result] = await db.query(
        `UPDATE users 
        SET restriction_reason = NULL, restriction_start = NULL, restriction_end = NULL
        WHERE id = ? AND role IN ${RESTRICTABLE_ROLES}`,
        [id],
      );
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      return res.json({ success: true });
    }

    // Apply a restriction
    if (!reason?.trim() || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Reason and start date are required.",
      });
    }
    const start = toSqlDateTime(startDate, false);
    const end = endDate ? toSqlDateTime(endDate, true) : null;
    if (end && end <= start) {
      return res.status(400).json({
        success: false,
        message: "End must be after the start.",
      });
    }

    const [result] = await db.query(
      `UPDATE users
        SET restriction_reason = ?, restriction_start = ?, restriction_end = ?
        WHERE id = ? AND role IN ${RESTRICTABLE_ROLES}`,
      [reason.trim(), start, end, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Set restriction error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const getStaff = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, fullname, email, phone_num, role, is_active,
         restriction_reason, restriction_start, restriction_end,
         (restriction_start IS NOT NULL AND restriction_start <= NOW()
           AND (restriction_end IS NULL OR restriction_end >= NOW())) AS is_restricted
       FROM users
       WHERE role = 'staff'
       ORDER BY fullname ASC`,
    );
    res.json({ success: true, staff: rows });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { fullname, name, email, password, phone, phone_num } = req.body;
    const nameValue = (fullname || name || "").trim();
    const emailValue = typeof email === "string" ? email.trim() : "";
    const phoneValue = (phone || phone_num || "").trim();

    if (!nameValue || !emailValue || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }
    if (!EMAIL_REGEX.test(emailValue)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email." });
    }
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8 to 72 characters.",
      });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      emailValue,
    ]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (fullname, email, phone_num, password, role, verification_status)
       VALUES (?, ?, ?, ?, 'staff', 'verified')`,
      [nameValue, emailValue, phoneValue || "", hashedPassword],
    );

    res.status(201).json({
      success: true,
      staff: {
        id: result.insertId,
        fullname: nameValue,
        email: emailValue,
        role: "staff",
        is_active: 1,
        is_restricted: 0,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, name, phone, phone_num } = req.body;
    const nameValue = (fullname || name || "").trim();
    const phoneValue = (phone || phone_num || "").trim();

    if (!nameValue) {
      return res.status(400).json({ success: false, message: "Invalid data." });
    }

    const [result] = await db.query(
      "UPDATE users SET fullname = ?, phone_num = ? WHERE id = ? AND role = 'staff'",
      [nameValue, phoneValue, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found." });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "DELETE FROM users WHERE id = ? AND role = 'staff'",
      [id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found." });
    }
    res.json({ success: true });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message: "This staff member has linked records and can't be deleted.",
      });
    }
    console.error("Delete staff error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const listVerifications = async (req, res) => {
  try {
    const filter =
      ["pending", "approved", "rejected"].includes(req.query.status) ?
        req.query.status
      : null;

    const [rows] = await db.query(
      `SELECT v.id, v.user_id, u.fullname, u.email, u.phone_num,
              u.shop_name, u.shop_description,
              DATE_FORMAT(v.birth_date, '%Y-%m-%d') AS birth_date, v.age,
              v.id_type, v.parent_id_type, v.status, v.rejection_reason,
              v.submitted_at, v.reviewed_at
       FROM seller_verifications v
       JOIN users u ON u.id = v.user_id
       WHERE v.id = (
         SELECT MAX(v2.id) FROM seller_verifications v2
         WHERE v2.user_id = v.user_id
       )
       ${filter ? "AND v.status = ?" : ""}
       ORDER BY v.submitted_at DESC`,
      filter ? [filter] : [],
    );
    res.json({ success: true, verifications: rows });
  } catch (error) {
    console.error("List verifications error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

async function reviewVerification(req, res, decision) {
  const approving = decision === "approved";
  const reason = String(req.body?.reason ?? "").trim();

  if (!approving && !reason) {
    return res
      .status(400)
      .json({ success: false, message: "Please give a reason for rejecting." });
  }
  if (reason.length > 1000) {
    return res
      .status(400)
      .json({ success: false, message: "Reason is too long." });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Lock the row so two admins can't review the same request at once
    const [rows] = await conn.query(
      "SELECT id, user_id, status FROM seller_verifications WHERE id = ? FOR UPDATE",
      [req.params.id],
    );
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }
    if (row.status !== "pending") {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `This request is already ${row.status}.`,
      });
    }

    await conn.query(
      `UPDATE seller_verifications
       SET status = ?, rejection_reason = ?, reviewed_at = NOW(), reviewed_by = ?
       WHERE id = ?`,
      [decision, approving ? null : reason, req.user.userId, row.id],
    );
    await conn.query("UPDATE users SET verification_status = ? WHERE id = ?", [
      approving ? "verified" : "rejected",
      row.user_id,
    ]);
    await createNotification(
      approving ?
        {
          userId: row.user_id,
          type: "seller_approved",
          title: "You're now a verified seller 🎉",
          text: "Your seller verification has been approved. You can now start listing your products.",
        }
      : {
          userId: row.user_id,
          type: "seller_rejected",
          title: "Seller verification not approved",
          text: `Your seller verification was rejected. Reason: ${reason}`,
        },
      conn,
    );
    await conn.commit();
    res.json({
      success: true,
      message: approving ? "Seller approved." : "Seller rejected.",
    });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.error("Review verification error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  } finally {
    if (conn) conn.release();
  }
}

export const approveVerification = (req, res) =>
  reviewVerification(req, res, "approved");
export const rejectVerification = (req, res) =>
  reviewVerification(req, res, "rejected");

// GET /api/admin/verifications/:id/images
export const getVerificationImages = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_image, parent_id_image FROM seller_verifications WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }
    res.json({
      success: true,
      id_image: readAsDataUrl(rows[0].id_image),
      parent_id_image: readAsDataUrl(rows[0].parent_id_image),
    });
  } catch (error) {
    console.error("Verification images error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
