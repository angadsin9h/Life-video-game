import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SessionType = 'writing' | 'coding' | 'designing' | 'researching' | 'strategizing' | 'creating' | 'analyzing' | 'building'
type OutputQuality = 'poor' | 'fair' | 'good' | 'great' | 'exceptional'

interface DeepWorkEntry {
  id: string
  sessionType: SessionType
  outputQuality: OutputQuality
  task: string
  goal: string
  location: string
  distractions: string
  output: string
  insight: string
  duration: number
  flowDepth: number
  productivityScore: number
  date: string
  createdAt: string
}

const SESSION_CONFIG: Record<SessionType, { label: string; emoji: string; color: string }> = {
  writing:     { label: 'Writing',      emoji: '✍️', color: '#3b82f6' },
  coding:      { label: 'Coding',       emoji: '💻', color: '#22c55e' },
  designing:   { label: 'Designing',    emoji: '🎨', color: '#a855f7' },
  researching: { label: 'Researching',  emoji: '🔬', color: '#f59e0b' },
  strategizing:{ label: 'Strategizing', emoji: '♟️', color: '#ef4444' },
  creating:    { label: 'Creating',     emoji: '🎭', color: '#ec4899' },
  analyzing:   { label: 'Analyzing',    emoji: '📊', color: '#6366f1' },
  building:    { label: 'Building',     emoji: '🔨', color: '#f97316' },
}

const QUALITY_CONFIG: Record<OutputQuality, { label: string; color: string }> = {
  poor:       { label: 'Poor',        color: '#ef4444' },
  fair:       { label: 'Fair',        color: '#f97316' },
  good:       { label: 'Good',        color: '#f59e0b' },
  great:      { label: 'Great',       color: '#22c55e' },
  exceptional:{ label: 'Exceptional', color: '#a855f7' },
}

const STORAGE_KEY = 'deep_work_sessions_v2'

export default function DeepWorkSession() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DeepWorkEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DeepWorkEntry, 'id' | 'createdAt'>>({
    sessionType: 'writing', outputQuality: 'good', task: '', goal: '',
    location: '', distractions: '', output: '', insight: '',
    duration: 90, flowDepth: 8, productivityScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DeepWorkEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.task.trim()) return
    const e: DeepWorkEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, task: '', goal: '', location: '', distractions: '', output: '', insight: '' }))
    setShowForm(false)
    toastSuccess('Deep work session logged — focus compounds 🧠')
  }

  const totalHours = Math.round(entries.reduce((s, e) => s + e.duration, 0) / 60 * 10) / 10
  const avgFlow = entries.length ? Math.round(entries.reduce((s, e) => s + e.flowDepth, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-blue-400" />
            Deep Work Sessions
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your most focused, high-value work sessions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Total Hours</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgFlow}/10</div>
          <div className="text-xs text-slate-500">Avg Flow</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Deep Work Session</h3>
          <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
            placeholder="What did you work on? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.sessionType} onChange={e => setForm(f => ({ ...f, sessionType: e.target.value as SessionType }))} className="game-input text-sm flex-1">
              {(Object.entries(SESSION_CONFIG) as [SessionType, typeof SESSION_CONFIG.writing][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.outputQuality} onChange={e => setForm(f => ({ ...f, outputQuality: e.target.value as OutputQuality }))} className="game-input text-sm flex-1">
              {(Object.entries(QUALITY_CONFIG) as [OutputQuality, typeof QUALITY_CONFIG.good][]).map(([k, q]) => (
                <option key={k} value={k}>{q.label}</option>
              ))}
            </select>
          </div>
          <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Session goal / intended output" className="game-input w-full text-sm" />
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="Location / environment" className="game-input w-full text-sm" />
          <input value={form.distractions} onChange={e => setForm(f => ({ ...f, distractions: e.target.value }))}
            placeholder="Any distractions? What broke flow?" className="game-input w-full text-sm" />
          <textarea value={form.output} onChange={e => setForm(f => ({ ...f, output: e.target.value }))}
            placeholder="What did you actually produce?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="Key insight or breakthrough from this session" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Duration: {form.duration}min</p>
            <input type="range" min={15} max={240} step={15} value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Flow depth: {form.flowDepth}/10</p>
              <input type="range" min={1} max={10} value={form.flowDepth}
                onChange={e => setForm(f => ({ ...f, flowDepth: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Productivity: {form.productivityScore}/10</p>
              <input type="range" min={1} max={10} value={form.productivityScore}
                onChange={e => setForm(f => ({ ...f, productivityScore: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Log Session</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SESSION_CONFIG[e.sessionType]
          const q = QUALITY_CONFIG[e.outputQuality]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.task}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: q.color + '20', color: q.color }}>{q.label}</span>
                  <span className="text-xs text-blue-400">⏱ {e.duration}min</span>
                  <span className="text-xs text-purple-400">🌊 {e.flowDepth}/10</span>
                </div>
                {e.output && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.output}</p>}
                {e.insight && <p className="text-xs text-green-300/70 mt-0.5">💡 {e.insight}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Deep work is the superpower of the modern age. Track yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}
