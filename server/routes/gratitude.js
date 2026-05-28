const express = require('express');
const router = express.Router();
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS gratitudes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    emoji TEXT DEFAULT '🙏',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS gratitudes_date_idx ON gratitudes(date);
`);

// GET /api/gratitude/:date
router.get('/:date', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM gratitudes WHERE date = ? ORDER BY id ASC').all(req.params.date);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gratitude/history/recent - last 30 days with counts
router.get('/history/recent', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT date, COUNT(*) as count, GROUP_CONCAT(text, '||') as texts
      FROM gratitudes
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gratitude
router.post('/', (req, res) => {
  try {
    const { date, text, emoji } = req.body;
    if (!date || !text?.trim()) return res.status(400).json({ error: 'date and text required' });
    const count = db.prepare('SELECT COUNT(*) as n FROM gratitudes WHERE date = ?').get(date).n;
    if (count >= 5) return res.status(400).json({ error: 'Max 5 gratitudes per day' });
    const result = db.prepare('INSERT INTO gratitudes (date, text, emoji) VALUES (?, ?, ?)').run(date, text.trim(), emoji || '🙏');
    res.json(db.prepare('SELECT * FROM gratitudes WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gratitude/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM gratitudes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
