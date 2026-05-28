import { useState, useEffect } from 'react'
import { Flag, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type GoalArea = 'health' | 'finance' | 'career' | 'relationships' | 'learning' | 'creativity' | 'mindset' | 'habits' | 'projects' | 'other'
type GoalStatus = 'not-started' | 'in-progress' | 'achieved' | 'missed' | 'carried-over'

interface MonthlyGoal {
  id: string
  area: GoalArea
  status: GoalStatus
  goal: string
  why: string
  keyActions: string[]
  progress: number
  month: string
  isCarriedOver: boolean
  successMetric: string
  createdAt: string
}

const AREA_CONFIG: Record<GoalArea, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',       emoji: '💪', color: '#ef4444' },
  finance:       { label: 'Finance',      emoji: '💰', color: '#f59e0b' },
  career:        { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  relationships: { label: 'Relationships',emoji: '❤️', color: '#ec4899' },
  learning:      { label: 'Learning',     emoji: '📚', color: '#a855f7' },
  creativity:    { label: 'Creativity',   emoji: '🎨', color: '#f97316' },
  mindset:       { label: 'Mindset',      emoji: '🧠', color: '#6366f1' },
  habits:        { label: 'Habits',       emoji: '🔄', color: '#22c55e' },
  projects:      { label: 'Projects',     emoji: '🚀', color: '#0ea5e9' },
  other:         { label: 'Other',        emoji: '🌟', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  'not-started':  { label: 'Not Started', color: '#94a3b8' },
  'in-progress':  { label: 'In Progress', color: '#3b82f6' },
  achieved:       { label: 'Achieved ✓', color: '#22c55e' },
  missed:         { label: 'Missed',      color: '#ef4444' },
  'carried-over': { label: 'Carried Over',color: '#f59e0b' },
}

const STORAGE_KEY = 'monthly_goals_v2'

function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthlyGoals() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<MonthlyGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewMonth, setViewMonth] = useState(getCurrentMonth())
  const [newAction, setNewAction] = useState('')
  const [form, setForm] = useState<Omit<MonthlyGoal, 'id' | 'createdAt'>>({
    area: 'health', status: 'not-started', goal: '', why: '', keyActions: [],
    progress: 0, month: getCurrentMonth(), isCarriedOver: false, successMetric: '',
  })

  useEffect(() => {
    try { setGoals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MonthlyGoal[]) => { setGoals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.goal.trim()) return
    const g: MonthlyGoal = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([g, ...goals])
    setForm(f => ({ ...f, goal: '', why: '', keyActions: [], successMetric: '' }))
    setNewAction('')
    setShowForm(false)
    toastSuccess('Monthly goal set 🎯')
  }

  const monthGoals = goals.filter(g => g.month === viewMonth)
  const achieved = monthGoals.filter(g => g.status === 'achieved').length
  const avgProgress = monthGoals.length
    ? Math.round(monthGoals.reduce((s, g) => s + g.progress, 0) / monthGoals.length)
    : 0

  const getMonthLabel = (m: string) => {
    const [y, mo] = m.split('-')
    return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flag className="w-7 h-7 text-green-400" />
            Monthly Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set, track and review monthly goals across all life areas.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input type="month" value={viewMonth} onChange={e => setViewMonth(e.target.value)}
          className="game-input text-sm" />
        <span className="text-sm text-slate-400">{getMonthLabel(viewMonth)}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{monthGoals.length}</div>
          <div className="text-xs text-slate-500">This Month</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgProgress}%</div>
          <div className="text-xs text-slate-500">Avg Progress</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Monthly Goal</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as GoalArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [GoalArea, typeof AREA_CONFIG.health][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
              className="game-input text-sm flex-1" />
          </div>
          <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Goal for this month *" className="game-input w-full" autoFocus />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why this goal, why this month?" className="game-input w-full text-sm" />
          <input value={form.successMetric} onChange={e => setForm(f => ({ ...f, successMetric: e.target.value }))}
            placeholder="How will you know you've succeeded?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newAction} onChange={e => setNewAction(e.target.value)}
              placeholder="Key action..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newAction.trim()) { setForm(f => ({ ...f, keyActions: [...f.keyActions, newAction.trim()] })); setNewAction('') } }} />
            <button onClick={() => { if (newAction.trim()) { setForm(f => ({ ...f, keyActions: [...f.keyActions, newAction.trim()] })); setNewAction('') } }}
              className="px-3 py-1.5 bg-green-700/30 text-green-400 rounded-xl text-xs">+</button>
          </div>
          {form.keyActions.length > 0 && (
            <div className="space-y-1">
              {form.keyActions.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-green-300">
                  <span>→</span><span className="flex-1">{a}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, keyActions: fo.keyActions.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Progress: {form.progress}%</p>
              <input type="range" min={0} max={100} step={5} value={form.progress}
                onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isCarriedOver} onChange={e => setForm(f => ({ ...f, isCarriedOver: e.target.checked }))} />
              Carried Over
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {monthGoals.map(g => {
          const a = AREA_CONFIG[g.area]
          const s = STATUS_CONFIG[g.status]
          return (
            <div key={g.id} className="game-card p-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{g.goal}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                    {g.isCarriedOver && <span className="text-xs text-slate-500">↩ carried</span>}
                  </div>
                  {g.successMetric && <p className="text-xs text-slate-500 mt-0.5">✓ {g.successMetric}</p>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                      <div className="h-1.5 rounded-full" style={{ width: `${g.progress}%`, background: a.color }} />
                    </div>
                    <span className="text-xs text-slate-500">{g.progress}%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <select value={g.status} onChange={ev => save(goals.map(x => x.id === g.id ? { ...x, status: ev.target.value as GoalStatus } : x))}
                    className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                    {(Object.entries(STATUS_CONFIG) as [GoalStatus, typeof STATUS_CONFIG.achieved][]).map(([k, st]) => (
                      <option key={k} value={k}>{st.label}</option>
                    ))}
                  </select>
                  <button onClick={() => save(goals.filter(x => x.id !== g.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {monthGoals.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Flag className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Set 3-5 meaningful goals this month. Quality over quantity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
