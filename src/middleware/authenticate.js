// src/middleware/authenticate.js
// Plugs into any route that requires a logged-in user.
// Usage: router.post('/bookings', authenticate, bookingController.create)

const { verifyToken, getUserById } = require('../services/authService');

async function authenticate(req, res, next) {
  try {
    // Expect: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);           // throws if invalid/expired

    const user = getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;                              // attach to request for controllers
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticate;