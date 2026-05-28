import { useEffect, useState } from 'react'
import { Activity, Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface BodyEntry {
  id: string
  date: string
  weight: number
  bodyFat?: number
  muscleMass?: number
  waist?: number
  chest?: number
  hips?: number
  notes: string
}

interface Goals {
  targetWeight: number
  targetBodyFat: number
  unit: 'kg' | 'lbs'
}

const STORAGE_KEY = 'body_composition'
const GOALS_KEY = 'body_composition_goals'

const lbsToKg = (lbs: number) => +(lbs * 0.453592).toFixed(1)
const kgToLbs = (kg: number) => +(kg * 2.20462).toFixed(1)

export default function BodyComposition() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BodyEntry[]>([])
  const [goals, setGoals] = useState<Goals>({ targetWeight: 75, targetBodyFat: 15, unit: 'kg' })
  const [showForm, setShowForm] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [form, setForm] = useState({ weight: '', bodyFat: '', muscleMass: '', waist: '', chest: '', hips: '', notes: '' })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setEntries(JSON.parse(saved))
    const savedGoals = localStorage.getItem(GOALS_KEY)
    if (savedGoals) setGoals(JSON.parse(savedGoals))
  }, [])

  const persist = (updated: BodyEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveGoals = (g: Goals) => {
    setGoals(g)
    localStorage.setItem(GOALS_KEY, JSON.stringify(g))
  }

  const addEntry = () => {
    if (!form.weight) return
    const entry: BodyEntry = {
      id: Date.now().toString(),
      date: today,
      weight: parseFloat(form.weight),
      bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : undefined,
      muscleMass: form.muscleMass ? parseFloat(form.muscleMass) : undefined,
      waist: form.waist ? parseFloat(form.waist) : undefined,
      chest: form.chest ? parseFloat(form.chest) : undefined,
      hips: form.hips ? parseFloat(form.hips) : undefined,
      notes: form.notes,
    }
    persist([entry, ...entries])
    setForm({ weight: '', bodyFat: '', muscleMass: '', waist: '', chest: '', hips: '', notes: '' })
    setShowForm(false)
    toastSuccess('Body measurement logged!')
  }

  const deleteEntry = (id: string) => persist(entries.filter(e => e.id !== id))

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const previous = sorted[1]
  const oldest = sorted[sorted.length - 1]

  const weightChange = latest && oldest && latest.id !== oldest.id
    ? +(latest.weight - oldest.weight).toFixed(1)
    : null

  const bmi = latest ? +(latest.weight / Math.pow(1.75, 2)).toFixed(1) : null

  const bmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#3b82f6' }
    if (bmi < 25) return { label: 'Normal', color: '#22c55e' }
    if (bmi < 30) return { label: 'Overweight', color: '#eab308' }
    return { label: 'Obese', color: '#ef4444' }
  }

  // Weight chart
  const chartData = sorted.slice(0, 30).reverse()
  const minW = chartData.length > 0 ? Math.min(...chartData.map(e => e.weight)) - 2 : 60
  const maxW = chartData.length > 0 ? Math.max(...chartData.map(e => e.weight)) + 2 : 100

  const unit = goals.unit
  const fmt = (w: number) => unit === 'lbs' ? `${kgToLbs(w)}lbs` : `${w}kg`

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-green-400" />
            Body Composition
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track weight, body fat, and measurements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGoals(!showGoals)} className="px-3 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm">Goals</button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Log
          </button>
        </div>
      </div>

      {/* Current stats */}
      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{fmt(latest.weight)}</div>
            <div className="text-xs text-slate-500 mt-1">Current Weight</div>
            {weightChange !== null && (
              <div className={`text-xs mt-1 font-medium ${weightChange < 0 ? 'text-green-400' : weightChange > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {weightChange > 0 ? '+' : ''}{unit === 'lbs' ? `${kgToLbs(Math.abs(weightChange))}lbs` : `${Math.abs(weightChange)}kg`} total
              </div>
            )}
          </div>
          {latest.bodyFat && (
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{latest.bodyFat}%</div>
              <div className="text-xs text-slate-500 mt-1">Body Fat</div>
              {goals.targetBodyFat && (
                <div className="text-xs text-slate-600 mt-1">Goal: {goals.targetBodyFat}%</div>
              )}
            </div>
          )}
          {bmi && (
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: bmiCategory(bmi).color }}>{bmi}</div>
              <div className="text-xs text-slate-500 mt-1">BMI</div>
              <div className="text-xs mt-1" style={{ color: bmiCategory(bmi).color }}>{bmiCategory(bmi).label}</div>
            </div>
          )}
        </div>
      )}

      {/* Goals panel */}
      {showGoals && (
        <div className="game-card p-4 space-y-3 border border-green-500/20">
          <h3 className="font-semibold text-slate-300">Body Goals</h3>
          <div className="flex gap-2 mb-2">
            {(['kg', 'lbs'] as const).map(u => (
              <button key={u} onClick={() => saveGoals({ ...goals, unit: u })}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${goals.unit === u ? 'bg-green-600/20 text-green-400' : 'text-slate-500'}`}>
                {u}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Weight ({goals.unit})</label>
              <input type="number" value={goals.targetWeight} onChange={e => saveGoals({ ...goals, targetWeight: parseFloat(e.target.value) || 0 })}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Body Fat %</label>
              <input type="number" value={goals.targetBodyFat} onChange={e => saveGoals({ ...goals, targetBodyFat: parseFloat(e.target.value) || 0 })}
                className="game-input w-full" min="3" max="50" />
            </div>
          </div>
          {latest && goals.targetWeight && (
            <div className="text-sm text-slate-400">
              To goal: <span className={`font-semibold ${latest.weight > goals.targetWeight ? 'text-yellow-400' : 'text-green-400'}`}>
                {latest.weight > goals.targetWeight ? `-${fmt(latest.weight - goals.targetWeight)}` : `Done! +${fmt(goals.targetWeight - latest.weight)}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-green-500/20">
          <h3 className="font-semibold text-slate-300">Log Measurements</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Weight ({unit}) *</label>
              <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                placeholder={unit === 'kg' ? '70.5' : '155'} className="game-input w-full" autoFocus step="0.1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Body Fat %</label>
              <input type="number" value={form.bodyFat} onChange={e => setForm(f => ({ ...f, bodyFat: e.target.value }))}
                placeholder="15.0" className="game-input w-full" step="0.1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Muscle Mass ({unit})</label>
              <input type="number" value={form.muscleMass} onChange={e => setForm(f => ({ ...f, muscleMass: e.target.value }))}
                placeholder="55.0" className="game-input w-full" step="0.1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Waist (cm)</label>
              <input type="number" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))}
                placeholder="80" className="game-input w-full" />
            </div>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (e.g. morning measurement, after gym)" className="game-input w-full" />
          <div className="flex gap-2">
            <button onClick={addEntry} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save Measurements
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Weight Trend</h3>
          <div className="relative h-24">
            <svg className="w-full h-full" viewBox={`0 0 ${Math.max(chartData.length * 15, 300)} 80`} preserveAspectRatio="none">
              <polyline
                points={chartData.map((e, i) => {
                  const x = (i / (chartData.length - 1)) * (Math.max(chartData.length * 15, 300) - 20) + 10
                  const y = 70 - ((e.weight - minW) / (maxW - minW)) * 60
                  return `${x},${y}`
                }).join(' ')}
                fill="none" stroke="#22c55e" strokeWidth="2" />
              {chartData.map((e, i) => {
                const x = (i / (chartData.length - 1)) * (Math.max(chartData.length * 15, 300) - 20) + 10
                const y = 70 - ((e.weight - minW) / (maxW - minW)) * 60
                return <circle key={i} cx={x} cy={y} r="3" fill="#22c55e">
                  <title>{e.date}: {fmt(e.weight)}</title>
                </circle>
              })}
              {goals.targetWeight && (
                <line
                  x1="10" y1={70 - ((goals.targetWeight - minW) / (maxW - minW)) * 60}
                  x2={Math.max(chartData.length * 15, 300) - 10}
                  y2={70 - ((goals.targetWeight - minW) / (maxW - minW)) * 60}
                  stroke="#f97316" strokeWidth="1" strokeDasharray="4" opacity="0.6" />
              )}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>{chartData[0]?.date.slice(5)}</span>
            <span>{goals.targetWeight ? `Goal: ${fmt(goals.targetWeight)}` : ''}</span>
            <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* History */}
      {sorted.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">History</h3>
          <div className="space-y-2">
            {sorted.slice(0, 15).map((e, i) => {
              const prev = sorted[i + 1]
              const delta = prev ? +(e.weight - prev.weight).toFixed(1) : null
              return (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <div className="text-xs text-slate-500 w-20">{e.date}</div>
                  <div className="font-semibold text-white text-sm">{fmt(e.weight)}</div>
                  {delta !== null && (
                    <div className={`text-xs flex items-center gap-0.5 ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {delta < 0 ? <TrendingDown className="w-3 h-3" /> : delta > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                      {delta !== 0 ? `${delta > 0 ? '+' : ''}${unit === 'lbs' ? kgToLbs(Math.abs(delta)) + 'lbs' : Math.abs(delta) + 'kg'}` : '—'}
                    </div>
                  )}
                  {e.bodyFat && <span className="text-xs text-blue-400">{e.bodyFat}% fat</span>}
                  {e.waist && <span className="text-xs text-slate-500">W:{e.waist}cm</span>}
                  {e.notes && <span className="text-xs text-slate-600 truncate flex-1">{e.notes}</span>}
                  <button onClick={() => deleteEntry(e.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No measurements logged yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Log First Measurement
          </button>
        </div>
      )}
    </div>
  )
}
