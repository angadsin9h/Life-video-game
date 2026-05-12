import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, CheckCircle2, Circle, Trash2, Plus, Flame, Sun } from 'lucide-react'

interface Intention {
  id: number
  date: string
  text: string
  completed: number
  position: number
}

interface WeekDay {
  date: string
  total: number
  done: number
}

const MORNING_PROMPTS = [
  "What is the ONE thing I must do today?",
  "What would make today feel meaningful?",
  "What habit am I most committed to today?",
  "What fear do I want to push through today?",
  "How do I want to feel at the end of today?",
  "Who can I positively impact today?",
  "What energy am I bringing to today?",
]

const INTENTION_STARTERS = [
  "I will…", "I commit to…", "Today I focus on…",
  "I choose to…", "I am going to…",
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function seedPick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

export default function Intentions() {
  const today = todayStr()
  const [intentions, setIntentions] = useState<Intention[]>([])
  const [weekHistory, setWeekHistory] = useState<WeekDay[]>([])
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const prompt = seedPick(MORNING_PROMPTS, dayOfYear)
  const starter = seedPick(INTENTION_STARTERS, dayOfYear + 1)

  useEffect(() => {
    Promise.all([
      axios.get<Intention[]>(`/api/intentions/${today}`),
      axios.get<WeekDay[]>('/api/intentions/history/week'),
    ]).then(([iRes, wRes]) => {
      setIntentions(iRes.data)
      setWeekHistory(wRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const addIntention = async () => {
    if (!newText.trim() || intentions.length >= 3) return
    setAdding(true)
    try {
      const res = await axios.post<Intention>('/api/intentions', {
        date: today,
        text: newText.trim(),
        position: intentions.length,
      })
      setIntentions(prev => [...prev, res.data])
      setNewText('')
    } catch (err: any) {
      if (err.response?.data?.error) alert(err.response.data.error)
    } finally {
      setAdding(false)
    }
  }

  const toggle = async (id: number) => {
    setToggling(id)
    try {
      const res = await axios.patch<Intention>(`/api/intentions/${id}/complete`)
      setIntentions(prev => prev.map(i => i.id === id ? res.data : i))
    } finally {
      setToggling(null)
    }
  }

  const remove = async (id: number) => {
    await axios.delete(`/api/intentions/${id}`)
    setIntentions(prev => prev.filter(i => i.id !== id))
  }

  const completedCount = intentions.filter(i => i.completed).length
  const allDone = intentions.length > 0 && completedCount === intentions.length

  // Build 7-day grid including today
  const last7: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7.push(d.toISOString().split('T')[0])
  }
  const weekMap = Object.fromEntries(weekHistory.map(w => [w.date, w]))

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Sun className="w-8 h-8 text-yellow-400" />
          Daily Intentions
        </h1>
        <p className="text-slate-400 mt-1">Set up to 3 intentions to guide your day</p>
      </div>

      {/* Morning prompt */}
      <div className="game-card p-5 border border-yellow-500/20 bg-yellow-900/5">
        <div className="text-xs text-yellow-500 uppercase tracking-widest mb-2 font-semibold">Morning Reflection</div>
        <p className="text-slate-200 italic text-lg leading-relaxed">"{prompt}"</p>
      </div>

      {/* Completion ring */}
      {intentions.length > 0 && (
        <div className="game-card p-5 flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={allDone ? '#22c55e' : '#8b5cf6'}
                strokeWidth="3"
                strokeDasharray={`${(completedCount / intentions.length) * 94} 94`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              {completedCount}/{intentions.length}
            </div>
          </div>
          <div>
            <div className={`text-lg font-semibold ${allDone ? 'text-green-400' : 'text-slate-200'}`}>
              {allDone ? '🎉 All intentions complete!' : `${intentions.length - completedCount} remaining`}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {allDone ? 'Incredible focus today' : 'Stay on track — you set these for a reason'}
            </div>
          </div>
        </div>
      )}

      {/* Intentions list */}
      <div className="space-y-3">
        {intentions.map((intention, idx) => (
          <div
            key={intention.id}
            className={`game-card p-4 flex items-center gap-3 transition-all ${
              intention.completed ? 'opacity-60 border-green-500/20' : ''
            }`}
          >
            <span className="text-slate-600 text-sm font-bold w-5 text-center">{idx + 1}</span>
            <button
              onClick={() => toggle(intention.id)}
              disabled={toggling === intention.id}
              className="text-slate-500 hover:text-violet-400 transition-colors flex-shrink-0"
            >
              {intention.completed
                ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                : <Circle className="w-6 h-6" />
              }
            </button>
            <span className={`flex-1 text-sm ${intention.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {intention.text}
            </span>
            <button
              onClick={() => remove(intention.id)}
              className="text-slate-700 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add new */}
        {intentions.length < 3 && (
          <div className="game-card p-4">
            <div className="text-xs text-slate-600 mb-2">
              Intention {intentions.length + 1} of 3 — {starter}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addIntention()}
                placeholder="Write a clear, actionable intention…"
                maxLength={120}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={addIntention}
                disabled={adding || !newText.trim()}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        )}

        {intentions.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No intentions yet — set your first one above</p>
          </div>
        )}
      </div>

      {/* 7-day history */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          This Week
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {last7.map(date => {
            const data = weekMap[date]
            const isToday = date === today
            const pct = data ? data.done / data.total : 0
            const bgClass = !data
              ? 'bg-slate-800'
              : pct === 1
                ? 'bg-green-500'
                : pct >= 0.5
                  ? 'bg-yellow-500'
                  : 'bg-orange-600'
            const d = new Date(date + 'T00:00:00')
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${bgClass} ${isToday ? 'ring-2 ring-violet-500' : ''}`}>
                  {data ? `${data.done}/${data.total}` : ''}
                </div>
                <span className={`text-[10px] ${isToday ? 'text-violet-400 font-semibold' : 'text-slate-600'}`}>
                  {DAY_LABELS[d.getDay()]}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> All done</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" /> Partial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-800 inline-block" /> No intentions</span>
        </div>
      </div>

      {/* Tips */}
      <div className="text-center text-xs text-slate-700 space-y-1">
        <p>Research shows writing intentions 3× more likely to achieve goals</p>
        <p>Review these each morning and before bed</p>
      </div>
    </div>
  )
}
