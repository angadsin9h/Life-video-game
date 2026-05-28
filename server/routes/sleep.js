const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS sleep_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    bedtime TEXT,
    wake_time TEXT,
    duration_minutes INTEGER DEFAULT 0,
    quality INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();

function calcDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60; // next day
  return wakeMins - bedMins;
}

// GET / — last 30 nights
router.get('/', (req, res) => {
  try {
    const limit = Math.min(365, parseInt(req.query.limit) || 30);
    const rows = db.prepare('SELECT * FROM sleep_logs ORDER BY date DESC LIMIT ?').all(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:date
router.get('/:date', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM sleep_logs WHERE date = ?').get(req.params.date);
    res.json(row || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — log or update sleep
router.post('/', (req, res) => {
  try {
    const { date, bedtime, wake_time, quality = 0, notes = '', duration_minutes: explicitDuration } = req.body;
    if (!date) return res.status(400).json({ error: 'date required' });
    const duration_minutes = explicitDuration != null ? parseInt(explicitDuration) : calcDuration(bedtime, wake_time);
    db.prepare(`
      INSERT INTO sleep_logs (date, bedtime, wake_time, duration_minutes, quality, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        bedtime = excluded.bedtime,
        wake_time = excluded.wake_time,
        duration_minutes = excluded.duration_minutes,
        quality = excluded.quality,
        notes = excluded.notes,
        updated_at = datetime('now')
    `).run(date, bedtime || null, wake_time || null, duration_minutes, quality, notes);
    res.json(db.prepare('SELECT * FROM sleep_logs WHERE date = ?').get(date));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:date
router.delete('/:date', (req, res) => {
  try {
    db.prepare('DELETE FROM sleep_logs WHERE date = ?').run(req.params.date);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/week — averages
router.get('/stats/week', (req, res) => {
  try {
    const rows = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const row = db.prepare('SELECT * FROM sleep_logs WHERE date = ?').get(date);
      rows.push(row || { date, duration_minutes: 0, quality: 0 });
    }
    const valid = rows.filter(r => r.duration_minutes > 0);
    const avgDuration = valid.length ? Math.round(valid.reduce((s, r) => s + r.duration_minutes, 0) / valid.length) : 0;
    const avgQuality = valid.length ? +(valid.reduce((s, r) => s + r.quality, 0) / valid.length).toFixed(1) : 0;
    res.json({ days: rows, avgDuration, avgQuality });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
