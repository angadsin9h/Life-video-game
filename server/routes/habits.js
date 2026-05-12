const express = require('express');
const router = express.Router();
const db = require('../db');

// Add shields column if not exists
try {
  db.prepare('ALTER TABLE habits ADD COLUMN shields INTEGER DEFAULT 0').run();
} catch (_) {}
// Shield usage log
db.prepare(`
  CREATE TABLE IF NOT EXISTS shield_uses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    used_at TEXT DEFAULT (datetime('now'))
  )
`).run();

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
      const shieldUses = db.prepare('SELECT date FROM shield_uses WHERE habit_id = ?').all(h.id).map(r => r.date);
      return { ...h, streak, completedToday, totalCompletions, shields: h.shields || 0, shieldUses };
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
      res.json({ completed: false, streak: calcStreak(habit.id), shieldEarned: false, shields: habit.shields || 0 });
    } else {
      db.prepare('INSERT INTO habit_completions (habit_id, date) VALUES (?, ?)').run(req.params.id, d);
      const newStreak = calcStreak(habit.id);
      // Award a shield at every 7-day streak milestone
      const shieldEarned = newStreak > 0 && newStreak % 7 === 0;
      if (shieldEarned) {
        db.prepare('UPDATE habits SET shields = COALESCE(shields, 0) + 1 WHERE id = ?').run(habit.id);
      }
      const updatedHabit = db.prepare('SELECT * FROM habits WHERE id = ?').get(habit.id);
      res.json({ completed: true, streak: newStreak, shieldEarned, shields: updatedHabit.shields || 0 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/use-shield — use a shield to protect yesterday's streak
router.post('/:id/use-shield', (req, res) => {
  try {
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    if (!habit.shields || habit.shields <= 0) return res.status(400).json({ error: 'No shields available' });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().split('T')[0];

    const existing = db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?').get(habit.id, yd);
    if (existing) return res.status(400).json({ error: 'Already completed yesterday' });

    db.prepare('INSERT INTO habit_completions (habit_id, date) VALUES (?, ?)').run(habit.id, yd);
    db.prepare('UPDATE habits SET shields = shields - 1 WHERE id = ?').run(habit.id);
    db.prepare('INSERT INTO shield_uses (habit_id, date) VALUES (?, ?)').run(habit.id, yd);

    const updatedHabit = db.prepare('SELECT * FROM habits WHERE id = ?').get(habit.id);
    const newStreak = calcStreak(habit.id);
    res.json({ ok: true, streak: newStreak, shields: updatedHabit.shields || 0, protectedDate: yd });
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
