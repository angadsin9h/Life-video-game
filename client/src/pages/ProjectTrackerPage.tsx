import { useState, useCallback } from 'react'
import { Target, Plus, Trash2, Save, CheckCircle, Circle, Calendar, TrendingUp, Zap, Flag } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'project_tracker_log'

interface Milestone {
  id: string
  title: string
  dueDate: string
  done: boolean
}

interface Project {
  id: string
  name: string
  category: 'work' | 'personal' | 'health' | 'creative' | 'learning' | 'financial' | 'other'
  status: 'active' | 'paused' | 'done' | 'cancelled'
  priority: 1 | 2 | 3
  startDate: string
  targetDate: string
  progress: number        // 0-100
  milestones: Milestone[]
  nextAction: string
  whyItMatters: string
  notes: string
  updatedAt: string
}

const CAT_COLORS: Record<string, string> = {
  work: 'text-blue-400', personal: 'text-violet-400', health: 'text-green-400',
  creative: 'text-pink-400', learning: 'text-cyan-400', financial: 'text-yellow-400', other: 'text-slate-400',
}
const CAT_EMOJIS: Record<string, string> = {
  work: '💼', personal: '🌟', health: '💪', creative: '🎨', learning: '📚', financial: '💰', other: '📌',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400', paused: 'text-yellow-400', done: 'text-slate-400', cancelled: 'text-red-400',
}

function load(): Project[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] } }
function today() { return new Date().toISOString().slice(0, 10) }

export default function ProjectTracker() {
  const { toastSuccess } = useToast()
  const [projects, setProjects] = useState<Project[]>(load)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({})
  const [form, setForm] = useState<Omit<Project, 'id' | 'updatedAt'>>({
    name: '', category: 'personal', status: 'active', priority: 2,
    startDate: today(), targetDate: '', progress: 0, milestones: [],
    nextAction: '', whyItMatters: '', notes: '',
  })

  const persist = useCallback((p: Project[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    setProjects(p)
  }, [])

  function submit() {
    if (!form.name.trim()) return
    if (editId) {
      persist(projects.map(p => p.id === editId ? { ...form, id: editId, updatedAt: today() } : p))
    } else {
      persist([...projects, { ...form, id: Date.now().toString(), updatedAt: today() }])
    }
    setForm({ name: '', category: 'personal', status: 'active', priority: 2, startDate: today(), targetDate: '', progress: 0, milestones: [], nextAction: '', whyItMatters: '', notes: '' })
    setEditId(null)
    setShowForm(false)
    toastSuccess('Project saved!')
  }

  function toggleMilestone(projectId: string, milestoneId: string) {
    persist(projects.map(p => {
      if (p.id !== projectId) return p
      const milestones = p.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m)
      const progress = milestones.length ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100) : p.progress
      return { ...p, milestones, progress, updatedAt: today() }
    }))
  }

  function addMilestone(projectId: string) {
    const title = newMilestone[projectId]?.trim()
    if (!title) return
    persist(projects.map(p => p.id === projectId
      ? { ...p, milestones: [...p.milestones, { id: Date.now().toString(), title, dueDate: '', done: false }], updatedAt: today() }
      : p))
    setNewMilestone(n => ({ ...n, [projectId]: '' }))
  }

  function editProject(p: Project) {
    setForm({ ...p })
    setEditId(p.id)
    setShowForm(true)
  }

  const filtered = projects.filter(p => filterStatus === 'all' || p.status === filterStatus)
  const activeCount = projects.filter(p => p.status === 'active').length
  const doneCount = projects.filter(p => p.status === 'done').length
  const overdue = projects.filter(p => p.targetDate && p.targetDate < today() && p.status === 'active').length

  const daysLeft = (targetDate: string) => {
    if (!targetDate) return null
    const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)
    return diff
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Project Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Track your big projects from idea to completion</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-violet-400">{activeCount}</div>
          <div className="text-xs text-slate-500">active projects</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{doneCount}</div>
          <div className="text-xs text-slate-500">completed</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className={`text-xl font-bold ${overdue > 0 ? 'text-red-400' : 'text-slate-400'}`}>{overdue}</div>
          <div className="text-xs text-slate-500">overdue</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-cyan-400">
            {projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0}%
          </div>
          <div className="text-xs text-slate-500">avg progress</div>
        </div>
      </div>

      <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', category: 'personal', status: 'active', priority: 2, startDate: today(), targetDate: '', progress: 0, milestones: [], nextAction: '', whyItMatters: '', notes: '' }) }}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition-colors">
        <Plus className="w-4 h-4" />
        {showForm && !editId ? 'Cancel' : 'New Project'}
      </button>

      {showForm && (
        <div className="game-card p-5 space-y-3">
          <h3 className="font-semibold text-white">{editId ? 'Edit Project' : 'New Project'}</h3>
          <input className="game-input w-full" placeholder="Project name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="game-input w-full" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Project['category'] }))}>
              {Object.entries(CAT_EMOJIS).map(([v, e]) => <option key={v} value={v}>{e} {v}</option>)}
            </select>
            <select className="game-input w-full" value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) as 1|2|3 }))}>
              <option value={1}>🔴 High priority</option>
              <option value={2}>🟡 Medium priority</option>
              <option value={3}>🟢 Low priority</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start date</label>
              <input type="date" className="game-input w-full" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target date</label>
              <input type="date" className="game-input w-full" value={form.targetDate}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Progress: {form.progress}%</label>
            <input type="range" min={0} max={100} className="w-full" value={form.progress}
              onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} />
          </div>
          <input className="game-input w-full" placeholder="Next action" value={form.nextAction}
            onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} />
          <textarea className="game-input w-full text-sm" rows={2} placeholder="Why does this matter?"
            value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))} />
          <button onClick={submit}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {['active', 'paused', 'done', 'all'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {s} ({s === 'all' ? projects.length : projects.filter(p => p.status === s).length})
          </button>
        ))}
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {filtered.sort((a, b) => a.priority - b.priority).map(p => {
          const expanded = expandedId === p.id
          const days = daysLeft(p.targetDate)
          const milestonesDone = p.milestones.filter(m => m.done).length
          return (
            <div key={p.id} className="game-card overflow-hidden">
              <button className="w-full text-left p-4" onClick={() => setExpandedId(expanded ? null : p.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{CAT_EMOJIS[p.category]}</span>
                      <span className="font-semibold text-white">{p.name}</span>
                      <span className={`text-xs ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                      {days !== null && days <= 7 && days >= 0 && (
                        <span className="text-xs text-yellow-400">⚠️ {days}d left</span>
                      )}
                      {days !== null && days < 0 && (
                        <span className="text-xs text-red-400">⚠️ {Math.abs(days)}d overdue</span>
                      )}
                    </div>
                    {p.nextAction && <div className="text-xs text-slate-400 mt-1 truncate">→ {p.nextAction}</div>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-violet-400">{p.progress}%</div>
                    {p.milestones.length > 0 && <div className="text-xs text-slate-500">{milestonesDone}/{p.milestones.length} milestones</div>}
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${p.progress >= 100 ? 'bg-green-500' : p.progress >= 50 ? 'bg-violet-500' : 'bg-blue-500'}`}
                    style={{ width: `${p.progress}%` }} />
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
                  {p.whyItMatters && <p className="text-xs text-slate-400 italic">"{p.whyItMatters}"</p>}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Started {p.startDate}</span>
                    {p.targetDate && <span>→ Due {p.targetDate}</span>}
                  </div>

                  {/* Milestones */}
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-2">Milestones</div>
                    <div className="space-y-1.5">
                      {p.milestones.map(m => (
                        <button key={m.id} onClick={() => toggleMilestone(p.id, m.id)}
                          className="w-full flex items-center gap-2 text-left">
                          {m.done ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                          <span className={`text-sm ${m.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>{m.title}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input className="game-input flex-1 text-sm" placeholder="Add milestone..."
                        value={newMilestone[p.id] ?? ''}
                        onChange={e => setNewMilestone(n => ({ ...n, [p.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') addMilestone(p.id) }} />
                      <button onClick={() => addMilestone(p.id)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors text-sm">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => editProject(p)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
                      Edit
                    </button>
                    <select className="game-input text-xs py-1.5" value={p.status}
                      onChange={e => persist(projects.map(x => x.id === p.id ? { ...x, status: e.target.value as Project['status'], updatedAt: today() } : x))}>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="done">Done ✓</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={() => persist(projects.filter(x => x.id !== p.id))}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No {filterStatus !== 'all' ? filterStatus : ''} projects. Add one above.
          </div>
        )}
      </div>
    </div>
  )
}
