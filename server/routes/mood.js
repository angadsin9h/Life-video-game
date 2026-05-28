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

// GET /history — last N days (default 30)
router.get('/history', (req, res) => {
  try {
    const days = Math.min(365, parseInt(req.query.days) || 30);
    const rows = db.prepare('SELECT * FROM mood_logs ORDER BY date DESC LIMIT ?').all(days);
    res.json({ entries: rows.map(r => ({
      ...r,
      label: MOOD_LABELS[r.mood] || 'Unknown',
      emoji: MOOD_EMOJIS[r.mood] || '❓',
    }))});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /correlation — mood vs daily score for last 30 days
router.get('/correlation', (req, res) => {
  try {
    const days = Math.min(90, parseInt(req.query.days) || 30);
    const moods = db.prepare('SELECT date, mood FROM mood_logs ORDER BY date DESC LIMIT ?').all(days);
    const categoryMax = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };

    const result = moods.map(m => {
      const log = db.prepare('SELECT id FROM daily_logs WHERE date = ?').get(m.date);
      let score = 0;
      if (log) {
        const tasks = db.prepare('SELECT category, duration_minutes FROM task_entries WHERE log_id = ?').all(log.id);
        const catScores = {};
        for (const t of tasks) {
          const cat = t.category.toLowerCase();
          if (!categoryMax[cat]) continue;
          const max = categoryMax[cat];
          const pts = t.duration_minutes >= 30 ? max : t.duration_minutes >= 15 ? max * 0.75 : max * 0.5;
          catScores[cat] = Math.min(max, (catScores[cat] || 0) + pts);
        }
        score = Math.round(Object.values(catScores).reduce((a, b) => a + b, 0));
      }
      return { date: m.date, mood: m.mood, score, moodLabel: MOOD_LABELS[m.mood], moodEmoji: MOOD_EMOJIS[m.mood] };
    }).filter(r => r.score > 0);

    // Avg score per mood level
    const moodScoreMap = {};
    for (let m = 1; m <= 5; m++) {
      const entries = result.filter(r => r.mood === m);
      moodScoreMap[m] = {
        label: MOOD_LABELS[m],
        emoji: MOOD_EMOJIS[m],
        count: entries.length,
        avgScore: entries.length ? Math.round(entries.reduce((s, r) => s + r.score, 0) / entries.length) : 0,
      };
    }

    // Simple Pearson correlation
    if (result.length >= 3) {
      const n = result.length;
      const meanMood = result.reduce((s, r) => s + r.mood, 0) / n;
      const meanScore = result.reduce((s, r) => s + r.score, 0) / n;
      const num = result.reduce((s, r) => s + (r.mood - meanMood) * (r.score - meanScore), 0);
      const den = Math.sqrt(
        result.reduce((s, r) => s + (r.mood - meanMood) ** 2, 0) *
        result.reduce((s, r) => s + (r.score - meanScore) ** 2, 0)
      );
      const correlation = den > 0 ? parseFloat((num / den).toFixed(3)) : 0;
      res.json({ dataPoints: result, moodScoreMap, correlation });
    } else {
      res.json({ dataPoints: result, moodScoreMap, correlation: null });
    }
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
