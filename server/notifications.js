import express from "express";
import pool from "./config/db.js";

export async function createNotification(
  { userId, type, title, text },
  conn = pool,
) {
  await conn.query(
    "INSERT INTO notifications (user_id, type, title, text) VALUES (?, ?, ?, ?)",
    [userId, type, title, text],
  );
}

const router = express.Router();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const format = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  text: row.text,
  read: !!row.is_read,
  createdAt: new Date(row.created_at).toISOString(),
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC",
      [req.query.userId],
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

router.patch("/read-all", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [
      req.body.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update" });
  }
});

router.delete("/read", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM notifications WHERE user_id = ? AND is_read = 1",
      [req.query.userId],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
