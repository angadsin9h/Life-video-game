import React, { useState, useEffect } from 'react'
import { Sun, Plus, Trash2, Clock, Zap, Brain } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type HourlyEntry = {
  id: string
  date: string
  hour: number
  cognitiveScore: number
  physicalScore: number
  emotionalScore: number
  task: string
  taskType: 'creative' | 'analytical' | 'admin' | 'physical' | 'social'
  energySource: 'natural' | 'caffeine' | 'exercise' | 'nap' | 'food'
  notes: string
}

const STORAGE_KEY = 'lq-peak-hours-log'

const TASK_TYPES: HourlyEntry['taskType'][] = ['creative', 'analytical', 'admin', 'physical', 'social']
const ENERGY_SOURCES: HourlyEntry['energySource'][] = ['natural', 'caffeine', 'exercise', 'nap', 'food']

const TASK_TYPE_COLORS: Record<HourlyEntry['taskType'], string> = {
  creative: '#ec4899',
  analytical: '#6366f1',
  admin: '#64748b',
  physical: '#22c55e',
  social: '#f59e0b',
}

const ENERGY_SOURCE_ICONS: Record<HourlyEntry['energySource'], string> = {
  natural: '☀️',
  caffeine: '☕',
  exercise: '🏃',
  nap: '💤',
  food: '🍎',
}

const LOG_HOURS = Array.from({ length: 17 }, (_, i) => i + 6)

function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function compositeScore(e: HourlyEntry): number {
  return (e.cognitiveScore + e.physicalScore + e.emotionalScore) / 3
}

function heatColor(score: number): string {
  if (score === 0) return '#0f172a'
  if (score < 4) return '#1e3a5f'
  if (score < 6) return '#1d4ed8'
  if (score < 7.5) return '#7c3aed'
  if (score < 9) return '#c026d3'
  return '#fbbf24'
}

function scoreLabel(score: number): string {
  if (score === 0) return 'No data'
  if (score < 4) return 'Low'
  if (score < 6) return 'Moderate'
  if (score < 7.5) return 'Good'
  if (score < 9) return 'High'
  return 'Peak'
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function PeakHoursLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<HourlyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const [form, setForm] = useState<Omit<HourlyEntry, 'id' | 'date'>>({
    hour: new Date().getHours(),
    cognitiveScore: 7,
    physicalScore: 7,
    emotionalScore: 7,
    task: '',
    taskType: 'analytical',
    energySource: 'natural',
    notes: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setEntries(JSON.parse(saved) as HourlyEntry[])
  }, [])

  const persist = (updated: HourlyEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const resetForm = () => {
    setForm({
      hour: new Date().getHours(),
      cognitiveScore: 7,
      physicalScore: 7,
      emotionalScore: 7,
      task: '',
      taskType: 'analytical',
      energySource: 'natural',
      notes: '',
    })
  }

  const saveEntry = () => {
    if (!form.task.trim()) return
    const entry: HourlyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...form,
    }
    persist([entry, ...entries])
    resetForm()
    setShowForm(false)
    toastSuccess('Hour logged!', `${formatHour(form.hour)} — composite ${compositeScore(entry).toFixed(1)}/10`)
  }

  const deleteEntry = (id: string) => {
    persist(entries.filter(e => e.id !== id))
  }

  const avgScoreByHour = (hour: number) => {
    const relevant = entries.filter(e => e.hour === hour)
    if (relevant.length === 0) return 0
    return relevant.reduce((s, e) => s + compositeScore(e), 0) / relevant.length
  }

  const avgCogByHour = (hour: number) => {
    const relevant = entries.filter(e => e.hour === hour)
    if (relevant.length === 0) return 0
    return relevant.reduce((s, e) => s + e.cognitiveScore, 0) / relevant.length
  }

  const avgPhysByHour = (hour: number) => {
    const relevant = entries.filter(e => e.hour === hour)
    if (relevant.length === 0) return 0
    return relevant.reduce((s, e) => s + e.physicalScore, 0) / relevant.length
  }

  const allHours = Array.from({ length: 24 }, (_, i) => i)

  const topCogHours = allHours
    .map(h => ({ hour: h, score: avgCogByHour(h) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const topPhysHours = allHours
    .map(h => ({ hour: h, score: avgPhysByHour(h) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const bestTaskTypeByHour: { hour: number; taskType: HourlyEntry['taskType'] }[] = allHours
    .map(h => {
      const hourEntries = entries.filter(e => e.hour === h)
      if (hourEntries.length === 0) return null
      const freq: Partial<Record<HourlyEntry['taskType'], number>> = {}
      hourEntries.forEach(e => { freq[e.taskType] = (freq[e.taskType] ?? 0) + 1 })
      const best = (Object.entries(freq) as [HourlyEntry['taskType'], number][])
        .sort((a, b) => b[1] - a[1])[0][0]
      return { hour: h, taskType: best }
    })
    .filter((x): x is { hour: number; taskType: HourlyEntry['taskType'] } => x !== null)

  const goldenHours = allHours
    .map(h => ({ hour: h, score: avgScoreByHour(h) }))
    .filter(x => x.score >= 7.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const weeklyData = DAYS_SHORT.map((_, dow) => {
    const dayEntries = entries.filter(e => new Date(e.date + 'T12:00:00').getDay() === dow)
    if (dayEntries.length === 0) return { dow, avgHour: null }
    const avgHour = dayEntries.reduce((s, e) => s + e.hour, 0) / dayEntries.length
    return { dow, avgHour }
  })

  const heatmapHours = Array.from({ length: 24 }, (_, i) => i)
  const cellW = 28
  const cellH = 28
  const heatmapW = 24 * cellW + 40
  const heatmapH = cellH + 36

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Sun className="w-7 h-7 text-amber-400" />
            Peak Hours Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Discover your cognitive and physical peak windows</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Quick Log
        </button>
      </div>

      {goldenHours.length > 0 && (
        <div
          className="game-card p-4"
          style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(6,182,212,0.06) 100%)', borderLeft: '3px solid #fbbf24' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm uppercase tracking-wide">Your Golden Hours</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {goldenHours.map(({ hour, score }) => (
              <div
                key={hour}
                className="flex flex-col items-center px-4 py-2 rounded-xl"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}
              >
                <span className="text-amber-300 font-bold text-lg" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {formatHour(hour)}
                </span>
                <span className="text-amber-500/70 text-xs">{score.toFixed(1)} avg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-5 space-y-5 border border-cyan-500/30">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Log This Hour
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Hour</label>
              <select
                value={form.hour}
                onChange={e => setForm(f => ({ ...f, hour: +e.target.value }))}
                className="game-input w-full"
              >
                {LOG_HOURS.map(h => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Task</label>
              <input
                value={form.task}
                onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
                placeholder="What were you doing?"
                className="game-input w-full"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-3">
            {(
              [
                { field: 'cognitiveScore' as const, label: 'Cognitive', color: '#6366f1' },
                { field: 'physicalScore' as const, label: 'Physical', color: '#22c55e' },
                { field: 'emotionalScore' as const, label: 'Emotional', color: '#f59e0b' },
              ]
            ).map(({ field, label, color }) => (
              <div key={field}>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-400">{label}</label>
                  <span className="font-bold" style={{ color }}>{form[field]}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: +e.target.value }))}
                  className="w-full"
                  style={{ accentColor: color }}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Task Type</label>
            <div className="flex flex-wrap gap-2">
              {TASK_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, taskType: t }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border"
                  style={
                    form.taskType === t
                      ? { background: `${TASK_TYPE_COLORS[t]}22`, color: TASK_TYPE_COLORS[t], borderColor: TASK_TYPE_COLORS[t] }
                      : { background: '#1e293b', color: '#64748b', borderColor: 'transparent' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Energy Source</label>
            <div className="flex flex-wrap gap-2">
              {ENERGY_SOURCES.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, energySource: s }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border"
                  style={
                    form.energySource === s
                      ? { background: 'rgba(6,182,212,0.15)', color: '#22d3ee', borderColor: '#06b6d4' }
                      : { background: '#1e293b', color: '#64748b', borderColor: 'transparent' }
                  }
                >
                  {ENERGY_SOURCE_ICONS[s]} {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any observations about your state..."
              className="game-input w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveEntry}
              disabled={!form.task.trim()}
              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Log Hour
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div className="game-card p-5 space-y-3 overflow-x-auto">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" /> 24-Hour Composite Heatmap
            </h3>
            <p className="text-xs text-slate-500">Average composite score (cognitive + physical + emotional) per hour across all entries</p>
            <div style={{ minWidth: `${heatmapW}px` }}>
              <svg width={heatmapW} height={heatmapH}>
                {heatmapHours.map(h => {
                  const score = avgScoreByHour(h)
                  const x = 36 + h * cellW
                  const col = heatColor(score)
                  const isHovered = hoveredHour === h
                  return (
                    <g key={h}>
                      <rect
                        x={x + 1}
                        y={1}
                        width={cellW - 2}
                        height={cellH - 2}
                        rx={4}
                        fill={col}
                        stroke={isHovered ? '#fbbf24' : 'transparent'}
                        strokeWidth={1.5}
                        style={{ cursor: 'pointer', transition: 'stroke 0.15s' }}
                        onMouseEnter={() => setHoveredHour(h)}
                        onMouseLeave={() => setHoveredHour(null)}
                      />
                      {score > 0 && (
                        <text x={x + cellW / 2} y={cellH / 2 + 4} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.7)">
                          {score.toFixed(0)}
                        </text>
                      )}
                      {h % 3 === 0 && (
                        <text x={x + cellW / 2} y={cellH + 12} textAnchor="middle" fontSize={8} fill="#475569">
                          {formatHour(h)}
                        </text>
                      )}
                    </g>
                  )
                })}
                <text x={0} y={cellH / 2 + 4} fontSize={8} fill="#475569" dominantBaseline="middle">hr</text>
              </svg>
            </div>
            {hoveredHour !== null && (
              <div className="text-xs text-slate-400 mt-1">
                <span className="text-cyan-300 font-semibold">{formatHour(hoveredHour)}</span>
                {' — '}
                {avgScoreByHour(hoveredHour) > 0
                  ? <><span style={{ color: heatColor(avgScoreByHour(hoveredHour)) }}>{scoreLabel(avgScoreByHour(hoveredHour))}</span> ({avgScoreByHour(hoveredHour).toFixed(1)}/10, {entries.filter(e => e.hour === hoveredHour).length} entries)</>
                  : <span className="text-slate-600">No data</span>
                }
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-600">Low</span>
              {['#1e3a5f', '#1d4ed8', '#7c3aed', '#c026d3', '#fbbf24'].map(c => (
                <div key={c} className="w-5 h-3 rounded-sm" style={{ background: c }} />
              ))}
              <span className="text-xs text-slate-600">Peak</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="game-card p-4 space-y-3">
              <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                <Brain className="w-4 h-4" /> Top Cognitive Hours
              </h4>
              {topCogHours.length === 0 && <p className="text-xs text-slate-600">Not enough data yet</p>}
              {topCogHours.map(({ hour, score }, i) => (
                <div key={hour} className="flex items-center gap-3">
                  <span className="text-indigo-400 font-bold text-xs w-5">#{i + 1}</span>
                  <span className="text-slate-300 font-semibold text-sm" style={{ fontFamily: 'Orbitron, monospace' }}>
                    {formatHour(hour)}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score * 10}%`, background: '#6366f1' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{score.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div className="game-card p-4 space-y-3">
              <h4 className="text-sm font-semibold text-green-300 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Top Physical Hours
              </h4>
              {topPhysHours.length === 0 && <p className="text-xs text-slate-600">Not enough data yet</p>}
              {topPhysHours.map(({ hour, score }, i) => (
                <div key={hour} className="flex items-center gap-3">
                  <span className="text-green-400 font-bold text-xs w-5">#{i + 1}</span>
                  <span className="text-slate-300 font-semibold text-sm" style={{ fontFamily: 'Orbitron, monospace' }}>
                    {formatHour(hour)}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score * 10}%`, background: '#22c55e' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {bestTaskTypeByHour.length > 0 && (
            <div className="game-card p-4">
              <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Best Task Type by Hour
              </h4>
              <div className="flex flex-wrap gap-2">
                {bestTaskTypeByHour
                  .filter(x => entries.filter(e => e.hour === x.hour).length >= 2)
                  .map(({ hour, taskType }) => (
                    <div
                      key={hour}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                      style={{ background: `${TASK_TYPE_COLORS[taskType]}15`, border: `1px solid ${TASK_TYPE_COLORS[taskType]}40` }}
                    >
                      <span className="text-xs font-semibold" style={{ fontFamily: 'Orbitron, monospace', color: TASK_TYPE_COLORS[taskType] }}>
                        {formatHour(hour)}
                      </span>
                      <span className="text-xs capitalize" style={{ color: TASK_TYPE_COLORS[taskType] }}>{taskType}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="game-card p-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" /> Weekly Rhythm
            </h4>
            <svg width={280} height={80}>
              {weeklyData.map(({ dow, avgHour }, i) => {
                const x = 20 + i * 38
                const dotY = avgHour !== null ? 8 + ((avgHour - 6) / 16) * 52 : null
                return (
                  <g key={dow}>
                    {dotY !== null && (
                      <>
                        <circle cx={x + 12} cy={dotY} r={5} fill="#22d3ee" fillOpacity={0.8} />
                        <text x={x + 12} y={dotY - 8} textAnchor="middle" fontSize={7} fill="#22d3ee">
                          {formatHour(Math.round(avgHour!))}
                        </text>
                      </>
                    )}
                    <text x={x + 12} y={74} textAnchor="middle" fontSize={9} fill="#475569">{DAYS_SHORT[dow]}</text>
                  </g>
                )
              })}
              <line x1={20} y1={8} x2={20} y2={62} stroke="#1e293b" strokeWidth={1} />
              <text x={16} y={12} textAnchor="end" fontSize={7} fill="#334155">6am</text>
              <text x={16} y={62} textAnchor="end" fontSize={7} fill="#334155">10pm</text>
            </svg>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-400 px-1">Recent Entries</h4>
            {entries.slice(0, 10).map(entry => {
              const comp = compositeScore(entry)
              return (
                <div
                  key={entry.id}
                  className="game-card p-3 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${TASK_TYPE_COLORS[entry.taskType]}` }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: heatColor(comp), fontFamily: 'Orbitron, monospace', color: comp > 5 ? '#fff' : '#94a3b8' }}
                  >
                    {formatHour(entry.hour)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-200 font-medium truncate">{entry.task}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded capitalize"
                        style={{ background: `${TASK_TYPE_COLORS[entry.taskType]}22`, color: TASK_TYPE_COLORS[entry.taskType] }}
                      >
                        {entry.taskType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-indigo-400">🧠 {entry.cognitiveScore}</span>
                      <span className="text-xs text-green-400">💪 {entry.physicalScore}</span>
                      <span className="text-xs text-amber-400">❤️ {entry.emotionalScore}</span>
                      <span className="text-xs text-slate-600">{ENERGY_SOURCE_ICONS[entry.energySource]}</span>
                      <span className="text-xs text-slate-600 ml-auto">{entry.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Sun className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No hourly data yet.</p>
          <p className="text-sm mb-5">Log a few sessions to reveal your peak performance windows.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log Your First Hour
          </button>
        </div>
      )}
    </div>
  )
}
