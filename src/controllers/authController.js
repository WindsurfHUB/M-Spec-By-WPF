// src/controllers/authController.js
// Handles HTTP layer only — validates input shape, calls service, sends response.
// No business logic here. No SQL here.

const { registerUser, loginUser } = require('../services/authService');

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Basic shape check — authService does deeper validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    const result = await registerUser(username, email, password);
    return res.status(201).json(result);
  } catch (err) {
    next(err); // passes to global error handler in server.js
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };