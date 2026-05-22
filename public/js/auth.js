
/**
 * ไฟล์นี้ทำหน้าที่จัดการ State การเข้าระบบ และดึงข้อมูลจาก Form ส่งไปยัง Backend
 */

const AuthService = {
    // 1. ฟังก์ชันส่งข้อมูลสมัครสมาชิกไปยัง Backend API
    register: async (username, password, email) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });

            // Security: Robust JSON Parsing
            const contentType = response.headers.get("content-type");
            let data = {};
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else if (!response.ok) {
                throw new Error('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง');
            }

            if (!response.ok) {
                throw new Error(data.error || 'การสมัครสมาชิกล้มเหลว');
            }

            alert('สมัครสมาชิกสำเร็จ! กำลังพาท่านไปหน้าเข้าสู่ระบบ');
            return data;
        } catch (error) {
            alert(`[Register Error]: ${error.message}`); // จัดการ Error อย่างนุ่มนวลตามกฎ
            throw error;
        }
    },

    // 2. ฟังก์ชันเข้าสู่ระบบและเก็บ JWT Token
    login: async (username, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            // Security: Robust JSON Parsing
            const contentType = response.headers.get("content-type");
            let data = {};
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else if (!response.ok) {
                throw new Error('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง');
            }

            if (!response.ok) {
                throw new Error(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }

            // ✅ [กฎเหล็ก] บันทึก JWT Token ลงใน localStorage เพื่อทำ Hydration เวลารีเฟรชหน้าเว็บ
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            alert('เข้าสู่ระบบสำเร็จ!');

            // เรียกฟังก์ชันเปลี่ยนหน้าตา UI (ถ้า UX Engineer เขียนเตรียมไว้)
            if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }

            return data;
        } catch (error) {
            alert(`[Login Error]: ${error.message}`);
            throw error;
        }
    },

    // 3. ฟังก์ชันออกจากระบบ (ล้างข้อมูลในเครื่อง)
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('ออกจากระบบเรียบร้อยแล้ว');

        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        }
    },

    // 4. ฟังก์ชันตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่ (ตรวจสอบจาก Token)
    isAuthenticated: () => {
        return localStorage.getItem('token') !== null;
    }
};

// -------------------------------------------------------------------------
// 🔌 ส่วนของการเชื่อมโยงกับฟอร์มบนหน้าเว็บ (DOM Event Listeners)
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    // 💡 Hydration: เช็คตอนโหลดหน้าเว็บว่าล็อกอินอยู่หรือเปล่า
    if (AuthService.isAuthenticated() && typeof updateAuthUI === 'function') {
        updateAuthUI();
    }

    // ดักจับเหตุการณ์ตอนกด Submit ฟอร์ม Login
    const loginForm = document.getElementById('login-form'); // อิงตาม id ที่ UX Engineer ตั้งไว้
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีเฟรชเอง
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // ดึงค่าจาก input (อ่านค่าจากฟอร์มโดยตรงในจังหวะ submit เท่านั้น ไม่ใช่การอ่าน state จาก DOM)
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            
            const usernameVal = usernameInput?.value?.trim();
            const passwordVal = passwordInput?.value;

            // Security: Client-side validation
            if (!usernameVal || !passwordVal) {
                alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
                return;
            }
            
            if (submitBtn) submitBtn.disabled = true; // Security: Prevent double submission (Brute Force / Race Condition)

            try {
                await AuthService.login(usernameVal, passwordVal);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
                if (passwordInput) passwordInput.value = ''; // Security: Clear sensitive data from screen/memory
            }
        });
    }

    // ดักจับเหตุการณ์ตอนกด Submit ฟอร์ม Register
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            const usernameInput = document.getElementById('register-username');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');
            
            const usernameVal = usernameInput?.value?.trim();
            const emailVal = emailInput?.value?.trim();
            const passwordVal = passwordInput?.value;

            // Security: Client-side validation
            if (!usernameVal || !emailVal || !passwordVal) {
                alert('กรุณากรอกข้อมูลสำหรับการสมัครสมาชิกให้ครบทุกช่อง');
                return;
            }
            
            if (submitBtn) submitBtn.disabled = true;

            try {
                await AuthService.register(usernameVal, passwordVal, emailVal);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
                if (passwordInput) passwordInput.value = ''; // Security: Clear sensitive data
            }
        });
    }
});