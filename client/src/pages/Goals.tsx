import { useEffect, useState, useMemo, useCallback } from 'react'
import axios from 'axios'
import { Plus, CheckCircle2, Circle, Trash2, Target, Flame, TrendingUp, AlertCircle, ChevronDown, ChevronUp, MessageSquarePlus, Clock, ListChecks } from 'lucide-react'

interface ProgressNote {
  id: number
  goal_id: number
  note: string
  created_at: string
}

interface Milestone {
  id: number
  goal_id: number
  text: string
  completed: number
  position: number
}

function GoalProgressPanel({ goalId, onMilestoneChange }: { goalId: number; onMilestoneChange?: () => void }) {
  const [notes, setNotes] = useState<ProgressNote[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [newMilestone, setNewMilestone] = useState('')
  const [adding, setAdding] = useState(false)
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [tab, setTab] = useState<'milestones' | 'notes'>('milestones')

  const loadData = useCallback(async () => {
    const [notesRes, goalRes] = await Promise.all([
      axios.get<ProgressNote[]>(`/api/goals/${goalId}/progress`),
      axios.get<{ milestones: Milestone[] }>(`/api/goals/${goalId}`),
    ])
    setNotes(notesRes.data)
    setMilestones(goalRes.data.milestones ?? [])
  }, [goalId])

  useEffect(() => { loadData().finally(() => setLoading(false)) }, [loadData])

  const addNote = async () => {
    if (!newNote.trim()) return
    setAdding(true)
    try {
      await axios.post(`/api/goals/${goalId}/progress`, { note: newNote.trim() })
      setNewNote('')
      await loadData()
    } finally { setAdding(false) }
  }

  const deleteNote = async (noteId: number) => {
    await axios.delete(`/api/goals/${goalId}/progress/${noteId}`)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const addMilestone = async () => {
    if (!newMilestone.trim()) return
    setAddingMilestone(true)
    try {
      await axios.post(`/api/goals/${goalId}/milestones`, { text: newMilestone.trim(), position: milestones.length })
      setNewMilestone('')
      await loadData()
      onMilestoneChange?.()
    } finally { setAddingMilestone(false) }
  }

  const toggleMilestone = async (m: Milestone) => {
    await axios.patch(`/api/goals/${goalId}/milestones/${m.id}/complete`)
    await loadData()
    onMilestoneChange?.()
  }

  const deleteMilestone = async (mid: number) => {
    await axios.delete(`/api/goals/${goalId}/milestones/${mid}`)
    setMilestones(prev => prev.filter(m => m.id !== mid))
    onMilestoneChange?.()
  }

  if (loading) return <div className="h-8 animate-pulse bg-slate-700 rounded mt-3" />

  const doneMilestones = milestones.filter(m => m.completed).length

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab('milestones')}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${tab === 'milestones' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Milestones {milestones.length > 0 && `(${doneMilestones}/${milestones.length})`}
        </button>
        <button
          onClick={() => setTab('notes')}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${tab === 'notes' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Clock className="w-3.5 h-3.5" />
          Progress Log {notes.length > 0 && `(${notes.length})`}
        </button>
      </div>

      {tab === 'milestones' && (
        <div className="space-y-2">
          {milestones.length > 0 && milestones.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              <button onClick={() => toggleMilestone(m)}>
                {m.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <Circle className="w-4 h-4 text-slate-500 hover:text-violet-400 transition-colors" />
                }
              </button>
              <span className={`flex-1 text-sm ${m.completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>{m.text}</span>
              <button onClick={() => deleteMilestone(m.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newMilestone}
              onChange={e => setNewMilestone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMilestone()}
              className="game-input flex-1 text-xs py-1"
              placeholder="Add a milestone step…"
            />
            <button onClick={addMilestone} disabled={addingMilestone || !newMilestone.trim()} className="game-btn-primary text-xs px-3 py-1">
              + Add
            </button>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-2">
          {notes.length > 0 && (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {notes.map(n => (
                <div key={n.id} className="flex items-start gap-2 text-xs text-slate-400">
                  <div className="flex-1">
                    <span className="text-slate-300">{n.note}</span>
                    <span className="text-slate-600 ml-2">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => deleteNote(n.id)} className="text-slate-600 hover:text-red-400 flex-shrink-0">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
              className="game-input flex-1 text-xs py-1"
              placeholder="Add a progress update..."
            />
            <button onClick={addNote} disabled={adding || !newNote.trim()} className="game-btn-primary text-xs px-3 py-1 flex items-center gap-1">
              <MessageSquarePlus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface Goal {
  id: number
  title: string
  description: string | null
  category: string
  target_date: string | null
  completed: number
  created_at: string
  progress_pct: number
  milestones: Milestone[]
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
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = () => axios.get<Goal[]>('/api/goals').then(r => setGoals(r.data as Goal[])).catch(console.error)
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

                    {/* Milestone progress bar */}
                    {goal.milestones?.length > 0 && !goal.completed && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                          <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" /> {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones</span>
                          <span>{goal.progress_pct}%</span>
                        </div>
                        <div className="stat-bar h-1.5">
                          <div
                            className={`stat-bar-fill transition-all duration-700 ${goal.progress_pct >= 80 ? 'bg-green-500' : CAT_BAR[goal.category] ?? 'bar-work'}`}
                            style={{ width: `${goal.progress_pct}%` }}
                          />
                        </div>
                      </div>
                    )}

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

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!goal.completed && (
                      <button
                        onClick={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                        title="Progress notes"
                      >
                        {expandedId === goal.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => deleteGoal(goal.id)} className="text-slate-700 hover:text-red-400 transition-colors mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedId === goal.id && <GoalProgressPanel goalId={goal.id} onMilestoneChange={load} />}
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
