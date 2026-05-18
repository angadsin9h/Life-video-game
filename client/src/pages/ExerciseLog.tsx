import { useState, useEffect } from 'react'
import { Dumbbell, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExerciseType = 'cardio' | 'strength' | 'yoga' | 'sports' | 'hiit' | 'cycling' | 'swimming' | 'walk' | 'stretch' | 'other'
type Intensity = 'low' | 'moderate' | 'high' | 'max'

interface ExerciseEntry {
  id: string
  date: string
  type: ExerciseType
  exercise: string
  duration: number
  intensity: Intensity
  calories: number
  sets: string
  distance: number
  heartRate: number
  notes: string
  mood: number
  createdAt: string
}

const TYPE_CONFIG: Record<ExerciseType, { label: string; emoji: string; color: string }> = {
  cardio:    { label: 'Cardio',     emoji: '🏃', color: '#ef4444' },
  strength:  { label: 'Strength',   emoji: '🏋️', color: '#6366f1' },
  yoga:      { label: 'Yoga',       emoji: '🧘', color: '#a855f7' },
  sports:    { label: 'Sports',     emoji: '⚽', color: '#22c55e' },
  hiit:      { label: 'HIIT',       emoji: '⚡', color: '#f97316' },
  cycling:   { label: 'Cycling',    emoji: '🚴', color: '#3b82f6' },
  swimming:  { label: 'Swimming',   emoji: '🏊', color: '#0ea5e9' },
  walk:      { label: 'Walk',       emoji: '🚶', color: '#84cc16' },
  stretch:   { label: 'Stretch',    emoji: '🤸', color: '#ec4899' },
  other:     { label: 'Other',      emoji: '💪', color: '#94a3b8' },
}

const INTENSITY_CONFIG: Record<Intensity, { label: string; color: string }> = {
  low:      { label: 'Low',      color: '#22c55e' },
  moderate: { label: 'Moderate', color: '#f59e0b' },
  high:     { label: 'High',     color: '#f97316' },
  max:      { label: 'Max',      color: '#ef4444' },
}

const STORAGE_KEY = 'exercise_log'

export default function ExerciseLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<ExerciseEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'cardio', exercise: '', duration: 30, intensity: 'moderate',
    calories: 0, sets: '', distance: 0, heartRate: 0, notes: '', mood: 7,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ExerciseEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.exercise.trim()) return
    const e: ExerciseEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], type: 'cardio', exercise: '', duration: 30, intensity: 'moderate', calories: 0, sets: '', distance: 0, heartRate: 0, notes: '', mood: 7 })
    setShowForm(false)
    toastSuccess('Workout logged 💪')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const thisWeek = entries.filter(e => {
    const d = new Date(e.date)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })
  const weekMinutes = thisWeek.reduce((s, e) => s + e.duration, 0)
  const totalCalories = thisWeek.reduce((s, e) => s + e.calories, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Dumbbell className="w-7 h-7 text-orange-400" />
            Exercise Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Every workout counts. Log them all.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{thisWeek.length}</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{Math.round(weekMinutes / 60 * 10) / 10}h</div>
          <div className="text-xs text-slate-500">Active Time</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{totalCalories > 0 ? totalCalories : '—'}</div>
          <div className="text-xs text-slate-500">Calories</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Workout</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ExerciseType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ExerciseType, typeof TYPE_CONFIG.cardio][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.exercise} onChange={e => setForm(f => ({ ...f, exercise: e.target.value }))}
            placeholder="Exercise name *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration (min)</p>
              <input type="number" value={form.duration || ''} min={1}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Calories</p>
              <input type="number" value={form.calories || ''} min={0}
                onChange={e => setForm(f => ({ ...f, calories: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            {(Object.entries(INTENSITY_CONFIG) as [Intensity, typeof INTENSITY_CONFIG.moderate][]).map(([k, i]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, intensity: k }))}
                className={`flex-1 py-1.5 rounded-xl text-xs ${form.intensity === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.intensity === k ? { background: i.color + '30', color: i.color } : {}}>
                {i.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))}
              placeholder="Sets/reps (e.g. 3x10)" className="game-input flex-1 text-sm" />
            <input type="number" value={form.heartRate || ''} min={0}
              onChange={e => setForm(f => ({ ...f, heartRate: Number(e.target.value) }))}
              placeholder="Avg HR" className="game-input w-24 text-sm" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const i = INTENSITY_CONFIG[e.intensity]
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{e.exercise}</span>
                  <span className="text-xs" style={{ color: i.color }}>{i.label}</span>
                </div>
                <p className="text-xs text-slate-500">{e.date} · {e.duration}min{e.calories > 0 && ` · ${e.calories}cal`}{e.sets && ` · ${e.sets}`}</p>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log every workout. Your future self will thank you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
