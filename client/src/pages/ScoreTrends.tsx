import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Activity, Zap, Star, Moon, Flame, Brain, Heart, Shield, BarChart3, Clock, Target, Users, RefreshCw, CheckCircle2 } from 'lucide-react'
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

function getISODateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function getTextField(e: LogEntry): string {
  const textFields = ['biggestWin', 'whatYouDid', 'growthReframe', 'temptationFaced', 'joySource', 'peaceAnchor', 'purposeStatement', 'excerciseDone', 'learningToday', 'periodHighlight', 'mainFocus', 'bedtimeRitual', 'activity']
  for (const f of textFields) {
    const v = e[f]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────
interface DataPoint {
  dateStr: string
  score: number
}

interface LineChartProps {
  points: DataPoint[]
  rollingAvg: (number | null)[]
  color: string
}

function LineChart({ points, rollingAvg, color }: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const W = 600
  const H = 300
  const PAD = { top: 16, right: 20, bottom: 48, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
        No entries yet for this dimension.
      </div>
    )
  }

  const n = points.length
  const xOf = (i: number) => PAD.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW)
  const yOf = (score: number) => PAD.top + chartH - (score / 100) * chartH

  // main line points
  const linePoints = points.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.score).toFixed(1)}`).join(' ')

  // rolling avg line (skip nulls)
  const rollingSegments: string[][] = []
  let cur: string[] = []
  for (let i = 0; i < n; i++) {
    const rv = rollingAvg[i]
    if (rv !== null) {
      cur.push(`${xOf(i).toFixed(1)},${yOf(rv).toFixed(1)}`)
    } else {
      if (cur.length >= 2) rollingSegments.push(cur)
      cur = []
    }
  }
  if (cur.length >= 2) rollingSegments.push(cur)

  // x-axis labels: show every ~5 points
  const labelStep = Math.max(1, Math.ceil(n / 8))
  const xLabels = points
    .map((p, i) => ({ i, label: formatDateShort(p.dateStr) }))
    .filter(({ i }) => i === 0 || i === n - 1 || i % labelStep === 0)

  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: Math.max(200, H) }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* y-axis gridlines */}
        {[0, 25, 50, 75, 100].map(v => {
          const cy = yOf(v)
          return (
            <g key={v}>
              <line x1={PAD.left} y1={cy} x2={W - PAD.right} y2={cy} stroke="#1e293b" strokeWidth="1" />
              <text x={PAD.left - 4} y={cy + 4} fontSize="9" fill="#64748b" textAnchor="end">{v}</text>
            </g>
          )
        })}

        {/* x-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xOf(i)}
            y={H - PAD.bottom + 14}
            fontSize="8"
            fill="#64748b"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* 7-day rolling avg line (dashed) */}
        {rollingSegments.map((pts, si) => (
          <polyline
            key={si}
            points={pts.join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        ))}

        {/* main score line */}
        {n >= 2 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        )}

        {/* dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xOf(i)}
            cy={yOf(p.score)}
            r={hoveredIdx === i ? 5 : 3}
            fill={color}
            stroke="#0f172a"
            strokeWidth="1.5"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIdx(i)}
          />
        ))}

        {/* hover tooltip */}
        {hovered !== null && hoveredIdx !== null && (() => {
          const tx = Math.min(xOf(hoveredIdx), W - 110)
          const ty = Math.max(yOf(hovered.score) - 40, PAD.top)
          return (
            <g>
              <rect x={tx} y={ty} width={100} height={32} fill="#0f172a" rx="4" stroke="#334155" strokeWidth="1" />
              <text x={tx + 6} y={ty + 13} fontSize="9" fill="#94a3b8">{formatDateShort(hovered.dateStr)}</text>
              <text x={tx + 6} y={ty + 25} fontSize="10" fill="#e2e8f0" fontWeight="bold">{hovered.score.toFixed(0)} / 100</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
      <div className="text-xl font-black" style={{ color: color ?? '#e2e8f0', fontFamily: 'Orbitron, monospace' }}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}

// ── score pill ─────────────────────────────────────────────────────────────
function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 80 ? 'bg-green-500/20 text-green-400' :
    score >= 60 ? 'bg-blue-500/20 text-blue-400' :
    score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
    'bg-red-500/20 text-red-400'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {score.toFixed(0)}
    </span>
  )
}

// ── main component ─────────────────────────────────────────────────────────
export default function ScoreTrends() {
  useToast()

  const [selectedDimKey, setSelectedDimKey] = useState<string>(DIMS[0].key)
  const [, forceRender] = useState(0)
  useEffect(() => { forceRender(n => n + 1) }, [])

  const selectedDim = DIMS.find(d => d.key === selectedDimKey) ?? DIMS[0]

  // Load and process entries for selected dimension
  const { points, rollingAvg, stats, recentEntries } = useMemo(() => {
    const raw = readLog(selectedDim.key)
    const scored: { date: Date; dateStr: string; score: number; entry: LogEntry }[] = []

    for (const e of raw) {
      const d = entryDate(e)
      if (!d) continue
      const score = getScoreForEntry(e, selectedDim)
      if (score === null) continue
      scored.push({ date: d, dateStr: getISODateStr(d), score, entry: e })
    }

    // Sort ascending
    scored.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Last 30 entries
    const last30 = scored.slice(-30)

    // 7-day rolling average
    const rollingAvgArr: (number | null)[] = last30.map((_, i) => {
      const windowEnd = last30[i].date
      const windowStart = new Date(windowEnd)
      windowStart.setDate(windowStart.getDate() - 6)
      const windowPts = last30.filter(p => p.date >= windowStart && p.date <= windowEnd)
      if (windowPts.length === 0) return null
      return windowPts.reduce((s, p) => s + p.score, 0) / windowPts.length
    })

    // Stats
    const allScores = scored.map(p => p.score)
    const allTimeHigh = allScores.length ? Math.max(...allScores) : null
    const allTimeLow = allScores.length ? Math.min(...allScores) : null

    const now = new Date()
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30)

    const last7Scores = scored.filter(p => p.date >= d7).map(p => p.score)
    const last30Scores = scored.filter(p => p.date >= d30).map(p => p.score)

    const avg7 = last7Scores.length ? last7Scores.reduce((s, v) => s + v, 0) / last7Scores.length : null
    const avg30 = last30Scores.length ? last30Scores.reduce((s, v) => s + v, 0) / last30Scores.length : null

    // Consistency: % of last 30 calendar days with at least 1 entry
    const daysInLast30 = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      daysInLast30.add(getISODateStr(d))
    }
    const daysWithEntry = new Set(scored.filter(p => daysInLast30.has(p.dateStr)).map(p => p.dateStr))
    const consistency = Math.round((daysWithEntry.size / 30) * 100)

    // Recent 10 entries (most recent first)
    const recentEntries = [...scored].reverse().slice(0, 10)

    return {
      points: last30.map(p => ({ dateStr: p.dateStr, score: p.score })),
      rollingAvg: rollingAvgArr,
      stats: { allTimeHigh, allTimeLow, avg7, avg30, total: allScores.length, consistency },
      recentEntries,
    }
  }, [selectedDim])

  return (
    <div className="space-y-6 pb-8">
      {/* header */}
      <div className="game-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Score Trends</h1>
            <p className="text-xs text-slate-400">Deep dive into any dimension</p>
          </div>
        </div>
        {/* dimension selector pills */}
        <div className="flex flex-wrap gap-2">
          {DIMS.map(d => (
            <button
              key={d.key}
              onClick={() => setSelectedDimKey(d.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDimKey === d.key
                  ? 'text-white shadow-lg scale-105'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
              style={selectedDimKey === d.key ? { background: d.color } : {}}
            >
              <span>{d.emoji}</span>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* chart */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedDim.emoji}</span>
            <h2 className="text-base font-bold text-slate-200">{selectedDim.label}</h2>
            <span className="text-xs text-slate-500">last 30 entries</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 rounded" style={{ background: selectedDim.color }} />
              <span>Score</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 rounded border-t border-dashed" style={{ borderColor: selectedDim.color, opacity: 0.5 }} />
              <span>7d avg</span>
            </div>
          </div>
        </div>
        <LineChart points={points} rollingAvg={rollingAvg} color={selectedDim.color} />
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="All-time High" value={stats.allTimeHigh !== null ? stats.allTimeHigh.toFixed(0) : '—'} color="#22c55e" />
        <StatCard label="All-time Low" value={stats.allTimeLow !== null ? stats.allTimeLow.toFixed(0) : '—'} color="#ef4444" />
        <StatCard label="7-day Avg" value={stats.avg7 !== null ? stats.avg7.toFixed(1) : '—'} color={selectedDim.color} />
        <StatCard label="30-day Avg" value={stats.avg30 !== null ? stats.avg30.toFixed(1) : '—'} color={selectedDim.color} />
        <StatCard label="Total Entries" value={stats.total.toString()} color="#94a3b8" />
        <StatCard label="Consistency" value={`${stats.consistency}%`} color={stats.consistency >= 70 ? '#22c55e' : stats.consistency >= 40 ? '#f59e0b' : '#ef4444'} />
      </div>

      {/* consistency explanation */}
      <div className="game-card p-3 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold text-slate-300">Consistency Score</div>
          <div className="text-xs text-slate-500">% of the last 30 calendar days with at least 1 entry logged</div>
        </div>
        <div className="ml-auto text-2xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: stats.consistency >= 70 ? '#22c55e' : stats.consistency >= 40 ? '#f59e0b' : '#ef4444' }}>
          {stats.consistency}%
        </div>
      </div>

      {/* recent entries */}
      <div className="game-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-400" />
          Recent Entries — {selectedDim.label}
        </h2>
        {recentEntries.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No entries yet. Start logging {selectedDim.label.toLowerCase()}!</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((e, i) => {
              const text = getTextField(e.entry)
              return (
                <div key={i} className="flex items-start gap-3 py-1.5 border-b border-slate-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{formatDateShort(e.dateStr)}</span>
                      <ScorePill score={e.score} />
                    </div>
                    {text && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{text}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
