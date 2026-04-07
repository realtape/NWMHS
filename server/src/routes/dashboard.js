const router = require('express').Router();
const db     = require('../config/db');

// GET /api/dashboard — summary metrics for the org
router.get('/', async (req, res) => {
  const orgId = req.user.orgId;

  const [contacts, deals, tasks, pipeline, recentActivity] = await Promise.all([
    // Total contacts
    db.query(`SELECT COUNT(*) FROM contacts WHERE org_id = $1`, [orgId]),

    // Deals by stage
    db.query(
      `SELECT stage, COUNT(*) AS count, COALESCE(SUM(value),0) AS value
       FROM deals WHERE org_id = $1 GROUP BY stage`,
      [orgId]
    ),

    // Open tasks (due soon)
    db.query(
      `SELECT COUNT(*) FILTER (WHERE completed = false) AS open,
              COUNT(*) FILTER (WHERE completed = false AND due_date < NOW() + INTERVAL '3 days') AS due_soon
       FROM tasks WHERE org_id = $1`,
      [orgId]
    ),

    // Total pipeline value (excluding closed_lost)
    db.query(
      `SELECT COALESCE(SUM(value),0) AS total FROM deals
       WHERE org_id = $1 AND stage NOT IN ('closed_lost')`,
      [orgId]
    ),

    // Last 10 activities
    db.query(
      `SELECT a.*, u.full_name AS user_name FROM activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.org_id = $1
       ORDER BY a.created_at DESC LIMIT 10`,
      [orgId]
    )
  ]);

  res.json({
    contacts:       parseInt(contacts.rows[0].count),
    deals:          deals.rows,
    tasks:          tasks.rows[0],
    pipelineValue:  parseFloat(pipeline.rows[0].total),
    recentActivity: recentActivity.rows
  });
});

module.exports = router;
