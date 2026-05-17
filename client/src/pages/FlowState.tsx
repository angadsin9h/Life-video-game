import { useState, useEffect, useMemo } from 'react'
import { Zap, Plus, Trash2, BarChart3, Brain, Clock, Flame, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface FlowSession {
  id: string
  date: string
  activity: string
  durationMins: number
  preEnergy: number       // 1-5
  flowDepth: number       // 1-5
  triggers: string[]
  blockers: string[]
  notes: string
}

const FLOW_DEPTH_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Distracted', color: '#ef4444', bg: '#ef444420' },
  2: { label: 'Light',      color: '#f97316', bg: '#f9731620' },
  3: { label: 'Moderate',   color: '#eab308', bg: '#eab30820' },
  4: { label: 'Deep',       color: '#22c55e', bg: '#22c55e20' },
  5: { label: 'Peak',       color: '#8b5cf6', bg: '#8b5cf620' },
}

const ENERGY_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Peak',
}

const DEFAULT_TRIGGERS = [
  'Deep work music',
  'Phone on silent',
  'Clear desk',
  'Morning session',
  'Coffee / tea',
  'Warm-up task',
  'Clear goal set',
  'Timer running',
]

const DEFAULT_BLOCKERS = [
  'Slack / notifications',
  'Unclear objective',
  'Low energy',
  'Background noise',
  'Multitasking',
  'Context switching',
]

const STORAGE_KEY = 'flow_state_sessions'
const TRIGGERS_KEY = 'flow_state_triggers'
const BLOCKERS_KEY = 'flow_state_blockers'

function loadSessions(): FlowSession[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveSessions(s: FlowSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}
function loadList(key: string, defaults: string[]): string[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaults
  } catch { return defaults }
}
function saveList(key: string, list: string[]) {
  localStorage.setItem(key, JSON.stringify(list))
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const todayD = new Date()
  todayD.setHours(0, 0, 0, 0)
  const diff = Math.floor((todayD.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return fmtDate(dateStr)
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function FlowState() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<FlowSession[]>([])
  const [triggers, setTriggers] = useState<string[]>([])
  const [blockers, setBlockers] = useState<string[]>([])

  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'history' | 'triggers' | 'blockers'>('history')

  // New trigger / blocker inputs
  const [newTrigger, setNewTrigger] = useState('')
  const [newBlocker, setNewBlocker] = useState('')

  // Form state
  const [form, setForm] = useState({
    date: today(),
    activity: '',
    durationMins: 45,
    preEnergy: 3,
    flowDepth: 3,
    selectedTriggers: [] as string[],
    selectedBlockers: [] as string[],
    notes: '',
  })

  useEffect(() => {
    setSessions(loadSessions())
    setTriggers(loadList(TRIGGERS_KEY, DEFAULT_TRIGGERS))
    setBlockers(loadList(BLOCKERS_KEY, DEFAULT_BLOCKERS))
  }, [])

  const sorted = useMemo(() => {
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  }, [sessions])

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalMins = sessions.reduce((s, s2) => s + s2.durationMins, 0)
  const avgDepth = sessions.length > 0
    ? (sessions.reduce((s, s2) => s + s2.flowDepth, 0) / sessions.length)
    : 0

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const sessionsThisWeek = sessions.filter(s => s.date >= weekStartStr).length

  // Best streak of consecutive days with depth >= 4
  const bestDeepStreak = useMemo(() => {
    const deepDates = new Set(
      sessions.filter(s => s.flowDepth >= 4).map(s => s.date)
    )
    const allDates = [...deepDates].sort()
    if (allDates.length === 0) return 0
    let best = 1
    let cur = 1
    for (let i = 1; i < allDates.length; i++) {
      const prev = new Date(allDates[i - 1] + 'T12:00:00')
      const curr = new Date(allDates[i] + 'T12:00:00')
      const diff = (curr.getTime() - prev.getTime()) / 86400000
      if (Math.round(diff) === 1) {
        cur++
        best = Math.max(best, cur)
      } else {
        cur = 1
      }
    }
    return best
  }, [sessions])

  // Last 7 sessions' flow depth for bar chart
  const last7Sessions = sorted.slice(0, 7).reverse()

  // Weekly pattern — average depth by day of week
  const weeklyPattern = useMemo(() => {
    const byDay: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    sessions.forEach(s => {
      const dow = new Date(s.date + 'T12:00:00').getDay()
      byDay[dow].push(s.flowDepth)
    })
    return Object.entries(byDay).map(([day, depths]) => ({
      day: parseInt(day),
      avg: depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0,
      count: depths.length,
    }))
  }, [sessions])

  const bestDay = weeklyPattern.reduce((best, d) => d.avg > best.avg ? d : best, weeklyPattern[0])

  // ─── Actions ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({
      date: today(),
      activity: '',
      durationMins: 45,
      preEnergy: 3,
      flowDepth: 3,
      selectedTriggers: [],
      selectedBlockers: [],
      notes: '',
    })
    setShowForm(false)
  }

  const submitSession = () => {
    if (!form.activity.trim()) return
    const session: FlowSession = {
      id: Date.now().toString(),
      date: form.date,
      activity: form.activity.trim(),
      durationMins: form.durationMins,
      preEnergy: form.preEnergy,
      flowDepth: form.flowDepth,
      triggers: form.selectedTriggers,
      blockers: form.selectedBlockers,
      notes: form.notes.trim(),
    }
    const updated = [session, ...sessions]
    saveSessions(updated)
    setSessions(updated)
    toastSuccess('Flow session logged!', `${fmtDuration(form.durationMins)} at ${FLOW_DEPTH_LABELS[form.flowDepth].label} depth`)
    resetForm()
  }

  const removeSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id)
    saveSessions(updated)
    setSessions(updated)
    toastSuccess('Session removed')
  }

  const toggleItem = (key: 'selectedTriggers' | 'selectedBlockers', item: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(item)
        ? f[key].filter((x: string) => x !== item)
        : [...f[key], item],
    }))
  }

  const addTrigger = () => {
    const t = newTrigger.trim()
    if (!t || triggers.includes(t)) return
    const updated = [...triggers, t]
    setTriggers(updated)
    saveList(TRIGGERS_KEY, updated)
    setNewTrigger('')
    toastSuccess('Trigger added')
  }

  const removeTrigger = (t: string) => {
    const updated = triggers.filter(x => x !== t)
    setTriggers(updated)
    saveList(TRIGGERS_KEY, updated)
  }

  const addBlocker = () => {
    const b = newBlocker.trim()
    if (!b || blockers.includes(b)) return
    const updated = [...blockers, b]
    setBlockers(updated)
    saveList(BLOCKERS_KEY, updated)
    setNewBlocker('')
    toastSuccess('Blocker added')
  }

  const removeBlocker = (b: string) => {
    const updated = blockers.filter(x => x !== b)
    setBlockers(updated)
    saveList(BLOCKERS_KEY, updated)
  }

  const depthConf = FLOW_DEPTH_LABELS[form.flowDepth]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-white flex items-center gap-3"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Zap className="w-8 h-8 text-yellow-400" />
            Flow State
          </h1>
          <p className="text-slate-400 mt-1">Track and optimize your deep focus sessions</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgDepth > 0 ? avgDepth.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {fmtDuration(totalMins)}
          </div>
          <div className="text-xs text-slate-500">Total Flow</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {sessionsThisWeek}
          </div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {bestDeepStreak}d
          </div>
          <div className="text-xs text-slate-500">Deep Streak</div>
        </div>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="game-card p-5 space-y-5 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> Log Flow Session
            </h3>
            <button onClick={resetForm} className="text-slate-500 hover:text-slate-300 transition-colors text-sm">✕</button>
          </div>

          {/* Date + activity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                max={today()}
                className="game-input w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={form.durationMins}
                onChange={e => setForm(f => ({ ...f, durationMins: Math.max(1, parseInt(e.target.value) || 1) }))}
                min={1}
                className="game-input w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Activity</label>
            <input
              type="text"
              value={form.activity}
              onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
              placeholder="e.g. Deep work on project, Writing, Coding..."
              className="game-input w-full text-sm"
            />
          </div>

          {/* Energy + depth */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Pre-session Energy</label>
                <span className="text-xs font-semibold text-yellow-400">{form.preEnergy}/5 — {ENERGY_LABELS[form.preEnergy]}</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, preEnergy: n }))}
                    className={`flex-1 h-7 rounded-md text-xs font-bold transition-all ${
                      n <= form.preEnergy
                        ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                        : 'bg-slate-700 text-slate-600 border border-transparent'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Flow Depth</label>
                <span className="text-xs font-semibold" style={{ color: depthConf.color }}>
                  {form.flowDepth}/5 — {depthConf.label}
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, flowDepth: n }))}
                    className="flex-1 h-7 rounded-md text-xs font-bold transition-all border"
                    style={n <= form.flowDepth
                      ? { background: FLOW_DEPTH_LABELS[form.flowDepth].bg, color: FLOW_DEPTH_LABELS[form.flowDepth].color, borderColor: FLOW_DEPTH_LABELS[form.flowDepth].color + '60' }
                      : { background: '#1e293b', color: '#475569', borderColor: 'transparent' }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Triggers */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">What triggered flow? (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {triggers.map(t => (
                <button
                  key={t}
                  onClick={() => toggleItem('selectedTriggers', t)}
                  className="px-2.5 py-1 rounded-lg text-xs transition-all border"
                  style={form.selectedTriggers.includes(t)
                    ? { background: '#22c55e20', color: '#22c55e', borderColor: '#22c55e50' }
                    : { background: '#1e293b', color: '#94a3b8', borderColor: 'transparent' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Blockers */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">What broke flow? (if anything)</label>
            <div className="flex flex-wrap gap-2">
              {blockers.map(b => (
                <button
                  key={b}
                  onClick={() => toggleItem('selectedBlockers', b)}
                  className="px-2.5 py-1 rounded-lg text-xs transition-all border"
                  style={form.selectedBlockers.includes(b)
                    ? { background: '#ef444420', color: '#ef4444', borderColor: '#ef444450' }
                    : { background: '#1e293b', color: '#94a3b8', borderColor: 'transparent' }
                  }
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Observations, breakthroughs, what to do differently..."
              className="game-input w-full text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitSession}
              disabled={!form.activity.trim()}
              className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-900 rounded-xl text-sm font-bold transition-colors"
            >
              Log Session
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Charts row */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {/* Last 7 sessions bar chart */}
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              Last {Math.min(7, sessions.length)} Sessions
            </h3>
            <div className="flex items-end gap-1.5 h-20">
              {last7Sessions.map((s, i) => {
                const conf = FLOW_DEPTH_LABELS[s.flowDepth]
                const heightPct = (s.flowDepth / 5) * 100
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full group relative">
                    <div
                      className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10"
                    >
                      {s.activity.slice(0, 20)} — {conf.label}
                    </div>
                    <div
                      className="w-full rounded-t-sm transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        background: conf.color + '99',
                        minHeight: '4px',
                      }}
                    />
                    <span className="text-[9px] text-slate-600">{i + 1}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>Oldest</span><span>Latest</span>
            </div>
          </div>

          {/* Weekly pattern */}
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Weekly Pattern
            </h3>
            <div className="flex items-end gap-1.5 h-20">
              {weeklyPattern.map(d => {
                const heightPct = d.avg > 0 ? (d.avg / 5) * 100 : 0
                const isToday = new Date().getDay() === d.day
                const isBest = d.day === bestDay.day && bestDay.avg > 0
                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full"
                  >
                    <div
                      className="w-full rounded-t-sm transition-all duration-500"
                      style={{
                        height: heightPct > 0 ? `${heightPct}%` : '3px',
                        background: isBest ? '#f59e0b' : isToday ? '#8b5cf6' : '#3b82f6',
                        opacity: d.avg > 0 ? 1 : 0.2,
                        minHeight: '3px',
                      }}
                    />
                    <span className={`text-[9px] ${isToday ? 'text-violet-400' : 'text-slate-600'}`}>
                      {DAY_NAMES[d.day].slice(0, 1)}
                    </span>
                  </div>
                )
              })}
            </div>
            {bestDay.avg > 0 && (
              <div className="mt-2 text-[10px] text-yellow-400 text-center">
                Best: {DAY_NAMES[bestDay.day]} (avg {bestDay.avg.toFixed(1)})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['history', 'triggers', 'blockers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="mb-2">No flow sessions yet.</p>
              <p className="text-xs text-slate-600">Log your first session to start optimizing your flow.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-xl text-sm font-bold transition-colors"
              >
                Log First Session
              </button>
            </div>
          ) : (
            sorted.map(s => {
              const conf = FLOW_DEPTH_LABELS[s.flowDepth]
              return (
                <div
                  key={s.id}
                  className="game-card p-4"
                  style={{ borderLeft: `3px solid ${conf.color}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-slate-200 truncate">{s.activity}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                          style={{ color: conf.color, background: conf.bg, borderColor: conf.color + '40' }}
                        >
                          {conf.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fmtDuration(s.durationMins)}
                        </span>
                        <span>{relativeDate(s.date)}</span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-500" /> Energy {s.preEnergy}/5
                        </span>
                      </div>

                      {(s.triggers.length > 0 || s.blockers.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.triggers.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-500/20">
                              ✓ {t}
                            </span>
                          ))}
                          {s.blockers.map(b => (
                            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/20">
                              ✗ {b}
                            </span>
                          ))}
                        </div>
                      )}

                      {s.notes && (
                        <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">{s.notes}</p>
                      )}
                    </div>

                    <button
                      onClick={() => removeSession(s.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Triggers tab */}
      {activeTab === 'triggers' && (
        <div className="game-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-slate-200">Flow Triggers</h3>
            <span className="text-xs text-slate-600">— conditions that reliably induce your flow</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTrigger}
              onChange={e => setNewTrigger(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTrigger()}
              placeholder="Add a new trigger..."
              className="game-input flex-1 text-sm"
            />
            <button
              onClick={addTrigger}
              disabled={!newTrigger.trim()}
              className="px-3 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {triggers.map(t => (
              <div
                key={t}
                className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600"
              >
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {t}
                </span>
                <button
                  onClick={() => removeTrigger(t)}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {triggers.length === 0 && (
            <p className="text-sm text-slate-600 text-center py-4">No triggers added yet.</p>
          )}
        </div>
      )}

      {/* Blockers tab */}
      {activeTab === 'blockers' && (
        <div className="game-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-slate-200">Flow Blockers</h3>
            <span className="text-xs text-slate-600">— things that kill your flow</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newBlocker}
              onChange={e => setNewBlocker(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addBlocker()}
              placeholder="Add a new blocker..."
              className="game-input flex-1 text-sm"
            />
            <button
              onClick={addBlocker}
              disabled={!newBlocker.trim()}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {blockers.map(b => (
              <div
                key={b}
                className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600"
              >
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {b}
                </span>
                <button
                  onClick={() => removeBlocker(b)}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {blockers.length === 0 && (
            <p className="text-sm text-slate-600 text-center py-4">No blockers added yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
