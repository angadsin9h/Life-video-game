const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS commitments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'general',
    deadline TEXT,
    public_stake TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS commitment_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commitment_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(commitment_id, date)
  )
`).run();

// GET /
router.get('/', (req, res) => {
  try {
    const commitments = db.prepare('SELECT * FROM commitments WHERE status = ? ORDER BY created_at DESC').all(req.query.status || 'active');
    const result = commitments.map(c => {
      const checkins = db.prepare('SELECT * FROM commitment_checkins WHERE commitment_id = ? ORDER BY date DESC').all(c.id);
      const streak = (() => {
        let s = 0;
        const today = new Date().toISOString().split('T')[0];
        for (let i = 0; i < 365; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const ds = d.toISOString().split('T')[0];
          const ci = checkins.find(ch => ch.date === ds);
          if (ci && ci.status === 'done') s++;
          else if (i > 0) break;
        }
        return s;
      })();
      return { ...c, checkins: checkins.slice(0, 7), streak, totalDone: checkins.filter(ch => ch.status === 'done').length };
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /
router.post('/', (req, res) => {
  try {
    const { title, description = '', category = 'general', deadline, public_stake = '' } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const result = db.prepare('INSERT INTO commitments (title, description, category, deadline, public_stake) VALUES (?, ?, ?, ?, ?)')
      .run(title, description, category, deadline || null, public_stake);
    res.json(db.prepare('SELECT * FROM commitments WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /:id/checkin
router.post('/:id/checkin', (req, res) => {
  try {
    const { date, status, notes = '' } = req.body;
    if (!date || !status) return res.status(400).json({ error: 'date and status required' });
    db.prepare(`
      INSERT INTO commitment_checkins (commitment_id, date, status, notes)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(commitment_id, date) DO UPDATE SET status = excluded.status, notes = excluded.notes
    `).run(req.params.id, date, status, notes);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /:id
router.patch('/:id', (req, res) => {
  try {
    const { status, title, deadline } = req.body;
    const c = db.prepare('SELECT * FROM commitments WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'not found' });
    db.prepare('UPDATE commitments SET status = ?, title = ?, deadline = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(status ?? c.status, title ?? c.title, deadline !== undefined ? deadline : c.deadline, req.params.id);
    res.json(db.prepare('SELECT * FROM commitments WHERE id = ?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM commitment_checkins WHERE commitment_id = ?').run(req.params.id);
    db.prepare('DELETE FROM commitments WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
