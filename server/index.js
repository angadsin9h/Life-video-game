require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const logsRouter = require('./routes/logs');
const statsRouter = require('./routes/stats');
const aiRouter = require('./routes/ai');
const goalsRouter = require('./routes/goals');

app.use('/api/logs', logsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/goals', goalsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
