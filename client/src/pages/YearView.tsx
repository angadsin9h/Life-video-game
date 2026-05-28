import { useEffect, useState } from 'react'
import axios from 'axios'
import { CalendarDays, TrendingUp, Flame } from 'lucide-react'

interface DayData {
  date: string
  score: number
}

function getScoreColor(score: number): string {
  if (score === 0) return '#0f172a'
  if (score < 30) return '#1e1b4b'
  if (score < 50) return '#312e81'
  if (score < 70) return '#4338ca'
  if (score < 85) return '#6d28d9'
  if (score < 95) return '#7c3aed'
  return '#8b5cf6'
}

function getDotStyle(score: number): { background: string; opacity: number; boxShadow?: string } {
  if (score === 0) return { background: '#1e293b', opacity: 0.5 }
  const bg = getScoreColor(score)
  const glow = score >= 85 ? `0 0 4px ${bg}aa` : undefined
  return { background: bg, opacity: 1, boxShadow: glow }
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW_LABELS = ['Mon', 'Wed', 'Fri']

function buildYearGrid(year: number, scoreMap: Record<string, number>): Array<{ date: string; score: number; month: number; dow: number }> {
  const days: Array<{ date: string; score: number; month: number; dow: number }> = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const str = d.toISOString().split('T')[0]
    days.push({ date: str, score: scoreMap[str] ?? 0, month: d.getMonth(), dow: d.getDay() })
  }
  return days
}

export default function YearView() {
  const [allDays, setAllDays] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [hoveredDay, setHoveredDay] = useState<{ date: string; score: number } | null>(null)

  useEffect(() => {
    axios.get<DayData[]>('/api/stats/all-days')
      .then(r => setAllDays(r.data))
      .catch(() => {
        // Fallback: use last 30 days from stats
        axios.get<{ last30Days: DayData[] }>('/api/stats').then(r => setAllDays(r.data.last30Days)).catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  const scoreMap = Object.fromEntries(allDays.map(d => [d.date, d.score]))
  const yearDays = buildYearGrid(selectedYear, scoreMap)

  // Calculate weeks grid (each column = 1 week starting Sunday)
  const firstDay = new Date(selectedYear, 0, 1)
  const startDow = firstDay.getDay() // 0=Sun
  const paddedDays = [...Array(startDow).fill(null), ...yearDays]
  const weeks: Array<Array<{ date: string; score: number } | null>> = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7) as Array<{ date: string; score: number } | null>)
  }
  if (weeks[weeks.length - 1].length < 7) {
    while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null)
  }

  // Month label positions
  const monthStarts: Array<{ month: number; weekIdx: number }> = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const first = week.find(d => d !== null)
    if (first && new Date(first.date + 'T00:00:00').getMonth() !== lastMonth) {
      lastMonth = new Date(first.date + 'T00:00:00').getMonth()
      monthStarts.push({ month: lastMonth, weekIdx: wi })
    }
  })

  // Stats
  const daysLogged = yearDays.filter(d => d.score > 0).length
  const avgScore = daysLogged ? Math.round(yearDays.filter(d => d.score > 0).reduce((s, d) => s + d.score, 0) / daysLogged) : 0
  const perfectDays = yearDays.filter(d => d.score >= 100).length
  const maxScore = yearDays.reduce((m, d) => d.score > m ? d.score : m, 0)

  // Best streak
  let bestStreak = 0; let curStreak = 0
  const today = new Date().toISOString().split('T')[0]
  yearDays.forEach(d => {
    if (d.score > 0 && d.date <= today) { curStreak++; bestStreak = Math.max(bestStreak, curStreak) }
    else curStreak = 0
  })

  const availableYears = Array.from(new Set([
    ...allDays.map(d => parseInt(d.date.split('-')[0])),
    new Date().getFullYear(),
  ])).sort((a, b) => b - a)

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map(i => <div key={i} className="h-40 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <CalendarDays className="w-8 h-8 text-violet-400" />
            Year at a Glance
          </h1>
          <p className="text-slate-400 mt-1">Your full year of life progress</p>
        </div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(parseInt(e.target.value))}
          className="game-input text-sm"
        >
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Days Active', value: daysLogged, color: 'text-violet-400' },
          { label: 'Avg Score', value: avgScore, color: 'text-cyan-400' },
          { label: 'Perfect Days', value: perfectDays, color: 'text-green-400' },
          { label: 'Best Score', value: maxScore, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="game-card p-5 overflow-x-auto">
        <div className="flex items-start gap-2 min-w-max">
          {/* Day of week labels */}
          <div className="flex flex-col gap-0 pt-5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={day} className="h-3 flex items-center" style={{ marginBottom: '1px' }}>
                {(i % 2 === 1) && <span className="text-[9px] text-slate-600 w-7 pr-1 text-right">{day}</span>}
                {(i % 2 !== 1) && <span className="w-7" />}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div>
            {/* Month labels */}
            <div className="flex mb-1" style={{ gap: '1px' }}>
              {weeks.map((week, wi) => {
                const ml = monthStarts.find(m => m.weekIdx === wi)
                return (
                  <div key={wi} className="w-3 flex-shrink-0 text-[9px] text-slate-600" style={{ minWidth: '12px' }}>
                    {ml ? MONTH_NAMES[ml.month] : ''}
                  </div>
                )
              })}
            </div>
            {/* Grid */}
            <div className="flex" style={{ gap: '1px' }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: '1px' }}>
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className="w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125"
                      style={day ? getDotStyle(day.score) : { background: 'transparent' }}
                      onMouseEnter={() => day && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={day ? `${day.date}: ${day.score > 0 ? day.score + ' pts' : 'No log'}` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-600">
          <span>Less</span>
          {[0, 30, 50, 70, 85, 100].map(score => (
            <div key={score} className="w-3 h-3 rounded-sm" style={getDotStyle(score)} title={`${score}+ pts`} />
          ))}
          <span>More</span>
          {hoveredDay && (
            <span className="ml-auto text-slate-400">
              {hoveredDay.date}: <span className="font-bold text-violet-400">{hoveredDay.score > 0 ? `${hoveredDay.score} pts` : 'Not logged'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Monthly summary */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          Monthly Breakdown
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MONTH_NAMES.map((month, mi) => {
            const monthDays = yearDays.filter(d => d.month === mi && d.date <= today)
            const logged = monthDays.filter(d => d.score > 0)
            const avg = logged.length ? Math.round(logged.reduce((s, d) => s + d.score, 0) / logged.length) : 0
            const pct = monthDays.length ? Math.round((logged.length / monthDays.length) * 100) : 0
            const isFuture = new Date(selectedYear, mi, 1) > new Date()
            return (
              <div
                key={month}
                className={`p-2.5 rounded-xl text-center ${isFuture ? 'opacity-30' : 'bg-slate-800'}`}
                style={{ background: !isFuture && logged.length > 0 ? `${getScoreColor(avg)}22` : undefined }}
              >
                <div className="text-xs text-slate-500 mb-1">{month}</div>
                <div className="text-sm font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {isFuture ? '—' : avg > 0 ? avg : '—'}
                </div>
                <div className="text-[10px] text-slate-600">{isFuture ? '' : `${pct}%`}</div>
              </div>
            )
          })}
        </div>
        <div className="mt-2 text-xs text-slate-600 text-center">Average score · % days logged</div>
      </div>

      {/* Best days highlight */}
      {yearDays.filter(d => d.score >= 90).length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-yellow-400" />
            Top Days ({selectedYear})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {yearDays.filter(d => d.score >= 90).sort((a, b) => b.score - a.score).slice(0, 8).map(d => (
              <div key={d.date} className="flex items-center justify-between bg-slate-800 rounded-lg p-2.5">
                <span className="text-xs text-slate-400">{new Date(d.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span className="text-sm font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{d.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
