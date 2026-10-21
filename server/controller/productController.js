import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty & Health",
  "Toys & Games",
  "Sports",
  "Groceries",
  "Others",
];

const removeFiles = (files = []) =>
  files.forEach((f) => fs.unlink(f.path, () => {}));
const parseImages = (v) => {
  try {
    return JSON.parse(v || "[]");
  } catch {
    return [];
  }
};
const withImages = (p) => {
  const images = parseImages(p.images);
  return { ...p, images, thumbnail: images[0] || null };
};

function validate(body) {
  const errors = {};
  const name = (body.name || "").trim();
  const description = (body.description || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const discount =
    body.discount === "" || body.discount == null ? 0 : Number(body.discount);

  if (name.length < 3)
    errors.name = "Product name must be at least 3 characters.";
  if (!CATEGORIES.includes(body.category))
    errors.category = "Choose a valid category.";
  if (description.length < 10)
    errors.description = "Description must be at least 10 characters.";
  if (body.price === "" || body.price == null || !(price > 0))
    errors.price = "Price must be greater than 0.";
  if (
    body.stock === "" ||
    body.stock == null ||
    !Number.isInteger(stock) ||
    stock < 0
  )
    errors.stock = "Stock must be a whole number (0 or more).";
  if (!(discount >= 0 && discount < 100))
    errors.discount = "Discount must be between 0 and 99.";

  return {
    errors,
    data: {
      name,
      description,
      category: body.category,
      price,
      stock,
      discount,
    },
  };
}

export const getCategories = (req, res) => {
  res.json({ success: true, categories: CATEGORIES });
};

export const createProduct = async (req, res) => {
  const { errors, data } = validate(req.body);
  if (Object.keys(errors).length) {
    removeFiles(req.files);
    return res
      .status(400)
      .json({ success: false, message: "Please fix the errors.", errors });
  }

  if (!req.files?.length) {
    return res.status(400).json({
      success: false,
      message: "Please upload at least one product image.",
    });
  }

  try {
    const urls = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const [result] = await db.query(
      `INSERT INTO products
        (seller_id, name, category, description, price, stock, discount_percent, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        data.name,
        data.category,
        data.description,
        data.price,
        data.stock,
        data.discount,
        JSON.stringify(urls),
      ],
    );
    res.status(201).json({
      success: true,
      message: "Product created!",
      id: result.insertId,
    });
  } catch (err) {
    removeFiles(req.files);
    console.error("Create product error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save product." });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json({ success: true, products: rows.map(withImages) });
  } catch (err) {
    console.error("Get products error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load products." });
  }
};

export const getProduct = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    res.json({ success: true, product: withImages(rows[0]) });
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateProduct = async (req, res) => {
  const { errors, data } = validate(req.body);
  if (Object.keys(errors).length) {
    return res
      .status(400)
      .json({ success: false, message: "Please fix the errors.", errors });
  }
  try {
    const [r] = await db.query(
      `UPDATE products
       SET name=?, category=?, description=?, price=?, stock=?, discount_percent=?
       WHERE id=? AND seller_id=?`,
      [
        data.name,
        data.category,
        data.description,
        data.price,
        data.stock,
        data.discount,
        req.params.id,
        req.user.id,
      ],
    );
    if (!r.affectedRows)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product updated." });
  } catch (err) {
    console.error("Update product error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update product." });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT images FROM products WHERE id = ? AND seller_id = ?",
      [req.params.id, req.user.id],
    );
    if (!rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });

    await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    parseImages(rows[0].images).forEach((url) =>
      fs.unlink(path.join(__dirname, "..", url), () => {}),
    );
    res.json({ success: true, message: "Product deleted." });
  } catch (err) {
    console.error("Delete product error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete product." });
  }
};

export const listStorefrontProducts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.seller_id, p.name, p.category, p.description,
              p.price, p.stock, p.discount_percent, p.images,
              COALESCE(NULLIF(u.shop_name, ''), u.fullname) AS seller
       FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE p.status = 'active'
         AND u.verification_status = 'verified'
       ORDER BY p.created_at DESC`,
    );

    const products = rows.map((r) => {
      const original = Number(r.price);
      const discount = Number(r.discount_percent) || 0;
      return {
        id: r.id,
        sellerId: r.seller_id,
        name: r.name,
        category: r.category,
        description: r.description || "",
        price: +(original * (1 - discount / 100)).toFixed(2),
        old: original, // original price
        stock: r.stock,
        seller: r.seller,
        images: parseImages(r.images),
        rating: 0,
        reviews: 0,
        sold: 0,
      };
    });

    res.json({ success: true, products });
  } catch (err) {
    console.error("List storefront products error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
