import bcrypt from "bcryptjs";
import db from "../config/db.js";
import { signToken } from "../utils/token.js";

export const register = async (req, res) => {
  try {
    const { fullname, email, phone_num, password, role } = req.body;

    if (!fullname || !email || !phone_num || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    if (!["shopper", "seller"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
        (fullname, email, phone_num, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [fullname, email, phone_num, hashedPassword, role],
    );

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: {
        id: result.insertId,
        fullname,
        email,
        phone_num,
        role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const [rows] = await db.query(
      `SELECT id, fullname, email, phone_num, password, role, verification_status, is_active
       FROM users WHERE email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone_num: user.phone_num,
        role: user.role,
        verification_status: user.verification_status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const [rows] = await db.query(
      `SELECT id, fullname, email, phone_num, password, role, verification_status, is_active
       FROM users WHERE email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = rows[0];

    if (user.role !== "staff" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This account does not have staff access.",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Staff login successful!",
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone_num: user.phone_num,
        role: user.role,
        verification_status: user.verification_status,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during staff login.",
    });
  }
};
