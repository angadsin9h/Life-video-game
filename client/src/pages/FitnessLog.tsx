import { useState, useEffect, useMemo } from 'react'
import {
  Dumbbell, Plus, Trash2, Check, Star, TrendingUp, Trophy, X,
  ChevronDown, ChevronUp, RefreshCw, Target, BarChart3, Clock, Flame
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface StrengthExercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
  muscleGroup: string
}

interface CardioExercise {
  id: string
  name: string
  distanceKm: number
  durationMin: number
  avgHeartRate: number
  heartRateZone: 'Zone 1' | 'Zone 2' | 'Zone 3' | 'Zone 4' | 'Zone 5'
}

type WorkoutType = 'Strength' | 'Cardio' | 'HIIT' | 'Yoga' | 'Sports' | 'Other'

interface Exercise {
  id: string
  name: string
  sets?: number
  reps?: number
  weight?: number
  muscleGroup?: string
  distanceKm?: number
  durationMin?: number
  avgHeartRate?: number
  heartRateZone?: string
}

interface WorkoutLog {
  id: string
  date: string
  type: WorkoutType
  durationMin: number
  notes: string
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
}

interface WorkoutTemplate {
  id: string
  name: string
  type: WorkoutType
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
  createdAt: string
}

interface PersonalRecord {
  exerciseName: string
  value: number
  unit: string
  date: string
  type: 'weight' | 'pace'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKOUT_TYPES: WorkoutType[] = ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Sports', 'Other']

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body', 'Other']

const HEART_RATE_ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'] as const

const COMMON_EXERCISES: Record<WorkoutType, string[]> = {
  Strength: ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Overhead Press', 'Barbell Row', 'Bicep Curl', 'Tricep Dip', 'Lunge', 'Plank'],
  Cardio: ['Running', 'Cycling', 'Swimming', 'Jump Rope', 'Rowing', 'Elliptical', 'Stair Climber', 'Walking'],
  HIIT: ['Burpees', 'Mountain Climbers', 'Jumping Jacks', 'High Knees', 'Box Jumps', 'Sprint Intervals'],
  Yoga: ['Sun Salutation', 'Warrior I', 'Warrior II', "Child's Pose", 'Downward Dog', 'Pigeon Pose'],
  Sports: ['Basketball', 'Tennis', 'Soccer', 'Volleyball', 'Swimming Laps', 'Martial Arts'],
  Other: ['Stretching', 'Foam Rolling', 'Mobility Work', 'Balance Training'],
}

const MUSCLE_GROUP_MAP: Record<string, string> = {
  'Bench Press': 'Chest', 'Overhead Press': 'Shoulders', 'Pull-up': 'Back',
  'Barbell Row': 'Back', 'Squat': 'Legs', 'Deadlift': 'Back',
  'Lunge': 'Legs', 'Bicep Curl': 'Biceps', 'Tricep Dip': 'Triceps', 'Plank': 'Core',
}

const TYPE_COLORS: Record<WorkoutType, string> = {
  Strength: 'text-red-400',
  Cardio: 'text-cyan-400',
  HIIT: 'text-orange-400',
  Yoga: 'text-green-400',
  Sports: 'text-yellow-400',
  Other: 'text-slate-400',
}

const TYPE_BG: Record<WorkoutType, string> = {
  Strength: 'bg-red-400/10 border-red-400/20',
  Cardio: 'bg-cyan-400/10 border-cyan-400/20',
  HIIT: 'bg-orange-400/10 border-orange-400/20',
  Yoga: 'bg-green-400/10 border-green-400/20',
  Sports: 'bg-yellow-400/10 border-yellow-400/20',
  Other: 'bg-slate-400/10 border-slate-400/20',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function toKg(weight: number, unit: 'lbs' | 'kg') {
  return unit === 'lbs' ? weight * 0.453592 : weight
}

function relDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calcPaceMinPerKm(distanceKm: number, durationMin: number): number | null {
  if (!distanceKm || !durationMin) return null
  return durationMin / distanceKm
}

function emptyStrengthExercise(): Exercise {
  return { id: uid(), name: '', sets: 3, reps: 10, weight: 0, muscleGroup: 'Other' }
}

function emptyCardioExercise(): Exercise {
  return { id: uid(), name: '', distanceKm: 0, durationMin: 0, avgHeartRate: 0, heartRateZone: 'Zone 2' }
}

function emptyExercise(type: WorkoutType): Exercise {
  if (type === 'Cardio') return emptyCardioExercise()
  return emptyStrengthExercise()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsBar({ logs }: { logs: WorkoutLog[] }) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const weekStart = (() => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay())
    return d.toISOString().split('T')[0]
  })()

  const workoutsThisMonth = logs.filter(l => l.date >= monthStart).length

  const weekVolume = logs
    .filter(l => l.date >= weekStart)
    .flatMap(l => l.exercises)
    .reduce((sum, ex) => {
      if (ex.sets && ex.reps && ex.weight) {
        return sum + ex.sets * ex.reps * ex.weight
      }
      return sum
    }, 0)

  const muscleGroupCounts: Record<string, number> = {}
  logs.flatMap(l => l.exercises).forEach(ex => {
    if (ex.muscleGroup) {
      muscleGroupCounts[ex.muscleGroup] = (muscleGroupCounts[ex.muscleGroup] || 0) + 1
    }
  })
  const topMuscle = Object.entries(muscleGroupCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="game-card p-4 text-center">
        <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
          {workoutsThisMonth}
        </div>
        <div className="text-xs text-slate-500 mt-1">Workouts This Month</div>
      </div>
      <div className="game-card p-4 text-center">
        <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
          {weekVolume > 0 ? `${Math.round(weekVolume).toLocaleString()}` : '—'}
        </div>
        <div className="text-xs text-slate-500 mt-1">Volume This Week</div>
      </div>
      <div className="game-card p-4 text-center">
        <div className="text-lg font-bold text-green-400 truncate" style={{ fontFamily: 'Orbitron, monospace' }}>
          {topMuscle ? topMuscle[0] : '—'}
        </div>
        <div className="text-xs text-slate-500 mt-1">Most Trained</div>
      </div>
    </div>
  )
}

function ExerciseRow({
  ex, idx, type, unit, exerciseHistory,
  onChange, onRemove
}: {
  ex: Exercise
  idx: number
  type: WorkoutType
  unit: 'lbs' | 'kg'
  exerciseHistory: string[]
  onChange: (id: string, field: keyof Exercise, val: string | number) => void
  onRemove: (id: string) => void
}) {
  const isCardio = type === 'Cardio'
  const inputClass = 'game-input text-sm w-full'
  const listId = `ex-list-${idx}`

  return (
    <div className="bg-slate-900/60 rounded-xl p-3 space-y-2 border border-slate-700/50">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            list={listId}
            value={ex.name}
            onChange={e => onChange(ex.id, 'name', e.target.value)}
            placeholder="Exercise name"
            className={inputClass}
          />
          <datalist id={listId}>
            {exerciseHistory.map(h => <option key={h} value={h} />)}
          </datalist>
        </div>
        <button
          onClick={() => onRemove(ex.id)}
          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isCardio ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Distance (km)</label>
            <input
              type="number" step="0.1" min="0"
              value={ex.distanceKm || ''}
              onChange={e => onChange(ex.id, 'distanceKm', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Duration (min)</label>
            <input
              type="number" min="0"
              value={ex.durationMin || ''}
              onChange={e => onChange(ex.id, 'durationMin', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Avg HR (bpm)</label>
            <input
              type="number" min="0"
              value={ex.avgHeartRate || ''}
              onChange={e => onChange(ex.id, 'avgHeartRate', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">HR Zone</label>
            <select
              value={ex.heartRateZone || 'Zone 2'}
              onChange={e => onChange(ex.id, 'heartRateZone', e.target.value)}
              className={inputClass}
            >
              {HEART_RATE_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          {ex.distanceKm && ex.durationMin ? (
            <div className="col-span-2 text-xs text-cyan-400 text-center">
              Pace: {(ex.durationMin / ex.distanceKm).toFixed(1)} min/km
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Sets</label>
            <input
              type="number" min="1"
              value={ex.sets || ''}
              onChange={e => onChange(ex.id, 'sets', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Reps</label>
            <input
              type="number" min="1"
              value={ex.reps || ''}
              onChange={e => onChange(ex.id, 'reps', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Weight ({unit})</label>
            <input
              type="number" step="0.5" min="0"
              value={ex.weight || ''}
              onChange={e => onChange(ex.id, 'weight', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Muscle</label>
            <select
              value={ex.muscleGroup || 'Other'}
              onChange={e => onChange(ex.id, 'muscleGroup', e.target.value)}
              className={inputClass}
            >
              {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FitnessLog() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]

  // State
  const [logs, setLogs] = useState<WorkoutLog[]>(() => {
    try { return JSON.parse(localStorage.getItem('fitness_log') || '[]') } catch { return [] }
  })
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() => {
    try { return JSON.parse(localStorage.getItem('fitness_templates') || '[]') } catch { return [] }
  })

  const [view, setView] = useState<'log' | 'records' | 'volume' | 'templates'>('log')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [templateNameInput, setTemplateNameInput] = useState('')
  const [showTemplateSave, setShowTemplateSave] = useState(false)

  // Form state
  const [formDate, setFormDate] = useState(today)
  const [formType, setFormType] = useState<WorkoutType>('Strength')
  const [formDuration, setFormDuration] = useState(45)
  const [formNotes, setFormNotes] = useState('')
  const [formUnit, setFormUnit] = useState<'lbs' | 'kg'>('lbs')
  const [formExercises, setFormExercises] = useState<Exercise[]>([emptyExercise('Strength')])

  // Persist
  useEffect(() => { localStorage.setItem('fitness_log', JSON.stringify(logs)) }, [logs])
  useEffect(() => { localStorage.setItem('fitness_templates', JSON.stringify(templates)) }, [templates])

  // Exercise history from past logs for datalist suggestions
  const exerciseHistory = useMemo(() => {
    const names = new Set<string>()
    logs.forEach(l => l.exercises.forEach(ex => { if (ex.name) names.add(ex.name) }))
    COMMON_EXERCISES[formType].forEach(n => names.add(n))
    return Array.from(names).sort()
  }, [logs, formType])

  // Personal records
  const personalRecords = useMemo((): PersonalRecord[] => {
    const weightMap: Record<string, { value: number; date: string }> = {}
    const paceMap: Record<string, { value: number; date: string }> = {}

    logs.forEach(log => {
      log.exercises.forEach(ex => {
        if (!ex.name) return
        if (ex.weight && ex.weight > 0) {
          const weightKg = toKg(ex.weight, log.weightUnit)
          if (!weightMap[ex.name] || weightKg > weightMap[ex.name].value) {
            weightMap[ex.name] = { value: weightKg, date: log.date }
          }
        }
        if (ex.distanceKm && ex.durationMin) {
          const pace = calcPaceMinPerKm(ex.distanceKm, ex.durationMin)
          if (pace !== null) {
            if (!paceMap[ex.name] || pace < paceMap[ex.name].value) {
              paceMap[ex.name] = { value: pace, date: log.date }
            }
          }
        }
      })
    })

    const records: PersonalRecord[] = []
    Object.entries(weightMap).forEach(([name, rec]) => {
      records.push({ exerciseName: name, value: Math.round(rec.value * 10) / 10, unit: 'kg', date: rec.date, type: 'weight' })
    })
    Object.entries(paceMap).forEach(([name, rec]) => {
      records.push({ exerciseName: name, value: Math.round(rec.value * 10) / 10, unit: 'min/km', date: rec.date, type: 'pace' })
    })
    return records.sort((a, b) => b.date.localeCompare(a.date))
  }, [logs])

  // Weekly volume by muscle group
  const weeklyVolume = useMemo(() => {
    const weekStart = (() => {
      const d = new Date()
      d.setDate(d.getDate() - d.getDay())
      return d.toISOString().split('T')[0]
    })()

    const vol: Record<string, number> = {}
    logs.filter(l => l.date >= weekStart).forEach(log => {
      log.exercises.forEach(ex => {
        if (ex.sets && ex.reps && ex.weight) {
          const group = ex.muscleGroup || 'Other'
          const weightKg = toKg(ex.weight, log.weightUnit)
          vol[group] = (vol[group] || 0) + ex.sets * ex.reps * weightKg
        }
      })
    })
    return Object.entries(vol).sort((a, b) => b[1] - a[1])
  }, [logs])

  const maxVolume = weeklyVolume.length > 0 ? weeklyVolume[0][1] : 1

  // Handlers
  const handleTypeChange = (t: WorkoutType) => {
    setFormType(t)
    setFormExercises([emptyExercise(t)])
  }

  const addExercise = () => {
    setFormExercises(prev => [...prev, emptyExercise(formType)])
  }

  const updateExercise = (id: string, field: keyof Exercise, val: string | number) => {
    setFormExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: val } : ex))
  }

  const removeExercise = (id: string) => {
    setFormExercises(prev => prev.filter(ex => ex.id !== id))
  }

  const addQuickExercise = (name: string) => {
    const autoGroup = MUSCLE_GROUP_MAP[name] || 'Other'
    const ex = formType === 'Cardio'
      ? { ...emptyCardioExercise(), name }
      : { ...emptyStrengthExercise(), name, muscleGroup: autoGroup }
    setFormExercises(prev => {
      const emptyIdx = prev.findIndex(e => !e.name)
      if (emptyIdx >= 0) {
        return prev.map((e, i) => i === emptyIdx ? ex : e)
      }
      return [...prev, ex]
    })
  }

  const checkForNewPRs = (newLog: WorkoutLog) => {
    newLog.exercises.forEach(ex => {
      if (!ex.name) return

      if (ex.weight && ex.weight > 0) {
        const weightKg = toKg(ex.weight, newLog.weightUnit)
        const existing = personalRecords.find(pr => pr.exerciseName === ex.name && pr.type === 'weight')
        if (!existing || weightKg > existing.value) {
          toastSuccess(`New PR! ${ex.name}`, `${Math.round(weightKg * 10) / 10} kg — personal best!`)
        }
      }

      if (ex.distanceKm && ex.durationMin) {
        const pace = calcPaceMinPerKm(ex.distanceKm, ex.durationMin)
        if (pace !== null) {
          const existing = personalRecords.find(pr => pr.exerciseName === ex.name && pr.type === 'pace')
          if (!existing || pace < existing.value) {
            toastSuccess(`New PR! ${ex.name}`, `${pace.toFixed(2)} min/km — fastest pace!`)
          }
        }
      }
    })
  }

  const saveWorkout = () => {
    const validExercises = formExercises.filter(ex => ex.name.trim())
    const newLog: WorkoutLog = {
      id: uid(),
      date: formDate,
      type: formType,
      durationMin: formDuration,
      notes: formNotes,
      exercises: validExercises,
      weightUnit: formUnit,
    }
    checkForNewPRs(newLog)
    setLogs(prev => [newLog, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
    toastSuccess('Workout logged!', `${formType} · ${formDuration} min`)
    resetForm()
  }

  const resetForm = () => {
    setShowForm(false)
    setFormDate(today)
    setFormType('Strength')
    setFormDuration(45)
    setFormNotes('')
    setFormUnit('lbs')
    setFormExercises([emptyExercise('Strength')])
    setShowTemplateSave(false)
    setTemplateNameInput('')
  }

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const saveAsTemplate = () => {
    if (!templateNameInput.trim()) return
    const t: WorkoutTemplate = {
      id: uid(),
      name: templateNameInput.trim(),
      type: formType,
      exercises: formExercises.filter(ex => ex.name.trim()),
      weightUnit: formUnit,
      createdAt: new Date().toISOString(),
    }
    setTemplates(prev => [t, ...prev])
    toastSuccess('Template saved!', templateNameInput.trim())
    setShowTemplateSave(false)
    setTemplateNameInput('')
  }

  const loadTemplate = (t: WorkoutTemplate) => {
    setFormType(t.type)
    setFormUnit(t.weightUnit)
    setFormExercises(t.exercises.map(ex => ({ ...ex, id: uid() })))
    setShowForm(true)
    toastSuccess('Template loaded!', t.name)
  }

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const suggestions = COMMON_EXERCISES[formType].slice(0, 6)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-white flex items-center gap-3"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Dumbbell className="w-8 h-8 text-red-400" />
            Fitness Log
          </h1>
          <p className="text-slate-400 mt-1">Track workouts, hit PRs, build volume</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) setExpandedId(null) }}
          className="game-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Workout
        </button>
      </div>

      {/* Stats */}
      <StatsBar logs={logs} />

      {/* View tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {([
          ['log', 'Workouts', Dumbbell],
          ['records', 'PRs', Trophy],
          ['volume', 'Volume', BarChart3],
          ['templates', 'Templates', RefreshCw],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setView(key as typeof view)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              view === key
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200">Log Workout</h3>
            <button onClick={resetForm} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="game-input text-sm w-full"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Duration (min)</label>
              <input
                type="number" min="1"
                value={formDuration}
                onChange={e => setFormDuration(parseInt(e.target.value) || 0)}
                className="game-input text-sm w-full"
              />
            </div>
          </div>

          {/* Workout type */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Workout Type</label>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    formType === t
                      ? `${TYPE_BG[t]} ${TYPE_COLORS[t]}`
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Weight unit toggle (for strength) */}
          {formType !== 'Cardio' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Weight unit:</span>
              <button
                onClick={() => setFormUnit(u => u === 'lbs' ? 'kg' : 'lbs')}
                className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition-colors border border-slate-600"
              >
                <RefreshCw className="w-3 h-3" />
                {formUnit}
              </button>
            </div>
          )}

          {/* Quick-add exercise buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Exercises</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => addQuickExercise(s)}
                    className="text-xs px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 rounded transition-colors"
                  >
                    +{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {formExercises.map((ex, idx) => (
                <ExerciseRow
                  key={ex.id}
                  ex={ex}
                  idx={idx}
                  type={formType}
                  unit={formUnit}
                  exerciseHistory={exerciseHistory}
                  onChange={updateExercise}
                  onRemove={removeExercise}
                />
              ))}
            </div>

            <button
              onClick={addExercise}
              className="mt-2 w-full py-2 border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes (optional)</label>
            <textarea
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="How did it go?"
              rows={2}
              className="game-input text-sm w-full resize-none"
            />
          </div>

          {/* Template save */}
          {showTemplateSave ? (
            <div className="flex gap-2">
              <input
                value={templateNameInput}
                onChange={e => setTemplateNameInput(e.target.value)}
                placeholder="Template name..."
                className="game-input text-sm flex-1"
                onKeyDown={e => e.key === 'Enter' && saveAsTemplate()}
              />
              <button onClick={saveAsTemplate} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setShowTemplateSave(false)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-sm transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTemplateSave(true)}
              className="w-full py-2 border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-violet-500 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" /> Save as Template
            </button>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={saveWorkout}
              disabled={formExercises.every(ex => !ex.name.trim()) && formDuration === 0}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Workout
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* VIEW: Workouts log */}
      {view === 'log' && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No workouts logged yet.</p>
              <p className="text-xs mt-1 text-slate-600">Hit the gym and start tracking your gains!</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="game-card overflow-hidden">
                <button
                  className="w-full p-4 text-left"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${TYPE_BG[log.type]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_BG[log.type]} ${TYPE_COLORS[log.type]}`}>
                          {log.type}
                        </span>
                        <span className="text-sm font-semibold text-slate-200">{relDate(log.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.durationMin} min
                        </span>
                        {log.exercises.length > 0 && (
                          <span>{log.exercises.length} exercise{log.exercises.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); deleteLog(log.id) }}
                        className="text-slate-700 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedId === log.id
                        ? <ChevronUp className="w-4 h-4 text-slate-500" />
                        : <ChevronDown className="w-4 h-4 text-slate-500" />
                      }
                    </div>
                  </div>
                </button>

                {expandedId === log.id && (
                  <div className="px-4 pb-4 border-t border-slate-700/50 space-y-2 pt-3">
                    {log.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{ex.name}</span>
                        <span className="text-slate-500 text-xs">
                          {log.type === 'Cardio'
                            ? `${ex.distanceKm ?? 0} km · ${ex.durationMin ?? 0} min${ex.avgHeartRate ? ` · ${ex.avgHeartRate} bpm` : ''}`
                            : ex.weight
                              ? `${ex.sets}×${ex.reps} @ ${ex.weight}${log.weightUnit}`
                              : `${ex.sets}×${ex.reps}`
                          }
                        </span>
                      </div>
                    ))}
                    {log.notes && <p className="text-xs text-slate-500 italic pt-1">{log.notes}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW: Personal Records */}
      {view === 'records' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Personal Records
          </h2>
          {personalRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Log workouts to start tracking PRs</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {personalRecords.map((pr, i) => (
                <div key={i} className="game-card p-4">
                  <div className="flex items-start gap-2">
                    {pr.type === 'weight'
                      ? <Dumbbell className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      : <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    }
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-300 truncate">{pr.exerciseName}</div>
                      <div className="text-lg font-bold text-yellow-400 mt-0.5" style={{ fontFamily: 'Orbitron, monospace' }}>
                        {pr.value} {pr.unit}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{relDate(pr.date)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: Weekly Volume */}
      {view === 'volume' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            Weekly Volume by Muscle Group
          </h2>
          {weeklyVolume.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No strength data this week</p>
            </div>
          ) : (
            <div className="game-card p-5 space-y-4">
              {weeklyVolume.map(([group, vol]) => (
                <div key={group}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 font-medium">{group}</span>
                    <span className="text-slate-400 text-xs font-mono">{Math.round(vol).toLocaleString()} kg·reps</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill bg-gradient-to-r from-violet-600 to-violet-400"
                      style={{ width: `${(vol / maxVolume) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-600 text-right mt-2">Volume = sets × reps × weight (kg)</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Templates */}
      {view === 'templates' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-400" />
            Workout Templates
          </h2>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No templates yet</p>
              <p className="text-xs mt-1 text-slate-600">Log a workout and save it as a template for quick reuse</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="game-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-200 text-sm">{t.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${TYPE_BG[t.type]} ${TYPE_COLORS[t.type]}`}>
                          {t.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {t.exercises.length} exercise{t.exercises.length !== 1 ? 's' : ''}
                        {t.exercises.length > 0 && (
                          <span className="ml-2 text-slate-600">
                            {t.exercises.slice(0, 3).map(ex => ex.name).join(', ')}
                            {t.exercises.length > 3 ? '…' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadTemplate(t)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Load
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => { setView('log'); setShowForm(true) }}
              className="text-xs text-slate-500 hover:text-violet-400 transition-colors flex items-center gap-1 mx-auto"
            >
              <Plus className="w-3 h-3" /> Log a workout to save as template
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
