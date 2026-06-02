// server.js
require('dotenv').config();
const express = require('express');
const path    = require('path');
const { initDb } = require('./src/db/init');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./src/routes/authRoutes'));
app.use('/api/parts',    require('./src/routes/partsRoutes'));
app.use('/api/slots',    require('./src/routes/slotsRoutes'));
app.use('/api/orders',   require('./src/routes/orderRoutes'));
app.use('/api/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/admin',    require('./src/routes/adminRoutes'));
app.use('/api/stats',    require('./src/routes/statsRoutes'));

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ─── STARTUP ──────────────────────────────────────────────────────────────────
initDb();

app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
  console.log(`[ADMIN]  Panel → http://localhost:${PORT}/admin.html`);
});