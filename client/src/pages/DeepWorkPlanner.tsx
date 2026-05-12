import { useEffect, useState } from 'react'
import { Clock, Plus, Trash2, Check, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface DeepWorkBlock {
  id: string
  date: string
  startTime: string
  duration: number
  task: string
  context: string
  actualDuration?: number
  completed: boolean
  distractions: number
  flowState: boolean
  notes: string
}

interface DailyTheme {
  date: string
  theme: string
  energyLevel: number
}

const CONTEXTS = [
  { value: 'creative', label: 'Creative', emoji: '🎨', color: '#ec4899' },
  { value: 'analytical', label: 'Analytical', emoji: '🧮', color: '#3b82f6' },
  { value: 'writing', label: 'Writing', emoji: '✍️', color: '#8b5cf6' },
  { value: 'coding', label: 'Coding', emoji: '💻', color: '#22c55e' },
  { value: 'planning', label: 'Planning', emoji: '📋', color: '#f97316' },
  { value: 'learning', label: 'Learning', emoji: '📚', color: '#eab308' },
]

const STORAGE_KEY = 'deep_work_planner'
const THEME_KEY = 'deep_work_themes'

export default function DeepWorkPlanner() {
  const { toastSuccess } = useToast()
  const [blocks, setBlocks] = useState<DeepWorkBlock[]>([])
  const [themes, setThemes] = useState<DailyTheme[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)
  const [completeForm, setCompleteForm] = useState({ actualDuration: '', distractions: '0', flowState: false, notes: '' })
  const [form, setForm] = useState({ startTime: '09:00', duration: '90', task: '', context: 'coding', notes: '' })
  const [themeText, setThemeText] = useState('')
  const [energyLevel, setEnergyLevel] = useState(7)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setBlocks(JSON.parse(saved))
    const savedThemes = localStorage.getItem(THEME_KEY)
    if (savedThemes) setThemes(JSON.parse(savedThemes))
  }, [])

  useEffect(() => {
    const t = themes.find(th => th.date === date)
    if (t) { setThemeText(t.theme); setEnergyLevel(t.energyLevel) }
    else { setThemeText(''); setEnergyLevel(7) }
  }, [date, themes])

  const persist = (updated: DeepWorkBlock[]) => {
    setBlocks(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveTheme = () => {
    const updated = [{ date, theme: themeText, energyLevel }, ...themes.filter(t => t.date !== date)]
    setThemes(updated)
    localStorage.setItem(THEME_KEY, JSON.stringify(updated))
    toastSuccess('Daily theme saved!')
  }

  const addBlock = () => {
    if (!form.task.trim()) return
    const block: DeepWorkBlock = {
      id: Date.now().toString(),
      date,
      startTime: form.startTime,
      duration: parseInt(form.duration) || 90,
      task: form.task,
      context: form.context,
      completed: false,
      distractions: 0,
      flowState: false,
      notes: form.notes,
    }
    persist([...blocks, block])
    setForm({ startTime: '09:00', duration: '90', task: '', context: 'coding', notes: '' })
    setShowForm(false)
    toastSuccess('Deep work block added!')
  }

  const completeBlock = (id: string) => {
    const updated = blocks.map(b => {
      if (b.id !== id) return b
      return {
        ...b,
        completed: true,
        actualDuration: parseInt(completeForm.actualDuration) || b.duration,
        distractions: parseInt(completeForm.distractions) || 0,
        flowState: completeForm.flowState,
        notes: completeForm.notes || b.notes,
      }
    })
    persist(updated)
    setCompleting(null)
    setCompleteForm({ actualDuration: '', distractions: '0', flowState: false, notes: '' })
    toastSuccess('Session completed! Great work. 🔥')
  }

  const deleteBlock = (id: string) => persist(blocks.filter(b => b.id !== id))

  const shiftDate = (d: number) => {
    const dt = new Date(date + 'T12:00:00')
    dt.setDate(dt.getDate() + d)
    setDate(dt.toISOString().split('T')[0])
  }

  const isToday = date === new Date().toISOString().split('T')[0]
  const todayBlocks = blocks.filter(b => b.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const totalPlanned = todayBlocks.reduce((s, b) => s + b.duration, 0)
  const totalCompleted = todayBlocks.filter(b => b.completed).reduce((s, b) => s + (b.actualDuration || b.duration), 0)
  const flowSessions = todayBlocks.filter(b => b.flowState).length

  // All-time stats
  const allCompleted = blocks.filter(b => b.completed)
  const allTimeMins = allCompleted.reduce((s, b) => s + (b.actualDuration || b.duration), 0)
  const avgDistractions = allCompleted.length > 0 ? +(allCompleted.reduce((s, b) => s + b.distractions, 0) / allCompleted.length).toFixed(1) : 0
  const flowRate = allCompleted.length > 0 ? Math.round((allCompleted.filter(b => b.flowState).length / allCompleted.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-violet-400" />
            Deep Work Planner
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Schedule and track deep focus sessions</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Block
        </button>
      </div>

      {/* All-time stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{Math.round(allTimeMins / 60)}h</div>
          <div className="text-xs text-slate-500">Total Deep Work</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{flowRate}%</div>
          <div className="text-xs text-slate-500">Flow Rate</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-red-400">{avgDistractions}</div>
          <div className="text-xs text-slate-500">Avg Distractions</div>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 text-slate-500 hover:text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-bold text-white">{isToday ? 'Today' : date}</div>
          <div className="text-xs text-slate-500">{totalCompleted}/{totalPlanned}m complete · {flowSessions} flow sessions</div>
        </div>
        <button onClick={() => shiftDate(1)} disabled={isToday} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily theme */}
      <div className="game-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">Today's Deep Work Theme</label>
          <button onClick={saveTheme} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Save</button>
        </div>
        <input value={themeText} onChange={e => setThemeText(e.target.value)}
          placeholder="e.g. 'Ship the feature', 'Research and writing'" className="game-input w-full text-sm" />
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500">Energy: {energyLevel}/10</label>
          <input type="range" min="1" max="10" value={energyLevel} onChange={e => setEnergyLevel(+e.target.value)} className="flex-1 accent-violet-400 h-1" />
        </div>
      </div>

      {/* Add block form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <h3 className="font-semibold text-slate-300">Plan Deep Work Block</h3>
          <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
            placeholder="What will you work on?" className="game-input w-full" autoFocus />
          <div className="flex flex-wrap gap-2">
            {CONTEXTS.map(c => (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, context: c.value }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.context === c.value ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="game-input w-full" min="25" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addBlock} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Add Block
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Today's blocks */}
      <div className="space-y-3">
        {todayBlocks.map(b => {
          const ctx = CONTEXTS.find(c => c.value === b.context)
          return (
            <div key={b.id} className="game-card p-4 space-y-2" style={{ borderLeft: `3px solid ${b.completed ? '#22c55e' : ctx?.color || '#8b5cf6'}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{ctx?.emoji}</span>
                    <span className="font-semibold text-white text-sm">{b.task}</span>
                    {b.flowState && <span className="text-xs text-yellow-400">⚡ Flow</span>}
                    {b.completed && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {b.startTime} · {b.duration}m planned
                    {b.completed && b.actualDuration && b.actualDuration !== b.duration && ` · ${b.actualDuration}m actual`}
                    {b.completed && b.distractions > 0 && ` · ${b.distractions} distractions`}
                  </div>
                </div>
                <button onClick={() => deleteBlock(b.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {!b.completed && (
                completing === b.id ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Actual Duration (min)</label>
                        <input type="number" value={completeForm.actualDuration}
                          onChange={e => setCompleteForm(f => ({ ...f, actualDuration: e.target.value }))}
                          placeholder={b.duration.toString()} className="game-input w-full text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Distractions</label>
                        <input type="number" value={completeForm.distractions}
                          onChange={e => setCompleteForm(f => ({ ...f, distractions: e.target.value }))}
                          className="game-input w-full text-xs" min="0" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={completeForm.flowState} onChange={e => setCompleteForm(f => ({ ...f, flowState: e.target.checked }))} />
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-300">Entered flow state</span>
                    </label>
                    <input value={completeForm.notes} onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Notes from this session..." className="game-input w-full text-xs" />
                    <div className="flex gap-2">
                      <button onClick={() => completeBlock(b.id)} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold">
                        ✅ Mark Complete
                      </button>
                      <button onClick={() => setCompleting(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setCompleting(b.id)}
                    className="w-full py-1.5 border border-dashed border-slate-700 hover:border-violet-500/40 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-medium transition-all">
                    ✓ Complete Session
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      {todayBlocks.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No deep work blocks planned.</p>
          <p className="text-sm mb-5">Schedule 1-3 deep work sessions today.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Plan First Block
          </button>
        </div>
      )}
    </div>
  )
}
