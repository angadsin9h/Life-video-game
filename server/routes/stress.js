const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/lifequest.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS stress_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    level INTEGER NOT NULL CHECK(level >= 1 AND level <= 10),
    triggers TEXT,
    symptoms TEXT,
    coping TEXT,
    after_level INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

router.get('/', (req, res) => {
  const limit = Math.min(500, parseInt(req.query.limit) || 30);
  const logs = db.prepare('SELECT * FROM stress_logs ORDER BY date DESC, created_at DESC LIMIT ?').all(limit);
  res.json(logs);
});

router.get('/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      date,
      AVG(level) as avg_level,
      MAX(level) as max_level,
      MIN(level) as min_level,
      COUNT(*) as count
    FROM stress_logs
    WHERE date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all();
  res.json(stats);
});

router.post('/', (req, res) => {
  const { date, level, triggers, symptoms, coping, after_level, notes } = req.body;
  if (!date || !level) return res.status(400).json({ error: 'date and level required' });
  const result = db.prepare(`
    INSERT INTO stress_logs (date, level, triggers, symptoms, coping, after_level, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(date, level, triggers || '', symptoms || '', coping || '', after_level || 0, notes || '');
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM stress_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
