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

module.exports = router;
