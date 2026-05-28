import { useState, useEffect } from 'react'
import { Home, Plus, Trash2, Check, X, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TaskStatus = 'todo' | 'inprogress' | 'done'
type Priority = 'low' | 'medium' | 'high'
type Room = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'garage' | 'yard' | 'office' | 'other'

interface HomeTask {
  id: string
  title: string
  room: Room
  priority: Priority
  status: TaskStatus
  cost: number
  dueDate: string
  notes: string
  diy: boolean
  createdAt: string
}

const ROOM_CONFIG: Record<Room, { label: string; emoji: string }> = {
  living:   { label: 'Living Room', emoji: '🛋️' },
  kitchen:  { label: 'Kitchen',     emoji: '🍳' },
  bedroom:  { label: 'Bedroom',     emoji: '🛏️' },
  bathroom: { label: 'Bathroom',    emoji: '🚿' },
  garage:   { label: 'Garage',      emoji: '🚗' },
  yard:     { label: 'Yard/Garden', emoji: '🌿' },
  office:   { label: 'Home Office', emoji: '💻' },
  other:    { label: 'Other',       emoji: '🏠' },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#22c55e' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high:   { label: 'High',   color: '#ef4444' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo:       { label: 'To Do',       color: '#6366f1' },
  inprogress: { label: 'In Progress', color: '#f59e0b' },
  done:       { label: 'Done',        color: '#22c55e' },
}

const STORAGE_KEY = 'home_improvement'

export default function HomeImprovement() {
  const { toastSuccess } = useToast()
  const [tasks, setTasks] = useState<HomeTask[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRoom, setFilterRoom] = useState<string>('all')
  const [form, setForm] = useState<Omit<HomeTask, 'id' | 'createdAt'>>({
    title: '', room: 'living', priority: 'medium', status: 'todo', cost: 0, dueDate: '', notes: '', diy: true,
  })

  useEffect(() => {
    try { setTasks(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: HomeTask[]) => { setTasks(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const t: HomeTask = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([t, ...tasks])
    setForm({ title: '', room: 'living', priority: 'medium', status: 'todo', cost: 0, dueDate: '', notes: '', diy: true })
    setShowForm(false)
    toastSuccess(`"${form.title}" added`)
  }

  const updateStatus = (id: string, status: TaskStatus) => {
    save(tasks.map(t => t.id === id ? { ...t, status } : t))
    if (status === 'done') toastSuccess('Task complete! 🏠')
  }

  const del = (id: string) => save(tasks.filter(t => t.id !== id))

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterRoom !== 'all' && t.room !== filterRoom) return false
    return true
  })

  const totalCost = tasks.filter(t => t.status !== 'done').reduce((s, t) => s + t.cost, 0)
  const doneCost = tasks.filter(t => t.status === 'done').reduce((s, t) => s + t.cost, 0)
  const doneCount = tasks.filter(t => t.status === 'done').length

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Home className="w-7 h-7 text-orange-400" />
            Home Improvement
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track repairs, upgrades, and projects around the home.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{tasks.length - doneCount}</div>
          <div className="text-xs text-slate-500">Remaining</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-red-400">${totalCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Estimated Cost</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">${doneCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Spent</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="game-input text-sm">
          <option value="all">All status</option>
          {(Object.entries(STATUS_CONFIG) as [TaskStatus, typeof STATUS_CONFIG.todo][]).map(([k, s]) => (
            <option key={k} value={k}>{s.label}</option>
          ))}
        </select>
        <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="game-input text-sm">
          <option value="all">All rooms</option>
          {(Object.entries(ROOM_CONFIG) as [Room, typeof ROOM_CONFIG.living][]).map(([k, r]) => (
            <option key={k} value={k}>{r.emoji} {r.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Task</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Task title *" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value as Room }))} className="game-input text-sm">
              {(Object.entries(ROOM_CONFIG) as [Room, typeof ROOM_CONFIG.living][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))} className="game-input text-sm">
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG.low][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs text-slate-500">Cost $</span>
              <input type="number" value={form.cost} min={0}
                onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
                className="game-input flex-1 text-sm text-center" />
            </div>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="game-input flex-1 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" checked={form.diy} onChange={e => setForm(f => ({ ...f, diy: e.target.checked }))} className="rounded" />
            DIY project (not hiring out)
          </label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes, materials needed..." className="game-input w-full h-16 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold">Add Task</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map(t => {
          const r = ROOM_CONFIG[t.room]
          const p = PRIORITY_CONFIG[t.priority]
          const s = STATUS_CONFIG[t.status]
          return (
            <div key={t.id} className={`game-card p-4 ${t.status === 'done' ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${t.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>{t.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                    {t.diy && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">DIY</span>}
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{r.label}</span>
                    {t.cost > 0 && <span>${t.cost.toLocaleString()}</span>}
                    {t.dueDate && <span>Due: {t.dueDate}</span>}
                  </div>
                  {t.notes && <p className="text-xs text-slate-600 mt-1 italic">{t.notes}</p>}
                  <div className="flex gap-1.5 mt-2">
                    {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(st => (
                      <button key={st} onClick={() => updateStatus(t.id, st)}
                        className={`px-2 py-0.5 rounded-full text-xs transition-all ${t.status === st ? 'text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        style={t.status === st ? { background: STATUS_CONFIG[st].color + '30', color: STATUS_CONFIG[st].color } : {}}>
                        {STATUS_CONFIG[st].label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => del(t.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Home className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No tasks found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
