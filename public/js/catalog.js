/* =============================================
   catalog.js — Integration Engineer hooks
   fetch() calls to backend API
   Session 5: RESTful API consumption
   ============================================= */

// =============================================
// FETCH PARTS — GET /api/parts
// =============================================
async function fetchParts({ keyword = '', category = '', minPrice, maxPrice } = {}) {
  const container = document.getElementById('parts-container');
  if (container) container.innerHTML = `<div class="loading-state"><span class="loading-dots"></span></div>`;

  try {
    const params = new URLSearchParams();
    if (keyword)  params.set('keyword',  keyword);
    if (category) params.set('category', category);
    if (minPrice != null) params.set('minPrice', minPrice);
    if (maxPrice != null) params.set('maxPrice', maxPrice);

    const res  = await fetch(`/api/parts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch parts');
    const data = await res.json();

    if (typeof renderParts === 'function') {
      renderParts(data.parts || data);
    }
    if (typeof renderRecommended === 'function') {
      renderRecommended(data.parts || data);
    }
  } catch (err) {
    console.error('fetchParts error:', err);
    if (container) container.innerHTML = `<p class="parts-empty">โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่</p>`;
  }
}

// =============================================
// FETCH SLOTS — GET /api/slots
// =============================================
async function fetchSlots() {
  const container = document.getElementById('slots-container');
  if (container) container.innerHTML = `<div class="loading-state"><span class="loading-dots"></span></div>`;

  try {
    const res  = await fetch('/api/slots');
    if (!res.ok) throw new Error('Failed to fetch slots');
    const data = await res.json();

    if (typeof renderSlots === 'function') {
      renderSlots(data.slots || data);
    }
  } catch (err) {
    console.error('fetchSlots error:', err);
    if (container) container.innerHTML = `<p class="slots-empty">โหลดสล็อตไม่สำเร็จ กรุณาลองใหม่</p>`;
  }
}

// =============================================
// FETCH ORDERS — GET /api/orders (JWT required)
// =============================================
async function fetchOrders() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const container = document.getElementById('orders-container');

  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      if (typeof updateAuthUI === 'function') updateAuthUI();
      return;
    }
    if (!res.ok) throw new Error('Failed to fetch orders');
    const data = await res.json();

    if (typeof renderOrders === 'function') {
      renderOrders(data.orders || data);
    }
  } catch (err) {
    console.error('fetchOrders error:', err);
    if (container) container.innerHTML = `<p class="orders-empty-msg">โหลดออเดอร์ไม่สำเร็จ</p>`;
  }
}
