import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { Activity, Droplets, Moon, Footprints, Zap, Save, TrendingUp } from 'lucide-react'

interface Metric {
  id: number
  date: string
  weight: number | null
  sleep_hours: number | null
  water_glasses: number | null
  steps: number | null
  energy: number | null
  notes: string | null
}

interface DraftMetric {
  weight: string
  sleep_hours: string
  water_glasses: string
  steps: string
  energy: number
  notes: string
}

const today = new Date().toISOString().split('T')[0]

function MiniSparkline({ data, color, maxVal }: { data: (number | null)[], color: string, maxVal: number }) {
  const pts = data.slice(-14)
  const w = 100, h = 32
  if (pts.every(v => v == null)) return <div className="text-xs text-slate-600">no data</div>
  const valid = pts.map(v => v ?? 0)
  const min = Math.min(...valid.filter(Boolean))
  const max = maxVal || Math.max(...valid) || 1
  const points = valid.map((v, i) => {
    const x = (i / (pts.length - 1)) * w
    const y = h - ((v - min) / (max - min + 0.01)) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {valid[valid.length - 1] > 0 && (
        <circle
          cx={(valid.length - 1) / (pts.length - 1) * w}
          cy={h - ((valid[valid.length - 1] - min) / (max - min + 0.01)) * (h - 4) - 2}
          r="3" fill={color}
        />
      )}
    </svg>
  )
}

function WaterGlasses({ count, onChange }: { count: number, onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: 10 }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i < count ? i : i + 1)}
          className={`text-xl transition-all hover:scale-110 ${i < count ? 'opacity-100' : 'opacity-20'}`}
        >
          💧
        </button>
      ))}
    </div>
  )
}

function EnergyBar({ value, onChange }: { value: number, onChange: (n: number) => void }) {
  const labels = ['💀', '😴', '😐', '😊', '⚡', '🔥']
  return (
    <div className="flex gap-2">
      {labels.map((emoji, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`flex-1 py-2 rounded-lg text-lg transition-all hover:scale-110 ${
            value === i ? 'bg-violet-600/40 border border-violet-500 scale-105' : 'bg-slate-800 border border-slate-700'
          }`}
          title={['Exhausted', 'Tired', 'Neutral', 'Good', 'Energized', 'On Fire!'][i]}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export default function BodyMetrics() {
  const [history, setHistory] = useState<Metric[]>([])
  const [todayData, setTodayData] = useState<Metric | null>(null)
  const [draft, setDraft] = useState<DraftMetric>({
    weight: '', sleep_hours: '', water_glasses: '', steps: '', energy: 3, notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [histRes, todayRes] = await Promise.all([
      axios.get<Metric[]>('/api/metrics/history'),
      axios.get<Metric | null>(`/api/metrics/${today}`),
    ])
    setHistory(histRes.data)
    const t = todayRes.data
    setTodayData(t)
    if (t) {
      setDraft({
        weight: t.weight != null ? String(t.weight) : '',
        sleep_hours: t.sleep_hours != null ? String(t.sleep_hours) : '',
        water_glasses: t.water_glasses != null ? String(t.water_glasses) : '',
        steps: t.steps != null ? String(t.steps) : '',
        energy: t.energy ?? 3,
        notes: t.notes ?? '',
      })
    }
  }

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)) }, [])

  const save = async () => {
    setSaving(true)
    try {
      await axios.put(`/api/metrics/${today}`, {
        weight: draft.weight ? parseFloat(draft.weight) : null,
        sleep_hours: draft.sleep_hours ? parseFloat(draft.sleep_hours) : null,
        water_glasses: draft.water_glasses ? parseInt(draft.water_glasses) : null,
        steps: draft.steps ? parseInt(draft.steps) : null,
        energy: draft.energy,
        notes: draft.notes || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await load()
    } finally { setSaving(false) }
  }

  const chartData = useMemo(() => {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
    return {
      weight: sorted.map(m => m.weight),
      sleep: sorted.map(m => m.sleep_hours),
      water: sorted.map(m => m.water_glasses),
      steps: sorted.map(m => m.steps),
      energy: sorted.map(m => m.energy),
    }
  }, [history])

  const avg = (arr: (number | null)[]) => {
    const vals = arr.filter((v): v is number => v != null)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Activity className="w-8 h-8 text-green-400" />
          Body Metrics
        </h1>
        <p className="text-slate-400 mt-1">Track health vitals daily — body and mind in sync</p>
      </div>

      {/* Today's entry */}
      <div className="game-card p-5 space-y-5">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          Today's Check-in
          <span className="text-xs text-slate-500 font-normal">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weight */}
          <div>
            <label className="text-sm text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Activity className="w-3.5 h-3.5" /> Weight (kg / lbs)
            </label>
            <input
              type="number"
              step="0.1"
              className="game-input w-full"
              placeholder="e.g. 72.5"
              value={draft.weight}
              onChange={e => setDraft(d => ({ ...d, weight: e.target.value }))}
            />
          </div>

          {/* Sleep */}
          <div>
            <label className="text-sm text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Moon className="w-3.5 h-3.5" /> Sleep (hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              className="game-input w-full"
              placeholder="e.g. 7.5"
              value={draft.sleep_hours}
              onChange={e => setDraft(d => ({ ...d, sleep_hours: e.target.value }))}
            />
          </div>

          {/* Steps */}
          <div>
            <label className="text-sm text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Footprints className="w-3.5 h-3.5" /> Steps
            </label>
            <input
              type="number"
              step="100"
              min="0"
              className="game-input w-full"
              placeholder="e.g. 8000"
              value={draft.steps}
              onChange={e => setDraft(d => ({ ...d, steps: e.target.value }))}
            />
          </div>

          {/* Water */}
          <div>
            <label className="text-sm text-slate-400 flex items-center gap-1.5 mb-2">
              <Droplets className="w-3.5 h-3.5" /> Water ({draft.water_glasses || 0}/10 glasses)
            </label>
            <WaterGlasses
              count={parseInt(draft.water_glasses) || 0}
              onChange={n => setDraft(d => ({ ...d, water_glasses: String(n) }))}
            />
          </div>
        </div>

        {/* Energy level */}
        <div>
          <label className="text-sm text-slate-400 flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5" /> Energy Level
          </label>
          <EnergyBar value={draft.energy} onChange={n => setDraft(d => ({ ...d, energy: n }))} />
          <div className="text-center text-xs text-slate-500 mt-1">
            {['Exhausted', 'Tired', 'Neutral', 'Good', 'Energized', 'On Fire!'][draft.energy]}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-slate-400 block mb-1.5">Notes (optional)</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="How are you feeling today?"
            value={draft.notes}
            onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
            saved ? 'bg-green-600 border border-green-500' : 'bg-violet-600 hover:bg-violet-500 border border-violet-500'
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Today\'s Metrics'}
        </button>
      </div>

      {/* 30-day trends */}
      {history.length > 1 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            30-Day Trends
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Weight trend */}
            {chartData.weight.some(v => v != null) && (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-slate-400">Weight</span>
                </div>
                <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {todayData?.weight != null ? `${todayData.weight}` : '—'}
                </div>
                <div className="text-xs text-slate-500 mb-2">avg {avg(chartData.weight)?.toFixed(1) ?? '—'}</div>
                <MiniSparkline data={chartData.weight} color="#22c55e" maxVal={0} />
              </div>
            )}

            {/* Sleep trend */}
            {chartData.sleep.some(v => v != null) && (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-slate-400">Sleep</span>
                </div>
                <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {todayData?.sleep_hours != null ? `${todayData.sleep_hours}h` : '—'}
                </div>
                <div className="text-xs text-slate-500 mb-2">avg {avg(chartData.sleep)?.toFixed(1) ?? '—'}h</div>
                <MiniSparkline data={chartData.sleep} color="#22d3ee" maxVal={12} />
              </div>
            )}

            {/* Water trend */}
            {chartData.water.some(v => v != null) && (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-slate-400">Water</span>
                </div>
                <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {todayData?.water_glasses != null ? `${todayData.water_glasses} 💧` : '—'}
                </div>
                <div className="text-xs text-slate-500 mb-2">avg {avg(chartData.water)?.toFixed(1) ?? '—'} glasses</div>
                <MiniSparkline data={chartData.water} color="#60a5fa" maxVal={10} />
              </div>
            )}

            {/* Steps trend */}
            {chartData.steps.some(v => v != null) && (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Footprints className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs text-slate-400">Steps</span>
                </div>
                <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {todayData?.steps != null ? `${todayData.steps.toLocaleString()}` : '—'}
                </div>
                <div className="text-xs text-slate-500 mb-2">avg {avg(chartData.steps)?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '—'}</div>
                <MiniSparkline data={chartData.steps} color="#fb923c" maxVal={0} />
              </div>
            )}

            {/* Energy trend */}
            {chartData.energy.some(v => v != null) && (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs text-slate-400">Energy</span>
                </div>
                <div className="text-lg font-bold text-slate-200">
                  {todayData?.energy != null ? ['💀', '😴', '😐', '😊', '⚡', '🔥'][todayData.energy] : '—'}
                </div>
                <div className="text-xs text-slate-500 mb-2">avg {avg(chartData.energy)?.toFixed(1) ?? '—'}/5</div>
                <MiniSparkline data={chartData.energy} color="#facc15" maxVal={5} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* History table */}
      {history.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3">Recent Entries</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left pb-2">Date</th>
                  <th className="text-center pb-2">⚖️</th>
                  <th className="text-center pb-2">🌙</th>
                  <th className="text-center pb-2">💧</th>
                  <th className="text-center pb-2">👟</th>
                  <th className="text-center pb-2">⚡</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 14).map(m => (
                  <tr key={m.date} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="py-1.5 text-slate-400">{m.date === today ? 'Today' : m.date.slice(5)}</td>
                    <td className="text-center text-slate-300">{m.weight ?? '—'}</td>
                    <td className="text-center text-slate-300">{m.sleep_hours != null ? `${m.sleep_hours}h` : '—'}</td>
                    <td className="text-center text-slate-300">{m.water_glasses ?? '—'}</td>
                    <td className="text-center text-slate-300">{m.steps != null ? m.steps.toLocaleString() : '—'}</td>
                    <td className="text-center">{m.energy != null ? ['💀', '😴', '😐', '😊', '⚡', '🔥'][m.energy] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-3">📊</div>
          <p>Start tracking today — trends appear after a few days.</p>
        </div>
      )}
    </div>
  )
}
