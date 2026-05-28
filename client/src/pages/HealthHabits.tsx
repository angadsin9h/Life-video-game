import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type HabitDomain = 'movement' | 'nutrition' | 'sleep' | 'mental' | 'social' | 'preventive' | 'recovery' | 'dental' | 'skin' | 'other'
type HabitFrequency = 'daily' | '5x-week' | '3x-week' | 'weekly' | 'monthly'

interface HealthHabit {
  id: string
  domain: HabitDomain
  frequency: HabitFrequency
  name: string
  why: string
  how: string
  bestTime: string
  streak: number
  completedToday: boolean
  totalCompletions: number
  lastCompleted: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<HabitDomain, { label: string; emoji: string; color: string }> = {
  movement:   { label: 'Movement',    emoji: '🏃', color: '#ef4444' },
  nutrition:  { label: 'Nutrition',   emoji: '🥗', color: '#22c55e' },
  sleep:      { label: 'Sleep',       emoji: '😴', color: '#6366f1' },
  mental:     { label: 'Mental',      emoji: '🧠', color: '#a855f7' },
  social:     { label: 'Social',      emoji: '👥', color: '#3b82f6' },
  preventive: { label: 'Preventive',  emoji: '🛡️', color: '#f59e0b' },
  recovery:   { label: 'Recovery',    emoji: '♻️', color: '#0ea5e9' },
  dental:     { label: 'Dental',      emoji: '🦷', color: '#84cc16' },
  skin:       { label: 'Skin',        emoji: '✨', color: '#ec4899' },
  other:      { label: 'Other',       emoji: '💊', color: '#94a3b8' },
}

const FREQ_CONFIG: Record<HabitFrequency, { label: string }> = {
  daily:      { label: 'Daily'     },
  '5x-week':  { label: '5x/week'  },
  '3x-week':  { label: '3x/week'  },
  weekly:     { label: 'Weekly'    },
  monthly:    { label: 'Monthly'   },
}

const STORAGE_KEY = 'health_habits'

export default function HealthHabits() {
  const { toastSuccess } = useToast()
  const [habits, setHabits] = useState<HealthHabit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [form, setForm] = useState<Omit<HealthHabit, 'id' | 'createdAt'>>({
    domain: 'movement', frequency: 'daily', name: '', why: '', how: '',
    bestTime: '', streak: 0, completedToday: false, totalCompletions: 0, lastCompleted: '',
  })

  useEffect(() => {
    try { setHabits(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: HealthHabit[]) => { setHabits(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const h: HealthHabit = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([h, ...habits])
    setForm(f => ({ ...f, name: '', why: '', how: '', bestTime: '' }))
    setShowForm(false)
    toastSuccess('Health habit added 🏃')
  }

  const checkOff = (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    save(habits.map(h => {
      if (h.id !== id || h.completedToday) return h
      const newStreak = h.lastCompleted === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? h.streak + 1 : 1
      return { ...h, completedToday: true, totalCompletions: h.totalCompletions + 1, streak: newStreak, lastCompleted: today }
    }))
    toastSuccess('Health habit done! 🎉')
  }

  const resetDay = () => {
    save(habits.map(h => ({ ...h, completedToday: false })))
  }

  const filtered = habits.filter(h => filterDomain === 'all' || h.domain === filterDomain)
  const completedToday = habits.filter(h => h.completedToday).length
  const avgStreak = habits.length ? Math.round(habits.reduce((s, h) => s + h.streak, 0) / habits.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-green-400" />
            Health Habits
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Daily health actions that compound into a vibrant life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completedToday}/{habits.length}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgStreak}d</div>
          <div className="text-xs text-slate-500">Avg Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{habits.length}</div>
          <div className="text-xs text-slate-500">Habits</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterDomain('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(DOMAIN_CONFIG) as [HabitDomain, typeof DOMAIN_CONFIG.movement][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterDomain(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterDomain === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Health Habit</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as HabitDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [HabitDomain, typeof DOMAIN_CONFIG.movement][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as HabitFrequency }))} className="game-input text-sm flex-1">
              {(Object.entries(FREQ_CONFIG) as [HabitFrequency, typeof FREQ_CONFIG.daily][]).map(([k, fr]) => (
                <option key={k} value={k}>{fr.label}</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Health habit *" className="game-input w-full" autoFocus />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why is this important to you?" className="game-input w-full text-sm" />
          <input value={form.how} onChange={e => setForm(f => ({ ...f, how: e.target.value }))}
            placeholder="How exactly will you do it?" className="game-input w-full text-sm" />
          <input value={form.bestTime} onChange={e => setForm(f => ({ ...f, bestTime: e.target.value }))}
            placeholder="Best time of day (e.g. 7am, after lunch)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {habits.length > 0 && (
        <button onClick={resetDay} className="text-xs text-slate-600 hover:text-slate-400">Reset today's completions</button>
      )}

      <div className="space-y-2">
        {filtered.map(h => {
          const d = DOMAIN_CONFIG[h.domain]
          return (
            <div key={h.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${h.completedToday ? '#22c55e' : d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${h.completedToday ? 'text-green-400 line-through' : 'text-white'}`}>{h.name}</span>
                  {h.streak > 0 && <span className="text-xs text-orange-400">🔥{h.streak}</span>}
                </div>
                <p className="text-xs text-slate-500">{d.label} · {FREQ_CONFIG[h.frequency].label}{h.bestTime ? ` · ${h.bestTime}` : ''}</p>
              </div>
              <div className="flex gap-2 items-center">
                {!h.completedToday ? (
                  <button onClick={() => checkOff(h.id)}
                    className="px-2 py-1 bg-green-700/30 text-green-400 rounded-lg text-xs">Done</button>
                ) : (
                  <span className="text-green-400 text-xs">✓</span>
                )}
                <button onClick={() => save(habits.filter(x => x.id !== h.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Small health actions compounded daily transform your body and mind.</p>
          </div>
        )}
      </div>
    </div>
  )
}
