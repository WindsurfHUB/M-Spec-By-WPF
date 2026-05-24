// src/routes/bookingRoutes.js
// All booking routes require a valid JWT — authenticate middleware enforces this.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const bookingController = require('../controllers/bookingController');

// POST /api/bookings — create a booking (capacity checked inside transaction)
router.post('/', authenticate, bookingController.create);

// GET /api/bookings — get current user's bookings
router.get('/', authenticate, bookingController.getMyBookings);

// PATCH /api/bookings/:id/cancel — cancel a pending booking
router.patch('/:id/cancel', authenticate, bookingController.cancel);

module.exports = router;