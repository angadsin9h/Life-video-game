import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  BarChart3,
  Target,
  Check,
  Activity,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface KPIDataPoint {
  date: string
  value: number
}

interface KPI {
  id: string
  name: string
  description: string
  unit: string
  target: number
  frequency: 'daily' | 'weekly'
  category: 'health' | 'productivity' | 'learning' | 'finance' | 'relationships' | 'mindset'
  history: KPIDataPoint[]
  icon: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'personal_kpis'

const CATEGORY_LABELS: Record<KPI['category'], string> = {
  health: 'Health',
  productivity: 'Productivity',
  learning: 'Learning',
  finance: 'Finance',
  relationships: 'Relationships',
  mindset: 'Mindset',
}

const CATEGORY_COLORS: Record<KPI['category'], string> = {
  health: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  productivity: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  learning: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  finance: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  relationships: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  mindset: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
}

const EMOJI_OPTIONS = ['🎯', '💪', '📚', '💰', '🧘', '⚡', '🔥', '🌱', '🏃', '🧠', '❤️', '⭐']

const PRESET_KPIS: Omit<KPI, 'history'>[] = [
  {
    id: 'preset-deep-work',
    name: 'Hours of Deep Work',
    description: 'Focused, uninterrupted work sessions',
    unit: 'hrs',
    target: 4,
    frequency: 'daily',
    category: 'productivity',
    icon: '🎯',
  },
  {
    id: 'preset-books',
    name: 'Books Read',
    description: 'Books completed per week',
    unit: 'books',
    target: 0.5,
    frequency: 'weekly',
    category: 'learning',
    icon: '📚',
  },
  {
    id: 'preset-workouts',
    name: 'Workouts',
    description: 'Exercise sessions completed',
    unit: 'sessions',
    target: 4,
    frequency: 'weekly',
    category: 'health',
    icon: '💪',
  },
  {
    id: 'preset-savings',
    name: 'Savings Rate %',
    description: 'Percentage of income saved',
    unit: '%',
    target: 20,
    frequency: 'weekly',
    category: 'finance',
    icon: '💰',
  },
  {
    id: 'preset-gratitude',
    name: 'Gratitudes Logged',
    description: 'Daily gratitude journal entries',
    unit: 'entries',
    target: 1,
    frequency: 'daily',
    category: 'mindset',
    icon: '🧘',
  },
]

// ─── Utility helpers ───────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0]
}

/** Returns the ISO date string for `n` days ago. */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

/** Returns the Monday of the current week as an ISO date string. */
function currentWeekStart(): string {
  const d = new Date()
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

/** Last 7 data points for sparkline. */
function last7(history: KPIDataPoint[]): KPIDataPoint[] {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.slice(-7)
}

interface PeriodStats {
  current: number
  previous: number
  average: number
}

function computeStats(kpi: KPI): PeriodStats {
  const todayStr = today()
  const weekStart = currentWeekStart()

  if (kpi.frequency === 'daily') {
    const todayEntry = kpi.history.find(h => h.date === todayStr)
    const current = todayEntry?.value ?? 0

    // Yesterday
    const yesterdayStr = daysAgo(1)
    const yesterdayEntry = kpi.history.find(h => h.date === yesterdayStr)
    const previous = yesterdayEntry?.value ?? 0

    // 7-day average
    const cutoff = daysAgo(6)
    const recent = kpi.history.filter(h => h.date >= cutoff && h.date <= todayStr)
    const average = recent.length ? recent.reduce((s, h) => s + h.value, 0) / 7 : 0

    return { current, previous, average }
  } else {
    // Weekly: sum all entries from Monday onwards
    const current = kpi.history
      .filter(h => h.date >= weekStart && h.date <= todayStr)
      .reduce((s, h) => s + h.value, 0)

    // Previous week sum
    const prevWeekEnd = new Date(weekStart)
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)
    const prevWeekEndStr = prevWeekEnd.toISOString().split('T')[0]
    const prevWeekStart = new Date(prevWeekEnd)
    prevWeekStart.setDate(prevWeekStart.getDate() - 6)
    const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0]
    const previous = kpi.history
      .filter(h => h.date >= prevWeekStartStr && h.date <= prevWeekEndStr)
      .reduce((s, h) => s + h.value, 0)

    // 7-day rolling average (daily average × 7 for weekly context)
    const cutoff = daysAgo(13)
    const recent = kpi.history.filter(h => h.date >= cutoff && h.date <= todayStr)
    const average = recent.length ? recent.reduce((s, h) => s + h.value, 0) / 2 : 0

    return { current, previous, average }
  }
}

function statusColor(current: number, target: number): string {
  if (target === 0) return 'text-slate-400'
  const pct = (current / target) * 100
  if (pct >= 100) return 'text-green-400'
  if (pct >= 70) return 'text-yellow-400'
  return 'text-red-400'
}

function statusBorder(current: number, target: number): string {
  if (target === 0) return 'border-slate-600'
  const pct = (current / target) * 100
  if (pct >= 100) return 'border-green-500/40'
  if (pct >= 70) return 'border-yellow-500/40'
  return 'border-red-500/40'
}

// ─── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ points, target }: { points: KPIDataPoint[]; target: number }) {
  const WIDTH = 120
  const HEIGHT = 50
  const PAD = 4

  if (points.length < 2) {
    return (
      <svg width={WIDTH} height={HEIGHT} className="opacity-30">
        <line x1={PAD} y1={HEIGHT / 2} x2={WIDTH - PAD} y2={HEIGHT / 2} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
      </svg>
    )
  }

  const values = points.map(p => p.value)
  const minVal = Math.min(...values, 0)
  const maxVal = Math.max(...values, target)
  const range = maxVal - minVal || 1

  const xScale = (i: number) => PAD + (i / (points.length - 1)) * (WIDTH - PAD * 2)
  const yScale = (v: number) => HEIGHT - PAD - ((v - minVal) / range) * (HEIGHT - PAD * 2)

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)},${yScale(p.value).toFixed(1)}`)
    .join(' ')

  const areaD =
    `${pathD} L ${xScale(points.length - 1).toFixed(1)},${(HEIGHT - PAD).toFixed(1)} L ${xScale(0).toFixed(1)},${(HEIGHT - PAD).toFixed(1)} Z`

  // Target line y-position
  const targetY = yScale(target)
  const lastVal = points[points.length - 1].value
  const lineColor = lastVal >= target ? '#4ade80' : lastVal >= target * 0.7 ? '#facc15' : '#f87171'

  return (
    <svg width={WIDTH} height={HEIGHT}>
      <defs>
        <linearGradient id={`sg-${target}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {/* Target reference line */}
      {targetY >= PAD && targetY <= HEIGHT - PAD && (
        <line
          x1={PAD}
          y1={targetY}
          x2={WIDTH - PAD}
          y2={targetY}
          stroke="#475569"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
      {/* Area fill */}
      <path d={areaD} fill={`url(#sg-${target})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* Last point dot */}
      <circle
        cx={xScale(points.length - 1)}
        cy={yScale(lastVal)}
        r={3}
        fill={lineColor}
      />
    </svg>
  )
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  kpi: KPI
  onLog: (kpi: KPI) => void
  onDelete: (id: string) => void
}

function KPICard({ kpi, onLog, onDelete }: KPICardProps) {
  const { current, previous, average } = useMemo(() => computeStats(kpi), [kpi])
  const sparkPoints = useMemo(() => last7(kpi.history), [kpi.history])

  const pct = kpi.target > 0 ? (current / kpi.target) * 100 : 0
  const trendChange = previous > 0 ? ((current - previous) / previous) * 100 : null
  const isUp = trendChange !== null && trendChange >= 0
  const colorClass = statusColor(current, kpi.target)
  const borderClass = statusBorder(current, kpi.target)
  const catStyle = CATEGORY_COLORS[kpi.category]

  return (
    <div className={`game-card p-5 border transition-all hover:border-slate-500/60 ${borderClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl leading-none flex-shrink-0">{kpi.icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-100 text-sm leading-tight truncate">{kpi.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{kpi.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onLog(kpi)}
            className="p-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 transition-colors"
            title="Log value"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(kpi.id)}
            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-600/20 text-slate-500 hover:text-red-400 transition-colors"
            title="Delete KPI"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category badge + frequency */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catStyle}`}>
          {CATEGORY_LABELS[kpi.category]}
        </span>
        <span className="text-xs text-slate-500 capitalize">{kpi.frequency}</span>
      </div>

      {/* Current value vs target */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <span className={`text-3xl font-bold ${colorClass}`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {current % 1 === 0 ? current : current.toFixed(1)}
          </span>
          <span className="text-slate-500 text-sm ml-1">{kpi.unit}</span>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-slate-400 text-xs">
            <Target className="w-3 h-3" />
            <span>
              {kpi.target % 1 === 0 ? kpi.target : kpi.target.toFixed(1)} {kpi.unit}
            </span>
          </div>
          {pct >= 100 && (
            <div className="flex items-center gap-1 justify-end text-green-400 text-xs mt-0.5">
              <Check className="w-3 h-3" />
              <span>Target hit!</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Sparkline */}
      <div className="flex items-end justify-between">
        <div>
          <Sparkline points={sparkPoints} target={kpi.target} />
          <p className="text-xs text-slate-500 mt-1">Last 7 entries</p>
        </div>

        {/* Stats column */}
        <div className="text-right space-y-1">
          <div className="text-xs text-slate-500">
            Avg{' '}
            <span className="text-slate-300 font-medium">
              {average % 1 === 0 ? average.toFixed(0) : average.toFixed(1)}
            </span>
          </div>
          {trendChange !== null ? (
            <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trendChange).toFixed(0)}%
            </div>
          ) : (
            <div className="text-xs text-slate-600 flex items-center justify-end gap-0.5">
              <Activity className="w-3 h-3" />
              No prior data
            </div>
          )}
          <div className="text-xs text-slate-500">
            {pct >= 0 && (
              <span className={colorClass}>{Math.min(pct, 999).toFixed(0)}%</span>
            )}{' '}
            of target
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add KPI Modal ─────────────────────────────────────────────────────────────

interface AddKPIModalProps {
  onAdd: (kpi: KPI) => void
  onClose: () => void
}

const BLANK_FORM = {
  name: '',
  description: '',
  unit: '',
  target: '',
  frequency: 'daily' as KPI['frequency'],
  category: 'productivity' as KPI['category'],
  icon: '🎯',
}

function AddKPIModal({ onAdd, onClose }: AddKPIModalProps) {
  const [form, setForm] = useState(BLANK_FORM)
  const { toastError } = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const targetNum = parseFloat(form.target)
    if (!form.name.trim()) return toastError('Name required', 'Please enter a KPI name.')
    if (!form.unit.trim()) return toastError('Unit required', 'Please specify a unit.')
    if (isNaN(targetNum) || targetNum < 0) return toastError('Invalid target', 'Enter a valid non-negative number.')

    const kpi: KPI = {
      id: `kpi-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      unit: form.unit.trim(),
      target: targetNum,
      frequency: form.frequency,
      category: form.category,
      icon: form.icon,
      history: [],
    }
    onAdd(kpi)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="game-card p-6 w-full max-w-md border border-slate-700 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-400" />
          New KPI
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                  className={`text-xl p-2 rounded-lg border transition-colors ${
                    form.icon === emoji
                      ? 'border-violet-500 bg-violet-500/20'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name *</label>
            <input
              className="game-input w-full"
              placeholder="e.g. Hours of Deep Work"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <input
              className="game-input w-full"
              placeholder="Brief description..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Unit + Target */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Unit *</label>
              <input
                className="game-input w-full"
                placeholder="e.g. hrs, reps, %"
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target *</label>
              <input
                className="game-input w-full"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 4"
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              />
            </div>
          </div>

          {/* Frequency + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
              <select
                className="game-input w-full"
                value={form.frequency}
                onChange={e => setForm(f => ({ ...f, frequency: e.target.value as KPI['frequency'] }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select
                className="game-input w-full"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as KPI['category'] }))}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors text-sm"
            >
              Add KPI
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Log Value Modal ───────────────────────────────────────────────────────────

interface LogModalProps {
  kpi: KPI
  onLog: (kpiId: string, date: string, value: number) => void
  onClose: () => void
}

function LogModal({ kpi, onLog, onClose }: LogModalProps) {
  const [date, setDate] = useState(today())
  const [value, setValue] = useState('')
  const { toastError } = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return toastError('Invalid value', 'Please enter a valid non-negative number.')
    onLog(kpi.id, date, num)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="game-card p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
          <span>{kpi.icon}</span>
          Log Entry
        </h2>
        <p className="text-sm text-slate-400 mb-5">{kpi.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input
              className="game-input w-full"
              type="date"
              value={date}
              max={today()}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Value ({kpi.unit}) — target: {kpi.target}
            </label>
            <input
              className="game-input w-full"
              type="number"
              min="0"
              step="any"
              placeholder={`e.g. ${kpi.target}`}
              value={value}
              autoFocus
              onChange={e => setValue(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteModalProps {
  kpi: KPI
  onConfirm: () => void
  onClose: () => void
}

function DeleteModal({ kpi, onConfirm, onClose }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="game-card p-6 w-full max-w-sm border border-red-500/30 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
          <h2 className="text-lg font-bold text-slate-100">Delete KPI?</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Are you sure you want to delete <span className="text-slate-200 font-medium">"{kpi.name}"</span>?
          All logged history will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Score Banner ────────────────────────────────────────────────────

function DashboardScore({ kpis }: { kpis: KPI[] }) {
  const score = useMemo(() => {
    if (kpis.length === 0) return 0
    const hitting = kpis.filter(kpi => {
      const { current } = computeStats(kpi)
      return kpi.target > 0 && current >= kpi.target
    }).length
    return Math.round((hitting / kpis.length) * 100)
  }, [kpis])

  const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
  const barColor = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="game-card p-5 border border-slate-700 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          <h2 className="font-semibold text-slate-100">Dashboard Score</h2>
        </div>
        <span className={`text-3xl font-bold ${color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {score}%
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        {kpis.filter(kpi => { const { current } = computeStats(kpi); return kpi.target > 0 && current >= kpi.target }).length} of{' '}
        {kpis.length} KPIs hitting target this period
      </p>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type CategoryFilter = 'all' | KPI['category']

export default function PersonalKPIs() {
  const { toastSuccess } = useToast()
  const [kpis, setKPIs] = useState<KPI[]>([])
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [logTarget, setLogTarget] = useState<KPI | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KPI | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: KPI[] = JSON.parse(raw)
        setKPIs(parsed)
      } else {
        // Seed with presets on first load
        const initial: KPI[] = PRESET_KPIS.map(p => ({ ...p, history: [] }))
        setKPIs(initial)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      }
    } catch {
      const initial: KPI[] = PRESET_KPIS.map(p => ({ ...p, history: [] }))
      setKPIs(initial)
    }
    setBootstrapped(true)
  }, [])

  // Persist on change (but not on initial mount)
  useEffect(() => {
    if (!bootstrapped) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kpis))
  }, [kpis, bootstrapped])

  function handleAddKPI(kpi: KPI) {
    setKPIs(prev => [...prev, kpi])
    setShowAddModal(false)
    toastSuccess('KPI Added', `"${kpi.name}" is now being tracked.`)
  }

  function handleLogValue(kpiId: string, date: string, value: number) {
    setKPIs(prev =>
      prev.map(k => {
        if (k.id !== kpiId) return k
        // Upsert: replace existing entry for same date or append
        const existing = k.history.findIndex(h => h.date === date)
        const newHistory =
          existing >= 0
            ? k.history.map((h, i) => (i === existing ? { date, value } : h))
            : [...k.history, { date, value }]
        return { ...k, history: newHistory }
      })
    )
    setLogTarget(null)
    toastSuccess('Entry Logged', `Value recorded for ${date}.`)
  }

  function handleDeleteKPI(id: string) {
    const kpi = kpis.find(k => k.id === id)
    setKPIs(prev => prev.filter(k => k.id !== id))
    setDeleteTarget(null)
    if (kpi) toastSuccess('KPI Deleted', `"${kpi.name}" removed.`)
  }

  const filteredKPIs = useMemo(
    () =>
      categoryFilter === 'all'
        ? kpis
        : kpis.filter(k => k.category === categoryFilter),
    [kpis, categoryFilter]
  )

  const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'health', label: 'Health' },
    { key: 'productivity', label: 'Productivity' },
    { key: 'learning', label: 'Learning' },
    { key: 'finance', label: 'Finance' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'mindset', label: 'Mindset' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-400" />
            Personal KPIs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track what matters — daily and weekly check-ins</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add KPI
        </button>
      </div>

      {/* Dashboard Score */}
      {kpis.length > 0 && <DashboardScore kpis={kpis} />}

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              categoryFilter === tab.key
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-60">
                ({kpis.filter(k => k.category === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* KPI grid */}
      {filteredKPIs.length === 0 ? (
        <div className="game-card p-12 border border-slate-700 text-center">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            {categoryFilter === 'all' ? 'No KPIs yet' : `No ${CATEGORY_LABELS[categoryFilter as KPI['category']]} KPIs`}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {categoryFilter === 'all'
              ? 'Add your first KPI to start tracking.'
              : 'Switch to a different category or add a new KPI.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKPIs.map(kpi => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              onLog={k => setLogTarget(k)}
              onDelete={id => {
                const found = kpis.find(k => k.id === id)
                if (found) setDeleteTarget(found)
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddKPIModal onAdd={handleAddKPI} onClose={() => setShowAddModal(false)} />
      )}
      {logTarget && (
        <LogModal
          kpi={logTarget}
          onLog={handleLogValue}
          onClose={() => setLogTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          kpi={deleteTarget}
          onConfirm={() => handleDeleteKPI(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
