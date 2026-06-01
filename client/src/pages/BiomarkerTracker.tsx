import { useState, useEffect, useMemo } from 'react'
import { Activity, Heart, Plus, Trash2, Save, Star, Zap, Target, TrendingUp, ChevronDown, ChevronUp, RefreshCw, BarChart3, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BiomarkerDefinition {
  id: string
  name: string
  unit: string
  category: 'cardiovascular' | 'metabolic' | 'body' | 'cognitive' | 'hormonal' | 'inflammatory' | 'other'
  targetMin: number | null
  targetMax: number | null
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-tested'
  notes: string
  active: boolean
}

interface BiomarkerReading {
  id: string
  biomarkerId: string
  date: string
  value: number
  value2: number | null
  context: string
  notes: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'biomarker_tracker'

const CATEGORIES: BiomarkerDefinition['category'][] = [
  'cardiovascular', 'metabolic', 'body', 'cognitive', 'hormonal', 'inflammatory', 'other',
]

const CAT_COLOR: Record<BiomarkerDefinition['category'], string> = {
  cardiovascular: '#ef4444',
  metabolic:      '#f59e0b',
  body:           '#22c55e',
  cognitive:      '#6366f1',
  hormonal:       '#e879f9',
  inflammatory:   '#f97316',
  other:          '#94a3b8',
}

const FREQ_LABELS: Record<BiomarkerDefinition['frequency'], string> = {
  daily:     'Daily',
  weekly:    'Weekly',
  monthly:   'Monthly',
  'as-tested': 'As tested',
}

const PRESET_BIOMARKERS: Omit<BiomarkerDefinition, 'id' | 'active'>[] = [
  {
    name: 'Resting HR',
    unit: 'bpm',
    category: 'cardiovascular',
    targetMin: 55,
    targetMax: 75,
    frequency: 'daily',
    notes: '',
  },
  {
    name: 'HRV',
    unit: 'ms',
    category: 'cardiovascular',
    targetMin: 40,
    targetMax: 80,
    frequency: 'daily',
    notes: '',
  },
  {
    name: 'Weight',
    unit: 'kg',
    category: 'body',
    targetMin: null,
    targetMax: null,
    frequency: 'daily',
    notes: '',
  },
  {
    name: 'Systolic BP',
    unit: 'mmHg',
    category: 'cardiovascular',
    targetMin: 90,
    targetMax: 120,
    frequency: 'weekly',
    notes: '',
  },
  {
    name: 'Diastolic BP',
    unit: 'mmHg',
    category: 'cardiovascular',
    targetMin: 60,
    targetMax: 80,
    frequency: 'weekly',
    notes: '',
  },
  {
    name: 'Fasting Glucose',
    unit: 'mg/dL',
    category: 'metabolic',
    targetMin: 70,
    targetMax: 99,
    frequency: 'monthly',
    notes: '',
  },
  {
    name: 'Sleep Score',
    unit: '1-10',
    category: 'cognitive',
    targetMin: 7,
    targetMax: 10,
    frequency: 'daily',
    notes: '',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function inRange(
  value: number,
  min: number | null,
  max: number | null,
): 'in' | 'borderline' | 'out' | 'no-target' {
  if (min === null && max === null) return 'no-target'
  const lo = min ?? -Infinity
  const hi = max ?? Infinity
  const range = (hi - lo) || 1
  const margin = range * 0.1
  if (value >= lo && value <= hi) return 'in'
  if (value >= lo - margin && value <= hi + margin) return 'borderline'
  return 'out'
}

function rangeColor(status: ReturnType<typeof inRange>): string {
  switch (status) {
    case 'in':         return '#22c55e'
    case 'borderline': return '#f59e0b'
    case 'out':        return '#ef4444'
    default:           return '#94a3b8'
  }
}

// Slope of last N readings (positive = improving direction)
function calcTrend(readings: number[]): 'up' | 'stable' | 'down' {
  if (readings.length < 2) return 'stable'
  const n = Math.min(5, readings.length)
  const slice = readings.slice(-n)
  let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += slice[i]
    sumXY += i * slice[i]
    sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return 'stable'
  const slope = (n * sumXY - sumX * sumY) / denom
  const threshold = (Math.max(...slice) - Math.min(...slice)) * 0.05 || 0.1
  if (slope > threshold) return 'up'
  if (slope < -threshold) return 'down'
  return 'stable'
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({
  readings,
  targetMin,
  targetMax,
  color,
}: {
  readings: BiomarkerReading[]
  targetMin: number | null
  targetMax: number | null
  color: string
}) {
  const last20 = readings.slice(-20)
  const W = 200
  const H = 56
  const PAD = 6

  if (last20.length < 2) {
    return (
      <div className="h-14 flex items-center justify-center">
        <span className="text-xs text-slate-600">Not enough data</span>
      </div>
    )
  }

  const values = last20.map(r => r.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const span = dataMax - dataMin || 1
  const lo = dataMin - span * 0.1
  const hi = dataMax + span * 0.1
  const range = hi - lo || 1

  const toX = (i: number) => PAD + ((W - PAD * 2) * i) / (last20.length - 1)
  const toY = (v: number) => H - PAD - ((v - lo) / range) * (H - PAD * 2)

  const points = last20.map((r, i) => `${toX(i)},${toY(r.value)}`).join(' ')

  // Target band
  const bandTop = targetMax !== null ? toY(Math.min(targetMax, hi)) : null
  const bandBot = targetMin !== null ? toY(Math.max(targetMin, lo)) : null

  const lastX = toX(last20.length - 1)
  const lastY = toY(last20[last20.length - 1].value)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '56px' }}>
      {/* Target band */}
      {bandTop !== null && bandBot !== null && (
        <rect
          x={PAD}
          y={Math.min(bandTop, bandBot)}
          width={W - PAD * 2}
          height={Math.abs(bandBot - bandTop)}
          fill={color + '18'}
          rx="2"
        />
      )}
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'manage' | 'log' | 'dashboard'

export default function BiomarkerTracker() {
  const { toastSuccess } = useToast()

  // ── State ────────────────────────────────────────────────────────────────
  const [biomarkers, setBiomarkers] = useState<BiomarkerDefinition[]>([])
  const [readings, setReadings] = useState<BiomarkerReading[]>([])
  const [tab, setTab] = useState<Tab>('dashboard')
  const [showAddBiomarker, setShowAddBiomarker] = useState(false)

  // New biomarker form
  const emptyDef: Omit<BiomarkerDefinition, 'id' | 'active'> = {
    name: '',
    unit: '',
    category: 'other',
    targetMin: null,
    targetMax: null,
    frequency: 'daily',
    notes: '',
  }
  const [defForm, setDefForm] = useState<Omit<BiomarkerDefinition, 'id' | 'active'>>(emptyDef)
  const [targetMinStr, setTargetMinStr] = useState('')
  const [targetMaxStr, setTargetMaxStr] = useState('')

  // Reading drafts: keyed by biomarkerId
  const [readingDrafts, setReadingDrafts] = useState<
    Record<string, { date: string; value: string; value2: string; context: string; notes: string }>
  >({})

  // Expanded sections for log tab
  const [expandedBiomarkers, setExpandedBiomarkers] = useState<Set<string>>(new Set())

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setBiomarkers(parsed.biomarkers || [])
        setReadings(parsed.readings || [])
      } else {
        // First load: seed with presets
        const seeded: BiomarkerDefinition[] = PRESET_BIOMARKERS.map((b, i) => ({
          ...b,
          id: `preset-${i}-${Date.now()}`,
          active: true,
        }))
        setBiomarkers(seeded)
        setReadings([])
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ biomarkers: seeded, readings: [] }))
      }
    } catch { /**/ }
  }, [])

  function persist(b: BiomarkerDefinition[], r: BiomarkerReading[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ biomarkers: b, readings: r }))
    setBiomarkers(b)
    setReadings(r)
  }

  // ── Biomarker CRUD ───────────────────────────────────────────────────────
  function addBiomarker() {
    if (!defForm.name.trim() || !defForm.unit.trim()) return
    const def: BiomarkerDefinition = {
      id: Date.now().toString(),
      ...defForm,
      targetMin: targetMinStr !== '' ? Number(targetMinStr) : null,
      targetMax: targetMaxStr !== '' ? Number(targetMaxStr) : null,
      active: true,
    }
    persist([def, ...biomarkers], readings)
    setDefForm(emptyDef)
    setTargetMinStr('')
    setTargetMaxStr('')
    setShowAddBiomarker(false)
    toastSuccess(`"${def.name}" added`)
  }

  function toggleActive(id: string) {
    persist(
      biomarkers.map(b => (b.id === id ? { ...b, active: !b.active } : b)),
      readings,
    )
  }

  function deleteBiomarker(id: string) {
    persist(
      biomarkers.filter(b => b.id !== id),
      readings.filter(r => r.biomarkerId !== id),
    )
  }

  // ── Readings CRUD ────────────────────────────────────────────────────────
  function initReadingDraft(biomarkerId: string) {
    if (readingDrafts[biomarkerId]) return
    setReadingDrafts(d => ({
      ...d,
      [biomarkerId]: { date: todayStr(), value: '', value2: '', context: '', notes: '' },
    }))
  }

  function saveReading(biomarkerId: string) {
    const draft = readingDrafts[biomarkerId]
    if (!draft || draft.value === '') return
    const reading: BiomarkerReading = {
      id: Date.now().toString(),
      biomarkerId,
      date: draft.date,
      value: Number(draft.value),
      value2: draft.value2 !== '' ? Number(draft.value2) : null,
      context: draft.context,
      notes: draft.notes,
    }
    persist(biomarkers, [reading, ...readings])
    setReadingDrafts(prev => {
      const copy = { ...prev }
      delete copy[biomarkerId]
      return copy
    })
    toastSuccess('Reading logged! 📊')
  }

  function deleteReading(id: string) {
    persist(biomarkers, readings.filter(r => r.id !== id))
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const activeBiomarkers = biomarkers.filter(b => b.active)

  const stats = useMemo(() => {
    const totalTracked = activeBiomarkers.length
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const thisMonth = readings.filter(r => r.date >= monthStart).length

    // In-range %: last reading per biomarker vs target
    let inRangeCount = 0
    let withTarget = 0
    activeBiomarkers.forEach(b => {
      if (b.targetMin === null && b.targetMax === null) return
      withTarget++
      const bReadings = readings
        .filter(r => r.biomarkerId === b.id)
        .sort((a, d) => d.date.localeCompare(a.date))
      if (!bReadings.length) return
      const status = inRange(bReadings[0].value, b.targetMin, b.targetMax)
      if (status === 'in') inRangeCount++
    })
    const inRangePct = withTarget > 0 ? Math.round((inRangeCount / withTarget) * 100) : null

    // Most tracked
    const countMap: Record<string, number> = {}
    readings.forEach(r => {
      countMap[r.biomarkerId] = (countMap[r.biomarkerId] || 0) + 1
    })
    let mostTrackedId = ''
    let mostCount = 0
    Object.entries(countMap).forEach(([id, c]) => {
      if (c > mostCount) { mostCount = c; mostTrackedId = id }
    })
    const mostTrackedBio = biomarkers.find(b => b.id === mostTrackedId)

    return { totalTracked, thisMonth, inRangePct, mostTracked: mostTrackedBio?.name ?? '—' }
  }, [biomarkers, readings, activeBiomarkers])

  // ─── Dashboard cards ─────────────────────────────────────────────────────
  const dashboardCards = useMemo(() => {
    return activeBiomarkers.map(b => {
      const bReadings = readings
        .filter(r => r.biomarkerId === b.id)
        .sort((a, d) => a.date.localeCompare(d.date))
      const lastReading = bReadings[bReadings.length - 1] ?? null
      const latestStatus =
        lastReading ? inRange(lastReading.value, b.targetMin, b.targetMax) : 'no-target' as const
      const latestColor = rangeColor(latestStatus)
      const trend = calcTrend(bReadings.map(r => r.value))
      return { biomarker: b, readings: bReadings, lastReading, latestStatus, latestColor, trend }
    })
  }, [activeBiomarkers, readings])

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'log', label: 'Log', icon: <Save className="w-4 h-4" /> },
    { key: 'manage', label: 'Manage', icon: <Target className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          <Activity className="w-7 h-7 text-rose-400" />
          Biomarker Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Track personal health biomarkers over time.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{stats.totalTracked}</div>
          <div className="text-xs text-slate-500">Tracked</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{stats.thisMonth}</div>
          <div className="text-xs text-slate-500">This Month</div>
        </div>
        <div className="game-card p-3">
          <div
            className="text-xl font-bold"
            style={{
              color:
                stats.inRangePct === null
                  ? '#94a3b8'
                  : stats.inRangePct >= 80
                  ? '#22c55e'
                  : stats.inRangePct >= 50
                  ? '#f59e0b'
                  : '#ef4444',
            }}
          >
            {stats.inRangePct !== null ? `${stats.inRangePct}%` : '—'}
          </div>
          <div className="text-xs text-slate-500">In Range</div>
        </div>
        <div className="game-card p-3">
          <div
            className="text-sm font-bold truncate text-yellow-400"
            title={stats.mostTracked}
          >
            {stats.mostTracked.length > 7
              ? stats.mostTracked.slice(0, 6) + '…'
              : stats.mostTracked}
          </div>
          <div className="text-xs text-slate-500">Most Tracked</div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === t.key ? '#be123c' : 'transparent',
              color: tab === t.key ? '#ffffff' : '#64748b',
            }}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: MANAGE ────────────────────────────────────────────────────── */}
      {tab === 'manage' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddBiomarker(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Biomarker
          </button>

          {showAddBiomarker && (
            <div className="game-card p-4 border border-rose-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">New Biomarker</h3>
              <div className="flex gap-2">
                <input
                  value={defForm.name}
                  onChange={e => setDefForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Name * (e.g. Fasting Glucose)"
                  className="game-input flex-1 text-sm"
                  autoFocus
                />
                <input
                  value={defForm.unit}
                  onChange={e => setDefForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="Unit * (e.g. mg/dL)"
                  className="game-input w-28 text-sm"
                />
              </div>
              {/* Category chips */}
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setDefForm(f => ({ ...f, category: cat }))}
                      className="px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all"
                      style={{
                        background: defForm.category === cat ? CAT_COLOR[cat] + '33' : '#1e293b',
                        border: `1px solid ${defForm.category === cat ? CAT_COLOR[cat] : '#334155'}`,
                        color: defForm.category === cat ? CAT_COLOR[cat] : '#475569',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={targetMinStr}
                  onChange={e => setTargetMinStr(e.target.value)}
                  placeholder="Target min"
                  className="game-input text-sm flex-1"
                />
                <input
                  type="number"
                  value={targetMaxStr}
                  onChange={e => setTargetMaxStr(e.target.value)}
                  placeholder="Target max"
                  className="game-input text-sm flex-1"
                />
                <select
                  value={defForm.frequency}
                  onChange={e =>
                    setDefForm(f => ({ ...f, frequency: e.target.value as BiomarkerDefinition['frequency'] }))
                  }
                  className="game-input text-sm flex-1"
                >
                  {(Object.entries(FREQ_LABELS) as [BiomarkerDefinition['frequency'], string][]).map(
                    ([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <textarea
                value={defForm.notes}
                onChange={e => setDefForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes"
                className="game-input w-full h-14 resize-none text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={addBiomarker}
                  className="flex-1 py-2 bg-rose-800 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold"
                >
                  Add Biomarker
                </button>
                <button
                  onClick={() => setShowAddBiomarker(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {biomarkers.length === 0 && !showAddBiomarker && (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No biomarkers yet. Add one or use the presets.</p>
            </div>
          )}

          {/* Active */}
          {activeBiomarkers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 uppercase tracking-wider">Tracked</p>
              {activeBiomarkers.map(b => (
                <BiomarkerCard
                  key={b.id}
                  biomarker={b}
                  onToggle={() => toggleActive(b.id)}
                  onDelete={() => deleteBiomarker(b.id)}
                />
              ))}
            </div>
          )}

          {/* Inactive */}
          {biomarkers.filter(b => !b.active).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 uppercase tracking-wider mt-2">Paused</p>
              {biomarkers
                .filter(b => !b.active)
                .map(b => (
                  <BiomarkerCard
                    key={b.id}
                    biomarker={b}
                    onToggle={() => toggleActive(b.id)}
                    onDelete={() => deleteBiomarker(b.id)}
                    dimmed
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LOG ────────────────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="space-y-3">
          {activeBiomarkers.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No active biomarkers. Add some first.</p>
            </div>
          )}

          {activeBiomarkers.map(b => {
            const isExpanded = expandedBiomarkers.has(b.id)
            const draft = readingDrafts[b.id] || {
              date: todayStr(),
              value: '',
              value2: '',
              context: '',
              notes: '',
            }
            const bReadings = readings
              .filter(r => r.biomarkerId === b.id)
              .sort((a, d) => d.date.localeCompare(a.date))

            const setDraft = (
              updater: (
                prev: typeof draft,
              ) => typeof draft,
            ) => {
              if (!readingDrafts[b.id]) initReadingDraft(b.id)
              setReadingDrafts(prev => ({
                ...prev,
                [b.id]: updater(prev[b.id] || draft),
              }))
            }

            const color = CAT_COLOR[b.category]

            return (
              <div
                key={b.id}
                className="game-card"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <button
                  className="w-full flex items-center justify-between p-3"
                  onClick={() => {
                    const next = new Set(expandedBiomarkers)
                    if (isExpanded) next.delete(b.id)
                    else {
                      next.add(b.id)
                      initReadingDraft(b.id)
                    }
                    setExpandedBiomarkers(next)
                  }}
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-sm font-semibold text-white">{b.name}</span>
                    <span className="text-xs text-slate-500">{b.unit}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                      style={{ background: color + '20', color }}
                    >
                      {b.category}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-slate-700">
                    {/* Add reading form */}
                    <div className="pt-3 space-y-2">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Add Reading
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={draft.date}
                          onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                          className="game-input text-xs flex-1"
                        />
                        <input
                          type="number"
                          value={draft.value}
                          onChange={e => setDraft(d => ({ ...d, value: e.target.value }))}
                          placeholder={`Value (${b.unit})`}
                          className="game-input text-sm flex-1"
                          step="0.01"
                        />
                        {/* value2 — only shown if category is cardiovascular (e.g. BP) */}
                        {b.category === 'cardiovascular' && (
                          <input
                            type="number"
                            value={draft.value2}
                            onChange={e => setDraft(d => ({ ...d, value2: e.target.value }))}
                            placeholder="Value 2"
                            className="game-input text-sm flex-1"
                            step="0.01"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={draft.context}
                          onChange={e => setDraft(d => ({ ...d, context: e.target.value }))}
                          placeholder="Context (e.g. fasted, post-workout)"
                          className="game-input text-sm flex-1"
                        />
                        <button
                          onClick={() => saveReading(b.id)}
                          disabled={draft.value === ''}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-800 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Recent readings */}
                    {bReadings.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 uppercase tracking-wider">
                          Recent readings
                        </p>
                        {bReadings.slice(0, 5).map(r => {
                          const status = inRange(r.value, b.targetMin, b.targetMax)
                          const rc = rangeColor(status)
                          return (
                            <div
                              key={r.id}
                              className="flex items-center gap-2 py-1.5 border-b border-slate-700/50"
                            >
                              <span className="text-xs text-slate-500 w-20 flex-shrink-0">
                                {r.date}
                              </span>
                              <span
                                className="text-sm font-semibold"
                                style={{ color: rc }}
                              >
                                {r.value}
                                {r.value2 !== null ? `/${r.value2}` : ''}
                                <span className="text-xs font-normal text-slate-500 ml-1">
                                  {b.unit}
                                </span>
                              </span>
                              {r.context && (
                                <span className="text-xs text-slate-600 flex-1 truncate">
                                  {r.context}
                                </span>
                              )}
                              <button
                                onClick={() => deleteReading(r.id)}
                                className="text-slate-700 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB: DASHBOARD ──────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-3">
          {activeBiomarkers.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No biomarkers being tracked. Add some in Manage.</p>
            </div>
          )}

          {dashboardCards.map(card => {
            const { biomarker: b, readings: bReadings, lastReading, latestStatus, latestColor, trend } = card
            const color = CAT_COLOR[b.category]

            const trendIcon =
              trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              ) : trend === 'down' ? (
                <TrendingUp className="w-3.5 h-3.5 text-red-400 rotate-180" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              )

            const statusLabel: Record<ReturnType<typeof inRange>, string> = {
              in:         'In range',
              borderline: 'Borderline',
              out:        'Out of range',
              'no-target': '—',
            }

            return (
              <div
                key={b.id}
                className="game-card p-4 space-y-3"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{b.name}</span>
                      <span className="text-xs text-slate-500">{b.unit}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                        style={{ background: color + '20', color }}
                      >
                        {b.category}
                      </span>
                    </div>
                    {/* Target range */}
                    {(b.targetMin !== null || b.targetMax !== null) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Target:{' '}
                        {b.targetMin !== null ? b.targetMin : '—'}
                        {' – '}
                        {b.targetMax !== null ? b.targetMax : '—'}{' '}
                        {b.unit}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {lastReading ? (
                      <>
                        <div
                          className="text-lg font-bold"
                          style={{ color: latestColor }}
                        >
                          {lastReading.value}
                          {lastReading.value2 !== null ? `/${lastReading.value2}` : ''}
                        </div>
                        <div className="text-xs text-slate-500">{lastReading.date}</div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-600">No readings</div>
                    )}
                  </div>
                </div>

                {/* Status pill + trend */}
                <div className="flex items-center gap-2">
                  {lastReading && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: latestColor + '20',
                        color: latestColor,
                      }}
                    >
                      {statusLabel[latestStatus]}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    {trendIcon}
                    {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                  </div>
                  <span className="ml-auto text-xs text-slate-600">
                    {bReadings.length} reading{bReadings.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Sparkline chart */}
                {bReadings.length >= 2 && (
                  <LineChart
                    readings={bReadings}
                    targetMin={b.targetMin}
                    targetMax={b.targetMax}
                    color={color}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Biomarker Card (manage tab) ──────────────────────────────────────────────

function BiomarkerCard({
  biomarker,
  onToggle,
  onDelete,
  dimmed = false,
}: {
  biomarker: BiomarkerDefinition
  onToggle: () => void
  onDelete: () => void
  dimmed?: boolean
}) {
  const color = CAT_COLOR[biomarker.category]
  return (
    <div
      className="game-card p-3 flex items-start gap-3"
      style={{ borderLeft: `3px solid ${color}`, opacity: dimmed ? 0.55 : 1 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{biomarker.name}</span>
          <span className="text-xs text-slate-400">{biomarker.unit}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full capitalize"
            style={{ background: color + '20', color }}
          >
            {biomarker.category}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {(biomarker.targetMin !== null || biomarker.targetMax !== null) && (
            <span className="text-xs text-slate-500">
              Target: {biomarker.targetMin ?? '—'} – {biomarker.targetMax ?? '—'} {biomarker.unit}
            </span>
          )}
          <span className="text-xs text-slate-600">{FREQ_LABELS[biomarker.frequency]}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggle}
          className="text-xs px-2 py-1 rounded-lg transition-all"
          style={{
            background: biomarker.active ? '#be123c' + '20' : '#475569' + '20',
            color: biomarker.active ? '#fb7185' : '#64748b',
            border: `1px solid ${biomarker.active ? '#be123c' : '#475569'}`,
          }}
        >
          {biomarker.active ? 'Tracking' : 'Paused'}
        </button>
        <button onClick={onDelete} className="text-slate-700 hover:text-red-400 p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
