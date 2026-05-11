const express = require('express');
const router = express.Router();
const db = require('../db');

// Ensure focus_sessions table exists (safe to run multiple times)
db.exec(`
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    task_name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    completed INTEGER DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS category_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    weekly_minutes INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// POST /sessions — save a completed focus session and auto-log it
router.post('/sessions', (req, res) => {
  try {
    const { date, category, task_name, duration_minutes, notes } = req.body;
    if (!date || !category || !task_name || !duration_minutes) {
      return res.status(400).json({ error: 'date, category, task_name, duration_minutes required' });
    }

    // Save to focus_sessions
    db.prepare(
      'INSERT INTO focus_sessions (date, category, task_name, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(date, category, task_name, duration_minutes, notes || null);

    // Also upsert into daily_logs / task_entries so it counts toward score
    let log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(date);
    if (!log) {
      const result = db.prepare('INSERT INTO daily_logs (date) VALUES (?)').run(date);
      log = { id: result.lastInsertRowid, date };
    }
    db.prepare(
      'INSERT INTO task_entries (log_id, category, task_name, duration_minutes, completed, notes) VALUES (?, ?, ?, ?, 1, ?)'
    ).run(log.id, category, task_name, duration_minutes, notes || null);

    // Side effects
    setImmediate(() => {
      try {
        const { syncBossHp, getWeekStart } = require('./boss');
        syncBossHp(getWeekStart(date));
      } catch (_) {}
      try {
        const { checkAndAwardAchievements, getStats } = require('./achievements');
        checkAndAwardAchievements(getStats());
      } catch (_) {}
    });

    res.json({ success: true, date, category, task_name, duration_minutes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /sessions — recent sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = db.prepare('SELECT * FROM focus_sessions ORDER BY created_at DESC LIMIT 20').all();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /targets — get weekly minute targets per category
router.get('/targets', (req, res) => {
  try {
    const targets = db.prepare('SELECT * FROM category_targets').all();
    const result = { health: 0, mind: 0, work: 0, social: 0, growth: 0 };
    for (const t of targets) result[t.category] = t.weekly_minutes;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /targets — update all targets at once
router.put('/targets', (req, res) => {
  try {
    const categories = ['health', 'mind', 'work', 'social', 'growth'];
    const upsert = db.prepare(`
      INSERT INTO category_targets (category, weekly_minutes, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(category) DO UPDATE SET weekly_minutes = excluded.weekly_minutes, updated_at = datetime('now')
    `);
    for (const cat of categories) {
      if (req.body[cat] !== undefined) upsert.run(cat, Math.max(0, parseInt(req.body[cat]) || 0));
    }
    const targets = db.prepare('SELECT * FROM category_targets').all();
    const result = { health: 0, mind: 0, work: 0, social: 0, growth: 0 };
    for (const t of targets) result[t.category] = t.weekly_minutes;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
