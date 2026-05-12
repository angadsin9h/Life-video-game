const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    genre TEXT DEFAULT 'non-fiction',
    total_pages INTEGER DEFAULT 0,
    current_page INTEGER DEFAULT 0,
    status TEXT DEFAULT 'want-to-read',
    rating INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET / — all books
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let q = 'SELECT * FROM books';
    const params = [];
    if (status) { q += ' WHERE status = ?'; params.push(status); }
    q += ' ORDER BY updated_at DESC';
    res.json(db.prepare(q).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — add book
router.post('/', (req, res) => {
  try {
    const { title, author = '', genre = 'non-fiction', total_pages = 0, status = 'want-to-read', notes = '' } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title required' });
    const result = db.prepare(
      'INSERT INTO books (title, author, genre, total_pages, status, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(title.trim(), author.trim(), genre, total_pages || 0, status, notes);
    res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id — update book
router.patch('/:id', (req, res) => {
  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'not found' });
    const {
      title = book.title, author = book.author, genre = book.genre,
      total_pages = book.total_pages, current_page = book.current_page,
      status = book.status, rating = book.rating, notes = book.notes,
    } = req.body;

    let started_at = book.started_at;
    let finished_at = book.finished_at;
    const today = new Date().toISOString().split('T')[0];

    if (status === 'reading' && !started_at) started_at = today;
    if (status === 'completed' && !finished_at) { finished_at = today; if (!started_at) started_at = today; }

    db.prepare(`UPDATE books SET
      title=?, author=?, genre=?, total_pages=?, current_page=?,
      status=?, rating=?, notes=?, started_at=?, finished_at=?, updated_at=datetime('now')
      WHERE id=?
    `).run(title, author, genre, total_pages, Math.min(current_page, total_pages || current_page),
      status, rating, notes, started_at, finished_at, req.params.id);

    res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/summary
router.get('/stats/summary', (req, res) => {
  try {
    const all = db.prepare('SELECT * FROM books').all();
    const completed = all.filter(b => b.status === 'completed');
    const reading = all.filter(b => b.status === 'reading');
    const totalPages = completed.reduce((s, b) => s + (b.total_pages || 0), 0);
    const avgRating = completed.filter(b => b.rating > 0).length > 0
      ? +(completed.filter(b => b.rating > 0).reduce((s, b) => s + b.rating, 0) / completed.filter(b => b.rating > 0).length).toFixed(1)
      : 0;
    res.json({ total: all.length, completed: completed.length, reading: reading.length, totalPages, avgRating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
