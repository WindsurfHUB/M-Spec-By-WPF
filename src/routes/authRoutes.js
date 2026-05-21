// src/routes/authRoutes.js
// Entry point for all auth endpoints.
// Route → Controller → Service (never skip layers)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;