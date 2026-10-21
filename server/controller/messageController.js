import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { createNotification } from "../notifications.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_BODY = 2000;

const ISO = "'%Y-%m-%dT%H:%i:%sZ'";

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

function imageExtension(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "jpg";
  if (
    buf.length > 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (
    buf.length > 6 &&
    /^GIF8[79]a$/.test(buf.subarray(0, 6).toString("latin1"))
  )
    return "gif";
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "webp";
  return null;
}

async function saveImage(file) {
  const ext = imageExtension(file.buffer);
  if (!ext)
    throw httpError(400, "Please choose a JPG, PNG, GIF or WebP image.");
  const name = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer, {
    flag: "wx",
  });
  return `/uploads/${name}`;
}

const removeUpload = (url) => {
  if (url) fs.unlink(path.join(__dirname, "..", url), () => {});
};

const toMessage = (m, me) => ({
  id: m.id,
  mine: m.sender_id === me,
  body: m.body || "",
  image: m.image || null,
  createdAt: m.created_at,
  seen: Boolean(m.seen),
});

const clearedIdFor = (conversation, me) =>
  conversation.user_one === me ?
    conversation.one_cleared_id
  : conversation.two_cleared_id;

async function getMyConversation(rawId, userId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return null;
  const [rows] = await db.query(
    "SELECT * FROM conversations WHERE id = ? AND (user_one = ? OR user_two = ?)",
    [id, userId, userId],
  );
  return rows[0] || null;
}

const notificationTitle = (name) => `New message from ${name}`.slice(0, 255);

const displayName = async (userId) => {
  const [rows] = await db.query(
    "SELECT COALESCE(NULLIF(shop_name, ''), fullname) AS name FROM users WHERE id = ?",
    [userId],
  );
  return rows[0]?.name || null;
};

async function notifyRecipient(conversation, senderId, recipientId) {
  try {
    const name = await displayName(senderId);
    if (!name) return;

    const [counted] = await db.query(
      `SELECT COUNT(*) AS total FROM messages
        WHERE conversation_id = ? AND sender_id = ?
          AND read_at IS NULL AND id > ?`,
      [conversation.id, senderId, clearedIdFor(conversation, recipientId)],
    );
    const total = Number(counted[0].total);
    const title = notificationTitle(name);
    const text =
      total > 1 ?
        `${name} sent you ${total} new messages.`
      : `${name} sent you a message.`;

    const [existing] = await db.query(
      `SELECT id FROM notifications
        WHERE user_id = ? AND type = 'messages' AND is_read = 0 AND title = ?
        ORDER BY id DESC LIMIT 1`,
      [recipientId, title],
    );
    if (existing[0])
      await db.query(
        "UPDATE notifications SET text = ?, created_at = NOW() WHERE id = ?",
        [text, existing[0].id],
      );
    else
      await createNotification({
        userId: recipientId,
        type: "messages",
        title,
        text,
      });
  } catch (err) {
    console.error("Message notification failed:", err);
  }
}

async function clearMessageNotification(me, otherId) {
  try {
    const name = await displayName(otherId);
    if (!name) return;
    await db.query(
      `UPDATE notifications SET is_read = 1
        WHERE user_id = ? AND type = 'messages' AND is_read = 0 AND title = ?`,
      [me, notificationTitle(name)],
    );
  } catch (err) {
    console.error("Clearing message notification failed:", err);
  }
}

const sendError = (res, err, fallback) => {
  if (err.status)
    return res
      .status(err.status)
      .json({ success: false, message: err.message });
  console.error(fallback, err);
  return res.status(500).json({ success: false, message: fallback });
};

export const searchUsers = async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json({ success: true, users: [] });

  const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  try {
    const [rows] = await db.query(
      `SELECT id, role, COALESCE(NULLIF(shop_name, ''), fullname) AS name
         FROM users
        WHERE is_active = 1
          AND id <> ?
          AND (fullname LIKE ? OR shop_name LIKE ?)
        ORDER BY name
        LIMIT 10`,
      [req.user.userId, like, like],
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    sendError(res, err, "Search failed.");
  }
};

export const listConversations = async (req, res) => {
  const me = req.user.userId;
  try {
    const [rows] = await db.query(
      `SELECT c.id,
              u.id AS other_id,
              u.role AS other_role,
              COALESCE(NULLIF(u.shop_name, ''), u.fullname) AS other_name,
              lm.body AS last_body,
              lm.image AS last_image,
              lm.sender_id AS last_sender_id,
              DATE_FORMAT(lm.created_at, ${ISO}) AS last_at,
              (SELECT COUNT(*) FROM messages m
                WHERE m.conversation_id = c.id
                  AND m.sender_id <> ?
                  AND m.read_at IS NULL
                  AND m.id > IF(c.user_one = ?, c.one_cleared_id, c.two_cleared_id)
              ) AS unread
         FROM conversations c
         JOIN users u ON u.id = IF(c.user_one = ?, c.user_two, c.user_one)
         JOIN messages lm
           ON lm.id = (SELECT MAX(id) FROM messages WHERE conversation_id = c.id)
        WHERE (c.user_one = ? OR c.user_two = ?)
          AND lm.id > IF(c.user_one = ?, c.one_cleared_id, c.two_cleared_id)
        ORDER BY lm.id DESC
        LIMIT 100`,
      [me, me, me, me, me, me],
    );

    res.json({
      success: true,
      conversations: rows.map((r) => ({
        id: r.id,
        otherId: r.other_id,
        name: r.other_name,
        role: r.other_role,
        lastMessage: r.last_body || (r.last_image ? "Photo" : ""),
        lastMine: r.last_sender_id === me,
        lastAt: r.last_at,
        unread: Number(r.unread),
      })),
    });
  } catch (err) {
    sendError(res, err, "Could not load conversations.");
  }
};

export const startConversation = async (req, res) => {
  const me = req.user.userId;
  const otherId = Number(req.body?.userId);

  if (!Number.isInteger(otherId) || otherId < 1)
    return res.status(400).json({ success: false, message: "Invalid user." });
  if (otherId === me)
    return res
      .status(400)
      .json({ success: false, message: "You can't message yourself." });

  try {
    const [users] = await db.query(
      `SELECT id, role, COALESCE(NULLIF(shop_name, ''), fullname) AS name
         FROM users WHERE id = ? AND is_active = 1`,
      [otherId],
    );
    const other = users[0];
    if (!other)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const [a, b] = me < otherId ? [me, otherId] : [otherId, me];
    const [result] = await db.query(
      `INSERT INTO conversations (user_one, user_two) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [a, b],
    );

    res.json({
      success: true,
      conversation: {
        id: result.insertId,
        otherId: other.id,
        name: other.name,
        role: other.role,
      },
    });
  } catch (err) {
    sendError(res, err, "Could not start the conversation.");
  }
};

export const getMessages = async (req, res) => {
  const me = req.user.userId;
  try {
    const conversation = await getMyConversation(req.params.id, me);
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });

    const [readResult] = await db.query(
      `UPDATE messages SET read_at = UTC_TIMESTAMP()
        WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL`,
      [conversation.id, me],
    );
    if (readResult.affectedRows > 0) {
      const otherId =
        conversation.user_one === me ?
          conversation.user_two
        : conversation.user_one;
      await clearMessageNotification(me, otherId);
    }

    const [rows] = await db.query(
      `SELECT * FROM (
         SELECT id, sender_id, body, image,
                read_at IS NOT NULL AS seen,
                DATE_FORMAT(created_at, ${ISO}) AS created_at
           FROM messages
          WHERE conversation_id = ? AND id > ?
          ORDER BY id DESC
          LIMIT 300
       ) recent ORDER BY id ASC`,
      [conversation.id, clearedIdFor(conversation, me)],
    );

    res.json({ success: true, messages: rows.map((m) => toMessage(m, me)) });
  } catch (err) {
    sendError(res, err, "Could not load messages.");
  }
};

export const sendMessage = async (req, res) => {
  const me = req.user.userId;
  let imageUrl = null;
  try {
    const conversation = await getMyConversation(req.params.id, me);
    if (!conversation) throw httpError(404, "Conversation not found.");

    const body = String(req.body?.body || "").trim();
    if (!body && !req.file)
      throw httpError(400, "Type a message or attach a photo.");
    if (body.length > MAX_BODY)
      throw httpError(400, `Messages can be up to ${MAX_BODY} characters.`);

    const otherId =
      conversation.user_one === me ?
        conversation.user_two
      : conversation.user_one;
    const [others] = await db.query(
      "SELECT is_active FROM users WHERE id = ?",
      [otherId],
    );
    if (!others[0]?.is_active)
      throw httpError(403, "This account is no longer available.");

    if (req.file) imageUrl = await saveImage(req.file);

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, body, image, created_at)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP())`,
      [conversation.id, me, body || null, imageUrl],
    );

    notifyRecipient(conversation, me, otherId);

    const [rows] = await db.query(
      `SELECT id, sender_id, body, image,
              read_at IS NOT NULL AS seen,
              DATE_FORMAT(created_at, ${ISO}) AS created_at
         FROM messages WHERE id = ?`,
      [result.insertId],
    );
    res.status(201).json({ success: true, message: toMessage(rows[0], me) });
  } catch (err) {
    removeUpload(imageUrl);
    sendError(res, err, "Could not send the message.");
  }
};

export const deleteConversation = async (req, res) => {
  const me = req.user.userId;
  try {
    const conversation = await getMyConversation(req.params.id, me);
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });

    const column =
      conversation.user_one === me ? "one_cleared_id" : "two_cleared_id";
    await db.query(
      `UPDATE conversations
          SET ${column} = (
            SELECT COALESCE(MAX(id), 0) FROM messages
             WHERE conversation_id = conversations.id)
        WHERE id = ?`,
      [conversation.id],
    );

    res.json({ success: true });
  } catch (err) {
    sendError(res, err, "Could not delete the conversation.");
  }
};
