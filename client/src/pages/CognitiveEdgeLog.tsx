import React, { useState, useEffect } from 'react'
import { Plus, Save, Brain, Zap, BarChart3, Star, Clock, ChevronDown, ChevronUp, Trash2, X, Activity } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CognitiveSession = {
  id: string
  date: string
  timeOfDay: 'early-morning' | 'morning' | 'afternoon' | 'evening'
  taskType: 'creative' | 'analytical' | 'learning' | 'strategic' | 'social' | 'writing'
  performanceRating: number
  focusDuration: number
  sleepHours: number
  caffeineOz: number
  exercised: boolean
  meditated: boolean
  coldExposure: boolean
  sunlight: boolean
  fasted: boolean
  keyOutput: string
  blockers: string
}

const STORAGE_KEY = 'lq-cognitiveedgelog'

const TASK_COLORS: Record<CognitiveSession['taskType'], string> = {
  creative:   '#f59e0b',
  analytical: '#3b82f6',
  learning:   '#8b5cf6',
  strategic:  '#06b6d4',
  social:     '#22c55e',
  writing:    '#e879f9',
}

const TIME_LABELS: Record<CognitiveSession['timeOfDay'], string> = {
  'early-morning': 'Early Morning',
  'morning':       'Morning',
  'afternoon':     'Afternoon',
  'evening':       'Evening',
}

const TASK_LABELS: Record<CognitiveSession['taskType'], string> = {
  creative:   'Creative',
  analytical: 'Analytical',
  learning:   'Learning',
  strategic:  'Strategic',
  social:     'Social',
  writing:    'Writing',
}

const PROTOCOLS: { key: keyof Pick<CognitiveSession, 'exercised' | 'meditated' | 'coldExposure' | 'sunlight' | 'fasted'>; label: string }[] = [
  { key: 'exercised',    label: 'Exercise' },
  { key: 'meditated',    label: 'Meditate' },
  { key: 'coldExposure', label: 'Cold Exposure' },
  { key: 'sunlight',     label: 'Sunlight' },
  { key: 'fasted',       label: 'Fasted' },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function SpiderChart({ sessions }: { sessions: CognitiveSession[] }): React.ReactElement {
  const types: CognitiveSession['taskType'][] = ['creative', 'analytical', 'learning', 'strategic', 'social', 'writing']
  const cx = 120, cy = 120, maxR = 90

  const avgs = types.map(t => {
    const group = sessions.filter(s => s.taskType === t)
    return group.length > 0 ? group.reduce((sum, s) => sum + s.performanceRating, 0) / group.length : 0
  })

  const maxVal = 10

  function polarXY(index: number, value: number): [number, number] {
    const angle = (index / types.length) * 2 * Math.PI - Math.PI / 2
    const r = (value / maxVal) * maxR
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  function axisXY(index: number, r: number): [number, number] {
    const angle = (index / types.length) * 2 * Math.PI - Math.PI / 2
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  const dataPath = avgs.map((v, i) => {
    const [x, y] = polarXY(i, v)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ') + ' Z'

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-xs mx-auto">
      <defs>
        <radialGradient id="spiderGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {[2, 4, 6, 8, 10].map(ring => {
        const ringPoints = types.map((_, i) => axisXY(i, (ring / maxVal) * maxR))
        const ringPath = ringPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z'
        return <path key={ring} d={ringPath} fill="none" stroke="#1e293b" strokeWidth="1" />
      })}
      {types.map((_, i) => {
        const [x, y] = axisXY(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />
      })}
      {avgs.some(v => v > 0) && (
        <path d={dataPath} fill="url(#spiderGrad)" stroke="#3b82f6" strokeWidth="2" />
      )}
      {avgs.map((v, i) => {
        const [x, y] = polarXY(i, v)
        return v > 0 ? <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" /> : null
      })}
      {types.map((t, i) => {
        const [lx, ly] = axisXY(i, maxR + 16)
        return (
          <text key={t} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={TASK_COLORS[t]} fontSize="8" fontWeight="600">
            {TASK_LABELS[t]}
          </text>
        )
      })}
    </svg>
  )
}

function WeeklyBarChart({ sessions }: { sessions: CognitiveSession[] }): React.ReactElement {
  const weeks: { label: string; minutes: number }[] = []
  for (let w = 7; w >= 0; w--) {
    const start = new Date()
    start.setDate(start.getDate() - (w + 1) * 7)
    const end = new Date()
    end.setDate(end.getDate() - w * 7)
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)
    const mins = sessions.filter(s => s.date >= startStr && s.date < endStr).reduce((sum, s) => sum + s.focusDuration, 0)
    weeks.push({ label: `W-${w === 0 ? 'now' : w}`, minutes: mins })
  }

  const maxMins = Math.max(...weeks.map(w => w.minutes), 60)
  const W = 360, H = 120, PAD = { t: 10, b: 25, l: 35, r: 10 }
  const chartW = W - PAD.l - PAD.r
  const chartH = H - PAD.t - PAD.b
  const barW = chartW / weeks.length - 4

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 60, 120, 180, 240, 300].map(v => {
        if (v > maxMins * 1.1) return null
        const y = PAD.t + chartH - (v / maxMins) * chartH
        return (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={PAD.l - 4} y={y + 4} fill="#64748b" fontSize="7" textAnchor="end">{v}m</text>
          </g>
        )
      })}
      {weeks.map((w, i) => {
        const barH = (w.minutes / maxMins) * chartH
        const x = PAD.l + i * (barW + 4)
        const y = PAD.t + chartH - barH
        return (
          <g key={i}>
            {barH > 0 && (
              <rect x={x} y={y} width={barW} height={barH} rx="2" fill={i === weeks.length - 1 ? '#3b82f6' : '#1e40af'} />
            )}
            <text x={x + barW / 2} y={H - 5} textAnchor="middle" fill="#64748b" fontSize="7">{w.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ProtocolCorrelation({ sessions }: { sessions: CognitiveSession[] }): React.ReactElement {
  return (
    <div className="space-y-3">
      {PROTOCOLS.map(({ key, label }) => {
        const on = sessions.filter(s => s[key])
        const off = sessions.filter(s => !s[key])
        const avgOn = on.length > 0 ? on.reduce((s, e) => s + e.performanceRating, 0) / on.length : null
        const avgOff = off.length > 0 ? off.reduce((s, e) => s + e.performanceRating, 0) / off.length : null
        const diff = avgOn !== null && avgOff !== null ? avgOn - avgOff : null

        return (
          <div key={key} className="p-3 rounded-lg" style={{ background: '#0f172a' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{label}</span>
              {diff !== null && (
                <span className="text-xs font-bold" style={{ color: diff >= 0 ? '#22c55e' : '#ef4444' }}>
                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)} pts
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                <span style={{ color: '#64748b' }}>ON: {avgOn !== null ? avgOn.toFixed(1) : '–'}</span>
                <span style={{ color: '#475569' }}>({on.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                <span style={{ color: '#64748b' }}>OFF: {avgOff !== null ? avgOff.toFixed(1) : '–'}</span>
                <span style={{ color: '#475569' }}>({off.length})</span>
              </div>
            </div>
            {avgOn !== null && avgOff !== null && (
              <div className="mt-2 flex gap-1 h-2">
                <div className="rounded-l-full h-full" style={{ background: '#22c55e', width: `${(avgOn / 10) * 50}%` }} />
                <div className="rounded-r-full h-full" style={{ background: '#ef4444', width: `${(avgOff / 10) * 50}%` }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CognitiveEdgeLog(): React.ReactElement {
  const { toastSuccess } = useToast()

  const [sessions, setSessions] = useState<CognitiveSession[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CognitiveSession[]) : []
    } catch { return [] }
  })

  const [tab, setTab] = useState<'log' | 'dashboard' | 'protocols' | 'peak' | 'weekly'>('log')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const blankForm: Omit<CognitiveSession, 'id'> = {
    date: today(),
    timeOfDay: 'morning',
    taskType: 'analytical',
    performanceRating: 7,
    focusDuration: 60,
    sleepHours: 7,
    caffeineOz: 8,
    exercised: false,
    meditated: false,
    coldExposure: false,
    sunlight: false,
    fasted: false,
    keyOutput: '',
    blockers: '',
  }

  const [form, setForm] = useState<Omit<CognitiveSession, 'id'>>(blankForm)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  function saveSession(): void {
    const s: CognitiveSession = { ...form, id: Date.now().toString() }
    setSessions(prev => [s, ...prev])
    setForm(blankForm)
    setShowForm(false)
    toastSuccess('Session logged', `Performance: ${form.performanceRating}/10`)
  }

  function deleteSession(id: string): void {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const peakSessions = sessions.filter(s => s.performanceRating >= 8)
  const peakConditions: Record<string, number> = {}
  if (peakSessions.length > 0) {
    PROTOCOLS.forEach(({ key, label }) => {
      const count = peakSessions.filter(s => s[key]).length
      peakConditions[label] = count
    })
  }

  const timeOfDayAvg: { time: CognitiveSession['timeOfDay']; avg: number; count: number }[] = (
    ['early-morning', 'morning', 'afternoon', 'evening'] as CognitiveSession['timeOfDay'][]
  ).map(time => {
    const group = sessions.filter(s => s.timeOfDay === time)
    return {
      time,
      avg: group.length > 0 ? group.reduce((s, e) => s + e.performanceRating, 0) / group.length : 0,
      count: group.length,
    }
  })

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'log',       label: 'Sessions' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'protocols', label: 'Protocols' },
    { key: 'peak',      label: 'Peak Days' },
    { key: 'weekly',    label: 'Weekly Load' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6" style={{ color: '#e2e8f0' }}>
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8" style={{ color: '#3b82f6' }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#3b82f6' }}>Cognitive Edge Log</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Track · Optimize · Perform</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: tab === t.key ? '#3b82f6' : '#1e293b', color: tab === t.key ? '#fff' : '#94a3b8' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold" style={{ color: '#3b82f6' }}>Sessions</h2>
            <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: '#3b82f6', color: '#fff' }}>
              <Plus className="w-4 h-4" /> Log Session
            </button>
          </div>

          {showForm && (
            <div className="game-card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">New Session</h3>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4" style={{ color: '#64748b' }} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Date</label>
                  <input type="date" className="game-input w-full" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Time of Day</label>
                  <select className="game-input w-full" value={form.timeOfDay} onChange={e => setForm(p => ({ ...p, timeOfDay: e.target.value as CognitiveSession['timeOfDay'] }))}>
                    {(Object.keys(TIME_LABELS) as CognitiveSession['timeOfDay'][]).map(t => (
                      <option key={t} value={t}>{TIME_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Task Type</label>
                  <select className="game-input w-full" value={form.taskType} onChange={e => setForm(p => ({ ...p, taskType: e.target.value as CognitiveSession['taskType'] }))}>
                    {(Object.keys(TASK_LABELS) as CognitiveSession['taskType'][]).map(t => (
                      <option key={t} value={t}>{TASK_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Performance ({form.performanceRating}/10)</label>
                  <input type="range" min="1" max="10" value={form.performanceRating} onChange={e => setForm(p => ({ ...p, performanceRating: Number(e.target.value) }))} className="w-full" style={{ accentColor: '#3b82f6' }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Focus Duration (min)</label>
                  <input type="number" className="game-input w-full" value={form.focusDuration} onChange={e => setForm(p => ({ ...p, focusDuration: Number(e.target.value) }))} min="0" />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Sleep (hrs)</label>
                  <input type="number" className="game-input w-full" value={form.sleepHours} onChange={e => setForm(p => ({ ...p, sleepHours: Number(e.target.value) }))} min="0" max="24" step="0.5" />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Caffeine (oz)</label>
                  <input type="number" className="game-input w-full" value={form.caffeineOz} onChange={e => setForm(p => ({ ...p, caffeineOz: Number(e.target.value) }))} min="0" />
                </div>
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: '#94a3b8' }}>Protocols</label>
                <div className="flex flex-wrap gap-2">
                  {PROTOCOLS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: form[key] ? '#1e3a5f' : '#1e293b', color: form[key] ? '#3b82f6' : '#64748b', border: `1px solid ${form[key] ? '#3b82f6' : '#334155'}` }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <input className="game-input w-full" placeholder="Key output / what you accomplished" value={form.keyOutput} onChange={e => setForm(p => ({ ...p, keyOutput: e.target.value }))} />
              <input className="game-input w-full" placeholder="Blockers / what hurt performance" value={form.blockers} onChange={e => setForm(p => ({ ...p, blockers: e.target.value }))} />
              <button onClick={saveSession} className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{ background: '#3b82f6', color: '#fff' }}>
                <Save className="w-4 h-4" /> Save Session
              </button>
            </div>
          )}

          <div className="space-y-3">
            {sessions.length === 0 && (
              <div className="text-center py-12" style={{ color: '#475569' }}>
                <Brain className="w-12 h-12 mx-auto mb-3" style={{ color: '#1e3a5f' }} />
                <p>No sessions yet. Log your first cognitive session.</p>
              </div>
            )}
            {sessions.map(s => (
              <div key={s.id} className="game-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: TASK_COLORS[s.taskType] + '20' }}>
                      <span className="text-lg font-bold" style={{ color: TASK_COLORS[s.taskType] }}>{s.performanceRating}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{s.date}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: TASK_COLORS[s.taskType] + '22', color: TASK_COLORS[s.taskType] }}>{TASK_LABELS[s.taskType]}</span>
                        <span className="text-xs" style={{ color: '#64748b' }}>{TIME_LABELS[s.timeOfDay]}</span>
                        <span className="text-xs" style={{ color: '#64748b' }}>{s.focusDuration}min focus</span>
                      </div>
                      {s.keyOutput && <p className="text-xs mt-1 truncate max-w-xs" style={{ color: '#94a3b8' }}>{s.keyOutput}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                      {expandedId === s.id ? <ChevronUp className="w-4 h-4" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#64748b' }} />}
                    </button>
                    <button onClick={() => deleteSession(s.id)}>
                      <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>
                {expandedId === s.id && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-xs" style={{ borderColor: '#1e293b' }}>
                    <div><span style={{ color: '#64748b' }}>Sleep:</span> <span>{s.sleepHours}h</span></div>
                    <div><span style={{ color: '#64748b' }}>Caffeine:</span> <span>{s.caffeineOz}oz</span></div>
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {PROTOCOLS.filter(({ key }) => s[key]).map(({ label }) => (
                        <span key={label} className="px-2 py-0.5 rounded-full" style={{ background: '#1e3a5f', color: '#3b82f6' }}>{label}</span>
                      ))}
                    </div>
                    {s.blockers && <div className="col-span-2 md:col-span-4"><span style={{ color: '#64748b' }}>Blockers: </span>{s.blockers}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="game-card p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#3b82f6' }}>Performance by Task Type</h3>
              <SpiderChart sessions={sessions} />
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {(Object.keys(TASK_LABELS) as CognitiveSession['taskType'][]).map(t => {
                  const group = sessions.filter(s => s.taskType === t)
                  if (group.length === 0) return null
                  const avg = group.reduce((s, e) => s + e.performanceRating, 0) / group.length
                  return (
                    <div key={t} className="text-xs flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: TASK_COLORS[t] }} />
                      <span style={{ color: '#94a3b8' }}>{TASK_LABELS[t]}: </span>
                      <span style={{ color: TASK_COLORS[t] }}>{avg.toFixed(1)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="game-card p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#3b82f6' }}>Avg Performance by Time of Day</h3>
              <div className="space-y-3">
                {timeOfDayAvg.map(({ time, avg, count }) => (
                  <div key={time}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#94a3b8' }}>{TIME_LABELS[time]}</span>
                      <span style={{ color: '#3b82f6' }}>{count > 0 ? avg.toFixed(1) : '–'} <span style={{ color: '#475569' }}>({count})</span></span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: '#1e293b' }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(avg / 10) * 100}%`, background: '#3b82f6' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Sessions', value: sessions.length },
                  { label: 'Avg Rating', value: sessions.length > 0 ? (sessions.reduce((s, e) => s + e.performanceRating, 0) / sessions.length).toFixed(1) : '–' },
                  { label: 'Total Focus', value: sessions.length > 0 ? `${sessions.reduce((s, e) => s + e.focusDuration, 0)}m` : '–' },
                ].map(stat => (
                  <div key={stat.label} className="p-2 rounded-lg" style={{ background: '#0f172a' }}>
                    <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'protocols' && (
        <div className="game-card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#3b82f6' }}>Protocol Correlation</h2>
          <p className="text-xs mb-4" style={{ color: '#64748b' }}>Average performance rating with protocol ON vs OFF</p>
          <ProtocolCorrelation sessions={sessions} />
        </div>
      )}

      {tab === 'peak' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: '#3b82f6' }}>Peak Performance Days (≥8/10)</h2>
          {peakSessions.length === 0 ? (
            <div className="game-card p-8 text-center" style={{ color: '#475569' }}>
              <Star className="w-10 h-10 mx-auto mb-3" style={{ color: '#1e3a5f' }} />
              No peak sessions yet. Aim for 8+ ratings.
            </div>
          ) : (
            <>
              <div className="game-card p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Common conditions in peak sessions</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(peakConditions).map(([label, count]) => (
                    <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#0f172a' }}>
                      <span className="text-sm">{label}</span>
                      <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>{count}/{peakSessions.length}</span>
                      <div className="w-12 h-1.5 rounded-full" style={{ background: '#1e293b' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(count / peakSessions.length) * 100}%`, background: count / peakSessions.length >= 0.7 ? '#22c55e' : '#3b82f6' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {peakSessions.map(s => (
                  <div key={s.id} className="game-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fef08a20' }}>
                      <Star className="w-5 h-5" style={{ color: '#eab308' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="font-medium">{s.date}</span>
                        <span style={{ color: '#eab308' }}>{s.performanceRating}/10</span>
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: TASK_COLORS[s.taskType] + '22', color: TASK_COLORS[s.taskType] }}>{TASK_LABELS[s.taskType]}</span>
                      </div>
                      {s.keyOutput && <p className="text-xs mt-1 truncate" style={{ color: '#94a3b8' }}>{s.keyOutput}</p>}
                    </div>
                    <div className="shrink-0 text-xs" style={{ color: '#64748b' }}>{s.focusDuration}min</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'weekly' && (
        <div className="game-card p-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#3b82f6' }}>Weekly Cognitive Load</h2>
          <p className="text-xs mb-4" style={{ color: '#64748b' }}>Total focus minutes per week (last 8 weeks)</p>
          <WeeklyBarChart sessions={sessions} />
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            {[
              { label: 'This Week', value: (() => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay()); const s = start.toISOString().slice(0, 10); return sessions.filter(e => e.date >= s).reduce((sum, e) => sum + e.focusDuration, 0) + 'm' })() },
              { label: 'Avg / Week', value: sessions.length > 0 ? Math.round(sessions.reduce((s, e) => s + e.focusDuration, 0) / 8) + 'm' : '–' },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-lg" style={{ background: '#0f172a' }}>
                <div className="text-xl font-bold" style={{ color: '#3b82f6' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
