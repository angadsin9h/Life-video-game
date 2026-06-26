import React, { useState, useEffect } from 'react'
import { Building2, Plus, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp, ClipboardList, BarChart3, Settings } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LifeArea = 'nutrition' | 'movement' | 'sleep' | 'focus' | 'social' | 'finance' | 'learning' | 'creativity'

type ChoiceDefault = {
  id: string
  area: LifeArea
  behavior: string
  currentDefault: string
  desiredDefault: string
  environmentChange: string
  frictionRemoved: string
  frictionAdded: string
  implemented: boolean
  effectivenessRating: number
}

type ChoiceAudit = {
  id: string
  date: string
  decision: string
  wasDefault: boolean
  defaultQuality: 'good' | 'neutral' | 'bad'
  reflection: string
}

type Tab = 'library' | 'audit' | 'chart'

const AREA_CONFIG: Record<LifeArea, { label: string; color: string }> = {
  nutrition:  { label: 'Nutrition',   color: '#22c55e' },
  movement:   { label: 'Movement',    color: '#f97316' },
  sleep:      { label: 'Sleep',       color: '#6366f1' },
  focus:      { label: 'Focus',       color: '#3b82f6' },
  social:     { label: 'Social',      color: '#ec4899' },
  finance:    { label: 'Finance',     color: '#f59e0b' },
  learning:   { label: 'Learning',    color: '#a855f7' },
  creativity: { label: 'Creativity',  color: '#10b981' },
}

const AREAS = Object.keys(AREA_CONFIG) as LifeArea[]
const STORAGE_KEY = 'lq-choicearchitecture'

const emptyDefault = (): Omit<ChoiceDefault, 'id'> => ({
  area: 'nutrition',
  behavior: '',
  currentDefault: '',
  desiredDefault: '',
  environmentChange: '',
  frictionRemoved: '',
  frictionAdded: '',
  implemented: false,
  effectivenessRating: 5,
})

const emptyAudit = (): Omit<ChoiceAudit, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  decision: '',
  wasDefault: false,
  defaultQuality: 'good',
  reflection: '',
})

function DonutChart({ audits }: { audits: ChoiceAudit[] }) {
  const defaults = audits.filter(a => a.wasDefault)
  const good = defaults.filter(a => a.defaultQuality === 'good').length
  const bad = defaults.filter(a => a.defaultQuality === 'bad').length
  const conscious = audits.filter(a => !a.wasDefault).length
  const total = audits.length

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Log some decisions to see your choice breakdown
      </div>
    )
  }

  const r = 70
  const cx = 110
  const cy = 90
  const circumference = 2 * Math.PI * r

  const segments: Array<{ count: number; color: string; label: string }> = [
    { count: good,      color: '#22c55e', label: 'Good defaults' },
    { count: bad,       color: '#ef4444', label: 'Bad defaults' },
    { count: conscious, color: '#f59e0b', label: 'Conscious choices' },
  ]

  let offset = 0
  const arcs = segments.map(seg => {
    const frac = seg.count / total
    const dash = frac * circumference
    const gap = circumference - dash
    const arc = { ...seg, frac, dash, gap, offset }
    offset += dash
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={220} height={180} className="block">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={28} />
        {arcs.map((arc, i) => (
          arc.frac > 0 && (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={28}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset + circumference * 0.25}
              style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          )
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#f1f5f9" fontSize={22} fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={10}>decisions</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-3">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs text-slate-400">{seg.label} <span className="text-slate-200 font-semibold">{seg.count}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EnvironmentScore({ defaults }: { defaults: ChoiceDefault[] }) {
  const implemented = defaults.filter(d => d.implemented)
  const highRated = implemented.filter(d => d.effectivenessRating >= 7)
  const score = implemented.length === 0 ? 0 : Math.round((highRated.length / implemented.length) * 100)

  const r = 50
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r
  const dash = (score / 100) * circumference

  return (
    <div className="game-card p-4 flex items-center gap-5">
      <svg width={140} height={140}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={14} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={14}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f59e0b" fontSize={22} fontWeight="bold" fontFamily="Orbitron, monospace">{score}</text>
        <text x={cx} y={cx + 12} textAnchor="middle" fill="#94a3b8" fontSize={9}>ENV SCORE</text>
      </svg>
      <div className="flex-1">
        <div className="text-white font-semibold text-base mb-1">Environment Score</div>
        <div className="text-slate-400 text-xs mb-3">% of implemented defaults rated ≥ 7</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Total defaults</span>
            <span className="text-slate-200">{defaults.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Implemented</span>
            <span className="text-amber-400">{implemented.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">High effectiveness</span>
            <span className="text-green-400">{highRated.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

type DefaultCardProps = {
  d: ChoiceDefault
  onToggle: (id: string) => void
  onRating: (id: string, r: number) => void
  onDelete: (id: string) => void
}

function DefaultCard({ d, onToggle, onRating, onDelete }: DefaultCardProps) {
  const [expanded, setExpanded] = useState(false)
  const areaConf = AREA_CONFIG[d.area]

  return (
    <div className={`game-card p-4 border-l-4 transition-all`} style={{ borderLeftColor: areaConf.color }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button onClick={() => onToggle(d.id)} className="mt-0.5 flex-shrink-0">
            {d.implemented
              ? <CheckCircle className="w-5 h-5 text-amber-400" />
              : <Circle className="w-5 h-5 text-slate-500" />
            }
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: areaConf.color + '22', color: areaConf.color }}>{areaConf.label}</span>
              {d.implemented && <span className="text-xs text-amber-400 font-medium">Implemented</span>}
            </div>
            <div className="text-white font-semibold mt-1 text-sm">{d.behavior || <span className="text-slate-500 italic">No behavior set</span>}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)} className="p-1 text-slate-400 hover:text-slate-200">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(d.id)} className="p-1 text-slate-500 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 pl-8">
          {d.currentDefault && (
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Current default</div>
              <div className="text-sm text-red-300">{d.currentDefault}</div>
            </div>
          )}
          {d.desiredDefault && (
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Desired default</div>
              <div className="text-sm text-green-300">{d.desiredDefault}</div>
            </div>
          )}
          {d.environmentChange && (
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Environment change</div>
              <div className="text-sm text-amber-200">{d.environmentChange}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {d.frictionRemoved && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Friction removed</div>
                <div className="text-xs text-slate-300">{d.frictionRemoved}</div>
              </div>
            )}
            {d.frictionAdded && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Friction added (to bad)</div>
                <div className="text-xs text-slate-300">{d.frictionAdded}</div>
              </div>
            )}
          </div>
          {d.implemented && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Effectiveness: <span className="text-amber-400 font-semibold">{d.effectivenessRating}/10</span></div>
              <input
                type="range" min={1} max={10} value={d.effectivenessRating}
                onChange={e => onRating(d.id, Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ChoiceArchitecture() {
  const { toastSuccess } = useToast()
  const [defaults, setDefaults] = useState<ChoiceDefault[]>([])
  const [audits, setAudits] = useState<ChoiceAudit[]>([])
  const [tab, setTab] = useState<Tab>('library')
  const [showForm, setShowForm] = useState(false)
  const [filterArea, setFilterArea] = useState<LifeArea | 'all'>('all')
  const [form, setForm] = useState<Omit<ChoiceDefault, 'id'>>(emptyDefault())
  const [auditForm, setAuditForm] = useState<Omit<ChoiceAudit, 'id'>>(emptyAudit())
  const [showAuditForm, setShowAuditForm] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (stored.defaults) setDefaults(stored.defaults)
      if (stored.audits) setAudits(stored.audits)
    } catch { /**/ }
  }, [])

  const persist = (d: ChoiceDefault[], a: ChoiceAudit[]) => {
    setDefaults(d)
    setAudits(a)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ defaults: d, audits: a }))
  }

  const addDefault = () => {
    if (!form.behavior.trim()) return
    const entry: ChoiceDefault = { id: Date.now().toString(), ...form }
    persist([entry, ...defaults], audits)
    setForm(emptyDefault())
    setShowForm(false)
    toastSuccess('Default added to your architecture')
  }

  const toggleImplemented = (id: string) => {
    persist(defaults.map(d => d.id === id ? { ...d, implemented: !d.implemented } : d), audits)
  }

  const updateRating = (id: string, r: number) => {
    persist(defaults.map(d => d.id === id ? { ...d, effectivenessRating: r } : d), audits)
  }

  const deleteDefault = (id: string) => {
    persist(defaults.filter(d => d.id !== id), audits)
  }

  const addAudit = () => {
    if (!auditForm.decision.trim()) return
    const entry: ChoiceAudit = { id: Date.now().toString(), ...auditForm }
    persist(defaults, [entry, ...audits])
    setAuditForm(emptyAudit())
    setShowAuditForm(false)
    toastSuccess('Decision audited')
  }

  const deleteAudit = (id: string) => {
    persist(defaults, audits.filter(a => a.id !== id))
  }

  const filteredDefaults = filterArea === 'all' ? defaults : defaults.filter(d => d.area === filterArea)

  const QUALITY_COLOR: Record<ChoiceAudit['defaultQuality'], string> = {
    good: '#22c55e', neutral: '#f59e0b', bad: '#ef4444',
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Building2 className="w-6 h-6 text-amber-400" />
            Choice Architecture
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design your environment so good behavior is the path of least resistance</p>
        </div>
      </div>

      <EnvironmentScore defaults={defaults} />

      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
        {([['library', Building2, 'Library'], ['audit', ClipboardList, 'Audit'], ['chart', BarChart3, 'Breakdown']] as const).map(([t, Icon, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value as LifeArea | 'all')}
              className="game-input text-sm py-1.5"
            >
              <option value="all">All areas</option>
              {AREAS.map(a => <option key={a} value={a}>{AREA_CONFIG[a].label}</option>)}
            </select>
            <div className="flex-1" />
            <button
              onClick={() => setShowForm(f => !f)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Default
            </button>
          </div>

          {showForm && (
            <div className="game-card p-5 space-y-4 border border-amber-500/30">
              <div className="text-amber-400 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Design a New Default
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Life Area</label>
                  <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as LifeArea }))} className="game-input w-full text-sm">
                    {AREAS.map(a => <option key={a} value={a}>{AREA_CONFIG[a].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Desired Behavior</label>
                  <input value={form.behavior} onChange={e => setForm(f => ({ ...f, behavior: e.target.value }))} placeholder="e.g. Drink water first thing" className="game-input w-full text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Current Default (what happens now)</label>
                  <input value={form.currentDefault} onChange={e => setForm(f => ({ ...f, currentDefault: e.target.value }))} placeholder="e.g. Check phone immediately" className="game-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Desired Default</label>
                  <input value={form.desiredDefault} onChange={e => setForm(f => ({ ...f, desiredDefault: e.target.value }))} placeholder="e.g. Drink full glass of water" className="game-input w-full text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Environment Change</label>
                <input value={form.environmentChange} onChange={e => setForm(f => ({ ...f, environmentChange: e.target.value }))} placeholder="e.g. Put a glass of water on the nightstand" className="game-input w-full text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Friction Removed (from good)</label>
                  <input value={form.frictionRemoved} onChange={e => setForm(f => ({ ...f, frictionRemoved: e.target.value }))} placeholder="e.g. No need to get up to get water" className="game-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Friction Added (to bad)</label>
                  <input value={form.frictionAdded} onChange={e => setForm(f => ({ ...f, frictionAdded: e.target.value }))} placeholder="e.g. Phone charger in other room" className="game-input w-full text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
                <button onClick={addDefault} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold">Add Default</button>
              </div>
            </div>
          )}

          {filteredDefaults.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="text-sm">No defaults yet. Start designing your environment.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDefaults.map(d => (
                <DefaultCard key={d.id} d={d} onToggle={toggleImplemented} onRating={updateRating} onDelete={deleteDefault} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-slate-300 text-sm">{audits.length} decisions audited</div>
            <button
              onClick={() => setShowAuditForm(f => !f)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log Decision
            </button>
          </div>

          {showAuditForm && (
            <div className="game-card p-5 space-y-4 border border-amber-500/30">
              <div className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Audit a Decision</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date</label>
                  <input type="date" value={auditForm.date} onChange={e => setAuditForm(f => ({ ...f, date: e.target.value }))} className="game-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Default Quality</label>
                  <select value={auditForm.defaultQuality} onChange={e => setAuditForm(f => ({ ...f, defaultQuality: e.target.value as ChoiceAudit['defaultQuality'] }))} className="game-input w-full text-sm">
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="bad">Bad</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Decision</label>
                <input value={auditForm.decision} onChange={e => setAuditForm(f => ({ ...f, decision: e.target.value }))} placeholder="What did you decide?" className="game-input w-full text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="wasDefault" checked={auditForm.wasDefault} onChange={e => setAuditForm(f => ({ ...f, wasDefault: e.target.checked }))} className="accent-amber-400" />
                <label htmlFor="wasDefault" className="text-sm text-slate-300">This was a default (automatic) choice</label>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reflection</label>
                <textarea value={auditForm.reflection} onChange={e => setAuditForm(f => ({ ...f, reflection: e.target.value }))} placeholder="What does this reveal?" className="game-input w-full text-sm h-20 resize-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAuditForm(false)} className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
                <button onClick={addAudit} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold">Log Decision</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {audits.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <div className="text-sm">No decisions audited yet.</div>
              </div>
            ) : (
              audits.map(a => (
                <div key={a.id} className="game-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">{a.date}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: QUALITY_COLOR[a.defaultQuality] + '22', color: QUALITY_COLOR[a.defaultQuality] }}>
                          {a.defaultQuality}
                        </span>
                        {a.wasDefault && <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">default</span>}
                      </div>
                      <div className="text-white text-sm font-medium mt-1">{a.decision}</div>
                      {a.reflection && <div className="text-slate-400 text-xs mt-1 italic">{a.reflection}</div>}
                    </div>
                    <button onClick={() => deleteAudit(a.id)} className="text-slate-500 hover:text-red-400 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'chart' && (
        <div className="space-y-4">
          <div className="game-card p-5">
            <div className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Decision Breakdown</div>
            <DonutChart audits={audits} />
          </div>

          <div className="game-card p-5">
            <div className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Defaults by Area</div>
            {defaults.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-4">No defaults in library yet</div>
            ) : (
              <div className="space-y-2">
                {AREAS.map(area => {
                  const areaDefaults = defaults.filter(d => d.area === area)
                  const implemented = areaDefaults.filter(d => d.implemented)
                  if (areaDefaults.length === 0) return null
                  const pct = Math.round((implemented.length / areaDefaults.length) * 100)
                  return (
                    <div key={area} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-slate-400 text-right">{AREA_CONFIG[area].label}</div>
                      <div className="flex-1 h-5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: AREA_CONFIG[area].color }}
                        />
                      </div>
                      <div className="w-16 text-xs text-slate-400">{implemented.length}/{areaDefaults.length}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
