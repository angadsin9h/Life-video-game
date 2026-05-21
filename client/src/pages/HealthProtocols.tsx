import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ProtocolCategory = 'sleep' | 'nutrition' | 'exercise' | 'mental' | 'recovery' | 'longevity' | 'hormones' | 'gut-health' | 'immune' | 'other'
type ProtocolStatus = 'active' | 'testing' | 'paused' | 'retired' | 'planned'
type EvidenceLevel = 'anecdotal' | 'low' | 'moderate' | 'strong' | 'proven'

interface HealthProtocol {
  id: string
  category: ProtocolCategory
  status: ProtocolStatus
  evidence: EvidenceLevel
  name: string
  description: string
  frequency: string
  duration: string
  benefits: string
  sideEffects: string
  source: string
  effectiveness: number
  date: string
  createdAt: string
}

const CAT_CONFIG: Record<ProtocolCategory, { label: string; emoji: string; color: string }> = {
  sleep:      { label: 'Sleep',       emoji: '😴', color: '#3b82f6' },
  nutrition:  { label: 'Nutrition',   emoji: '🥗', color: '#22c55e' },
  exercise:   { label: 'Exercise',    emoji: '💪', color: '#ef4444' },
  mental:     { label: 'Mental',      emoji: '🧠', color: '#a855f7' },
  recovery:   { label: 'Recovery',    emoji: '🌿', color: '#84cc16' },
  longevity:  { label: 'Longevity',   emoji: '⏳', color: '#f59e0b' },
  hormones:   { label: 'Hormones',    emoji: '⚗️', color: '#f97316' },
  'gut-health':{ label: 'Gut Health', emoji: '🦠', color: '#6366f1' },
  immune:     { label: 'Immune',      emoji: '🛡️', color: '#0ea5e9' },
  other:      { label: 'Other',       emoji: '💊', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ProtocolStatus, { label: string; color: string }> = {
  active:  { label: 'Active',  color: '#22c55e' },
  testing: { label: 'Testing', color: '#f59e0b' },
  paused:  { label: 'Paused',  color: '#94a3b8' },
  retired: { label: 'Retired', color: '#ef4444' },
  planned: { label: 'Planned', color: '#3b82f6' },
}

const EVIDENCE_CONFIG: Record<EvidenceLevel, { label: string; color: string }> = {
  anecdotal: { label: 'Anecdotal', color: '#94a3b8' },
  low:       { label: 'Low',      color: '#f59e0b' },
  moderate:  { label: 'Moderate', color: '#3b82f6' },
  strong:    { label: 'Strong',   color: '#22c55e' },
  proven:    { label: 'Proven',   color: '#a855f7' },
}

const STORAGE_KEY = 'health_protocols'

export default function HealthProtocols() {
  const { toastSuccess } = useToast()
  const [protocols, setProtocols] = useState<HealthProtocol[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<HealthProtocol, 'id' | 'createdAt'>>({
    category: 'sleep', status: 'testing', evidence: 'moderate',
    name: '', description: '', frequency: '', duration: '', benefits: '',
    sideEffects: '', source: '', effectiveness: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setProtocols(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: HealthProtocol[]) => { setProtocols(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const p: HealthProtocol = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([p, ...protocols])
    setForm(f => ({ ...f, name: '', description: '', frequency: '', duration: '', benefits: '', sideEffects: '', source: '' }))
    setShowForm(false)
    toastSuccess('Health protocol added — optimize your biology 🏃')
  }

  const active = protocols.filter(p => p.status === 'active').length
  const avgEffect = protocols.length ? Math.round(protocols.reduce((s, p) => s + p.effectiveness, 0) / protocols.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-green-400" />
            Health Protocols
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track health interventions and their effectiveness.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{protocols.length}</div>
          <div className="text-xs text-slate-500">Protocols</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgEffect}/10</div>
          <div className="text-xs text-slate-500">Avg Effect</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Protocol</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProtocolCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [ProtocolCategory, typeof CAT_CONFIG.sleep][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProtocolStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ProtocolStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Protocol name *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description and what it does" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
              placeholder="Frequency (e.g. daily)" className="game-input text-sm flex-1" />
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="Duration (e.g. 8hrs)" className="game-input text-sm flex-1" />
          </div>
          <input value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))}
            placeholder="Benefits experienced" className="game-input w-full text-sm" />
          <input value={form.sideEffects} onChange={e => setForm(f => ({ ...f, sideEffects: e.target.value }))}
            placeholder="Side effects or downsides" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Source / reference" className="game-input text-sm flex-1" />
            <select value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value as EvidenceLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(EVIDENCE_CONFIG) as [EvidenceLevel, typeof EVIDENCE_CONFIG.moderate][]).map(([k, ev]) => (
                <option key={k} value={k}>{ev.label}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Effectiveness: {form.effectiveness}/10</p>
            <input type="range" min={1} max={10} value={form.effectiveness}
              onChange={e => setForm(f => ({ ...f, effectiveness: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Add Protocol</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {protocols.map(p => {
          const c = CAT_CONFIG[p.category]
          const s = STATUS_CONFIG[p.status]
          const ev = EVIDENCE_CONFIG[p.evidence]
          return (
            <div key={p.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{c.label}</span>
                  <span className="text-xs px-1 rounded" style={{ background: ev.color + '20', color: ev.color }}>{ev.label}</span>
                  <span className="text-xs text-green-400">📊 {p.effectiveness}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{p.name}</p>
                {p.frequency && <p className="text-xs text-slate-500 mt-0.5">{p.frequency} · {p.duration}</p>}
                {p.benefits && <p className="text-xs text-green-300/80 mt-0.5">Benefits: {p.benefits}</p>}
              </div>
              <button onClick={() => save(protocols.filter(x => x.id !== p.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {protocols.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Optimize your biology. Track what works for you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
