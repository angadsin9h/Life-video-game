import { useEffect, useState } from 'react'
import { Dumbbell, Plus, Trash2, TrendingUp, Check, Target } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface FitnessGoal {
  id: string
  exercise: string
  metric: 'weight' | 'reps' | 'time' | 'distance'
  currentValue: number
  targetValue: number
  unit: string
  deadline: string
  logs: { date: string; value: number; note: string }[]
  category: string
}

const METRIC_CONFIGS = {
  weight: { unit: 'kg', label: 'Max Weight', placeholder: '100' },
  reps: { unit: 'reps', label: 'Max Reps', placeholder: '20' },
  time: { unit: 'min', label: 'Time', placeholder: '30' },
  distance: { unit: 'km', label: 'Distance', placeholder: '10' },
}

const CATEGORIES = [
  { value: 'strength', label: 'Strength', emoji: '🏋️', color: '#ef4444' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃', color: '#f97316' },
  { value: 'flexibility', label: 'Flexibility', emoji: '🧘', color: '#8b5cf6' },
  { value: 'sport', label: 'Sport', emoji: '⚽', color: '#22c55e' },
  { value: 'endurance', label: 'Endurance', emoji: '🚴', color: '#3b82f6' },
]

const STORAGE_KEY = 'fitness_goals'

export default function FitnessGoals() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<FitnessGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [logging, setLogging] = useState<string | null>(null)
  const [logValue, setLogValue] = useState('')
  const [logNote, setLogNote] = useState('')
  const [form, setForm] = useState({ exercise: '', metric: 'weight' as FitnessGoal['metric'], currentValue: '', targetValue: '', deadline: '', category: 'strength' })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setGoals(JSON.parse(saved))
  }, [])

  const persist = (updated: FitnessGoal[]) => {
    setGoals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addGoal = () => {
    if (!form.exercise.trim() || !form.targetValue) return
    const metricConfig = METRIC_CONFIGS[form.metric]
    const g: FitnessGoal = {
      id: Date.now().toString(),
      exercise: form.exercise,
      metric: form.metric,
      currentValue: parseFloat(form.currentValue) || 0,
      targetValue: parseFloat(form.targetValue),
      unit: metricConfig.unit,
      deadline: form.deadline,
      category: form.category,
      logs: [],
    }
    persist([...goals, g])
    setForm({ exercise: '', metric: 'weight', currentValue: '', targetValue: '', deadline: '', category: 'strength' })
    setShowForm(false)
    toastSuccess('Fitness goal added!')
  }

  const logProgress = (id: string) => {
    const val = parseFloat(logValue)
    if (!val) return
    const updated = goals.map(g => {
      if (g.id !== id) return g
      const newLogs = [{ date: new Date().toISOString().split('T')[0], value: val, note: logNote }, ...g.logs]
      const newCurrent = newLogs.reduce((best, l) => {
        if (g.metric === 'time') return l.value < best ? l.value : best
        return l.value > best ? l.value : best
      }, g.currentValue)
      return { ...g, currentValue: newCurrent, logs: newLogs }
    })
    persist(updated)
    setLogging(null)
    setLogValue('')
    setLogNote('')
    toastSuccess('Progress logged!')
  }

  const deleteGoal = (id: string) => persist(goals.filter(g => g.id !== id))

  const daysUntil = (d: string) => d ? Math.ceil((new Date(d + 'T12:00:00').getTime() - Date.now()) / 86400000) : null

  const getPct = (g: FitnessGoal) => {
    if (g.targetValue === 0) return 0
    if (g.metric === 'time') {
      const start = g.logs.length > 0 ? Math.max(...g.logs.map(l => l.value)) : g.currentValue
      const reduction = start - g.currentValue
      const needed = start - g.targetValue
      return needed > 0 ? Math.min(100, Math.round((reduction / needed) * 100)) : 0
    }
    return Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Dumbbell className="w-7 h-7 text-red-400" />
            Fitness Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track PRs and progress toward fitness targets</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Target className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{goals.length}</div>
          <div className="text-xs text-slate-500">Active Goals</div>
        </div>
        <div className="game-card p-3 text-center">
          <Check className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{goals.filter(g => getPct(g) >= 100).length}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-400">{goals.reduce((s, g) => s + g.logs.length, 0)}</div>
          <div className="text-xs text-slate-500">Total Logs</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-red-500/20">
          <h3 className="font-semibold text-slate-300">New Fitness Goal</h3>
          <input value={form.exercise} onChange={e => setForm(f => ({ ...f, exercise: e.target.value }))}
            placeholder="Exercise (e.g. Bench Press, 5K Run, Squat)" className="game-input w-full" autoFocus />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.category === c.value ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">What are you tracking?</label>
            <div className="flex gap-2">
              {(Object.keys(METRIC_CONFIGS) as FitnessGoal['metric'][]).map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, metric: m }))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                  style={form.metric === m ? { background: '#ef444433', color: '#ef4444', border: '1px solid #ef4444' } : { background: '#1e293b', color: '#64748b' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Current ({METRIC_CONFIGS[form.metric].unit})</label>
              <input type="number" value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))}
                placeholder="0" className="game-input w-full" step="0.1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target ({METRIC_CONFIGS[form.metric].unit})</label>
              <input type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                placeholder={METRIC_CONFIGS[form.metric].placeholder} className="game-input w-full" step="0.1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="game-input w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addGoal} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Add Goal
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Goals */}
      <div className="space-y-4">
        {goals.map(g => {
          const cat = CATEGORIES.find(c => c.value === g.category)
          const pct = getPct(g)
          const days = daysUntil(g.deadline)
          const achieved = pct >= 100

          return (
            <div key={g.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${cat?.color || '#ef4444'}` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat?.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      {g.exercise}
                      {achieved && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">PR Achieved!</span>}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Current: <span className="text-white font-semibold">{g.currentValue}{g.unit}</span>
                      {' '}→ Target: <span style={{ color: cat?.color }}>{g.targetValue}{g.unit}</span>
                      {days !== null && <span className={`ml-2 ${days < 0 ? 'text-red-400' : days < 30 ? 'text-yellow-400' : ''}`}>
                        · {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteGoal(g.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{pct}% to goal</span>
                </div>
                <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: achieved ? '#22c55e' : cat?.color || '#ef4444' }} />
                </div>
              </div>

              {/* Recent logs */}
              {g.logs.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {g.logs.slice(0, 4).map((l, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {l.date.slice(5)}: {l.value}{g.unit}
                    </span>
                  ))}
                </div>
              )}

              {logging === g.id ? (
                <div className="flex gap-2 items-center">
                  <input type="number" value={logValue} onChange={e => setLogValue(e.target.value)}
                    placeholder={`Value (${g.unit})`} className="game-input flex-1 text-xs" step="0.1" autoFocus />
                  <input value={logNote} onChange={e => setLogNote(e.target.value)}
                    placeholder="Note" className="game-input flex-1 text-xs" />
                  <button onClick={() => logProgress(g.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">Log</button>
                  <button onClick={() => setLogging(null)} className="px-2 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">✕</button>
                </div>
              ) : (
                <button onClick={() => setLogging(g.id)}
                  className="w-full py-1.5 border border-dashed border-slate-700 hover:border-red-500/40 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-medium transition-all">
                  + Log Progress
                </button>
              )}
            </div>
          )
        })}
      </div>

      {goals.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No fitness goals yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Set First Fitness Goal
          </button>
        </div>
      )}
    </div>
  )
}
