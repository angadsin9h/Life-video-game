import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MantraCategory = 'morning' | 'strength' | 'resilience' | 'focus' | 'love' | 'courage' | 'abundance' | 'peace' | 'purpose' | 'other'

interface Mantra {
  id: string
  category: MantraCategory
  text: string
  origin: string
  context: string
  useCase: string
  timesUsed: number
  lastUsed: string
  isFavorite: boolean
  isPracticing: boolean
  createdAt: string
}

const CAT_CONFIG: Record<MantraCategory, { label: string; emoji: string; color: string }> = {
  morning:    { label: 'Morning',    emoji: '🌅', color: '#f59e0b' },
  strength:   { label: 'Strength',   emoji: '💪', color: '#f97316' },
  resilience: { label: 'Resilience', emoji: '🛡️', color: '#3b82f6' },
  focus:      { label: 'Focus',      emoji: '🎯', color: '#6366f1' },
  love:       { label: 'Love',       emoji: '❤️', color: '#ec4899' },
  courage:    { label: 'Courage',    emoji: '🦁', color: '#f59e0b' },
  abundance:  { label: 'Abundance',  emoji: '✨', color: '#22c55e' },
  peace:      { label: 'Peace',      emoji: '🕊️', color: '#0ea5e9' },
  purpose:    { label: 'Purpose',    emoji: '🌟', color: '#a855f7' },
  other:      { label: 'Other',      emoji: '🔮', color: '#94a3b8' },
}

const TEMPLATES = [
  'I am enough exactly as I am.',
  'I choose progress over perfection.',
  'I am capable of handling anything that comes my way.',
  'Today I will focus on what I can control.',
  'I am becoming better every single day.',
  'My challenges are shaping me into who I need to become.',
  'I am worthy of love and belonging.',
  'I trust the process and embrace the journey.',
]

const STORAGE_KEY = 'mantra_log'

export default function MantraLog() {
  const { toastSuccess } = useToast()
  const [mantras, setMantras] = useState<Mantra[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [showTemplates, setShowTemplates] = useState(false)
  const [form, setForm] = useState<Omit<Mantra, 'id' | 'createdAt' | 'timesUsed' | 'lastUsed'>>({
    category: 'morning', text: '', origin: '', context: '', useCase: '', isFavorite: false, isPracticing: true,
  })

  useEffect(() => {
    try { setMantras(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Mantra[]) => { setMantras(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.text.trim()) return
    const m: Mantra = {
      id: Date.now().toString(), ...form, timesUsed: 0,
      lastUsed: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString(),
    }
    save([m, ...mantras])
    setForm(f => ({ ...f, text: '', origin: '', context: '', useCase: '' }))
    setShowForm(false)
    toastSuccess('Mantra added ✨')
  }

  const practice = (id: string) => {
    save(mantras.map(m => m.id === id ? { ...m, timesUsed: m.timesUsed + 1, lastUsed: new Date().toISOString().split('T')[0] } : m))
    toastSuccess('Mantra practiced 🙏')
  }

  const filtered = mantras.filter(m => filterCat === 'all' || m.category === filterCat)
  const favorites = mantras.filter(m => m.isFavorite).length
  const totalPracticed = mantras.reduce((s, m) => s + m.timesUsed, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-purple-400" />
            Mantra Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Collect and practice your empowering mantras.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{mantras.length}</div>
          <div className="text-xs text-slate-500">Mantras</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{totalPracticed}</div>
          <div className="text-xs text-slate-500">Times Used</div>
        </div>
      </div>

      <button onClick={() => setShowTemplates(!showTemplates)}
        className="w-full text-left px-3 py-2 bg-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-300">
        {showTemplates ? '▼' : '▶'} Template mantras — click to use
      </button>
      {showTemplates && (
        <div className="game-card p-3 space-y-1.5">
          {TEMPLATES.map(t => (
            <button key={t} onClick={() => { setForm(f => ({ ...f, text: t })); setShowForm(true); setShowTemplates(false) }}
              className="w-full text-left text-xs text-slate-300 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg italic">
              "{t}"
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [MantraCategory, typeof CAT_CONFIG.morning][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Mantra</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MantraCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [MantraCategory, typeof CAT_CONFIG.morning][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Your mantra... *" className="game-input w-full h-16 resize-none" autoFocus />
          <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
            placeholder="Source / origin (book, person, etc.)" className="game-input w-full text-sm" />
          <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="When did you discover this?" className="game-input w-full text-sm" />
          <input value={form.useCase} onChange={e => setForm(f => ({ ...f, useCase: e.target.value }))}
            placeholder="When to use it (e.g., when anxious, mornings)" className="game-input w-full text-sm" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} />
              Favorite
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isPracticing} onChange={e => setForm(f => ({ ...f, isPracticing: e.target.checked }))} />
              Currently practicing
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(m => {
          const c = CAT_CONFIG[m.category]
          const isExp = expanded === m.id
          return (
            <div key={m.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : m.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {m.isFavorite && <span className="text-yellow-400 text-xs">⭐</span>}
                    {m.isPracticing && <span className="text-green-400 text-xs">🔄</span>}
                  </div>
                  <p className="text-sm text-white italic truncate">"{m.text}"</p>
                  <p className="text-xs text-slate-500">{c.label} · used {m.timesUsed}×</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <p className="text-sm text-white italic">"{m.text}"</p>
                  {m.origin && <p className="text-xs text-slate-400">📚 {m.origin}</p>}
                  {m.useCase && <p className="text-xs text-blue-300">🕐 Use when: {m.useCase}</p>}
                  {m.context && <p className="text-xs text-slate-400">💭 {m.context}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => practice(m.id)}
                      className="px-3 py-1 bg-purple-700/30 text-purple-400 rounded-lg text-xs hover:bg-purple-700/50">
                      🙏 Practice
                    </button>
                    <button onClick={() => save(mantras.map(x => x.id === m.id ? { ...x, isFavorite: !x.isFavorite } : x))}
                      className="px-3 py-1 bg-yellow-700/30 text-yellow-400 rounded-lg text-xs">
                      {m.isFavorite ? '★ Unfav' : '☆ Fav'}
                    </button>
                    <button onClick={() => save(mantras.filter(x => x.id !== m.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Words you repeat become your reality. Collect your most powerful mantras.</p>
          </div>
        )}
      </div>
    </div>
  )
}
