require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
