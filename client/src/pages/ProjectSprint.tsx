import { useState, useMemo } from 'react'
import { Zap, Plus, Trash2, Check, ChevronDown, ChevronUp, Target, Clock, BarChart3, X, Save, Edit2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TaskStatus = 'todo' | 'doing' | 'done'

interface SprintTask {
  id: string
  title: string
  estimate: number
  actual: number
  status: TaskStatus
}

interface Sprint {
  id: string
  name: string
  goal: string
  project: string
  startDate: string
  endDate: string
  tasks: SprintTask[]
  createdAt: string
}

const STORAGE_KEY = 'project_sprints'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function load(): Sprint[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveSprints(sprints: Sprint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sprints))
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

type SprintStatus = 'planning' | 'active' | 'complete'

function getSprintStatus(sprint: Sprint): SprintStatus {
  const now = Date.now()
  const start = new Date(sprint.startDate + 'T00:00:00').getTime()
  const end   = new Date(sprint.endDate   + 'T23:59:59').getTime()
  const allDone = sprint.tasks.length > 0 && sprint.tasks.every(t => t.status === 'done')
  if (allDone || now > end) return 'complete'
  if (now >= start) return 'active'
  return 'planning'
}

const STATUS_STYLE: Record<SprintStatus, string> = {
  planning: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  active:   'text-blue-400 bg-blue-900/20 border-blue-500/30',
  complete: 'text-green-400 bg-green-900/20 border-green-500/30',
}

const TASK_STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  todo:  'doing',
  doing: 'done',
  done:  'todo',
}

const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  todo:  'text-slate-500 border-slate-600 hover:border-slate-400',
  doing: 'text-yellow-400 border-yellow-500/60 bg-yellow-900/20',
  done:  'text-green-400 border-green-500/60 bg-green-900/20',
}

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo:  '○',
  doing: '◐',
  done:  '●',
}

interface SprintCardProps {
  sprint: Sprint
  onUpdate: (id: string, updated: Sprint) => void
  onDelete: (id: string) => void
}

function SprintCard({ sprint, onUpdate, onDelete }: SprintCardProps) {
  const { toastSuccess } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskEstimate, setNewTaskEstimate] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskDraft, setEditTaskDraft] = useState<SprintTask | null>(null)

  const status = getSprintStatus(sprint)
  const doneTasks = sprint.tasks.filter(t => t.status === 'done').length
  const totalTasks = sprint.tasks.length
  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

  const totalEstimate = sprint.tasks.reduce((s, t) => s + (t.estimate || 0), 0)
  const totalActual   = sprint.tasks.reduce((s, t) => s + (t.actual  || 0), 0)

  const updateSprint = (updated: Partial<Sprint>) => {
    onUpdate(sprint.id, { ...sprint, ...updated })
  }

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const task: SprintTask = {
      id: uid(),
      title: newTaskTitle.trim(),
      estimate: parseFloat(newTaskEstimate) || 0,
      actual: 0,
      status: 'todo',
    }
    updateSprint({ tasks: [...sprint.tasks, task] })
    setNewTaskTitle('')
    setNewTaskEstimate('')
    toastSuccess('Task added!')
  }

  const cycleTaskStatus = (taskId: string) => {
    updateSprint({
      tasks: sprint.tasks.map(t =>
        t.id === taskId ? { ...t, status: TASK_STATUS_NEXT[t.status] } : t
      ),
    })
  }

  const deleteTask = (taskId: string) => {
    updateSprint({ tasks: sprint.tasks.filter(t => t.id !== taskId) })
  }

  const startEditTask = (task: SprintTask) => {
    setEditingTaskId(task.id)
    setEditTaskDraft({ ...task })
  }

  const saveEditTask = () => {
    if (!editTaskDraft || !editTaskDraft.title.trim()) return
    updateSprint({
      tasks: sprint.tasks.map(t => t.id === editTaskDraft.id ? editTaskDraft : t),
    })
    setEditingTaskId(null)
    setEditTaskDraft(null)
  }

  return (
    <div className="game-card p-4 flex flex-col gap-3">
      {/* Sprint header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-100 text-base">{sprint.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[status]}`}>
              {status}
            </span>
          </div>
          {sprint.project && (
            <div className="text-xs text-slate-500 mt-0.5">{sprint.project}</div>
          )}
          {sprint.goal && (
            <div className="flex items-start gap-1 mt-1">
              <Target className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-snug">{sprint.goal}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(sprint.id)}
            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors"
            title="Delete sprint"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {doneTasks}/{totalTasks} tasks
          </span>
          <span className="text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateRange(sprint.startDate, sprint.endDate)}
          </span>
          <span
            className={`font-bold text-xs ${progress === 100 ? 'text-green-400' : progress > 50 ? 'text-blue-400' : 'text-slate-400'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-violet-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {(totalEstimate > 0 || totalActual > 0) && (
          <div className="flex gap-3 mt-1.5 text-[10px] text-slate-600">
            {totalEstimate > 0 && <span>Est: {totalEstimate}h</span>}
            {totalActual > 0 && (
              <span className={totalActual > totalEstimate && totalEstimate > 0 ? 'text-red-400' : ''}>
                Actual: {totalActual}h
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded task list */}
      {expanded && (
        <div className="border-t border-slate-700 pt-3 space-y-2">
          {sprint.tasks.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-2">No tasks yet. Add one below.</p>
          )}

          {sprint.tasks.map(task => (
            <div key={task.id}>
              {editingTaskId === task.id && editTaskDraft ? (
                <div className="bg-slate-700/40 rounded-lg p-2.5 space-y-2">
                  <input
                    className="game-input w-full text-sm"
                    value={editTaskDraft.title}
                    onChange={e => setEditTaskDraft(d => d ? { ...d, title: e.target.value } : d)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-0.5">Est (h)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="game-input w-full text-sm"
                        value={editTaskDraft.estimate || ''}
                        onChange={e => setEditTaskDraft(d => d ? { ...d, estimate: parseFloat(e.target.value) || 0 } : d)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-0.5">Actual (h)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="game-input w-full text-sm"
                        value={editTaskDraft.actual || ''}
                        onChange={e => setEditTaskDraft(d => d ? { ...d, actual: parseFloat(e.target.value) || 0 } : d)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-0.5">Status</label>
                      <select
                        className="game-input w-full text-sm"
                        value={editTaskDraft.status}
                        onChange={e => setEditTaskDraft(d => d ? { ...d, status: e.target.value as TaskStatus } : d)}
                      >
                        <option value="todo">To Do</option>
                        <option value="doing">Doing</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEditTask}
                      className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => { setEditingTaskId(null); setEditTaskDraft(null) }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/task py-1">
                  <button
                    onClick={() => cycleTaskStatus(task.id)}
                    title={`Status: ${task.status} — click to advance`}
                    className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors ${TASK_STATUS_STYLE[task.status]}`}
                  >
                    {TASK_STATUS_LABEL[task.status]}
                  </button>
                  <span
                    className={`flex-1 text-sm leading-snug ${
                      task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {task.title}
                  </span>
                  {(task.estimate > 0 || task.actual > 0) && (
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                      {task.actual > 0 ? `${task.actual}h` : ''}{task.estimate > 0 && task.actual > 0 ? '/' : ''}{task.estimate > 0 ? `${task.estimate}h est` : ''}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditTask(task)}
                      className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-slate-700 hover:text-red-400 transition-colors"
                      title="Delete task"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add task row */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700/50">
            <input
              className="game-input flex-1 text-sm"
              placeholder="Add task…"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <input
              type="number"
              min="0"
              step="0.5"
              className="game-input w-20 text-sm"
              placeholder="Est h"
              value={newTaskEstimate}
              onChange={e => setNewTaskEstimate(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  name: '',
  goal: '',
  project: '',
  startDate: '',
  endDate: '',
}

export default function ProjectSprint() {
  const { toastSuccess } = useToast()
  const [sprints, setSprints] = useState<Sprint[]>(load)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPast, setShowPast] = useState(false)

  const persist = (updated: Sprint[]) => {
    setSprints(updated)
    saveSprints(updated)
  }

  const handleCreate = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return
    const sprint: Sprint = {
      id: uid(),
      name: form.name.trim(),
      goal: form.goal.trim(),
      project: form.project.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      tasks: [],
      createdAt: new Date().toISOString(),
    }
    persist([sprint, ...sprints])
    setForm(EMPTY_FORM)
    setShowCreate(false)
    toastSuccess('Sprint created!', form.name)
  }

  const handleUpdate = (id: string, updated: Sprint) => {
    persist(sprints.map(s => s.id === id ? updated : s))
  }

  const handleDelete = (id: string) => {
    persist(sprints.filter(s => s.id !== id))
    toastSuccess('Sprint deleted')
  }

  const { activeSprints, pastSprints } = useMemo(() => {
    const sorted = [...sprints].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const active: Sprint[] = []
    const past: Sprint[]   = []
    for (const s of sorted) {
      if (getSprintStatus(s) === 'complete') past.push(s)
      else active.push(s)
    }
    return { activeSprints: active, pastSprints: past }
  }, [sprints])

  // Stats
  const totalTasksDone = sprints.reduce(
    (sum, s) => sum + s.tasks.filter(t => t.status === 'done').length,
    0
  )
  const sprintsWithTasks = sprints.filter(s => s.tasks.length > 0)
  const avgVelocity =
    sprintsWithTasks.length === 0
      ? 0
      : Math.round(
          sprintsWithTasks.reduce((sum, s) => sum + s.tasks.filter(t => t.status === 'done').length, 0) /
            sprintsWithTasks.length
        )

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Zap className="w-7 h-7 text-blue-400" />
            Project Sprints
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Sprint-based tracker for personal projects</p>
        </div>
        <button
          onClick={() => setShowCreate(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showCreate
              ? 'bg-slate-700 text-slate-300 border border-slate-600'
              : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
          }`}
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Sprint'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {activeSprints.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Active Sprints</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalTasksDone}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Tasks Done</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgVelocity}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Avg Velocity</div>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="game-card p-4 space-y-3 border-blue-500/20" style={{ boxShadow: '0 0 15px rgba(59,130,246,0.15)' }}>
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-400" /> New Sprint
          </h2>
          <input
            autoFocus
            className="game-input w-full text-sm"
            placeholder="Sprint name (e.g. MVP Alpha, Design Week)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className="game-input w-full text-sm"
            placeholder="Project (e.g. Personal Blog, Side App)"
            value={form.project}
            onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
          />
          <textarea
            rows={2}
            className="game-input w-full text-sm resize-none"
            placeholder="Sprint goal — what does success look like?"
            value={form.goal}
            onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-1">Start Date</label>
              <input
                type="date"
                className="game-input w-full text-sm"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-1">End Date</label>
              <input
                type="date"
                className="game-input w-full text-sm"
                value={form.endDate}
                min={form.startDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!form.name.trim() || !form.startDate || !form.endDate}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Create Sprint
          </button>
        </div>
      )}

      {/* Active sprints */}
      {activeSprints.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Active &amp; Planned
            </span>
            <span className="text-xs text-slate-600">({activeSprints.length})</span>
          </div>
          {activeSprints.map(sprint => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        !showCreate && (
          <div className="text-center py-16 text-slate-500">
            <Zap className="w-14 h-14 mx-auto mb-4 opacity-20 text-blue-400" />
            <p className="text-lg font-medium text-slate-400 mb-1">No active sprints</p>
            <p className="text-sm mb-4">Break your projects into focused sprints to make real progress.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors"
            >
              Create your first sprint
            </button>
          </div>
        )
      )}

      {/* Past sprints (collapsed) */}
      {pastSprints.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowPast(s => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-400 transition-colors group"
          >
            {showPast ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="uppercase tracking-wider">Past Sprints</span>
            <span className="text-xs text-slate-600">({pastSprints.length})</span>
          </button>
          {showPast && (
            <div className="space-y-3">
              {pastSprints.map(sprint => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
