import { useEffect, useState } from 'react'
import { Star, ChevronLeft, ChevronRight, Save, CheckSquare } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface WeeklyReviewData {
  weekStart: string
  highlights: string
  challenges: string
  lessons: string
  gratitude: string
  nextWeekGoals: string
  ratings: Record<string, number>
  mood: number
  productivity: number
  energy: number
}

const LIFE_AREAS = [
  { key: 'work', label: 'Work & Career', emoji: '💼' },
  { key: 'health', label: 'Health & Fitness', emoji: '💪' },
  { key: 'relationships', label: 'Relationships', emoji: '❤️' },
  { key: 'learning', label: 'Learning & Growth', emoji: '📚' },
  { key: 'mindset', label: 'Mindset & Wellbeing', emoji: '🧠' },
  { key: 'finance', label: 'Finance', emoji: '💰' },
  { key: 'fun', label: 'Fun & Recreation', emoji: '🎮' },
]

const REVIEW_QUESTIONS = [
  { key: 'highlights', label: 'Top Wins & Highlights', placeholder: 'What went well this week? Celebrate the wins, big and small...', rows: 4 },
  { key: 'challenges', label: 'Challenges & Struggles', placeholder: 'What was hard? What blocked you? What did you procrastinate on?', rows: 3 },
  { key: 'lessons', label: 'Key Lessons Learned', placeholder: 'What did you learn? What would you do differently?', rows: 3 },
  { key: 'gratitude', label: '3 Things I\'m Grateful For', placeholder: '1.\n2.\n3.', rows: 3 },
  { key: 'nextWeekGoals', label: 'Top 3 Goals for Next Week', placeholder: '1. The most important thing...\n2.\n3.', rows: 3 },
]

const STORAGE_KEY = 'weekly_review_v2'

const getMondayStr = (offset = 0) => {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff + offset * 7)
  return d.toISOString().split('T')[0]
}

const defaultData = (weekStart: string): WeeklyReviewData => ({
  weekStart,
  highlights: '',
  challenges: '',
  lessons: '',
  gratitude: '',
  nextWeekGoals: '',
  ratings: Object.fromEntries(LIFE_AREAS.map(a => [a.key, 5])),
  mood: 7,
  productivity: 7,
  energy: 7,
})

export default function WeeklyReview() {
  const { toastSuccess } = useToast()
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekStart, setWeekStart] = useState(getMondayStr())
  const [data, setData] = useState<WeeklyReviewData>(defaultData(getMondayStr()))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const ws = getMondayStr(weekOffset)
    setWeekStart(ws)
    const stored = localStorage.getItem(`${STORAGE_KEY}_${ws}`)
    if (stored) {
      setData(JSON.parse(stored))
      setSaved(true)
    } else {
      setData(defaultData(ws))
      setSaved(false)
    }
  }, [weekOffset])

  const update = (field: keyof WeeklyReviewData, value: string | number | Record<string, number>) => {
    setData(d => ({ ...d, [field]: value }))
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem(`${STORAGE_KEY}_${weekStart}`, JSON.stringify(data))
    setSaved(true)
    toastSuccess('Weekly review saved!')
  }

  const overallScore = Math.round(
    (Object.values(data.ratings).reduce((s, r) => s + r, 0) / LIFE_AREAS.length +
    data.mood + data.productivity + data.energy) / 4
  )

  const scoreGrade = overallScore >= 9 ? 'S' : overallScore >= 8 ? 'A' : overallScore >= 7 ? 'B' : overallScore >= 6 ? 'C' : overallScore >= 5 ? 'D' : 'F'
  const scoreColor = overallScore >= 8 ? '#22c55e' : overallScore >= 6 ? '#eab308' : '#ef4444'

  const weekEnd = new Date(weekStart + 'T12:00:00')
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekLabel = `${weekStart} → ${weekEnd.toISOString().split('T')[0]}`
  const isCurrentWeek = weekOffset === 0
  const isPastWeek = weekOffset < 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Weekly Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Reflect, rate, and plan for next week</p>
        </div>
        <button onClick={save}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-green-900/20 text-green-400 border border-green-500/30' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>
          {saved ? <CheckSquare className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Review'}
        </button>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-sm font-medium text-white">{isCurrentWeek ? 'Current Week' : isPastWeek ? `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago` : 'Future'}</div>
          <div className="text-xs text-slate-500">{weekLabel}</div>
        </div>
        <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} className="p-2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Overall score */}
      <div className="game-card p-5 flex items-center gap-5">
        <div className="text-5xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: scoreColor }}>{scoreGrade}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white mb-1">Week Score: {overallScore.toFixed(1)}/10</div>
          <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(overallScore / 10) * 100}%`, background: scoreColor }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[['Mood', 'mood'], ['Productivity', 'productivity'], ['Energy', 'energy']].map(([label, key]) => (
              <div key={key}>
                <div className="text-xs text-slate-500 mb-1">{label}: {data[key as 'mood' | 'productivity' | 'energy']}/10</div>
                <input type="range" min="1" max="10" value={data[key as 'mood' | 'productivity' | 'energy']}
                  onChange={e => update(key as 'mood' | 'productivity' | 'energy', +e.target.value)}
                  className="w-full accent-yellow-400 h-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Life area ratings */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Rate Each Life Area</h3>
        {LIFE_AREAS.map(area => (
          <div key={area.key} className="flex items-center gap-3">
            <span className="text-lg w-6">{area.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{area.label}</span>
                <span className="text-white font-semibold">{data.ratings[area.key]}/10</span>
              </div>
              <input type="range" min="1" max="10" value={data.ratings[area.key]}
                onChange={e => update('ratings', { ...data.ratings, [area.key]: +e.target.value })}
                className="w-full accent-yellow-400 h-1.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Review questions */}
      {REVIEW_QUESTIONS.map(q => (
        <div key={q.key} className="game-card p-4 space-y-2">
          <label className="text-sm font-semibold text-slate-300">{q.label}</label>
          <textarea
            value={data[q.key as keyof WeeklyReviewData] as string}
            onChange={e => update(q.key as keyof WeeklyReviewData, e.target.value)}
            placeholder={q.placeholder}
            rows={q.rows}
            className="game-input w-full resize-none text-sm"
          />
        </div>
      ))}

      <button onClick={save}
        className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors">
        {saved ? '✅ Saved!' : 'Save Weekly Review'}
      </button>
    </div>
  )
}
