import { useState, useMemo, KeyboardEvent } from 'react'
import { Brain, Clock, Plus, Trash2, Save, TrendingUp, Zap, BarChart3, Target, Activity, RefreshCw, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'concentration_tracker'

interface ConcentrationSession {
  id: string
  date: string
  startTime: string
  duration: number
  task: string
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  method: 'pomodoro' | 'deep-work' | 'flow' | 'timeboxing' | 'free'
  distractions: string[]
  environment: 'home' | 'office' | 'cafe' | 'library' | 'outdoors' | 'other'
  notes: string
}

const METHODS: { key: ConcentrationSession['method']; label: string }[] = [
  { key: 'pomodoro', label: 'Pomodoro' },
  { key: 'deep-work', label: 'Deep Work' },
  { key: 'flow', label: 'Flow' },
  { key: 'timeboxing', label: 'Timeboxing' },
  { key: 'free', label: 'Free' },
]

const ENVIRONMENTS: { key: ConcentrationSession['environment']; label: string; emoji: string }[] = [
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'office', label: 'Office', emoji: '🏢' },
  { key: 'cafe', label: 'Café', emoji: '☕' },
  { key: 'library', label: 'Library', emoji: '📚' },
  { key: 'outdoors', label: 'Outdoors', emoji: '🌳' },
  { key: 'other', label: 'Other', emoji: '🔲' },
]

const LEVEL_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#eab308', 5: '#84cc16',
  6: '#22c55e', 7: '#10b981', 8: '#14b8a6', 9: '#06b6d4', 10: '#8b5cf6',
}

function levelBg(level: number): string {
  if (level >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40'
  if (level >= 5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border-red-500/40'
}

function loadSessions(): ConcentrationSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ConcentrationSession[]
  } catch { /* ignore */ }
  return []
}

function saveSessions(sessions: ConcentrationSession[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)) } catch { /* ignore */ }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function nowTimeStr(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

const DEFAULT_FORM = {
  task: '',
  startTime: nowTimeStr(),
  duration: 25,
  level: 7 as ConcentrationSession['level'],
  method: 'pomodoro' as ConcentrationSession['method'],
  distractions: [] as string[],
  distractionInput: '',
  environment: 'home' as ConcentrationSession['environment'],
  notes: '',
}

export default function ConcentrationTracker() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<ConcentrationSession[]>(loadSessions)
  const [form, setForm] = useState({ ...DEFAULT_FORM, startTime: nowTimeStr() })

  const today = todayStr()
  const last7 = getLast7Days()

  // Today's sessions
  const todaySessions = useMemo(() =>
    sessions.filter(s => s.date === today).sort((a, b) => b.startTime.localeCompare(a.startTime)),
    [sessions, today]
  )
  const todayTotalMins = todaySessions.reduce((s, sess) => s + sess.duration, 0)

  // 7-day line chart
  const weekAvgs = last7.map(day => {
    const daySessions = sessions.filter(s => s.date === day)
    return { day, avgLevel: daySessions.length > 0 ? avg(daySessions.map(s => s.level)) : null }
  })

  // Stats (all time / last 30 days)
  const last30 = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutStr = cutoff.toISOString().slice(0, 10)
    return sessions.filter(s => s.date >= cutStr)
  }, [sessions])

  const totalFocusMins = sessions.reduce((s, sess) => s + sess.duration, 0)
  const avgLevel30 = avg(last30.map(s => s.level))

  // Top distractors
  const distractorCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of sessions) {
      for (const d of s.distractions) {
        const key = d.toLowerCase().trim()
        if (key) counts[key] = (counts[key] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [sessions])

  // Best focus times (hour heatmap)
  const hourAvgs = useMemo(() => {
    const hourBuckets: Record<number, number[]> = {}
    for (const s of sessions) {
      const hour = parseInt(s.startTime.split(':')[0], 10)
      if (!isNaN(hour)) {
        if (!hourBuckets[hour]) hourBuckets[hour] = []
        hourBuckets[hour].push(s.level)
      }
    }
    return Array.from({ length: 24 }, (_, i) => {
      const levels = hourBuckets[i]
      return levels && levels.length > 0 ? avg(levels) : null
    })
  }, [sessions])

  function addDistraction() {
    const val = form.distractionInput.trim()
    if (!val) return
    setForm(f => ({ ...f, distractions: [...f.distractions, val], distractionInput: '' }))
  }

  function handleDistractionKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addDistraction() }
  }

  function removeDistraction(idx: number) {
    setForm(f => ({ ...f, distractions: f.distractions.filter((_, i) => i !== idx) }))
  }

  function handleSave() {
    if (!form.task.trim() || !form.startTime) return
    const session: ConcentrationSession = {
      id: Date.now().toString(),
      date: today,
      startTime: form.startTime,
      duration: form.duration,
      task: form.task.trim(),
      level: form.level,
      method: form.method,
      distractions: form.distractions,
      environment: form.environment,
      notes: form.notes,
    }
    const updated = [session, ...sessions]
    setSessions(updated)
    saveSessions(updated)
    toastSuccess("Session logged! 🎯")
    setForm({ ...DEFAULT_FORM, startTime: nowTimeStr() })
  }

  // Line chart helpers
  const chartW = 400
  const chartH = 80
  const padL = 20
  const padR = 10
  const padT = 8
  const padB = 20
  const innerW = chartW - padL - padR
  const innerH = chartH - padT - padB
  const toX = (i: number) => padL + (i / (last7.length - 1)) * innerW
  const toY = (v: number) => padT + innerH - ((v - 1) / 9) * innerH

  const linePoints = weekAvgs
    .map((d, i) => d.avgLevel !== null ? { x: toX(i), y: toY(d.avgLevel), day: d.day, v: d.avgLevel } : null)
    .filter((p): p is { x: number; y: number; day: string; v: number } => p !== null)

  const linePath = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-violet-400" />
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Concentration Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log focus sessions — track what affects your concentration</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {fmtMins(totalFocusMins)}
          </div>
          <div className="text-xs text-slate-500">Total Focus</div>
          <div className="text-xs text-slate-600">(all time)</div>
        </div>
        <div className="game-card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgLevel30 > 0 ? avgLevel30.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Level</div>
          <div className="text-xs text-slate-600">(30 days)</div>
        </div>
        <div className="game-card p-4 text-center">
          <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {sessions.length}
          </div>
          <div className="text-xs text-slate-500">Total Sessions</div>
        </div>
      </div>

      {/* Log Session form */}
      <div className="game-card p-5 space-y-5 border border-violet-500/20">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-slate-200">Log Session</h3>
        </div>

        {/* Task */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Task Description</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="What were you working on?"
            value={form.task}
            onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
          />
        </div>

        {/* Start time + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Time</label>
            <input
              type="time"
              className="game-input w-full"
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Duration (minutes)</label>
            <input
              type="number"
              className="game-input w-full"
              min={1}
              max={480}
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))}
            />
          </div>
        </div>

        {/* Concentration level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400">Concentration Level</label>
            <span className="text-sm font-bold" style={{ color: LEVEL_COLORS[form.level] }}>{form.level}/10</span>
          </div>
          <div className="flex gap-1.5">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(l => (
              <button
                key={l}
                onClick={() => setForm(f => ({ ...f, level: l }))}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  backgroundColor: form.level === l ? LEVEL_COLORS[l] : '#1e293b',
                  color: form.level === l ? '#0f172a' : '#64748b',
                  border: `1px solid ${form.level >= l ? LEVEL_COLORS[l] + '60' : '#334155'}`,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Method</label>
          <div className="flex gap-1.5 flex-wrap">
            {METHODS.map(m => (
              <button
                key={m.key}
                onClick={() => setForm(f => ({ ...f, method: m.key }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  form.method === m.key
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Environment */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Environment</label>
          <div className="flex gap-2 flex-wrap">
            {ENVIRONMENTS.map(env => (
              <button
                key={env.key}
                onClick={() => setForm(f => ({ ...f, environment: env.key }))}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  form.environment === env.key
                    ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {env.emoji} {env.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distractions */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Distractions</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="game-input flex-1"
              placeholder="Type a distraction and press Enter…"
              value={form.distractionInput}
              onChange={e => setForm(f => ({ ...f, distractionInput: e.target.value }))}
              onKeyDown={handleDistractionKey}
            />
            <button
              onClick={addDistraction}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-300" />
            </button>
          </div>
          {form.distractions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.distractions.map((d, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300"
                >
                  {d}
                  <button onClick={() => removeDistraction(i)} className="text-red-500 hover:text-red-300 transition-colors">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <textarea
            className="game-input w-full resize-none"
            rows={2}
            placeholder="Anything else about this session…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!form.task.trim()}
          className="w-full py-2.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Session
        </button>
      </div>

      {/* Today's sessions */}
      {todaySessions.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-slate-200">Today's Sessions</h3>
            <span className="ml-auto text-sm font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {fmtMins(todayTotalMins)} total
            </span>
          </div>
          <div className="space-y-2">
            {todaySessions.map(s => {
              const env = ENVIRONMENTS.find(e => e.key === s.environment)
              const meth = METHODS.find(m => m.key === s.method)
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 text-sm truncate">{s.task}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{s.startTime}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{fmtMins(s.duration)}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-400">{env?.emoji} {meth?.label}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${levelBg(s.level)}`}>
                    {s.level}/10
                  </span>
                  <button
                    className="text-slate-600 hover:text-red-400 transition-colors"
                    onClick={() => {
                      const updated = sessions.filter(sess => sess.id !== s.id)
                      setSessions(updated)
                      saveSessions(updated)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 7-day concentration trend — SVG line chart */}
      {sessions.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-slate-200">7-Day Concentration Trend</h3>
          </div>
          <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
            {/* Y-axis guides */}
            {[1, 5, 10].map(v => {
              const y = toY(v)
              return (
                <g key={v}>
                  <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#334155" strokeWidth={1} strokeDasharray="3,4" />
                  <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={8} fill="#64748b">{v}</text>
                </g>
              )
            })}
            {/* Line */}
            {linePath && (
              <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {/* Dots */}
            {linePoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill="#8b5cf6" stroke="#0f172a" strokeWidth={2} />
            ))}
            {/* X-axis labels */}
            {weekAvgs.map((d, i) => {
              const x = toX(i)
              const label = new Date(d.day + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })
              const isToday = d.day === today
              return (
                <text key={i} x={x} y={chartH - 4} textAnchor="middle" fontSize={9} fill={isToday ? '#818cf8' : '#64748b'} fontWeight={isToday ? 'bold' : 'normal'}>
                  {label}
                </text>
              )
            })}
          </svg>
        </div>
      )}

      {/* Best focus times — 24-cell heatmap strip */}
      {sessions.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">Best Focus Times</h3>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {hourAvgs.map((avgLvl, hour) => {
              const color = avgLvl !== null ? LEVEL_COLORS[Math.round(avgLvl)] : undefined
              const opacity = avgLvl !== null ? 0.7 : 0.15
              return (
                <div
                  key={hour}
                  className="rounded flex flex-col items-center gap-0.5"
                  title={avgLvl !== null ? `${hour}:00 — avg level ${avgLvl.toFixed(1)}` : `${hour}:00 — no data`}
                >
                  <div
                    className="w-full rounded"
                    style={{
                      height: 28,
                      backgroundColor: color ?? '#1e293b',
                      opacity,
                    }}
                  />
                  <span className="text-[9px] text-slate-600">{hour % 3 === 0 ? `${hour}h` : ''}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-red-500/70" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-yellow-400/70" /> Mid</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-violet-500/70" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-slate-700/60" /> No data</span>
          </div>
        </div>
      )}

      {/* Top distractors */}
      {distractorCounts.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-slate-200">Top Distractors</h3>
          </div>
          <div className="space-y-2">
            {distractorCounts.map(([distractor, count], i) => (
              <div key={distractor} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-5 text-right">#{i + 1}</span>
                <span className="flex-1 text-sm text-slate-300 capitalize">{distractor}</span>
                <span className="px-2 py-0.5 bg-red-900/30 border border-red-500/40 rounded-full text-xs font-bold text-red-300">
                  {count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sessions logged yet</p>
          <p className="text-xs mt-1">Use the form above to start tracking your concentration</p>
        </div>
      )}

      {/* Tips */}
      <div className="game-card p-4 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Focus Tips</h4>
        </div>
        <div className="space-y-1 text-xs text-slate-500">
          {[
            'Block distracting websites during sessions',
            'Use the Pomodoro method: 25m work, 5m break',
            'Your peak focus hours are shown in the heatmap above',
            'Note what distracts you — patterns reveal fixes',
            'A clear task definition boosts focus depth by 30%',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-violet-500 flex-shrink-0">→</span>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
