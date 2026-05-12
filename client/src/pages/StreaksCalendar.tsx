import { useEffect, useState } from 'react'
import axios from 'axios'
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react'

interface Habit {
  id: number
  name: string
  category: string
  color?: string
  streak: number
  best_streak: number
  total_completions: number
}

interface CalendarDay {
  date: string
  done: boolean
}

interface Analytics {
  habit: Habit & { streak: number }
  calendar: CalendarDay[]
  bestStreak: number
  completionRate30: number
}

const CATEGORY_COLORS: Record<string, string> = {
  health: '#22c55e',
  fitness: '#f97316',
  mind: '#8b5cf6',
  work: '#3b82f6',
  social: '#ec4899',
  creative: '#f59e0b',
  spiritual: '#14b8a6',
  other: '#94a3b8',
}

export default function StreaksCalendar() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null)

  useEffect(() => {
    axios.get('/api/habits').then(r => {
      setHabits(r.data as Habit[])
      if ((r.data as Habit[]).length > 0) {
        setSelectedHabit((r.data as Habit[])[0].id)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedHabit) return
    setLoadingAnalytics(true)
    axios.get(`/api/habits/${selectedHabit}/analytics`).then(r => {
      setAnalytics(r.data as Analytics)
      setLoadingAnalytics(false)
    }).catch(() => setLoadingAnalytics(false))
  }, [selectedHabit])

  const habit = habits.find(h => h.id === selectedHabit)
  const color = habit?.color || CATEGORY_COLORS[habit?.category || ''] || '#8b5cf6'
  const calDays = analytics?.calendar || []
  const completionSet = new Set(calDays.filter(d => d.done).map(d => d.date))

  // Build grid weeks
  const firstDow = calDays.length > 0 ? new Date(calDays[0].date + 'T12:00:00').getDay() : 0
  const padded: (CalendarDay | null)[] = [...Array(firstDow).fill(null), ...calDays]
  const weeks: (CalendarDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthPositions: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstDay = week.find(d => d !== null)
    if (firstDay) {
      const m = new Date(firstDay.date + 'T12:00:00').getMonth()
      if (m !== lastMonth) {
        monthPositions.push({ label: monthNames[m], col: wi })
        lastMonth = m
      }
    }
  })

  const today = new Date().toISOString().split('T')[0]

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Flame className="w-7 h-7 text-orange-400" />
          Streaks Calendar
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">365-day habit completion view</p>
      </div>

      {/* Habit selector */}
      <div className="flex flex-wrap gap-2">
        {habits.map(h => {
          const c = h.color || CATEGORY_COLORS[h.category] || '#8b5cf6'
          return (
            <button key={h.id} onClick={() => setSelectedHabit(h.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={selectedHabit === h.id
                ? { background: c + '33', borderColor: c, border: `1px solid ${c}`, color: '#fff' }
                : { background: '#1e293b', color: '#94a3b8' }
              }>
              {h.name}
            </button>
          )
        })}
      </div>

      {habit && analytics && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Current Streak', value: analytics.habit.streak, icon: Flame, suffix: 'd' },
              { label: 'Best Streak', value: analytics.bestStreak, icon: Trophy, suffix: 'd' },
              { label: 'Total Done', value: completionSet.size, icon: Calendar, suffix: '' },
              { label: 'Last 30d Rate', value: analytics.completionRate30, icon: TrendingUp, suffix: '%' },
            ].map(s => (
              <div key={s.label} className="game-card p-3 text-center">
                <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <div className="text-lg font-bold text-white">{s.value}{s.suffix}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          {loadingAnalytics ? (
            <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <>
              {/* 365-day heatmap */}
              <div className="game-card p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Past 365 Days
                </h3>
                <div className="flex gap-[3px] mb-1 ml-[22px]">
                  {weeks.map((_, wi) => {
                    const mp = monthPositions.find(m => m.col === wi)
                    return (
                      <div key={wi} className="w-[11px] text-[9px] text-slate-600 whitespace-nowrap overflow-visible">
                        {mp ? mp.label : ''}
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-[3px]">
                  <div className="flex flex-col gap-[3px] mr-1">
                    {['', 'M', '', 'W', '', 'F', ''].map((d, i) => (
                      <div key={i} className="w-[11px] h-[11px] text-[9px] text-slate-600 flex items-center justify-center">{d}</div>
                    ))}
                  </div>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((day, di) => (
                        <div key={di} className="w-[11px] h-[11px] rounded-sm group relative"
                          style={{
                            background: day === null ? 'transparent' : day.done ? color : '#1e293b',
                            opacity: day === null ? 0 : 1,
                            outline: day?.date === today ? `1px solid ${color}` : 'none',
                          }}>
                          {day && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                              {day.date} {day.done ? '✓' : '✗'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#1e293b' }} />
                  <div className="w-3 h-3 rounded-sm" style={{ background: color, opacity: 0.5 }} />
                  <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                  <span>More</span>
                </div>
              </div>

              {/* 12-week bar */}
              <div className="game-card p-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Last 12 Weeks
                </h3>
                <div className="flex items-end gap-1">
                  {Array.from({ length: 12 }, (_, wi) => {
                    const now = new Date()
                    const weekDays = Array.from({ length: 7 }, (_, di) => {
                      const daysAgo = (11 - wi) * 7 + (6 - di)
                      const d = new Date(now)
                      d.setDate(d.getDate() - daysAgo)
                      return d.toISOString().split('T')[0]
                    })
                    const done = weekDays.filter(d => completionSet.has(d)).length
                    const pct = done / 7
                    const weekLabel = new Date(weekDays[0] + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })
                    return (
                      <div key={wi} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                          w/o {weekLabel}: {done}/7
                        </div>
                        <div className="text-[10px] text-slate-500">{done}/{7}</div>
                        <div className="w-full rounded-sm transition-all"
                          style={{
                            height: `${Math.max(4, pct * 64)}px`,
                            background: pct === 0 ? '#1e293b' : color,
                            opacity: pct === 0 ? 1 : pct * 0.7 + 0.3,
                          }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {habits.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No habits yet. Create some habits to see your streak calendar.</p>
        </div>
      )}
    </div>
  )
}
