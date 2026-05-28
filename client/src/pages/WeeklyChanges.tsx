import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, Activity, Zap, Star, Moon, Flame, Brain, Heart, Shield, Trophy, BarChart3, Clock, Users, Target } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ── types ──────────────────────────────────────────────────────────────────
interface LogEntry {
  date?: string
  createdAt?: string
  savedAt?: string
  [key: string]: unknown
}

interface DimConfig {
  key: string
  label: string
  emoji: string
  scoreField: string
  color: string
  icon: React.ReactNode
}

// ── dimension config ───────────────────────────────────────────────────────
const DIMS: DimConfig[] = [
  { key: 'mindful_sleep_log',       label: 'Sleep',       emoji: '😴', scoreField: 'sleepScore',        color: '#6366f1', icon: <Moon className="w-4 h-4" /> },
  { key: 'energy_budget_log',       label: 'Energy',      emoji: '⚡', scoreField: 'energyAfter',       color: '#f59e0b', icon: <Zap className="w-4 h-4" /> },
  { key: 'daily_excellence_log',    label: 'Excellence',  emoji: '⭐', scoreField: 'excellenceScore',   color: '#eab308', icon: <Star className="w-4 h-4" /> },
  { key: 'growth_mindset_log',      label: 'Growth',      emoji: '🌱', scoreField: 'growthScore',       color: '#22c55e', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'social_intelligence_log', label: 'Social',      emoji: '🤝', scoreField: 'socialScore',       color: '#3b82f6', icon: <Users className="w-4 h-4" /> },
  { key: 'willpower_log',           label: 'Willpower',   emoji: '💪', scoreField: 'willpowerScore',    color: '#ef4444', icon: <Flame className="w-4 h-4" /> },
  { key: 'joy_design_log',          label: 'Joy',         emoji: '😊', scoreField: 'joyScore',          color: '#f97316', icon: <Heart className="w-4 h-4" /> },
  { key: 'inner_peace_log',         label: 'Peace',       emoji: '🕊️', scoreField: 'peaceScore',        color: '#a855f7', icon: <Shield className="w-4 h-4" /> },
  { key: 'purpose_log',             label: 'Purpose',     emoji: '🎯', scoreField: 'alignmentScore',    color: '#10b981', icon: <Target className="w-4 h-4" /> },
  { key: 'physical_peak_log',       label: 'Body',        emoji: '🏃', scoreField: 'performanceScore',  color: '#22c55e', icon: <Activity className="w-4 h-4" /> },
  { key: 'neuroplasticity_log',     label: 'Mind',        emoji: '🧠', scoreField: 'sharpnessScore',    color: '#6366f1', icon: <Brain className="w-4 h-4" /> },
  { key: 'life_review_log',         label: 'Life Review', emoji: '📊', scoreField: 'satisfactionScore', color: '#3b82f6', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'nightly_debrief_log',     label: 'Debrief',     emoji: '🌙', scoreField: 'debriefScore',      color: '#818cf8', icon: <Moon className="w-4 h-4" /> },
  { key: 'daily_driver_log',        label: 'Daily',       emoji: '🚀', scoreField: 'score',             color: '#f472b6', icon: <Clock className="w-4 h-4" /> },
]

// ── helpers ────────────────────────────────────────────────────────────────
function getWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return `${d.getFullYear()}-W${String(1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0')}`
}

function normalizeScore(val: unknown): number | null {
  if (typeof val !== 'number') return null
  if (val <= 10) return val * 10
  return val
}

function entryDate(e: LogEntry): Date | null {
  const raw = e.date || e.createdAt || e.savedAt
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

function getScoreForEntry(e: LogEntry, dim: DimConfig): number | null {
  if (dim.key === 'nightly_debrief_log') {
    const r = e.overallDayRating
    if (typeof r === 'number') return r * 10
    return normalizeScore(e.debriefScore)
  }
  return normalizeScore(e[dim.scoreField])
}

function getISOWeeks(count: number): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    result.push(getWeek(d))
  }
  return result
}

// ISO week → Monday date string
function weekToMonday(weekKey: string): Date {
  const [yearStr, wStr] = weekKey.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(wStr)
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7)
  return monday
}

function formatWeekRange(weekKey: string): string {
  const mon = weekToMonday(weekKey)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

// ── Sparkline component ────────────────────────────────────────────────────
interface SparklineProps {
  values: number[]  // 0-100 or NaN for no data
  color: string
}

function Sparkline({ values, color }: SparklineProps) {
  const W = 80
  const H = 32
  const pad = 2

  const valid = values.map((v, i) => ({ v, i })).filter(x => !isNaN(x.v))
  if (valid.length < 2) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={W / 2} y={H / 2 + 4} fontSize="9" fill="#475569" textAnchor="middle">No data</text>
      </svg>
    )
  }

  const xs = values.map((_, i) => pad + (i / (values.length - 1)) * (W - pad * 2))
  const ys = values.map(v => isNaN(v) ? NaN : pad + (1 - v / 100) * (H - pad * 2))

  // build polyline points from valid consecutive segments
  const segments: string[][] = []
  let cur: string[] = []
  for (let i = 0; i < values.length; i++) {
    if (!isNaN(ys[i])) {
      cur.push(`${xs[i].toFixed(1)},${ys[i].toFixed(1)}`)
    } else {
      if (cur.length >= 2) segments.push(cur)
      cur = []
    }
  }
  if (cur.length >= 2) segments.push(cur)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {segments.map((pts, si) => (
        <polyline
          key={si}
          points={pts.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      ))}
      {/* dots for valid points */}
      {valid.map(({ v, i }) => (
        <circle
          key={i}
          cx={xs[i]}
          cy={ys[i]}
          r="1.5"
          fill={color}
          opacity="0.9"
        />
      ))}
    </svg>
  )
}

// ── Dimension Card ─────────────────────────────────────────────────────────
interface DimCardProps {
  dim: DimConfig
  thisWeekAvg: number | null
  lastWeekAvg: number | null
  thisWeekCount: number
  sparkValues: number[]  // 8 weeks, NaN if no data
}

function DimCard({ dim, thisWeekAvg, lastWeekAvg, thisWeekCount, sparkValues }: DimCardProps) {
  const hasThis = thisWeekAvg !== null
  const hasLast = lastWeekAvg !== null

  let pctChange: number | null = null
  let direction: 'up' | 'down' | 'same' = 'same'

  if (hasThis && hasLast && lastWeekAvg! > 0) {
    pctChange = ((thisWeekAvg! - lastWeekAvg!) / lastWeekAvg!) * 100
    direction = pctChange > 1 ? 'up' : pctChange < -1 ? 'down' : 'same'
  } else if (hasThis && !hasLast) {
    direction = 'up'
  }

  const scoreColor =
    (thisWeekAvg ?? 0) >= 80 ? 'text-green-400' :
    (thisWeekAvg ?? 0) >= 60 ? 'text-blue-400' :
    (thisWeekAvg ?? 0) >= 40 ? 'text-yellow-400' :
    'text-red-400'

  const changeColor =
    direction === 'up' ? 'text-green-400' :
    direction === 'down' ? 'text-red-400' :
    'text-slate-400'

  return (
    <div className="game-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{dim.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-200 truncate">{dim.label}</div>
          <div className="text-xs text-slate-500">{thisWeekCount} {thisWeekCount === 1 ? 'entry' : 'entries'} this week</div>
        </div>
        <Sparkline values={sparkValues} color={dim.color} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-2xl font-black ${scoreColor}`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {hasThis ? thisWeekAvg!.toFixed(0) : '—'}
          </div>
          <div className="text-xs text-slate-500">this week</div>
        </div>
        <div className="text-right">
          {pctChange !== null ? (
            <div className={`flex items-center gap-0.5 ${changeColor} font-semibold text-sm`}>
              {direction === 'up' ? <ArrowUp className="w-3.5 h-3.5" /> : direction === 'down' ? <ArrowDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              {direction !== 'same' ? `${Math.abs(pctChange).toFixed(0)}%` : 'No change'}
            </div>
          ) : hasThis && !hasLast ? (
            <div className="text-green-400 text-xs font-medium">New this week</div>
          ) : (
            <div className="text-slate-600 text-xs">No data</div>
          )}
          {hasLast && (
            <div className="text-xs text-slate-500">last: {lastWeekAvg!.toFixed(0)}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────
export default function WeeklyChanges() {
  useToast() // ensure context available

  const [, forceRender] = useState(0)
  useEffect(() => { forceRender(n => n + 1) }, [])

  const weeks8 = useMemo(() => getISOWeeks(8), [])
  const currentWeek = useMemo(() => getWeek(new Date()), [])
  const lastWeek = weeks8[weeks8.length - 2]

  // current week Mon–Sun label
  const currentWeekLabel = useMemo(() => formatWeekRange(currentWeek), [currentWeek])

  // For each dimension: compute per-week averages
  const dimData = useMemo(() => {
    return DIMS.map(dim => {
      const entries = readLog(dim.key)

      // map of weekKey -> scores[]
      const weekMap: Record<string, number[]> = {}
      for (const e of entries) {
        const d = entryDate(e)
        if (!d) continue
        const score = getScoreForEntry(e, dim)
        if (score === null) continue
        const wk = getWeek(d)
        if (!weekMap[wk]) weekMap[wk] = []
        weekMap[wk].push(score)
      }

      const weekAvgs = weeks8.map(wk => {
        const scores = weekMap[wk]
        if (!scores || scores.length === 0) return NaN
        return scores.reduce((s, v) => s + v, 0) / scores.length
      })

      const thisWeekScores = weekMap[currentWeek] ?? []
      const lastWeekScores = weekMap[lastWeek] ?? []

      const thisWeekAvg = thisWeekScores.length
        ? thisWeekScores.reduce((s, v) => s + v, 0) / thisWeekScores.length
        : null
      const lastWeekAvg = lastWeekScores.length
        ? lastWeekScores.reduce((s, v) => s + v, 0) / lastWeekScores.length
        : null

      return {
        dim,
        thisWeekAvg,
        lastWeekAvg,
        thisWeekCount: thisWeekScores.length,
        sparkValues: weekAvgs,
      }
    })
  }, [weeks8, currentWeek, lastWeek])

  // Overall summary
  const overallThis = useMemo(() => {
    const vals = dimData.map(d => d.thisWeekAvg).filter((v): v is number => v !== null)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }, [dimData])

  const overallLast = useMemo(() => {
    const vals = dimData.map(d => d.lastWeekAvg).filter((v): v is number => v !== null)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }, [dimData])

  const overallChange = overallThis !== null && overallLast !== null && overallLast > 0
    ? ((overallThis - overallLast) / overallLast) * 100
    : null

  const improved = dimData.filter(d => {
    if (d.thisWeekAvg === null || d.lastWeekAvg === null || d.lastWeekAvg === 0) return false
    return ((d.thisWeekAvg - d.lastWeekAvg) / d.lastWeekAvg) * 100 > 1
  }).length

  const declined = dimData.filter(d => {
    if (d.thisWeekAvg === null || d.lastWeekAvg === null || d.lastWeekAvg === 0) return false
    return ((d.thisWeekAvg - d.lastWeekAvg) / d.lastWeekAvg) * 100 < -1
  }).length

  const activeCount = dimData.filter(d => d.thisWeekCount > 0).length

  return (
    <div className="space-y-6 pb-8">
      {/* header */}
      <div className="game-card p-4">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Weekly Changes</h1>
            <p className="text-xs text-slate-400">Week of {currentWeekLabel}</p>
          </div>
        </div>
      </div>

      {/* 12-dim grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dimData.map(d => (
          <DimCard
            key={d.dim.key}
            dim={d.dim}
            thisWeekAvg={d.thisWeekAvg}
            lastWeekAvg={d.lastWeekAvg}
            thisWeekCount={d.thisWeekCount}
            sparkValues={d.sparkValues}
          />
        ))}
      </div>

      {/* overall summary */}
      <div className="game-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          This Week vs Last Week — Overall
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-slate-100" style={{ fontFamily: 'Orbitron, monospace' }}>
              {overallThis !== null ? overallThis.toFixed(0) : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">This week avg</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-slate-500" style={{ fontFamily: 'Orbitron, monospace' }}>
              {overallLast !== null ? overallLast.toFixed(0) : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Last week avg</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            {overallChange !== null ? (
              <div className={`text-2xl font-black flex items-center justify-center gap-1 ${overallChange > 0 ? 'text-green-400' : overallChange < 0 ? 'text-red-400' : 'text-slate-400'}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                {overallChange > 0 ? <ArrowUp className="w-5 h-5" /> : overallChange < 0 ? <ArrowDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                {Math.abs(overallChange).toFixed(0)}%
              </div>
            ) : (
              <div className="text-2xl font-black text-slate-500">—</div>
            )}
            <div className="text-xs text-slate-400 mt-0.5">Overall change</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {activeCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Dims logged</div>
          </div>
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <ArrowUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-semibold">{improved}</span>
            <span className="text-slate-400">improved</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowDown className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-semibold">{declined}</span>
            <span className="text-slate-400">declined</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Minus className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-semibold">{dimData.length - improved - declined}</span>
            <span className="text-slate-400">unchanged / no data</span>
          </div>
        </div>
      </div>
    </div>
  )
}
