import { useEffect, useState } from 'react'
import axios from 'axios'
import { Activity, TrendingUp, Scale, Droplets, Footprints, Zap } from 'lucide-react'

interface Metric {
  id: number
  date: string
  weight?: number
  sleep_hours?: number
  water_glasses?: number
  steps?: number
  energy?: number
  notes?: string
}

function Sparkline({ data, color, max }: { data: number[]; color: string; max: number }) {
  const w = 80, h = 30
  if (data.length < 2) return null
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - (data[data.length - 1] / max) * h} r="2.5" fill={color} />
    </svg>
  )
}

export default function MetricsAnalytics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/metrics/history?days=90').then(r => {
      setMetrics((r.data as Metric[]).reverse())
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const recent = metrics.slice(-30)
  const withWeight = recent.filter(m => m.weight && m.weight > 0)
  const withSleep = recent.filter(m => m.sleep_hours && m.sleep_hours > 0)
  const withWater = recent.filter(m => m.water_glasses && m.water_glasses > 0)
  const withSteps = recent.filter(m => m.steps && m.steps > 0)
  const withEnergy = recent.filter(m => m.energy && m.energy > 0)

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
  const avgWeight = avg(withWeight.map(m => m.weight!))
  const avgSleep = avg(withSleep.map(m => m.sleep_hours!))
  const avgWater = avg(withWater.map(m => m.water_glasses!))
  const avgSteps = avg(withSteps.map(m => m.steps!))
  const avgEnergy = avg(withEnergy.map(m => m.energy!))

  // Latest vs previous week trend
  const last7 = recent.slice(-7)
  const prev7 = recent.slice(-14, -7)
  const trendWeight = withWeight.length > 1
    ? (withWeight[withWeight.length - 1].weight! - withWeight[0].weight!)
    : 0

  // 30-day chart data by metric
  const days30: { date: string; weight: number; sleep: number; energy: number; water: number; steps: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    const m = metrics.find(x => x.date === date)
    days30.push({
      date,
      weight: m?.weight || 0,
      sleep: m?.sleep_hours || 0,
      energy: m?.energy || 0,
      water: m?.water_glasses || 0,
      steps: m?.steps || 0,
    })
  }

  // Max values for chart scaling
  const maxWeight = Math.max(...days30.map(d => d.weight).filter(Boolean), 1)
  const maxSteps = Math.max(...days30.map(d => d.steps).filter(Boolean), 1)

  // Energy trend heatmap (7 cols x 5 rows = 35 days)
  const energyDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (34 - i))
    const date = d.toISOString().split('T')[0]
    const m = metrics.find(x => x.date === date)
    return { date, energy: m?.energy || 0 }
  })

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Activity className="w-7 h-7 text-pink-400" />
          Body Metrics Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">30-day body & wellness trends</p>
      </div>

      {/* Summary cards with sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          {
            label: 'Avg Weight',
            value: avgWeight > 0 ? `${avgWeight.toFixed(1)} kg` : '—',
            icon: Scale,
            color: '#f97316',
            sparkData: withWeight.slice(-14).map(m => m.weight!),
            sparkMax: maxWeight,
            sub: trendWeight !== 0 ? `${trendWeight > 0 ? '+' : ''}${trendWeight.toFixed(1)} kg trend` : '',
          },
          {
            label: 'Avg Sleep',
            value: avgSleep > 0 ? `${avgSleep.toFixed(1)} h` : '—',
            icon: Zap,
            color: '#8b5cf6',
            sparkData: withSleep.slice(-14).map(m => m.sleep_hours!),
            sparkMax: 12,
            sub: avgSleep >= 7 ? 'Good range' : avgSleep > 0 ? 'Below target' : '',
          },
          {
            label: 'Avg Water',
            value: avgWater > 0 ? `${avgWater.toFixed(1)} gl` : '—',
            icon: Droplets,
            color: '#3b82f6',
            sparkData: withWater.slice(-14).map(m => m.water_glasses!),
            sparkMax: 12,
            sub: avgWater >= 8 ? 'Well hydrated' : avgWater > 0 ? 'Drink more' : '',
          },
          {
            label: 'Avg Steps',
            value: avgSteps > 0 ? `${(avgSteps / 1000).toFixed(1)}k` : '—',
            icon: Footprints,
            color: '#22c55e',
            sparkData: withSteps.slice(-14).map(m => m.steps!),
            sparkMax: maxSteps,
            sub: avgSteps >= 10000 ? 'Great activity' : avgSteps > 0 ? 'Goal: 10k' : '',
          },
          {
            label: 'Avg Energy',
            value: avgEnergy > 0 ? `${avgEnergy.toFixed(1)}/10` : '—',
            icon: Zap,
            color: '#eab308',
            sparkData: withEnergy.slice(-14).map(m => m.energy!),
            sparkMax: 10,
            sub: avgEnergy >= 7 ? 'High energy' : avgEnergy > 0 ? 'Low energy days' : '',
          },
          {
            label: 'Days Logged',
            value: withWeight.length + withSleep.length > 0 ? metrics.filter(m => m.weight || m.sleep_hours || m.energy).length : 0,
            icon: TrendingUp,
            color: '#14b8a6',
            sparkData: [],
            sparkMax: 1,
            sub: 'last 90 days',
          },
        ].map(t => (
          <div key={t.label} className="game-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className="w-4 h-4" style={{ color: t.color }} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-bold text-white">{t.value}</div>
                {t.sub && <div className="text-xs text-slate-500 mt-0.5">{t.sub}</div>}
              </div>
              {t.sparkData.length > 1 && (
                <Sparkline data={t.sparkData} color={t.color} max={t.sparkMax} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 30-day charts */}
      {days30.some(d => d.sleep > 0) && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Sleep (30 days)</h3>
          <div className="flex items-end gap-0.5 h-20">
            {days30.map((d, i) => (
              <div key={i} className="flex-1 group relative">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {d.date.slice(5)}: {d.sleep > 0 ? `${d.sleep}h` : '—'}
                </div>
                <div className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${(d.sleep / 12) * 100}%`,
                    background: d.sleep >= 7 ? '#8b5cf6' : d.sleep >= 5 ? '#eab308' : d.sleep > 0 ? '#ef4444' : 'transparent',
                    minHeight: d.sleep > 0 ? '2px' : 0,
                  }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>30 days ago</span>
            <div className="flex gap-3">
              <span className="text-purple-400">■ 7h+ good</span>
              <span className="text-yellow-400">■ 5-7h ok</span>
              <span className="text-red-400">■ &lt;5h low</span>
            </div>
            <span>today</span>
          </div>
        </div>
      )}

      {/* Energy heatmap */}
      {withEnergy.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Energy (5 weeks)</h3>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-[10px] text-slate-600 text-center">{d}</div>
            ))}
            {energyDays.map((d, i) => (
              <div key={i} className="aspect-square rounded-sm group relative"
                style={{
                  background: d.energy >= 8 ? '#22c55e' : d.energy >= 6 ? '#eab308' : d.energy >= 4 ? '#f97316' : d.energy > 0 ? '#ef4444' : '#1e293b',
                  opacity: d.energy > 0 ? 1 : 0.4,
                }}>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {d.date.slice(5)}: {d.energy > 0 ? `${d.energy}/10` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps chart */}
      {withSteps.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Steps (30 days)</h3>
          <div className="flex items-end gap-0.5 h-16">
            {days30.map((d, i) => (
              <div key={i} className="flex-1 group relative">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {d.date.slice(5)}: {d.steps > 0 ? `${d.steps.toLocaleString()}` : '—'}
                </div>
                <div className="w-full rounded-t-sm"
                  style={{
                    height: `${(d.steps / maxSteps) * 100}%`,
                    background: d.steps >= 10000 ? '#22c55e' : d.steps > 0 ? '#3b82f6' : 'transparent',
                    minHeight: d.steps > 0 ? '2px' : 0,
                  }} />
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-600 mt-1 text-center">10k step goal</div>
        </div>
      )}

      {metrics.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No metrics yet. Log some in Body Metrics.</p>
        </div>
      )}
    </div>
  )
}
