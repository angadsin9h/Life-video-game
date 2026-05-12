const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS reminder_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT NOT NULL DEFAULT '20:00',
    enabled INTEGER DEFAULT 1,
    types TEXT DEFAULT 'habits,streak,intentions',
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// Seed defaults
const rCount = db.prepare('SELECT COUNT(*) as c FROM reminder_settings').get().c;
if (rCount === 0) db.prepare("INSERT INTO reminder_settings (time, enabled) VALUES ('20:00', 1)").run();

// GET /status — personalized status message for today
router.get('/status', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const messages = [];

    // Streak check
    const logs = db.prepare('SELECT date FROM daily_logs ORDER BY date DESC LIMIT 2').all();
    const hasLoggedToday = logs.some(l => l.date === today);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().split('T')[0];
    const loggedYesterday = logs.some(l => l.date === yd);

    if (!hasLoggedToday) {
      if (loggedYesterday) messages.push({ type: 'streak', priority: 1, msg: "🔥 Don't break your streak! Log today's activities." });
      else messages.push({ type: 'log', priority: 2, msg: "📋 Log today's activities to keep your momentum going." });
    }

    // Habits check
    const habits = db.prepare('SELECT h.id, h.title, h.emoji FROM habits h WHERE h.active = 1').all();
    const completedToday = db.prepare('SELECT habit_id FROM habit_completions WHERE date = ?').all(today).map(c => c.habit_id);
    const incompleteHabits = habits.filter(h => !completedToday.includes(h.id));
    if (incompleteHabits.length > 0) {
      const names = incompleteHabits.slice(0, 2).map(h => `${h.emoji} ${h.title}`).join(', ');
      messages.push({ type: 'habits', priority: 1, msg: `⏰ ${incompleteHabits.length} habit${incompleteHabits.length > 1 ? 's' : ''} still pending: ${names}` });
    }

    // Intentions check
    const intentions = db.prepare('SELECT * FROM intentions WHERE date = ?').all(today);
    const incompleteIntentions = intentions.filter(i => !i.completed);
    if (intentions.length > 0 && incompleteIntentions.length > 0) {
      messages.push({ type: 'intentions', priority: 2, msg: `🎯 ${incompleteIntentions.length} intention${incompleteIntentions.length > 1 ? 's' : ''} left for today` });
    } else if (intentions.length === 0) {
      messages.push({ type: 'intentions', priority: 3, msg: '🌅 Set your 3 daily intentions to guide your focus' });
    }

    // Quests check
    const quests = db.prepare('SELECT * FROM quests WHERE week_start = ? AND completed = 0').all(getWeekStart(today));
    if (quests.length > 0) {
      messages.push({ type: 'quests', priority: 3, msg: `⚔️ ${quests.length} weekly quest${quests.length > 1 ? 's' : ''} in progress` });
    }

    // Positive if all done
    const allHabitsDone = incompleteHabits.length === 0 && habits.length > 0;
    const allIntentionsDone = intentions.length > 0 && incompleteIntentions.length === 0;
    if (hasLoggedToday && allHabitsDone && allIntentionsDone) {
      messages.push({ type: 'celebration', priority: 0, msg: '🌟 You\'ve crushed everything today! Incredible discipline.' });
    }

    // Sort by priority
    messages.sort((a, b) => a.priority - b.priority);

    res.json({
      date: today,
      messages: messages.slice(0, 3),
      summary: {
        logged: hasLoggedToday,
        habitsCompleted: completedToday.length,
        habitsTotal: habits.length,
        intentionsCompleted: intentions.filter(i => i.completed).length,
        intentionsTotal: intentions.length,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const daysToMon = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysToMon);
  return d.toISOString().split('T')[0];
}

// GET /settings — reminder settings
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM reminder_settings ORDER BY id DESC LIMIT 1').get();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /settings — update reminder settings
router.put('/settings', (req, res) => {
  try {
    const { time, enabled } = req.body;
    db.prepare('UPDATE reminder_settings SET time = ?, enabled = ?, updated_at = datetime(\'now\') WHERE id = (SELECT id FROM reminder_settings ORDER BY id DESC LIMIT 1)').run(time || '20:00', enabled ? 1 : 0);
    res.json(db.prepare('SELECT * FROM reminder_settings ORDER BY id DESC LIMIT 1').get());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
