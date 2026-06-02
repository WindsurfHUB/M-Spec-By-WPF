# 🏎️ Project Brief: ระบบจองคิวปรับจูนรถ (Dyno Test) + ขายอะไหล่หายาก

## 📝 Project Overview
A niche marketplace combining **Dyno Tuning appointment booking (Capacity Logic — Niche 4)** and **Rare Car Parts sales (Multi-Step Status Logic — Niche 1)**. Built with Node.js/Express backend, vanilla JS frontend, SQLite database, and a full admin panel.

**Stack:** HTML/CSS/JS · Node.js + Express · SQLite (better-sqlite3) · JWT + bcrypt · multer

---

## 📁 Final Folder Structure

```
M-Spec-By-WPF/
├── public/
│   ├── index.html              # Main storefront
│   ├── booking.html            # Dyno slot booking page
│   ├── orders.html             # Order & booking history
│   ├── admin.html              # Admin panel
│   ├── images/                 # Permanent product images
│   ├── uploads/                # Admin-uploaded images
│   ├── css/style.css
│   └── js/
│       ├── main.js             # renderParts, renderSlots, renderCart, debounce
│       ├── auth.js             # JWT login/register/hydration
│       ├── cart.js             # cartState[] single source of truth
│       ├── catalog.js          # all fetch() calls
│       ├── checkout.js         # POST /api/orders
│       ├── booking-page.js     # slot selection modal
│       └── orders-page.js      # merged order+booking history
├── src/
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── partsRoutes.js
│   │   ├── slotsRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── statsRoutes.js      # dynamic stats for UI
│   │   └── adminRoutes.js      # multer + adminGuard + all admin endpoints
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── catalogController.js
│   │   ├── bookingController.js
│   │   ├── orderController.js
│   │   └── adminController.js  # updateStatus, getParts, addPart, updateStock, uploadImage, deleteImage
│   ├── services/
│   │   ├── authService.js
│   │   ├── catalogService.js
│   │   ├── bookingService.js   # checkCapacity() INSIDE transaction (Bonus A)
│   │   └── orderService.js     # ACID transaction (Niche 1)
│   ├── middleware/
│   │   └── authenticate.js
│   └── db/
│       ├── init.js             # 7 tables + seed data with image paths
│       └── database.sqlite     # gitignored
├── Document/
│   ├── Project_Brief.md
│   └── uml_activity_diagram_get_parts.png
├── .env.example
├── .gitignore
├── server.js
├── package.json
└── README.md
```

---

## 🏗️ LEAD ARCHITECT (Backend/DevOps)

### ✅ Phase 1 — Project Setup
- [x] Git repo with `.gitignore` (`.env`, `node_modules`, `*.sqlite`)
- [x] `package.json` with `"start": "nodemon server.js"` and `"dev": "node --watch server.js"`
- [x] `.env.example` with `PORT`, `JWT_SECRET`, `ADMIN_KEY`
- [x] `server.js` with `express.json()`, static files, error handler
- [x] Branch strategy: `main` (production) / `windsurf` (Lead Architect) / `flowill` (Integration Engineer) / `pond` (UX Engineer)

### ✅ Phase 2 — SQL Schema (7 tables)
All tables in `src/db/init.js` with FK constraints and seed data:

```sql
Users(id, username, email, password_hash, created_at)
Parts(id, name, description, category, price, stock, image_url)
DynoSlots(id, slot_date, slot_time, max_capacity, current_bookings)
Orders(id, user_id, total_price, created_at)  → FK Users
OrderItems(id, order_id, part_id, quantity, price_at_purchase)  → FK Orders, Parts
OrderStatusHistory(id, order_id, status CHECK IN('Pending','Sourcing','In Stock','Shipped'), changed_at)  → FK Orders
Bookings(id, user_id, slot_id, car_details, status, created_at)  → FK Users, DynoSlots
```

Seed data: 8 rare car parts with `/images/` paths + 42 dyno slots (14 days × 3 time slots).

### ✅ Phase 3 — Service Layer

**`authService.js`** — bcrypt hash/verify, JWT sign/verify, registerUser (duplicate check), loginUser (same error for bad email/password), getUserById

**`catalogService.js`** — getAllParts(filters: keyword/category/minPrice/maxPrice), getAllSlots(), getPartById()

**`bookingService.js`** — checkCapacity() called INSIDE transaction, createBooking() (atomic: check + INSERT + counter update), getUserBookings(), cancelBooking() (frees slot capacity)

**`orderService.js`** — createOrder() ACID transaction (re-fetches price from DB, stock check, INSERT Orders + OrderItems + StatusHistory), updateOrderStatus() (validates transition order, prevents skipping), getOrderHistory(), getOrderById()

### ✅ Phase 4 — Controllers & Routes (6 route groups, all 3-layer SoC)

| Route | Controller | Service |
|---|---|---|
| authRoutes | authController | authService |
| partsRoutes | catalogController | catalogService |
| slotsRoutes | catalogController | catalogService |
| bookingRoutes | bookingController | bookingService |
| orderRoutes | orderController | orderService |
| adminRoutes | adminController | orderService + direct DB |

### ✅ Phase 5 — Middleware
`authenticate.js` — extracts Bearer token, verifies JWT, attaches `req.user`

### ✅ Phase 6 — Admin Panel Backend
New endpoints in `adminRoutes.js` (protected by `X-Admin-Key`):
- `GET /api/admin/parts` — list all parts
- `POST /api/admin/parts` — add new product
- `PATCH /api/admin/parts/:id/stock` — update stock quantity
- `POST /api/admin/parts/:id/image` — upload image (multer, max 8MB)
- `DELETE /api/admin/parts/:id/image` — remove image

### ✅ Phase 7 — Go-Live Audit
- [x] Zero hardcoded secrets — all in `.env`
- [x] `.env` in `.gitignore`
- [x] `npm install && npm start` works zero-config
- [x] Global error handler hides stack traces — `{ error: "message" }` only
- [x] All SQL uses `?` parameterized queries throughout

---

## 🔌 INTEGRATION ENGINEER (API/State)

### ✅ Phase 6 — Integration & State Management
- [x] Fetch endpoints (`catalog.js`, `statsRoutes.js`) — `GET /api/parts`, `GET /api/slots`, `GET /api/stats`
- [x] Single Source of Truth (`cart.js`) — `cartState` array, `addToCart`, `updateQuantity`, `removeFromCart`
- [x] Hydration & Cleanup (`cart.js`, `auth.js`) — `localStorage.getItem`, clean up stale bookings, login restore
- [x] API Gatekeeper (`checkout.js`, `booking-page.js`) — `POST /api/orders` (parts only), direct `POST /api/bookings` bypassing cart
- [x] Dynamic UI data mapping — Pass JSON to `renderParts`, `renderSlots`, `renderRecommended`, `renderOrdersList`

### Key Rules
- Never calculate prices on frontend — send `partId + quantity`, display what backend returns
- Always include `Authorization: Bearer ${token}` on protected requests
- `cartState` is the ONLY source of truth — never read from DOM

---

## 🎨 UX ENGINEER (Frontend/Interaction)

### Files
- `index.html` — main storefront with catalog, cart sidebar, booking summary
- `booking.html` — dyno slot grid (7-day filter), booking modal with car details
- `orders.html` — merged order + booking history with tab filter
- `admin.html` — admin panel with image upload, add product form, stock table
- `style.css` — full dark theme, responsive layout
- `main.js` — renderParts(), renderSlots() (7-day filter), renderCart(), renderBookingSummary(), event delegation, debounce 400ms, toast notifications
- `booking-page.js` — slot selection, car details modal, booking via API
- `orders-page.js` — fetch orders + bookings, merge + sort, tab UI

### Key Patterns
- Event delegation: ONE listener on `#parts-container` for all `btn-add-to-cart` clicks
- Debounce: 400ms on search input before calling `fetchParts()`
- Zero hardcoded product HTML — all rendered from API data via JavaScript loops

---

## 📊 1-3 Scoring System

| # | Category | Best Practice | Status |
|---|---|---|---|
| 1 | Version Control | Conventional Commits & Git Flow | ✅ |
| 2 | Data Flow | Separation of Content & UI | ✅ |
| 3 | Interaction | Event Delegation & Debouncing | ✅ |
| 4 | State | Single Source of Truth & Continuity | ✅ |
| 5 | Security (Auth) | Architecture of Trust (bcrypt + JWT) | ✅ |
| 6 | Security (API) | Gatekeeper Pattern | ✅ |
| 7 | Persistence | Relational Integrity + ACID | ✅ |
| 8 | SQL Safety | Parameterized Queries | ✅ |
| 9 | Structure | Controller-Route-Service (SoC) | ✅ |
| 10 | Deployment | Zero-Config & .env Audit | ✅ |

### ⭐ Bonus A — Stock-Check Concurrency Logic (3 pts)
`checkCapacity()` runs inside `db.transaction()` in `bookingService.createBooking()`. The capacity check and INSERT are atomic — prevents race conditions on popular slots. Returns `409 Conflict` when full.

---

## 📊 Peer Assessment Rubric

| # | Category | Weight | Question | How to prove it |
|---|---|---|---|---|
| 1 | Logic Contribution | 25% | Contribute to business logic or SQL Schema? | Commit history, service signatures, schema design |
| 2 | Technical Reliability | 25% | Code follows Gatekeeper and Security patterns? | Parameterized queries, bcrypt, JWT middleware, no secrets in code |
| 3 | Git & Integration | 25% | Regular commits, helped with merge conflicts? | Conventional commit log on GitHub |
| 4 | Communication | 25% | Participated in Architectural Handwork? | UML diagram in `/Document`, planning screenshots |

> Peer review form: **https://cmu.to/960121PeerReview**

---

## 🗓️ Actual Timeline (3 Weeks)

| Week | Lead Architect | Integration Engineer | UX Engineer |
|---|---|---|---|
| **Week 1** | DB schema, authService, catalogService, routes | auth.js, catalog.js fetch helpers | index.html, style.css, renderParts |
| **Week 2** | bookingService (capacity tx), orderService (ACID), all routes | cart.js state, checkout.js POST | booking.html, orders.html, event delegation, debounce |
| **Week 3** | adminController (image/stock/addPart), Go-Live audit | End-to-end wiring, bug fixes | admin.html UI, polish, responsive |

---

## 🌿 Git Flow

```
main        ← production-ready, submitted code only
  ├── windsurf   ← Lead Architect (Backend/DevOps)
  ├── flowill    ← Integration Engineer (API/State)
  └── pond       ← UX Engineer (Frontend/Interaction)
```

Conventional Commits: `feat:` / `fix:` / `chore:` / `docs:` / `refactor:`
