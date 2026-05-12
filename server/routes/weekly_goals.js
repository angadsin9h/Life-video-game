const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS weekly_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'work',
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(week_start, position)
  )
`).run();

function getWeekStart(date) {
  const d = new Date(date + 'T00:00:00');
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().split('T')[0];
}

// GET /:weekStart — get goals for a week
router.get('/:weekStart', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM weekly_goals WHERE week_start = ? ORDER BY position ASC').all(req.params.weekStart);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /current/week — current week goals
router.get('/current/week', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart(today);
    const rows = db.prepare('SELECT * FROM weekly_goals WHERE week_start = ? ORDER BY position ASC').all(weekStart);
    res.json({ weekStart, goals: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — add goal (max 3 per week)
router.post('/', (req, res) => {
  try {
    const { week_start, text, category = 'work', position = 0 } = req.body;
    if (!week_start || !text) return res.status(400).json({ error: 'week_start and text required' });
    const count = db.prepare('SELECT COUNT(*) as c FROM weekly_goals WHERE week_start = ?').get(week_start).c;
    if (count >= 3) return res.status(400).json({ error: 'max 3 goals per week' });
    const result = db.prepare('INSERT INTO weekly_goals (week_start, position, text, category) VALUES (?, ?, ?, ?)').run(week_start, position, text.slice(0, 150), category);
    res.json(db.prepare('SELECT * FROM weekly_goals WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/complete — toggle completion
router.patch('/:id/complete', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM weekly_goals WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'not found' });
    db.prepare('UPDATE weekly_goals SET completed = ? WHERE id = ?').run(row.completed ? 0 : 1, row.id);
    res.json(db.prepare('SELECT * FROM weekly_goals WHERE id = ?').get(row.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM weekly_goals WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history/recent — last 4 weeks for reflection
router.get('/history/recent', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart(today);
    const d = new Date(weekStart + 'T00:00:00');
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const ws = d.toISOString().split('T')[0];
      const goals = db.prepare('SELECT * FROM weekly_goals WHERE week_start = ? ORDER BY position ASC').all(ws);
      if (goals.length > 0) weeks.push({ weekStart: ws, goals });
      d.setDate(d.getDate() - 7);
    }
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
