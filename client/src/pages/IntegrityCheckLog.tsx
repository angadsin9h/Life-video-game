import React, { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type IntegrityCheck = {
  id: string
  date: string
  value: string
  situation: string
  actionTaken: string
  alignedWithValue: boolean
  integrityScore: number
  rationalization: string
  recommitment: string
  followedThrough: boolean
}

type CoreValue = {
  id: string
  name: string
  description: string
  importance: number
}

const STORAGE_KEY = 'lq-integritychecklog'

const DEFAULT_VALUES: CoreValue[] = [
  { id: 'v1', name: 'Honesty', description: 'Speak truth even when it is uncomfortable', importance: 10 },
  { id: 'v2', name: 'Courage', description: 'Act despite fear or uncertainty', importance: 9 },
  { id: 'v3', name: 'Discipline', description: 'Do what must be done regardless of how you feel', importance: 9 },
  { id: 'v4', name: 'Compassion', description: 'Treat others with genuine care and empathy', importance: 8 },
  { id: 'v5', name: 'Growth', description: 'Continuously improve and embrace challenges', importance: 8 },
]

const ShieldIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Shield className={className} style={style} />
)

function scoreToColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#84cc16'
  if (score >= 4) return '#f59e0b'
  if (score >= 2) return '#f97316'
  return '#ef4444'
}

function alignmentPctColor(pct: number): string {
  if (pct >= 80) return '#22c55e'
  if (pct >= 60) return '#84cc16'
  if (pct >= 40) return '#f59e0b'
  if (pct >= 20) return '#f97316'
  return '#ef4444'
}

type StoreShape = {
  checks: IntegrityCheck[]
  values: CoreValue[]
}

export default function IntegrityCheckLog() {
  const { toastSuccess } = useToast()
  const [checks, setChecks] = useState<IntegrityCheck[]>([])
  const [coreValues, setCoreValues] = useState<CoreValue[]>(DEFAULT_VALUES)
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [showValueForm, setShowValueForm] = useState(false)
  const [editingValueId, setEditingValueId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'checks' | 'values' | 'analysis' | 'followthrough'>('checks')
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null)

  const emptyCheck: Omit<IntegrityCheck, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    value: '',
    situation: '',
    actionTaken: '',
    alignedWithValue: true,
    integrityScore: 7,
    rationalization: '',
    recommitment: '',
    followedThrough: false,
  }
  const [checkForm, setCheckForm] = useState<Omit<IntegrityCheck, 'id'>>(emptyCheck)

  const emptyValue: Omit<CoreValue, 'id'> = { name: '', description: '', importance: 8 }
  const [valueForm, setValueForm] = useState<Omit<CoreValue, 'id'>>(emptyValue)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw) as StoreShape
        if (data.checks) setChecks(data.checks)
        if (data.values && data.values.length) setCoreValues(data.values)
      }
    } catch { /**/ }
  }, [])

  const persist = (nextChecks: IntegrityCheck[], nextValues: CoreValue[]) => {
    setChecks(nextChecks)
    setCoreValues(nextValues)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ checks: nextChecks, values: nextValues }))
  }

  const submitCheck = () => {
    if (!checkForm.value.trim() || !checkForm.situation.trim() || !checkForm.actionTaken.trim()) return
    const entry: IntegrityCheck = { id: Date.now().toString(), ...checkForm }
    persist([entry, ...checks], coreValues)
    setCheckForm(emptyCheck)
    setShowCheckForm(false)
    toastSuccess('Integrity check logged')
  }

  const deleteCheck = (id: string) => {
    persist(checks.filter(c => c.id !== id), coreValues)
  }

  const toggleFollowThrough = (id: string) => {
    const updated = checks.map(c => c.id === id ? { ...c, followedThrough: !c.followedThrough } : c)
    persist(updated, coreValues)
    toastSuccess('Follow-through updated')
  }

  const submitValue = () => {
    if (!valueForm.name.trim()) return
    if (editingValueId) {
      const updated = coreValues.map(v => v.id === editingValueId ? { ...v, ...valueForm } : v)
      persist(checks, updated)
      setEditingValueId(null)
    } else {
      const newVal: CoreValue = { id: Date.now().toString(), ...valueForm }
      persist(checks, [...coreValues, newVal])
    }
    setValueForm(emptyValue)
    setShowValueForm(false)
    toastSuccess('Core value saved')
  }

  const deleteValue = (id: string) => {
    persist(checks, coreValues.filter(v => v.id !== id))
  }

  const startEditValue = (v: CoreValue) => {
    setEditingValueId(v.id)
    setValueForm({ name: v.name, description: v.description, importance: v.importance })
    setShowValueForm(true)
  }

  const overallScore = checks.length
    ? Math.round((checks.reduce((s, c) => s + c.integrityScore, 0) / checks.length) * 10)
    : 0
  const overallAlignedPct = checks.length
    ? Math.round((checks.filter(c => c.alignedWithValue).length / checks.length) * 100)
    : 0

  const valueStats = coreValues.map(v => {
    const relevant = checks.filter(c => c.value === v.name)
    const aligned = relevant.filter(c => c.alignedWithValue).length
    const alignedPct = relevant.length ? Math.round((aligned / relevant.length) * 100) : 0
    const avgScore = relevant.length
      ? Math.round((relevant.reduce((s, c) => s + c.integrityScore, 0) / relevant.length) * 10) / 10
      : 0
    return { ...v, count: relevant.length, alignedPct, avgScore }
  })

  const checksWithRecommitment = checks.filter(c => c.recommitment.trim())

  const trendPoints = (() => {
    if (checks.length < 2) return []
    const sorted = [...checks].sort((a, b) => a.date.localeCompare(b.date))
    return sorted.map((c, i) => ({
      x: i,
      y: c.integrityScore,
      date: c.date,
      aligned: c.alignedWithValue,
    }))
  })()

  const svgW = 340
  const svgH = 100
  const pad = 16

  const trendPath = (() => {
    if (trendPoints.length < 2) return ''
    const xStep = (svgW - pad * 2) / (trendPoints.length - 1)
    return trendPoints.map((p, i) => {
      const x = pad + i * xStep
      const y = svgH - pad - ((p.y - 1) / 9) * (svgH - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
  })()

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <ShieldIcon className="w-7 h-7" style={{ color: '#93c5fd' }} />
            Integrity Check Log
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Track alignment between your values and your actions</p>
        </div>
        <button
          onClick={() => { setShowCheckForm(v => !v); setShowValueForm(false) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
          style={{ background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb' }}
        >
          <Plus className="w-4 h-4" />
          New Check
        </button>
      </div>

      <div className="game-card p-5" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e2d4a 100%)', border: '1px solid #334155' }}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-center">
            <div className="text-5xl font-black" style={{ color: '#93c5fd', fontFamily: 'Orbitron, monospace' }}>
              {overallScore}
              <span className="text-2xl text-slate-400">/100</span>
            </div>
            <div className="text-sm font-semibold mt-1" style={{ color: '#94a3b8' }}>Integrity Score</div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: alignmentPctColor(overallAlignedPct) }}>{overallAlignedPct}%</div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Aligned Actions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{checks.length}</div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Total Checks</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                {checksWithRecommitment.filter(c => c.followedThrough).length}
              </div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Follow-Throughs</div>
            </div>
          </div>
        </div>
        {trendPoints.length >= 2 && (
          <div className="mt-4">
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#94a3b8' }}>
              <TrendingUp className="w-3 h-3" /> Score trend
            </div>
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 100 }}>
              <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />
              <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />
              {[1, 4, 7, 10].map(tick => {
                const y = svgH - pad - ((tick - 1) / 9) * (svgH - pad * 2)
                return <line key={tick} x1={pad} x2={svgW - pad} y1={y} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
              })}
              <path d={trendPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {trendPoints.map((p, i) => {
                const xStep = (svgW - pad * 2) / (trendPoints.length - 1)
                const x = pad + i * xStep
                const y = svgH - pad - ((p.y - 1) / 9) * (svgH - pad * 2)
                return <circle key={i} cx={x} cy={y} r="3" fill={p.aligned ? '#22c55e' : '#ef4444'} />
              })}
            </svg>
          </div>
        )}
      </div>

      {showCheckForm && (
        <div className="game-card p-5" style={{ background: '#0f172a', border: '1px solid #2563eb' }}>
          <h3 className="font-bold mb-4" style={{ color: '#93c5fd' }}>Log Integrity Check</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Date</label>
              <input type="date" className="game-input w-full"
                value={checkForm.date}
                onChange={e => setCheckForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Relevant Value</label>
              <select className="game-input w-full"
                value={checkForm.value}
                onChange={e => setCheckForm(f => ({ ...f, value: e.target.value }))}>
                <option value="">Select a value...</option>
                {coreValues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Situation — what happened?</label>
              <textarea className="game-input w-full" rows={2}
                value={checkForm.situation}
                onChange={e => setCheckForm(f => ({ ...f, situation: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Action Taken — what did you actually do?</label>
              <textarea className="game-input w-full" rows={2}
                value={checkForm.actionTaken}
                onChange={e => setCheckForm(f => ({ ...f, actionTaken: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs" style={{ color: '#94a3b8' }}>Aligned with value?</label>
              <button
                onClick={() => setCheckForm(f => ({ ...f, alignedWithValue: !f.alignedWithValue }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: checkForm.alignedWithValue ? '#14532d' : '#450a0a',
                  color: checkForm.alignedWithValue ? '#22c55e' : '#ef4444',
                  border: `1px solid ${checkForm.alignedWithValue ? '#22c55e' : '#ef4444'}`,
                }}>
                {checkForm.alignedWithValue ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {checkForm.alignedWithValue ? 'Yes' : 'No'}
              </button>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Integrity Score: {checkForm.integrityScore}/10</label>
              <input type="range" min={1} max={10} className="w-full"
                value={checkForm.integrityScore}
                onChange={e => setCheckForm(f => ({ ...f, integrityScore: Number(e.target.value) }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Rationalization — story you told yourself</label>
              <textarea className="game-input w-full" rows={2}
                value={checkForm.rationalization}
                onChange={e => setCheckForm(f => ({ ...f, rationalization: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Recommitment — how to do better next time</label>
              <textarea className="game-input w-full" rows={2}
                value={checkForm.recommitment}
                onChange={e => setCheckForm(f => ({ ...f, recommitment: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submitCheck}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb' }}>
              Save Check
            </button>
            <button onClick={() => setShowCheckForm(false)}
              className="px-4 py-2 rounded-xl text-sm" style={{ color: '#64748b' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {(['checks', 'values', 'analysis', 'followthrough'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              background: activeTab === tab ? '#1e3a5f' : 'transparent',
              color: activeTab === tab ? '#93c5fd' : '#64748b',
              border: activeTab === tab ? '1px solid #2563eb' : '1px solid transparent',
            }}>
            {tab === 'followthrough' ? 'Follow-Through' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'checks' && (
        <div className="space-y-3">
          {checks.length === 0 && (
            <div className="game-card p-8 text-center" style={{ border: '1px solid #334155' }}>
              <ShieldIcon className="w-10 h-10 mx-auto mb-3" style={{ color: '#334155' }} />
              <p style={{ color: '#64748b' }}>No integrity checks yet. Log your first one.</p>
            </div>
          )}
          {checks.map(c => (
            <div key={c.id} className="game-card p-4" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#1e3a5f', color: '#93c5fd' }}>{c.value || 'No value'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: c.alignedWithValue ? '#14532d' : '#450a0a',
                        color: c.alignedWithValue ? '#22c55e' : '#ef4444',
                      }}>
                      {c.alignedWithValue ? 'Aligned' : 'Gap'}
                    </span>
                    <span className="text-xs font-bold" style={{ color: scoreToColor(c.integrityScore) }}>
                      {c.integrityScore}/10
                    </span>
                    <span className="text-xs" style={{ color: '#475569' }}>{c.date}</span>
                  </div>
                  <p className="text-sm mt-1.5 text-white font-medium line-clamp-2">{c.situation}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setExpandedCheckId(expandedCheckId === c.id ? null : c.id)}
                    className="p-1.5 rounded-lg" style={{ color: '#475569' }}>
                    {expandedCheckId === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteCheck(c.id)} className="p-1.5 rounded-lg" style={{ color: '#475569' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expandedCheckId === c.id && (
                <div className="mt-3 space-y-2 text-sm border-t pt-3" style={{ borderColor: '#1e293b' }}>
                  <div><span style={{ color: '#94a3b8' }}>Action taken: </span><span className="text-white">{c.actionTaken}</span></div>
                  {c.rationalization && <div><span style={{ color: '#94a3b8' }}>Rationalization: </span><span style={{ color: '#f59e0b' }}>{c.rationalization}</span></div>}
                  {c.recommitment && <div><span style={{ color: '#94a3b8' }}>Recommitment: </span><span style={{ color: '#22c55e' }}>{c.recommitment}</span></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'values' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => { setShowValueForm(v => !v); setEditingValueId(null); setValueForm(emptyValue) }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb' }}>
              <Plus className="w-4 h-4" /> Add Value
            </button>
          </div>
          {showValueForm && (
            <div className="game-card p-4" style={{ background: '#0f172a', border: '1px solid #2563eb' }}>
              <h4 className="font-bold mb-3 text-sm" style={{ color: '#93c5fd' }}>
                {editingValueId ? 'Edit Value' : 'New Core Value'}
              </h4>
              <div className="space-y-3">
                <input className="game-input w-full" placeholder="Value name (e.g. Integrity)"
                  value={valueForm.name}
                  onChange={e => setValueForm(f => ({ ...f, name: e.target.value }))} />
                <textarea className="game-input w-full" rows={2} placeholder="Description"
                  value={valueForm.description}
                  onChange={e => setValueForm(f => ({ ...f, description: e.target.value }))} />
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Importance: {valueForm.importance}/10</label>
                  <input type="range" min={1} max={10} className="w-full"
                    value={valueForm.importance}
                    onChange={e => setValueForm(f => ({ ...f, importance: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={submitValue}
                  className="px-4 py-2 rounded-xl font-semibold text-sm"
                  style={{ background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb' }}>
                  Save
                </button>
                <button onClick={() => { setShowValueForm(false); setEditingValueId(null) }}
                  className="px-4 py-2 rounded-xl text-sm" style={{ color: '#64748b' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {coreValues.map(v => {
            const stat = valueStats.find(s => s.id === v.id)
            return (
              <div key={v.id} className="game-card p-4 flex items-center justify-between gap-3"
                style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{v.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e293b', color: '#93c5fd' }}>
                      {v.importance}/10
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{v.description}</p>
                  {stat && stat.count > 0 && (
                    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                      {stat.count} checks — {stat.alignedPct}% aligned — avg {stat.avgScore}/10
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEditValue(v)} className="p-1.5 rounded-lg" style={{ color: '#475569' }}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteValue(v.id)} className="p-1.5 rounded-lg" style={{ color: '#475569' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="game-card p-5" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
            <h3 className="font-bold mb-4 text-sm" style={{ color: '#93c5fd' }}>Integrity Gap by Value</h3>
            {valueStats.filter(v => v.count > 0).length === 0 && (
              <p className="text-sm" style={{ color: '#64748b' }}>Log checks to see analysis.</p>
            )}
            <div className="space-y-4">
              {valueStats.filter(v => v.count > 0).map(v => (
                <div key={v.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-white">{v.name}</span>
                    <span style={{ color: alignmentPctColor(v.alignedPct) }}>{v.alignedPct}% aligned ({v.count} checks)</span>
                  </div>
                  <svg width="100%" height="20" viewBox="0 0 300 20">
                    <rect x="0" y="6" width="300" height="8" rx="4" fill="#1e293b" />
                    <rect x="0" y="6" width={Math.round(300 * v.alignedPct / 100)} height="8" rx="4"
                      fill={alignmentPctColor(v.alignedPct)} />
                  </svg>
                  <div className="flex justify-between text-xs mt-0.5">
                    <span style={{ color: '#475569' }}>avg score: {v.avgScore}/10</span>
                    <span style={{ color: '#475569' }}>importance: {v.importance}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'followthrough' && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#64748b' }}>Checks with recommitments — did you follow through?</p>
          {checksWithRecommitment.length === 0 && (
            <div className="game-card p-6 text-center" style={{ border: '1px solid #334155' }}>
              <p style={{ color: '#64748b' }}>No recommitments logged yet.</p>
            </div>
          )}
          {checksWithRecommitment.map(c => (
            <div key={c.id} className="game-card p-4" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleFollowThrough(c.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    borderColor: c.followedThrough ? '#22c55e' : '#334155',
                    background: c.followedThrough ? '#14532d' : 'transparent',
                  }}>
                  {c.followedThrough && <Check className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span style={{ color: '#93c5fd' }}>{c.value}</span>
                    <span style={{ color: '#475569' }}>{c.date}</span>
                  </div>
                  <p className="text-sm text-white">{c.recommitment}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Context: {c.situation}</p>
                </div>
                <span className="text-xs font-semibold flex-shrink-0"
                  style={{ color: c.followedThrough ? '#22c55e' : '#64748b' }}>
                  {c.followedThrough ? 'Done' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
