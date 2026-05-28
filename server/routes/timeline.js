const express = require('express');
const router = express.Router();
const db = require('../db');

const CAT_MAX = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };

function calcScore(tasks) {
  const scores = {};
  for (const t of tasks) {
    const cat = t.category.toLowerCase();
    if (!CAT_MAX[cat]) continue;
    let pts = t.duration_minutes >= 30 ? CAT_MAX[cat] : t.duration_minutes >= 15 ? CAT_MAX[cat] * 0.75 : CAT_MAX[cat] * 0.5;
    scores[cat] = Math.min(CAT_MAX[cat], (scores[cat] || 0) + pts);
  }
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
}

// GET /api/timeline?limit=14
router.get('/', (req, res) => {
  try {
    const limit = Math.min(90, parseInt(req.query.limit) || 14);

    // Build list of last N calendar days (fill in gaps)
    const today = new Date().toISOString().split('T')[0];
    const dateList = [];
    for (let i = 0; i < limit; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      dateList.push(d);
    }

    // Fetch all logs in range in bulk
    const oldestDate = dateList[dateList.length - 1];
    const logs = db.prepare('SELECT * FROM daily_logs WHERE date >= ? AND date <= ? ORDER BY date DESC').all(oldestDate, today);
    const logMap = new Map(logs.map(l => [l.date, l]));

    // Fetch all tasks for these log IDs
    const logIds = logs.map(l => l.id);
    const allTasks = logIds.length > 0
      ? db.prepare(`SELECT * FROM task_entries WHERE log_id IN (${logIds.map(() => '?').join(',')})`)
          .all(...logIds)
      : [];
    const tasksByLog = new Map();
    for (const t of allTasks) {
      if (!tasksByLog.has(t.log_id)) tasksByLog.set(t.log_id, []);
      tasksByLog.get(t.log_id).push(t);
    }

    // Fetch moods in range
    const moodRows = (() => {
      try { return db.prepare('SELECT date, mood, emoji, label FROM mood_logs WHERE date >= ? AND date <= ?').all(oldestDate, today); }
      catch { return []; }
    })();
    const moodMap = new Map(moodRows.map(m => [m.date, m]));

    // Fetch sleep in range
    const sleepRows = (() => {
      try { return db.prepare('SELECT date, duration_minutes, quality FROM sleep_logs WHERE date >= ? AND date <= ?').all(oldestDate, today); }
      catch { return []; }
    })();
    const sleepMap = new Map(sleepRows.map(s => [s.date, s]));

    // Fetch water in range
    const waterRows = (() => {
      try { return db.prepare('SELECT date, glasses, goal FROM water_logs WHERE date >= ? AND date <= ?').all(oldestDate, today); }
      catch { return []; }
    })();
    const waterMap = new Map(waterRows.map(w => [w.date, w]));

    // Fetch habits + completions
    const habitsActive = (() => {
      try { return db.prepare('SELECT id, title, emoji FROM habits WHERE active = 1').all(); }
      catch { return []; }
    })();
    const habitCompletions = (() => {
      try {
        return db.prepare(`SELECT habit_id, date FROM habit_completions WHERE date >= ? AND date <= ?`).all(oldestDate, today);
      } catch { return []; }
    })();
    const completionSet = new Set(habitCompletions.map(c => `${c.habit_id}:${c.date}`));
    const habitById = new Map(habitsActive.map(h => [h.id, h]));

    // Fetch nutrition in range
    const nutritionRows = (() => {
      try {
        return db.prepare(`SELECT date, SUM(calories) as calories, SUM(protein_g) as protein_g FROM nutrition_logs WHERE date >= ? AND date <= ? GROUP BY date`).all(oldestDate, today);
      } catch { return []; }
    })();
    const nutritionMap = new Map(nutritionRows.map(n => [n.date, n]));

    // Fetch workout sessions in range
    const workoutRows = (() => {
      try {
        return db.prepare('SELECT date, COUNT(*) as cnt FROM workout_sessions WHERE date >= ? AND date <= ? GROUP BY date').all(oldestDate, today);
      } catch { return []; }
    })();
    const workoutMap = new Map(workoutRows.map(w => [w.date, w.cnt]));

    // Fetch journal entries in range
    const journalRows = (() => {
      try {
        return db.prepare('SELECT date FROM journal_entries WHERE date >= ? AND date <= ?').all(oldestDate, today);
      } catch { return []; }
    })();
    const journalSet = new Set(journalRows.map(j => j.date));

    // Build timeline
    const timeline = dateList.map(date => {
      const log = logMap.get(date);
      const tasks = log ? (tasksByLog.get(log.id) || []) : [];
      const score = calcScore(tasks);

      const dayHabits = habitsActive.filter(h => completionSet.has(`${h.id}:${date}`));

      return {
        date,
        score,
        tasks: tasks.map(t => ({ category: t.category, task_name: t.task_name, duration_minutes: t.duration_minutes })),
        mood: moodMap.get(date) || null,
        sleep: sleepMap.get(date) || null,
        water: waterMap.get(date) || null,
        habits: dayHabits.map(h => ({ title: h.title, emoji: h.emoji || '✅' })),
        nutrition: nutritionMap.get(date) ? { calories: Math.round(nutritionMap.get(date).calories), protein_g: +(nutritionMap.get(date).protein_g || 0) } : null,
        workoutCount: workoutMap.get(date) || 0,
        journalEntry: journalSet.has(date),
      };
    });

    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
