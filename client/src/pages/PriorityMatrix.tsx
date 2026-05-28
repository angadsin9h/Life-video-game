import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, ArrowRight } from 'lucide-react'

// Eisenhower Matrix: 4 quadrants
// Q1: Urgent+Important (Do First)
// Q2: Not Urgent+Important (Schedule)
// Q3: Urgent+Not Important (Delegate)
// Q4: Not Urgent+Not Important (Eliminate)

interface Task {
  id: string
  text: string
  quadrant: 1 | 2 | 3 | 4
  done: boolean
  date: string
}

const QUADRANTS = [
  { id: 1 as const, label: 'Do First', sub: 'Urgent + Important', color: '#ef4444', bg: 'bg-red-900/10', border: 'border-red-500/20', icon: '🔥' },
  { id: 2 as const, label: 'Schedule', sub: 'Not Urgent + Important', color: '#3b82f6', bg: 'bg-blue-900/10', border: 'border-blue-500/20', icon: '📅' },
  { id: 3 as const, label: 'Delegate', sub: 'Urgent + Not Important', color: '#eab308', bg: 'bg-yellow-900/10', border: 'border-yellow-500/20', icon: '👥' },
  { id: 4 as const, label: 'Eliminate', sub: 'Not Urgent + Not Important', color: '#94a3b8', bg: 'bg-slate-800/50', border: 'border-slate-700', icon: '🗑️' },
]

const STORAGE_KEY = 'priority_matrix'
const today = new Date().toISOString().split('T')[0]

function load(): Task[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function save(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export default function PriorityMatrix() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [inputs, setInputs] = useState<Record<number, string>>({ 1: '', 2: '', 3: '', 4: '' })
  const [showArchive, setShowArchive] = useState(false)

  useEffect(() => { setTasks(load()) }, [])

  const todayTasks = tasks.filter(t => t.date === today)
  const archiveTasks = tasks.filter(t => t.date !== today)

  const addTask = (q: 1 | 2 | 3 | 4) => {
    const text = inputs[q]?.trim()
    if (!text) return
    const newTask: Task = { id: Date.now().toString(), text, quadrant: q, done: false, date: today }
    const updated = [...tasks, newTask]
    setTasks(updated)
    save(updated)
    setInputs(i => ({ ...i, [q]: '' }))
  }

  const toggle = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(updated)
    save(updated)
  }

  const remove = (id: string) => {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated)
    save(updated)
  }

  const moveToQ2 = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, quadrant: 2 as const } : t)
    setTasks(updated)
    save(updated)
  }

  const todayDone = todayTasks.filter(t => t.done).length

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Priority Matrix
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Eisenhower matrix — focus on what matters</p>
        </div>
        {todayTasks.length > 0 && (
          <div className="text-sm text-slate-400">
            <span className="text-green-400 font-bold">{todayDone}</span>/{todayTasks.length} done today
          </div>
        )}
      </div>

      {/* Q2 tip */}
      <div className="game-card p-3 border border-blue-500/20 bg-blue-900/5 flex items-center gap-2">
        <span className="text-blue-400 text-lg">💡</span>
        <p className="text-xs text-slate-400">
          <span className="text-blue-400 font-semibold">Q2 (Schedule)</span> is the most impactful quadrant — important work that's rarely urgent. Move Q1 tasks here after handling them.
        </p>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {QUADRANTS.map(q => {
          const qTasks = todayTasks.filter(t => t.quadrant === q.id)
          return (
            <div key={q.id} className={`game-card p-4 border ${q.border} ${q.bg} space-y-3`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{q.icon}</span>
                <div>
                  <div className="font-bold text-sm" style={{ color: q.color }}>{q.label}</div>
                  <div className="text-xs text-slate-600">{q.sub}</div>
                </div>
                <div className="ml-auto text-xs text-slate-600">{qTasks.filter(t => t.done).length}/{qTasks.length}</div>
              </div>

              {/* Task list */}
              <div className="space-y-1.5 min-h-[60px]">
                {qTasks.map(t => (
                  <div key={t.id} className="flex items-start gap-2 group">
                    <button onClick={() => toggle(t.id)}
                      className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border-2 transition-colors ${t.done ? 'border-transparent flex items-center justify-center' : ''}`}
                      style={{ borderColor: t.done ? q.color : '#475569', background: t.done ? q.color : 'transparent' }}>
                      {t.done && <span className="text-white text-[10px]">✓</span>}
                    </button>
                    <span className={`flex-1 text-xs leading-relaxed ${t.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>{t.text}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {q.id === 1 && !t.done && (
                        <button onClick={() => moveToQ2(t.id)} title="Move to Schedule" className="text-slate-600 hover:text-blue-400 transition-colors">
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => remove(t.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add input */}
              <div className="flex gap-1">
                <input
                  value={inputs[q.id] || ''}
                  onChange={e => setInputs(i => ({ ...i, [q.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addTask(q.id)}
                  placeholder="Add task..."
                  className="flex-1 bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-slate-500"
                />
                <button onClick={() => addTask(q.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs transition-colors text-white"
                  style={{ background: q.color + 'aa' }}>
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary row */}
      {todayTasks.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {QUADRANTS.map(q => {
            const qTasks = todayTasks.filter(t => t.quadrant === q.id)
            const done = qTasks.filter(t => t.done).length
            return (
              <div key={q.id} className="game-card p-2.5 text-center">
                <div className="text-xs text-slate-500 mb-0.5">{q.label}</div>
                <div className="font-bold text-sm" style={{ color: q.color }}>{done}/{qTasks.length}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Archive toggle */}
      {archiveTasks.length > 0 && (
        <div>
          <button onClick={() => setShowArchive(!showArchive)} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            {showArchive ? '▼' : '▶'} Past days ({archiveTasks.length} tasks)
          </button>
          {showArchive && (
            <div className="mt-3 space-y-1">
              {[...new Set(archiveTasks.map(t => t.date))].sort().reverse().slice(0, 5).map(date => {
                const dayTasks = archiveTasks.filter(t => t.date === date)
                const done = dayTasks.filter(t => t.done).length
                return (
                  <div key={date} className="game-card p-3 flex items-center justify-between">
                    <span className="text-sm text-slate-400">{date}</span>
                    <span className="text-sm text-slate-500">{done}/{dayTasks.length} completed</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
