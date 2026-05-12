const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS category_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    weekly_minutes INTEGER NOT NULL DEFAULT 60,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();

const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth'];

// Seed defaults if empty
const count = db.prepare('SELECT COUNT(*) as c FROM category_goals').get().c;
if (count === 0) {
  const defaults = { health: 90, mind: 60, work: 120, social: 30, growth: 60 };
  const ins = db.prepare('INSERT OR IGNORE INTO category_goals (category, weekly_minutes) VALUES (?, ?)');
  for (const [cat, mins] of Object.entries(defaults)) ins.run(cat, mins);
}

// GET /progress?week=YYYY-MM-DD — goals + actual minutes for week
router.get('/progress', (req, res) => {
  try {
    const weekDate = req.query.week || new Date().toISOString().split('T')[0];
    // Get Monday of the given week
    const d = new Date(weekDate + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const daysToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    d.setDate(d.getDate() - daysToMon);
    const weekStart = d.toISOString().split('T')[0];
    const weekEnd = new Date(d.setDate(d.getDate() + 6)).toISOString().split('T')[0];

    const goals = db.prepare('SELECT * FROM category_goals').all();

    // Sum task minutes per category for the week
    const actuals = db.prepare(`
      SELECT te.category, SUM(te.duration_minutes) as actual_minutes
      FROM task_entries te
      JOIN daily_logs dl ON te.log_id = dl.id
      WHERE dl.date >= ? AND dl.date <= ?
      GROUP BY te.category
    `).all(weekStart, weekEnd);

    const actualMap = Object.fromEntries(actuals.map(a => [a.category, a.actual_minutes || 0]));

    const result = CATEGORIES.map(cat => {
      const goal = goals.find(g => g.category === cat) || { weekly_minutes: 60 };
      const actual = actualMap[cat] || 0;
      return {
        category: cat,
        weekly_minutes: goal.weekly_minutes,
        actual_minutes: actual,
        pct: Math.min(100, Math.round((actual / goal.weekly_minutes) * 100)),
        surplus: Math.max(0, actual - goal.weekly_minutes),
      };
    });

    res.json({ weekStart, weekEnd, goals: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — all goals
router.get('/', (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM category_goals').all();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:category — update goal
router.put('/:category', (req, res) => {
  try {
    const { weekly_minutes } = req.body;
    if (!weekly_minutes || weekly_minutes < 0) return res.status(400).json({ error: 'weekly_minutes required' });
    db.prepare(`
      INSERT INTO category_goals (category, weekly_minutes, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(category) DO UPDATE SET weekly_minutes = excluded.weekly_minutes, updated_at = excluded.updated_at
    `).run(req.params.category, Math.min(1440, weekly_minutes));
    res.json(db.prepare('SELECT * FROM category_goals WHERE category = ?').get(req.params.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
