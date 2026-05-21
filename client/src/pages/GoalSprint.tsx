import { useState, useEffect } from 'react'
import { Flag, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SprintDuration = '1-week' | '2-weeks' | '30-days' | '90-days' | 'custom'
type SprintArea = 'career' | 'health' | 'finance' | 'relationships' | 'learning' | 'creative' | 'mindset' | 'spiritual' | 'other'
type SprintStatus = 'planning' | 'active' | 'completed' | 'failed' | 'paused'

interface GoalSprintEntry {
  id: string
  area: SprintArea
  duration: SprintDuration
  status: SprintStatus
  goal: string
  dailyAction: string
  successCriteria: string
  obstacles: string
  accountability: string
  progress: number
  startDate: string
  endDate: string
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<SprintArea, { label: string; emoji: string; color: string }> = {
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '💪', color: '#ef4444' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#22c55e' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#6366f1' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f97316' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#a855f7' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '🎯', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<SprintStatus, { label: string; color: string; emoji: string }> = {
  planning:  { label: 'Planning',  color: '#6366f1', emoji: '📋' },
  active:    { label: 'Active',    color: '#22c55e', emoji: '🔥' },
  completed: { label: 'Completed', color: '#a855f7', emoji: '🏆' },
  failed:    { label: 'Failed',    color: '#ef4444', emoji: '❌' },
  paused:    { label: 'Paused',    color: '#f59e0b', emoji: '⏸️' },
}

const DURATION_CONFIG: Record<SprintDuration, { label: string }> = {
  '1-week':  { label: '1 Week'   },
  '2-weeks': { label: '2 Weeks'  },
  '30-days': { label: '30 Days'  },
  '90-days': { label: '90 Days'  },
  custom:    { label: 'Custom'   },
}

const STORAGE_KEY = 'goal_sprint'

export default function GoalSprint() {
  const { toastSuccess } = useToast()
  const [sprints, setSprints] = useState<GoalSprintEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GoalSprintEntry, 'id' | 'createdAt'>>({
    area: 'health', duration: '30-days', status: 'planning', goal: '',
    dailyAction: '', successCriteria: '', obstacles: '', accountability: '',
    progress: 0, startDate: new Date().toISOString().split('T')[0], endDate: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setSprints(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GoalSprintEntry[]) => { setSprints(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.goal.trim()) return
    const s: GoalSprintEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...sprints])
    setForm(f => ({ ...f, goal: '', dailyAction: '', successCriteria: '', obstacles: '', accountability: '', endDate: '', progress: 0 }))
    setShowForm(false)
    toastSuccess('Goal sprint launched — focus and execute 🔥')
  }

  const active = sprints.filter(s => s.status === 'active').length
  const completed = sprints.filter(s => s.status === 'completed').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flag className="w-7 h-7 text-orange-400" />
            Goal Sprint
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Time-boxed focused effort on a single goal. Sprint to the finish.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Sprint
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{sprints.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Launch Goal Sprint</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as SprintArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [SprintArea, typeof AREA_CONFIG.health][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value as SprintDuration }))} className="game-input text-sm flex-1">
              {(Object.entries(DURATION_CONFIG) as [SprintDuration, typeof DURATION_CONFIG['30-days']][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Sprint goal — specific and measurable *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.dailyAction} onChange={e => setForm(f => ({ ...f, dailyAction: e.target.value }))}
            placeholder="Daily action (what will you do every day?)" className="game-input w-full text-sm" />
          <input value={form.successCriteria} onChange={e => setForm(f => ({ ...f, successCriteria: e.target.value }))}
            placeholder="How will you know you succeeded?" className="game-input w-full text-sm" />
          <input value={form.obstacles} onChange={e => setForm(f => ({ ...f, obstacles: e.target.value }))}
            placeholder="Anticipated obstacles and your plan" className="game-input w-full text-sm" />
          <input value={form.accountability} onChange={e => setForm(f => ({ ...f, accountability: e.target.value }))}
            placeholder="Who holds you accountable?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SprintStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [SprintStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Progress: {form.progress}%</p>
            <input type="range" min={0} max={100} value={form.progress}
              onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Launch Sprint</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sprints.map(s => {
          const a = AREA_CONFIG[s.area]
          const st = STATUS_CONFIG[s.status]
          const dur = DURATION_CONFIG[s.duration]
          return (
            <div key={s.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${st.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{st.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                  <span className="text-xs text-slate-500">{a.label} · {dur.label}</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-2">{s.goal}</p>
                <div className="w-full bg-slate-700 rounded-full h-1 mt-1.5">
                  <div className="h-1 rounded-full transition-all" style={{ width: `${s.progress}%`, background: st.color }} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{s.progress}% complete</p>
              </div>
              <button onClick={() => save(sprints.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {sprints.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Flag className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Focused effort over a fixed time beats diffused effort forever.</p>
          </div>
        )}
      </div>
    </div>
  )
}
