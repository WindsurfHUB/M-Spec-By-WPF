// public/js/cart.js



// 🌟 1. Hydration Logic: ดึงข้อมูลตะกร้าเก่าจาก localStorage ทันทีที่โหลดไฟล์
let cartState = JSON.parse(localStorage.getItem('cart')) || [];

// Clean up old 'booking' items that were stuck in the cart before the refactor
const originalLength = cartState.length;
cartState = cartState.filter(item => item.type !== 'booking' && !(item.name && item.name.includes('Dyno Session')));
if (cartState.length !== originalLength) {
    localStorage.setItem('cart', JSON.stringify(cartState));
}

const CartService = {
    // 2. ฟังก์ชันเพิ่มสินค้าเข้าตะกร้า
    addToCart: (part) => {
        // ตรวจสอบว่ามีสินค้านี้ในตะกร้าแล้วหรือยัง
        const existingItem = cartState.find(item => item.id === part.id);

        if (existingItem) {
            // ถ้ามีแล้ว ให้บวกจำนวนเพิ่มเข้าไป
            existingItem.quantity += 1;
        } else {
            // ถ้ายังไม่มี ให้ push สินค้าใหม่เข้าไปพร้อมกำหนดจำนวนเริ่มต้นเป็น 1
            cartState.push({
                id: part.id,
                name: part.name,
                price: part.price,
                quantity: 1
            });
        }

        // เซฟข้อมูลและสั่งอัปเดตหน้าจอ
        CartService.saveAndRefresh();
    },

    // 3. ฟังก์ชันลดจำนวนสินค้า หรือลบออกหากจำนวนเหลือ 0
    updateQuantity: (partId, newQuantity) => {
        const itemIndex = cartState.findIndex(item => item.id === partId);

        if (itemIndex !== -1) {
            if (newQuantity <= 0) {
                // ถ้าจำนวนเป็น 0 หรือติดลบ ให้ลบออกจากตะกร้า
                cartState.splice(itemIndex, 1);
            } else {
                // ถ้าจำนวนมากกว่า 0 ให้อัปเดตค่าใหม่
                cartState[itemIndex].quantity = newQuantity;
            }
            CartService.saveAndRefresh();
        }
    },

    // 4. ฟังก์ชันลบสินค้าชิ้นนั้นออกจากตะกร้าทันที (ไม่สนจำนวน)
    removeFromCart: (partId) => {
        cartState = cartState.filter(item => item.id !== partId);
        CartService.saveAndRefresh();
    },

    // 5. ฟังก์ชันล้างตะกร้าสินค้า (ใช้หลังจากสั่งซื้อสำเร็จ)
    clearCart: () => {
        cartState = [];
        CartService.saveAndRefresh();
    },

    // 6. ฟังก์ชันส่งข้อมูลดิบไปให้เพื่อนฝั่ง UX เรนเดอร์หน้าจอ
    getCartItems: () => {
        return cartState;
    },

    // 🔄 7. Serialization Bridge: สะพานซิงค์ข้อมูลลงเครื่องพร้อมสั่งเปลี่ยน UI
    saveAndRefresh: () => {
        // แปลงข้อมูลเป็น string และเซฟลง localStorage
        localStorage.setItem('cart', JSON.stringify(cartState));

        // [กฎข้อสำคัญ] วิ่งไปเรียกฟังก์ชันของ UX Engineer เพื่อสั่งวาดตะกร้าใหม่บนหน้าจอ
        if (typeof renderCart === 'function') {
            renderCart(cartState);
        }
    }
};

// 🔌 รอให้หน้า DOM โหลดเสร็จ เพื่อทำการตรวจรับสถานะตะกร้าเริ่มต้น (Initial Hydration UI)
document.addEventListener('DOMContentLoaded', () => {
    // โหลดปุ๊บ สั่งวาด UI ตะกร้าทันที ข้อมูลจะได้ไม่หายตอนรีเฟรช
    if (typeof renderCart === 'function') {
        renderCart(cartState);
    }
});