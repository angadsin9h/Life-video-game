import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, Check, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MicroHabit {
  id: string
  name: string
  trigger: string
  duration: string
  category: string
  xp: number
  completions: string[]
  createdAt: string
}

const CATEGORIES = [
  { name: 'Body', color: '#22c55e', emoji: '💪' },
  { name: 'Mind', color: '#a855f7', emoji: '🧠' },
  { name: 'Spirit', color: '#6366f1', emoji: '✨' },
  { name: 'Work', color: '#3b82f6', emoji: '💼' },
  { name: 'Social', color: '#ec4899', emoji: '❤️' },
]

const PRESET_HABITS = [
  { name: '5 deep breaths', trigger: 'Before each meal', duration: '1 min', category: 'Mind', xp: 5 },
  { name: '10 pushups', trigger: 'When alarm goes off', duration: '1 min', category: 'Body', xp: 10 },
  { name: 'Drink a glass of water', trigger: 'When I wake up', duration: '30 sec', category: 'Body', xp: 5 },
  { name: 'Write 1 sentence in journal', trigger: 'Before bed', duration: '1 min', category: 'Mind', xp: 5 },
  { name: 'Text a friend', trigger: 'During morning coffee', duration: '2 min', category: 'Social', xp: 10 },
  { name: '1-minute gratitude', trigger: 'After waking up', duration: '1 min', category: 'Spirit', xp: 5 },
  { name: '3 affirmations', trigger: 'Looking in mirror', duration: '1 min', category: 'Mind', xp: 5 },
  { name: 'Review daily goals', trigger: 'When I sit at desk', duration: '2 min', category: 'Work', xp: 10 },
]

const STORAGE_KEY = 'micro_habits'
const STORAGE_COMPLETIONS_KEY = 'micro_habits_completions'

export default function MicroHabits() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [habits, setHabits] = useState<MicroHabit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [form, setForm] = useState({ name: '', trigger: '', duration: '1 min', category: 'Mind', xp: 5 })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setHabits(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: MicroHabit[]) => {
    setHabits(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addHabit = (h: { name: string; trigger: string; duration: string; category: string; xp: number }) => {
    const habit: MicroHabit = {
      id: Date.now().toString(),
      name: h.name.trim(),
      trigger: h.trigger.trim(),
      duration: h.duration,
      category: h.category,
      xp: h.xp,
      completions: [],
      createdAt: new Date().toISOString(),
    }
    save([habit, ...habits])
    setShowForm(false)
    setForm({ name: '', trigger: '', duration: '1 min', category: 'Mind', xp: 5 })
    toastSuccess(`Micro-habit added! Just ${h.duration} at a time. 🔥`)
  }

  const complete = (id: string) => {
    const updated = habits.map(h => {
      if (h.id !== id) return h
      const completions = h.completions.includes(today)
        ? h.completions.filter(c => c !== today)
        : [...h.completions, today]
      return { ...h, completions }
    })
    save(updated)
    const habit = updated.find(h => h.id === id)
    if (habit?.completions.includes(today)) {
      toastSuccess(`+${habit.xp} XP! "${habit.name}" done! ⚡`)
    }
  }

  const del = (id: string) => save(habits.filter(h => h.id !== id))

  const todayXP = habits.filter(h => h.completions.includes(today)).reduce((s, h) => s + h.xp, 0)
  const todayDone = habits.filter(h => h.completions.includes(today)).length
  const totalDays = (id: string) => habits.find(h => h.id === id)?.completions.length || 0

  // Streak: consecutive days ending today
  const getStreak = (completions: string[]): number => {
    let streak = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (!completions.includes(ds)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Micro-Habits
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Tiny habits, massive results. Under 5 minutes each.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{todayDone}/{habits.length}</div>
          <div className="text-xs text-slate-500">Done Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">+{todayXP}</div>
          <div className="text-xs text-slate-500">XP Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{habits.length}</div>
          <div className="text-xs text-slate-500">Total Habits</div>
        </div>
      </div>

      {/* Presets */}
      <div className="game-card p-4">
        <button onClick={() => setShowPresets(p => !p)} className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-slate-300">⚡ Proven Micro-Habits Library</span>
          {showPresets ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {showPresets && (
          <div className="mt-3 space-y-2">
            {PRESET_HABITS.map((p, i) => {
              const cat = CATEGORIES.find(c => c.name === p.category) || CATEGORIES[0]
              const alreadyAdded = habits.some(h => h.name === p.name)
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800">
                  <span>{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{p.name}</div>
                    <div className="text-xs text-slate-500">When: {p.trigger} · {p.duration}</div>
                  </div>
                  <button onClick={() => { if (!alreadyAdded) addHabit(p) }}
                    disabled={alreadyAdded}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${alreadyAdded ? 'text-slate-600 bg-slate-800' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>
                    {alreadyAdded ? 'Added' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20">
          <h3 className="font-semibold text-slate-300">Create Micro-Habit</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Habit name (e.g. 10 pushups, 3 breaths...)" className="game-input w-full" autoFocus />
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="Trigger: When/after I..." className="game-input w-full" />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration</label>
              <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="game-input w-full">
                {['30 sec', '1 min', '2 min', '5 min'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="game-input w-full">
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">XP reward</label>
              <select value={form.xp} onChange={e => setForm(f => ({ ...f, xp: +e.target.value }))} className="game-input w-full">
                {[5, 10, 15, 20, 25].map(x => <option key={x} value={x}>{x} XP</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (form.name.trim()) addHabit(form) }}
              className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">Add Habit</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Habit list */}
      <div className="space-y-2">
        {habits.map(habit => {
          const cat = CATEGORIES.find(c => c.name === habit.category) || CATEGORIES[0]
          const doneToday = habit.completions.includes(today)
          const streak = getStreak(habit.completions)
          return (
            <div key={habit.id} className={`game-card transition-all ${doneToday ? 'opacity-75' : ''}`}>
              <div className="p-3 flex items-center gap-3">
                <button onClick={() => complete(habit.id)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${doneToday ? 'border-transparent' : 'border-slate-600 hover:border-yellow-400'}`}
                  style={doneToday ? { background: cat.color + '30', borderColor: cat.color } : {}}>
                  {doneToday ? <Check className="w-4 h-4" style={{ color: cat.color }} /> : <span>{cat.emoji}</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${doneToday ? 'line-through text-slate-500' : 'text-white'}`}>{habit.name}</div>
                  <div className="text-xs text-slate-500 truncate">{habit.trigger} · {habit.duration}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {streak > 0 && <span className="text-xs text-orange-400">🔥{streak}d</span>}
                  <span className="text-xs text-yellow-500">+{habit.xp}</span>
                  <button onClick={() => setExpandedId(expandedId === habit.id ? null : habit.id)} className="p-1 text-slate-600 hover:text-slate-400">
                    {expandedId === habit.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {expandedId === habit.id && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {totalDays(habit.id)} total completions
                  </div>
                  <button onClick={() => del(habit.id)} className="text-xs text-slate-700 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {habits.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No micro-habits yet.</p>
          <p className="text-sm mb-4">Start with habits under 2 minutes — consistency beats intensity.</p>
          <button onClick={() => setShowPresets(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Browse Presets
          </button>
        </div>
      )}
    </div>
  )
}
