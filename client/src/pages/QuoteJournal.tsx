import { useEffect, useState } from 'react'
import { BookOpen, Plus, Star, Copy, Share2, X, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Quote {
  id: string
  text: string
  author: string
  source: string
  tags: string[]
  starred: boolean
  addedAt: string
}

const DEFAULT_QUOTES: Quote[] = [
  { id: '1', text: "The secret of getting ahead is getting started.", author: "Mark Twain", source: "", tags: ["motivation", "action"], starred: false, addedAt: new Date().toISOString() },
  { id: '2', text: "It is not the mountain we conquer, but ourselves.", author: "Sir Edmund Hillary", source: "", tags: ["mindset", "growth"], starred: false, addedAt: new Date().toISOString() },
  { id: '3', text: "The only way to do great work is to love what you do.", author: "Steve Jobs", source: "", tags: ["work", "passion"], starred: false, addedAt: new Date().toISOString() },
  { id: '4', text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", source: "", tags: ["resilience", "mindset"], starred: false, addedAt: new Date().toISOString() },
  { id: '5', text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", source: "", tags: ["motivation", "action"], starred: false, addedAt: new Date().toISOString() },
  { id: '6', text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", source: "", tags: ["discipline", "goals"], starred: false, addedAt: new Date().toISOString() },
  { id: '7', text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", source: "", tags: ["purpose", "authenticity"], starred: false, addedAt: new Date().toISOString() },
  { id: '8', text: "The only limit to our realization of tomorrow is our doubts of today.", author: "FDR", source: "", tags: ["mindset", "belief"], starred: false, addedAt: new Date().toISOString() },
  { id: '9', text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", source: "", tags: ["resilience", "perseverance"], starred: false, addedAt: new Date().toISOString() },
  { id: '10', text: "We are what we repeatedly do. Excellence then is not an act but a habit.", author: "Aristotle", source: "", tags: ["habits", "excellence"], starred: false, addedAt: new Date().toISOString() },
]

const ALL_TAGS = ['motivation', 'mindset', 'habits', 'discipline', 'growth', 'resilience', 'wisdom', 'focus', 'purpose', 'action']

function getDailyQuote(quotes: Quote[]): Quote | null {
  if (quotes.length === 0) return null
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return quotes[dayOfYear % quotes.length]
}

export default function QuoteJournal() {
  const { toastSuccess } = useToast()
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const stored = localStorage.getItem('quote_journal')
    return stored ? JSON.parse(stored) : DEFAULT_QUOTES
  })
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [showStarred, setShowStarred] = useState(false)
  const [form, setForm] = useState({ text: '', author: '', source: '', tags: '' })
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null)
  const [reflectionMode, setReflectionMode] = useState(false)
  const [reflection, setReflection] = useState('')

  useEffect(() => {
    setDailyQuote(getDailyQuote(quotes))
  }, [quotes])

  const persist = (q: Quote[]) => {
    setQuotes(q)
    localStorage.setItem('quote_journal', JSON.stringify(q))
  }

  const addQuote = () => {
    if (!form.text.trim()) return
    const q: Quote = {
      id: Date.now().toString(),
      text: form.text.trim(),
      author: form.author.trim() || 'Unknown',
      source: form.source.trim(),
      tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t),
      starred: false,
      addedAt: new Date().toISOString(),
    }
    persist([q, ...quotes])
    setForm({ text: '', author: '', source: '', tags: '' })
    setShowAdd(false)
    toastSuccess('Quote added!')
  }

  const toggleStar = (id: string) => {
    persist(quotes.map(q => q.id === id ? { ...q, starred: !q.starred } : q))
  }

  const deleteQuote = (id: string) => {
    persist(quotes.filter(q => q.id !== id))
  }

  const copyQuote = (q: Quote) => {
    navigator.clipboard.writeText(`"${q.text}" — ${q.author}`)
    toastSuccess('Copied to clipboard!')
  }

  const saveReflection = () => {
    if (!reflection.trim() || !dailyQuote) return
    const key = `quote_reflection_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, JSON.stringify({ quote: dailyQuote.text, reflection }))
    setReflectionMode(false)
    toastSuccess('Reflection saved!')
  }

  const filtered = quotes.filter(q => {
    if (showStarred && !q.starred) return false
    if (filter !== 'all' && !q.tags.includes(filter)) return false
    return true
  })

  const allTags = [...new Set(quotes.flatMap(q => q.tags))].sort()
  const starredCount = quotes.filter(q => q.starred).length

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-amber-400" />
            Quote Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{quotes.length} quotes · {starredCount} starred</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showAdd ? 'bg-slate-700 text-slate-300' : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}>
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Add Quote'}
        </button>
      </div>

      {/* Daily Quote */}
      {dailyQuote && !showAdd && (
        <div className="game-card p-6 border border-amber-500/20 bg-amber-900/5">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <RefreshCw className="w-3 h-3" /> Quote of the Day
          </div>
          <blockquote className="text-lg text-slate-100 leading-relaxed italic">
            "{dailyQuote.text}"
          </blockquote>
          <p className="text-sm text-amber-400 mt-3">— {dailyQuote.author}</p>
          {dailyQuote.source && <p className="text-xs text-slate-600 mt-1">{dailyQuote.source}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setReflectionMode(r => !r)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-600/30 transition-colors font-semibold">
              📝 Reflect
            </button>
            <button onClick={() => copyQuote(dailyQuote)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors">
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          {reflectionMode && (
            <div className="mt-3 space-y-2">
              <textarea rows={3} placeholder="What does this quote mean to you today?"
                value={reflection} onChange={e => setReflection(e.target.value)}
                className="game-input w-full text-sm resize-none" autoFocus />
              <div className="flex gap-2">
                <button onClick={saveReflection} disabled={!reflection.trim()}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                  Save Reflection
                </button>
                <button onClick={() => setReflectionMode(false)}
                  className="px-3 py-2 bg-slate-700 text-slate-400 rounded-xl hover:bg-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <textarea rows={3} autoFocus placeholder="Quote text…" value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <div className="flex gap-2">
            <input placeholder="Author…" value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              className="game-input flex-1 text-sm" />
            <input placeholder="Source (book, talk…)" value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="game-input flex-1 text-sm" />
          </div>
          <input placeholder="Tags (comma-separated): motivation, growth…" value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="game-input w-full text-sm" />
          <button onClick={addQuote} disabled={!form.text.trim()}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            Save Quote
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => { setFilter('all'); setShowStarred(false) }}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all' && !showStarred ? 'bg-amber-600/30 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
          }`}>
          All ({quotes.length})
        </button>
        <button onClick={() => setShowStarred(s => !s)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
            showStarred ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
          }`}>
          <Star className="w-3 h-3" /> Starred ({starredCount})
        </button>
        {allTags.map(tag => (
          <button key={tag} onClick={() => setFilter(filter === tag ? 'all' : tag)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === tag ? 'bg-amber-600/30 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
            }`}>
            {tag}
          </button>
        ))}
      </div>

      {/* Quotes list */}
      <div className="space-y-3">
        {filtered.map(q => (
          <div key={q.id} className={`game-card p-4 ${q.starred ? 'border-yellow-500/20 bg-yellow-900/5' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <blockquote className="text-slate-200 text-sm leading-relaxed">"{q.text}"</blockquote>
                <p className="text-xs text-amber-400 mt-1.5">— {q.author}</p>
                {q.source && <p className="text-xs text-slate-600">{q.source}</p>}
                {q.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {q.tags.map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-600 rounded-full border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => toggleStar(q.id)}
                  className={`p-1 transition-colors ${q.starred ? 'text-yellow-400' : 'text-slate-700 hover:text-yellow-400'}`}>
                  <Star className="w-3.5 h-3.5" fill={q.starred ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => copyQuote(q)} className="p-1 text-slate-700 hover:text-slate-400 transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteQuote(q.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No quotes found</p>
          </div>
        )}
      </div>
    </div>
  )
}
