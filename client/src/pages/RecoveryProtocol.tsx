import React, { useState, useEffect } from 'react'
import { Leaf, Plus, Trash2, Edit2, Check, X, Activity, BarChart2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RecoveryType = 'physical' | 'mental' | 'emotional' | 'social' | 'creative'

type RecoverySession = {
  id: string
  date: string
  type: RecoveryType
  stressLevel: number
  method: string
  duration: number
  recoveryRating: number
  qualityIndicators: string[]
  notes: string
}

type RecoveryMethod = {
  id: string
  name: string
  type: RecoveryType
  averageDuration: number
  effectiveness: number
  active: boolean
}

const STORAGE_KEY = 'lq-recoveryprotocol'
const METHODS_KEY = 'lq-recoverymethods'

const TYPE_COLOR: Record<RecoveryType, string> = {
  physical: '#4ade80',
  mental: '#818cf8',
  emotional: '#f472b6',
  social: '#fb923c',
  creative: '#facc15',
}

const TYPE_LABEL: Record<RecoveryType, string> = {
  physical: 'Physical',
  mental: 'Mental',
  emotional: 'Emotional',
  social: 'Social',
  creative: 'Creative',
}

const QUALITY_OPTIONS = [
  'Felt rested',
  'No brain fog',
  'Good mood',
  'Body relaxed',
  'Stress gone',
  'Clarity gained',
  'Energized',
  'Socially recharged',
]

const SEED_METHODS: RecoveryMethod[] = [
  { id: 'm1', name: 'Sleep', type: 'physical', averageDuration: 480, effectiveness: 9, active: true },
  { id: 'm2', name: 'Power Nap', type: 'physical', averageDuration: 20, effectiveness: 7, active: true },
  { id: 'm3', name: 'Walk', type: 'physical', averageDuration: 30, effectiveness: 7, active: true },
  { id: 'm4', name: 'Meditation', type: 'mental', averageDuration: 20, effectiveness: 8, active: true },
  { id: 'm5', name: 'Cold Shower', type: 'physical', averageDuration: 5, effectiveness: 8, active: true },
  { id: 'm6', name: 'Sauna', type: 'physical', averageDuration: 30, effectiveness: 8, active: true },
  { id: 'm7', name: 'Social Time', type: 'social', averageDuration: 60, effectiveness: 7, active: true },
  { id: 'm8', name: 'Creative Play', type: 'creative', averageDuration: 45, effectiveness: 7, active: true },
  { id: 'm9', name: 'Nature', type: 'emotional', averageDuration: 40, effectiveness: 8, active: true },
  { id: 'm10', name: 'Journaling', type: 'mental', averageDuration: 15, effectiveness: 7, active: true },
]

const DEFAULT_SESSION: Omit<RecoverySession, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  type: 'physical',
  stressLevel: 6,
  method: 'Walk',
  duration: 30,
  recoveryRating: 7,
  qualityIndicators: [],
  notes: '',
}

function ratingColor(r: number): string {
  if (r >= 8) return '#4ade80'
  if (r >= 5) return '#facc15'
  return '#f87171'
}

export default function RecoveryProtocol() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<RecoverySession[]>([])
  const [methods, setMethods] = useState<RecoveryMethod[]>([])
  const [tab, setTab] = useState<'log' | 'library' | 'stats'>('library')
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [sessionForm, setSessionForm] = useState<Omit<RecoverySession, 'id'>>(DEFAULT_SESSION)
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [editingMethod, setEditingMethod] = useState<RecoveryMethod | null>(null)
  const [methodForm, setMethodForm] = useState<Omit<RecoveryMethod, 'id'>>({
    name: '', type: 'physical', averageDuration: 30, effectiveness: 7, active: true,
  })
  const [dailyTarget, setDailyTarget] = useState(60)

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
    try {
      const saved = localStorage.getItem(METHODS_KEY)
      setMethods(saved ? JSON.parse(saved) : SEED_METHODS)
    } catch { setMethods(SEED_METHODS) }
  }, [])

  const persistSessions = (u: RecoverySession[]) => {
    setSessions(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const persistMethods = (u: RecoveryMethod[]) => {
    setMethods(u)
    localStorage.setItem(METHODS_KEY, JSON.stringify(u))
  }

  const submitSession = () => {
    if (!sessionForm.method.trim()) return
    const s: RecoverySession = { id: Date.now().toString(), ...sessionForm }
    persistSessions([s, ...sessions])
    setSessionForm({ ...DEFAULT_SESSION, date: new Date().toISOString().split('T')[0] })
    setShowSessionForm(false)
    toastSuccess('Recovery logged', `${sessionForm.duration}min of ${sessionForm.method}`)
  }

  const submitMethod = () => {
    if (!methodForm.name.trim()) return
    if (editingMethod) {
      persistMethods(methods.map(m => m.id === editingMethod.id ? { ...editingMethod, ...methodForm } : m))
      setEditingMethod(null)
    } else {
      persistMethods([...methods, { id: Date.now().toString(), ...methodForm }])
    }
    setMethodForm({ name: '', type: 'physical', averageDuration: 30, effectiveness: 7, active: true })
    setShowMethodForm(false)
    toastSuccess('Method saved')
  }

  const startEdit = (m: RecoveryMethod) => {
    setEditingMethod(m)
    setMethodForm({ name: m.name, type: m.type, averageDuration: m.averageDuration, effectiveness: m.effectiveness, active: m.active })
    setShowMethodForm(true)
  }

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const last30 = sorted.slice(0, 30)

  const methodEffectiveness = methods
    .filter(m => m.active)
    .map(m => {
      const relevant = sessions.filter(s => s.method === m.name)
      const avg = relevant.length
        ? Math.round(relevant.reduce((s, r) => s + r.recoveryRating, 0) / relevant.length * 10) / 10
        : m.effectiveness
      return { name: m.name, avg, type: m.type, count: relevant.length }
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8)

  const dailyMinutes = (() => {
    const byDate: Record<string, number> = {}
    last30.forEach(s => { byDate[s.date] = (byDate[s.date] || 0) + s.duration })
    const dates = [...new Set(last30.map(s => s.date))].sort()
    return dates.map(d => ({ date: d, mins: byDate[d] || 0 }))
  })()

  const avgStressBefore = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + r.stressLevel, 0) / sessions.length * 10) / 10
    : 0
  const avgRecovery = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + r.recoveryRating, 0) / sessions.length * 10) / 10
    : 0

  const SVG_W = 340
  const SVG_H = 90
  const pad = { l: 28, r: 8, t: 8, b: 18 }

  const BarChart: React.FC<{ className?: string; style?: React.CSSProperties }> = () => {
    if (methodEffectiveness.length === 0) return (
      <div className="text-xs text-slate-600 text-center py-6">Log sessions to see method effectiveness</div>
    )
    const maxVal = Math.max(...methodEffectiveness.map(m => m.avg), 10)
    const barW = (SVG_W - pad.l - pad.r) / methodEffectiveness.length
    const h = SVG_H - pad.t - pad.b

    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height={SVG_H}>
        {methodEffectiveness.map((m, i) => {
          const barH = (m.avg / maxVal) * h
          const x = pad.l + i * barW + barW * 0.1
          const bw = barW * 0.8
          const y = pad.t + (h - barH)
          return (
            <g key={m.name}>
              <rect x={x} y={y} width={bw} height={barH}
                fill={TYPE_COLOR[m.type]} fillOpacity="0.7" rx="2" />
              <text x={x + bw / 2} y={y - 2} textAnchor="middle" fontSize="7" fill="#94a3b8">
                {m.avg}
              </text>
              <text x={x + bw / 2} y={SVG_H - 4} textAnchor="middle" fontSize="6.5" fill="#64748b"
                transform={`rotate(-25, ${x + bw / 2}, ${SVG_H - 4})`}>
                {m.name.slice(0, 7)}
              </text>
            </g>
          )
        })}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={SVG_H - pad.b} stroke="#334155" strokeWidth="1" />
        <text x={pad.l - 2} y={pad.t + 4} fontSize="7" fill="#475569" textAnchor="end">{maxVal}</text>
        <text x={pad.l - 2} y={SVG_H - pad.b + 2} fontSize="7" fill="#475569" textAnchor="end">0</text>
      </svg>
    )
  }

  const AreaChart: React.FC<{ className?: string; style?: React.CSSProperties }> = () => {
    if (dailyMinutes.length < 2) return (
      <div className="text-xs text-slate-600 text-center py-6">Log sessions to see recovery minutes</div>
    )
    const maxV = Math.max(...dailyMinutes.map(d => d.mins), dailyTarget)
    const n = dailyMinutes.length
    const xS = (i: number) => pad.l + (i / (n - 1)) * (SVG_W - pad.l - pad.r)
    const yS = (v: number) => pad.t + (1 - v / maxV) * (SVG_H - pad.t - pad.b)
    const targetY = yS(dailyTarget)

    const polyPoints = dailyMinutes.map((d, i) => `${xS(i)},${yS(d.mins)}`).join(' ')
    const lastX = xS(n - 1)
    const firstX = xS(0)

    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height={SVG_H}>
        <defs>
          <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <line x1={pad.l} y1={targetY} x2={lastX} y2={targetY}
          stroke="#4ade80" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.5" />
        <text x={lastX + 2} y={targetY + 3} fontSize="7" fill="#4ade80" opacity="0.7">target</text>
        <polygon
          points={`${firstX},${SVG_H - pad.b} ${polyPoints} ${lastX},${SVG_H - pad.b}`}
          fill="url(#recGrad)" />
        <polyline points={polyPoints} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round" />
        {dailyMinutes.map((d, i) => (
          <circle key={i} cx={xS(i)} cy={yS(d.mins)} r="2.5"
            fill={d.mins >= dailyTarget ? '#4ade80' : '#f87171'} />
        ))}
      </svg>
    )
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Leaf className="w-7 h-7 text-emerald-400" />
            Recovery Protocol
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design and track your recovery between hard efforts.</p>
        </div>
        <button
          onClick={() => { setShowSessionForm(true); setTab('log') }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#14532d' }}
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: ratingColor(avgRecovery) }}>{avgRecovery || '—'}</div>
          <div className="text-xs text-slate-500">Avg Recovery</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgStressBefore || '—'}</div>
          <div className="text-xs text-slate-500">Avg Stress In</div>
        </div>
      </div>

      <div className="flex gap-1">
        {(['library', 'log', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors"
            style={{
              background: tab === t ? '#166534' : '#1e293b',
              color: tab === t ? '#4ade80' : '#64748b',
            }}>
            {t === 'library' ? 'Methods' : t === 'log' ? 'Sessions' : 'Stats'}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Recovery Method Library</h3>
            <button onClick={() => { setEditingMethod(null); setMethodForm({ name: '', type: 'physical', averageDuration: 30, effectiveness: 7, active: true }); setShowMethodForm(v => !v) }}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Method
            </button>
          </div>

          {showMethodForm && (
            <div className="game-card p-4 space-y-3" style={{ border: '1px solid #166534' }}>
              <h4 className="text-xs font-semibold text-emerald-300">{editingMethod ? 'Edit Method' : 'New Method'}</h4>
              <input value={methodForm.name}
                onChange={e => setMethodForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Method name *"
                className="game-input w-full text-sm" autoFocus />
              <select value={methodForm.type}
                onChange={e => setMethodForm(f => ({ ...f, type: e.target.value as RecoveryType }))}
                className="game-input w-full text-sm">
                {(Object.keys(TYPE_LABEL) as RecoveryType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
              <div>
                <label className="text-xs text-slate-500">Avg Duration: {methodForm.averageDuration}min</label>
                <input type="range" min={5} max={240} step={5} value={methodForm.averageDuration}
                  onChange={e => setMethodForm(f => ({ ...f, averageDuration: Number(e.target.value) }))}
                  className="w-full mt-1 accent-emerald-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Personal Effectiveness: {methodForm.effectiveness}/10</label>
                <input type="range" min={1} max={10} value={methodForm.effectiveness}
                  onChange={e => setMethodForm(f => ({ ...f, effectiveness: Number(e.target.value) }))}
                  className="w-full mt-1 accent-emerald-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={submitMethod}
                  className="flex-1 py-2 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                  style={{ background: '#166534' }}>
                  <Check className="w-4 h-4" /> Save
                </button>
                <button onClick={() => { setShowMethodForm(false); setEditingMethod(null) }}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {methods.filter(m => m.active).map(m => {
              const relevant = sessions.filter(s => s.method === m.name)
              const sessionAvg = relevant.length
                ? Math.round(relevant.reduce((s, r) => s + r.recoveryRating, 0) / relevant.length * 10) / 10
                : null
              return (
                <div key={m.id} className="game-card p-3 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${TYPE_COLOR[m.type]}` }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{m.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded text-slate-300"
                        style={{ background: TYPE_COLOR[m.type] + '20', color: TYPE_COLOR[m.type] }}>
                        {TYPE_LABEL[m.type]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {m.averageDuration}min ·{' '}
                      {sessionAvg !== null
                        ? <span style={{ color: ratingColor(sessionAvg) }}>★ {sessionAvg} avg from {relevant.length} sessions</span>
                        : <span>★ {m.effectiveness}/10 (personal rating)</span>}
                    </div>
                  </div>
                  <button onClick={() => startEdit(m)} className="text-slate-600 hover:text-emerald-400 mr-1">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => persistMethods(methods.map(x => x.id === m.id ? { ...x, active: false } : x))}
                    className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-3">
          {showSessionForm && (
            <div className="game-card p-4 space-y-3" style={{ border: '1px solid #166534' }}>
              <h3 className="text-sm font-semibold text-white">Log Recovery Session</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Date</label>
                  <input type="date" value={sessionForm.date}
                    onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                    className="game-input w-full text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Type</label>
                  <select value={sessionForm.type}
                    onChange={e => setSessionForm(f => ({ ...f, type: e.target.value as RecoveryType }))}
                    className="game-input w-full text-sm mt-1">
                    {(Object.keys(TYPE_LABEL) as RecoveryType[]).map(t => (
                      <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Recovery Method</label>
                <select value={sessionForm.method}
                  onChange={e => setSessionForm(f => ({ ...f, method: e.target.value }))}
                  className="game-input w-full text-sm mt-1">
                  {methods.filter(m => m.active).map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Stress Level Before: {sessionForm.stressLevel}/10</label>
                <input type="range" min={1} max={10} value={sessionForm.stressLevel}
                  onChange={e => setSessionForm(f => ({ ...f, stressLevel: Number(e.target.value) }))}
                  className="w-full mt-1 accent-emerald-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Duration: {sessionForm.duration}min</label>
                <input type="range" min={5} max={300} step={5} value={sessionForm.duration}
                  onChange={e => setSessionForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="w-full mt-1 accent-emerald-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Recovery Rating After: {sessionForm.recoveryRating}/10</label>
                <input type="range" min={1} max={10} value={sessionForm.recoveryRating}
                  onChange={e => setSessionForm(f => ({ ...f, recoveryRating: Number(e.target.value) }))}
                  className="w-full mt-1 accent-emerald-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-2">Quality Indicators</label>
                <div className="flex flex-wrap gap-2">
                  {QUALITY_OPTIONS.map(q => {
                    const active = sessionForm.qualityIndicators.includes(q)
                    return (
                      <button key={q} type="button"
                        onClick={() => setSessionForm(f => ({
                          ...f,
                          qualityIndicators: active
                            ? f.qualityIndicators.filter(x => x !== q)
                            : [...f.qualityIndicators, q],
                        }))}
                        className="text-xs px-2 py-1 rounded-lg border transition-colors"
                        style={{
                          background: active ? '#166534' : '#1e293b',
                          borderColor: active ? '#4ade80' : '#334155',
                          color: active ? '#4ade80' : '#64748b',
                        }}>
                        {q}
                      </button>
                    )
                  })}
                </div>
              </div>
              <input value={sessionForm.notes}
                onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="game-input w-full text-sm" />
              <div className="flex gap-2">
                <button onClick={submitSession}
                  className="flex-1 py-2 text-white rounded-xl text-sm font-semibold"
                  style={{ background: '#166534' }}>
                  Save Session
                </button>
                <button onClick={() => setShowSessionForm(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showSessionForm && (
            <button onClick={() => setShowSessionForm(true)}
              className="w-full py-2 text-sm text-emerald-400 border border-emerald-900 rounded-xl hover:bg-emerald-900/20 flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" /> Log Recovery Session
            </button>
          )}

          <div className="space-y-2">
            {sorted.slice(0, 20).map(s => (
              <div key={s.id} className="game-card p-3 flex items-start gap-3"
                style={{ borderLeft: `3px solid ${TYPE_COLOR[s.type]}` }}>
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: TYPE_COLOR[s.type] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-white font-semibold">{s.method}</span>
                    <span style={{ color: TYPE_COLOR[s.type] }}>{TYPE_LABEL[s.type]}</span>
                    <span className="text-slate-500">{s.date}</span>
                    <span className="text-slate-400">{s.duration}min</span>
                    <span className="text-orange-400">stress {s.stressLevel}</span>
                    <span style={{ color: ratingColor(s.recoveryRating) }}>★ {s.recoveryRating}</span>
                  </div>
                  {s.qualityIndicators.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.qualityIndicators.map(q => (
                        <span key={q} className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400">{q}</span>
                      ))}
                    </div>
                  )}
                  {s.notes && <p className="text-xs text-slate-500 mt-0.5">{s.notes}</p>}
                </div>
                <button onClick={() => persistSessions(sessions.filter(x => x.id !== s.id))}
                  className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && !showSessionForm && (
              <div className="text-center py-12 text-slate-600">
                <Leaf className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Recovery is the work. Start logging yours.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="game-card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" /> Method Effectiveness (avg recovery rating)
            </h3>
            <BarChart />
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              {(Object.keys(TYPE_COLOR) as RecoveryType[]).map(t => (
                <span key={t} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: TYPE_COLOR[t] }} />
                  {TYPE_LABEL[t]}
                </span>
              ))}
            </div>
          </div>

          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Daily Recovery Minutes
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Target:</label>
                <input type="number" value={dailyTarget} min={15} max={480}
                  onChange={e => setDailyTarget(Number(e.target.value))}
                  className="game-input text-xs w-16 text-center" />
                <span className="text-xs text-slate-500">min</span>
              </div>
            </div>
            <AreaChart />
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Hit target</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Below target</span>
            </div>
          </div>

          {sessions.length >= 3 && (
            <div className="game-card p-4" style={{ borderLeft: '3px solid #4ade80', background: '#0f172a' }}>
              <h3 className="text-sm font-semibold text-white mb-2">Stress → Recovery Ratio</h3>
              <div className="flex gap-4">
                <div>
                  <div className="text-2xl font-bold text-orange-400">{avgStressBefore}</div>
                  <div className="text-xs text-slate-500">Avg stress in</div>
                </div>
                <div className="text-slate-600 text-2xl font-thin self-center">→</div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: ratingColor(avgRecovery) }}>{avgRecovery}</div>
                  <div className="text-xs text-slate-500">Avg recovery out</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {avgStressBefore > 7
                  ? 'You often recover under high stress. Try proactive recovery before stress peaks.'
                  : avgStressBefore < 4
                  ? 'You tend to recover proactively. Excellent habit.'
                  : 'Moderate stress before recovery sessions — a healthy balance.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
