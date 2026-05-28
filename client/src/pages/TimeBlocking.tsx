import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Clock, Plus, ChevronLeft, ChevronRight, Trash2, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Block {
  id: number
  date: string
  start_time: string
  end_time: string
  title: string
  category: string
  color: string
  completed: number
  notes: string
}

const CATEGORIES = [
  { value: 'deep-work', label: 'Deep Work', color: '#3b82f6' },
  { value: 'meetings', label: 'Meetings', color: '#8b5cf6' },
  { value: 'admin', label: 'Admin', color: '#94a3b8' },
  { value: 'learning', label: 'Learning', color: '#14b8a6' },
  { value: 'health', label: 'Health', color: '#22c55e' },
  { value: 'personal', label: 'Personal', color: '#ec4899' },
  { value: 'creative', label: 'Creative', color: '#f59e0b' },
  { value: 'break', label: 'Break', color: '#64748b' },
]

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6am–9pm

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function blockHeight(start: string, end: string) {
  const mins = timeToMinutes(end) - timeToMinutes(start)
  return Math.max(mins, 15) // min 15min visual
}

export default function TimeBlocking() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [date, setDate] = useState(today)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ start_time: '09:00', end_time: '10:00', title: '', category: 'deep-work', notes: '' })

  useEffect(() => { loadBlocks() }, [date])

  const loadBlocks = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`/api/time-blocks/${date}`)
      setBlocks(r.data as Block[])
    } finally { setLoading(false) }
  }

  const addBlock = async () => {
    if (!form.title.trim()) return
    const cat = CATEGORIES.find(c => c.value === form.category)
    await axios.post('/api/time-blocks', { ...form, date, color: cat?.color || '#3b82f6' })
    setShowForm(false)
    setForm({ start_time: '09:00', end_time: '10:00', title: '', category: 'deep-work', notes: '' })
    toastSuccess('Block added!')
    loadBlocks()
  }

  const toggleComplete = async (b: Block) => {
    await axios.patch(`/api/time-blocks/${b.id}`, { completed: !b.completed })
    loadBlocks()
  }

  const deleteBlock = async (id: number) => {
    await axios.delete(`/api/time-blocks/${id}`)
    loadBlocks()
  }

  const prevDay = () => {
    const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }
  const nextDay = () => {
    const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }

  const totalPlanned = blocks.reduce((s, b) => s + (timeToMinutes(b.end_time) - timeToMinutes(b.start_time)), 0)
  const totalDone = blocks.filter(b => b.completed).reduce((s, b) => s + (timeToMinutes(b.end_time) - timeToMinutes(b.start_time)), 0)
  const now = new Date()
  const currentMins = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-blue-400" />
            Time Blocking
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Plan your day in focused blocks</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Block
        </button>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={prevDay} className="p-1 text-slate-600 hover:text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
        <span className="flex-1 text-center text-sm font-semibold text-slate-300">
          {date === today ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
        <button onClick={nextDay} className="p-1 text-slate-600 hover:text-slate-400"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Stats */}
      {blocks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-lg font-bold text-white">{blocks.length}</div>
            <div className="text-xs text-slate-500">Blocks</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{Math.round(totalPlanned / 60)}h {totalPlanned % 60}m</div>
            <div className="text-xs text-slate-500">Planned</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-lg font-bold text-green-400">{Math.round(totalDone / 60)}h {totalDone % 60}m</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-4 border border-blue-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">New Time Block</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What will you work on?"
            className="game-input w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Start</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">End</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="game-input w-full" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.category === c.value
                  ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` }
                  : { background: '#1e293b', color: '#94a3b8' }
                }>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addBlock} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Add Block
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="game-card p-4">
        <div className="relative">
          {/* Hour grid */}
          {HOURS.map(h => (
            <div key={h} className="flex items-start gap-3 h-[60px] border-t border-slate-800/50 first:border-t-0">
              <span className="text-[10px] text-slate-700 w-10 flex-shrink-0 pt-0.5">{h === 12 ? '12pm' : h > 12 ? `${h-12}pm` : `${h}am`}</span>
              <div className="flex-1 relative" />
            </div>
          ))}

          {/* Current time line */}
          {date === today && currentMins >= 6 * 60 && currentMins <= 21 * 60 && (
            <div className="absolute left-0 right-0 flex items-center gap-1 pointer-events-none z-20"
              style={{ top: `${((currentMins - 6 * 60) / 60) * 60}px` }}>
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 ml-12" />
              <div className="flex-1 h-px bg-red-500 opacity-60" />
            </div>
          )}

          {/* Blocks */}
          {blocks.map(b => {
            const startMins = timeToMinutes(b.start_time)
            const endMins = timeToMinutes(b.end_time)
            const top = ((startMins - 6 * 60) / 60) * 60
            const height = ((endMins - startMins) / 60) * 60
            if (top < 0 || top > 15 * 60) return null
            return (
              <div key={b.id}
                className={`absolute left-14 right-0 rounded-lg p-2 flex items-start justify-between gap-1 group cursor-pointer transition-all ${b.completed ? 'opacity-50' : ''}`}
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 28)}px`,
                  background: b.color + '33',
                  borderLeft: `3px solid ${b.color}`,
                }}>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${b.completed ? 'line-through text-slate-500' : 'text-white'}`}>{b.title}</div>
                  {height > 35 && (
                    <div className="text-[10px] text-slate-500">{b.start_time}–{b.end_time}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleComplete(b)} className="p-0.5 hover:text-green-400 text-slate-500 transition-colors">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteBlock(b.id)} className="p-0.5 hover:text-red-400 text-slate-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Block list */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          {blocks.map(b => {
            const duration = timeToMinutes(b.end_time) - timeToMinutes(b.start_time)
            const cat = CATEGORIES.find(c => c.value === b.category)
            return (
              <div key={b.id} className={`game-card p-3 flex items-center gap-3 ${b.completed ? 'opacity-50' : ''}`}>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${b.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{b.title}</div>
                  <div className="text-xs text-slate-600">{b.start_time}–{b.end_time} · {duration}m · {cat?.label || b.category}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleComplete(b)}
                    className={`p-1.5 rounded-lg transition-colors ${b.completed ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-500 hover:text-green-400'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteBlock(b.id)} className="p-1.5 bg-slate-700 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && blocks.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-3">No blocks for this day yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Plan your day
          </button>
        </div>
      )}
    </div>
  )
}
