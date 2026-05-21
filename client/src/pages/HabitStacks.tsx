import { useState, useEffect } from 'react'
import { Layers, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type StackTrigger = 'wake-up' | 'coffee' | 'exercise' | 'work-start' | 'lunch' | 'work-end' | 'dinner' | 'bedtime' | 'custom'
type StackStrength = 'building' | 'inconsistent' | 'established' | 'automatic' | 'mastered'

interface HabitStep {
  habit: string
  duration: number
}

interface HabitStack {
  id: string
  name: string
  trigger: StackTrigger
  strength: StackStrength
  steps: HabitStep[]
  totalDuration: number
  streak: number
  notes: string
  date: string
  createdAt: string
}

const TRIGGER_CONFIG: Record<StackTrigger, { label: string; emoji: string }> = {
  'wake-up':   { label: 'Wake Up',     emoji: '☀️' },
  coffee:      { label: 'Coffee',      emoji: '☕' },
  exercise:    { label: 'Post-Exercise',emoji: '💪' },
  'work-start':{ label: 'Work Start',  emoji: '💼' },
  lunch:       { label: 'After Lunch', emoji: '🍽️' },
  'work-end':  { label: 'Work End',    emoji: '🏁' },
  dinner:      { label: 'After Dinner',emoji: '🌆' },
  bedtime:     { label: 'Bedtime',     emoji: '🌙' },
  custom:      { label: 'Custom',      emoji: '⚡' },
}

const STRENGTH_CONFIG: Record<StackStrength, { label: string; color: string }> = {
  building:     { label: 'Building',     color: '#94a3b8' },
  inconsistent: { label: 'Inconsistent', color: '#f97316' },
  established:  { label: 'Established',  color: '#3b82f6' },
  automatic:    { label: 'Automatic',    color: '#22c55e' },
  mastered:     { label: 'Mastered',     color: '#a855f7' },
}

const STORAGE_KEY = 'habit_stacks_v2'

export default function HabitStacks() {
  const { toastSuccess } = useToast()
  const [stacks, setStacks] = useState<HabitStack[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newStep, setNewStep] = useState({ habit: '', duration: 5 })
  const [form, setForm] = useState<Omit<HabitStack, 'id' | 'createdAt' | 'totalDuration'>>({
    name: '', trigger: 'wake-up', strength: 'building', steps: [],
    streak: 0, notes: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setStacks(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: HabitStack[]) => { setStacks(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addStep = () => {
    if (!newStep.habit.trim()) return
    setForm(f => ({ ...f, steps: [...f.steps, { ...newStep }] }))
    setNewStep({ habit: '', duration: 5 })
  }

  const submit = () => {
    if (!form.name.trim() || form.steps.length === 0) return
    const totalDuration = form.steps.reduce((s, step) => s + step.duration, 0)
    const s: HabitStack = { id: Date.now().toString(), ...form, totalDuration, createdAt: new Date().toISOString() }
    save([s, ...stacks])
    setForm(f => ({ ...f, name: '', steps: [], streak: 0, notes: '' }))
    setShowForm(false)
    toastSuccess('Habit stack created — chain habits for compound results 🔗')
  }

  const mastered = stacks.filter(s => s.strength === 'mastered' || s.strength === 'automatic').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Layers className="w-7 h-7 text-violet-400" />
            Habit Stacks
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Chain habits together. Build powerful daily routines.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Stack
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{stacks.length}</div>
          <div className="text-xs text-slate-500">Stacks</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">
            {stacks.length ? Math.round(stacks.reduce((s, st) => s + st.totalDuration, 0) / stacks.length) : 0}m
          </div>
          <div className="text-xs text-slate-500">Avg Duration</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Create Habit Stack</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Stack name (e.g. Morning Power Stack) *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as StackTrigger }))} className="game-input text-sm flex-1">
              {(Object.entries(TRIGGER_CONFIG) as [StackTrigger, typeof TRIGGER_CONFIG['wake-up']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value as StackStrength }))} className="game-input text-sm flex-1">
              {(Object.entries(STRENGTH_CONFIG) as [StackStrength, typeof STRENGTH_CONFIG.building][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-violet-400 font-medium">Stack Steps</p>
          {form.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg px-2 py-1">
              <span className="text-xs text-violet-400 font-bold w-4">{i + 1}.</span>
              <span className="text-xs text-white flex-1">{step.habit}</span>
              <span className="text-xs text-slate-500">{step.duration}min</span>
              <button onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}
                className="text-slate-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newStep.habit} onChange={e => setNewStep(s => ({ ...s, habit: e.target.value }))}
              placeholder="Add a habit..." className="game-input text-sm flex-1" onKeyDown={e => e.key === 'Enter' && addStep()} />
            <input type="number" value={newStep.duration} onChange={e => setNewStep(s => ({ ...s, duration: Number(e.target.value) }))}
              className="game-input text-sm w-16" min={1} max={120} />
            <button onClick={addStep} className="px-3 py-1.5 bg-violet-700 text-white rounded-lg text-xs">+</button>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes about this stack" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Create Stack</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {stacks.map(s => {
          const t = TRIGGER_CONFIG[s.trigger]
          const st = STRENGTH_CONFIG[s.strength]
          return (
            <div key={s.id} className="game-card p-3" style={{ borderLeft: `3px solid ${st.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-white">{s.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                    <span className="text-xs text-violet-400">⏱ {s.totalDuration}min</span>
                    <span className="text-xs text-slate-500">{s.steps.length} steps</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {s.steps.slice(0, 3).map((step, i) => (
                      <p key={i} className="text-xs text-slate-400">{i + 1}. {step.habit} <span className="text-slate-600">({step.duration}m)</span></p>
                    ))}
                    {s.steps.length > 3 && <p className="text-xs text-slate-600">+{s.steps.length - 3} more</p>}
                  </div>
                </div>
                <button onClick={() => save(stacks.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {stacks.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Chain habits together. The whole becomes greater than the sum.</p>
          </div>
        )}
      </div>
    </div>
  )
}
