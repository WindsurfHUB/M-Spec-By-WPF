// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDb } = require('./src/db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── ROUTES (wire in as you build them) ──────────────────────────────────────
app.use('/api/auth', require('./src/routes/authRoutes'));
// app.use('/api/parts', require('./src/routes/catalogRoutes'));
// app.use('/api/slots', require('./src/routes/catalogRoutes'));
// app.use('/api/orders', require('./src/routes/orderRoutes'));
// app.use('/api/bookings',require('./src/routes/bookingRoutes'));
// app.use('/api/admin', require('./src/routes/adminRoutes'));

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
// Catches any error passed via next(err) — hides stack trace from client
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);           // logs for developer
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error' // clean message for client
  });
});

// ─── STARTUP ──────────────────────────────────────────────────────────────────
initDb(); // creates all tables + seeds data on first run

app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});