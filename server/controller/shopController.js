import db from "../config/db.js";
import { saveDataUrl, readAsDataUrl, removeFiles } from "../utils/saveImage.js";

const MIN_AGE = 14;
const MINOR_AGE = 18;
const MAX_AGE = 80;

function calcAge(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const born = new Date(y, m - 1, d);
  if (
    born.getFullYear() !== y ||
    born.getMonth() !== m - 1 ||
    born.getDate() !== d
  )
    return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d))
    age--;
  return age;
}

export const getShop = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT fullname, email, address, shop_name, shop_description, verification_status
       FROM users WHERE id = ?`,
      [req.user.id],
    );
    const u = rows[0];
    if (!u)
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });

    res.json({
      success: true,
      shop: {
        name: u.shop_name || `${u.fullname}'s Shop`,
        email: u.email,
        address: u.address || "",
        description:
          u.shop_description || "Quality products and everyday essentials.",
        verification_status: u.verification_status,
      },
    });
  } catch (err) {
    console.error("Get shop error:", err);
    res.status(500).json({ success: false, message: "Failed to load shop." });
  }
};

export const updateShop = async (req, res) => {
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const address = (req.body.address || "").trim();

  const errors = {};
  if (name.length < 2 || name.length > 100)
    errors.name = "Shop name must be 2 to 100 characters.";
  if (description.length > 500)
    errors.description = "Description must be 500 characters or less.";
  if (!address) errors.address = "Address is required.";
  else if (address.length > 90)
    errors.address = "Address must be 255 characters or less.";
  if (Object.keys(errors).length) {
    return res
      .status(400)
      .json({ success: false, message: "Please fix the errors.", errors });
  }

  try {
    await db.query(
      "UPDATE users SET shop_name = ?, shop_description = ?, address = ? WHERE id = ?",
      [name, description, address, req.user.id],
    );
    res.json({ success: true, message: "Shop updated." });
  } catch (err) {
    console.error("Update shop error:", err);
    res.status(500).json({ success: false, message: "Failed to update shop." });
  }
};

async function fetchLatest(userId, conn = db) {
  const [rows] = await conn.query(
    `SELECT id, DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date, id_type, id_image,
            parent_id_type, parent_id_image, status, rejection_reason,
            submitted_at, reviewed_at
     FROM seller_verifications
     WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
    [userId],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    ...r,
    id_image: readAsDataUrl(r.id_image),
    parent_id_image: readAsDataUrl(r.parent_id_image),
  };
}

export const getVerification = async (req, res) => {
  try {
    res.json(await fetchLatest(req.user.id));
  } catch (err) {
    console.error("Get verification error:", err);
    res.status(500).json({ message: "Could not load verification." });
  }
};

export const submitVerification = async (req, res) => {
  const saved = [];
  let conn;
  try {
    const { birth_date, id_type, id_image, parent_id_type, parent_id_image } =
      req.body;

    const age = calcAge(birth_date);
    if (age === null || age < 0)
      return res.status(400).json({ message: "Enter a valid birth date." });
    if (age < MIN_AGE)
      return res.status(400).json({
        message: `You must be at least ${MIN_AGE} years old to open a store.`,
      });
    if (age > MAX_AGE)
      return res.status(400).json({
        message: `Sellers must be ${MAX_AGE} years old or younger.`,
      });

    const isMinor = age < MINOR_AGE;
    if (!id_type || String(id_type).length > 100)
      return res.status(400).json({ message: "Choose your ID type." });
    if (!id_image)
      return res.status(400).json({ message: "Upload a photo of your ID." });
    if (isMinor && (!parent_id_type || !parent_id_image))
      return res
        .status(400)
        .json({ message: "A parent or guardian's ID is required." });

    const current = await fetchLatest(req.user.id);
    if (current && current.status !== "rejected")
      return res.status(409).json({
        message:
          current.status === "pending" ?
            "Your verification is already under review."
          : "Your store is already verified.",
      });

    const idPath = saveDataUrl(id_image);
    saved.push(idPath);
    let parentPath = null;
    if (isMinor) {
      parentPath = saveDataUrl(parent_id_image);
      saved.push(parentPath);
    }

    conn = await db.getConnection();
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO seller_verifications
         (user_id, birth_date, age, id_type, id_image, parent_id_type, parent_id_image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.id,
        birth_date,
        age,
        id_type,
        idPath,
        isMinor ? parent_id_type : null,
        parentPath,
      ],
    );
    await conn.query(
      "UPDATE users SET verification_status = 'pending' WHERE id = ?",
      [req.user.id],
    );
    await conn.commit();

    res.status(201).json(await fetchLatest(req.user.id));
  } catch (err) {
    if (conn) await conn.rollback().catch(() => {});
    removeFiles(saved);
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    console.error("Submit verification error:", err);
    res.status(500).json({ message: "Could not submit verification." });
  } finally {
    if (conn) conn.release();
  }
};
