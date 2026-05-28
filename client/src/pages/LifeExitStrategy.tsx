import { useState, useEffect } from 'react'
import { AlertOctagon, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExitArea = 'relationship' | 'job' | 'habit' | 'friendship' | 'project' | 'belief' | 'city' | 'lifestyle' | 'business' | 'routine'
type ExitStatus = 'considering' | 'planning' | 'in-progress' | 'completed' | 'delayed'

interface LifeExitEntry {
  id: string
  area: ExitArea
  status: ExitStatus
  whatToExit: string
  whyItNeedsExit: string
  whatYouFear: string
  whatYouGain: string
  exitPlan: string
  timeline: string
  readinessScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<ExitArea, { label: string; emoji: string; color: string }> = {
  relationship: { label: 'Relationship', emoji: '💔', color: '#ec4899' },
  job:          { label: 'Job',          emoji: '💼', color: '#f59e0b' },
  habit:        { label: 'Habit',        emoji: '🔄', color: '#ef4444' },
  friendship:   { label: 'Friendship',   emoji: '👥', color: '#3b82f6' },
  project:      { label: 'Project',      emoji: '📁', color: '#6366f1' },
  belief:       { label: 'Belief',       emoji: '💭', color: '#a855f7' },
  city:         { label: 'City/Location',emoji: '🌆', color: '#22c55e' },
  lifestyle:    { label: 'Lifestyle',    emoji: '🌿', color: '#84cc16' },
  business:     { label: 'Business',     emoji: '🏢', color: '#f97316' },
  routine:      { label: 'Routine',      emoji: '⏰', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ExitStatus, { label: string; color: string }> = {
  considering:  { label: 'Considering',  color: '#94a3b8' },
  planning:     { label: 'Planning',     color: '#f59e0b' },
  'in-progress':{ label: 'In Progress',  color: '#3b82f6' },
  completed:    { label: 'Completed',    color: '#22c55e' },
  delayed:      { label: 'Delayed',      color: '#6366f1' },
}

const STORAGE_KEY = 'life_exit_strategy'

export default function LifeExitStrategy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeExitEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeExitEntry, 'id' | 'createdAt'>>({
    area: 'habit', status: 'considering', whatToExit: '',
    whyItNeedsExit: '', whatYouFear: '', whatYouGain: '',
    exitPlan: '', timeline: '', readinessScore: 5,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeExitEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatToExit.trim()) return
    const e: LifeExitEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatToExit: '', whyItNeedsExit: '', whatYouFear: '', whatYouGain: '', exitPlan: '', timeline: '' }))
    setShowForm(false)
    toastSuccess('Exit strategy documented — sometimes the brave move is letting go 🚀')
  }

  const completed = entries.filter(e => e.status === 'completed').length
  const avgReadiness = entries.length ? Math.round(entries.reduce((s, e) => s + e.readinessScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertOctagon className="w-7 h-7 text-orange-400" />
            Life Exit Strategy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Plan your exits from things that no longer serve your growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Plan Exit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Exit Plans</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgReadiness}/10</div>
          <div className="text-xs text-slate-500">Avg Readiness</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Plan Life Exit</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ExitArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ExitArea, typeof AREA_CONFIG.habit][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ExitStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ExitStatus, typeof STATUS_CONFIG.planning][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatToExit} onChange={e => setForm(f => ({ ...f, whatToExit: e.target.value }))}
            placeholder="What specifically do you need to exit? *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.whyItNeedsExit} onChange={e => setForm(f => ({ ...f, whyItNeedsExit: e.target.value }))}
            placeholder="Why does this need to end?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whatYouFear} onChange={e => setForm(f => ({ ...f, whatYouFear: e.target.value }))}
            placeholder="What do you fear about exiting this?" className="game-input w-full text-sm" />
          <input value={form.whatYouGain} onChange={e => setForm(f => ({ ...f, whatYouGain: e.target.value }))}
            placeholder="What will you gain by leaving?" className="game-input w-full text-sm" />
          <input value={form.exitPlan} onChange={e => setForm(f => ({ ...f, exitPlan: e.target.value }))}
            placeholder="The actual exit plan / steps" className="game-input w-full text-sm" />
          <input value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
            placeholder="Target timeline" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Readiness to exit: {form.readinessScore}/10</p>
            <input type="range" min={1} max={10} value={form.readinessScore}
              onChange={e => setForm(f => ({ ...f, readinessScore: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save Exit Plan</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.whatToExit}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-orange-400">⚡ {e.readinessScore}/10</span>
                </div>
                {e.whyItNeedsExit && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{e.whyItNeedsExit}</p>}
                {e.whatYouGain && <p className="text-xs text-green-300/70 mt-0.5">→ {e.whatYouGain}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every exit is an entrance to something better.</p>
          </div>
        )}
      </div>
    </div>
  )
}
