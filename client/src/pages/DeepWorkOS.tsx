import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Clock, Zap, Shield, Brain, BarChart3, Star, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DeepWorkProtocol = {
  id: string
  name: string
  environment: string
  durationMinutes: number
  preRitual: string[]
  postRitual: string[]
  bestTimeOfDay: 'early-morning' | 'morning' | 'afternoon' | 'evening'
  distractionBlockers: string[]
  active: boolean
}

type DeepWorkSession = {
  id: string
  date: string
  protocolId: string
  startTime: string
  durationMinutes: number
  actualMinutes: number
  task: string
  depthScore: number
  interruptions: number
  outputQuality: number
  insight: string
}

const STORAGE_KEY = 'lq-deepworkos'

const TIME_LABELS: Record<DeepWorkProtocol['bestTimeOfDay'], string> = {
  'early-morning': '5–8 AM',
  'morning': '8–12 PM',
  'afternoon': '12–5 PM',
  'evening': '5–10 PM',
}

const TIME_COLORS: Record<DeepWorkProtocol['bestTimeOfDay'], string> = {
  'early-morning': '#f59e0b',
  'morning': '#3b82f6',
  'afternoon': '#22c55e',
  'evening': '#8b5cf6',
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function fmtMins(m: number): string {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

function weekStartStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}

function monthStartStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function last30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

type StoredData = {
  protocols: DeepWorkProtocol[]
  sessions: DeepWorkSession[]
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { protocols: [], sessions: [] }
    return JSON.parse(raw) as StoredData
  } catch {
    return { protocols: [], sessions: [] }
  }
}

function saveData(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

type Tab = 'dashboard' | 'protocols' | 'session' | 'heatmap' | 'compare'

const ScoreBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
    <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color }} />
  </div>
)

export default function DeepWorkOS() {
  const { toastSuccess } = useToast()
  const [protocols, setProtocols] = useState<DeepWorkProtocol[]>([])
  const [sessions, setSessions] = useState<DeepWorkSession[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const [showProtocolForm, setShowProtocolForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)

  const [newPreRitual, setNewPreRitual] = useState('')
  const [newPostRitual, setNewPostRitual] = useState('')
  const [newBlocker, setNewBlocker] = useState('')

  const emptyProtocolForm = (): Omit<DeepWorkProtocol, 'id'> => ({
    name: '',
    environment: '',
    durationMinutes: 90,
    preRitual: [],
    postRitual: [],
    bestTimeOfDay: 'morning',
    distractionBlockers: [],
    active: true,
  })

  const [protocolForm, setProtocolForm] = useState<Omit<DeepWorkProtocol, 'id'>>(emptyProtocolForm())

  const emptySessionForm = () => ({
    date: todayStr(),
    protocolId: '',
    startTime: '',
    durationMinutes: 90,
    actualMinutes: 90,
    task: '',
    depthScore: 7,
    interruptions: 0,
    outputQuality: 7,
    insight: '',
  })

  const [sessionForm, setSessionForm] = useState(emptySessionForm())

  useEffect(() => {
    const d = loadData()
    setProtocols(d.protocols)
    setSessions(d.sessions)
  }, [])

  const persist = (p: DeepWorkProtocol[], s: DeepWorkSession[]) => {
    saveData({ protocols: p, sessions: s })
  }

  const weekHours = useMemo(() => {
    const ws = weekStartStr()
    return sessions.filter(s => s.date >= ws).reduce((acc, s) => acc + s.actualMinutes, 0) / 60
  }, [sessions])

  const monthHours = useMemo(() => {
    const ms = monthStartStr()
    return sessions.filter(s => s.date >= ms).reduce((acc, s) => acc + s.actualMinutes, 0) / 60
  }, [sessions])

  const avgDepth = useMemo(() => {
    if (sessions.length === 0) return 0
    return sessions.reduce((a, s) => a + s.depthScore, 0) / sessions.length
  }, [sessions])

  const days30 = useMemo(() => last30Days(), [])

  const depthByDay = useMemo(() => {
    const map: Record<string, number[]> = {}
    sessions.forEach(s => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s.depthScore)
    })
    return days30.map(d => ({
      date: d,
      avg: map[d] ? map[d].reduce((a, b) => a + b, 0) / map[d].length : null,
    }))
  }, [sessions, days30])

  const rankedProtocols = useMemo(() => {
    return protocols
      .map(p => {
        const ps = sessions.filter(s => s.protocolId === p.id)
        const avgQ = ps.length > 0 ? ps.reduce((a, s) => a + s.outputQuality, 0) / ps.length : 0
        const avgD = ps.length > 0 ? ps.reduce((a, s) => a + s.depthScore, 0) / ps.length : 0
        return { protocol: p, sessionCount: ps.length, avgQuality: avgQ, avgDepth: avgD }
      })
      .filter(x => x.sessionCount > 0)
      .sort((a, b) => b.avgQuality - a.avgQuality)
  }, [protocols, sessions])

  const heatmapData = useMemo(() => {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const TIME_SLOTS = ['early-morning', 'morning', 'afternoon', 'evening'] as const
    const map: Record<string, Record<string, number[]>> = {}
    DAYS.forEach(d => {
      map[d] = {}
      TIME_SLOTS.forEach(t => { map[d][t] = [] })
    })
    sessions.forEach(s => {
      const dow = DAYS[new Date(s.date + 'T12:00:00').getDay()]
      const proto = protocols.find(p => p.id === s.protocolId)
      if (proto) {
        map[dow][proto.bestTimeOfDay].push(s.outputQuality)
      }
    })
    return { DAYS, TIME_SLOTS, map }
  }, [sessions, protocols])

  const compareData = useMemo(() => {
    return protocols
      .map(p => {
        const ps = sessions.filter(s => s.protocolId === p.id)
        if (ps.length < 3) return null
        return {
          protocol: p,
          avgDepth: ps.reduce((a, s) => a + s.depthScore, 0) / ps.length,
          avgOutput: ps.reduce((a, s) => a + s.outputQuality, 0) / ps.length,
          avgInterruptions: ps.reduce((a, s) => a + s.interruptions, 0) / ps.length,
          count: ps.length,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [protocols, sessions])

  const addProtocol = () => {
    if (!protocolForm.name.trim()) return
    const p: DeepWorkProtocol = { ...protocolForm, id: Date.now().toString() }
    const updated = [...protocols, p]
    setProtocols(updated)
    persist(updated, sessions)
    setProtocolForm(emptyProtocolForm())
    setNewPreRitual('')
    setNewPostRitual('')
    setNewBlocker('')
    setShowProtocolForm(false)
    toastSuccess('Protocol created', p.name)
  }

  const toggleProtocolActive = (id: string) => {
    const updated = protocols.map(p => p.id === id ? { ...p, active: !p.active } : p)
    setProtocols(updated)
    persist(updated, sessions)
  }

  const deleteProtocol = (id: string) => {
    const updated = protocols.filter(p => p.id !== id)
    setProtocols(updated)
    persist(updated, sessions)
    toastSuccess('Protocol deleted')
  }

  const addSession = () => {
    if (!sessionForm.task.trim() || !sessionForm.protocolId) return
    const s: DeepWorkSession = { ...sessionForm, id: Date.now().toString() }
    const updated = [s, ...sessions]
    setSessions(updated)
    persist(protocols, updated)
    setSessionForm(emptySessionForm())
    setShowSessionForm(false)
    toastSuccess('Session logged', `${fmtMins(s.actualMinutes)} — depth ${s.depthScore}/10`)
  }

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    persist(protocols, updated)
    toastSuccess('Session removed')
  }

  const addToList = (
    field: 'preRitual' | 'postRitual' | 'distractionBlockers',
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const v = value.trim()
    if (!v) return
    setProtocolForm(f => ({ ...f, [field]: [...f[field], v] }))
    setter('')
  }

  const removeFromList = (field: 'preRitual' | 'postRitual' | 'distractionBlockers', idx: number) => {
    setProtocolForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }))
  }

  const chartH = 80
  const validDepths = depthByDay.filter(d => d.avg !== null)
  const maxDepth = validDepths.length > 0 ? Math.max(...validDepths.map(d => d.avg as number)) : 10
  const chartMaxY = Math.max(maxDepth, 1)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-8 h-8" style={{ color: '#3b82f6' }} />
            Deep Work OS
          </h1>
          <p className="text-slate-400 mt-1">Protect and optimize your deep work time</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSessionForm(s => !s); setShowProtocolForm(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ background: '#3b82f6', color: '#fff' }}
          >
            <Zap className="w-4 h-4" /> Log Session
          </button>
          <button
            onClick={() => { setShowProtocolForm(s => !s); setShowSessionForm(false) }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Protocol
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-4 text-center" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#3b82f6' }}>
            {weekHours.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500 mt-1">Deep Work This Week</div>
        </div>
        <div className="game-card p-4 text-center" style={{ borderTop: '2px solid #22c55e' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#22c55e' }}>
            {monthHours.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500 mt-1">This Month</div>
        </div>
        <div className="game-card p-4 text-center" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#f59e0b' }}>
            {avgDepth > 0 ? avgDepth.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Avg Depth Score</div>
        </div>
        <div className="game-card p-4 text-center" style={{ borderTop: '2px solid #8b5cf6' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#8b5cf6' }}>
            {sessions.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total Sessions</div>
        </div>
      </div>

      {showSessionForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#3b82f6' }} /> Log Deep Work Session
            </h3>
            <button onClick={() => setShowSessionForm(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <input type="date" value={sessionForm.date} max={todayStr()}
                onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Start Time</label>
              <input type="time" value={sessionForm.startTime}
                onChange={e => setSessionForm(f => ({ ...f, startTime: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Protocol</label>
              <select value={sessionForm.protocolId}
                onChange={e => setSessionForm(f => ({ ...f, protocolId: e.target.value }))}
                className="game-input w-full text-sm">
                <option value="">Select protocol</option>
                {protocols.filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Task / Goal</label>
            <input type="text" value={sessionForm.task} placeholder="What are you working on?"
              onChange={e => setSessionForm(f => ({ ...f, task: e.target.value }))}
              className="game-input w-full text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Planned (min)</label>
              <input type="number" min={1} value={sessionForm.durationMinutes}
                onChange={e => setSessionForm(f => ({ ...f, durationMinutes: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Actual (min)</label>
              <input type="number" min={1} value={sessionForm.actualMinutes}
                onChange={e => setSessionForm(f => ({ ...f, actualMinutes: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(
              [
                { label: 'Depth Score', field: 'depthScore' as const, color: '#3b82f6' },
                { label: 'Output Quality', field: 'outputQuality' as const, color: '#22c55e' },
                { label: 'Interruptions', field: 'interruptions' as const, color: '#ef4444', max: 20 },
              ] as Array<{ label: string; field: 'depthScore' | 'outputQuality' | 'interruptions'; color: string; max?: number }>
            ).map(({ label, field, color, max = 10 }) => (
              <div key={field}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-slate-400">{label}</label>
                  <span className="text-xs font-bold" style={{ color }}>{sessionForm[field]}{max === 10 ? '/10' : ''}</span>
                </div>
                <input type="range" min={0} max={max} value={sessionForm[field]}
                  onChange={e => setSessionForm(f => ({ ...f, [field]: parseInt(e.target.value) }))}
                  className="w-full accent-blue-500" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Key Insight</label>
            <textarea value={sessionForm.insight} placeholder="What did you learn or discover?"
              onChange={e => setSessionForm(f => ({ ...f, insight: e.target.value }))}
              className="game-input w-full text-sm resize-none" rows={2} />
          </div>

          <div className="flex gap-2">
            <button onClick={addSession} disabled={!sessionForm.task.trim() || !sessionForm.protocolId}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 text-white"
              style={{ background: '#3b82f6' }}>
              Log Session
            </button>
            <button onClick={() => setShowSessionForm(false)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showProtocolForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#3b82f6' }} /> New Protocol
            </h3>
            <button onClick={() => setShowProtocolForm(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Protocol Name</label>
              <input type="text" value={protocolForm.name} placeholder="e.g. Morning Deep Work"
                onChange={e => setProtocolForm(f => ({ ...f, name: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Environment</label>
              <input type="text" value={protocolForm.environment} placeholder="e.g. Home office, Library"
                onChange={e => setProtocolForm(f => ({ ...f, environment: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Duration (min)</label>
              <input type="number" min={15} value={protocolForm.durationMinutes}
                onChange={e => setProtocolForm(f => ({ ...f, durationMinutes: Math.max(15, parseInt(e.target.value) || 15) }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Best Time of Day</label>
              <select value={protocolForm.bestTimeOfDay}
                onChange={e => setProtocolForm(f => ({ ...f, bestTimeOfDay: e.target.value as DeepWorkProtocol['bestTimeOfDay'] }))}
                className="game-input w-full text-sm">
                {(Object.keys(TIME_LABELS) as DeepWorkProtocol['bestTimeOfDay'][]).map(t => (
                  <option key={t} value={t}>{TIME_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {(
            [
              { label: 'Pre-Ritual Steps', field: 'preRitual' as const, value: newPreRitual, setter: setNewPreRitual, placeholder: 'e.g. Put phone in drawer' },
              { label: 'Post-Ritual Steps', field: 'postRitual' as const, value: newPostRitual, setter: setNewPostRitual, placeholder: 'e.g. Write 3 takeaways' },
              { label: 'Distraction Blockers', field: 'distractionBlockers' as const, value: newBlocker, setter: setNewBlocker, placeholder: 'e.g. Block social media' },
            ] as Array<{
              label: string
              field: 'preRitual' | 'postRitual' | 'distractionBlockers'
              value: string
              setter: React.Dispatch<React.SetStateAction<string>>
              placeholder: string
            }>
          ).map(({ label, field, value, setter, placeholder }) => (
            <div key={field}>
              <label className="text-xs text-slate-400 block mb-2">{label}</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={value} placeholder={placeholder}
                  onChange={e => setter(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addToList(field, value, setter)}
                  className="game-input flex-1 text-sm" />
                <button onClick={() => addToList(field, value, setter)}
                  disabled={!value.trim()}
                  className="px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 border"
                  style={{ background: '#3b82f620', color: '#3b82f6', borderColor: '#3b82f640' }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {protocolForm[field].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-slate-700/50 rounded-lg">
                    <span className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="text-blue-400 font-bold">{idx + 1}.</span> {item}
                    </span>
                    <button onClick={() => removeFromList(field, idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button onClick={addProtocol} disabled={!protocolForm.name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 text-white"
              style={{ background: '#3b82f6' }}>
              Create Protocol
            </button>
            <button onClick={() => setShowProtocolForm(false)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['dashboard', 'protocols', 'session', 'heatmap', 'compare'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={activeTab === tab ? { background: '#1e3a5f', color: '#3b82f6' } : { color: '#64748b' }}>
            {tab === 'heatmap' ? 'Time Map' : tab === 'compare' ? 'Compare' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No sessions yet. Log your first deep work session.</p>
            </div>
          ) : (
            <>
              <div className="game-card p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: '#3b82f6' }} />
                  Depth Score — Last 30 Days
                </h3>
                <svg width="100%" height={chartH + 20} viewBox={`0 0 ${days30.length * 12} ${chartH + 20}`} preserveAspectRatio="none">
                  {depthByDay.map((d, i) => {
                    if (d.avg === null) return null
                    const x = i * 12 + 6
                    const y = chartH - (d.avg / chartMaxY) * (chartH - 4)
                    return <circle key={d.date} cx={x} cy={y} r={3} fill="#3b82f6" opacity={0.8} />
                  })}
                  {(() => {
                    const pts = depthByDay
                      .map((d, i) => d.avg !== null ? `${i * 12 + 6},${chartH - (d.avg / chartMaxY) * (chartH - 4)}` : null)
                      .filter((p): p is string => p !== null)
                    return pts.length > 1 ? (
                      <polyline points={pts.join(' ')} fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.6} />
                    ) : null
                  })()}
                </svg>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{days30[0]?.slice(5)}</span>
                  <span>Today</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" /> Top Protocols by Output Quality
                </h3>
                <div className="space-y-2">
                  {rankedProtocols.slice(0, 5).map((r, idx) => (
                    <div key={r.protocol.id} className="game-card p-3 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: idx === 0 ? '#f59e0b20' : '#1e293b', color: idx === 0 ? '#f59e0b' : '#64748b' }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-200 truncate">{r.protocol.name}</div>
                        <div className="text-xs text-slate-500">{r.sessionCount} sessions · {fmtMins(r.protocol.durationMinutes)}</div>
                        <ScoreBar value={r.avgQuality} max={10} color="#22c55e" />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold" style={{ color: '#22c55e' }}>{r.avgQuality.toFixed(1)}</div>
                        <div className="text-xs text-slate-500">quality</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} /> Recent Sessions
                </h3>
                <div className="space-y-2">
                  {sessions.slice(0, 5).map(s => {
                    const proto = protocols.find(p => p.id === s.protocolId)
                    return (
                      <div key={s.id} className="game-card p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-200 truncate">{s.task}</div>
                          <div className="text-xs text-slate-500">{s.date} · {proto?.name ?? 'Unknown'} · {fmtMins(s.actualMinutes)}</div>
                        </div>
                        <div className="flex gap-3 text-right flex-shrink-0">
                          <div>
                            <div className="text-sm font-bold" style={{ color: '#3b82f6' }}>{s.depthScore}</div>
                            <div className="text-xs text-slate-600">depth</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold" style={{ color: '#22c55e' }}>{s.outputQuality}</div>
                            <div className="text-xs text-slate-600">output</div>
                          </div>
                        </div>
                        <button onClick={() => deleteSession(s.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'protocols' && (
        <div className="space-y-3">
          {protocols.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No protocols yet. Create your first deep work protocol.</p>
            </div>
          ) : (
            protocols.map(p => {
              const isExpanded = expandedProtocol === p.id
              const ps = sessions.filter(s => s.protocolId === p.id)
              return (
                <div key={p.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${p.active ? '#3b82f6' : '#334155'}` }}>
                  <div className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedProtocol(isExpanded ? null : p.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-200">{p.name}</span>
                        <span className="px-2 py-0.5 rounded text-xs border"
                          style={{ background: TIME_COLORS[p.bestTimeOfDay] + '20', color: TIME_COLORS[p.bestTimeOfDay], borderColor: TIME_COLORS[p.bestTimeOfDay] + '40' }}>
                          {TIME_LABELS[p.bestTimeOfDay]}
                        </span>
                        {!p.active && <span className="text-xs text-slate-600 italic">inactive</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.environment} · {fmtMins(p.durationMinutes)} · {ps.length} sessions</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); toggleProtocolActive(p.id) }}
                        className="p-1.5 rounded-lg transition-colors text-xs"
                        style={p.active ? { background: '#3b82f620', color: '#3b82f6' } : { background: '#1e293b', color: '#64748b' }}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteProtocol(p.id) }}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Pre-Ritual', items: p.preRitual, color: '#3b82f6' },
                          { label: 'Post-Ritual', items: p.postRitual, color: '#22c55e' },
                          { label: 'Blockers', items: p.distractionBlockers, color: '#ef4444' },
                        ].map(({ label, items, color }) => (
                          <div key={label}>
                            <div className="text-xs font-semibold mb-2" style={{ color }}>{label}</div>
                            {items.length === 0 ? (
                              <p className="text-xs text-slate-600 italic">None set</p>
                            ) : (
                              <ul className="space-y-1">
                                {items.map((item, i) => (
                                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                    <span className="flex-shrink-0 mt-0.5" style={{ color }}>{i + 1}.</span> {item}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
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

      {activeTab === 'session' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No sessions logged yet.</p>
            </div>
          ) : (
            [...sessions].sort((a, b) => b.date.localeCompare(a.date)).map(s => {
              const proto = protocols.find(p => p.id === s.protocolId)
              return (
                <div key={s.id} className="game-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-200 mb-1">{s.task}</div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                        <span>{s.date}{s.startTime ? ` @ ${s.startTime}` : ''}</span>
                        <span>{proto?.name ?? 'Unknown protocol'}</span>
                        <span>Planned: {fmtMins(s.durationMinutes)} · Actual: {fmtMins(s.actualMinutes)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {[
                          { label: 'Depth', value: s.depthScore, max: 10, color: '#3b82f6' },
                          { label: 'Output', value: s.outputQuality, max: 10, color: '#22c55e' },
                          { label: 'Interruptions', value: s.interruptions, max: 10, color: '#ef4444' },
                        ].map(({ label, value, max, color }) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500">{label}</span>
                              <span className="font-bold" style={{ color }}>{value}{max === 10 && label !== 'Interruptions' ? '/10' : ''}</span>
                            </div>
                            <ScoreBar value={value} max={max} color={color} />
                          </div>
                        ))}
                      </div>
                      {s.insight && <p className="text-xs text-slate-400 italic">"{s.insight}"</p>}
                    </div>
                    <button onClick={() => deleteSession(s.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: '#3b82f6' }} />
            Output Quality by Day × Time of Day
          </h3>
          {sessions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Log sessions to see your peak performance heatmap.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-slate-500 pb-2 pr-3 font-normal">Time</th>
                    {heatmapData.DAYS.map(d => (
                      <th key={d} className="text-center pb-2 text-slate-400 font-semibold w-12">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.TIME_SLOTS.map(slot => (
                    <tr key={slot}>
                      <td className="pr-3 py-1.5 text-slate-500 whitespace-nowrap">{TIME_LABELS[slot]}</td>
                      {heatmapData.DAYS.map(day => {
                        const scores = heatmapData.map[day][slot]
                        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
                        const intensity = avg !== null ? avg / 10 : 0
                        return (
                          <td key={day} className="py-1.5 text-center">
                            <div className="w-10 h-10 mx-auto rounded-lg flex flex-col items-center justify-center transition-all"
                              style={{ background: avg !== null ? `rgba(59,130,246,${0.15 + intensity * 0.75})` : '#1e293b' }}>
                              {avg !== null && (
                                <>
                                  <span className="font-bold text-white" style={{ fontSize: '11px' }}>{avg.toFixed(1)}</span>
                                  <span className="text-slate-400" style={{ fontSize: '9px' }}>{scores.length}×</span>
                                </>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-3 justify-end">
                <span className="text-xs text-slate-600">Output quality</span>
                <div className="flex items-center gap-1">
                  {[0.2, 0.4, 0.6, 0.8, 1].map(v => (
                    <div key={v} className="w-5 h-3 rounded" style={{ background: `rgba(59,130,246,${v})` }} />
                  ))}
                </div>
                <span className="text-xs text-slate-600">10</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="space-y-4">
          {compareData.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Protocols need at least 3 sessions each to compare.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">Showing protocols with 3+ sessions</p>
              <div className="game-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 font-semibold">Protocol</th>
                      <th className="text-center p-3 text-blue-400 font-semibold">Avg Depth</th>
                      <th className="text-center p-3 text-green-400 font-semibold">Avg Output</th>
                      <th className="text-center p-3 text-red-400 font-semibold">Avg Interruptions</th>
                      <th className="text-center p-3 text-slate-400 font-semibold">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.map(d => (
                      <tr key={d.protocol.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{d.protocol.name}</div>
                          <div className="text-xs text-slate-500">{d.protocol.environment} · {fmtMins(d.protocol.durationMinutes)}</div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-blue-400">{d.avgDepth.toFixed(1)}</div>
                          <ScoreBar value={d.avgDepth} max={10} color="#3b82f6" />
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-green-400">{d.avgOutput.toFixed(1)}</div>
                          <ScoreBar value={d.avgOutput} max={10} color="#22c55e" />
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-red-400">{d.avgInterruptions.toFixed(1)}</div>
                        </td>
                        <td className="p-3 text-center text-slate-400">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
