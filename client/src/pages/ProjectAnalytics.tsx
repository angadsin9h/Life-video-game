import { useEffect, useState } from 'react'
import axios from 'axios'
import { FolderOpen, CheckCircle2, Clock, TrendingUp, AlertCircle, Target } from 'lucide-react'

interface Project {
  id: number
  name: string
  description?: string
  status: 'active' | 'completed' | 'paused' | 'planning'
  priority: 'high' | 'medium' | 'low'
  color?: string
  target_date?: string
  progress: number
  task_count: number
  done_count: number
  created_at: string
}

const STATUS_COLORS = {
  active: '#3b82f6',
  completed: '#22c55e',
  paused: '#eab308',
  planning: '#8b5cf6',
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
}

export default function ProjectAnalytics() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/projects').then(r => {
      setProjects(r.data as Project[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const active = projects.filter(p => p.status === 'active')
  const completed = projects.filter(p => p.status === 'completed')
  const overdue = active.filter(p => p.target_date && p.target_date < today)
  const daysUntil = (date: string) => Math.ceil((new Date(date + 'T12:00:00').getTime() - Date.now()) / 86400000)

  const totalTasks = projects.reduce((s, p) => s + (p.task_count || 0), 0)
  const doneTasks = projects.reduce((s, p) => s + (p.done_count || 0), 0)
  const avgProgress = active.length > 0 ? Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length) : 0

  // Status breakdown
  const byStatus = Object.entries(
    projects.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {})
  )

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <FolderOpen className="w-7 h-7 text-blue-400" />
          Project Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Overview of all your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active', value: active.length, icon: FolderOpen, color: 'text-blue-400' },
          { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Tasks Done', value: `${doneTasks}/${totalTasks}`, icon: Target, color: 'text-violet-400' },
          { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-teal-400' },
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

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="game-card p-4 border border-red-500/30 bg-red-900/10 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <span className="text-red-400 font-semibold">{overdue.length} overdue project{overdue.length > 1 ? 's' : ''}</span>
            <span className="text-slate-400 text-sm ml-2">{overdue.map(p => p.name).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Active projects progress */}
      {active.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Active Projects</h3>
          <div className="space-y-4">
            {active.sort((a, b) => b.progress - a.progress).map(p => {
              const days = p.target_date ? daysUntil(p.target_date) : null
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || STATUS_COLORS[p.status] }} />
                      <span className="text-sm text-slate-200">{p.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: PRIORITY_COLORS[p.priority] + '33', color: PRIORITY_COLORS[p.priority] }}>
                        {p.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {days !== null && (
                        <span className={days < 0 ? 'text-red-400' : days < 7 ? 'text-yellow-400' : ''}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      )}
                      <span>{p.done_count}/{p.task_count} tasks</span>
                      <span className="text-slate-300 font-medium">{p.progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${p.progress}%`, background: p.color || STATUS_COLORS[p.status] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status breakdown */}
      {byStatus.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Status</h3>
          <div className="flex gap-3">
            {byStatus.map(([status, count]) => (
              <div key={status} className="flex-1 text-center p-3 rounded-lg" style={{ background: STATUS_COLORS[status as keyof typeof STATUS_COLORS] + '22' }}>
                <div className="text-2xl font-bold" style={{ color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}>{count}</div>
                <div className="text-xs text-slate-400 capitalize mt-0.5">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming deadlines */}
      {active.filter(p => p.target_date).length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Deadlines
          </h3>
          <div className="space-y-2">
            {active.filter(p => p.target_date).sort((a, b) => a.target_date!.localeCompare(b.target_date!)).map(p => {
              const days = daysUntil(p.target_date!)
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color || '#3b82f6' }} />
                    <span className="text-sm text-slate-300">{p.name}</span>
                  </div>
                  <span className={`text-sm font-medium ${days < 0 ? 'text-red-400' : days < 7 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {p.target_date} ({days < 0 ? `${Math.abs(days)}d over` : `${days}d`})
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No projects yet. Create some in the Projects page.</p>
        </div>
      )}
    </div>
  )
}
