// src/routes/adminRoutes.js
// Route defines the entry only — no logic here.
// Controller manages flow. Service handles business logic.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const adminController = require('../controllers/adminController');

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', authenticate, adminController.updateStatus);

module.exports = router;