import { useEffect, useState } from 'react'
import axios from 'axios'
import { ClipboardList, TrendingUp, CheckSquare, Clock, BarChart3 } from 'lucide-react'

interface Task {
  id: number
  title: string
  category: string
  xp: number
  completed: boolean
  created_at: string
  date: string
}

const CATEGORY_COLORS: Record<string, string> = {
  work: '#3b82f6',
  health: '#22c55e',
  learning: '#8b5cf6',
  personal: '#f97316',
  social: '#ec4899',
  finance: '#eab308',
  creative: '#14b8a6',
  other: '#64748b',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TaskAnalytics() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => { load() }, [range])

  const load = async () => {
    const r = await axios.get(`/api/logs?limit=${range * 10}`)
    setTasks(r.data as Task[])
    setLoading(false)
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const cutoff = new Date(Date.now() - range * 86400000).toISOString().split('T')[0]
  const filtered = tasks.filter(t => (t.date || t.created_at?.split('T')[0] || '') >= cutoff)
  const completed = filtered.filter(t => t.completed)
  const completionRate = filtered.length > 0 ? Math.round((completed.length / filtered.length) * 100) : 0
  const totalXP = completed.reduce((s, t) => s + (t.xp || 0), 0)

  // Daily task count
  const dailyCompleted: Record<string, number> = {}
  const dailyTotal: Record<string, number> = {}
  filtered.forEach(t => {
    const d = t.date || t.created_at?.split('T')[0] || ''
    dailyTotal[d] = (dailyTotal[d] || 0) + 1
    if (t.completed) dailyCompleted[d] = (dailyCompleted[d] || 0) + 1
  })

  // Last N days for chart
  const chartDays = Math.min(range, 30)
  const dailyChart = Array.from({ length: chartDays }, (_, i) => {
    const d = new Date(Date.now() - (chartDays - 1 - i) * 86400000)
    const ds = d.toISOString().split('T')[0]
    return { date: ds, done: dailyCompleted[ds] || 0, total: dailyTotal[ds] || 0 }
  })

  // By day of week
  const byDow: Record<number, { done: number; total: number }> = { 0: { done: 0, total: 0 }, 1: { done: 0, total: 0 }, 2: { done: 0, total: 0 }, 3: { done: 0, total: 0 }, 4: { done: 0, total: 0 }, 5: { done: 0, total: 0 }, 6: { done: 0, total: 0 } }
  filtered.forEach(t => {
    const d = t.date || t.created_at?.split('T')[0] || ''
    if (!d) return
    const dow = new Date(d + 'T12:00:00').getDay()
    byDow[dow].total++
    if (t.completed) byDow[dow].done++
  })
  const dowData = Array.from({ length: 7 }, (_, i) => ({
    day: DAY_NAMES[i],
    rate: byDow[i].total > 0 ? Math.round((byDow[i].done / byDow[i].total) * 100) : 0,
    total: byDow[i].total,
  }))

  // Category breakdown
  const catMap: Record<string, { done: number; total: number }> = {}
  filtered.forEach(t => {
    const cat = t.category || 'other'
    if (!catMap[cat]) catMap[cat] = { done: 0, total: 0 }
    catMap[cat].total++
    if (t.completed) catMap[cat].done++
  })
  const cats = Object.entries(catMap).sort((a, b) => b[1].total - a[1].total)

  // Productivity score (0-100)
  const avgDailyTasks = completed.length / Math.max(1, range)
  const productivityScore = Math.min(100, Math.round(completionRate * 0.5 + Math.min(50, avgDailyTasks * 10)))

  const maxDaily = Math.max(...dailyChart.map(d => d.total), 1)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <ClipboardList className="w-7 h-7 text-blue-400" />
            Task Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Understand your productivity patterns</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === d ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <CheckSquare className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{completionRate}%</div>
          <div className="text-xs text-slate-500">Complete Rate</div>
        </div>
        <div className="game-card p-3 text-center">
          <ClipboardList className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-400">{completed.length}</div>
          <div className="text-xs text-slate-500">Tasks Done</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-violet-400">{totalXP}</div>
          <div className="text-xs text-slate-500">XP Earned</div>
        </div>
        <div className="game-card p-3 text-center">
          <BarChart3 className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{productivityScore}</div>
          <div className="text-xs text-slate-500">Prod. Score</div>
        </div>
      </div>

      {/* Daily chart */}
      {dailyChart.some(d => d.total > 0) && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Daily Task Completion</h3>
          <div className="flex items-end gap-0.5 h-24">
            {dailyChart.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                {d.total > 0 && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date.slice(5)}: {d.done}/{d.total}
                  </div>
                )}
                <div className="w-full flex flex-col justify-end" style={{ height: `${(d.total / maxDaily) * 100}%`, minHeight: d.total > 0 ? '6px' : '1px' }}>
                  <div className="w-full bg-green-500 rounded-t-sm" style={{ height: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%`, minHeight: d.done > 0 ? '3px' : '0' }} />
                  <div className="w-full bg-slate-700 rounded-b-sm" style={{ height: `${d.total > 0 ? ((d.total - d.done) / d.total) * 100 : 100}%`, opacity: 0.5 }} />
                </div>
                {i % 5 === 0 && <div className="text-[8px] text-slate-700">{d.date.slice(5)}</div>}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[11px]">
            <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 bg-green-500 rounded-sm inline-block" /> Completed</span>
            <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 bg-slate-700 rounded-sm inline-block" /> Incomplete</span>
          </div>
        </div>
      )}

      {/* Day of week */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Best Days to Work</h3>
        <div className="space-y-2">
          {dowData.sort((a, b) => b.rate - a.rate).map(d => (
            <div key={d.day} className="flex items-center gap-3">
              <div className="w-10 text-xs text-slate-400">{d.day}</div>
              <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${d.rate}%` }} />
              </div>
              <div className="w-12 text-xs text-right text-slate-500">
                {d.total > 0 ? `${d.rate}%` : '—'}
              </div>
              <div className="text-xs text-slate-600 w-12">({d.total} tasks)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {cats.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">By Category</h3>
          <div className="space-y-3">
            {cats.map(([cat, data]) => {
              const color = CATEGORY_COLORS[cat] || '#64748b'
              const rate = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium capitalize" style={{ color }}>{cat}</span>
                    <span className="text-slate-500">{data.done}/{data.total} · {rate}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${rate}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No tasks logged in this period.</p>
        </div>
      )}
    </div>
  )
}
