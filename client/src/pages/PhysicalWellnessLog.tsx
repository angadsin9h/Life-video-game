import { useState, useEffect } from 'react'
import { Heart, Activity, Plus, Trash2, Save, TrendingUp, Sun, CheckCircle, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'physical_wellness_log'

interface BodyArea {
  area: 'head' | 'neck' | 'shoulders' | 'upper-back' | 'lower-back' | 'chest' | 'abdomen' | 'hips' | 'legs' | 'feet'
  discomfort: 0 | 1 | 2 | 3
}

interface PhysicalWellnessEntry {
  id: string
  date: string
  overallFeeling: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  energyLevel: 1 | 2 | 3 | 4 | 5
  painLevel: 0 | 1 | 2 | 3 | 4 | 5
  bodyAreas: BodyArea[]
  movementMinutes: number
  movementTypes: string[]
  stepsEstimate: number
  hydrationGlasses: number
  posture: 'great' | 'good' | 'fair' | 'poor'
  bodyNotes: string
  wins: string[]
}

const BODY_AREAS: Array<{ area: BodyArea['area']; label: string }> = [
  { area: 'head', label: 'Head' },
  { area: 'neck', label: 'Neck' },
  { area: 'shoulders', label: 'Shoulders' },
  { area: 'upper-back', label: 'Upper Back' },
  { area: 'lower-back', label: 'Lower Back' },
  { area: 'chest', label: 'Chest' },
  { area: 'abdomen', label: 'Abdomen' },
  { area: 'hips', label: 'Hips' },
  { area: 'legs', label: 'Legs' },
  { area: 'feet', label: 'Feet' },
]

const MOVEMENT_TYPES = [
  { key: 'walk', label: 'Walk', emoji: '🚶' },
  { key: 'run', label: 'Run', emoji: '🏃' },
  { key: 'yoga', label: 'Yoga', emoji: '🧘' },
  { key: 'gym', label: 'Gym', emoji: '💪' },
  { key: 'cycle', label: 'Cycle', emoji: '🚴' },
  { key: 'swim', label: 'Swim', emoji: '🏊' },
  { key: 'stairs', label: 'Stairs', emoji: '⬆️' },
  { key: 'stretch', label: 'Stretch', emoji: '🤸' },
]

const ENERGY_EMOJIS: Record<number, string> = { 1: '🪫', 2: '🔋', 3: '🔋', 4: '🔋', 5: '⚡' }

const DISCOMFORT_COLORS: Record<number, string> = {
  0: '#22c55e',
  1: '#eab308',
  2: '#f97316',
  3: '#ef4444',
}

const DISCOMFORT_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
}

const FEELING_COLOR = (v: number): string => {
  if (v <= 2) return '#ef4444'
  if (v <= 4) return '#f97316'
  if (v <= 6) return '#eab308'
  if (v <= 8) return '#84cc16'
  return '#22c55e'
}

const POSTURE_OPTIONS: Array<{ value: PhysicalWellnessEntry['posture']; label: string }> = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const PAIN_LABELS: Record<number, string> = {
  0: 'Pain free',
  1: 'Very mild',
  2: 'Mild',
  3: 'Moderate',
  4: 'Strong',
  5: 'Severe',
}

function defaultEntry(): Omit<PhysicalWellnessEntry, 'id'> {
  return {
    date: new Date().toISOString().split('T')[0],
    overallFeeling: 7,
    energyLevel: 3,
    painLevel: 0,
    bodyAreas: BODY_AREAS.map(b => ({ area: b.area, discomfort: 0 })),
    movementMinutes: 0,
    movementTypes: [],
    stepsEstimate: 0,
    hydrationGlasses: 0,
    posture: 'good',
    bodyNotes: '',
    wins: [],
  }
}

function calcStreak(entries: PhysicalWellnessEntry[]): number {
  if (entries.length === 0) return 0
  const dates = new Set(entries.map(e => e.date))
  let streak = 0
  const d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (!dates.has(ds)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function PhysicalWellnessLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PhysicalWellnessEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PhysicalWellnessEntry, 'id'>>(defaultEntry())
  const [winInput, setWinInput] = useState('')
  const [customMovement, setCustomMovement] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setEntries(raw ? JSON.parse(raw) : [])
    } catch { /**/ }
  }, [])

  const persist = (updated: PhysicalWellnessEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const cycleDiscomfort = (area: BodyArea['area']) => {
    setForm(f => ({
      ...f,
      bodyAreas: f.bodyAreas.map(b =>
        b.area === area
          ? { ...b, discomfort: ((b.discomfort + 1) % 4) as 0 | 1 | 2 | 3 }
          : b
      ),
    }))
  }

  const toggleMovementType = (key: string) => {
    setForm(f => ({
      ...f,
      movementTypes: f.movementTypes.includes(key)
        ? f.movementTypes.filter(t => t !== key)
        : [...f.movementTypes, key],
    }))
  }

  const addWin = () => {
    const w = winInput.trim()
    if (!w) return
    setForm(f => ({ ...f, wins: [...f.wins, w] }))
    setWinInput('')
  }

  const addCustomMovement = () => {
    const m = customMovement.trim()
    if (!m) return
    setForm(f => ({
      ...f,
      movementTypes: f.movementTypes.includes(m)
        ? f.movementTypes
        : [...f.movementTypes, m],
    }))
    setCustomMovement('')
  }

  const submit = () => {
    const entry: PhysicalWellnessEntry = {
      id: Date.now().toString(),
      ...form,
    }
    persist([entry, ...entries])
    setForm(defaultEntry())
    setWinInput('')
    setCustomMovement('')
    setShowForm(false)
    toastSuccess('Body check-in logged! 💪')
  }

  const deleteEntry = (id: string) => persist(entries.filter(e => e.id !== id))

  // Stats
  const last30 = entries.slice(0, 30)
  const last7 = entries.slice(0, 7)
  const streak = calcStreak(entries)

  const avgFeeling = last30.length
    ? Math.round((last30.reduce((s, e) => s + e.overallFeeling, 0) / last30.length) * 10) / 10
    : null

  const avgMovement = last30.length
    ? Math.round(last30.reduce((s, e) => s + e.movementMinutes, 0) / last30.length)
    : null

  const avgHydration = last30.length
    ? Math.round((last30.reduce((s, e) => s + e.hydrationGlasses, 0) / last30.length) * 10) / 10
    : null

  // Pain map: area frequencies across last 30 entries
  const painMap: Record<string, { count: number; totalDiscomfort: number }> = {}
  for (const entry of last30) {
    for (const ba of entry.bodyAreas) {
      if (ba.discomfort > 0) {
        if (!painMap[ba.area]) painMap[ba.area] = { count: 0, totalDiscomfort: 0 }
        painMap[ba.area].count++
        painMap[ba.area].totalDiscomfort += ba.discomfort
      }
    }
  }
  const painAreas = Object.entries(painMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)

  // 7-day SVG chart data
  const chartEntries = [...last7].reverse()
  const chartW = 300
  const chartH = 80
  const padX = 20
  const padY = 10
  const innerW = chartW - padX * 2
  const innerH = chartH - padY * 2

  const toBarX = (i: number) => padX + (i / Math.max(chartEntries.length - 1, 1)) * innerW
  const toBarY = (v: number, min: number, max: number) =>
    padY + innerH - ((v - min) / Math.max(max - min, 1)) * innerH

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-emerald-400" />
            Physical Wellness
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Daily holistic body check-in — beyond just workouts.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Check In
        </button>
      </div>

      {/* Streak + Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{avgFeeling ?? '—'}</div>
          <div className="text-xs text-slate-500">Avg Feeling</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgMovement !== null ? `${avgMovement}m` : '—'}</div>
          <div className="text-xs text-slate-500">Avg Move</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgHydration !== null ? `${avgHydration}` : '—'}</div>
          <div className="text-xs text-slate-500">Avg Water</div>
        </div>
      </div>

      {/* Check-in form */}
      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sun className="w-4 h-4 text-emerald-400" /> Body Check-In
          </h3>

          {/* Date */}
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          {/* Overall Feeling */}
          <div>
            <p className="text-xs text-slate-400 mb-2">
              Overall feeling: <span style={{ color: FEELING_COLOR(form.overallFeeling) }} className="font-bold">{form.overallFeeling}/10</span>
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {([1,2,3,4,5,6,7,8,9,10] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setForm(f => ({ ...f, overallFeeling: v }))}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all border ${
                    form.overallFeeling === v
                      ? 'text-white border-transparent scale-110'
                      : 'text-slate-500 border-slate-700 hover:border-slate-500'
                  }`}
                  style={form.overallFeeling === v ? { background: FEELING_COLOR(v), borderColor: FEELING_COLOR(v) } : {}}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Energy level: <span className="font-bold text-white">{ENERGY_EMOJIS[form.energyLevel]} {form.energyLevel}/5</span></p>
            <div className="flex gap-2">
              {([1,2,3,4,5] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setForm(f => ({ ...f, energyLevel: v }))}
                  className={`flex-1 py-2 rounded-xl text-lg transition-all border ${
                    form.energyLevel === v
                      ? 'border-yellow-500/60 bg-yellow-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {ENERGY_EMOJIS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Pain Level */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Pain level: <span className="font-bold text-white">{PAIN_LABELS[form.painLevel]}</span></p>
            <div className="flex gap-1.5 flex-wrap">
              {([0,1,2,3,4,5] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setForm(f => ({ ...f, painLevel: v }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    form.painLevel === v
                      ? v === 0 ? 'bg-emerald-700/50 border-emerald-500/60 text-emerald-300' : 'bg-red-900/40 border-red-500/60 text-red-300'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Body Areas */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Body areas — click to cycle discomfort (none → mild → moderate → severe):</p>
            <div className="grid grid-cols-5 gap-1.5">
              {form.bodyAreas.map(ba => {
                const cfg = BODY_AREAS.find(b => b.area === ba.area)!
                const color = DISCOMFORT_COLORS[ba.discomfort]
                return (
                  <button
                    key={ba.area}
                    onClick={() => cycleDiscomfort(ba.area)}
                    className="py-1.5 px-1 rounded-lg text-xs font-medium transition-all border text-center"
                    style={{
                      background: color + '20',
                      borderColor: color + '60',
                      color: color,
                    }}
                    title={DISCOMFORT_LABELS[ba.discomfort]}
                  >
                    {cfg.label}
                    <div className="text-[9px] opacity-70 mt-0.5">{DISCOMFORT_LABELS[ba.discomfort]}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Movement */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Movement</p>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                min={0}
                value={form.movementMinutes || ''}
                onChange={e => setForm(f => ({ ...f, movementMinutes: Math.max(0, Number(e.target.value)) }))}
                placeholder="Minutes"
                className="game-input flex-1 text-sm"
              />
              <input
                type="number"
                min={0}
                value={form.stepsEstimate || ''}
                onChange={e => setForm(f => ({ ...f, stepsEstimate: Math.max(0, Number(e.target.value)) }))}
                placeholder="Steps estimate"
                className="game-input flex-1 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MOVEMENT_TYPES.map(mt => (
                <button
                  key={mt.key}
                  onClick={() => toggleMovementType(mt.key)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
                    form.movementTypes.includes(mt.key)
                      ? 'bg-emerald-700/40 border-emerald-500/60 text-emerald-300'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {mt.emoji} {mt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customMovement}
                onChange={e => setCustomMovement(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomMovement()}
                placeholder="Other movement..."
                className="game-input flex-1 text-sm"
              />
              <button onClick={addCustomMovement} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs">Add</button>
            </div>
            {form.movementTypes.filter(t => !MOVEMENT_TYPES.find(m => m.key === t)).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {form.movementTypes.filter(t => !MOVEMENT_TYPES.find(m => m.key === t)).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-emerald-700/30 text-emerald-300 border border-emerald-500/30">
                    {t} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hydration */}
          <div>
            <p className="text-xs text-slate-400 mb-2">
              Hydration: <span className="font-bold text-cyan-400">{form.hydrationGlasses} glasses</span> (8oz each)
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, hydrationGlasses: Math.max(0, f.hydrationGlasses - 1) }))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
              >−</button>
              <div className="flex flex-wrap gap-1 flex-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setForm(f => ({ ...f, hydrationGlasses: i + 1 }))}
                    className={`w-5 h-5 rounded text-xs transition-all ${
                      i < form.hydrationGlasses ? 'bg-cyan-500' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    title={`${i + 1} glasses`}
                  >
                    💧
                  </button>
                ))}
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, hydrationGlasses: Math.min(12, f.hydrationGlasses + 1) }))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
              >+</button>
            </div>
          </div>

          {/* Posture */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Posture today:</p>
            <div className="grid grid-cols-4 gap-2">
              {POSTURE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, posture: opt.value }))}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    form.posture === opt.value
                      ? 'bg-emerald-700/40 border-emerald-500/60 text-emerald-300'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body notes */}
          <textarea
            value={form.bodyNotes}
            onChange={e => setForm(f => ({ ...f, bodyNotes: e.target.value }))}
            placeholder="Body signals, symptoms, or anything to note..."
            className="game-input w-full h-16 resize-none text-sm"
          />

          {/* Wins */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Physical wins today:</p>
            <div className="flex gap-2 mb-2">
              <input
                value={winInput}
                onChange={e => setWinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addWin()}
                placeholder="Add a win..."
                className="game-input flex-1 text-sm"
              />
              <button onClick={addWin} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs">Add</button>
            </div>
            {form.wins.length > 0 && (
              <div className="space-y-1">
                {form.wins.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1">{w}</span>
                    <button onClick={() => setForm(f => ({ ...f, wins: f.wins.filter((_, j) => j !== i) }))}
                      className="text-slate-600 hover:text-red-400">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" /> Save Check-In
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 7-day chart */}
      {chartEntries.length >= 2 && (
        <div className="game-card p-4">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> 7-Day Overview
          </h3>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 90 }}>
            {/* Bars for overall feeling */}
            {chartEntries.map((e, i) => {
              const x = toBarX(i)
              const barH = ((e.overallFeeling / 10) * innerH)
              const barY = padY + innerH - barH
              return (
                <rect
                  key={e.id}
                  x={x - 8}
                  y={barY}
                  width={16}
                  height={barH}
                  rx={3}
                  fill={FEELING_COLOR(e.overallFeeling)}
                  opacity={0.7}
                />
              )
            })}
            {/* Energy dots overlay */}
            {chartEntries.map((e, i) => {
              const x = toBarX(i)
              const y = toBarY(e.energyLevel, 1, 5)
              return (
                <circle
                  key={`dot-${e.id}`}
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#f59e0b"
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              )
            })}
            {/* Energy line */}
            {chartEntries.length > 1 && (
              <polyline
                points={chartEntries.map((e, i) => `${toBarX(i)},${toBarY(e.energyLevel, 1, 5)}`).join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4,3"
                opacity={0.6}
              />
            )}
          </svg>
          <div className="flex justify-between mt-1">
            {chartEntries.map((e, i) => (
              <span key={i} className="text-[10px] text-slate-600">{e.date.slice(5)}</span>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block opacity-70" /> Overall feeling (bars)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Energy (dots)
            </span>
          </div>
        </div>
      )}

      {/* Pain map */}
      {painAreas.length > 0 && (
        <div className="game-card p-4">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" /> Pain Map (last 30 entries)
          </h3>
          <div className="space-y-2">
            {painAreas.map(([area, data]) => {
              const areaLabel = BODY_AREAS.find(b => b.area === area)?.label ?? area
              const avgDiscomfort = data.totalDiscomfort / data.count
              const color = avgDiscomfort >= 2.5 ? '#ef4444' : avgDiscomfort >= 1.5 ? '#f97316' : '#eab308'
              return (
                <div key={area} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24">{areaLabel}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(data.count / last30.length) * 100}%`, background: color }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-14 text-right">{data.count}x reported</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Recent Check-Ins
          </h3>
          <div className="space-y-2">
            {entries.slice(0, 7).map(e => (
              <div key={e.id} className="border border-slate-700/60 rounded-xl overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                >
                  <span className="text-xs text-slate-400 w-20">{e.date}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: FEELING_COLOR(e.overallFeeling) + '30', color: FEELING_COLOR(e.overallFeeling) }}
                  >
                    {e.overallFeeling}/10
                  </span>
                  <span className="text-sm">{ENERGY_EMOJIS[e.energyLevel]}</span>
                  <span className="text-xs text-slate-500">Pain: {e.painLevel}</span>
                  <span className="text-xs text-slate-500">{e.movementMinutes}m</span>
                  <button
                    onClick={ev => { ev.stopPropagation(); deleteEntry(e.id) }}
                    className="ml-auto text-slate-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {expandedId === e.id && (
                  <div className="px-3 pb-3 space-y-2 text-xs text-slate-400 border-t border-slate-700/40 pt-2">
                    <div className="flex flex-wrap gap-1">
                      {e.movementTypes.map(t => {
                        const mt = MOVEMENT_TYPES.find(m => m.key === t)
                        return (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-300 border border-emerald-500/20">
                            {mt ? `${mt.emoji} ${mt.label}` : t}
                          </span>
                        )
                      })}
                    </div>
                    <div className="flex gap-4">
                      <span>Steps: {e.stepsEstimate.toLocaleString()}</span>
                      <span>Hydration: {e.hydrationGlasses} glasses</span>
                      <span>Posture: {e.posture}</span>
                    </div>
                    {e.bodyAreas.some(b => b.discomfort > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {e.bodyAreas.filter(b => b.discomfort > 0).map(b => (
                          <span
                            key={b.area}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: DISCOMFORT_COLORS[b.discomfort] + '20', color: DISCOMFORT_COLORS[b.discomfort] }}
                          >
                            {BODY_AREAS.find(x => x.area === b.area)?.label}: {DISCOMFORT_LABELS[b.discomfort]}
                          </span>
                        ))}
                      </div>
                    )}
                    {e.wins.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {e.wins.map((w, i) => (
                          <span key={i} className="text-emerald-400">✓ {w}</span>
                        ))}
                      </div>
                    )}
                    {e.bodyNotes && <p className="italic text-slate-500">"{e.bodyNotes}"</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1">No check-ins yet.</p>
          <p className="text-sm">Start your daily body awareness practice.</p>
        </div>
      )}
    </div>
  )
}
