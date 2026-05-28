import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, CheckCircle2, Circle, Plus, Trash2, Trophy, ArrowLeft, ArrowRight, Flag } from 'lucide-react'

interface WeeklyGoal {
  id: number
  week_start: string
  position: number
  text: string
  category: string
  completed: number
}

interface HistoryWeek {
  weekStart: string
  goals: WeeklyGoal[]
}

const CAT_COLORS: Record<string, string> = {
  health: 'text-green-400 border-green-500/30 bg-green-900/10',
  mind:   'text-cyan-400 border-cyan-500/30 bg-cyan-900/10',
  work:   'text-violet-400 border-violet-500/30 bg-violet-900/10',
  social: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10',
  growth: 'text-orange-400 border-orange-500/30 bg-orange-900/10',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']

function getMonday(date = new Date()): string {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function addWeeks(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n * 7)
  return d.toISOString().split('T')[0]
}

function fmtWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const fmt = (date: Date) => date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  return `${fmt(d)} – ${fmt(end)}`
}

const BIG3_PROMPTS = [
  "What is the single most important thing I must accomplish this week?",
  "What will make this week feel like a win?",
  "What bold move could I make this week?",
]

export default function WeeklyGoals() {
  const thisWeek = getMonday()
  const [weekStart, setWeekStart] = useState(thisWeek)
  const [goals, setGoals] = useState<WeeklyGoal[]>([])
  const [history, setHistory] = useState<HistoryWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [newCat, setNewCat] = useState('work')
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)

  const load = async (ws: string) => {
    const [goalsRes, histRes] = await Promise.all([
      axios.get<WeeklyGoal[]>(`/api/weekly-goals/${ws}`),
      axios.get<HistoryWeek[]>('/api/weekly-goals/history/recent'),
    ])
    setGoals(goalsRes.data)
    setHistory(histRes.data)
  }

  useEffect(() => {
    load(weekStart).catch(console.error).finally(() => setLoading(false))
  }, [weekStart])

  const addGoal = async () => {
    if (!newText.trim() || goals.length >= 3) return
    setAdding(true)
    try {
      const res = await axios.post<WeeklyGoal>('/api/weekly-goals', {
        week_start: weekStart,
        text: newText.trim(),
        category: newCat,
        position: goals.length,
      })
      setGoals(prev => [...prev, res.data])
      setNewText('')
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Error')
    } finally { setAdding(false) }
  }

  const toggle = async (id: number) => {
    setToggling(id)
    try {
      const res = await axios.patch<WeeklyGoal>(`/api/weekly-goals/${id}/complete`)
      setGoals(prev => prev.map(g => g.id === id ? res.data : g))
    } finally { setToggling(null) }
  }

  const remove = async (id: number) => {
    await axios.delete(`/api/weekly-goals/${id}`)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const isCurrentWeek = weekStart === thisWeek
  const completedCount = goals.filter(g => g.completed).length
  const allDone = goals.length > 0 && completedCount === goals.length
  const pct = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Flag className="w-8 h-8 text-violet-400" />
          Weekly Big 3
        </h1>
        <p className="text-slate-400 mt-1">Three goals that define a successful week</p>
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setWeekStart(addWeeks(weekStart, -1))}
          className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <div className={`text-sm font-semibold ${isCurrentWeek ? 'text-violet-400' : 'text-slate-300'}`}>
            {isCurrentWeek ? 'This Week' : fmtWeek(weekStart)}
          </div>
          {isCurrentWeek && <div className="text-xs text-slate-600">{fmtWeek(weekStart)}</div>}
        </div>
        <button
          onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          disabled={isCurrentWeek}
          className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress ring */}
      {goals.length > 0 && (
        <div className="game-card p-5 flex items-center gap-5">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={allDone ? '#22c55e' : '#8b5cf6'}
                strokeWidth="3"
                strokeDasharray={`${pct * 0.94} 94`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {completedCount}/{goals.length}
            </div>
          </div>
          <div>
            <div className={`font-semibold ${allDone ? 'text-green-400' : 'text-slate-200'}`}>
              {allDone ? '🏆 Week conquered!' : `${goals.length - completedCount} goal${goals.length - completedCount !== 1 ? 's' : ''} left`}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {allDone ? 'Exceptional discipline this week.' : 'Stay focused — these are your top priorities.'}
            </div>
          </div>
        </div>
      )}

      {/* Goals */}
      <div className="space-y-3">
        {goals.map((goal, idx) => (
          <div
            key={goal.id}
            className={`game-card p-4 flex items-center gap-3 border transition-all ${
              goal.completed ? `opacity-60 ${CAT_COLORS[goal.category]}` : CAT_COLORS[goal.category]
            }`}
          >
            <div className="text-slate-500 font-bold w-5 text-center">{idx + 1}</div>
            <button
              onClick={() => toggle(goal.id)}
              disabled={toggling === goal.id}
              className="flex-shrink-0"
            >
              {goal.completed
                ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                : <Circle className="w-6 h-6 text-slate-500 hover:text-violet-400 transition-colors" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${goal.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {goal.text}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">{CAT_ICONS[goal.category]} {goal.category}</div>
            </div>
            {isCurrentWeek && (
              <button
                onClick={() => remove(goal.id)}
                className="text-slate-700 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add goal */}
        {isCurrentWeek && goals.length < 3 && (
          <div className="game-card p-4">
            <div className="text-xs text-slate-600 mb-2">
              Goal #{goals.length + 1}: {BIG3_PROMPTS[goals.length]}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGoal()}
                placeholder="Write a clear, outcome-focused goal…"
                maxLength={150}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-2">
                <select
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  className="game-input flex-1 text-sm"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
                <button
                  onClick={addGoal}
                  disabled={adding || !newText.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 && isCurrentWeek && (
          <div className="text-center py-6 text-slate-600">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Set your 3 most important goals for this week</p>
          </div>
        )}

        {goals.length === 0 && !isCurrentWeek && (
          <div className="text-center py-6 text-slate-600">
            <p className="text-sm">No goals set for this week.</p>
          </div>
        )}
      </div>

      {/* History */}
      {history.filter(h => h.weekStart !== weekStart).length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Recent Weeks
          </h3>
          <div className="space-y-3">
            {history.filter(h => h.weekStart !== weekStart).map(week => {
              const done = week.goals.filter(g => g.completed).length
              const total = week.goals.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <button
                  key={week.weekStart}
                  onClick={() => setWeekStart(week.weekStart)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-left"
                >
                  <div className={`text-xs font-bold w-10 text-center ${pct === 100 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-slate-500'}`}>
                    {pct}%
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400">{fmtWeek(week.weekStart)}</div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {week.goals.slice(0, 2).map(g => g.text).join(' · ')}
                      {week.goals.length > 2 ? '…' : ''}
                    </div>
                  </div>
                  <div className={`text-xs ${done === total ? 'text-green-400' : 'text-slate-500'}`}>
                    {done}/{total}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
