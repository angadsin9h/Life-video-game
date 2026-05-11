const express = require('express');
const router = express.Router();
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const DEFAULTS = {
  username: 'Hero',
  avatar: '⚔️',
  dailyGoal: '100',
  accentColor: 'violet',
  showClassBanner: 'true',
  soundEnabled: 'true',
};

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM user_settings').all();
    const settings = { ...DEFAULTS };
    for (const row of rows) settings[row.key] = row.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', (req, res) => {
  try {
    const allowed = Object.keys(DEFAULTS);
    const upsert = db.prepare(`
      INSERT INTO user_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        upsert.run(key, String(req.body[key]));
      }
    }
    const rows = db.prepare('SELECT key, value FROM user_settings').all();
    const settings = { ...DEFAULTS };
    for (const row of rows) settings[row.key] = row.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM daily_logs ORDER BY date DESC').all()
    const data = {
      exported_at: new Date().toISOString(),
      logs: logs.map(log => ({
        ...log,
        tasks: db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id),
      })),
      habits: db.prepare('SELECT * FROM habits').all(),
      goals: db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all(),
      achievements: db.prepare("SELECT * FROM achievements WHERE unlocked_at IS NOT NULL").all(),
      focus_sessions: db.prepare('SELECT * FROM focus_sessions ORDER BY created_at DESC').all(),
      journal_entries: db.prepare('SELECT date, word_count, created_at FROM journal_entries ORDER BY date DESC').all(),
      mood_logs: db.prepare('SELECT * FROM mood_logs ORDER BY date DESC').all(),
    }
    res.setHeader('Content-Disposition', 'attachment; filename="lifequest-export.json"')
    res.setHeader('Content-Type', 'application/json')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;
