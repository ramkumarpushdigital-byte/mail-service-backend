import 'dotenv/config';    // ← MUST be first — loads .env before any other import reads process.env
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.mjs';
import userRoutes from './Routes/Users.mjs';
import { verifyConnection } from './utils/nodemailer.mjs';

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());
// connectDB();

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// ── Health check ──────────────────────────────────────────────────────────────
// GET /api/health — returns SMTP reachability status as JSON.
// Safe to call repeatedly; does NOT crash on failure.
app.get('/api/health', async (req, res) => {
  const result = await verifyConnection();
  if (result.success) {
    return res.status(200).json({ status: 'ok', smtp: 'connected' });
  } else {
    // Return 200 so the server is still considered "up" for platform health checks,
    // but include the SMTP error so callers know email is degraded.
    return res.status(200).json({ status: 'degraded', smtp: 'unreachable', error: result.error });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(userRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Server is running on port ${PORT}`);

  // Verify SMTP after startup — detects blocked Gmail on cloud hosts early.
  // Logs a warning but does NOT crash the server (health checks still work).
  console.log('[startup] Verifying SMTP connection...');
  const smtpStatus = await verifyConnection();
  if (smtpStatus.success) {
    console.log('[startup] ✅ SMTP connection verified — Gmail is reachable');
  } else {
    console.warn(`[startup] ⚠️  SMTP unreachable — email sending will fail: ${smtpStatus.error}`);
    console.warn('[startup] ⚠️  If deployed on Render/Railway, Gmail SMTP may be blocked by Google.');
  }
});