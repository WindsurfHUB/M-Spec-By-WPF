/* =============================================
   booking-page.js — Dyno Booking Page
   booking.html เท่านั้น
   - โหลด slots grid จาก API
   - เปิด popup modal เมื่อกด BOOK SLOT
   - confirm → addToCart → เปิด cart sidebar
   ============================================= */

// =============================================
// STATE
// =============================================
let _selectedSlot = null; // { id, date, time, avail }

// =============================================
// OPEN SLOT MODAL — เรียกเมื่อกด BOOK SLOT
// =============================================
function openSlotModal(slotData) {
  _selectedSlot = slotData;

  // ใส่ข้อมูลลง summary panel
  document.getElementById('scp-date').textContent  = slotData.date;
  document.getElementById('scp-time').textContent  = slotData.time;
  document.getElementById('scp-avail').textContent = slotData.avail;

  // clear form
  const carInput = document.getElementById('slot-car-details');
  if (carInput) carInput.value = '';
  hideSlotError();

  // เปิด modal
  const modal = document.getElementById('slot-booking-modal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // focus input
    setTimeout(() => carInput?.focus(), 120);
  }
}

function closeSlotModal() {
  const modal = document.getElementById('slot-booking-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  _selectedSlot = null;
}

function showSlotError(msg) {
  const el = document.getElementById('slot-modal-error');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function hideSlotError() {
  const el = document.getElementById('slot-modal-error');
  if (el) el.classList.add('hidden');
}

// =============================================
// CONFIRM BOOKING → ADD TO CART
// =============================================
async function confirmSlotBooking() {
  if (!_selectedSlot) return;

  const token = localStorage.getItem('token');
  if (!token) {
    closeSlotModal();
    if (typeof openModal === 'function') openModal('login');
    return;
  }

  const carInput = document.getElementById('slot-car-details');
  const carDetails = carInput?.value?.trim();

  if (!carDetails) {
    showSlotError('กรุณากรอกข้อมูลรถยนต์ก่อนยืนยัน');
    carInput?.focus();
    return;
  }

  // Direct Booking API Call
  const confirmBtn = document.querySelector('#slot-booking-modal .btn-primary');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        slotId: _selectedSlot.id,
        carDetails: carDetails
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'จองคิวไม่สำเร็จ กรุณาลองใหม่');
    }

    if (typeof showToast === 'function') {
      showToast(`จอง Dyno Session ${_selectedSlot.date} สำเร็จแล้ว ✓`);
    }

    closeSlotModal();

    // Refresh slots globally to reflect capacity reduction
    if (typeof fetchSlots === 'function') {
      await fetchSlots();
    }

  } catch (err) {
    showSlotError(err.message);
  } finally {
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

// =============================================
// SLOTS CONTAINER — Event delegation
// รับ click จาก BOOK SLOT button ทุกปุ่ม
// =============================================
function initSlotsEvents() {
  const container = document.getElementById('slots-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-book-slot');
    if (!btn) return;

    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof openModal === 'function') openModal('login');
      return;
    }

    openSlotModal({
      id:    btn.dataset.slotId,
      date:  btn.dataset.date,
      time:  btn.dataset.time,
      avail: btn.dataset.avail
    });
  });
}

// =============================================
// MODAL EVENTS
// =============================================
function initSlotModalEvents() {
  // ปิดด้วยปุ่ม X
  document.getElementById('btn-close-slot-modal')?.addEventListener('click', closeSlotModal);

  // ปิดเมื่อคลิก overlay พื้นหลัง
  document.getElementById('slot-booking-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('slot-booking-modal')) closeSlotModal();
  });

  // ปุ่ม ADD TO CART
  document.getElementById('btn-confirm-slot')?.addEventListener('click', confirmSlotBooking);

  // Enter ใน input ก็ confirm ได้
  document.getElementById('slot-car-details')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmSlotBooking();
  });

  // ESC ปิด modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('slot-booking-modal');
      if (modal?.classList.contains('open')) closeSlotModal();
    }
  });
}

// =============================================
// FETCH SLOTS — GET /api/slots
// =============================================
async function loadSlots() {
  const container = document.getElementById('slots-container');
  if (!container) return;
  container.innerHTML = `<div class="loading-state"></div>`;

  try {
    const res  = await fetch('/api/slots');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();

    // renderSlots มาจาก main.js
    if (typeof renderSlots === 'function') {
      renderSlots(data.slots || data);
    }
  } catch {
    container.innerHTML = `<p class="slots-empty">โหลดสล็อตไม่สำเร็จ กรุณา refresh หน้า</p>`;
  }
}

// =============================================
// INIT — เรียกหลัง main.js DOMContentLoaded เสร็จ
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // โหลด slots
  loadSlots();

  // ผูก events
  initSlotsEvents();
  initSlotModalEvents();
});