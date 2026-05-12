import { useEffect, useState } from 'react'
import axios from 'axios'
import { Zap, Clock, TrendingUp, Calendar, Award } from 'lucide-react'

interface Session {
  id: number
  date: string
  category: string
  task_name: string
  duration_minutes: number
  notes: string | null
  created_at: string
}

const CAT_COLORS: Record<string, string> = {
  health: '#22c55e', mind: '#06b6d4', work: '#8b5cf6', social: '#eab308', growth: '#f97316',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']

function fmt(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function FocusStats() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch last 90 days of sessions
    axios.get<Session[]>('/api/timer/sessions?limit=500').catch(() => axios.get<Session[]>('/api/timer/sessions'))
      .then(res => setSessions(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const totalMins = sessions.reduce((s, s2) => s + s2.duration_minutes, 0)
  const totalSessions = sessions.length

  // By category
  const byCat = CATEGORIES.map(cat => {
    const catSessions = sessions.filter(s => s.category === cat)
    return {
      cat,
      count: catSessions.length,
      mins: catSessions.reduce((s, s2) => s + s2.duration_minutes, 0),
    }
  }).sort((a, b) => b.mins - a.mins)

  // By day of week
  const byDow = Array.from({ length: 7 }, (_, i) => {
    const daySessions = sessions.filter(s => new Date(s.date + 'T12:00:00').getDay() === i)
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      count: daySessions.length,
      mins: daySessions.reduce((s, s2) => s + s2.duration_minutes, 0),
    }
  })
  const maxDowMins = Math.max(...byDow.map(d => d.mins), 1)

  // Streak: consecutive days with sessions
  const sessionDates = new Set(sessions.map(s => s.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (sessionDates.has(ds)) streak++
    else if (i > 0) break
  }

  // Longest session
  const longest = sessions.reduce((max, s) => s.duration_minutes > max.duration_minutes ? s : max, sessions[0])

  // Recent 7 days
  const last7: { date: string; mins: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const dayMins = sessions.filter(s => s.date === ds).reduce((s, s2) => s + s2.duration_minutes, 0)
    last7.push({ date: ds, mins: dayMins })
  }
  const maxLast7 = Math.max(...last7.map(d => d.mins), 1)

  // Productivity score: based on consistency and total hours
  const daysActive = sessionDates.size
  const avgDaily = daysActive > 0 ? totalMins / daysActive : 0
  const prodScore = Math.min(100, Math.round((avgDaily / 120) * 100))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <TrendingUp className="w-7 h-7 text-violet-400" />
          Focus Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Deep insights into your focus patterns</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{fmt(totalMins)}</div>
          <div className="text-xs text-slate-500">Total focused</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{totalSessions}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{streak}</div>
          <div className="text-xs text-slate-500">Day streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{fmt(Math.round(avgDaily))}</div>
          <div className="text-xs text-slate-500">Daily avg</div>
        </div>
      </div>

      {/* Productivity score */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-400">Productivity Score</span>
          <span className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {prodScore}
          </span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${prodScore}%`,
              background: prodScore >= 80 ? '#22c55e' : prodScore >= 50 ? '#8b5cf6' : '#ef4444'
            }} />
        </div>
        <p className="text-xs text-slate-600 mt-1.5">
          {prodScore >= 80 ? '🔥 Elite focus level! You are in the top tier.' :
            prodScore >= 50 ? '💪 Good focus habit building.' :
              '🌱 Start small — even 25 min/day moves the needle.'}
        </p>
      </div>

      {/* Last 7 days */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Last 7 Days
        </h3>
        <div className="flex items-end gap-1.5 h-20">
          {last7.map(d => {
            const barH = Math.max(4, (d.mins / maxLast7) * 72)
            const isToday = d.date === new Date().toISOString().split('T')[0]
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-slate-600">{d.mins > 0 ? fmt(d.mins) : ''}</div>
                <div className="w-full rounded-t-sm transition-all duration-500"
                  style={{ height: `${barH}px`, backgroundColor: isToday ? '#8b5cf6' : d.mins > 0 ? '#6d28d9' : '#1e293b' }} />
                <span className="text-[9px] text-slate-600">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* By category */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Focus by Category</h3>
        <div className="space-y-3">
          {byCat.filter(c => c.mins > 0).map(c => (
            <div key={c.cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300 flex items-center gap-1.5">
                  {CAT_ICONS[c.cat]} {c.cat}
                </span>
                <span className="text-xs text-slate-500">{fmt(c.mins)} · {c.count} sessions</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(c.mins / Math.max(totalMins, 1)) * 100}%`, backgroundColor: CAT_COLORS[c.cat] }} />
              </div>
            </div>
          ))}
          {byCat.every(c => c.mins === 0) && (
            <div className="text-center text-slate-600 py-4 text-sm">No sessions yet</div>
          )}
        </div>
      </div>

      {/* Best days */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <Clock className="w-4 h-4 inline mr-1" />
          Best Days of Week
        </h3>
        <div className="flex items-end gap-1.5 h-16">
          {byDow.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm transition-all"
                style={{ height: `${Math.max(4, (d.mins / maxDowMins) * 48)}px`, backgroundColor: '#8b5cf6' }} />
              <span className="text-[9px] text-slate-600">{d.day}</span>
            </div>
          ))}
        </div>
        {byDow.some(d => d.mins > 0) && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Best day: <span className="text-violet-400 font-semibold">
              {byDow.reduce((max, d) => d.mins > max.mins ? d : max).day}
            </span>
          </p>
        )}
      </div>

      {/* Personal records */}
      {longest && (
        <div className="game-card p-4 border border-yellow-500/20 bg-yellow-900/5">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Personal Record</span>
          </div>
          <div className="text-slate-300 text-sm">
            Longest session: <span className="text-yellow-400 font-bold">{fmt(longest.duration_minutes)}</span>
            {' '}on {new Date(longest.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">"{longest.task_name}"</div>
        </div>
      )}
    </div>
  )
}
