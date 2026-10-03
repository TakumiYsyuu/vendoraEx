import db from "../config/db.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, email, role, is_active FROM users WHERE id = ?",
      [payload.userId],
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res
        .status(401)
        .json({ success: false, message: "Account unavailable" });
    }

    req.user = {
      userId: rows[0].id,
      email: rows[0].email,
      role: rows[0].role,
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}
