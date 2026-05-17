const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/focus_journal.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS focus_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    session_type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    task TEXT NOT NULL,
    flow_state INTEGER DEFAULT 0,
    distractions INTEGER DEFAULT 0,
    output_quality INTEGER DEFAULT 5,
    notes TEXT,
    energy_before INTEGER,
    energy_after INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

router.get('/', (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit) || 50);
  const rows = db.prepare('SELECT * FROM focus_entries ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows);
});

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count, SUM(duration) as total_minutes, AVG(flow_state) as avg_flow FROM focus_entries').get();
  const byType = db.prepare('SELECT session_type, COUNT(*) as count, SUM(duration) as total_minutes FROM focus_entries GROUP BY session_type').all();
  const daily = db.prepare(`
    SELECT date, SUM(duration) as total_minutes, COUNT(*) as sessions, AVG(flow_state) as avg_flow
    FROM focus_entries
    WHERE date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all();
  res.json({ total, byType, daily });
});

router.post('/', (req, res) => {
  const { date, session_type, duration, task, flow_state, distractions, output_quality, notes, energy_before, energy_after } = req.body;
  const result = db.prepare(`
    INSERT INTO focus_entries (date, session_type, duration, task, flow_state, distractions, output_quality, notes, energy_before, energy_after)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(date, session_type, duration, task, flow_state, distractions, output_quality, notes, energy_before, energy_after);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM focus_entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
