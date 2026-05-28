import { useEffect, useState } from 'react'
import axios from 'axios'
import { GraduationCap, Clock, TrendingUp, BookOpen, Target, Calendar } from 'lucide-react'

interface LearningItem {
  id: number
  title: string
  category: string
  status: 'active' | 'completed' | 'paused'
  progress: number
  total_hours_goal?: number
  last_session?: string
  created_at: string
}

interface LearningSession {
  id: number
  item_id: number
  date: string
  duration_minutes: number
  notes?: string
}

interface Summary {
  total: number
  active: number
  completed: number
  totalHours: number
  thisWeekMins: number
}

const CATEGORY_COLORS: Record<string, string> = {
  programming: '#3b82f6',
  language: '#8b5cf6',
  music: '#f97316',
  design: '#ec4899',
  math: '#eab308',
  science: '#22c55e',
  business: '#14b8a6',
  history: '#94a3b8',
  philosophy: '#f59e0b',
  other: '#64748b',
}

export default function LearningAnalytics() {
  const [items, setItems] = useState<LearningItem[]>([])
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/learning'),
      axios.get('/api/learning/stats/summary'),
    ]).then(([itemsRes, summaryRes]) => {
      setItems(itemsRes.data as LearningItem[])
      setSummary(summaryRes.data as Summary)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const active = items.filter(i => i.status === 'active')
  const completed = items.filter(i => i.status === 'completed')

  // Category breakdown
  const byCategory: Record<string, { count: number; activeCount: number }> = {}
  for (const item of items) {
    const c = item.category || 'other'
    if (!byCategory[c]) byCategory[c] = { count: 0, activeCount: 0 }
    byCategory[c].count++
    if (item.status === 'active') byCategory[c].activeCount++
  }
  const catList = Object.entries(byCategory).sort((a, b) => b[1].count - a[1].count)

  // Weekly minutes (last 8 weeks)
  const weeklyData: { label: string; mins: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    const weekEnd = new Date(d)
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    const startStr = weekStart.toISOString().split('T')[0]
    const endStr = weekEnd.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.date >= startStr && s.date <= endStr).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    weeklyData.push({ label: `W${i === 0 ? 'now' : `-${i}`}`, mins })
  }
  const maxWeekMins = Math.max(...weeklyData.map(w => w.mins), 1)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <GraduationCap className="w-7 h-7 text-teal-400" />
          Learning Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track what you're learning and how fast</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Hours', value: `${summary?.totalHours || 0}h`, icon: Clock, color: 'text-teal-400' },
          { label: 'This Week', value: `${Math.round((summary?.thisWeekMins || 0) / 60 * 10) / 10}h`, icon: Calendar, color: 'text-blue-400' },
          { label: 'Active Topics', value: summary?.active || 0, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Completed', value: summary?.completed || 0, icon: Target, color: 'text-green-400' },
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

      {/* Active items progress */}
      {active.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Active Learning
          </h3>
          <div className="space-y-3">
            {active.map(item => (
              <div key={item.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.title}</span>
                  <span className="text-slate-500">{item.progress}%</span>
                </div>
                <div className="text-xs text-slate-600 mb-1 capitalize">{item.category}</div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${item.progress}%`, background: CATEGORY_COLORS[item.category] || '#14b8a6' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly chart */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Weekly Study Time
        </h3>
        <div className="flex items-end gap-1.5 h-24">
          {weeklyData.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                {w.label}: {Math.round(w.mins / 60 * 10) / 10}h
              </div>
              <div className="w-full rounded-t-sm bg-teal-500/70 transition-all"
                style={{ height: `${(w.mins / maxWeekMins) * 80}%`, minHeight: w.mins > 0 ? '4px' : '2px', opacity: w.mins > 0 ? 1 : 0.2 }} />
              <div className="text-[9px] text-slate-600">{w.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {catList.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Subject</h3>
          <div className="space-y-2">
            {catList.map(([cat, v]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: CATEGORY_COLORS[cat] || '#64748b' }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 capitalize">{cat}</span>
                    <span className="text-slate-500">{v.count} topics · {v.activeCount} active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" /> Completed Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {completed.map(item => (
              <span key={item.id} className="px-2.5 py-1 bg-green-900/20 border border-green-500/20 text-green-400 rounded-full text-xs">
                {item.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No learning topics yet. Start tracking in the Learning page.</p>
        </div>
      )}
    </div>
  )
}
