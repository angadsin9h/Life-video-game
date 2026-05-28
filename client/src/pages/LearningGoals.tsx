import { useState, useEffect } from 'react'
import { GraduationCap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LearningDomain = 'technical' | 'language' | 'creative' | 'physical' | 'business' | 'science' | 'humanities' | 'social' | 'spiritual' | 'other'
type GoalStatus = 'not-started' | 'active' | 'paused' | 'completed'

interface LearningGoal {
  id: string
  domain: LearningDomain
  title: string
  why: string
  resource: string
  targetDate: string
  hoursGoal: number
  hoursLogged: number
  status: GoalStatus
  milestones: string[]
  notes: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<LearningDomain, { label: string; emoji: string; color: string }> = {
  technical:   { label: 'Technical',   emoji: '💻', color: '#3b82f6' },
  language:    { label: 'Language',    emoji: '🌍', color: '#22c55e' },
  creative:    { label: 'Creative',    emoji: '🎨', color: '#a855f7' },
  physical:    { label: 'Physical',    emoji: '💪', color: '#f97316' },
  business:    { label: 'Business',    emoji: '📈', color: '#f59e0b' },
  science:     { label: 'Science',     emoji: '🔬', color: '#0ea5e9' },
  humanities:  { label: 'Humanities',  emoji: '📚', color: '#6366f1' },
  social:      { label: 'Social',      emoji: '🤝', color: '#ec4899' },
  spiritual:   { label: 'Spiritual',   emoji: '🧘', color: '#84cc16' },
  other:       { label: 'Other',       emoji: '🎯', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  'not-started': { label: 'Not Started', color: '#94a3b8' },
  active:        { label: 'Active',      color: '#22c55e' },
  paused:        { label: 'Paused',      color: '#f59e0b' },
  completed:     { label: 'Completed',   color: '#3b82f6' },
}

const STORAGE_KEY = 'learning_goals'

export default function LearningGoals() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [newMilestone, setNewMilestone] = useState('')
  const [form, setForm] = useState<Omit<LearningGoal, 'id' | 'createdAt'>>({
    domain: 'technical', title: '', why: '', resource: '', targetDate: '',
    hoursGoal: 10, hoursLogged: 0, status: 'not-started', milestones: [], notes: '',
  })

  useEffect(() => {
    try { setGoals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LearningGoal[]) => { setGoals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const g: LearningGoal = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([g, ...goals])
    setForm(f => ({ ...f, title: '', why: '', resource: '', targetDate: '', milestones: [], notes: '' }))
    setNewMilestone('')
    setShowForm(false)
    toastSuccess('Learning goal added 🎓')
  }

  const logHours = (id: string, h: number) => {
    save(goals.map(g => g.id === id ? { ...g, hoursLogged: Math.max(0, g.hoursLogged + h) } : g))
  }

  const filtered = goals.filter(g => filterDomain === 'all' || g.domain === filterDomain)
  const active = goals.filter(g => g.status === 'active').length
  const completed = goals.filter(g => g.status === 'completed').length
  const totalHours = goals.reduce((s, g) => s + g.hoursLogged, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <GraduationCap className="w-7 h-7 text-blue-400" />
            Learning Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set intentional learning goals and track progress.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Hours Logged</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterDomain('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(DOMAIN_CONFIG) as [LearningDomain, typeof DOMAIN_CONFIG.technical][]).map(([k, d]) => (
          <button key={k} onClick={() => setFilterDomain(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterDomain === k ? { background: d.color + '30', color: d.color } : {}}>
            {d.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Learning Goal</h3>
          <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as LearningDomain }))} className="game-input w-full text-sm">
            {(Object.entries(DOMAIN_CONFIG) as [LearningDomain, typeof DOMAIN_CONFIG.technical][]).map(([k, d]) => (
              <option key={k} value={k}>{d.emoji} {d.label}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What do you want to learn? *" className="game-input w-full" autoFocus />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why does this matter to you?" className="game-input w-full text-sm" />
          <input value={form.resource} onChange={e => setForm(f => ({ ...f, resource: e.target.value }))}
            placeholder="Resource / course / book" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Hours Goal</p>
              <input type="number" value={form.hoursGoal} min={1}
                onChange={e => setForm(f => ({ ...f, hoursGoal: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target Date</p>
              <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
              placeholder="Add milestone..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newMilestone.trim()) { setForm(f => ({ ...f, milestones: [...f.milestones, newMilestone.trim()] })); setNewMilestone('') } }} />
            <button onClick={() => { if (newMilestone.trim()) { setForm(f => ({ ...f, milestones: [...f.milestones, newMilestone.trim()] })); setNewMilestone('') } }}
              className="px-3 py-1.5 bg-blue-700/30 text-blue-400 rounded-xl text-xs">Add</button>
          </div>
          {form.milestones.length > 0 && (
            <div className="space-y-1">
              {form.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-blue-400">→</span>
                  <span className="text-xs text-slate-300 flex-1">{m}</span>
                  <button onClick={() => setForm(f => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }))}
                    className="text-slate-600 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(g => {
          const d = DOMAIN_CONFIG[g.domain]
          const s = STATUS_CONFIG[g.status]
          const isExp = expanded === g.id
          const pct = g.hoursGoal > 0 ? Math.min(100, Math.round(g.hoursLogged / g.hoursGoal * 100)) : 0
          return (
            <div key={g.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${d.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : g.id)}>
                <span className="text-2xl">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{g.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-700 rounded-full">
                      <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                    </div>
                    <span className="text-xs text-slate-500">{g.hoursLogged}/{g.hoursGoal}h</span>
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {g.why && <p className="text-xs text-slate-300">💡 {g.why}</p>}
                  {g.resource && <p className="text-xs text-blue-300">📖 {g.resource}</p>}
                  {g.targetDate && <p className="text-xs text-yellow-300">🗓 Target: {g.targetDate}</p>}
                  {g.milestones.length > 0 && (
                    <div className="space-y-0.5">
                      {g.milestones.map((m, i) => <p key={i} className="text-xs text-slate-400">→ {m}</p>)}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Log hours:</span>
                    <button onClick={() => logHours(g.id, 0.5)} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">+0.5h</button>
                    <button onClick={() => logHours(g.id, 1)} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">+1h</button>
                    <button onClick={() => logHours(g.id, 2)} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">+2h</button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select value={g.status} onChange={ev => save(goals.map(x => x.id === g.id ? { ...x, status: ev.target.value as GoalStatus } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button onClick={() => save(goals.filter(x => x.id !== g.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every expert was once a beginner. Set your first learning goal.</p>
          </div>
        )}
      </div>
    </div>
  )
}
