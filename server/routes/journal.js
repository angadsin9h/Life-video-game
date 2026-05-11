const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /:date — get entry for a specific date
router.get('/:date', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM journal_entries WHERE date = ?').get(req.params.date);
    res.json(entry || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — recent entries (last 30)
router.get('/', (req, res) => {
  try {
    const entries = db.prepare('SELECT id, date, content, word_count, created_at, updated_at FROM journal_entries ORDER BY date DESC LIMIT 30').all();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create or update entry for a date
router.post('/', (req, res) => {
  try {
    const { date, content } = req.body;
    if (!date) return res.status(400).json({ error: 'date required' });
    const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;

    db.prepare(`
      INSERT INTO journal_entries (date, content, word_count)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        content = excluded.content,
        word_count = excluded.word_count,
        updated_at = datetime('now')
    `).run(date, content || '', wordCount);

    const entry = db.prepare('SELECT * FROM journal_entries WHERE date = ?').get(date);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:date — delete entry
router.delete('/:date', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM journal_entries WHERE date = ?').run(req.params.date);
    if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
