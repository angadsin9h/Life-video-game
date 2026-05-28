const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    author TEXT DEFAULT '',
    source TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    starred INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    reflection TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET / — all quotes
router.get('/', (req, res) => {
  try {
    const { starred, category, search } = req.query;
    let query = 'SELECT * FROM quotes WHERE 1=1';
    const params = [];
    if (starred === 'true') { query += ' AND starred = 1'; }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (text LIKE ? OR author LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows.map(r => ({ ...r, tags: r.tags ? r.tags.split(',').filter(Boolean) : [] })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — add quote
router.post('/', (req, res) => {
  try {
    const { text, author = '', source = '', tags = [], starred = 0, category = 'general', reflection = '' } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const result = db.prepare(`
      INSERT INTO quotes (text, author, source, tags, starred, category, reflection)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(text, author, source, Array.isArray(tags) ? tags.join(',') : tags, starred ? 1 : 0, category, reflection);
    res.json(db.prepare('SELECT * FROM quotes WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id
router.patch('/:id', (req, res) => {
  try {
    const { text, author, source, tags, starred, category, reflection } = req.body;
    const q = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'not found' });
    db.prepare(`
      UPDATE quotes SET
        text = ?, author = ?, source = ?, tags = ?, starred = ?, category = ?, reflection = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      text ?? q.text,
      author ?? q.author,
      source ?? q.source,
      tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : q.tags,
      starred !== undefined ? (starred ? 1 : 0) : q.starred,
      category ?? q.category,
      reflection ?? q.reflection,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    res.json({ ...updated, tags: updated.tags ? updated.tags.split(',').filter(Boolean) : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
