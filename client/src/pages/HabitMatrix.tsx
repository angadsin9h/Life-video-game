import { useState, useEffect } from 'react'
import { Plus, X, CheckCircle2, Target, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Habit {
  id: string
  name: string
  emoji: string
  completions: string[]
}

interface HabitMatrixData {
  habits: Habit[]
}

const STORAGE_KEY = 'habit_matrix'
const MAX_HABITS = 12

const EMOJI_OPTIONS = ['🏃', '💧', '📚', '🧘', '💪', '🥗', '😴', '🎯', '✍️', '🧠', '🌅', '🙏']

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function getDayLabel(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}

function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default function HabitMatrix() {
  const { toastSuccess } = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎯')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const last7 = getLast7Days()
  const last30 = getLast30Days()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: HabitMatrixData = JSON.parse(stored)
        setHabits(parsed.habits ?? [])
      }
    } catch { /**/ }
  }, [])

  const persist = (updated: Habit[]) => {
    setHabits(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits: updated }))
  }

  const toggleDay = (habitId: string, day: string) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h
      const has = h.completions.includes(day)
      return {
        ...h,
        completions: has
          ? h.completions.filter(c => c !== day)
          : [...h.completions, day],
      }
    })
    persist(updated)
  }

  const addHabit = () => {
    if (!newName.trim()) return
    if (habits.length >= MAX_HABITS) return
    const habit: Habit = {
      id: Date.now().toString(),
      name: newName.trim(),
      emoji: newEmoji,
      completions: [],
    }
    persist([...habits, habit])
    setNewName('')
    setNewEmoji('🎯')
    setShowAdd(false)
    toastSuccess('Habit added to your matrix')
  }

  const deleteHabit = (id: string) => {
    persist(habits.filter(h => h.id !== id))
    setConfirmDelete(null)
    toastSuccess('Habit removed from matrix')
  }

  const getStreak = (habit: Habit): number => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      if (habit.completions.includes(iso)) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const getCompletionRate = (habit: Habit): number => {
    if (last30.length === 0) return 0
    const done = last30.filter(d => habit.completions.includes(d)).length
    return Math.round((done / last30.length) * 100)
  }

  const getColumnRate = (day: string): number => {
    if (habits.length === 0) return 0
    const done = habits.filter(h => h.completions.includes(day)).length
    return Math.round((done / habits.length) * 100)
  }

  const matrixScore =
    habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h), 0) / habits.length)
      : 0

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Habit Matrix
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Visual habit performance grid.</p>
        </div>
        {habits.length < MAX_HABITS && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Habit
          </button>
        )}
      </div>

      {/* Matrix Score */}
      {habits.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-3 text-center col-span-1">
            <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {matrixScore}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Matrix Score</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {habits.length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Active Habits</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {Math.max(0, ...habits.map(getStreak))}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Top Streak</div>
          </div>
        </div>
      )}

      {/* Add Habit Form */}
      {showAdd && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Habit</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Habit name..."
            className="game-input w-full text-sm"
            onKeyDown={e => e.key === 'Enter' && addHabit()}
          />
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Choose emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  onClick={() => setNewEmoji(em)}
                  className={`text-xl p-1.5 rounded-lg border transition-all ${
                    newEmoji === em ? 'border-violet-500 bg-violet-900/40' : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addHabit}
              disabled={!newName.trim()}
              className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName('') }}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* The Matrix Grid */}
      {habits.length > 0 && (
        <div className="game-card p-4 overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr>
                <th className="text-left text-xs text-slate-500 font-normal pb-3 pr-3 min-w-[120px]">Habit</th>
                {last7.map(day => (
                  <th key={day} className="text-center pb-3 px-1 min-w-[40px]">
                    <div className="text-xs text-slate-400 font-normal">{getDayLabel(day)}</div>
                    <div className="text-xs text-slate-600">{day.slice(5)}</div>
                  </th>
                ))}
                <th className="text-center pb-3 px-2 min-w-[50px]">
                  <div className="text-xs text-slate-400 font-normal">Streak</div>
                </th>
                <th className="text-center pb-3 px-2 min-w-[50px]">
                  <div className="text-xs text-slate-400 font-normal">30d %</div>
                </th>
                <th className="pb-3 px-1 min-w-[30px]" />
              </tr>
            </thead>
            <tbody>
              {/* Column completion rates */}
              <tr>
                <td className="text-xs text-slate-500 pb-2 pr-3">Daily rate</td>
                {last7.map(day => {
                  const rate = getColumnRate(day)
                  return (
                    <td key={day} className="text-center pb-2 px-1">
                      <span className={`text-xs font-semibold ${rate >= 80 ? 'text-green-400' : rate >= 50 ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {rate}%
                      </span>
                    </td>
                  )
                })}
                <td colSpan={3} />
              </tr>

              {habits.map(habit => {
                const streak = getStreak(habit)
                const rate = getCompletionRate(habit)
                return (
                  <tr key={habit.id} className="border-t border-slate-800">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{habit.emoji}</span>
                        <span className="text-sm text-slate-300 truncate max-w-[80px]">{habit.name}</span>
                      </div>
                    </td>
                    {last7.map(day => {
                      const done = habit.completions.includes(day)
                      return (
                        <td key={day} className="text-center py-2 px-1">
                          <button
                            onClick={() => toggleDay(habit.id, day)}
                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                              done
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                                : 'bg-slate-800 text-slate-600 hover:bg-slate-700 border border-slate-700'
                            }`}
                          >
                            {done ? '✓' : '○'}
                          </button>
                        </td>
                      )
                    })}
                    <td className="text-center py-2 px-2">
                      <span className={`text-sm font-bold ${streak >= 7 ? 'text-orange-400' : streak >= 3 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {streak}🔥
                      </span>
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className={`text-sm font-semibold ${rate >= 80 ? 'text-green-400' : rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {rate}%
                      </span>
                    </td>
                    <td className="py-2 px-1">
                      {confirmDelete === habit.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => deleteHabit(habit.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-bold"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-slate-500 hover:text-slate-400"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(habit.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {habits.length === 0 && !showAdd && (
        <div className="text-center py-12 text-slate-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm mb-4">Your habit matrix is empty. Add your first habit to begin tracking.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
          >
            <TrendingUp className="w-4 h-4 inline mr-1.5" />
            Add Your First Habit
          </button>
        </div>
      )}

      {habits.length >= MAX_HABITS && (
        <p className="text-xs text-slate-500 text-center">Maximum {MAX_HABITS} habits reached.</p>
      )}
    </div>
  )
}
