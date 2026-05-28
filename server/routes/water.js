const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS water_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    glasses INTEGER DEFAULT 0,
    goal INTEGER DEFAULT 8,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET /:date
router.get('/:date', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM water_logs WHERE date = ?').get(req.params.date);
    res.json(row || { date: req.params.date, glasses: 0, goal: 8 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:date — set or adjust glasses
router.post('/:date', (req, res) => {
  try {
    const { glasses, goal } = req.body;
    const date = req.params.date;
    const current = db.prepare('SELECT * FROM water_logs WHERE date = ?').get(date);
    const newGlasses = Math.max(0, Math.min(20, glasses !== undefined ? glasses : (current?.glasses || 0) + 1));
    const newGoal = goal !== undefined ? goal : (current?.goal || 8);
    db.prepare(`
      INSERT INTO water_logs (date, glasses, goal)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET glasses = ?, goal = ?, updated_at = datetime('now')
    `).run(date, newGlasses, newGoal, newGlasses, newGoal);
    res.json(db.prepare('SELECT * FROM water_logs WHERE date = ?').get(date));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history/week — last 7 days
router.get('/history/week', (req, res) => {
  try {
    const rows = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const row = db.prepare('SELECT * FROM water_logs WHERE date = ?').get(date);
      rows.push(row || { date, glasses: 0, goal: 8 });
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
