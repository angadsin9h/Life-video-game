import { useEffect, useState } from 'react'
import axios from 'axios'
import { RefreshCw, TrendingUp, Flame, AlertCircle, Check, BarChart3 } from 'lucide-react'

interface Habit {
  id: number
  name: string
  category: string
  target_days: string
  current_streak: number
  best_streak: number
  total_completions: number
  completions?: string[]
}

interface HabitAnalytics {
  id: number
  name: string
  completionRate: number
  avgStreak: number
  bestStreak: number
  total: number
  last7: boolean[]
  trend: 'up' | 'down' | 'stable'
  dayBreakdown: Record<string, number>
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HabitInsights() {
  const [habits, setHabits] = useState<HabitAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'rate' | 'streak' | 'total'>('rate')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const r = await axios.get('/api/habits')
      const rawHabits = r.data as Habit[]

      // Fetch analytics for each habit
      const analytics = await Promise.all(
        rawHabits.map(async h => {
          try {
            const ar = await axios.get(`/api/habits/${h.id}/analytics`)
            const data = ar.data as { calendar?: Record<string, boolean>; completionRate?: number }
            const calendar = data.calendar || {}

            // Last 7 days
            const last7: boolean[] = Array.from({ length: 7 }, (_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - (6 - i))
              return !!calendar[d.toISOString().split('T')[0]]
            })

            // Last 14 vs prev 14 for trend
            const last14Count = Array.from({ length: 14 }, (_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - i)
              return !!calendar[d.toISOString().split('T')[0]]
            }).filter(Boolean).length

            const prev14Count = Array.from({ length: 14 }, (_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - 14 - i)
              return !!calendar[d.toISOString().split('T')[0]]
            }).filter(Boolean).length

            const trend: 'up' | 'down' | 'stable' = last14Count > prev14Count + 2 ? 'up' : last14Count < prev14Count - 2 ? 'down' : 'stable'

            // Day breakdown (which days are most completed)
            const dayBreakdown: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
            const dayTotal: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }

            Object.keys(calendar).forEach(date => {
              const day = DAY_NAMES[new Date(date + 'T12:00:00').getDay()]
              dayTotal[day]++
              if (calendar[date]) dayBreakdown[day]++
            })

            const dayRates: Record<string, number> = {}
            DAY_NAMES.forEach(d => {
              dayRates[d] = dayTotal[d] > 0 ? Math.round((dayBreakdown[d] / dayTotal[d]) * 100) : 0
            })

            return {
              id: h.id,
              name: h.name,
              completionRate: data.completionRate || 0,
              avgStreak: 0,
              bestStreak: h.best_streak || 0,
              total: h.total_completions || 0,
              last7,
              trend,
              dayBreakdown: dayRates,
            } as HabitAnalytics
          } catch {
            return {
              id: h.id,
              name: h.name,
              completionRate: 0,
              avgStreak: 0,
              bestStreak: h.best_streak || 0,
              total: h.total_completions || 0,
              last7: Array(7).fill(false),
              trend: 'stable' as const,
              dayBreakdown: Object.fromEntries(DAY_NAMES.map(d => [d, 0])),
            }
          }
        })
      )
      setHabits(analytics)
    } finally {
      setLoading(false)
    }
  }

  const sorted = [...habits].sort((a, b) => {
    if (sort === 'rate') return b.completionRate - a.completionRate
    if (sort === 'streak') return b.bestStreak - a.bestStreak
    return b.total - a.total
  })

  const overallRate = habits.length > 0 ? Math.round(habits.reduce((s, h) => s + h.completionRate, 0) / habits.length) : 0
  const struggling = habits.filter(h => h.completionRate < 50 && h.total > 0)
  const thriving = habits.filter(h => h.completionRate >= 80)

  const trendColor = (t: 'up' | 'down' | 'stable') => t === 'up' ? '#22c55e' : t === 'down' ? '#ef4444' : '#64748b'
  const trendSymbol = (t: 'up' | 'down' | 'stable') => t === 'up' ? '↑' : t === 'down' ? '↓' : '→'

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-violet-400" />
            Habit Insights
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Deep analytics on your habit patterns</p>
        </div>
        <div className="flex gap-2">
          {(['rate', 'streak', 'total'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sort === s ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
              {s === 'rate' ? '% Rate' : s === 'streak' ? 'Streak' : 'Total'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <div className="text-3xl font-bold text-violet-400">{overallRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Overall Rate</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{thriving.length}</div>
          <div className="text-xs text-slate-500 mt-1">Thriving (&gt;80%)</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{struggling.length}</div>
          <div className="text-xs text-slate-500 mt-1">Struggling (&lt;50%)</div>
        </div>
      </div>

      {/* Struggling habits callout */}
      {struggling.length > 0 && (
        <div className="game-card p-4 border border-red-500/20 bg-red-900/5">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" /> Needs Attention
          </h3>
          <div className="space-y-1">
            {struggling.map(h => (
              <div key={h.id} className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">{h.name}</span>
                <div className="flex gap-1">
                  {h.last7.map((done, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ background: done ? '#ef4444' : '#1e293b' }} />
                  ))}
                </div>
                <span className="text-red-400 font-medium">{h.completionRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habits grid */}
      <div className="space-y-3">
        {sorted.map(h => {
          const rateColor = h.completionRate >= 80 ? '#22c55e' : h.completionRate >= 50 ? '#eab308' : '#ef4444'
          const bestDay = DAY_NAMES.reduce((best, d) => h.dayBreakdown[d] > h.dayBreakdown[best] ? d : best, DAY_NAMES[0])
          const worstDay = DAY_NAMES.reduce((worst, d) => h.dayBreakdown[d] < h.dayBreakdown[worst] ? d : worst, DAY_NAMES[0])

          return (
            <div key={h.id} className="game-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold" style={{ color: rateColor }}>{h.completionRate}%</div>
                  <div>
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      {h.name}
                      <span style={{ color: trendColor(h.trend) }} className="text-xs font-bold">{trendSymbol(h.trend)}</span>
                    </div>
                    <div className="text-xs text-slate-500">Best streak: {h.bestStreak}d · Total: {h.total}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {h.last7.map((done, i) => (
                    <div key={i} className="w-5 h-5 rounded-sm flex items-center justify-center"
                      style={{ background: done ? rateColor + '33' : '#1e293b', border: `1px solid ${done ? rateColor + '66' : 'transparent'}` }}>
                      {done && <Check className="w-3 h-3" style={{ color: rateColor }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate bar */}
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${h.completionRate}%`, background: rateColor }} />
              </div>

              {/* Day breakdown */}
              <div className="flex gap-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="flex-1 text-center">
                    <div className="h-6 rounded-sm mb-1" style={{
                      background: h.dayBreakdown[d] > 0 ? rateColor + Math.round(h.dayBreakdown[d] * 2.55).toString(16).padStart(2, '0') : '#1e293b',
                    }} title={`${d}: ${h.dayBreakdown[d]}%`} />
                    <div className="text-[9px] text-slate-700">{d[0]}</div>
                  </div>
                ))}
              </div>

              {h.total > 7 && (
                <div className="text-[11px] text-slate-600 flex gap-3">
                  <span>Best: <span className="text-green-400">{bestDay}</span></span>
                  <span>Worst: <span className="text-red-400">{worstDay}</span></span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No habits tracked yet. Create habits to see insights here.</p>
        </div>
      )}
    </div>
  )
}
