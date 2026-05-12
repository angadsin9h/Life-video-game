const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'strength',
    duration_minutes INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise TEXT NOT NULL,
    sets INTEGER DEFAULT 0,
    reps INTEGER DEFAULT 0,
    weight_kg REAL DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    FOREIGN KEY(session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
  )
`).run();

// GET / — last 20 sessions
router.get('/', (req, res) => {
  try {
    const sessions = db.prepare('SELECT * FROM workout_sessions ORDER BY date DESC, created_at DESC LIMIT 20').all();
    const result = sessions.map(s => ({
      ...s,
      exercises: db.prepare('SELECT * FROM workout_sets WHERE session_id = ?').all(s.id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /templates — unique session names (for quick repeat)
router.get('/templates', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT name, type FROM workout_sessions ORDER BY name ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create session
router.post('/', (req, res) => {
  try {
    const { date, name, type = 'strength', duration_minutes = 0, notes = '', exercises = [] } = req.body;
    if (!date || !name) return res.status(400).json({ error: 'date and name required' });
    const result = db.prepare('INSERT INTO workout_sessions (date, name, type, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)').run(date, name, type, duration_minutes, notes);
    const sessionId = result.lastInsertRowid;
    for (const ex of exercises) {
      db.prepare('INSERT INTO workout_sets (session_id, exercise, sets, reps, weight_kg, duration_seconds, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        sessionId, ex.exercise || '', ex.sets || 0, ex.reps || 0, ex.weight_kg || 0, ex.duration_seconds || 0, ex.notes || ''
      );
    }
    const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(sessionId);
    res.json({ ...session, exercises: db.prepare('SELECT * FROM workout_sets WHERE session_id = ?').all(sessionId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM workout_sets WHERE session_id = ?').run(req.params.id);
    db.prepare('DELETE FROM workout_sessions WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /personal-records — best sets per exercise
router.get('/personal-records', (req, res) => {
  try {
    const exercises = db.prepare('SELECT DISTINCT exercise FROM workout_sets').all().map(r => r.exercise);
    const records = exercises.map(ex => {
      const best = db.prepare(`
        SELECT ws.*, wk.date FROM workout_sets ws
        JOIN workout_sessions wk ON ws.session_id = wk.id
        WHERE ws.exercise = ?
        ORDER BY ws.weight_kg DESC, ws.reps DESC
        LIMIT 1
      `).get(ex);
      return { exercise: ex, ...best };
    });
    res.json(records.filter(r => r.weight_kg > 0 || r.reps > 0));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
