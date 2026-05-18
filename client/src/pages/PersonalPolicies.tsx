import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PolicyArea = 'health' | 'finance' | 'relationships' | 'work' | 'digital' | 'social' | 'time' | 'other'
type PolicyStatus = 'active' | 'testing' | 'retired'

interface Policy {
  id: string
  title: string
  rule: string
  area: PolicyArea
  status: PolicyStatus
  reason: string
  exceptions: string
  reviewDate: string
  violations: number
  wins: number
  createdAt: string
}

const AREA_CONFIG: Record<PolicyArea, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',        emoji: '❤️', color: '#ef4444' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#22c55e' },
  relationships: { label: 'Relationships', emoji: '👥', color: '#ec4899' },
  work:          { label: 'Work',          emoji: '💼', color: '#3b82f6' },
  digital:       { label: 'Digital',       emoji: '📱', color: '#6366f1' },
  social:        { label: 'Social',        emoji: '🤝', color: '#f59e0b' },
  time:          { label: 'Time',          emoji: '⏰', color: '#f97316' },
  other:         { label: 'Other',         emoji: '📜', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<PolicyStatus, { label: string; color: string }> = {
  active:  { label: 'Active',   color: '#22c55e' },
  testing: { label: 'Testing',  color: '#f59e0b' },
  retired: { label: 'Retired',  color: '#94a3b8' },
}

const STORAGE_KEY = 'personal_policies'

const DEFAULT_EXAMPLES = [
  { title: 'No phone at meals', area: 'digital' as PolicyArea, rule: 'Phone stays face-down during every meal with others' },
  { title: 'Sleep before midnight', area: 'health' as PolicyArea, rule: 'Lights out by 11:30pm on work nights' },
  { title: '24-hour purchase rule', area: 'finance' as PolicyArea, rule: 'Wait 24h before buying anything over $50' },
]

export default function PersonalPolicies() {
  const { toastSuccess } = useToast()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [form, setForm] = useState<Omit<Policy, 'id' | 'createdAt' | 'violations' | 'wins'>>({
    title: '', rule: '', area: 'health', status: 'active', reason: '', exceptions: '',
    reviewDate: (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0] })(),
  })

  useEffect(() => {
    try { setPolicies(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Policy[]) => { setPolicies(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.rule.trim()) return
    const p: Policy = { id: Date.now().toString(), ...form, violations: 0, wins: 0, createdAt: new Date().toISOString() }
    save([p, ...policies])
    setForm({ title: '', rule: '', area: 'health', status: 'active', reason: '', exceptions: '', reviewDate: (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0] })() })
    setShowForm(false)
    toastSuccess('Policy added 📜')
  }

  const logEvent = (id: string, type: 'win' | 'violation') => {
    save(policies.map(p => p.id === id ? { ...p, [type === 'win' ? 'wins' : 'violations']: p[type === 'win' ? 'wins' : 'violations'] + 1 } : p))
    toastSuccess(type === 'win' ? 'Policy upheld! 🎯' : 'Violation noted — keep going 💪')
  }

  const active = policies.filter(p => p.status === 'active').length
  const totalWins = policies.reduce((s, p) => s + p.wins, 0)
  const filtered = policies.filter(p => filterArea === 'all' || p.area === filterArea)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Personal Policies
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your personal rules for living well.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{totalWins}</div>
          <div className="text-xs text-slate-500">Times Upheld</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{policies.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      {policies.length === 0 && !showForm && (
        <div className="game-card p-4 border border-blue-500/10 space-y-2">
          <p className="text-xs text-slate-500 mb-3">Examples to inspire you:</p>
          {DEFAULT_EXAMPLES.map((ex, i) => {
            const a = AREA_CONFIG[ex.area]
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span>{a.emoji}</span>
                <div>
                  <span className="text-slate-300">{ex.title}</span>
                  <p className="text-slate-600">{ex.rule}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Area filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(AREA_CONFIG) as [PolicyArea, typeof AREA_CONFIG.health][]).map(([k, a]) => {
          if (!policies.some(p => p.area === k)) return null
          return (
            <button key={k} onClick={() => setFilterArea(k)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterArea === k ? { background: a.color + '30', color: a.color } : {}}>
              {a.emoji} {a.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Policy</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Policy name (short) *" className="game-input w-full" autoFocus />
          <textarea value={form.rule} onChange={e => setForm(f => ({ ...f, rule: e.target.value }))}
            placeholder="The exact rule in clear terms *" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as PolicyArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [PolicyArea, typeof AREA_CONFIG.health][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PolicyStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [PolicyStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="Why this rule matters to you" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.exceptions} onChange={e => setForm(f => ({ ...f, exceptions: e.target.value }))}
            placeholder="Exceptions (if any)" className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Review date:</span>
            <input type="date" value={form.reviewDate} onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save Policy</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(p => {
          const a = AREA_CONFIG[p.area]
          const s = STATUS_CONFIG[p.status]
          const isExp = expanded === p.id
          const winRate = p.wins + p.violations > 0 ? ((p.wins / (p.wins + p.violations)) * 100).toFixed(0) : null
          return (
            <div key={p.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : p.id)}>
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{p.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{p.rule}</p>
                </div>
                {winRate && <span className="text-xs text-green-400">{winRate}%</span>}
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {p.reason && <p className="text-xs text-slate-400 italic">"{p.reason}"</p>}
                  {p.exceptions && <p className="text-xs text-slate-500">Exceptions: {p.exceptions}</p>}
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span className="text-green-400">{p.wins} upheld</span>
                    <span className="text-red-400">{p.violations} violated</span>
                    {p.reviewDate && <span>Review: {p.reviewDate}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => logEvent(p.id, 'win')} className="flex-1 py-1.5 bg-green-700/20 text-green-400 rounded-xl text-xs hover:bg-green-700/40">
                      ✓ Upheld
                    </button>
                    <button onClick={() => logEvent(p.id, 'violation')} className="flex-1 py-1.5 bg-red-700/20 text-red-400 rounded-xl text-xs hover:bg-red-700/40">
                      ✗ Violated
                    </button>
                    <button onClick={() => save(policies.filter(x => x.id !== p.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && policies.length > 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">No policies in this area.</div>
        )}
        {policies.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Define your personal rules to live by.</p>
          </div>
        )}
      </div>
    </div>
  )
}
