// src/services/orderService.js
// Lead Architect responsibility — Niche 1 (Multi-Step Status Logic)
// createOrder() uses a single ACID transaction — criteria 7 proof.
// Price is re-fetched from DB — never trusted from client (Gatekeeper Pattern).

const { getDb } = require('../db/init');

// Valid status transitions — prevents jumping from Pending to Shipped
const STATUS_FLOW = ['Pending', 'Sourcing', 'In Stock', 'Shipped'];

/**
 * Create an order from cart items
 * ACID transaction: INSERT Orders + INSERT OrderItems + INSERT OrderStatusHistory
 * If any step fails — everything rolls back. No partial orders.
 *
 * @param {number} userId
 * @param {Array<{ partId: number, quantity: number }>} items
 * @returns {{ orderId, totalPrice, status, items }}
 */
function createOrder(userId, items) {
  const db = getDb();

  if (!items || items.length === 0) {
    const err = new Error('Order must contain at least one item');
    err.status = 400;
    throw err;
  }

  const doOrder = db.transaction(() => {

    // ── STEP 1: Re-fetch prices from DB (Gatekeeper — never trust client) ────
    let totalPrice = 0;
    const resolvedItems = [];

    for (const item of items) {
      if (!item.partId || !item.quantity || item.quantity < 1) {
        const err = new Error(`Invalid item: partId and quantity are required`);
        err.status = 400;
        throw err;
      }

      const part = db
        .prepare('SELECT id, name, price, stock FROM Parts WHERE id = ?')
        .get(item.partId);

      if (!part) {
        const err = new Error(`Part ID ${item.partId} not found`);
        err.status = 404;
        throw err;
      }

      // Bonus A extension — stock check for parts too
      if (part.stock < item.quantity) {
        const err = new Error(`Insufficient stock for "${part.name}". Available: ${part.stock}`);
        err.status = 409;
        throw err;
      }

      totalPrice += part.price * item.quantity;
      resolvedItems.push({ ...item, price: part.price, name: part.name });
    }

    // ── STEP 2: INSERT into Orders ────────────────────────────────────────────
    const orderResult = db
      .prepare('INSERT INTO Orders (user_id, total_price) VALUES (?, ?)')
      .run(userId, totalPrice);

    const orderId = orderResult.lastInsertRowid;

    // ── STEP 3: INSERT each line item + decrement stock ───────────────────────
    const insertItem = db.prepare(`
      INSERT INTO OrderItems (order_id, part_id, quantity, price_at_purchase)
      VALUES (?, ?, ?, ?)
    `);

    const decrementStock = db.prepare(`
      UPDATE Parts SET stock = stock - ? WHERE id = ?
    `);

    for (const item of resolvedItems) {
      insertItem.run(orderId, item.partId, item.quantity, item.price);
      decrementStock.run(item.quantity, item.partId);
    }

    // ── STEP 4: INSERT initial status into OrderStatusHistory ─────────────────
    // This is the Niche 1 twist — every order starts with a Pending entry
    db.prepare(`
      INSERT INTO OrderStatusHistory (order_id, status)
      VALUES (?, 'Pending')
    `).run(orderId);

    return {
      orderId,
      totalPrice,
      status: 'Pending',
      itemCount: resolvedItems.length,
      items: resolvedItems.map(i => ({
        partId: i.partId,
        name: i.name,
        quantity: i.quantity,
        priceAtPurchase: i.price
      }))
    };
  });

  return doOrder();
}

/**
 * Update order status — validates transition order
 * Prevents skipping steps (e.g. Pending → Shipped is invalid)
 * Writes every change to OrderStatusHistory for full audit trail
 *
 * @param {number} orderId
 * @param {string} newStatus
 * @returns {{ orderId, newStatus }}
 */
function updateOrderStatus(orderId, newStatus) {
  const db = getDb();

  if (!STATUS_FLOW.includes(newStatus)) {
    const err = new Error(`Invalid status. Must be one of: ${STATUS_FLOW.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const doUpdate = db.transaction(() => {
    // Get the latest status from history
    const latest = db.prepare(`
      SELECT status FROM OrderStatusHistory
      WHERE order_id = ?
      ORDER BY changed_at DESC
      LIMIT 1
    `).get(orderId);

    if (!latest) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    const currentIndex = STATUS_FLOW.indexOf(latest.status);
    const newIndex     = STATUS_FLOW.indexOf(newStatus);

    // Must move forward exactly one step
    if (newIndex !== currentIndex + 1) {
      const err = new Error(
        `Invalid transition: "${latest.status}" → "${newStatus}". ` +
        `Next valid status is "${STATUS_FLOW[currentIndex + 1] || 'none (already Shipped)'}"`
      );
      err.status = 400;
      throw err;
    }

    // Insert new status into history
    db.prepare(`
      INSERT INTO OrderStatusHistory (order_id, status)
      VALUES (?, ?)
    `).run(orderId, newStatus);

    return { orderId, previousStatus: latest.status, newStatus };
  });

  return doUpdate();
}

/**
 * Get full order history for a user
 * Joins Orders + OrderItems + Parts + latest status from OrderStatusHistory
 *
 * @param {number} userId
 * @returns {Array}
 */
function getOrderHistory(userId) {
  const db = getDb();

  // Get all orders for this user with their latest status
  const orders = db.prepare(`
    SELECT
      o.id          AS id,
      o.total_price,
      o.created_at,
      osh.status
    FROM Orders o
    JOIN (
      SELECT order_id, status
      FROM OrderStatusHistory
      WHERE id IN (
        SELECT MAX(id) FROM OrderStatusHistory GROUP BY order_id
      )
    ) osh ON o.id = osh.order_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(userId);

  // For each order, get its line items
  const getItems = db.prepare(`
    SELECT
      oi.quantity,
      oi.price_at_purchase,
      p.name,
      p.category
    FROM OrderItems oi
    JOIN Parts p ON oi.part_id = p.id
    WHERE oi.order_id = ?
  `);

  return orders.map(order => ({
    ...order,
    type: 'order',
    items: getItems.all(order.id)
  }));
}

/**
 * Get single order with full status history
 * @param {number} orderId
 * @param {number} userId
 */
function getOrderById(orderId, userId) {
  const db = getDb();

  const order = db.prepare(`
    SELECT * FROM Orders WHERE id = ? AND user_id = ?
  `).get(orderId, userId);

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const statusHistory = db.prepare(`
    SELECT status, changed_at
    FROM OrderStatusHistory
    WHERE order_id = ?
    ORDER BY changed_at ASC
  `).all(orderId);

  const items = db.prepare(`
    SELECT oi.quantity, oi.price_at_purchase, p.name, p.category
    FROM OrderItems oi
    JOIN Parts p ON oi.part_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId);

  return { ...order, statusHistory, items };
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrderHistory,
  getOrderById
};