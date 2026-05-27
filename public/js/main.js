/* =============================================
   main.js — UX Engineer
   Session 3: Event Delegation + Debouncing
   Session 4: Single Source of Truth (renderCart)
   ============================================= */

// =============================================
// RENDER CART — called by CartService.saveAndRefresh()
// =============================================
function renderCart(cartState) {
  const container = document.getElementById('cart-items');
  const totalEl   = document.getElementById('cart-total');
  const countEl   = document.getElementById('cart-count');
  if (!container) return;

  const count = cartState.reduce((s, i) => s + i.quantity, 0);
  const total = cartState.reduce((s, i) => s + i.price * i.quantity, 0);

  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'flex' : 'none';
  }
  if (totalEl) {
    totalEl.textContent = '฿' + total.toLocaleString('th-TH');
  }

  if (cartState.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <p>ตะกร้าว่างเปล่า</p>
        <span>เพิ่มอะไหล่หรือจองคิว Dyno</span>
      </div>`;
    return;
  }

  container.innerHTML = cartState.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-thumb">
        <div class="cart-thumb-placeholder">${(item.name || '?').charAt(0)}</div>
      </div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">฿${(item.price * item.quantity).toLocaleString('th-TH')}</p>
        ${item.carDetails ? `<p class="cart-item-car-details" style="font-size:11px;color:#888;margin-top:4px;">🚗 ${item.carDetails}</p>` : ''}
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="minus" data-id="${item.id}" aria-label="ลด">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" data-action="plus"  data-id="${item.id}" aria-label="เพิ่ม">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" aria-label="ลบ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
}

// =============================================
// RENDER SLOTS — dyno booking grid
// =============================================
function renderSlots(slots) {
  const container = document.getElementById('slots-container');
  if (!container) return;

  if (!slots || slots.length === 0) {
    container.innerHTML = `<p class="slots-empty">ไม่มีสล็อตว่างในขณะนี้</p>`;
    return;
  }

  // Filter: show only tomorrow (today+1) through today+7
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const endDay = new Date(today);
  endDay.setDate(today.getDate() + 8);

  const filtered = slots.filter(slot => {
    const d = new Date(slot.slot_date);
    return d >= tomorrow && d <= endDay;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="slots-empty">ไม่มีสล็อตในช่วง 7 วันข้างหน้า</p>`;
    return;
  }

  container.innerHTML = filtered.map(slot => {
    const isFull    = slot.current_bookings >= slot.max_capacity;
    const filled    = slot.current_bookings || 0;
    const max       = slot.max_capacity || 3;
    const available = max - filled;

    const date = slot.slot_date && slot.slot_time
      ? new Date(`${slot.slot_date}T${slot.slot_time}`)
      : new Date(slot.slot_datetime || slot.date);
    const dateStr = date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    const dots = Array.from({ length: max }, (_, i) =>
      `<span class="slot-dot ${i < filled ? 'filled' : ''}"></span>`
    ).join('');

    return `
      <div class="slot-card ${isFull ? 'slot-full' : ''}" data-slot-id="${slot.id}">
        <p class="slot-date">${dateStr}</p>
        <p class="slot-time">${timeStr}</p>
        <div class="slot-capacity">
          <div class="slot-dots">${dots}</div>
          <span class="slot-capacity-text">${available}/${max} ว่าง</span>
        </div>
        ${isFull
          ? `<div class="slot-badge slot-badge-full">FULL</div>`
          : `<button class="btn-book-slot btn-primary" data-slot-id="${slot.id}" data-slot-name="${dateStr} ${timeStr}">
               BOOK SLOT
             </button>`
        }
      </div>`;
  }).join('');
}

// =============================================
// RENDER PARTS — product catalog
// =============================================
function renderParts(parts) {
  const container = document.getElementById('parts-container');
  if (!container) return;

  if (!parts || parts.length === 0) {
    container.innerHTML = `<p class="parts-empty">ไม่พบสินค้าที่ตรงกับการค้นหา</p>`;
    return;
  }

  container.innerHTML = parts.map(part => {
    const stockClass = part.stock > 5 ? 'badge-in'
                     : part.stock > 0 ? 'badge-low'
                     : 'badge-out';
    const stockText  = part.stock > 5 ? 'IN STOCK'
                     : part.stock > 0 ? `ONLY ${part.stock} LEFT`
                     : 'OUT OF STOCK';
    return `
      <div class="part-card" data-part-id="${part.id}">
        <div class="part-card-img">
          ${part.image_url
            ? `<img src="${part.image_url}" alt="${part.name}" loading="lazy"/>`
            : `<span>${part.category || 'PART'}</span>`
          }
        </div>
        <div class="part-card-body">
          <p class="part-card-cat">${part.category || ''}</p>
          <h3 class="part-card-name">${part.name}</h3>
          <p class="part-card-desc">${part.description || ''}</p>
          <div class="part-card-footer">
            <p class="part-card-price"><small>฿</small>${Number(part.price).toLocaleString('th-TH')}</p>
            <span class="part-stock-badge ${stockClass}">${stockText}</span>
          </div>
          <button class="btn-add-to-cart btn-primary"
            data-part-id="${part.id}"
            data-name="${part.name}"
            data-price="${part.price}"
            data-category="${part.category || ''}"
            ${part.stock <= 0 ? 'disabled' : ''}>
            ADD TO CART
          </button>
        </div>
      </div>`;
  }).join('');
}

// =============================================
// RENDER ORDERS — order history
// =============================================
function renderOrders(orders) {
  const container = document.getElementById('orders-container');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `<p class="orders-empty-msg">ยังไม่มีออเดอร์ จองคิว Dyno หรือเลือกอะไหล่ได้เลย!</p>`;
    return;
  }

  const statusClass = { Pending: 'status-pending', Sourcing: 'status-sourcing', 'In Stock': 'status-instock', Shipped: 'status-shipped' };

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div>
        <p class="order-id">#${String(order.id).padStart(5, '0')}</p>
        <p class="order-name">${order.type === 'booking' ? '🏎 Dyno Session' : '⚙️ Parts Order'}</p>
        <p class="order-date">${new Date(order.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div style="text-align:right">
        <span class="order-status-badge ${statusClass[order.status] || 'status-pending'}">${order.status || 'Pending'}</span>
        ${order.total_price ? `<p style="margin-top:8px;font-family:var(--font-display);font-size:20px">฿${Number(order.total_price).toLocaleString('th-TH')}</p>` : ''}
      </div>
    </div>`
  ).join('');
}

// =============================================
// DEBOUNCE (Session 3)
// =============================================
function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// =============================================
// CART SIDEBAR EVENTS (Session 3: Event Delegation)
// =============================================
function initCartSidebarEvents() {
  const sidebar = document.getElementById('cart-sidebar');
  if (!sidebar) return;

  // One listener — handles qty + remove via delegation
  sidebar.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.cart-item-remove');
    const qtyBtn    = e.target.closest('.qty-btn');

    if (removeBtn) {
      const id = Number(removeBtn.dataset.id);
      CartService.removeFromCart(id);
      return;
    }
    if (qtyBtn) {
      const id  = Number(qtyBtn.dataset.id);
      const item = CartService.getCartItems().find(i => i.id === id);
      if (!item) return;
      const newQty = qtyBtn.dataset.action === 'plus' ? item.quantity + 1 : item.quantity - 1;
      CartService.updateQuantity(id, newQty);
    }
  });

  // Open/Close
  document.getElementById('btn-cart')?.addEventListener('click', openCart);
  document.getElementById('btn-close-cart')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  // Checkout (Calls handleCheckout() from checkout.js)
  document.getElementById('btn-checkout')?.addEventListener('click', () => {
    if (typeof handleCheckout === 'function') {
      handleCheckout();
    } else {
      console.error('handleCheckout is not defined in checkout.js');
    }
  });
}

function openCart() {
  document.getElementById('cart-sidebar')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// =============================================
// EVENT DELEGATION — Parts Container (Session 3)
// =============================================
function initPartsEvents() {
  const container = document.getElementById('parts-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-add-to-cart');
    if (!addBtn || addBtn.disabled) return;

    CartService.addToCart({
      id:       Number(addBtn.dataset.partId),
      name:     addBtn.dataset.name,
      price:    Number(addBtn.dataset.price),
      category: addBtn.dataset.category
    });

    // Visual feedback
    addBtn.textContent = 'ADDED ✓';
    addBtn.style.background = '#27ae60';
    setTimeout(() => {
      addBtn.textContent = 'ADD TO CART';
      addBtn.style.background = '';
    }, 1200);
  });
}

// =============================================
// EVENT DELEGATION — Slots Container with carDetails input
// =============================================
function initSlotsEvents() {
  const container = document.getElementById('slots-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const bookBtn = e.target.closest('.btn-book-slot');
    if (!bookBtn) return;

    const token = localStorage.getItem('token');
    if (!token) {
      openModal('login');
      return;
    }

    // 🌟 Interactive prompt to capture car details
    const carDetails = prompt('กรุณากรอกข้อมูลรถยนต์ของคุณสำหรับการจูน Dyno (เช่น ยี่ห้อ รุ่นรถ และเลขทะเบียน):\nตัวอย่าง: Toyota Yaris (กข-1234 เชียงใหม่)');
    if (carDetails === null) {
      // User clicked "Cancel", abort booking
      return;
    }

    const cleanCarDetails = carDetails.trim() || 'ไม่ได้ระบุข้อมูลรถ';

    CartService.addToCart({
      id:         Number(bookBtn.dataset.slotId),
      name:       'Dyno Session — ' + bookBtn.dataset.slotName,
      price:      1500,
      quantity:   1,
      type:       'booking',
      carDetails: cleanCarDetails
    });

    bookBtn.textContent = 'BOOKED ✓';
    bookBtn.disabled = true;
    bookBtn.style.background = '#27ae60';
    openCart();
  });
}

// =============================================
// FILTER BAR EVENTS — Debounce on search (Session 3)
// =============================================
function initFilterEvents() {
  const searchInput   = document.getElementById('search-input');
  const catFilter     = document.getElementById('filter-category');
  const priceFilter   = document.getElementById('filter-price');

  const applyFilters = () => {
    const keyword  = searchInput?.value.trim() || '';
    const category = catFilter?.value || '';
    const priceVal = priceFilter?.value || '';
    let minPrice, maxPrice;

    if (priceVal) {
      const [min, max] = priceVal.split('-').map(Number);
      minPrice = min;
      maxPrice = max;
    }

    // Call catalog fetch if available
    if (typeof fetchParts === 'function') {
      fetchParts({ keyword, category, minPrice, maxPrice });
    }
  };

  // Debounce search (Session 3 — 400ms)
  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 400));
  }
  if (catFilter)   catFilter.addEventListener('change', applyFilters);
  if (priceFilter) priceFilter.addEventListener('change', applyFilters);
}

// =============================================
// TOAST
// =============================================
function showToast(message, type = 'success') {
  document.querySelector('.toast')?.remove();
  const icon = type === 'success'
    ? `<polyline points="20 6 9 17 4 12"/>`
    : `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${icon}</svg><span>${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// =============================================
// NAVBAR SCROLL EFFECT
// =============================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 60
      ? 'rgba(10,10,10,0.98)'
      : 'rgba(10,10,10,0.92)';
  }, { passive: true });
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCartSidebarEvents();
  initPartsEvents();
  initSlotsEvents();
  initFilterEvents();

  // Initial render from hydrated cartState
  renderCart(CartService.getCartItems());

  // Fetch initial data (catalog.js handles these)
  if (typeof fetchParts  === 'function') fetchParts({});
  if (typeof fetchSlots  === 'function') fetchSlots();
  if (typeof fetchOrders === 'function') {
    const token = localStorage.getItem('token');
    if (token) fetchOrders();
  }
});
