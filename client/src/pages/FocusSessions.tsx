import { useEffect, useState } from 'react'
import axios from 'axios'
import { Zap, Clock, Calendar, TrendingUp, Filter } from 'lucide-react'

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
  health: 'text-green-400 bg-green-900/20 border-green-500/30',
  mind:   'text-cyan-400 bg-cyan-900/20 border-cyan-500/30',
  work:   'text-violet-400 bg-violet-900/20 border-violet-500/30',
  social: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  growth: 'text-orange-400 bg-orange-900/20 border-orange-500/30',
}
const CAT_BAR: Record<string, string> = {
  health: 'bg-green-500', mind: 'bg-cyan-500', work: 'bg-violet-500',
  social: 'bg-yellow-500', growth: 'bg-orange-500',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }

function fmt(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString()
}

export default function FocusSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>('all')

  useEffect(() => {
    axios.get<Session[]>('/api/timer/sessions')
      .then(r => setSessions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterCat === 'all' ? sessions : sessions.filter(s => s.category === filterCat)

  // Analytics
  const totalMins = sessions.reduce((s, sess) => s + sess.duration_minutes, 0)
  const avgMins = sessions.length ? Math.round(totalMins / sessions.length) : 0
  const catTotals: Record<string, number> = {}
  sessions.forEach(s => { catTotals[s.category] = (catTotals[s.category] ?? 0) + s.duration_minutes })
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]

  // Days distribution — last 7 days session count
  const last7: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7.push(d.toISOString().split('T')[0])
  }
  const dayCount: Record<string, number> = {}
  sessions.forEach(s => { dayCount[s.date] = (dayCount[s.date] ?? 0) + 1 })
  const maxDay = Math.max(...last7.map(d => dayCount[d] ?? 0), 1)

  // Group by date
  const grouped: Record<string, Session[]> = {}
  filtered.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = []
    grouped[s.date].push(s)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const CATS = ['health', 'mind', 'work', 'social', 'growth']
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Zap className="w-8 h-8 text-yellow-400" />
          Focus Sessions
        </h1>
        <p className="text-slate-400 mt-1">All your focus timer sessions logged here</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {sessions.length}
          </div>
          <div className="text-xs text-slate-500">Total Sessions</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {fmt(totalMins)}
          </div>
          <div className="text-xs text-slate-500">Total Focus Time</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {fmt(avgMins)}
          </div>
          <div className="text-xs text-slate-500">Avg Session</div>
        </div>
      </div>

      {/* Category breakdown bar */}
      {Object.keys(catTotals).length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Focus by Category
          </h3>
          <div className="space-y-3">
            {CATS.filter(c => catTotals[c]).sort((a, b) => (catTotals[b] ?? 0) - (catTotals[a] ?? 0)).map(cat => {
              const pct = Math.round((catTotals[cat] / totalMins) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-400">{CAT_ICONS[cat]} {cat}</span>
                    <span className="text-xs font-semibold text-slate-300">{fmt(catTotals[cat])} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${CAT_BAR[cat]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          {topCat && (
            <div className="mt-3 text-xs text-slate-600 text-center">
              Most focused on: <span className="text-slate-400 font-semibold">{CAT_ICONS[topCat[0]]} {topCat[0]}</span>
            </div>
          )}
        </div>
      )}

      {/* Last 7 days activity */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Last 7 Days
        </h3>
        <div className="flex items-end gap-2 h-16">
          {last7.map(date => {
            const count = dayCount[date] ?? 0
            const d = new Date(date + 'T00:00:00')
            const isToday = date === new Date().toISOString().split('T')[0]
            const barH = count > 0 ? Math.max(15, (count / maxDay) * 100) : 0
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                {count > 0 && <span className="text-xs text-slate-500">{count}</span>}
                <div
                  className={`w-full rounded-t-sm transition-all duration-700 ${isToday ? 'bg-violet-500' : 'bg-blue-600'}`}
                  style={{ height: `${barH}%`, minHeight: count > 0 ? '4px' : '0' }}
                />
                <span className={`text-[10px] ${isToday ? 'text-violet-400' : 'text-slate-600'}`}>
                  {DAY_LABELS[d.getDay()]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterCat === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
        >
          All
        </button>
        {CATS.filter(c => catTotals[c]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
              filterCat === cat
                ? CAT_COLORS[cat]
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {CAT_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Session list grouped by date */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No focus sessions yet.</p>
          <p className="text-xs mt-1">Use the Focus Timer to log sessions — they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-400">{relativeDate(date)}</span>
                <span className="text-xs text-slate-600">{date}</span>
                <span className="ml-auto text-xs text-slate-500">
                  {fmt(grouped[date].reduce((s, sess) => s + sess.duration_minutes, 0))} total
                </span>
              </div>
              <div className="space-y-2">
                {grouped[date].map(session => (
                  <div key={session.id} className={`game-card p-4 flex items-center gap-3 border ${CAT_COLORS[session.category] ?? ''}`}>
                    <div className="text-2xl flex-shrink-0">{CAT_ICONS[session.category]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-200 text-sm truncate">{session.task_name}</div>
                      {session.notes && <div className="text-xs text-slate-500 truncate">{session.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
                        {fmt(session.duration_minutes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
