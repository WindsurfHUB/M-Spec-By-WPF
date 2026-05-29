/* =============================================
   orders-page.js — My Orders Page
   orders.html เท่านั้น
   - ดึง orders + bookings จาก API
   - render รวมกันในรูปแบบ order cards
   - tab filter: ALL / PARTS / DYNO SESSIONS
   ============================================= */

// =============================================
// STATE
// =============================================
let _allOrders    = [];
let _activeFilter = 'all';

// =============================================
// RENDER ORDERS LIST
// =============================================
function renderOrdersList(orders) {
  const container = document.getElementById('orders-container');
  if (!container) return;

  const filtered = _activeFilter === 'all'
    ? orders
    : orders.filter(o => o._type === _activeFilter);

  if (!filtered || filtered.length === 0) {
    const emptyMsgs = {
      all:     'ยังไม่มีออเดอร์ ไปจองคิว Dyno หรือเลือกอะไหล่ได้เลย!',
      parts:   'ยังไม่มีออเดอร์อะไหล่',
      booking: 'ยังไม่มีการจอง Dyno — <a href="booking.html" style="color:var(--c-red)">จองเลย →</a>'
    };
    container.innerHTML = `<p class="orders-empty-msg">${emptyMsgs[_activeFilter] || 'ไม่มีรายการ'}</p>`;
    return;
  }

  const statusMap = {
    Pending:   'status-pending',
    Sourcing:  'status-sourcing',
    'In Stock':'status-instock',
    Shipped:   'status-shipped',
    confirmed: 'status-instock',
    Confirmed: 'status-instock'
  };

  container.innerHTML = filtered.map(order => {
    const isBooking  = order._type === 'booking';
    const borderClass = isBooking ? 'order-card-type-booking' : 'order-card-type-parts';
    const typeLabel  = isBooking ? '🏎 Dyno Session' : '⚙️ Parts Order';
    const status     = order.status || 'Pending';
    const statusClass = statusMap[status] || 'status-pending';

    // วันที่ — booking ใช้ slot_date, order ใช้ created_at
    let dateDisplay = '';
    if (isBooking && order.slot_date) {
      const d = new Date(`${order.slot_date}T${order.slot_time || '09:00'}`);
      dateDisplay = `Session: ${d.toLocaleDateString('th-TH', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      })} · ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (order.created_at) {
      dateDisplay = `สั่งเมื่อ: ${new Date(order.created_at).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric'
      })}`;
    }

    return `
      <div class="order-card ${borderClass}">
        <div>
          <p class="order-id">#${String(order.id).padStart(5, '0')} · ${isBooking ? 'DYNO' : 'PARTS'}</p>
          <p class="order-name">${typeLabel}</p>
          ${order.car_details ? `<p style="font-size:12px;color:#aaa;margin:4px 0;">🚗 ${order.car_details}</p>` : ''}
          <p class="order-date">${dateDisplay}</p>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:10px">
          <span class="order-status-badge ${statusClass}">${status.toUpperCase()}</span>
          ${order.total_price
            ? `<p style="font-family:var(--font-display);font-size:22px;color:var(--c-white)">
                ฿${Number(order.total_price).toLocaleString('th-TH')}
               </p>`
            : `<p style="font-family:var(--font-display);font-size:22px;color:var(--c-white)">฿1,500</p>`
          }
        </div>
      </div>`;
  }).join('');
}

// =============================================
// FETCH DATA — orders + bookings รวมกัน
// =============================================
async function loadOrdersData() {
  const token = localStorage.getItem('token');

  // ไม่ได้ login
  if (!token) {
    document.getElementById('orders-login-prompt')?.classList.remove('hidden');
    document.getElementById('orders-wrapper')?.classList.add('hidden');

    // ปุ่ม login
    document.getElementById('btn-login-orders')?.addEventListener('click', () => {
      if (typeof openModal === 'function') openModal('login');
    });
    return;
  }

  // login อยู่ — แสดง wrapper ซ่อน prompt
  document.getElementById('orders-login-prompt')?.classList.add('hidden');
  document.getElementById('orders-wrapper')?.classList.remove('hidden');

  const container = document.getElementById('orders-container');
  if (container) container.innerHTML = `<div class="loading-state"></div>`;

  try {
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch orders และ bookings พร้อมกัน
    const [ordersRes, bookingsRes] = await Promise.allSettled([
      fetch('/api/orders',   { headers }),
      fetch('/api/bookings', { headers })
    ]);

    let orders   = [];
    let bookings = [];

    if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
      const d = await ordersRes.value.json();
      orders = (d.orders || d).map(o => ({ ...o, _type: 'parts' }));
    }
    if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
      const d = await bookingsRes.value.json();
      bookings = (d.bookings || d).map(b => ({ ...b, _type: 'booking' }));
    }

    // รวมและเรียง created_at ล่าสุดก่อน
    _allOrders = [...orders, ...bookings].sort((a, b) => {
      const da = new Date(a.created_at || a.slot_date || 0);
      const db = new Date(b.created_at || b.slot_date || 0);
      return db - da;
    });

    renderOrdersList(_allOrders);

  } catch (err) {
    console.error('loadOrdersData error:', err);
    if (container) container.innerHTML = `<p class="orders-empty-msg">โหลดข้อมูลไม่สำเร็จ กรุณา refresh</p>`;
  }
}

// =============================================
// TAB FILTER EVENTS
// =============================================
function initOrderTabs() {
  const tabs = document.querySelectorAll('.orders-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _activeFilter = tab.dataset.filter || 'all';
      renderOrdersList(_allOrders);
    });
  });
}

// =============================================
// REFRESH — เรียกหลัง login สำเร็จ
// =============================================
function refreshOrdersOnAuth() {
  // ฟัง custom event จาก auth.js หรือ polling ง่ายๆ
  const originalUpdateAuthUI = window.updateAuthUI;
  window.updateAuthUI = function() {
    if (typeof originalUpdateAuthUI === 'function') originalUpdateAuthUI();
    // reload data หลัง auth state เปลี่ยน
    setTimeout(loadOrdersData, 200);
  };
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initOrderTabs();
  refreshOrdersOnAuth();
  loadOrdersData();
});