import { useEffect, useState } from 'react'
import axios from 'axios'
import { Zap, Target, Flame, Brain, TrendingUp, Clock, CheckCircle2, Activity } from 'lucide-react'

interface TaskStat { total: number; completed: number; xp: number }
interface HabitStat { total: number; completedToday: number; bestStreak: number }
interface FocusStat { sessions: number; totalMinutes: number }
interface MoodEntry { date: string; mood: number; energy?: number }

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="44" y="48" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}

export default function ProductivityDashboard() {
  const [taskStats, setTaskStats] = useState<TaskStat>({ total: 0, completed: 0, xp: 0 })
  const [habitStats, setHabitStats] = useState<HabitStat>({ total: 0, completedToday: 0, bestStreak: 0 })
  const [focusStats, setFocusStats] = useState<FocusStat>({ sessions: 0, totalMinutes: 0 })
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      axios.get('/api/logs').catch(() => ({ data: [] })),
      axios.get('/api/habits').catch(() => ({ data: [] })),
      axios.get('/api/timer/sessions').catch(() => ({ data: [] })),
      axios.get('/api/mood?limit=30').catch(() => ({ data: [] })),
    ]).then(([logs, habits, focus, mood]) => {
      const allLogs: any[] = logs.data as any[]
      const todayLogs = allLogs.filter((l: any) => l.date === today)
      const weekLogs = allLogs.filter((l: any) => l.date >= weekAgo)
      const completedWeek = weekLogs.filter((l: any) => l.completed)
      const xp = completedWeek.reduce((s: number, l: any) => {
        const baseMap: Record<string, number> = { health: 30, mind: 25, work: 20, social: 15, creative: 20, other: 10 }
        const base = baseMap[l.category || 'other'] || 10
        const dur = l.duration_minutes ? Math.floor(l.duration_minutes / 30) : 0
        return s + base + dur * 5
      }, 0)
      setTaskStats({ total: todayLogs.length, completed: todayLogs.filter((l: any) => l.completed).length, xp })

      const habitList: any[] = habits.data as any[]
      setHabitStats({
        total: habitList.length,
        completedToday: habitList.filter((h: any) => h.completedToday).length,
        bestStreak: habitList.reduce((m: number, h: any) => Math.max(m, h.streak || 0), 0),
      })

      const sessions: any[] = focus.data as any[]
      const weekSessions = sessions.filter((s: any) => s.date >= weekAgo)
      setFocusStats({
        sessions: weekSessions.length,
        totalMinutes: weekSessions.reduce((s: number, sess: any) => s + (sess.duration_minutes || sess.duration || 0), 0),
      })

      setMoods(mood.data as MoodEntry[])
      setLoading(false)
    })
  }, [])

  // Scores (0-100)
  const taskScore = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0
  const habitScore = habitStats.total > 0 ? Math.round((habitStats.completedToday / habitStats.total) * 100) : 0
  const focusScore = Math.min(100, Math.round((focusStats.totalMinutes / (7 * 120)) * 100))
  const recentMoods = moods.slice(0, 7)
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length : 0
  const moodScore = Math.round((avgMood / 5) * 100)
  const overallScore = Math.round((taskScore + habitScore + focusScore + moodScore) / 4)

  // 7-day task completion trend
  const dayTrend: { date: string; completed: number; total: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    dayTrend.push({ date, completed: 0, total: 0 })
  }

  // Mood trend last 7 days
  const moodTrend = dayTrend.map(d => {
    const entry = moods.find(m => m.date === d.date)
    return { date: d.date, mood: entry?.mood || 0, energy: entry?.energy || 0 }
  })

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Zap className="w-7 h-7 text-yellow-400" />
          Productivity HQ
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Today's performance overview</p>
      </div>

      {/* Overall score + gauges */}
      <div className="game-card p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none"
                stroke={overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#eab308' : overallScore >= 40 ? '#f97316' : '#ef4444'}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - overallScore / 100)}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
              <text x="60" y="56" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">{overallScore}</text>
              <text x="60" y="74" textAnchor="middle" fill="#94a3b8" fontSize="11">overall</text>
            </svg>
          </div>
          <div className="text-sm text-slate-400 mt-2">
            {overallScore >= 80 ? '🔥 Exceptional performance!' : overallScore >= 60 ? '⚡ Solid day' : overallScore >= 40 ? '📈 Room to improve' : '💪 Keep pushing'}
          </div>
        </div>

        <div className="flex justify-around">
          <ScoreGauge score={taskScore} label="Tasks" color="#3b82f6" />
          <ScoreGauge score={habitScore} label="Habits" color="#22c55e" />
          <ScoreGauge score={focusScore} label="Focus" color="#8b5cf6" />
          <ScoreGauge score={moodScore} label="Mood" color="#ec4899" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tasks Done', value: `${taskStats.completed}/${taskStats.total}`, icon: CheckCircle2, color: 'text-blue-400' },
          { label: 'Habits Done', value: `${habitStats.completedToday}/${habitStats.total}`, icon: Activity, color: 'text-green-400' },
          { label: 'Focus (week)', value: `${Math.round(focusStats.totalMinutes / 60)}h`, icon: Clock, color: 'text-violet-400' },
          { label: 'XP (week)', value: taskStats.xp, icon: Zap, color: 'text-yellow-400' },
        ].map(t => (
          <div key={t.label} className="game-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-500">{t.label}</span>
            </div>
            <div className={`text-xl font-bold ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Mood trend */}
      {moods.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4" /> Mood (7 days)
          </h3>
          <div className="flex items-end gap-1 h-16">
            {moodTrend.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                  {d.date}: {d.mood > 0 ? `mood ${d.mood}/5` : 'no data'}
                </div>
                <div className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${(d.mood / 5) * 60}px`,
                    background: d.mood >= 4 ? '#22c55e' : d.mood >= 3 ? '#eab308' : d.mood > 0 ? '#ef4444' : 'transparent',
                    minHeight: d.mood > 0 ? '4px' : 0,
                  }} />
                <div className="text-[9px] text-slate-600">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streak highlight */}
      {habitStats.bestStreak > 0 && (
        <div className="game-card p-4 flex items-center gap-4 border border-orange-500/20 bg-orange-900/10">
          <Flame className="w-10 h-10 text-orange-400 flex-shrink-0" />
          <div>
            <div className="text-lg font-bold text-orange-400">{habitStats.bestStreak}-day streak</div>
            <div className="text-sm text-slate-400">Your longest current habit streak</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-white">{habitStats.total}</div>
            <div className="text-xs text-slate-400">habits tracked</div>
          </div>
        </div>
      )}

      {/* Focus sessions this week */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Clock className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{focusStats.sessions}</div>
          <div className="text-xs text-slate-400">Focus Sessions</div>
        </div>
        <div className="game-card p-4 text-center">
          <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{focusStats.totalMinutes}m</div>
          <div className="text-xs text-slate-400">Focus Minutes</div>
        </div>
        <div className="game-card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{overallScore >= 70 ? '↑' : '→'}</div>
          <div className="text-xs text-slate-400">Trend</div>
        </div>
      </div>
    </div>
  )
}
