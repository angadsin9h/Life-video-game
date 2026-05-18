import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface WeightEntry {
  id: string
  date: string
  weight: number
  unit: 'kg' | 'lbs'
  bodyFat?: number
  notes: string
}

interface WeightGoal {
  target: number
  unit: 'kg' | 'lbs'
  targetDate: string
}

const STORAGE_KEY = 'weight_tracker'
const GOAL_KEY = 'weight_goal'

export default function WeightTracker() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [goal, setGoal] = useState<WeightGoal | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg')
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weight: 70, bodyFat: 0, notes: '' })
  const [goalForm, setGoalForm] = useState({ target: 70, targetDate: '' })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setEntries(stored)
      if (stored.length > 0) setUnit(stored[0].unit || 'kg')
      const g = JSON.parse(localStorage.getItem(GOAL_KEY) || 'null')
      if (g) { setGoal(g); setGoalForm({ target: g.target, targetDate: g.targetDate }) }
    } catch { /**/ }
  }, [])

  const save = (u: WeightEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.weight) return
    const e: WeightEntry = { id: Date.now().toString(), ...form, unit, bodyFat: form.bodyFat || undefined }
    save([e, ...entries].sort((a, b) => b.date.localeCompare(a.date)))
    setForm({ date: new Date().toISOString().split('T')[0], weight: form.weight, bodyFat: 0, notes: '' })
    setShowForm(false)
    toastSuccess(`${form.weight}${unit} logged`)
  }

  const saveGoal = () => {
    const g: WeightGoal = { ...goalForm, unit }
    setGoal(g)
    localStorage.setItem(GOAL_KEY, JSON.stringify(g))
    setShowGoalForm(false)
    toastSuccess('Goal set!')
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const previous = sorted[1]
  const oldest = sorted[sorted.length - 1]

  const trend = latest && previous ? latest.weight - previous.weight : null
  const totalChange = latest && oldest && latest.id !== oldest.id ? latest.weight - oldest.weight : null

  const progressToGoal = goal && latest
    ? (() => {
        const start = oldest?.weight ?? latest.weight
        const diff = Math.abs(goal.target - start)
        const progress = diff > 0 ? Math.abs(latest.weight - start) / diff : 1
        return Math.min(1, progress) * 100
      })()
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-blue-400" />
            Weight Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your weight journey over time.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGoalForm(true)} className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">Set Goal</button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> Log
          </button>
        </div>
      </div>

      {/* Unit toggle */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl w-fit">
        {(['kg', 'lbs'] as const).map(u => (
          <button key={u} onClick={() => setUnit(u)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${unit === u ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
            {u}
          </button>
        ))}
      </div>

      {/* Stats */}
      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{latest.weight}{unit}</div>
            <div className="text-xs text-slate-500">Current</div>
          </div>
          <div className="game-card p-3 text-center">
            {trend !== null ? (
              <>
                <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {trend > 0 ? <TrendingUp className="w-5 h-5" /> : trend < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                  {Math.abs(trend).toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">vs last</div>
              </>
            ) : <div className="text-slate-500 text-sm mt-2">—</div>}
          </div>
          <div className="game-card p-3 text-center">
            {totalChange !== null ? (
              <>
                <div className={`text-2xl font-bold ${totalChange < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">Total change</div>
              </>
            ) : <div className="text-slate-500 text-sm mt-2">—</div>}
          </div>
        </div>
      )}

      {/* Goal progress */}
      {goal && latest && (
        <div className="game-card p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Goal: {goal.target}{unit}</span>
            <span className="text-sm font-bold text-blue-400">
              {Math.abs(latest.weight - goal.target).toFixed(1)}{unit} to go
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressToGoal}%` }} />
          </div>
          {goal.targetDate && <p className="text-xs text-slate-600 mt-1">Target date: {goal.targetDate}</p>}
        </div>
      )}

      {showGoalForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-2">
          <h3 className="text-sm font-semibold text-white">Set Weight Goal</h3>
          <div className="flex gap-2">
            <input type="number" value={goalForm.target} min={1} step={0.1}
              onChange={e => setGoalForm(f => ({ ...f, target: Number(e.target.value) }))}
              className="game-input flex-1 text-sm text-center" />
            <span className="flex items-center text-sm text-slate-400">{unit}</span>
            <input type="date" value={goalForm.targetDate} onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))}
              className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveGoal} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Set Goal</button>
            <button onClick={() => setShowGoalForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Weight</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input flex-1 text-sm" />
            <div className="flex items-center gap-1.5">
              <input type="number" value={form.weight} min={1} step={0.1}
                onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))}
                className="game-input w-24 text-center font-bold text-lg" autoFocus />
              <span className="text-sm text-slate-400">{unit}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Body fat %</span>
              <input type="number" value={form.bodyFat || ''} min={0} max={100} step={0.1}
                onChange={e => setForm(f => ({ ...f, bodyFat: Number(e.target.value) }))}
                className="game-input w-16 text-sm text-center" />
            </div>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-1.5">
        {sorted.map((e, i) => {
          const prev = sorted[i + 1]
          const diff = prev ? e.weight - prev.weight : null
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3">
              <div className="text-sm text-slate-500 w-24 flex-shrink-0">{e.date}</div>
              <div className="flex-1">
                <span className="font-bold text-white">{e.weight}{e.unit}</span>
                {e.bodyFat && <span className="text-xs text-slate-500 ml-2">{e.bodyFat}% fat</span>}
                {e.notes && <p className="text-xs text-slate-600 mt-0.5">{e.notes}</p>}
              </div>
              {diff !== null && (
                <span className={`text-xs ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </span>
              )}
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start logging your weight to see your journey.</p>
          </div>
        )}
      </div>
    </div>
  )
}
