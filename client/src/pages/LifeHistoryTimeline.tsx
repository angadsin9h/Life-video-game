import { useEffect, useState, useMemo } from 'react'
import { BarChart3, Calendar, TrendingUp, TrendingDown, Minus, Clock, Activity, Zap, Star, Moon, Flame, Brain, Heart, Shield, Trophy } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ── types ──────────────────────────────────────────────────────────────────
interface LogEntry {
  date?: string
  createdAt?: string
  [key: string]: unknown
}

interface DimConfig {
  key: string
  label: string
  emoji: string
  scoreField: string
  icon: React.ReactNode
}

interface AggregatedBar {
  label: string
  value: number   // 0-100
  count: number
  periodKey: string
}

interface RecentEntry {
  date: string
  label: string
  emoji: string
  score: number
}

// ── dimension config ───────────────────────────────────────────────────────
const DIMS: DimConfig[] = [
  { key: 'mindful_sleep_log',      label: 'Sleep',       emoji: '😴', scoreField: 'sleepScore',       icon: <Moon className="w-4 h-4" /> },
  { key: 'energy_budget_log',      label: 'Energy',      emoji: '⚡', scoreField: 'energyAfter',      icon: <Zap className="w-4 h-4" /> },
  { key: 'daily_excellence_log',   label: 'Excellence',  emoji: '⭐', scoreField: 'excellenceScore',  icon: <Star className="w-4 h-4" /> },
  { key: 'growth_mindset_log',     label: 'Growth',      emoji: '🌱', scoreField: 'growthScore',      icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'social_intelligence_log',label: 'Social',      emoji: '🤝', scoreField: 'socialScore',      icon: <Activity className="w-4 h-4" /> },
  { key: 'willpower_log',          label: 'Willpower',   emoji: '💪', scoreField: 'willpowerScore',   icon: <Flame className="w-4 h-4" /> },
  { key: 'joy_design_log',         label: 'Joy',         emoji: '😊', scoreField: 'joyScore',         icon: <Heart className="w-4 h-4" /> },
  { key: 'inner_peace_log',        label: 'Peace',       emoji: '🕊️', scoreField: 'peaceScore',       icon: <Shield className="w-4 h-4" /> },
  { key: 'purpose_log',            label: 'Purpose',     emoji: '🎯', scoreField: 'alignmentScore',   icon: <Trophy className="w-4 h-4" /> },
  { key: 'physical_peak_log',      label: 'Body',        emoji: '🏃', scoreField: 'performanceScore', icon: <Activity className="w-4 h-4" /> },
  { key: 'neuroplasticity_log',    label: 'Mind',        emoji: '🧠', scoreField: 'sharpnessScore',   icon: <Brain className="w-4 h-4" /> },
  { key: 'life_review_log',        label: 'Life Review', emoji: '📊', scoreField: 'satisfactionScore',icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'nightly_debrief_log',    label: 'Debrief',     emoji: '🌙', scoreField: 'debriefScore',     icon: <Moon className="w-4 h-4" /> },
  { key: 'daily_driver_log',       label: 'Daily',       emoji: '🚀', scoreField: 'dailyScore',       icon: <Clock className="w-4 h-4" /> },
]

// ── helpers ────────────────────────────────────────────────────────────────
function getWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return `${d.getFullYear()}-W${String(1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0')}`
}

function getMonth(date: Date): string {
  return date.toISOString().slice(0, 7)
}

function normalizeScore(val: unknown): number | null {
  if (typeof val !== 'number') return null
  if (val <= 10) return val * 10
  return val
}

function entryDate(e: LogEntry): Date | null {
  const raw = e.date || e.createdAt
  if (!raw) return null
  const d = new Date(raw as string)
  return isNaN(d.getTime()) ? null : d
}

function readLog(key: string): LogEntry[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : []
  } catch {
    return []
  }
}

function barColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

function formatWeekLabel(weekKey: string): string {
  // weekKey = "2026-W21"
  const [yearStr, wStr] = weekKey.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(wStr)
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7)
  return monday.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en', { month: 'short', year: '2-digit' })
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────
interface BarChartProps {
  bars: AggregatedBar[]
  height?: number
}

function BarChart({ bars, height = 160 }: BarChartProps) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)
  const W = 600
  const H = height
  const PAD = { top: 10, right: 10, bottom: 28, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const barW = Math.max(4, chartW / bars.length - 3)

  if (!bars.length) return <div className="text-slate-500 text-sm text-center py-8">No data yet</div>

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* y-axis gridlines */}
        {[0, 25, 50, 75, 100].map(v => {
          const cy = PAD.top + chartH - (v / 100) * chartH
          return (
            <g key={v}>
              <line x1={PAD.left} y1={cy} x2={W - PAD.right} y2={cy} stroke="#1e293b" strokeWidth="1" />
              <text x={PAD.left - 4} y={cy + 4} fontSize="9" fill="#64748b" textAnchor="end">{v}</text>
            </g>
          )
        })}
        {/* bars */}
        {bars.map((bar, i) => {
          const bx = PAD.left + (i / bars.length) * chartW + (chartW / bars.length - barW) / 2
          const bh = Math.max(2, (bar.value / 100) * chartH)
          const by = PAD.top + chartH - bh
          const color = barColor(bar.value)
          return (
            <g key={bar.periodKey}
              onMouseEnter={e => setTooltip({ idx: i, x: bx, y: by })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect x={bx} y={by} width={barW} height={bh} fill={color} opacity={tooltip?.idx === i ? 1 : 0.75} rx="2" />
              <text
                x={bx + barW / 2}
                y={H - PAD.bottom + 12}
                fontSize="8"
                fill="#64748b"
                textAnchor="middle"
              >
                {bar.label}
              </text>
            </g>
          )
        })}
        {/* tooltip */}
        {tooltip !== null && bars[tooltip.idx] && (() => {
          const bar = bars[tooltip.idx]
          const tx = Math.min(tooltip.x, W - 100)
          return (
            <g>
              <rect x={tx} y={tooltip.y - 36} width={90} height={30} fill="#0f172a" rx="4" stroke="#334155" strokeWidth="1" />
              <text x={tx + 6} y={tooltip.y - 22} fontSize="9" fill="#94a3b8">{bar.label}</text>
              <text x={tx + 6} y={tooltip.y - 10} fontSize="10" fill="#e2e8f0" fontWeight="bold">{bar.value.toFixed(1)} avg</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────
export default function LifeHistoryTimeline() {
  const { toastSuccess } = useToast()
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')

  // ── load all logs ──
  const allEntries = useMemo(() => {
    const result: { date: Date; dim: DimConfig; score: number }[] = []
    for (const dim of DIMS) {
      const entries = readLog(dim.key)
      for (const e of entries) {
        const d = entryDate(e)
        if (!d) continue
        let rawScore = e[dim.scoreField]
        if (dim.key === 'nightly_debrief_log' && typeof e.overallDayRating === 'number') {
          rawScore = e.overallDayRating * 10
        }
        const score = normalizeScore(rawScore)
        if (score === null) continue
        result.push({ date: d, dim, score })
      }
    }
    return result
  }, [])

  // ── aggregate by week ──
  const weekBars = useMemo<AggregatedBar[]>(() => {
    const now = new Date()
    const weeks: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.push(getWeek(d))
    }
    return weeks.map(wk => {
      const entries = allEntries.filter(e => getWeek(e.date) === wk)
      const avg = entries.length ? entries.reduce((s, e) => s + e.score, 0) / entries.length : 0
      return { label: formatWeekLabel(wk), value: avg, count: entries.length, periodKey: wk }
    })
  }, [allEntries])

  // ── aggregate by month ──
  const monthBars = useMemo<AggregatedBar[]>(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(getMonth(d))
    }
    return months.map(mo => {
      const entries = allEntries.filter(e => getMonth(e.date) === mo)
      const avg = entries.length ? entries.reduce((s, e) => s + e.score, 0) / entries.length : 0
      return { label: formatMonthLabel(mo), value: avg, count: entries.length, periodKey: mo }
    })
  }, [allEntries])

  const bars = view === 'weekly' ? weekBars : monthBars

  // ── stats ──
  const activeBars = bars.filter(b => b.count > 0)
  const bestBar = activeBars.length ? activeBars.reduce((a, b) => b.value > a.value ? b : a) : null
  const worstBar = activeBars.length ? activeBars.reduce((a, b) => b.value < a.value ? b : a) : null

  const longestStreak = useMemo(() => {
    let max = 0, cur = 0
    for (const b of weekBars) {
      if (b.value > 50 && b.count > 0) { cur++; max = Math.max(max, cur) }
      else cur = 0
    }
    return max
  }, [weekBars])

  const totalEntries = allEntries.length

  // ── trend: last 4 vs previous 4 weeks ──
  const trendPct = useMemo(() => {
    const last4 = weekBars.slice(-4).filter(b => b.count > 0)
    const prev4 = weekBars.slice(-8, -4).filter(b => b.count > 0)
    if (!last4.length || !prev4.length) return null
    const avgLast = last4.reduce((s, b) => s + b.value, 0) / last4.length
    const avgPrev = prev4.reduce((s, b) => s + b.value, 0) / prev4.length
    if (avgPrev === 0) return null
    return ((avgLast - avgPrev) / avgPrev) * 100
  }, [weekBars])

  // ── recent 20 entries ──
  const recent20 = useMemo<RecentEntry[]>(() => {
    return [...allEntries]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20)
      .map(e => ({
        date: e.date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' }),
        label: e.dim.label,
        emoji: e.dim.emoji,
        score: e.score,
      }))
  }, [allEntries])

  const scorePillColor = (s: number) =>
    s >= 80 ? 'bg-green-500/20 text-green-400' :
    s >= 60 ? 'bg-blue-500/20 text-blue-400' :
    s >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
    'bg-red-500/20 text-red-400'

  return (
    <div className="space-y-6 pb-8">
      {/* header */}
      <div className="game-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Life History Timeline</h1>
            <p className="text-xs text-slate-400">All dimensions • historical view</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['weekly', 'monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* chart */}
      <div className="game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300">
            Last 12 {view === 'weekly' ? 'Weeks' : 'Months'} — Avg Score
          </h2>
          {trendPct !== null && view === 'weekly' && (
            <span className={`ml-auto flex items-center gap-1 text-sm font-semibold ${trendPct > 0 ? 'text-green-400' : trendPct < 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {trendPct > 0 ? <TrendingUp className="w-4 h-4" /> : trendPct < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {trendPct > 0 ? '+' : ''}{trendPct.toFixed(1)}% vs prev 4w
            </span>
          )}
        </div>
        <BarChart bars={bars} height={180} />
        {/* legend */}
        <div className="flex gap-4 mt-3 flex-wrap">
          {[['< 40', '#ef4444'], ['40–60', '#eab308'], ['60–80', '#3b82f6'], ['≥ 80', '#22c55e']].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-400">{bestBar ? bestBar.value.toFixed(0) : '—'}</div>
          <div className="text-xs text-slate-400">Best {view === 'weekly' ? 'Week' : 'Month'}</div>
          <div className="text-xs text-slate-500">{bestBar?.label ?? ''}</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-red-400">{worstBar ? worstBar.value.toFixed(0) : '—'}</div>
          <div className="text-xs text-slate-400">Worst {view === 'weekly' ? 'Week' : 'Month'}</div>
          <div className="text-xs text-slate-500">{worstBar?.label ?? ''}</div>
        </div>
        <div className="game-card p-3 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-orange-400">{longestStreak}</div>
          <div className="text-xs text-slate-400">Longest Streak</div>
          <div className="text-xs text-slate-500">weeks avg &gt; 50</div>
        </div>
        <div className="game-card p-3 text-center">
          <Activity className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-indigo-400">{totalEntries}</div>
          <div className="text-xs text-slate-400">Total Entries</div>
          <div className="text-xs text-slate-500">all time</div>
        </div>
      </div>

      {/* recent entries */}
      <div className="game-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> 20 Most Recent Entries
        </h2>
        {recent20.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No entries logged yet. Start tracking your dimensions!</p>
        ) : (
          <div className="space-y-2">
            {recent20.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-lg leading-none">{e.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-300 font-medium">{e.label}</span>
                </div>
                <span className="text-xs text-slate-500">{e.date}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scorePillColor(e.score)}`}>
                  {e.score.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
