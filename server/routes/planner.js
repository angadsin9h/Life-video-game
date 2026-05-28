const express = require('express');
const router = express.Router();
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS time_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'work',
    duration_hours INTEGER NOT NULL DEFAULT 1,
    color TEXT DEFAULT 'violet',
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(date, hour)
  );
`);

// GET /api/planner/:date
router.get('/:date', (req, res) => {
  try {
    const blocks = db.prepare('SELECT * FROM time_blocks WHERE date = ? ORDER BY hour ASC').all(req.params.date);
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/planner
router.post('/', (req, res) => {
  try {
    const { date, hour, title, category, duration_hours, color } = req.body;
    if (!date || hour == null || !title) return res.status(400).json({ error: 'date, hour, and title required' });
    // Remove any existing block at this slot
    db.prepare('DELETE FROM time_blocks WHERE date = ? AND hour = ?').run(date, hour);
    const result = db.prepare(
      'INSERT INTO time_blocks (date, hour, title, category, duration_hours, color) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(date, hour, title, category || 'work', duration_hours || 1, color || 'violet');
    res.json(db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/planner/:id/complete
router.patch('/:id/complete', (req, res) => {
  try {
    db.prepare('UPDATE time_blocks SET completed = NOT completed WHERE id = ?').run(req.params.id);
    res.json(db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/planner/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM time_blocks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
