import { useState, useEffect } from 'react'
import { Target, Plus, X, Trophy, Flag, Calendar, ChevronRight, CheckCircle2, Pause, Play, Flame } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type GoalCategory = 'Health' | 'Mind' | 'Career' | 'Finance' | 'Relationships' | 'Creative' | 'Spiritual' | 'Personal'
type GoalStatus = 'Active' | 'Completed' | 'Paused'

interface ProgressLog {
  id: string
  what: string
  momentum: number
  date: string
}

interface Goal {
  id: string
  title: string
  category: GoalCategory
  deadline: string
  whyItMatters: string
  successLooksLike: string
  obstacles: string
  firstStep: string
  progress: number
  nextAction: string
  status: GoalStatus
  progressLog: ProgressLog[]
  createdAt: string
}

const STORAGE_KEY = 'goal_crusher'

const CAT_COLORS: Record<GoalCategory, string> = {
  Health:        '#22c55e',
  Mind:          '#8b5cf6',
  Career:        '#3b82f6',
  Finance:       '#f59e0b',
  Relationships: '#ec4899',
  Creative:      '#f97316',
  Spiritual:     '#a855f7',
  Personal:      '#94a3b8',
}

const CATEGORIES: GoalCategory[] = ['Health', 'Mind', 'Career', 'Finance', 'Relationships', 'Creative', 'Spiritual', 'Personal']

function daysLeft(deadline: string): number {
  const d = new Date(deadline)
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

function deadlineColor(days: number): string {
  if (days < 0) return '#ef4444'
  if (days < 7) return '#ef4444'
  if (days < 30) return '#f59e0b'
  return '#22c55e'
}

const EMPTY_FORM: Omit<Goal, 'id' | 'createdAt' | 'progressLog' | 'status' | 'progress' | 'nextAction'> = {
  title: '',
  category: 'Personal',
  deadline: '',
  whyItMatters: '',
  successLooksLike: '',
  obstacles: '',
  firstStep: '',
}

export default function GoalCrusher() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM })
  const [logTarget, setLogTarget] = useState<string | null>(null)
  const [logWhat, setLogWhat] = useState('')
  const [logMomentum, setLogMomentum] = useState(7)

  useEffect(() => {
    try { setGoals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (g: Goal[]) => {
    setGoals(g)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(g))
  }

  const addGoal = () => {
    if (!form.title.trim()) return
    const g: Goal = {
      id: Date.now().toString(),
      ...form,
      progress: 0,
      nextAction: form.firstStep,
      status: 'Active',
      progressLog: [],
      createdAt: new Date().toISOString(),
    }
    save([g, ...goals])
    setForm({ ...EMPTY_FORM })
    setShowForm(false)
    toastSuccess('Goal added — go crush it!')
  }

  const updateGoal = (id: string, patch: Partial<Goal>) => {
    save(goals.map(g => g.id === id ? { ...g, ...patch } : g))
  }

  const logProgress = (goalId: string) => {
    if (!logWhat.trim()) return
    const entry: ProgressLog = {
      id: Date.now().toString(),
      what: logWhat,
      momentum: logMomentum,
      date: new Date().toISOString().split('T')[0],
    }
    const g = goals.find(x => x.id === goalId)
    if (!g) return
    const updated = { ...g, progressLog: [entry, ...g.progressLog] }
    if (updated.progress >= 100) updated.status = 'Completed'
    save(goals.map(x => x.id === goalId ? updated : x))
    setLogTarget(null)
    setLogWhat('')
    setLogMomentum(7)
    toastSuccess('Progress logged — momentum builds!')
  }

  const removeGoal = (id: string) => save(goals.filter(g => g.id !== id))

  const active = goals.filter(g => g.status === 'Active')
  const paused = goals.filter(g => g.status === 'Paused')
  const completed = goals.filter(g => g.status === 'Completed')
  const avgProgress = active.length ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length) : 0

  const thisMonth = new Date().toISOString().slice(0, 7)
  const completedThisMonth = completed.filter(g => g.createdAt.startsWith(thisMonth)).length

  const renderGoal = (g: Goal) => {
    const days = g.deadline ? daysLeft(g.deadline) : null
    const catColor = CAT_COLORS[g.category]
    return (
      <div key={g.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${catColor}` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">{g.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: catColor + '22', color: catColor }}>{g.category}</span>
              {g.status === 'Paused' && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Paused</span>}
              {g.status === 'Completed' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">Completed</span>}
            </div>
            {days !== null && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" style={{ color: deadlineColor(days) }} />
                <span className="text-xs" style={{ color: deadlineColor(days) }}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today!' : `${days}d left`}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {g.status !== 'Completed' && (
              <button
                onClick={() => updateGoal(g.id, { status: g.status === 'Active' ? 'Paused' : 'Active' })}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400"
                title={g.status === 'Active' ? 'Pause' : 'Resume'}
              >
                {g.status === 'Active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            )}
            <button onClick={() => removeGoal(g.id)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-900 text-slate-400 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span>
            <span className="font-bold" style={{ color: catColor }}>{g.progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={g.progress}
            onChange={e => updateGoal(g.id, { progress: Number(e.target.value) })}
            className="w-full h-1.5"
            style={{ accentColor: catColor }}
            disabled={g.status === 'Completed'}
          />
        </div>

        {/* Next action */}
        {g.status === 'Active' && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Next Action</div>
            <input
              value={g.nextAction}
              onChange={e => updateGoal(g.id, { nextAction: e.target.value })}
              placeholder="What's your next concrete step?"
              className="game-input w-full text-xs"
            />
          </div>
        )}

        {/* Why */}
        {g.whyItMatters && (
          <div className="text-xs text-slate-500 italic truncate">
            Why: {g.whyItMatters}
          </div>
        )}

        {/* Log progress */}
        {g.status === 'Active' && (
          <div>
            {logTarget === g.id ? (
              <div className="space-y-2 bg-slate-800/60 rounded-xl p-3">
                <div className="text-xs font-semibold text-white">Log Progress</div>
                <input
                  value={logWhat}
                  onChange={e => setLogWhat(e.target.value)}
                  placeholder="What did you do toward this goal?"
                  className="game-input w-full text-xs"
                  autoFocus
                />
                <div>
                  <div className="text-xs text-slate-500 mb-1">Momentum: {logMomentum}/10</div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={logMomentum}
                    onChange={e => setLogMomentum(Number(e.target.value))}
                    className="w-full accent-violet-400 h-1"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => logProgress(g.id)} className="flex-1 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-xs font-semibold">Save</button>
                  <button onClick={() => setLogTarget(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLogTarget(g.id)}
                className="w-full py-1.5 border border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-300 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <Flame className="w-3.5 h-3.5" /> Log Progress
              </button>
            )}
          </div>
        )}

        {/* Recent logs */}
        {g.progressLog.length > 0 && (
          <div className="space-y-1">
            {g.progressLog.slice(0, 2).map(l => (
              <div key={l.id} className="flex items-center gap-2 text-xs">
                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                <span className="text-slate-400 flex-1 truncate">{l.what}</span>
                <span className="text-slate-600 flex-shrink-0">{l.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Goal Crusher
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track goals with momentum and accountability.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{active.length}</div>
          <div className="text-xs text-slate-500">Active Goals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgProgress}%</div>
          <div className="text-xs text-slate-500">Avg Progress</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completedThisMonth}</div>
          <div className="text-xs text-slate-500">Done This Month</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flag className="w-4 h-4 text-violet-400" /> New Goal
          </h3>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Goal title *"
            className="game-input w-full text-sm"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as GoalCategory }))}
              className="game-input text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="game-input text-sm"
            />
          </div>
          <input
            value={form.whyItMatters}
            onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why does this matter deeply?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.successLooksLike}
            onChange={e => setForm(f => ({ ...f, successLooksLike: e.target.value }))}
            placeholder="What does success look like exactly?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.obstacles}
            onChange={e => setForm(f => ({ ...f, obstacles: e.target.value }))}
            placeholder="Potential obstacles to plan for"
            className="game-input w-full text-sm"
          />
          <input
            value={form.firstStep}
            onChange={e => setForm(f => ({ ...f, firstStep: e.target.value }))}
            placeholder="Your very first action step"
            className="game-input w-full text-sm"
          />
          <div className="flex gap-2">
            <button onClick={addGoal} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Add Goal</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <div>
          <h2 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Active ({active.length})</h2>
          <div className="space-y-3">{active.map(renderGoal)}</div>
        </div>
      )}

      {/* Paused goals */}
      {paused.length > 0 && (
        <div>
          <h2 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Paused ({paused.length})</h2>
          <div className="space-y-3">{paused.map(renderGoal)}</div>
        </div>
      )}

      {/* Hall of Fame */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4" /> Hall of Fame ({completed.length})
          </h2>
          <div className="space-y-2">
            {completed.map(g => (
              <div key={g.id} className="game-card p-3 border border-amber-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{g.title}</div>
                  <div className="text-xs text-slate-500">{g.category}</div>
                </div>
                <button onClick={() => removeGoal(g.id)} className="text-slate-700 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No goals yet. Add your first goal and start crushing it.</p>
        </div>
      )}
    </div>
  )
}
