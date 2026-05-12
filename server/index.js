require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const logsRouter = require('./routes/logs');
const statsRouter = require('./routes/stats');
const aiRouter = require('./routes/ai');
const goalsRouter = require('./routes/goals');
const { router: achievementsRouter } = require('./routes/achievements');
const questsRouter = require('./routes/quests');
const habitsRouter = require('./routes/habits');
const { router: bossRouter } = require('./routes/boss');
const moodRouter = require('./routes/mood');
const journalRouter = require('./routes/journal');

app.use('/api/logs', logsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/quests', questsRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/boss', bossRouter);
app.use('/api/mood', moodRouter);
app.use('/api/journal', journalRouter);

const weeklyRouter = require('./routes/weekly');
app.use('/api/weekly', weeklyRouter);

const timerRouter = require('./routes/timer');
app.use('/api/timer', timerRouter);

const settingsRouter = require('./routes/settings');
app.use('/api/settings', settingsRouter);

const challengesRouter = require('./routes/challenges');
app.use('/api/challenges', challengesRouter);

const insightsRouter = require('./routes/insights');
app.use('/api/insights', insightsRouter);

const notesRouter = require('./routes/notes');
app.use('/api/notes', notesRouter);

const metricsRouter = require('./routes/metrics');
app.use('/api/metrics', metricsRouter);

const plannerRouter = require('./routes/planner');
app.use('/api/planner', plannerRouter);

const gratitudeRouter = require('./routes/gratitude');
app.use('/api/gratitude', gratitudeRouter);

const intentionsRouter = require('./routes/intentions');
app.use('/api/intentions', intentionsRouter);

const categoryGoalsRouter = require('./routes/category_goals');
app.use('/api/category-goals', categoryGoalsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
