const express = require('express');
const router = express.Router();
const db = require('../db');

function calculateScore(tasks) {
  const categoryMax = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };
  const categoryScores = {};
  for (const task of tasks) {
    const cat = task.category.toLowerCase();
    if (!categoryMax[cat]) continue;
    let pts;
    if (task.duration_minutes >= 30) pts = categoryMax[cat];
    else if (task.duration_minutes >= 15) pts = categoryMax[cat] * 0.75;
    else pts = categoryMax[cat] * 0.5;
    if (!categoryScores[cat]) categoryScores[cat] = 0;
    categoryScores[cat] = Math.min(categoryMax[cat], categoryScores[cat] + pts);
  }
  return Math.round(Object.values(categoryScores).reduce((a, b) => a + b, 0));
}

router.get('/', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM daily_logs ORDER BY date DESC').all();
    const logsWithData = logs.map(log => {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      return { ...log, tasks, score: calculateScore(tasks) };
    });

    // Last 30 days
    const last30 = logsWithData.slice(0, 30);
    const weeklyAvg = last30.slice(0, 7).length > 0
      ? Math.round(last30.slice(0, 7).reduce((a, l) => a + l.score, 0) / last30.slice(0, 7).length)
      : 0;
    const monthlyAvg = last30.length > 0
      ? Math.round(last30.reduce((a, l) => a + l.score, 0) / last30.length)
      : 0;

    // Category breakdowns
    const categoryTotals = { health: 0, mind: 0, work: 0, social: 0, growth: 0 };
    const categoryDays = { health: 0, mind: 0, work: 0, social: 0, growth: 0 };
    for (const log of last30) {
      const catTime = {};
      for (const task of log.tasks) {
        const cat = task.category.toLowerCase();
        if (!catTime[cat]) catTime[cat] = 0;
        catTime[cat] += task.duration_minutes;
      }
      for (const [cat, mins] of Object.entries(catTime)) {
        if (categoryTotals[cat] !== undefined) {
          categoryTotals[cat] += mins;
          categoryDays[cat]++;
        }
      }
    }
    const categoryAvgMinutes = {};
    for (const cat of Object.keys(categoryTotals)) {
      categoryAvgMinutes[cat] = categoryDays[cat] > 0
        ? Math.round(categoryTotals[cat] / last30.length)
        : 0;
    }

    // Streaks
    const allDates = logsWithData.map(l => l.date).sort((a, b) => b.localeCompare(a));
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const dateSet = new Set(allDates);

    let checkDate = new Date(today);
    while (true) {
      const ds = checkDate.toISOString().split('T')[0];
      if (dateSet.has(ds)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Best streak
    if (allDates.length > 0) {
      const sorted = [...allDates].sort();
      tempStreak = 1;
      bestStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
    }

    // Total hours
    const allTasks = db.prepare('SELECT duration_minutes FROM task_entries').all();
    const totalMinutes = allTasks.reduce((a, t) => a + (t.duration_minutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Best score day
    const bestDay = logsWithData.reduce((best, l) => (!best || l.score > best.score) ? l : best, null);

    res.json({
      last30Days: last30.map(l => ({ date: l.date, score: l.score })),
      weeklyAvg,
      monthlyAvg,
      categoryAvgMinutes,
      currentStreak,
      bestStreak,
      totalHours,
      bestDay: bestDay ? { date: bestDay.date, score: bestDay.score } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
