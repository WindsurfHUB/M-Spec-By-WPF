/* =============================================
   cart.js
   Single Source of Truth — cartState[]
   Session 4: localStorage persistence + hydration
   ============================================= */

// --- SINGLE SOURCE OF TRUTH ---
let cartState = [];

// --- HYDRATION (Session 4) ---
// โหลด cartState จาก localStorage ตอน startup
function hydrateCart() {
  try {
    const raw = localStorage.getItem('mspec_cart');
    cartState = raw ? JSON.parse(raw) : [];
  } catch {
    cartState = [];
  }
}

// --- PERSISTENCE (Session 4) ---
// บันทึกทุกครั้งที่ state เปลี่ยน
function persistCart() {
  localStorage.setItem('mspec_cart', JSON.stringify(cartState));
}

// --- STATE MUTATIONS ---
function addToCart(item) {
  // item = { id, name, price, category, image }
  const existing = cartState.find(i => i.id === item.id && i.type === item.type);
  if (existing) {
    existing.qty += 1;
  } else {
    cartState.push({ ...item, qty: 1 });
  }
  persistCart();
  syncCartUI();
  openCart();
}

function removeFromCart(id, type = 'part') {
  cartState = cartState.filter(i => !(i.id === id && i.type === type));
  persistCart();
  syncCartUI();
}

function updateQty(id, type = 'part', delta) {
  const item = cartState.find(i => i.id === id && i.type === type);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id, type);
    return;
  }
  persistCart();
  syncCartUI();
}

function clearCart() {
  cartState = [];
  persistCart();
  syncCartUI();
}

function getCartTotal() {
  return cartState.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getCartCount() {
  return cartState.reduce((sum, i) => sum + i.qty, 0);
}

// --- RENDER (Session 3: EDA — UI updates after state change) ---
function renderCart() {
  const container = document.getElementById('cart-items');
  const totalEl   = document.getElementById('cart-total');
  const countEl   = document.getElementById('cart-count');
  if (!container) return;

  // update badge
  const count = getCartCount();
  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'flex' : 'none';
  }

  // update total
  if (totalEl) {
    totalEl.textContent = '฿' + getCartTotal().toLocaleString('th-TH');
  }

  // empty state
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

  // render items
  container.innerHTML = cartState.map(item => `
    <div class="cart-item" data-id="${item.id}" data-type="${item.type || 'part'}">
      <div class="cart-item-thumb">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" loading="lazy" />`
          : `<div class="cart-thumb-placeholder">${item.category || '?'}</div>`
        }
      </div>
      <div class="cart-item-info">
        <p class="cart-item-cat">${item.category || item.type || ''}</p>
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">฿${(item.price * item.qty).toLocaleString('th-TH')}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="minus" data-id="${item.id}" data-type="${item.type || 'part'}" aria-label="ลด">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-action="plus" data-id="${item.id}" data-type="${item.type || 'part'}" aria-label="เพิ่ม">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" data-type="${item.type || 'part'}" aria-label="ลบออก">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
}

// --- SYNC ALL CART UI ---
function syncCartUI() {
  renderCart();
}

// --- CART OPEN/CLOSE ---
function openCart() {
  const sidebar  = document.getElementById('cart-sidebar');
  const overlay  = document.getElementById('cart-overlay');
  if (!sidebar) return;
  sidebar.classList.add('open');
  sidebar.setAttribute('aria-hidden', 'false');
  if (overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (!sidebar) return;
  sidebar.classList.remove('open');
  sidebar.setAttribute('aria-hidden', 'true');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

// --- EVENT DELEGATION (Session 3) ---
// One listener on cart-items for all buttons
function initCartEvents() {
  const sidebar = document.getElementById('cart-sidebar');
  if (!sidebar) return;

  // delegation: qty + remove buttons inside cart
  sidebar.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.cart-item-remove');
    const qtyBtn    = e.target.closest('.qty-btn');

    if (removeBtn) {
      const { id, type } = removeBtn.dataset;
      removeFromCart(Number(id) || id, type);
      return;
    }
    if (qtyBtn) {
      const { action, id, type } = qtyBtn.dataset;
      const delta = action === 'plus' ? 1 : -1;
      updateQty(Number(id) || id, type, delta);
      return;
    }
  });

  // open cart button
  const btnCart = document.getElementById('btn-cart');
  if (btnCart) btnCart.addEventListener('click', openCart);

  // close cart button
  const btnClose = document.getElementById('btn-close-cart');
  if (btnClose) btnClose.addEventListener('click', closeCart);

  // overlay click closes cart
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.addEventListener('click', closeCart);

  // checkout button
  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) btnCheckout.addEventListener('click', handleCheckout);
}

// --- CHECKOUT HANDLER ---
async function handleCheckout() {
  const token = localStorage.getItem('mspec_token');
  if (!token) {
    closeCart();
    openAuthModal('login');
    return;
  }
  if (cartState.length === 0) return;

  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) {
    btnCheckout.textContent = 'PLACING ORDER...';
    btnCheckout.disabled = true;
  }

  // แยก parts vs bookings
  const parts    = cartState.filter(i => i.type !== 'booking');
  const bookings = cartState.filter(i => i.type === 'booking');

  try {
    // POST /api/orders สำหรับ parts
    if (parts.length > 0) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: parts.map(p => ({ partId: p.id, quantity: p.qty }))
        })
      });

      if (res.status === 401) {
        localStorage.removeItem('mspec_token');
        closeCart();
        openAuthModal('login');
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Order failed. Please try again.');
        return;
      }
    }

    // POST /api/bookings สำหรับ dyno slots
    for (const booking of bookings) {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slotId: booking.id,
          carDetails: booking.carDetails || ''
        })
      });

      if (res.status === 409) {
        alert(`Slot "${booking.name}" is now full. Please choose another slot.`);
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Booking failed.');
        return;
      }
    }

    // SUCCESS
    clearCart();
    closeCart();
    showOrderSuccess();

  } catch (err) {
    console.error('Checkout error:', err);
    alert('Network error. Please try again.');
  } finally {
    if (btnCheckout) {
      btnCheckout.textContent = 'PROCEED TO CHECKOUT';
      btnCheckout.disabled = false;
    }
  }
}

// --- SUCCESS TOAST ---
function showOrderSuccess() {
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>Order placed successfully!</span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// --- INIT ---
hydrateCart();
document.addEventListener('DOMContentLoaded', () => {
  initCartEvents();
  syncCartUI();
});