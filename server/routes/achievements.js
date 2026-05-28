const express = require('express');
const router = express.Router();
const db = require('../db');

const ACHIEVEMENTS = [
  // First steps
  { key: 'first_log',      title: 'First Blood',        desc: 'Log your very first day',                    icon: '⚔️',  xp: 100,  rarity: 'common'    },
  { key: 'first_goal',     title: 'Goal Setter',         desc: 'Create your first life goal',                icon: '🎯',  xp: 50,   rarity: 'common'    },
  { key: 'first_quest',    title: 'Quest Accepted',      desc: 'Complete your first daily quest',            icon: '📜',  xp: 75,   rarity: 'common'    },
  { key: 'first_habit',    title: 'Creature of Habit',   desc: 'Create your first habit',                    icon: '🔄',  xp: 50,   rarity: 'common'    },

  // Streak achievements
  { key: 'streak_3',       title: 'On A Roll',           desc: 'Maintain a 3-day streak',                    icon: '🔥',  xp: 150,  rarity: 'common'    },
  { key: 'streak_7',       title: 'Week Warrior',        desc: 'Maintain a 7-day streak',                    icon: '⚡',  xp: 300,  rarity: 'uncommon'  },
  { key: 'streak_14',      title: 'Fortnight Fighter',   desc: 'Maintain a 14-day streak',                   icon: '🌟',  xp: 500,  rarity: 'rare'      },
  { key: 'streak_30',      title: 'Monthly Master',      desc: 'Maintain a 30-day streak',                   icon: '👑',  xp: 1000, rarity: 'epic'      },
  { key: 'streak_100',     title: 'Century Legend',      desc: 'Maintain a 100-day streak',                  icon: '🏆',  xp: 5000, rarity: 'legendary' },

  // Score achievements
  { key: 'score_50',       title: 'Above Average',       desc: 'Score 50+ in a single day',                  icon: '📈',  xp: 100,  rarity: 'common'    },
  { key: 'score_80',       title: 'Elite Performer',     desc: 'Score 80+ in a single day',                  icon: '💎',  xp: 200,  rarity: 'uncommon'  },
  { key: 'score_100',      title: 'Perfect Day',         desc: 'Achieve a perfect score of 100',             icon: '✨',  xp: 500,  rarity: 'rare'      },
  { key: 'avg_70',         title: 'Consistent Champion', desc: '7-day average score above 70',               icon: '🎖️', xp: 400,  rarity: 'rare'      },

  // Time achievements
  { key: 'hours_10',       title: 'Time Investor',       desc: 'Log 10+ total hours',                        icon: '⏱️', xp: 100,  rarity: 'common'    },
  { key: 'hours_50',       title: 'Dedicated',           desc: 'Log 50+ total hours',                        icon: '🕐',  xp: 300,  rarity: 'uncommon'  },
  { key: 'hours_100',      title: 'Centurion',           desc: 'Log 100+ total hours',                       icon: '⏰',  xp: 500,  rarity: 'rare'      },
  { key: 'hours_500',      title: 'Time Master',         desc: 'Log 500+ total hours',                       icon: '🌌',  xp: 2000, rarity: 'legendary' },

  // Category achievements
  { key: 'all_categories', title: 'Balance Seeker',      desc: 'Log all 5 categories in one day',            icon: '☯️',  xp: 300,  rarity: 'rare'      },
  { key: 'health_week',    title: 'Health Knight',       desc: 'Log health category 7 days in a row',        icon: '🛡️', xp: 250,  rarity: 'uncommon'  },
  { key: 'mind_week',      title: 'Mind Scholar',        desc: 'Log mind category 7 days in a row',          icon: '📚',  xp: 250,  rarity: 'uncommon'  },
  { key: 'work_week',      title: 'Work Machine',        desc: 'Log work category 7 days in a row',          icon: '⚙️',  xp: 250,  rarity: 'uncommon'  },

  // Task count
  { key: 'tasks_50',       title: 'Task Veteran',        desc: 'Log 50 total task entries',                  icon: '📋',  xp: 200,  rarity: 'uncommon'  },
  { key: 'tasks_200',      title: 'Task Legend',         desc: 'Log 200 total task entries',                 icon: '📊',  xp: 500,  rarity: 'rare'      },

  // Quest achievements
  { key: 'quests_10',      title: 'Quest Veteran',       desc: 'Complete 10 daily quests',                   icon: '⚔️',  xp: 300,  rarity: 'uncommon'  },
  { key: 'quests_50',      title: 'Quest Master',        desc: 'Complete 50 daily quests',                   icon: '🗡️', xp: 1000, rarity: 'epic'      },

  // Goal achievements
  { key: 'goal_complete',  title: 'Goal Crusher',        desc: 'Complete your first life goal',              icon: '🎊',  xp: 200,  rarity: 'uncommon'  },
  { key: 'goals_5',        title: 'Visionary',           desc: 'Complete 5 life goals',                      icon: '🔭',  xp: 500,  rarity: 'rare'      },

  // Boss achievements
  { key: 'boss_first',     title: 'Boss Slayer',         desc: 'Defeat your first weekly boss',              icon: '💀',  xp: 500,  rarity: 'rare'      },
  { key: 'boss_5',         title: 'Dragon Slayer',       desc: 'Defeat 5 weekly bosses',                     icon: '🐉',  xp: 2000, rarity: 'legendary' },
];

function getStats() {
  const logs = db.prepare('SELECT * FROM daily_logs ORDER BY date DESC').all();
  const logsWithTasks = logs.map(log => {
    const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
    return { ...log, tasks };
  });

  const allTasks = db.prepare('SELECT * FROM task_entries').all();
  const totalMinutes = allTasks.reduce((a, t) => a + (t.duration_minutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const totalTaskCount = allTasks.length;

  // Streak
  const dateSet = new Set(logs.map(l => l.date));
  const today = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  let checkDate = new Date(today);
  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    if (dateSet.has(ds)) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  // Best score
  const categoryMax = { health: 25, mind: 25, work: 25, social: 10, growth: 15 };
  function calcScore(tasks) {
    const scores = {};
    for (const t of tasks) {
      const cat = t.category.toLowerCase();
      if (!categoryMax[cat]) continue;
      let pts = t.duration_minutes >= 30 ? categoryMax[cat] : t.duration_minutes >= 15 ? categoryMax[cat] * 0.75 : categoryMax[cat] * 0.5;
      scores[cat] = Math.min(categoryMax[cat], (scores[cat] || 0) + pts);
    }
    return Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
  }

  const dailyScores = logsWithTasks.map(l => ({ date: l.date, score: calcScore(l.tasks), tasks: l.tasks }));
  const bestScore = dailyScores.reduce((best, d) => d.score > best ? d.score : best, 0);

  // Weekly avg
  const last7 = dailyScores.slice(0, 7);
  const weeklyAvg = last7.length > 0 ? Math.round(last7.reduce((a, d) => a + d.score, 0) / last7.length) : 0;

  // Category streaks
  const categories = ['health', 'mind', 'work', 'social', 'growth'];
  const catStreaks = {};
  for (const cat of categories) {
    let streak = 0;
    let d = new Date(today);
    while (true) {
      const ds = d.toISOString().split('T')[0];
      const dayLog = dailyScores.find(l => l.date === ds);
      if (dayLog && dayLog.tasks.some(t => t.category === cat)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    catStreaks[cat] = streak;
  }

  // All-category day check
  const hasAllCatDay = dailyScores.some(d => {
    const cats = new Set(d.tasks.map(t => t.category));
    return categories.every(c => cats.has(c));
  });

  // Goals
  const completedGoals = db.prepare('SELECT COUNT(*) as cnt FROM goals WHERE completed = 1').get().cnt;
  const totalGoals = db.prepare('SELECT COUNT(*) as cnt FROM goals').get().cnt;

  // Quests
  const completedQuests = db.prepare('SELECT COUNT(*) as cnt FROM daily_quests WHERE completed = 1').get().cnt;

  // Boss defeats
  const bossDefeats = db.prepare('SELECT COUNT(*) as cnt FROM boss_battles WHERE defeated = 1').get().cnt;

  return {
    totalLogs: logs.length,
    totalHours,
    totalTaskCount,
    currentStreak,
    bestScore,
    weeklyAvg,
    catStreaks,
    hasAllCatDay,
    completedGoals,
    totalGoals,
    completedQuests,
    bossDefeats,
  };
}

function checkAndAwardAchievements(stats) {
  const unlocked = [];
  const existing = new Set(db.prepare('SELECT key FROM achievements WHERE unlocked_at IS NOT NULL').all().map(a => a.key));

  function award(key) {
    if (existing.has(key)) return;
    db.prepare(`
      INSERT INTO achievements (key, unlocked_at)
      VALUES (?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET unlocked_at = datetime('now')
    `).run(key);
    unlocked.push(key);
    existing.add(key);
  }

  if (stats.totalLogs >= 1)                         award('first_log');
  if (stats.totalGoals >= 1)                        award('first_goal');
  if (stats.completedQuests >= 1)                   award('first_quest');
  if (stats.currentStreak >= 3)                     award('streak_3');
  if (stats.currentStreak >= 7)                     award('streak_7');
  if (stats.currentStreak >= 14)                    award('streak_14');
  if (stats.currentStreak >= 30)                    award('streak_30');
  if (stats.currentStreak >= 100)                   award('streak_100');
  if (stats.bestScore >= 50)                        award('score_50');
  if (stats.bestScore >= 80)                        award('score_80');
  if (stats.bestScore >= 100)                       award('score_100');
  if (stats.weeklyAvg >= 70)                        award('avg_70');
  if (stats.totalHours >= 10)                       award('hours_10');
  if (stats.totalHours >= 50)                       award('hours_50');
  if (stats.totalHours >= 100)                      award('hours_100');
  if (stats.totalHours >= 500)                      award('hours_500');
  if (stats.hasAllCatDay)                           award('all_categories');
  if (stats.catStreaks.health >= 7)                 award('health_week');
  if (stats.catStreaks.mind >= 7)                   award('mind_week');
  if (stats.catStreaks.work >= 7)                   award('work_week');
  if (stats.totalTaskCount >= 50)                   award('tasks_50');
  if (stats.totalTaskCount >= 200)                  award('tasks_200');
  if (stats.completedQuests >= 10)                  award('quests_10');
  if (stats.completedQuests >= 50)                  award('quests_50');
  if (stats.completedGoals >= 1)                    award('goal_complete');
  if (stats.completedGoals >= 5)                    award('goals_5');
  if (stats.bossDefeats >= 1)                       award('boss_first');
  if (stats.bossDefeats >= 5)                       award('boss_5');

  return unlocked;
}

// GET / — all achievements with unlock status
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, unlocked_at FROM achievements').all();
    const unlockedMap = {};
    for (const r of rows) unlockedMap[r.key] = r.unlocked_at;

    const result = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: !!unlockedMap[a.key],
      unlocked_at: unlockedMap[a.key] || null,
    }));

    const totalXp = result.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
    res.json({ achievements: result, totalXp, unlockedCount: result.filter(a => a.unlocked).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /check — evaluate and award any newly earned achievements
router.post('/check', (req, res) => {
  try {
    const stats = getStats();
    const newlyUnlocked = checkAndAwardAchievements(stats);
    const details = newlyUnlocked.map(key => ACHIEVEMENTS.find(a => a.key === key)).filter(Boolean);
    res.json({ newlyUnlocked: details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, checkAndAwardAchievements, getStats, ACHIEVEMENTS };
