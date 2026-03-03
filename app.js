/* ═══════════════════════════════════════════════════════════
   VELVET FLOW — app.js
   ═══════════════════════════════════════════════════════════

   ┌─────────────────────────────────────────────────────────┐
   │  SETUP — Replace these 2 values with your own keys      │
   │                                                         │
   │  RAZORPAY_KEY_ID:                                       │
   │    1. Sign up at https://razorpay.com                   │
   │    2. Go to Settings → API Keys → Generate Test Key     │
   │    3. Copy the "Key ID" (starts with rzp_test_...)      │
   │    4. When ready for real money use rzp_live_...        │
   │                                                         │
   │  BACKEND_URL:                                           │
   │    After deploying server.js to Render / Railway        │
   │    copy the URL they give you (e.g. https://xyz.onrender│
   │    .com) and paste it below                             │
   └─────────────────────────────────────────────────────────┘ */

const RAZORPAY_KEY_ID = 'rzp_test_SMfFzQh1V6j3ur';
const BACKEND_URL     = 'https://velvet-flow.onrender.com';   // e.g. https://velvetflow-api.onrender.com

/* ── PRODUCTS ─────────────────────────────────────────────── */
const PRODUCTS = [
  { name:'Dark Noir 85%',    desc:'Intensely rich single-origin cacao with earthy undertones.',          price:15, tag:'Bestseller', e:'🍫' },
  { name:'Hazelnut Dream',   desc:'Milk chocolate enrobing whole roasted hazelnuts with sea salt.',      price:25, tag:'New',        e:'🌰' },
  { name:'Truffle Box',      desc:'Nine handcrafted truffles dusted in premium cocoa.',                  price:45, tag:'Gift Pick',  e:'🎁' },
  { name:'Raspberry Rose',   desc:'White chocolate with freeze-dried raspberry and rose petals.',        price:35, tag:'Limited',    e:'🌹' },
  { name:'Sea Salt Caramel', desc:'Silky caramel enrobed in 70% dark with Fleur de Sel.',               price:30, tag:'Classic',    e:'🍮' },
  { name:'Vegan Bliss Box',  desc:'Entirely plant-based. Six flavors, zero dairy, all indulgence.',     price:40, tag:'Vegan',      e:'🌱' },
];

/* ── CART STATE ───────────────────────────────────────────── */
let cart = {};

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initParticles();
  buildProductGrid();
  initReveal();
  initCounters();
});

/* ── CURSOR ───────────────────────────────────────────────── */
function initCursor() {
  const cur    = document.getElementById('cur');
  const curDot = document.getElementById('curDot');
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    curDot.style.left = mx+'px';
    curDot.style.top  = my+'px';
  });
  (function loop(){
    cx += (mx-cx)*.15;
    cy += (my-cy)*.15;
    cur.style.left = cx+'px';
    cur.style.top  = cy+'px';
    requestAnimationFrame(loop);
  })();
  bindHover();
}

function bindHover() {
  document.querySelectorAll('a,button,.card,.addbtn,.qbtn,.rmbtn,.iitem,.rcard').forEach(el => {
    el.addEventListener('mouseenter', () => document.getElementById('cur').classList.add('big'));
    el.addEventListener('mouseleave', () => document.getElementById('cur').classList.remove('big'));
  });
}

/* ── PARTICLES ────────────────────────────────────────────── */
function initParticles() {
  const container = document.getElementById('pts');
  const colors    = ['#e8a04b','#c4622d','#6b3a1f','#fdf3e3','#ff9a3c'];
  colors.forEach(c => {
    for (let j=0; j<6; j++) {
      const p = document.createElement('div');
      p.className = 'pt';
      const s = Math.random()*8+2;
      p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;background:${c};animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*15}s;`;
      container.appendChild(p);
    }
  });
}

/* ── PRODUCTS GRID ────────────────────────────────────────── */
function buildProductGrid() {
  const grid = document.getElementById('pgrid');
  PRODUCTS.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = (i*.1)+'s';
    card.innerHTML = `
      <div class="shine"></div>
      <div class="cimg">
        <span class="cemoji">${p.e}</span>
        <div class="ctag">${p.tag}</div>
      </div>
      <div class="cbody">
        <div class="cname">${p.name}</div>
        <div class="cdesc">${p.desc}</div>
        <div class="cfoot">
          <div class="cprice"><small>₹</small>${p.price}</div>
          <button class="addbtn" aria-label="Add to cart">+</button>
        </div>
      </div>`;
    card.querySelector('.addbtn').addEventListener('click', function(){ addToCart(i, this); });
    grid.appendChild(card);
  });
}

/* ── CART FUNCTIONS ───────────────────────────────────────── */
function addToCart(idx, btn) {
  cart[idx] = (cart[idx] || 0) + 1;
  updateBadge();
  if (btn) { btn.textContent = '✓'; setTimeout(() => btn.textContent = '+', 1200); }
  toast('🍫 ' + PRODUCTS[idx].name + ' added to cart!');
}

function updateBadge() {
  const total = Object.values(cart).reduce((a,b) => a+b, 0);
  const b = document.getElementById('badge');
  b.textContent = total;
  b.classList.remove('pop');
  void b.offsetWidth;
  b.classList.add('pop');
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  const keys = Object.keys(cart).filter(k => cart[k] > 0);

  if (!keys.length) {
    body.innerHTML = '<div class="cempty">Your cart is empty 🍫<br><small>Add some chocolates!</small></div>';
    foot.style.display = 'none';
    return;
  }

  let total = 0;
  body.innerHTML = keys.map(idx => {
    const p = PRODUCTS[idx], q = cart[idx];
    total += p.price * q;
    return `<div class="ci">
      <div class="ciemoji">${p.e}</div>
      <div class="ciinfo">
        <div class="ciname">${p.name}</div>
        <div class="ciprice">₹${p.price * q}</div>
      </div>
      <div class="ciqty">
        <button class="qbtn" onclick="chgQty(${idx},-1)">−</button>
        <span class="qnum">${q}</span>
        <button class="qbtn" onclick="chgQty(${idx},1)">+</button>
      </div>
      <button class="rmbtn" onclick="rmItem(${idx})">🗑</button>
    </div>`;
  }).join('');

  document.getElementById('ctotal').textContent = '₹' + total;
  foot.style.display = 'block';
  bindHover();
}

function chgQty(idx, d) {
  cart[idx] = (cart[idx]||0) + d;
  if (cart[idx] <= 0) delete cart[idx];
  updateBadge();
  renderCart();
}

function rmItem(idx) {
  delete cart[idx];
  updateBadge();
  renderCart();
}

/* ── CHECKOUT ─────────────────────────────────────────────── */
function openCheckout() {
  if (!Object.keys(cart).length) { toast('⚠️ Your cart is empty!'); return; }
  closeM('mCart');
  renderOrderSummary();
  openM('mCheckout');
}

function renderOrderSummary() {
  const box  = document.getElementById('orderSummaryBox');
  const keys = Object.keys(cart).filter(k => cart[k] > 0);
  let total  = 0;
  const rows = keys.map(idx => {
    const p = PRODUCTS[idx], q = cart[idx];
    total += p.price * q;
    return `<div class="os-item"><span>${p.e} ${p.name} × ${q}</span><span>₹${p.price*q}</span></div>`;
  }).join('');
  box.innerHTML = `<div class="order-summary">${rows}<div class="os-total"><span>Total</span><span>₹${total}</span></div></div>`;
}

function getTotal() {
  return Object.keys(cart).filter(k=>cart[k]>0).reduce((sum,idx) => sum + PRODUCTS[idx].price * cart[idx], 0);
}

/* ── RAZORPAY PAYMENT ─────────────────────────────────────── */
async function startPayment() {
  // Validate form
  const name  = document.getElementById('coName').value.trim();
  const email = document.getElementById('coEmail').value.trim();
  const phone = document.getElementById('coPhone').value.trim();
  const addr  = document.getElementById('coAddr').value.trim();
  const city  = document.getElementById('coCity').value.trim();
  const pin   = document.getElementById('coPin').value.trim();

  if (!name)  { toast('⚠️ Please enter your full name!');    return; }
  if (!email || !email.includes('@')) { toast('⚠️ Please enter a valid email!'); return; }
  if (!phone || phone.length < 10)    { toast('⚠️ Please enter a valid phone number!'); return; }
  if (!addr)  { toast('⚠️ Please enter your delivery address!'); return; }
  if (!city)  { toast('⚠️ Please enter your city!');         return; }
  if (!pin || pin.length < 6) { toast('⚠️ Please enter a valid pincode!'); return; }

  const totalAmount = getTotal();
  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.innerHTML = '<span id="payBtnTxt">Creating order...</span>';

  try {
    /* ── STEP 1: Create Razorpay order on backend ── */
    const res = await fetch(`${BACKEND_URL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:      totalAmount * 100,   // Razorpay wants paise (₹1 = 100 paise)
        currency:    'INR',
        customer: { name, email, phone, address:`${addr}, ${city} - ${pin}` },
        items: Object.keys(cart).filter(k=>cart[k]>0).map(idx => ({
          name:     PRODUCTS[idx].name,
          quantity: cart[idx],
          price:    PRODUCTS[idx].price
        }))
      })
    });

    const data = await res.json();

    if (!data.orderId) {
      toast('❌ Could not create order. Check backend URL.');
      btn.disabled = false;
      btn.innerHTML = '<span>Pay with Razorpay 🔒</span>';
      return;
    }

    /* ── STEP 2: Open Razorpay Checkout ── */
    const options = {
      key:          RAZORPAY_KEY_ID,
      amount:       totalAmount * 100,
      currency:     'INR',
      name:         'VELVET FLOW',
      description:  'Artisan Chocolates Order',
      order_id:     data.orderId,
      prefill: {
        name:    name,
        email:   email,
        contact: phone,
      },
      theme: { color: '#e8a04b' },

      handler: async function(response) {
        /* ── STEP 3: Verify payment on backend ── */
        const verifyRes = await fetch(`${BACKEND_URL}/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            customer: { name, email, phone, address:`${addr}, ${city} - ${pin}` },
            items: Object.keys(cart).filter(k=>cart[k]>0).map(idx => ({
              name:     PRODUCTS[idx].name,
              quantity: cart[idx],
              price:    PRODUCTS[idx].price
            })),
            totalAmount
          })
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          closeM('mCheckout');
          cart = {};
          updateBadge();
          document.getElementById('orderNum').textContent = 'Order #VF-' + Math.floor(10000 + Math.random()*90000);
          setTimeout(() => openM('mOrder'), 300);
        } else {
          toast('❌ Payment verification failed. Contact support.');
        }
      },

      modal: {
        ondismiss: function() {
          btn.disabled = false;
          btn.innerHTML = '<span>Pay with Razorpay 🔒</span>';
          toast('Payment cancelled.');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
      toast('❌ Payment failed: ' + response.error.description);
      btn.disabled = false;
      btn.innerHTML = '<span>Pay with Razorpay 🔒</span>';
    });
    rzp.open();

  } catch (err) {
    console.error('Payment error:', err);
    toast('❌ Error connecting to backend. Is server.js running?');
    btn.disabled = false;
    btn.innerHTML = '<span>Pay with Razorpay 🔒</span>';
  }
}

/* ── NEWSLETTER ───────────────────────────────────────────── */
async function handleNL(e) {
  e.preventDefault();
  const email = document.getElementById('nlEmail').value.trim();
  if (!email || !email.includes('@')) { toast('⚠️ Please enter a valid email!'); return; }

  // Submit to Netlify Forms
  const form = e.target;
  const formData = new FormData(form);
  await fetch('/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: new URLSearchParams(formData).toString() });

  toast('🎉 Welcome to the VELVET FLOW family!');
  form.reset();
}

/* ── CONTACT FORM ─────────────────────────────────────────── */
async function handleContact(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  // Submit to Netlify Forms
  await fetch('/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: new URLSearchParams(formData).toString() });

  toast('✅ Message sent! We\'ll reply within 24 hours.');
  closeM('mContact');
  form.reset();
}

/* ── MODALS ───────────────────────────────────────────────── */
function openM(id) {
  if (id === 'mCart') renderCart();
  document.getElementById(id).classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeM(id) {
  document.getElementById(id).classList.remove('on');
  document.body.style.overflow = '';
}
function outsideClose(e, id) {
  if (e.target === document.getElementById(id)) closeM(id);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.moverlay.on').forEach(m => {
      m.classList.remove('on');
      document.body.style.overflow = '';
    });
  }
});

/* ── TOAST ────────────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── SMOOTH SCROLL ────────────────────────────────────────── */
function go(sel, e) {
  if (e) e.preventDefault();
  const el = document.querySelector(sel);
  if (el) el.scrollIntoView({ behavior:'smooth' });
}

/* ── SCROLL REVEAL ────────────────────────────────────────── */
function initReveal() {
  const rvObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('vis');
  }), { threshold:.1 });
  document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));

  const cardObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('vis');
  }), { threshold:.1 });
  document.querySelectorAll('.card').forEach(el => cardObs.observe(el));
}

/* ── STAT COUNTERS ────────────────────────────────────────── */
function initCounters() {
  function countUp(el, target, suffix='') {
    let s = 0; const dur = 2000;
    (function step(ts) {
      if (!s) s = ts;
      const p = Math.min((ts-s)/dur, 1);
      const ease = 1 - Math.pow(1-p, 3);
      el.textContent = Math.floor(ease*target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  const statObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        countUp(document.getElementById('s1'), 48);
        countUp(document.getElementById('s2'), 12, 'K+');
        countUp(document.getElementById('s3'), 23);
        statObs.disconnect();
      }
    });
  }, { threshold:.5 });

  const featEl = document.getElementById('featured');
  if (featEl) statObs.observe(featEl);
}
