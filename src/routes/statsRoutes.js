// src/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');

// GET /api/stats
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    
    // Count total bookings
    const bookingsCount = db.prepare('SELECT COUNT(*) as count FROM Bookings').get().count;
    
    // Count total parts
    const partsCount = db.prepare('SELECT COUNT(*) as count FROM Parts').get().count;
    
    res.json({
      dynoSessions: bookingsCount,
      rareParts: partsCount
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
