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

// GET / - get all daily logs with tasks
router.get('/', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM daily_logs ORDER BY date DESC').all();
    const result = logs.map(log => {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      return { ...log, tasks, score: calculateScore(tasks) };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:date - get log for specific date
router.get('/:date', (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(req.params.date);
    if (!log) return res.json(null);
    const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
    res.json({ ...log, tasks, score: calculateScore(tasks) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create new daily log with tasks
router.post('/', (req, res) => {
  try {
    const { date, tasks } = req.body;
    if (!date || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'date and tasks array required' });
    }

    // Upsert daily log
    let log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(date);
    if (!log) {
      const result = db.prepare('INSERT INTO daily_logs (date) VALUES (?)').run(date);
      log = { id: result.lastInsertRowid, date };
    }

    // Remove old tasks for this date
    db.prepare('DELETE FROM task_entries WHERE log_id = ?').run(log.id);

    // Insert new tasks
    const insertTask = db.prepare(
      'INSERT INTO task_entries (log_id, category, task_name, duration_minutes, completed, notes) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const task of tasks) {
      insertTask.run(log.id, task.category, task.task_name, task.duration_minutes || 0, 1, task.notes || null);
    }

    const allTasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
    const score = calculateScore(allTasks);
    res.json({ ...log, tasks: allTasks, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
