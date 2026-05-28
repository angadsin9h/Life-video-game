import { useEffect, useState } from 'react'
import axios from 'axios'
import { Dumbbell, TrendingUp, Calendar, Flame, Target, Clock } from 'lucide-react'

interface Workout {
  id: number
  date: string
  type: string
  duration_minutes: number
  exercises?: string
  notes?: string
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  strength: '#f97316',
  cardio: '#22c55e',
  yoga: '#8b5cf6',
  hiit: '#ef4444',
  stretching: '#14b8a6',
  cycling: '#3b82f6',
  running: '#eab308',
  swimming: '#06b6d4',
  other: '#94a3b8',
}

export default function WorkoutAnalytics() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | '3months' | 'year'>('month')

  useEffect(() => {
    axios.get('/api/workouts?limit=500').then(r => {
      setWorkouts(r.data as Workout[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const cutoff = new Date(now)
  if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1)
  else if (period === '3months') cutoff.setMonth(cutoff.getMonth() - 3)
  else cutoff.setFullYear(cutoff.getFullYear() - 1)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filtered = workouts.filter(w => w.date >= cutoffStr)
  const totalWorkouts = filtered.length
  const totalMinutes = filtered.reduce((s, w) => s + (w.duration_minutes || 0), 0)
  const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0
  const daysInPeriod = period === 'month' ? 30 : period === '3months' ? 90 : 365
  const workoutsPerWeek = ((totalWorkouts / daysInPeriod) * 7).toFixed(1)

  // By type
  const byType: Record<string, { count: number; minutes: number }> = {}
  for (const w of filtered) {
    const t = w.type || 'other'
    if (!byType[t]) byType[t] = { count: 0, minutes: 0 }
    byType[t].count++
    byType[t].minutes += w.duration_minutes || 0
  }
  const typeList = Object.entries(byType).map(([type, v]) => ({ type, ...v })).sort((a, b) => b.count - a.count)

  // Streak
  const dateSet = new Set(workouts.map(w => w.date))
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (dateSet.has(d.toISOString().split('T')[0])) streak++
    else if (i > 0) break
  }

  // Monthly bars (last 6 months)
  const months: { label: string; key: string; count: number; minutes: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en', { month: 'short' })
    const wks = workouts.filter(w => w.date?.startsWith(key))
    months.push({ label, key, count: wks.length, minutes: wks.reduce((s, w) => s + (w.duration_minutes || 0), 0) })
  }
  const maxCount = Math.max(...months.map(m => m.count), 1)

  // Weekly pattern (day of week)
  const dowCounts = [0, 0, 0, 0, 0, 0, 0]
  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (const w of filtered) {
    const dow = new Date(w.date + 'T12:00:00').getDay()
    dowCounts[dow]++
  }
  const maxDow = Math.max(...dowCounts, 1)

  // Recent workouts
  const recent = [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Dumbbell className="w-7 h-7 text-orange-400" />
            Workout Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your fitness consistency</p>
        </div>
        <div className="flex gap-1">
          {(['month', '3months', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              {p === '3months' ? '3M' : p === 'month' ? '1M' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Workouts', value: totalWorkouts, icon: Dumbbell, color: 'text-orange-400' },
          { label: 'Total Hours', value: `${(totalMinutes / 60).toFixed(1)}h`, icon: Clock, color: 'text-blue-400' },
          { label: 'Avg Duration', value: `${avgDuration}m`, icon: Target, color: 'text-violet-400' },
          { label: 'Per Week', value: workoutsPerWeek, icon: TrendingUp, color: 'text-green-400' },
        ].map(t => (
          <div key={t.label} className="game-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className={`text-xl font-bold ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      {streak > 0 && (
        <div className="game-card p-4 flex items-center gap-3 border border-orange-500/20 bg-orange-900/10">
          <Flame className="w-8 h-8 text-orange-400" />
          <div>
            <div className="text-lg font-bold text-orange-400">{streak}-day streak</div>
            <div className="text-xs text-slate-400">Keep it going!</div>
          </div>
        </div>
      )}

      {/* Monthly chart */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Monthly Volume
        </h3>
        <div className="flex items-end gap-2 h-28">
          {months.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-slate-500">{m.count}</div>
              <div className="w-full rounded-t-sm bg-orange-500/70 transition-all"
                style={{ height: `${(m.count / maxCount) * 80}%`, minHeight: m.count > 0 ? '4px' : 0 }} />
              <div className="text-[10px] text-slate-600">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day of week */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Best Days to Train</h3>
        <div className="flex items-end gap-1.5">
          {dowLabels.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-slate-500">{dowCounts[i]}</div>
              <div className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${(dowCounts[i] / maxDow) * 60}px`,
                  background: TYPE_COLORS.cardio,
                  opacity: dowCounts[i] === Math.max(...dowCounts) ? 1 : 0.4,
                  minHeight: dowCounts[i] > 0 ? '4px' : '2px',
                }} />
              <div className="text-[10px] text-slate-500">{label.slice(0, 2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type breakdown */}
      {typeList.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Type</h3>
          <div className="space-y-3">
            {typeList.map(t => (
              <div key={t.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{t.type}</span>
                  <span className="text-slate-500">{t.count} sessions · {Math.round(t.minutes / 60)}h</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${(t.count / totalWorkouts) * 100}%`, background: TYPE_COLORS[t.type] || '#94a3b8' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Sessions</h3>
          <div className="space-y-2">
            {recent.map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{ background: TYPE_COLORS[w.type] || '#94a3b8' }} />
                  <div>
                    <div className="text-sm text-slate-300 capitalize">{w.type}</div>
                    <div className="text-xs text-slate-600">{w.date}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">{w.duration_minutes}m</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {workouts.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No workouts yet. Log some in the Workouts page.</p>
        </div>
      )}
    </div>
  )
}
