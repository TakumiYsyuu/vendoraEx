import db from "../config/db.js";

export const getWishlist = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.userId],
    );
    res.json({ success: true, ids: rows.map((r) => r.product_id) });
  } catch (err) {
    console.error("Get wishlist error:", err);
    res
      .status(500)
      .json({ success: false, message: "Could not load wishlist." });
  }
};

export const addWishlist = async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId < 1)
    return res
      .status(400)
      .json({ success: false, message: "Invalid product." });

  try {
    await db.query(
      `INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [req.user.userId, productId],
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2")
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    console.error("Add wishlist error:", err);
    res
      .status(500)
      .json({ success: false, message: "Could not save to wishlist." });
  }
};

export const removeWishlist = async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId < 1)
    return res
      .status(400)
      .json({ success: false, message: "Invalid product." });

  try {
    await db.query(
      "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
      [req.user.userId, productId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Remove wishlist error:", err);
    res
      .status(500)
      .json({ success: false, message: "Could not remove from wishlist." });
  }
};
