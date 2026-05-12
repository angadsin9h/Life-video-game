import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { FolderOpen, Plus, Trash2, Check, X, ChevronDown, ChevronUp, Calendar, MessageSquare } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ProjectTask {
  id: number
  project_id: number
  title: string
  done: number
  order_index: number
}

interface ProjectUpdate {
  id: number
  project_id: number
  content: string
  created_at: string
}

interface Project {
  id: number
  name: string
  description: string | null
  status: string
  category: string
  color: string
  emoji: string
  start_date: string | null
  target_date: string | null
  completed_at: string | null
  tasks: ProjectTask[]
  updates: ProjectUpdate[]
  progress: number
}

const CATEGORIES = ['work', 'personal', 'health', 'creative', 'learning', 'financial']
const EMOJIS = ['🚀', '💼', '🎯', '🌱', '⚡', '🔥', '💡', '🎨', '📚', '🏆', '🌟', '🔑']
const STATUS_COLORS: Record<string, string> = {
  active: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  paused: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  completed: 'text-green-400 bg-green-900/20 border-green-500/30',
}

function ProjectCard({ project, onUpdate, onDelete, onRefresh }: {
  project: Project
  onUpdate: (id: number, data: any) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}) {
  const { toastSuccess } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newUpdate, setNewUpdate] = useState('')
  const [showUpdate, setShowUpdate] = useState(false)

  const addTask = async () => {
    if (!newTask.trim()) return
    await axios.post(`/api/projects/${project.id}/tasks`, { title: newTask })
    setNewTask('')
    onRefresh()
  }

  const toggleTask = async (task: ProjectTask) => {
    await axios.patch(`/api/projects/tasks/${task.id}`, { done: !task.done })
    onRefresh()
  }

  const deleteTask = async (taskId: number) => {
    await axios.delete(`/api/projects/tasks/${taskId}`)
    onRefresh()
  }

  const addUpdate = async () => {
    if (!newUpdate.trim()) return
    await axios.post(`/api/projects/${project.id}/updates`, { content: newUpdate })
    setNewUpdate('')
    setShowUpdate(false)
    onRefresh()
    toastSuccess('Update logged!')
  }

  const daysLeft = project.target_date
    ? Math.ceil((new Date(project.target_date + 'T12:00:00').getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="game-card p-4" style={{ borderLeftColor: project.color + '80', borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{project.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-100">{project.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[project.status]}`}>
              {project.status}
            </span>
          </div>
          {project.description && (
            <p className="text-xs text-slate-500 mt-0.5">{project.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
            </div>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: project.color }}>{project.progress}%</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
            <span>{project.tasks.filter(t => t.done).length}/{project.tasks.length} tasks</span>
            {daysLeft !== null && (
              <span className={daysLeft < 0 ? 'text-red-400' : daysLeft < 7 ? 'text-yellow-400' : ''}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {project.status !== 'completed' && (
            <button onClick={() => onUpdate(project.id, { status: 'completed' })}
              className="p-1.5 text-slate-600 hover:text-green-400 transition-colors" title="Complete">
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(project.id)}
            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          {/* Tasks */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tasks</div>
            <div className="space-y-1.5">
              {project.tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2">
                  <button onClick={() => toggleTask(t)}
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      t.done ? 'bg-green-600 border-green-500' : 'border-slate-600 hover:border-green-500'
                    }`}>
                    {t.done && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${t.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>{t.title}</span>
                  <button onClick={() => deleteTask(t.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input placeholder="Add task…" value={newTask} onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  className="game-input flex-1 text-sm" />
                <button onClick={addTask} disabled={!newTask.trim()}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors disabled:opacity-50">
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updates</div>
              <button onClick={() => setShowUpdate(s => !s)}
                className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors">
                <MessageSquare className="w-3 h-3" /> Log update
              </button>
            </div>
            {showUpdate && (
              <div className="flex gap-2 mb-2">
                <input placeholder="What's the progress?" value={newUpdate} onChange={e => setNewUpdate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addUpdate()}
                  autoFocus className="game-input flex-1 text-sm" />
                <button onClick={addUpdate} disabled={!newUpdate.trim()}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors disabled:opacity-50">
                  Log
                </button>
              </div>
            )}
            {project.updates.length > 0 && (
              <div className="space-y-1.5">
                {project.updates.map(u => (
                  <div key={u.id} className="text-xs">
                    <span className="text-slate-600">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · </span>
                    <span className="text-slate-400">{u.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const { toastSuccess } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [form, setForm] = useState({
    name: '', description: '', category: 'work', color: '#8b5cf6',
    emoji: '🚀', target_date: '', tasks: ['', '', ''],
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await axios.get<Project[]>('/api/projects', { params: statusFilter !== 'all' ? { status: statusFilter } : {} })
    setProjects(res.data)
  }, [statusFilter])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const createProject = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/projects', {
        ...form,
        tasks: form.tasks.filter(t => t.trim()),
      })
      setForm({ name: '', description: '', category: 'work', color: '#8b5cf6', emoji: '🚀', target_date: '', tasks: ['', '', ''] })
      setShowCreate(false)
      await load()
      toastSuccess('Project created!')
    } finally { setSaving(false) }
  }

  const updateProject = async (id: number, data: any) => {
    await axios.patch(`/api/projects/${id}`, data)
    await load()
  }

  const deleteProject = async (id: number) => {
    await axios.delete(`/api/projects/${id}`)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const activeCount = projects.filter(p => p.status === 'active').length
  const avgProgress = activeCount > 0
    ? Math.round(projects.filter(p => p.status === 'active').reduce((s, p) => s + p.progress, 0) / activeCount)
    : 0

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FolderOpen className="w-7 h-7 text-blue-400" />
            Projects
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {activeCount} active · {avgProgress}% avg progress
          </p>
        </div>
        <button onClick={() => setShowCreate(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showCreate ? 'bg-slate-700 text-slate-300' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}>
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <div className="flex gap-2">
            <select value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              className="game-input w-14 text-center text-lg">
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input autoFocus placeholder="Project name…" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="game-input flex-1 font-semibold" />
          </div>
          <textarea rows={2} placeholder="Description (optional)…" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="game-input flex-1 text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
              className="game-input flex-1 text-sm" />
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Initial tasks (optional)</div>
            {form.tasks.map((t, i) => (
              <input key={i} placeholder={`Task ${i + 1}…`} value={t}
                onChange={e => setForm(f => ({ ...f, tasks: f.tasks.map((x, j) => j === i ? e.target.value : x) }))}
                className="game-input w-full text-sm" />
            ))}
            <button onClick={() => setForm(f => ({ ...f, tasks: [...f.tasks, ''] }))}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add task
            </button>
          </div>
          <button onClick={createProject} disabled={saving || !form.name.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-1.5">
        {['active', 'paused', 'completed', 'all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
              statusFilter === s ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Projects list */}
      <div className="space-y-3">
        {projects.length > 0 ? projects.map(p => (
          <ProjectCard key={p.id} project={p} onUpdate={updateProject} onDelete={deleteProject} onRefresh={load} />
        )) : (
          <div className="text-center py-16 text-slate-600">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {statusFilter !== 'all' ? statusFilter : ''} projects</p>
            <p className="text-xs mt-1">Track multi-task projects with progress and updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
