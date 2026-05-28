const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS habit_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER DEFAULT 30,
    category TEXT DEFAULT 'health',
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS challenge_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL REFERENCES habit_challenges(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    completed INTEGER DEFAULT 1,
    notes TEXT,
    UNIQUE(challenge_id, date)
  )
`).run();

function calcProgress(challengeId, startDate, durationDays) {
  const checkins = db.prepare('SELECT date FROM challenge_checkins WHERE challenge_id = ? AND completed = 1').all(challengeId);
  const completedDates = new Set(checkins.map(c => c.date));
  const today = new Date().toISOString().split('T')[0];
  const start = new Date(startDate + 'T12:00:00');
  let streak = 0;
  let totalCompleted = completedDates.size;

  // Calculate current streak
  let d = new Date(today + 'T12:00:00');
  for (let i = 0; i < durationDays; i++) {
    const ds = d.toISOString().split('T')[0];
    if (completedDates.has(ds)) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }

  const daysSinceStart = Math.floor((new Date(today + 'T12:00:00') - start) / 86400000) + 1;
  const progressPct = Math.min(100, Math.round((totalCompleted / durationDays) * 100));

  return { streak, totalCompleted, daysSinceStart: Math.max(0, daysSinceStart), progressPct };
}

// GET / - all challenges
router.get('/', (req, res) => {
  try {
    const challenges = db.prepare('SELECT * FROM habit_challenges ORDER BY created_at DESC').all();
    const today = new Date().toISOString().split('T')[0];
    const result = challenges.map(c => {
      const { streak, totalCompleted, daysSinceStart, progressPct } = calcProgress(c.id, c.start_date, c.duration_days);
      const checkedToday = !!db.prepare('SELECT id FROM challenge_checkins WHERE challenge_id = ? AND date = ?').get(c.id, today);
      return { ...c, streak, totalCompleted, daysSinceStart, progressPct, checkedToday };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create challenge
router.post('/', (req, res) => {
  try {
    const { name, description, duration_days = 30, category = 'health', start_date } = req.body;
    if (!name || !start_date) return res.status(400).json({ error: 'name and start_date required' });
    const endDate = new Date(start_date + 'T12:00:00');
    endDate.setDate(endDate.getDate() + duration_days - 1);
    const end_date = endDate.toISOString().split('T')[0];
    const result = db.prepare(`
      INSERT INTO habit_challenges (name, description, duration_days, category, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description || null, duration_days, category, start_date, end_date);
    res.json(db.prepare('SELECT * FROM habit_challenges WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/checkin - check in for today
router.post('/:id/checkin', (req, res) => {
  try {
    const { date, notes } = req.body;
    const today = date || new Date().toISOString().split('T')[0];
    db.prepare('INSERT OR REPLACE INTO challenge_checkins (challenge_id, date, completed, notes) VALUES (?, ?, 1, ?)').run(req.params.id, today, notes || null);
    const challenge = db.prepare('SELECT * FROM habit_challenges WHERE id = ?').get(req.params.id);
    const progress = calcProgress(req.params.id, challenge.start_date, challenge.duration_days);

    // Auto-complete if done
    if (progress.totalCompleted >= challenge.duration_days && challenge.status === 'active') {
      db.prepare("UPDATE habit_challenges SET status = 'completed' WHERE id = ?").run(req.params.id);
    }

    res.json({ ok: true, ...progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/history - full checkin history
router.get('/:id/history', (req, res) => {
  try {
    const checkins = db.prepare('SELECT date, completed, notes FROM challenge_checkins WHERE challenge_id = ? ORDER BY date').all(req.params.id);
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM challenge_checkins WHERE challenge_id = ?').run(req.params.id);
    db.prepare('DELETE FROM habit_challenges WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
