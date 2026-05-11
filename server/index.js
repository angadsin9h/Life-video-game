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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
