import { useState, useEffect } from 'react'
import { GraduationCap, Plus, Trash2, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type QuoteCategory = 'wisdom' | 'discipline' | 'mindset' | 'relationships' | 'success' | 'failure' | 'purpose' | 'courage' | 'health' | 'finance' | 'love' | 'other'
type QuoteSource = 'book' | 'mentor' | 'podcast' | 'video' | 'conversation' | 'article' | 'own' | 'other'

interface MentorQuote {
  id: string
  quote: string
  author: string
  category: QuoteCategory
  source: QuoteSource
  lesson: string
  application: string
  resonance: number
  isFavorite: boolean
  date: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<QuoteCategory, { label: string; color: string; emoji: string }> = {
  wisdom:        { label: 'Wisdom',        color: '#f59e0b', emoji: '🌟' },
  discipline:    { label: 'Discipline',    color: '#ef4444', emoji: '⚔️' },
  mindset:       { label: 'Mindset',       color: '#a855f7', emoji: '🧠' },
  relationships: { label: 'Relationships', color: '#ec4899', emoji: '❤️' },
  success:       { label: 'Success',       color: '#22c55e', emoji: '🏆' },
  failure:       { label: 'Failure',       color: '#6366f1', emoji: '📉' },
  purpose:       { label: 'Purpose',       color: '#3b82f6', emoji: '🎯' },
  courage:       { label: 'Courage',       color: '#f97316', emoji: '🦁' },
  health:        { label: 'Health',        color: '#0ea5e9', emoji: '💪' },
  finance:       { label: 'Finance',       color: '#84cc16', emoji: '💰' },
  love:          { label: 'Love',          color: '#f43f5e', emoji: '💕' },
  other:         { label: 'Other',         color: '#94a3b8', emoji: '💭' },
}

const SOURCE_CONFIG: Record<QuoteSource, { label: string }> = {
  book:         { label: 'Book'         },
  mentor:       { label: 'Mentor'       },
  podcast:      { label: 'Podcast'      },
  video:        { label: 'Video'        },
  conversation: { label: 'Conversation' },
  article:      { label: 'Article'      },
  own:          { label: 'My Own'       },
  other:        { label: 'Other'        },
}

const STORAGE_KEY = 'mentor_quotes'

export default function MentorQuotes() {
  const { toastSuccess } = useToast()
  const [quotes, setQuotes] = useState<MentorQuote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<QuoteCategory | 'all'>('all')
  const [form, setForm] = useState<Omit<MentorQuote, 'id' | 'createdAt'>>({
    quote: '', author: '', category: 'wisdom', source: 'book',
    lesson: '', application: '', resonance: 8, isFavorite: false,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setQuotes(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MentorQuote[]) => { setQuotes(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.quote.trim()) return
    const q: MentorQuote = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([q, ...quotes])
    setForm(f => ({ ...f, quote: '', author: '', lesson: '', application: '', isFavorite: false }))
    setShowForm(false)
    toastSuccess('Quote saved to your wisdom vault 🌟')
  }

  const favorites = quotes.filter(q => q.isFavorite).length
  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.category === filter)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <GraduationCap className="w-7 h-7 text-yellow-400" />
            Mentor Quotes
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Collect wisdom from mentors, books, and your own insights.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{quotes.length}</div>
          <div className="text-xs text-slate-500">Quotes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{[...new Set(quotes.map(q => q.author))].filter(Boolean).length}</div>
          <div className="text-xs text-slate-500">Authors</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === 'all' ? 'bg-yellow-700 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
        {(Object.entries(CATEGORY_CONFIG) as [QuoteCategory, typeof CATEGORY_CONFIG.wisdom][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === k ? 'text-white' : 'bg-slate-800 text-slate-400'}`}
            style={filter === k ? { background: c.color } : {}}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Save Quote</h3>
          <textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
            placeholder="The quote / wisdom *" className="game-input w-full h-16 resize-none text-sm" autoFocus />
          <div className="flex gap-2">
            <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              placeholder="Author / source name" className="game-input flex-1 text-sm" />
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as QuoteSource }))} className="game-input text-sm">
              {(Object.entries(SOURCE_CONFIG) as [QuoteSource, typeof SOURCE_CONFIG.book][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as QuoteCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CATEGORY_CONFIG) as [QuoteCategory, typeof CATEGORY_CONFIG.wisdom][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Key lesson or takeaway" className="game-input w-full text-sm" />
          <input value={form.application} onChange={e => setForm(f => ({ ...f, application: e.target.value }))}
            placeholder="How will you apply this?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Resonance: {form.resonance}/10</p>
              <input type="range" min={1} max={10} value={form.resonance}
                onChange={e => setForm(f => ({ ...f, resonance: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} />
              ⭐ Favorite
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save Quote</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(q => {
          const c = CATEGORY_CONFIG[q.category]
          return (
            <div key={q.id} className="game-card p-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '20', color: c.color }}>{c.label}</span>
                    {q.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    <span className="text-xs text-slate-500">✨ {q.resonance}/10</span>
                  </div>
                  <p className="text-sm text-white mt-1 italic">"{q.quote}"</p>
                  {q.author && <p className="text-xs text-slate-400 mt-0.5">— {q.author}</p>}
                  {q.lesson && <p className="text-xs text-yellow-300/80 mt-1">💡 {q.lesson}</p>}
                  {q.application && <p className="text-xs text-green-300 mt-0.5">→ {q.application}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <label className="cursor-pointer">
                    <input type="checkbox" className="hidden" checked={q.isFavorite}
                      onChange={ev => save(quotes.map(x => x.id === q.id ? { ...x, isFavorite: ev.target.checked } : x))} />
                    <Star className={`w-3.5 h-3.5 ${q.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                  </label>
                  <button onClick={() => save(quotes.filter(x => x.id !== q.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Collect the wisdom of those who walked before you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
