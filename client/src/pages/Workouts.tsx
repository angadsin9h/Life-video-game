import { useEffect, useState } from 'react'
import axios from 'axios'
import { Dumbbell, Plus, Trash2, Trophy, ChevronDown, ChevronUp, X } from 'lucide-react'

interface Exercise {
  id?: number
  exercise: string
  sets: number
  reps: number
  weight_kg: number
  duration_seconds: number
  notes: string
}

interface WorkoutSession {
  id: number
  date: string
  name: string
  type: string
  duration_minutes: number
  notes: string
  exercises: Exercise[]
}

interface PersonalRecord {
  exercise: string
  sets: number
  reps: number
  weight_kg: number
  date: string
}

const WORKOUT_TYPES = ['strength', 'cardio', 'hiit', 'yoga', 'stretching', 'sports', 'other']
const COMMON_EXERCISES = {
  strength: ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Overhead Press', 'Row', 'Bicep Curl', 'Tricep Dip', 'Lunges', 'Plank'],
  cardio: ['Running', 'Cycling', 'Swimming', 'Jump Rope', 'Rowing', 'Elliptical'],
  hiit: ['Burpees', 'Mountain Climbers', 'Jumping Jacks', 'High Knees', 'Box Jumps'],
  yoga: ['Sun Salutation', 'Warrior I', 'Warrior II', 'Child\'s Pose', 'Downward Dog'],
}

function fmtDuration(mins: number): string {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

function fmtSecs(s: number): string {
  if (!s) return ''
  return s >= 60 ? `${Math.floor(s / 60)}m${s % 60 ? String(s % 60).padStart(2, '0') + 's' : ''}` : `${s}s`
}

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const emptyExercise = (): Exercise => ({ exercise: '', sets: 3, reps: 10, weight_kg: 0, duration_seconds: 0, notes: '' })

export default function Workouts() {
  const today = new Date().toISOString().split('T')[0]
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showRecords, setShowRecords] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    date: today,
    name: '',
    type: 'strength',
    duration_minutes: 45,
    notes: '',
  })
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()])

  const load = async () => {
    const [sessRes, recRes] = await Promise.all([
      axios.get<WorkoutSession[]>('/api/workouts'),
      axios.get<PersonalRecord[]>('/api/workouts/personal-records'),
    ])
    setSessions(sessRes.data)
    setRecords(recRes.data)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const addExercise = () => setExercises(prev => [...prev, emptyExercise()])

  const updateExercise = (idx: number, field: keyof Exercise, val: string | number) => {
    setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: val } : ex))
  }

  const removeExercise = (idx: number) => setExercises(prev => prev.filter((_, i) => i !== idx))

  const submit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const validExercises = exercises.filter(ex => ex.exercise.trim())
      await axios.post('/api/workouts', { ...form, exercises: validExercises })
      setShowForm(false)
      setForm({ date: today, name: '', type: 'strength', duration_minutes: 45, notes: '' })
      setExercises([emptyExercise()])
      await load()
    } finally { setSubmitting(false) }
  }

  const deleteSession = async (id: number) => {
    await axios.delete(`/api/workouts/${id}`)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const typeColor: Record<string, string> = {
    strength: 'text-red-400', cardio: 'text-cyan-400', hiit: 'text-orange-400',
    yoga: 'text-green-400', stretching: 'text-teal-400', sports: 'text-yellow-400', other: 'text-slate-400',
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  const suggestions = COMMON_EXERCISES[form.type as keyof typeof COMMON_EXERCISES] || []

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Dumbbell className="w-8 h-8 text-red-400" />
            Workouts
          </h1>
          <p className="text-slate-400 mt-1">Log your training sessions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRecords(!showRecords)}
            className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
            title="Personal Records"
          >
            <Trophy className="w-5 h-5" />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="game-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Workout
          </button>
        </div>
      </div>

      {/* Personal records */}
      {showRecords && records.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Personal Records
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {records.slice(0, 10).map(r => (
              <div key={r.exercise} className="bg-slate-800 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-300">{r.exercise}</div>
                <div className="text-sm font-bold text-yellow-400 mt-0.5">
                  {r.weight_kg > 0 ? `${r.weight_kg}kg × ${r.reps}` : r.reps > 0 ? `${r.sets}×${r.reps}` : '—'}
                </div>
                <div className="text-xs text-slate-600">{relativeDate(r.date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/30">
          <h3 className="font-semibold text-slate-200">Log Workout</h3>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Workout name *"
              className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            >
              {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                placeholder="Duration (min)"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">min</span>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-400">Exercises</h4>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {suggestions.slice(0, 5).map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        const lastEmpty = exercises.findIndex(ex => !ex.exercise)
                        if (lastEmpty >= 0) updateExercise(lastEmpty, 'exercise', s)
                        else setExercises(prev => [...prev, { ...emptyExercise(), exercise: s }])
                      }}
                      className="text-xs px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded transition-colors"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {exercises.map((ex, idx) => (
              <div key={idx} className="bg-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ex.exercise}
                    onChange={e => updateExercise(idx, 'exercise', e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button onClick={() => removeExercise(idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {form.type !== 'cardio' && (
                    <>
                      <div>
                        <label className="text-xs text-slate-600">Sets</label>
                        <input type="number" value={ex.sets || ''} onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Reps</label>
                        <input type="number" value={ex.reps || ''} onChange={e => updateExercise(idx, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Weight (kg)</label>
                        <input type="number" step="0.5" value={ex.weight_kg || ''} onChange={e => updateExercise(idx, 'weight_kg', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none" />
                      </div>
                    </>
                  )}
                  {(form.type === 'cardio' || form.type === 'yoga' || form.type === 'stretching') && (
                    <div className="col-span-3">
                      <label className="text-xs text-slate-600">Duration (seconds)</label>
                      <input type="number" value={ex.duration_seconds || ''} onChange={e => updateExercise(idx, 'duration_seconds', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button onClick={addExercise} className="w-full py-2 border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={submit} disabled={submitting || !form.name.trim()} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
              {submitting ? 'Saving…' : 'Save Workout'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No workouts logged yet. Hit the gym and track your gains!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} className="game-card overflow-hidden">
              <button
                className="w-full p-4 text-left"
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-slate-200`}>{session.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full bg-slate-700 ${typeColor[session.type] ?? 'text-slate-400'}`}>
                        {session.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{relativeDate(session.date)}</span>
                      {session.duration_minutes > 0 && <span>{fmtDuration(session.duration_minutes)}</span>}
                      {session.exercises.length > 0 && <span>{session.exercises.length} exercise{session.exercises.length > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); deleteSession(session.id) }} className="text-slate-700 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedId === session.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>
              </button>

              {expandedId === session.id && session.exercises.length > 0 && (
                <div className="px-4 pb-4 border-t border-slate-700/50">
                  <div className="mt-3 space-y-1.5">
                    {session.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-slate-300 flex-1">{ex.exercise}</span>
                        <span className="text-slate-500 text-xs">
                          {ex.weight_kg > 0 ? `${ex.sets}×${ex.reps} @ ${ex.weight_kg}kg`
                            : ex.sets > 0 && ex.reps > 0 ? `${ex.sets}×${ex.reps}`
                            : ex.duration_seconds > 0 ? fmtSecs(ex.duration_seconds)
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  {session.notes && <p className="mt-2 text-xs text-slate-500 italic">{session.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
