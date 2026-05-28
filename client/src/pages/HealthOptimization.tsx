import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type OptimCategory = 'nutrition' | 'sleep' | 'movement' | 'stress' | 'supplements' | 'light' | 'cold-hot' | 'social' | 'environment' | 'mindfulness'
type EvidenceStrength = 'anecdotal' | 'personal' | 'emerging' | 'strong' | 'gold-standard'
type OptimStatus = 'testing' | 'active' | 'paused' | 'discontinued' | 'optimized'

interface OptimEntry {
  id: string
  protocol: string
  category: OptimCategory
  evidence: EvidenceStrength
  status: OptimStatus
  whatItIs: string
  howToDo: string
  frequency: string
  benefits: string
  sideEffects: string
  biomarker: string
  effectiveness: number
  date: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<OptimCategory, { label: string; emoji: string; color: string }> = {
  nutrition:   { label: 'Nutrition',    emoji: '🥗', color: '#22c55e' },
  sleep:       { label: 'Sleep',        emoji: '😴', color: '#6366f1' },
  movement:    { label: 'Movement',     emoji: '🏃', color: '#ef4444' },
  stress:      { label: 'Stress Mgmt', emoji: '🧘', color: '#a855f7' },
  supplements: { label: 'Supplements',  emoji: '💊', color: '#f59e0b' },
  light:       { label: 'Light',        emoji: '☀️', color: '#fbbf24' },
  'cold-hot':  { label: 'Cold/Heat',    emoji: '🧊', color: '#0ea5e9' },
  social:      { label: 'Social',       emoji: '👥', color: '#ec4899' },
  environment: { label: 'Environment',  emoji: '🏠', color: '#84cc16' },
  mindfulness: { label: 'Mindfulness',  emoji: '🌿', color: '#f97316' },
}

const EVIDENCE_CONFIG: Record<EvidenceStrength, { label: string; color: string }> = {
  anecdotal:       { label: 'Anecdotal',      color: '#94a3b8' },
  personal:        { label: 'Personal Data',  color: '#f97316' },
  emerging:        { label: 'Emerging',       color: '#f59e0b' },
  strong:          { label: 'Strong',         color: '#22c55e' },
  'gold-standard': { label: 'Gold Standard',  color: '#a855f7' },
}

const STATUS_CONFIG: Record<OptimStatus, { label: string; color: string }> = {
  testing:      { label: 'Testing',      color: '#f59e0b' },
  active:       { label: 'Active',       color: '#22c55e' },
  paused:       { label: 'Paused',       color: '#94a3b8' },
  discontinued: { label: 'Discontinued', color: '#ef4444' },
  optimized:    { label: 'Optimized',    color: '#a855f7' },
}

const STORAGE_KEY = 'health_optimization'

export default function HealthOptimization() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<OptimEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<OptimEntry, 'id' | 'createdAt'>>({
    protocol: '', category: 'sleep', evidence: 'personal', status: 'testing',
    whatItIs: '', howToDo: '', frequency: '', benefits: '', sideEffects: '', biomarker: '',
    effectiveness: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: OptimEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.protocol.trim()) return
    const e: OptimEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, protocol: '', whatItIs: '', howToDo: '', frequency: '', benefits: '', sideEffects: '', biomarker: '' }))
    setShowForm(false)
    toastSuccess('Health protocol tracked — optimize your biology 🔬')
  }

  const active = entries.filter(e => e.status === 'active').length
  const avgEff = entries.length ? Math.round(entries.reduce((s, e) => s + e.effectiveness, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-emerald-400" />
            Health Optimization
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your personal health protocols and what works.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Protocols</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgEff}/10</div>
          <div className="text-xs text-slate-500">Avg Effect</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Health Protocol</h3>
          <input value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
            placeholder="Protocol name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as OptimCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CATEGORY_CONFIG) as [OptimCategory, typeof CATEGORY_CONFIG.sleep][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as OptimStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [OptimStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <select value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value as EvidenceStrength }))} className="game-input w-full text-sm">
            {(Object.entries(EVIDENCE_CONFIG) as [EvidenceStrength, typeof EVIDENCE_CONFIG.strong][]).map(([k, ev]) => (
              <option key={k} value={k}>{ev.label}</option>
            ))}
          </select>
          <input value={form.whatItIs} onChange={e => setForm(f => ({ ...f, whatItIs: e.target.value }))}
            placeholder="What is this protocol?" className="game-input w-full text-sm" />
          <input value={form.howToDo} onChange={e => setForm(f => ({ ...f, howToDo: e.target.value }))}
            placeholder="How to implement it" className="game-input w-full text-sm" />
          <input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
            placeholder="Frequency (daily, weekly, etc.)" className="game-input w-full text-sm" />
          <input value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))}
            placeholder="Benefits experienced" className="game-input w-full text-sm" />
          <input value={form.biomarker} onChange={e => setForm(f => ({ ...f, biomarker: e.target.value }))}
            placeholder="Biomarker or metric to track" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Effectiveness: {form.effectiveness}/10</p>
            <input type="range" min={1} max={10} value={form.effectiveness}
              onChange={e => setForm(f => ({ ...f, effectiveness: Number(e.target.value) }))}
              className="w-full h-1 accent-emerald-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Add Protocol</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CATEGORY_CONFIG[e.category]
          const s = STATUS_CONFIG[e.status]
          const ev = EVIDENCE_CONFIG[e.evidence]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.protocol}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: ev.color + '20', color: ev.color }}>{ev.label}</span>
                  <span className="text-xs text-emerald-400">⚡ {e.effectiveness}/10</span>
                </div>
                {e.benefits && <p className="text-xs text-green-300/70 mt-1">{e.benefits}</p>}
                {e.frequency && <p className="text-xs text-slate-500 mt-0.5">📅 {e.frequency}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your body is your vehicle. Optimize it like you mean it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
