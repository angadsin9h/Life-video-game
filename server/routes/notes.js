const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / - list all notes (pinned first, then newest)
router.get('/', (req, res) => {
  try {
    const notes = db.prepare(
      'SELECT * FROM quick_notes ORDER BY pinned DESC, created_at DESC'
    ).all();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create note
router.post('/', (req, res) => {
  try {
    const { content, tags = '', color = 'slate' } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    const result = db.prepare(
      'INSERT INTO quick_notes (content, tags, color) VALUES (?, ?, ?)'
    ).run(content.trim(), tags, color);
    res.json(db.prepare('SELECT * FROM quick_notes WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - update note
router.put('/:id', (req, res) => {
  try {
    const { content, tags, color, pinned } = req.body;
    const note = db.prepare('SELECT * FROM quick_notes WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    db.prepare(
      'UPDATE quick_notes SET content=?, tags=?, color=?, pinned=?, updated_at=datetime("now") WHERE id=?'
    ).run(
      content ?? note.content,
      tags ?? note.tags,
      color ?? note.color,
      pinned !== undefined ? (pinned ? 1 : 0) : note.pinned,
      req.params.id
    );
    res.json(db.prepare('SELECT * FROM quick_notes WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - delete note
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM quick_notes WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /search?q= - search notes
router.get('/search', (req, res) => {
  try {
    const q = `%${req.query.q ?? ''}%`;
    const notes = db.prepare(
      "SELECT * FROM quick_notes WHERE content LIKE ? OR tags LIKE ? ORDER BY pinned DESC, created_at DESC LIMIT 20"
    ).all(q, q);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
