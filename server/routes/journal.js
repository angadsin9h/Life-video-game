const express = require('express');
const router = express.Router();
const db = require('../db');

try { db.prepare('ALTER TABLE journal_entries ADD COLUMN tags TEXT DEFAULT ""').run(); } catch (_) {}
try { db.prepare('ALTER TABLE journal_entries ADD COLUMN mood INTEGER DEFAULT 0').run(); } catch (_) {}

function parseTags(raw) {
  if (!raw) return [];
  return raw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

// GET /search?q=&tag= — full-text + tag search
router.get('/search', (req, res) => {
  try {
    const { q = '', tag = '' } = req.query;
    let entries = db.prepare('SELECT * FROM journal_entries ORDER BY date DESC').all();
    if (q) {
      const lower = q.toLowerCase();
      entries = entries.filter(e =>
        (e.content || '').toLowerCase().includes(lower) ||
        (e.tags || '').toLowerCase().includes(lower)
      );
    }
    if (tag) {
      entries = entries.filter(e => parseTags(e.tags).includes(tag.toLowerCase()));
    }
    res.json(entries.map(e => ({ ...e, tags: parseTags(e.tags) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tags — all tags with counts
router.get('/tags', (req, res) => {
  try {
    const entries = db.prepare('SELECT tags FROM journal_entries WHERE tags IS NOT NULL AND tags != ""').all();
    const counts = {};
    entries.forEach(e => {
      parseTags(e.tags).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:date — get entry for a specific date
router.get('/:date', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM journal_entries WHERE date = ?').get(req.params.date);
    if (!entry) return res.json(null);
    res.json({ ...entry, tags: parseTags(entry.tags) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — recent entries (last 50)
router.get('/', (req, res) => {
  try {
    const limit = Math.min(500, parseInt(req.query.limit) || 50);
    const entries = db.prepare('SELECT id, date, content, word_count, tags, mood, created_at, updated_at FROM journal_entries ORDER BY date DESC LIMIT ?').all(limit);
    res.json(entries.map(e => ({ ...e, tags: parseTags(e.tags) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create or update entry for a date
router.post('/', (req, res) => {
  try {
    const { date, content, tags = [], mood = 0 } = req.body;
    if (!date) return res.status(400).json({ error: 'date required' });
    const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const tagsStr = Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase()).filter(Boolean).join(',') : '';

    db.prepare(`
      INSERT INTO journal_entries (date, content, word_count, tags, mood)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        content = excluded.content,
        word_count = excluded.word_count,
        tags = excluded.tags,
        mood = excluded.mood,
        updated_at = datetime('now')
    `).run(date, content || '', wordCount, tagsStr, mood || 0);

    const entry = db.prepare('SELECT * FROM journal_entries WHERE date = ?').get(date);
    res.json({ ...entry, tags: parseTags(entry.tags) });
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
