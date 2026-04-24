# LifeQuest - Life as a Video Game 🎮

Transform your daily life into an epic RPG adventure! LifeQuest is a full-stack productivity tracking app that gamifies your daily habits and tasks, turning real-world accomplishments into XP, levels, and stats.

## ✨ Features

- **Dashboard** - RPG-style character stats with XP bar, level system, and daily productivity score
- **Task Logging** - Log daily activities across 5 life categories with smart suggestions
- **Progress Analytics** - Beautiful charts (line, bar, pie) showing your progress over 30 days
- **AI Coach** - Get personalized advice powered by OpenAI GPT-4o-mini (with smart mock fallback)
- **Goals Tracker** - Set and track life goals with completion status and filtering
- **Streak System** - Track daily consistency streaks
- **Mobile Responsive** - Works on all screen sizes with bottom nav on mobile

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v3 (styling)
- Recharts (data visualization)
- React Router v6 (navigation)
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- Node.js + Express
- better-sqlite3 (database)
- OpenAI API (AI coach)
- CORS + dotenv

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/Life-video-game.git
cd Life-video-game
```

2. Install all dependencies:
```bash
npm run install:all
```

3. (Optional) Add your OpenAI API key:
```bash
# Edit server/.env
OPENAI_API_KEY=your-openai-api-key-here
```

Without an API key, the AI Coach will use intelligent pre-built responses.

### Running the App

**Development mode** (runs both frontend and backend):
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

**Production build:**
```bash
npm run build
npm start
```

## 📊 Scoring System

Your daily score (0-100) is calculated based on task categories:

| Category | Max Points | Description |
|----------|-----------|-------------|
| ❤️ Health | 25 | Exercise, sleep, nutrition |
| 🧠 Mind | 25 | Reading, meditation, learning |
| 💼 Work | 25 | Deep work, projects, productivity |
| 👥 Social | 10 | Friends, family, community |
| 🚀 Growth | 15 | Courses, skills, side projects |

Points scale based on duration:
- ≥30 minutes: Full points
- 15-29 minutes: 75% points
- <15 minutes: 50% points

## 🤖 AI Coach

The AI Coach provides personalized advice on:
- Health and fitness optimization
- Productivity and deep work strategies
- Goal setting and habit building
- Learning acceleration techniques

Add your OpenAI API key to `server/.env` for GPT-4o-mini powered responses, or enjoy the built-in motivational advice system.

## 📁 Project Structure

```
life-video-game/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── db.js               # SQLite database setup
│   ├── index.js            # Server entry point
│   └── package.json
└── package.json            # Root package.json
```

## 📜 License

MIT
