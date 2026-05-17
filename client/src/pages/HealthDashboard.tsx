import { useEffect, useState, useMemo } from 'react'
import {
  Activity, Plus, TrendingUp, Heart, Zap, Moon, Dumbbell, BarChart3,
  ArrowUp, ArrowDown,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type WeightUnit = 'lbs' | 'kg'
type PainLevel = 'none' | 'mild' | 'moderate' | 'severe'

interface DailyLog {
  date: string
  steps: number | null
  activeMinutes: number | null
  hrv: number | null
  restingHR: number | null
  weight: number | null
  mood: number | null        // 1-5
  energy: number | null      // 1-5
  pain: PainLevel
  sleepHours: number | null
}

interface Settings {
  weightUnit: WeightUnit
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'health_dashboard_settings'
const LOG_KEY = (date: string) => `health_dashboard_${date}`

const PAIN_OPTIONS: { value: PainLevel; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: '#22c55e' },
  { value: 'mild', label: 'Mild', color: '#eab308' },
  { value: 'moderate', label: 'Moderate', color: '#f97316' },
  { value: 'severe', label: 'Severe', color: '#ef4444' },
]

const MOOD_LABELS = ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great']
const ENERGY_LABELS = ['', 'Drained', 'Low', 'Moderate', 'High', 'Supercharged']

const MOOD_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']
const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getPastDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().split('T')[0]
  })
}

function loadLog(date: string): DailyLog | null {
  try {
    const raw = localStorage.getItem(LOG_KEY(date))
    return raw ? (JSON.parse(raw) as DailyLog) : null
  } catch {
    return null
  }
}

function loadLogs(dates: string[]): DailyLog[] {
  return dates.map(d => loadLog(d) ?? {
    date: d,
    steps: null, activeMinutes: null, hrv: null, restingHR: null,
    weight: null, mood: null, energy: null, pain: 'none', sleepHours: null,
  })
}

function computeHealthScore(log: DailyLog): number {
  const parts: number[] = []
  if (log.steps != null) parts.push(Math.min(log.steps / 10000, 1))
  if (log.activeMinutes != null) parts.push(Math.min(log.activeMinutes / 30, 1))
  if (log.mood != null) parts.push(log.mood / 5)
  if (log.energy != null) parts.push(log.energy / 5)
  if (log.sleepHours != null) parts.push(Math.min(log.sleepHours / 8, 1))
  if (parts.length === 0) return 0
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
}

function avg(vals: (number | null)[]): number | null {
  const valid = vals.filter((v): v is number => v != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniBarChart({ values, maxVal, color }: {
  values: (number | null)[]
  maxVal: number
  color: string
}) {
  const safeMax = maxVal > 0 ? maxVal : Math.max(...values.filter((v): v is number => v != null), 1)
  return (
    <div className="flex items-end gap-0.5 h-8 w-full">
      {values.map((v, i) => {
        const pct = v != null ? Math.min(v / safeMax, 1) : 0
        const isLast = i === values.length - 1
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: v != null ? `${Math.max(pct * 100, 4)}%` : '4%',
              background: v != null ? (isLast ? color : `${color}88`) : '#1e293b',
              minHeight: '2px',
            }}
            title={v != null ? String(v) : 'No data'}
          />
        )
      })}
    </div>
  )
}

function RatingPicker({
  value,
  max,
  colors,
  labels,
  onChange,
}: {
  value: number | null
  max: number
  colors: string[]
  labels: string[]
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => {
        const v = i + 1
        const active = value === v
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border"
            style={{
              background: active ? `${colors[v]}33` : '#0f172a',
              color: active ? colors[v] : '#475569',
              borderColor: active ? colors[v] : '#1e293b',
            }}
          >
            {v}
            {active && labels[v] && (
              <span className="block text-[9px] font-normal leading-none mt-0.5">{labels[v]}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: string | number | null
  unit?: string
  color: string
  trend?: (number | null)[]
}) {
  return (
    <div className="game-card p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color, fontFamily: 'Orbitron, monospace' }}>
        {value != null ? `${value}${unit ? ` ${unit}` : ''}` : '—'}
      </div>
      {trend && (
        <MiniBarChart
          values={trend}
          maxVal={0}
          color={color}
        />
      )}
    </div>
  )
}

function CompareArrow({ current, prior }: { current: number | null; prior: number | null }) {
  if (current == null || prior == null) return <span className="text-slate-600">—</span>
  const diff = current - prior
  if (Math.abs(diff) < 0.01) return <span className="text-slate-500 text-xs">same</span>
  return diff > 0 ? (
    <span className="flex items-center gap-0.5 text-green-400 text-xs font-bold">
      <ArrowUp className="w-3 h-3" />+{diff.toFixed(1)}
    </span>
  ) : (
    <span className="flex items-center gap-0.5 text-red-400 text-xs font-bold">
      <ArrowDown className="w-3 h-3" />{diff.toFixed(1)}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<DailyLog, 'date'> = {
  steps: null,
  activeMinutes: null,
  hrv: null,
  restingHR: null,
  weight: null,
  mood: null,
  energy: null,
  pain: 'none',
  sleepHours: null,
}

export default function HealthDashboard() {
  const { toastSuccess } = useToast()
  const today = getToday()

  const [settings, setSettings] = useState<Settings>({ weightUnit: 'lbs' })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DailyLog, 'date'>>(EMPTY_FORM)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) setSettings(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const saveSettings = (s: Settings) => {
    setSettings(s)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  }

  // Derived data
  const last7Dates = useMemo(() => getPastDates(7), [refreshKey])
  const prior7Dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (14 - i))
      return d.toISOString().split('T')[0]
    })
  }, [refreshKey])

  const last7Logs = useMemo(() => loadLogs(last7Dates), [last7Dates])
  const prior7Logs = useMemo(() => loadLogs(prior7Dates), [prior7Dates])
  const todayLog = useMemo(() => loadLog(today), [today, refreshKey])

  // Pre-fill form with today's existing data
  useEffect(() => {
    if (todayLog) {
      const { date: _date, ...rest } = todayLog
      setForm(rest)
    } else {
      setForm(EMPTY_FORM)
    }
  }, [todayLog])

  const healthScore = useMemo(() => {
    return todayLog ? computeHealthScore(todayLog) : null
  }, [todayLog])

  const scoreColor =
    healthScore == null ? '#64748b'
    : healthScore >= 80 ? '#10b981'
    : healthScore >= 60 ? '#22c55e'
    : healthScore >= 40 ? '#eab308'
    : '#ef4444'

  const saveLog = () => {
    const log: DailyLog = { date: today, ...form }
    localStorage.setItem(LOG_KEY(today), JSON.stringify(log))
    setRefreshKey(k => k + 1)
    setShowForm(false)
    toastSuccess('Health vitals logged for today!')
  }

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Trend arrays per metric (last 7 days)
  const stepsTrend = last7Logs.map(l => l.steps)
  const activeTrend = last7Logs.map(l => l.activeMinutes)
  const moodTrend = last7Logs.map(l => l.mood)
  const energyTrend = last7Logs.map(l => l.energy)
  const sleepTrend = last7Logs.map(l => l.sleepHours)
  const hrTrend = last7Logs.map(l => l.restingHR)
  const hrvTrend = last7Logs.map(l => l.hrv)
  const weightTrend = last7Logs.map(l => l.weight)

  // Weekly summary
  type SummaryMetric = { label: string; current: number | null; prior: number | null }
  const weeklySummary: SummaryMetric[] = [
    { label: 'Steps', current: avg(last7Logs.map(l => l.steps)), prior: avg(prior7Logs.map(l => l.steps)) },
    { label: 'Active Min', current: avg(last7Logs.map(l => l.activeMinutes)), prior: avg(prior7Logs.map(l => l.activeMinutes)) },
    { label: 'Mood', current: avg(last7Logs.map(l => l.mood)), prior: avg(prior7Logs.map(l => l.mood)) },
    { label: 'Energy', current: avg(last7Logs.map(l => l.energy)), prior: avg(prior7Logs.map(l => l.energy)) },
    { label: 'Sleep (h)', current: avg(last7Logs.map(l => l.sleepHours)), prior: avg(prior7Logs.map(l => l.sleepHours)) },
    { label: 'Resting HR', current: avg(last7Logs.map(l => l.restingHR)), prior: avg(prior7Logs.map(l => l.restingHR)) },
  ]

  const hasTodayData = todayLog != null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Activity className="w-7 h-7 text-green-400" />
            Health Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Unified daily vitals &amp; 7-day trends</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => saveSettings({ weightUnit: settings.weightUnit === 'lbs' ? 'kg' : 'lbs' })}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs border border-slate-700 transition-colors"
          >
            {settings.weightUnit}
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {hasTodayData ? 'Update Today' : 'Log Today'}
          </button>
        </div>
      </div>

      {/* Health Score */}
      {healthScore != null && (
        <div className="game-card p-4 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-2 flex-shrink-0"
            style={{ borderColor: scoreColor, color: scoreColor, fontFamily: 'Orbitron, monospace' }}
          >
            {healthScore}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-300">Today's Health Score</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Composite of steps, active minutes, mood, energy &amp; sleep
            </div>
            <div className="w-48 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${healthScore}%`, background: scoreColor }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Log Form */}
      {showForm && (
        <div className="game-card p-5 space-y-5 border border-green-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-400" />
              Daily Health Log — {today}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Steps */}
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-orange-400" /> Steps
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 8500"
                className="game-input w-full"
                value={form.steps ?? ''}
                onChange={e => setField('steps', e.target.value ? +e.target.value : null)}
              />
            </div>

            {/* Active Minutes */}
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-green-400" /> Active Minutes
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="e.g. 45"
                className="game-input w-full"
                value={form.activeMinutes ?? ''}
                onChange={e => setField('activeMinutes', e.target.value ? +e.target.value : null)}
              />
            </div>

            {/* HRV */}
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400" /> HRV (ms) <span className="text-slate-600">optional</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 55"
                className="game-input w-full"
                value={form.hrv ?? ''}
                onChange={e => setField('hrv', e.target.value ? +e.target.value : null)}
              />
            </div>

            {/* Resting HR */}
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Heart className="w-3.5 h-3.5 text-red-400" /> Resting HR (bpm)
              </label>
              <input
                type="number"
                min="30"
                max="200"
                step="1"
                placeholder="e.g. 62"
                className="game-input w-full"
                value={form.restingHR ?? ''}
                onChange={e => setField('restingHR', e.target.value ? +e.target.value : null)}
              />
            </div>

            {/* Weight */}
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Weight ({settings.weightUnit})
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder={settings.weightUnit === 'lbs' ? 'e.g. 165' : 'e.g. 75'}
                className="game-input w-full"
                value={form.weight ?? ''}
                onChange={e => setField('weight', e.target.value ? +e.target.value : null)}
              />
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep Hours
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="e.g. 7.5"
                className="game-input w-full"
                value={form.sleepHours ?? ''}
                onChange={e => setField('sleepHours', e.target.value ? +e.target.value : null)}
              />
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              <Zap className="w-3.5 h-3.5 text-yellow-400 inline mr-1" />
              Mood (1–5)
            </label>
            <RatingPicker
              value={form.mood}
              max={5}
              colors={MOOD_COLORS}
              labels={MOOD_LABELS}
              onChange={v => setField('mood', v)}
            />
          </div>

          {/* Energy */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              <Zap className="w-3.5 h-3.5 text-green-400 inline mr-1" />
              Energy (1–5)
            </label>
            <RatingPicker
              value={form.energy}
              max={5}
              colors={ENERGY_COLORS}
              labels={ENERGY_LABELS}
              onChange={v => setField('energy', v)}
            />
          </div>

          {/* Pain */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Pain / Discomfort</label>
            <div className="flex gap-2">
              {PAIN_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setField('pain', o.value)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    background: form.pain === o.value ? `${o.color}22` : '#0f172a',
                    color: form.pain === o.value ? o.color : '#475569',
                    borderColor: form.pain === o.value ? o.color : '#1e293b',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveLog}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Save Health Log
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-slate-700 text-slate-400 rounded-xl text-sm transition-colors hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Today's Metric Cards */}
      {hasTodayData && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Today's Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              icon={<Dumbbell className="w-4 h-4" />}
              label="Steps"
              value={todayLog?.steps?.toLocaleString() ?? null}
              color="#f97316"
              trend={stepsTrend}
            />
            <MetricCard
              icon={<Activity className="w-4 h-4" />}
              label="Active Min"
              value={todayLog?.activeMinutes ?? null}
              unit="min"
              color="#22c55e"
              trend={activeTrend}
            />
            <MetricCard
              icon={<Moon className="w-4 h-4" />}
              label="Sleep"
              value={todayLog?.sleepHours ?? null}
              unit="hrs"
              color="#818cf8"
              trend={sleepTrend}
            />
            <MetricCard
              icon={<Heart className="w-4 h-4" />}
              label="Resting HR"
              value={todayLog?.restingHR ?? null}
              unit="bpm"
              color="#f43f5e"
              trend={hrTrend}
            />
            <MetricCard
              icon={<Heart className="w-4 h-4" />}
              label="HRV"
              value={todayLog?.hrv ?? null}
              unit="ms"
              color="#ec4899"
              trend={hrvTrend}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label={`Weight (${settings.weightUnit})`}
              value={todayLog?.weight ?? null}
              color="#38bdf8"
              trend={weightTrend}
            />
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Mood"
              value={todayLog?.mood != null ? `${todayLog.mood}/5 ${MOOD_LABELS[todayLog.mood]}` : null}
              color={todayLog?.mood != null ? MOOD_COLORS[todayLog.mood] : '#64748b'}
              trend={moodTrend}
            />
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Energy"
              value={todayLog?.energy != null ? `${todayLog.energy}/5 ${ENERGY_LABELS[todayLog.energy]}` : null}
              color={todayLog?.energy != null ? ENERGY_COLORS[todayLog.energy] : '#64748b'}
              trend={energyTrend}
            />
          </div>

          {/* Pain badge */}
          {todayLog && todayLog.pain !== 'none' && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                color: PAIN_OPTIONS.find(p => p.value === todayLog.pain)?.color,
                borderColor: PAIN_OPTIONS.find(p => p.value === todayLog.pain)?.color,
                background: `${PAIN_OPTIONS.find(p => p.value === todayLog.pain)?.color}15`,
              }}
            >
              Pain: {todayLog.pain}
            </div>
          )}
        </div>
      )}

      {/* 7-Day Trends Panel */}
      <div className="game-card p-5">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          7-Day Trends
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Steps', values: stepsTrend, maxVal: 12000, color: '#f97316' },
            { label: 'Active Min', values: activeTrend, maxVal: 60, color: '#22c55e' },
            { label: 'Sleep (hrs)', values: sleepTrend, maxVal: 10, color: '#818cf8' },
            { label: 'Resting HR', values: hrTrend, maxVal: 120, color: '#f43f5e' },
            { label: 'Mood', values: moodTrend, maxVal: 5, color: '#eab308' },
            { label: 'Energy', values: energyTrend, maxVal: 5, color: '#22d3ee' },
          ].map(({ label, values, maxVal, color }) => (
            <div key={label} className="bg-slate-800/60 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-2">{label}</div>
              <MiniBarChart values={values} maxVal={maxVal} color={color} />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                {last7Dates.map((d, i) => (
                  <span key={d}>{i === 0 ? '7d' : i === last7Dates.length - 1 ? 'today' : ''}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="game-card p-5">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Weekly Summary vs. Prior Week
        </h2>
        <div className="space-y-2">
          {weeklySummary.map(({ label, current, prior }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
            >
              <span className="text-sm text-slate-400 w-24">{label}</span>
              <span className="text-sm font-mono text-slate-300">
                {current != null ? current.toFixed(1) : '—'}
              </span>
              <span className="text-sm font-mono text-slate-500">
                vs {prior != null ? prior.toFixed(1) : '—'}
              </span>
              <CompareArrow current={current} prior={prior} />
            </div>
          ))}
        </div>
        {weeklySummary.every(m => m.current == null) && (
          <p className="text-xs text-slate-600 text-center mt-2">Log daily vitals to see weekly comparisons.</p>
        )}
      </div>

      {/* Empty state */}
      {!hasTodayData && !showForm && (
        <div className="text-center py-14 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No data logged yet for today.</p>
          <p className="text-sm mb-5 text-slate-600">Track your daily vitals to see trends and your health score.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log Today's Health
          </button>
        </div>
      )}
    </div>
  )
}
