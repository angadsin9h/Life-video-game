const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/checkins.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    morning_mood INTEGER,
    morning_energy INTEGER,
    morning_intention TEXT,
    evening_mood INTEGER,
    evening_energy INTEGER,
    evening_wins TEXT,
    evening_gratitude TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

router.get('/', (req, res) => {
  const limit = Math.min(90, parseInt(req.query.limit) || 30);
  const rows = db.prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT ?').all(limit);
  res.json(rows);
});

router.get('/:date', (req, res) => {
  const row = db.prepare('SELECT * FROM daily_checkins WHERE date = ?').get(req.params.date);
  res.json(row || {});
});

router.post('/', (req, res) => {
  const { date, morning_mood, morning_energy, morning_intention, evening_mood, evening_energy, evening_wins, evening_gratitude, notes } = req.body;
  const stmt = db.prepare(`
    INSERT INTO daily_checkins (date, morning_mood, morning_energy, morning_intention, evening_mood, evening_energy, evening_wins, evening_gratitude, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      morning_mood = excluded.morning_mood,
      morning_energy = excluded.morning_energy,
      morning_intention = excluded.morning_intention,
      evening_mood = excluded.evening_mood,
      evening_energy = excluded.evening_energy,
      evening_wins = excluded.evening_wins,
      evening_gratitude = excluded.evening_gratitude,
      notes = excluded.notes
  `);
  stmt.run(date, morning_mood, morning_energy, morning_intention, evening_mood, evening_energy, evening_wins, evening_gratitude, notes);
  res.json({ ok: true });
});

module.exports = router;
