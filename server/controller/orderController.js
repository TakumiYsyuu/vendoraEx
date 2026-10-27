import db from "../config/db.js";

const SHIPPING_FEE = 50;
// Notification type used for every order update (the bell sends "orders" to the orders page)
const NOTIFY_TYPE = "orders";

const makeCode = () =>
  `ORD-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

const parseImages = (v) => {
  try {
    return JSON.parse(v || "[]");
  } catch {
    return [];
  }
};

/* ---------------- notifications ---------------- */

// `client` is either the pool (db) or a transaction connection.
// A notification problem must never break an order, so errors are only logged.
async function notify(client, userId, title, text) {
  try {
    await client.query(
      "INSERT INTO notifications (user_id, type, title, `text`) VALUES (?, ?, ?, ?)",
      [userId, NOTIFY_TYPE, title, text],
    );
  } catch (err) {
    console.error("Notification error:", err.message);
  }
}

async function notifyStaff(title, text) {
  try {
    const [staff] = await db.query(
      "SELECT id FROM users WHERE role = 'staff' AND is_active = 1",
    );
    for (const member of staff) await notify(db, member.id, title, text);
  } catch (err) {
    console.error("Notify staff error:", err.message);
  }
}

/* ---------------- shared ---------------- */

const BASE_SELECT = `
  SELECT o.*,
         b.fullname  AS buyer_name,
         b.email     AS buyer_email,
         b.phone_num AS buyer_phone,
         COALESCE(NULLIF(s.shop_name, ''), s.fullname) AS shop_name
  FROM orders o
  JOIN users b ON b.id = o.buyer_id
  JOIN users s ON s.id = o.seller_id`;

const shape = (o, items = []) => ({
  id: o.id,
  code: o.order_code,
  status: o.status,
  buyerId: o.buyer_id,
  sellerId: o.seller_id,
  buyerName: o.buyer_name,
  buyerEmail: o.buyer_email,
  buyerPhone: o.buyer_phone,
  shopName: o.shop_name,
  subtotal: Number(o.subtotal),
  shippingFee: Number(o.shipping_fee),
  total: Number(o.total),
  shipName: o.ship_name,
  shipPhone: o.ship_phone,
  shipAddress: o.ship_address,
  cancelReason: o.cancel_reason,
  createdAt: o.created_at,
  acceptedAt: o.accepted_at,
  transitAt: o.transit_at,
  outForDeliveryAt: o.out_for_delivery_at,
  completedAt: o.completed_at,
  cancelledAt: o.cancelled_at,
  items: items.map((i) => ({
    id: i.id,
    productId: i.product_id,
    name: i.name,
    image: i.image,
    price: Number(i.price),
    quantity: i.quantity,
  })),
});

async function loadOrders(
  whereSql,
  params = [],
  orderBy = "o.created_at DESC",
) {
  const [orders] = await db.query(
    `${BASE_SELECT} ${whereSql} ORDER BY ${orderBy}`,
    params,
  );
  if (!orders.length) return [];
  const [items] = await db.query(
    "SELECT * FROM order_items WHERE order_id IN (?)",
    [orders.map((o) => o.id)],
  );
  return orders.map((o) =>
    shape(
      o,
      items.filter((i) => i.order_id === o.id),
    ),
  );
}

const fail = (res, err, msg = "Server error.") => {
  console.error(msg, err);
  return res.status(500).json({ success: false, message: msg });
};

/* ---------------- BUYER ---------------- */

// POST /  body: { items: [{productId, quantity}], shipping?: {name, phone, address} }
export const placeOrder = async (req, res) => {
  const buyerId = req.user.userId;
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length)
    return res
      .status(400)
      .json({ success: false, message: "Your cart is empty." });

  const wanted = new Map();
  for (const it of items) {
    const id = Number(it.productId);
    const qty = Number(it.quantity);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1)
      return res
        .status(400)
        .json({ success: false, message: "Invalid cart item." });
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  const ship = req.body.shipping || {};
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [products] = await conn.query(
      `SELECT id, seller_id, name, category, price, discount_percent, stock, images, status
       FROM products WHERE id IN (?) FOR UPDATE`,
      [[...wanted.keys()]],
    );

    if (products.length !== wanted.size) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "One of the products no longer exists.",
      });
    }

    for (const p of products) {
      const qty = wanted.get(p.id);
      if (p.status !== "active") {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `"${p.name}" is not available.`,
        });
      }
      if (p.seller_id === buyerId) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "You cannot buy your own product.",
        });
      }
      if (p.stock < qty) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${p.name}" (only ${p.stock} left).`,
        });
      }
    }

    // group by seller -> one order per seller
    const bySeller = new Map();
    for (const p of products) {
      if (!bySeller.has(p.seller_id)) bySeller.set(p.seller_id, []);
      bySeller.get(p.seller_id).push(p);
    }

    const [[buyer]] = await conn.query(
      "SELECT fullname, phone_num FROM users WHERE id = ?",
      [buyerId],
    );

    const created = [];
    for (const [sellerId, list] of bySeller) {
      const lines = list.map((p) => {
        const unit = +(
          Number(p.price) *
          (1 - (Number(p.discount_percent) || 0) / 100)
        ).toFixed(2);
        return { p, unit, qty: wanted.get(p.id) };
      });
      const subtotal = +lines
        .reduce((s, l) => s + l.unit * l.qty, 0)
        .toFixed(2);
      const code = makeCode();

      const [r] = await conn.query(
        `INSERT INTO orders
          (order_code, buyer_id, seller_id, status, subtotal, shipping_fee, total,
           ship_name, ship_phone, ship_address)
         VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)`,
        [
          code,
          buyerId,
          sellerId,
          subtotal,
          SHIPPING_FEE,
          subtotal + SHIPPING_FEE,
          ship.name || buyer.fullname,
          ship.phone || buyer.phone_num,
          ship.address || null,
        ],
      );

      for (const l of lines) {
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, name, image, price, quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            r.insertId,
            l.p.id,
            l.p.name,
            parseImages(l.p.images)[0] || null,
            l.unit,
            l.qty,
          ],
        );
        await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
          l.qty,
          l.p.id,
        ]);
      }

      // seller: someone ordered
      await notify(
        conn,
        sellerId,
        "New order received",
        `${buyer.fullname} placed order ${code} (${lines.length} item${lines.length > 1 ? "s" : ""}). Review it in your Orders page.`,
      );

      created.push({ id: r.insertId, code });
    }

    // the ordered items leave the saved cart
    await conn.query(
      "DELETE FROM cart_items WHERE user_id = ? AND product_id IN (?)",
      [buyerId, [...wanted.keys()]],
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "Order placed!",
      orders: created,
      categories: [...new Set(products.map((p) => p.category))],
    });
  } catch (err) {
    await conn.rollback();
    return fail(res, err, "Failed to place order.");
  } finally {
    conn.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await loadOrders("WHERE o.buyer_id = ?", [req.user.userId]);
    res.json({ success: true, orders });
  } catch (err) {
    fail(res, err, "Failed to load orders.");
  }
};

// Buyer: Out for Delivery -> Completed. Seller and staff are notified.
export const markReceived = (req, res) =>
  move(res, {
    id: req.params.id,
    ownerCol: "buyer_id",
    ownerId: req.user.userId,
    from: "Out for Delivery",
    to: "Completed",
    stamp: "completed_at",
    message: "Order completed. Thank you!",
    after: async (o) => {
      await notify(
        db,
        o.seller_id,
        "Order completed",
        `${o.buyer_name} received order ${o.order_code}. The order is now completed.`,
      );
      await notifyStaff(
        "Order delivered",
        `The buyer received order ${o.order_code}. The delivery is complete.`,
      );
    },
  });

/* ---------------- SELLER ---------------- */

export const getSellerOrders = async (req, res) => {
  try {
    const orders = await loadOrders("WHERE o.seller_id = ?", [req.user.userId]);
    res.json({ success: true, orders });
  } catch (err) {
    fail(res, err, "Failed to load orders.");
  }
};

// Pending -> Processing
export const acceptOrder = (req, res) =>
  move(res, {
    id: req.params.id,
    ownerCol: "seller_id",
    ownerId: req.user.userId,
    from: "Pending",
    to: "Processing",
    stamp: "accepted_at",
    message: "Order accepted.",
    after: (o) =>
      notify(
        db,
        o.buyer_id,
        "Order is being processed",
        `${o.shop_name} accepted your order ${o.order_code}. It is now being processed.`,
      ),
  });

// Processing -> In Transit
export const sendToTransit = (req, res) =>
  move(res, {
    id: req.params.id,
    ownerCol: "seller_id",
    ownerId: req.user.userId,
    from: "Processing",
    to: "In Transit",
    stamp: "transit_at",
    message: "Order is now in transit.",
    after: (o) =>
      notify(
        db,
        o.buyer_id,
        "Order in transit",
        `Your order ${o.order_code} is on its way to our delivery team.`,
      ),
  });

// Pending -> Cancelled (reason required). Stock goes back to the products.
export const rejectOrder = async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (reason.length < 5)
    return res.status(400).json({
      success: false,
      message: "Please give a reason (at least 5 characters).",
    });
  if (reason.length > 500)
    return res
      .status(400)
      .json({ success: false, message: "Reason is too long (max 500)." });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `UPDATE orders SET status='Cancelled', cancel_reason=?, cancelled_at=NOW()
       WHERE id=? AND seller_id=? AND status='Pending'`,
      [reason, req.params.id, req.user.userId],
    );
    if (!r.affectedRows) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: "Order not found or it is no longer pending.",
      });
    }
    await conn.query(
      `UPDATE products p
       JOIN order_items i ON i.product_id = p.id
       SET p.stock = p.stock + i.quantity
       WHERE i.order_id = ?`,
      [req.params.id],
    );
    const [[order]] = await conn.query(
      "SELECT order_code, buyer_id FROM orders WHERE id = ?",
      [req.params.id],
    );
    await notify(
      conn,
      order.buyer_id,
      "Order cancelled",
      `Your order ${order.order_code} was rejected by the seller. Reason: ${reason}`,
    );
    await conn.commit();
    res.json({ success: true, message: "Order rejected." });
  } catch (err) {
    await conn.rollback();
    fail(res, err, "Failed to reject order.");
  } finally {
    conn.release();
  }
};

/* ---------------- STAFF ---------------- */

export const getStaffOrders = async (req, res) => {
  try {
    const orders = await loadOrders(
      "WHERE o.status IN ('In Transit','Out for Delivery','Completed')",
      [],
      "o.updated_at DESC",
    );
    res.json({ success: true, orders });
  } catch (err) {
    fail(res, err, "Failed to load deliveries.");
  }
};

// In Transit -> Out for Delivery
export const readyToDeliver = (req, res) =>
  move(res, {
    id: req.params.id,
    from: "In Transit",
    to: "Out for Delivery",
    stamp: "out_for_delivery_at",
    message: "Marked as out for delivery.",
    after: (o) =>
      notify(
        db,
        o.buyer_id,
        "Out for delivery",
        `Your order ${o.order_code} is out for delivery. Tap "Order Received" once it arrives.`,
      ),
  });

/* ---------------- ADMIN (view only) ---------------- */

export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const orders =
      status ?
        await loadOrders("WHERE o.status = ?", [status])
      : await loadOrders("");
    res.json({ success: true, orders });
  } catch (err) {
    fail(res, err, "Failed to load orders.");
  }
};

/* ---------------- DETAILS (any allowed role) ---------------- */

export const getOrder = async (req, res) => {
  try {
    const [order] = await loadOrders("WHERE o.id = ?", [req.params.id]);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });

    const { role, userId } = req.user;
    const allowed =
      role === "admin" ||
      order.buyerId === userId ||
      order.sellerId === userId ||
      (role === "staff" &&
        ["In Transit", "Out for Delivery", "Completed"].includes(order.status));

    if (!allowed)
      return res
        .status(403)
        .json({ success: false, message: "Not allowed to view this order." });
    res.json({ success: true, order });
  } catch (err) {
    fail(res, err, "Failed to load order.");
  }
};

/* ---------------- shared status mover ---------------- */

// Moves an order from one status to the next, only if it is currently in `from`
// (and belongs to the caller when ownerCol is given). `after(order)` sends notifications.
async function move(
  res,
  { id, ownerCol, ownerId, from, to, stamp, message, after },
) {
  try {
    const owner = ownerCol ? `AND ${ownerCol} = ?` : "";
    const params = ownerCol ? [to, id, from, ownerId] : [to, id, from];
    const [r] = await db.query(
      `UPDATE orders SET status = ?, ${stamp} = NOW()
       WHERE id = ? AND status = ? ${owner}`,
      params,
    );
    if (!r.affectedRows)
      return res.status(409).json({
        success: false,
        message: `Order not found or it is not "${from}" anymore.`,
      });

    if (after) {
      try {
        const [[order]] = await db.query(
          `SELECT o.order_code, o.buyer_id, o.seller_id,
                  b.fullname AS buyer_name,
                  COALESCE(NULLIF(s.shop_name, ''), s.fullname) AS shop_name
           FROM orders o
           JOIN users b ON b.id = o.buyer_id
           JOIN users s ON s.id = o.seller_id
           WHERE o.id = ?`,
          [id],
        );
        if (order) await after(order);
      } catch (err) {
        console.error("Notification error:", err.message);
      }
    }

    res.json({ success: true, message, status: to });
  } catch (err) {
    fail(res, err, "Failed to update order.");
  }
}
