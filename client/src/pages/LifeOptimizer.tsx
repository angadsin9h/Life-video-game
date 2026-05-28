import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type OptimizationArea = 'morning' | 'nutrition' | 'sleep' | 'exercise' | 'focus' | 'social' | 'creative' | 'financial' | 'learning' | 'recovery'
type OptimizationStatus = 'hypothesis' | 'testing' | 'optimized' | 'maintaining' | 'regressing'

interface LifeOptimizerEntry {
  id: string
  area: OptimizationArea
  status: OptimizationStatus
  currentBaseline: string
  targetOptimal: string
  mainLever: string
  dailyAction: string
  measuredResult: string
  sideEffects: string
  sustainabilityScore: number
  improvementPct: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<OptimizationArea, { label: string; emoji: string; color: string }> = {
  morning:    { label: 'Morning',    emoji: '🌅', color: '#f59e0b' },
  nutrition:  { label: 'Nutrition',  emoji: '🥗', color: '#22c55e' },
  sleep:      { label: 'Sleep',      emoji: '😴', color: '#6366f1' },
  exercise:   { label: 'Exercise',   emoji: '💪', color: '#ef4444' },
  focus:      { label: 'Focus',      emoji: '🎯', color: '#3b82f6' },
  social:     { label: 'Social',     emoji: '👥', color: '#ec4899' },
  creative:   { label: 'Creative',   emoji: '🎨', color: '#a855f7' },
  financial:  { label: 'Financial',  emoji: '💰', color: '#84cc16' },
  learning:   { label: 'Learning',   emoji: '📚', color: '#f97316' },
  recovery:   { label: 'Recovery',   emoji: '🌿', color: '#10b981' },
}

const STATUS_CONFIG: Record<OptimizationStatus, { label: string; color: string }> = {
  hypothesis:  { label: 'Hypothesis',  color: '#94a3b8' },
  testing:     { label: 'Testing',     color: '#f59e0b' },
  optimized:   { label: 'Optimized',   color: '#22c55e' },
  maintaining: { label: 'Maintaining', color: '#3b82f6' },
  regressing:  { label: 'Regressing',  color: '#ef4444' },
}

const STORAGE_KEY = 'life_optimizer_log'

export default function LifeOptimizer() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeOptimizerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeOptimizerEntry, 'id' | 'createdAt'>>({
    area: 'morning', status: 'testing', currentBaseline: '',
    targetOptimal: '', mainLever: '', dailyAction: '',
    measuredResult: '', sideEffects: '', sustainabilityScore: 7, improvementPct: 20,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeOptimizerEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.mainLever.trim()) return
    const e: LifeOptimizerEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, currentBaseline: '', targetOptimal: '', mainLever: '', dailyAction: '', measuredResult: '', sideEffects: '' }))
    setShowForm(false)
    toastSuccess('Optimization logged — marginal gains compound into extraordinary results ⚡')
  }

  const optimized = entries.filter(e => e.status === 'optimized' || e.status === 'maintaining').length
  const avgSustain = entries.length ? Math.round(entries.reduce((s, e) => s + e.sustainabilityScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-lime-400" />
            Life Optimizer
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Systematically optimize every dimension of your performance.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-lime-700 hover:bg-lime-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Optimize
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Areas</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{optimized}</div>
          <div className="text-xs text-slate-500">Optimized</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-lime-400">{avgSustain}/10</div>
          <div className="text-xs text-slate-500">Sustainability</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-lime-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Optimization</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as OptimizationArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [OptimizationArea, typeof AREA_CONFIG.morning][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as OptimizationStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [OptimizationStatus, typeof STATUS_CONFIG.testing][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.currentBaseline} onChange={e => setForm(f => ({ ...f, currentBaseline: e.target.value }))}
            placeholder="Current baseline performance" className="game-input w-full text-sm" autoFocus />
          <input value={form.targetOptimal} onChange={e => setForm(f => ({ ...f, targetOptimal: e.target.value }))}
            placeholder="Target optimal state" className="game-input w-full text-sm" />
          <input value={form.mainLever} onChange={e => setForm(f => ({ ...f, mainLever: e.target.value }))}
            placeholder="Main lever / key change driving optimization *" className="game-input w-full text-sm" />
          <input value={form.dailyAction} onChange={e => setForm(f => ({ ...f, dailyAction: e.target.value }))}
            placeholder="Daily action for this optimization" className="game-input w-full text-sm" />
          <input value={form.measuredResult} onChange={e => setForm(f => ({ ...f, measuredResult: e.target.value }))}
            placeholder="Measured result so far" className="game-input w-full text-sm" />
          <input value={form.sideEffects} onChange={e => setForm(f => ({ ...f, sideEffects: e.target.value }))}
            placeholder="Side effects (positive or negative)" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Sustainability: {form.sustainabilityScore}/10</p>
              <input type="range" min={1} max={10} value={form.sustainabilityScore}
                onChange={e => setForm(f => ({ ...f, sustainabilityScore: Number(e.target.value) }))}
                className="w-full h-1 accent-lime-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Improvement: {form.improvementPct}%</p>
              <input type="range" min={0} max={200} step={5} value={form.improvementPct}
                onChange={e => setForm(f => ({ ...f, improvementPct: Number(e.target.value) }))}
                className="w-full h-1 accent-lime-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-lime-700 hover:bg-lime-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-lime-400">⚡ +{e.improvementPct}%</span>
                  <span className="text-xs text-slate-500">Sustain: {e.sustainabilityScore}/10</span>
                </div>
                {e.mainLever && <p className="text-xs text-slate-300 mt-1 line-clamp-1">Key: {e.mainLever}</p>}
                {e.measuredResult && <p className="text-xs text-green-300/70 mt-0.5">→ {e.measuredResult}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Marginal gains in every area compound into an extraordinary life.</p>
          </div>
        )}
      </div>
    </div>
  )
}
