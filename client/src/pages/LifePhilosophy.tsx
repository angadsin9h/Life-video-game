import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PhilosophyCategory = 'belief' | 'principle' | 'wisdom' | 'quote' | 'question' | 'insight' | 'vow' | 'other'

interface PhilosophyEntry {
  id: string
  category: PhilosophyCategory
  title: string
  content: string
  source: string
  tags: string
  isCoreBeliefs: boolean
  createdAt: string
}

const CAT_CONFIG: Record<PhilosophyCategory, { label: string; emoji: string; color: string }> = {
  belief:    { label: 'Belief',     emoji: '💎', color: '#6366f1' },
  principle: { label: 'Principle',  emoji: '⚖️', color: '#f59e0b' },
  wisdom:    { label: 'Wisdom',     emoji: '🦉', color: '#a855f7' },
  quote:     { label: 'Quote',      emoji: '💬', color: '#3b82f6' },
  question:  { label: 'Question',   emoji: '❓', color: '#ec4899' },
  insight:   { label: 'Insight',    emoji: '💡', color: '#22c55e' },
  vow:       { label: 'Vow',        emoji: '🤝', color: '#ef4444' },
  other:     { label: 'Other',      emoji: '✨', color: '#94a3b8' },
}

const STORAGE_KEY = 'life_philosophy'

export default function LifePhilosophy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PhilosophyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<PhilosophyEntry, 'id' | 'createdAt'>>({
    category: 'belief', title: '', content: '', source: '', tags: '', isCoreBeliefs: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PhilosophyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const e: PhilosophyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ category: 'belief', title: '', content: '', source: '', tags: '', isCoreBeliefs: false })
    setShowForm(false)
    toastSuccess('Philosophy entry saved 💎')
  }

  const filtered = entries.filter(e => filterCat === 'all' || e.category === filterCat)
  const coreBeliefs = entries.filter(e => e.isCoreBeliefs)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-purple-400" />
            Life Philosophy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your beliefs, principles, and wisdom collection.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{coreBeliefs.length}</div>
          <div className="text-xs text-slate-500">Core Beliefs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{entries.filter(e => e.category === 'wisdom').length}</div>
          <div className="text-xs text-slate-500">Wisdom</div>
        </div>
      </div>

      {coreBeliefs.length > 0 && (
        <div className="game-card p-4 border border-purple-500/20">
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">Core Beliefs</p>
          <div className="space-y-1">
            {coreBeliefs.slice(0, 3).map(e => (
              <p key={e.id} className="text-sm text-slate-300">💎 {e.title}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(CAT_CONFIG).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Entry</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as PhilosophyCategory }))} className="game-input text-sm w-full">
            {(Object.entries(CAT_CONFIG) as [PhilosophyCategory, typeof CAT_CONFIG.belief][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Your philosophy, belief, or wisdom *" className="game-input w-full h-24 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Source (optional)" className="game-input flex-1 text-sm" />
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="Tags" className="game-input flex-1 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isCoreBeliefs} onChange={e => setForm(f => ({ ...f, isCoreBeliefs: e.target.checked }))} className="accent-purple-400" />
            Core belief (pinned)
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const c = CAT_CONFIG[e.category]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{e.isCoreBeliefs ? '💎' : c.emoji}</span>
                <div className="flex-1">
                  <span className="font-medium text-white text-sm">{e.title}</span>
                  <p className="text-xs text-slate-500">{c.label}{e.source && ` · ${e.source}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{e.content}"</p>
                  {e.tags && <p className="text-xs text-slate-500">🏷️ {e.tags}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => save(entries.map(x => x.id === e.id ? { ...x, isCoreBeliefs: !x.isCoreBeliefs } : x))}
                      className="text-xs text-purple-600 hover:text-purple-400">
                      {e.isCoreBeliefs ? '★ Unpin' : '☆ Pin as core'}
                    </button>
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">
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
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Build your personal philosophy one belief at a time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
