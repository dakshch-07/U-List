import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';
import apiRoutes from './routes/api';
import { runSeed } from './scripts/seed';
import { Ad } from './models/Ad';
import { initExpiryCron } from './services/expiryCron';
import { generalApiLimiter } from './middleware/rateLimiters';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', generalApiLimiter);

// Robust static folder resolution whether running via tsx in root/backend or node in dist
const findFolder = (folderName: string): string => {
  const candidates = [
    path.join(process.cwd(), folderName),
    path.join(process.cwd(), 'backend', folderName),
    path.join(__dirname, '..', folderName),
    path.join(__dirname, '../..', folderName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.join(process.cwd(), folderName);
};

const adminDistDir = findFolder('admin-dist');
const appPublicDir = findFolder('public');
const uploadsDir = findFolder('uploads');

console.log('[Server Paths] adminDistDir:', adminDistDir, 'exists:', fs.existsSync(adminDistDir));
console.log('[Server Paths] appPublicDir:', appPublicDir, 'exists:', fs.existsSync(appPublicDir));

// Serve uploaded static assets
app.use('/uploads', express.static(uploadsDir));

// Serve Admin Web Panel build
app.use('/admin', express.static(adminDistDir));
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(adminDistDir, 'index.html'));
});
app.get('/admin/{*splat}', (_req, res) => {
  res.sendFile(path.join(adminDistDir, 'index.html'));
});

// Debug endpoint to verify live server filesystem on Render
app.get('/api/debug-paths', async (_req, res) => {
  const { User } = await import('./models/User');
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ulist.in').toLowerCase();
  const foundAdmin = await User.findOne({ email: adminEmail });
  
  res.json({
    cwd: process.cwd(),
    __dirname,
    adminDistDir,
    adminExists: fs.existsSync(adminDistDir),
    adminFiles: fs.existsSync(adminDistDir) ? fs.readdirSync(adminDistDir) : [],
    appPublicDir,
    publicExists: fs.existsSync(appPublicDir),
    publicFiles: fs.existsSync(appPublicDir) ? fs.readdirSync(appPublicDir) : [],
    adminEmail,
    adminInDb: !!foundAdmin,
    adminRole: foundAdmin?.role,
    envAdminPasswordLength: (process.env.ADMIN_PASSWORD || 'AdminUlist#2026').length,
    envAdminEmail: process.env.ADMIN_EMAIL || 'admin@ulist.in',
  });
});

// Serve Main Marketplace Web App directly from backend
app.use(express.static(appPublicDir));

// API version 1 routing
app.use('/api/v1', apiRoutes);

// Static compliance pages for Google Play Store requirements
app.get('/privacy', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Ulist - Privacy Policy</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;color:#1b1b1b;}</style></head>
    <body>
      <h1>Privacy Policy for Ulist</h1>
      <p>Last updated: October 2026</p>
      <p>Ulist values your personal privacy. We collect your mobile number, email, and approximate locality strictly to provide marketplace listing services, authentic user verification, and direct buyer-seller communications.</p>
      <h3>Data Security</h3>
      <p>We do not sell user data. User account deletion can be initiated instantly within the app under Profile -> Delete Account or via our web portal.</p>
    </body>
    </html>
  `);
});

app.get('/terms', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Ulist - Terms of Service</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;color:#1b1b1b;}</style></head>
    <body>
      <h1>Terms & Conditions</h1>
      <p>By registering on Ulist, you agree not to post fraudulent listings, illegal substances, or infringing intellectual property. Violators will face immediate profile suspension.</p>
    </body>
    </html>
  `);
});

app.get('/about', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>About Us | Ulist Marketplace</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.7; padding: 0 20px; color: #1b1b1b; }
        h1 { color: #D9480F; }
        .feature-box { background: #FAF5F2; border-left: 4px solid #D9480F; padding: 14px 18px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>About Ulist</h1>
      <p><strong>Ulist</strong> is India's fast, modern, and transparent classifieds marketplace connecting genuine local buyers and sellers across Cars, Bikes, Real Estate, Mobiles, Electronics, Jobs, and Services.</p>
      
      <div class="feature-box">
        <h3>Why Choose Ulist?</h3>
        <ul>
          <li><strong>Direct Verified Connections:</strong> Instant chat, call, and WhatsApp connecting buyer and seller.</li>
          <li><strong>30-Day Listing Validity:</strong> Every ad stays live for 30 days. Easily reactivate when needed.</li>
          <li><strong>5 Free Ads:</strong> Every user can post up to 5 free ads in any category with photo uploads.</li>
          <li><strong>Safe Trading:</strong> Built-in Buyer Guidelines & Safety Tips to protect your transactions.</li>
        </ul>
      </div>

      <p>For inquiries, feedback, or support, visit our in-app <strong>Help & Contact Us</strong> or email us at <a href="mailto:support@ulist.in">support@ulist.in</a>.</p>
    </body>
    </html>
  `);
});

app.get('/delete-account', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Ulist - Account & Data Deletion</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;color:#1b1b1b;}</style></head>
    <body>
      <h1>Request Account and Data Deletion</h1>
      <p>If you wish to remove your Ulist account and all associated classified listings and media from our servers, you can:</p>
      <ol>
        <li>Open the <strong>Ulist Mobile App</strong> -> navigate to <strong>Account</strong> -> tap <strong>Delete Account</strong>.</li>
        <li>Or email us directly from your registered email address at <a href="mailto:support@ulist.in">support@ulist.in</a> with the subject "Delete Account". All records will be cleared within 48 hours.</li>
      </ol>
    </body>
    </html>
  `);
});

// Short link redirect: /ad/:id or /a/:id -> opens listing on Web or deep-links
app.get(['/ad/:id', '/a/:id'], async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Ad.findById(adId).lean();
    if (!ad) {
      return res.redirect('/');
    }
    const safeTitle = (ad.title || 'Ulist Listing').replace(/"/g, '&quot;');
    const safePrice = ad.price ? `₹${ad.price.toLocaleString('en-IN')}` : '';
    const safeDesc = (ad.description || `View ${safeTitle} on Ulist`).slice(0, 150).replace(/"/g, '&quot;');
    const safeImage = ad.images?.[0]?.url || 'https://u-list-api.onrender.com/assets/icon.png';
    const targetUrl = `https://u-list-app.vercel.app/?adId=${adId}`;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${safeTitle} ${safePrice ? `- ${safePrice}` : ''} | Ulist</title>
        <meta name="description" content="${safeDesc}">
        <meta property="og:title" content="${safeTitle} ${safePrice ? `for ${safePrice}` : ''}">
        <meta property="og:description" content="${safeDesc}">
        <meta property="og:image" content="${safeImage}">
        <meta property="og:url" content="${targetUrl}">
        <meta property="og:type" content="product">
        <meta name="twitter:card" content="summary_large_image">
        <script>
          window.location.replace("${targetUrl}");
        </script>
      </head>
      <body>
        <p>Redirecting to listing... <a href="${targetUrl}">Click here if not redirected</a>.</p>
      </body>
      </html>
    `);
  } catch (e) {
    res.redirect('/');
  }
});

// Fallback for single page app routing in Express 5
app.get('/{*splat}', (_req, res) => {
  const indexHtml = path.join(appPublicDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Not Found');
  }
});

// Socket.io for Realtime Chat
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(`user_${userId}`);
  }

  socket.on('join_conversation', (convId) => {
    socket.join(`conv_${convId}`);
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

export { io };

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  
  // Initialize ad expiry cron scheduler
  initExpiryCron();
  
  // Ensure Admin user always exists with current credentials on startup
  const bcryptMod = await import('bcrypt');
  const bcryptFn = (bcryptMod as any).default || bcryptMod;
  const { User } = await import('./models/User');
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ulist.in').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminUlist#2026';
  
  let admin = await User.findOne({ email: adminEmail });
  const passwordHash = await bcryptFn.hash(adminPassword, 10);
  if (!admin) {
    await User.create({
      name: 'Ulist Administrator',
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '+919876543210',
      passwordHash,
      role: 'admin',
      status: 'active',
    });
    console.log('[Bootstrap] Admin user initialized:', adminEmail);
  } else {
    admin.passwordHash = passwordHash;
    admin.role = 'admin';
    admin.status = 'active';
    await admin.save();
    console.log('[Bootstrap] Admin password synced for:', adminEmail);
  }

  // Check if seed update is needed (e.g. realistic images across all 12 categories)
  const count = await Ad.countDocuments();
  const needsReSeed = await Ad.findOne({ 'images.publicId': 'demo_1' });
  if (count === 0 || needsReSeed) {
    console.log('[Bootstrap] Running initial/refreshed seed with realistic category images...');
    await runSeed();
  }

  server.listen(PORT, () => {
    console.log(`[Ulist Backend] Server listening on http://localhost:${PORT}`);
    console.log(`[Ulist Backend] Health check: http://localhost:${PORT}/api/v1/categories`);
  });
}

startServer().catch((err) => {
  console.error('[Ulist Backend] Initialization failed:', err);
});
