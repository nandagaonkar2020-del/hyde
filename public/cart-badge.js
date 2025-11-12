// cart-badge.js
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.style.display = cart.length > 0 ? 'block' : 'none';
  }
}

// Run when page loads
document.addEventListener('DOMContentLoaded', updateCartBadge);
