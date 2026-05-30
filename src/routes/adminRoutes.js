// src/routes/adminRoutes.js
// Route defines entry only — no logic here.
// Controller manages flow. Service handles business logic. (SoC — criteria 9)

const express = require('express');
const router  = express.Router();
const authenticate   = require('../middleware/authenticate');
const adminController = require('../controllers/adminController');

// multer is configured in server.js and passed via req.upload
// We import it here for the image routes
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ─── MULTER SETUP (kept here so server.js stays clean) ───────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `part-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only image files allowed'));
  }
});

// ─── ADMIN KEY GUARD ──────────────────────────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY || 'mspec-admin';
function adminGuard(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// PATCH /api/admin/orders/:id/status — update order status (JWT protected)
router.patch('/orders/:id/status', authenticate, adminController.updateStatus);

// GET /api/admin/parts — list all parts for admin panel (admin key)
router.get('/parts', adminGuard, adminController.getParts);

// POST /api/admin/parts/:id/image — upload part image (admin key)
router.post('/parts/:id/image', adminGuard, upload.single('image'), adminController.uploadImage);

// DELETE /api/admin/parts/:id/image — remove part image (admin key)
router.delete('/parts/:id/image', adminGuard, adminController.deleteImage);

module.exports = router;