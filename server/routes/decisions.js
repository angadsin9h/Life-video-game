const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    context TEXT,
    options_considered TEXT,
    chosen_option TEXT,
    reasoning TEXT,
    expected_outcome TEXT,
    actual_outcome TEXT,
    outcome_rating INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    date TEXT NOT NULL,
    review_date TEXT,
    reviewed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET / - list decisions
router.get('/', (req, res) => {
  try {
    const { category, reviewed } = req.query;
    let query = 'SELECT * FROM decisions WHERE 1=1';
    const params: any[] = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (reviewed !== undefined) { query += ' AND reviewed = ?'; params.push(parseInt(reviewed as string)); }
    query += ' ORDER BY date DESC';
    res.json(db.prepare(query).all(...params));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create decision
router.post('/', (req, res) => {
  try {
    const { title, context, options_considered, chosen_option, reasoning, expected_outcome, category = 'general', date, review_date } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'title and date required' });
    const result = db.prepare(`
      INSERT INTO decisions (title, context, options_considered, chosen_option, reasoning, expected_outcome, category, date, review_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, context || null, options_considered || null, chosen_option || null, reasoning || null, expected_outcome || null, category, date, review_date || null);
    res.json(db.prepare('SELECT * FROM decisions WHERE id = ?').get(result.lastInsertRowid));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id - update (for adding outcome or reviewing)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { actual_outcome, outcome_rating, reviewed, title, context, options_considered, chosen_option, reasoning, expected_outcome, category, review_date } = req.body;
    const d = db.prepare('SELECT * FROM decisions WHERE id = ?').get(id) as any;
    if (!d) return res.status(404).json({ error: 'Not found' });
    db.prepare(`UPDATE decisions SET
      title = ?, context = ?, options_considered = ?, chosen_option = ?,
      reasoning = ?, expected_outcome = ?, actual_outcome = ?,
      outcome_rating = ?, category = ?, review_date = ?, reviewed = ?
      WHERE id = ?
    `).run(
      title ?? d.title, context ?? d.context, options_considered ?? d.options_considered,
      chosen_option ?? d.chosen_option, reasoning ?? d.reasoning, expected_outcome ?? d.expected_outcome,
      actual_outcome ?? d.actual_outcome, outcome_rating ?? d.outcome_rating, category ?? d.category,
      review_date ?? d.review_date, reviewed ?? d.reviewed, id
    );
    res.json(db.prepare('SELECT * FROM decisions WHERE id = ?').get(id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM decisions WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /pending-review - decisions due for review
router.get('/pending-review', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const pending = db.prepare(`
      SELECT * FROM decisions
      WHERE reviewed = 0 AND review_date IS NOT NULL AND review_date <= ?
      ORDER BY review_date ASC
    `).all(today);
    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
