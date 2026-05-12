import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, Flame, CheckCircle2, Circle, RefreshCw, ChevronDown, ChevronUp, Trophy, Wand2, Shield } from 'lucide-react'

const HABIT_TEMPLATES = [
  { emoji: '🏃', title: 'Morning Run', category: 'health', target_minutes: 30, description: 'Run or jog to start the day' },
  { emoji: '💪', title: 'Workout', category: 'health', target_minutes: 45, description: 'Strength or cardio session' },
  { emoji: '🧘', title: 'Meditation', category: 'mind', target_minutes: 10, description: 'Mindfulness or breathing practice' },
  { emoji: '📚', title: 'Read 30 Min', category: 'mind', target_minutes: 30, description: 'Read books or articles' },
  { emoji: '💧', title: 'Drink Water', category: 'health', target_minutes: 0, description: '8 glasses throughout the day' },
  { emoji: '🌱', title: 'Learning', category: 'growth', target_minutes: 30, description: 'Study or learn something new' },
  { emoji: '✍️', title: 'Journaling', category: 'mind', target_minutes: 15, description: 'Write daily reflections' },
  { emoji: '🛏️', title: 'Sleep by 11pm', category: 'health', target_minutes: 0, description: 'Consistent sleep schedule' },
  { emoji: '🧹', title: 'Tidy Space', category: 'growth', target_minutes: 10, description: 'Keep your environment clean' },
  { emoji: '📞', title: 'Connect', category: 'social', target_minutes: 15, description: 'Reach out to a friend or family' },
  { emoji: '🎯', title: 'Deep Work', category: 'work', target_minutes: 90, description: 'Focused productive session' },
  { emoji: '🚶', title: 'Walk 10k Steps', category: 'health', target_minutes: 60, description: 'Hit your daily steps goal' },
  { emoji: '🙏', title: 'Gratitude', category: 'mind', target_minutes: 5, description: 'List 3 things you are grateful for' },
  { emoji: '📵', title: 'No Phone AM', category: 'mind', target_minutes: 0, description: 'Avoid phone first hour of day' },
  { emoji: '🥗', title: 'Eat Clean', category: 'health', target_minutes: 0, description: 'Whole foods, skip junk food' },
]

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
  shields: number
  shieldUses: string[]
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
const CAT_DOT: Record<string, string> = {
  health: 'bg-green-500',
  mind: 'bg-cyan-500',
  work: 'bg-violet-500',
  social: 'bg-yellow-500',
  growth: 'bg-red-500',
}
const STREAK_FIRE_COLORS = ['text-slate-500', 'text-yellow-500', 'text-orange-500', 'text-red-500', 'text-red-400']
const EMOJI_OPTIONS = ['✅', '🏃', '📚', '💪', '🧘', '🎯', '⚡', '🌟', '🔥', '💎', '🎸', '🧠', '💼', '🌱', '🏋️']
const emptyForm = { title: '', description: '', category: 'health', target_minutes: 0, emoji: '✅' }

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function get30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function HabitCalendar({ habitId, category, streak }: { habitId: number; category: string; streak: number }) {
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get<string[]>(`/api/habits/${habitId}/history`)
      .then(r => setCompletedDates(new Set(r.data)))
      .finally(() => setLoading(false))
  }, [habitId])

  const days = get30Days()
  const dotColor = CAT_DOT[category] ?? 'bg-violet-500'

  // Calculate completion rate
  const rate = Math.round((completedDates.size / 30) * 100)

  if (loading) return <div className="h-16 animate-pulse bg-slate-700 rounded-lg mt-3" />

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">Last 30 days</span>
        <span className="text-xs text-slate-400 font-semibold">{rate}% complete · {streak} day streak</span>
      </div>
      <div className="grid grid-cols-[repeat(7,1fr)] gap-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[9px] text-slate-600 font-medium">{d}</div>
        ))}
        {/* Pad to align first day */}
        {Array.from({ length: new Date(days[0]).getDay() }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(date => {
          const done = completedDates.has(date)
          const isToday = date === new Date().toISOString().split('T')[0]
          return (
            <div
              key={date}
              title={date}
              className={`aspect-square rounded-sm transition-all ${
                done
                  ? `${dotColor} opacity-90 shadow-sm`
                  : isToday
                  ? 'bg-slate-600 border border-slate-500'
                  : 'bg-slate-800'
              }`}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-sm ${dotColor}`} />
          <span className="text-[10px] text-slate-500">Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-slate-800" />
          <span className="text-[10px] text-slate-500">Missed</span>
        </div>
      </div>
    </div>
  )
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null)
  const [usingShield, setUsingShield] = useState<number | null>(null)
  const [shieldMsg, setShieldMsg] = useState<string | null>(null)

  const load = useCallback(() =>
    axios.get<Habit[]>('/api/habits').then(r => setHabits(r.data)).catch(console.error).finally(() => setLoading(false)), [])

  useEffect(() => { load() }, [load])

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

  const useShield = async (habit: Habit) => {
    setUsingShield(habit.id)
    try {
      const res = await axios.post<{ ok: boolean; streak: number; shields: number; protectedDate: string }>(`/api/habits/${habit.id}/use-shield`)
      setShieldMsg(`🛡️ Shield used! Streak protected for ${res.data.protectedDate}`)
      setTimeout(() => setShieldMsg(null), 3500)
      load()
    } catch (err: any) {
      setShieldMsg(err.response?.data?.error || 'Could not use shield')
      setTimeout(() => setShieldMsg(null), 3500)
    } finally {
      setUsingShield(null)
    }
  }

  const addFromTemplate = async (t: typeof HABIT_TEMPLATES[number]) => {
    setAddingTemplate(t.title)
    try {
      await axios.post('/api/habits', { title: t.title, description: t.description, category: t.category, target_minutes: t.target_minutes, emoji: t.emoji })
      load()
    } finally { setAddingTemplate(null) }
  }

  const completedToday = habits.filter(h => h.completedToday).length
  const totalActive = habits.length
  const bestStreak = Math.max(...habits.map(h => h.streak), 0)
  const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0)
  const perfectDay = totalActive > 0 && completedToday === totalActive
  const totalShields = habits.reduce((sum, h) => sum + (h.shields || 0), 0)

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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-8 h-8 text-violet-400" />
            Habits
          </h1>
          <p className="text-slate-400 mt-1">Build streaks, forge your character</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="game-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Shield notification */}
      {shieldMsg && (
        <div className="game-card p-3 border border-blue-500/40 bg-blue-900/10 text-center text-sm text-blue-300 font-semibold animate-pulse">
          {shieldMsg}
        </div>
      )}

      {/* Stats row */}
      {totalActive > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className={`game-card p-3 text-center ${perfectDay ? 'border border-green-500/40 bg-green-500/5' : ''}`}>
            <div className={`text-xl font-bold ${perfectDay ? 'text-green-400' : 'text-violet-400'}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {completedToday}/{totalActive}
            </div>
            <div className="text-xs text-slate-500">Today</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-orange-400 flex items-center justify-center gap-1" style={{ fontFamily: 'Orbitron, monospace' }}>
              <Flame className="w-4 h-4" />{bestStreak}
            </div>
            <div className="text-xs text-slate-500">Best Streak</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalCompletions}</div>
            <div className="text-xs text-slate-500">Total Reps</div>
          </div>
          <div className="game-card p-3 text-center" title="Shields protect your streak for a missed day. Earned every 7-day milestone.">
            <div className="text-xl font-bold text-blue-400 flex items-center justify-center gap-1" style={{ fontFamily: 'Orbitron, monospace' }}>
              <Shield className="w-4 h-4" />{totalShields}
            </div>
            <div className="text-xs text-slate-500">Shields</div>
          </div>
        </div>
      )}

      {/* Daily progress */}
      {totalActive > 0 && (
        <div className={`game-card p-4 ${perfectDay ? 'glowing-border border-green-500/30' : 'glowing-border'}`}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 font-semibold">
              {perfectDay ? '🏆 Perfect Day Achieved!' : "Today's Habits"}
            </span>
            <span className="text-violet-400 font-bold">{Math.round((completedToday / totalActive) * 100)}%</span>
          </div>
          <div className="stat-bar h-3">
            <div
              className={`stat-bar-fill transition-all duration-700 ${perfectDay ? 'bar-health' : 'bar-work'}`}
              style={{ width: totalActive > 0 ? `${(completedToday / totalActive) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-3 border-violet-500/30 glowing-border">
          <h2 className="font-semibold text-slate-200">New Habit</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-2">Pick an Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-lg text-xl transition-all ${form.emoji === e ? 'bg-violet-600 scale-110' : 'bg-slate-700 hover:bg-slate-600'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <input type="text" className="game-input w-full" placeholder="Habit title *"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input type="text" className="game-input w-full" placeholder="Description (optional)"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="game-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input type="number" min="0" max="480" className="game-input" placeholder="Min target (optional)"
              value={form.target_minutes || ''} onChange={e => setForm(f => ({ ...f, target_minutes: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={submitting || !form.title.trim()} className="game-btn-primary flex-1">
              {submitting ? 'Saving...' : 'Add Habit'}
            </button>
            <button onClick={() => setShowForm(false)} className="game-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Template library */}
      {!showForm && (
        <div className="game-card p-4">
          <button
            onClick={() => setShowTemplates(s => !s)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Wand2 className="w-4 h-4 text-violet-400" />
              Quick-add from templates
            </span>
            {showTemplates ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showTemplates && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HABIT_TEMPLATES.filter(t => !habits.some(h => h.title === t.title)).map(t => (
                <button
                  key={t.title}
                  onClick={() => addFromTemplate(t)}
                  disabled={addingTemplate === t.title}
                  className="flex items-center gap-3 p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-all text-left group"
                >
                  <span className="text-xl">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-white">{t.title}</div>
                    <div className="text-xs text-slate-500">{CAT_ICONS[t.category]} {t.category}{t.target_minutes > 0 ? ` · ${t.target_minutes}m` : ''}</div>
                  </div>
                  <Plus className={`w-4 h-4 flex-shrink-0 transition-all ${addingTemplate === t.title ? 'animate-spin text-violet-400' : 'text-slate-600 group-hover:text-violet-400'}`} />
                </button>
              ))}
              {HABIT_TEMPLATES.filter(t => !habits.some(h => h.title === t.title)).length === 0 && (
                <p className="text-sm text-slate-500 col-span-2 text-center py-2">All templates added! 🎉</p>
              )}
            </div>
          )}
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
            const isExpanded = expandedId === habit.id
            const isBest = habit.streak === bestStreak && bestStreak > 0

            return (
              <div key={habit.id} className={`game-card p-4 border ${colorClass} transition-all duration-200`}>
                <div className="flex items-center gap-3">
                  {/* Completion toggle */}
                  <button onClick={() => toggleToday(habit)} disabled={toggling === habit.id}
                    className="flex-shrink-0 transition-transform hover:scale-110">
                    {toggling === habit.id
                      ? <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                      : habit.completedToday
                      ? <CheckCircle2 className="w-8 h-8 text-green-400" />
                      : <Circle className="w-8 h-8 text-slate-500 hover:text-violet-400" />
                    }
                  </button>

                  <div className="text-2xl flex-shrink-0">{habit.emoji}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${habit.completedToday ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {habit.title}
                      </h3>
                      {isBest && <span title="Best streak!"><Trophy className="w-3.5 h-3.5 text-yellow-400" /></span>}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 capitalize">
                        {CAT_ICONS[habit.category]} {habit.category}
                      </span>
                    </div>
                    {habit.description && <p className="text-xs text-slate-400 mt-0.5">{habit.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      {habit.target_minutes > 0 && <span>⏱ {habit.target_minutes}m</span>}
                      <span>✓ {habit.totalCompletions}× done</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-center min-w-[48px]">
                    <div className={`flex items-center gap-1 justify-center ${fireColor}`}>
                      <Flame className="w-4 h-4" />
                      <span className="text-lg font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>{habit.streak}</span>
                    </div>
                    <div className="text-xs text-slate-500">streak</div>
                    {(habit.shields > 0) && (
                      <button
                        onClick={() => useShield(habit)}
                        disabled={usingShield === habit.id}
                        title={`Use shield to protect streak (${habit.shields} left)`}
                        className="mt-1 flex items-center gap-0.5 text-blue-400 hover:text-blue-300 transition-colors text-xs"
                      >
                        <Shield className="w-3 h-3" />{habit.shields}
                      </button>
                    )}
                  </div>

                  <button onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                    className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button onClick={() => deleteHabit(habit.id)}
                    className="flex-shrink-0 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <HabitCalendar habitId={habit.id} category={habit.category} streak={habit.streak} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Category summary */}
      {habits.length > 0 && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">By Category</h3>
          <div className="space-y-2">
            {CATEGORIES.map(cat => {
              const catHabits = habits.filter(h => h.category === cat)
              if (catHabits.length === 0) return null
              const catDone = catHabits.filter(h => h.completedToday).length
              const pct = Math.round((catDone / catHabits.length) * 100)
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm w-24 text-slate-400 flex-shrink-0">{CAT_ICONS[cat]} {cat}</span>
                  <div className="flex-1 stat-bar h-2">
                    <div className={`stat-bar-fill transition-all duration-700 ${CAT_DOT[cat]?.replace('bg-', 'bg-') ?? 'bg-violet-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">{catDone}/{catHabits.length}</span>
                </div>
              )
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  )
}
