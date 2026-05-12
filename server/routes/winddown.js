const express = require('express');
const router = express.Router();
const db = require('../db');

const CAT_MAX = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };

function calcScore(tasks) {
  const scores = {};
  for (const t of tasks) {
    const cat = t.category.toLowerCase();
    if (!CAT_MAX[cat]) continue;
    let pts = t.duration_minutes >= 30 ? CAT_MAX[cat] : t.duration_minutes >= 15 ? CAT_MAX[cat] * 0.75 : CAT_MAX[cat] * 0.5;
    scores[cat] = Math.min(CAT_MAX[cat], (scores[cat] || 0) + pts);
  }
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
}

// GET /api/winddown
router.get('/', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Score
    let score = null;
    const log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(today);
    if (log) {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      score = calcScore(tasks);
    }

    // Habits
    const allHabits = db.prepare('SELECT * FROM habits WHERE active = 1').all();
    const habits = allHabits.map(h => {
      const done = !!db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?').get(h.id, today);
      return { id: h.id, title: h.title, emoji: h.emoji || '✅', completedToday: done };
    });

    // Intentions
    let intentions = [];
    try {
      intentions = db.prepare('SELECT * FROM intentions WHERE date = ?').all(today);
    } catch {}

    // Gratitude
    let gratitude = [];
    try {
      const gRow = db.prepare('SELECT entries FROM gratitude_logs WHERE date = ?').get(today);
      if (gRow?.entries) gratitude = JSON.parse(gRow.entries);
    } catch {}

    // Quests
    let quests = [];
    try {
      quests = db.prepare('SELECT title, completed FROM daily_quests WHERE date = ? ORDER BY id').all(today);
    } catch {}

    // Mood
    let mood = null;
    try {
      mood = db.prepare('SELECT mood, emoji, label FROM mood_logs WHERE date = ?').get(today);
    } catch {}

    // Streak
    const logs = db.prepare('SELECT date FROM daily_logs ORDER BY date DESC LIMIT 60').all();
    const dateSet = new Set(logs.map(l => l.date));
    let streak = 0;
    let d = new Date(today);
    while (dateSet.has(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate() - 1); }

    // Journal
    let journalEntry = false;
    try {
      const j = db.prepare('SELECT id FROM journal_entries WHERE date = ?').get(today);
      journalEntry = !!j;
    } catch {}

    res.json({
      date: today,
      score,
      habits,
      habitsDone: habits.filter(h => h.completedToday).length,
      habitsTotal: habits.length,
      intentions,
      gratitude,
      quests,
      mood: mood || null,
      journalEntry,
      streak,
      tomorrowIdeas: [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
