import bcrypt from "bcryptjs";
import db from "../config/db.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export const getStaff = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, fullname, email, is_active
       FROM users
       WHERE role = 'staff'`,
    );
    res.json({ success: true, staff: rows });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) {
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
      password.length < 6 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
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
      `INSERT INTO users (fullname, email, password, role)
       VALUES (?, ?, ?, 'staff')`,
      [fullname, email, hashedPassword],
    );
    res.status(201).json({
      success: true,
      staff: { id: result.insertId, fullname, email, is_active: 1 },
    });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname } = req.body;
    if (!fullname) {
      return res.status(400).json({ success: false, message: "Invalid data." });
    }
    const [result] = await db.query(
      "UPDATE users SET fullname = ? WHERE id = ? AND role = 'staff'",
      [fullname, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found." });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const setStaffRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const { restricted } = req.body;
    if (typeof restricted !== "boolean") {
      return res.status(400).json({ success: false, message: "Invalid data." });
    }
    const [result] = await db.query(
      "UPDATE users SET is_active = ? WHERE id = ? AND role = 'staff'",
      [restricted ? 0 : 1, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found." });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Set staff restriction error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
