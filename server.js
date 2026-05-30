// server.js
require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const { initDb, getDb } = require('./src/db/init');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── UPLOADS FOLDER ───────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── MULTER STORAGE ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `part-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
  }
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// serve uploaded images at /uploads/*
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── IMAGE UPLOAD ROUTE ───────────────────────────────────────────────────────
// POST /api/admin/parts/:id/image
// multipart/form-data  field: "image"
// Simple admin key guard via header X-Admin-Key or query ?adminKey
// Set ADMIN_KEY in .env (default: "mspec-admin")
const ADMIN_KEY = process.env.ADMIN_KEY || 'mspec-admin';

function adminGuard(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.post('/api/admin/parts/:id/image', adminGuard, upload.single('image'), (req, res, next) => {
  try {
    const partId = parseInt(req.params.id);
    if (isNaN(partId)) return res.status(400).json({ error: 'Invalid part ID' });
    if (!req.file)     return res.status(400).json({ error: 'No image uploaded' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const db = getDb();

    // ลบไฟล์เก่าก่อน (ถ้ามี)
    const old = db.prepare('SELECT image_url FROM Parts WHERE id = ?').get(partId);
    if (old?.image_url) {
      const oldPath = path.join(__dirname, 'public', old.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.prepare('UPDATE Parts SET image_url = ? WHERE id = ?').run(imageUrl, partId);
    res.json({ success: true, image_url: imageUrl });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/parts/:id/image — ลบรูปออก
app.delete('/api/admin/parts/:id/image', adminGuard, (req, res, next) => {
  try {
    const partId = parseInt(req.params.id);
    if (isNaN(partId)) return res.status(400).json({ error: 'Invalid part ID' });

    const db  = getDb();
    const row = db.prepare('SELECT image_url FROM Parts WHERE id = ?').get(partId);
    if (row?.image_url) {
      const filePath = path.join(__dirname, 'public', row.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      db.prepare('UPDATE Parts SET image_url = NULL WHERE id = ?').run(partId);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/parts — list ทุก part (for admin panel)
app.get('/api/admin/parts', adminGuard, (req, res, next) => {
  try {
    const db    = getDb();
    const parts = db.prepare('SELECT * FROM Parts ORDER BY id').all();
    res.json({ parts });
  } catch (err) {
    next(err);
  }
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./src/routes/authRoutes'));
app.use('/api/parts',    require('./src/routes/partsRoutes'));
app.use('/api/slots',    require('./src/routes/slotsRoutes'));
app.use('/api/orders',   require('./src/routes/orderRoutes'));
app.use('/api/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/admin',    require('./src/routes/adminRoutes'));

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
  console.log(`[KEY]    Admin key = "${ADMIN_KEY}"`);
});