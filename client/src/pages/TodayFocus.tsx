import { useState, useEffect } from 'react'
import { Target, Check, Plus, Trash2, Star, X, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface FocusTask {
  id: string
  text: string
  priority: 'MIT' | 'important' | 'nice'
  done: boolean
}

interface DayFocus {
  date: string
  mainFocus: string
  intention: string
  tasks: FocusTask[]
  eveningReflection: string
  rating: number
  energyLevel: number
}

const PRIORITY_LABELS = {
  MIT: { label: 'Most Important', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  important: { label: 'Important', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  nice: { label: 'Nice to Do', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
}

const STORAGE_PREFIX = 'today_focus'

const getToday = () => new Date().toISOString().split('T')[0]

const loadDay = (date: string): DayFocus => {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}_${date}`)
    if (saved) return JSON.parse(saved)
  } catch { /**/ }
  return { date, mainFocus: '', intention: '', tasks: [], eveningReflection: '', rating: 0, energyLevel: 5 }
}

export default function TodayFocus() {
  const { toastSuccess } = useToast()
  const today = getToday()
  const [data, setData] = useState<DayFocus>(() => loadDay(today))
  const [newTask, setNewTask] = useState('')
  const [newPriority, setNewPriority] = useState<FocusTask['priority']>('important')
  const [showEvening, setShowEvening] = useState(false)
  const [viewDate, setViewDate] = useState(today)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    setData(loadDay(viewDate))
  }, [viewDate])

  const save = (updated: DayFocus) => {
    setData(updated)
    localStorage.setItem(`${STORAGE_PREFIX}_${updated.date}`, JSON.stringify(updated))
  }

  const addTask = () => {
    if (!newTask.trim()) return
    const task: FocusTask = { id: Date.now().toString(), text: newTask.trim(), priority: newPriority, done: false }
    save({ ...data, tasks: [...data.tasks, task] })
    setNewTask('')
  }

  const toggleTask = (id: string) => {
    const updated = { ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }
    save(updated)
    const task = data.tasks.find(t => t.id === id)
    if (task && !task.done) toastSuccess(`Task done: "${task.text}" ✓`)
  }

  const deleteTask = (id: string) => save({ ...data, tasks: data.tasks.filter(t => t.id !== id) })

  const completionRate = data.tasks.length > 0
    ? Math.round((data.tasks.filter(t => t.done).length / data.tasks.length) * 100)
    : 0

  const mitDone = data.tasks.filter(t => t.priority === 'MIT' && t.done).length
  const mitTotal = data.tasks.filter(t => t.priority === 'MIT').length

  // Last 7 days for history
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const day = loadDay(ds)
    const rate = day.tasks.length > 0 ? Math.round((day.tasks.filter(t => t.done).length / day.tasks.length) * 100) : 0
    return { date: ds, rate, mainFocus: day.mainFocus, rating: day.rating }
  }).reverse()

  const isToday = viewDate === today

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-orange-400" />
            Today's Focus
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">One day. One focus. Execute.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(h => !h)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-2">
        <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-1); setViewDate(d.toISOString().split('T')[0]) }}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          ‹
        </button>
        <span className="text-sm text-slate-400 flex-1 text-center">
          {isToday ? '📅 Today' : new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
        <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+1); if (d.toISOString().split('T')[0] <= today) setViewDate(d.toISOString().split('T')[0]) }}
          className={`p-1.5 rounded-lg bg-slate-800 text-slate-400 ${viewDate < today ? 'hover:text-white' : 'opacity-30 cursor-not-allowed'}`}>
          ›
        </button>
      </div>

      {/* Main focus */}
      <div className="game-card p-5 border border-orange-500/20">
        <label className="text-xs text-orange-400 uppercase tracking-wider mb-2 block">Main Focus for the Day</label>
        <input value={data.mainFocus}
          onChange={e => save({ ...data, mainFocus: e.target.value })}
          placeholder="What's the ONE thing that will make today a success?"
          className="game-input w-full text-lg font-medium"
          readOnly={!isToday} />
        {isToday && (
          <input value={data.intention}
            onChange={e => save({ ...data, intention: e.target.value })}
            placeholder="Set your intention for today..."
            className="game-input w-full mt-2 text-sm" />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{completionRate}%</div>
          <div className="text-xs text-slate-500">Complete</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{mitDone}/{mitTotal}</div>
          <div className="text-xs text-slate-500">MITs Done</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-slate-400">{data.tasks.length}</div>
          <div className="text-xs text-slate-500">Tasks Total</div>
        </div>
      </div>

      {/* Add task */}
      {isToday && (
        <div className="flex gap-2">
          <select value={newPriority} onChange={e => setNewPriority(e.target.value as FocusTask['priority'])}
            className="game-input w-32 flex-shrink-0 text-xs">
            <option value="MIT">🔴 MIT</option>
            <option value="important">🔵 Important</option>
            <option value="nice">⚪ Nice</option>
          </select>
          <input value={newTask} onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Add task..." className="game-input flex-1" />
          <button onClick={addTask} className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tasks by priority */}
      {(['MIT', 'important', 'nice'] as const).map(p => {
        const tasks = data.tasks.filter(t => t.priority === p)
        if (tasks.length === 0) return null
        const cfg = PRIORITY_LABELS[p]
        return (
          <div key={p} className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
              {cfg.label} ({tasks.filter(t => t.done).length}/{tasks.length})
            </div>
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cfg.bg }}>
                <button onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${task.done ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-slate-400'}`}>
                  {task.done && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${task.done ? 'line-through text-slate-600' : 'text-white'}`}>
                  {task.text}
                </span>
                {isToday && (
                  <button onClick={() => deleteTask(task.id)} className="p-0.5 text-slate-700 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {/* Evening reflection */}
      {isToday && (
        <div className="game-card p-4">
          <button onClick={() => setShowEvening(e => !e)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-400 hover:text-slate-200">
            <span>🌙 Evening Reflection</span>
            <span className="text-xs">{showEvening ? '▲' : '▼'}</span>
          </button>
          {showEvening && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Day rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => save({ ...data, rating: n })}>
                      <Star className={`w-6 h-6 ${n <= data.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={data.eveningReflection}
                onChange={e => save({ ...data, eveningReflection: e.target.value })}
                placeholder="What worked? What would you do differently? Key win of the day?"
                className="game-input w-full h-24 resize-none" />
            </div>
          )}
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Last 7 Days</h3>
          <div className="space-y-2">
            {last7.map(d => (
              <button key={d.date} onClick={() => { setViewDate(d.date); setShowHistory(false) }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors">
                <span className="text-xs text-slate-500 w-20 flex-shrink-0">{d.date.slice(5)}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${d.rate}%` }} />
                </div>
                <span className="text-xs text-orange-400 w-10 text-right">{d.rate}%</span>
                {d.rating > 0 && (
                  <span className="text-xs text-yellow-400">{'★'.repeat(d.rating)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.tasks.length === 0 && isToday && (
        <div className="text-center py-8 text-slate-500">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Set your main focus above, then add your tasks.</p>
          <p className="text-xs mt-1 text-slate-600">Start with your MITs — Most Important Tasks.</p>
        </div>
      )}
    </div>
  )
}
