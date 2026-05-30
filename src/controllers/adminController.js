// src/controllers/adminController.js
// HTTP layer only — no business logic here.
// Calls orderService / direct DB for admin operations.

const path = require('path');
const fs   = require('fs');
const { updateOrderStatus } = require('../services/orderService');
const { getDb } = require('../db/init');

// ─── ORDER STATUS ─────────────────────────────────────────────────────────────
async function updateStatus(req, res, next) {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const result = updateOrderStatus(orderId, status);
    return res.status(200).json({
      message: `Order status updated to "${status}"`,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

// ─── LIST ALL PARTS (admin) ───────────────────────────────────────────────────
function getParts(req, res, next) {
  try {
    const db    = getDb();
    const parts = db.prepare('SELECT * FROM Parts ORDER BY id').all();
    res.json({ parts });
  } catch (err) {
    next(err);
  }
}

// ─── UPLOAD IMAGE ─────────────────────────────────────────────────────────────
function uploadImage(req, res, next) {
  try {
    const partId = parseInt(req.params.id);
    if (isNaN(partId)) return res.status(400).json({ error: 'Invalid part ID' });
    if (!req.file)     return res.status(400).json({ error: 'No image uploaded' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const db = getDb();

    // Delete old file if exists
    const old = db.prepare('SELECT image_url FROM Parts WHERE id = ?').get(partId);
    if (old?.image_url) {
      const oldPath = path.join(__dirname, '../../public', old.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.prepare('UPDATE Parts SET image_url = ? WHERE id = ?').run(imageUrl, partId);
    res.json({ success: true, image_url: imageUrl });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE IMAGE ─────────────────────────────────────────────────────────────
function deleteImage(req, res, next) {
  try {
    const partId = parseInt(req.params.id);
    if (isNaN(partId)) return res.status(400).json({ error: 'Invalid part ID' });

    const db  = getDb();
    const row = db.prepare('SELECT image_url FROM Parts WHERE id = ?').get(partId);
    if (row?.image_url) {
      const filePath = path.join(__dirname, '../../public', row.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      db.prepare('UPDATE Parts SET image_url = NULL WHERE id = ?').run(partId);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateStatus, getParts, uploadImage, deleteImage };