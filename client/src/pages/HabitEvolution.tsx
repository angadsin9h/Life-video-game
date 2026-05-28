import { useState, useEffect } from 'react'
import { Repeat, Plus, X, Award, CheckCircle2, Flame } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Frequency = 'daily' | 'weekly' | '3x week' | '2x week'

interface Habit {
  id: string
  name: string
  emoji: string
  frequency: Frequency
  completions: string[]
  createdAt: string
}

const STORAGE_KEY = 'habit_evolution'
const FREQS: Frequency[] = ['daily', 'weekly', '3x week', '2x week']

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getStreak(completions: string[]): number {
  if (completions.length === 0) return 0
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (completions.includes(ds)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

type Stage = 'Seed' | 'Sprout' | 'Tree' | 'Diamond'

function getStage(streak: number): Stage {
  if (streak >= 67) return 'Diamond'
  if (streak >= 22) return 'Tree'
  if (streak >= 8) return 'Sprout'
  return 'Seed'
}

const STAGE_CONFIG: Record<Stage, { emoji: string; color: string; nextAt: number | null; label: string }> = {
  Seed:    { emoji: '🌱', color: '#22c55e',  nextAt: 8,  label: 'Seed' },
  Sprout:  { emoji: '🌿', color: '#14b8a6',  nextAt: 22, label: 'Sprout' },
  Tree:    { emoji: '🌳', color: '#3b82f6',  nextAt: 67, label: 'Tree' },
  Diamond: { emoji: '💎', color: '#8b5cf6',  nextAt: null, label: 'Diamond' },
}

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
}

function completion30(completions: string[]): number {
  const days = last30Days()
  const done = days.filter(d => completions.includes(d)).length
  return Math.round((done / 30) * 100)
}

export default function HabitEvolution() {
  const { toastSuccess } = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [frequency, setFrequency] = useState<Frequency>('daily')

  useEffect(() => {
    try { setHabits(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (h: Habit[]) => {
    setHabits(h)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
  }

  const addHabit = () => {
    if (!name.trim()) return
    const h: Habit = {
      id: Date.now().toString(),
      name,
      emoji,
      frequency,
      completions: [],
      createdAt: new Date().toISOString(),
    }
    save([h, ...habits])
    setName('')
    setEmoji('⭐')
    setFrequency('daily')
    setShowForm(false)
    toastSuccess('Habit added — build the streak!')
  }

  const toggle = (id: string) => {
    const today = todayStr()
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== id) return h
        const has = h.completions.includes(today)
        const completions = has
          ? h.completions.filter(d => d !== today)
          : [today, ...h.completions]
        return { ...h, completions }
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    const h = habits.find(x => x.id === id)
    if (h && !h.completions.includes(today)) {
      toastSuccess(`${h.emoji} ${h.name} — checked off!`)
    }
  }

  const removeHabit = (id: string) => save(habits.filter(h => h.id !== id))

  const today = todayStr()
  const days30 = last30Days()
  const diamondCount = habits.filter(h => getStage(getStreak(h.completions)) === 'Diamond').length
  const avgCompletion = habits.length
    ? Math.round(habits.reduce((s, h) => s + completion30(h.completions), 0) / habits.length)
    : 0

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Repeat className="w-7 h-7 text-teal-400" />
            Habit Evolution
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">From fragile to bulletproof — track how habits evolve.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{habits.length}</div>
          <div className="text-xs text-slate-500">Habits Tracked</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{diamondCount}</div>
          <div className="text-xs text-slate-500">💎 Diamond</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgCompletion}%</div>
          <div className="text-xs text-slate-500">30-day Rate</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(STAGE_CONFIG) as [Stage, typeof STAGE_CONFIG.Seed][]).map(([stage, cfg]) => (
          <div key={stage} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: cfg.color + '18', color: cfg.color }}>
            {cfg.emoji} {cfg.label} {cfg.nextAt ? `(0-${cfg.nextAt - 1}d)` : '(67d+)'}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Habit</h3>
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              className="game-input w-16 text-center text-xl"
              maxLength={2}
            />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Habit name *"
              className="game-input flex-1 text-sm"
              autoFocus
            />
          </div>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value as Frequency)}
            className="game-input w-full text-sm"
          >
            {FREQS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={addHabit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Habit cards */}
      <div className="space-y-4">
        {habits.map(h => {
          const streak = getStreak(h.completions)
          const stage = getStage(streak)
          const cfg = STAGE_CONFIG[stage]
          const doneToday = h.completions.includes(today)
          const comp30 = completion30(h.completions)
          const progressToNext = cfg.nextAt
            ? Math.min(100, Math.round((streak / cfg.nextAt) * 100))
            : 100

          return (
            <div key={h.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${cfg.color}` }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{h.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{h.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                      style={{ background: cfg.color + '22', color: cfg.color }}
                    >
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{streak}d streak</span>
                    </div>
                    <span className="text-xs text-slate-500">{h.frequency}</span>
                    <span className="text-xs text-slate-500">{comp30}% last 30d</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(h.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      doneToday
                        ? 'bg-green-700 text-green-100'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white'
                    }`}
                  >
                    {doneToday ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                  <button onClick={() => removeHabit(h.id)} className="text-slate-700 hover:text-red-400 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stage progress */}
              {cfg.nextAt && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Evolution Streak</span>
                    <span>{streak}/{cfg.nextAt}d to next stage</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${progressToNext}%`, background: cfg.color }}
                    />
                  </div>
                </div>
              )}
              {!cfg.nextAt && (
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <Award className="w-3.5 h-3.5" /> Maximum evolution reached — bulletproof habit!
                </div>
              )}

              {/* 30-day calendar dots — 5 rows × 6 cols */}
              <div>
                <div className="text-xs text-slate-500 mb-1.5">Last 30 days</div>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                  {days30.map(d => {
                    const isFuture = d > today
                    const done = h.completions.includes(d)
                    return (
                      <div
                        key={d}
                        className="w-full aspect-square rounded-full"
                        style={{
                          background: isFuture ? 'transparent' : done ? cfg.color : '#1e293b',
                          border: isFuture ? '1px solid #1e293b' : undefined,
                          opacity: isFuture ? 0.3 : 1,
                        }}
                        title={d}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {habits.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No habits yet. Add your first habit and start evolving.</p>
        </div>
      )}
    </div>
  )
}
