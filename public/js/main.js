/* =============================================
   main.js — UX Engineer
   Updated: แยกหน้า booking/orders ออก
   - index.html: แสดงแค่ catalog + booking summary
   - booking.html: booking-page.js จัดการ slot popup
   - orders.html: orders-page.js จัดการ orders
   ============================================= */

// =============================================
// RENDER CART
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
        ${item.carDetails ? `<p style="font-size:11px;color:#888;margin-top:4px;">🚗 ${item.carDetails}</p>` : ''}
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
// RENDER RECOMMENDED — index.html
// =============================================
function renderRecommended(parts) {
  const track = document.getElementById('recommended-track');
  if (!track || track.children.length > 0) return;
  
  // Get up to 5 parts that have images
  const recParts = parts.filter(p => p.image_url).slice(0, 5);
  if (recParts.length === 0) {
    track.innerHTML = '';
    return;
  }

  const html = recParts.map(part => `
    <div class="rec-item" title="${part.name}" onclick="searchRecommended('${part.name.replace(/'/g, "\\'")}')">
      <img src="${part.image_url}" alt="${part.name}" loading="lazy"/>
    </div>
  `).join('');

  // Duplicate for seamless infinite scrolling
  track.innerHTML = html + html; 
}

window.searchRecommended = function(name) {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = name;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    window.location.hash = '#catalog';
  }
}

// =============================================
// RENDER BOOKING SUMMARY — index.html only
// แสดงแค่ "จองวันไหน + เวลา + สถานะ"
// =============================================
function renderBookingSummary(bookings) {
  // logic ยกเลิก 1 วัน
const hoursElapsed = (now - created) / (1000 * 60 * 60);
const canCancel    = isPending && hoursElapsed <= 24;
const hoursLeft    = Math.ceil(24 - hoursElapsed);

// PATCH /api/bookings/:id/cancel
await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'PATCH' })
}

// =============================================
// CART SIDEBAR EVENTS
// =============================================
function initCartSidebarEvents() {
  const sidebar = document.getElementById('cart-sidebar');
  if (!sidebar) return;

  sidebar.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.cart-item-remove');
    const qtyBtn    = e.target.closest('.qty-btn');
    if (removeBtn) {
      CartService.removeFromCart(Number(removeBtn.dataset.id));
      return;
    }
    if (qtyBtn) {
      const id   = Number(qtyBtn.dataset.id);
      const item = CartService.getCartItems().find(i => i.id === id);
      if (!item) return;
      const newQty = qtyBtn.dataset.action === 'plus' ? item.quantity + 1 : item.quantity - 1;
      CartService.updateQuantity(id, newQty);
    }
  });

  document.getElementById('btn-cart')?.addEventListener('click', openCart);
  document.getElementById('btn-close-cart')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  document.getElementById('btn-checkout')?.addEventListener('click', () => {
    if (typeof handleCheckout === 'function') handleCheckout();
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
// PARTS EVENTS — add to cart
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

    addBtn.textContent = 'ADDED ✓';
    addBtn.style.background = '#27ae60';
    setTimeout(() => {
      addBtn.textContent = 'ADD TO CART';
      addBtn.style.background = '';
    }, 1200);
  });
}

// =============================================
// FILTER BAR EVENTS
// =============================================
function initFilterEvents() {
  const searchInput = document.getElementById('search-input');
  const catFilter   = document.getElementById('filter-category');
  const priceFilter = document.getElementById('filter-price');

  const applyFilters = () => {
    const keyword  = searchInput?.value.trim() || '';
    const category = catFilter?.value || '';
    const priceVal = priceFilter?.value || '';
    let minPrice, maxPrice;
    if (priceVal) {
      [minPrice, maxPrice] = priceVal.split('-').map(Number);
    }
    if (typeof fetchParts === 'function') fetchParts({ keyword, category, minPrice, maxPrice });
  };

  if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 400));
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
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>
    <span>${message}</span>`;
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
// BOOKING SUMMARY — index.html
// fetch bookings และ render แค่ dates (ไม่ใช่ form)
// =============================================
async function initBookingSummary() {
  // มีอยู่แค่ index.html
  const section = document.getElementById('my-bookings');
  if (!section) return;

  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('bookings-login-prompt')?.classList.remove('hidden');
    document.getElementById('bookings-container').innerHTML = '';
    // ปุ่ม login ใน prompt
    document.getElementById('btn-login-booking')?.addEventListener('click', () => {
      if (typeof openModal === 'function') openModal('login');
    });
    return;
  }

  try {
    const res = await fetch('/api/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    renderBookingSummary(data.bookings || data);
  } catch {
    document.getElementById('bookings-container').innerHTML =
      `<p class="bookings-empty-msg">โหลดข้อมูลการจองไม่สำเร็จ</p>`;
  }
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCartSidebarEvents();
  initPartsEvents();
  initFilterEvents();
  initRecommendedTicker();

  renderCart(CartService.getCartItems());

  // fetch parts ถ้าอยู่ index.html
  if (typeof fetchParts === 'function') fetchParts({});

  // booking summary — index.html เท่านั้น
  initBookingSummary();
  
  // Fetch dynamic stats for hero section
  fetchStats();
});
async function initRecommendedTicker() {
  const ticker = document.getElementById('rec-ticker');
  if (!ticker) return;

  try {
    const res  = await fetch('/api/parts');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const parts = (data.parts || data).filter(p => p.image_url);

    if (!parts.length) {
      document.querySelector('.hero-recommended')?.remove();
      return;
    }

    const makeCard = (p) => `
      <div class="rec-item" data-part-id="${p.id}" title="${p.name}">
        <img src="${p.image_url}" alt="${p.name}" loading="lazy" draggable="false"/>
        <div class="rec-item-label">${p.name}</div>
      </div>`;

    ticker.innerHTML = [...parts, ...parts, ...parts].map(makeCard).join('');

    const duration = Math.max(18, parts.length * 3.5);
    ticker.style.animationDuration = `${duration}s`;

    ticker.addEventListener('click', (e) => {
      if (e.target.closest('.rec-item'))
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    });

  } catch {
    document.querySelector('.hero-recommended')?.style.setProperty('display','none');
  }
}

// =============================================
// FETCH DYNAMIC STATS
// =============================================
async function fetchStats() {
  const dynoEl = document.getElementById('stat-dyno');
  const partsEl = document.getElementById('stat-parts');
  if (!dynoEl && !partsEl) return;

  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const data = await res.json();
      if (dynoEl && data.dynoSessions !== undefined) {
        dynoEl.textContent = `${data.dynoSessions}+`;
      }
      if (partsEl && data.rareParts !== undefined) {
        partsEl.textContent = `${data.rareParts}+`;
      }
    }
  } catch (err) {
    console.error('Failed to fetch stats', err);
  }
}

// expose globals
window.openCart  = openCart;
window.closeCart = closeCart;
window.showToast = showToast;
window.renderCart = renderCart;
window.renderSlots = renderSlots;
window.renderParts = renderParts;