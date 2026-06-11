import React, { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type QuantumLeap = {
  id: string
  date: string
  title: string
  domain: 'identity' | 'skills' | 'relationships' | 'beliefs' | 'health' | 'career' | 'wealth' | 'consciousness'
  beforeState: string
  catalyst: string
  afterState: string
  evidenceOfChange: string[]
  resistances: string[]
  newCapabilities: string[]
  leapSize: number
  integration: number
}

const DOMAIN_CONFIG: Record<QuantumLeap['domain'], { label: string; color: string; glow: string }> = {
  identity:      { label: 'Identity',      color: '#a855f7', glow: '#a855f740' },
  skills:        { label: 'Skills',        color: '#3b82f6', glow: '#3b82f640' },
  relationships: { label: 'Relationships', color: '#ec4899', glow: '#ec489940' },
  beliefs:       { label: 'Beliefs',       color: '#8b5cf6', glow: '#8b5cf640' },
  health:        { label: 'Health',        color: '#22c55e', glow: '#22c55e40' },
  career:        { label: 'Career',        color: '#f59e0b', glow: '#f59e0b40' },
  wealth:        { label: 'Wealth',        color: '#10b981', glow: '#10b98140' },
  consciousness: { label: 'Consciousness', color: '#06b6d4', glow: '#06b6d440' },
}

const REFLECTION_PROMPTS = [
  'What part of your old self are you still holding onto?',
  'How can you embody this new version of yourself today?',
  'What ritual could cement this change?',
  'Who in your life reflects this new you back to you?',
  'What belief must fully dissolve for this leap to integrate?',
]

const STORAGE_KEY = 'lq-quantumleaplog'

const EMPTY_FORM: Omit<QuantumLeap, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  title: '',
  domain: 'identity',
  beforeState: '',
  catalyst: '',
  afterState: '',
  evidenceOfChange: [''],
  resistances: [''],
  newCapabilities: [''],
  leapSize: 7,
  integration: 5,
}

function DynamicList({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const update = (idx: number, val: string) => {
    const next = [...items]
    next[idx] = val
    onChange(next)
  }
  const add = () => onChange([...items, ''])
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-400">{label}</p>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-1">
          <input
            value={item}
            onChange={e => update(idx, e.target.value)}
            className="game-input flex-1 text-sm"
            placeholder={`${label} ${idx + 1}`}
          />
          {items.length > 1 && (
            <button type="button" onClick={() => remove(idx)} className="text-slate-600 hover:text-red-400 px-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-0.5"
      >
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>
  )
}

function TimelineSVG({ leaps, onSelect }: { leaps: QuantumLeap[]; onSelect: (id: string) => void }) {
  const sorted = [...leaps].sort((a, b) => a.date.localeCompare(b.date))
  const W = 320
  const nodeX = 60
  const rowH = 70
  const H = Math.max(200, sorted.length * rowH + 40)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <line x1={nodeX} y1={20} x2={nodeX} y2={H - 20} stroke="#4b5563" strokeWidth={2} strokeDasharray="4 3" />
      {sorted.map((leap, i) => {
        const cy = 30 + i * rowH
        const r = 6 + leap.leapSize * 1.4
        const cfg = DOMAIN_CONFIG[leap.domain]
        return (
          <g key={leap.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(leap.id)}>
            <circle cx={nodeX} cy={cy} r={r + 4} fill={cfg.glow} />
            <circle cx={nodeX} cy={cy} r={r} fill={cfg.color} />
            <text x={nodeX} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#0f172a" fontWeight="bold">
              {leap.leapSize}
            </text>
            <text x={nodeX + r + 10} y={cy - 7} fontSize={11} fill="#e2e8f0" fontWeight="600">
              {leap.title.length > 28 ? leap.title.slice(0, 27) + '…' : leap.title}
            </text>
            <text x={nodeX + r + 10} y={cy + 8} fontSize={9} fill={cfg.color}>
              {cfg.label} · {leap.date}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function IdentityMapSVG({ leaps }: { leaps: QuantumLeap[] }) {
  const baseR = 55
  const growth = Math.min(leaps.length * 3, 40)
  const beforeR = baseR
  const afterR = baseR + growth
  const cx = 160
  const cy = 100
  const offset = 45

  return (
    <svg width="100%" viewBox="0 0 320 200">
      <defs>
        <radialGradient id="beforeGrad">
          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} />
        </radialGradient>
        <radialGradient id="afterGrad">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
        </radialGradient>
      </defs>
      <circle cx={cx - offset} cy={cy} r={beforeR} fill="url(#beforeGrad)" stroke="#6366f1" strokeWidth={1.5} />
      <circle cx={cx + offset} cy={cy} r={afterR} fill="url(#afterGrad)" stroke="#06b6d4" strokeWidth={1.5} />
      <text x={cx - offset - beforeR / 2} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#a5b4fc">
        Before
      </text>
      <text x={cx + offset + afterR / 2} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#67e8f9">
        After
      </text>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#e2e8f0" fontWeight="600">
        Overlap
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
        {leaps.length} leaps
      </text>
    </svg>
  )
}

function DomainBarChart({ leaps }: { leaps: QuantumLeap[] }) {
  const domains = Object.keys(DOMAIN_CONFIG) as QuantumLeap['domain'][]
  const stats = domains.map(d => {
    const group = leaps.filter(l => l.domain === d)
    return {
      domain: d,
      count: group.length,
      avg: group.length ? Math.round(group.reduce((s, l) => s + l.leapSize, 0) / group.length) : 0,
    }
  }).filter(s => s.count > 0)

  if (stats.length === 0) return <p className="text-xs text-slate-500 text-center py-4">No domain data yet</p>

  const maxCount = Math.max(...stats.map(s => s.count))
  const W = 300
  const barW = Math.floor(W / stats.length) - 6
  const H = 80

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`}>
      {stats.map((s, i) => {
        const cfg = DOMAIN_CONFIG[s.domain]
        const bH = Math.max(4, (s.count / maxCount) * H)
        const x = i * (barW + 6) + 3
        const y = H - bH
        return (
          <g key={s.domain}>
            <rect x={x} y={y} width={barW} height={bH} rx={3} fill={cfg.color} opacity={0.8} />
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={8} fill={cfg.color}>
              {s.avg}/10
            </text>
            <text x={x + barW / 2} y={H + 12} textAnchor="middle" fontSize={7} fill="#94a3b8">
              {cfg.label.slice(0, 5)}
            </text>
            <text x={x + barW / 2} y={H + 22} textAnchor="middle" fontSize={8} fill="#e2e8f0">
              {s.count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function QuantumLeapLog() {
  const { toastSuccess } = useToast()
  const [leaps, setLeaps] = useState<QuantumLeap[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<QuantumLeap, 'id'>>(EMPTY_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'identity' | 'domains' | 'integration'>('timeline')

  useEffect(() => {
    try {
      setLeaps(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch {
      /**/
    }
  }, [])

  const persist = (data: QuantumLeap[]) => {
    setLeaps(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const submit = () => {
    if (!form.title.trim() || !form.beforeState.trim() || !form.afterState.trim()) return
    const leap: QuantumLeap = {
      id: Date.now().toString(),
      ...form,
      evidenceOfChange: form.evidenceOfChange.filter(s => s.trim()),
      resistances: form.resistances.filter(s => s.trim()),
      newCapabilities: form.newCapabilities.filter(s => s.trim()),
    }
    persist([leap, ...leaps])
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Quantum leap recorded — you are not who you were')
  }

  const remove = (id: string) => persist(leaps.filter(l => l.id !== id))

  const needsIntegration = leaps.filter(l => l.integration < 7)
  const avgLeapSize =
    leaps.length ? (leaps.reduce((s, l) => s + l.leapSize, 0) / leaps.length).toFixed(1) : '—'

  const toggleExpand = (id: string) => setExpandedId(prev => (prev === id ? null : id))

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'timeline', label: 'Timeline' },
    { key: 'identity', label: 'Identity' },
    { key: 'domains', label: 'Domains' },
    { key: 'integration', label: 'Integration' },
  ]

  return (
    <div
      className="space-y-5 max-w-lg mx-auto"
      style={{ background: 'linear-gradient(180deg, #020617 0%, #0f0a1e 100%)', minHeight: '100vh' }}
    >
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <Zap className="w-7 h-7 text-purple-400" style={{ WebkitTextFillColor: 'initial' }} />
            Quantum Leap Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Every threshold you crossed to become someone new.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7e22ce, #0e7490)' }}
        >
          <Plus className="w-4 h-4" /> Log Leap
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3" style={{ borderColor: '#a855f730' }}>
          <div className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            {leaps.length}
          </div>
          <div className="text-xs text-slate-500">Leaps Taken</div>
        </div>
        <div className="game-card p-3" style={{ borderColor: '#06b6d430' }}>
          <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgLeapSize}
          </div>
          <div className="text-xs text-slate-500">Avg Magnitude</div>
        </div>
        <div className="game-card p-3" style={{ borderColor: '#f59e0b30' }}>
          <div className="text-xl font-bold text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {needsIntegration.length}
          </div>
          <div className="text-xs text-slate-500">Need Integration</div>
        </div>
      </div>

      {showForm && (
        <div
          className="game-card p-4 space-y-3"
          style={{ borderColor: '#a855f740', boxShadow: '0 0 30px #a855f715' }}
        >
          <h3 className="text-sm font-semibold text-white">Log a Quantum Leap</h3>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Leap title *"
            className="game-input w-full text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1"
            />
            <select
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value as QuantumLeap['domain'] }))}
              className="game-input text-sm flex-1"
            >
              {(Object.entries(DOMAIN_CONFIG) as [QuantumLeap['domain'], (typeof DOMAIN_CONFIG)[QuantumLeap['domain']]][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={form.beforeState}
            onChange={e => setForm(f => ({ ...f, beforeState: e.target.value }))}
            placeholder="Who were you before this leap? *"
            className="game-input w-full text-sm"
            rows={2}
          />
          <input
            value={form.catalyst}
            onChange={e => setForm(f => ({ ...f, catalyst: e.target.value }))}
            placeholder="What catalyzed this leap?"
            className="game-input w-full text-sm"
          />
          <textarea
            value={form.afterState}
            onChange={e => setForm(f => ({ ...f, afterState: e.target.value }))}
            placeholder="Who did you become? *"
            className="game-input w-full text-sm"
            rows={2}
          />
          <DynamicList
            label="Evidence of Change"
            items={form.evidenceOfChange}
            onChange={v => setForm(f => ({ ...f, evidenceOfChange: v }))}
          />
          <DynamicList
            label="Resistances Released"
            items={form.resistances}
            onChange={v => setForm(f => ({ ...f, resistances: v }))}
          />
          <DynamicList
            label="New Capabilities"
            items={form.newCapabilities}
            onChange={v => setForm(f => ({ ...f, newCapabilities: v }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Leap Magnitude: {form.leapSize}/10</p>
              <input
                type="range"
                min={1}
                max={10}
                value={form.leapSize}
                onChange={e => setForm(f => ({ ...f, leapSize: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-500"
              />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Integration: {form.integration}/10</p>
              <input
                type="range"
                min={1}
                max={10}
                value={form.integration}
                onChange={e => setForm(f => ({ ...f, integration: Number(e.target.value) }))}
                className="w-full h-1 accent-cyan-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              className="flex-1 py-2 text-white rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7e22ce, #0e7490)' }}
            >
              Save Leap
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={
              activeTab === t.key
                ? { background: 'linear-gradient(135deg, #7e22ce60, #0e749060)', color: '#c4b5fd', border: '1px solid #a855f740' }
                : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div className="game-card p-4" style={{ borderColor: '#a855f730' }}>
          <h3 className="text-xs font-semibold text-purple-300 mb-3">Evolution Timeline</h3>
          {leaps.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Your first quantum leap is waiting to be recorded.</p>
            </div>
          ) : (
            <TimelineSVG leaps={leaps} onSelect={toggleExpand} />
          )}
          {leaps.map(l => (
            <div
              key={l.id}
              className={`mt-2 overflow-hidden transition-all ${expandedId === l.id ? 'max-h-[600px]' : 'max-h-0'}`}
            >
              <div
                className="game-card p-3 space-y-2 text-xs mt-1"
                style={{ borderLeft: `3px solid ${DOMAIN_CONFIG[l.domain].color}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{l.title}</span>
                  <button onClick={() => remove(l.id)} className="text-slate-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-400">
                  <span className="text-slate-500">Before:</span> {l.beforeState}
                </p>
                {l.catalyst && (
                  <p className="text-slate-400">
                    <span className="text-slate-500">Catalyst:</span> {l.catalyst}
                  </p>
                )}
                <p className="text-slate-400">
                  <span className="text-slate-500">After:</span> {l.afterState}
                </p>
                {l.evidenceOfChange.length > 0 && (
                  <div>
                    <p className="text-slate-500 mb-1">Evidence of change:</p>
                    {l.evidenceOfChange.map((e, i) => (
                      <p key={i} className="text-green-300/70">• {e}</p>
                    ))}
                  </div>
                )}
                {l.resistances.length > 0 && (
                  <div>
                    <p className="text-slate-500 mb-1">Released:</p>
                    {l.resistances.map((r, i) => (
                      <p key={i} className="text-amber-300/70">• {r}</p>
                    ))}
                  </div>
                )}
                {l.newCapabilities.length > 0 && (
                  <div>
                    <p className="text-slate-500 mb-1">New capabilities:</p>
                    {l.newCapabilities.map((c, i) => (
                      <p key={i} className="text-cyan-300/70">• {c}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: DOMAIN_CONFIG[l.domain].glow,
                      color: DOMAIN_CONFIG[l.domain].color,
                    }}
                  >
                    {DOMAIN_CONFIG[l.domain].label}
                  </span>
                  <span className="text-purple-400">Magnitude {l.leapSize}/10</span>
                  <span className="text-cyan-400">Integration {l.integration}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'identity' && (
        <div className="game-card p-4" style={{ borderColor: '#06b6d430' }}>
          <h3 className="text-xs font-semibold text-cyan-300 mb-3">Identity Evolution Map</h3>
          <IdentityMapSVG leaps={leaps} />
          <p className="text-xs text-slate-500 text-center mt-2">
            The right circle grows with each leap you take.
          </p>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="game-card p-4" style={{ borderColor: '#a855f730' }}>
          <h3 className="text-xs font-semibold text-purple-300 mb-3">Domain Growth</h3>
          <DomainBarChart leaps={leaps} />
          <p className="text-xs text-slate-500 text-center mt-1">Count shown below bar · avg magnitude above</p>
        </div>
      )}

      {activeTab === 'integration' && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 px-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Needs Integration ({needsIntegration.length})
          </h3>
          {needsIntegration.length === 0 ? (
            <div className="game-card p-4 text-center text-slate-500 text-sm">
              All leaps are well integrated.
            </div>
          ) : (
            needsIntegration.map((l, idx) => {
              const cfg = DOMAIN_CONFIG[l.domain]
              return (
                <div key={l.id} className="game-card p-3 space-y-2" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{l.title}</span>
                    <span className="text-xs text-amber-400">Integration {l.integration}/10</span>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    {REFLECTION_PROMPTS[idx % REFLECTION_PROMPTS.length]}
                  </p>
                </div>
              )
            })
          )}
        </div>
      )}

      <div className="space-y-2 pb-4">
        {activeTab === 'timeline' &&
          leaps.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-500">{leaps.length} quantum leap{leaps.length !== 1 ? 's' : ''} taken</span>
              <button
                onClick={() => setExpandedId(null)}
                className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"
              >
                <ChevronUp className="w-3 h-3" /> Collapse all
              </button>
            </div>
          )}
      </div>

      {leaps.length === 0 && !showForm && activeTab === 'timeline' && (
        <div className="text-center py-12 text-slate-600">
          <ChevronDown className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">You have crossed thresholds. Record them.</p>
        </div>
      )}
    </div>
  )
}
