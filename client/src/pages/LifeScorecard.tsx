import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Star, Target, Calendar, Save, Award, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ScorecardEntry {
  id: string
  weekStart: string
  scores: {
    health: number
    mindset: number
    relationships: number
    career: number
    finances: number
    growth: number
    joy: number
    contribution: number
  }
  highlight: string
  lowlight: string
  intention: string
}

type DimensionKey = keyof ScorecardEntry['scores']

interface Dimension {
  key: DimensionKey
  label: string
  emoji: string
  color: string
}

const STORAGE_KEY = 'life_scorecard_log'

const DIMENSIONS: Dimension[] = [
  { key: 'health', label: 'Health', emoji: '💪', color: '#22c55e' },
  { key: 'mindset', label: 'Mindset', emoji: '🧠', color: '#8b5cf6' },
  { key: 'relationships', label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  { key: 'career', label: 'Career', emoji: '🚀', color: '#3b82f6' },
  { key: 'finances', label: 'Finances', emoji: '💰', color: '#f59e0b' },
  { key: 'growth', label: 'Growth', emoji: '📚', color: '#14b8a6' },
  { key: 'joy', label: 'Joy', emoji: '🎉', color: '#f97316' },
  { key: 'contribution', label: 'Contribution', emoji: '🌟', color: '#a78bfa' },
]

function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function overallScore(scores: ScorecardEntry['scores']): number {
  const vals = Object.values(scores)
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e'
  if (score >= 5) return '#eab308'
  return '#ef4444'
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(d)} – ${fmt(end)}`
}

const DEFAULT_SCORES: ScorecardEntry['scores'] = {
  health: 5, mindset: 5, relationships: 5, career: 5,
  finances: 5, growth: 5, joy: 5, contribution: 5,
}

// SVG Radar Chart
function RadarChart({ scores }: { scores: ScorecardEntry['scores'] }) {
  const cx = 150
  const cy = 150
  const R = 120
  const n = 8
  const step = (2 * Math.PI) / n
  // Start from top (–π/2)
  const angleFor = (i: number) => -Math.PI / 2 + i * step

  const pointFor = (i: number, value: number) => {
    const r = (value / 10) * R
    const angle = angleFor(i)
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const outerPoint = (i: number) => {
    const angle = angleFor(i)
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) }
  }

  const labelPoint = (i: number) => {
    const angle = angleFor(i)
    const labelR = R + 22
    return { x: cx + labelR * Math.cos(angle), y: cy + labelR * Math.sin(angle) }
  }

  const keys = DIMENSIONS.map(d => d.key)
  const polygon = keys
    .map((k, i) => pointFor(i, scores[k]))
    .map(p => `${p.x},${p.y}`)
    .join(' ')

  // Concentric rings at 2,4,6,8,10
  const rings = [2, 4, 6, 8, 10]

  return (
    <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
      {/* Rings */}
      {rings.map(v => {
        const pts = DIMENSIONS.map((_, i) => {
          const angle = angleFor(i)
          const r = (v / 10) * R
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
        }).join(' ')
        return <polygon key={v} points={pts} fill="none" stroke="#334155" strokeWidth={1} />
      })}

      {/* Axes */}
      {DIMENSIONS.map((_, i) => {
        const op = outerPoint(i)
        return <line key={i} x1={cx} y1={cy} x2={op.x} y2={op.y} stroke="#475569" strokeWidth={1} />
      })}

      {/* Data polygon */}
      <polygon points={polygon} fill="rgba(139,92,246,0.25)" stroke="#8b5cf6" strokeWidth={2} />

      {/* Data points */}
      {keys.map((k, i) => {
        const p = pointFor(i, scores[k])
        return <circle key={k} cx={p.x} cy={p.y} r={4} fill="#8b5cf6" />
      })}

      {/* Labels */}
      {DIMENSIONS.map((dim, i) => {
        const lp = labelPoint(i)
        return (
          <text
            key={dim.key}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="#94a3b8"
          >
            {dim.emoji} {dim.label}
          </text>
        )
      })}
    </svg>
  )
}

// SVG Trend Line Chart (overall score over last 8 weeks)
function TrendChart({ entries }: { entries: ScorecardEntry[] }) {
  const last8 = [...entries].slice(0, 8).reverse()
  if (last8.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 text-slate-600 text-xs">
        Log at least 2 weeks to see trends
      </div>
    )
  }

  const W = 320
  const H = 80
  const pad = { top: 10, bottom: 10, left: 10, right: 10 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom

  const scores = last8.map(e => overallScore(e.scores))
  const minS = Math.max(0, Math.min(...scores) - 1)
  const maxS = Math.min(10, Math.max(...scores) + 1)

  const xFor = (i: number) => pad.left + (i / (last8.length - 1)) * chartW
  const yFor = (v: number) => pad.top + chartH - ((v - minS) / (maxS - minS)) * chartH

  const points = scores.map((s, i) => `${xFor(i)},${yFor(s)}`).join(' ')
  const areaPoints = [
    `${xFor(0)},${H - pad.bottom}`,
    ...scores.map((s, i) => `${xFor(i)},${yFor(s)}`),
    `${xFor(scores.length - 1)},${H - pad.bottom}`,
  ].join(' ')

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
      <polygon points={areaPoints} fill="rgba(139,92,246,0.12)" />
      <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinejoin="round" />
      {scores.map((s, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(s)} r={3} fill="#8b5cf6" />
      ))}
      {last8.map((e, i) => (
        <text key={i} x={xFor(i)} y={H - 1} textAnchor="middle" fontSize={8} fill="#475569">
          {e.weekStart.slice(5).replace('-', '/')}
        </text>
      ))}
    </svg>
  )
}

export default function LifeScorecard() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ScorecardEntry[]>([])
  const [scores, setScores] = useState<ScorecardEntry['scores']>({ ...DEFAULT_SCORES })
  const [highlight, setHighlight] = useState('')
  const [lowlight, setLowlight] = useState('')
  const [intention, setIntention] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const thisWeek = getMondayOfWeek(new Date())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed: ScorecardEntry[] = raw ? JSON.parse(raw) : []
      setEntries(parsed)
      const thisEntry = parsed.find(e => e.weekStart === thisWeek)
      if (thisEntry) {
        setScores({ ...thisEntry.scores })
        setHighlight(thisEntry.highlight)
        setLowlight(thisEntry.lowlight)
        setIntention(thisEntry.intention)
      }
    } catch { /**/ }
  }, [thisWeek])

  const persist = (updated: ScorecardEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleSave = () => {
    const entry: ScorecardEntry = {
      id: thisWeek,
      weekStart: thisWeek,
      scores: { ...scores },
      highlight,
      lowlight,
      intention,
    }
    const without = entries.filter(e => e.weekStart !== thisWeek)
    persist([entry, ...without].sort((a, b) => b.weekStart.localeCompare(a.weekStart)))
    toastSuccess('Scorecard saved!', `Week of ${formatWeek(thisWeek)}`)
  }

  const current = overallScore(scores)
  const history = entries.filter(e => e.weekStart !== thisWeek).slice(0, 5)

  const sortedDims = [...DIMENSIONS].sort((a, b) => scores[b.key] - scores[a.key])
  const bestDim = sortedDims[0]
  const worstDim = sortedDims[sortedDims.length - 1]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <BarChart3 className="w-7 h-7 text-violet-400" />
            Life Scorecard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Rate yourself weekly across 8 life dimensions
          </p>
        </div>
        <div className="text-right">
          <div
            className="text-3xl font-bold"
            style={{ color: scoreColor(current), fontFamily: 'Orbitron, monospace' }}
          >
            {current}
          </div>
          <div className="text-xs text-slate-500">overall score</div>
        </div>
      </div>

      {/* Overall score + highlights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Best this week</div>
            <div className="text-sm font-semibold text-white truncate">
              {bestDim.emoji} {bestDim.label}{' '}
              <span className="text-green-400">{scores[bestDim.key]}/10</span>
            </div>
          </div>
        </div>
        <div className="game-card p-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Needs work</div>
            <div className="text-sm font-semibold text-white truncate">
              {worstDim.emoji} {worstDim.label}{' '}
              <span className="text-red-400">{scores[worstDim.key]}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* This week's scorecard form */}
      <div className="game-card p-5 space-y-4 border border-violet-500/20">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-violet-400" />
          Week of {formatWeek(thisWeek)}
        </h3>

        <div className="space-y-3">
          {DIMENSIONS.map(dim => {
            const val = scores[dim.key]
            const pct = ((val - 1) / 9) * 100
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">
                    {dim.emoji} {dim.label}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: dim.color }}
                  >
                    {val}/10
                  </span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{ width: `${pct}%`, backgroundColor: dim.color }}
                    />
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={val}
                    onChange={e =>
                      setScores(s => ({ ...s, [dim.key]: Number(e.target.value) }))
                    }
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                    style={{ accentColor: dim.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-700">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              ✨ Biggest win this week
            </label>
            <textarea
              value={highlight}
              onChange={e => setHighlight(e.target.value)}
              placeholder="What was your biggest win or highlight?"
              className="game-input w-full h-16 resize-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              ⚡ Biggest challenge
            </label>
            <textarea
              value={lowlight}
              onChange={e => setLowlight(e.target.value)}
              placeholder="What was the hardest thing this week?"
              className="game-input w-full h-16 resize-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              🎯 Focus intention for next week
            </label>
            <textarea
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="What will you focus on next week?"
              className="game-input w-full h-16 resize-none text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Scorecard
        </button>
      </div>

      {/* Radar Chart */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-violet-400" />
          Life Balance Radar
        </h3>
        <RadarChart scores={scores} />
      </div>

      {/* Trend Line */}
      {entries.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Overall Score Trend (Last 8 Weeks)
          </h3>
          <TrendChart entries={entries} />
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-400" />
            Recent History
          </h3>
          {history.map(entry => {
            const total = overallScore(entry.scores)
            const isExp = expandedId === entry.id
            const sDims = [...DIMENSIONS].sort((a, b) => entry.scores[b.key] - entry.scores[a.key])
            return (
              <div key={entry.id} className="game-card overflow-hidden">
                <div
                  className="p-3 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExp ? null : entry.id)}
                >
                  <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-300">{formatWeek(entry.weekStart)}</div>
                    <div className="text-xs text-slate-500">
                      Best: {sDims[0].emoji} {sDims[0].label} · Worst:{' '}
                      {sDims[sDims.length - 1].emoji} {sDims[sDims.length - 1].label}
                    </div>
                  </div>
                  <div
                    className="text-lg font-bold px-2.5 py-0.5 rounded-lg"
                    style={{
                      color: scoreColor(total),
                      background: scoreColor(total) + '22',
                      fontFamily: 'Orbitron, monospace',
                    }}
                  >
                    {total}
                  </div>
                  {isExp ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                {isExp && (
                  <div className="border-t border-slate-700 p-3 space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      {DIMENSIONS.map(dim => (
                        <div key={dim.key} className="text-center">
                          <div className="text-xs">{dim.emoji}</div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: dim.color }}
                          >
                            {entry.scores[dim.key]}
                          </div>
                          <div className="text-xs text-slate-600">{dim.label}</div>
                        </div>
                      ))}
                    </div>
                    {entry.highlight && (
                      <p className="text-xs text-green-300">✨ {entry.highlight}</p>
                    )}
                    {entry.lowlight && (
                      <p className="text-xs text-red-300">⚡ {entry.lowlight}</p>
                    )}
                    {entry.intention && (
                      <p className="text-xs text-violet-300">🎯 {entry.intention}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Rate your first week to start tracking your life balance.</p>
        </div>
      )}
    </div>
  )
}
