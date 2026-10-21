import jwt from "jsonwebtoken";
import db from "../config/db.js";

const REQUIRE_VERIFIED = true;

export async function requireSeller(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not logged in." });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token." });
    }

    const [rows] = await db.query(
      "SELECT id, role, is_active, verification_status FROM users WHERE id = ?",
      [payload.userId],
    );
    const user = rows[0];

    if (!user || !user.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Account is not active." });
    }
    if (user.role !== "seller") {
      return res.status(403).json({ success: false, message: "Sellers only." });
    }
    if (REQUIRE_VERIFIED && user.verification_status !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Your seller account must be verified first.",
      });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error("Seller auth error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
}
