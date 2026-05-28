const express = require('express');
const router = express.Router();
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    daily_requirement TEXT NOT NULL,
    enrolled_at TEXT DEFAULT (datetime('now')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    abandoned INTEGER DEFAULT 0
  );
`);

const CHALLENGE_TEMPLATES = [
  {
    id: 'warrior_7',
    title: 'Warrior Week',
    emoji: '⚔️',
    duration: 7,
    description: 'Log at least 50 points every day for 7 days straight.',
    requirement: 'min_score_50',
    rarity: 'common',
    reward_xp: 500,
    color: 'green',
  },
  {
    id: 'monk_14',
    title: 'Monk Mode',
    emoji: '🧘',
    duration: 14,
    description: 'Log 30+ min of Mind or Growth activities every day for 2 weeks.',
    requirement: 'mind_or_growth_30',
    rarity: 'rare',
    reward_xp: 1200,
    color: 'cyan',
  },
  {
    id: 'iron_30',
    title: 'Iron Month',
    emoji: '🏋️',
    duration: 30,
    description: 'Log 30+ min of Health every day for a full month.',
    requirement: 'health_30',
    rarity: 'epic',
    reward_xp: 3000,
    color: 'orange',
  },
  {
    id: 'legend_30',
    title: 'Legend Challenge',
    emoji: '🌟',
    duration: 30,
    description: 'Score 70+ points every single day for 30 days.',
    requirement: 'min_score_70',
    rarity: 'legendary',
    reward_xp: 5000,
    color: 'yellow',
  },
  {
    id: 'balance_14',
    title: 'Balance Quest',
    emoji: '☯️',
    duration: 14,
    description: 'Log at least 15 min in 3+ different categories every day for 14 days.',
    requirement: 'three_cats_15',
    rarity: 'rare',
    reward_xp: 1500,
    color: 'violet',
  },
  {
    id: 'social_7',
    title: 'Connection Week',
    emoji: '🤝',
    duration: 7,
    description: 'Log 20+ min of Social activities every day for 7 days.',
    requirement: 'social_20',
    rarity: 'uncommon',
    reward_xp: 600,
    color: 'yellow',
  },
];

function checkRequirement(requirement, dayTasks) {
  const catMins = {};
  for (const t of dayTasks) {
    const cat = (t.category || '').toLowerCase();
    catMins[cat] = (catMins[cat] || 0) + (t.duration_minutes || 0);
  }
  const catMax = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };
  const catScores = {};
  for (const t of dayTasks) {
    const cat = (t.category || '').toLowerCase();
    if (!catMax[cat]) continue;
    const max = catMax[cat];
    const pts = t.duration_minutes >= 30 ? max : t.duration_minutes >= 15 ? max * 0.75 : max * 0.5;
    catScores[cat] = Math.min(max, (catScores[cat] || 0) + pts);
  }
  const score = Math.round(Object.values(catScores).reduce((a, b) => a + b, 0));

  if (requirement === 'min_score_50') return score >= 50;
  if (requirement === 'min_score_70') return score >= 70;
  if (requirement === 'health_30') return (catMins.health || 0) >= 30;
  if (requirement === 'social_20') return (catMins.social || 0) >= 20;
  if (requirement === 'mind_or_growth_30') return (catMins.mind || 0) >= 30 || (catMins.growth || 0) >= 30;
  if (requirement === 'three_cats_15') {
    const cats = Object.entries(catMins).filter(([, v]) => v >= 15);
    return cats.length >= 3;
  }
  return false;
}

function getChallengeProgress(challenge) {
  const startDate = challenge.start_date;
  const today = new Date().toISOString().split('T')[0];
  const template = CHALLENGE_TEMPLATES.find(t => t.id === challenge.challenge_id);
  if (!template) return { daysCompleted: 0, daysPassed: 0, daysTotal: challenge.duration_days, dailyResults: [] };

  const dailyResults = [];
  let daysCompleted = 0;
  let daysPassed = 0;

  for (let i = 0; i < challenge.duration_days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    if (dateStr > today) break;
    daysPassed++;

    const log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(dateStr);
    if (log) {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      const passed = checkRequirement(template.requirement, tasks);
      dailyResults.push({ date: dateStr, passed });
      if (passed) daysCompleted++;
    } else {
      dailyResults.push({ date: dateStr, passed: false });
    }
  }

  return { daysCompleted, daysPassed, daysTotal: challenge.duration_days, dailyResults };
}

router.get('/templates', (req, res) => {
  res.json(CHALLENGE_TEMPLATES);
});

router.get('/active', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const challenges = db.prepare(
      'SELECT * FROM challenges WHERE abandoned = 0 AND end_date >= ? ORDER BY enrolled_at DESC'
    ).all(today);
    const result = challenges.map(c => ({
      ...c,
      template: CHALLENGE_TEMPLATES.find(t => t.id === c.challenge_id),
      progress: getChallengeProgress(c),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const challenges = db.prepare(
      'SELECT * FROM challenges WHERE end_date < ? OR completed = 1 OR abandoned = 1 ORDER BY enrolled_at DESC LIMIT 20'
    ).all(today);
    const result = challenges.map(c => ({
      ...c,
      template: CHALLENGE_TEMPLATES.find(t => t.id === c.challenge_id),
      progress: getChallengeProgress(c),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enroll', (req, res) => {
  try {
    const { challenge_id } = req.body;
    const template = CHALLENGE_TEMPLATES.find(t => t.id === challenge_id);
    if (!template) return res.status(404).json({ error: 'Challenge not found' });

    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + template.duration - 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    const existing = db.prepare(
      'SELECT * FROM challenges WHERE challenge_id = ? AND abandoned = 0 AND end_date >= ?'
    ).get(challenge_id, today);
    if (existing) return res.status(409).json({ error: 'Already enrolled in this challenge' });

    const result = db.prepare(`
      INSERT INTO challenges (challenge_id, title, description, duration_days, daily_requirement, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(challenge_id, template.title, template.description, template.duration, template.requirement, today, endDateStr);

    res.json({ success: true, id: result.lastInsertRowid, start_date: today, end_date: endDateStr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('UPDATE challenges SET abandoned = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
