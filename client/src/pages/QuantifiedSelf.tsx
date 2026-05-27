import { useEffect, useState } from 'react'
import { Activity, Heart, Zap, Brain, Target, TrendingUp, Plus, Trash2, Save, BarChart3, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface DailyMetrics {
  id: string
  date: string
  hrv: number | null
  restingHR: number | null
  weight: number | null
  energyLevel: number | null
  focusScore: number | null
  moodScore: number | null
  readiness: number | null
  notes: string
}

interface MetricsConfig {
  weightUnit: 'kg' | 'lbs'
  showHRV: boolean
  showWeight: boolean
  targetHRV: number
  targetWeight: number
}

const STORAGE_KEY = 'quantified_self_metrics'
const LOG_STORAGE_KEY = 'quantified_self_log'

const DEFAULT_CONFIG: MetricsConfig = {
  weightUnit: 'kg',
  showHRV: true,
  showWeight: true,
  targetHRV: 60,
  targetWeight: 75,
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null)
  if (valid.length === 0) return null
  return +(valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(1)
}

function computeReadiness(entry: DailyMetrics, targetHRV: number): number | null {
  const e = entry.energyLevel
  const f = entry.focusScore
  const m = entry.moodScore
  const h = entry.hrv
  if (e === null && f === null && m === null) return null
  const scores: number[] = []
  if (e !== null) scores.push(e)
  if (f !== null) scores.push(f)
  if (m !== null) scores.push(m)
  if (h !== null) scores.push(h > targetHRV ? 10 : 5)
  return +(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)
}

function readinessColor(r: number): string {
  if (r >= 8) return 'text-green-400'
  if (r >= 6) return 'text-yellow-400'
  return 'text-red-400'
}

function trendArrow(cur: number | null, prev: number | null): string {
  if (cur === null || prev === null) return '→'
  const diff = cur - prev
  if (diff > 0.3) return '↑'
  if (diff < -0.3) return '↓'
  return '→'
}

function trendColor(arrow: string): string {
  if (arrow === '↑') return 'text-green-400'
  if (arrow === '↓') return 'text-red-400'
  return 'text-slate-400'
}

interface MiniLineChartProps {
  data: (number | null)[]
  color: string
  label: string
  unit?: string
}

function MiniLineChart({ data, color, label, unit = '' }: MiniLineChartProps) {
  const valid = data.filter((d): d is number => d !== null)
  const W = 200
  const H = 60
  const pad = 8

  if (valid.length < 2) {
    return (
      <div className="game-card p-3">
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="flex items-center justify-center h-16 text-slate-700 text-xs">No data</div>
      </div>
    )
  }

  const minV = Math.min(...valid)
  const maxV = Math.max(...valid)
  const range = maxV - minV || 1

  const points = data.map((d, i) => {
    if (d === null) return null
    const x = pad + (i / (data.length - 1)) * (W - pad * 2)
    const y = H - pad - ((d - minV) / range) * (H - pad * 2)
    return { x, y, v: d }
  }).filter((p): p is { x: number; y: number; v: number } => p !== null)

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  const last = valid[valid.length - 1]

  return (
    <div className="game-card p-3">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-bold" style={{ color }}>{last}{unit}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '60px' }}>
        <defs>
          <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline
          points={[
            `${points[0].x},${H - pad}`,
            polyline,
            `${points[points.length - 1].x},${H - pad}`,
          ].join(' ')}
          fill={`url(#grad-${label.replace(/\s+/g, '')})`}
          stroke="none"
        />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color}>
            <title>{p.v}{unit}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

type FormFields = {
  date: string
  hrv: string
  restingHR: string
  weight: string
  energyLevel: string
  focusScore: string
  moodScore: string
  readiness: string
  notes: string
}

export default function QuantifiedSelf() {
  const { toastSuccess } = useToast()

  const today = new Date().toISOString().split('T')[0]

  const [config, setConfig] = useState<MetricsConfig>(DEFAULT_CONFIG)
  const [entries, setEntries] = useState<DailyMetrics[]>([])
  const [showConfig, setShowConfig] = useState(false)

  const emptyForm: FormFields = {
    date: today,
    hrv: '',
    restingHR: '',
    weight: '',
    energyLevel: '',
    focusScore: '',
    moodScore: '',
    readiness: '',
    notes: '',
  }

  const [form, setForm] = useState<FormFields>(emptyForm)

  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY)
    if (savedConfig) {
      try { setConfig(JSON.parse(savedConfig)) } catch { /* ignore */ }
    }
    const savedLog = localStorage.getItem(LOG_STORAGE_KEY)
    if (savedLog) {
      try { setEntries(JSON.parse(savedLog)) } catch { /* ignore */ }
    }
  }, [])

  const saveConfig = (c: MetricsConfig) => {
    setConfig(c)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
  }

  const parseNum = (s: string): number | null => {
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  const saveEntry = () => {
    const entry: DailyMetrics = {
      id: Date.now().toString(),
      date: form.date,
      hrv: parseNum(form.hrv),
      restingHR: parseNum(form.restingHR),
      weight: parseNum(form.weight),
      energyLevel: parseNum(form.energyLevel),
      focusScore: parseNum(form.focusScore),
      moodScore: parseNum(form.moodScore),
      readiness: parseNum(form.readiness),
      notes: form.notes,
    }
    const updated = [entry, ...entries].sort((a, b) => b.date.localeCompare(a.date))
    setEntries(updated)
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated))
    setForm({ ...emptyForm, date: today })
    toastSuccess("Metrics saved!", `Logged for ${form.date}`)
  }

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated))
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  // Readiness for today/most recent
  const latestEntry = sorted[0]
  const latestReadiness = latestEntry ? computeReadiness(latestEntry, config.targetHRV) : null

  // Stats: 7d avg vs prev 7d
  const last7 = sorted.slice(0, 7)
  const prev7 = sorted.slice(7, 14)

  const avg7Energy = avg(last7.map(e => e.energyLevel))
  const avg7Focus = avg(last7.map(e => e.focusScore))
  const avg7HRV = avg(last7.map(e => e.hrv))
  const avg7Mood = avg(last7.map(e => e.moodScore))

  const prevAvgEnergy = avg(prev7.map(e => e.energyLevel))
  const prevAvgFocus = avg(prev7.map(e => e.focusScore))
  const prevAvgHRV = avg(prev7.map(e => e.hrv))

  const arrowEnergy = trendArrow(avg7Energy, prevAvgEnergy)
  const arrowFocus = trendArrow(avg7Focus, prevAvgFocus)
  const arrowHRV = trendArrow(avg7HRV, prevAvgHRV)

  // Chart data
  const last14 = sorted.slice(0, 14).reverse()
  const last30 = sorted.slice(0, 30).reverse()

  const energyData = last14.map(e => e.energyLevel)
  const focusData = last14.map(e => e.focusScore)
  const hrvData = last14.map(e => e.hrv)
  const weightData = last30.map(e => e.weight)

  // Computed form readiness preview
  const formReadiness = computeReadiness(
    {
      id: '',
      date: form.date,
      hrv: parseNum(form.hrv),
      restingHR: null,
      weight: null,
      energyLevel: parseNum(form.energyLevel),
      focusScore: parseNum(form.focusScore),
      moodScore: parseNum(form.moodScore),
      readiness: null,
      notes: '',
    },
    config.targetHRV
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              Quantified Self
            </h1>
            <p className="text-slate-400 text-sm">Biohacking metrics dashboard</p>
          </div>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Config
        </button>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="game-card p-4 space-y-4 border border-cyan-500/20">
          <h3 className="font-semibold text-slate-300 text-sm">Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Weight Unit</label>
              <div className="flex gap-2">
                {(['kg', 'lbs'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => saveConfig({ ...config, weightUnit: u })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${config.weightUnit === u ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target HRV (ms)</label>
              <input
                type="number"
                value={config.targetHRV}
                onChange={e => saveConfig({ ...config, targetHRV: parseFloat(e.target.value) || 0 })}
                className="game-input w-full"
                min="20"
                max="200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Weight ({config.weightUnit})</label>
              <input
                type="number"
                value={config.targetWeight}
                onChange={e => saveConfig({ ...config, targetWeight: parseFloat(e.target.value) || 0 })}
                className="game-input w-full"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">Show Metrics</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showHRV}
                  onChange={e => saveConfig({ ...config, showHRV: e.target.checked })}
                  className="accent-cyan-500"
                />
                <span className="text-sm text-slate-400">HRV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showWeight}
                  onChange={e => saveConfig({ ...config, showWeight: e.target.checked })}
                  className="accent-cyan-500"
                />
                <span className="text-sm text-slate-400">Weight</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Readiness score */}
      {latestReadiness !== null && (
        <div className="game-card p-5 flex items-center gap-6 border border-cyan-500/20">
          <div className="text-center">
            <div className={`text-5xl font-bold ${readinessColor(latestReadiness)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {latestReadiness}
            </div>
            <div className="text-xs text-slate-500 mt-1">Readiness Score</div>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="text-sm text-slate-400">
              Based on energy, focus, mood{latestEntry?.hrv !== null ? ', and HRV' : ''}
            </div>
            <div className="text-xs text-slate-500">Last logged: {latestEntry?.date}</div>
            {latestReadiness >= 8 && <div className="text-xs text-green-400 font-medium">Optimal — push hard today</div>}
            {latestReadiness >= 6 && latestReadiness < 8 && <div className="text-xs text-yellow-400 font-medium">Moderate — steady training</div>}
            {latestReadiness < 6 && <div className="text-xs text-red-400 font-medium">Low — prioritize recovery</div>}
          </div>
          <Target className={`w-8 h-8 flex-shrink-0 ${readinessColor(latestReadiness)}`} />
        </div>
      )}

      {/* Today's metrics form */}
      <div className="game-card p-5 space-y-4 border border-purple-500/20">
        <h2 className="font-semibold text-slate-300 flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-400" />
          Log Today's Metrics
        </h2>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-48 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {config.showHRV && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400" />
                HRV (ms)
              </label>
              <input
                type="number"
                value={form.hrv}
                onChange={e => setForm(f => ({ ...f, hrv: e.target.value }))}
                placeholder="e.g. 65"
                className="game-input w-full"
                min="0"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-400" />
              Resting HR (bpm)
            </label>
            <input
              type="number"
              value={form.restingHR}
              onChange={e => setForm(f => ({ ...f, restingHR: e.target.value }))}
              placeholder="e.g. 58"
              className="game-input w-full"
              min="30"
            />
          </div>
          {config.showWeight && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-orange-400" />
                Weight ({config.weightUnit})
              </label>
              <input
                type="number"
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                placeholder={config.weightUnit === 'kg' ? 'e.g. 74.5' : 'e.g. 164'}
                className="game-input w-full"
                step="0.1"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              Energy Level (1–10)
            </label>
            <input
              type="number"
              value={form.energyLevel}
              onChange={e => setForm(f => ({ ...f, energyLevel: e.target.value }))}
              placeholder="7"
              className="game-input w-full"
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
              <Brain className="w-3 h-3 text-blue-400" />
              Focus Score (1–10)
            </label>
            <input
              type="number"
              value={form.focusScore}
              onChange={e => setForm(f => ({ ...f, focusScore: e.target.value }))}
              placeholder="7"
              className="game-input w-full"
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-400" />
              Mood Score (1–10)
            </label>
            <input
              type="number"
              value={form.moodScore}
              onChange={e => setForm(f => ({ ...f, moodScore: e.target.value }))}
              placeholder="7"
              className="game-input w-full"
              min="1"
              max="10"
            />
          </div>
        </div>

        {/* Readiness preview */}
        {formReadiness !== null && (
          <div className={`text-sm flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 ${readinessColor(formReadiness)}`}>
            <Target className="w-4 h-4" />
            <span>Computed readiness: <strong>{formReadiness}/10</strong></span>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="How do you feel? Any observations..."
            className="game-input w-full text-sm resize-none"
            rows={2}
          />
        </div>

        <button
          onClick={saveEntry}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Metrics
        </button>
      </div>

      {/* Stats cards */}
      {last7.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-slate-500">7d Energy</span>
            </div>
            <div className="text-xl font-bold text-yellow-400">{avg7Energy ?? '—'}</div>
            <div className={`text-sm mt-0.5 ${trendColor(arrowEnergy)}`}>{arrowEnergy}</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Brain className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-slate-500">7d Focus</span>
            </div>
            <div className="text-xl font-bold text-blue-400">{avg7Focus ?? '—'}</div>
            <div className={`text-sm mt-0.5 ${trendColor(arrowFocus)}`}>{arrowFocus}</div>
          </div>
          {config.showHRV && (
            <div className="game-card p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-slate-500">7d HRV</span>
              </div>
              <div className="text-xl font-bold text-red-400">{avg7HRV ?? '—'}</div>
              <div className={`text-sm mt-0.5 ${trendColor(arrowHRV)}`}>{arrowHRV}</div>
            </div>
          )}
          {!config.showHRV && (
            <div className="game-card p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-slate-500">7d Mood</span>
              </div>
              <div className="text-xl font-bold text-green-400">{avg7Mood ?? '—'}</div>
            </div>
          )}
        </div>
      )}

      {/* Trend charts */}
      {sorted.length > 1 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trend Charts
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MiniLineChart data={energyData} color="#eab308" label="Energy (14d)" unit="/10" />
            <MiniLineChart data={focusData} color="#3b82f6" label="Focus (14d)" unit="/10" />
            {config.showHRV && (
              <MiniLineChart data={hrvData} color="#ef4444" label="HRV (14d)" unit="ms" />
            )}
            {config.showWeight && (
              <MiniLineChart data={weightData} color="#f97316" label={`Weight (30d)`} unit={config.weightUnit} />
            )}
            {!config.showHRV && (
              <MiniLineChart data={last14.map(e => e.moodScore)} color="#22c55e" label="Mood (14d)" unit="/10" />
            )}
            {!config.showWeight && (
              <MiniLineChart data={last14.map(e => e.moodScore)} color="#22c55e" label="Mood (14d)" unit="/10" />
            )}
          </div>
        </div>
      )}

      {/* Recent log table */}
      {sorted.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-600 border-b border-slate-800">
                  <th className="text-left py-1.5 pr-3 font-medium">Date</th>
                  <th className="text-right py-1.5 pr-3 font-medium">HRV</th>
                  <th className="text-right py-1.5 pr-3 font-medium">RHR</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Wt</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Nrg</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Fcs</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Mood</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Ready</th>
                  <th className="py-1.5" />
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 10).map(entry => {
                  const r = computeReadiness(entry, config.targetHRV)
                  return (
                    <tr key={entry.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20">
                      <td className="py-1.5 pr-3 text-slate-400 whitespace-nowrap">{entry.date}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-300">{entry.hrv ?? '—'}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-300">{entry.restingHR ?? '—'}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-300">{entry.weight ?? '—'}</td>
                      <td className={`py-1.5 pr-3 text-right font-medium ${entry.energyLevel !== null && entry.energyLevel >= 7 ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {entry.energyLevel ?? '—'}
                      </td>
                      <td className={`py-1.5 pr-3 text-right font-medium ${entry.focusScore !== null && entry.focusScore >= 7 ? 'text-blue-400' : 'text-slate-300'}`}>
                        {entry.focusScore ?? '—'}
                      </td>
                      <td className={`py-1.5 pr-3 text-right font-medium ${entry.moodScore !== null && entry.moodScore >= 7 ? 'text-green-400' : 'text-slate-300'}`}>
                        {entry.moodScore ?? '—'}
                      </td>
                      <td className={`py-1.5 pr-3 text-right font-bold ${r !== null ? readinessColor(r) : 'text-slate-500'}`}>
                        {r ?? '—'}
                        {r !== null && r >= 8 && <ChevronUp className="inline w-3 h-3 ml-0.5" />}
                        {r !== null && r < 6 && <ChevronDown className="inline w-3 h-3 ml-0.5" />}
                      </td>
                      <td className="py-1.5">
                        <button onClick={() => deleteEntry(entry.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No metrics logged yet. Start tracking your biohacking data!</p>
        </div>
      )}
    </div>
  )
}
