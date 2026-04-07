const router = require('express').Router();
const db     = require('../config/db');

// GET /api/tasks?completed=false&contactId=&dealId=
router.get('/', async (req, res) => {
  const { completed, contactId, dealId } = req.query;
  const params = [req.user.orgId];
  const conds  = ['t.org_id = $1'];

  if (completed !== undefined) { conds.push(`t.completed = $${params.length+1}`); params.push(completed === 'true'); }
  if (contactId)               { conds.push(`t.contact_id = $${params.length+1}`); params.push(contactId); }
  if (dealId)                  { conds.push(`t.deal_id = $${params.length+1}`); params.push(dealId); }

  const { rows } = await db.query(
    `SELECT t.*, u.full_name AS assignee_name FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE ${conds.join(' AND ')}
     ORDER BY t.due_date ASC NULLS LAST`,
    params
  );
  res.json(rows);
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const { title, description, dueDate, contactId, dealId, assigneeId } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const { rows } = await db.query(
    `INSERT INTO tasks (org_id, title, description, due_date, contact_id, deal_id, assignee_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, title, description||null, dueDate||null, contactId||null, dealId||null, assigneeId||req.user.userId]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/tasks/:id  (also used to mark complete)
router.patch('/:id', async (req, res) => {
  const allowed = ['title','description','due_date','completed','assignee_id','contact_id','deal_id'];
  const updates = [];
  const params  = [req.params.id, req.user.orgId];

  const map = { dueDate:'due_date', assigneeId:'assignee_id', contactId:'contact_id', dealId:'deal_id' };
  for (const [k, v] of Object.entries(req.body)) {
    const col = map[k] || k;
    if (allowed.includes(col)) { updates.push(`${col} = $${params.length+1}`); params.push(v); }
  }

  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });

  const { rows } = await db.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $1 AND org_id = $2 RETURNING *`, params
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  await db.query(`DELETE FROM tasks WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.status(204).end();
});

module.exports = router;
