const express = require('express');
const router = express.Router();
const db = require('../db');

const MOCK_RESPONSES = {
  health: [
    "🏋️ **Health Quest Tip:** Start with a 20-minute morning workout routine. Even light exercise like yoga or a brisk walk can boost your health score by up to 25 points! Remember: consistency beats intensity. Try the 5-minute rule — commit to just 5 minutes, and you'll often continue longer.",
    "💪 **Body Stats Upgrade:** Focus on sleep optimization first. 7-9 hours of quality sleep improves cognitive performance by 40%, emotional regulation, and physical recovery. Set a consistent sleep schedule — your future self will thank you with higher stats across ALL categories!",
    "🥗 **Nutrition Power-Up:** Meal prep on Sundays to maintain healthy eating during busy weekdays. Aim for the 80/20 rule: eat nutritiously 80% of the time and don't stress about the other 20%. Hydration is your cheapest performance booster — drink water before every meal.",
  ],
  work: [
    "⚡ **Productivity Combo:** Use the Pomodoro Technique — 25 minutes focused work, 5 minutes break. After 4 cycles, take a 15-30 minute break. This technique can increase your work score dramatically by maintaining peak focus throughout the day.",
    "🎯 **Focus Mode Activated:** Identify your top 3 Most Important Tasks (MITs) each morning before checking email or social media. Complete these first when your energy is highest. This single habit can transform your work productivity score from average to legendary.",
    "🧠 **Deep Work Strategy:** Block 2-3 hours of uninterrupted deep work time daily. Turn off notifications, close unnecessary tabs, and enter flow state. Deep work is 4x more productive than shallow work — this is where your best contributions live.",
  ],
  goal: [
    "🎯 **Goal Architecture:** Break your goals into a hierarchy — Life Goals → Annual Goals → Monthly Goals → Weekly Goals → Daily Tasks. Each daily task should connect to a bigger goal. This creates unstoppable momentum and makes every small win meaningful.",
    "📈 **SMART Goals Framework:** Make goals Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of 'get fit', try 'run 5K in under 30 minutes by March 15'. The specificity transforms vague wishes into achievable missions.",
    "🔥 **Goal Stacking:** Pair a new habit with an existing one (habit stacking). Want to learn Spanish? Study during your morning coffee. Want to exercise? Do it right after brushing teeth. This makes new habits automatic.",
  ],
  learn: [
    "📚 **Learning Accelerator:** Use the Feynman Technique — after learning something, explain it in simple terms as if teaching a child. If you can't explain it simply, you don't understand it well enough yet. This reveals gaps and deepens understanding.",
    "🧠 **Spaced Repetition:** Review material at increasing intervals (1 day, 3 days, 1 week, 2 weeks, 1 month). This exploits the spacing effect — one of the most scientifically validated learning techniques. Apps like Anki automate this for you.",
    "🎮 **Gamify Your Learning:** Set specific learning goals with deadlines. Track your progress visually. Reward yourself for milestones. Learning 20 minutes daily beats 3-hour weekend cramming sessions by a factor of 3 in long-term retention.",
  ],
  default: [
    "🌟 **Life Quest Wisdom:** The secret to leveling up in life is consistency, not perfection. Show up every day, even at 60% capacity. A 60% day logged beats a 0% day every time. Small daily improvements compound into extraordinary results over months and years.",
    "⚔️ **Character Development:** You are the hero of your own story. Every challenge is a quest, every skill learned is an upgrade, every setback is XP (experience points). Reframe failures as data — what can you learn and adjust for next time?",
    "🏆 **Achievement Unlocked:** Research shows that tracking your progress makes you 2-3x more likely to achieve your goals. By using LifeQuest daily, you're already ahead of 90% of people. Keep logging, keep growing!",
    "💡 **Power Habit Formula:** Identity → Process → Outcome. Start by deciding who you want to be ('I am someone who exercises'), then build the process (30-min morning workout), and the outcomes (health, energy, confidence) will follow naturally.",
    "🎯 **Energy Management:** Manage your energy, not just your time. Identify your peak performance hours (most people: 9-11am). Schedule your most important work then. Reserve routine tasks for low-energy periods. This alone can double your effective productivity.",
  ],
};

function getMockResponse(message, userContext) {
  const lower = message.toLowerCase();
  let pool = MOCK_RESPONSES.default;
  if (lower.includes('health') || lower.includes('workout') || lower.includes('exercise') || lower.includes('sleep') || lower.includes('diet') || lower.includes('nutrition')) {
    pool = MOCK_RESPONSES.health;
  } else if (lower.includes('work') || lower.includes('productiv') || lower.includes('focus') || lower.includes('task')) {
    pool = MOCK_RESPONSES.work;
  } else if (lower.includes('goal') || lower.includes('habit') || lower.includes('achieve')) {
    pool = MOCK_RESPONSES.goal;
  } else if (lower.includes('learn') || lower.includes('study') || lower.includes('skill') || lower.includes('read')) {
    pool = MOCK_RESPONSES.learn;
  }
  const base = pool[Math.floor(Math.random() * pool.length)];

  if (!userContext) return base;

  // Append personalized context if available
  const { streak, weeklyAvg, totalHours, weakestCat } = userContext;
  let personal = '';
  if (streak > 0) personal += `\n\n📊 **Your Stats:** You're on a ${streak}-day streak`;
  if (weeklyAvg > 0) personal += `, averaging ${weeklyAvg} pts/week`;
  if (totalHours > 0) personal += `, with ${totalHours} total hours invested`;
  if (weakestCat) personal += `. Your weakest category is **${weakestCat}** — that's your biggest opportunity for growth!`;
  if (personal) personal += ' Keep pushing! ⚡';

  return base + personal;
}

function getUserContext() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const logs = db.prepare('SELECT * FROM daily_logs ORDER BY date DESC LIMIT 30').all();
    const allTasks = db.prepare('SELECT * FROM task_entries').all();
    const totalMinutes = allTasks.reduce((a, t) => a + (t.duration_minutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);

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

    const scores = logs.map(log => {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      return calcScore(tasks);
    });
    const weeklyAvg = scores.slice(0, 7).length > 0
      ? Math.round(scores.slice(0, 7).reduce((a, b) => a + b, 0) / scores.slice(0, 7).length)
      : 0;

    // Streak
    const dateSet = new Set(logs.map(l => l.date));
    let streak = 0;
    let d = new Date(today);
    while (dateSet.has(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate() - 1); }

    // Category avg minutes (last 30 days)
    const catMins = { health: 0, mind: 0, work: 0, social: 0, growth: 0 };
    const catDays = { health: 0, mind: 0, work: 0, social: 0, growth: 0 };
    for (const log of logs) {
      const tasks = db.prepare('SELECT * FROM task_entries WHERE log_id = ?').all(log.id);
      const dayMins = {};
      for (const t of tasks) { dayMins[t.category] = (dayMins[t.category] || 0) + t.duration_minutes; }
      for (const [cat, mins] of Object.entries(dayMins)) {
        if (catMins[cat] !== undefined) { catMins[cat] += mins; catDays[cat]++; }
      }
    }
    const avgMins = {};
    for (const cat of Object.keys(catMins)) {
      avgMins[cat] = catDays[cat] > 0 ? Math.round(catMins[cat] / catDays[cat]) : 0;
    }
    const active = Object.entries(avgMins).filter(([, v]) => v > 0);
    const weakestCat = active.length > 0 ? active.sort((a, b) => a[1] - b[1])[0][0] : null;

    // Achievements + goals
    const unlockedAch = db.prepare('SELECT COUNT(*) as cnt FROM achievements WHERE unlocked_at IS NOT NULL').get().cnt;
    const completedGoals = db.prepare('SELECT COUNT(*) as cnt FROM goals WHERE completed = 1').get().cnt;
    const activeGoals = db.prepare('SELECT title FROM goals WHERE completed = 0 LIMIT 3').all();

    // New data sources
    let sleepAvg = null;
    try {
      const sleepRows = db.prepare('SELECT duration_minutes, quality FROM sleep_logs ORDER BY date DESC LIMIT 7').all();
      if (sleepRows.length > 0) {
        const validSleep = sleepRows.filter(r => r.duration_minutes > 0);
        sleepAvg = validSleep.length > 0 ? {
          avgHours: +(validSleep.reduce((s, r) => s + r.duration_minutes, 0) / validSleep.length / 60).toFixed(1),
          avgQuality: +(validSleep.filter(r => r.quality > 0).reduce((s, r) => s + r.quality, 0) / Math.max(1, validSleep.filter(r => r.quality > 0).length)).toFixed(1),
        } : null;
      }
    } catch {}

    let habits = null;
    try {
      const habitRows = db.prepare('SELECT * FROM habits WHERE active = 1').all();
      const habitStats = habitRows.map(h => {
        const last7 = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
          last7.push(!!db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?').get(h.id, d));
        }
        return { title: h.title, completionRate: Math.round(last7.filter(Boolean).length / 7 * 100) };
      });
      habits = { total: habitRows.length, avgRate: habitStats.length ? Math.round(habitStats.reduce((s, h) => s + h.completionRate, 0) / habitStats.length) : 0, weakest: habitStats.sort((a, b) => a.completionRate - b.completionRate)[0]?.title };
    } catch {}

    let moodAvg = null;
    try {
      const moodRows = db.prepare('SELECT mood FROM mood_logs ORDER BY date DESC LIMIT 7').all();
      if (moodRows.length > 0) moodAvg = +(moodRows.reduce((s, r) => s + r.mood, 0) / moodRows.length).toFixed(1);
    } catch {}

    let waterAvg = null;
    try {
      const waterRows = db.prepare('SELECT glasses, goal FROM water_logs ORDER BY date DESC LIMIT 7').all();
      if (waterRows.length > 0) waterAvg = {
        avg: +(waterRows.reduce((s, r) => s + r.glasses, 0) / waterRows.length).toFixed(1),
        goal: waterRows[0]?.goal || 8,
      };
    } catch {}

    let booksRead = null;
    try {
      booksRead = db.prepare('SELECT COUNT(*) as cnt FROM books WHERE status = "completed"').get().cnt;
    } catch {}

    let workoutCount = null;
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      workoutCount = db.prepare('SELECT COUNT(*) as cnt FROM workout_sessions WHERE date >= ?').get(thirtyDaysAgo).cnt;
    } catch {}

    return {
      streak, weeklyAvg, totalHours, weeklyScores: scores.slice(0, 7),
      categoryAvgMinutes: avgMins, weakestCat, unlockedAchievements: unlockedAch,
      completedGoals, activeGoals: activeGoals.map(g => g.title), totalLogged: logs.length,
      sleepAvg, habits, moodAvg, waterAvg, booksRead, workoutCount,
    };
  } catch {
    return null;
  }
}

function buildSystemPrompt(ctx) {
  let prompt = 'You are LifeQuest AI Coach, a gamified life productivity assistant. You speak with enthusiasm and use gaming metaphors (XP, levels, stats, quests, achievements). You give practical, actionable advice about health, productivity, learning, social connections, and personal growth. Keep responses concise but impactful (2-4 paragraphs max). Use relevant emojis.';

  if (!ctx) return prompt;

  prompt += '\n\nCURRENT PLAYER STATS (use these to give personalized advice):';
  if (ctx.streak > 0) prompt += `\n- Current streak: ${ctx.streak} days`;
  if (ctx.weeklyAvg > 0) prompt += `\n- Weekly average score: ${ctx.weeklyAvg}/100`;
  if (ctx.totalHours > 0) prompt += `\n- Total hours invested: ${ctx.totalHours}h`;
  if (ctx.totalLogged > 0) prompt += `\n- Days logged: ${ctx.totalLogged}`;
  if (ctx.unlockedAchievements > 0) prompt += `\n- Achievements unlocked: ${ctx.unlockedAchievements}`;
  if (ctx.completedGoals > 0) prompt += `\n- Goals completed: ${ctx.completedGoals}`;

  if (Object.keys(ctx.categoryAvgMinutes).some(k => ctx.categoryAvgMinutes[k] > 0)) {
    prompt += '\n- Average daily minutes by category:';
    for (const [cat, mins] of Object.entries(ctx.categoryAvgMinutes)) {
      if (mins > 0) prompt += ` ${cat}: ${mins}m,`;
    }
  }

  if (ctx.weakestCat) prompt += `\n- Weakest category needing attention: ${ctx.weakestCat}`;

  if (ctx.activeGoals && ctx.activeGoals.length > 0) {
    prompt += `\n- Active goals: ${ctx.activeGoals.join(', ')}`;
  }

  if (ctx.sleepAvg) {
    prompt += `\n- Average sleep: ${ctx.sleepAvg.avgHours}h/night (quality: ${ctx.sleepAvg.avgQuality}/5) over last 7 days`;
    if (ctx.sleepAvg.avgHours < 7) prompt += ' — BELOW optimal, recovery is compromised';
    else if (ctx.sleepAvg.avgHours >= 8) prompt += ' — excellent recovery';
  }

  if (ctx.habits) {
    prompt += `\n- Habit tracking: ${ctx.habits.total} active habits, ${ctx.habits.avgRate}% weekly completion rate`;
    if (ctx.habits.weakest) prompt += `, weakest habit: "${ctx.habits.weakest}"`;
  }

  if (ctx.moodAvg !== null && ctx.moodAvg !== undefined) {
    const moodLabel = ctx.moodAvg >= 4 ? 'positive' : ctx.moodAvg >= 3 ? 'neutral' : 'low';
    prompt += `\n- Average mood: ${ctx.moodAvg}/5 (${moodLabel}) over last 7 days`;
  }

  if (ctx.waterAvg) {
    const pct = Math.round(ctx.waterAvg.avg / ctx.waterAvg.goal * 100);
    prompt += `\n- Hydration: averaging ${ctx.waterAvg.avg} glasses/day (${pct}% of ${ctx.waterAvg.goal} glass goal)`;
  }

  if (ctx.booksRead !== null && ctx.booksRead !== undefined) {
    prompt += `\n- Books completed: ${ctx.booksRead}`;
  }

  if (ctx.workoutCount !== null && ctx.workoutCount !== undefined) {
    prompt += `\n- Workouts last 30 days: ${ctx.workoutCount}`;
  }

  prompt += '\n\nReference these stats naturally in your coaching. If stats indicate concerns (low sleep, poor hydration, low mood, missed habits), proactively address them with specific advice.';
  return prompt;
}

// POST /chat
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)').run('user', message);

    const userContext = getUserContext();
    let reply;

    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const history = db.prepare('SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 20').all().reverse();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt(userContext) },
            ...history.map(h => ({ role: h.role, content: h.content })),
          ],
        });
        reply = completion.choices[0].message.content;
      } catch {
        reply = getMockResponse(message, userContext);
      }
    } else {
      reply = getMockResponse(message, userContext);
    }

    db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)').run('assistant', reply);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history
router.get('/history', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM chat_history ORDER BY id ASC').all();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /clear
router.post('/clear', (req, res) => {
  try {
    db.prepare('DELETE FROM chat_history').run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
