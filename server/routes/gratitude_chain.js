const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/lifequest.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS gratitude_chain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    entries TEXT NOT NULL DEFAULT '[]',
    theme TEXT DEFAULT '',
    streak INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

router.get('/', (req, res) => {
  const limit = Math.min(365, parseInt(req.query.limit) || 30);
  const logs = db.prepare('SELECT * FROM gratitude_chain ORDER BY date DESC LIMIT ?').all(limit);
  res.json(logs.map(l => ({ ...l, entries: JSON.parse(l.entries) })));
});

router.get('/:date', (req, res) => {
  const log = db.prepare('SELECT * FROM gratitude_chain WHERE date = ?').get(req.params.date);
  if (log) return res.json({ ...log, entries: JSON.parse(log.entries) });
  res.json({ date: req.params.date, entries: [], theme: '', streak: 0 });
});

router.post('/', (req, res) => {
  const { date, entries, theme } = req.body;
  if (!date || !entries) return res.status(400).json({ error: 'date and entries required' });

  const prev = db.prepare('SELECT * FROM gratitude_chain WHERE date = date(?, "-1 day")').get(date);
  const streak = prev ? (prev.streak || 0) + 1 : 1;

  db.prepare(`
    INSERT INTO gratitude_chain (date, entries, theme, streak)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET entries = excluded.entries, theme = excluded.theme, streak = excluded.streak
  `).run(date, JSON.stringify(entries), theme || '', streak);

  res.json({ success: true, streak });
});

module.exports = router;
