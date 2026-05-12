import { useEffect, useState } from 'react'
import axios from 'axios'
import { Moon, TrendingUp, Clock, Star, Zap } from 'lucide-react'

interface SleepLog {
  id: number
  date: string
  bedtime: string | null
  wake_time: string | null
  duration_minutes: number
  quality: number
  notes: string | null
}

const QUALITY_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent']
const QUALITY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4']

export default function SleepAnalytics() {
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get<SleepLog[]>('/api/sleep?limit=90').then(res => setLogs(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const recent30 = logs.slice(0, 30)
  const avgHours = recent30.length > 0 ? (recent30.reduce((s, l) => s + l.duration_minutes, 0) / recent30.length / 60) : 0
  const avgQuality = recent30.length > 0 ? (recent30.reduce((s, l) => s + l.quality, 0) / recent30.length) : 0
  const goodSleepDays = recent30.filter(l => l.duration_minutes >= 420 && l.quality >= 3).length

  // Sleep debt (recommended: 8h/night)
  const recommended = 480
  const totalDebt = recent30.reduce((s, l) => s + Math.max(0, recommended - l.duration_minutes), 0)
  const sleepDebt = Math.round(totalDebt / 60)

  // Best/worst sleep
  const best = logs.reduce((b, l) => !b || (l.quality > b.quality || (l.quality === b.quality && l.duration_minutes > b.duration_minutes)) ? l : b, logs[0])
  const worst = logs.reduce((w, l) => !w || l.quality < w.quality ? l : w, logs[0])

  // Weekly averages
  const weeklyData: Array<{ week: string; avgHours: number; avgQuality: number }> = []
  for (let w = 0; w < 4; w++) {
    const weekLogs = logs.filter((_, i) => i >= w * 7 && i < (w + 1) * 7)
    if (weekLogs.length > 0) {
      weeklyData.push({
        week: `W${w + 1}`,
        avgHours: weekLogs.reduce((s, l) => s + l.duration_minutes, 0) / weekLogs.length / 60,
        avgQuality: weekLogs.reduce((s, l) => s + l.quality, 0) / weekLogs.length,
      })
    }
  }

  // Last 14 days chart
  const last14 = logs.slice(0, 14).reverse()
  const maxHours = Math.max(...last14.map(l => l.duration_minutes / 60), 10)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Moon className="w-7 h-7 text-violet-400" />
          Sleep Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Based on {logs.length} logged nights</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{avgHours.toFixed(1)}h</div>
          <div className="text-xs text-slate-500">Avg sleep</div>
          <div className="text-xs mt-0.5" style={{ color: avgHours >= 7 ? '#22c55e' : avgHours >= 6 ? '#eab308' : '#ef4444' }}>
            {avgHours >= 7 ? '✓ Optimal' : avgHours >= 6 ? '⚠ Low' : '! Critical'}
          </div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{avgQuality.toFixed(1)}/5</div>
          <div className="text-xs text-slate-500">Avg quality</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{goodSleepDays}</div>
          <div className="text-xs text-slate-500">Good nights (30d)</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className={`text-2xl font-bold ${sleepDebt > 20 ? 'text-red-400' : sleepDebt > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
            {sleepDebt}h
          </div>
          <div className="text-xs text-slate-500">Sleep debt</div>
          <div className="text-xs text-slate-600 mt-0.5">vs 8h goal (30d)</div>
        </div>
      </div>

      {/* Sleep debt indicator */}
      {sleepDebt > 0 && (
        <div className={`game-card p-3 border ${sleepDebt > 20 ? 'border-red-500/30 bg-red-900/5' : 'border-yellow-500/30 bg-yellow-900/5'}`}>
          <div className="flex items-start gap-2">
            <Zap className={`w-4 h-4 flex-shrink-0 mt-0.5 ${sleepDebt > 20 ? 'text-red-400' : 'text-yellow-400'}`} />
            <div>
              <div className={`text-sm font-semibold ${sleepDebt > 20 ? 'text-red-400' : 'text-yellow-400'}`}>
                {sleepDebt > 20 ? 'Significant sleep debt!' : 'Moderate sleep debt'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {sleepDebt > 20
                  ? `You've accumulated ${sleepDebt}h of sleep debt in the last 30 days. This significantly impacts cognition and health.`
                  : `${sleepDebt}h sleep debt. Try to add an extra 30-60 min on weekends.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last 14 days chart */}
      {last14.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Last 14 Nights</h3>
          <div className="flex items-end gap-1 h-20">
            {last14.map(l => {
              const h = l.duration_minutes / 60
              const barH = Math.max(4, (h / maxHours) * 72)
              const color = QUALITY_COLORS[l.quality] || '#334155'
              const isOptimal = h >= 7 && l.quality >= 3
              return (
                <div key={l.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full rounded-t-sm transition-all" style={{ height: `${barH}px`, backgroundColor: color }} />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-xs p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700">
                    {h.toFixed(1)}h · {QUALITY_LABELS[l.quality]}
                  </div>
                  <span className="text-[8px] text-slate-700">
                    {new Date(l.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
          {/* 8h goal line (visual guide) */}
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px flex-1 border-t border-dashed border-violet-500/30" />
            <span className="text-xs text-slate-600">8h goal</span>
            <div className="h-px flex-1 border-t border-dashed border-violet-500/30" />
          </div>
        </div>
      )}

      {/* Weekly breakdown */}
      {weeklyData.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Weekly Breakdown</h3>
          <div className="space-y-2">
            {weeklyData.map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8">{w.week}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (w.avgHours / 10) * 100)}%`, backgroundColor: w.avgHours >= 7 ? '#22c55e' : w.avgHours >= 6 ? '#eab308' : '#ef4444' }} />
                </div>
                <span className="text-xs text-slate-400 w-10 text-right">{w.avgHours.toFixed(1)}h</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <div key={s} className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: s <= Math.round(w.avgQuality) ? QUALITY_COLORS[Math.round(w.avgQuality)] : '#1e293b' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best/worst */}
      {best && worst && best.id !== worst.id && (
        <div className="grid grid-cols-2 gap-3">
          <div className="game-card p-3 border border-green-500/20 bg-green-900/5">
            <div className="text-xs text-green-400 font-semibold mb-1">🏆 Best Night</div>
            <div className="text-lg font-bold text-slate-200">{(best.duration_minutes / 60).toFixed(1)}h</div>
            <div className="text-xs text-slate-500">{QUALITY_LABELS[best.quality]} · {best.date}</div>
          </div>
          <div className="game-card p-3 border border-red-500/20 bg-red-900/5">
            <div className="text-xs text-red-400 font-semibold mb-1">⚠️ Worst Night</div>
            <div className="text-lg font-bold text-slate-200">{(worst.duration_minutes / 60).toFixed(1)}h</div>
            <div className="text-xs text-slate-500">{QUALITY_LABELS[worst.quality]} · {worst.date}</div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sleep Optimization Tips</h3>
        <div className="space-y-2 text-xs text-slate-500">
          {[
            avgHours < 7 && '⏰ Go to bed 30-60 min earlier — even small gains compound',
            avgQuality < 3 && '📱 Avoid screens 1h before bed — blue light disrupts melatonin',
            sleepDebt > 10 && '😴 Schedule a "sleep debt recovery" weekend to recalibrate',
            !avgHours && '📊 Start logging your sleep to track patterns',
            avgHours >= 7 && avgQuality >= 4 && '🌟 Excellent sleep habits! Keep your consistent schedule.',
          ].filter(Boolean).map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0">•</span>
              <span>{tip as string}</span>
            </div>
          ))}
        </div>
      </div>

      {logs.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <Moon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sleep data yet</p>
          <p className="text-xs mt-1">Start logging your sleep to see analytics</p>
        </div>
      )}
    </div>
  )
}
