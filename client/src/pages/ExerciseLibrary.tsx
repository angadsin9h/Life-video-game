import { useState, useEffect } from 'react'
import { Dumbbell, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'calisthenics' | 'sport' | 'mind-body' | 'recovery' | 'other'
type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs' | 'glutes' | 'full-body' | 'cardio' | 'other'

interface ExerciseEntry {
  id: string
  name: string
  category: ExerciseCategory
  muscleGroup: MuscleGroup
  sets: number
  reps: string
  weight: string
  duration: number
  notes: string
  prWeight: string
  prReps: string
  isFavorite: boolean
  date: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<ExerciseCategory, { label: string; emoji: string; color: string }> = {
  strength:     { label: 'Strength',     emoji: '🏋️', color: '#ef4444' },
  cardio:       { label: 'Cardio',       emoji: '🏃', color: '#f97316' },
  flexibility:  { label: 'Flexibility',  emoji: '🧘', color: '#22c55e' },
  hiit:         { label: 'HIIT',         emoji: '⚡', color: '#f59e0b' },
  calisthenics: { label: 'Calisthenics', emoji: '🤸', color: '#3b82f6' },
  sport:        { label: 'Sport',        emoji: '⚽', color: '#a855f7' },
  'mind-body':  { label: 'Mind-Body',    emoji: '🌊', color: '#0ea5e9' },
  recovery:     { label: 'Recovery',     emoji: '🛁', color: '#84cc16' },
  other:        { label: 'Other',        emoji: '💪', color: '#94a3b8' },
}

const MUSCLE_CONFIG: Record<MuscleGroup, { label: string; color: string }> = {
  chest:      { label: 'Chest',      color: '#ef4444' },
  back:       { label: 'Back',       color: '#3b82f6' },
  shoulders:  { label: 'Shoulders',  color: '#f97316' },
  arms:       { label: 'Arms',       color: '#a855f7' },
  core:       { label: 'Core',       color: '#f59e0b' },
  legs:       { label: 'Legs',       color: '#22c55e' },
  glutes:     { label: 'Glutes',     color: '#ec4899' },
  'full-body':{ label: 'Full Body',  color: '#6366f1' },
  cardio:     { label: 'Cardio',     color: '#f97316' },
  other:      { label: 'Other',      color: '#94a3b8' },
}

const STORAGE_KEY = 'exercise_library'

export default function ExerciseLibrary() {
  const { toastSuccess } = useToast()
  const [exercises, setExercises] = useState<ExerciseEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<ExerciseCategory | 'all'>('all')
  const [form, setForm] = useState<Omit<ExerciseEntry, 'id' | 'createdAt'>>({
    name: '', category: 'strength', muscleGroup: 'chest', sets: 3,
    reps: '8-12', weight: '', duration: 0, notes: '',
    prWeight: '', prReps: '', isFavorite: false,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setExercises(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ExerciseEntry[]) => { setExercises(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const e: ExerciseEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...exercises])
    setForm(f => ({ ...f, name: '', weight: '', duration: 0, notes: '', prWeight: '', prReps: '', isFavorite: false }))
    setShowForm(false)
    toastSuccess('Exercise logged 💪')
  }

  const favorites = exercises.filter(e => e.isFavorite).length
  const filtered = filterCat === 'all' ? exercises : exercises.filter(e => e.category === filterCat)
  const prs = exercises.filter(e => e.prWeight || e.prReps).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Dumbbell className="w-7 h-7 text-red-400" />
            Exercise Library
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log exercises, track PRs, and build your movement library.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{exercises.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{prs}</div>
          <div className="text-xs text-slate-500">PRs Set</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
        {(Object.entries(CATEGORY_CONFIG) as [ExerciseCategory, typeof CATEGORY_CONFIG.strength][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-400'}`}
            style={filterCat === k ? { background: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Exercise</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Exercise name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExerciseCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CATEGORY_CONFIG) as [ExerciseCategory, typeof CATEGORY_CONFIG.strength][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.muscleGroup} onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value as MuscleGroup }))} className="game-input text-sm flex-1">
              {(Object.entries(MUSCLE_CONFIG) as [MuscleGroup, typeof MUSCLE_CONFIG.chest][]).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Sets</p>
              <input type="number" min={1} value={form.sets} onChange={e => setForm(f => ({ ...f, sets: Number(e.target.value) }))} className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Reps</p>
              <input value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} placeholder="8-12" className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Weight</p>
              <input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="kg/lbs" className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">PR Weight</p>
              <input value={form.prWeight} onChange={e => setForm(f => ({ ...f, prWeight: e.target.value }))} placeholder="Best weight" className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">PR Reps</p>
              <input value={form.prReps} onChange={e => setForm(f => ({ ...f, prReps: e.target.value }))} placeholder="Best reps" className="game-input w-full text-sm" />
            </div>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / form cues" className="game-input w-full text-sm" />
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} />
            ⭐ Favorite exercise
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const c = CATEGORY_CONFIG[e.category]
          const m = MUSCLE_CONFIG[e.muscleGroup]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{e.name}</span>
                  {e.isFavorite && <span className="text-xs text-yellow-400">⭐</span>}
                  <span className="text-xs text-slate-500">{m.label}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{e.sets} sets × {e.reps} reps{e.weight ? ` @ ${e.weight}` : ''}</p>
                {(e.prWeight || e.prReps) && (
                  <p className="text-xs text-yellow-400 mt-0.5">🏆 PR: {e.prWeight || ''}{e.prReps ? ` × ${e.prReps}` : ''}</p>
                )}
                {e.notes && <p className="text-xs text-slate-500 mt-0.5">{e.notes}</p>}
              </div>
              <button onClick={() => save(exercises.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Build your exercise library. Track every rep, every PR.</p>
          </div>
        )}
      </div>
    </div>
  )
}
