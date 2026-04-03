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

function getMockResponse(message) {
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
  return pool[Math.floor(Math.random() * pool.length)];
}

// POST /chat
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)').run('user', message);

    let reply;

    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const history = db.prepare('SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 20').all().reverse();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are LifeQuest AI Coach, a gamified life productivity assistant. You speak with enthusiasm and use gaming metaphors (XP, levels, stats, quests, achievements). You give practical, actionable advice about health, productivity, learning, social connections, and personal growth. Keep responses concise but impactful (2-4 paragraphs max). Use relevant emojis.',
            },
            ...history.map(h => ({ role: h.role, content: h.content })),
          ],
        });
        reply = completion.choices[0].message.content;
      } catch (aiErr) {
        reply = getMockResponse(message);
      }
    } else {
      reply = getMockResponse(message);
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
