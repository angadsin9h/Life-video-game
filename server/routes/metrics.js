const express = require('express');
const router = express.Router();
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS body_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    weight REAL,
    sleep_hours REAL,
    water_glasses INTEGER,
    steps INTEGER,
    energy INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// GET /api/metrics/history - last 30 days
router.get('/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const rows = db.prepare(
      `SELECT * FROM body_metrics ORDER BY date DESC LIMIT ?`
    ).all(days);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metrics/:date
router.get('/:date', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM body_metrics WHERE date = ?').get(req.params.date);
    res.json(row || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/metrics/:date - upsert
router.put('/:date', (req, res) => {
  try {
    const { weight, sleep_hours, water_glasses, steps, energy, notes } = req.body;
    const date = req.params.date;
    db.prepare(`
      INSERT INTO body_metrics (date, weight, sleep_hours, water_glasses, steps, energy, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        weight = excluded.weight,
        sleep_hours = excluded.sleep_hours,
        water_glasses = excluded.water_glasses,
        steps = excluded.steps,
        energy = excluded.energy,
        notes = excluded.notes,
        updated_at = datetime('now')
    `).run(date, weight ?? null, sleep_hours ?? null, water_glasses ?? null, steps ?? null, energy ?? null, notes ?? null);
    const row = db.prepare('SELECT * FROM body_metrics WHERE date = ?').get(date);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
