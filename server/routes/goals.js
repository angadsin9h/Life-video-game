const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / - get all goals
router.get('/', (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
    res.json(goals);
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
