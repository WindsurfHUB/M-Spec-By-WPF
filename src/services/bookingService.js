// src/services/bookingService.js
// Lead Architect responsibility — Niche 4 (Capacity Logic) + Bonus A (Stock-Check)
// The checkCapacity() call happens INSIDE the transaction — this is the architectural proof.

const { getDb } = require('../db/init');

/**
 * Check if a slot still has capacity
 * NOTE: This is called INSIDE the transaction in createBooking()
 * — not before it. That's what makes it atomic (Bonus A proof).
 * @param {number} slotId
 * @returns {{ hasCapacity: boolean, slot: object }}
 */
function checkCapacity(slotId) {
  const db = getDb();

  const slot = db
    .prepare('SELECT * FROM DynoSlots WHERE id = ?')
    .get(slotId);

  if (!slot) {
    const err = new Error('Slot not found');
    err.status = 404;
    throw err;
  }

  return {
    hasCapacity: slot.current_bookings < slot.max_capacity,
    slot
  };
}

/**
 * Create a booking for a user on a dyno slot
 * Capacity check + INSERT + slot counter update are ONE atomic transaction.
 * If any step fails — nothing is written. (Bonus A: Concurrency Logic)
 *
 * @param {number} userId
 * @param {number} slotId
 * @param {string} carDetails
 * @returns {{ bookingId: number, slot: object, status: string }}
 */
function createBooking(userId, slotId, carDetails) {
  const db = getDb();

  // Wrap everything in a single transaction — check + insert + update = atomic
  const doBooking = db.transaction(() => {

    // ── STEP 1: Check capacity INSIDE the transaction (Gatekeeper Pattern) ──
    const { hasCapacity, slot } = checkCapacity(slotId);

    if (!hasCapacity) {
      const err = new Error(`Slot is fully booked (max ${slot.max_capacity} cars)`);
      err.status = 409; // 409 Conflict — as required by Niche 4 spec
      throw err;
    }

    // ── STEP 2: Insert the booking ────────────────────────────────────────────
    const result = db
      .prepare(`
        INSERT INTO Bookings (user_id, slot_id, car_details, status)
        VALUES (?, ?, ?, 'Pending')
      `)
      .run(userId, slotId, carDetails || null);

    // ── STEP 3: Increment current_bookings on the slot ────────────────────────
    db.prepare(`
      UPDATE DynoSlots
      SET current_bookings = current_bookings + 1
      WHERE id = ?
    `).run(slotId);

    return {
      bookingId: result.lastInsertRowid,
      slotDate: slot.slot_date,
      slotTime: slot.slot_time,
      status: 'Pending'
    };
  });

  // Execute — if anything throws inside, the whole transaction rolls back
  return doBooking();
}

/**
 * Get all bookings for a specific user
 * Joins with DynoSlots to return slot date/time alongside booking info
 * @param {number} userId
 * @returns {Array}
 */
function getUserBookings(userId) {
  const db = getDb();

  return db.prepare(`
    SELECT
      b.id          AS bookingId,
      b.car_details,
      b.status,
      b.created_at,
      s.slot_date,
      s.slot_time,
      s.max_capacity,
      s.current_bookings
    FROM Bookings b
    JOIN DynoSlots s ON b.slot_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(userId);
}

/**
 * Cancel a booking — only the owner can cancel, only if still Pending
 * @param {number} bookingId
 * @param {number} userId
 */
function cancelBooking(bookingId, userId) {
  const db = getDb();

  const doCancel = db.transaction(() => {
    const booking = db
      .prepare('SELECT * FROM Bookings WHERE id = ? AND user_id = ?')
      .get(bookingId, userId);

    if (!booking) {
      const err = new Error('Booking not found or not yours');
      err.status = 404;
      throw err;
    }

    if (booking.status !== 'Pending') {
      const err = new Error('Only Pending bookings can be cancelled');
      err.status = 400;
      throw err;
    }

    // Update booking status
    db.prepare(`
      UPDATE Bookings SET status = 'Cancelled' WHERE id = ?
    `).run(bookingId);

    // Free up the slot capacity
    db.prepare(`
      UPDATE DynoSlots
      SET current_bookings = current_bookings - 1
      WHERE id = ?
    `).run(booking.slot_id);
  });

  doCancel();
}

module.exports = {
  checkCapacity,
  createBooking,
  getUserBookings,
  cancelBooking
};