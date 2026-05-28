import { useState, useEffect } from 'react'
import { BarChart3, ChevronLeft, ChevronRight, Save, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MonthlyReview {
  month: string
  wins: string
  losses: string
  keyLessons: string
  metrics: {
    health: number
    productivity: number
    learning: number
    relationships: number
    finance: number
    mindset: number
    happiness: number
  }
  nextMonthFocus: string
  gratitudes: string
  rating: number
  savedAt: string
}

const METRIC_CONFIG = [
  { key: 'health', label: 'Health & Fitness', emoji: '💪', color: '#22c55e' },
  { key: 'productivity', label: 'Productivity', emoji: '⚡', color: '#3b82f6' },
  { key: 'learning', label: 'Learning & Growth', emoji: '📚', color: '#f59e0b' },
  { key: 'relationships', label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  { key: 'finance', label: 'Finance', emoji: '💰', color: '#10b981' },
  { key: 'mindset', label: 'Mindset & Mental', emoji: '🧠', color: '#a855f7' },
  { key: 'happiness', label: 'Overall Happiness', emoji: '😊', color: '#f97316' },
] as const

type MetricKey = typeof METRIC_CONFIG[number]['key']

const STORAGE_KEY = 'performance_reviews'

const emptyReview = (month: string): MonthlyReview => ({
  month,
  wins: '',
  losses: '',
  keyLessons: '',
  metrics: { health: 5, productivity: 5, learning: 5, relationships: 5, finance: 5, mindset: 5, happiness: 5 },
  nextMonthFocus: '',
  gratitudes: '',
  rating: 0,
  savedAt: '',
})

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(m: string): string {
  const [year, month] = m.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function shiftMonth(m: string, offset: number): string {
  const [year, month] = m.split('-').map(Number)
  const d = new Date(year, month - 1 + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function PerformanceReview() {
  const { toastSuccess } = useToast()
  const [month, setMonth] = useState(getCurrentMonth())
  const [allReviews, setAllReviews] = useState<MonthlyReview[]>([])
  const [data, setData] = useState<MonthlyReview>(emptyReview(month))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const reviews: MonthlyReview[] = saved ? JSON.parse(saved) : []
      setAllReviews(reviews)
      const existing = reviews.find(r => r.month === month)
      setData(existing || emptyReview(month))
      setSaved(!!existing)
    } catch { /**/ }
  }, [month])

  const saveReview = () => {
    const updated = { ...data, month, savedAt: new Date().toISOString() }
    setData(updated)
    const newAll = allReviews.filter(r => r.month !== month)
    const updatedAll = [updated, ...newAll].sort((a, b) => b.month.localeCompare(a.month))
    setAllReviews(updatedAll)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll))
    setSaved(true)
    toastSuccess('Monthly review saved! 📊')
  }

  const isCurrentMonth = month === getCurrentMonth()
  const avgScore = Math.round(Object.values(data.metrics).reduce((s, v) => s + v, 0) / 7)
  const grade = avgScore >= 9 ? 'S' : avgScore >= 8 ? 'A' : avgScore >= 6 ? 'B' : avgScore >= 4 ? 'C' : 'D'
  const gradeColor = { S: '#a855f7', A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' }[grade]

  // Compare to prev month
  const prevMonthReview = allReviews.find(r => r.month === shiftMonth(month, -1))
  const prevAvg = prevMonthReview ? Math.round(Object.values(prevMonthReview.metrics).reduce((s, v) => s + v, 0) / 7) : null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-green-400" />
            Monthly Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Measure, reflect, and level up each month</p>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(shiftMonth(month, -1))} className="p-2 text-slate-500 hover:text-slate-300"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <div className="font-bold text-white text-lg">{formatMonth(month)}</div>
          {saved && <div className="text-xs text-green-400">✓ Reviewed</div>}
        </div>
        <button onClick={() => setMonth(shiftMonth(month, 1))} disabled={isCurrentMonth} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Score card */}
      <div className="game-card p-5 flex items-center gap-5">
        <div className="text-center">
          <div className="text-5xl font-bold" style={{ color: gradeColor, fontFamily: 'Orbitron, monospace' }}>{grade}</div>
          <div className="text-xs text-slate-500 mt-1">Grade</div>
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-white">{avgScore}/10</div>
          <div className="text-xs text-slate-400 mb-2">Average score across all areas</div>
          {prevAvg !== null && (
            <div className="flex items-center gap-1 text-xs">
              {avgScore > prevAvg ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
              <span className={avgScore > prevAvg ? 'text-green-400' : 'text-red-400'}>
                {avgScore > prevAvg ? '+' : ''}{avgScore - prevAvg} vs last month
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(r => (
            <button key={r} onClick={() => setData(d => ({ ...d, rating: r }))}>
              <Star className={`w-5 h-5 ${r <= data.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="game-card p-5 space-y-3">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Life Area Scores</h3>
        {METRIC_CONFIG.map(({ key, label, emoji, color }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-lg w-6 flex-shrink-0">{emoji}</span>
            <div className="text-xs text-slate-400 w-28 flex-shrink-0">{label}</div>
            <div className="flex-1">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(data.metrics[key] / 10) * 100}%`, background: color }} />
              </div>
            </div>
            <input type="range" min="1" max="10" value={data.metrics[key]}
              onChange={e => setData(d => ({ ...d, metrics: { ...d.metrics, [key]: +e.target.value } }))}
              className="w-20 flex-shrink-0" style={{ accentColor: color }} />
            <span className="text-xs font-bold w-6 text-right flex-shrink-0" style={{ color }}>{data.metrics[key]}</span>
          </div>
        ))}
      </div>

      {/* Wins / Losses */}
      <div className="grid grid-cols-2 gap-4">
        <div className="game-card p-4">
          <h3 className="font-semibold text-green-400 text-sm mb-2">🏆 Wins</h3>
          <textarea value={data.wins} onChange={e => setData(d => ({ ...d, wins: e.target.value }))}
            placeholder="What went well? Achievements, breakthroughs, completions..."
            className="game-input w-full h-28 resize-none text-sm" />
        </div>
        <div className="game-card p-4">
          <h3 className="font-semibold text-red-400 text-sm mb-2">⚠️ Areas to Improve</h3>
          <textarea value={data.losses} onChange={e => setData(d => ({ ...d, losses: e.target.value }))}
            placeholder="What didn't go well? Missed goals, bad habits, challenges..."
            className="game-input w-full h-28 resize-none text-sm" />
        </div>
      </div>

      {/* Lessons */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 text-sm mb-2">💡 Key Lessons</h3>
        <textarea value={data.keyLessons} onChange={e => setData(d => ({ ...d, keyLessons: e.target.value }))}
          placeholder="What did you learn this month? Insights about yourself, work, life..."
          className="game-input w-full h-24 resize-none" />
      </div>

      {/* Next month focus */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 text-sm mb-2">🎯 Next Month Focus</h3>
        <textarea value={data.nextMonthFocus} onChange={e => setData(d => ({ ...d, nextMonthFocus: e.target.value }))}
          placeholder="Top 3 priorities and intentions for next month..."
          className="game-input w-full h-20 resize-none" />
      </div>

      {/* Gratitudes */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-yellow-400 text-sm mb-2">✨ Monthly Gratitudes</h3>
        <textarea value={data.gratitudes} onChange={e => setData(d => ({ ...d, gratitudes: e.target.value }))}
          placeholder="What are you most grateful for this month?"
          className="game-input w-full h-16 resize-none" />
      </div>

      {/* Save */}
      <button onClick={saveReview} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
        <Save className="w-4 h-4" />
        {saved ? 'Update Review' : 'Save Monthly Review'}
      </button>

      {/* History */}
      {allReviews.length > 1 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Review History</h3>
          <div className="space-y-2">
            {allReviews.filter(r => r.month !== month).slice(0, 6).map(r => {
              const avg = Math.round(Object.values(r.metrics).reduce((s, v) => s + v, 0) / 7)
              const g = avg >= 9 ? 'S' : avg >= 8 ? 'A' : avg >= 6 ? 'B' : avg >= 4 ? 'C' : 'D'
              const gc = { S: '#a855f7', A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' }[g]
              return (
                <button key={r.month} onClick={() => setMonth(r.month)}
                  className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors text-left">
                  <span className="font-bold text-sm w-6" style={{ color: gc }}>{g}</span>
                  <span className="flex-1 text-sm text-slate-400">{formatMonth(r.month)}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(r.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <span className="text-xs text-slate-600">{avg}/10</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
