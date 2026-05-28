import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RitualType = 'morning' | 'evening' | 'weekly' | 'monthly' | 'seasonal' | 'before-work' | 'after-work' | 'meditation' | 'exercise' | 'social' | 'creative' | 'other'
type RitualStatus = 'active' | 'building' | 'paused' | 'retired'

interface Ritual {
  id: string
  type: RitualType
  name: string
  description: string
  steps: string[]
  duration: number
  purpose: string
  benefit: string
  status: RitualStatus
  streak: number
  lastDone: string
  frequency: string
  createdAt: string
}

const TYPE_CONFIG: Record<RitualType, { label: string; emoji: string; color: string }> = {
  morning:      { label: 'Morning',      emoji: '🌅', color: '#f59e0b' },
  evening:      { label: 'Evening',      emoji: '🌙', color: '#6366f1' },
  weekly:       { label: 'Weekly',       emoji: '📅', color: '#3b82f6' },
  monthly:      { label: 'Monthly',      emoji: '🗓️', color: '#a855f7' },
  seasonal:     { label: 'Seasonal',     emoji: '🌸', color: '#22c55e' },
  'before-work':{ label: 'Before Work',  emoji: '💼', color: '#f97316' },
  'after-work': { label: 'After Work',   emoji: '🏠', color: '#84cc16' },
  meditation:   { label: 'Meditation',   emoji: '🧘', color: '#0ea5e9' },
  exercise:     { label: 'Exercise',     emoji: '💪', color: '#ef4444' },
  social:       { label: 'Social',       emoji: '🤝', color: '#ec4899' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#eab308' },
  other:        { label: 'Other',        emoji: '✨', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<RitualStatus, { label: string; color: string }> = {
  active:   { label: 'Active',   color: '#22c55e' },
  building: { label: 'Building', color: '#f59e0b' },
  paused:   { label: 'Paused',   color: '#94a3b8' },
  retired:  { label: 'Retired',  color: '#475569' },
}

const STORAGE_KEY = 'rituals_log'

export default function RitualsLog() {
  const { toastSuccess } = useToast()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [newStep, setNewStep] = useState('')
  const [form, setForm] = useState<Omit<Ritual, 'id' | 'createdAt'>>({
    type: 'morning', name: '', description: '', steps: [], duration: 30,
    purpose: '', benefit: '', status: 'building', streak: 0,
    lastDone: new Date().toISOString().split('T')[0], frequency: 'daily',
  })

  useEffect(() => {
    try { setRituals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Ritual[]) => { setRituals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const r: Ritual = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([r, ...rituals])
    setForm(f => ({ ...f, name: '', description: '', steps: [], purpose: '', benefit: '' }))
    setNewStep('')
    setShowForm(false)
    toastSuccess('Ritual added ✨')
  }

  const markDone = (id: string) => {
    save(rituals.map(r => r.id === id ? { ...r, streak: r.streak + 1, lastDone: new Date().toISOString().split('T')[0] } : r))
    toastSuccess('Ritual completed! 🔥')
  }

  const filtered = rituals.filter(r => filterType === 'all' || r.type === filterType)
  const active = rituals.filter(r => r.status === 'active').length
  const totalStreak = rituals.reduce((s, r) => s + r.streak, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-emerald-400" />
            Rituals Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design and track meaningful rituals that ground you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{rituals.length}</div>
          <div className="text-xs text-slate-500">Rituals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{totalStreak}</div>
          <div className="text-xs text-slate-500">Total Done</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [RitualType, typeof TYPE_CONFIG.morning][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Design Ritual</h3>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as RitualType }))} className="game-input w-full text-sm">
            {(Object.entries(TYPE_CONFIG) as [RitualType, typeof TYPE_CONFIG.morning][]).map(([k, t]) => (
              <option key={k} value={k}>{t.emoji} {t.label}</option>
            ))}
          </select>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ritual name *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe this ritual..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={newStep} onChange={e => setNewStep(e.target.value)}
              placeholder="Add a step..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newStep.trim()) { setForm(f => ({ ...f, steps: [...f.steps, newStep.trim()] })); setNewStep('') } }} />
            <button onClick={() => { if (newStep.trim()) { setForm(f => ({ ...f, steps: [...f.steps, newStep.trim()] })); setNewStep('') } }}
              className="px-3 py-1.5 bg-emerald-700/30 text-emerald-400 rounded-xl text-xs">Add</button>
          </div>
          {form.steps.length > 0 && (
            <div className="space-y-1">
              {form.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400">{i + 1}.</span>
                  <span className="text-xs text-slate-300 flex-1">{s}</span>
                  <button onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}
                    className="text-slate-600 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="Purpose / intention" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration (min)</p>
              <input type="number" value={form.duration} min={1}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Frequency</p>
              <input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="game-input w-full text-sm" placeholder="daily, weekly..." />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RitualStatus }))} className="game-input w-full text-sm">
                {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const t = TYPE_CONFIG[r.type]
          const s = STATUS_CONFIG[r.status]
          const isExp = expanded === r.id
          return (
            <div key={r.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : r.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{r.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · {r.duration}min · 🔥 {r.streak}×</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {r.description && <p className="text-xs text-slate-300">{r.description}</p>}
                  {r.steps.length > 0 && (
                    <div className="space-y-0.5">
                      {r.steps.map((step, i) => (
                        <p key={i} className="text-xs text-slate-400">{i + 1}. {step}</p>
                      ))}
                    </div>
                  )}
                  {r.purpose && <p className="text-xs text-emerald-300">🎯 {r.purpose}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => markDone(r.id)}
                      className="px-3 py-1 bg-emerald-700/30 text-emerald-400 rounded-lg text-xs hover:bg-emerald-700/50">
                      ✓ Mark Done
                    </button>
                    <select value={r.status} onChange={ev => save(rituals.map(x => x.id === r.id ? { ...x, status: ev.target.value as RitualStatus } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {Object.entries(STATUS_CONFIG).map(([k, st]) => <option key={k} value={k}>{st.label}</option>)}
                    </select>
                    <button onClick={() => save(rituals.filter(x => x.id !== r.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Rituals create the structure that makes freedom possible. Design yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}
