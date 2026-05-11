import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { Plus, CheckCircle2, Circle, Trash2, Target, Flame, TrendingUp, AlertCircle } from 'lucide-react'

interface Goal {
  id: number
  title: string
  description: string | null
  category: string
  target_date: string | null
  completed: number
  created_at: string
}

const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_COLORS: Record<string, string> = {
  health: 'border-green-500/50 bg-green-500/5',
  mind:   'border-cyan-500/50 bg-cyan-500/5',
  work:   'border-violet-500/50 bg-violet-500/5',
  social: 'border-yellow-500/50 bg-yellow-500/5',
  growth: 'border-red-500/50 bg-red-500/5',
}
const CAT_TEXT: Record<string, string> = {
  health: 'text-green-400', mind: 'text-cyan-400', work: 'text-violet-400',
  social: 'text-yellow-400', growth: 'text-red-400',
}
const CAT_BAR: Record<string, string> = {
  health: 'bar-health', mind: 'bar-mind', work: 'bar-work', social: 'bar-social', growth: 'bar-growth',
}

function getDaysLeft(targetDate: string): number {
  const today = new Date().toISOString().split('T')[0]
  const diff = Math.ceil((new Date(targetDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function getDaysSpent(createdAt: string): number {
  const diff = Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function getUrgencyLabel(daysLeft: number): { label: string; color: string } {
  if (daysLeft < 0) return { label: 'Overdue', color: 'text-red-400' }
  if (daysLeft === 0) return { label: 'Due today!', color: 'text-orange-400' }
  if (daysLeft <= 3) return { label: `${daysLeft}d left!`, color: 'text-orange-400' }
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'text-yellow-400' }
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'text-slate-400' }
  return { label: `${Math.round(daysLeft / 7)}w left`, color: 'text-slate-500' }
}

function getTimeProgress(createdAt: string, targetDate: string): number {
  const start = new Date(createdAt).getTime()
  const end = new Date(targetDate).getTime()
  const now = Date.now()
  if (end <= start) return 100
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')
  const [catFilter, setCatFilter] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', category: 'health', target_date: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => axios.get<Goal[]>('/api/goals').then(r => setGoals(r.data)).catch(console.error)
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await axios.post('/api/goals', form)
      setForm({ title: '', description: '', category: 'health', target_date: '' })
      setShowForm(false)
      load()
    } finally { setSubmitting(false) }
  }

  const toggleComplete = async (goal: Goal) => {
    await axios.put(`/api/goals/${goal.id}`, { completed: !goal.completed })
    load()
  }

  const deleteGoal = async (id: number) => {
    await axios.delete(`/api/goals/${id}`)
    load()
  }

  const filtered = goals.filter(g => {
    if (filter === 'active' && g.completed) return false
    if (filter === 'completed' && !g.completed) return false
    if (catFilter !== 'all' && g.category !== catFilter) return false
    return true
  })

  const stats = useMemo(() => {
    const total = goals.length
    const done = goals.filter(g => g.completed).length
    const overdue = goals.filter(g => !g.completed && g.target_date && getDaysLeft(g.target_date) < 0).length
    const dueThisWeek = goals.filter(g => {
      if (g.completed || !g.target_date) return false
      const dl = getDaysLeft(g.target_date)
      return dl >= 0 && dl <= 7
    }).length
    return { total, done, overdue, dueThisWeek, rate: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [goals])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-8 h-8 text-violet-400" />
            Goals
          </h1>
          <p className="text-slate-400 mt-1">Define what you're fighting for</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="game-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Stats bar */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{stats.done}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{stats.rate}%</div>
            <div className="text-xs text-slate-500">Success Rate</div>
          </div>
          <div className={`game-card p-3 text-center ${stats.dueThisWeek > 0 ? 'border border-yellow-500/30' : ''}`}>
            <div className={`text-xl font-bold ${stats.dueThisWeek > 0 ? 'text-yellow-400' : 'text-slate-400'}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {stats.dueThisWeek}
            </div>
            <div className="text-xs text-slate-500">Due This Week</div>
          </div>
          <div className={`game-card p-3 text-center ${stats.overdue > 0 ? 'border border-red-500/30' : ''}`}>
            <div className={`text-xl font-bold ${stats.overdue > 0 ? 'text-red-400' : 'text-slate-400'}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {stats.overdue}
            </div>
            <div className="text-xs text-slate-500">Overdue</div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-3 border-violet-500/30 glowing-border">
          <h2 className="font-semibold text-slate-200">New Goal</h2>
          <input
            type="text" className="game-input w-full" placeholder="Goal title *"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="text" className="game-input w-full" placeholder="Why does this matter? (optional)"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <select className="game-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input type="date" className="game-input" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={submitting || !form.title.trim()} className="game-btn-primary flex-1">
              {submitting ? 'Saving...' : 'Add Goal'}
            </button>
            <button onClick={() => setShowForm(false)} className="game-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'active' ? `(${goals.filter(g => !g.completed).length})` : f === 'completed' ? `(${goals.filter(g => g.completed).length})` : ''}
          </button>
        ))}
        <div className="w-px bg-slate-700 mx-1" />
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${catFilter === c ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
            {c === 'all' ? 'All' : `${CAT_ICONS[c]} ${c}`}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{filter === 'active' ? 'No active goals. Add your first quest objective!' : 'No goals here yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(goal => {
            const daysLeft = goal.target_date ? getDaysLeft(goal.target_date) : null
            const urgency = daysLeft !== null ? getUrgencyLabel(daysLeft) : null
            const timePct = goal.target_date && !goal.completed ? getTimeProgress(goal.created_at, goal.target_date) : null
            const daysSpent = getDaysSpent(goal.created_at)
            const isOverdue = daysLeft !== null && daysLeft < 0 && !goal.completed

            return (
              <div key={goal.id} className={`game-card p-4 border transition-all ${
                goal.completed ? 'opacity-60 border-slate-700' :
                isOverdue ? 'border-red-500/40 bg-red-500/5' :
                CAT_COLORS[goal.category] ?? 'border-slate-700'
              }`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleComplete(goal)} className={`mt-0.5 flex-shrink-0 transition-colors ${goal.completed ? 'text-green-400' : 'text-slate-400 hover:text-violet-400'}`}>
                    {goal.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{CAT_ICONS[goal.category]}</span>
                      <h3 className={`font-semibold ${goal.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {goal.title}
                      </h3>
                      {!goal.completed && isOverdue && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                    </div>

                    {goal.description && (
                      <p className="text-sm text-slate-400 mt-0.5 italic">"{goal.description}"</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_TEXT[goal.category] ?? 'text-slate-400'} bg-slate-700`}>
                        {goal.category}
                      </span>
                      {!goal.completed && daysSpent > 0 && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {daysSpent}d in progress
                        </span>
                      )}
                      {goal.target_date && urgency && (
                        <span className={`text-xs font-semibold ${urgency.color}`}>
                          🗓 {urgency.label}
                        </span>
                      )}
                      {goal.completed && (
                        <span className="text-xs text-green-400">✓ Completed</span>
                      )}
                    </div>

                    {/* Time progress bar */}
                    {timePct !== null && !goal.completed && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                          <span>Time elapsed</span>
                          <span>{timePct}%</span>
                        </div>
                        <div className="stat-bar h-1">
                          <div
                            className={`stat-bar-fill transition-all duration-700 ${timePct >= 80 ? 'bar-growth' : timePct >= 60 ? 'bar-social' : CAT_BAR[goal.category] ?? 'bar-work'}`}
                            style={{ width: `${timePct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => deleteGoal(goal.id)} className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Category breakdown */}
      {goals.filter(g => !g.completed).length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Active Goals by Category
          </h3>
          <div className="space-y-2">
            {CATEGORIES.map(cat => {
              const catGoals = goals.filter(g => g.category === cat && !g.completed)
              if (catGoals.length === 0) return null
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm w-20 text-slate-400">{CAT_ICONS[cat]} {cat}</span>
                  <div className="flex gap-1">
                    {catGoals.map(g => (
                      <div
                        key={g.id}
                        title={g.title}
                        className={`w-6 h-6 rounded text-xs flex items-center justify-center ${CAT_TEXT[cat]} bg-slate-700 border border-slate-600 cursor-default`}
                      >
                        {g.target_date && getDaysLeft(g.target_date) <= 7 ? '!' : '◆'}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{catGoals.length} active</span>
                </div>
              )
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  )
}
