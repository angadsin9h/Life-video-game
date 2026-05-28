import { useState, useEffect } from 'react'
import { BookMarked, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PhiloTradition = 'stoicism' | 'buddhism' | 'existentialism' | 'taoism' | 'epicureanism' | 'platonism' | 'pragmatism' | 'christianity' | 'other'
type PhiloType = 'quote' | 'concept' | 'practice' | 'book' | 'insight' | 'question' | 'principle'

interface PhiloNote {
  id: string
  tradition: PhiloTradition
  type: PhiloType
  title: string
  content: string
  source: string
  myTake: string
  howApply: string
  resonance: number
  isFavorite: boolean
  createdAt: string
}

const TRADITION_CONFIG: Record<PhiloTradition, { label: string; emoji: string; color: string }> = {
  stoicism:       { label: 'Stoicism',       emoji: '🏛️', color: '#6366f1' },
  buddhism:       { label: 'Buddhism',       emoji: '☸️', color: '#f59e0b' },
  existentialism: { label: 'Existentialism', emoji: '🌀', color: '#a855f7' },
  taoism:         { label: 'Taoism',         emoji: '☯️', color: '#22c55e' },
  epicureanism:   { label: 'Epicureanism',   emoji: '🌿', color: '#84cc16' },
  platonism:      { label: 'Platonism',      emoji: '💎', color: '#3b82f6' },
  pragmatism:     { label: 'Pragmatism',     emoji: '⚙️', color: '#f97316' },
  christianity:   { label: 'Christianity',   emoji: '✝️', color: '#0ea5e9' },
  other:          { label: 'Other',          emoji: '📖', color: '#94a3b8' },
}

const TYPE_CONFIG: Record<PhiloType, { label: string; color: string }> = {
  quote:     { label: 'Quote',     color: '#f59e0b' },
  concept:   { label: 'Concept',   color: '#3b82f6' },
  practice:  { label: 'Practice',  color: '#22c55e' },
  book:      { label: 'Book',      color: '#a855f7' },
  insight:   { label: 'Insight',   color: '#ec4899' },
  question:  { label: 'Question',  color: '#f97316' },
  principle: { label: 'Principle', color: '#6366f1' },
}

const STORAGE_KEY = 'philosophy_notes'

export default function PhilosophyNotes() {
  const { toastSuccess } = useToast()
  const [notes, setNotes] = useState<PhiloNote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterTradition, setFilterTradition] = useState<string>('all')
  const [form, setForm] = useState<Omit<PhiloNote, 'id' | 'createdAt'>>({
    tradition: 'stoicism', type: 'quote', title: '', content: '', source: '',
    myTake: '', howApply: '', resonance: 8, isFavorite: false,
  })

  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PhiloNote[]) => { setNotes(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const n: PhiloNote = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([n, ...notes])
    setForm(f => ({ ...f, title: '', content: '', source: '', myTake: '', howApply: '' }))
    setShowForm(false)
    toastSuccess('Philosophy note saved 📖')
  }

  const filtered = notes.filter(n => filterTradition === 'all' || n.tradition === filterTradition)
  const favorites = notes.filter(n => n.isFavorite).length
  const avgResonance = notes.length ? Math.round(notes.reduce((s, n) => s + n.resonance, 0) / notes.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookMarked className="w-7 h-7 text-indigo-400" />
            Philosophy Notes
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Collect wisdom from great thinkers and apply it to your life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Note
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{notes.length}</div>
          <div className="text-xs text-slate-500">Notes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgResonance}/10</div>
          <div className="text-xs text-slate-500">Avg Resonance</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterTradition('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTradition === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TRADITION_CONFIG) as [PhiloTradition, typeof TRADITION_CONFIG.stoicism][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterTradition(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTradition === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterTradition === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Philosophy Note</h3>
          <div className="flex gap-2">
            <select value={form.tradition} onChange={e => setForm(f => ({ ...f, tradition: e.target.value as PhiloTradition }))} className="game-input text-sm flex-1">
              {(Object.entries(TRADITION_CONFIG) as [PhiloTradition, typeof TRADITION_CONFIG.stoicism][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PhiloType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [PhiloType, typeof TYPE_CONFIG.quote][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title / quote header *" className="game-input w-full" autoFocus />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="The quote, concept, or idea..." className="game-input w-full h-16 resize-none text-sm" />
          <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            placeholder="Source: Author, book, or teacher" className="game-input w-full text-sm" />
          <textarea value={form.myTake} onChange={e => setForm(f => ({ ...f, myTake: e.target.value }))}
            placeholder="My interpretation / what it means to me..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howApply} onChange={e => setForm(f => ({ ...f, howApply: e.target.value }))}
            placeholder="How I'll apply this to my life" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Resonance: {form.resonance}/10</p>
              <input type="range" min={1} max={10} value={form.resonance}
                onChange={e => setForm(f => ({ ...f, resonance: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} />
              Favorite
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(n => {
          const tr = TRADITION_CONFIG[n.tradition]
          const ty = TYPE_CONFIG[n.type]
          const isExp = expanded === n.id
          return (
            <div key={n.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${tr.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : n.id)}>
                <span className="text-2xl">{tr.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{n.title}</span>
                    {n.isFavorite && <span className="text-yellow-400 text-xs">★</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: ty.color + '20', color: ty.color }}>{ty.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{tr.label} · resonance {n.resonance}/10{n.source ? ` · ${n.source}` : ''}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {n.content && <p className="text-xs text-slate-300 italic">"{n.content}"</p>}
                  {n.myTake && <p className="text-xs text-blue-300">💭 {n.myTake}</p>}
                  {n.howApply && <p className="text-xs text-green-300">→ Apply: {n.howApply}</p>}
                  <button onClick={() => save(notes.filter(x => x.id !== n.id))} className="ml-auto block text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Philosophy is thinking about what matters most. Start here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
