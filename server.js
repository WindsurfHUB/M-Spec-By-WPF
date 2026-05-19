require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 888;

// Middleware สำหรับจัดการข้อมููลรูปแบบ JSON (Body Parsing)
app.use(express.json());

// เสิร์ฟไฟล์ Static ของฝั่ง Frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// สแตนด์บาย Route พื้นฐานสำหรับทดสอบระบบ
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", message: "Server is running smoothly" });
});

// เริ่มต้นเปิดเซิร์ฟเวอร์ตาม Port ที่กำหนดไว้ใน .env
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});