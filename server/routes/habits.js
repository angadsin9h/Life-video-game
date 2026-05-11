const express = require('express');
const router = express.Router();
const db = require('../db');

function calcStreak(habitId) {
  const completions = db.prepare('SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date DESC').all(habitId);
  if (!completions.length) return 0;
  const dateSet = new Set(completions.map(c => c.date));
  let streak = 0;
  let d = new Date();
  // Allow today or yesterday as starting point
  for (let offset = 0; offset <= 1; offset++) {
    const check = new Date(d);
    check.setDate(check.getDate() - offset);
    const ds = check.toISOString().split('T')[0];
    if (dateSet.has(ds)) {
      streak = 1;
      let cur = new Date(check);
      cur.setDate(cur.getDate() - 1);
      while (true) {
        const cs = cur.toISOString().split('T')[0];
        if (dateSet.has(cs)) { streak++; cur.setDate(cur.getDate() - 1); }
        else break;
      }
      break;
    }
  }
  return streak;
}

// GET / — all habits with streak + today's completion
router.get('/', (req, res) => {
  try {
    const habits = db.prepare('SELECT * FROM habits WHERE active = 1 ORDER BY created_at ASC').all();
    const today = new Date().toISOString().split('T')[0];
    const result = habits.map(h => {
      const streak = calcStreak(h.id);
      const completedToday = !!db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?').get(h.id, today);
      const totalCompletions = db.prepare('SELECT COUNT(*) as cnt FROM habit_completions WHERE habit_id = ?').get(h.id).cnt;
      return { ...h, streak, completedToday, totalCompletions };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create habit
router.post('/', (req, res) => {
  try {
    const { title, description, category, target_minutes, emoji } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'title and category required' });
    const result = db.prepare(
      'INSERT INTO habits (title, description, category, target_minutes, emoji) VALUES (?, ?, ?, ?, ?)'
    ).run(title, description || null, category, target_minutes || 0, emoji || '✅');
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
    res.json({ ...habit, streak: 0, completedToday: false, totalCompletions: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — update habit
router.put('/:id', (req, res) => {
  try {
    const { title, description, category, target_minutes, emoji, active } = req.body;
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    db.prepare(
      'UPDATE habits SET title=?, description=?, category=?, target_minutes=?, emoji=?, active=? WHERE id=?'
    ).run(
      title ?? habit.title,
      description ?? habit.description,
      category ?? habit.category,
      target_minutes ?? habit.target_minutes,
      emoji ?? habit.emoji,
      active !== undefined ? (active ? 1 : 0) : habit.active,
      req.params.id
    );
    res.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — soft-delete habit
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('UPDATE habits SET active = 0 WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Habit not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/complete — toggle completion for a date
router.post('/:id/complete', (req, res) => {
  try {
    const { date } = req.body;
    const d = date || new Date().toISOString().split('T')[0];
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const existing = db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?').get(req.params.id, d);
    if (existing) {
      db.prepare('DELETE FROM habit_completions WHERE habit_id = ? AND date = ?').run(req.params.id, d);
      res.json({ completed: false, streak: calcStreak(habit.id) });
    } else {
      db.prepare('INSERT INTO habit_completions (habit_id, date) VALUES (?, ?)').run(req.params.id, d);
      res.json({ completed: true, streak: calcStreak(habit.id) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/history — last 30 days completion calendar
router.get('/:id/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date DESC LIMIT 30').all(req.params.id);
    res.json(rows.map(r => r.date));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
