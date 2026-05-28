const express = require('express');
const router = express.Router();
const db = require('../db');

const CAT_MAX = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };

function calcScore(tasks) {
  const scores = {};
  for (const t of tasks) {
    const cat = (t.category || '').toLowerCase();
    if (!CAT_MAX[cat]) continue;
    const max = CAT_MAX[cat];
    const pts = t.duration_minutes >= 30 ? max : t.duration_minutes >= 15 ? max * 0.75 : max * 0.5;
    scores[cat] = Math.min(max, (scores[cat] || 0) + pts);
  }
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
}

router.get('/', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM daily_logs ORDER BY date ASC').all();
    const logsWithScores = logs.map(log => {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      return { date: log.date, score: calcScore(tasks), tasks };
    });

    if (logsWithScores.length === 0) {
      return res.json({ insights: [], weeklyTrend: null });
    }

    const today = new Date().toISOString().split('T')[0];
    const sorted = [...logsWithScores].sort((a, b) => b.date.localeCompare(a.date));

    // Week-over-week trend
    const last7 = sorted.slice(0, 7);
    const prev7 = sorted.slice(7, 14);
    const last7Avg = last7.length ? Math.round(last7.reduce((s, d) => s + d.score, 0) / last7.length) : 0;
    const prev7Avg = prev7.length ? Math.round(prev7.reduce((s, d) => s + d.score, 0) / prev7.length) : 0;
    const weekDelta = last7Avg - prev7Avg;

    // Best and worst categories (all time avg)
    const catTotals = {};
    const catCounts = {};
    for (const log of logsWithScores) {
      for (const t of log.tasks) {
        const cat = (t.category || '').toLowerCase();
        if (!CAT_MAX[cat]) continue;
        catTotals[cat] = (catTotals[cat] || 0) + t.duration_minutes;
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
    }
    const catAvg = {};
    for (const cat of Object.keys(CAT_MAX)) {
      catAvg[cat] = catCounts[cat] ? Math.round(catTotals[cat] / catCounts[cat]) : 0;
    }
    const activeCats = Object.entries(catAvg).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const bestCat = activeCats[0]?.[0] ?? null;
    const weakestCat = activeCats.length > 0 ? activeCats[activeCats.length - 1][0] : null;

    // Longest drought (gap between logs)
    let longestDrought = 0;
    for (let i = 1; i < logsWithScores.length; i++) {
      const prev = new Date(logsWithScores[i - 1].date);
      const curr = new Date(logsWithScores[i].date);
      const gap = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)) - 1;
      if (gap > longestDrought) longestDrought = gap;
    }

    // Best day of week
    const dayScores = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);
    for (const log of logsWithScores) {
      const dow = new Date(log.date).getDay();
      dayScores[dow] += log.score;
      dayCounts[dow]++;
    }
    const dayAvgs = dayScores.map((s, i) => dayCounts[i] > 0 ? s / dayCounts[i] : 0);
    const bestDowIdx = dayAvgs.indexOf(Math.max(...dayAvgs));
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDow = dayCounts[bestDowIdx] > 0 ? DAY_NAMES[bestDowIdx] : null;

    // Score consistency (std dev)
    const scores = sorted.slice(0, 30).map(d => d.score);
    const mean = scores.reduce((s, v) => s + v, 0) / (scores.length || 1);
    const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / (scores.length || 1);
    const stdDev = Math.round(Math.sqrt(variance));

    // Perfect days in last 30
    const perfectDays30 = sorted.slice(0, 30).filter(d => d.score >= 100).length;

    // Most productive hour (from timer sessions)
    const sessions = db.prepare("SELECT created_at FROM timer_sessions ORDER BY created_at DESC LIMIT 200").all();
    const hourCounts = Array(24).fill(0);
    for (const s of sessions) {
      try {
        const h = new Date(s.created_at).getHours();
        hourCounts[h]++;
      } catch (_) {}
    }
    const peakHour = sessions.length > 0 ? hourCounts.indexOf(Math.max(...hourCounts)) : null;

    // Score distribution buckets
    const scoreDist = { '0-24': 0, '25-49': 0, '50-74': 0, '75-99': 0, '100': 0 };
    for (const log of sorted.slice(0, 30)) {
      if (log.score >= 100) scoreDist['100']++;
      else if (log.score >= 75) scoreDist['75-99']++;
      else if (log.score >= 50) scoreDist['50-74']++;
      else if (log.score >= 25) scoreDist['25-49']++;
      else scoreDist['0-24']++;
    }

    // Day-of-week averages array
    const dowAvgs = dayAvgs.map((avg, i) => ({
      day: DAY_NAMES[i].slice(0, 3),
      avg: Math.round(avg),
      count: dayCounts[i],
    }));

    // Best and worst DOW
    const worstDowIdx = dayAvgs.map((v, i) => ({ v, i })).filter(x => dayCounts[x.i] > 0).sort((a, b) => a.v - b.v)[0]?.i ?? null;
    const worstDow = worstDowIdx !== null ? DAY_NAMES[worstDowIdx] : null;

    // Monthly score total
    const monthlyTotal = sorted.slice(0, 30).reduce((s, d) => s + d.score, 0);

    const insights = [];

    if (weekDelta > 10) insights.push({ type: 'positive', text: `Your weekly average is up ${weekDelta} pts vs last week — great momentum!` });
    else if (weekDelta < -10) insights.push({ type: 'warning', text: `Your weekly average dropped ${Math.abs(weekDelta)} pts vs last week. Time to refocus.` });

    if (bestCat) insights.push({ type: 'info', text: `Your strongest category is ${bestCat} — you've built a real habit there.` });
    if (weakestCat && weakestCat !== bestCat) insights.push({ type: 'opportunity', text: `${weakestCat} is your weakest area. Even 20 min/day would make a big difference.` });
    if (bestDow) insights.push({ type: 'info', text: `${bestDow} is your best day of the week on average — use it for your hardest tasks.` });
    if (longestDrought > 3) insights.push({ type: 'warning', text: `Your longest gap between log entries was ${longestDrought} days. Consistency is everything.` });
    if (perfectDays30 > 0) insights.push({ type: 'positive', text: `${perfectDays30} perfect days in the last 30 — that's elite consistency!` });
    if (stdDev < 15 && scores.length >= 7) insights.push({ type: 'positive', text: `Your score variance is low (±${stdDev} pts) — you're impressively consistent.` });
    else if (stdDev > 30 && scores.length >= 7) insights.push({ type: 'info', text: `High score variance (±${stdDev} pts) — your days are quite different. Try for more consistency.` });
    if (peakHour !== null) {
      const ampm = peakHour < 12 ? `${peakHour || 12}am` : `${peakHour === 12 ? 12 : peakHour - 12}pm`;
      insights.push({ type: 'info', text: `Most of your focus sessions happen around ${ampm}. Protect that time block!` });
    }

    res.json({
      insights: insights.slice(0, 6),
      weeklyTrend: { last7Avg, prev7Avg, delta: weekDelta },
      bestCat,
      weakestCat,
      bestDow,
      worstDow,
      longestDrought,
      perfectDays30,
      scoreStdDev: stdDev,
      catAvgMinutes: catAvg,
      scoreDist,
      dowAvgs,
      monthlyTotal,
      totalDaysLogged: logsWithScores.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
