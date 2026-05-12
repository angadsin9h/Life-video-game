import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { RefreshCw, TrendingUp, Flame, ChevronLeft, Award } from 'lucide-react'

interface HabitSummary {
  id: number
  title: string
  emoji: string
  category: string
  streak: number
  completedToday: boolean
  totalCompletions: number
}

interface CalendarDay {
  date: string
  done: boolean
}

interface Analytics {
  habit: HabitSummary & { streak: number }
  calendar: CalendarDay[]
  dowCounts: number[]
  dowTotals: number[]
  monthly: { label: string; done: number; total: number; pct: number }[]
  bestStreak: number
  completionRate30: number
  totalCompletions: number
}

const CAT_COLORS: Record<string, string> = {
  health: 'text-green-400',
  mind: 'text-cyan-400',
  work: 'text-violet-400',
  social: 'text-yellow-400',
  growth: 'text-orange-400',
}
const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getIntensityColor(done: boolean, isShield = false): string {
  if (isShield) return '#6366f1'
  return done ? '#8b5cf6' : '#1e293b'
}

export default function HabitAnalytics() {
  const navigate = useNavigate()
  const [habits, setHabits] = useState<HabitSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    axios.get<HabitSummary[]>('/api/habits').then(r => {
      setHabits(r.data)
      if (r.data.length > 0) setSelectedId(r.data[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setAnalyticsLoading(true)
    axios.get<Analytics>(`/api/habits/${selectedId}/analytics`)
      .then(r => setAnalytics(r.data))
      .finally(() => setAnalyticsLoading(false))
  }, [selectedId])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  if (habits.length === 0) return (
    <div className="text-center py-12 text-slate-500">
      <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p>No habits yet. <button onClick={() => navigate('/habits')} className="text-violet-400 hover:underline">Create your first habit →</button></p>
    </div>
  )

  // Build week grid for calendar
  const weekGrid: (CalendarDay | null)[][] = []
  if (analytics) {
    const firstDay = new Date(analytics.calendar[0].date + 'T12:00:00').getDay()
    const padded: (CalendarDay | null)[] = [...Array(firstDay).fill(null), ...analytics.calendar]
    for (let i = 0; i < padded.length; i += 7) {
      weekGrid.push(padded.slice(i, i + 7))
    }
  }

  const months: string[] = []
  if (analytics) {
    let lastMonth = ''
    analytics.calendar.forEach(({ date }) => {
      const m = new Date(date + 'T12:00:00').toLocaleDateString('en', { month: 'short' })
      if (m !== lastMonth) { months.push(m); lastMonth = m } else months.push('')
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/habits')} className="text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-8 h-8 text-violet-400" />
            Habit Analytics
          </h1>
          <p className="text-slate-400 mt-0.5">Deep dive into your consistency</p>
        </div>
      </div>

      {/* Habit selector */}
      <div className="flex flex-wrap gap-2">
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedId(h.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
              selectedId === h.id
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <span>{h.emoji}</span>
            <span>{h.title}</span>
            {h.streak > 0 && (
              <span className="flex items-center gap-0.5 text-orange-400 text-xs">
                <Flame className="w-3 h-3" />{h.streak}
              </span>
            )}
          </button>
        ))}
      </div>

      {analyticsLoading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
        </div>
      )}

      {analytics && !analyticsLoading && (
        <>
          {/* Header stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Current Streak', value: `${analytics.habit.streak}d`, icon: '🔥', color: 'text-orange-400' },
              { label: 'Best Streak', value: `${analytics.bestStreak}d`, icon: '🏆', color: 'text-yellow-400' },
              { label: '30-day Rate', value: `${analytics.completionRate30}%`, icon: '📊', color: 'text-violet-400' },
              { label: 'Total Done', value: analytics.totalCompletions.toString(), icon: '✅', color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="game-card p-4 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* 365-day calendar */}
          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-400" />
              {analytics.habit.emoji} {analytics.habit.title} — Year Calendar
            </h3>

            {/* Month labels */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 mb-1" style={{ minWidth: 'max-content' }}>
                <div className="w-5" /> {/* DOW label space */}
                {weekGrid.map((_, wi) => {
                  const day = weekGrid[wi]?.find(d => d !== null)
                  const label = day ? new Date(day.date + 'T12:00:00').toLocaleDateString('en', { month: 'short' }) : ''
                  const prev = wi > 0 ? weekGrid[wi - 1]?.find(d => d !== null) : null
                  const prevLabel = prev ? new Date(prev.date + 'T12:00:00').toLocaleDateString('en', { month: 'short' }) : ''
                  return (
                    <div key={wi} className="w-3 text-xs text-slate-600 truncate" style={{ fontSize: 9 }}>
                      {label !== prevLabel ? label : ''}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
                {/* Day-of-week labels */}
                <div className="flex flex-col gap-1 mr-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="w-4 h-3 text-center text-slate-600 leading-3" style={{ fontSize: 9 }}>{i % 2 === 1 ? d : ''}</div>
                  ))}
                </div>
                {/* Week columns */}
                {weekGrid.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, di) => {
                      const day = week[di]
                      return (
                        <div
                          key={di}
                          className="w-3 h-3 rounded-sm transition-colors"
                          style={{ background: day?.done ? '#8b5cf6' : day ? '#1e293b' : 'transparent' }}
                          title={day ? `${day.date}: ${day.done ? 'Done ✓' : 'Not done'}` : ''}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                <span>Less</span>
                {['#1e293b', '#4c1d95', '#6d28d9', '#8b5cf6'].map(c => (
                  <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Day of week breakdown */}
          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Success by Day of Week</h3>
            <div className="flex gap-2">
              {DOW_LABELS.map((label, i) => {
                const pct = analytics.dowTotals[i] > 0 ? Math.round(analytics.dowCounts[i] / analytics.dowTotals[i] * 100) : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs font-bold" style={{ color: `hsl(${pct * 1.2}, 60%, 60%)` }}>{pct}%</div>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{ height: `${Math.max(pct * 0.6, 2)}px`, background: `hsl(${pct * 1.2}, 40%, 30%)` }}
                    />
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Monthly breakdown */}
          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Monthly Completion</h3>
            <div className="space-y-3">
              {analytics.monthly.map(m => (
                <div key={m.label} className="flex items-center gap-3">
                  <div className="w-8 text-xs text-slate-500">{m.label}</div>
                  <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${m.pct}%`,
                        background: m.pct >= 80 ? '#22c55e' : m.pct >= 60 ? '#8b5cf6' : m.pct >= 40 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 w-20 text-right">
                    {m.done}/{m.total} <span className="text-slate-600">({m.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="game-card p-5 border border-violet-500/20">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Insights</h3>
            <div className="space-y-2 text-sm text-slate-300">
              {(() => {
                const insights = []
                const bestDow = analytics.dowCounts.indexOf(Math.max(...analytics.dowCounts))
                const worstDow = analytics.dowCounts.indexOf(Math.min(...analytics.dowCounts))
                if (analytics.completionRate30 >= 80) insights.push(`🔥 You're in the top tier — ${analytics.completionRate30}% completion rate this month. Keep it up!`)
                else if (analytics.completionRate30 >= 60) insights.push(`📈 Solid consistency at ${analytics.completionRate30}%. Try to push above 80% for long-term habit formation.`)
                else insights.push(`⚠️ Only ${analytics.completionRate30}% this month. Consider reducing friction — make the habit smaller or tie it to an existing routine.`)
                insights.push(`📅 You're most consistent on ${DOW_LABELS[bestDow]}s (${Math.round(analytics.dowCounts[bestDow] / Math.max(analytics.dowTotals[bestDow], 1) * 100)}% success rate).`)
                if (analytics.habit.streak >= 7) insights.push(`🏆 Current ${analytics.habit.streak}-day streak is amazing. You've earned ${Math.floor(analytics.habit.streak / 7)} shield${Math.floor(analytics.habit.streak / 7) !== 1 ? 's' : ''}.`)
                if (analytics.bestStreak > analytics.habit.streak && analytics.bestStreak >= 7) insights.push(`💡 Your best was ${analytics.bestStreak} days. You've done it before — you can do it again!`)
                return insights.map((ins, i) => <div key={i}>{ins}</div>)
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
