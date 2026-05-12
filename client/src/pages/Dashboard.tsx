import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Flame, Trophy, Clock, TrendingUp, CheckCircle2, Circle, Sword, RefreshCw, Zap, ChevronDown, Sun, Droplets } from 'lucide-react'
import StatCard from '../components/StatCard'
import ScoreSparkline from '../components/ScoreSparkline'
import FocusRecommendation from '../components/FocusRecommendation'
import UpcomingDeadlines from '../components/UpcomingDeadlines'

interface Habit {
  id: number; title: string; emoji: string; category: string; streak: number; completedToday: boolean
}

interface DayLog {
  date: string
  score: number
  tasks: Array<{ category: string; task_name: string; duration_minutes: number }>
}

interface Stats {
  last30Days: Array<{ date: string; score: number }>
  weeklyAvg: number
  monthlyAvg: number
  categoryAvgMinutes: Record<string, number>
  currentStreak: number
  bestStreak: number
  totalHours: number
  bestDay: { date: string; score: number } | null
}

interface Quest {
  id: number
  quest_id: string
  title: string
  description: string
  category: string
  target_minutes: number
  bonus_xp: number
  completed: number
}

interface MoodEntry {
  mood: number
  label: string
  emoji: string
}

interface Achievement {
  key: string
  title: string
  icon: string
  unlocked: boolean
  unlocked_at: string | null
}

interface Intention {
  id: number
  text: string
  completed: number
}

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']
const MOOD_EMOJIS = ['', '😭', '😔', '😐', '😊', '🤩']
const MOOD_COLORS = ['', 'border-red-500 bg-red-900/30', 'border-orange-500 bg-orange-900/30', 'border-yellow-500 bg-yellow-900/30', 'border-green-500 bg-green-900/30', 'border-violet-500 bg-violet-900/30']
const MOOD_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Amazing']

function getCharacterClass(catMins: Record<string, number>): {
  name: string; title: string; emoji: string; color: string; desc: string
} {
  const entries = Object.entries(catMins).filter(([, v]) => v > 0)
  if (entries.length === 0) return { name: 'Novice', title: 'The Beginner', emoji: '🌱', color: 'text-slate-400', desc: 'Start logging to reveal your class' }

  const total = entries.reduce((s, [, v]) => s + v, 0)
  const dominant = entries.sort((a, b) => b[1] - a[1])[0]
  const pct = dominant[1] / total

  if (pct < 0.35) return { name: 'Sage', title: 'The Balanced One', emoji: '☯️', color: 'text-cyan-400', desc: 'Master of all paths — truly rare' }

  const classMap: Record<string, { name: string; title: string; emoji: string; color: string; desc: string }> = {
    health:  { name: 'Warrior',   title: 'The Iron Warrior',   emoji: '⚔️', color: 'text-green-400',  desc: 'Forged in sweat, unbreakable in body' },
    mind:    { name: 'Scholar',   title: 'The Mind Scholar',   emoji: '📚', color: 'text-cyan-400',   desc: 'Knowledge is your ultimate weapon' },
    work:    { name: 'Builder',   title: 'The Master Builder', emoji: '⚙️', color: 'text-violet-400', desc: 'Turning vision into reality, brick by brick' },
    social:  { name: 'Guardian',  title: 'The Guardian',       emoji: '🛡️', color: 'text-yellow-400', desc: 'Strength found in those around you' },
    growth:  { name: 'Explorer',  title: 'The Explorer',       emoji: '🗺️', color: 'text-red-400',    desc: 'Forever expanding the horizon of the possible' },
  }
  return classMap[dominant[0]] || classMap.work
}

function getLevel(totalHours: number, streak: number, achievementXp: number): {
  level: number; xp: number; nextXp: number; totalXp: number
} {
  const totalXp = totalHours * 10 + streak * 50 + achievementXp
  const level = Math.floor(totalXp / 500) + 1
  const xpIntoLevel = totalXp % 500
  return { level, xp: xpIntoLevel, nextXp: 500, totalXp }
}

function getMotivation(score: number): string {
  if (score >= 90) return "🔥 Legendary performance! You're absolutely on fire!"
  if (score >= 70) return '⚡ Great job! Keep the momentum going!'
  if (score >= 50) return '💪 Solid effort! Push a little harder tomorrow!'
  if (score >= 30) return '🌱 Good start! Every point counts!'
  if (score > 0)   return "🎮 You showed up — that's what matters!"
  return "🌅 Log today's activities to start earning your score!"
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [todayLog, setTodayLog] = useState<DayLog | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [mood, setMood] = useState<MoodEntry | null>(null)
  const [achievementXp, setAchievementXp] = useState(0)
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [moodSubmitting, setMoodSubmitting] = useState(false)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [playerName, setPlayerName] = useState('Hero')
  const [playerAvatar, setPlayerAvatar] = useState('⚔️')
  const [habits, setHabits] = useState<Habit[]>([])
  const [togglingHabit, setTogglingHabit] = useState<number | null>(null)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [quickCat, setQuickCat] = useState('work')
  const [quickMins, setQuickMins] = useState(30)
  const [quickLogging, setQuickLogging] = useState(false)
  const [quickSuccess, setQuickSuccess] = useState(false)
  const [intentions, setIntentions] = useState<Intention[]>([])
  const [togglingIntention, setTogglingIntention] = useState<number | null>(null)
  const [smartMessages, setSmartMessages] = useState<Array<{ type: string; priority: number; msg: string }>>([])
  const [dismissedSmartMsg, setDismissedSmartMsg] = useState(false)
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [waterGoal, setWaterGoal] = useState(8)
  const [updatingWater, setUpdatingWater] = useState(false)
  const [weekDays, setWeekDays] = useState<Array<{ date: string; score: number }>>([])

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<DayLog | null>(`/api/logs/${today}`),
      axios.get<Quest[]>('/api/quests/today'),
      axios.get<MoodEntry | null>('/api/mood/today'),
      axios.get<{ achievements: Achievement[]; totalXp: number }>('/api/achievements'),
      axios.get<{ username: string; avatar: string }>('/api/settings'),
      axios.get<Habit[]>('/api/habits'),
      axios.get<Intention[]>(`/api/intentions/${today}`),
    ]).then(([statsRes, logRes, questsRes, moodRes, achRes, settingsRes, habitsRes, intentionsRes]) => {
      setStats(statsRes.data)
      setTodayLog(logRes.data)
      setQuests(questsRes.data)
      setMood(moodRes.data)
      setAchievementXp(achRes.data.totalXp)
      setPlayerName(settingsRes.data.username || 'Hero')
      setPlayerAvatar(settingsRes.data.avatar || '⚔️')
      setHabits(habitsRes.data.slice(0, 6))
      setIntentions(intentionsRes.data)
      setRecentAchievements(
        achRes.data.achievements
          .filter(a => a.unlocked && a.unlocked_at)
          .sort((a, b) => (b.unlocked_at ?? '').localeCompare(a.unlocked_at ?? ''))
          .slice(0, 3)
      )
    }).catch(console.error).finally(() => setLoading(false))
    // Load smart status + water in parallel (non-blocking)
    axios.get<{ messages: Array<{ type: string; priority: number; msg: string }> }>('/api/reminders/status')
      .then(r => setSmartMessages(r.data.messages))
      .catch(() => {})
    axios.get<{ glasses: number; goal: number }>(`/api/water/${today}`)
      .then(r => { setWaterGlasses(r.data.glasses); setWaterGoal(r.data.goal) })
      .catch(() => {})
    // Load 7-day scores for mini week chart
    axios.get<Array<{ date: string; score: number }>>('/api/timeline?limit=7')
      .then(r => setWeekDays(r.data.slice().reverse()))
      .catch(() => {})
  }, [])

  const quickLog = async () => {
    if (!quickTask.trim() || quickLogging) return
    setQuickLogging(true)
    try {
      await axios.post('/api/logs/task', { date: today, category: quickCat, task_name: quickTask, duration_minutes: quickMins })
      setQuickTask('')
      setQuickSuccess(true)
      setTimeout(() => setQuickSuccess(false), 2000)
      const logRes = await axios.get(`/api/logs/${today}`)
      setTodayLog(logRes.data)
    } catch (e) { console.error(e) }
    finally { setQuickLogging(false) }
  }

  const toggleIntention = async (id: number) => {
    setTogglingIntention(id)
    try {
      const res = await axios.patch<Intention>(`/api/intentions/${id}/complete`)
      setIntentions(prev => prev.map(i => i.id === id ? res.data : i))
    } finally { setTogglingIntention(null) }
  }

  const adjustWater = async (delta: number) => {
    const newVal = Math.max(0, Math.min(20, waterGlasses + delta))
    setWaterGlasses(newVal)
    setUpdatingWater(true)
    try {
      await axios.post(`/api/water/${today}`, { glasses: newVal })
    } finally { setUpdatingWater(false) }
  }

  const toggleHabit = async (habit: Habit) => {
    setTogglingHabit(habit.id)
    try {
      await axios.post(`/api/habits/${habit.id}/complete`, { date: today })
      const res = await axios.get<Habit[]>('/api/habits')
      setHabits(res.data.slice(0, 6))
    } finally { setTogglingHabit(null) }
  }

  const logMood = async (moodValue: number) => {
    setMoodSubmitting(true)
    try {
      const res = await axios.post<MoodEntry>('/api/mood', { mood: moodValue })
      setMood(res.data)
      setShowMoodPicker(false)
    } finally {
      setMoodSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-800 rounded-xl" />
        <div className="h-40 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
        </div>
        <div className="h-60 bg-slate-800 rounded-xl" />
      </div>
    )
  }

  const todayScore = todayLog?.score ?? 0
  const catMins = stats?.categoryAvgMinutes ?? {}
  const { level, xp, nextXp, totalXp } = getLevel(stats?.totalHours ?? 0, stats?.currentStreak ?? 0, achievementXp)
  const charClass = getCharacterClass(catMins)
  const completedQuests = quests.filter(q => q.completed).length
  const questXpEarned = quests.filter(q => q.completed).reduce((s, q) => s + q.bonus_xp, 0)

  const categoryStats = [
    { label: 'Health', value: Math.min(25, Math.round((catMins.health ?? 0) / 2)), maxValue: 25, color: 'bar-health', icon: '❤️' },
    { label: 'Mind',   value: Math.min(25, Math.round((catMins.mind ?? 0) / 2)),   maxValue: 25, color: 'bar-mind',   icon: '🧠' },
    { label: 'Work',   value: Math.min(25, Math.round((catMins.work ?? 0) / 2)),   maxValue: 25, color: 'bar-work',   icon: '💼' },
    { label: 'Social', value: Math.min(10, Math.round((catMins.social ?? 0) / 3)), maxValue: 10, color: 'bar-social', icon: '👥' },
    { label: 'Growth', value: Math.min(15, Math.round((catMins.growth ?? 0) / 2)), maxValue: 15, color: 'bar-growth', icon: '🚀' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{playerAvatar}</div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},{' '}
              <span className="text-violet-400">{playerName}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            LVL {level}
          </div>
          <div className="text-xs text-slate-400">{totalXp.toLocaleString()} total XP</div>
        </div>
      </div>

      {/* Smart daily nudges */}
      {smartMessages.length > 0 && !dismissedSmartMsg && (
        <div className="space-y-2">
          {smartMessages.map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                m.type === 'celebration'
                  ? 'bg-green-900/20 border border-green-500/30 text-green-300'
                  : m.type === 'streak'
                  ? 'bg-orange-900/20 border border-orange-500/30 text-orange-300'
                  : 'bg-slate-800/60 border border-slate-700 text-slate-300'
              }`}
            >
              <span className="flex-1">{m.msg}</span>
              {i === 0 && (
                <button onClick={() => setDismissedSmartMsg(true)} className="text-slate-600 hover:text-slate-400 text-xs flex-shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Today at a Glance */}
      <div className="game-card p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Today at a Glance</h3>
          <span className="text-xs text-slate-500">
            {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Score circle */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke={todayScore >= 80 ? '#22c55e' : todayScore >= 50 ? '#8b5cf6' : '#475569'}
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - todayScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>{todayScore}</span>
            </div>
          </div>
          {/* Actions needed */}
          <div className="flex-1 space-y-1">
            {todayScore === 0 && (
              <Link to="/log" className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-semibold">
                → Log today's activities to earn your score
              </Link>
            )}
            {todayScore > 0 && todayScore < 100 && (
              <Link to="/log" className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300">
                → {100 - todayScore} pts remaining — keep going!
              </Link>
            )}
            {todayScore >= 100 && (
              <div className="text-sm text-green-400 font-semibold">✓ Perfect day achieved!</div>
            )}
            {quests.filter(q => !q.completed).length > 0 && (
              <Link to="/quests" className="flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300">
                → {quests.filter(q => !q.completed).length} quest{quests.filter(q => !q.completed).length > 1 ? 's' : ''} uncompleted
              </Link>
            )}
            {!mood && (
              <div className="text-xs text-slate-500">→ Log your mood for the day</div>
            )}
          </div>
        </div>
      </div>

      {/* Character Class Banner */}
      <div className="game-card p-4 flex items-center gap-4 border border-slate-600 hover:border-violet-500/40 transition-colors">
        <div className="text-4xl animate-float flex-shrink-0">{charClass.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Your Class</div>
          <div className={`text-xl font-bold ${charClass.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {charClass.name}
          </div>
          <div className="text-xs text-slate-400 truncate">{charClass.title} — {charClass.desc}</div>
        </div>
        <div className="text-right hidden sm:block flex-shrink-0">
          <div className="text-xs text-slate-500">Achievement XP</div>
          <div className="text-sm font-bold text-yellow-400">+{achievementXp.toLocaleString()}</div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="game-card p-4 glowing-border">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Level {level} Progress</span>
          <span>{xp} / {nextXp} XP to Level {level + 1}</span>
        </div>
        <div className="stat-bar h-4">
          <div className="stat-bar-fill bar-work transition-all duration-1000" style={{ width: `${(xp / nextXp) * 100}%` }} />
        </div>
      </div>

      {/* Daily Intentions Widget */}
      {intentions.length > 0 && (
        <div className="game-card p-4 border border-yellow-500/20 bg-yellow-900/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              Today's Intentions
            </h3>
            <Link to="/intentions" className="text-xs text-yellow-500 hover:text-yellow-400">Edit →</Link>
          </div>
          <div className="space-y-2">
            {intentions.map((intention, idx) => (
              <button
                key={intention.id}
                onClick={() => toggleIntention(intention.id)}
                disabled={togglingIntention === intention.id}
                className={`w-full flex items-center gap-3 text-left transition-all ${intention.completed ? 'opacity-50' : ''}`}
              >
                {intention.completed
                  ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                }
                <span className={`text-sm ${intention.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {idx + 1}. {intention.text}
                </span>
              </button>
            ))}
          </div>
          {intentions.every(i => i.completed) && (
            <div className="mt-2 text-center text-xs text-green-400 font-semibold">🌟 All intentions complete!</div>
          )}
        </div>
      )}

      {/* Quick Log Widget */}
      <div className="game-card p-4">
        <button
          onClick={() => setShowQuickLog(s => !s)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="flex items-center gap-2 font-semibold text-slate-200">
            <Zap className="w-4 h-4 text-yellow-400" />
            Quick Log
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showQuickLog ? 'rotate-180' : ''}`} />
        </button>
        {showQuickLog && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              className="game-input w-full"
              placeholder="What did you do? (e.g. Ran 5km, Read, Worked on project)"
              value={quickTask}
              onChange={e => setQuickTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && quickLog()}
              autoFocus
            />
            <div className="flex gap-2">
              <select className="game-input flex-1" value={quickCat} onChange={e => setQuickCat(e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                ))}
              </select>
              <select className="game-input w-28" value={quickMins} onChange={e => setQuickMins(parseInt(e.target.value))}>
                {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m}m</option>)}
              </select>
            </div>
            <button
              onClick={quickLog}
              disabled={quickLogging || !quickTask.trim()}
              className={`w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                quickSuccess ? 'bg-green-600 border border-green-500' : 'bg-yellow-600 hover:bg-yellow-500 border border-yellow-500'
              }`}
            >
              <Zap className="w-4 h-4" />
              {quickLogging ? 'Logging…' : quickSuccess ? '✓ Logged!' : 'Log Activity'}
            </button>
          </div>
        )}
      </div>

      {/* Habits Quick Check */}
      {habits.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-violet-400" />
              Today's Habits
            </h3>
            <Link to="/habits" className="text-xs text-violet-400 hover:text-violet-300">Manage →</Link>
          </div>
          <div className="space-y-2">
            {habits.map(h => (
              <button
                key={h.id}
                onClick={() => toggleHabit(h)}
                disabled={togglingHabit === h.id}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                  h.completedToday
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-slate-700 bg-slate-800 hover:border-violet-500/40 hover:bg-slate-700/60'
                }`}
              >
                {togglingHabit === h.id
                  ? <RefreshCw className="w-5 h-5 text-violet-400 animate-spin flex-shrink-0" />
                  : h.completedToday
                  ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                }
                <span className="text-base flex-shrink-0">{h.emoji}</span>
                <span className={`text-sm flex-1 ${h.completedToday ? 'line-through text-slate-500' : 'text-slate-200'}`}>{h.title}</span>
                {h.streak > 0 && (
                  <span className={`text-xs flex items-center gap-0.5 flex-shrink-0 ${h.streak >= 7 ? 'text-orange-400' : 'text-slate-500'}`}>
                    <Flame className="w-3 h-3" />{h.streak}
                  </span>
                )}
              </button>
            ))}
          </div>
          {habits.every(h => h.completedToday) && (
            <p className="text-center text-green-400 text-xs mt-2 font-semibold">🏆 All habits done today!</p>
          )}
        </div>
      )}

      {/* Water Tracker */}
      <div className="game-card p-4 border border-cyan-500/20 bg-cyan-900/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            Hydration
          </h3>
          <span className={`text-sm font-bold ${waterGlasses >= waterGoal ? 'text-cyan-400' : 'text-slate-400'}`}>
            {waterGlasses}/{waterGoal} glasses
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustWater(-1)}
            disabled={waterGlasses === 0 || updatingWater}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 text-lg disabled:opacity-30 transition-colors flex items-center justify-center"
          >
            −
          </button>
          <div className="flex-1 flex items-center gap-1">
            {Array.from({ length: waterGoal }).map((_, i) => (
              <button
                key={i}
                onClick={() => adjustWater(i + 1 > waterGlasses ? i + 1 - waterGlasses : -(waterGlasses - i))}
                className={`flex-1 h-6 rounded transition-all ${
                  i < waterGlasses ? 'bg-cyan-500/60 hover:bg-cyan-400/60' : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title={`${i + 1} glass${i + 1 > 1 ? 'es' : ''}`}
              />
            ))}
          </div>
          <button
            onClick={() => adjustWater(1)}
            disabled={waterGlasses >= 20 || updatingWater}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-cyan-700 text-cyan-400 text-lg disabled:opacity-30 transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
        {waterGlasses >= waterGoal && (
          <div className="mt-2 text-center text-xs text-cyan-400 font-semibold">💧 Daily goal reached!</div>
        )}
      </div>

      {/* Focus Recommendation */}
      <FocusRecommendation />

      {/* Upcoming Deadlines */}
      <UpcomingDeadlines />

      {/* This Week mini chart */}
      {weekDays.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">This Week</h3>
          <div className="flex items-end gap-2 h-14">
            {weekDays.map(d => {
              const isToday = d.date === today
              const pct = Math.max(4, d.score)
              const label = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        isToday ? 'bg-violet-500' :
                        d.score >= 80 ? 'bg-green-500' :
                        d.score >= 50 ? 'bg-violet-500/50' :
                        d.score > 0 ? 'bg-yellow-500/40' : 'bg-slate-800'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <div className={`text-[10px] ${isToday ? 'text-violet-400 font-bold' : 'text-slate-600'}`}>{label}</div>
                  <div className={`text-[10px] font-bold ${isToday ? 'text-violet-400' : d.score > 0 ? 'text-slate-400' : 'text-slate-700'}`}>{d.score || '—'}</div>
                </div>
              )
            })}
          </div>
          {stats && <p className="text-xs text-slate-600 mt-2">7-day avg: <span className="text-slate-400 font-semibold">{stats.weeklyAvg}</span></p>}
        </div>
      )}

      {/* Score History Sparkline */}
      {stats && stats.last30Days.length > 1 && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Score History (30d)</h3>
            <div className="flex gap-3 text-xs text-slate-500">
              <span>Avg: <span className="text-slate-300 font-semibold">{stats.monthlyAvg}</span></span>
              <span>Best: <span className="text-slate-300 font-semibold">{stats.bestDay?.score ?? 0}</span></span>
            </div>
          </div>
          <ScoreSparkline data={stats.last30Days} height={72} showLabels />
        </div>
      )}

      {/* Today's Score */}
      <div className="game-card p-6 text-center glowing-border animate-pulse-glow">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Today's Score</p>
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="#8b5cf6" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - todayScore / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-4xl font-bold neon-text" style={{ fontFamily: 'Orbitron, monospace', color: '#8b5cf6' }}>
              {todayScore}
            </div>
            <div className="text-xs text-slate-400">/ 100</div>
          </div>
        </div>
        <p className="text-slate-300 mt-3 text-sm">{getMotivation(todayScore)}</p>
        {todayScore === 0 && (
          <Link to="/log" className="game-btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            ⚔️ Log Today's Activities
          </Link>
        )}
      </div>

      {/* Mood Tracker */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Today's Mood</h3>
          {mood && !showMoodPicker && (
            <button onClick={() => setShowMoodPicker(true)} className="text-xs text-slate-500 hover:text-slate-300 underline">
              Change
            </button>
          )}
        </div>
        {mood && !showMoodPicker ? (
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${MOOD_COLORS[mood.mood]}`}>
            <span className="text-3xl">{mood.emoji}</span>
            <div className="font-semibold text-slate-200">{mood.label}</div>
          </div>
        ) : (
          <div className="flex gap-2 justify-center flex-wrap">
            {[1, 2, 3, 4, 5].map(m => (
              <button
                key={m}
                onClick={() => logMood(m)}
                disabled={moodSubmitting}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-violet-500/50 transition-all hover:scale-110 min-w-[64px]"
              >
                <span className="text-2xl">{MOOD_EMOJIS[m]}</span>
                <span className="text-xs text-slate-400">{MOOD_LABELS[m]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Daily Quests */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Sword className="w-5 h-5 text-red-400" />
            Daily Quests
          </h2>
          <div className="text-sm text-slate-400">
            {completedQuests}/3
            {questXpEarned > 0 && <span className="text-yellow-400 ml-2">+{questXpEarned} XP</span>}
          </div>
        </div>
        <div className="space-y-3">
          {quests.map(q => (
            <div
              key={q.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                q.completed
                  ? 'border-green-500/30 bg-green-900/10 opacity-70'
                  : 'border-slate-600 bg-slate-700/50 hover:border-violet-500/30'
              }`}
            >
              {q.completed
                ? <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                : <Circle className="w-6 h-6 text-slate-500 flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-200">{q.title}</div>
                <div className="text-xs text-slate-400">{q.description}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {CAT_ICONS[q.category]} {q.category} · {q.target_minutes}+ min
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold text-yellow-400">+{q.bonus_xp}</div>
                <div className="text-xs text-slate-500">XP</div>
              </div>
            </div>
          ))}
        </div>
        {completedQuests === 3 && (
          <p className="text-center text-green-400 text-sm mt-3 font-semibold">
            🎉 All quests complete! New quests tomorrow!
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <Link to="/boss" className="text-xs text-red-400 hover:text-red-300">⚔️ Boss Battle →</Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Streak',      value: `${stats?.currentStreak ?? 0}d`, icon: <Flame className="w-5 h-5 text-orange-400" />, color: 'text-orange-400' },
          { label: 'Best Streak', value: `${stats?.bestStreak ?? 0}d`,    icon: <Trophy className="w-5 h-5 text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Total Hours', value: `${stats?.totalHours ?? 0}h`,    icon: <Clock className="w-5 h-5 text-cyan-400" />,    color: 'text-cyan-400'   },
          { label: 'Weekly Avg',  value: `${stats?.weeklyAvg ?? 0}`,      icon: <TrendingUp className="w-5 h-5 text-green-400" />, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category stats */}
      <div className="game-card p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Life Stats (30-day avg)</h2>
        <div className="space-y-3">
          {categoryStats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-200">Recent Achievements</h2>
            <Link to="/achievements" className="text-xs text-violet-400 hover:text-violet-300">View All →</Link>
          </div>
          <div className="flex gap-3">
            {recentAchievements.map(a => (
              <div key={a.key} className="flex-1 game-card p-3 text-center border border-yellow-500/30 bg-yellow-900/10">
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-xs font-semibold text-yellow-300">{a.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {a.unlocked_at ? new Date(a.unlocked_at).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Activities */}
      {todayLog && todayLog.tasks && todayLog.tasks.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-200">Today's Activities</h2>
            <Link to="/log" className="text-xs text-violet-400 hover:text-violet-300">Edit →</Link>
          </div>
          <div className="space-y-2">
            {todayLog.tasks.slice(0, 6).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">
                    {CAT_ICONS[t.category]} {t.category}
                  </span>
                  <span className="text-sm text-slate-200">{t.task_name}</span>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{t.duration_minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
