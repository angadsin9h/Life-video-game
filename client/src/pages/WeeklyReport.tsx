import { useEffect, useState } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react'

interface DailyScore { date: string; score: number | null }
interface TopTask { task_name: string; category: string; total_mins: number; times: number }

interface WeekSummary {
  weekStart: string
  weekEnd: string
  daysLogged: number
  avgScore: number
  totalScore: number
  bestDay: { date: string; score: number } | null
  totalHours: number
  catMins: Record<string, number>
  dailyScores: DailyScore[]
  prevAvg: number
  scoreDelta: number
  questsDone: number
  questsTotal: number
  avgMood: number | null
  topTasks: TopTask[]
}

interface WeekListItem { weekStart: string; daysLogged: number; avgScore: number }

const CAT_COLORS: Record<string, string> = {
  health: 'bar-health', mind: 'bar-mind', work: 'bar-work', social: 'bar-social', growth: 'bar-growth',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const MOOD_EMOJIS = ['', '😭', '😔', '😐', '😊', '🤩']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
}

function getScoreBar(score: number) {
  if (score >= 90) return { label: 'Legendary', color: 'text-yellow-400', bar: 'bar-social' }
  if (score >= 70) return { label: 'Great',     color: 'text-green-400',  bar: 'bar-health' }
  if (score >= 50) return { label: 'Decent',    color: 'text-cyan-400',   bar: 'bar-mind'   }
  if (score >= 30) return { label: 'Low',       color: 'text-orange-400', bar: 'bar-growth' }
  return { label: 'Minimal', color: 'text-slate-400', bar: 'bar-growth' }
}

export default function WeeklyReport() {
  const [weekStart, setWeekStart] = useState(getMonday())
  const [report, setReport] = useState<WeekSummary | null>(null)
  const [weeks, setWeeks] = useState<WeekListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      axios.get<WeekSummary>(`/api/weekly/${weekStart}`),
      axios.get<WeekListItem[]>('/api/weekly'),
    ]).then(([rpt, wkList]) => {
      setReport(rpt.data)
      setWeeks(wkList.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [weekStart])

  const changeWeek = (delta: number) => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + delta * 7)
    const next = d.toISOString().split('T')[0]
    const thisMonday = getMonday()
    if (next <= thisMonday) setWeekStart(next)
  }

  const isCurrentWeek = weekStart === getMonday()
  const totalCatMins = report ? Object.values(report.catMins).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Weekly Report</h1>
        <p className="text-slate-400 mt-1">Your performance, decoded week by week</p>
      </div>

      {/* Week navigator */}
      <div className="game-card p-4 flex items-center justify-between">
        <button onClick={() => changeWeek(-1)} className="game-btn-secondary p-2 rounded-lg">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="font-semibold text-slate-200">
            {report ? formatWeekRange(report.weekStart, report.weekEnd) : '—'}
          </div>
          {isCurrentWeek && <div className="text-xs text-violet-400 mt-0.5">Current Week</div>}
        </div>
        <button onClick={() => changeWeek(1)} disabled={isCurrentWeek} className="game-btn-secondary p-2 rounded-lg disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
        </div>
      ) : !report || report.daysLogged === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No data for this week yet.</p>
          <p className="text-sm mt-1">Start logging tasks to generate your weekly report!</p>
        </div>
      ) : (
        <>
          {/* Headline stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Avg Score',    value: `${report.avgScore}`,    color: getScoreBar(report.avgScore).color },
              { label: 'Days Logged',  value: `${report.daysLogged}/7`, color: 'text-violet-400' },
              { label: 'Total Hours',  value: `${report.totalHours}h`, color: 'text-cyan-400'   },
              { label: 'Quests Done',  value: `${report.questsDone}/${report.questsTotal}`, color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="game-card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Score vs previous week */}
          <div className="game-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-200">Week Performance</h3>
              <div className={`flex items-center gap-1 text-sm font-bold ${report.scoreDelta > 0 ? 'text-green-400' : report.scoreDelta < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {report.scoreDelta > 0 ? <TrendingUp className="w-4 h-4" /> : report.scoreDelta < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                {report.scoreDelta > 0 ? '+' : ''}{report.scoreDelta} vs last week
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mt-4">
              {report.dailyScores.map((d, i) => {
                const hasScore = d.score !== null
                const today = new Date().toISOString().split('T')[0]
                const isToday = d.date === today
                const isFuture = d.date > today
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1">
                    <div className="text-xs text-slate-500">{DAY_SHORT[i]}</div>
                    <div
                      className={`w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        isFuture ? 'h-12 bg-slate-800 text-slate-600 border border-slate-700'
                          : hasScore && d.score! >= 70 ? 'h-14 bg-violet-600/40 border border-violet-500/50 text-violet-300'
                          : hasScore ? 'h-12 bg-slate-700 border border-slate-600 text-slate-300'
                          : 'h-10 bg-slate-800 border border-slate-700 text-slate-600'
                      } ${isToday ? 'ring-1 ring-violet-400' : ''}`}
                    >
                      {isFuture ? '—' : hasScore ? d.score : '✗'}
                    </div>
                  </div>
                )
              })}
            </div>
            {report.bestDay && (
              <p className="text-xs text-slate-400 mt-3 text-center">
                🏆 Best day: <span className="text-yellow-400 font-semibold">
                  {new Date(report.bestDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                </span> with {report.bestDay.score} pts
              </p>
            )}
          </div>

          {/* Category breakdown */}
          <div className="game-card p-5">
            <h3 className="font-semibold text-slate-200 mb-4">Category Time Split</h3>
            <div className="space-y-3">
              {Object.entries(report.catMins)
                .filter(([, mins]) => mins > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, mins]) => {
                  const pct = totalCatMins > 0 ? Math.round((mins / totalCatMins) * 100) : 0
                  const h = Math.floor(mins / 60)
                  const m = mins % 60
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{CAT_ICONS[cat]} {cat} <span className="text-slate-500">({pct}%)</span></span>
                        <span>{h > 0 ? `${h}h ` : ''}{m > 0 ? `${m}m` : ''}</span>
                      </div>
                      <div className="stat-bar h-2">
                        <div className={`stat-bar-fill ${CAT_COLORS[cat]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Top tasks */}
          {report.topTasks.length > 0 && (
            <div className="game-card p-5">
              <h3 className="font-semibold text-slate-200 mb-4">Top Activities This Week</h3>
              <div className="space-y-2">
                {report.topTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                    <span className="text-slate-500 text-sm w-5 text-right">{i + 1}.</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 capitalize flex-shrink-0">
                      {CAT_ICONS[t.category]} {t.category}
                    </span>
                    <span className="flex-1 text-sm text-slate-200">{t.task_name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {Math.floor(t.total_mins / 60) > 0 ? `${Math.floor(t.total_mins / 60)}h ` : ''}{t.total_mins % 60}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood + summary */}
          <div className="grid grid-cols-2 gap-4">
            {report.avgMood !== null && (
              <div className="game-card p-4 text-center">
                <div className="text-4xl mb-2">{MOOD_EMOJIS[Math.round(report.avgMood)]}</div>
                <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {report.avgMood.toFixed(1)}/5
                </div>
                <div className="text-xs text-slate-500">Avg Mood</div>
              </div>
            )}
            <div className="game-card p-4 text-center">
              <div className="text-4xl font-bold text-violet-400 mb-1" style={{ fontFamily: 'Orbitron, monospace' }}>
                {report.avgScore}
              </div>
              <div className={`text-sm font-semibold ${getScoreBar(report.avgScore).color}`}>
                {getScoreBar(report.avgScore).label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Weekly Avg</div>
            </div>
          </div>
        </>
      )}

      {/* Past weeks mini-timeline */}
      {weeks.length > 1 && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Weeks</h3>
          <div className="space-y-2">
            {weeks.slice(0, 6).map(w => {
              const bar = getScoreBar(w.avgScore)
              return (
                <button
                  key={w.weekStart}
                  onClick={() => setWeekStart(w.weekStart)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    w.weekStart === weekStart
                      ? 'bg-violet-600/20 border border-violet-500/30'
                      : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">
                      Week of {new Date(w.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {w.weekStart === getMonday() && <span className="ml-2 text-xs text-violet-400">Current</span>}
                    </div>
                    <div className="text-xs text-slate-500">{w.daysLogged} days logged</div>
                  </div>
                  <div className={`text-sm font-bold ${bar.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {w.avgScore > 0 ? `${w.avgScore}` : '—'}
                  </div>
                  <div className="w-20 stat-bar h-2">
                    <div className={`stat-bar-fill ${bar.bar}`} style={{ width: `${w.avgScore}%` }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
