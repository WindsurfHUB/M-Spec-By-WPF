// src/routes/adminRoutes.js
const express = require('express');
const router  = express.Router();
const authenticate    = require('../middleware/authenticate');
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ─── MULTER SETUP ─────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `part-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    allowed.includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true) : cb(new Error('Only image files allowed'));
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
// Order status (JWT)
router.patch('/orders/:id/status', authenticate, adminController.updateStatus);

// Parts management (admin key)
router.get('/parts',                adminGuard, adminController.getParts);
router.post('/parts',               adminGuard, adminController.addPart);
router.patch('/parts/:id/stock',    adminGuard, adminController.updateStock);
router.post('/parts/:id/image',     adminGuard, upload.single('image'), adminController.uploadImage);
router.delete('/parts/:id/image',   adminGuard, adminController.deleteImage);
router.delete('/parts/:id',         adminGuard, adminController.deletePart);

module.exports = router;