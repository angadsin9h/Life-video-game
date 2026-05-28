import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SabbaticalType = 'mini' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
type SabbaticalStatus = 'dreaming' | 'planning' | 'approved' | 'active' | 'completed'
type SabbaticalFocus = 'rest' | 'travel' | 'learning' | 'creative' | 'spiritual' | 'family' | 'health' | 'mixed'

interface Sabbatical {
  id: string
  title: string
  type: SabbaticalType
  status: SabbaticalStatus
  focus: SabbaticalFocus
  startDate: string
  endDate: string
  intention: string
  activities: string
  goals: string[]
  budget: number
  location: string
  notes: string
  reflection: string
  rating: number
  createdAt: string
}

const TYPE_CONFIG: Record<SabbaticalType, { label: string; emoji: string }> = {
  mini:    { label: 'Mini (1-3 days)', emoji: '🌅' },
  week:    { label: 'Week',           emoji: '📅' },
  month:   { label: 'Month',          emoji: '🗓️' },
  quarter: { label: 'Quarter',        emoji: '🌿' },
  year:    { label: 'Year',           emoji: '🌍' },
  custom:  { label: 'Custom',         emoji: '✨' },
}

const STATUS_CONFIG: Record<SabbaticalStatus, { label: string; color: string }> = {
  dreaming:  { label: 'Dreaming',   color: '#a855f7' },
  planning:  { label: 'Planning',   color: '#3b82f6' },
  approved:  { label: 'Approved',   color: '#f59e0b' },
  active:    { label: 'Active!',    color: '#22c55e' },
  completed: { label: 'Completed',  color: '#94a3b8' },
}

const FOCUS_CONFIG: Record<SabbaticalFocus, { label: string; emoji: string; color: string }> = {
  rest:      { label: 'Rest',      emoji: '😴', color: '#3b82f6' },
  travel:    { label: 'Travel',    emoji: '✈️', color: '#f59e0b' },
  learning:  { label: 'Learning',  emoji: '📚', color: '#6366f1' },
  creative:  { label: 'Creative',  emoji: '🎨', color: '#a855f7' },
  spiritual: { label: 'Spiritual', emoji: '✨', color: '#ec4899' },
  family:    { label: 'Family',    emoji: '👨‍👩‍👧', color: '#22c55e' },
  health:    { label: 'Health',    emoji: '💪', color: '#ef4444' },
  mixed:     { label: 'Mixed',     emoji: '🌈', color: '#f97316' },
}

const STORAGE_KEY = 'sabbatical_planner'

export default function SabbaticalPlanner() {
  const { toastSuccess } = useToast()
  const [sabbaticals, setSabbaticals] = useState<Sabbatical[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [newGoal, setNewGoal] = useState('')
  const [form, setForm] = useState<Omit<Sabbatical, 'id' | 'createdAt'>>({
    title: '', type: 'mini', status: 'dreaming', focus: 'rest',
    startDate: '', endDate: '', intention: '', activities: '', goals: [],
    budget: 0, location: '', notes: '', reflection: '', rating: 0,
  })

  useEffect(() => {
    try { setSabbaticals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Sabbatical[]) => { setSabbaticals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addGoal = () => {
    if (!newGoal.trim()) return
    setForm(f => ({ ...f, goals: [...f.goals, newGoal.trim()] }))
    setNewGoal('')
  }

  const submit = () => {
    if (!form.title.trim()) return
    const s: Sabbatical = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...sabbaticals])
    setForm({ title: '', type: 'mini', status: 'dreaming', focus: 'rest', startDate: '', endDate: '', intention: '', activities: '', goals: [], budget: 0, location: '', notes: '', reflection: '', rating: 0 })
    setShowForm(false)
    toastSuccess('Sabbatical planned 🌿')
  }

  const filtered = sabbaticals.filter(s => filterStatus === 'all' || s.status === filterStatus)
  const completed = sabbaticals.filter(s => s.status === 'completed').length
  const active = sabbaticals.filter(s => s.status === 'active').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Calendar className="w-7 h-7 text-green-400" />
            Sabbatical Planner
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Plan intentional breaks for renewal and growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Plan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{sabbaticals.length}</div>
          <div className="text-xs text-slate-500">Planned</div>
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(STATUS_CONFIG) as [SabbaticalStatus, typeof STATUS_CONFIG.dreaming][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilterStatus(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterStatus === k ? { background: s.color + '30', color: s.color } : {}}>
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Plan a Sabbatical</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Sabbatical title *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SabbaticalType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [SabbaticalType, typeof TYPE_CONFIG.mini][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.focus} onChange={e => setForm(f => ({ ...f, focus: e.target.value as SabbaticalFocus }))} className="game-input text-sm flex-1">
              {(Object.entries(FOCUS_CONFIG) as [SabbaticalFocus, typeof FOCUS_CONFIG.rest][]).map(([k, f]) => (
                <option key={k} value={k}>{f.emoji} {f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="game-input text-sm flex-1" />
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="Location / where" className="game-input w-full text-sm" />
          <textarea value={form.intention} onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
            placeholder="What is your intention for this sabbatical?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.activities} onChange={e => setForm(f => ({ ...f, activities: e.target.value }))}
            placeholder="Planned activities..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
              placeholder="Add a goal..." className="game-input flex-1 text-sm"
              onKeyDown={e => e.key === 'Enter' && addGoal()} />
            <button onClick={addGoal} className="px-3 py-1.5 bg-green-700/30 text-green-400 rounded-xl text-xs">Add</button>
          </div>
          {form.goals.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {form.goals.map((g, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded cursor-pointer"
                  onClick={() => setForm(f => ({ ...f, goals: f.goals.filter((_, j) => j !== i) }))}>
                  {g} ×
                </span>
              ))}
            </div>
          )}
          <input type="number" value={form.budget || ''} onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
            placeholder="Budget $" className="game-input w-full text-sm" min={0} />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const st = STATUS_CONFIG[s.status]
          const f = FOCUS_CONFIG[s.focus]
          const tp = TYPE_CONFIG[s.type]
          const isExp = expanded === s.id
          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${f.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <span className="text-2xl">{tp.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{s.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{f.emoji} {f.label} · {s.startDate || 'No date set'}{s.location && ` · ${s.location}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {s.intention && <p className="text-xs text-slate-300">🎯 {s.intention}</p>}
                  {s.activities && <p className="text-xs text-blue-300">📋 {s.activities}</p>}
                  {s.goals.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {s.goals.map((g, i) => <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{g}</span>)}
                    </div>
                  )}
                  {s.budget > 0 && <p className="text-xs text-green-300">💰 Budget: ${s.budget}</p>}
                  <div className="flex gap-2 mt-1">
                    {s.status !== 'completed' && (
                      <button onClick={() => { save(sabbaticals.map(x => x.id === s.id ? { ...x, status: 'completed' as SabbaticalStatus } : x)); toastSuccess('Sabbatical completed! 🌿') }}
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                        <Check className="w-3 h-3" /> Mark complete
                      </button>
                    )}
                    <button onClick={() => save(sabbaticals.filter(x => x.id !== s.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Rest is not a reward — it is a requirement. Plan your sabbaticals.</p>
          </div>
        )}
      </div>
    </div>
  )
}
