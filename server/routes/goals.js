const express = require('express');
const router = express.Router();
const db = require('../db');

try { db.prepare('ALTER TABLE goals ADD COLUMN progress_pct INTEGER DEFAULT 0').run(); } catch (_) {}
try { db.prepare('ALTER TABLE goals ADD COLUMN emoji TEXT DEFAULT "🎯"').run(); } catch (_) {}

db.prepare(`
  CREATE TABLE IF NOT EXISTS goal_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
  )
`).run();

function enrichGoal(goal) {
  const milestones = db.prepare('SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY position ASC, created_at ASC').all(goal.id);
  const autoProgress = milestones.length > 0
    ? Math.round(milestones.filter(m => m.completed).length / milestones.length * 100)
    : (goal.progress_pct || 0);
  return { ...goal, milestones, progress_pct: autoProgress };
}

// GET / - get all goals
router.get('/', (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
    res.json(goals.map(enrichGoal));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id - single goal with milestones
router.get('/:id', (req, res) => {
  try {
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    if (!goal) return res.status(404).json({ error: 'not found' });
    res.json(enrichGoal(goal));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/milestones
router.post('/:id/milestones', (req, res) => {
  try {
    const { text, position = 0 } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text required' });
    const result = db.prepare('INSERT INTO goal_milestones (goal_id, text, position) VALUES (?, ?, ?)').run(req.params.id, text.trim(), position);
    res.json(db.prepare('SELECT * FROM goal_milestones WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/milestones/:mid/complete
router.patch('/:id/milestones/:mid/complete', (req, res) => {
  try {
    const m = db.prepare('SELECT * FROM goal_milestones WHERE id = ? AND goal_id = ?').get(req.params.mid, req.params.id);
    if (!m) return res.status(404).json({ error: 'not found' });
    db.prepare('UPDATE goal_milestones SET completed = ? WHERE id = ?').run(m.completed ? 0 : 1, m.id);
    res.json(db.prepare('SELECT * FROM goal_milestones WHERE id = ?').get(m.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id/milestones/:mid
router.delete('/:id/milestones/:mid', (req, res) => {
  try {
    db.prepare('DELETE FROM goal_milestones WHERE id = ? AND goal_id = ?').run(req.params.mid, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create new goal
router.post('/', (req, res) => {
  try {
    const { title, description, category, target_date } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'title and category required' });
    const result = db.prepare(
      'INSERT INTO goals (title, description, category, target_date) VALUES (?, ?, ?, ?)'
    ).run(title, description || null, category, target_date || null);
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - update goal
router.put('/:id', (req, res) => {
  try {
    const { title, description, category, target_date, completed } = req.body;
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    db.prepare(
      'UPDATE goals SET title = ?, description = ?, category = ?, target_date = ?, completed = ? WHERE id = ?'
    ).run(
      title ?? goal.title,
      description ?? goal.description,
      category ?? goal.category,
      target_date ?? goal.target_date,
      completed !== undefined ? (completed ? 1 : 0) : goal.completed,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - delete goal
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Goal not found' });
    db.prepare('DELETE FROM goal_progress WHERE goal_id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/progress - get progress notes for a goal
router.get('/:id/progress', (req, res) => {
  try {
    const notes = db.prepare('SELECT * FROM goal_progress WHERE goal_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/progress - add a progress note
router.post('/:id/progress', (req, res) => {
  try {
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ error: 'note is required' });
    const goal = db.prepare('SELECT id FROM goals WHERE id = ?').get(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    const result = db.prepare('INSERT INTO goal_progress (goal_id, note) VALUES (?, ?)').run(req.params.id, note.trim());
    res.json(db.prepare('SELECT * FROM goal_progress WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id/progress/:noteId - delete a progress note
router.delete('/:id/progress/:noteId', (req, res) => {
  try {
    db.prepare('DELETE FROM goal_progress WHERE id = ? AND goal_id = ?').run(req.params.noteId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
