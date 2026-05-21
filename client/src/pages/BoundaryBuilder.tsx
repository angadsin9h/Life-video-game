import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BoundaryDomain = 'time' | 'energy' | 'emotional' | 'physical' | 'digital' | 'work' | 'family' | 'financial' | 'creative' | 'social'
type BoundaryStrength = 'none' | 'weak' | 'forming' | 'holding' | 'firm'

interface BoundaryBuilderEntry {
  id: string
  domain: BoundaryDomain
  strength: BoundaryStrength
  boundaryStatement: string
  whatViolatedIt: string
  howYouEnforced: string
  resistanceYouFelt: string
  outcomeOfHolding: string
  selfRespectGained: string
  nextBoundary: string
  confidenceScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<BoundaryDomain, { label: string; emoji: string; color: string }> = {
  time:      { label: 'Time',      emoji: '⏰', color: '#f59e0b' },
  energy:    { label: 'Energy',    emoji: '⚡', color: '#ef4444' },
  emotional: { label: 'Emotional', emoji: '💙', color: '#3b82f6' },
  physical:  { label: 'Physical',  emoji: '🦺', color: '#22c55e' },
  digital:   { label: 'Digital',   emoji: '📵', color: '#6366f1' },
  work:      { label: 'Work',      emoji: '💼', color: '#f97316' },
  family:    { label: 'Family',    emoji: '👨‍👩‍👧', color: '#ec4899' },
  financial: { label: 'Financial', emoji: '💰', color: '#84cc16' },
  creative:  { label: 'Creative',  emoji: '🎨', color: '#a855f7' },
  social:    { label: 'Social',    emoji: '👥', color: '#10b981' },
}

const STRENGTH_CONFIG: Record<BoundaryStrength, { label: string; color: string }> = {
  none:    { label: 'No Boundary', color: '#ef4444' },
  weak:    { label: 'Weak',        color: '#f97316' },
  forming: { label: 'Forming',     color: '#f59e0b' },
  holding: { label: 'Holding',     color: '#3b82f6' },
  firm:    { label: 'Firm',        color: '#22c55e' },
}

const STORAGE_KEY = 'boundary_builder_log'

export default function BoundaryBuilder() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BoundaryBuilderEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BoundaryBuilderEntry, 'id' | 'createdAt'>>({
    domain: 'time', strength: 'forming', boundaryStatement: '',
    whatViolatedIt: '', howYouEnforced: '', resistanceYouFelt: '',
    outcomeOfHolding: '', selfRespectGained: '', nextBoundary: '', confidenceScore: 6,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BoundaryBuilderEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.boundaryStatement.trim()) return
    const e: BoundaryBuilderEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, boundaryStatement: '', whatViolatedIt: '', howYouEnforced: '', resistanceYouFelt: '', outcomeOfHolding: '', selfRespectGained: '', nextBoundary: '' }))
    setShowForm(false)
    toastSuccess('Boundary logged — saying no to one thing is saying yes to yourself 🛡️')
  }

  const firm = entries.filter(e => e.strength === 'firm' || e.strength === 'holding').length
  const avgConfidence = entries.length ? Math.round(entries.reduce((s, e) => s + e.confidenceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Boundary Builder
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build and hold boundaries that protect your energy and values.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Boundaries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{firm}</div>
          <div className="text-xs text-slate-500">Firm+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-sky-400">{avgConfidence}/10</div>
          <div className="text-xs text-slate-500">Avg Confidence</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Boundary</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as BoundaryDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [BoundaryDomain, typeof DOMAIN_CONFIG.time][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value as BoundaryStrength }))} className="game-input text-sm flex-1">
              {(Object.entries(STRENGTH_CONFIG) as [BoundaryStrength, typeof STRENGTH_CONFIG.forming][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.boundaryStatement} onChange={e => setForm(f => ({ ...f, boundaryStatement: e.target.value }))}
            placeholder="My boundary: I will not... / I only... *" className="game-input w-full text-sm" autoFocus />
          <input value={form.whatViolatedIt} onChange={e => setForm(f => ({ ...f, whatViolatedIt: e.target.value }))}
            placeholder="What or who tested this boundary?" className="game-input w-full text-sm" />
          <input value={form.howYouEnforced} onChange={e => setForm(f => ({ ...f, howYouEnforced: e.target.value }))}
            placeholder="How did you enforce it?" className="game-input w-full text-sm" />
          <input value={form.resistanceYouFelt} onChange={e => setForm(f => ({ ...f, resistanceYouFelt: e.target.value }))}
            placeholder="Guilt or resistance you felt" className="game-input w-full text-sm" />
          <input value={form.outcomeOfHolding} onChange={e => setForm(f => ({ ...f, outcomeOfHolding: e.target.value }))}
            placeholder="Outcome of holding the boundary" className="game-input w-full text-sm" />
          <input value={form.selfRespectGained} onChange={e => setForm(f => ({ ...f, selfRespectGained: e.target.value }))}
            placeholder="Self-respect gained from this" className="game-input w-full text-sm" />
          <input value={form.nextBoundary} onChange={e => setForm(f => ({ ...f, nextBoundary: e.target.value }))}
            placeholder="Next boundary you need to set" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Confidence holding it: {form.confidenceScore}/10</p>
            <input type="range" min={1} max={10} value={form.confidenceScore}
              onChange={e => setForm(f => ({ ...f, confidenceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const s = STRENGTH_CONFIG[e.strength]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-blue-400">🛡️ {e.confidenceScore}/10</span>
                </div>
                {e.boundaryStatement && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.boundaryStatement}</p>}
                {e.selfRespectGained && <p className="text-xs text-green-300/70 mt-0.5">↑ {e.selfRespectGained}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Boundaries are the distance at which I can love both you and me.</p>
          </div>
        )}
      </div>
    </div>
  )
}
