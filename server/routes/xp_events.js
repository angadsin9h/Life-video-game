const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/xp_events.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS xp_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    amount INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// GET all events
router.get('/', (req, res) => {
  const limit = Math.min(500, parseInt(req.query.limit) || 100);
  const rows = db.prepare('SELECT * FROM xp_events ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows);
});

// GET summary/totals by category
router.get('/summary', (req, res) => {
  const totals = db.prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM xp_events
    GROUP BY category
    ORDER BY total DESC
  `).all();
  const grandTotal = db.prepare('SELECT SUM(amount) as total FROM xp_events').get();
  res.json({ totals, grandTotal: grandTotal?.total || 0 });
});

// POST new event
router.post('/', (req, res) => {
  const { date, source, amount, category, description } = req.body;
  const result = db.prepare(
    'INSERT INTO xp_events (date, source, amount, category, description) VALUES (?, ?, ?, ?, ?)'
  ).run(date, source, amount, category || 'general', description);
  res.json({ id: result.lastInsertRowid });
});

module.exports = router;
