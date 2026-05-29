import { useState, useEffect, useMemo } from 'react'
import { Heart, Plus, Trash2, TrendingUp, Zap, Star, RefreshCw, ChevronDown, ChevronUp, Clock, Sun } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'stress_tracker_log'

interface StressEntry {
  id: string
  date: string
  time: string
  stressLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  triggers: string[]
  physicalSymptoms: string[]
  thoughts: string
  reliefTechnique: string
  levelAfter: number
  notes: string
}

const PRESET_TRIGGERS = [
  'work',
  'relationships',
  'health',
  'money',
  'future',
  'social',
  'sleep',
  'overwhelm',
]

const PRESET_SYMPTOMS = [
  'headache',
  'tight chest',
  'fatigue',
  'nausea',
  'tension',
  'racing heart',
]

const RELIEF_LIBRARY = [
  {
    name: 'Deep Breathing (4-7-8)',
    icon: '🌬️',
    instructions:
      'Inhale through your nose for 4 seconds. Hold your breath for 7 seconds. Exhale completely through your mouth for 8 seconds. Repeat 4 cycles.',
  },
  {
    name: 'Progressive Muscle Relaxation',
    icon: '💪',
    instructions:
      'Starting from your toes, tense each muscle group for 5 seconds then release for 30 seconds. Work your way up through legs, core, arms, shoulders, and face.',
  },
  {
    name: 'Cold Water on Face',
    icon: '💧',
    instructions:
      'Fill a basin with cold water (or use a cold wet cloth). Hold your breath, submerge your face for 30 seconds, or splash cold water on your cheeks and forehead. This activates the dive reflex and calms your nervous system.',
  },
  {
    name: '5-4-3-2-1 Grounding',
    icon: '🌍',
    instructions:
      'Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste. Stay present.',
  },
  {
    name: 'Walk Outside',
    icon: '🚶',
    instructions:
      'Step outside for at least 10 minutes. Walk at a moderate pace, notice your surroundings, and take slow breaths. Even a short walk lowers cortisol significantly.',
  },
  {
    name: 'Write It Out',
    icon: '✍️',
    instructions:
      'Set a timer for 10 minutes. Write freely about what is stressing you — no editing, no judgment. Getting thoughts out of your head and onto paper reduces their emotional intensity.',
  },
]

function getStressColor(level: number): string {
  if (level <= 3) return '#22c55e'
  if (level <= 6) return '#eab308'
  return '#ef4444'
}

function getStressLabel(level: number): string {
  if (level <= 2) return 'Very Low'
  if (level <= 4) return 'Mild'
  if (level <= 6) return 'Moderate'
  if (level <= 8) return 'High'
  return 'Very High'
}

function getStoredEntries(): StressEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveEntries(entries: StressEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5)
}

// SVG Arc Gauge
function StressGauge({ level }: { level: number }) {
  const color = getStressColor(level)
  const label = getStressLabel(level)

  // Arc from -210 degrees to 30 degrees (240 degree sweep)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const cx = 80
  const cy = 80
  const r = 60
  const startAngle = -210
  const endAngle = 30
  const totalSweep = endAngle - startAngle // 240
  const fillSweep = (level / 10) * totalSweep
  const fillEnd = startAngle + fillSweep

  function arcPoint(angle: number) {
    return {
      x: cx + r * Math.cos(toRad(angle)),
      y: cy + r * Math.sin(toRad(angle)),
    }
  }

  function describeArc(start: number, end: number) {
    const s = arcPoint(start)
    const e = arcPoint(end)
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const trackD = describeArc(startAngle, endAngle)
  const fillD = level > 0 ? describeArc(startAngle, fillEnd) : ''

  return (
    <svg viewBox="0 0 160 120" className="w-40 h-32 mx-auto">
      {/* Track */}
      <path d={trackD} fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
      {/* Fill */}
      {level > 0 && (
        <path d={fillD} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      )}
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="700" fill={color} fontFamily="Orbitron, monospace">
        {level}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
        {label}
      </text>
      {/* Scale labels */}
      <text x={arcPoint(startAngle).x - 4} y={arcPoint(startAngle).y + 4} textAnchor="middle" fontSize="7" fill="#475569">1</text>
      <text x={arcPoint(endAngle).x + 4} y={arcPoint(endAngle).y + 4} textAnchor="middle" fontSize="7" fill="#475569">10</text>
    </svg>
  )
}

// 7-day SVG line chart
function StressTrendChart({ data }: { data: { date: string; avg: number }[] }) {
  if (data.length < 2) return null
  const W = 300
  const H = 70
  const pad = { top: 10, bottom: 18, left: 10, right: 10 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom
  const toX = (i: number) => pad.left + (i / (data.length - 1)) * chartW
  const toY = (v: number) => pad.top + chartH - ((v - 1) / 9) * chartH

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.avg)}`).join(' ')
  const areaD = `${pathD} L ${toX(data.length - 1)} ${H - pad.bottom} L ${pad.left} ${H - pad.bottom} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
      <defs>
        <linearGradient id="stress-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Reference lines */}
      {[3, 6].map((v) => (
        <line
          key={v}
          x1={pad.left}
          y1={toY(v)}
          x2={W - pad.right}
          y2={toY(v)}
          stroke={v === 3 ? '#22c55e30' : '#eab30830'}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      ))}
      <path d={areaD} fill="url(#stress-gradient)" />
      <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.date} cx={toX(i)} cy={toY(d.avg)} r="3" fill={getStressColor(d.avg)} stroke="#0f172a" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text key={`lbl-${d.date}`} x={toX(i)} y={H - 2} textAnchor="middle" fontSize="7" fill="#475569">
          {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
        </text>
      ))}
    </svg>
  )
}

type Tab = 'log' | 'insights' | 'library'

export function StressTrackerLog() {
  const { toastSuccess } = useToast()
  const today = todayStr()

  const [entries, setEntries] = useState<StressEntry[]>([])
  const [tab, setTab] = useState<Tab>('log')
  const [libraryOpen, setLibraryOpen] = useState(false)

  // Form state
  const [stressLevel, setStressLevel] = useState<number>(5)
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [customTrigger, setCustomTrigger] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [thoughts, setThoughts] = useState('')
  const [reliefTechnique, setReliefTechnique] = useState('')
  const [levelAfter, setLevelAfter] = useState<number>(3)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setEntries(getStoredEntries())
  }, [])

  function toggleTrigger(t: string) {
    setSelectedTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  function addCustomTrigger() {
    const val = customTrigger.trim()
    if (!val || selectedTriggers.includes(val)) return
    setSelectedTriggers((prev) => [...prev, val])
    setCustomTrigger('')
  }

  function toggleSymptom(s: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function saveEntry() {
    const entry: StressEntry = {
      id: Date.now().toString(),
      date: today,
      time: nowTime(),
      stressLevel: stressLevel as StressEntry['stressLevel'],
      triggers: selectedTriggers,
      physicalSymptoms: selectedSymptoms,
      thoughts,
      reliefTechnique,
      levelAfter,
      notes,
    }
    const next = [entry, ...entries]
    setEntries(next)
    saveEntries(next)

    // Reset form
    setStressLevel(5)
    setSelectedTriggers([])
    setSelectedSymptoms([])
    setThoughts('')
    setReliefTechnique('')
    setLevelAfter(3)
    setNotes('')
    toastSuccess('Stress entry saved!')
  }

  function deleteEntry(id: string) {
    const next = entries.filter((e) => e.id !== id)
    setEntries(next)
    saveEntries(next)
  }

  // Derived stats
  const todayEntries = useMemo(() => entries.filter((e) => e.date === today), [entries, today])

  const todayAvg = useMemo(() => {
    if (!todayEntries.length) return 0
    return Math.round(todayEntries.reduce((s, e) => s + e.stressLevel, 0) / todayEntries.length)
  }, [todayEntries])

  const weeklyAvg = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 6)
    const recent = entries.filter((e) => e.date >= cutoff.toISOString().split('T')[0])
    if (!recent.length) return 0
    return Math.round((recent.reduce((s, e) => s + e.stressLevel, 0) / recent.length) * 10) / 10
  }, [entries])

  const triggerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of entries) {
      for (const t of e.triggers) {
        counts[t] = (counts[t] || 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [entries])

  const mostCommonTrigger = triggerCounts[0]?.[0] ?? '—'

  const avgDrop = useMemo(() => {
    const withCoping = entries.filter((e) => e.reliefTechnique && e.levelAfter > 0)
    if (!withCoping.length) return null
    const drop = withCoping.reduce((s, e) => s + (e.stressLevel - e.levelAfter), 0) / withCoping.length
    return Math.round(drop * 10) / 10
  }, [entries])

  const last7Trend = useMemo(() => {
    const days: { date: string; avg: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const dayEntries = entries.filter((e) => e.date === ds)
      if (dayEntries.length > 0) {
        days.push({
          date: ds,
          avg: dayEntries.reduce((s, e) => s + e.stressLevel, 0) / dayEntries.length,
        })
      }
    }
    return days
  }, [entries])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          <Heart className="w-7 h-7 text-red-400" />
          Stress Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Log stress, identify triggers, and practice relief techniques
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
        {(['log', 'insights', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
              tab === t
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* LOG TAB */}
      {tab === 'log' && (
        <div className="space-y-5">
          {/* Today's gauge */}
          <div className="game-card p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Today's Average Stress</h3>
            </div>
            <StressGauge level={todayAvg} />
            <p className="text-xs text-slate-500 mt-1">
              {todayEntries.length === 0
                ? 'No entries yet today'
                : `Based on ${todayEntries.length} entr${todayEntries.length === 1 ? 'y' : 'ies'} today`}
            </p>
          </div>

          {/* Quick log form */}
          <div className="game-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Log Stress Level</h3>
              <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {nowTime()}
              </span>
            </div>

            {/* Stress level selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Stress Level: <span style={{ color: getStressColor(stressLevel) }} className="font-bold">{stressLevel}/10</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setStressLevel(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      stressLevel === n ? 'scale-110 shadow-lg' : 'opacity-60 hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor:
                        stressLevel === n ? getStressColor(n) : '#1e293b',
                      color: stressLevel === n ? '#0f172a' : getStressColor(n),
                      border: `2px solid ${getStressColor(n)}`,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger chips */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Triggers</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TRIGGERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTrigger(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                      selectedTriggers.includes(t)
                        ? 'bg-red-900/50 border-red-400 text-red-300'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                {selectedTriggers
                  .filter((t) => !PRESET_TRIGGERS.includes(t))
                  .map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTrigger(t)}
                      className="px-3 py-1 rounded-full text-xs font-medium border bg-red-900/50 border-red-400 text-red-300 capitalize"
                    >
                      {t}
                    </button>
                  ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  className="game-input text-xs flex-1"
                  placeholder="Add custom trigger..."
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTrigger()}
                />
                <button
                  onClick={addCustomTrigger}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Physical symptoms */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Physical Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                      selectedSymptoms.includes(s)
                        ? 'bg-orange-900/50 border-orange-400 text-orange-300'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Thoughts */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">What was on your mind?</label>
              <textarea
                className="game-input w-full text-sm resize-none"
                rows={3}
                placeholder="Write freely about your thoughts..."
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
              />
            </div>

            {/* Relief technique */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Relief technique used</label>
              <input
                className="game-input w-full text-sm"
                placeholder="e.g. Deep breathing, walked outside..."
                value={reliefTechnique}
                onChange={(e) => setReliefTechnique(e.target.value)}
              />
            </div>

            {/* Level after */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Stress level after coping: <span style={{ color: getStressColor(levelAfter) }} className="font-bold">{levelAfter}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={levelAfter}
                onChange={(e) => setLevelAfter(parseInt(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-xs text-slate-600">
                <span>1 (calm)</span>
                <span>10 (max)</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Additional notes</label>
              <input
                className="game-input w-full text-sm"
                placeholder="Anything else to note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={saveEntry}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Entry
            </button>
          </div>

          {/* Recent entries */}
          {entries.length > 0 && (
            <div className="game-card p-4">
              <h3 className="font-semibold text-slate-200 text-sm mb-3">Recent Entries</h3>
              <div className="space-y-3">
                {entries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-3 border-b border-slate-700/60 last:border-0"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: `${getStressColor(entry.stressLevel)}20`,
                        color: getStressColor(entry.stressLevel),
                        border: `2px solid ${getStressColor(entry.stressLevel)}60`,
                      }}
                    >
                      {entry.stressLevel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{entry.date} {entry.time}</span>
                        {entry.reliefTechnique && entry.levelAfter < entry.stressLevel && (
                          <span className="text-xs text-green-400">
                            → {entry.levelAfter}
                          </span>
                        )}
                      </div>
                      {entry.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.triggers.map((t) => (
                            <span key={t} className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full capitalize">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.thoughts && (
                        <p className="text-xs text-slate-500 mt-1 italic truncate">"{entry.thoughts}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              <Heart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No stress entries yet. Log your first one above.</p>
            </div>
          )}
        </div>
      )}

      {/* INSIGHTS TAB */}
      {tab === 'insights' && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="game-card p-4 text-center">
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: 'Orbitron, monospace', color: getStressColor(weeklyAvg) }}
              >
                {weeklyAvg || '—'}
              </div>
              <div className="text-xs text-slate-500">Avg this week</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-sm font-bold text-orange-400 capitalize truncate">{mostCommonTrigger}</div>
              <div className="text-xs text-slate-500">Top trigger</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {avgDrop !== null ? `-${avgDrop}` : '—'}
              </div>
              <div className="text-xs text-slate-500">Avg drop after coping</div>
            </div>
          </div>

          {/* 7-day trend */}
          <div className="game-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <h3 className="font-semibold text-slate-200 text-sm">7-Day Stress Trend</h3>
            </div>
            {last7Trend.length >= 2 ? (
              <>
                <StressTrendChart data={last7Trend} />
                <div className="flex gap-4 mt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-px bg-green-500 inline-block" /> &le;3 low
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-px bg-yellow-500 inline-block" /> 4-6 moderate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-px bg-red-500 inline-block" /> 7+ high
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                Log entries on multiple days to see the trend.
              </p>
            )}
          </div>

          {/* Trigger heatmap */}
          <div className="game-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Trigger Frequency</h3>
            </div>
            {triggerCounts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No triggers logged yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {triggerCounts.map(([trigger, count]) => (
                  <div
                    key={trigger}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-900/20"
                  >
                    <span className="text-xs text-slate-300 capitalize">{trigger}</span>
                    <span className="text-xs font-bold text-red-400 bg-red-900/60 px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's gauge in insights */}
          <div className="game-card p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Today's Stress Gauge</h3>
            </div>
            <StressGauge level={todayAvg} />
            <p className="text-xs text-slate-500">
              {todayEntries.length === 0
                ? 'No entries today'
                : `Average of ${todayEntries.length} entr${todayEntries.length === 1 ? 'y' : 'ies'}`}
            </p>
          </div>
        </div>
      )}

      {/* LIBRARY TAB */}
      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-slate-200">Stress Relief Library</h3>
          </div>
          <p className="text-xs text-slate-500">
            Evidence-based techniques to reduce stress in the moment.
          </p>
          <div className="space-y-3">
            {RELIEF_LIBRARY.map((item) => (
              <div key={item.name} className="game-card">
                <button
                  className="w-full text-left px-5 py-4 flex items-center gap-3"
                >
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <span className="font-semibold text-slate-200 text-sm flex-1">{item.name}</span>
                </button>
                <div className="px-5 pb-4 -mt-2">
                  <p className="text-sm text-slate-400 leading-relaxed">{item.instructions}</p>
                  <button
                    onClick={() => {
                      setReliefTechnique(item.name)
                      setTab('log')
                      toastSuccess(`"${item.name}" selected as your technique!`)
                    }}
                    className="mt-3 px-4 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    Use this technique
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Fix duplicate onClick on library cards — replace with per-item open state
function Save({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

export default StressTrackerLog
