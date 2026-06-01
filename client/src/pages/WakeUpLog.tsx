import { useState, useEffect, useCallback } from 'react'
import { Sun, ChevronDown, ChevronUp, TrendingUp, Zap, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'wake_up_log'

interface WakeUpEntry {
  id: string
  date: string
  wakeTime: string
  alarmType: 'natural' | 'alarm' | 'snooze' | 'body-clock' | 'disturbance'
  snoozeCount: number
  firstFeeling: 1 | 2 | 3 | 4 | 5
  firstThought: string
  bodyFeeling: 'refreshed' | 'groggy' | 'stiff' | 'energized' | 'heavy' | 'neutral'
  immediateAction: string
  phoneChecked: boolean
  intentionalStart: boolean
  morningIntention: string
  gratitude: string
  readiness: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
}

const ALARM_TYPES: { value: WakeUpEntry['alarmType']; label: string; emoji: string }[] = [
  { value: 'natural', label: 'Natural', emoji: '🌅' },
  { value: 'alarm', label: 'Alarm', emoji: '⏰' },
  { value: 'snooze', label: 'Snoozed', emoji: '😴' },
  { value: 'body-clock', label: 'Body Clock', emoji: '🧬' },
  { value: 'disturbance', label: 'Disturbance', emoji: '🔊' },
]

const BODY_FEELINGS: { value: WakeUpEntry['bodyFeeling']; label: string; emoji: string }[] = [
  { value: 'refreshed', label: 'Refreshed', emoji: '🌿' },
  { value: 'groggy', label: 'Groggy', emoji: '😵' },
  { value: 'stiff', label: 'Stiff', emoji: '🪨' },
  { value: 'energized', label: 'Energized', emoji: '⚡' },
  { value: 'heavy', label: 'Heavy', emoji: '🌫' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
]

const FEELING_EMOJIS = ['', '😴', '😕', '😐', '🙂', '⚡']

const READINESS_COLORS = [
  '', 'bg-red-600', 'bg-red-500', 'bg-orange-500', 'bg-orange-400',
  'bg-yellow-500', 'bg-yellow-400', 'bg-lime-500', 'bg-green-500', 'bg-green-400', 'bg-cyan-400',
]

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadEntries(): WakeUpEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as WakeUpEntry[]
  } catch {
    return []
  }
}

function calcStreak(entries: WakeUpEntry[]): number {
  let streak = 0
  const d = new Date()
  while (true) {
    const ds = d.toISOString().slice(0, 10)
    if (entries.find(e => e.date === ds)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function getLast7Days(): string[] {
  const days: string[] = []
  const d = new Date()
  for (let i = 6; i >= 0; i--) {
    const dd = new Date(d)
    dd.setDate(dd.getDate() - i)
    days.push(dd.toISOString().slice(0, 10))
  }
  return days
}

function getLast30Entries(entries: WakeUpEntry[]): WakeUpEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return entries.filter(e => e.date >= cutoffStr)
}

function defaultEntry(): WakeUpEntry {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return {
    id: '',
    date: todayStr(),
    wakeTime: `${hh}:${mm}`,
    alarmType: 'alarm',
    snoozeCount: 0,
    firstFeeling: 3,
    firstThought: '',
    bodyFeeling: 'neutral',
    immediateAction: '',
    phoneChecked: false,
    intentionalStart: false,
    morningIntention: '',
    gratitude: '',
    readiness: 5,
  }
}

export default function WakeUpLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WakeUpEntry[]>(loadEntries)
  const [form, setForm] = useState<WakeUpEntry>(() => {
    const existing = loadEntries().find(e => e.date === todayStr())
    return existing ?? defaultEntry()
  })
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  const streak = calcStreak(entries)
  const last7 = getLast7Days()
  const last30 = getLast30Entries(entries)
  const last14 = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)

  useEffect(() => {
    const existing = entries.find(e => e.date === todayStr())
    if (existing) setForm(existing)
  }, [])

  const saveEntries = useCallback((updated: WakeUpEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [])

  function saveForm() {
    const entry: WakeUpEntry = { ...form, id: form.id || Date.now().toString(), date: todayStr() }
    const filtered = entries.filter(e => e.date !== todayStr())
    saveEntries([...filtered, entry])
    toastSuccess('Morning logged! ☀️')
  }

  function setField<K extends keyof WakeUpEntry>(key: K, value: WakeUpEntry[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Stats
  const avgReadiness30 = last30.length > 0
    ? (last30.reduce((s, e) => s + e.readiness, 0) / last30.length).toFixed(1)
    : '—'
  const avgFirstFeeling30 = last30.length > 0
    ? (last30.reduce((s, e) => s + e.firstFeeling, 0) / last30.length).toFixed(1)
    : '—'
  const snoozeRate = last30.length > 0
    ? Math.round((last30.filter(e => e.alarmType === 'snooze').length / last30.length) * 100)
    : 0
  const phoneRate = last30.length > 0
    ? Math.round((last30.filter(e => e.phoneChecked).length / last30.length) * 100)
    : 0
  const intentionalRate = last30.length > 0
    ? Math.round((last30.filter(e => e.intentionalStart).length / last30.length) * 100)
    : 0
  const digitalMorningScore = 100 - phoneRate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Wake Up Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your morning wake-up quality and daily intentions</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-400">☀️ {streak}d</div>
          <div className="text-xs text-slate-500">streak</div>
        </div>
      </div>

      {/* 7-day readiness SVG chart */}
      <div className="game-card p-4">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" /> 7-Day Readiness
        </h3>
        <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none">
          {last7.map((day, i) => {
            const entry = entries.find(e => e.date === day)
            const readiness = entry?.readiness ?? 0
            const feeling = entry?.firstFeeling ?? 0
            const barH = readiness > 0 ? (readiness / 10) * 60 : 4
            const x = i * 40 + 4
            const barY = 70 - barH

            const feelingFill = feeling === 0 ? '#334155'
              : feeling <= 2 ? '#ef4444'
              : feeling === 3 ? '#eab308'
              : feeling === 4 ? '#22c55e'
              : '#06b6d4'

            return (
              <g key={day}>
                <rect
                  x={x}
                  y={barY}
                  width={30}
                  height={barH}
                  rx={4}
                  fill={readiness > 0 ? feelingFill : '#1e293b'}
                  opacity={readiness > 0 ? 0.8 : 0.5}
                />
                {readiness > 0 && (
                  <text x={x + 15} y={barY - 3} textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {readiness}
                  </text>
                )}
                <text x={x + 15} y={78} textAnchor="middle" fontSize="9" fill={day === todayStr() ? '#fbbf24' : '#475569'}>
                  {new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })}
                </text>
              </g>
            )
          })}
        </svg>
        <div className="flex items-center gap-3 mt-2 justify-end flex-wrap">
          {[1, 2, 3, 4, 5].map(f => (
            <div key={f} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-sm ${f <= 2 ? 'bg-red-500' : f === 3 ? 'bg-yellow-500' : f === 4 ? 'bg-green-500' : 'bg-cyan-500'}`} />
              <span className="text-xs text-slate-500">{FEELING_EMOJIS[f]}</span>
            </div>
          ))}
          <span className="text-xs text-slate-500">= first feeling</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{avgReadiness30}</div>
          <div className="text-xs text-slate-500 mt-1">Avg readiness (30d)</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400">{avgFirstFeeling30}</div>
          <div className="text-xs text-slate-500 mt-1">Avg first feeling (30d)</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className={`text-2xl font-bold ${snoozeRate > 50 ? 'text-red-400' : snoozeRate > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
            {snoozeRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Snooze rate (30d)</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className={`text-2xl font-bold ${intentionalRate > 70 ? 'text-green-400' : intentionalRate > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {intentionalRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Intentional starts (30d)</div>
        </div>
      </div>

      {/* Phone check trend / digital morning score */}
      <div className="game-card p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Digital Morning Score (30d)
        </h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Phone checked within 30min</span>
              <span className={`text-sm font-bold ${phoneRate > 50 ? 'text-red-400' : 'text-green-400'}`}>{phoneRate}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${phoneRate > 50 ? 'bg-red-500/70' : 'bg-green-500/70'}`} style={{ width: `${phoneRate}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
          <div>
            <div className="text-xs text-slate-400">Digital Morning Score</div>
            <div className="text-xs text-slate-500 mt-0.5">Higher = less phone = better</div>
          </div>
          <div className={`text-3xl font-bold ${digitalMorningScore >= 70 ? 'text-green-400' : digitalMorningScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {digitalMorningScore}
          </div>
        </div>
      </div>

      {/* Log this morning form */}
      <div className="game-card p-4 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          Log This Morning
          <span className="text-xs text-slate-500 font-normal ml-auto">{todayStr()}</span>
        </h3>

        {/* Wake time */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Wake time</label>
          <input
            type="time"
            className="game-input w-full"
            value={form.wakeTime}
            onChange={e => setField('wakeTime', e.target.value)}
          />
        </div>

        {/* Alarm type chips */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">How did you wake?</label>
          <div className="flex flex-wrap gap-2">
            {ALARM_TYPES.map(a => (
              <button
                key={a.value}
                onClick={() => setField('alarmType', a.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.alarmType === a.value ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                <span>{a.emoji}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Snooze count — only shown if snooze */}
        {form.alarmType === 'snooze' && (
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Snooze count</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setField('snoozeCount', Math.max(0, form.snoozeCount - 1) as WakeUpEntry['snoozeCount'])}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center"
              >
                −
              </button>
              <span className="text-2xl font-bold text-amber-400 w-8 text-center">{form.snoozeCount}</span>
              <button
                onClick={() => setField('snoozeCount', Math.min(5, form.snoozeCount + 1) as WakeUpEntry['snoozeCount'])}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* First feeling */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">First feeling upon waking</label>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map(n => (
              <button
                key={n}
                onClick={() => setField('firstFeeling', n)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${form.firstFeeling === n ? 'border-amber-500 bg-amber-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
              >
                <span className="text-lg">{FEELING_EMOJIS[n]}</span>
                <span className="text-xs text-slate-500">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body feeling chips */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">How does your body feel?</label>
          <div className="flex flex-wrap gap-2">
            {BODY_FEELINGS.map(b => (
              <button
                key={b.value}
                onClick={() => setField('bodyFeeling', b.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.bodyFeeling === b.value ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                <span>{b.emoji}</span> {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* First thought */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">First thought of the day (optional)</label>
          <textarea
            className="game-input w-full text-sm"
            rows={2}
            placeholder="What's the first thing that came to mind?"
            value={form.firstThought}
            onChange={e => setField('firstThought', e.target.value)}
          />
        </div>

        {/* Immediate action */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">First thing you did</label>
          <input
            className="game-input w-full"
            placeholder="What was the first thing you did?"
            value={form.immediateAction}
            onChange={e => setField('immediateAction', e.target.value)}
          />
        </div>

        {/* Phone / Intentional toggles */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Checked phone within 30min?</label>
            <div className="flex gap-2">
              <button
                onClick={() => setField('phoneChecked', false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${!form.phoneChecked ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                No
              </button>
              <button
                onClick={() => setField('phoneChecked', true)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${form.phoneChecked ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                Yes
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Intentional start?</label>
            <div className="flex gap-2">
              <button
                onClick={() => setField('intentionalStart', false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${!form.intentionalStart ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                No
              </button>
              <button
                onClick={() => setField('intentionalStart', true)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${form.intentionalStart ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                Yes
              </button>
            </div>
          </div>
        </div>

        {/* Morning intention */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Morning intention</label>
          <input
            className="game-input w-full"
            placeholder="What's your intention for today?"
            value={form.morningIntention}
            onChange={e => setField('morningIntention', e.target.value)}
          />
        </div>

        {/* Gratitude */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Gratitude on waking</label>
          <input
            className="game-input w-full"
            placeholder="One thing you're grateful for this morning"
            value={form.gratitude}
            onChange={e => setField('gratitude', e.target.value)}
          />
        </div>

        {/* Day readiness 1-10 */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">
            Day readiness: <span className="text-amber-400 font-bold">{form.readiness}/10</span>
          </label>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(n => (
              <button
                key={n}
                onClick={() => setField('readiness', n)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${form.readiness >= n ? `${READINESS_COLORS[n]} text-white` : 'bg-slate-700 text-slate-600 hover:bg-slate-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveForm}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <Sun className="w-4 h-4" /> Save Morning Log
        </button>
      </div>

      {/* Recent entries */}
      <div className="game-card p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" /> Recent Mornings
        </h3>
        <div className="space-y-2">
          {last14.map(entry => {
            const isExpanded = expandedEntry === entry.id
            const alarmInfo = ALARM_TYPES.find(a => a.value === entry.alarmType)
            const bodyInfo = BODY_FEELINGS.find(b => b.value === entry.bodyFeeling)
            return (
              <div key={entry.id} className="bg-slate-700/50 rounded-xl overflow-hidden">
                {/* Compact row */}
                <button
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-700/80 transition-colors"
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                >
                  <div className="text-sm text-slate-400 w-24 flex-shrink-0">{entry.date}</div>
                  <div className="text-sm text-slate-300 flex-shrink-0">{entry.wakeTime}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-base">{FEELING_EMOJIS[entry.firstFeeling]}</span>
                    {alarmInfo && <span className="text-xs text-slate-500">{alarmInfo.emoji}</span>}
                  </div>
                  {/* Readiness badge */}
                  <div className={`w-8 h-8 rounded-lg ${READINESS_COLORS[entry.readiness]} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {entry.readiness}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-slate-600/50 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Wake type:</span>{' '}
                        <span className="text-slate-300">{alarmInfo?.emoji} {alarmInfo?.label}{entry.alarmType === 'snooze' && entry.snoozeCount > 0 ? ` ×${entry.snoozeCount}` : ''}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Body:</span>{' '}
                        <span className="text-slate-300">{bodyInfo?.emoji} {bodyInfo?.label}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone (30m):</span>{' '}
                        <span className={entry.phoneChecked ? 'text-red-400' : 'text-green-400'}>{entry.phoneChecked ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Intentional:</span>{' '}
                        <span className={entry.intentionalStart ? 'text-green-400' : 'text-slate-400'}>{entry.intentionalStart ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    {entry.morningIntention && (
                      <div className="text-xs">
                        <span className="text-slate-500">Intention:</span>{' '}
                        <span className="text-slate-300">{entry.morningIntention}</span>
                      </div>
                    )}
                    {entry.gratitude && (
                      <div className="text-xs">
                        <span className="text-slate-500">Grateful for:</span>{' '}
                        <span className="text-slate-300">{entry.gratitude}</span>
                      </div>
                    )}
                    {entry.firstThought && (
                      <div className="text-xs">
                        <span className="text-slate-500">First thought:</span>{' '}
                        <span className="text-slate-300 italic">"{entry.firstThought}"</span>
                      </div>
                    )}
                    {entry.immediateAction && (
                      <div className="text-xs">
                        <span className="text-slate-500">First action:</span>{' '}
                        <span className="text-slate-300">{entry.immediateAction}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {entries.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No mornings logged yet. Start your first log above!</p>
          )}
        </div>
      </div>
    </div>
  )
}
