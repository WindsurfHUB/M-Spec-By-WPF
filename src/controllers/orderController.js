// src/controllers/orderController.js
// HTTP layer only — validates input shape, calls orderService, sends response.
// No business logic here. No SQL here.

const {
  createOrder,
  getOrderHistory,
  getOrderById
} = require('../services/orderService');

/**
 * POST /api/orders
 * Protected — requires authenticate middleware
 * Body: { items: [{ partId, quantity }] }
 */
async function create(req, res, next) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const order = createOrder(req.user.id, items);
    return res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders
 * Protected — returns all orders for the logged-in user
 */
async function getMyOrders(req, res, next) {
  try {
    const orders = getOrderHistory(req.user.id);
    return res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 * Protected — returns single order with full status history
 */
async function getOne(req, res, next) {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = getOrderById(orderId, req.user.id);
    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getMyOrders, getOne };