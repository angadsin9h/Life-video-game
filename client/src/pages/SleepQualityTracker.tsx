import { useState, useMemo } from 'react'
import { Moon, Sun, Clock, Plus, Trash2, Save, TrendingUp, Star, Brain, BarChart3, ChevronDown, ChevronUp, Activity, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'sleep_quality_tracker'

interface SleepFactor {
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
}

interface SleepEntry {
  id: string
  date: string
  bedtime: string
  wakeTime: string
  totalHours: number
  quality: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  deepSleep: number
  interruptions: number
  dreamsNoted: boolean
  dreamNote: string
  factors: SleepFactor[]
  notes: string
  energyOnWake: 1 | 2 | 3 | 4 | 5
}

const FACTORS: { key: string; label: string; emoji: string; defaultImpact: 'positive' | 'negative' | 'neutral' }[] = [
  { key: 'caffeine', label: 'Caffeine', emoji: '☕', defaultImpact: 'negative' },
  { key: 'alcohol', label: 'Alcohol', emoji: '🍷', defaultImpact: 'negative' },
  { key: 'late-meal', label: 'Late Meal', emoji: '🍽', defaultImpact: 'negative' },
  { key: 'exercise', label: 'Exercise', emoji: '💪', defaultImpact: 'positive' },
  { key: 'stress', label: 'Stress', emoji: '😰', defaultImpact: 'negative' },
  { key: 'screen-time', label: 'Screen Time', emoji: '📱', defaultImpact: 'negative' },
  { key: 'meditation', label: 'Meditation', emoji: '🧘', defaultImpact: 'positive' },
  { key: 'nap', label: 'Nap', emoji: '😴', defaultImpact: 'neutral' },
  { key: 'cold-room', label: 'Cold Room', emoji: '❄️', defaultImpact: 'positive' },
]

const ENERGY_EMOJIS: Record<number, string> = { 1: '😴', 2: '😐', 3: '🙂', 4: '😊', 5: '⚡' }

function loadEntries(): SleepEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SleepEntry[]
  } catch { /* ignore */ }
  return []
}

function saveEntries(entries: SleepEntry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* ignore */ }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function computeHours(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let bed = bh * 60 + bm
  let wake = wh * 60 + wm
  if (wake <= bed) wake += 24 * 60
  return Math.round(((wake - bed) / 60) * 100) / 100
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

function qualityColor(q: number): string {
  if (q >= 8) return '#22c55e'
  if (q >= 5) return '#eab308'
  return '#ef4444'
}

function qualityBg(q: number): string {
  if (q >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40'
  if (q >= 5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border-red-500/40'
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

function fmtHours(h: number): string {
  if (!h) return '—'
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

const DEFAULT_FORM = {
  bedtime: '23:00',
  wakeTime: '07:00',
  quality: 7 as SleepEntry['quality'],
  deepSleep: 20,
  interruptions: 0,
  dreamsNoted: false,
  dreamNote: '',
  activeFactors: [] as string[],
  notes: '',
  energyOnWake: 3 as SleepEntry['energyOnWake'],
}

export default function SleepQualityTracker() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SleepEntry[]>(loadEntries)
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const today = todayStr()
  const last7 = getLast7Days()

  const totalHoursLive = computeHours(form.bedtime, form.wakeTime)

  // Last 30 entries for stats
  const last30 = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutStr = cutoff.toISOString().slice(0, 10)
    return entries.filter(e => e.date >= cutStr)
  }, [entries])

  const avgQuality = avg(last30.map(e => e.quality))
  const avgHours = avg(last30.map(e => e.totalHours))
  const avgEnergy = avg(last30.map(e => e.energyOnWake))

  // 7-day bar chart data
  const weekData = last7.map(day => {
    const e = entries.find(en => en.date === day)
    return { day, entry: e ?? null }
  })
  const maxBarQ = 10

  // Recent 14 entries
  const recent14 = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)
  }, [entries])

  // Factor analysis
  const factorCounts = useMemo(() => {
    const counts: Record<string, { positive: number; negative: number; neutral: number }> = {}
    for (const e of entries) {
      for (const f of e.factors) {
        if (!counts[f.factor]) counts[f.factor] = { positive: 0, negative: 0, neutral: 0 }
        counts[f.factor][f.impact]++
      }
    }
    return Object.entries(counts)
      .map(([factor, c]) => ({ factor, ...c, total: c.positive + c.negative + c.neutral }))
      .sort((a, b) => b.total - a.total)
  }, [entries])
  const maxFactorTotal = Math.max(...factorCounts.map(f => f.total), 1)

  function toggleFactor(key: string) {
    setForm(f => {
      const active = f.activeFactors.includes(key)
      return {
        ...f,
        activeFactors: active ? f.activeFactors.filter(k => k !== key) : [...f.activeFactors, key],
      }
    })
  }

  function handleSave() {
    if (!form.bedtime || !form.wakeTime) return
    const factors: SleepFactor[] = form.activeFactors.map(key => {
      const def = FACTORS.find(f => f.key === key)
      return { factor: key, impact: def?.defaultImpact ?? 'neutral' }
    })
    const entry: SleepEntry = {
      id: Date.now().toString(),
      date: today,
      bedtime: form.bedtime,
      wakeTime: form.wakeTime,
      totalHours: totalHoursLive,
      quality: form.quality,
      deepSleep: form.deepSleep,
      interruptions: form.interruptions,
      dreamsNoted: form.dreamsNoted,
      dreamNote: form.dreamNote,
      factors,
      notes: form.notes,
      energyOnWake: form.energyOnWake,
    }
    // Overwrite today's entry if exists
    const updated = [entry, ...entries.filter(e => e.date !== today)]
    setEntries(updated)
    saveEntries(updated)
    toastSuccess("Sleep logged! 💤")
    setForm({ ...DEFAULT_FORM })
  }

  const qualityGradient = `hsl(${((form.quality - 1) / 9) * 120}, 70%, 50%)`

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Moon className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Sleep Quality Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track detailed nightly sleep — beyond just hours</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgQuality > 0 ? avgQuality.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Quality / 10</div>
          <div className="text-xs text-slate-600">(30 days)</div>
        </div>
        <div className="game-card p-4 text-center">
          <Clock className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgHours > 0 ? avgHours.toFixed(1) : '—'}h
          </div>
          <div className="text-xs text-slate-500">Avg Hours</div>
          <div className="text-xs text-slate-600">(30 days)</div>
        </div>
        <div className="game-card p-4 text-center">
          <Activity className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgEnergy > 0 ? ENERGY_EMOJIS[Math.round(avgEnergy)] : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Energy</div>
          <div className="text-xs text-slate-600">(30 days)</div>
        </div>
      </div>

      {/* Week at a Glance — SVG bar chart */}
      <div className="game-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-200">Week at a Glance</h3>
        </div>
        <svg width="100%" height="100" viewBox="0 0 420 100" preserveAspectRatio="none">
          {weekData.map((d, i) => {
            const x = i * 60 + 4
            const barMaxH = 70
            const q = d.entry?.quality ?? 0
            const barH = q > 0 ? Math.max(6, (q / maxBarQ) * barMaxH) : 4
            const y = barMaxH - barH + 4
            const color = q > 0 ? qualityColor(q) : '#334155'
            const dayLabel = new Date(d.day + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })
            const isToday = d.day === today
            return (
              <g key={d.day}>
                <rect x={x} y={y} width={50} height={barH} rx={4} fill={color} opacity={q > 0 ? 0.8 : 0.4} />
                {isToday && <rect x={x} y={y} width={50} height={barH} rx={4} fill="none" stroke="#818cf8" strokeWidth={2} />}
                {d.entry && (
                  <text x={x + 25} y={y - 3} textAnchor="middle" fontSize={9} fill={color}>
                    {d.entry.totalHours.toFixed(1)}h
                  </text>
                )}
                <text x={x + 25} y={88} textAnchor="middle" fontSize={10} fill={isToday ? '#818cf8' : '#64748b'} fontWeight={isToday ? 'bold' : 'normal'}>
                  {dayLabel}
                </text>
                {q > 0 && (
                  <text x={x + 25} y={y + barH - 4} textAnchor="middle" fontSize={8} fill="#0f172a" fontWeight="bold">
                    {q}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> &lt;5</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> 5–7</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> 8+</span>
        </div>
      </div>

      {/* Log Tonight's Sleep form */}
      <div className="game-card p-5 space-y-5 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-200">Log Tonight's Sleep</h3>
          <span className="text-xs text-slate-500 ml-auto">{today}</span>
        </div>

        {/* Bedtime + Wake time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Bedtime
            </label>
            <input
              type="time"
              className="game-input w-full"
              value={form.bedtime}
              onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-yellow-400" /> Wake Time
            </label>
            <input
              type="time"
              className="game-input w-full"
              value={form.wakeTime}
              onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))}
            />
          </div>
        </div>

        {/* Duration preview */}
        <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">Total Sleep</span>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: 'Orbitron, monospace', color: totalHoursLive >= 7 ? '#22c55e' : totalHoursLive >= 6 ? '#eab308' : '#ef4444' }}
          >
            {fmtHours(totalHoursLive)}
          </span>
          <span className="text-xs text-slate-500">
            {totalHoursLive >= 8 ? '😄 Optimal' : totalHoursLive >= 7 ? '🙂 Good' : totalHoursLive >= 6 ? '😐 Short' : '😫 Too short'}
          </span>
        </div>

        {/* Quality slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400">Sleep Quality</label>
            <span className="text-sm font-bold" style={{ color: qualityGradient }}>{form.quality}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={form.quality}
            onChange={e => setForm(f => ({ ...f, quality: Number(e.target.value) as SleepEntry['quality'] }))}
            className="w-full"
            style={{ accentColor: qualityGradient }}
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>Terrible</span>
            <span>Perfect</span>
          </div>
        </div>

        {/* Deep sleep % */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400">Deep Sleep % (estimate)</label>
            <span className="text-sm font-bold text-violet-400">{form.deepSleep}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={form.deepSleep}
            onChange={e => setForm(f => ({ ...f, deepSleep: Number(e.target.value) }))}
            className="w-full accent-violet-500"
          />
        </div>

        {/* Interruptions */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Wake-ups / Interruptions</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, interruptions: Math.max(0, f.interruptions - 1) }))}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center text-lg font-bold transition-colors"
            >
              −
            </button>
            <span className="text-xl font-bold text-slate-200 w-8 text-center" style={{ fontFamily: 'Orbitron, monospace' }}>
              {form.interruptions}
            </span>
            <button
              onClick={() => setForm(f => ({ ...f, interruptions: Math.min(10, f.interruptions + 1) }))}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center text-lg font-bold transition-colors"
            >
              +
            </button>
            <span className="text-xs text-slate-500">{form.interruptions === 0 ? 'No interruptions' : form.interruptions === 1 ? 'Once' : `${form.interruptions} times`}</span>
          </div>
        </div>

        {/* Energy on wake */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Energy on Wake</label>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map(e => (
              <button
                key={e}
                onClick={() => setForm(f => ({ ...f, energyOnWake: e }))}
                className={`flex-1 py-2 rounded-xl text-2xl transition-all border ${
                  form.energyOnWake === e
                    ? 'border-indigo-500 bg-indigo-900/40 scale-110'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
                title={`Energy level ${e}`}
              >
                {ENERGY_EMOJIS[e]}
              </button>
            ))}
          </div>
        </div>

        {/* Dreams toggle */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <label className="text-xs text-slate-400">Dreams Noted?</label>
            <button
              onClick={() => setForm(f => ({ ...f, dreamsNoted: !f.dreamsNoted, dreamNote: f.dreamsNoted ? '' : f.dreamNote }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.dreamsNoted ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.dreamsNoted ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          {form.dreamsNoted && (
            <input
              type="text"
              className="game-input w-full"
              placeholder="Describe your dream…"
              value={form.dreamNote}
              onChange={e => setForm(f => ({ ...f, dreamNote: e.target.value }))}
            />
          )}
        </div>

        {/* Factor tags */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Factors (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {FACTORS.map(f => {
              const active = form.activeFactors.includes(f.key)
              const impactColor = f.defaultImpact === 'positive'
                ? 'border-green-500/60 bg-green-900/30 text-green-300'
                : f.defaultImpact === 'negative'
                ? 'border-red-500/60 bg-red-900/30 text-red-300'
                : 'border-slate-500/60 bg-slate-700 text-slate-300'
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFactor(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    active ? impactColor : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {f.emoji} {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <textarea
            className="game-input w-full resize-none"
            rows={2}
            placeholder="Anything else about your sleep…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Sleep Entry
        </button>
      </div>

      {/* Recent entries */}
      {recent14.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">Recent Entries</h3>
            <span className="text-xs text-slate-500 ml-auto">Last 14 nights</span>
          </div>
          <div className="space-y-2">
            {recent14.map(entry => {
              const expanded = expandedId === entry.id
              return (
                <div key={entry.id} className="rounded-xl border border-slate-700 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0">{entry.date}</span>
                    <span className="text-sm text-slate-300 font-medium">{fmtHours(entry.totalHours)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${qualityBg(entry.quality)}`}>
                      Q: {entry.quality}/10
                    </span>
                    <span className="text-lg ml-1">{ENERGY_EMOJIS[entry.energyOnWake]}</span>
                    <span className="ml-auto text-slate-600">
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {expanded && (
                    <div className="p-3 bg-slate-900/50 border-t border-slate-700 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-slate-500">Bedtime: <span className="text-slate-300">{entry.bedtime}</span></div>
                        <div className="text-slate-500">Wake: <span className="text-slate-300">{entry.wakeTime}</span></div>
                        <div className="text-slate-500">Deep: <span className="text-slate-300">{entry.deepSleep}%</span></div>
                        <div className="text-slate-500">Interruptions: <span className="text-slate-300">{entry.interruptions}</span></div>
                        <div className="text-slate-500">Dreams: <span className="text-slate-300">{entry.dreamsNoted ? 'Yes' : 'No'}</span></div>
                      </div>
                      {entry.factors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.factors.map(f => {
                            const def = FACTORS.find(fd => fd.key === f.factor)
                            return (
                              <span
                                key={f.factor}
                                className={`px-2 py-0.5 rounded text-xs border ${
                                  f.impact === 'positive'
                                    ? 'bg-green-900/30 border-green-500/40 text-green-300'
                                    : f.impact === 'negative'
                                    ? 'bg-red-900/30 border-red-500/40 text-red-300'
                                    : 'bg-slate-700 border-slate-600 text-slate-300'
                                }`}
                              >
                                {def?.emoji} {def?.label ?? f.factor}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      {entry.dreamNote && (
                        <p className="text-xs text-slate-400 italic">"{entry.dreamNote}"</p>
                      )}
                      {entry.notes && <p className="text-xs text-slate-500">{entry.notes}</p>}
                      <button
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                        onClick={() => {
                          const updated = entries.filter(e => e.id !== entry.id)
                          setEntries(updated)
                          saveEntries(updated)
                          setExpandedId(null)
                        }}
                      >
                        <Trash2 className="w-3 h-3" /> Delete entry
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top factors */}
      {factorCounts.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-slate-200">Top Factors</h3>
          </div>
          <div className="space-y-3">
            {factorCounts.map(f => {
              const def = FACTORS.find(fd => fd.key === f.factor)
              const positiveW = (f.positive / maxFactorTotal) * 100
              const negativeW = (f.negative / maxFactorTotal) * 100
              return (
                <div key={f.factor}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300">{def?.emoji ?? ''} {def?.label ?? f.factor}</span>
                    <span className="text-xs text-slate-500">{f.total}×</span>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-800">
                    {f.positive > 0 && (
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${positiveW}%` }} title={`${f.positive} positive`} />
                    )}
                    {f.negative > 0 && (
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${negativeW}%` }} title={`${f.negative} negative`} />
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-slate-600">
                    {f.positive > 0 && <span className="text-green-600">+{f.positive}</span>}
                    {f.negative > 0 && <span className="text-red-600">−{f.negative}</span>}
                    {f.neutral > 0 && <span>~{f.neutral}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sleep entries yet</p>
          <p className="text-xs mt-1">Fill out the form above to log your first night</p>
        </div>
      )}
    </div>
  )
}
