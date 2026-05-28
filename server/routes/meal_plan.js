const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER DEFAULT 0,
    prep_minutes INTEGER DEFAULT 0,
    ingredients TEXT,
    notes TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(date, meal_type)
  )
`).run();

// GET /week - 7 days of meal plans
router.get('/week', (req, res) => {
  try {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    const rows = db.prepare(`SELECT * FROM meal_plans WHERE date >= ? AND date <= ? ORDER BY date, meal_type`).all(days[0], days[6]);
    res.json({ days, meals: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:date - meals for a date
router.get('/:date', (req, res) => {
  try {
    const meals = db.prepare('SELECT * FROM meal_plans WHERE date = ? ORDER BY meal_type').all(req.params.date);
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - add/update meal
router.post('/', (req, res) => {
  try {
    const { date, meal_type, name, calories = 0, prep_minutes = 0, ingredients, notes } = req.body;
    if (!date || !meal_type || !name) return res.status(400).json({ error: 'date, meal_type, name required' });
    db.prepare(`
      INSERT INTO meal_plans (date, meal_type, name, calories, prep_minutes, ingredients, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, meal_type) DO UPDATE SET
        name = excluded.name, calories = excluded.calories,
        prep_minutes = excluded.prep_minutes, ingredients = excluded.ingredients,
        notes = excluded.notes
    `).run(date, meal_type, name, calories, prep_minutes, ingredients || null, notes || null);
    res.json(db.prepare('SELECT * FROM meal_plans WHERE date = ? AND meal_type = ?').get(date, meal_type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/complete
router.patch('/:id/complete', (req, res) => {
  try {
    const { completed } = req.body;
    db.prepare('UPDATE meal_plans SET completed = ? WHERE id = ?').run(completed ? 1 : 0, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM meal_plans WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
