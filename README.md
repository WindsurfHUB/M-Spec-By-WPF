# ระบบจองคิวปรับจูนรถ (Dyno Test) + ขายอะไหล่หายาก

โปรเจกต์จำลองระบบซื้อขายอะไหล่รถยนต์หายาก (Multi-Step Status Logic) ร่วมกับระบบจองคิวเข้าทดสอบแรงม้า/ปรับจูน Dyno Test (Capacity Logic) พัฒนาขึ้นภายใต้มาตรฐานสถาปัตยกรรม Controller-Route-Service

## Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend:** Node.js + Express.js
* **Database:** SQLite3
* **Authentication:** JWT + bcryptjs

---

## โครงสร้างโฟลเดอร์ (Folder Structure)

```text
project/
├── public/                 # ฝั่ง Frontend (UX & Integration)
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── main.js        # UI Rendering & Event Delegation (UX)
│       ├── auth.js        # ระบบยืนยันตัวตนและการเก็บ Token
│       ├── cart.js        # State Management (Single Source of Truth)
│       └── catalog.js     # Fetch API Helpers
├── src/                    # ฝั่ง Backend (Lead Architect)
│   ├── routes/             # API Endpoints Entry
│   ├── controllers/        # Request/Response Flow Controllers
│   ├── services/           # Heavy Business Logic Layer
│   └── db/                 # Database Configuration & Initializer
├── .env.example            # ไฟล์เทมเพลตสำหรับตั้งค่า Environment
├── database.sqlite         # ไฟล์ฐานข้อมูล (จะถูกสร้างขึ้นอัตโนมัติ)
├── server.js               #จุดเริ่มต้นการรันเซิร์ฟเวอร์
└── package.json

```

---

## ขั้นตอนการติดตั้งและรันระบบ (Getting Started)

โปรเจกต์นี้ได้รับการออกแบบตามหลัก **Zero-Config** สามารถเปิดใช้งานบนเครื่องใดก็ได้ตามขั้นตอนดังนี้:

1. **ติดตั้ง Dependencies:**
```bash
npm install

```


2. **ตั้งค่า Environment Variables:**
คัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env` จากนั้นกำหนดค่าภายในไฟล์:
```text
PORT=8888
JWT_SECRET=your_super_secret_key_here

```


3. **เริ่มใช้งานเซิร์ฟเวอร์:**
* สำหรับโหมดใช้งานทั่วไป (Production):
```bash
npm start

```


* สำหรับโหมดพัฒนาซอฟต์แวร์ (Development - Auto Restart):
```bash
npm run dev

```





---

## กฎการร่วมงานระบบ Git (Git Flow & Commit Rules)

### 1. รูปแบบการ Commit (Conventional Commits)

เพื่อความเป็นระเบียบของประวัติ Commit สมาชิกทุกคนต้องตั้งชื่อ Commit ขึ้นต้นด้วยรูปแบบดังนี้เท่านั้น:

* `feat:` สำหรับการเพิ่มฟีเจอร์ใหม่ (เช่น `feat: implement login service`)
* `fix:` สำหรับการแก้ไขบักหรือข้อผิดพลาดในโค้ด (เช่น `fix: resolve token validation error`)
* `chore:` สำหรับงานทั่วไปที่ไม่เกี่ยวกับโค้ดระบบโดยตรง (เช่น `chore: update README.md`)

### 2. การแยก Branch

* `main`: ซอร์สโค้ดหลักที่ผ่านการทดสอบและพร้อมส่งงาน
* `dev`: แหล่งรวมโค้ดสำหรับการพัฒนาของทีม
* `feature/xxx`: แตกแยกย่อยออกไปทำฟีเจอร์เฉพาะตัว (เช่น `feature/auth`, `feature/cart`) แล้วค่อยทำ Pull Request กลับเข้า `dev`

---

## สมาชิกในกลุ่มและบทบาทความรับผิดชอบ

* **Lead Architect (Backend/DevOps):** รับผิดชอบฐานข้อมูล, Service Layer, ความปลอดภัย และระบบหลังบ้านทั้งหมด
* **Integration Engineer (API/State):** รับผิดชอบการเชื่อมต่อ Fetch API, จัดการ JWT, และรักษาสถานะตะกร้าสินค้าใน LocalStorage
* **UX Engineer (Frontend/Interaction):** รับผิดชอบหน้าตาเว็บ UI การเขียนลูปแสดงผล และการจัดการ Event/Debounce ฝั่งหน้าบ้าน

---