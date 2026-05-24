import { useMemo, useState } from 'react'
import { Zap, TrendingUp, TrendingDown, Minus, Clock, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface DimSource { key: string; field: string; invert?: boolean }
interface DimConfig {
  id: string; label: string; emoji: string; color: string; glow: string
  description: string; sources: DimSource[]; route: string
}

const DIMS: DimConfig[] = [
  {
    id: 'mind', label: 'Mind', emoji: '🧠', color: '#6366f1', glow: 'rgba(99,102,241,0.4)',
    description: 'Mental clarity, resilience & cognitive sharpness',
    route: '/resilient-thinking',
    sources: [
      { key: 'resilient_thinking_log',  field: 'resilienceScore' },
      { key: 'neuroplasticity_log',      field: 'sharpnessScore' },
      { key: 'inner_peace_log',          field: 'peaceScore' },
      { key: 'healing_journal_log',      field: 'healingScore' },
      { key: 'growth_mindset_log',       field: 'growthScore' },
    ],
  },
  {
    id: 'body', label: 'Body', emoji: '💪', color: '#22c55e', glow: 'rgba(34,197,94,0.4)',
    description: 'Physical peak, sleep quality & somatic wisdom',
    route: '/physical-peak',
    sources: [
      { key: 'physical_peak_log',   field: 'performanceScore' },
      { key: 'mindful_sleep_log',   field: 'sleepScore' },
      { key: 'body_wisdom_log',     field: 'bodyWisdomScore' },
      { key: 'high_performance_log',field: 'performanceScore' },
    ],
  },
  {
    id: 'energy', label: 'Energy', emoji: '⚡', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)',
    description: 'Vitality, willpower & sustained life force',
    route: '/energy-budget',
    sources: [
      { key: 'energy_budget_log',    field: 'energyAfter' },
      { key: 'life_rhythm_log',      field: 'flowScore' },
      { key: 'daily_excellence_log', field: 'excellenceScore' },
      { key: 'willpower_log',        field: 'willpowerScore' },
    ],
  },
  {
    id: 'social', label: 'Social', emoji: '🌐', color: '#3b82f6', glow: 'rgba(59,130,246,0.4)',
    description: 'Relationships, empathy & connection depth',
    route: '/social-intelligence',
    sources: [
      { key: 'social_intelligence_log', field: 'socialScore' },
      { key: 'compassion_log',          field: 'opennessScore' },
      { key: 'conflict_resolution_log', field: 'harmonyScore' },
      { key: 'boundary_builder_log',    field: 'confidenceScore' },
      { key: 'deep_listening_log',      field: 'listeningScore' },
    ],
  },
  {
    id: 'purpose', label: 'Purpose', emoji: '🧭', color: '#f97316', glow: 'rgba(249,115,22,0.4)',
    description: 'Meaning, direction & aligned contribution',
    route: '/purpose-log',
    sources: [
      { key: 'purpose_log',           field: 'alignmentScore' },
      { key: 'service_log',           field: 'fulfillmentScore' },
      { key: 'life_review_log',       field: 'satisfactionScore' },
      { key: 'intuitive_decision_log',field: 'alignmentScore' },
      { key: 'legacy_builder_log',    field: 'impactScore' },
    ],
  },
  {
    id: 'growth', label: 'Growth', emoji: '🌱', color: '#10b981', glow: 'rgba(16,185,129,0.4)',
    description: 'Learning, mastery & continuous evolution',
    route: '/self-mastery-log',
    sources: [
      { key: 'self_mastery_log',   field: 'masteryScore' },
      { key: 'life_alchemy_log',   field: 'growthScore' },
      { key: 'inspired_action_log',field: 'alignmentScore' },
      { key: 'vision_casting_log', field: 'believabilityScore' },
    ],
  },
  {
    id: 'wealth', label: 'Wealth', emoji: '💰', color: '#eab308', glow: 'rgba(234,179,8,0.4)',
    description: 'Abundance mindset, prosperity & financial health',
    route: '/wealth-mindset',
    sources: [
      { key: 'wealth_mindset_log', field: 'abundanceScore' },
      { key: 'abundance_log',      field: 'expansionScore' },
    ],
  },
  {
    id: 'spirit', label: 'Spirit', emoji: '✨', color: '#a855f7', glow: 'rgba(168,85,247,0.4)',
    description: 'Inner peace, joy & soul-level alignment',
    route: '/inner-peace-log',
    sources: [
      { key: 'joy_design_log',        field: 'joyScore' },
      { key: 'presence_log',          field: 'presenceScore' },
      { key: 'gratitude_to_self_log', field: 'selfLoveScore' },
      { key: 'inner_peace_log',       field: 'peaceScore' },
      { key: 'compassion_log',        field: 'opennessScore' },
    ],
  },
]

const LEVEL_TITLES = [
  'Dormant', 'First Light', 'Awakening', 'Stirring', 'Rising',
  'Building', 'Momentum', 'Flourishing', 'Ascending', 'Mastery', 'Life Architect',
]

interface DimResult {
  cfg: DimConfig
  score: number        // 0–100
  entryCount: number
  trend: 'up' | 'down' | 'neutral'
  trendDelta: number
  lastEntryDaysAgo: number | null
}

function readEntries(key: string): Record<string, unknown>[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function entryMs(e: Record<string, unknown>): number {
  const s = (e.date as string) || (e.createdAt as string) || ''
  return s ? new Date(s).getTime() : 0
}

function computeResults(): DimResult[] {
  const now = Date.now()
  const w1 = now - 7 * 86400000
  const w2 = now - 14 * 86400000

  return DIMS.map(cfg => {
    let sumAll = 0, cntAll = 0
    let sumW1 = 0, cntW1 = 0
    let sumW2 = 0, cntW2 = 0
    let latestMs = 0

    for (const src of cfg.sources) {
      for (const entry of readEntries(src.key)) {
        const raw = entry[src.field]
        if (typeof raw !== 'number') continue
        const val = src.invert ? (10 - raw) : raw
        const ms = entryMs(entry)
        sumAll += val; cntAll++
        if (ms > latestMs) latestMs = ms
        if (ms >= w1) { sumW1 += val; cntW1++ }
        else if (ms >= w2) { sumW2 += val; cntW2++ }
      }
    }

    const score = cntAll > 0 ? (sumAll / cntAll) * 10 : 0 // 0–100
    const avgW1 = cntW1 > 0 ? (sumW1 / cntW1) * 10 : -1
    const avgW2 = cntW2 > 0 ? (sumW2 / cntW2) * 10 : -1

    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    let trendDelta = 0
    if (avgW1 >= 0 && avgW2 >= 0) {
      trendDelta = Math.round(avgW1 - avgW2)
      trend = trendDelta > 2 ? 'up' : trendDelta < -2 ? 'down' : 'neutral'
    } else if (avgW1 >= 0) {
      trend = 'neutral'
    }

    const lastEntryDaysAgo = latestMs > 0 ? Math.floor((now - latestMs) / 86400000) : null

    return { cfg, score, entryCount: cntAll, trend, trendDelta: Math.abs(trendDelta), lastEntryDaysAgo }
  })
}

// ── SVG Radar ─────────────────────────────────────────────────────────────────
function RadarChart({ results }: { results: DimResult[] }) {
  const cx = 150, cy = 150, maxR = 118
  const n = results.length

  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2

  const pt = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  })

  const scorePoints = results.map((r, i) => pt((r.score / 100) * maxR, i))
  const polygon = scorePoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const rings = [0.33, 0.66, 1].map(pct =>
    Array.from({ length: n }, (_, i) => pt(pct * maxR, i))
      .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  )

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto select-none">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background rings */}
      {rings.map((pts, ri) => (
        <polygon key={ri} points={pts} fill="none" stroke="#1e293b" strokeWidth={ri === 2 ? 1.5 : 1} />
      ))}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const end = pt(maxR, i)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#1e293b" strokeWidth="1" />
      })}

      {/* Score fill */}
      <polygon points={polygon} fill="rgba(99,102,241,0.15)" stroke="#6366f1"
        strokeWidth="2" filter="url(#glow)" />

      {/* Score dots + mini glow */}
      {results.map((r, i) => {
        const p = scorePoints[i]
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={6} fill={r.cfg.color} opacity={0.3} />
            <circle cx={p.x} cy={p.y} r={4} fill={r.cfg.color} />
          </g>
        )
      })}

      {/* Labels (emoji + score) */}
      {results.map((r, i) => {
        const labelR = maxR + 26
        const lp = { x: cx + labelR * Math.cos(angle(i)), y: cy + labelR * Math.sin(angle(i)) }
        const anchor = lp.x < cx - 6 ? 'end' : lp.x > cx + 6 ? 'start' : 'middle'
        return (
          <g key={i}>
            <text x={lp.x} y={lp.y - 6} textAnchor={anchor} dominantBaseline="middle"
              fontSize="14" fill="#cbd5e1">{r.cfg.emoji}</text>
            <text x={lp.x} y={lp.y + 9} textAnchor={anchor} dominantBaseline="middle"
              fontSize="9" fill="#64748b">{Math.round(r.score)}</text>
          </g>
        )
      })}

      {/* Center score */}
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fontWeight="bold" fill="white" fontFamily="Orbitron, monospace">
        {Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill="#64748b" letterSpacing="2">LIFE SCORE</text>
    </svg>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LifeScoreEngine() {
  const results = useMemo(() => computeResults(), [])
  const [expanded, setExpanded] = useState<string | null>(null)

  const overallScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
  const level = Math.min(10, Math.floor(overallScore / 10))
  const xpInLevel = overallScore % 10
  const totalEntries = results.reduce((s, r) => s + r.entryCount, 0)

  const sorted = [...results].sort((a, b) => b.score - a.score)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]
  const mostNeglected = [...results]
    .filter(r => r.lastEntryDaysAgo !== null)
    .sort((a, b) => (b.lastEntryDaysAgo ?? 0) - (a.lastEntryDaysAgo ?? 0))[0]

  const INSIGHTS = [
    strongest.score > 0 && `🏆 Strongest: ${strongest.cfg.emoji} ${strongest.cfg.label} — ${Math.round(strongest.score)}/100`,
    weakest.score < 50 && `⚠️ Needs attention: ${weakest.cfg.emoji} ${weakest.cfg.label} — ${Math.round(weakest.score)}/100`,
    mostNeglected?.lastEntryDaysAgo != null && mostNeglected.lastEntryDaysAgo > 3
      && `📅 Not logged in ${mostNeglected.lastEntryDaysAgo}d: ${mostNeglected.cfg.emoji} ${mostNeglected.cfg.label}`,
    totalEntries > 0 && `📊 Total life entries: ${totalEntries} data points`,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}>
          <Zap className="w-7 h-7 text-violet-400" />
          Life Score Engine
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Unified intelligence across all {results.length} life dimensions — powered by your real data.
        </p>
      </div>

      {/* Level Banner */}
      <div className="game-card p-5 border border-violet-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-indigo-900/10 pointer-events-none" />
        <div className="relative flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Life Level</div>
            <div className="text-4xl font-black text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              {String(level).padStart(2, '0')}
            </div>
            <div className="text-violet-400 font-semibold text-sm mt-0.5">{LEVEL_TITLES[level]}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Overall Score</div>
            <div className="text-3xl font-bold text-violet-300" style={{ fontFamily: 'Orbitron, monospace' }}>
              {overallScore}<span className="text-lg text-slate-500">/100</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">{totalEntries} data points logged</div>
          </div>
        </div>
        {/* XP bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Level {level}</span>
            <span>{xpInLevel}/10 XP to Level {Math.min(level + 1, 10)}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all"
              style={{ width: `${xpInLevel * 10}%` }} />
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="game-card p-4 border border-slate-700">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-3 text-center">
          Life Radar — 8 Dimensions
        </div>
        <RadarChart results={results} />
      </div>

      {/* Quick Insights */}
      {INSIGHTS.length > 0 && (
        <div className="game-card p-4 space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Live Insights</div>
          {INSIGHTS.map((ins, i) => (
            <p key={i} className="text-sm text-slate-300">{ins}</p>
          ))}
        </div>
      )}

      {/* Dimension Cards */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 uppercase tracking-widest px-1">Dimension Breakdown</div>
        {results.map(r => {
          const isOpen = expanded === r.cfg.id
          return (
            <div key={r.cfg.id} className="game-card overflow-hidden"
              style={{ borderLeft: `3px solid ${r.cfg.color}` }}>
              <button className="w-full p-3 flex items-center gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : r.cfg.id)}>
                <span className="text-2xl flex-shrink-0">{r.cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{r.cfg.label}</span>
                    {r.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
                    {r.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    {r.trend === 'neutral' && r.entryCount > 0 && <Minus className="w-3.5 h-3.5 text-slate-500" />}
                    {r.trendDelta > 0 && (
                      <span className={`text-xs ${r.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {r.trend === 'up' ? '+' : '-'}{r.trendDelta}
                      </span>
                    )}
                  </div>
                  {/* Score bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${r.score}%`, background: r.cfg.color }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: r.cfg.color }}>
                    {Math.round(r.score)}<span className="text-slate-600 text-xs">/100</span>
                  </div>
                  <div className="text-xs text-slate-600">{r.entryCount} entries</div>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-600 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-800 pt-3">
                  <p className="text-xs text-slate-500">{r.cfg.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {r.lastEntryDaysAgo === null
                      ? 'No entries yet — start logging!'
                      : r.lastEntryDaysAgo === 0
                        ? 'Last logged today'
                        : `Last logged ${r.lastEntryDaysAgo}d ago`}
                  </div>
                  <NavLink to={r.cfg.route}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg mt-1"
                    style={{ background: r.cfg.color + '20', color: r.cfg.color }}>
                    Log to {r.cfg.label} <ChevronRight className="w-3 h-3" />
                  </NavLink>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalEntries === 0 && (
        <div className="text-center py-8 text-slate-600">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start logging across any dimension to activate your Life Score.</p>
          <p className="text-xs mt-1 text-slate-700">Every entry powers this dashboard in real time.</p>
        </div>
      )}
    </div>
  )
}
