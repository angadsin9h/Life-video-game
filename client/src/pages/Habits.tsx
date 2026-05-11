import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Trash2, Flame, CheckCircle2, Circle, RefreshCw } from 'lucide-react'

interface Habit {
  id: number
  title: string
  description: string | null
  category: string
  target_minutes: number
  emoji: string
  active: number
  streak: number
  completedToday: boolean
  totalCompletions: number
  created_at: string
}

const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_COLORS: Record<string, string> = {
  health: 'border-green-500/50 bg-green-500/5',
  mind: 'border-cyan-500/50 bg-cyan-500/5',
  work: 'border-violet-500/50 bg-violet-500/5',
  social: 'border-yellow-500/50 bg-yellow-500/5',
  growth: 'border-red-500/50 bg-red-500/5',
}
const STREAK_FIRE_COLORS = ['text-slate-500', 'text-yellow-500', 'text-orange-500', 'text-red-500', 'text-red-400']

const EMOJI_OPTIONS = ['✅', '🏃', '📚', '💪', '🧘', '🎯', '⚡', '🌟', '🔥', '💎', '🎸', '🧠', '💼', '🌱', '🏋️']

const emptyForm = { title: '', description: '', category: 'health', target_minutes: 0, emoji: '✅' }

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)

  const load = () =>
    axios.get<Habit[]>('/api/habits').then(r => setHabits(r.data)).catch(console.error).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await axios.post('/api/habits', form)
      setForm({ ...emptyForm })
      setShowForm(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const toggleToday = async (habit: Habit) => {
    setToggling(habit.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      await axios.post(`/api/habits/${habit.id}/complete`, { date: today })
      load()
    } finally {
      setToggling(null)
    }
  }

  const deleteHabit = async (id: number) => {
    await axios.delete(`/api/habits/${id}`)
    load()
  }

  const completedToday = habits.filter(h => h.completedToday).length
  const totalActive = habits.length

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-800 rounded-xl" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Habits</h1>
          <p className="text-slate-400 mt-1">Build streaks, forge your character</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="game-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Daily progress bar */}
      {totalActive > 0 && (
        <div className="game-card p-4 glowing-border">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 font-semibold">Today's Habits</span>
            <span className="text-violet-400 font-bold">{completedToday}/{totalActive}</span>
          </div>
          <div className="stat-bar h-3">
            <div
              className="stat-bar-fill bar-work transition-all duration-700"
              style={{ width: totalActive > 0 ? `${(completedToday / totalActive) * 100}%` : '0%' }}
            />
          </div>
          {completedToday === totalActive && totalActive > 0 && (
            <p className="text-xs text-green-400 mt-2 text-center">🎉 All habits done today! Legendary discipline!</p>
          )}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-3 border-violet-500/30 glowing-border">
          <h2 className="font-semibold text-slate-200">New Habit</h2>

          {/* Emoji picker */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Pick an Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-lg text-xl transition-all ${form.emoji === e ? 'bg-violet-600 scale-110' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            className="game-input w-full"
            placeholder="Habit title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            type="text"
            className="game-input w-full"
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="game-input"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="480"
                className="game-input w-full"
                placeholder="Min target"
                value={form.target_minutes || ''}
                onChange={e => setForm(f => ({ ...f, target_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={submitting || !form.title.trim()} className="game-btn-primary flex-1">
              {submitting ? 'Saving...' : 'Add Habit'}
            </button>
            <button onClick={() => setShowForm(false)} className="game-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">No habits yet</p>
          <p className="text-sm">Start building your daily rituals — small actions compound into big results.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const fireColor = STREAK_FIRE_COLORS[Math.min(habit.streak, STREAK_FIRE_COLORS.length - 1)]
            const colorClass = CAT_COLORS[habit.category] || 'border-slate-700'
            return (
              <div
                key={habit.id}
                className={`game-card p-4 border ${colorClass} transition-all duration-200 ${habit.completedToday ? 'opacity-80' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Completion toggle */}
                  <button
                    onClick={() => toggleToday(habit)}
                    disabled={toggling === habit.id}
                    className="flex-shrink-0 transition-transform hover:scale-110"
                  >
                    {toggling === habit.id ? (
                      <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                    ) : habit.completedToday ? (
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    ) : (
                      <Circle className="w-8 h-8 text-slate-500 hover:text-violet-400" />
                    )}
                  </button>

                  {/* Emoji */}
                  <div className="text-2xl flex-shrink-0">{habit.emoji}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold text-slate-200 ${habit.completedToday ? 'line-through text-slate-400' : ''}`}>
                        {habit.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 capitalize flex-shrink-0">
                        {CAT_ICONS[habit.category]} {habit.category}
                      </span>
                    </div>
                    {habit.description && <p className="text-xs text-slate-400 mt-0.5">{habit.description}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      {habit.target_minutes > 0 && (
                        <span className="text-xs text-slate-500">⏱ {habit.target_minutes}m target</span>
                      )}
                      <span className="text-xs text-slate-500">✓ {habit.totalCompletions}x total</span>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="flex-shrink-0 text-center">
                    <div className={`flex items-center gap-1 ${fireColor}`}>
                      <Flame className="w-4 h-4" />
                      <span className="text-lg font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
                        {habit.streak}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">streak</div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="flex-shrink-0 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leaderboard/stats footer */}
      {habits.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Habit Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {Math.max(...habits.map(h => h.streak), 0)}
              </div>
              <div className="text-xs text-slate-500">Best Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {habits.reduce((sum, h) => sum + h.totalCompletions, 0)}
              </div>
              <div className="text-xs text-slate-500">Total Completions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {habits.filter(h => h.completedToday).length}
              </div>
              <div className="text-xs text-slate-500">Done Today</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
