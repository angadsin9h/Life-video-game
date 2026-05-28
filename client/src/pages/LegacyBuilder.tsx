import { useState, useEffect } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LegacyDomain = 'family' | 'community' | 'career' | 'knowledge' | 'art' | 'mentorship' | 'service' | 'innovation' | 'character' | 'love'
type LegacyStatus = 'dreaming' | 'planting' | 'building' | 'established' | 'enduring'

interface LegacyBuilderEntry {
  id: string
  domain: LegacyDomain
  status: LegacyStatus
  legacyStatement: string
  whyItMatters: string
  whoItWillTouch: string
  actionsTaken: string
  obstaclesAhead: string
  nextStep: string
  timeHorizon: string
  impactScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<LegacyDomain, { label: string; emoji: string; color: string }> = {
  family:     { label: 'Family',      emoji: '👨‍👩‍👧', color: '#f59e0b' },
  community:  { label: 'Community',   emoji: '🏘️', color: '#22c55e' },
  career:     { label: 'Career',      emoji: '💼', color: '#3b82f6' },
  knowledge:  { label: 'Knowledge',   emoji: '📚', color: '#6366f1' },
  art:        { label: 'Art/Culture', emoji: '🎨', color: '#a855f7' },
  mentorship: { label: 'Mentorship',  emoji: '🎓', color: '#f97316' },
  service:    { label: 'Service',     emoji: '🤝', color: '#10b981' },
  innovation: { label: 'Innovation',  emoji: '💡', color: '#ec4899' },
  character:  { label: 'Character',   emoji: '⚖️', color: '#94a3b8' },
  love:       { label: 'Love',        emoji: '❤️', color: '#ef4444' },
}

const STATUS_CONFIG: Record<LegacyStatus, { label: string; color: string }> = {
  dreaming:    { label: 'Dreaming',    color: '#94a3b8' },
  planting:    { label: 'Planting',    color: '#22c55e' },
  building:    { label: 'Building',    color: '#3b82f6' },
  established: { label: 'Established', color: '#f59e0b' },
  enduring:    { label: 'Enduring',    color: '#a855f7' },
}

const STORAGE_KEY = 'legacy_builder_log'

export default function LegacyBuilder() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LegacyBuilderEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LegacyBuilderEntry, 'id' | 'createdAt'>>({
    domain: 'family', status: 'building', legacyStatement: '',
    whyItMatters: '', whoItWillTouch: '', actionsTaken: '',
    obstaclesAhead: '', nextStep: '', timeHorizon: '',
    impactScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LegacyBuilderEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.legacyStatement.trim()) return
    const e: LegacyBuilderEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, legacyStatement: '', whyItMatters: '', whoItWillTouch: '', actionsTaken: '', obstaclesAhead: '', nextStep: '', timeHorizon: '' }))
    setShowForm(false)
    toastSuccess('Legacy piece recorded — you are writing your story for the ages ⭐')
  }

  const building = entries.filter(e => e.status === 'established' || e.status === 'enduring').length
  const avgImpact = entries.length ? Math.round(entries.reduce((s, e) => s + e.impactScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-amber-400" />
            Legacy Builder
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design and build the lasting impact you want to leave.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Pillars</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{building}</div>
          <div className="text-xs text-slate-500">Established</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgImpact}/10</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Legacy Pillar</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as LegacyDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [LegacyDomain, typeof DOMAIN_CONFIG.family][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LegacyStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [LegacyStatus, typeof STATUS_CONFIG.building][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.legacyStatement} onChange={e => setForm(f => ({ ...f, legacyStatement: e.target.value }))}
            placeholder="My legacy statement for this domain *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why does this legacy matter?" className="game-input w-full text-sm" />
          <input value={form.whoItWillTouch} onChange={e => setForm(f => ({ ...f, whoItWillTouch: e.target.value }))}
            placeholder="Who will this impact?" className="game-input w-full text-sm" />
          <input value={form.actionsTaken} onChange={e => setForm(f => ({ ...f, actionsTaken: e.target.value }))}
            placeholder="Actions taken toward this legacy" className="game-input w-full text-sm" />
          <input value={form.obstaclesAhead} onChange={e => setForm(f => ({ ...f, obstaclesAhead: e.target.value }))}
            placeholder="Obstacles ahead" className="game-input w-full text-sm" />
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="Next concrete step" className="game-input w-full text-sm" />
          <input value={form.timeHorizon} onChange={e => setForm(f => ({ ...f, timeHorizon: e.target.value }))}
            placeholder="Time horizon (e.g., 10 years, lifetime)" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Potential impact: {form.impactScore}/10</p>
            <input type="range" min={1} max={10} value={form.impactScore}
              onChange={e => setForm(f => ({ ...f, impactScore: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-amber-400">⭐ {e.impactScore}/10</span>
                  {e.timeHorizon && <span className="text-xs text-slate-500">{e.timeHorizon}</span>}
                </div>
                {e.legacyStatement && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.legacyStatement}</p>}
                {e.nextStep && <p className="text-xs text-green-300/70 mt-0.5">→ {e.nextStep}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">A life well-lived is the legacy that echoes through generations.</p>
          </div>
        )}
      </div>
    </div>
  )
}
