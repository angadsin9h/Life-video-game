import { useState, useEffect } from 'react'
import { Star, TrendingUp, TrendingDown, Minus, Trophy, Calendar, BarChart3, CheckCircle2, Plus } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface DimensionScore {
  name: string
  emoji: string
  score: number
}

interface RatingEntry {
  id: string
  date: string
  dimensions: DimensionScore[]
  overallRating: number
}

const DIMENSIONS: Omit<DimensionScore, 'score'>[] = [
  { name: 'Happiness', emoji: '😊' },
  { name: 'Health', emoji: '💪' },
  { name: 'Love/Relationships', emoji: '❤️' },
  { name: 'Purpose/Meaning', emoji: '🧭' },
  { name: 'Growth/Learning', emoji: '🌱' },
  { name: 'Financial Security', emoji: '💰' },
  { name: 'Energy/Vitality', emoji: '⚡' },
  { name: 'Peace/Calm', emoji: '🕊️' },
  { name: 'Contribution/Impact', emoji: '🌍' },
  { name: 'Excitement/Joy', emoji: '✨' },
]

const STORAGE_KEY = 'life_rating_log'

function defaultDimensions(): DimensionScore[] {
  return DIMENSIONS.map(d => ({ ...d, score: 5 }))
}

function calcOverall(dims: DimensionScore[]): number {
  return Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length * 10)
}

function ratingColor(r: number): string {
  if (r >= 85) return 'text-green-400'
  if (r >= 75) return 'text-green-500'
  if (r >= 60) return 'text-yellow-400'
  if (r >= 40) return 'text-amber-500'
  return 'text-red-400'
}

function ratingGrade(r: number): string {
  if (r >= 93) return 'A+'
  if (r >= 85) return 'A'
  if (r >= 75) return 'B'
  if (r >= 60) return 'C'
  if (r >= 40) return 'D'
  return 'F'
}

function barColor(score: number): string {
  if (score >= 9) return 'bg-green-400'
  if (score >= 7) return 'bg-green-500'
  if (score >= 5) return 'bg-blue-400'
  if (score >= 3) return 'bg-amber-500'
  return 'bg-red-500'
}

function loadEntries(): RatingEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

export default function LifeRating() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<RatingEntry[]>(loadEntries)
  const [dims, setDims] = useState<DimensionScore[]>(defaultDimensions)
  const [showForm, setShowForm] = useState(false)

  const overall = calcOverall(dims)

  const handleSave = () => {
    const entry: RatingEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      dimensions: dims,
      overallRating: overall,
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
    setShowForm(false)
    setDims(defaultDimensions())
    toastSuccess('Life rating saved!', `Overall: ${overall}/100 (${ratingGrade(overall)})`)
  }

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = today.slice(0, 7)

  const last7 = entries.filter(e => {
    const d = new Date(today)
    d.setDate(d.getDate() - 6)
    return e.date >= d.toISOString().split('T')[0]
  })

  const avgThisWeek = last7.length > 0
    ? Math.round(last7.reduce((s, e) => s + e.overallRating, 0) / last7.length)
    : null

  const thisMonthEntries = entries.filter(e => e.date.startsWith(thisMonth))
  const avgThisMonth = thisMonthEntries.length > 0
    ? Math.round(thisMonthEntries.reduce((s, e) => s + e.overallRating, 0) / thisMonthEntries.length)
    : null

  const bestEntry = entries.length > 0
    ? entries.reduce((best, e) => e.overallRating > best.overallRating ? e : best, entries[0])
    : null

  // Yesterday comparison
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayEntry = entries.find(e => e.date === yesterdayStr)
  const todayEntry = entries.find(e => e.date === today)

  // SVG chart for last 30 days
  const last30 = entries.slice(0, 30).reverse()
  const chartW = 400
  const chartH = 80
  const points = last30.map((e, i) => {
    const x = last30.length > 1 ? (i / (last30.length - 1)) * chartW : chartW / 2
    const y = chartH - (e.overallRating / 100) * chartH
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-violet-300 flex items-center gap-2">
              <Star className="w-6 h-6" /> Life Rating
            </h1>
            <p className="text-slate-400 text-sm mt-1">Rate your life across 10 dimensions</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Rate Today
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="game-card text-center">
            <div className="text-lg font-bold text-amber-300">{bestEntry?.overallRating ?? '—'}</div>
            <div className="text-xs text-slate-400">Best Day</div>
          </div>
          <div className="game-card text-center">
            <div className="text-lg font-bold text-blue-300">{avgThisWeek ?? '—'}</div>
            <div className="text-xs text-slate-400">This Week</div>
          </div>
          <div className="game-card text-center">
            <div className="text-lg font-bold text-green-300">{avgThisMonth ?? '—'}</div>
            <div className="text-xs text-slate-400">This Month</div>
          </div>
          <div className="game-card text-center">
            <div className="text-lg font-bold text-violet-300">{entries.length}</div>
            <div className="text-xs text-slate-400">Days Rated</div>
          </div>
        </div>

        {/* Latest rating big display */}
        {todayEntry && (
          <div className="game-card flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-1">Today's Life Score</div>
              <div className={`text-5xl font-black ${ratingColor(todayEntry.overallRating)}`}>
                {todayEntry.overallRating}
              </div>
              <div className="text-lg font-bold text-slate-300 mt-1">
                Grade: <span className={ratingColor(todayEntry.overallRating)}>{ratingGrade(todayEntry.overallRating)}</span>
              </div>
            </div>
            <div className="text-right">
              <Trophy className={`w-12 h-12 ${ratingColor(todayEntry.overallRating)}`} />
              <div className="text-xs text-slate-500 mt-1">{todayEntry.date}</div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="game-card space-y-5">
            <h2 className="font-bold text-violet-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Rate Your Life Today
            </h2>

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-300">Overall Life Rating</span>
              <div className="text-right">
                <span className={`text-3xl font-black ${ratingColor(overall)}`}>{overall}</span>
                <span className="text-slate-400 text-sm">/100</span>
                <div className={`text-sm font-bold ${ratingColor(overall)}`}>{ratingGrade(overall)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dims.map((d, i) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300 flex items-center gap-1">
                      <span>{d.emoji}</span> {d.name}
                    </label>
                    <span className={`text-sm font-bold ${barColor(d.score).replace('bg-', 'text-')}`}>{d.score}/10</span>
                  </div>
                  <input
                    type="range" min={1} max={10} step={1}
                    className="w-full accent-violet-500"
                    value={d.score}
                    onChange={e => {
                      const next = [...dims]
                      next[i] = { ...next[i], score: Number(e.target.value) }
                      setDims(next)
                    }}
                  />
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor(d.score)}`}
                      style={{ width: `${d.score * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors">
                Save Life Rating
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Yesterday comparison */}
        {yesterdayEntry && todayEntry && (
          <div className="game-card">
            <h2 className="font-bold text-violet-300 flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" /> Today vs Yesterday
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {todayEntry.dimensions.map((d, i) => {
                const prev = yesterdayEntry.dimensions[i]?.score ?? d.score
                const diff = d.score - prev
                return (
                  <div key={d.name} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                    <span className="text-sm text-slate-300 flex items-center gap-1">
                      <span>{d.emoji}</span> {d.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{d.score}</span>
                      {diff > 0 && <TrendingUp className="w-4 h-4 text-green-400" />}
                      {diff < 0 && <TrendingDown className="w-4 h-4 text-red-400" />}
                      {diff === 0 && <Minus className="w-4 h-4 text-slate-500" />}
                      <span className={`text-xs font-semibold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 10 dimension bars for latest entry */}
        {(todayEntry ?? entries[0]) && (() => {
          const latest = todayEntry ?? entries[0]
          return (
            <div className="game-card">
              <h2 className="font-bold text-violet-300 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4" /> Dimension Breakdown
                <span className="text-xs text-slate-500 font-normal">{latest.date}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {latest.dimensions.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300 flex items-center gap-1">
                        <span>{d.emoji}</span> {d.name}
                      </span>
                      <span className="text-sm font-bold text-slate-200">{d.score}/10</span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(d.score)}`}
                        style={{ width: `${d.score * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* History chart */}
        {last30.length > 1 && (
          <div className="game-card">
            <h2 className="font-bold text-violet-300 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4" /> Last 30 Days
            </h2>
            <div className="relative overflow-x-auto">
              <svg viewBox={`0 0 ${chartW} ${chartH + 10}`} className="w-full" style={{ minWidth: '200px' }}>
                {/* Grid lines */}
                {[25, 50, 75, 100].map(v => (
                  <line
                    key={v}
                    x1={0} y1={chartH - (v / 100) * chartH}
                    x2={chartW} y2={chartH - (v / 100) * chartH}
                    stroke="rgba(100,116,139,0.2)" strokeWidth="1"
                  />
                ))}
                {/* Area fill */}
                {last30.length > 1 && (
                  <polygon
                    points={`0,${chartH} ${points} ${chartW},${chartH}`}
                    fill="rgba(139,92,246,0.15)"
                  />
                )}
                {/* Line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke="rgb(139,92,246)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Dots */}
                {last30.map((e, i) => {
                  const x = last30.length > 1 ? (i / (last30.length - 1)) * chartW : chartW / 2
                  const y = chartH - (e.overallRating / 100) * chartH
                  return (
                    <circle key={e.id} cx={x} cy={y} r="3" fill="rgb(139,92,246)" />
                  )
                })}
              </svg>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{last30[0]?.date.slice(5)}</span>
                <span>{last30[last30.length - 1]?.date.slice(5)}</span>
              </div>
            </div>
          </div>
        )}

        {entries.length === 0 && !showForm && (
          <div className="game-card text-center py-12 text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Rate your life for the first time to start tracking!</p>
          </div>
        )}

      </div>
    </div>
  )
}
