import React, { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, Target, AlertTriangle, CheckSquare, Square, ChevronDown, ChevronUp, Flag } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Domain = 'work' | 'health' | 'relationships' | 'finance' | 'learning' | 'creative' | 'personal'
type Status = 'active' | 'succeeded' | 'failed' | 'abandoned'

type PreMortemObstacle = {
  id: string
  description: string
  probability: number
  impact: number
  mitigation: string
  contingency: string
  occurred: boolean
}

type PreMortem = {
  id: string
  created: string
  goal: string
  targetDate: string
  domain: Domain
  obstacles: PreMortemObstacle[]
  contingencies: string[]
  successConditions: string
  status: Status
  outcome: string
}

type Tab = 'library' | 'builder' | 'matrix' | 'checklist'

const DOMAIN_CONFIG: Record<Domain, { label: string; color: string }> = {
  work:          { label: 'Work',          color: '#3b82f6' },
  health:        { label: 'Health',        color: '#22c55e' },
  relationships: { label: 'Relationships', color: '#ec4899' },
  finance:       { label: 'Finance',       color: '#f59e0b' },
  learning:      { label: 'Learning',      color: '#a855f7' },
  creative:      { label: 'Creative',      color: '#f97316' },
  personal:      { label: 'Personal',      color: '#06b6d4' },
}

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  active:    { label: 'Active',    color: '#3b82f6' },
  succeeded: { label: 'Succeeded', color: '#22c55e' },
  failed:    { label: 'Failed',    color: '#ef4444' },
  abandoned: { label: 'Abandoned', color: '#6b7280' },
}

const STORAGE_KEY = 'lq-obstaclepremortem'

const emptyObstacle = (): PreMortemObstacle => ({
  id: Date.now().toString() + Math.random(),
  description: '',
  probability: 5,
  impact: 5,
  mitigation: '',
  contingency: '',
  occurred: false,
})

const emptyForm = (): Omit<PreMortem, 'id' | 'created'> => ({
  goal: '',
  targetDate: '',
  domain: 'work',
  obstacles: [emptyObstacle()],
  contingencies: [''],
  successConditions: '',
  status: 'active',
  outcome: '',
})

function riskScore(o: PreMortemObstacle): number {
  return o.probability * o.impact
}

function riskColor(score: number): string {
  if (score >= 64) return '#ef4444'
  if (score >= 36) return '#f59e0b'
  return '#22c55e'
}

function RiskMatrix({ obstacles }: { obstacles: PreMortemObstacle[] }) {
  const W = 280
  const H = 280
  const PAD = 36

  const px = (prob: number) => PAD + ((prob - 1) / 9) * (W - PAD * 2)
  const py = (imp: number) => H - PAD - ((imp - 1) / 9) * (H - PAD * 2)

  return (
    <svg width={W} height={H} className="block mx-auto">
      <defs>
        <linearGradient id="criticalGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#ef444410" />
          <stop offset="100%" stopColor="#ef444435" />
        </linearGradient>
      </defs>

      <rect x={PAD + (W - PAD * 2) / 2} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="url(#criticalGrad)" rx={2} />

      {[2, 4, 6, 8, 10].map(v => {
        const x = px(v)
        const y = py(v)
        return (
          <g key={v}>
            <line x1={x} y1={PAD} x2={x} y2={H - PAD} stroke="#1e3a5f" strokeWidth={1} />
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#1e3a5f" strokeWidth={1} />
            <text x={x} y={H - PAD + 12} textAnchor="middle" fill="#475569" fontSize={9}>{v}</text>
            <text x={PAD - 6} y={y + 3} textAnchor="end" fill="#475569" fontSize={9}>{v}</text>
          </g>
        )
      })}

      <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} fill="none" stroke="#1e3a5f" strokeWidth={1} rx={2} />

      <text x={(W - PAD * 2) * 0.75 + PAD} y={PAD - 6} textAnchor="middle" fill="#ef4444" fontSize={8} fontWeight="bold">CRITICAL</text>
      <text x={W / 2} y={H - 4} textAnchor="middle" fill="#64748b" fontSize={9}>Probability →</text>
      <text x={10} y={H / 2} textAnchor="middle" fill="#64748b" fontSize={9} transform={`rotate(-90, 10, ${H / 2})`}>Impact →</text>

      {obstacles.map((o, i) => {
        const x = px(o.probability)
        const y = py(o.impact)
        const score = riskScore(o)
        const col = riskColor(score)
        return (
          <g key={o.id}>
            <circle cx={x} cy={y} r={7} fill={col} fillOpacity={0.85} stroke="#0f172a" strokeWidth={1.5} />
            <text x={x} y={y + 3.5} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold">{i + 1}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ObstaclePreMortem() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<PreMortem[]>([])
  const [tab, setTab] = useState<Tab>('library')
  const [form, setForm] = useState<Omit<PreMortem, 'id' | 'created'>>(emptyForm())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (next: PreMortem[]) => {
    setItems(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const selected = items.find(i => i.id === selectedId) ?? null

  const updateObstacle = (idx: number, patch: Partial<PreMortemObstacle>) => {
    setForm(f => {
      const obs = [...f.obstacles]
      obs[idx] = { ...obs[idx], ...patch }
      return { ...f, obstacles: obs }
    })
  }

  const addObstacle = () => setForm(f => ({ ...f, obstacles: [...f.obstacles, emptyObstacle()] }))

  const removeObstacle = (idx: number) =>
    setForm(f => ({ ...f, obstacles: f.obstacles.filter((_, i) => i !== idx) }))

  const submit = () => {
    if (!form.goal.trim()) return
    const pm: PreMortem = { id: Date.now().toString(), created: new Date().toISOString(), ...form }
    const next = [pm, ...items]
    persist(next)
    setForm(emptyForm())
    setTab('library')
    toastSuccess('Pre-mortem created', form.goal)
  }

  const toggleOccurred = (pmId: string, obsId: string) => {
    const next = items.map(pm => {
      if (pm.id !== pmId) return pm
      return { ...pm, obstacles: pm.obstacles.map(o => o.id === obsId ? { ...o, occurred: !o.occurred } : o) }
    })
    persist(next)
  }

  const updateOutcome = (pmId: string, outcome: string, status: Status) => {
    const next = items.map(pm => pm.id === pmId ? { ...pm, outcome, status } : pm)
    persist(next)
    toastSuccess('Outcome recorded')
  }

  const deleteItem = (id: string) => persist(items.filter(i => i.id !== id))

  const matrixTarget = selected ?? (items[0] ?? null)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'library', label: 'Library' },
    { key: 'builder', label: 'New Pre-Mortem' },
    { key: 'matrix', label: 'Risk Matrix' },
    { key: 'checklist', label: 'Mitigation' },
  ]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-amber-400 flex-shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Obstacle Pre-Mortem
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Anticipate failure before it happens. Dominate outcomes.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2 px-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No pre-mortems yet. Create one to start anticipating obstacles.</p>
            </div>
          )}
          {items.map(pm => {
            const dom = DOMAIN_CONFIG[pm.domain]
            const st = STATUS_CONFIG[pm.status]
            const maxRisk = pm.obstacles.length
              ? Math.max(...pm.obstacles.map(riskScore))
              : 0
            const criticals = pm.obstacles.filter(o => riskScore(o) >= 64).length
            const isExpanded = expandedId === pm.id
            return (
              <div key={pm.id} className="game-card p-4" style={{ borderLeft: `3px solid ${dom.color}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{pm.goal}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: dom.color + '20', color: dom.color }}>{dom.label}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      <span>Target: {pm.targetDate || '—'}</span>
                      <span>{pm.obstacles.length} obstacles</span>
                      {criticals > 0 && <span className="text-red-400">{criticals} critical</span>}
                      <span>Max risk: <span style={{ color: riskColor(maxRisk) }}>{maxRisk}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedId(pm.id); setTab('matrix') }}
                      className="p-1.5 text-slate-500 hover:text-amber-400"
                      title="View matrix"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : pm.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-300"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteItem(pm.id)} className="p-1.5 text-slate-700 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-slate-700/50 pt-3">
                    {pm.successConditions && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Success looks like:</p>
                        <p className="text-xs text-green-300">{pm.successConditions}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {[...pm.obstacles].sort((a, b) => riskScore(b) - riskScore(a)).map((o, i) => (
                        <div key={o.id} className="flex items-start gap-2 text-xs">
                          <button onClick={() => toggleOccurred(pm.id, o.id)}>
                            {o.occurred
                              ? <CheckSquare className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                              : <Square className="w-3.5 h-3.5 text-slate-600 mt-0.5 flex-shrink-0" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={o.occurred ? 'line-through text-slate-600' : 'text-slate-300'}>
                              {i + 1}. {o.description}
                            </span>
                            <span className="ml-2 font-bold" style={{ color: riskColor(riskScore(o)) }}>
                              [{riskScore(o)}]
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {pm.status === 'active' && (
                      <div className="flex gap-2 pt-1">
                        {(['succeeded', 'failed', 'abandoned'] as Status[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateOutcome(pm.id, pm.outcome, s)}
                            className="text-xs px-3 py-1 rounded-lg font-medium"
                            style={{ background: STATUS_CONFIG[s].color + '25', color: STATUS_CONFIG[s].color }}
                          >
                            Mark {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    )}
                    {pm.outcome && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Outcome:</p>
                        <p className="text-xs text-slate-300">{pm.outcome}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'builder' && (
        <div className="game-card p-5 space-y-4 border border-amber-500/20">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Pre-Mortem Builder</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Goal / Mission *</label>
              <input
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                placeholder="What are you trying to achieve?"
                className="game-input w-full text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Target Date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                className="game-input w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Domain</label>
              <select
                value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value as Domain }))}
                className="game-input w-full text-sm"
              >
                {(Object.entries(DOMAIN_CONFIG) as [Domain, typeof DOMAIN_CONFIG.work][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Success Conditions</label>
              <input
                value={form.successConditions}
                onChange={e => setForm(f => ({ ...f, successConditions: e.target.value }))}
                placeholder="What does success look like specifically?"
                className="game-input w-full text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Obstacles</h3>
              <button
                onClick={addObstacle}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-700/40 hover:bg-amber-700/60 text-amber-300 rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add Obstacle
              </button>
            </div>

            {form.obstacles.map((o, i) => (
              <div key={o.id} className="bg-slate-800/60 rounded-xl p-3 space-y-2 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Obstacle #{i + 1}</span>
                  {form.obstacles.length > 1 && (
                    <button onClick={() => removeObstacle(i)} className="text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  value={o.description}
                  onChange={e => updateObstacle(i, { description: e.target.value })}
                  placeholder="Describe the obstacle / failure mode"
                  className="game-input w-full text-xs"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Probability: {o.probability}/10</p>
                    <input
                      type="range" min={1} max={10} value={o.probability}
                      onChange={e => updateObstacle(i, { probability: Number(e.target.value) })}
                      className="w-full h-1 accent-amber-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Impact: {o.impact}/10</p>
                    <input
                      type="range" min={1} max={10} value={o.impact}
                      onChange={e => updateObstacle(i, { impact: Number(e.target.value) })}
                      className="w-full h-1 accent-red-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Risk score:</span>
                  <span className="text-xs font-bold" style={{ color: riskColor(riskScore(o)) }}>
                    {riskScore(o)}/100
                  </span>
                </div>
                <input
                  value={o.mitigation}
                  onChange={e => updateObstacle(i, { mitigation: e.target.value })}
                  placeholder="How to prevent this obstacle"
                  className="game-input w-full text-xs"
                />
                <input
                  value={o.contingency}
                  onChange={e => updateObstacle(i, { contingency: e.target.value })}
                  placeholder="What to do if it happens anyway"
                  className="game-input w-full text-xs"
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Overall Backup Plans</h3>
              <button
                onClick={() => setForm(f => ({ ...f, contingencies: [...f.contingencies, ''] }))}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {form.contingencies.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={c}
                  onChange={e => {
                    const next = [...form.contingencies]
                    next[i] = e.target.value
                    setForm(f => ({ ...f, contingencies: next }))
                  }}
                  placeholder={`Backup plan ${i + 1}`}
                  className="game-input flex-1 text-xs"
                />
                {form.contingencies.length > 1 && (
                  <button
                    onClick={() => setForm(f => ({ ...f, contingencies: f.contingencies.filter((_, j) => j !== i) }))}
                    className="text-slate-700 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={submit}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold"
            >
              Deploy Pre-Mortem
            </button>
            <button
              onClick={() => setForm(emptyForm())}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {tab === 'matrix' && (
        <div className="space-y-4">
          {items.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Select Pre-Mortem</label>
              <select
                value={selectedId ?? ''}
                onChange={e => setSelectedId(e.target.value || null)}
                className="game-input w-full text-sm"
              >
                <option value="">— latest ({items[0]?.goal}) —</option>
                {items.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.goal}</option>
                ))}
              </select>
            </div>
          )}

          {matrixTarget ? (
            <div className="game-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">{matrixTarget.goal}</h3>
              <p className="text-xs text-slate-500 mb-4">{matrixTarget.obstacles.length} obstacles mapped</p>

              <RiskMatrix obstacles={matrixTarget.obstacles} />

              <div className="mt-4 space-y-2">
                {[...matrixTarget.obstacles]
                  .sort((a, b) => riskScore(b) - riskScore(a))
                  .map((o, i) => (
                    <div key={o.id} className="flex items-center gap-3 text-xs">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: riskColor(riskScore(o)) }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-slate-300 flex-1 min-w-0 truncate">{o.description || '(no description)'}</span>
                      <span className="font-bold flex-shrink-0" style={{ color: riskColor(riskScore(o)) }}>
                        {riskScore(o)}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="mt-4 flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Critical ≥64</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> High ≥36</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Manageable</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Create a pre-mortem first to see the risk matrix.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'checklist' && (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No pre-mortems to show mitigations for.</p>
            </div>
          ) : (
            items.map(pm => {
              const sorted = [...pm.obstacles].sort((a, b) => riskScore(b) - riskScore(a))
              return (
                <div key={pm.id} className="game-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">{pm.goal}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[pm.status].color + '20', color: STATUS_CONFIG[pm.status].color }}>
                      {STATUS_CONFIG[pm.status].label}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {sorted.map((o, i) => (
                      <div key={o.id} className="border-l-2 pl-3" style={{ borderColor: riskColor(riskScore(o)) }}>
                        <div className="flex items-start gap-2">
                          <button onClick={() => toggleOccurred(pm.id, o.id)} className="flex-shrink-0 mt-0.5">
                            {o.occurred
                              ? <CheckSquare className="w-4 h-4 text-red-400" />
                              : <Square className="w-4 h-4 text-slate-600" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${o.occurred ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                                {i + 1}. {o.description || '(unnamed)'}
                              </span>
                              <span className="text-xs font-bold flex-shrink-0" style={{ color: riskColor(riskScore(o)) }}>
                                Risk {riskScore(o)}
                              </span>
                            </div>
                            {o.mitigation && (
                              <p className="text-xs text-amber-300/80 mt-1">
                                <Flag className="w-3 h-3 inline mr-1" />Prevent: {o.mitigation}
                              </p>
                            )}
                            {o.contingency && (
                              <p className="text-xs text-blue-300/70 mt-0.5">
                                If occurs: {o.contingency}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pm.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                      <p className="text-xs text-slate-500">Add outcome note:</p>
                      <div className="flex gap-2">
                        <input
                          defaultValue={pm.outcome}
                          onBlur={e => {
                            if (e.target.value !== pm.outcome) {
                              updateOutcome(pm.id, e.target.value, pm.status)
                            }
                          }}
                          placeholder="How did this play out?"
                          className="game-input flex-1 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        {(['succeeded', 'failed', 'abandoned'] as Status[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateOutcome(pm.id, pm.outcome, s)}
                            className="text-xs px-3 py-1 rounded-lg font-medium"
                            style={{ background: STATUS_CONFIG[s].color + '25', color: STATUS_CONFIG[s].color }}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
