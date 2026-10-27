import db from "../config/db.js";

const parseImages = (v) => {
  try {
    return JSON.parse(v || "[]");
  } catch {
    return [];
  }
};

const fail = (res, err, msg = "Server error.") => {
  console.error(msg, err);
  return res.status(500).json({ success: false, message: msg });
};

// Same shape as the storefront products, plus `quantity`
const shape = (r) => {
  const original = Number(r.price);
  const discount = Number(r.discount_percent) || 0;
  return {
    id: r.id,
    sellerId: r.seller_id,
    name: r.name,
    category: r.category,
    description: r.description || "",
    price: +(original * (1 - discount / 100)).toFixed(2),
    old: original,
    stock: r.stock,
    seller: r.seller,
    images: parseImages(r.images),
    rating: 0,
    reviews: 0,
    sold: 0,
    quantity: Math.min(r.quantity, r.stock || r.quantity),
  };
};

export const getCart = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.quantity, p.id, p.seller_id, p.name, p.category, p.description,
              p.price, p.discount_percent, p.stock, p.images,
              COALESCE(NULLIF(u.shop_name, ''), u.fullname) AS seller
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       JOIN users u ON u.id = p.seller_id
       WHERE c.user_id = ? AND p.status = 'active'
       ORDER BY c.created_at`,
      [req.user.userId],
    );
    res.json({ success: true, items: rows.map(shape) });
  } catch (err) {
    fail(res, err, "Failed to load cart.");
  }
};

async function findBuyableProduct(productId, userId) {
  const [rows] = await db.query(
    "SELECT id, seller_id, stock, status FROM products WHERE id = ?",
    [productId],
  );
  const p = rows[0];
  if (!p || p.status !== "active")
    return { error: "This product is not available.", code: 404 };
  if (p.seller_id === userId)
    return { error: "You cannot add your own product.", code: 400 };
  if (p.stock < 1) return { error: "This product is out of stock.", code: 400 };
  return { product: p };
}

// POST /  body: { productId, quantity }  -> adds to the existing quantity
export const addToCart = async (req, res) => {
  const productId = Number(req.body.productId);
  const qty = Math.max(1, Number(req.body.quantity) || 1);
  if (!Number.isInteger(productId))
    return res
      .status(400)
      .json({ success: false, message: "Invalid product." });
  try {
    const { product, error, code } = await findBuyableProduct(
      productId,
      req.user.userId,
    );
    if (error) return res.status(code).json({ success: false, message: error });

    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?, ?, LEAST(?, ?))
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + ?, ?)`,
      [req.user.userId, productId, qty, product.stock, qty, product.stock],
    );
    res.status(201).json({ success: true, message: "Added to cart." });
  } catch (err) {
    fail(res, err, "Failed to add to cart.");
  }
};

export const setQuantity = async (req, res) => {
  const productId = Number(req.params.productId);
  const qty = Number(req.body.quantity);
  if (!Number.isInteger(productId) || !Number.isInteger(qty))
    return res.status(400).json({ success: false, message: "Invalid data." });
  try {
    if (qty <= 0) {
      await db.query(
        "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
        [req.user.userId, productId],
      );
      return res.json({ success: true });
    }
    const { product, error, code } = await findBuyableProduct(
      productId,
      req.user.userId,
    );
    if (error) return res.status(code).json({ success: false, message: error });

    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?, ?, LEAST(?, ?))
       ON DUPLICATE KEY UPDATE quantity = LEAST(?, ?)`,
      [req.user.userId, productId, qty, product.stock, qty, product.stock],
    );
    res.json({ success: true });
  } catch (err) {
    fail(res, err, "Failed to update cart.");
  }
};

export const removeItem = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
      [req.user.userId, Number(req.params.productId)],
    );
    res.json({ success: true });
  } catch (err) {
    fail(res, err, "Failed to remove item.");
  }
};

export const clearCart = async (req, res) => {
  try {
    await db.query("DELETE FROM cart_items WHERE user_id = ?", [
      req.user.userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    fail(res, err, "Failed to clear cart.");
  }
};
