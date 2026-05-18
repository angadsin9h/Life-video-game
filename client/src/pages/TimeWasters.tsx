import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WasterCategory = 'digital' | 'social' | 'overthinking' | 'procrastination' | 'meetings' | 'commute' | 'distraction' | 'perfectionism' | 'other'
type WasterStatus = 'active' | 'reducing' | 'eliminated'

interface TimeWaster {
  id: string
  category: WasterCategory
  status: WasterStatus
  name: string
  hoursPerWeek: number
  trigger: string
  replacement: string
  costPerYear: number
  eliminated: boolean
  dateAdded: string
  createdAt: string
}

const CAT_CONFIG: Record<WasterCategory, { label: string; emoji: string; color: string }> = {
  digital:        { label: 'Digital',         emoji: '📱', color: '#3b82f6' },
  social:         { label: 'Social',          emoji: '👥', color: '#a855f7' },
  overthinking:   { label: 'Overthinking',    emoji: '🌀', color: '#6366f1' },
  procrastination:{ label: 'Procrastination', emoji: '🦥', color: '#f97316' },
  meetings:       { label: 'Meetings',        emoji: '📅', color: '#f59e0b' },
  commute:        { label: 'Commute',         emoji: '🚗', color: '#94a3b8' },
  distraction:    { label: 'Distraction',     emoji: '🔔', color: '#ef4444' },
  perfectionism:  { label: 'Perfectionism',   emoji: '🔍', color: '#22c55e' },
  other:          { label: 'Other',           emoji: '⏳', color: '#84cc16' },
}

const STATUS_CONFIG: Record<WasterStatus, { label: string; color: string }> = {
  active:    { label: 'Still Active',  color: '#ef4444' },
  reducing:  { label: 'Reducing',      color: '#f59e0b' },
  eliminated:{ label: 'Eliminated ✓', color: '#22c55e' },
}

const STORAGE_KEY = 'time_wasters'

export default function TimeWasters() {
  const { toastSuccess } = useToast()
  const [wasters, setWasters] = useState<TimeWaster[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<TimeWaster, 'id' | 'createdAt'>>({
    category: 'digital', status: 'active', name: '', hoursPerWeek: 5,
    trigger: '', replacement: '', costPerYear: 0, eliminated: false,
    dateAdded: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setWasters(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: TimeWaster[]) => { setWasters(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const costPerYear = Math.round(form.hoursPerWeek * 52 * 25)
    const w: TimeWaster = { id: Date.now().toString(), ...form, costPerYear, createdAt: new Date().toISOString() }
    save([w, ...wasters])
    setForm(f => ({ ...f, name: '', trigger: '', replacement: '' }))
    setShowForm(false)
    toastSuccess('Time waster logged ⏳')
  }

  const totalHours = wasters.filter(w => w.status !== 'eliminated').reduce((s, w) => s + w.hoursPerWeek, 0)
  const eliminated = wasters.filter(w => w.status === 'eliminated').length
  const savedHours = wasters.filter(w => w.status === 'eliminated').reduce((s, w) => s + w.hoursPerWeek, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-orange-400" />
            Time Wasters
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Identify and eliminate what's stealing your most valuable resource.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Lost/Week</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{savedHours}h</div>
          <div className="text-xs text-slate-500">Reclaimed/Wk</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{eliminated}</div>
          <div className="text-xs text-slate-500">Eliminated</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Time Waster</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as WasterCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [WasterCategory, typeof CAT_CONFIG.digital][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as WasterStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [WasterStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="What wastes your time? *" className="game-input w-full" autoFocus />
          <div>
            <p className="text-xs text-slate-500 mb-1">Hours wasted per week: {form.hoursPerWeek}h ({Math.round(form.hoursPerWeek * 52)}h/year)</p>
            <input type="range" min={0.5} max={40} step={0.5} value={form.hoursPerWeek}
              onChange={e => setForm(f => ({ ...f, hoursPerWeek: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggers this behavior?" className="game-input w-full text-sm" />
          <input value={form.replacement} onChange={e => setForm(f => ({ ...f, replacement: e.target.value }))}
            placeholder="What can replace it?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {wasters.map(w => {
          const c = CAT_CONFIG[w.category]
          const s = STATUS_CONFIG[w.status]
          return (
            <div key={w.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{w.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                </div>
                <p className="text-xs text-orange-400">{w.hoursPerWeek}h/week · {Math.round(w.hoursPerWeek * 52)}h/year</p>
                {w.trigger && <p className="text-xs text-slate-500">Trigger: {w.trigger}</p>}
                {w.replacement && <p className="text-xs text-green-400">→ Replace with: {w.replacement}</p>}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <select value={w.status} onChange={ev => save(wasters.map(x => x.id === w.id ? { ...x, status: ev.target.value as WasterStatus } : x))}
                  className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                  {(Object.entries(STATUS_CONFIG) as [WasterStatus, typeof STATUS_CONFIG.active][]).map(([k, st]) => (
                    <option key={k} value={k}>{st.label}</option>
                  ))}
                </select>
                <button onClick={() => save(wasters.filter(x => x.id !== w.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {wasters.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Time is the only non-renewable resource. Guard it fiercely.</p>
          </div>
        )}
      </div>
    </div>
  )
}
