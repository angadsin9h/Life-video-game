import { useState, useEffect } from 'react'
import { Lightbulb, Plus, Trash2, Edit2, X, TrendingUp, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ProjectStatus = 'idea' | 'planning' | 'building' | 'launched' | 'paused' | 'abandoned'
type ProjectType = 'app' | 'content' | 'business' | 'creative' | 'learning' | 'other'

interface SideProject {
  id: string
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  goal: string
  progress: number
  timeSpent: number
  nextAction: string
  revenue: number
  url: string
  tags: string[]
  startedAt: string
  updatedAt: string
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  idea:      { label: 'Idea',      color: '#6366f1' },
  planning:  { label: 'Planning',  color: '#f59e0b' },
  building:  { label: 'Building',  color: '#3b82f6' },
  launched:  { label: 'Launched',  color: '#22c55e' },
  paused:    { label: 'Paused',    color: '#94a3b8' },
  abandoned: { label: 'Abandoned', color: '#475569' },
}

const TYPE_CONFIG: Record<ProjectType, { label: string; emoji: string }> = {
  app:      { label: 'App/Tool',  emoji: '💻' },
  content:  { label: 'Content',   emoji: '📝' },
  business: { label: 'Business',  emoji: '🏢' },
  creative: { label: 'Creative',  emoji: '🎨' },
  learning: { label: 'Learning',  emoji: '📚' },
  other:    { label: 'Other',     emoji: '🔧' },
}

const STORAGE_KEY = 'side_projects'
const BLANK = (): Omit<SideProject, 'id' | 'startedAt' | 'updatedAt'> => ({
  name: '', description: '', type: 'app', status: 'idea', goal: '',
  progress: 0, timeSpent: 0, nextAction: '', revenue: 0, url: '', tags: [],
})

export default function SideProjects() {
  const { toastSuccess } = useToast()
  const [projects, setProjects] = useState<SideProject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK(), tagInput: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logTime, setLogTime] = useState<{ id: string; h: number } | null>(null)

  useEffect(() => {
    try { setProjects(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SideProject[]) => { setProjects(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const tags = form.tagInput.split(',').map(t => t.trim()).filter(Boolean)
    const now = new Date().toISOString().split('T')[0]
    if (editId) {
      save(projects.map(p => p.id === editId ? { ...p, ...form, tags, updatedAt: now } : p))
      toastSuccess('Project updated')
    } else {
      const p: SideProject = { id: Date.now().toString(), ...form, tags, startedAt: now, updatedAt: now }
      save([p, ...projects])
      toastSuccess(`${form.name} added 🚀`)
    }
    resetForm()
  }

  const resetForm = () => { setForm({ ...BLANK(), tagInput: '' }); setEditId(null); setShowForm(false) }

  const startEdit = (p: SideProject) => {
    setForm({ ...p, tagInput: p.tags.join(', ') })
    setEditId(p.id)
    setShowForm(true)
  }

  const del = (id: string) => save(projects.filter(p => p.id !== id))

  const addTime = (id: string, hours: number) => {
    save(projects.map(p => p.id === id ? { ...p, timeSpent: p.timeSpent + hours, updatedAt: new Date().toISOString().split('T')[0] } : p))
    setLogTime(null)
    toastSuccess(`${hours}h logged`)
  }

  const updateStatus = (id: string, status: ProjectStatus) => {
    save(projects.map(p => p.id === id ? { ...p, status, updatedAt: new Date().toISOString().split('T')[0] } : p))
  }

  const displayed = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const totalRevenue = projects.reduce((s, p) => s + p.revenue, 0)
  const totalHours = projects.reduce((s, p) => s + p.timeSpent, 0)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Side Projects
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track all your side hustles and projects.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <div className="text-xs text-slate-500">Projects</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Total Revenue</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Hours Invested</div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs ${filter === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          All ({projects.length})
        </button>
        {(Object.entries(STATUS_CONFIG) as [ProjectStatus, typeof STATUS_CONFIG.idea][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="px-3 py-1 rounded-full text-xs transition-colors"
            style={filter === k ? { background: s.color + '30', color: s.color } : { background: '#1e293b', color: '#64748b' }}>
            {s.label} ({projects.filter(p => p.status === k).length})
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-white">{editId ? 'Edit Project' : 'New Side Project'}</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Project name *" className="game-input flex-1" autoFocus />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ProjectType }))} className="game-input text-sm">
              {(Object.entries(TYPE_CONFIG) as [ProjectType, typeof TYPE_CONFIG.app][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this project?" className="game-input w-full h-16 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              placeholder="Goal / success metric" className="game-input flex-1 text-sm" />
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))} className="game-input text-sm">
              {(Object.entries(STATUS_CONFIG) as [ProjectStatus, typeof STATUS_CONFIG.idea][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-slate-500 w-20">Progress: {form.progress}%</span>
              <input type="range" min={0} max={100} value={form.progress}
                onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                className="flex-1 h-1 accent-yellow-400" />
            </div>
            <input type="number" value={form.revenue} min={0}
              onChange={e => setForm(f => ({ ...f, revenue: Number(e.target.value) }))}
              placeholder="Revenue $" className="game-input w-28 text-sm" />
          </div>
          <div className="flex gap-2">
            <input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
              placeholder="Next action..." className="game-input flex-1 text-sm" />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="URL" className="game-input flex-1 text-sm" />
          </div>
          <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
            placeholder="Tags (comma-separated)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">
              {editId ? 'Update' : 'Add Project'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Project cards */}
      <div className="space-y-3">
        {displayed.map(p => {
          const sc = STATUS_CONFIG[p.status]
          const tc = TYPE_CONFIG[p.type]
          const isExp = expandedId === p.id
          return (
            <div key={p.id} className="game-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tc.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{p.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.color + '20', color: sc.color }}>{sc.label}</span>
                      {p.revenue > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">${p.revenue.toLocaleString()}</span>}
                    </div>
                    {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                        <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{p.progress}%</span>
                      <span className="text-xs text-slate-600 flex items-center gap-0.5"><Clock className="w-3 h-3" />{p.timeSpent}h</span>
                    </div>
                    {p.nextAction && <p className="text-xs text-yellow-500 mt-1">→ {p.nextAction}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setExpandedId(isExp ? null : p.id)} className="text-slate-700 hover:text-slate-300 text-xs px-2 py-1 rounded bg-slate-800">
                      {isExp ? '↑' : '↓'}
                    </button>
                    <button onClick={() => startEdit(p)} className="p-1 text-slate-700 hover:text-slate-300">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(p.id)} className="p-1 text-slate-700 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-3">
                  {p.goal && <p className="text-xs text-slate-400">🎯 Goal: {p.goal}</p>}
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{p.url}</a>}
                  {p.tags.length > 0 && (
                    <div className="flex gap-1">{p.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">#{t}</span>)}</div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(s => (
                      <button key={s} onClick={() => updateStatus(p.id, s)}
                        className={`px-2 py-1 rounded-lg text-xs ${p.status === s ? 'text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        style={p.status === s ? { background: STATUS_CONFIG[s].color + '30', color: STATUS_CONFIG[s].color } : {}}>
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                  {logTime?.id === p.id ? (
                    <div className="flex gap-2 items-center">
                      <input type="number" value={logTime.h} min={0.5} step={0.5}
                        onChange={e => setLogTime({ id: p.id, h: Number(e.target.value) })}
                        className="game-input w-20 text-sm text-center" />
                      <span className="text-xs text-slate-500">hours</span>
                      <button onClick={() => addTime(p.id, logTime.h)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs">Log</button>
                      <button onClick={() => setLogTime(null)} className="text-xs text-slate-600">cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setLogTime({ id: p.id, h: 1 })}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400">
                      <TrendingUp className="w-3 h-3" /> Log time worked
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No projects yet. Start building something!</p>
          </div>
        )}
      </div>
    </div>
  )
}
