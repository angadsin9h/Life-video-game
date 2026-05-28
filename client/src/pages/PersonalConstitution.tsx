import { useState, useEffect } from 'react'
import { Scroll, Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PrincipleType = 'core-value' | 'rule' | 'belief' | 'commitment' | 'boundary' | 'mantra'

interface Principle {
  id: string
  type: PrincipleType
  title: string
  statement: string
  rationale: string
  example: string
  priority: number
  createdAt: string
}

const TYPE_CONFIG: Record<PrincipleType, { label: string; emoji: string; color: string }> = {
  'core-value':  { label: 'Core Value',  emoji: '⭐', color: '#f59e0b' },
  rule:          { label: 'Rule',        emoji: '📏', color: '#3b82f6' },
  belief:        { label: 'Belief',      emoji: '💡', color: '#a855f7' },
  commitment:    { label: 'Commitment',  emoji: '🤝', color: '#22c55e' },
  boundary:      { label: 'Boundary',   emoji: '🛡️', color: '#ef4444' },
  mantra:        { label: 'Mantra',     emoji: '🔮', color: '#6366f1' },
}

const STORAGE_KEY = 'personal_constitution'

const DEFAULT_PRINCIPLES: Omit<Principle, 'id' | 'createdAt'>[] = [
  { type: 'core-value', title: 'Integrity', statement: 'I do what I say, say what I mean, and mean what I do.', rationale: 'Trust is built through consistent alignment of words and actions.', example: 'If I commit to something, I follow through even when it is inconvenient.', priority: 1 },
  { type: 'mantra', title: 'Progress over perfection', statement: 'Done is better than perfect. Move forward, adjust as needed.', rationale: 'Perfectionism kills momentum. Iteration beats inaction.', example: 'Ship the project, then improve it based on real feedback.', priority: 2 },
  { type: 'rule', title: 'No zero days', statement: 'Every day I do at least one thing that moves me toward my goals.', rationale: 'Consistency compounds. Small daily actions build unstoppable momentum.', example: 'Even on hard days, I read one page, do one push-up, or write one sentence.', priority: 3 },
]

export default function PersonalConstitution() {
  const { toastSuccess } = useToast()
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<Principle, 'id' | 'createdAt'>>({
    type: 'core-value', title: '', statement: '', rationale: '', example: '', priority: 5,
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (stored.length === 0) {
        const defaults: Principle[] = DEFAULT_PRINCIPLES.map((p, i) => ({
          id: `default-${i}`, ...p, createdAt: new Date().toISOString(),
        }))
        setPrinciples(defaults)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      } else {
        setPrinciples(stored)
      }
    } catch { /**/ }
  }, [])

  const save = (u: Principle[]) => { setPrinciples(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.statement.trim()) return
    const p: Principle = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([p, ...principles])
    setForm({ type: 'core-value', title: '', statement: '', rationale: '', example: '', priority: 5 })
    setShowForm(false)
    toastSuccess('Principle added 📜')
  }

  const sorted = [...principles].sort((a, b) => a.priority - b.priority)
  const filtered = sorted.filter(p => filterType === 'all' || p.type === filterType)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Scroll className="w-7 h-7 text-amber-400" />
            Constitution
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your personal laws, values, and principles.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{principles.length}</div>
          <div className="text-xs text-slate-500">Principles</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{principles.filter(p => p.type === 'core-value').length}</div>
          <div className="text-xs text-slate-500">Core Values</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{principles.filter(p => p.type === 'mantra').length}</div>
          <div className="text-xs text-slate-500">Mantras</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [PrincipleType, typeof TYPE_CONFIG['core-value']][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Principle</h3>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title *" className="game-input flex-1" autoFocus />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PrincipleType }))} className="game-input text-sm">
              {(Object.entries(TYPE_CONFIG) as [PrincipleType, typeof TYPE_CONFIG['core-value']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))}
            placeholder="The principle statement *" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
            placeholder="Why this matters..." className="game-input w-full text-sm" />
          <input value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
            placeholder="Example of applying this..." className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Priority: {form.priority} (lower = higher priority)</p>
            <input type="range" min={1} max={10} value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((p, idx) => {
          const t = TYPE_CONFIG[p.type]
          const isExp = expanded === p.id
          return (
            <div key={p.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : p.id)}>
                <span className="text-xs text-slate-600 font-mono w-5">{idx + 1}</span>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{p.title}</span>
                    <span className="text-xs text-slate-500">{t.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{p.statement}</p>
                </div>
                <GripVertical className="w-3.5 h-3.5 text-slate-700" />
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <p className="text-xs text-slate-300 italic">"{p.statement}"</p>
                  {p.rationale && <p className="text-xs text-blue-300">💡 {p.rationale}</p>}
                  {p.example && <p className="text-xs text-slate-400">📎 {p.example}</p>}
                  <button onClick={() => save(principles.filter(x => x.id !== p.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Scroll className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Define the laws you live by.</p>
          </div>
        )}
      </div>
    </div>
  )
}
