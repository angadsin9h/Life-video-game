import { useState, useEffect } from 'react'
import { Zap, Clock, TrendingUp, Play, BarChart3, CheckCircle2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FlowTrigger =
  | 'Deep Work'
  | 'Creative Writing'
  | 'Exercise'
  | 'Music'
  | 'Coding'
  | 'Design'
  | 'Reading'
  | 'Teaching'
  | 'Conversation'
  | 'Sport'
  | 'Meditation'
  | 'Building'

type TimeOfDay =
  | 'Early Morning 5-8am'
  | 'Morning 8-11am'
  | 'Midday 11-2pm'
  | 'Afternoon 2-5pm'
  | 'Evening 5-8pm'
  | 'Night 8pm+'

const TRIGGERS: FlowTrigger[] = [
  'Deep Work', 'Creative Writing', 'Exercise', 'Music', 'Coding', 'Design',
  'Reading', 'Teaching', 'Conversation', 'Sport', 'Meditation', 'Building',
]

const TIMES_OF_DAY: TimeOfDay[] = [
  'Early Morning 5-8am',
  'Morning 8-11am',
  'Midday 11-2pm',
  'Afternoon 2-5pm',
  'Evening 5-8pm',
  'Night 8pm+',
]

const CONDITIONS = [
  'Phone away',
  'No notifications',
  'Music/silence',
  'Well-rested',
  'Low stress',
  'Fed',
  'Hydrated',
  'Clear goal',
  'Warm-up ritual',
  'Right environment',
]

const TRIGGER_EMOJIS: Record<FlowTrigger, string> = {
  'Deep Work': '🧠',
  'Creative Writing': '✍️',
  'Exercise': '🏃',
  'Music': '🎵',
  'Coding': '💻',
  'Design': '🎨',
  'Reading': '📚',
  'Teaching': '👨‍🏫',
  'Conversation': '💬',
  'Sport': '⚽',
  'Meditation': '🧘',
  'Building': '🔨',
}

interface FlowEntry {
  id: string
  trigger: FlowTrigger
  activity: string
  flowDepth: number
  duration: number
  timeOfDay: TimeOfDay
  conditions: string[]
  whatBrokeFlow: string
  peakMoment: string
  flowScore: number
  createdAt: string
  date: string
}

const STORAGE_KEY = 'flow_state_tracker_log'

const EMPTY_FORM = {
  trigger: 'Deep Work' as FlowTrigger,
  activity: '',
  flowDepth: 7,
  duration: 60,
  timeOfDay: 'Morning 8-11am' as TimeOfDay,
  conditions: [] as string[],
  whatBrokeFlow: '',
  peakMoment: '',
  date: new Date().toISOString().split('T')[0],
}

export default function FlowStateTracker() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FlowEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setEntries(JSON.parse(stored))
    } catch { /**/ }
  }, [])

  const persist = (updated: FlowEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const toggleCondition = (cond: string) => {
    setForm(f => ({
      ...f,
      conditions: f.conditions.includes(cond)
        ? f.conditions.filter(c => c !== cond)
        : [...f.conditions, cond],
    }))
  }

  const flowScore = form.flowDepth * 10

  const submit = () => {
    if (!form.activity.trim()) return
    const entry: FlowEntry = {
      id: Date.now().toString(),
      ...form,
      flowScore: form.flowDepth * 10,
      createdAt: new Date().toISOString(),
    }
    persist([entry, ...entries])
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    toastSuccess('Flow session logged', `Flow Score: ${entry.flowScore}`)
  }

  // Flow Recipe analytics
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })

  const flowFrequencyCount = entries.filter(e => last7Days.includes(e.date)).length
  const flowFrequency = Math.round((flowFrequencyCount / 7) * 100)

  const totalFlowTime = entries.reduce((sum, e) => sum + (e.duration || 0), 0)

  // Top 3 triggers
  const triggerCounts: Partial<Record<FlowTrigger, number>> = {}
  entries.forEach(e => {
    triggerCounts[e.trigger] = (triggerCounts[e.trigger] ?? 0) + 1
  })
  const topTriggers = (Object.entries(triggerCounts) as [FlowTrigger, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t)

  // Top conditions
  const conditionCounts: Record<string, number> = {}
  entries.forEach(e => {
    e.conditions.forEach(c => {
      conditionCounts[c] = (conditionCounts[c] ?? 0) + 1
    })
  })
  const topConditions = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c)

  // Best time of day
  const timeCounts: Partial<Record<TimeOfDay, number>> = {}
  entries.forEach(e => {
    timeCounts[e.timeOfDay] = (timeCounts[e.timeOfDay] ?? 0) + 1
  })
  const bestTime = (Object.entries(timeCounts) as [TimeOfDay, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const last7Entries = entries.slice(0, 7)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-violet-400" />
            Flow State Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track what puts you in flow.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
        >
          <Play className="w-4 h-4" /> Log Flow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {flowFrequency}%
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Flow Freq.</div>
          <div className="text-xs text-slate-600">last 7 days</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {entries.length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Sessions</div>
          <div className="text-xs text-slate-600">total logged</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalFlowTime >= 60 ? `${Math.round(totalFlowTime / 60)}h` : `${totalFlowTime}m`}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Flow Time</div>
          <div className="text-xs text-slate-600">total</div>
        </div>
      </div>

      {/* Flow Recipe */}
      {entries.length >= 2 && (
        <div className="game-card p-4 border border-violet-500/20">
          <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4" />
            Your Flow Recipe
          </h3>
          <div className="space-y-2.5">
            {topTriggers.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Top Triggers</div>
                <div className="flex flex-wrap gap-1.5">
                  {topTriggers.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 bg-violet-900/40 text-violet-300 rounded-full border border-violet-500/20">
                      {TRIGGER_EMOJIS[t]} {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {topConditions.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Best Conditions</div>
                <div className="flex flex-wrap gap-1.5">
                  {topConditions.map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 bg-green-900/40 text-green-300 rounded-full border border-green-500/20">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {bestTime && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Best Time of Day</div>
                <span className="text-xs px-2 py-0.5 bg-amber-900/40 text-amber-300 rounded-full border border-amber-500/20">
                  ⏰ {bestTime}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Flow Session</h3>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Trigger category</label>
            <select
              value={form.trigger}
              onChange={e => setForm(f => ({ ...f, trigger: e.target.value as FlowTrigger }))}
              className="game-input w-full text-sm"
            >
              {TRIGGERS.map(t => (
                <option key={t} value={t}>{TRIGGER_EMOJIS[t]} {t}</option>
              ))}
            </select>
          </div>

          <input
            value={form.activity}
            onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="What exactly were you doing?"
            className="game-input w-full text-sm"
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">
              Flow Depth: <span className="text-violet-400 font-bold">{form.flowDepth}/10</span>
              {' '}— Score: <span className="text-yellow-400 font-bold">{flowScore}</span>
            </p>
            <input
              type="range" min={1} max={10} value={form.flowDepth}
              onChange={e => setForm(f => ({ ...f, flowDepth: Number(e.target.value) }))}
              className="w-full h-1.5 accent-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (minutes)</label>
              <input
                type="number"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))}
                className="game-input w-full text-sm"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Time of day</label>
              <select
                value={form.timeOfDay}
                onChange={e => setForm(f => ({ ...f, timeOfDay: e.target.value as TimeOfDay }))}
                className="game-input w-full text-sm"
              >
                {TIMES_OF_DAY.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Conditions (select all that applied)</label>
            <div className="flex flex-wrap gap-1.5">
              {CONDITIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                    form.conditions.includes(c)
                      ? 'bg-green-900/40 text-green-300 border-green-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {form.conditions.includes(c) && '✓ '}{c}
                </button>
              ))}
            </div>
          </div>

          <input
            value={form.whatBrokeFlow}
            onChange={e => setForm(f => ({ ...f, whatBrokeFlow: e.target.value }))}
            placeholder="What broke your flow? (optional)"
            className="game-input w-full text-sm"
          />

          <input
            value={form.peakMoment}
            onChange={e => setForm(f => ({ ...f, peakMoment: e.target.value }))}
            placeholder="The best moment in this session..."
            className="game-input w-full text-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!form.activity.trim()}
              className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
            >
              Save
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

      {/* Last 7 Flow Sessions */}
      {last7Entries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Recent Flow Sessions
          </h3>
          <div className="space-y-2.5">
            {last7Entries.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                <div className="text-2xl flex-shrink-0">{TRIGGER_EMOJIS[entry.trigger]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate">{entry.activity}</span>
                    <span className="text-sm font-bold text-yellow-400 flex-shrink-0" style={{ fontFamily: 'Orbitron, monospace' }}>
                      {entry.flowScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">{entry.trigger}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{entry.duration}m
                    </span>
                    <span className="text-xs text-slate-500">{entry.timeOfDay.split(' ')[0]}</span>
                  </div>
                  {entry.peakMoment && (
                    <p className="text-xs text-violet-300 mt-1 italic">"{entry.peakMoment}"</p>
                  )}
                  {entry.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.conditions.slice(0, 3).map(c => (
                        <span key={c} className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">
                          {c}
                        </span>
                      ))}
                      {entry.conditions.length > 3 && (
                        <span className="text-xs text-slate-600">+{entry.conditions.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm mb-4">Flow is the state where time disappears. Start tracking yours.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
          >
            <Play className="w-4 h-4 inline mr-1.5" />
            Log First Flow Session
          </button>
        </div>
      )}
    </div>
  )
}
