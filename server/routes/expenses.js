const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS expense_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT UNIQUE NOT NULL,
    monthly_limit REAL DEFAULT 0
  )
`).run();

const DEFAULT_BUDGETS = [
  { category: 'food', monthly_limit: 400 },
  { category: 'transport', monthly_limit: 150 },
  { category: 'entertainment', monthly_limit: 100 },
  { category: 'shopping', monthly_limit: 200 },
  { category: 'bills', monthly_limit: 500 },
  { category: 'health', monthly_limit: 100 },
  { category: 'other', monthly_limit: 100 },
];
const stmt = db.prepare('INSERT OR IGNORE INTO expense_budgets (category, monthly_limit) VALUES (?, ?)');
for (const b of DEFAULT_BUDGETS) stmt.run(b.category, b.monthly_limit);

// GET / — all expenses with optional limit
router.get('/', (req, res) => {
  try {
    const limit = Math.min(1000, parseInt(req.query.limit) || 100);
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC, created_at DESC LIMIT ?').all(limit);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /month/:year/:month — get monthly expenses
router.get('/month/:year/:month', (req, res) => {
  try {
    const prefix = `${req.params.year}-${req.params.month.padStart(2, '0')}`;
    const expenses = db.prepare('SELECT * FROM expenses WHERE date LIKE ? ORDER BY date DESC, created_at DESC').all(`${prefix}%`);
    const budgets = db.prepare('SELECT * FROM expense_budgets').all();
    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.category] = b.monthly_limit; });
    const totals = {};
    expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
    res.json({ expenses, totals, budgets: budgetMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /recent — last 20 expenses
router.get('/recent', (req, res) => {
  try {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC, created_at DESC LIMIT 20').all();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — add expense
router.post('/', (req, res) => {
  try {
    const { date, amount, category = 'other', description = '' } = req.body;
    if (!date || !amount) return res.status(400).json({ error: 'date and amount required' });
    const result = db.prepare('INSERT INTO expenses (date, amount, category, description) VALUES (?, ?, ?, ?)').run(date, parseFloat(amount), category, description);
    res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /budgets — update category budget
router.put('/budgets/:category', (req, res) => {
  try {
    const { monthly_limit } = req.body;
    db.prepare('INSERT INTO expense_budgets (category, monthly_limit) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET monthly_limit = ?').run(req.params.category, monthly_limit, monthly_limit);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
