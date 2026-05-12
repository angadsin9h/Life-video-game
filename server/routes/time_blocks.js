const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS time_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'work',
    color TEXT DEFAULT '#3b82f6',
    completed INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET /:date
router.get('/:date', (req, res) => {
  try {
    const blocks = db.prepare('SELECT * FROM time_blocks WHERE date = ? ORDER BY start_time ASC').all(req.params.date);
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /week/:startDate
router.get('/week/:startDate', (req, res) => {
  try {
    const start = req.params.startDate;
    const end = new Date(start + 'T12:00:00');
    end.setDate(end.getDate() + 6);
    const endStr = end.toISOString().split('T')[0];
    const blocks = db.prepare('SELECT * FROM time_blocks WHERE date >= ? AND date <= ? ORDER BY date ASC, start_time ASC').all(start, endStr);
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /
router.post('/', (req, res) => {
  try {
    const { date, start_time, end_time, title, category = 'work', color = '#3b82f6', notes = '' } = req.body;
    if (!date || !start_time || !end_time || !title) return res.status(400).json({ error: 'date, start_time, end_time, title required' });
    const result = db.prepare(`
      INSERT INTO time_blocks (date, start_time, end_time, title, category, color, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(date, start_time, end_time, title, category, color, notes);
    res.json(db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id
router.patch('/:id', (req, res) => {
  try {
    const { title, start_time, end_time, category, color, completed, notes } = req.body;
    const b = db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(req.params.id);
    if (!b) return res.status(404).json({ error: 'not found' });
    db.prepare(`
      UPDATE time_blocks SET
        title = ?, start_time = ?, end_time = ?, category = ?, color = ?, completed = ?, notes = ?
      WHERE id = ?
    `).run(
      title ?? b.title, start_time ?? b.start_time, end_time ?? b.end_time,
      category ?? b.category, color ?? b.color,
      completed !== undefined ? (completed ? 1 : 0) : b.completed,
      notes ?? b.notes, req.params.id
    );
    res.json(db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM time_blocks WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
