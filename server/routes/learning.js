const express = require('express');
const router = express.Router();
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS learning_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'course',
    source TEXT DEFAULT '',
    total_units INTEGER DEFAULT 0,
    completed_units INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    priority INTEGER DEFAULT 1,
    notes TEXT DEFAULT '',
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS learning_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    units_covered INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES learning_items(id) ON DELETE CASCADE
  );
`);

// GET / - all items
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const items = status
      ? db.prepare('SELECT * FROM learning_items WHERE status = ? ORDER BY priority DESC, created_at DESC').all(status)
      : db.prepare('SELECT * FROM learning_items ORDER BY priority DESC, created_at DESC').all();

    const enriched = items.map(item => {
      const sessions = db.prepare('SELECT SUM(duration_minutes) as total FROM learning_sessions WHERE item_id = ?').get(item.id);
      const lastSession = db.prepare('SELECT date FROM learning_sessions WHERE item_id = ? ORDER BY date DESC LIMIT 1').get(item.id);
      const progressPct = item.total_units > 0 ? Math.round((item.completed_units / item.total_units) * 100) : 0;
      return {
        ...item,
        totalMinutes: sessions?.total || 0,
        lastSessionDate: lastSession?.date || null,
        progressPct,
      };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST / - create item
router.post('/', (req, res) => {
  try {
    const { title, type = 'course', source = '', total_units = 0, priority = 1, notes = '' } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const result = db.prepare(
      'INSERT INTO learning_items (title, type, source, total_units, priority, notes, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(title, type, source, total_units, priority, notes, new Date().toISOString().split('T')[0]);
    res.json(db.prepare('SELECT * FROM learning_items WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /:id - update progress or status
router.patch('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM learning_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const { title, type, source, total_units, completed_units, status, priority, notes } = req.body;
    const finished_at = status === 'completed' && item.status !== 'completed' ? new Date().toISOString().split('T')[0] : item.finished_at;
    db.prepare(`UPDATE learning_items SET
      title = ?, type = ?, source = ?, total_units = ?, completed_units = ?,
      status = ?, priority = ?, notes = ?, finished_at = ?, updated_at = datetime('now')
      WHERE id = ?`).run(
      title ?? item.title, type ?? item.type, source ?? item.source,
      total_units ?? item.total_units, completed_units ?? item.completed_units,
      status ?? item.status, priority ?? item.priority, notes ?? item.notes,
      finished_at, req.params.id
    );
    res.json(db.prepare('SELECT * FROM learning_items WHERE id = ?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM learning_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /:id/sessions — log a study session
router.post('/:id/sessions', (req, res) => {
  try {
    const { date, duration_minutes, units_covered = 0, notes = '' } = req.body;
    if (!date || !duration_minutes) return res.status(400).json({ error: 'date and duration_minutes required' });
    db.prepare('INSERT INTO learning_sessions (item_id, date, duration_minutes, units_covered, notes) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, date, duration_minutes, units_covered, notes);
    // Update completed_units
    if (units_covered > 0) {
      const item = db.prepare('SELECT completed_units, total_units FROM learning_items WHERE id = ?').get(req.params.id);
      if (item) {
        const newCompleted = Math.min(item.total_units || 999, (item.completed_units || 0) + units_covered);
        const newStatus = item.total_units > 0 && newCompleted >= item.total_units ? 'completed' : undefined;
        db.prepare(`UPDATE learning_items SET completed_units = ?${newStatus ? ', status = ?, finished_at = ?' : ''}, updated_at = datetime('now') WHERE id = ?`)
          .run(newCompleted, ...(newStatus ? [newStatus, date] : []), req.params.id);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /stats/summary
router.get('/stats/summary', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as cnt FROM learning_items').get().cnt;
    const active = db.prepare("SELECT COUNT(*) as cnt FROM learning_items WHERE status = 'active'").get().cnt;
    const completed = db.prepare("SELECT COUNT(*) as cnt FROM learning_items WHERE status = 'completed'").get().cnt;
    const totalMins = db.prepare('SELECT SUM(duration_minutes) as total FROM learning_sessions').get().total || 0;
    const thisWeekMins = (() => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      return db.prepare('SELECT SUM(duration_minutes) as total FROM learning_sessions WHERE date >= ?').get(weekAgo).total || 0;
    })();
    res.json({ total, active, completed, totalHours: Math.round(totalMins / 60), thisWeekMins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
