// src/controllers/bookingController.js
// HTTP layer only — validates input shape, calls bookingService, sends response.
// No business logic here. No SQL here.

const {
  createBooking,
  getUserBookings,
  cancelBooking
} = require('../services/bookingService');

/**
 * POST /api/bookings
 * Protected — requires authenticate middleware (req.user is set)
 */
async function create(req, res, next) {
  try {
    const { slotId, carDetails } = req.body;

    if (!slotId) {
      return res.status(400).json({ error: 'slotId is required' });
    }

    const booking = createBooking(req.user.id, slotId, carDetails);
    return res.status(201).json({ message: 'Booking confirmed', booking });
  } catch (err) {
    next(err); // 409 from bookingService goes straight to global error handler
  }
}

/**
 * GET /api/bookings
 * Protected — returns all bookings for the logged-in user
 */
async function getMyBookings(req, res, next) {
  try {
    const bookings = getUserBookings(req.user.id);
    return res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/bookings/:id/cancel
 * Protected — cancel a Pending booking (owner only)
 */
async function cancel(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    cancelBooking(bookingId, req.user.id);
    return res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getMyBookings, cancel };