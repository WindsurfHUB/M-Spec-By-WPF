/* =============================================
   checkout.js — Integration Engineer hooks
   POST /api/orders and POST /api/bookings
   Session 5: RESTful API submission with JWT Auth
   ============================================= */

// =============================================
// CHECKOUT HANDLER
// =============================================
async function handleCheckout() {
  const token = localStorage.getItem('token');
  if (!token) {
    if (typeof closeCart === 'function') closeCart();
    if (typeof openModal === 'function') openModal('login');
    return;
  }

  const items = CartService.getCartItems();
  if (items.length === 0) return;

  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) { 
    btnCheckout.textContent = 'PLACING ORDER...'; 
    btnCheckout.disabled = true; 
  }

  const parts    = items.filter(i => i.type !== 'booking');
  const bookings = items.filter(i => i.type === 'booking');

  try {
    // 1. Submit Parts Order (Gatekeeper Pattern: No prices sent to backend)
    if (parts.length > 0) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          items: parts.map(p => ({ partId: p.id, quantity: p.quantity })) 
        })
      });
      
      if (res.status === 401) { 
        localStorage.removeItem('token'); 
        if (typeof closeCart === 'function') closeCart(); 
        if (typeof openModal === 'function') openModal('login'); 
        return; 
      }
      if (!res.ok) { 
        const err = await res.json(); 
        alert(err.message || 'Order failed.'); 
        return; 
      }
    }

    // 2. Submit Dyno Bookings individually
    for (const booking of bookings) {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          slotId: booking.id, 
          carDetails: booking.carDetails || 'ไม่ได้ระบุข้อมูลรถ' 
        })
      });

      if (res.status === 409) { 
        alert(`Slot "${booking.name}" เต็มแล้ว กรุณาเลือกสล็อตอื่น`); 
        return; 
      }
      if (!res.ok) { 
        const err = await res.json(); 
        alert(err.message || 'Booking failed.'); 
        return; 
      }
    }

    // 3. Clear Cart & Update UI on success
    CartService.clearCart();
    if (typeof closeCart === 'function') closeCart();
    if (typeof showToast === 'function') {
      showToast('Order placed successfully! 🎉', 'success');
    } else {
      alert('Order placed successfully! 🎉');
    }
    
    if (typeof fetchOrders === 'function') fetchOrders();

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
