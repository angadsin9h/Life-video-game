const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS reading_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_title TEXT NOT NULL,
    author TEXT,
    highlight TEXT NOT NULL,
    note TEXT,
    chapter TEXT,
    page_number INTEGER,
    type TEXT DEFAULT 'highlight',
    tags TEXT,
    starred INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET / - list notes (optionally filtered by book)
router.get('/', (req, res) => {
  try {
    const { book, starred, type } = req.query;
    let q = 'SELECT * FROM reading_notes WHERE 1=1';
    const params = [];
    if (book) { q += ' AND book_title = ?'; params.push(book); }
    if (starred) { q += ' AND starred = 1'; }
    if (type) { q += ' AND type = ?'; params.push(type); }
    q += ' ORDER BY created_at DESC';
    res.json(db.prepare(q).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /books - list unique books
router.get('/books', (req, res) => {
  try {
    const books = db.prepare('SELECT DISTINCT book_title, author, COUNT(*) as note_count FROM reading_notes GROUP BY book_title ORDER BY note_count DESC').all();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - add note
router.post('/', (req, res) => {
  try {
    const { book_title, author, highlight, note, chapter, page_number, type = 'highlight', tags, starred = 0 } = req.body;
    if (!book_title || !highlight) return res.status(400).json({ error: 'book_title and highlight required' });
    const result = db.prepare(`
      INSERT INTO reading_notes (book_title, author, highlight, note, chapter, page_number, type, tags, starred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(book_title, author || null, highlight, note || null, chapter || null, page_number || null, type, tags || null, starred ? 1 : 0);
    res.json(db.prepare('SELECT * FROM reading_notes WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id - update (toggle starred, add note)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { starred, note } = req.body;
    const row = db.prepare('SELECT * FROM reading_notes WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (starred !== undefined) db.prepare('UPDATE reading_notes SET starred = ? WHERE id = ?').run(starred ? 1 : 0, id);
    if (note !== undefined) db.prepare('UPDATE reading_notes SET note = ? WHERE id = ?').run(note, id);
    res.json(db.prepare('SELECT * FROM reading_notes WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reading_notes WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
