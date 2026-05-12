import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, CheckCircle2, Clock, TrendingUp, AlertCircle, Circle } from 'lucide-react'

interface Goal {
  id: number
  title: string
  description?: string
  category: string
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  priority: 'high' | 'medium' | 'low'
  target_date?: string
  progress: number
  created_at: string
  updated_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  health: '#22c55e',
  fitness: '#f97316',
  mind: '#8b5cf6',
  work: '#3b82f6',
  social: '#ec4899',
  finance: '#eab308',
  creative: '#f59e0b',
  spiritual: '#14b8a6',
  other: '#94a3b8',
}

const STATUS_CONFIG = {
  active:    { color: '#3b82f6', label: 'Active',    icon: Clock },
  completed: { color: '#22c55e', label: 'Completed', icon: CheckCircle2 },
  paused:    { color: '#eab308', label: 'Paused',    icon: AlertCircle },
  abandoned: { color: '#ef4444', label: 'Abandoned', icon: Circle },
}

export default function GoalAnalytics() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'overview' | 'timeline'>('overview')

  useEffect(() => {
    axios.get('/api/goals').then(r => {
      setGoals(r.data as Goal[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const active = goals.filter(g => g.status === 'active')
  const completed = goals.filter(g => g.status === 'completed')
  const overdue = active.filter(g => g.target_date && g.target_date < today)
  const highPriority = active.filter(g => g.priority === 'high')
  const avgProgress = active.length > 0 ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length) : 0

  // Category breakdown
  const byCat: Record<string, { total: number; done: number; avgProgress: number }> = {}
  for (const g of goals) {
    const c = g.category || 'other'
    if (!byCat[c]) byCat[c] = { total: 0, done: 0, avgProgress: 0 }
    byCat[c].total++
    if (g.status === 'completed') byCat[c].done++
    byCat[c].avgProgress += g.progress
  }
  const catList = Object.entries(byCat).map(([cat, v]) => ({
    cat,
    total: v.total,
    done: v.done,
    avgProgress: Math.round(v.avgProgress / v.total),
    completionRate: Math.round((v.done / v.total) * 100),
  })).sort((a, b) => b.total - a.total)

  // Monthly goal creation
  const monthlyCreation: Record<string, number> = {}
  const monthlyCompletion: Record<string, number> = {}
  for (const g of goals) {
    const m = g.created_at?.slice(0, 7)
    if (m) monthlyCreation[m] = (monthlyCreation[m] || 0) + 1
    if (g.status === 'completed') {
      const cm = g.updated_at?.slice(0, 7)
      if (cm) monthlyCompletion[cm] = (monthlyCompletion[cm] || 0) + 1
    }
  }
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0, 7))
  }
  const maxMonthVal = Math.max(...months.map(m => monthlyCreation[m] || 0), 1)

  // Upcoming deadlines
  const upcoming = active
    .filter(g => g.target_date)
    .sort((a, b) => a.target_date!.localeCompare(b.target_date!))
    .slice(0, 5)

  const daysUntil = (date: string) => {
    const diff = new Date(date + 'T12:00:00').getTime() - new Date().getTime()
    return Math.ceil(diff / 86400000)
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Goal Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your goal progress over time</p>
        </div>
        <div className="flex gap-1">
          {(['overview', 'timeline'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${view === v ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Goals', value: active.length, icon: Target, color: 'text-blue-400' },
          { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Overdue', value: overdue.length, icon: AlertCircle, color: 'text-red-400' },
          { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-violet-400' },
        ].map(t => (
          <div key={t.label} className="game-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className={`text-2xl font-bold ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      {view === 'overview' && (
        <>
          {/* Progress distribution */}
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Active Goals Progress</h3>
            {active.length === 0 ? (
              <p className="text-slate-500 text-sm">No active goals</p>
            ) : (
              <div className="space-y-3">
                {active.sort((a, b) => b.progress - a.progress).map(g => (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 truncate flex-1 mr-2">{g.title}</span>
                      <span className="text-slate-400 flex-shrink-0 flex items-center gap-1">
                        {g.priority === 'high' && <span className="text-red-400 text-xs">●</span>}
                        {g.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${g.progress}%`, background: CATEGORY_COLORS[g.category] || '#8b5cf6' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {catList.length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Category</h3>
              <div className="space-y-3">
                {catList.map(c => (
                  <div key={c.cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 capitalize">{c.cat}</span>
                      <span className="text-slate-500">{c.done}/{c.total} completed · {c.avgProgress}% avg</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${c.completionRate}%`, background: CATEGORY_COLORS[c.cat] || '#94a3b8' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming deadlines */}
          {upcoming.length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming Deadlines</h3>
              <div className="space-y-2">
                {upcoming.map(g => {
                  const days = daysUntil(g.target_date!)
                  return (
                    <div key={g.id} className={`flex items-center justify-between p-3 rounded-lg ${days <= 0 ? 'bg-red-900/20 border border-red-500/20' : days <= 7 ? 'bg-yellow-900/10 border border-yellow-500/20' : 'bg-slate-800'}`}>
                      <div>
                        <div className="text-sm text-slate-300">{g.title}</div>
                        <div className="text-xs text-slate-500 capitalize">{g.category} · {g.progress}% done</div>
                      </div>
                      <div className={`text-sm font-bold ${days <= 0 ? 'text-red-400' : days <= 7 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {days <= 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* High priority */}
          {highPriority.length > 0 && (
            <div className="game-card p-4 border border-red-500/20 bg-red-900/5">
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> High Priority
              </h3>
              {highPriority.map(g => (
                <div key={g.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <div className="flex-1">
                    <div className="text-sm text-slate-200">{g.title}</div>
                    <div className="text-xs text-slate-500">{g.progress}% complete</div>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'timeline' && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Monthly Activity (6 months)</h3>
          <div className="flex items-end gap-2">
            {months.map(m => {
              const created = monthlyCreation[m] || 0
              const done = monthlyCompletion[m] || 0
              return (
                <div key={m} className="flex-1 space-y-1">
                  <div className="flex flex-col-reverse gap-0.5 h-24">
                    <div className="w-full rounded-t-sm bg-blue-500/60 transition-all"
                      style={{ height: `${(created / maxMonthVal) * 100}%`, minHeight: created > 0 ? '4px' : 0 }} />
                    <div className="w-full rounded-t-sm bg-green-500/80 transition-all"
                      style={{ height: `${(done / maxMonthVal) * 100}%`, minHeight: done > 0 ? '4px' : 0 }} />
                  </div>
                  <div className="text-[10px] text-slate-600 text-center">
                    {new Date(m + '-01').toLocaleDateString('en', { month: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500/60 rounded-sm" /> Created</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500/80 rounded-sm" /> Completed</div>
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No goals yet. Set some goals to see analytics.</p>
        </div>
      )}
    </div>
  )
}
