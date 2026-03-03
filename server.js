/* ═══════════════════════════════════════════════════════════
   VELVET FLOW — server.js  (Payment Backend)
   ═══════════════════════════════════════════════════════════

   HOW TO SET UP (3 steps):

   STEP 1 — Install Node.js
     Download from: https://nodejs.org  (LTS version)

   STEP 2 — Install packages
     Open terminal in this folder and run:
       npm init -y
       npm install express razorpay cors dotenv nodemailer

   STEP 3 — Create a .env file in the same folder:
     RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
     RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
     EMAIL_USER=your@gmail.com
     EMAIL_PASS=your_gmail_app_password
     PORT=4000

     ▶ Razorpay keys: https://razorpay.com → Settings → API Keys
     ▶ Gmail App Password: https://myaccount.google.com → Security
       → 2-Step Verification → App passwords → Generate

   STEP 4 — Run the server:
       node server.js

   STEP 5 — Deploy to the internet (FREE):
     Option A — Render.com:
       1. Push this file to GitHub
       2. Go to render.com → New Web Service → Connect repo
       3. Add your .env values as Environment Variables
       4. Deploy → copy the URL into app.js BACKEND_URL

     Option B — Railway.app:
       1. Go to railway.app → New Project → Deploy from GitHub
       2. Add environment variables
       3. Deploy → copy URL into app.js BACKEND_URL

   ═══════════════════════════════════════════════════════════ */

require('dotenv').config();

const express    = require('express');
const Razorpay   = require('razorpay');
const crypto     = require('crypto');
const cors       = require('cors');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── MIDDLEWARE ───────────────────────────────────────────── */
app.use(cors());                         // Allow requests from your website
app.use(express.json());                 // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

/* ── RAZORPAY INSTANCE ────────────────────────────────────── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── EMAIL TRANSPORTER ────────────────────────────────────── */
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,    // Gmail App Password (not your real password)
  },
});

/* ═══════════════════════════════════════════════════════════
   ROUTES
   ═══════════════════════════════════════════════════════════ */

/* Health check ─────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.json({ status: 'VELVET FLOW backend is running 🍫' });
});

/* ── POST /create-order ───────────────────────────────────── */
/*
   Called by app.js before opening Razorpay checkout.
   Creates an order on Razorpay's server and returns the order ID.
*/
app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', customer, items } = req.body;

    // Validate
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount:   Math.round(amount),   // amount in paise
      currency: currency,
      receipt:  'vf_' + Date.now(),
      notes: {
        customer_name:  customer?.name  || '',
        customer_email: customer?.email || '',
        customer_phone: customer?.phone || '',
      }
    };

    const order = await razorpay.orders.create(options);

    console.log(`✅ Order created: ${order.id} | ₹${amount/100}`);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });

  } catch (err) {
    console.error('❌ Create order error:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

/* ── POST /verify-payment ─────────────────────────────────── */
/*
   Called after successful Razorpay payment.
   Verifies the payment signature to confirm it's genuine,
   then sends confirmation emails to both customer & shop owner.
*/
app.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      items,
      totalAmount
    } = req.body;

    /* ── 1. Verify signature (cryptographic proof from Razorpay) ── */
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.warn('⚠️ Signature mismatch — possible fraud attempt');
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    console.log(`✅ Payment verified: ${razorpay_payment_id} | ₹${totalAmount}`);

    /* ── 2. Build order summary HTML for emails ── */
    const itemsHTML = (items || []).map(i =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #3d1f00">${i.name}</td>
        <td style="padding:8px;border-bottom:1px solid #3d1f00;text-align:center">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #3d1f00;text-align:right">₹${i.price * i.quantity}</td>
      </tr>`
    ).join('');

    const orderDate = new Date().toLocaleString('en-IN', { timeZone:'Asia/Kolkata' });

    /* ── 3. Email to CUSTOMER ── */
    const customerEmail = {
      from:    `"VELVET FLOW" <${process.env.EMAIL_USER}>`,
      to:      customer.email,
      subject: `🍫 Order Confirmed — Payment ID: ${razorpay_payment_id}`,
      html: `
        <div style="font-family:Georgia,serif;background:#1a0a00;color:#fdf3e3;padding:40px;max-width:600px;margin:0 auto">
          <h1 style="font-size:2rem;color:#e8a04b;letter-spacing:0.2em">VELVET FLOW</h1>
          <h2 style="color:#fdf3e3;margin-top:24px">🎉 Your order is confirmed!</h2>
          <p style="color:rgba(253,243,227,0.8);line-height:1.8">
            Hi <strong>${customer.name}</strong>,<br>
            Thank you for your order. Your chocolates are being lovingly packed and will be dispatched within 24 hours!
          </p>
          <div style="background:#3d1f00;padding:20px;margin:24px 0;border-left:4px solid #e8a04b">
            <p style="margin:0;color:#e8a04b;font-size:0.85rem;letter-spacing:0.2em">PAYMENT ID</p>
            <p style="margin:4px 0 0;font-size:1.1rem">${razorpay_payment_id}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead>
              <tr style="background:#3d1f00">
                <th style="padding:10px;text-align:left;color:#e8a04b">Item</th>
                <th style="padding:10px;text-align:center;color:#e8a04b">Qty</th>
                <th style="padding:10px;text-align:right;color:#e8a04b">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px;font-weight:bold;color:#e8a04b">Total</td>
                <td style="padding:12px;text-align:right;font-weight:bold;color:#e8a04b">₹${totalAmount}</td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top:24px;padding:16px;background:#3d1f00">
            <p style="margin:0;color:#e8a04b;font-size:0.85rem">DELIVERY ADDRESS</p>
            <p style="margin:4px 0 0;color:rgba(253,243,227,0.8)">${customer.address}</p>
          </div>
          <p style="margin-top:32px;color:rgba(253,243,227,0.5);font-size:0.85rem">
            Ordered on: ${orderDate}<br>
            Questions? Email us at hello@velvetflow.com
          </p>
        </div>`
    };

    /* ── 4. Alert email to SHOP OWNER ── */
    const ownerEmail = {
      from:    `"VELVET FLOW Orders" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_USER,
      subject: `🛒 New Order ₹${totalAmount} — ${customer.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>New Order Received!</h2>
          <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
          <p><strong>Amount:</strong> ₹${totalAmount}</p>
          <hr>
          <h3>Customer Details</h3>
          <p><strong>Name:</strong> ${customer.name}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Phone:</strong> ${customer.phone}</p>
          <p><strong>Address:</strong> ${customer.address}</p>
          <hr>
          <h3>Items Ordered</h3>
          <ul>${(items||[]).map(i=>`<li>${i.name} × ${i.quantity} — ₹${i.price*i.quantity}</li>`).join('')}</ul>
          <p style="color:green"><strong>Total: ₹${totalAmount}</strong></p>
          <p style="color:#888;font-size:0.85rem">Received at: ${orderDate}</p>
        </div>`
    };

    /* ── 5. Send both emails ── */
    await Promise.all([
      mailer.sendMail(customerEmail),
      mailer.sendMail(ownerEmail)
    ]);

    console.log(`📧 Confirmation emails sent to ${customer.email}`);

    res.json({ success: true, paymentId: razorpay_payment_id });

  } catch (err) {
    console.error('❌ Verify payment error:', err);
    res.status(500).json({ success: false, error: 'Verification failed', details: err.message });
  }
});

/* ── POST /contact ────────────────────────────────────────── */
/*
   Optional: receive contact form submissions via API
   (Netlify Forms handles this automatically if deployed on Netlify)
*/
app.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const mail = {
      from:    `"VELVET FLOW Contact" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_USER,
      subject: `📬 Contact Form: ${subject || 'General Enquiry'} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>New Contact Message</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr>
          <p>${message}</p>
        </div>`
    };

    await mailer.sendMail(mail);
    res.json({ success: true });

  } catch (err) {
    console.error('Contact email error:', err);
    res.status(500).json({ success: false });
  }
});

/* ── START SERVER ─────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🍫 VELVET FLOW backend running on http://localhost:${PORT}`);
  console.log(`   POST /create-order   — create Razorpay order`);
  console.log(`   POST /verify-payment — verify & send emails`);
  console.log(`   POST /contact        — contact form\n`);
});
