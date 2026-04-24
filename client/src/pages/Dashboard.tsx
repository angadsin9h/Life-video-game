import { useEffect, useState } from 'react'
import axios from 'axios'
import { Flame, Trophy, Clock, TrendingUp } from 'lucide-react'
import StatCard from '../components/StatCard'

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

function getLevel(totalHours: number, streak: number): { level: number; xp: number; nextXp: number } {
  const xp = totalHours * 10 + streak * 50
  const level = Math.floor(xp / 500) + 1
  const nextXp = level * 500
  return { level, xp: xp % 500, nextXp: 500 }
}

function getMotivation(score: number): string {
  if (score >= 90) return '🔥 Legendary performance! You\'re on fire!'
  if (score >= 70) return '⚡ Great job! Keep the momentum going!'
  if (score >= 50) return '💪 Solid effort! Push a little harder tomorrow!'
  if (score >= 30) return '🌱 Good start! Every point counts!'
  if (score > 0) return '🎮 You showed up — that\'s what matters!'
  return '🌅 Log today\'s activities to earn your score!'
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [todayLog, setTodayLog] = useState<DayLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<DayLog | null>(`/api/logs/${today}`),
    ]).then(([statsRes, logRes]) => {
      setStats(statsRes.data)
      setTodayLog(logRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const todayScore = todayLog?.score ?? 0
  const { level, xp, nextXp } = getLevel(stats?.totalHours ?? 0, stats?.currentStreak ?? 0)
  const catMins = stats?.categoryAvgMinutes ?? {}

  const categoryStats = [
    { label: 'Health', value: Math.min(25, Math.round((catMins.health ?? 0) / 2)), maxValue: 25, color: 'bar-health', icon: '❤️' },
    { label: 'Mind', value: Math.min(25, Math.round((catMins.mind ?? 0) / 2)), maxValue: 25, color: 'bar-mind', icon: '🧠' },
    { label: 'Work', value: Math.min(25, Math.round((catMins.work ?? 0) / 2)), maxValue: 25, color: 'bar-work', icon: '💼' },
    { label: 'Social', value: Math.min(10, Math.round((catMins.social ?? 0) / 3)), maxValue: 10, color: 'bar-social', icon: '👥' },
    { label: 'Growth', value: Math.min(15, Math.round((catMins.growth ?? 0) / 2)), maxValue: 15, color: 'bar-growth', icon: '🚀' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            LVL {level}
          </div>
          <div className="text-xs text-slate-400">{xp}/{nextXp} XP</div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="game-card p-4 glowing-border">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Experience Points</span>
          <span>{xp}/{nextXp} XP to Level {level + 1}</span>
        </div>
        <div className="stat-bar h-4">
          <div className="stat-bar-fill bar-work" style={{ width: `${(xp / nextXp) * 100}%` }} />
        </div>
      </div>

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
            <div className="text-4xl font-bold text-white neon-text" style={{ fontFamily: 'Orbitron, monospace', color: '#8b5cf6' }}>
              {todayScore}
            </div>
            <div className="text-xs text-slate-400">/ 100</div>
          </div>
        </div>
        <p className="text-slate-300 mt-3 text-sm">{getMotivation(todayScore)}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Streak', value: `${stats?.currentStreak ?? 0}d`, icon: <Flame className="w-5 h-5 text-orange-400" />, color: 'text-orange-400' },
          { label: 'Best Streak', value: `${stats?.bestStreak ?? 0}d`, icon: <Trophy className="w-5 h-5 text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Total Hours', value: `${stats?.totalHours ?? 0}h`, icon: <Clock className="w-5 h-5 text-cyan-400" />, color: 'text-cyan-400' },
          { label: 'Weekly Avg', value: `${stats?.weeklyAvg ?? 0}`, icon: <TrendingUp className="w-5 h-5 text-green-400" />, color: 'text-green-400' },
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
          {categoryStats.map(s => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {todayLog && todayLog.tasks && todayLog.tasks.length > 0 && (
        <div className="game-card p-5">
          <h2 className="text-lg font-semibold text-slate-200 mb-3">Today's Activities</h2>
          <div className="space-y-2">
            {todayLog.tasks.slice(0, 5).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">{t.category}</span>
                  <span className="text-sm text-slate-200">{t.task_name}</span>
                </div>
                <span className="text-xs text-slate-400">{t.duration_minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
