const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');

// POST /api/auth/register — create org + owner account
router.post('/register', async (req, res) => {
  const { orgName, email, password, fullName } = req.body;
  if (!orgName || !email || !password || !fullName)
    return res.status(400).json({ error: 'All fields required' });

  const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const hash = await bcrypt.hash(password, 12);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const org = await client.query(
      `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
      [orgName, slug]
    );
    const orgId = org.rows[0].id;
    const user  = await client.query(
      `INSERT INTO users (org_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'owner') RETURNING id, email, full_name, role`,
      [orgId, email, hash, fullName]
    );
    await client.query('COMMIT');

    const token = jwt.sign(
      { userId: user.rows[0].id, orgId, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ token, user: user.rows[0], orgId });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email or org already exists' });
    throw err;
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, orgSlug } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const result = await db.query(
    `SELECT u.id, u.password_hash, u.full_name, u.role, u.org_id
     FROM users u
     JOIN organizations o ON o.id = u.org_id
     WHERE u.email = $1 AND ($2::text IS NULL OR o.slug = $2)`,
    [email, orgSlug || null]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user.id, orgId: user.org_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({ token, user: { id: user.id, fullName: user.full_name, role: user.role } });
});

module.exports = router;
