const router = require('express').Router();
const db     = require('../config/db');

// GET /api/contacts
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [req.user.orgId, limit, offset];
  let where = 'WHERE c.org_id = $1';

  if (search) {
    where += ` AND (c.email ILIKE $4 OR c.first_name ILIKE $4 OR c.last_name ILIKE $4 OR c.company ILIKE $4)`;
    params.push(`%${search}%`);
  }

  const { rows } = await db.query(
    `SELECT c.*, u.full_name AS owner_name
     FROM contacts c
     LEFT JOIN users u ON u.id = c.owner_id
     ${where}
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    params
  );
  res.json(rows);
});

// GET /api/contacts/:id
router.get('/:id', async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, u.full_name AS owner_name FROM contacts c
     LEFT JOIN users u ON u.id = c.owner_id
     WHERE c.id = $1 AND c.org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST /api/contacts
router.post('/', async (req, res) => {
  const { email, firstName, lastName, phone, company, notes } = req.body;
  const { rows } = await db.query(
    `INSERT INTO contacts (org_id, email, first_name, last_name, phone, company, notes, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, email, firstName, lastName, phone, company, notes, req.user.userId]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/contacts/:id
router.patch('/:id', async (req, res) => {
  const fields  = ['email','first_name','last_name','phone','company','notes','owner_id'];
  const updates = [];
  const params  = [req.params.id, req.user.orgId];

  const map = { firstName:'first_name', lastName:'last_name', ownerId:'owner_id' };
  for (const [k, v] of Object.entries(req.body)) {
    const col = map[k] || k;
    if (fields.includes(col)) { updates.push(`${col} = $${params.length + 1}`); params.push(v); }
  }

  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  updates.push(`updated_at = NOW()`);

  const { rows } = await db.query(
    `UPDATE contacts SET ${updates.join(', ')} WHERE id = $1 AND org_id = $2 RETURNING *`,
    params
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res) => {
  await db.query(`DELETE FROM contacts WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.status(204).end();
});

module.exports = router;
