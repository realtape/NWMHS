require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const auth        = require('./middleware/auth');

const authRoutes      = require('./routes/auth');
const contactRoutes   = require('./routes/contacts');
const dealRoutes      = require('./routes/deals');
const taskRoutes      = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/contacts',  auth, contactRoutes);
app.use('/api/deals',     auth, dealRoutes);
app.use('/api/tasks',     auth, taskRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// Temp setup check — remove after onboarding
app.get('/api/setup-status', async (req, res) => {
  if (req.query.key !== 'NWMHS2026setup') return res.status(403).json({ error: 'forbidden' });
  const db = require('./config/db');
  const orgs  = await db.query('SELECT id, name, slug FROM organizations LIMIT 10');
  const users = await db.query('SELECT id, email, role, org_id FROM users LIMIT 10');
  res.json({ orgs: orgs.rows, users: users.rows });
});

// ── Error handler ──────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`NWMHS CRM API running on :${PORT}`));
