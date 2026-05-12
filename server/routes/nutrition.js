const express = require('express');
const router = express.Router();
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS nutrition_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL DEFAULT 'snack',
    food_name TEXT NOT NULL,
    calories INTEGER DEFAULT 0,
    protein_g REAL DEFAULT 0,
    carbs_g REAL DEFAULT 0,
    fat_g REAL DEFAULT 0,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'serving',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS nutrition_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calories INTEGER DEFAULT 2000,
    protein_g INTEGER DEFAULT 150,
    carbs_g INTEGER DEFAULT 250,
    fat_g INTEGER DEFAULT 65,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Ensure default goals row exists
const goalRow = db.prepare('SELECT id FROM nutrition_goals LIMIT 1').get();
if (!goalRow) {
  db.prepare('INSERT INTO nutrition_goals (calories, protein_g, carbs_g, fat_g) VALUES (2000, 150, 250, 65)').run();
}

const COMMON_FOODS = [
  { name: 'Chicken breast (100g)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, unit: '100g' },
  { name: 'Brown rice (100g cooked)', calories: 112, protein_g: 2.6, carbs_g: 23, fat_g: 0.9, unit: '100g' },
  { name: 'Egg (large)', calories: 72, protein_g: 6, carbs_g: 0.4, fat_g: 5, unit: 'egg' },
  { name: 'Banana', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, unit: 'medium' },
  { name: 'Greek yogurt (170g)', calories: 100, protein_g: 17, carbs_g: 6, fat_g: 0.7, unit: 'cup' },
  { name: 'Oatmeal (40g dry)', calories: 150, protein_g: 5, carbs_g: 27, fat_g: 2.5, unit: 'serving' },
  { name: 'Almonds (28g)', calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14, unit: '28g' },
  { name: 'Salmon (100g)', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, unit: '100g' },
  { name: 'Sweet potato (medium)', calories: 103, protein_g: 2.3, carbs_g: 24, fat_g: 0.1, unit: 'medium' },
  { name: 'Broccoli (100g)', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, unit: '100g' },
  { name: 'Whole milk (240ml)', calories: 149, protein_g: 8, carbs_g: 12, fat_g: 8, unit: 'cup' },
  { name: 'Protein shake', calories: 120, protein_g: 25, carbs_g: 4, fat_g: 2, unit: 'serving' },
  { name: 'White rice (100g cooked)', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, unit: '100g' },
  { name: 'Avocado (half)', calories: 120, protein_g: 1.5, carbs_g: 6, fat_g: 11, unit: 'half' },
  { name: 'Apple', calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, unit: 'medium' },
  { name: 'Bread slice (whole wheat)', calories: 69, protein_g: 3.6, carbs_g: 12, fat_g: 1.1, unit: 'slice' },
  { name: 'Tuna canned (85g)', calories: 100, protein_g: 22, carbs_g: 0, fat_g: 0.5, unit: 'can' },
  { name: 'Peanut butter (2 tbsp)', calories: 188, protein_g: 8, carbs_g: 6, fat_g: 16, unit: '2 tbsp' },
  { name: 'Cottage cheese (113g)', calories: 98, protein_g: 11, carbs_g: 5, fat_g: 4.5, unit: 'half cup' },
  { name: 'Lentils cooked (200g)', calories: 230, protein_g: 18, carbs_g: 40, fat_g: 0.8, unit: '200g' },
];

// GET /api/nutrition/:date — all entries for a day
router.get('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const entries = db.prepare('SELECT * FROM nutrition_logs WHERE date = ? ORDER BY created_at ASC').all(date);
    const goals = db.prepare('SELECT * FROM nutrition_goals LIMIT 1').get();
    const totals = entries.reduce((acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein_g: acc.protein_g + (e.protein_g || 0),
      carbs_g: acc.carbs_g + (e.carbs_g || 0),
      fat_g: acc.fat_g + (e.fat_g || 0),
    }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
    res.json({ entries, totals, goals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nutrition/history/week — last 7 days summary
router.get('/history/week', (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const entries = db.prepare('SELECT calories, protein_g, carbs_g, fat_g FROM nutrition_logs WHERE date = ?').all(d);
      const totals = entries.reduce((acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein_g: acc.protein_g + (e.protein_g || 0),
        carbs_g: acc.carbs_g + (e.carbs_g || 0),
        fat_g: acc.fat_g + (e.fat_g || 0),
      }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
      days.push({ date: d, ...totals, count: entries.length });
    }
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nutrition/foods/common — common food database
router.get('/foods/common', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const filtered = q ? COMMON_FOODS.filter(f => f.name.toLowerCase().includes(q)) : COMMON_FOODS;
  res.json(filtered);
});

// POST /api/nutrition — add entry
router.post('/', (req, res) => {
  try {
    const { date, meal_type = 'snack', food_name, calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0, quantity = 1, unit = 'serving', notes } = req.body;
    if (!date || !food_name) return res.status(400).json({ error: 'date and food_name required' });
    const result = db.prepare(
      'INSERT INTO nutrition_logs (date, meal_type, food_name, calories, protein_g, carbs_g, fat_g, quantity, unit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(date, meal_type, food_name, Math.round(calories * quantity), +(protein_g * quantity).toFixed(1), +(carbs_g * quantity).toFixed(1), +(fat_g * quantity).toFixed(1), quantity, unit, notes);
    const entry = db.prepare('SELECT * FROM nutrition_logs WHERE id = ?').get(result.lastInsertRowid);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/nutrition/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM nutrition_logs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/nutrition/goals
router.put('/goals', (req, res) => {
  try {
    const { calories, protein_g, carbs_g, fat_g } = req.body;
    db.prepare('UPDATE nutrition_goals SET calories=?, protein_g=?, carbs_g=?, fat_g=?, updated_at=datetime("now")').run(
      calories || 2000, protein_g || 150, carbs_g || 250, fat_g || 65
    );
    res.json(db.prepare('SELECT * FROM nutrition_goals LIMIT 1').get());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
