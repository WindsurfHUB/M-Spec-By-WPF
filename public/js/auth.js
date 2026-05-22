/**
 * ไฟล์นี้ทำหน้าที่จัดการ State การเข้าระบบ ดึงข้อมูลจาก DOM และเชื่อมต่อกับ Backend API
 * รับผิดชอบโดย: Integration Engineer (API/State)
 */

const AuthService = {
    // 1. ฟังก์ชันส่งข้อมูลสมัครสมาชิกไปยัง Backend API
    register: async (username, email, password) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
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

            alert('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบและเตรียมบัญชีของท่าน');
            
            // ✅ ทำการบันทึกข้อมูลเพื่อเข้าระบบทันที (Auto-Login หลังจากลงทะเบียน)
            localStorage.setItem('token', data.token);
            if (data.id && data.username && data.email) {
                const userObj = { id: data.id, username: data.username, email: data.email };
                localStorage.setItem('user', JSON.stringify(userObj));
            }

            if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    // 2. ฟังก์ชันเข้าสู่ระบบและเก็บ JWT Token
    login: async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
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
                throw new Error(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            }

            // ✅ [กฎเหล็ก] บันทึกข้อมูลที่แบนราบกลับมาให้อยู่ในโครงสร้าง user ออบเจกต์เพื่อใช้ทำ Hydration
            localStorage.setItem('token', data.token);
            if (data.id && data.username && data.email) {
                const userObj = { id: data.id, username: data.username, email: data.email };
                localStorage.setItem('user', JSON.stringify(userObj));
            }

            if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }

            return data;
        } catch (error) {
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
// 🔌 การจัดการ UI และ DOM Event Listeners
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById('auth-modal');
    const openLoginBtn = document.getElementById('btn-login');
    const openRegisterBtn = document.getElementById('btn-register');
    const closeModalBtn = document.getElementById('btn-close-modal');

    // ─── ERROR HANDLING HELPERS ──────────────────────────────────────────────
    const showLoginError = (msg) => {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    };

    const showRegisterError = (msg) => {
        const errorEl = document.getElementById('reg-error');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    };

    const clearErrors = () => {
        const loginErr = document.getElementById('login-error');
        const regErr = document.getElementById('reg-error');
        if (loginErr) loginErr.classList.add('hidden');
        if (regErr) regErr.classList.add('hidden');
    };

    // ─── MODAL CONTROLLERS ───────────────────────────────────────────────────
    const openModal = (tabName) => {
        if (modal) {
            modal.removeAttribute('aria-hidden');
            
            // สลับ Tab ให้สอดคล้องกัน
            const tabToActivate = document.querySelector(`.modal-tab[data-tab="${tabName}"]`);
            if (tabToActivate) {
                // จำลองการกดคลิกที่ Tab
                tabs.forEach(t => t.classList.remove('active'));
                tabToActivate.classList.add('active');

                if (tabName === 'login') {
                    document.getElementById('tab-login').classList.remove('hidden');
                    document.getElementById('tab-register').classList.add('hidden');
                } else {
                    document.getElementById('tab-login').classList.add('hidden');
                    document.getElementById('tab-register').classList.remove('hidden');
                }
            }
        }
    };

    const closeModal = () => {
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            clearErrors();
        }
    };

    // ─── TAB SWITCHING ───────────────────────────────────────────────────────
    const tabs = document.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetTab = tab.getAttribute('data-tab');
            clearErrors();
            if (targetTab === 'login') {
                document.getElementById('tab-login').classList.remove('hidden');
                document.getElementById('tab-register').classList.add('hidden');
            } else {
                document.getElementById('tab-login').classList.add('hidden');
                document.getElementById('tab-register').classList.remove('hidden');
            }
        });
    });

    // ─── NAVBAR BUTTON BINDINGS ──────────────────────────────────────────────
    if (openLoginBtn) openLoginBtn.addEventListener('click', () => openModal('login'));
    if (openRegisterBtn) openRegisterBtn.addEventListener('click', () => openModal('register'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    // ปิดเมื่อคลิก Overlay พื้นหลังสีดำ
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // ─── AUTHENTICATION UI UPDATE (HYDRATION) ──────────────────────────────────
    window.updateAuthUI = function() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        
        if (token && userStr) {
            const user = JSON.parse(userStr);
            
            // ซ่อนปุ่มเข้าสู่ระบบดั้งเดิม
            if (btnLogin) {
                btnLogin.style.display = 'none';
            }
            
            // เปลี่ยนปุ่มลงทะเบียนเป็นปุ่ม LOGOUT เพื่อความง่ายในการจัดการสิทธิ์
            if (btnRegister) {
                btnRegister.textContent = `LOGOUT (${user.username})`;
                btnRegister.className = 'btn-outline';
                
                // Clone เพื่อเคลียร์ Event listener เก่าออก
                const newBtn = btnRegister.cloneNode(true);
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    AuthService.logout();
                });
                btnRegister.parentNode.replaceChild(newBtn, btnRegister);
            }
        } else {
            // แสดงสถานะที่ยังไม่ได้เข้าสู่ระบบ
            if (btnLogin) {
                btnLogin.style.display = 'inline-block';
                btnLogin.textContent = 'LOGIN';
                
                // Clone เพื่อป้องการซ้ำซ้อนของ listener
                const newBtn = btnLogin.cloneNode(true);
                newBtn.addEventListener('click', () => openModal('login'));
                btnLogin.parentNode.replaceChild(newBtn, btnLogin);
            }
            if (btnRegister) {
                btnRegister.textContent = 'REGISTER';
                btnRegister.className = 'btn-primary';
                
                const newBtn = btnRegister.cloneNode(true);
                newBtn.addEventListener('click', () => openModal('register'));
                btnRegister.parentNode.replaceChild(newBtn, btnRegister);
            }
        }
    };

    // 💡 Hydration ตอนโหลดหน้าเว็บครั้งแรกเพื่อสอดประสาน State ปัจจุบัน
    updateAuthUI();

    // ─── FORM SUBMISSIONS (CLICK EVENT BINDINGS) ────────────────────────────
    const loginSubmitBtn = document.getElementById('btn-login-submit');
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            clearErrors();

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');

            const emailVal = emailInput?.value?.trim();
            const passwordVal = passwordInput?.value;

            // Security: Client-side Validation
            if (!emailVal || !passwordVal) {
                showLoginError('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
                return;
            }

            // Security: ป้องกัน Double Click / Race Conditions
            loginSubmitBtn.disabled = true;

            try {
                await AuthService.login(emailVal, passwordVal);
                closeModal();
            } catch (err) {
                showLoginError(err.message);
            } finally {
                loginSubmitBtn.disabled = false;
                if (passwordInput) passwordInput.value = ''; // Security: ล้างรหัสผ่านออกจากหน้าจอทันที
            }
        });
    }

    const regSubmitBtn = document.getElementById('btn-register-submit');
    if (regSubmitBtn) {
        regSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            clearErrors();

            const nameInput = document.getElementById('reg-name');
            const emailInput = document.getElementById('reg-email');
            const passwordInput = document.getElementById('reg-password');

            const nameVal = nameInput?.value?.trim();
            const emailVal = emailInput?.value?.trim();
            const passwordVal = passwordInput?.value;

            // Client-side Validation
            if (!nameVal || !emailVal || !passwordVal) {
                showRegisterError('กรุณากรอกข้อมูลสำหรับการสมัครสมาชิกให้ครบทุกช่อง');
                return;
            }

            if (passwordVal.length < 6) {
                showRegisterError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
                return;
            }

            regSubmitBtn.disabled = true;

            try {
                // แมป Full Name (nameVal) ไปยังฟิลด์ username สำหรับ Backend
                await AuthService.register(nameVal, emailVal, passwordVal);
                closeModal();
            } catch (err) {
                showRegisterError(err.message);
            } finally {
                regSubmitBtn.disabled = false;
                if (passwordInput) passwordInput.value = '';
            }
        });
    }
});

// ส่งออก AuthService สำหรับการใช้งานของหน้าเว็บหรือไฟล์ JS ตัวอื่น (เช่น cart, checkout)
window.AuthService = AuthService;