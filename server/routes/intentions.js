const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS intentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET /:date - get intentions for a date
router.get('/:date', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM intentions WHERE date = ? ORDER BY position ASC').all(req.params.date);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - add intention
router.post('/', (req, res) => {
  try {
    const { date, text, position = 0 } = req.body;
    if (!date || !text) return res.status(400).json({ error: 'date and text required' });
    const count = db.prepare('SELECT COUNT(*) as c FROM intentions WHERE date = ?').get(date).c;
    if (count >= 3) return res.status(400).json({ error: 'max 3 intentions per day' });
    const result = db.prepare('INSERT INTO intentions (date, text, position) VALUES (?, ?, ?)').run(date, text.slice(0, 120), position);
    res.json(db.prepare('SELECT * FROM intentions WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/complete - toggle completion
router.patch('/:id/complete', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM intentions WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'not found' });
    const newVal = row.completed ? 0 : 1;
    db.prepare('UPDATE intentions SET completed = ? WHERE id = ?').run(newVal, row.id);
    res.json({ ...row, completed: newVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM intentions WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history/week - last 7 days completion rates
router.get('/history/week', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT date,
        COUNT(*) as total,
        SUM(completed) as done
      FROM intentions
      WHERE date >= date('now', '-6 days')
      GROUP BY date
      ORDER BY date ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
