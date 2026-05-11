const express = require('express');
const router = express.Router();
const db = require('../db');

const categoryMax = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };

function calcScore(tasks) {
  const scores = {};
  for (const t of tasks) {
    const cat = t.category.toLowerCase();
    if (!categoryMax[cat]) continue;
    let pts = t.duration_minutes >= 30 ? categoryMax[cat]
      : t.duration_minutes >= 15 ? categoryMax[cat] * 0.75
      : categoryMax[cat] * 0.5;
    scores[cat] = Math.min(categoryMax[cat], (scores[cat] || 0) + pts);
  }
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
}

// GET /:weekStart — summary for a specific ISO week (YYYY-MM-DD of Monday)
router.get('/:weekStart', (req, res) => {
  try {
    const { weekStart } = req.params;
    const weekEnd = new Date(weekStart + 'T12:00:00');
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const logs = db.prepare('SELECT * FROM daily_logs WHERE date >= ? AND date <= ? ORDER BY date ASC').all(weekStart, weekEndStr);
    const logsWithData = logs.map(log => {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      return { ...log, tasks, score: calcScore(tasks) };
    });

    const daysLogged = logsWithData.length;
    const totalScore = logsWithData.reduce((s, l) => s + l.score, 0);
    const avgScore = daysLogged > 0 ? Math.round(totalScore / daysLogged) : 0;
    const bestDay = logsWithData.reduce((best, l) => (!best || l.score > best.score) ? l : best, null);
    const totalMinutes = logsWithData.flatMap(l => l.tasks).reduce((s, t) => s + (t.duration_minutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    const catMins = { health: 0, mind: 0, work: 0, social: 0, growth: 0 };
    for (const log of logsWithData) {
      for (const t of log.tasks) {
        if (catMins[t.category] !== undefined) catMins[t.category] += t.duration_minutes;
      }
    }

    const dailyScores = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart + 'T12:00:00');
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logsWithData.find(l => l.date === dateStr);
      return { date: dateStr, score: log ? log.score : null };
    });

    // Previous week comparison
    const prevWeekStart = new Date(weekStart + 'T12:00:00');
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0];
    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
    const prevLogs = db.prepare('SELECT * FROM daily_logs WHERE date >= ? AND date <= ?').all(prevWeekStartStr, prevWeekEnd.toISOString().split('T')[0]);
    const prevScores = prevLogs.map(log => {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      return calcScore(tasks);
    });
    const prevAvg = prevScores.length > 0 ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length) : 0;

    // Quests completed this week
    const questsDone = db.prepare('SELECT COUNT(*) as cnt FROM daily_quests WHERE date >= ? AND date <= ? AND completed = 1').get(weekStart, weekEndStr).cnt;
    const questsTotal = db.prepare('SELECT COUNT(*) as cnt FROM daily_quests WHERE date >= ? AND date <= ?').get(weekStart, weekEndStr).cnt;

    // Mood data
    const moods = db.prepare('SELECT date, mood FROM mood_logs WHERE date >= ? AND date <= ? ORDER BY date ASC').all(weekStart, weekEndStr);
    const avgMood = moods.length > 0 ? Math.round(moods.reduce((s, m) => s + m.mood, 0) / moods.length * 10) / 10 : null;

    // Top tasks
    const topTasks = db.prepare(`
      SELECT te.task_name, te.category, SUM(te.duration_minutes) as total_mins, COUNT(*) as times
      FROM task_entries te
      JOIN daily_logs dl ON te.log_id = dl.id
      WHERE dl.date >= ? AND dl.date <= ?
      GROUP BY te.task_name, te.category
      ORDER BY total_mins DESC
      LIMIT 5
    `).all(weekStart, weekEndStr);

    res.json({
      weekStart,
      weekEnd: weekEndStr,
      daysLogged,
      avgScore,
      totalScore,
      bestDay: bestDay ? { date: bestDay.date, score: bestDay.score } : null,
      totalHours,
      catMins,
      dailyScores,
      prevAvg,
      scoreDelta: avgScore - prevAvg,
      questsDone,
      questsTotal,
      avgMood,
      topTasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — list last 8 week summaries (just the start dates + avg scores)
router.get('/', (req, res) => {
  try {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

    const weeks = [];
    for (let i = 0; i < 8; i++) {
      const wStart = new Date(monday);
      wStart.setDate(monday.getDate() - i * 7);
      const wStartStr = wStart.toISOString().split('T')[0];
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);

      const logs = db.prepare('SELECT * FROM daily_logs WHERE date >= ? AND date <= ?').all(wStartStr, wEnd.toISOString().split('T')[0]);
      const scores = logs.map(log => {
        const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
        return calcScore(tasks);
      });

      weeks.push({
        weekStart: wStartStr,
        daysLogged: logs.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      });
    }
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
