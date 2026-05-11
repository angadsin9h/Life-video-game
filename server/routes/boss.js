const express = require('express');
const router = express.Router();
const db = require('../db');

const BOSSES = [
  { name: 'The Sloth King',          title: 'Ruler of Procrastination',      emoji: '😴' },
  { name: 'Lord Procrastinus',       title: 'Master of Endless Delays',      emoji: '⏳' },
  { name: 'Shadow Distractor',       title: 'Devourer of Focus',             emoji: '👁️' },
  { name: 'Void of Laziness',        title: 'The Eternal Excuse Maker',      emoji: '🌀' },
  { name: 'Chaos Bringer',           title: 'Enemy of Routine',              emoji: '💥' },
  { name: 'The Comfort Dragon',      title: 'Guardian of the Couch',         emoji: '🐉' },
  { name: 'Doomscroller Supreme',    title: 'Lord of Wasted Time',           emoji: '📱' },
  { name: 'Baron Von Burnout',       title: 'Harvester of Energy',           emoji: '🔥' },
  { name: 'The Mind Fog',            title: 'Clouder of Clarity',            emoji: '🌫️' },
  { name: 'Temptation Titan',        title: 'Grand Saboteur of Goals',       emoji: '😈' },
  { name: 'General Overwhelm',       title: 'Commander of Paralysis',        emoji: '⚔️' },
  { name: 'The Midnight Snacker',    title: 'Destroyer of Discipline',       emoji: '🍕' },
];

// Get the Monday of a given date
function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// Get boss for a week, create if not exists
function getOrCreateBoss(weekStart) {
  let boss = db.prepare('SELECT * FROM boss_battles WHERE week_start = ?').get(weekStart);
  if (!boss) {
    // Pick boss deterministically from week start
    const seed = weekStart.replace(/-/g, '').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
    const bossData = BOSSES[Math.abs(seed) % BOSSES.length];
    db.prepare(
      'INSERT INTO boss_battles (week_start, boss_name, boss_title, boss_hp, current_hp) VALUES (?, ?, ?, 350, 350)'
    ).run(weekStart, bossData.name, bossData.title);
    boss = db.prepare('SELECT * FROM boss_battles WHERE week_start = ?').get(weekStart);
    boss.emoji = bossData.emoji;
  } else {
    const seed = weekStart.replace(/-/g, '').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
    boss.emoji = BOSSES[Math.abs(seed) % BOSSES.length].emoji;
  }
  return boss;
}

function calculateScore(tasks) {
  const categoryMax = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };
  const scores = {};
  for (const t of tasks) {
    const cat = t.category.toLowerCase();
    if (!categoryMax[cat]) continue;
    let pts = t.duration_minutes >= 30 ? categoryMax[cat] : t.duration_minutes >= 15 ? categoryMax[cat] * 0.75 : categoryMax[cat] * 0.5;
    scores[cat] = Math.min(categoryMax[cat], (scores[cat] || 0) + pts);
  }
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
}

// Sync boss HP based on all scores this week
function syncBossHp(weekStart) {
  const boss = db.prepare('SELECT * FROM boss_battles WHERE week_start = ?').get(weekStart);
  if (!boss || boss.defeated) return boss;

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const logs = db.prepare('SELECT * FROM daily_logs WHERE date >= ? AND date <= ?').all(weekStart, weekEndStr);
  let totalDamage = 0;
  for (const log of logs) {
    const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
    totalDamage += calculateScore(tasks);
  }

  const newHp = Math.max(0, boss.boss_hp - totalDamage);
  if (newHp === 0 && !boss.defeated) {
    db.prepare("UPDATE boss_battles SET current_hp = 0, defeated = 1, defeated_at = datetime('now') WHERE week_start = ?").run(weekStart);
  } else {
    db.prepare('UPDATE boss_battles SET current_hp = ? WHERE week_start = ?').run(newHp, weekStart);
  }
  return db.prepare('SELECT * FROM boss_battles WHERE week_start = ?').get(weekStart);
}

// GET /current — current week's boss
router.get('/current', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart(today);
    getOrCreateBoss(weekStart);
    const boss = syncBossHp(weekStart);
    const seed = weekStart.replace(/-/g, '').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
    const emoji = BOSSES[Math.abs(seed) % BOSSES.length].emoji;

    // Weekly damage breakdown
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const logs = db.prepare('SELECT * FROM daily_logs WHERE date >= ? AND date <= ?').all(weekStart, weekEnd.toISOString().split('T')[0]);
    const dailyDamage = logs.map(log => {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      return { date: log.date, damage: calculateScore(tasks) };
    });

    const totalDefeated = db.prepare('SELECT COUNT(*) as cnt FROM boss_battles WHERE defeated = 1').get().cnt;

    res.json({
      ...boss,
      emoji,
      weekStart,
      dailyDamage,
      totalDefeated,
      hpPercent: Math.round((boss.current_hp / boss.boss_hp) * 100),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history — past bosses
router.get('/history', (req, res) => {
  try {
    const bosses = db.prepare('SELECT * FROM boss_battles ORDER BY week_start DESC LIMIT 10').all();
    const result = bosses.map(b => {
      const seed = b.week_start.replace(/-/g, '').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
      return { ...b, emoji: BOSSES[Math.abs(seed) % BOSSES.length].emoji };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, syncBossHp, getWeekStart };
