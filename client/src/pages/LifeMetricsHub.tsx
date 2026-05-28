import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, BarChart3, Layers, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

interface MetricSource {
  key: string
  field: string
  label: string
  emoji: string
  color: string
  special?: 'nightly_debrief' | 'life_rating'
}

const SOURCES: MetricSource[] = [
  { key: 'mindful_sleep_log',        field: 'sleepScore',       label: 'Sleep',            emoji: '😴', color: '#6366f1' },
  { key: 'energy_budget_log',        field: 'energyAfter',      label: 'Energy',           emoji: '⚡', color: '#f59e0b' },
  { key: 'daily_excellence_log',     field: 'excellenceScore',  label: 'Daily Excellence', emoji: '🏆', color: '#a855f7' },
  { key: 'growth_mindset_log',       field: 'growthScore',      label: 'Growth Mindset',   emoji: '🌱', color: '#22c55e' },
  { key: 'social_intelligence_log',  field: 'socialScore',      label: 'Social IQ',        emoji: '🤝', color: '#3b82f6' },
  { key: 'willpower_log',            field: 'willpowerScore',   label: 'Willpower',        emoji: '💪', color: '#ec4899' },
  { key: 'joy_design_log',           field: 'joyScore',         label: 'Joy',              emoji: '☀️', color: '#eab308' },
  { key: 'inner_peace_log',          field: 'peaceScore',       label: 'Inner Peace',      emoji: '🕊️', color: '#94a3b8' },
  { key: 'purpose_log',              field: 'alignmentScore',   label: 'Purpose',          emoji: '🧭', color: '#f97316' },
  { key: 'physical_peak_log',        field: 'performanceScore', label: 'Physical Peak',    emoji: '🏅', color: '#ef4444' },
  { key: 'neuroplasticity_log',      field: 'sharpnessScore',   label: 'Brain Sharpness',  emoji: '🧠', color: '#8b5cf6' },
  { key: 'life_review_log',          field: 'satisfactionScore',label: 'Life Review',      emoji: '📊', color: '#10b981' },
  { key: 'resilient_thinking_log',   field: 'resilienceScore',  label: 'Resilience',       emoji: '🛡️', color: '#0ea5e9' },
  { key: 'body_wisdom_log',          field: 'bodyWisdomScore',  label: 'Body Wisdom',      emoji: '🌀', color: '#14b8a6' },
  { key: 'healing_journal_log',      field: 'healingScore',     label: 'Healing',          emoji: '💚', color: '#4ade80' },
  { key: 'conflict_resolution_log',  field: 'harmonyScore',     label: 'Harmony',          emoji: '☮️', color: '#f472b6' },
  { key: 'abundance_log',            field: 'expansionScore',   label: 'Abundance',        emoji: '✨', color: '#fbbf24' },
  { key: 'high_performance_log',     field: 'performanceScore', label: 'High Performance', emoji: '🚀', color: '#6366f1' },
  { key: 'nightly_debrief_log',      field: 'overallDayRating', label: 'Nightly Debrief',  emoji: '🌙', color: '#818cf8', special: 'nightly_debrief' },
  { key: 'life_rating_log',          field: 'dimensions',       label: 'Life Rating',      emoji: '⭐', color: '#fcd34d', special: 'life_rating' },
]

function normalize(val: number): number {
  if (val <= 0) return 0
  const score = val <= 10 ? val * 10 : val
  return Math.min(100, score)
}

function daysAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function getColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

interface MetricResult {
  source: MetricSource
  score: number
  lastDate: string
  hasEntries: boolean
}

export default function LifeMetricsHub() {
  const [metrics, setMetrics] = useState<MetricResult[]>([])
  const [refreshed, setRefreshed] = useState(false)

  const loadMetrics = () => {
    const results: MetricResult[] = SOURCES.map(src => {
      try {
        const raw = localStorage.getItem(src.key)
        if (!raw) return { source: src, score: 0, lastDate: '', hasEntries: false }
        const arr: Record<string, unknown>[] = JSON.parse(raw)
        if (!Array.isArray(arr) || arr.length === 0) return { source: src, score: 0, lastDate: '', hasEntries: false }
        const latest = arr[0]
        const dateStr = (latest['createdAt'] as string) || (latest['date'] as string) || ''
        let score = 0
        if (src.special === 'nightly_debrief') {
          const v = Number(latest[src.field] ?? 0)
          score = normalize(v)
        } else if (src.special === 'life_rating') {
          const dims = latest['dimensions']
          if (Array.isArray(dims) && dims.length > 0) {
            const avg = dims.reduce((s: number, d: Record<string, unknown>) => s + Number(d['score'] ?? d['value'] ?? 0), 0) / dims.length
            score = normalize(avg)
          } else {
            const v = Number(latest[src.field] ?? 0)
            score = normalize(v)
          }
        } else {
          const v = Number(latest[src.field] ?? 0)
          score = normalize(v)
        }
        // high_performance_log pick max if also reading physical_peak
        if (src.key === 'high_performance_log') {
          const physRaw = localStorage.getItem('physical_peak_log')
          if (physRaw) {
            try {
              const physArr: Record<string, unknown>[] = JSON.parse(physRaw)
              if (physArr.length > 0) {
                const physScore = normalize(Number(physArr[0]['performanceScore'] ?? 0))
                score = Math.max(score, physScore)
              }
            } catch { /**/ }
          }
        }
        return { source: src, score, lastDate: dateStr, hasEntries: true }
      } catch {
        return { source: src, score: 0, lastDate: '', hasEntries: false }
      }
    })
    setMetrics(results)
    setRefreshed(true)
    setTimeout(() => setRefreshed(false), 1500)
  }

  useEffect(() => { loadMetrics() }, [])

  const tracked = metrics.filter(m => m.hasEntries)
  const scores = tracked.map(m => m.score)
  const lifePowerScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const sorted = [...metrics].filter(m => m.hasEntries).sort((a, b) => b.score - a.score)
  const top3ids = new Set(sorted.slice(0, 3).map(m => m.source.key))
  const bottom3ids = new Set(sorted.slice(-3).map(m => m.source.key))
  const gaps = metrics.filter(m => !m.hasEntries)
  const powerColor = getColor(lifePowerScore)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Layers className="w-7 h-7 text-violet-400" />
            Life Metrics Hub
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Every dimension of your life, in one view.</p>
        </div>
        <button
          onClick={loadMetrics}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
        >
          <Activity className="w-4 h-4" />
          {refreshed ? 'Refreshed!' : 'Refresh'}
        </button>
      </div>

      {/* Life Power Score */}
      <div className="game-card p-6 text-center border border-violet-500/30">
        <p className="text-slate-400 text-sm mb-2 tracking-widest uppercase">Life Power Score</p>
        <div className="text-7xl font-black mb-2" style={{ color: powerColor, fontFamily: 'Orbitron, monospace' }}>
          {lifePowerScore}
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 mt-3">
          <div
            className="h-3 rounded-full transition-all duration-1000"
            style={{ width: `${lifePowerScore}%`, background: powerColor }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="game-card p-3">
            <div className="text-2xl font-bold text-violet-400">{tracked.length}</div>
            <div className="text-xs text-slate-500">Dimensions Tracked</div>
          </div>
          <div className="game-card p-3">
            <div className="text-2xl font-bold text-slate-400">{SOURCES.length - tracked.length}</div>
            <div className="text-xs text-slate-500">Gaps to Fill</div>
          </div>
        </div>
      </div>

      {/* Score Grid */}
      {tracked.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Dimension Scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.filter(m => m.hasEntries).map(m => {
              const isTop = top3ids.has(m.source.key)
              const isBottom = bottom3ids.has(m.source.key) && !isTop
              const borderClass = isTop ? 'border border-green-500/50' : isBottom ? 'border border-red-500/50' : ''
              return (
                <div key={m.source.key} className={`game-card p-3 ${borderClass}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{m.source.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{m.source.label}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {m.lastDate ? daysAgo(m.lastDate) : '—'}
                      </div>
                    </div>
                    {isTop && <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                    {isBottom && <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${m.score}%`, background: m.source.color }}
                    />
                  </div>
                  <div className="text-right text-xs font-bold" style={{ color: m.source.color }}>
                    {m.score}/100
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top / Bottom */}
      {tracked.length >= 3 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="game-card p-4 border border-green-500/20">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Strongest
            </h3>
            {sorted.slice(0, 3).map(m => (
              <div key={m.source.key} className="flex items-center gap-2 mb-2">
                <span>{m.source.emoji}</span>
                <span className="text-xs text-slate-300 flex-1">{m.source.label}</span>
                <span className="text-xs font-bold text-green-400">{m.score}</span>
              </div>
            ))}
          </div>
          <div className="game-card p-4 border border-red-500/20">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Needs Work
            </h3>
            {sorted.slice(-3).reverse().map(m => (
              <div key={m.source.key} className="flex items-center gap-2 mb-2">
                <span>{m.source.emoji}</span>
                <span className="text-xs text-slate-300 flex-1">{m.source.label}</span>
                <span className="text-xs font-bold text-red-400">{m.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {gaps.length > 0 && (
        <div className="game-card p-4 border border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4" /> Gaps to Fill ({gaps.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {gaps.map(m => (
              <span key={m.source.key} className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-400">
                {m.source.emoji} {m.source.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {tracked.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No data yet. Start logging in other modules to see your Life Power Score.</p>
        </div>
      )}

      {tracked.length === SOURCES.length && (
        <div className="game-card p-4 border border-green-500/30 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-300">All {SOURCES.length} life dimensions tracked — you are operating at full visibility!</p>
        </div>
      )}
    </div>
  )
}
