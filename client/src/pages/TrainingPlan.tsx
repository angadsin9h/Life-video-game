import { useState, useEffect } from 'react'
import { Dumbbell, Plus, Trash2, ChevronDown, ChevronUp, Check, RotateCcw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SplitType = 'PPL' | 'UpperLower' | 'FullBody' | 'Custom'
type DayStatus = 'pending' | 'done' | 'skipped'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  notes: string
}

interface TrainingDay {
  id: string
  label: string
  focus: string
  exercises: Exercise[]
}

interface TrainingWeek {
  id: string
  weekNum: number
  days: TrainingDay[]
  completions: Record<string, DayStatus>
}

interface Plan {
  id: string
  name: string
  split: SplitType
  goal: string
  weeks: TrainingWeek[]
  createdAt: string
}

const SPLIT_TEMPLATES: Record<SplitType, { label: string; days: { label: string; focus: string }[] }> = {
  PPL: {
    label: 'Push / Pull / Legs',
    days: [
      { label: 'Day 1', focus: 'Push' },
      { label: 'Day 2', focus: 'Pull' },
      { label: 'Day 3', focus: 'Legs' },
      { label: 'Day 4', focus: 'Push' },
      { label: 'Day 5', focus: 'Pull' },
      { label: 'Day 6', focus: 'Legs' },
    ],
  },
  UpperLower: {
    label: 'Upper / Lower',
    days: [
      { label: 'Day 1', focus: 'Upper' },
      { label: 'Day 2', focus: 'Lower' },
      { label: 'Day 3', focus: 'Upper' },
      { label: 'Day 4', focus: 'Lower' },
    ],
  },
  FullBody: {
    label: 'Full Body',
    days: [
      { label: 'Day 1', focus: 'Full Body A' },
      { label: 'Day 2', focus: 'Full Body B' },
      { label: 'Day 3', focus: 'Full Body C' },
    ],
  },
  Custom: {
    label: 'Custom',
    days: [],
  },
}

const STORAGE_KEY = 'training_plan'

export default function TrainingPlan() {
  const { toastSuccess } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSplit, setNewSplit] = useState<SplitType>('PPL')
  const [newGoal, setNewGoal] = useState('')
  const [newWeeks, setNewWeeks] = useState(4)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [addingExercise, setAddingExercise] = useState<string | null>(null)
  const [exForm, setExForm] = useState({ name: '', sets: 3, reps: '8-12', rest: '60s', notes: '' })
  const [currentWeek, setCurrentWeek] = useState(0)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (stored.plans) setPlans(stored.plans)
      if (stored.activePlanId) setActivePlanId(stored.activePlanId)
    } catch { /**/ }
  }, [])

  const persist = (p: Plan[], aid: string | null) => {
    setPlans(p)
    setActivePlanId(aid)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plans: p, activePlanId: aid }))
  }

  const createPlan = () => {
    if (!newName.trim()) return
    const template = SPLIT_TEMPLATES[newSplit]
    const weeks: TrainingWeek[] = Array.from({ length: newWeeks }, (_, wi) => ({
      id: `w${Date.now()}_${wi}`,
      weekNum: wi + 1,
      completions: {},
      days: template.days.map((d, di) => ({
        id: `d${Date.now()}_${wi}_${di}`,
        label: d.label,
        focus: d.focus,
        exercises: [],
      })),
    }))
    const plan: Plan = { id: Date.now().toString(), name: newName.trim(), split: newSplit, goal: newGoal.trim(), weeks, createdAt: new Date().toISOString() }
    persist([plan, ...plans], plan.id)
    setShowCreate(false)
    setNewName('')
    setNewGoal('')
    toastSuccess(`Plan "${plan.name}" created!`)
  }

  const activePlan = plans.find(p => p.id === activePlanId)
  const week = activePlan?.weeks[currentWeek]

  const addExercise = (dayId: string) => {
    if (!exForm.name.trim() || !activePlan) return
    const ex: Exercise = { id: Date.now().toString(), ...exForm }
    const updated = plans.map(p => p.id === activePlanId ? {
      ...p,
      weeks: p.weeks.map((w, wi) => wi === currentWeek ? {
        ...w,
        days: w.days.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d),
      } : w),
    } : p)
    persist(updated, activePlanId)
    setExForm({ name: '', sets: 3, reps: '8-12', rest: '60s', notes: '' })
    setAddingExercise(null)
    toastSuccess('Exercise added')
  }

  const removeExercise = (dayId: string, exId: string) => {
    if (!activePlan) return
    const updated = plans.map(p => p.id === activePlanId ? {
      ...p,
      weeks: p.weeks.map((w, wi) => wi === currentWeek ? {
        ...w,
        days: w.days.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== exId) } : d),
      } : w),
    } : p)
    persist(updated, activePlanId)
  }

  const setDayStatus = (dayId: string, status: DayStatus) => {
    if (!activePlan) return
    const updated = plans.map(p => p.id === activePlanId ? {
      ...p,
      weeks: p.weeks.map((w, wi) => wi === currentWeek ? {
        ...w,
        completions: { ...w.completions, [dayId]: status },
      } : w),
    } : p)
    persist(updated, activePlanId)
    if (status === 'done') toastSuccess('Day completed! 💪')
  }

  const weekProgress = week ? Object.values(week.completions).filter(s => s === 'done').length : 0
  const weekTotal = week?.days.length ?? 0

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Dumbbell className="w-7 h-7 text-orange-400" />
            Training Plan
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build structured workout programs.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {showCreate && (
        <div className="game-card p-4 border border-orange-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-white">Create Training Plan</h3>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Plan name (e.g., Bulk Phase 1)" className="game-input w-full" autoFocus />
          <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
            placeholder="Goal (e.g., Gain 5lbs muscle in 8 weeks)" className="game-input w-full" />
          <div className="flex gap-2">
            <select value={newSplit} onChange={e => setNewSplit(e.target.value as SplitType)} className="game-input flex-1 text-sm">
              {(Object.entries(SPLIT_TEMPLATES) as [SplitType, { label: string }][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Weeks:</span>
              <input type="number" value={newWeeks} min={1} max={16}
                onChange={e => setNewWeeks(Number(e.target.value))}
                className="game-input w-16 text-sm text-center" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createPlan} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold">Create Plan</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Plan selector */}
      {plans.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {plans.map(p => (
            <button key={p.id} onClick={() => { setActivePlanId(p.id); setCurrentWeek(0) }}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${activePlanId === p.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {p.name}
              <button onClick={e => { e.stopPropagation(); persist(plans.filter(x => x.id !== p.id), activePlanId === p.id ? null : activePlanId) }}
                className="ml-2 opacity-50 hover:opacity-100">×</button>
            </button>
          ))}
        </div>
      )}

      {activePlan && (
        <>
          <div className="game-card p-4 border border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-semibold text-white">{activePlan.name}</span>
                <span className="ml-2 text-xs text-slate-500">{SPLIT_TEMPLATES[activePlan.split].label} · {activePlan.weeks.length} weeks</span>
              </div>
              <div className="flex gap-1">
                {activePlan.weeks.map((_, wi) => (
                  <button key={wi} onClick={() => setCurrentWeek(wi)}
                    className={`w-7 h-7 rounded text-xs font-medium ${currentWeek === wi ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    {wi + 1}
                  </button>
                ))}
              </div>
            </div>
            {activePlan.goal && <p className="text-xs text-slate-500 italic">🎯 {activePlan.goal}</p>}
            {week && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Week {week.weekNum} progress</span>
                  <span className="text-xs text-orange-400">{weekProgress}/{weekTotal} days</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${weekTotal ? (weekProgress / weekTotal) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Days */}
          {week?.days.map(day => {
            const status = week.completions[day.id] as DayStatus | undefined
            const expanded = expandedDay === day.id
            return (
              <div key={day.id} className={`game-card overflow-hidden border ${status === 'done' ? 'border-green-500/30' : status === 'skipped' ? 'border-slate-700/50 opacity-60' : 'border-slate-700/30'}`}>
                <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedDay(expanded ? null : day.id)}>
                  <div className="flex items-center gap-2 flex-1">
                    {status === 'done'
                      ? <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>
                      : <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-600" />}
                    <div>
                      <span className="text-sm font-medium text-white">{day.label}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">{day.focus}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{day.exercises.length} exercises</span>
                  {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                </div>

                {expanded && (
                  <div className="border-t border-slate-800 p-3 space-y-2">
                    {day.exercises.map(ex => (
                      <div key={ex.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-slate-800/50">
                        <div className="flex-1">
                          <span className="text-sm text-white">{ex.name}</span>
                          <span className="ml-2 text-xs text-slate-500">{ex.sets} × {ex.reps} · Rest: {ex.rest}</span>
                          {ex.notes && <p className="text-xs text-slate-600 mt-0.5">{ex.notes}</p>}
                        </div>
                        <button onClick={() => removeExercise(day.id, ex.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-slate-700 hover:text-red-400" />
                        </button>
                      </div>
                    ))}

                    {addingExercise === day.id ? (
                      <div className="space-y-2 pt-1">
                        <input value={exForm.name} onChange={e => setExForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Exercise name *" className="game-input w-full text-sm" autoFocus />
                        <div className="grid grid-cols-3 gap-2">
                          <input type="number" value={exForm.sets} onChange={e => setExForm(f => ({ ...f, sets: Number(e.target.value) }))}
                            placeholder="Sets" className="game-input text-sm text-center" />
                          <input value={exForm.reps} onChange={e => setExForm(f => ({ ...f, reps: e.target.value }))}
                            placeholder="Reps" className="game-input text-sm" />
                          <input value={exForm.rest} onChange={e => setExForm(f => ({ ...f, rest: e.target.value }))}
                            placeholder="Rest" className="game-input text-sm" />
                        </div>
                        <input value={exForm.notes} onChange={e => setExForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Notes (optional)" className="game-input w-full text-sm" />
                        <div className="flex gap-2">
                          <button onClick={() => addExercise(day.id)}
                            className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold">Add</button>
                          <button onClick={() => setAddingExercise(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingExercise(day.id)}
                        className="w-full py-1.5 border border-dashed border-slate-700 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600">
                        + Add exercise
                      </button>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setDayStatus(day.id, 'done')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 justify-center ${status === 'done' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-green-400'}`}>
                        <Check className="w-3.5 h-3.5" /> Done
                      </button>
                      <button onClick={() => setDayStatus(day.id, 'skipped')}
                        className={`flex-1 py-1.5 rounded-lg text-xs flex items-center gap-1 justify-center ${status === 'skipped' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}>
                        <RotateCcw className="w-3.5 h-3.5" /> Skip
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {plans.length === 0 && !showCreate && (
        <div className="text-center py-16 text-slate-500">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No training plans yet.</p>
          <p className="text-sm">Create a structured program to reach your fitness goals.</p>
        </div>
      )}
    </div>
  )
}
