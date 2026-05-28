import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, Clock, ChevronRight, Check, Zap, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Task {
  id: number
  log_id: number
  category: string
  task_name: string
  duration_minutes: number
  completed: number
  notes: string | null
  created_at: string
}

type Column = 'todo' | 'doing' | 'done'

interface BoardTask extends Task {
  column: Column
}

const CAT_COLORS: Record<string, string> = {
  health: 'border-l-green-500 bg-green-900/5',
  mind:   'border-l-cyan-500 bg-cyan-900/5',
  work:   'border-l-violet-500 bg-violet-900/5',
  social: 'border-l-yellow-500 bg-yellow-900/5',
  growth: 'border-l-orange-500 bg-orange-900/5',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_BADGE: Record<string, string> = {
  health: 'bg-green-900/30 text-green-400 border-green-500/30',
  mind: 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30',
  work: 'bg-violet-900/30 text-violet-400 border-violet-500/30',
  social: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  growth: 'bg-orange-900/30 text-orange-400 border-orange-500/30',
}
const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']

const QUICK_TASKS: Record<string, string[]> = {
  health: ['Morning workout', 'Cardio run', 'Yoga session', 'Meal prep', 'Meditation'],
  mind: ['Read book', 'Study session', 'Online course', 'Journaling', 'Puzzle/brain game'],
  work: ['Deep work block', 'Email inbox', 'Project planning', 'Code review', 'Team meeting'],
  social: ['Call friend/family', 'Coffee catch-up', 'Write letter/message', 'Networking'],
  growth: ['Learn new skill', 'Side project', 'Read articles', 'Practice habit', 'Goal review'],
}

function TaskCard({ task, onMove, onDelete }: {
  task: BoardTask
  onMove: (id: number, col: Column) => void
  onDelete: (id: number) => void
}) {
  const cc = CAT_COLORS[task.category] || 'border-l-slate-600 bg-slate-800/30'
  const badge = CAT_BADGE[task.category] || 'bg-slate-800 text-slate-400 border-slate-700'

  return (
    <div className={`game-card p-3 border-l-4 ${cc} group`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${task.column === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {task.task_name}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${badge}`}>
              {CAT_ICONS[task.category]} {task.category}
            </span>
            <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />{task.duration_minutes}m
            </span>
          </div>
        </div>
        <button onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 transition-all flex-shrink-0 p-0.5">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-1 mt-2">
        {(['todo', 'doing', 'done'] as Column[]).filter(c => c !== task.column).map(col => (
          <button key={col} onClick={() => onMove(task.id, col)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors capitalize">
            {col === 'done' ? <Check className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
            {col}
          </button>
        ))}
      </div>
    </div>
  )
}

function Column({ title, color, tasks, onMove, onDelete, children }: {
  title: string
  color: string
  tasks: BoardTask[]
  onMove: (id: number, col: Column) => void
  onDelete: (id: number) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-2 mb-3 px-1`}>
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-xs text-slate-600 ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map(t => (
          <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} />
        ))}
        {children}
      </div>
    </div>
  )
}

export default function TaskBoard() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [tasks, setTasks] = useState<BoardTask[]>([])
  const [columns, setColumns] = useState<Map<number, Column>>(new Map())
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ task_name: '', category: 'work', duration_minutes: 30 })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await axios.get<{ tasks: Task[] } | null>(`/api/logs/${today}`)
    const raw: Task[] = res.data?.tasks ?? []
    // Load column assignments from localStorage
    const stored = localStorage.getItem(`board_${today}`)
    const colMap: Record<number, Column> = stored ? JSON.parse(stored) : {}

    const boardTasks: BoardTask[] = raw.map(t => ({
      ...t,
      column: colMap[t.id] || (t.completed ? 'done' : 'todo'),
    }))
    setTasks(boardTasks)
    const newMap = new Map<number, Column>()
    boardTasks.forEach(t => newMap.set(t.id, t.column))
    setColumns(newMap)
  }, [today])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const saveColumns = (map: Map<number, Column>) => {
    const obj: Record<number, Column> = {}
    map.forEach((v, k) => { obj[k] = v })
    localStorage.setItem(`board_${today}`, JSON.stringify(obj))
  }

  const moveTask = (id: number, col: Column) => {
    const newMap = new Map(columns)
    newMap.set(id, col)
    setColumns(newMap)
    saveColumns(newMap)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, column: col } : t))
    // If marking done, update completed status
    if (col === 'done') {
      axios.patch(`/api/logs/task/${id}`, { completed: 1 }).catch(() => {})
    }
  }

  const deleteTask = async (id: number) => {
    await axios.delete(`/api/logs/task/${id}`)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const addTask = async () => {
    if (!form.task_name.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/logs/task', { date: today, ...form })
      setForm({ task_name: '', category: 'work', duration_minutes: 30 })
      setShowAdd(false)
      await load()
      toastSuccess('Task added to board!')
    } finally { setSaving(false) }
  }

  const todo = tasks.filter(t => t.column === 'todo')
  const doing = tasks.filter(t => t.column === 'doing')
  const done = tasks.filter(t => t.column === 'done')
  const totalMins = tasks.reduce((s, t) => s + t.duration_minutes, 0)
  const doneMins = done.reduce((s, t) => s + t.duration_minutes, 0)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Task Board
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {totalMins > 0 && <span className="ml-2">· {doneMins}/{totalMins}m done</span>}
          </p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${showAdd ? 'bg-slate-700 text-slate-300' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${tasks.length > 0 ? (done.length / tasks.length) * 100 : 0}%` }} />
        </div>
      )}

      {/* Add task form */}
      {showAdd && (
        <div className="game-card p-4 border border-yellow-500/20">
          <div className="space-y-3">
            <input autoFocus placeholder="Task name…" value={form.task_name}
              onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              className="game-input w-full" />
            {/* Quick task suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {(QUICK_TASKS[form.category] || []).slice(0, 4).map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, task_name: s }))}
                  className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="game-input flex-1 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
              <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}
                className="game-input w-24 text-sm">
                {[15, 25, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m}m</option>)}
              </select>
            </div>
            <button onClick={addTask} disabled={saving || !form.task_name.trim()}
              className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : 'Add to Board'}
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-slate-600">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tasks today yet</p>
          <p className="text-xs mt-1">Add tasks to organize your day</p>
        </div>
      ) : (
        /* Board columns */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Column title="To Do" color="bg-slate-500" tasks={todo} onMove={moveTask} onDelete={deleteTask} />
          <Column title="In Progress" color="bg-yellow-500" tasks={doing} onMove={moveTask} onDelete={deleteTask} />
          <Column title="Done" color="bg-green-500" tasks={done} onMove={moveTask} onDelete={deleteTask}>
            {done.length > 0 && done.length === tasks.length && (
              <div className="text-center text-green-400 text-xs font-semibold py-2">
                🎉 All tasks complete!
              </div>
            )}
          </Column>
        </div>
      )}
    </div>
  )
}
