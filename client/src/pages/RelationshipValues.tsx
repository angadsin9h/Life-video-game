import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ValueType = 'non-negotiable' | 'important' | 'preferred' | 'dealbreaker'
type RelContext = 'romantic' | 'friendship' | 'family' | 'professional' | 'all'

interface RelValue {
  id: string
  context: RelContext
  type: ValueType
  value: string
  description: string
  why: string
  example: string
  violation: string
  priority: number
  createdAt: string
}

const TYPE_CONFIG: Record<ValueType, { label: string; emoji: string; color: string }> = {
  'non-negotiable': { label: 'Non-Negotiable', emoji: '🔴', color: '#ef4444' },
  important:        { label: 'Important',       emoji: '🟡', color: '#f59e0b' },
  preferred:        { label: 'Preferred',        emoji: '🟢', color: '#22c55e' },
  dealbreaker:      { label: 'Deal-Breaker',     emoji: '🚫', color: '#a855f7' },
}

const CONTEXT_CONFIG: Record<RelContext, { label: string; emoji: string; color: string }> = {
  romantic:     { label: 'Romantic',     emoji: '❤️', color: '#ec4899' },
  friendship:   { label: 'Friendship',   emoji: '🤝', color: '#3b82f6' },
  family:       { label: 'Family',       emoji: '👨‍👩‍👧', color: '#22c55e' },
  professional: { label: 'Professional', emoji: '💼', color: '#f59e0b' },
  all:          { label: 'All',          emoji: '🌟', color: '#94a3b8' },
}

const STORAGE_KEY = 'relationship_values'

export default function RelationshipValues() {
  const { toastSuccess } = useToast()
  const [values, setValues] = useState<RelValue[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterContext, setFilterContext] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<RelValue, 'id' | 'createdAt'>>({
    context: 'romantic', type: 'non-negotiable', value: '', description: '',
    why: '', example: '', violation: '', priority: 5,
  })

  useEffect(() => {
    try { setValues(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: RelValue[]) => { setValues(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.value.trim()) return
    const v: RelValue = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([v, ...values])
    setForm(f => ({ ...f, value: '', description: '', why: '', example: '', violation: '' }))
    setShowForm(false)
    toastSuccess('Relationship value added ❤️')
  }

  const filtered = values
    .filter(v => filterContext === 'all' || v.context === filterContext)
    .filter(v => filterType === 'all' || v.type === filterType)
    .sort((a, b) => b.priority - a.priority)

  const nonNeg = values.filter(v => v.type === 'non-negotiable').length
  const dealbreakers = values.filter(v => v.type === 'dealbreaker').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-pink-400" />
            Relationship Values
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define what you need and won't tolerate in relationships.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{values.length}</div>
          <div className="text-xs text-slate-500">Values</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{nonNeg}</div>
          <div className="text-xs text-slate-500">Non-Negotiable</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{dealbreakers}</div>
          <div className="text-xs text-slate-500">Deal-Breakers</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.entries(CONTEXT_CONFIG) as [RelContext, typeof CONTEXT_CONFIG.romantic][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterContext(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterContext === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterContext === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All Types
        </button>
        {(Object.entries(TYPE_CONFIG) as [ValueType, typeof TYPE_CONFIG['non-negotiable']][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Relationship Value</h3>
          <div className="flex gap-2">
            <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value as RelContext }))} className="game-input text-sm flex-1">
              {(Object.entries(CONTEXT_CONFIG) as [RelContext, typeof CONTEXT_CONFIG.romantic][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ValueType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ValueType, typeof TYPE_CONFIG['non-negotiable']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="The value (e.g., Trust, Honesty, Ambition) *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What does this look like to you?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why is this important to you?" className="game-input w-full text-sm" />
          <input value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
            placeholder="Example of it done right" className="game-input w-full text-sm" />
          <input value={form.violation} onChange={e => setForm(f => ({ ...f, violation: e.target.value }))}
            placeholder="What violating it looks like" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Priority: {form.priority}/10</p>
            <input type="range" min={1} max={10} value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(v => {
          const t = TYPE_CONFIG[v.type]
          const c = CONTEXT_CONFIG[v.context]
          const isExp = expanded === v.id
          return (
            <div key={v.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : v.id)}>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{v.value}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '20', color: c.color }}>{c.emoji}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · priority {v.priority}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {v.description && <p className="text-xs text-slate-300">{v.description}</p>}
                  {v.why && <p className="text-xs text-blue-300">💡 {v.why}</p>}
                  {v.example && <p className="text-xs text-green-300">✅ Example: {v.example}</p>}
                  {v.violation && <p className="text-xs text-red-300">🚫 Violation: {v.violation}</p>}
                  <button onClick={() => save(values.filter(x => x.id !== v.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Know your standards before you need them. Define your relationship values.</p>
          </div>
        )}
      </div>
    </div>
  )
}
