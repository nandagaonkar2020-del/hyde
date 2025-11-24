function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const badge = document.getElementById('cartBadge');
  if (cart.length > 0) {
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}



  function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const btnClear = document.getElementById('btnClear');
    const btnCheckout = document.getElementById('btnCheckout');

    if (cart.length === 0) {
      cartItems.innerHTML = '<p class="text-center text-white">Your cart is empty.</p>';
      cartSummary.innerHTML = '';
      btnClear.style.display = 'none';
      btnCheckout.style.display = 'none';
      return;
    }

    btnClear.style.display = 'block';
    btnCheckout.style.display = 'block';

    let total = 0;
    cartItems.innerHTML = cart.map((item, index) => {
      const itemTotal = (item.totalPrice || item.price) * item.quantity;
      total += itemTotal;

      if (item.isCustom) {
        return `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" onerror="this.src='/placeholder.png'">
            <div style="flex: 1;">
              <h6>${item.title}</h6>
              <div class="small text-white mb-1">${item.size}</div>
              <div class="text-warning small mb-1"><i class="fas fa-star me-1"></i>Customized</div>
              <div class="price">₹${itemTotal.toFixed(2)}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${index})">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        `;
      } else {
        return `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" onerror="this.src='/placeholder.png'">
            <div style="flex: 1;">
              <h6 style="text-transform:uppercase;">${item.title}</h6>
              ${item.size ? `<div class="small text-white mb-1">Size: ${item.size}</div>` : ''}
              <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateCartQuantity(${index}, -1)">−</button>
                <input type="int" class="quantity-input" value="${item.quantity}" min="1" max="99" 
                       onchange="updateCartQuantityInput(${index}, this.value)" 
                       onblur="validateQuantity(${index}, this)">
                <button class="quantity-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
              </div>
              <div class="price">₹${itemTotal.toFixed(2)}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${index})">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        `;
      }
    }).join('');

    cartSummary.innerHTML = `Total: ₹${total.toFixed(2)}`;
    updateCartBadge(); 
  }

  function updateCartQuantity(index, change) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
      cart[index].quantity = Math.max(1, Math.min(99, cart[index].quantity + change));
      localStorage.setItem('cart', JSON.stringify(cart));
      loadCart();
    }
    updateCartBadge(); 
  }

  function updateCartQuantityInput(index, value) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
      const newQuantity = Math.max(1, Math.min(99, parseInt(value) || 1));
      cart[index].quantity = newQuantity;
      localStorage.setItem('cart', JSON.stringify(cart));
      loadCart();
    }
    updateCartBadge(); 
  }

  function validateQuantity(index, input) {
    const value = parseInt(input.value);
    if (isNaN(value) || value < 1) {
      input.value = 1;
      updateCartQuantityInput(index, 1);
    } else if (value > 99) {
      input.value = 99;
      updateCartQuantityInput(index, 99);
    }
  }

  function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartBadge(); 
  }

  function clearCart() {
    if (confirm("Are you sure you want to clear your entire cart?")) {
      localStorage.removeItem('cart');
      loadCart();
    }
    updateCartBadge(); 
  }

  function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    const modal = new bootstrap.Modal(document.getElementById('addressModal'));
    modal.show();
  }

  // ---- PHONE VALIDATION HANDLERS ----
  function phoneKeydownHandler(e) {
    const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
    if (allowedKeys.includes(e.key)) return true;
    if (e.ctrlKey || e.metaKey) return true;
    if (/^[0-9]$/.test(e.key)) return true;
    e.preventDefault();
    return false;
  }

  // ---- FORM SUBMIT HANDLER ----
  document.getElementById('checkoutForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address1 = document.getElementById('address1').value.trim();
    const address2 = document.getElementById('address2').value.trim();
    // const address3 = document.getElementById('address3').value.trim();
    const city = document.getElementById('city').value.trim();
    const pincode = document.getElementById('pincode').value.trim();

    const phoneError = document.getElementById('phoneError');
    const pinError = document.getElementById('pinError');
    let valid = true;

    phoneError.style.display = 'none';
    pinError.style.display = 'none';

    if (!/^\d{10}$/.test(phone)) {
      phoneError.style.display = 'block';
      valid = false;
    }

    if (!/^\d{6}$/.test(pincode)) {
      pinError.style.display = 'block';
      valid = false;
    }

    if (!valid) return;

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    let total = 0;
    let message = `*New Order Received*%0A%0A*Customer Details:*%0A👤 Name: ${name}%0A📧 Email: ${email}%0A📞 Phone: ${phone}%0A🏠 Address: ${address1} ${address2}%0A🏙️ City: ${city}%0A📮 Pincode: ${pincode}%0A%0A*Order Details:*%0A`;

    cart.forEach((item, i) => {
      const itemTotal = (item.totalPrice || item.price) * item.quantity;
      total += itemTotal;
      message += `${i + 1}. ${item.title} (${item.size || 'N/A'}) x ${item.quantity} - ₹${itemTotal.toFixed(2)}%0A`;
    });

    message += `%0A*Total Amount:* ₹${total.toFixed(2)}%0A%0A🕒 Placed on: ${new Date().toLocaleString()}`;
    
    // Demo WhatsApp number
    const whatsappNumber = "9653150046"; // change to your business number

    // Encode and open WhatsApp
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappURL, "_blank");

    // Clear cart after order
    localStorage.removeItem('cart');
  });

  document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  updateCartBadge(); // ensure badge is updated when page loads
});