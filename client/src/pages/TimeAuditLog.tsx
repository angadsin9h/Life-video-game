import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, TrendingUp, Target, BarChart3, RefreshCw, ChevronDown, ChevronUp, Timer, Save } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'time_audit_log'

type Category =
  | 'deep-work'
  | 'shallow-work'
  | 'meetings'
  | 'learning'
  | 'health'
  | 'relationships'
  | 'admin'
  | 'rest'
  | 'distraction'
  | 'other'

interface TimeBlock {
  id: string
  date: string
  startTime: string
  endTime: string
  activity: string
  category: Category
  energy: 1 | 2 | 3
  value: 1 | 2 | 3
  notes: string
}

interface IdealAlloc {
  [key: string]: number
}

interface StoredData {
  blocks: TimeBlock[]
  idealAlloc: IdealAlloc
}

const CATEGORIES: { id: Category; label: string; color: string; emoji: string }[] = [
  { id: 'deep-work',     label: 'Deep Work',     color: '#6366f1', emoji: '🧠' },
  { id: 'shallow-work',  label: 'Shallow Work',  color: '#8b5cf6', emoji: '💼' },
  { id: 'meetings',      label: 'Meetings',      color: '#f59e0b', emoji: '👥' },
  { id: 'learning',      label: 'Learning',      color: '#3b82f6', emoji: '📚' },
  { id: 'health',        label: 'Health',        color: '#22c55e', emoji: '💪' },
  { id: 'relationships', label: 'Relationships', color: '#ec4899', emoji: '❤️' },
  { id: 'admin',         label: 'Admin',         color: '#64748b', emoji: '📋' },
  { id: 'rest',          label: 'Rest',          color: '#7c3aed', emoji: '🌙' },
  { id: 'distraction',   label: 'Distraction',   color: '#ef4444', emoji: '📱' },
  { id: 'other',         label: 'Other',         color: '#334155', emoji: '📌' },
]

const DEFAULT_IDEAL: IdealAlloc = {
  'deep-work': 30,
  'shallow-work': 15,
  'meetings': 10,
  'learning': 10,
  'health': 10,
  'relationships': 10,
  'admin': 5,
  'rest': 5,
  'distraction': 0,
  'other': 5,
}

const ENERGY_LABELS: Record<number, string> = { 1: '😴', 2: '😐', 3: '⚡' }
const VALUE_LABELS: Record<number, string> = { 1: '🔴', 2: '🟡', 3: '🟢' }
const ENERGY_NAMES: Record<number, string> = { 1: 'Drained', 2: 'Neutral', 3: 'Energized' }
const VALUE_NAMES: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' }

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmtDuration(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredData
  } catch { /* ignore */ }
  return { blocks: [], idealAlloc: { ...DEFAULT_IDEAL } }
}

function saveData(data: StoredData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

function getCatInfo(id: Category) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

const DEFAULT_FORM = {
  startTime: '09:00',
  endTime: '10:00',
  activity: '',
  category: 'deep-work' as Category,
  energy: 2 as 1 | 2 | 3,
  value: 2 as 1 | 2 | 3,
  notes: '',
}

export default function TimeAuditLog() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StoredData>(loadData)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [showIdeal, setShowIdeal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const today = todayStr()

  useEffect(() => {
    saveData(data)
  }, [data])

  const todayBlocks = data.blocks
    .filter(b => b.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const selectedBlocks = data.blocks
    .filter(b => b.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const totalTodayMinutes = todayBlocks.reduce((s, b) => {
    return s + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime))
  }, 0)

  function addBlock() {
    if (!form.activity.trim()) return
    const start = timeToMinutes(form.startTime)
    const end = timeToMinutes(form.endTime)
    if (end <= start) return
    const block: TimeBlock = {
      id: Date.now().toString(),
      date: today,
      startTime: form.startTime,
      endTime: form.endTime,
      activity: form.activity.trim(),
      category: form.category,
      energy: form.energy,
      value: form.value,
      notes: form.notes.trim(),
    }
    setData(d => ({ ...d, blocks: [...d.blocks, block] }))
    setForm({ ...DEFAULT_FORM, startTime: form.endTime, endTime: form.endTime })
    setShowForm(false)
    toastSuccess('Time block logged!', `${block.activity} — ${fmtDuration(end - start)}`)
  }

  function deleteBlock(id: string) {
    setData(d => ({ ...d, blocks: d.blocks.filter(b => b.id !== id) }))
  }

  // Category breakdown for today
  const catBreakdown = CATEGORIES.map(cat => {
    const mins = todayBlocks
      .filter(b => b.category === cat.id)
      .reduce((s, b) => s + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0)
    return { ...cat, mins, pct: totalTodayMinutes > 0 ? (mins / totalTodayMinutes) * 100 : 0 }
  }).filter(c => c.mins > 0)

  // SVG donut chart
  const DONUT_R = 56
  const DONUT_CX = 70
  const DONUT_CY = 70
  const CIRCUMFERENCE = 2 * Math.PI * DONUT_R
  let offset = 0
  const donutSlices = catBreakdown.map(cat => {
    const dashLen = (cat.pct / 100) * CIRCUMFERENCE
    const slice = { ...cat, dashLen, offset }
    offset += dashLen
    return slice
  })

  // Energy × Value quadrants
  function quadrantCount(energy: 1 | 2 | 3 | number, value: 1 | 2 | 3 | number): number {
    return todayBlocks.filter(b => b.energy === energy && b.value === value).length
  }
  const peakZone = todayBlocks.filter(b => b.energy === 3 && b.value === 3).length
  const wastedPotential = todayBlocks.filter(b => b.energy === 3 && b.value === 1).length
  const pushThrough = todayBlocks.filter(b => b.energy === 1 && b.value === 3).length
  const eliminate = todayBlocks.filter(b => b.energy === 1 && b.value === 1).length
  const mixed = todayBlocks.length - peakZone - wastedPotential - pushThrough - eliminate

  // Weekly bar chart per category — hours per day per category
  const weekDays = last7Days()
  const weekCatTotals = CATEGORIES.map(cat => {
    const total = weekDays.reduce((s, d) => {
      const mins = data.blocks
        .filter(b => b.date === d && b.category === cat.id)
        .reduce((ss, b) => ss + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0)
      return s + mins
    }, 0)
    return { ...cat, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const maxWeekMins = Math.max(...weekCatTotals.map(c => c.total), 60)

  // Ideal vs actual gaps for today
  const idealVsActual = CATEGORIES.map(cat => {
    const actualPct = totalTodayMinutes > 0
      ? Math.round((todayBlocks.filter(b => b.category === cat.id).reduce((s, b) => s + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0) / totalTodayMinutes) * 100)
      : 0
    const idealPct = data.idealAlloc[cat.id] ?? 0
    return { ...cat, actualPct, idealPct, gap: actualPct - idealPct }
  }).filter(c => c.idealPct > 0 || c.actualPct > 0)

  const formDuration = (() => {
    const s = timeToMinutes(form.startTime)
    const e = timeToMinutes(form.endTime)
    return e > s ? e - s : 0
  })()

  // Selected-day timeline height: proportional to duration, max = 10h = 600min
  const MAX_TIMELINE_MINS = 600
  const TIMELINE_H = 120

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-blue-400" />
            Time Audit Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log time blocks and see where your hours actually go.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Block
        </button>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {fmtDuration(totalTodayMinutes)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Logged Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {todayBlocks.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Blocks</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-emerald-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {peakZone}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Peak Zone</div>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-400" /> Log Time Block
          </h3>

          {/* Activity */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Activity</label>
            <input
              className="game-input w-full"
              placeholder="What did you do? e.g. Wrote project proposal"
              value={form.activity}
              onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={
                    form.category === cat.id
                      ? { background: cat.color + '30', color: cat.color, border: `1px solid ${cat.color}` }
                      : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                  }
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start</label>
              <input
                type="time"
                className="game-input w-full"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End</label>
              <input
                type="time"
                className="game-input w-full"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>
          {formDuration > 0 && (
            <p className="text-xs text-slate-500 -mt-2">Duration: {fmtDuration(formDuration)}</p>
          )}

          {/* Energy */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Energy Level</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, energy: e }))}
                  className="flex-1 py-2 rounded-lg text-center text-lg transition-all border"
                  style={
                    form.energy === e
                      ? { background: '#1e3a5f', borderColor: '#3b82f6' }
                      : { background: '#1e293b', borderColor: '#334155' }
                  }
                  title={ENERGY_NAMES[e]}
                >
                  {ENERGY_LABELS[e]}
                  <div className="text-[9px] text-slate-500 mt-0.5">{ENERGY_NAMES[e]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Value Generated</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setForm(f => ({ ...f, value: v }))}
                  className="flex-1 py-2 rounded-lg text-center text-lg transition-all border"
                  style={
                    form.value === v
                      ? { background: '#1a2e1a', borderColor: '#22c55e' }
                      : { background: '#1e293b', borderColor: '#334155' }
                  }
                  title={VALUE_NAMES[v]}
                >
                  {VALUE_LABELS[v]}
                  <div className="text-[9px] text-slate-500 mt-0.5">{VALUE_NAMES[v]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes (optional)</label>
            <input
              className="game-input w-full"
              placeholder="Any notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addBlock}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Add Block
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Today's timeline */}
      {todayBlocks.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> Today's Timeline
            <span className="ml-auto text-slate-500 font-normal normal-case">{fmtDuration(totalTodayMinutes)} total</span>
          </h3>

          {/* Visual proportional bar */}
          <div className="flex gap-0.5 h-4 rounded-lg overflow-hidden">
            {todayBlocks.map(b => {
              const dur = timeToMinutes(b.endTime) - timeToMinutes(b.startTime)
              const pct = totalTodayMinutes > 0 ? (dur / totalTodayMinutes) * 100 : 0
              const cat = getCatInfo(b.category)
              return (
                <div
                  key={b.id}
                  title={`${b.activity} — ${fmtDuration(dur)}`}
                  style={{ width: `${pct}%`, background: cat.color }}
                  className="h-full transition-all"
                />
              )
            })}
          </div>

          {/* Timeline list */}
          <div className="space-y-1.5">
            {todayBlocks.map(b => {
              const cat = getCatInfo(b.category)
              const dur = timeToMinutes(b.endTime) - timeToMinutes(b.startTime)
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl"
                  style={{ background: cat.color + '10', borderLeft: `3px solid ${cat.color}` }}
                >
                  <span className="text-sm flex-shrink-0 mt-0.5">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{b.activity}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{b.startTime} – {b.endTime} · {fmtDuration(dur)}</span>
                      <span>{ENERGY_LABELS[b.energy]}</span>
                      <span>{VALUE_LABELS[b.value]}</span>
                    </div>
                    {b.notes && <div className="text-xs text-slate-600 mt-0.5 truncate">{b.notes}</div>}
                  </div>
                  <button
                    onClick={() => deleteBlock(b.id)}
                    className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category breakdown + donut */}
      {catBreakdown.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Today's Category Breakdown
          </h3>
          <div className="flex gap-4 items-start flex-wrap">
            {/* Donut */}
            <svg width={140} height={140} viewBox="0 0 140 140" className="flex-shrink-0">
              {donutSlices.map((s, i) => (
                <circle
                  key={i}
                  cx={DONUT_CX}
                  cy={DONUT_CY}
                  r={DONUT_R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={20}
                  strokeDasharray={`${s.dashLen} ${CIRCUMFERENCE - s.dashLen}`}
                  strokeDashoffset={-s.offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
                />
              ))}
              <text x={DONUT_CX} y={DONUT_CY - 6} textAnchor="middle" fill="#e2e8f0" fontSize={14} fontWeight="bold" fontFamily="Orbitron, monospace">
                {fmtDuration(totalTodayMinutes)}
              </text>
              <text x={DONUT_CX} y={DONUT_CY + 10} textAnchor="middle" fill="#64748b" fontSize={9}>
                total
              </text>
            </svg>
            {/* Legend + bars */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {catBreakdown.map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-sm w-4 flex-shrink-0">{cat.emoji}</span>
                  <div className="text-xs text-slate-400 w-24 flex-shrink-0 truncate">{cat.label}</div>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.pct}%`, background: cat.color }}
                    />
                  </div>
                  <div className="text-xs text-slate-300 w-20 text-right flex-shrink-0">
                    {fmtDuration(cat.mins)}{' '}
                    <span className="text-slate-600">({Math.round(cat.pct)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Energy × Value matrix */}
      {todayBlocks.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Energy × Value Matrix
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 border border-emerald-500/30 bg-emerald-900/10">
              <div className="text-xs text-emerald-400 font-semibold mb-1">⚡🟢 Peak Zone</div>
              <div className="text-2xl font-bold text-emerald-300" style={{ fontFamily: 'Orbitron, monospace' }}>{peakZone}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">High energy + High value</div>
            </div>
            <div className="rounded-xl p-3 border border-amber-500/30 bg-amber-900/10">
              <div className="text-xs text-amber-400 font-semibold mb-1">⚡🔴 Wasted Potential</div>
              <div className="text-2xl font-bold text-amber-300" style={{ fontFamily: 'Orbitron, monospace' }}>{wastedPotential}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">High energy + Low value</div>
            </div>
            <div className="rounded-xl p-3 border border-blue-500/30 bg-blue-900/10">
              <div className="text-xs text-blue-400 font-semibold mb-1">😴🟢 Push Through</div>
              <div className="text-2xl font-bold text-blue-300" style={{ fontFamily: 'Orbitron, monospace' }}>{pushThrough}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Low energy + High value</div>
            </div>
            <div className="rounded-xl p-3 border border-red-500/30 bg-red-900/10">
              <div className="text-xs text-red-400 font-semibold mb-1">😴🔴 Eliminate</div>
              <div className="text-2xl font-bold text-red-300" style={{ fontFamily: 'Orbitron, monospace' }}>{eliminate}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Low energy + Low value</div>
            </div>
          </div>
          {mixed > 0 && (
            <p className="text-xs text-slate-600 mt-2 text-center">{mixed} block{mixed > 1 ? 's' : ''} in mixed zones</p>
          )}
        </div>
      )}

      {/* Weekly totals SVG bar chart */}
      {weekCatTotals.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Weekly Totals by Category
          </h3>
          <svg viewBox={`0 0 400 ${weekCatTotals.length * 28 + 12}`} width="100%" style={{ display: 'block' }}>
            {weekCatTotals.map((cat, i) => {
              const y = i * 28 + 6
              const barW = (cat.total / maxWeekMins) * 240
              return (
                <g key={cat.id}>
                  <text x={110} y={y + 10} textAnchor="end" dominantBaseline="middle"
                    fontSize={10} fill="#94a3b8" fontFamily="sans-serif">
                    {cat.emoji} {cat.label}
                  </text>
                  <rect x={116} y={y} width={barW} height={18} rx={4} fill={cat.color} opacity={0.85} />
                  <text x={120 + barW} y={y + 9} dominantBaseline="middle"
                    fontSize={9} fill={cat.color} fontFamily="monospace">
                    {fmtDuration(cat.total)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Ideal vs Actual */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Ideal vs Actual
          </h3>
          <button
            onClick={() => setShowIdeal(v => !v)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showIdeal ? <><ChevronUp className="w-3.5 h-3.5" /> Hide ideals</> : <><ChevronDown className="w-3.5 h-3.5" /> Edit ideals</>}
          </button>
        </div>

        {showIdeal && (
          <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Set your ideal time allocation per category (%):</p>
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-sm w-5">{cat.emoji}</span>
                <div className="text-xs text-slate-400 w-24 flex-shrink-0">{cat.label}</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="game-input w-16 text-sm text-right py-1"
                  value={data.idealAlloc[cat.id] ?? 0}
                  onChange={e => setData(d => ({
                    ...d,
                    idealAlloc: { ...d.idealAlloc, [cat.id]: Math.max(0, Math.min(100, Number(e.target.value))) }
                  }))}
                />
                <span className="text-xs text-slate-600">%</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">
                Total: <span className={
                  Math.abs(Object.values(data.idealAlloc).reduce((s, v) => s + v, 0) - 100) < 5
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }>
                  {Object.values(data.idealAlloc).reduce((s, v) => s + v, 0)}%
                </span>
              </span>
              <button
                onClick={() => { toastSuccess('Ideal allocations saved!') }}
                className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs ml-auto"
              >
                <Save className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        )}

        {idealVsActual.length > 0 ? (
          <div className="space-y-2">
            {idealVsActual.map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-sm w-4">{cat.emoji}</span>
                <div className="text-xs text-slate-400 w-24 flex-shrink-0 truncate">{cat.label}</div>
                <div className="flex-1 space-y-0.5">
                  {/* Ideal bar */}
                  <div className="flex items-center gap-1">
                    <div className="w-8 text-[9px] text-slate-600">ideal</div>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-slate-500"
                        style={{ width: `${cat.idealPct}%` }} />
                    </div>
                    <div className="text-[9px] text-slate-500 w-6 text-right">{cat.idealPct}%</div>
                  </div>
                  {/* Actual bar */}
                  <div className="flex items-center gap-1">
                    <div className="w-8 text-[9px] text-slate-600">actual</div>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${cat.actualPct}%`, background: cat.color }} />
                    </div>
                    <div className="text-[9px] text-slate-500 w-6 text-right">{cat.actualPct}%</div>
                  </div>
                </div>
                <div className="w-12 text-right flex-shrink-0">
                  {cat.gap !== 0 && (
                    <span className={`text-[9px] font-bold ${cat.gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {cat.gap > 0 ? `+${cat.gap}%` : `${cat.gap}%`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">
            No blocks logged today — data will appear here once you start tracking.
          </p>
        )}
      </div>

      {/* Empty state */}
      {todayBlocks.length === 0 && !showForm && (
        <div className="text-center py-14 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4 text-sm">No time blocks logged today.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log First Block
          </button>
        </div>
      )}
    </div>
  )
}
