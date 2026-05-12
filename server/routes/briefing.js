const express = require('express');
const router = express.Router();
const db = require('../db');

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Try not to become a man of success. Rather become a man of value.", author: "Albert Einstein" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "Spread love everywhere you go.", author: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
  { text: "Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas A. Edison" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr. Seuss" },
  { text: "If life were predictable it would cease to be life and be without flavor.", author: "Eleanor Roosevelt" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// GET / — morning briefing for today
router.get('/', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Today's intentions
    const intentions = db.prepare('SELECT * FROM intentions WHERE date = ? ORDER BY position ASC').all(today).catch ? [] :
      db.prepare('SELECT * FROM intentions WHERE date = ? ORDER BY position ASC').all(today);

    // Today's mood
    const moodRow = (() => { try { return db.prepare('SELECT * FROM mood_logs WHERE date = ? ORDER BY created_at DESC LIMIT 1').get(today); } catch { return null; } })();

    // Habits
    const habits = (() => {
      try {
        return db.prepare('SELECT * FROM habits WHERE active = 1').all().map(h => {
          const completedToday = !!db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?').get(h.id, today);
          return { id: h.id, title: h.title, emoji: h.emoji, completedToday };
        });
      } catch { return []; }
    })();

    // Goals due soon (next 7 days)
    const upcoming = (() => {
      try {
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        return db.prepare('SELECT * FROM goals WHERE completed = 0 AND target_date IS NOT NULL AND target_date <= ? ORDER BY target_date ASC LIMIT 3').all(nextWeek);
      } catch { return []; }
    })();

    // Today's score so far
    const todayLog = (() => {
      try {
        return db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(today);
      } catch { return null; }
    })();

    // Yesterday's score
    const yesterdayLog = (() => {
      try {
        return db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(yesterday);
      } catch { return null; }
    })();

    // Streak
    let streak = 0;
    try {
      const logs = db.prepare('SELECT date FROM daily_logs ORDER BY date DESC LIMIT 60').all();
      const dateSet = new Set(logs.map(l => l.date));
      let d = new Date();
      for (let i = 0; i < 60; i++) {
        const ds = d.toISOString().split('T')[0];
        if (dateSet.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
        else break;
      }
    } catch {}

    // Weekly goals for this week
    const weekStart = (() => {
      const d = new Date(); const dow = d.getDay();
      d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); return d.toISOString().split('T')[0];
    })();
    const weeklyGoals = (() => {
      try { return db.prepare('SELECT * FROM weekly_goals WHERE week_start = ? ORDER BY position ASC').all(weekStart); } catch { return []; }
    })();

    // Sleep last night
    const lastSleep = (() => {
      try { return db.prepare('SELECT * FROM sleep_logs WHERE date = ? OR date = ? ORDER BY date DESC LIMIT 1').get(yesterday, today); } catch { return null; }
    })();

    // Water today
    const waterToday = (() => {
      try { return db.prepare('SELECT * FROM water_logs WHERE date = ?').get(today); } catch { return null; }
    })();

    // Quote
    const quote = getDailyQuote();

    res.json({
      date: today,
      streak,
      intentions,
      mood: moodRow,
      habits,
      upcomingGoals: upcoming,
      todayScore: todayLog?.score ?? null,
      yesterdayScore: yesterdayLog?.score ?? null,
      weeklyGoals,
      sleep: lastSleep,
      water: waterToday ? { glasses: waterToday.glasses, goal: waterToday.goal } : { glasses: 0, goal: 8 },
      quote,
      habitsTotal: habits.length,
      habitsDone: habits.filter(h => h.completedToday).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
