import React, { useState, useEffect } from 'react'
import { Wind, Eye, Leaf, MessageCircle, Footprints, Brain, Sun, Plus, Trash2, Target, Sliders, BarChart2, TrendingUp, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-presencetrainerlog'

type PresenceMethod = 'breathing' | 'body-scan' | 'sensory-focus' | 'single-tasking' | 'nature' | 'conversation' | 'meditation'
type PresenceContext = 'morning' | 'work' | 'evening' | 'break' | 'social' | 'nature' | 'exercise'

type PresenceSession = {
  id: string
  date: string
  method: PresenceMethod
  durationMinutes: number
  depthScore: number
  mindChatter: number
  anchor: string
  insights: string
  context: PresenceContext
}

type PresenceGoal = {
  dailyMinutes: number
  targetDepth: number
  preferredMethods: string[]
}

type StorageData = {
  sessions: PresenceSession[]
  goal: PresenceGoal
}

const METHOD_CONFIG: Record<PresenceMethod, { label: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  breathing:       { label: 'Breathing',      Icon: Wind },
  'body-scan':     { label: 'Body Scan',      Icon: Eye },
  'sensory-focus': { label: 'Sensory Focus',  Icon: Eye },
  'single-tasking':{ label: 'Single-Tasking', Icon: Brain },
  nature:          { label: 'Nature',         Icon: Leaf },
  conversation:    { label: 'Conversation',   Icon: MessageCircle },
  meditation:      { label: 'Meditation',     Icon: Sun },
}

const CONTEXT_CONFIG: Record<PresenceContext, string> = {
  morning:  'Morning',
  work:     'Work',
  evening:  'Evening',
  break:    'Break',
  social:   'Social',
  nature:   'Nature',
  exercise: 'Exercise',
}

const METHODS = Object.keys(METHOD_CONFIG) as PresenceMethod[]
const CONTEXTS = Object.keys(CONTEXT_CONFIG) as PresenceContext[]

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StorageData
  } catch { /**/ }
  return {
    sessions: [],
    goal: { dailyMinutes: 20, targetDepth: 7, preferredMethods: [] },
  }
}

function saveData(d: StorageData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch { /**/ }
}

function computePresenceScore(sessions: PresenceSession[]): number {
  if (sessions.length === 0) return 0
  const recent = sessions.slice(0, 14)
  const avgDepth = recent.reduce((s, r) => s + r.depthScore, 0) / recent.length
  const avgChatter = recent.reduce((s, r) => s + r.mindChatter, 0) / recent.length
  return Math.round(avgDepth * ((10 - avgChatter) / 10) * 10) / 10
}

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

function getLast8Weeks(): { label: string; start: string; end: string }[] {
  return Array.from({ length: 8 }, (_, i) => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - i * 7)
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - 6)
    return {
      label: `W${8 - i}`,
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    }
  }).reverse()
}

type Tab = 'log' | 'score' | 'methods' | 'trend' | 'weekly'

export default function PresenceTrainerLog() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StorageData>({ sessions: [], goal: { dailyMinutes: 20, targetDepth: 7, preferredMethods: [] } })
  const [tab, setTab] = useState<Tab>('score')
  const [showForm, setShowForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [form, setForm] = useState<Omit<PresenceSession, 'id'>>({
    date: todayStr(),
    method: 'meditation',
    durationMinutes: 10,
    depthScore: 7,
    mindChatter: 4,
    anchor: '',
    insights: '',
    context: 'morning',
  })
  const [goalForm, setGoalForm] = useState<PresenceGoal>({ dailyMinutes: 20, targetDepth: 7, preferredMethods: [] })

  useEffect(() => {
    const d = loadData()
    setData(d)
    setGoalForm(d.goal)
  }, [])

  function update(next: StorageData): void {
    setData(next)
    saveData(next)
  }

  function submitSession(): void {
    const s: PresenceSession = { id: Date.now().toString(), ...form }
    update({ ...data, sessions: [s, ...data.sessions] })
    setForm(f => ({ ...f, anchor: '', insights: '', date: todayStr() }))
    setShowForm(false)
    toastSuccess('Presence session logged')
  }

  function deleteSession(id: string): void {
    update({ ...data, sessions: data.sessions.filter(s => s.id !== id) })
  }

  function saveGoal(): void {
    update({ ...data, goal: goalForm })
    setShowGoalForm(false)
    toastSuccess('Presence goal updated')
  }

  const presenceScore = computePresenceScore(data.sessions)
  const days30 = getLast30Days()
  const weeks8 = getLast8Weeks()

  const dailyDepth: Record<string, number[]> = {}
  for (const d of days30) dailyDepth[d] = []
  for (const s of data.sessions) {
    if (dailyDepth[s.date] !== undefined) dailyDepth[s.date].push(s.depthScore)
  }
  const dailyAvgDepth = days30.map(d => {
    const arr = dailyDepth[d]
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  })

  const weeklyMinutes = weeks8.map(w =>
    data.sessions
      .filter(s => s.date >= w.start && s.date <= w.end)
      .reduce((sum, s) => sum + s.durationMinutes, 0)
  )

  const methodStats = METHODS.map(m => {
    const ms = data.sessions.filter(s => s.method === m)
    const avgDepth = ms.length > 0 ? ms.reduce((a, s) => a + s.depthScore, 0) / ms.length : 0
    const avgChatter = ms.length > 0 ? ms.reduce((a, s) => a + s.mindChatter, 0) / ms.length : 0
    return { method: m, count: ms.length, avgDepth, avgChatter }
  })

  const maxWeeklyMin = Math.max(...weeklyMinutes, data.goal.dailyMinutes * 7, 1)
  const maxMethodDepth = Math.max(...methodStats.map(m => m.avgDepth), 10)

  const gaugeRadius = 72
  const gaugeCircumference = Math.PI * gaugeRadius
  const scoreAngle = (presenceScore / 10) * gaugeCircumference

  const TABS: { id: Tab; label: string }[] = [
    { id: 'score', label: 'Score' },
    { id: 'log', label: 'Sessions' },
    { id: 'methods', label: 'Methods' },
    { id: 'trend', label: 'Trend' },
    { id: 'weekly', label: 'Weekly' },
  ]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace', color: '#e8ede8' }}>
            <Leaf className="w-7 h-7" style={{ color: '#7db87d' }} />
            Presence Trainer
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7a9080' }}>
            Train your ability to be fully here.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(125,184,125,0.15)', color: '#7db87d', border: '1px solid rgba(125,184,125,0.3)' }}
        >
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(125,184,125,0.05)', border: '1px solid rgba(125,184,125,0.1)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: tab === t.id ? 'rgba(125,184,125,0.2)' : 'transparent',
              color: tab === t.id ? '#7db87d' : '#7a9080',
              border: tab === t.id ? '1px solid rgba(125,184,125,0.3)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 space-y-3" style={{ borderColor: 'rgba(125,184,125,0.25)', background: 'rgba(12,20,16,0.7)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7db87d' }}>Log Presence Session</p>

          <div>
            <p className="text-xs mb-2" style={{ color: '#7a9080' }}>Method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {METHODS.map(m => {
                const { label, Icon } = METHOD_CONFIG[m]
                return (
                  <button
                    key={m}
                    onClick={() => setForm(f => ({ ...f, method: m }))}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all"
                    style={{
                      background: form.method === m ? 'rgba(125,184,125,0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.method === m ? 'rgba(125,184,125,0.35)' : 'rgba(125,184,125,0.08)'}`,
                      color: form.method === m ? '#7db87d' : '#7a9080',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs mb-2" style={{ color: '#7a9080' }}>Context</p>
            <div className="flex flex-wrap gap-1.5">
              {CONTEXTS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, context: c }))}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: form.context === c ? 'rgba(125,184,125,0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.context === c ? 'rgba(125,184,125,0.35)' : 'rgba(125,184,125,0.08)'}`,
                    color: form.context === c ? '#7db87d' : '#7a9080',
                  }}
                >
                  {CONTEXT_CONFIG[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1" style={{ color: '#7a9080' }}>Duration (min)</p>
              <input
                type="number" min={1} value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                className="game-input w-full text-sm"
                style={{ background: 'rgba(125,184,125,0.04)', borderColor: 'rgba(125,184,125,0.15)', color: '#e8ede8' }}
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#7a9080' }}>Date</p>
              <input
                type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="game-input w-full text-sm"
                style={{ background: 'rgba(125,184,125,0.04)', borderColor: 'rgba(125,184,125,0.15)', color: '#e8ede8' }}
              />
            </div>
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: '#7a9080' }}>Presence depth: {form.depthScore}/10</p>
            <input
              type="range" min={1} max={10} value={form.depthScore}
              onChange={e => setForm(f => ({ ...f, depthScore: Number(e.target.value) }))}
              className="w-full h-1" style={{ accentColor: '#7db87d' }}
            />
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: '#7a9080' }}>Mind chatter: {form.mindChatter}/10 (lower = more present)</p>
            <input
              type="range" min={1} max={10} value={form.mindChatter}
              onChange={e => setForm(f => ({ ...f, mindChatter: Number(e.target.value) }))}
              className="w-full h-1" style={{ accentColor: '#c084fc' }}
            />
          </div>

          <input
            value={form.anchor}
            onChange={e => setForm(f => ({ ...f, anchor: e.target.value }))}
            placeholder="Presence anchor used (breath, sensation, sound...)"
            className="game-input w-full text-sm"
            style={{ background: 'rgba(125,184,125,0.04)', borderColor: 'rgba(125,184,125,0.15)', color: '#e8ede8' }}
          />
          <input
            value={form.insights}
            onChange={e => setForm(f => ({ ...f, insights: e.target.value }))}
            placeholder="Insights or observations"
            className="game-input w-full text-sm"
            style={{ background: 'rgba(125,184,125,0.04)', borderColor: 'rgba(125,184,125,0.15)', color: '#e8ede8' }}
          />

          <div className="flex gap-2">
            <button onClick={submitSession}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(125,184,125,0.2)', color: '#7db87d', border: '1px solid rgba(125,184,125,0.35)' }}>
              Save Session
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#7a9080' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {tab === 'score' && (
        <div className="space-y-4">
          <div className="game-card p-6 flex flex-col items-center" style={{ borderColor: 'rgba(125,184,125,0.2)', background: 'rgba(12,20,16,0.6)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#7a9080' }}>Presence Score</p>
            <svg width="200" height="115" viewBox="0 0 200 115">
              <path
                d={`M 16 100 A ${gaugeRadius} ${gaugeRadius} 0 0 1 184 100`}
                fill="none"
                stroke="rgba(125,184,125,0.1)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {presenceScore > 0 && (
                <path
                  d={`M 16 100 A ${gaugeRadius} ${gaugeRadius} 0 0 1 184 100`}
                  fill="none"
                  stroke="url(#presenceGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${scoreAngle} ${gaugeCircumference}`}
                />
              )}
              <defs>
                <linearGradient id="presenceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2d6e4f" />
                  <stop offset="100%" stopColor="#7db87d" />
                </linearGradient>
              </defs>
              <text x="100" y="90" textAnchor="middle" fill="#e8ede8" fontSize="32" fontWeight="bold" fontFamily="Orbitron, monospace">
                {presenceScore.toFixed(1)}
              </text>
              <text x="100" y="108" textAnchor="middle" fill="#7a9080" fontSize="10">
                out of 10
              </text>
              <text x="16" y="114" textAnchor="middle" fill="#4a6858" fontSize="9">0</text>
              <text x="184" y="114" textAnchor="middle" fill="#4a6858" fontSize="9">10</text>
            </svg>
            <p className="text-xs mt-2" style={{ color: '#7a9080' }}>avg depth × (10 − avg chatter) / 10 · last 14 sessions</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="game-card p-3" style={{ borderColor: 'rgba(125,184,125,0.12)' }}>
              <div className="text-xl font-bold" style={{ color: '#e8ede8' }}>{data.sessions.length}</div>
              <div className="text-xs" style={{ color: '#7a9080' }}>Sessions</div>
            </div>
            <div className="game-card p-3" style={{ borderColor: 'rgba(125,184,125,0.12)' }}>
              <div className="text-xl font-bold" style={{ color: '#7db87d' }}>
                {data.sessions.reduce((s, r) => s + r.durationMinutes, 0)}m
              </div>
              <div className="text-xs" style={{ color: '#7a9080' }}>Total Time</div>
            </div>
            <div className="game-card p-3" style={{ borderColor: 'rgba(125,184,125,0.12)' }}>
              <div className="text-xl font-bold" style={{ color: '#a78bfa' }}>
                {data.sessions.length > 0
                  ? (data.sessions.reduce((s, r) => s + r.depthScore, 0) / data.sessions.length).toFixed(1)
                  : '—'}
              </div>
              <div className="text-xs" style={{ color: '#7a9080' }}>Avg Depth</div>
            </div>
          </div>

          <div className="game-card p-4" style={{ borderColor: 'rgba(125,184,125,0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: '#7db87d' }} />
                <p className="text-sm font-medium" style={{ color: '#e8ede8' }}>Daily Goal</p>
              </div>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="text-xs"
                style={{ color: '#7db87d' }}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
            {showGoalForm ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#7a9080' }}>Daily minutes: {goalForm.dailyMinutes}</p>
                  <input
                    type="range" min={5} max={120} step={5} value={goalForm.dailyMinutes}
                    onChange={e => setGoalForm(g => ({ ...g, dailyMinutes: Number(e.target.value) }))}
                    className="w-full h-1" style={{ accentColor: '#7db87d' }}
                  />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#7a9080' }}>Target depth: {goalForm.targetDepth}/10</p>
                  <input
                    type="range" min={1} max={10} value={goalForm.targetDepth}
                    onChange={e => setGoalForm(g => ({ ...g, targetDepth: Number(e.target.value) }))}
                    className="w-full h-1" style={{ accentColor: '#7db87d' }}
                  />
                </div>
                <button onClick={saveGoal}
                  className="w-full py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(125,184,125,0.15)', color: '#7db87d', border: '1px solid rgba(125,184,125,0.3)' }}>
                  Save Goal
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm" style={{ color: '#a0b8a8' }}>
                <span>{data.goal.dailyMinutes} min / day</span>
                <span>depth target {data.goal.targetDepth}/10</span>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-2">
          {data.sessions.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#7a9080' }}>
              <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No sessions logged yet.</p>
              <p className="text-xs mt-1">Presence is a skill — it grows with practice.</p>
            </div>
          ) : data.sessions.map(s => {
            const { label, Icon } = METHOD_CONFIG[s.method]
            return (
              <div
                key={s.id}
                className="game-card p-3 flex items-center gap-3"
                style={{ borderColor: 'rgba(125,184,125,0.12)', borderLeft: '3px solid rgba(125,184,125,0.4)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(125,184,125,0.1)' }}>
                  <Icon className="w-4 h-4" style={{ color: '#7db87d' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#e8ede8' }}>{label}</span>
                    <span className="text-xs" style={{ color: '#7a9080' }}>{CONTEXT_CONFIG[s.context]}</span>
                    <span className="text-xs ml-auto" style={{ color: '#7db87d' }}>depth {s.depthScore}/10</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#7a9080' }}>
                    {s.durationMinutes}min · chatter {s.mindChatter}/10 · {s.date}
                  </p>
                  {s.anchor && <p className="text-xs mt-0.5" style={{ color: '#5a7868' }}>anchor: {s.anchor}</p>}
                </div>
                <button onClick={() => deleteSession(s.id)} style={{ color: '#3a5848' }} className="hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'methods' && (
        <div className="space-y-4">
          <div className="game-card p-4" style={{ borderColor: 'rgba(125,184,125,0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4" style={{ color: '#7db87d' }} />
              <p className="text-sm font-medium" style={{ color: '#e8ede8' }}>Method Effectiveness</p>
            </div>
            <div className="space-y-3">
              {methodStats.filter(m => m.count > 0).length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: '#7a9080' }}>No sessions yet</p>
              ) : (
                methodStats.map(m => {
                  const { label, Icon } = METHOD_CONFIG[m.method]
                  if (m.count === 0) return null
                  return (
                    <div key={m.method}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5" style={{ color: '#7db87d' }} />
                        <p className="text-xs font-medium" style={{ color: '#a0b8a8' }}>{label}</p>
                        <span className="text-xs ml-auto" style={{ color: '#5a7868' }}>{m.count} session{m.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16" style={{ color: '#7db87d' }}>depth</span>
                          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(125,184,125,0.1)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(m.avgDepth / maxMethodDepth) * 100}%`, background: '#7db87d' }}
                            />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: '#7db87d' }}>{m.avgDepth.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16" style={{ color: '#c084fc' }}>chatter</span>
                          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(192,132,252,0.1)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(m.avgChatter / 10) * 100}%`, background: '#c084fc' }}
                            />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: '#c084fc' }}>{m.avgChatter.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'trend' && (
        <div className="game-card p-4" style={{ borderColor: 'rgba(125,184,125,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: '#7db87d' }} />
            <p className="text-sm font-medium" style={{ color: '#e8ede8' }}>Presence Depth — 30 Days</p>
          </div>
          <svg width="100%" viewBox="0 0 560 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7db87d" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#7db87d" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[2, 4, 6, 8, 10].map(v => (
              <g key={v}>
                <line
                  x1="0" y1={100 - (v / 10) * 95}
                  x2="560" y2={100 - (v / 10) * 95}
                  stroke="rgba(125,184,125,0.07)" strokeWidth="1"
                />
                <text x="-4" y={100 - (v / 10) * 95 + 4} textAnchor="end" fill="#4a6858" fontSize="9">{v}</text>
              </g>
            ))}
            {(() => {
              const pts = dailyAvgDepth.map((v, i) => {
                const x = (i / 29) * 540 + 10
                const y = v !== null ? 100 - (v / 10) * 95 : null
                return { x, y }
              })
              const filled = pts.filter(p => p.y !== null)
              if (filled.length < 2) return null
              const pathD = filled.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
              const areaD = `${pathD} L ${filled[filled.length - 1].x} 100 L ${filled[0].x} 100 Z`
              return (
                <>
                  <path d={areaD} fill="url(#trendFill)" />
                  <path d={pathD} fill="none" stroke="#7db87d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {filled.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y!} r="2.5" fill="#7db87d" />
                  ))}
                </>
              )
            })()}
            <text x="0" y="114" fill="#4a6858" fontSize="9">30d ago</text>
            <text x="540" y="114" textAnchor="end" fill="#4a6858" fontSize="9">today</text>
          </svg>
          {dailyAvgDepth.every(v => v === null) && (
            <p className="text-xs text-center mt-4" style={{ color: '#7a9080' }}>Log sessions to see your trend</p>
          )}
        </div>
      )}

      {tab === 'weekly' && (
        <div className="game-card p-4" style={{ borderColor: 'rgba(125,184,125,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" style={{ color: '#7db87d' }} />
            <p className="text-sm font-medium" style={{ color: '#e8ede8' }}>Weekly Presence Time</p>
            <span className="ml-auto text-xs" style={{ color: '#7a9080' }}>goal: {data.goal.dailyMinutes * 7}min/wk</span>
          </div>
          <svg width="100%" viewBox="0 0 560 140" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            {weeklyMinutes.map((min, i) => {
              const barW = 48
              const gap = 22
              const x = i * (barW + gap) + 10
              const barH = Math.min((min / maxWeeklyMin) * 100, 100)
              const y = 100 - barH
              const isGoalMet = min >= data.goal.dailyMinutes * 7
              return (
                <g key={i}>
                  <rect
                    x={x} y={100} width={barW} height={0}
                    fill="none"
                  />
                  <rect
                    x={x} y={y} width={barW} height={barH}
                    rx="4"
                    fill={isGoalMet ? 'rgba(125,184,125,0.6)' : 'rgba(125,184,125,0.2)'}
                    stroke={isGoalMet ? 'rgba(125,184,125,0.5)' : 'rgba(125,184,125,0.15)'}
                    strokeWidth="1"
                  />
                  <text x={x + barW / 2} y="115" textAnchor="middle" fill="#4a6858" fontSize="9">
                    {weeks8[i].label}
                  </text>
                  {min > 0 && (
                    <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill="#7db87d" fontSize="9">
                      {min}m
                    </text>
                  )}
                </g>
              )
            })}
            {(() => {
              const goalY = 100 - (data.goal.dailyMinutes * 7 / maxWeeklyMin) * 100
              return goalY >= 0 && goalY <= 100 ? (
                <line
                  x1="0" y1={goalY} x2="560" y2={goalY}
                  stroke="rgba(125,184,125,0.4)" strokeWidth="1.5" strokeDasharray="6 4"
                />
              ) : null
            })()}
            <text x="0" y="130" fill="#4a6858" fontSize="9">8 weeks ago</text>
            <text x="540" y="130" textAnchor="end" fill="#4a6858" fontSize="9">this week</text>
          </svg>
          {weeklyMinutes.every(m => m === 0) && (
            <p className="text-xs text-center mt-2" style={{ color: '#7a9080' }}>Log sessions to track weekly time</p>
          )}
        </div>
      )}
    </div>
  )
}
