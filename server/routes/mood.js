const express = require('express');
const router = express.Router();
const db = require('../db');

const MOOD_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Amazing'];
const MOOD_EMOJIS = ['', '😭', '😔', '😐', '😊', '🤩'];

// GET /today
router.get('/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const entry = db.prepare('SELECT * FROM mood_logs WHERE date = ?').get(today);
    res.json(entry || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history — last 30 days
router.get('/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM mood_logs ORDER BY date DESC LIMIT 30').all();
    res.json(rows.map(r => ({
      ...r,
      label: MOOD_LABELS[r.mood] || 'Unknown',
      emoji: MOOD_EMOJIS[r.mood] || '❓',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — log or update today's mood
router.post('/', (req, res) => {
  try {
    const { mood, note, date } = req.body;
    const d = date || new Date().toISOString().split('T')[0];
    if (!mood || mood < 1 || mood > 5) return res.status(400).json({ error: 'mood must be 1-5' });
    db.prepare(
      'INSERT INTO mood_logs (date, mood, note) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET mood = excluded.mood, note = excluded.note'
    ).run(d, mood, note || null);
    const entry = db.prepare('SELECT * FROM mood_logs WHERE date = ?').get(d);
    res.json({ ...entry, label: MOOD_LABELS[entry.mood], emoji: MOOD_EMOJIS[entry.mood] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
