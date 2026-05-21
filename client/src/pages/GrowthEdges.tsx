import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EdgeDomain = 'social' | 'career' | 'physical' | 'intellectual' | 'creative' | 'emotional' | 'spiritual' | 'financial' | 'relational' | 'other'
type EdgeStatus = 'identified' | 'approaching' | 'expanding' | 'integrated' | 'mastered'

interface GrowthEdge {
  id: string
  domain: EdgeDomain
  status: EdgeStatus
  edge: string
  currentLimit: string
  nextStep: string
  evidence: string
  discomfortLevel: number
  growthPotential: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<EdgeDomain, { label: string; emoji: string; color: string }> = {
  social:       { label: 'Social',       emoji: '👥', color: '#22c55e' },
  career:       { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  physical:     { label: 'Physical',     emoji: '💪', color: '#ef4444' },
  intellectual: { label: 'Intellectual', emoji: '🧠', color: '#6366f1' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#a855f7' },
  emotional:    { label: 'Emotional',    emoji: '❤️', color: '#ec4899' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#84cc16' },
  financial:    { label: 'Financial',    emoji: '💰', color: '#f59e0b' },
  relational:   { label: 'Relational',   emoji: '🤝', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '🌱', color: '#64748b' },
}

const STATUS_CONFIG: Record<EdgeStatus, { label: string; color: string }> = {
  identified: { label: 'Identified',  color: '#94a3b8' },
  approaching: { label: 'Approaching', color: '#f59e0b' },
  expanding:  { label: 'Expanding',   color: '#3b82f6' },
  integrated: { label: 'Integrated',  color: '#22c55e' },
  mastered:   { label: 'Mastered',    color: '#a855f7' },
}

const STORAGE_KEY = 'growth_edges'

export default function GrowthEdges() {
  const { toastSuccess } = useToast()
  const [edges, setEdges] = useState<GrowthEdge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GrowthEdge, 'id' | 'createdAt'>>({
    domain: 'social', status: 'identified', edge: '', currentLimit: '',
    nextStep: '', evidence: '', discomfortLevel: 7, growthPotential: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEdges(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GrowthEdge[]) => { setEdges(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.edge.trim()) return
    const e: GrowthEdge = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...edges])
    setForm(f => ({ ...f, edge: '', currentLimit: '', nextStep: '', evidence: '' }))
    setShowForm(false)
    toastSuccess('Growth edge mapped 🌱')
  }

  const expanding = edges.filter(e => e.status === 'expanding' || e.status === 'integrated' || e.status === 'mastered').length
  const avgGrowth = edges.length ? Math.round(edges.reduce((s, e) => s + e.growthPotential, 0) / edges.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Growth Edges
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your comfort zone edges and expand them intentionally.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Map Edge
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{edges.length}</div>
          <div className="text-xs text-slate-500">Edges Mapped</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{expanding}</div>
          <div className="text-xs text-slate-500">Actively Expanding</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgGrowth}/10</div>
          <div className="text-xs text-slate-500">Avg Growth Potential</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Growth Edge</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as EdgeDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [EdgeDomain, typeof DOMAIN_CONFIG.social][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EdgeStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [EdgeStatus, typeof STATUS_CONFIG.identified][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.edge} onChange={e => setForm(f => ({ ...f, edge: e.target.value }))}
            placeholder="Describe the growth edge / what scares or challenges you *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.currentLimit} onChange={e => setForm(f => ({ ...f, currentLimit: e.target.value }))}
            placeholder="What's your current limitation or comfort zone boundary?" className="game-input w-full text-sm" />
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="The smallest next step to expand this edge" className="game-input w-full text-sm" />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence of expansion (actions taken, wins)" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Discomfort: {form.discomfortLevel}/10</p>
              <input type="range" min={1} max={10} value={form.discomfortLevel}
                onChange={e => setForm(f => ({ ...f, discomfortLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Growth potential: {form.growthPotential}/10</p>
              <input type="range" min={1} max={10} value={form.growthPotential}
                onChange={e => setForm(f => ({ ...f, growthPotential: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Map Edge</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {edges.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{d.label}</span>
                  <span className="text-xs text-red-400">😰 {e.discomfortLevel}/10</span>
                  <span className="text-xs text-green-400">🌱 {e.growthPotential}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.edge}</p>
                {e.nextStep && <p className="text-xs text-green-300 mt-0.5">→ {e.nextStep}</p>}
                {e.evidence && <p className="text-xs text-blue-300/70 mt-0.5">✓ {e.evidence}</p>}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <select value={e.status}
                  onChange={ev => save(edges.map(x => x.id === e.id ? { ...x, status: ev.target.value as EdgeStatus } : x))}
                  className="text-xs bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-400">
                  {(Object.keys(STATUS_CONFIG) as EdgeStatus[]).map(k => (
                    <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                  ))}
                </select>
                <button onClick={() => save(edges.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {edges.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Life begins at the edge of your comfort zone. Map it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
