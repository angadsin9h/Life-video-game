import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PurposeType = 'ikigai' | 'mission' | 'vision' | 'calling' | 'contribution' | 'value' | 'why' | 'manifesto' | 'north-star' | 'other'

interface PurposeEntry {
  id: string
  type: PurposeType
  title: string
  statement: string
  evidence: string
  blockers: string
  actions: string[]
  clarity: number
  isCore: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<PurposeType, { label: string; emoji: string; color: string; description: string }> = {
  ikigai:       { label: 'Ikigai',       emoji: '⭕', color: '#f59e0b', description: 'Reason for being' },
  mission:      { label: 'Mission',      emoji: '🚀', color: '#3b82f6', description: 'Your mission statement' },
  vision:       { label: 'Vision',       emoji: '🔭', color: '#a855f7', description: 'What you envision' },
  calling:      { label: 'Calling',      emoji: '📯', color: '#f97316', description: 'What calls to you' },
  contribution: { label: 'Contribution', emoji: '🎁', color: '#22c55e', description: 'How you serve others' },
  value:        { label: 'Core Value',   emoji: '💎', color: '#6366f1', description: 'What you stand for' },
  why:          { label: 'My Why',       emoji: '❓', color: '#ec4899', description: 'Your driving reason' },
  manifesto:    { label: 'Manifesto',    emoji: '📜', color: '#84cc16', description: 'Personal declaration' },
  'north-star': { label: 'North Star',   emoji: '⭐', color: '#eab308', description: 'Guiding direction' },
  other:        { label: 'Other',        emoji: '🌟', color: '#94a3b8', description: 'Other purpose' },
}

const STORAGE_KEY = 'life_purpose'

export default function LifePurpose() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PurposeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [newAction, setNewAction] = useState('')
  const [form, setForm] = useState<Omit<PurposeEntry, 'id' | 'createdAt'>>({
    type: 'ikigai', title: '', statement: '', evidence: '', blockers: '', actions: [], clarity: 5, isCore: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PurposeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.statement.trim()) return
    const e: PurposeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', statement: '', evidence: '', blockers: '', actions: [] }))
    setNewAction('')
    setShowForm(false)
    toastSuccess('Purpose statement saved 🌟')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const core = entries.filter(e => e.isCore).length
  const avgClarity = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.clarity, 0) / entries.length * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-amber-400" />
            Life Purpose
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Discover and articulate your deepest purpose.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Statements</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{core}</div>
          <div className="text-xs text-slate-500">Core</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgClarity}/10</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [PurposeType, typeof TYPE_CONFIG.ikigai][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Purpose Statement</h3>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PurposeType }))} className="game-input w-full text-sm">
            {(Object.entries(TYPE_CONFIG) as [PurposeType, typeof TYPE_CONFIG.ikigai][]).map(([k, t]) => (
              <option key={k} value={k}>{t.emoji} {t.label} — {t.description}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title / headline *" className="game-input w-full" autoFocus />
          <textarea value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))}
            placeholder="Write your purpose statement... *" className="game-input w-full h-20 resize-none text-sm" />
          <textarea value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence this is true for you..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
            placeholder="What gets in the way?" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={newAction} onChange={e => setNewAction(e.target.value)}
              placeholder="Add an action step..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newAction.trim()) { setForm(f => ({ ...f, actions: [...f.actions, newAction.trim()] })); setNewAction('') } }} />
            <button onClick={() => { if (newAction.trim()) { setForm(f => ({ ...f, actions: [...f.actions, newAction.trim()] })); setNewAction('') } }}
              className="px-3 py-1.5 bg-amber-700/30 text-amber-400 rounded-xl text-xs">Add</button>
          </div>
          {form.actions.length > 0 && (
            <div className="space-y-1">
              {form.actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-amber-400">→</span>
                  <span className="text-xs text-slate-300 flex-1">{a}</span>
                  <button onClick={() => setForm(f => ({ ...f, actions: f.actions.filter((_, j) => j !== i) }))}
                    className="text-slate-600 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Clarity: {form.clarity}/10</p>
              <input type="range" min={1} max={10} value={form.clarity}
                onChange={e => setForm(f => ({ ...f, clarity: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isCore} onChange={e => setForm(f => ({ ...f, isCore: e.target.checked }))} />
              Core statement
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    {e.isCore && <span className="text-xs text-amber-500">⭐ core</span>}
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · Clarity {e.clarity}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <p className="text-xs text-slate-200 italic">"{e.statement}"</p>
                  {e.evidence && <p className="text-xs text-green-300">✅ {e.evidence}</p>}
                  {e.blockers && <p className="text-xs text-red-300">⚠️ {e.blockers}</p>}
                  {e.actions.length > 0 && (
                    <div className="space-y-0.5">
                      {e.actions.map((a, i) => <p key={i} className="text-xs text-amber-300">→ {a}</p>)}
                    </div>
                  )}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The two most important days are when you were born and when you find your why.</p>
          </div>
        )}
      </div>
    </div>
  )
}
