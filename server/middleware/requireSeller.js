import db from "../config/db.js";

export async function requireSeller(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Not logged in" });

    const [rows] = await db.execute(
      "SELECT id, role, is_active, verification_status FROM users WHERE id = ?",
      [userId],
    );
    const user = rows[0];

    if (!user || !user.is_active)
      return res.status(403).json({ message: "Account is not active" });
    if (user.role !== "seller")
      return res.status(403).json({ message: "Sellers only" });

    if (user.verification_status !== "verified") {
      return res.status(403).json({
        message: "Your seller account must be verified before adding products",
      });
    }

    req.user.id = user.id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
