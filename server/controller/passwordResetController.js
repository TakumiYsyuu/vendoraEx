import bcrypt from "bcryptjs";
import db from "../config/db.js";
import { sendOtpEmail } from "../utils/mailer.js";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

export const requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const [users] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    // Same response whether the email exists or not — don't reveal which emails are registered.
    if (users.length === 0) {
      return res.json({
        success: true,
        message: "If that email is registered, a code has been sent.",
      });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      "INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)",
      [email, code, expiresAt],
    );

    await sendOtpEmail(email, code);

    res.json({
      success: true,
      message: "If that email is registered, a code has been sent.",
    });
  } catch (error) {
    console.error("Request reset error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Email and code are required." });
    }

    const [rows] = await db.query(
      `SELECT id FROM password_resets
       WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, code],
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code." });
    }

    res.json({ success: true, message: "Code verified." });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const [rows] = await db.query(
      `SELECT id FROM password_resets
       WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, code],
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);
    await db.query("UPDATE password_resets SET used = 1 WHERE id = ?", [
      rows[0].id,
    ]);

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
