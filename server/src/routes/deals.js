const router = require('express').Router();
const db     = require('../config/db');

const STAGES = ['lead','qualified','proposal','negotiation','closed_won','closed_lost'];

// GET /api/deals  (optionally ?stage=lead&contactId=uuid)
router.get('/', async (req, res) => {
  const { stage, contactId } = req.query;
  const params = [req.user.orgId];
  const conds  = ['d.org_id = $1'];

  if (stage && STAGES.includes(stage)) { conds.push(`d.stage = $${params.length+1}`); params.push(stage); }
  if (contactId)                        { conds.push(`d.contact_id = $${params.length+1}`); params.push(contactId); }

  const { rows } = await db.query(
    `SELECT d.*, c.first_name || ' ' || c.last_name AS contact_name, u.full_name AS owner_name
     FROM deals d
     LEFT JOIN contacts c ON c.id = d.contact_id
     LEFT JOIN users u    ON u.id = d.owner_id
     WHERE ${conds.join(' AND ')}
     ORDER BY d.created_at DESC`,
    params
  );
  res.json(rows);
});

// POST /api/deals
router.post('/', async (req, res) => {
  const { title, contactId, value, stage = 'lead', closeDate, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const { rows } = await db.query(
    `INSERT INTO deals (org_id, title, contact_id, value, stage, close_date, notes, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, title, contactId||null, value||0, stage, closeDate||null, notes||null, req.user.userId]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/deals/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['title','value','stage','close_date','notes','contact_id','owner_id'];
  const updates = [];
  const params  = [req.params.id, req.user.orgId];

  const map = { closeDate:'close_date', contactId:'contact_id', ownerId:'owner_id' };
  for (const [k, v] of Object.entries(req.body)) {
    const col = map[k] || k;
    if (allowed.includes(col)) { updates.push(`${col} = $${params.length+1}`); params.push(v); }
  }

  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  updates.push(`updated_at = NOW()`);

  const { rows } = await db.query(
    `UPDATE deals SET ${updates.join(', ')} WHERE id = $1 AND org_id = $2 RETURNING *`, params
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// DELETE /api/deals/:id
router.delete('/:id', async (req, res) => {
  await db.query(`DELETE FROM deals WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.status(204).end();
});

module.exports = router;
