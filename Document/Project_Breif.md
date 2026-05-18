```markdown
# 🏎️ Project Brief: ระบบจองคิวปรับจูนรถ (Dyno Test) + ขายอะไหล่หายาก

## 📝 Project Overview
A niche marketplace combining **Dyno Tuning appointment booking (Capacity Logic)** and **Rare Car Parts sales (Multi-Step Status Logic)**. Built with a Node.js/Express backend, vanilla JS frontend, and SQLite/MySQL database.

* **Stack:** HTML/CSS/JS (Frontend) · Node.js + Express (Backend) · SQLite or MySQL (Database) · JWT + bcrypt (Auth)

---

## 📁 Suggested Folder Structure
```text
project/
├── public/
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── main.js
│       ├── auth.js
│       ├── cart.js
│       └── catalog.js
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── db/
├── .env
├── .gitignore
├── package.json
└── server.js

```

---

## 🏗️ LEAD ARCHITECT — You (Backend/DevOps)

### 🔹 Phase 1 — Project Setup (Day 1–2)

* [x] Init Git repo, set up `.gitignore` (must include `.env`, `node_modules`)
* [x] Create `package.json` with scripts: `"start": "node server.js"`
* [x] Set up `.env` template file (`.env.example` for teammates)

```ini
JWT_SECRET=
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
PORT=3000

```

* [x] Set up `server.js` with `express.json()` middleware
* [x] Establish Git branching rules for team (e.g., `main`, `dev`, `feature` branches)

### 🔹 Phase 2 — SQL Schema Design (Day 2–3)

*Design and create ALL tables. You own this entirely.*

```sql
-- Users
CREATE TABLE Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parts (Rare Car Parts catalog)
CREATE TABLE Parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT
);

-- DynoSlots (Bookable time slots)
CREATE TABLE DynoSlots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 3,
  current_bookings INTEGER DEFAULT 0
);

-- Orders (for Parts purchase)
CREATE TABLE Orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total_price REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- OrderItems
CREATE TABLE OrderItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  part_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES Orders(id),
  FOREIGN KEY (part_id) REFERENCES Parts(id)
);

-- OrderStatusHistory (Multi-step status tracking)
CREATE TABLE OrderStatusHistory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('Pending','Sourcing','In Stock','Shipped')) NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES Orders(id)
);

-- Bookings (Dyno appointments)
CREATE TABLE Bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  slot_id INTEGER NOT NULL,
  car_details TEXT,
  status TEXT DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id),
  FOREIGN KEY (slot_id) REFERENCES DynoSlots(id)
);

```

### 🔹 Phase 3 — Service Layer (Core Week)

*Write all business logic. Export clean functions for controllers to call.*

#### `src/services/authService.js`

```javascript
async function hashPassword(plain) {}      // bcrypt.hash
async function verifyPassword(plain, hash) {} // bcrypt.compare
function generateToken(userId) {}          // jwt.sign
function verifyToken(token) {}             // jwt.verify

```

#### `src/services/bookingService.js`

```javascript
async function checkCapacity(slotId) {}    // returns true/false
async function createBooking(userId, slotId, carDetails) {}
async function getUserBookings(userId) {}

```

#### `src/services/orderService.js`

```javascript
async function createOrder(userId, cartItems) {}  // atomic transaction
async function updateOrderStatus(orderId, newStatus) {} // status history
async function getOrderHistory(userId) {}

```

#### `src/services/catalogService.js`

```javascript
async function getAllParts(filters) {}     // keyword, price, category
async function getAllSlots() {}            // available dyno slots
async function getPartById(id) {}

```

### 🔹 Phase 4 — Controllers & Routes (Core Week)

* `routes/authRoutes.js` ➔ `POST /api/auth/register`, `POST /api/auth/login`
* `routes/catalogRoutes.js` ➔ `GET /api/parts`, `GET /api/slots`
* `routes/orderRoutes.js` ➔ `POST /api/orders`
* `routes/bookingRoutes.js` ➔ `POST /api/bookings`
* `routes/adminRoutes.js` ➔ `PATCH /api/orders/:id/status` (update status)

> **Note:** Each route file calls a controller. Each controller calls a service. No business logic in routes.

### 🔹 Phase 5 — Middleware

#### `src/middleware/authenticate.js`

```javascript
// Verify JWT from Authorization header
// Attach user to req.user

```

### 🔹 Phase 6 — Go-Live Audit (Final 2 Days)

* [ ] Scan ALL files — zero hardcoded secrets
* [ ] Confirm `.env` is in `.gitignore`
* [ ] Test `npm install && npm start` on a clean folder
* [ ] All errors return clean JSON `{ error: "message" }`, no stack traces to client
* [ ] All SQL uses parameterized queries `?` — grep for any string concatenation

---

## 🔌 INTEGRATION ENGINEER Brief (API/State)

*Hand this to your teammate.*

### 🎯 Their Responsibility

They are the bridge between your backend and the UX Engineer's frontend.

### 🛠️ What They Build

#### `public/js/auth.js` — Handle register/login forms

```javascript
// On login success → store JWT in localStorage
localStorage.setItem('token', data.token)
localStorage.setItem('user', JSON.stringify(data.user))

// On page load → check if token exists (Hydration Logic)
function initAuth() {
  const token = localStorage.getItem('token')
  if (token) { showLoggedInUI() }
}

```

#### `public/js/catalog.js` — Fetch and pass data to UX Engineer's render functions

```javascript
// fetch('/api/parts') → call UX's renderParts(data)
// fetch('/api/slots') → call UX's renderSlots(data)
// Must attach JWT to all protected requests:
headers: { 'Authorization': `Bearer ${token}` }

```

#### `public/js/cart.js` — State management

```javascript
// cartState = single source of truth (array)
// On every change → JSON.stringify to localStorage
// On page load → JSON.parse from localStorage (Hydration)
let cartState = JSON.parse(localStorage.getItem('cart')) || []

```

#### `public/js/checkout.js` — POST order to backend

```javascript
// Send cartState to POST /api/orders
// Never calculate final price on frontend
// Display what backend returns as confirmed total

```

### ⚠️ Key Rules for This Role

* Never calculate prices on the frontend — send items to backend, display what comes back
* Always include JWT in headers for protected routes
* Handle all fetch errors gracefully — show user-friendly messages, not undefined
* The `cartState` array is the **ONLY** source of truth — never read from the DOM to get cart data

---

## 🎨 UX ENGINEER Brief (Frontend/Interaction)

*Hand this to your other teammate.*

### 🎯 Their Responsibility

Everything the user sees and touches. No business logic — just rendering and interaction.

### 🛠️ What They Build

#### `public/css/` — Styling for:

* Product/Parts catalog cards
* Dyno booking slot grid
* Login/Register forms
* Cart sidebar or modal
* Order status tracker (show the Pending ➔ Sourcing ➔ In Stock ➔ Shipped pipeline visually)

#### `public/js/main.js` — UI rendering functions that Integration Engineer will call:

```javascript
// Called by catalog.js after fetch
function renderParts(partsArray) {
  // Loop partsArray → create card HTML dynamically
  // NO hardcoded product HTML
}

function renderSlots(slotsArray) {
  // Show available slots, disable full ones
}

function renderCart(cartState) {
  // Re-render entire cart from state array
}

```

#### Event Delegation — ONE listener on parent, not on each card:

```javascript
// ONE listener on the parts container
document.querySelector('#parts-container').addEventListener('click', (e) => {
  if (e.target.matches('.btn-add-to-cart')) {
    const partId = e.target.dataset.id
    // call Integration Engineer's addToCart(partId)
  }
  if (e.target.matches('.btn-book-slot')) {
    const slotId = e.target.dataset.slotId
    // call Integration Engineer's bookSlot(slotId)
  }
})

```

#### Debounce on Search:

```javascript
function debounce(fn, delay = 400) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

searchInput.addEventListener('input', debounce((e) => {
  // call Integration Engineer's fetchParts({ keyword: e.target.value })
}, 400))

```

### ⚠️ Key Rules for This Role

* Never write `fetch()` calls — ask Integration Engineer for the data
* Never write SQL or touch the backend
* All product cards must be generated from a JavaScript loop — zero hardcoded `<div class="card">` for individual products in HTML

---

## 🗓️ Suggested Timeline (4–5 Weeks)

| Week | Lead Architect (You) | Integration Engineer | UX Engineer |
| --- | --- | --- | --- |
| **Week 1** | Setup, Schema, Auth Service | Study API docs, set up fetch helpers | HTML wireframe, CSS layout |
| **Week 2** | Catalog + Booking Services & Routes | Auth flow (login/register/JWT) | Render functions, event delegation |
| **Week 3** | Order Service + Status History | Cart state + localStorage | Search debounce, cart UI |
| **Week 4** | Admin status update route, Go-Live audit prep | Checkout POST integration | Order status visual tracker |
| **Week 5** | Final audit, bug fixes | End-to-end testing | Polish UI, responsive fixes |

---

## ⭐ Bonus Recommendation

Go for **Bonus A (Stock-Check, 3pts)** — it's the most natural fit. When booking a dyno slot, your `bookingService.checkCapacity()` already does this. Just make sure it's inside the transaction before inserting the booking row. That's the proof the grader needs.