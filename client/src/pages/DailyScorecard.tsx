import { useEffect, useState } from 'react'
import { Star, TrendingUp, BarChart3, Calendar, Zap, Brain, Heart, Activity } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface DimensionConfig {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

interface Ratings {
  energy: number
  focus: number
  mood: number
  productivity: number
  health: number
  relationships: number
  learning: number
  finances: number
}

interface DaySnapshot {
  date: string
  avg: number
}

const DIMENSIONS: DimensionConfig[] = [
  { key: 'energy',        label: 'Energy',        icon: <Zap className="w-5 h-5" />,       color: '#f59e0b', bgColor: 'bg-amber-500/10'   },
  { key: 'focus',         label: 'Focus',          icon: <Brain className="w-5 h-5" />,      color: '#8b5cf6', bgColor: 'bg-violet-500/10'  },
  { key: 'mood',          label: 'Mood',           icon: <Star className="w-5 h-5" />,       color: '#ec4899', bgColor: 'bg-pink-500/10'    },
  { key: 'productivity',  label: 'Productivity',   icon: <TrendingUp className="w-5 h-5" />, color: '#06b6d4', bgColor: 'bg-cyan-500/10'    },
  { key: 'health',        label: 'Health',         icon: <Activity className="w-5 h-5" />,   color: '#10b981', bgColor: 'bg-emerald-500/10' },
  { key: 'relationships', label: 'Relationships',  icon: <Heart className="w-5 h-5" />,      color: '#f43f5e', bgColor: 'bg-rose-500/10'    },
  { key: 'learning',      label: 'Learning',       icon: <BarChart3 className="w-5 h-5" />,  color: '#3b82f6', bgColor: 'bg-blue-500/10'    },
  { key: 'finances',      label: 'Finances',       icon: <Calendar className="w-5 h-5" />,   color: '#84cc16', bgColor: 'bg-lime-500/10'    },
]

const DEFAULT_RATINGS: Ratings = {
  energy: 5, focus: 5, mood: 5, productivity: 5,
  health: 5, relationships: 5, learning: 5, finances: 5,
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getDateKey(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().split('T')[0]
}

function avg(ratings: Ratings): number {
  const vals = Object.values(ratings)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function scoreColor(score: number): string {
  if (score >= 8) return '#10b981'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number): string {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Fair'
  return 'Needs Work'
}

function loadRatings(date: string): Ratings {
  try {
    const raw = localStorage.getItem(`daily_scorecard_${date}`)
    if (raw) return { ...DEFAULT_RATINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_RATINGS }
}

function loadNotes(date: string): string {
  return localStorage.getItem(`daily_scorecard_notes_${date}`) ?? ''
}

export default function DailyScorecard() {
  const { toastSuccess } = useToast()
  const today = getToday()

  const [ratings, setRatings] = useState<Ratings>(() => loadRatings(today))
  const [notes, setNotes] = useState<string>(() => loadNotes(today))
  const [saved, setSaved] = useState(false)
  const [trendData, setTrendData] = useState<DaySnapshot[]>([])

  // Load 7-day trend
  useEffect(() => {
    const snapshots: DaySnapshot[] = []
    for (let i = 6; i >= 0; i--) {
      const date = getDateKey(i)
      const r = loadRatings(date)
      // Only include if there's saved data (non-default would show, but include today always)
      const hasData = !!localStorage.getItem(`daily_scorecard_${date}`) || date === today
      snapshots.push({ date, avg: hasData ? avg(r) : 0 })
    }
    setTrendData(snapshots)
  }, [saved, today])

  const overallScore = avg(ratings)

  const yesterday = getDateKey(1)
  const yesterdayRatings = loadRatings(yesterday)
  const yesterdayScore = localStorage.getItem(`daily_scorecard_${yesterday}`)
    ? avg(yesterdayRatings)
    : null

  const sevenDayScores = trendData
    .slice(0, 6) // exclude today
    .filter(d => !!localStorage.getItem(`daily_scorecard_${d.date}`))
    .map(d => d.avg)
  const sevenDayAvg = sevenDayScores.length
    ? sevenDayScores.reduce((a, b) => a + b, 0) / sevenDayScores.length
    : null

  function setRating(key: keyof Ratings, value: number) {
    setRatings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    localStorage.setItem(`daily_scorecard_${today}`, JSON.stringify(ratings))
    localStorage.setItem(`daily_scorecard_notes_${today}`, notes)
    setSaved(true)
    // Refresh trend
    const snapshots: DaySnapshot[] = []
    for (let i = 6; i >= 0; i--) {
      const date = getDateKey(i)
      const r = loadRatings(date)
      const hasData = !!localStorage.getItem(`daily_scorecard_${date}`) || date === today
      snapshots.push({ date, avg: hasData ? avg(r) : 0 })
    }
    setTrendData(snapshots)
    toastSuccess('Scorecard saved!', `Overall score: ${overallScore.toFixed(1)}/10`)
  }

  const color = scoreColor(overallScore)
  const label = scoreLabel(overallScore)

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <BarChart3 className="w-7 h-7 text-violet-400" />
            Daily Scorecard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Overall score badge */}
        <div className="game-card px-6 py-3 text-center" style={{ borderColor: `${color}40` }}>
          <div
            className="text-4xl font-bold"
            style={{ fontFamily: 'Orbitron, monospace', color }}
          >
            {overallScore.toFixed(1)}
          </div>
          <div className="text-xs mt-0.5" style={{ color }}>
            {label}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Overall / 10</div>
        </div>
      </div>

      {/* Comparison row */}
      {(yesterdayScore !== null || sevenDayAvg !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {yesterdayScore !== null && (
            <div className="game-card p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Yesterday</div>
              <div
                className="text-xl font-bold"
                style={{ fontFamily: 'Orbitron, monospace', color: scoreColor(yesterdayScore) }}
              >
                {yesterdayScore.toFixed(1)}
              </div>
              <div className="text-xs mt-1" style={{ color: overallScore >= yesterdayScore ? '#10b981' : '#ef4444' }}>
                {overallScore >= yesterdayScore ? '+' : ''}{(overallScore - yesterdayScore).toFixed(1)} vs today
              </div>
            </div>
          )}
          {sevenDayAvg !== null && (
            <div className="game-card p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">7-Day Average</div>
              <div
                className="text-xl font-bold"
                style={{ fontFamily: 'Orbitron, monospace', color: scoreColor(sevenDayAvg) }}
              >
                {sevenDayAvg.toFixed(1)}
              </div>
              <div className="text-xs mt-1" style={{ color: overallScore >= sevenDayAvg ? '#10b981' : '#ef4444' }}>
                {overallScore >= sevenDayAvg ? '+' : ''}{(overallScore - sevenDayAvg).toFixed(1)} vs today
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7-day trend chart */}
      <div className="game-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">7-Day Trend</span>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {trendData.map((snap, i) => {
            const isToday = snap.date === today
            const height = snap.avg > 0 ? Math.max(8, (snap.avg / 10) * 100) : 4
            const barColor = snap.avg > 0 ? scoreColor(snap.avg) : '#1e293b'
            return (
              <div key={snap.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: 56 }}>
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${height}%`,
                      background: barColor,
                      opacity: snap.avg > 0 ? 1 : 0.3,
                      outline: isToday ? `2px solid ${barColor}` : 'none',
                      outlineOffset: '1px',
                    }}
                    title={snap.avg > 0 ? `${snap.avg.toFixed(1)}` : 'No data'}
                  />
                </div>
                <div className={`text-[9px] ${isToday ? 'text-violet-400 font-bold' : 'text-slate-600'}`}>
                  {isToday ? 'Today' : dayLabels[(new Date(snap.date + 'T12:00:00').getDay() + 6) % 7]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dimension sliders */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DIMENSIONS.map(dim => {
          const value = ratings[dim.key as keyof Ratings]
          const barColor = scoreColor(value)
          return (
            <div key={dim.key} className={`game-card p-4 ${dim.bgColor}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2" style={{ color: dim.color }}>
                  {dim.icon}
                  <span className="text-sm font-semibold text-slate-200">{dim.label}</span>
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: 'Orbitron, monospace', color: barColor }}
                >
                  {value}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={e => setRating(dim.key as keyof Ratings, Number(e.target.value))}
                className="w-full"
                style={{ accentColor: dim.color }}
              />

              {/* Pip track */}
              <div className="flex justify-between mt-1 px-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: i < value ? barColor : '#334155',
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-between text-[10px] text-slate-700 mt-1">
                <span>1</span><span>5</span><span>10</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Notes */}
      <div className="game-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">Day Notes</span>
        </div>
        <textarea
          rows={3}
          placeholder="How did today go? Any wins, struggles, or reflections…"
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          className="game-input w-full resize-none"
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all"
        style={{
          background: saved
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
        }}
      >
        {saved ? '✓ Saved' : 'Save Scorecard'}
      </button>
    </div>
  )
}
