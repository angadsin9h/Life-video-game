import { useState, useEffect } from 'react'
import { Layers, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AlgorithmType = 'morning-protocol' | 'evening-protocol' | 'decision-rule' | 'focus-system' | 'energy-system' | 'learning-system' | 'relationship-rule' | 'money-rule' | 'health-rule' | 'crisis-protocol'
type AlgorithmStatus = 'developing' | 'testing' | 'proven' | 'optimizing' | 'retired'

interface AlgorithmEntry {
  id: string
  name: string
  algorithmType: AlgorithmType
  status: AlgorithmStatus
  trigger: string
  steps: string
  outcome: string
  whenItFails: string
  iteration: number
  effectivenessScore: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<AlgorithmType, { label: string; emoji: string; color: string }> = {
  'morning-protocol': { label: 'Morning Protocol',  emoji: '☀️', color: '#f59e0b' },
  'evening-protocol': { label: 'Evening Protocol',  emoji: '🌙', color: '#6366f1' },
  'decision-rule':    { label: 'Decision Rule',     emoji: '⚖️', color: '#3b82f6' },
  'focus-system':     { label: 'Focus System',      emoji: '🎯', color: '#ef4444' },
  'energy-system':    { label: 'Energy System',     emoji: '⚡', color: '#f97316' },
  'learning-system':  { label: 'Learning System',   emoji: '📚', color: '#a855f7' },
  'relationship-rule':{ label: 'Relationship Rule', emoji: '❤️', color: '#ec4899' },
  'money-rule':       { label: 'Money Rule',        emoji: '💰', color: '#22c55e' },
  'health-rule':      { label: 'Health Rule',       emoji: '💪', color: '#84cc16' },
  'crisis-protocol':  { label: 'Crisis Protocol',   emoji: '🆘', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<AlgorithmStatus, { label: string; color: string }> = {
  developing:  { label: 'Developing',  color: '#94a3b8' },
  testing:     { label: 'Testing',     color: '#f59e0b' },
  proven:      { label: 'Proven',      color: '#22c55e' },
  optimizing:  { label: 'Optimizing',  color: '#3b82f6' },
  retired:     { label: 'Retired',     color: '#6b7280' },
}

const STORAGE_KEY = 'personal_algorithm'

export default function PersonalAlgorithm() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AlgorithmEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AlgorithmEntry, 'id' | 'createdAt'>>({
    name: '', algorithmType: 'focus-system', status: 'testing', trigger: '',
    steps: '', outcome: '', whenItFails: '', iteration: 1, effectivenessScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AlgorithmEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const e: AlgorithmEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, name: '', trigger: '', steps: '', outcome: '', whenItFails: '' }))
    setShowForm(false)
    toastSuccess('Personal algorithm documented — systematize your genius 🔧')
  }

  const proven = entries.filter(e => e.status === 'proven').length
  const avgEffect = entries.length ? Math.round(entries.reduce((s, e) => s + e.effectivenessScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Layers className="w-7 h-7 text-cyan-400" />
            Personal Algorithm
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document your personal systems, rules, and protocols.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Algorithms</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{proven}</div>
          <div className="text-xs text-slate-500">Proven</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgEffect}/10</div>
          <div className="text-xs text-slate-500">Avg Effect</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Document Algorithm</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Algorithm / system name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.algorithmType} onChange={e => setForm(f => ({ ...f, algorithmType: e.target.value as AlgorithmType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [AlgorithmType, typeof TYPE_CONFIG['focus-system']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AlgorithmStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [AlgorithmStatus, typeof STATUS_CONFIG.proven][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="Trigger (when to run this algorithm)" className="game-input w-full text-sm" />
          <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
            placeholder="Step by step process" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            placeholder="Expected outcome when working" className="game-input w-full text-sm" />
          <input value={form.whenItFails} onChange={e => setForm(f => ({ ...f, whenItFails: e.target.value }))}
            placeholder="When / why it fails" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Iteration #{form.iteration}</p>
              <input type="range" min={1} max={20} value={form.iteration}
                onChange={e => setForm(f => ({ ...f, iteration: Number(e.target.value) }))}
                className="w-full h-1 accent-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Effectiveness: {form.effectivenessScore}/10</p>
              <input type="range" min={1} max={10} value={form.effectivenessScore}
                onChange={e => setForm(f => ({ ...f, effectivenessScore: Number(e.target.value) }))}
                className="w-full h-1 accent-cyan-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Document</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.algorithmType]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">v{e.iteration}</span>
                  <span className="text-xs text-cyan-400">⚡ {e.effectivenessScore}/10</span>
                </div>
                {e.trigger && <p className="text-xs text-slate-400 mt-1 line-clamp-1">Trigger: {e.trigger}</p>}
                {e.outcome && <p className="text-xs text-green-300/70 mt-0.5">→ {e.outcome}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Systems beat goals. Document your personal algorithms.</p>
          </div>
        )}
      </div>
    </div>
  )
}
