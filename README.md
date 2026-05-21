# 🏎️ M-Spec by WPF
### ระบบจองคิวปรับจูนรถ (Dyno Test) + ขายอะไหล่หายาก

> A full-stack niche marketplace combining **Dyno Tuning appointment booking** (Capacity Logic) and **Rare Car Parts sales** (Multi-Step Status Logic), built on a professional Controller-Route-Service architecture.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/Security-bcrypt-red?style=flat)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Architectural Best Practices](#-architectural-best-practices)
- [Team Roles](#-team-roles)
- [Git Flow & Commit Rules](#-git-flow--commit-rules)
- [Peer Assessment Rubric](#-peer-assessment-rubric)

---

## ✨ Features

### 🔧 Dyno Tuning Booking System
- Browse available dyno time slots with real-time capacity display
- Book a slot with car details — enforced **max 3 cars per slot** server-side
- Server returns `409 Conflict` when slot is full (Gatekeeper Pattern)
- Booking status tracked: `Pending` → `Confirmed` → `Completed`

### ⚙️ Rare Car Parts Marketplace
- Dynamic product catalog rendered from API — zero hardcoded HTML
- Interactive filtering by keyword, price range, and category
- Add to cart with **localStorage persistence** (survives page refresh)
- Checkout places a real order into the database (payment bypassed)
- Orders move through: `Pending` → `Sourcing` → `In Stock` → `Shipped`
- Full order status history tracked in `OrderStatusHistory` table

### 🔐 Auth System
- User registration & login with **bcrypt salted hashing**
- **JWT stateless identity** — token stored in `localStorage`, sent via `Authorization: Bearer` header
- Protected routes reject requests without a valid token
- Same error message for wrong email vs wrong password (no enumeration)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js 18+, Express.js 4.x |
| Database | SQLite via `better-sqlite3` |
| Authentication | JWT + bcrypt |
| Dev tooling | nodemon, dotenv |

---

## 🏗 Architecture

This project strictly follows the **Controller-Route-Service (SoC)** pattern taught in 960121:

```
HTTP Request
    │
    ▼
src/routes/          ← defines the endpoint, no logic
    │
    ▼
src/controllers/     ← handles req/res, calls service
    │
    ▼
src/services/        ← all business logic lives here
    │
    ▼
src/db/init.js       ← parameterized SQL queries only
```

---

## 📁 Folder Structure

```
M-Spec-By-WPF/
├── public/                       # Frontend (UX & Integration Engineer)
│   ├── index.html                # App shell — zero hardcoded product HTML
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js               # renderParts(), renderSlots(), renderCart() — UI only
│       ├── auth.js               # login/register fetch + JWT localStorage hydration
│       ├── cart.js               # cartState[] — single source of truth + localStorage
│       └── catalog.js            # all fetch() calls to the API
│
├── src/                          # Backend (Lead Architect)
│   ├── routes/
│   │   ├── authRoutes.js         # POST /api/auth/register, /login
│   │   ├── catalogRoutes.js      # GET  /api/parts, /api/slots
│   │   ├── bookingRoutes.js      # POST /api/bookings (protected)
│   │   ├── orderRoutes.js        # POST /api/orders (protected)
│   │   └── adminRoutes.js        # PATCH /api/orders/:id/status
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── catalogController.js
│   │   ├── bookingController.js
│   │   └── orderController.js
│   ├── services/
│   │   ├── authService.js        # bcrypt, JWT sign/verify, registerUser, loginUser
│   │   ├── catalogService.js     # getAllParts(filters), getAllSlots(), getPartById()
│   │   ├── bookingService.js     # checkCapacity() in transaction, createBooking()
│   │   └── orderService.js       # createOrder() ACID transaction, updateOrderStatus()
│   ├── middleware/
│   │   └── authenticate.js       # Bearer token extractor → attaches req.user
│   └── db/
│       ├── init.js               # CREATE TABLE + seed data (runs on startup)
│       └── database.sqlite       # auto-generated, gitignored
│
├── Document/
│   └── uml-get-parts-flow.png    # Activity diagram — GET /api/parts round trip
│
├── .env.example                  # template — copy to .env before running
├── .gitignore                    # excludes .env, node_modules, *.sqlite
├── server.js                     # Express entry point — calls initDb() on startup
├── package.json
└── README.md
```

---

## 🚀 Getting Started

This project is **Zero-Config** — runs on any machine with Node.js 18+.

### 1. Clone the repository

```bash
git clone https://github.com/WindsurfHUB/M-Spec-By-WPF.git
cd M-Spec-By-WPF
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```ini
PORT=3000
JWT_SECRET=your_super_secret_key_change_this_before_deploying
```

> ⚠️ Never commit `.env` to Git. It is already in `.gitignore`.

### 4. Run the server

```bash
# Production mode
npm start

# Development mode (auto-restart on save)
npm run dev
```

The server starts at `http://localhost:3000`.  
On first run, `initDb()` creates all 7 tables and seeds 8 rare parts + 42 dyno slots automatically.

---

## 📡 API Reference

### Auth

| Method | Endpoint | Body | Auth | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ username, email, password }` | — | Register new user |
| POST | `/api/auth/login` | `{ email, password }` | — | Login, returns JWT |

### Catalog

| Method | Endpoint | Query Params | Auth | Description |
|---|---|---|---|---|
| GET | `/api/parts` | `keyword`, `minPrice`, `maxPrice`, `category` | — | Get all parts with filters |
| GET | `/api/parts/:id` | — | — | Get single part |
| GET | `/api/slots` | — | — | Get all available dyno slots |

### Bookings

| Method | Endpoint | Body | Auth | Description |
|---|---|---|---|---|
| POST | `/api/bookings` | `{ slotId, carDetails }` | ✅ JWT | Book a dyno slot |
| GET | `/api/bookings` | — | ✅ JWT | Get current user's bookings |

### Orders

| Method | Endpoint | Body | Auth | Description |
|---|---|---|---|---|
| POST | `/api/orders` | `{ items: [{ partId, quantity }] }` | ✅ JWT | Place an order (payment bypassed) |
| GET | `/api/orders` | — | ✅ JWT | Get current user's order history |
| PATCH | `/api/orders/:id/status` | `{ status }` | ✅ JWT | Update order status (admin) |

---

## 🗄 Database Schema

7 relational tables with full FK constraint enforcement:

```
Users ──────────────┐
                    ├──→ Orders ──→ OrderItems ──→ Parts
                    │         └──→ OrderStatusHistory
                    └──→ Bookings ──→ DynoSlots
```

| Table | Purpose |
|---|---|
| `Users` | Registered accounts — stores `password_hash` only, never plain text |
| `Parts` | Rare car parts catalog with `stock` count |
| `DynoSlots` | Bookable time slots with `max_capacity` and `current_bookings` |
| `Orders` | Order header — links user to a purchase |
| `OrderItems` | Line items — stores `price_at_purchase` (not live price) |
| `OrderStatusHistory` | Full audit trail: `Pending → Sourcing → In Stock → Shipped` |
| `Bookings` | Dyno appointments — enforced capacity check before insert |

---

## 🏛 Architectural Best Practices

This project implements all 10 graded criteria from the 960121 course:

| # | Criteria | Implementation |
|---|---|---|
| 1 | **Version Control** | Conventional Commits (`feat:`, `fix:`, `chore:`) + Git branching (`main` / `dev` / `feature/*`) |
| 2 | **Data Flow** | UI dynamically rendered from API JSON — zero hardcoded product cards in HTML |
| 3 | **Interaction** | Event delegation on `#parts-container` + 400ms debounce on search input |
| 4 | **State** | `cartState[]` as single source of truth — `JSON.stringify` to `localStorage`, `JSON.parse` on load |
| 5 | **Auth Security** | bcrypt salted hashing + JWT stateless identity — same error message for bad email/password |
| 6 | **API Security** | Gatekeeper Pattern — backend re-validates price and capacity, never trusts client |
| 7 | **Persistence** | Relational FK schema + ACID transaction in `orderService.createOrder()` |
| 8 | **SQL Safety** | Parameterized queries (`?` placeholders) throughout — no string concatenation |
| 9 | **Structure** | Strict Route → Controller → Service separation — no business logic in routes |
| 10 | **Deployment** | `.env` for all secrets, `.gitignore` enforced, graceful error handler hides stack traces |

---

## 👥 Team Roles

| Role | Responsibilities | Graded Criteria |
|---|---|---|
| **Lead Architect** (Backend/DevOps) | SQL schema, all services, controllers, routes, middleware, `.env` security, Go-Live audit | 1, 5, 6, 7, 8, 9, 10 |
| **Integration Engineer** (API/State) | `auth.js`, `catalog.js`, `cart.js`, `checkout.js` — fetch logic, JWT storage, cartState | 2, 4 |
| **UX Engineer** (Frontend/Interaction) | `index.html`, `style.css`, `main.js` — render functions, event delegation, debounce | 2, 3 |

---

## 🌿 Git Flow & Commit Rules

### Branch strategy

```
main          ← production-ready, submitted code only
  └── dev     ← team integration branch
        ├── feature/auth
        ├── feature/catalog
        ├── feature/cart
        └── feature/booking
```

Pull Requests go from `feature/*` → `dev`. Only merge `dev` → `main` when fully tested.

### Conventional Commits

Every commit **must** follow this format:

```
<type>: <short description>
```

| Type | When to use |
|---|---|
| `feat:` | New feature (`feat: add booking capacity check`) |
| `fix:` | Bug fix (`fix: resolve JWT expiry error`) |
| `chore:` | Non-code tasks (`chore: update .gitignore`) |
| `docs:` | Documentation only (`docs: add UML activity diagram`) |
| `refactor:` | Code restructure, no behavior change |

---

## 📊 Peer Assessment Rubric

Each team member rates their teammates on a scale of **1–5** in 4 categories (25% each). Comments must cite **specific code or logic contributions**.

| # | Category | Weight | Question | How to prove it |
|---|---|---|---|---|
| 1 | **Logic Contribution** | 25% | Did they contribute to business logic design or SQL Schema? | Commit history, service function signatures, ERD discussions |
| 2 | **Technical Reliability** | 25% | Did their code follow the Gatekeeper and Security patterns? | Parameterized queries, bcrypt usage, JWT middleware, no secrets in code |
| 3 | **Git & Integration** | 25% | Did they commit regularly and help resolve merge conflicts? | Conventional commit history on GitHub — `feat/fix/chore` per task |
| 4 | **Communication** | 25% | Did they participate in Architectural Handwork — maps/logic trees? | UML diagram in `/Document` folder, whiteboard/planning screenshots |

> Peer review form: **https://cmu.to/960121PeerReview**

---

## 📄 License

Academic project — 960121 Systems Thinking & E-commerce
