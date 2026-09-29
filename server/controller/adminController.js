import bcrypt from "bcryptjs";
import db from "../config/db.js";

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
      `SELECT id, fullname, email, role, is_active
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
    const { fullname, email, phone_num, password, role } = req.body;
    if (!fullname || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
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
      `INSERT INTO users (fullname, email, phone_num, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [fullname, email, phone_num || "", hashedPassword, role],
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
    await db.query("UPDATE users SET fullname = ?, role = ? WHERE id = ?", [
      fullname,
      role,
      id,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const setUserRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const { restricted } = req.body;
    await db.query("UPDATE users SET is_active = ? WHERE id = ?", [
      restricted ? 0 : 1,
      id,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Set restriction error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
