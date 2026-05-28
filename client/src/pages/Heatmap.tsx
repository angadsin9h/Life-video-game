import { useEffect, useState } from 'react'
import axios from 'axios'
import { Flame, Calendar } from 'lucide-react'

interface DayScore {
  date: string
  score: number
}

interface Stats {
  last30Days: DayScore[]
  currentStreak: number
  bestStreak: number
  totalHours: number
  weeklyAvg: number
}

function getScoreColor(score: number | undefined): string {
  if (score === undefined) return 'bg-slate-800 border-slate-700'
  if (score === 0) return 'bg-slate-700 border-slate-600'
  if (score < 30) return 'bg-violet-900 border-violet-800'
  if (score < 50) return 'bg-violet-700 border-violet-600'
  if (score < 70) return 'bg-violet-600 border-violet-500'
  if (score < 90) return 'bg-violet-500 border-violet-400'
  return 'bg-violet-400 border-violet-300'
}

function getScoreLabel(score: number): string {
  if (score === 0) return 'Logged but 0 pts'
  if (score < 30) return 'Low day'
  if (score < 50) return 'Below average'
  if (score < 70) return 'Decent day'
  if (score < 90) return 'Great day'
  return 'Legendary day!'
}

function buildYearGrid(scoreMap: Record<string, number>) {
  const today = new Date()
  const weeks: Array<Array<{ date: string; score: number | undefined; isToday: boolean; isFuture: boolean }>> = []

  // Go back to the Monday 52 weeks ago
  const start = new Date(today)
  start.setDate(start.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) - 51 * 7)

  let current = new Date(start)
  let week: typeof weeks[0] = []

  while (current <= today || week.length > 0) {
    const dateStr = current.toISOString().split('T')[0]
    const isToday = dateStr === today.toISOString().split('T')[0]
    const isFuture = current > today

    week.push({
      date: dateStr,
      score: isFuture ? undefined : scoreMap[dateStr],
      isToday,
      isFuture,
    })

    if (week.length === 7) {
      weeks.push(week)
      week = []
      if (current > today) break
    }

    current.setDate(current.getDate() + 1)
    if (current > today && week.length === 0) break
  }

  if (week.length > 0) {
    while (week.length < 7) {
      const d = new Date(current)
      week.push({ date: d.toISOString().split('T')[0], score: undefined, isToday: false, isFuture: true })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS = ['Mon','','Wed','','Fri','','Sun']

export default function Heatmap() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [allLogs, setAllLogs] = useState<DayScore[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<{ date: string; score: number | undefined } | null>(null)
  const [viewMode, setViewMode] = useState<'year' | '90days'>('year')

  useEffect(() => {
    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<Array<{ date: string; score: number }>>('/api/logs'),
    ]).then(([statsRes, logsRes]) => {
      setStats(statsRes.data)
      setAllLogs(logsRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-800 rounded-xl" />
        <div className="h-32 bg-slate-800 rounded-xl" />
      </div>
    )
  }

  const scoreMap: Record<string, number> = {}
  for (const log of allLogs) scoreMap[log.date] = log.score

  const weeks = buildYearGrid(scoreMap)

  // Month labels: find the first week that starts a new month
  const monthLabels: Array<{ weekIdx: number; month: string }> = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const m = new Date(week[0].date + 'T12:00:00').getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ weekIdx: i, month: MONTH_NAMES[m] })
      lastMonth = m
    }
  })

  // 90-day subset
  const today = new Date().toISOString().split('T')[0]
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
  const ninetyStr = ninetyDaysAgo.toISOString().split('T')[0]
  const recent90 = allLogs.filter(l => l.date >= ninetyStr).sort((a, b) => a.date.localeCompare(b.date))

  const totalLogged = allLogs.length
  const perfectDays = allLogs.filter(l => l.score >= 100).length
  const greatDays = allLogs.filter(l => l.score >= 80).length
  const avgAllTime = totalLogged > 0 ? Math.round(allLogs.reduce((s, l) => s + l.score, 0) / totalLogged) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Activity</h1>
        <p className="text-slate-400 mt-1">Your life in colour — every logged day counts</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Days Logged',    value: totalLogged,                         color: 'text-violet-400' },
          { label: 'Current Streak', value: `${stats?.currentStreak ?? 0}d`,     color: 'text-orange-400' },
          { label: 'Perfect Days',   value: perfectDays,                          color: 'text-yellow-400' },
          { label: 'All-Time Avg',   value: `${avgAllTime}pts`,                  color: 'text-green-400'  },
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {(['year', '90days'] as const).map(v => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === v ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            {v === 'year' ? 'Full Year' : 'Last 90 Days'}
          </button>
        ))}
      </div>

      {viewMode === 'year' ? (
        /* Year Heatmap */
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-slate-200">Year Overview</h2>
            <span className="text-xs text-slate-500 ml-auto">{totalLogged} days logged</span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="inline-flex flex-col gap-1 min-w-max">
              {/* Month labels */}
              <div className="flex gap-1 ml-8">
                {weeks.map((_, i) => {
                  const label = monthLabels.find(m => m.weekIdx === i)
                  return (
                    <div key={i} className="w-4 text-xs text-slate-500 text-center">
                      {label ? label.month : ''}
                    </div>
                  )
                })}
              </div>

              {/* Grid rows (days of week) */}
              {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                <div key={dayIdx} className="flex items-center gap-1">
                  <span className="text-xs text-slate-600 w-7 text-right pr-1 flex-shrink-0">
                    {DAY_LABELS[dayIdx]}
                  </span>
                  {weeks.map((week, wi) => {
                    const cell = week[dayIdx]
                    if (!cell) return <div key={wi} className="w-4 h-4" />
                    const colorClass = cell.isFuture
                      ? 'bg-slate-800/50 border-slate-800'
                      : cell.score !== undefined
                      ? getScoreColor(cell.score)
                      : 'bg-slate-800 border-slate-700'
                    const isToday = cell.date === today
                    return (
                      <div
                        key={wi}
                        className={`w-4 h-4 rounded-sm border cursor-pointer transition-all hover:scale-125 hover:z-10 relative ${colorClass} ${isToday ? 'ring-1 ring-violet-400 ring-offset-1 ring-offset-slate-800' : ''}`}
                        onMouseEnter={() => setHovered(cell)}
                        onMouseLeave={() => setHovered(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {hovered && hovered.date <= today && (
            <div className="mt-3 text-xs text-slate-400 text-center">
              <span className="font-semibold text-slate-200">
                {new Date(hovered.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              {hovered.score !== undefined ? (
                <> — <span className="text-violet-400 font-bold">{hovered.score} pts</span> · {getScoreLabel(hovered.score)}</>
              ) : (
                <> — <span className="text-slate-500">No entry</span></>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-slate-500">Less</span>
            {[undefined, 0, 30, 50, 70, 90].map((v, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm border ${v === undefined ? 'bg-slate-800 border-slate-700' : getScoreColor(v)}`} />
            ))}
            <span className="text-xs text-slate-500">More</span>
          </div>
        </div>
      ) : (
        /* 90-day bar chart */
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-slate-200">Last 90 Days</h2>
          </div>
          {recent90.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No data yet — start logging to fill this in!</p>
          ) : (
            <div className="flex items-end gap-0.5 h-40">
              {Array.from({ length: 90 }, (_, i) => {
                const d = new Date(ninetyDaysAgo)
                d.setDate(d.getDate() + i)
                const dateStr = d.toISOString().split('T')[0]
                const score = scoreMap[dateStr]
                const height = score !== undefined ? Math.max(4, (score / 100) * 100) : 0
                const isToday = dateStr === today
                return (
                  <div
                    key={dateStr}
                    className="flex-1 flex flex-col justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHovered({ date: dateStr, score })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div
                      className={`rounded-t-sm transition-all ${
                        score !== undefined
                          ? isToday
                            ? 'bg-yellow-400'
                            : score >= 80 ? 'bg-violet-400' : score >= 50 ? 'bg-violet-600' : 'bg-violet-800'
                          : 'bg-slate-700'
                      } ${isToday ? 'ring-1 ring-yellow-400/50' : ''}`}
                      style={{ height: score !== undefined ? `${height}%` : '4px' }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {hovered && (
            <div className="mt-3 text-xs text-slate-400 text-center">
              <span className="font-semibold text-slate-200">
                {new Date(hovered.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              {hovered.score !== undefined ? (
                <> — <span className="text-violet-400 font-bold">{hovered.score} pts</span></>
              ) : (
                <> — <span className="text-slate-500">No entry</span></>
              )}
            </div>
          )}
        </div>
      )}

      {/* Streaks breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-3xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stats?.currentStreak ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Current Streak</div>
          <div className="stat-bar h-2 mt-2">
            <div
              className="stat-bar-fill bar-social"
              style={{ width: `${Math.min(100, ((stats?.currentStreak ?? 0) / Math.max(1, stats?.bestStreak ?? 1)) * 100)}%` }}
            />
          </div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stats?.bestStreak ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Best Streak Ever</div>
          <div className="stat-bar h-2 mt-2">
            <div className="stat-bar-fill bar-social" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Score distribution */}
      {totalLogged > 0 && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Score Distribution</h3>
          {[
            { label: '🔥 Legendary (90-100)', count: allLogs.filter(l => l.score >= 90).length, color: 'bar-social' },
            { label: '⚡ Great (70-89)',       count: greatDays - allLogs.filter(l => l.score >= 90).length, color: 'bar-work' },
            { label: '💪 Decent (50-69)',      count: allLogs.filter(l => l.score >= 50 && l.score < 70).length, color: 'bar-mind' },
            { label: '🌱 Low (1-49)',           count: allLogs.filter(l => l.score > 0 && l.score < 50).length, color: 'bar-health' },
          ].map(row => (
            <div key={row.label} className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{row.label}</span>
                <span>{row.count}d</span>
              </div>
              <div className="stat-bar h-2">
                <div className={`stat-bar-fill ${row.color}`} style={{ width: `${(row.count / totalLogged) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
