// ===== LIBAS HOUSE — shared script =====

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // Promo popup (shows once per page load, after short delay)
  const promo = document.querySelector('.promo-modal');
  if (promo) {
    setTimeout(() => promo.classList.add('show'), 2500);
    const closeBtn = promo.querySelector('.close-x');
    if (closeBtn) closeBtn.addEventListener('click', () => promo.classList.remove('show'));
    promo.addEventListener('click', (e) => { if (e.target === promo) promo.classList.remove('show'); });
  }

  // Product detail: thumbnail switch
  document.querySelectorAll('.pd-thumbs div').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.pd-thumbs div').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Product detail: size select
  document.querySelectorAll('.size-box').forEach(box => {
    box.addEventListener('click', () => {
      box.parentElement.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
      box.classList.add('active');
    });
  });

  // Product detail: tabs
  document.querySelectorAll('.tab-head button').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(target)?.classList.add('active');
    });
  });

  // Quantity stepper
  document.querySelectorAll('.qty-box').forEach(box => {
    const input = box.querySelector('input');
    box.querySelector('.qty-minus')?.addEventListener('click', () => {
      let v = parseInt(input.value) || 1;
      if (v > 1) input.value = v - 1;
    });
    box.querySelector('.qty-plus')?.addEventListener('click', () => {
      let v = parseInt(input.value) || 1;
      input.value = v + 1;
    });
  });

  // Wishlist heart toggle (demo, in-memory only)
  document.querySelectorAll('.wish-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? '♥' : '♡';
      showToast(btn.classList.contains('active') ? 'Added to wishlist' : 'Removed from wishlist');
    });
  });

  // Add to cart demo buttons
  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Added to cart');
    });
  });

  // Cart quantity change recalculates row + summary (demo, static numbers on cart.html)
  document.querySelectorAll('.cart-table .qty-box input').forEach(input => {
    input.addEventListener('change', () => showToast('Cart updated'));
  });

  // Checkout payment method select
  document.querySelectorAll('.pay-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  // Newsletter / contact form demo submit
  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thank you! We will get back to you soon.');
      form.reset();
    });
  });
});

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
