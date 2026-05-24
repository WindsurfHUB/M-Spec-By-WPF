// src/routes/adminRoutes.js
// Admin-only route for updating order status
// Proves the Niche 1 multi-step status tracking (Pending→Sourcing→In Stock→Shipped)

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { updateOrderStatus } = require('../services/orderService');

/**
 * PATCH /api/admin/orders/:id/status
 * Protected — requires JWT
 * Body: { status: 'Sourcing' | 'In Stock' | 'Shipped' }
 *
 * Validates transition order — can't skip steps.
 * Every change is recorded in OrderStatusHistory.
 */
router.patch('/orders/:id/status', authenticate, (req, res, next) => {
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
});

module.exports = router;