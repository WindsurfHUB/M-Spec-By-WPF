// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const orderController = require('../controllers/orderController');

// POST /api/orders — place an order (payment bypassed)
router.post('/', authenticate, orderController.create);

// GET /api/orders — get current user's order history
router.get('/', authenticate, orderController.getMyOrders);

// GET /api/orders/:id — get single order with status history
router.get('/:id', authenticate, orderController.getOne);

module.exports = router;