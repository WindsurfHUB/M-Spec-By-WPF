// src/db/init.js
// Lead Architect responsibility — runs once to create all tables and seed test data.
// Called automatically from server.js on startup.

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '/database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');   // better concurrency
    db.pragma('foreign_keys = ON');    // enforce FK constraints
  }
  return db;
}

function initDb() {
  const db = getDb();

  // ─── 1. USERS ─────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ─── 2. PARTS (Rare Car Parts catalog) ────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS Parts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      category    TEXT,
      price       REAL    NOT NULL,
      stock       INTEGER DEFAULT 0,
      image_url   TEXT
    );
  `);

  // ─── 3. DYNO SLOTS (Bookable time slots) ──────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS DynoSlots (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_date        DATE    NOT NULL,
      slot_time        TEXT    NOT NULL,
      max_capacity     INTEGER DEFAULT 3,
      current_bookings INTEGER DEFAULT 0
    );
  `);

  // ─── 4. ORDERS (Parts purchase header) ───────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS Orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      total_price REAL    NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id)
    );
  `);

  // ─── 5. ORDER ITEMS (Parts purchase line items) ───────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS OrderItems (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id          INTEGER NOT NULL,
      part_id           INTEGER NOT NULL,
      quantity          INTEGER NOT NULL,
      price_at_purchase REAL    NOT NULL,
      FOREIGN KEY (order_id) REFERENCES Orders(id),
      FOREIGN KEY (part_id)  REFERENCES Parts(id)
    );
  `);

  // ─── 6. ORDER STATUS HISTORY (Multi-step status — Niche 1 twist) ──────────
  // Allowed transitions: Pending → Sourcing → In Stock → Shipped
  db.exec(`
    CREATE TABLE IF NOT EXISTS OrderStatusHistory (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL,
      status     TEXT    NOT NULL CHECK(status IN ('Pending','Sourcing','In Stock','Shipped')),
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES Orders(id)
    );
  `);

  // ─── 7. BOOKINGS (Dyno appointments — Niche 4 capacity twist) ─────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS Bookings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      slot_id     INTEGER NOT NULL,
      car_details TEXT,
      status      TEXT DEFAULT 'Pending',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id),
      FOREIGN KEY (slot_id) REFERENCES DynoSlots(id)
    );
  `);

  console.log('[DB] All tables created (or already exist).');

  // ─── SEED DATA ─────────────────────────────────────────────────────────────
  // Only inserts if tables are empty — safe to call on every startup.
  _seedParts(db);
  _seedDynoSlots(db);

  console.log('[DB] Seed data ready.');
}

// ─── SEED: PARTS ─────────────────────────────────────────────────────────────
function _seedParts(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM Parts').get().c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO Parts (name, description, category, price, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const parts = [
    ['Garrett GTX3071R Turbo',    'Ball-bearing turbocharger, up to 500whp',   'Turbo',      45000, 2,  null],
    ['HKS SSQV Blow-off Valve',   'Trademark whoosh sound, direct bolt-on',    'Turbo',       3200, 5,  null],
    ['AEM 340lph Fuel Pump',      'High-flow in-tank pump for boosted builds', 'Fuel System', 2800, 3,  null],
    ['Link G4X ECU',              'Standalone engine management system',        'ECU',        28000, 1,  null],
    ['Cusco Rear Strut Bar',      'Bolt-on rear chassis brace',                'Suspension',  4500, 4,  null],
    ['Project Mu HC800 Brake Pads','High-carbon compound, track-spec',         'Brakes',      3800, 6,  null],
    ['Mishimoto Intercooler Kit', 'Full-face intercooler + pipe kit',           'Turbo',      18000, 2,  null],
    ['Tomei Expreme Ti Exhaust',  'Titanium catback, -4kg vs stock',            'Exhaust',    35000, 1,  null],
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(...row);
  });

  insertMany(parts);
  console.log('[DB] Seeded 8 rare parts.');
}

// ─── SEED: DYNO SLOTS ────────────────────────────────────────────────────────
function _seedDynoSlots(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM DynoSlots').get().c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO DynoSlots (slot_date, slot_time, max_capacity, current_bookings)
    VALUES (?, ?, ?, ?)
  `);

  // Generate slots for the next 14 days — 3 time slots per day
  const times = ['09:00', '13:00', '16:00'];
  const insertMany = db.transaction(() => {
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      for (const t of times) {
        insert.run(dateStr, t, 3, 0);
      }
    }
  });

  insertMany();
  console.log('[DB] Seeded 42 dyno slots (14 days × 3 slots).');
}

module.exports = { initDb, getDb };