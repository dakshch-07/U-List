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

// Serve uploaded static assets
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Serve Admin Web Panel build
const adminDistDir = path.join(__dirname, '../../admin/dist');
app.use('/admin', express.static(adminDistDir));

// Serve Main Marketplace Web App directly from backend
const appPublicDir = path.join(__dirname, '../public');
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

// Fallback for single page app routing
app.get('*', (_req, res) => {
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
  
  // Auto-seed if database is empty
  const count = await Ad.countDocuments();
  if (count === 0) {
    console.log('[Bootstrap] No existing ads detected. Running initial seed...');
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
