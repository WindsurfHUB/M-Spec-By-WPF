// src/controllers/adminController.js
// HTTP layer only — no business logic here.
// Calls orderService.updateOrderStatus() — service handles all validation.

const { updateOrderStatus } = require('../services/orderService');

async function updateStatus(req, res, next) {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const result = updateOrderStatus(orderId, status);
    return res.status(200).json({
      message: `Order status updated to "${status}"`,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateStatus };