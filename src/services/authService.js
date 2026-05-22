// src/services/authService.js
// Lead Architect responsibility — all auth business logic lives here.
// Controllers call these functions. No Express req/res in this file.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/init');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '7d';

// ─── PASSWORD ────────────────────────────────────────────────────────────────

/**
 * Hash a plain-text password
 * @param {string} plain
 * @returns {Promise<string>} hashed password
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare plain password against stored hash
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

/**
 * Sign a JWT token for a given user id
 * @param {number} userId
 * @returns {string} signed JWT
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {{ userId: number }} decoded payload
 * @throws if token is invalid or expired
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ─── USER CRUD ────────────────────────────────────────────────────────────────

/**
 * Register a new user
 * Checks for duplicate username/email before inserting
 * @param {string} username
 * @param {string} email
 * @param {string} plainPassword
 * @returns {{ id: number, username: string, email: string, token: string }}
 */
async function registerUser(username, email, plainPassword) {
  const db = getDb();

  // Check duplicate username
  const existingUsername = db
    .prepare('SELECT id FROM Users WHERE username = ?')
    .get(username);
  if (existingUsername) {
    const err = new Error('Username already taken');
    err.status = 409;
    throw err;
  }

  // Check duplicate email
  const existingEmail = db
    .prepare('SELECT id FROM Users WHERE email = ?')
    .get(email);
  if (existingEmail) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  // Validate input
  if (!username || !email || !plainPassword) {
    const err = new Error('Username, email and password are required');
    err.status = 400;
    throw err;
  }

  if (plainPassword.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }

  const password_hash = await hashPassword(plainPassword);

  const result = db
    .prepare('INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, password_hash);

  const userId = result.lastInsertRowid;
  const token = generateToken(userId);

  return { id: userId, username, email, token };
}

/**
 * Login an existing user
 * @param {string} email
 * @param {string} plainPassword
 * @returns {{ id: number, username: string, email: string, token: string }}
 */
async function loginUser(email, plainPassword) {
  const db = getDb();

  const user = db
    .prepare('SELECT * FROM Users WHERE email = ?')
    .get(email);

  // Same error message for both "not found" and "wrong password"
  // — never tell the client which one is wrong (security)
  const authError = new Error('Invalid email or password');
  authError.status = 401;

  if (!user) throw authError;

  const passwordMatch = await verifyPassword(plainPassword, user.password_hash);
  if (!passwordMatch) throw authError;

  const token = generateToken(user.id);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    token
  };
}

/**
 * Get a user by ID (used by auth middleware)
 * @param {number} userId
 * @returns {{ id, username, email, created_at } | undefined}
 */
function getUserById(userId) {
  const db = getDb();
  return db
    .prepare('SELECT id, username, email, created_at FROM Users WHERE id = ?')
    .get(userId);
  // NOTE: never SELECT * here — password_hash must never leave the service layer
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserById
};