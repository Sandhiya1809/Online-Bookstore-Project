/* js/script.js — CLEANED & FIXED VERSION
   Backup your old file first (instructions provided).
   Key fixes:
   - removed duplicate function definitions
   - fixed runtime error (no stray total usage)
   - unified detail-view id passing (URL ?id=)
   - consistent addToCart / cart storage / badge update
*/

const PUBLIC_PAGES = ['login.html','register.html'];

(function enforceLogin(){
  const path = window.location.pathname.split('/').pop();
  const loggedUser = localStorage.getItem('loggedInUser');
  if (!PUBLIC_PAGES.includes(path)) {
    if (!loggedUser) {
      // allow public pages only
      if (!path) return;
      window.location.href = 'login.html';
      return;
    }
  }
})();

// --- SEED STATIC BOOKS ---
function seedProducts(){
  const key = 'bookstore_products_v1';
  if (!localStorage.getItem(key)) {
    const prod = [
      { id: 'b1', title: 'The Great Adventure', author: 'A. Traveller', price: 499, img:'assets/books11.png', desc: 'A thrilling journey across unknown lands.' },
      { id: 'b2', title: 'Science Wonders', author: 'Dr. Curie', price: 699, img:'assets/boooks2.jpeg', desc: 'Exploring the marvels of modern science.' },
      { id: 'b3', title: 'Mystery Night', author: 'Noir Writer', price: 349, img:'assets/books3.png', desc: 'A gripping mystery that keeps you guessing.' }
    ];
    localStorage.setItem(key, JSON.stringify(prod));
  }
}
seedProducts();

function getProducts(){ return JSON.parse(localStorage.getItem('bookstore_products_v1') || '[]'); }
function saveProducts(list){ localStorage.setItem('bookstore_products_v1', JSON.stringify(list)); }

// --- Helper: normalize dynamic book objects from backend ---
function normalizeBook(b){
  return {
    id: b.id || b._id || (b._id ? String(b._id) : undefined),
    title: b.title,
    author: b.author,
    price: b.price,
    img: b.img || b.image || '',
    desc: b.desc || b.description || ''
  };
}

// --- AUTH (register / login) and initial page hooks ---
document.addEventListener('DOMContentLoaded', ()=> {
  const regForm = document.getElementById('registerForm');
  if (regForm){
    regForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const pw = document.getElementById('regPassword').value;
      if (!name || !email || !pw){ alert('Fill all fields'); return; }
      const users = JSON.parse(localStorage.getItem('bookstore_users_v1')||'[]');
      if (users.find(u=>u.email===email)){ alert('Email already registered'); return; }
      users.push({ name, email, password: pw, isAdmin: email==='admin@bookstore.com' });
      localStorage.setItem('bookstore_users_v1', JSON.stringify(users));
      alert('Registered! Please login.');
      window.location.href = 'login.html';
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm){
    loginForm.addEventListener('submit', e=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pw = document.getElementById('loginPassword').value;
      const users = JSON.parse(localStorage.getItem('bookstore_users_v1')||'[]');
      const user = users.find(u=>u.email===email && u.password===pw);
      if (!user){ alert('Invalid credentials'); return; }
      localStorage.setItem('loggedInUser', JSON.stringify({ email:user.email, name:user.name, isAdmin: user.isAdmin||false }));
      alert('Login successful');
      window.location.href = 'index.html';
    });
  }

  ['logoutBtn','logoutBtn2','logoutBtn3','logoutBtn4'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', ()=>{ localStorage.removeItem('loggedInUser'); window.location.href = 'login.html'; });
  });

  // Page-specific renders (also run on window.onload below, this is safe)
  if (document.querySelector('.catalog')) renderCombinedCatalog();
  if (document.getElementById('bookDetailCard')) renderBookDetails();
  if (document.getElementById('cartItems')) renderCart();
  if (document.getElementById('addBookForm')) setupAdmin();
  updateCartBadge();
});

// --- COMBINED CATALOG (seed + backend) ---
function renderCombinedCatalog(){
  const container = document.querySelector('.catalog');
  if(!container) return;
  container.innerHTML = '';

  function renderCard(p){
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img || ''}" alt="${p.title}">
      <div class="content">
        <h3>${p.title}</h3>
        <p>by ${p.author || 'Unknown'}</p>
        <p style="font-weight:700">₹${p.price || 'N/A'}</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
          <button class="btn primary" onclick="viewDetails('${p.id || ''}')">View</button>
          <button class="btn" onclick="addToCart('${p.id || ''}')">Add to cart</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  }

  // local seed products
  const localBooks = getProducts();
  localBooks.forEach(b => renderCard(b));

  // dynamic backend books (if backend running)
  fetch('http://localhost:5000/api/books')
    .then(res => res.json())
    .then(data => {
      const dyn = data.map(normalizeBook);
      dyn.forEach(renderCard);
    })
    .catch(err => {
      // backend might be offline; that's fine — we already have seeded books
      console.info('No backend books loaded (server offline?):', err.message || err);
    });
}


// --- DETAILS PAGE ---
function viewDetails(id) {
  // use URL param so page is shareable; also keep localStorage fallback
  if (!id) return;
  // store fallback
  localStorage.setItem('book_view_id', id);
  window.location.href = `books-details.html?id=${encodeURIComponent(id)}`;
}


function renderBookDetails(){
  const card = document.getElementById('bookDetailCard');
  if (!card) return;

  // prefer URL param ?id=..., fallback to localStorage
  const qp = new URLSearchParams(window.location.search).get('id');
  const id = qp || localStorage.getItem('book_view_id');

  const localBooks = getProducts();

  fetch('http://localhost:5000/api/books')
    .then(res => res.json())
    .then(dynamicBooks => {
      const dyn = dynamicBooks.map(normalizeBook);
      const allBooks = [...localBooks, ...dyn];
      const p = allBooks.find(x => x.id === id || (x._id && String(x._id) === id));
      if (!p) {
        card.innerHTML = '<p>Book not found</p>';
      } else {
        card.innerHTML = `
          <img src="${p.img || ''}" alt="${p.title}">
          <div class="meta">
            <h2>${p.title}</h2>
            <p><strong>Author:</strong> ${p.author || ''}</p>
            <p style="font-weight:700">₹${p.price || ''}</p>
            <p>${p.desc || ''}</p>
            <div style="margin-top:14px">
              <button class="btn primary" onclick="addToCart('${p.id || ''}')">Add to Cart</button>
              <button class="btn" onclick="window.location.href='index.html'">Back to Shop</button>
            </div>
          </div>`;
      }
    })
    .catch(err => {
      // if backend not available, try local only
      const p = localBooks.find(x => x.id === id);
      if (!p) card.innerHTML = '<p>Book not found</p>';
      else {
        card.innerHTML = `
          <img src="${p.img || ''}" alt="${p.title}">
          <div class="meta">
            <h2>${p.title}</h2>
            <p><strong>Author:</strong> ${p.author || ''}</p>
            <p style="font-weight:700">₹${p.price || ''}</p>
            <p>${p.desc || ''}</p>
            <div style="margin-top:14px">
              <button class="btn primary" onclick="addToCart('${p.id || ''}')">Add to Cart</button>
              <button class="btn" onclick="window.location.href='index.html'">Back to Shop</button>
            </div>
          </div>`;
      }
    });
}

// --- CART (per-user) ---
function getCart() {
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  if (!user) return [];
  return JSON.parse(localStorage.getItem(`cart_${user.email}`) || '[]');
}

function saveCart(cart) {
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  if (!user) return;
  localStorage.setItem(`cart_${user.email}`, JSON.stringify(cart));
  updateCartBadge();
}


function findProductById(id){
  if (!id) return Promise.resolve(null);
  const localBooks = getProducts();
  const localFound = localBooks.find(b => b.id === id);
  if (localFound) return Promise.resolve(localFound);
  return fetch('http://localhost:5000/api/books')
    .then(res => res.json())
    .then(data => {
      const dyn = data.map(normalizeBook);
      return dyn.find(b=>b.id === id) || null;
    })
    .catch(err => {
      console.error('Error fetching books:', err);
      return null;
    });
}

function addToCart(id){
  const user = JSON.parse(localStorage.getItem('loggedInUser')||'null');
  if (!user){ alert('Please login'); window.location.href='login.html'; return; }
  findProductById(id).then(prod => {
    if (!prod) return alert('Book not found');
    const cart = getCart();
    const itemId = prod._id || prod.id || id;
    const existing = cart.find(i => i._id === itemId);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({ 
    _id: itemId,          // <-- use MongoDB _id
    title: prod.title, 
    price: Number(prod.price) || 0, 
    img: prod.img || '', 
    qty: 1 
});

    saveCart(cart);
    alert('Added to cart');
  });
}

function renderCart() {
  const container = document.getElementById('cartItems');
  if (!container) return;
  const cart = getCart();
  container.innerHTML = '';

  if (!cart.length) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    const totalElement = document.getElementById('cartTotal');
    if (totalElement) totalElement.textContent = 'Total: ₹0.00';
    updateCartBadge();
    return;
  }

  let total = 0;
  cart.forEach(ci => {
    total += (ci.price || 0) * (ci.qty || 1);
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${ci.img || ''}" alt="${ci.title}">
      <div class="info">
        <h4>${ci.title}</h4>
        <p>₹${ci.price} × ${ci.qty}</p>
        <div class="actions">
          <button onclick="changeQty('${ci._id}', 1)">+</button>
          <button onclick="changeQty('${ci._id}', -1)">−</button>
          <button onclick="removeFromCart('${ci._id}')">Remove</button>
        </div>
      </div>`;
    container.appendChild(div);
  });

  const totalElement = document.getElementById('cartTotal');
if (totalElement) totalElement.textContent = `Total: ₹${total.toFixed(2)}`;
}


function changeQty(id, delta){
  const cart = getCart();
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.qty = (item.qty || 1) + delta;
  if (item.qty <= 0) {
    const idx = cart.indexOf(item);
    if (idx > -1) cart.splice(idx, 1);
  }
  saveCart(cart);
  renderCart();
}
function removeFromCart(id){
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
}
function updateCartBadge(){
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.textContent = count;
}


function placeOrder() {
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  if (!user) { 
    alert('Please login first'); 
    window.location.href = 'login.html'; 
    return; 
  }

  let cart = getCart();
  if (!cart || !cart.length) { 
    alert('Your cart is empty'); 
    return; 
  }

  // Ensure cart is always an array
  if (!Array.isArray(cart)) cart = [cart];

  // Map cart to backend expected format
  const items = cart.map(item => ({
  bookId: item._id,  // use real MongoDB ObjectId from Atlas
  title: item.title,
  price: Number(item.price) || 0,
  quantity: Number(item.qty || item.quantity || 1)
}));

  // Debug log to check what will be sent
  console.log('Sending order:', { user: user?.email, items });

  fetch("http://localhost:5000/api/place-order", {

    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ user: user.email, items })
  })
  .then(res => res.json())
  .then(result => {
    console.log('Backend response:', result); // Debug log
    if (result && result.success) {
      alert('✅ Order placed successfully! Order ID: ' + (result.orderId || '—'));
    } else {
      alert('❌ Failed to place order: ' + (result.message || 'Unknown error'));
    }
    localStorage.removeItem(`cart_${user.email}`);
    renderCart();
    updateCartBadge();
  })
  .catch(err => {
    console.error('Place order failed:', err);
    alert('❌ Could not contact server.');
    localStorage.removeItem(`cart_${user.email}`);
    renderCart();
    updateCartBadge();
  });
}
// Fetch and render the logged-in user's orders
function fetchMyOrders() {
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  if (!user) {
    alert('Please login to see your orders.');
    window.location.href = 'login.html';
    return;
  }

  const container = document.getElementById('ordersList');
  if (!container) return;

  container.innerHTML = 'Loading orders...';

  fetch(`http://localhost:5000/api/orders/${encodeURIComponent(user.email)}`)
    .then(res => res.json())
    .then(data => {
      if (!data || !data.success || !Array.isArray(data.orders) || data.orders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
      }

      container.innerHTML = '';
      data.orders.forEach(order => {
        // Use order.total if saved, otherwise compute
        const total = (order.total !== undefined)
          ? order.total
          : (order.items || []).reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);

        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-card';
        orderDiv.innerHTML = `
          <h3>Order ID: ${order._id}</h3>
          <p><strong>Date:</strong> ${new Date(order.createdAt || order.date || Date.now()).toLocaleString()}</p>
          <ul class="order-items">
            ${ (order.items || []).map(i => `<li>${i.title || 'Untitled'} — ₹${i.price || 0} × ${i.quantity || 1}</li>`).join('') }
          </ul>
          <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
        `;
        container.appendChild(orderDiv);
      });
    })
    .catch(err => {
      console.error('Error fetching orders:', err);
      container.innerHTML = '<p>Could not load orders (check console).</p>';
    });
}


// --- ADMIN PANEL ---
// --- ADMIN PANEL ---
function setupAdmin() {
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  const panel = document.getElementById('adminPanel');
  
  if (!user?.isAdmin) {
    if (panel) panel.innerHTML = '<p>Access denied.</p>';
    return;
  }

  const form = document.getElementById('addBookForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const price = parseFloat(document.getElementById('bookPrice').value);
    const img = document.getElementById('bookImage').value.trim();
    const desc = document.getElementById('bookDesc').value.trim();

    if (!title || !author || !price || !img || !desc) {
      alert('Fill all fields');
      return;
    }

    const newBook = { title, author, price, img, desc };

    try {
      // Send book to backend API (MongoDB)
      const res = await fetch('http://localhost:5000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });
      const data = await res.json();

      if (res.ok) {
        alert('✅ Book added to MongoDB successfully!');
        form.reset();
        renderCombinedCatalog(); // refresh catalog to show new book
      } else {
        alert('❌ Failed to add book: ' + (data.error || data.message));
      }
    } catch (err) {
      console.error('Error adding book:', err);
      alert('❌ Could not contact server.');
    }
  });
}



// --- PAGE LOAD HINTS ---
window.onload = () => {
  const path = window.location.pathname;
  if (path.includes('index.html') || path.endsWith('/')) {
    renderCombinedCatalog();
  } else if (path.includes('cart.html')) {
    renderCart();
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.onclick = placeOrder;
  } else if (path.includes('admin.html')) {
    setupAdmin();
  } else if (path.includes('books-details.html')) {
    renderBookDetails();
  } else if (path.includes('orders.html')) {   // 👈 new part
    fetchMyOrders();
  }
  updateCartBadge();
};


console.log("Cleaned script loaded successfully");