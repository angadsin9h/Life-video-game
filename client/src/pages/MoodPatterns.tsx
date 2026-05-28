import { useEffect, useState } from 'react'
import axios from 'axios'
import { Heart, TrendingUp, Calendar, BarChart3 } from 'lucide-react'

interface MoodLog {
  id: number
  date: string
  mood: number
  energy?: number
  notes?: string
  tags?: string
  created_at: string
}

const MOOD_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4', '#84cc16']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function MoodPatterns() {
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => { load() }, [range])

  const load = async () => {
    const r = await axios.get(`/api/mood?limit=${range * 3}`)
    setLogs(r.data as MoodLog[])
    setLoading(false)
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const cutoff = new Date(Date.now() - range * 86400000).toISOString().split('T')[0]
  const filtered = logs.filter(l => l.date >= cutoff)

  if (filtered.length === 0) return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Heart className="w-7 h-7 text-pink-400" />
          Mood Patterns
        </h1>
      </div>
      <div className="text-center py-16 text-slate-500">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No mood data for this period. Start logging mood to see patterns.</p>
      </div>
    </div>
  )

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0

  const avgMood = +avg(filtered.map(l => l.mood)).toFixed(1)

  // Day-of-week pattern
  const byDay: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  filtered.forEach(l => {
    const dow = new Date(l.date + 'T12:00:00').getDay()
    byDay[dow].push(l.mood)
  })
  const dayAvgs = Array.from({ length: 7 }, (_, i) => ({ day: DAY_NAMES[i], avg: +avg(byDay[i]).toFixed(1), count: byDay[i].length }))
  const bestDay = dayAvgs.filter(d => d.count > 0).reduce((best, d) => d.avg > best.avg ? d : best, dayAvgs[0])
  const worstDay = dayAvgs.filter(d => d.count > 0).reduce((worst, d) => d.avg < worst.avg ? d : worst, dayAvgs[0])

  // Weekly trend
  const weeks: { label: string; avg: number }[] = []
  for (let w = 0; w < Math.ceil(range / 7); w++) {
    const start = new Date(Date.now() - (w + 1) * 7 * 86400000)
    const end = new Date(Date.now() - w * 7 * 86400000)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    const weekLogs = filtered.filter(l => l.date >= startStr && l.date < endStr)
    if (weekLogs.length > 0) {
      weeks.unshift({ label: `W${Math.ceil(range / 7) - w}`, avg: +avg(weekLogs.map(l => l.mood)).toFixed(1) })
    }
  }

  // Mood distribution
  const distribution: Record<number, number> = {}
  filtered.forEach(l => { distribution[l.mood] = (distribution[l.mood] || 0) + 1 })

  // Monthly chart (daily points)
  const dailyData: { date: string; mood: number }[] = []
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const ds = d.toISOString().split('T')[0]
    const dayLogs = filtered.filter(l => l.date === ds)
    if (dayLogs.length > 0) {
      dailyData.push({ date: ds, mood: +avg(dayLogs.map(l => l.mood)).toFixed(1) })
    }
  }

  // Moving average (7-day)
  const movingAvg: (number | null)[] = dailyData.map((_, i) => {
    const window = dailyData.slice(Math.max(0, i - 3), i + 4)
    return window.length >= 3 ? +avg(window.map(d => d.mood)).toFixed(1) : null
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Mood Patterns
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Uncover your emotional rhythms</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === d ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold" style={{ color: MOOD_COLORS[Math.round(avgMood)] || '#64748b' }}>{avgMood}</div>
          <div className="text-xs text-slate-500">Avg Mood</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{bestDay.count > 0 ? bestDay.day.slice(0, 3) : '—'}</div>
          <div className="text-xs text-slate-500">Best Day</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-red-400">{worstDay.count > 0 ? worstDay.day.slice(0, 3) : '—'}</div>
          <div className="text-xs text-slate-500">Worst Day</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{filtered.length}</div>
          <div className="text-xs text-slate-500">Logs</div>
        </div>
      </div>

      {/* Daily mood line */}
      {dailyData.length > 1 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Daily Mood Trend</h3>
          <div className="relative h-28">
            <svg className="w-full h-full" viewBox={`0 0 ${dailyData.length * 10} 100`} preserveAspectRatio="none">
              {/* Background grid */}
              {[2, 4, 6, 8, 10].map(v => (
                <line key={v} x1="0" y1={`${100 - (v / 10) * 100}`} x2={`${dailyData.length * 10}`} y2={`${100 - (v / 10) * 100}`}
                  stroke="#1e293b" strokeWidth="1" />
              ))}
              {/* Moving average */}
              <polyline
                points={movingAvg.map((v, i) => v !== null ? `${i * 10 + 5},${100 - ((v - 1) / 9) * 90}` : '').filter(Boolean).join(' ')}
                fill="none" stroke="#ec4899" strokeWidth="2" strokeOpacity="0.5" />
              {/* Data points */}
              {dailyData.map((d, i) => (
                <circle key={i} cx={i * 10 + 5} cy={100 - ((d.mood - 1) / 9) * 90} r="3"
                  fill={MOOD_COLORS[Math.round(d.mood)] || '#64748b'} opacity="0.8">
                  <title>{d.date}: {d.mood}/10</title>
                </circle>
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>1</span><span>5</span><span>10</span>
          </div>
        </div>
      )}

      {/* Day of week pattern */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Day of Week</h3>
        <div className="flex items-end gap-2 h-20">
          {dayAvgs.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
              {d.count > 0 && (
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                  {d.day}: {d.avg}/10 ({d.count} logs)
                </div>
              )}
              <div className="w-full rounded-t-sm"
                style={{
                  height: d.count > 0 ? `${((d.avg - 1) / 9) * 100}%` : '4px',
                  background: d.count > 0 ? (MOOD_COLORS[Math.round(d.avg)] || '#64748b') : '#1e293b',
                  minHeight: '4px',
                  opacity: d.count > 0 ? 1 : 0.3,
                }} />
              <div className="text-[9px] text-slate-600">{d.day.slice(0, 2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Mood Distribution</h3>
        <div className="space-y-1.5">
          {Array.from({ length: 10 }, (_, i) => 10 - i).map(v => {
            const count = distribution[v] || 0
            const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0
            return (
              <div key={v} className="flex items-center gap-2">
                <div className="w-4 text-xs text-right text-slate-500">{v}</div>
                <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: MOOD_COLORS[v] || '#64748b' }} />
                </div>
                <div className="w-8 text-xs text-slate-500 text-right">{count > 0 ? `${Math.round(pct)}%` : ''}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly summary */}
      {weeks.length > 1 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Weekly Averages</h3>
          <div className="flex items-end gap-2 h-16">
            {weeks.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm" style={{
                  height: `${((w.avg - 1) / 9) * 100}%`,
                  background: MOOD_COLORS[Math.round(w.avg)] || '#64748b',
                  minHeight: '4px',
                }} />
                <div className="text-[9px] text-slate-600">{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
