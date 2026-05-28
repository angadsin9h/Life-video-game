import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Activity, Zap, Star, Moon, Flame, Brain, Heart, Shield, Trophy, BarChart3, Clock, Users, Target, CheckCircle2 } from 'lucide-react'
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
}

// ── dimension config ───────────────────────────────────────────────────────
const DIMS: DimConfig[] = [
  { key: 'mindful_sleep_log',       label: 'Sleep',       emoji: '😴', scoreField: 'sleepScore',        color: '#6366f1' },
  { key: 'energy_budget_log',       label: 'Energy',      emoji: '⚡', scoreField: 'energyAfter',       color: '#f59e0b' },
  { key: 'daily_excellence_log',    label: 'Excellence',  emoji: '⭐', scoreField: 'excellenceScore',   color: '#eab308' },
  { key: 'growth_mindset_log',      label: 'Growth',      emoji: '🌱', scoreField: 'growthScore',       color: '#22c55e' },
  { key: 'social_intelligence_log', label: 'Social',      emoji: '🤝', scoreField: 'socialScore',       color: '#3b82f6' },
  { key: 'willpower_log',           label: 'Willpower',   emoji: '💪', scoreField: 'willpowerScore',    color: '#ef4444' },
  { key: 'joy_design_log',          label: 'Joy',         emoji: '😊', scoreField: 'joyScore',          color: '#f97316' },
  { key: 'inner_peace_log',         label: 'Peace',       emoji: '🕊️', scoreField: 'peaceScore',        color: '#a855f7' },
  { key: 'purpose_log',             label: 'Purpose',     emoji: '🎯', scoreField: 'alignmentScore',    color: '#10b981' },
  { key: 'physical_peak_log',       label: 'Body',        emoji: '🏃', scoreField: 'performanceScore',  color: '#22c55e' },
  { key: 'neuroplasticity_log',     label: 'Mind',        emoji: '🧠', scoreField: 'sharpnessScore',    color: '#6366f1' },
  { key: 'life_review_log',         label: 'Life Review', emoji: '📊', scoreField: 'satisfactionScore', color: '#3b82f6' },
  { key: 'nightly_debrief_log',     label: 'Debrief',     emoji: '🌙', scoreField: 'debriefScore',      color: '#818cf8' },
  { key: 'daily_driver_log',        label: 'Daily',       emoji: '🚀', scoreField: 'score',             color: '#f472b6' },
]

// ── helpers ────────────────────────────────────────────────────────────────
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

function getMonth(date: Date): string {
  return date.toISOString().slice(0, 7)
}

function offsetMonth(base: string, delta: number): string {
  const [y, m] = base.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthName(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function formatMonthShort(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en', { month: 'short', year: '2-digit' })
}

function monthGrade(score: number): { grade: string; color: string } {
  if (score > 85) return { grade: 'A+', color: '#22c55e' }
  if (score > 75) return { grade: 'A',  color: '#4ade80' }
  if (score > 65) return { grade: 'B',  color: '#3b82f6' }
  if (score > 55) return { grade: 'C',  color: '#f59e0b' }
  return { grade: 'D', color: '#ef4444' }
}

// ── Horizontal bar ─────────────────────────────────────────────────────────
interface HBarProps {
  value: number  // 0-100
  color: string
}
function HBar({ value, color }: HBarProps) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

// ── Dimension Row ──────────────────────────────────────────────────────────
interface DimRowProps {
  dim: DimConfig
  thisMonthAvg: number | null
  lastMonthAvg: number | null
  thisMonthCount: number
  bestMonthAvg: number | null
}

function DimRow({ dim, thisMonthAvg, lastMonthAvg, thisMonthCount, bestMonthAvg }: DimRowProps) {
  const hasThis = thisMonthAvg !== null
  const hasLast = lastMonthAvg !== null

  let pctChange: number | null = null
  let direction: 'up' | 'down' | 'same' = 'same'

  if (hasThis && hasLast && lastMonthAvg! > 0) {
    pctChange = ((thisMonthAvg! - lastMonthAvg!) / lastMonthAvg!) * 100
    direction = pctChange > 1 ? 'up' : pctChange < -1 ? 'down' : 'same'
  } else if (hasThis && !hasLast) {
    direction = 'up'
  }

  const changeColor =
    direction === 'up' ? 'text-green-400' :
    direction === 'down' ? 'text-red-400' :
    'text-slate-400'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <span className="text-lg leading-none w-7 text-center">{dim.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-300">{dim.label}</span>
          <div className="flex items-center gap-3">
            {pctChange !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${changeColor}`}>
                {direction === 'up' ? <ArrowUp className="w-3 h-3" /> : direction === 'down' ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {direction !== 'same' ? `${Math.abs(pctChange).toFixed(0)}%` : '—'}
              </span>
            )}
            <span className="text-xs text-slate-500 w-8 text-right">{hasLast ? lastMonthAvg!.toFixed(0) : '—'}</span>
            <span className="text-sm font-bold text-slate-100 w-8 text-right">{hasThis ? thisMonthAvg!.toFixed(0) : '—'}</span>
          </div>
        </div>
        <HBar value={thisMonthAvg ?? 0} color={dim.color} />
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-slate-600">{thisMonthCount} {thisMonthCount === 1 ? 'entry' : 'entries'}</span>
          {bestMonthAvg !== null && (
            <span className="text-xs text-slate-600">best: {bestMonthAvg.toFixed(0)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────
export default function MonthlyChanges() {
  useToast()

  const currentMonthKey = useMemo(() => getMonth(new Date()), [])
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)

  const minMonth = useMemo(() => offsetMonth(currentMonthKey, -11), [currentMonthKey])

  const canGoBack = selectedMonth > minMonth
  const canGoForward = selectedMonth < currentMonthKey

  const prevMonth = offsetMonth(selectedMonth, -1)

  // All dimension data
  const allDimData = useMemo(() => {
    return DIMS.map(dim => {
      const entries = readLog(dim.key)
      const monthMap: Record<string, number[]> = {}

      for (const e of entries) {
        const d = entryDate(e)
        if (!d) continue
        const score = getScoreForEntry(e, dim)
        if (score === null) continue
        const mo = getMonth(d)
        if (!monthMap[mo]) monthMap[mo] = []
        monthMap[mo].push(score)
      }

      const avg = (mo: string): number | null => {
        const scores = monthMap[mo]
        if (!scores || scores.length === 0) return null
        return scores.reduce((s, v) => s + v, 0) / scores.length
      }

      const count = (mo: string): number => (monthMap[mo] ?? []).length

      // Best month across all time
      const allMonthAvgs = Object.values(monthMap).map(scores =>
        scores.reduce((s, v) => s + v, 0) / scores.length
      )
      const bestMonthAvg = allMonthAvgs.length
        ? Math.max(...allMonthAvgs)
        : null

      return {
        dim,
        thisMonthAvg: avg(selectedMonth),
        lastMonthAvg: avg(prevMonth),
        thisMonthCount: count(selectedMonth),
        bestMonthAvg,
      }
    })
  }, [selectedMonth, prevMonth])

  // Summary stats
  const totalEntriesThisMonth = allDimData.reduce((s, d) => s + d.thisMonthCount, 0)
  const dimsLogged = allDimData.filter(d => d.thisMonthCount > 0).length

  const avgScoreThisMonth = useMemo(() => {
    const vals = allDimData.map(d => d.thisMonthAvg).filter((v): v is number => v !== null)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }, [allDimData])

  const grade = avgScoreThisMonth !== null ? monthGrade(avgScoreThisMonth) : null

  const improved = allDimData.filter(d => {
    if (d.thisMonthAvg === null || d.lastMonthAvg === null || d.lastMonthAvg === 0) return false
    return ((d.thisMonthAvg - d.lastMonthAvg) / d.lastMonthAvg) * 100 > 1
  }).length

  return (
    <div className="space-y-6 pb-8">
      {/* header */}
      <div className="game-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Monthly Changes</h1>
            <p className="text-xs text-slate-400">Month-over-month progress</p>
          </div>
        </div>
        {/* month selector */}
        <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2">
          <button
            onClick={() => canGoBack && setSelectedMonth(offsetMonth(selectedMonth, -1))}
            className={`p-1 rounded-lg transition-colors ${canGoBack ? 'hover:bg-slate-700 text-slate-300' : 'text-slate-600 cursor-not-allowed'}`}
            disabled={!canGoBack}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-200">{formatMonthName(selectedMonth)}</span>
          <button
            onClick={() => canGoForward && setSelectedMonth(offsetMonth(selectedMonth, 1))}
            className={`p-1 rounded-lg transition-colors ${canGoForward ? 'hover:bg-slate-700 text-slate-300' : 'text-slate-600 cursor-not-allowed'}`}
            disabled={!canGoForward}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-black text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalEntriesThisMonth}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Total entries</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-black text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {dimsLogged}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Dims logged</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-black text-slate-100" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgScoreThisMonth !== null ? avgScoreThisMonth.toFixed(0) : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Avg score</div>
        </div>
        <div className="game-card p-3 text-center">
          {grade ? (
            <>
              <div className="text-2xl font-black" style={{ color: grade.color, fontFamily: 'Orbitron, monospace' }}>
                {grade.grade}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Month grade</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-black text-slate-600">—</div>
              <div className="text-xs text-slate-400 mt-0.5">Month grade</div>
            </>
          )}
        </div>
      </div>

      {/* dimension rows */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            {formatMonthShort(selectedMonth)} vs {formatMonthShort(prevMonth)}
          </h2>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>Last mo.</span>
            <span className="w-8 text-right">This</span>
          </div>
        </div>
        <div>
          {allDimData.map(d => (
            <DimRow
              key={d.dim.key}
              dim={d.dim}
              thisMonthAvg={d.thisMonthAvg}
              lastMonthAvg={d.lastMonthAvg}
              thisMonthCount={d.thisMonthCount}
              bestMonthAvg={d.bestMonthAvg}
            />
          ))}
        </div>
      </div>

      {/* improvement summary */}
      <div className="game-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Month Summary
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-semibold">{improved}</span>
            <span className="text-slate-400 text-sm">dimensions improved</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">{dimsLogged}</span>
            <span className="text-slate-400 text-sm">/ {DIMS.length} dimensions active</span>
          </div>
          {grade && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: grade.color }} />
              <span className="font-semibold" style={{ color: grade.color }}>Grade {grade.grade}</span>
              <span className="text-slate-400 text-sm">this month</span>
            </div>
          )}
        </div>

        {/* grade legend */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { grade: 'A+', label: '> 85', color: '#22c55e' },
            { grade: 'A',  label: '> 75', color: '#4ade80' },
            { grade: 'B',  label: '> 65', color: '#3b82f6' },
            { grade: 'C',  label: '> 55', color: '#f59e0b' },
            { grade: 'D',  label: '≤ 55', color: '#ef4444' },
          ].map(g => (
            <div key={g.grade} className="flex items-center gap-1 text-xs text-slate-500">
              <span className="font-bold" style={{ color: g.color }}>{g.grade}</span>
              <span>{g.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
