import React, { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BeliefCategory = 'self-worth' | 'ability' | 'relationships' | 'money' | 'success' | 'world' | 'safety'
type BeliefStatus = 'identified' | 'challenging' | 'rewriting' | 'integrated'

type Belief = {
  id: string
  created: string
  category: BeliefCategory
  limitingBelief: string
  origin: string
  evidence_for: string
  evidence_against: string
  cost: string
  empoweringRewrite: string
  believabilityOld: number
  believabilityNew: number
  status: BeliefStatus
  actions: string[]
}

const STORAGE_KEY = 'lq-beliefaudit'

const CATEGORY_CONFIG: Record<BeliefCategory, { label: string; color: string; bg: string }> = {
  'self-worth':  { label: 'Self-Worth',   color: '#f43f5e', bg: '#4c0519' },
  ability:       { label: 'Ability',      color: '#a78bfa', bg: '#2e1065' },
  relationships: { label: 'Relationships',color: '#fb923c', bg: '#431407' },
  money:         { label: 'Money',        color: '#34d399', bg: '#064e3b' },
  success:       { label: 'Success',      color: '#fbbf24', bg: '#451a03' },
  world:         { label: 'World',        color: '#60a5fa', bg: '#172554' },
  safety:        { label: 'Safety',       color: '#94a3b8', bg: '#0f172a' },
}

const STATUS_CONFIG: Record<BeliefStatus, { label: string; color: string }> = {
  identified:  { label: 'Identified', color: '#ef4444' },
  challenging: { label: 'Challenging', color: '#f59e0b' },
  rewriting:   { label: 'Rewriting', color: '#a78bfa' },
  integrated:  { label: 'Integrated', color: '#22c55e' },
}

const ZapIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Zap className={className} style={style} />
)

const emptyBelief: Omit<Belief, 'id' | 'created'> = {
  category: 'self-worth',
  limitingBelief: '',
  origin: '',
  evidence_for: '',
  evidence_against: '',
  cost: '',
  empoweringRewrite: '',
  believabilityOld: 8,
  believabilityNew: 3,
  status: 'identified',
  actions: [''],
}

export default function BeliefAudit() {
  const { toastSuccess } = useToast()
  const [beliefs, setBeliefs] = useState<Belief[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Belief, 'id' | 'created'>>(emptyBelief)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'beliefs' | 'heatmap' | 'integration'>('beliefs')
  const [actionInput, setActionInput] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setBeliefs(JSON.parse(raw) as Belief[])
    } catch { /**/ }
  }, [])

  const persist = (next: Belief[]) => {
    setBeliefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const submitBelief = () => {
    if (!form.limitingBelief.trim()) return
    const cleanedActions = form.actions.filter(a => a.trim())
    const entry: Belief = {
      id: Date.now().toString(),
      created: new Date().toISOString().split('T')[0],
      ...form,
      actions: cleanedActions,
    }
    persist([entry, ...beliefs])
    setForm(emptyBelief)
    setActionInput('')
    setShowForm(false)
    toastSuccess('Belief audited — liberation begins')
  }

  const deleteBelief = (id: string) => {
    persist(beliefs.filter(b => b.id !== id))
  }

  const updateStatus = (id: string, status: BeliefStatus) => {
    persist(beliefs.map(b => b.id === id ? { ...b, status } : b))
    toastSuccess('Status updated')
  }

  const toggleActionDone = (beliefId: string, actionIdx: number) => {
    persist(beliefs.map(b => {
      if (b.id !== beliefId) return b
      const actions = [...b.actions]
      const action = actions[actionIdx]
      if (action.startsWith('[done]')) {
        actions[actionIdx] = action.slice(6)
      } else {
        actions[actionIdx] = '[done]' + action
      }
      return { ...b, actions }
    }))
  }

  const addFormAction = () => {
    if (!actionInput.trim()) return
    setForm(f => ({ ...f, actions: [...f.actions.filter(a => a.trim()), actionInput.trim()] }))
    setActionInput('')
  }

  const removeFormAction = (idx: number) => {
    setForm(f => ({ ...f, actions: f.actions.filter((_, i) => i !== idx) }))
  }

  const liberationScore = beliefs.length
    ? Math.round(beliefs.reduce((s, b) => s + (b.believabilityNew - b.believabilityOld), 0) / beliefs.length * 10) / 10
    : 0

  const categoryStats = (Object.keys(CATEGORY_CONFIG) as BeliefCategory[]).map(cat => ({
    cat,
    count: beliefs.filter(b => b.category === cat).length,
  })).sort((a, b) => b.count - a.count)

  const maxCount = Math.max(...categoryStats.map(c => c.count), 1)

  const integrationBeliefs = beliefs.filter(b => b.status === 'challenging' || b.status === 'rewriting')

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <ZapIcon className="w-7 h-7" style={{ color: '#c084fc' }} />
            Belief Audit
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Rewrite the beliefs that quietly run your life</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
          style={{ background: '#2d1b4e', color: '#c084fc', border: '1px solid #7c3aed' }}>
          <Plus className="w-4 h-4" />
          Audit Belief
        </button>
      </div>

      <div className="game-card p-5" style={{ background: 'linear-gradient(135deg, #12001f 0%, #2d1b4e 100%)', border: '1px solid #4c1d95' }}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-center">
            <div className="text-5xl font-black" style={{
              color: liberationScore >= 0 ? '#c084fc' : '#ef4444',
              fontFamily: 'Orbitron, monospace',
            }}>
              {liberationScore > 0 ? '+' : ''}{liberationScore}
            </div>
            <div className="text-sm font-semibold mt-1" style={{ color: '#a78bfa' }}>Liberation Score</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>avg believability shift</div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{beliefs.length}</div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Beliefs Audited</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                {beliefs.filter(b => b.status === 'integrated').length}
              </div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Integrated</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                {integrationBeliefs.length}
              </div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-5" style={{ background: '#0d001a', border: '1px solid #7c3aed' }}>
          <h3 className="font-bold mb-4" style={{ color: '#c084fc' }}>Audit a Limiting Belief</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Category</label>
              <select className="game-input w-full"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as BeliefCategory }))}>
                {(Object.keys(CATEGORY_CONFIG) as BeliefCategory[]).map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Status</label>
              <select className="game-input w-full"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as BeliefStatus }))}>
                {(Object.keys(STATUS_CONFIG) as BeliefStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Limiting Belief</label>
              <textarea className="game-input w-full" rows={2}
                placeholder='e.g. "I am not smart enough to..."'
                value={form.limitingBelief}
                onChange={e => setForm(f => ({ ...f, limitingBelief: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Origin — where/when did this come from?</label>
              <textarea className="game-input w-full" rows={2}
                value={form.origin}
                onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Evidence For</label>
              <textarea className="game-input w-full" rows={2}
                value={form.evidence_for}
                onChange={e => setForm(f => ({ ...f, evidence_for: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Evidence Against</label>
              <textarea className="game-input w-full" rows={2}
                value={form.evidence_against}
                onChange={e => setForm(f => ({ ...f, evidence_against: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Cost — how has this belief limited you?</label>
              <textarea className="game-input w-full" rows={2}
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Empowering Rewrite</label>
              <textarea className="game-input w-full" rows={2}
                placeholder='e.g. "I am capable of learning anything I commit to..."'
                value={form.empoweringRewrite}
                onChange={e => setForm(f => ({ ...f, empoweringRewrite: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#ef4444' }}>
                Old Believability: {form.believabilityOld}/10
              </label>
              <input type="range" min={1} max={10} className="w-full"
                value={form.believabilityOld}
                onChange={e => setForm(f => ({ ...f, believabilityOld: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#22c55e' }}>
                New Believability: {form.believabilityNew}/10
              </label>
              <input type="range" min={1} max={10} className="w-full"
                value={form.believabilityNew}
                onChange={e => setForm(f => ({ ...f, believabilityNew: Number(e.target.value) }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Actions to reinforce new belief</label>
              <div className="flex gap-2 mb-2">
                <input className="game-input flex-1" placeholder="Add an action..."
                  value={actionInput}
                  onChange={e => setActionInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFormAction() } }} />
                <button onClick={addFormAction}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ background: '#2d1b4e', color: '#c084fc', border: '1px solid #7c3aed' }}>
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {form.actions.filter(a => a.trim()).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-white">{a}</span>
                    <button onClick={() => removeFormAction(i)} style={{ color: '#64748b' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submitBelief}
              className="px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: '#2d1b4e', color: '#c084fc', border: '1px solid #7c3aed' }}>
              Save Belief
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm" style={{ color: '#64748b' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {(['beliefs', 'heatmap', 'integration'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              background: activeTab === tab ? '#2d1b4e' : 'transparent',
              color: activeTab === tab ? '#c084fc' : '#64748b',
              border: activeTab === tab ? '1px solid #7c3aed' : '1px solid transparent',
            }}>
            {tab === 'integration' ? 'Integration' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'beliefs' && (
        <div className="space-y-4">
          {beliefs.length === 0 && (
            <div className="game-card p-8 text-center" style={{ border: '1px solid #2d1b4e' }}>
              <ZapIcon className="w-10 h-10 mx-auto mb-3" style={{ color: '#2d1b4e' }} />
              <p style={{ color: '#64748b' }}>No beliefs audited yet. Start by identifying a limiting belief.</p>
            </div>
          )}
          {beliefs.map(b => {
            const cat = CATEGORY_CONFIG[b.category]
            const oldPct = (b.believabilityOld / 10) * 100
            const newPct = (b.believabilityNew / 10) * 100
            const shift = b.believabilityNew - b.believabilityOld
            return (
              <div key={b.id} className="game-card p-4" style={{ background: '#0d001a', border: `1px solid ${cat.color}30` }}>
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${STATUS_CONFIG[b.status].color}20`, color: STATUS_CONFIG[b.status].color }}>
                        {STATUS_CONFIG[b.status].label}
                      </span>
                      <span className="text-xs font-bold"
                        style={{ color: shift < 0 ? '#22c55e' : '#ef4444' }}>
                        {shift < 0 ? '' : '+'}{shift} shift
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">{b.limitingBelief}</p>

                    <div className="mt-3">
                      <div className="text-xs mb-1.5 flex justify-between" style={{ color: '#94a3b8' }}>
                        <span>Belief Migration</span>
                        <span style={{ color: '#64748b' }}>{b.created}</span>
                      </div>
                      <div className="relative h-6">
                        <svg width="100%" height="24" viewBox="0 0 300 24" preserveAspectRatio="none">
                          <rect x="0" y="8" width="300" height="8" rx="4" fill="#1e0933" />
                          <rect x="0" y="8" width={Math.round(300 * oldPct / 100)} height="8" rx="4" fill="#ef4444" opacity="0.5" />
                          <rect x="0" y="8" width={Math.round(300 * newPct / 100)} height="8" rx="4" fill="#22c55e" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-between text-xs px-1 pointer-events-none">
                          <span style={{ color: '#ef4444', fontSize: '10px' }}>Old: {b.believabilityOld}/10</span>
                          <span style={{ color: '#22c55e', fontSize: '10px' }}>New: {b.believabilityNew}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                      className="p-1.5 rounded-lg" style={{ color: '#475569' }}>
                      {expandedId === b.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteBelief(b.id)} className="p-1.5 rounded-lg" style={{ color: '#475569' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedId === b.id && (
                  <div className="mt-4 space-y-2 text-sm border-t pt-3" style={{ borderColor: '#1e0933' }}>
                    {b.origin && <div><span style={{ color: '#94a3b8' }}>Origin: </span><span className="text-white">{b.origin}</span></div>}
                    {b.evidence_for && <div><span style={{ color: '#94a3b8' }}>Evidence for: </span><span style={{ color: '#f87171' }}>{b.evidence_for}</span></div>}
                    {b.evidence_against && <div><span style={{ color: '#94a3b8' }}>Evidence against: </span><span style={{ color: '#86efac' }}>{b.evidence_against}</span></div>}
                    {b.cost && <div><span style={{ color: '#94a3b8' }}>Cost: </span><span style={{ color: '#fca5a5' }}>{b.cost}</span></div>}
                    {b.empoweringRewrite && (
                      <div className="p-3 rounded-lg" style={{ background: '#0d2d1a', border: '1px solid #22c55e30' }}>
                        <span style={{ color: '#86efac', fontSize: '11px', fontWeight: 600 }}>NEW BELIEF: </span>
                        <span style={{ color: '#22c55e' }}>{b.empoweringRewrite}</span>
                      </div>
                    )}
                    {b.actions.length > 0 && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Reinforcement actions:</p>
                        <div className="space-y-1">
                          {b.actions.map((a, i) => (
                            <div key={i} className="text-xs" style={{ color: '#c084fc' }}>• {a}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-1 flex-wrap pt-1">
                      {(Object.keys(STATUS_CONFIG) as BeliefStatus[]).map(s => (
                        <button key={s} onClick={() => updateStatus(b.id, s)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: b.status === s ? `${STATUS_CONFIG[s].color}20` : 'transparent',
                            color: b.status === s ? STATUS_CONFIG[s].color : '#475569',
                            border: b.status === s ? `1px solid ${STATUS_CONFIG[s].color}` : '1px solid #2d1b4e',
                          }}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className="game-card p-5" style={{ background: '#0d001a', border: '1px solid #2d1b4e' }}>
          <h3 className="font-bold mb-4 text-sm" style={{ color: '#c084fc' }}>Category Heatmap</h3>
          {beliefs.length === 0 && (
            <p className="text-sm" style={{ color: '#64748b' }}>Audit beliefs to populate the heatmap.</p>
          )}
          <div className="space-y-3">
            {categoryStats.map(({ cat, count }) => {
              const cfg = CATEGORY_CONFIG[cat]
              const pct = count / maxCount
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span style={{ color: '#64748b' }}>{count} {count === 1 ? 'belief' : 'beliefs'}</span>
                  </div>
                  <svg width="100%" height="20" viewBox="0 0 300 20">
                    <rect x="0" y="6" width="300" height="8" rx="4" fill="#1e0933" />
                    {count > 0 && (
                      <rect x="0" y="6" width={Math.round(300 * pct)} height="8" rx="4" fill={cfg.color} opacity="0.8" />
                    )}
                  </svg>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t" style={{ borderColor: '#1e0933' }}>
            <h4 className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>Status Breakdown</h4>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(STATUS_CONFIG) as BeliefStatus[]).map(s => {
                const count = beliefs.filter(b => b.status === s).length
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_CONFIG[s].color }} />
                    <span className="text-xs text-white">{STATUS_CONFIG[s].label}: {count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integration' && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#64748b' }}>Beliefs in progress — check off your action items</p>
          {integrationBeliefs.length === 0 && (
            <div className="game-card p-6 text-center" style={{ border: '1px solid #2d1b4e' }}>
              <p style={{ color: '#64748b' }}>No beliefs currently being challenged or rewritten.</p>
            </div>
          )}
          {integrationBeliefs.map(b => {
            const cat = CATEGORY_CONFIG[b.category]
            return (
              <div key={b.id} className="game-card p-4" style={{ background: '#0d001a', border: `1px solid ${cat.color}30` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${STATUS_CONFIG[b.status].color}20`, color: STATUS_CONFIG[b.status].color }}>
                    {STATUS_CONFIG[b.status].label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{b.limitingBelief}</p>
                {b.empoweringRewrite && (
                  <p className="text-xs mb-3" style={{ color: '#22c55e' }}>→ {b.empoweringRewrite}</p>
                )}
                {b.actions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Actions:</p>
                    {b.actions.map((a, i) => {
                      const isDone = a.startsWith('[done]')
                      const label = isDone ? a.slice(6) : a
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <button onClick={() => toggleActionDone(b.id, i)}
                            className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                            style={{
                              borderColor: isDone ? '#22c55e' : '#4c1d95',
                              background: isDone ? '#14532d' : 'transparent',
                            }}>
                            {isDone && <Check className="w-3 h-3" style={{ color: '#22c55e' }} />}
                          </button>
                          <span className="text-xs" style={{
                            color: isDone ? '#475569' : '#c084fc',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {b.actions.length === 0 && (
                  <p className="text-xs" style={{ color: '#475569' }}>No actions defined for this belief.</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
