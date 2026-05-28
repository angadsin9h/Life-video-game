const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'morning',
    emoji TEXT DEFAULT '🌅',
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS routine_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    habit_id INTEGER,
    task_name TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 5,
    order_index INTEGER DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS routine_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    completed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(routine_id, date)
  )
`).run();

// GET / - all routines with items
router.get('/', (req, res) => {
  try {
    const routines = db.prepare('SELECT * FROM routines ORDER BY type, name').all();
    const today = new Date().toISOString().split('T')[0];
    const result = routines.map(r => {
      const items = db.prepare('SELECT * FROM routine_items WHERE routine_id = ? ORDER BY order_index').all(r.id);
      const completedToday = !!db.prepare('SELECT id FROM routine_completions WHERE routine_id = ? AND date = ?').get(r.id, today);
      const streak = calcRoutineStreak(r.id);
      return { ...r, items, completedToday, streak };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calcRoutineStreak(routineId) {
  const completions = db.prepare('SELECT date FROM routine_completions WHERE routine_id = ? ORDER BY date DESC').all(routineId);
  if (!completions.length) return 0;
  const dateSet = new Set(completions.map(c => c.date));
  let streak = 0;
  let d = new Date();
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

// POST / - create routine
router.post('/', (req, res) => {
  try {
    const { name, type = 'morning', emoji = '🌅', items = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = db.prepare('INSERT INTO routines (name, type, emoji) VALUES (?, ?, ?)').run(name, type, emoji);
    const id = result.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO routine_items (routine_id, habit_id, task_name, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?)');
    items.forEach((item, i) => {
      insertItem.run(id, item.habit_id || null, item.task_name, item.duration_minutes || 5, i);
    });
    const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(id);
    const routineItems = db.prepare('SELECT * FROM routine_items WHERE routine_id = ? ORDER BY order_index').all(id);
    res.json({ ...routine, items: routineItems, completedToday: false, streak: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id - update routine
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, emoji, items } = req.body;
    const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(id);
    if (!routine) return res.status(404).json({ error: 'Not found' });
    if (name) db.prepare('UPDATE routines SET name = ? WHERE id = ?').run(name, id);
    if (type) db.prepare('UPDATE routines SET type = ? WHERE id = ?').run(type, id);
    if (emoji) db.prepare('UPDATE routines SET emoji = ? WHERE id = ?').run(emoji, id);
    if (items) {
      db.prepare('DELETE FROM routine_items WHERE routine_id = ?').run(id);
      const insertItem = db.prepare('INSERT INTO routine_items (routine_id, habit_id, task_name, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?)');
      items.forEach((item, i) => {
        insertItem.run(id, item.habit_id || null, item.task_name, item.duration_minutes || 5, i);
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM routine_items WHERE routine_id = ?').run(id);
    db.prepare('DELETE FROM routine_completions WHERE routine_id = ?').run(id);
    db.prepare('DELETE FROM routines WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/complete - mark routine done for today
router.post('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    db.prepare('INSERT OR IGNORE INTO routine_completions (routine_id, date) VALUES (?, ?)').run(id, today);
    const streak = calcRoutineStreak(id);
    res.json({ ok: true, streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history/30 - last 30 days completions for all routines
router.get('/history/30', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT rc.routine_id, rc.date, r.name, r.type
      FROM routine_completions rc
      JOIN routines r ON r.id = rc.routine_id
      WHERE rc.date >= date('now', '-30 days')
      ORDER BY rc.date DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
