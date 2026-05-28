import { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertTriangle, TrendingDown, Check, Flame } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface AntiHabit {
  id: string
  name: string
  category: string
  why: string
  trigger: string
  replacement: string
  relapses: string[]
  cleanDays: number
  lastRelapse: string
  createdAt: string
}

const CATEGORIES = [
  { name: 'Digital', color: '#3b82f6', emoji: '📱' },
  { name: 'Food', color: '#f97316', emoji: '🍕' },
  { name: 'Mindset', color: '#a855f7', emoji: '🧠' },
  { name: 'Social', color: '#ec4899', emoji: '👥' },
  { name: 'Substance', color: '#ef4444', emoji: '🚫' },
  { name: 'Work', color: '#f59e0b', emoji: '💼' },
  { name: 'Health', color: '#22c55e', emoji: '💪' },
  { name: 'Finance', color: '#10b981', emoji: '💰' },
]

const EXAMPLES = [
  { name: 'Doom scrolling', category: 'Digital', trigger: 'Boredom/anxiety', replacement: '5 min walk' },
  { name: 'Hitting snooze', category: 'Mindset', trigger: 'Alarm sounds', replacement: 'Immediately sit up' },
  { name: 'Late night snacking', category: 'Food', trigger: 'Watching TV', replacement: 'Herbal tea' },
  { name: 'Procrastinating on tasks', category: 'Work', trigger: 'Hard task appears', replacement: '2-min rule' },
  { name: 'Checking phone first thing', category: 'Digital', trigger: 'Wake up', replacement: 'Morning routine first' },
  { name: 'Negative self-talk', category: 'Mindset', trigger: 'Making a mistake', replacement: 'Self-compassion phrase' },
]

const STORAGE_KEY = 'anti_habits'

function getDaysBetween(date1: string, date2: string): number {
  return Math.floor((new Date(date2).getTime() - new Date(date1).getTime()) / 86400000)
}

export default function AntiHabits() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [habits, setHabits] = useState<AntiHabit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Digital', why: '', trigger: '', replacement: '' })
  const [confirmRelapse, setConfirmRelapse] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setHabits(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: AntiHabit[]) => {
    setHabits(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addHabit = (h: typeof form) => {
    if (!h.name.trim()) return
    const habit: AntiHabit = {
      id: Date.now().toString(),
      name: h.name.trim(),
      category: h.category,
      why: h.why.trim(),
      trigger: h.trigger.trim(),
      replacement: h.replacement.trim(),
      relapses: [],
      cleanDays: 0,
      lastRelapse: '',
      createdAt: today,
    }
    save([habit, ...habits])
    setForm({ name: '', category: 'Digital', why: '', trigger: '', replacement: '' })
    setShowForm(false)
    toastSuccess('Anti-habit tracked! Stay strong 💪')
  }

  const logRelapse = (id: string) => {
    save(habits.map(h => {
      if (h.id !== id) return h
      return { ...h, relapses: [...h.relapses, today], lastRelapse: today, cleanDays: 0 }
    }))
    setConfirmRelapse(null)
    toastSuccess('Relapse logged. Never miss twice — get back on track now!')
  }

  const getCleanStreak = (habit: AntiHabit): number => {
    if (!habit.lastRelapse && !habit.createdAt) return 0
    const from = habit.lastRelapse || habit.createdAt
    return getDaysBetween(from, today)
  }

  const del = (id: string) => save(habits.filter(h => h.id !== id))

  const totalCleanDays = habits.reduce((s, h) => s + getCleanStreak(h), 0)
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => getCleanStreak(h))) : 0

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <X className="w-7 h-7 text-red-400" />
            Anti-Habits
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Break bad habits. Track your clean days.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Track
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-red-400">{habits.length}</div>
          <div className="text-xs text-slate-500">Tracking</div>
        </div>
        <div className="game-card p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-400">{longestStreak}d</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{totalCleanDays}</div>
          <div className="text-xs text-slate-500">Total Clean</div>
        </div>
      </div>

      {/* Examples */}
      <button onClick={() => setShowExamples(e => !e)}
        className="w-full p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-sm text-left flex items-center justify-between transition-colors">
        <span>🔥 Common bad habits to eliminate</span>
        <X className={`w-4 h-4 transition-transform ${showExamples ? '' : 'rotate-45'}`} />
      </button>
      {showExamples && (
        <div className="grid grid-cols-2 gap-2">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => { setForm({ name: ex.name, category: ex.category, why: '', trigger: ex.trigger, replacement: ex.replacement }); setShowForm(true); setShowExamples(false) }}
              className="text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
              <div className="text-sm text-white">{ex.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{ex.category}</div>
            </button>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-red-500/20">
          <h3 className="font-semibold text-slate-300">Track Bad Habit</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="What habit do you want to eliminate?" className="game-input w-full" autoFocus />
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.name} onClick={() => setForm(f => ({ ...f, category: c.name }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.category === c.name ? { background: c.color + '30', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#64748b' }}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why do you want to stop? (your reason)" className="game-input w-full" />
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggers this habit?" className="game-input w-full" />
          <input value={form.replacement} onChange={e => setForm(f => ({ ...f, replacement: e.target.value }))}
            placeholder="Replacement behavior (what to do instead)" className="game-input w-full" />
          <div className="flex gap-2">
            <button onClick={() => addHabit(form)} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">Start Tracking</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Habit cards */}
      {habits.map(habit => {
        const cat = CATEGORIES.find(c => c.name === habit.category) || CATEGORIES[0]
        const streak = getCleanStreak(habit)
        const isConfirming = confirmRelapse === habit.id

        return (
          <div key={habit.id} className="game-card p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{cat.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{habit.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cat.color + '20', color: cat.color }}>{habit.category}</span>
                </div>

                {/* Clean streak */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (streak / 30) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-green-400 flex-shrink-0">
                    {streak}d clean
                    {streak >= 21 && ' 🏆'}
                    {streak >= 7 && streak < 21 && ' 🔥'}
                  </span>
                </div>

                {habit.why && <p className="text-xs text-slate-500 mt-1 italic">Why: {habit.why}</p>}
                {habit.trigger && <p className="text-xs text-slate-500">Trigger: {habit.trigger}</p>}
                {habit.replacement && (
                  <p className="text-xs text-green-600 mt-0.5">→ Instead: {habit.replacement}</p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {!isConfirming ? (
                    <button onClick={() => setConfirmRelapse(habit.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                      Log Relapse
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">Relapsed today?</span>
                      <button onClick={() => logRelapse(habit.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg">Yes, log it</button>
                      <button onClick={() => setConfirmRelapse(null)} className="text-xs text-slate-500">Cancel</button>
                    </div>
                  )}
                  {habit.relapses.length > 0 && (
                    <span className="text-xs text-slate-600">{habit.relapses.length} total relapses</span>
                  )}
                </div>
              </div>
              <button onClick={() => del(habit.id)} className="p-1 text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      })}

      {habits.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No bad habits being tracked.</p>
          <p className="text-sm mb-4">Track a habit you want to eliminate and watch your clean days grow.</p>
        </div>
      )}
    </div>
  )
}
