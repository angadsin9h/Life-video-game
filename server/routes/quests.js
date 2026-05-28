const express = require('express');
const router = express.Router();
const db = require('../db');

const QUEST_POOL = [
  // Health quests
  { id: 'h1', title: 'Morning Warrior',    desc: 'Exercise for 30+ minutes',              category: 'health', target_minutes: 30, bonus_xp: 100 },
  { id: 'h2', title: 'Zen Master',         desc: 'Meditate or do yoga for 20+ minutes',   category: 'health', target_minutes: 20, bonus_xp: 80  },
  { id: 'h3', title: 'Iron Body',          desc: 'Complete a 45+ minute workout',          category: 'health', target_minutes: 45, bonus_xp: 130 },
  { id: 'h4', title: 'Sleep Seeker',       desc: 'Log a full sleep cycle (60+ min entry)', category: 'health', target_minutes: 60, bonus_xp: 90  },
  { id: 'h5', title: 'Nutrition Knight',   desc: 'Meal prep or cook healthy (30+ min)',    category: 'health', target_minutes: 30, bonus_xp: 80  },

  // Mind quests
  { id: 'm1', title: 'Page Turner',        desc: 'Read for 30+ minutes',                   category: 'mind',   target_minutes: 30, bonus_xp: 90  },
  { id: 'm2', title: 'Deep Thinker',       desc: 'Journal or reflect for 15+ minutes',     category: 'mind',   target_minutes: 15, bonus_xp: 70  },
  { id: 'm3', title: 'Brain Builder',      desc: 'Learn something new for 45+ minutes',    category: 'mind',   target_minutes: 45, bonus_xp: 120 },
  { id: 'm4', title: 'Mind Palace',        desc: 'Meditate or mental training 20+ min',    category: 'mind',   target_minutes: 20, bonus_xp: 80  },
  { id: 'm5', title: 'Knowledge Seeker',   desc: 'Study or research for 30+ minutes',      category: 'mind',   target_minutes: 30, bonus_xp: 90  },

  // Work quests
  { id: 'w1', title: 'Focus Champion',     desc: 'Deep work session of 60+ minutes',       category: 'work',   target_minutes: 60, bonus_xp: 150 },
  { id: 'w2', title: 'Task Crusher',       desc: 'Work productively for 45+ minutes',      category: 'work',   target_minutes: 45, bonus_xp: 110 },
  { id: 'w3', title: 'Flow State',         desc: 'Enter deep work mode for 90+ minutes',   category: 'work',   target_minutes: 90, bonus_xp: 200 },
  { id: 'w4', title: 'Planning Sage',      desc: 'Plan projects for 20+ minutes',          category: 'work',   target_minutes: 20, bonus_xp: 70  },
  { id: 'w5', title: 'Code Warrior',       desc: 'Work on a project for 60+ minutes',      category: 'work',   target_minutes: 60, bonus_xp: 150 },

  // Social quests
  { id: 's1', title: 'Connection Builder', desc: 'Connect with someone for 30+ minutes',   category: 'social', target_minutes: 30, bonus_xp: 80  },
  { id: 's2', title: 'Family Time',        desc: 'Spend quality time with family (45+ min)', category: 'social', target_minutes: 45, bonus_xp: 100 },
  { id: 's3', title: 'Community Hero',     desc: 'Help someone or volunteer (30+ min)',    category: 'social', target_minutes: 30, bonus_xp: 100 },

  // Growth quests
  { id: 'g1', title: 'Skill Unlock',       desc: 'Practice a new skill for 30+ minutes',   category: 'growth', target_minutes: 30, bonus_xp: 100 },
  { id: 'g2', title: 'Course Runner',      desc: 'Complete a course lesson (30+ min)',      category: 'growth', target_minutes: 30, bonus_xp: 100 },
  { id: 'g3', title: 'Side Quest Hero',    desc: 'Work on a side project for 45+ minutes', category: 'growth', target_minutes: 45, bonus_xp: 130 },
  { id: 'g4', title: 'Horizon Expander',   desc: 'Explore a new topic for 20+ minutes',    category: 'growth', target_minutes: 20, bonus_xp: 80  },
];

// Deterministic "random" selection based on date string
function selectQuestsForDate(dateStr) {
  // Convert date to a seed number
  const seed = dateStr.replace(/-/g, '').split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
  const shuffled = [...QUEST_POOL];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Pick 3 quests from different categories when possible
  const selected = [];
  const usedCats = new Set();
  for (const q of shuffled) {
    if (selected.length >= 3) break;
    if (!usedCats.has(q.category)) {
      selected.push(q);
      usedCats.add(q.category);
    }
  }
  // If less than 3, fill up
  for (const q of shuffled) {
    if (selected.length >= 3) break;
    if (!selected.includes(q)) selected.push(q);
  }
  return selected.slice(0, 3);
}

// GET /today — get or generate quests for today
router.get('/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let quests = db.prepare('SELECT * FROM daily_quests WHERE date = ?').all(today);

    if (quests.length === 0) {
      const selected = selectQuestsForDate(today);
      const insert = db.prepare(
        'INSERT OR IGNORE INTO daily_quests (date, quest_id, title, description, category, target_minutes, bonus_xp) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const q of selected) {
        insert.run(today, q.id, q.title, q.desc, q.category, q.target_minutes, q.bonus_xp);
      }
      quests = db.prepare('SELECT * FROM daily_quests WHERE date = ?').all(today);
    }

    // Auto-complete quests based on today's logs
    const todayLog = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(today);
    if (todayLog) {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(todayLog.id);
      const catMinutes = {};
      for (const t of tasks) {
        catMinutes[t.category] = (catMinutes[t.category] || 0) + t.duration_minutes;
      }
      const update = db.prepare("UPDATE daily_quests SET completed = 1, completed_at = datetime('now') WHERE date = ? AND quest_id = ? AND completed = 0");
      for (const q of quests) {
        if (!q.completed && (catMinutes[q.category] || 0) >= q.target_minutes) {
          update.run(today, q.quest_id);
        }
      }
      quests = db.prepare('SELECT * FROM daily_quests WHERE date = ?').all(today);
    }

    res.json(quests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history — past 30 days of quests
router.get('/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT date, COUNT(*) as total, SUM(completed) as done FROM daily_quests GROUP BY date ORDER BY date DESC LIMIT 30').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
