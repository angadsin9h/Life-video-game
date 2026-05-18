import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Check, Star, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BookStatus = 'want' | 'reading' | 'done' | 'abandoned'
type Genre = 'fiction' | 'nonfiction' | 'scifi' | 'fantasy' | 'biography' | 'selfhelp' | 'history' | 'science' | 'business' | 'other'

interface ChallengeBook {
  id: string
  title: string
  author: string
  genre: Genre
  pages: number
  status: BookStatus
  rating: number
  startDate: string
  finishDate: string
  notes: string
  challenge: string
}

interface ReadingChallenge {
  id: string
  year: number
  goal: number
  theme: string
}

const STATUS_CONFIG: Record<BookStatus, { label: string; color: string; emoji: string }> = {
  want:      { label: 'Want to read', color: '#6366f1', emoji: '📚' },
  reading:   { label: 'Reading',      color: '#f59e0b', emoji: '📖' },
  done:      { label: 'Done',         color: '#22c55e', emoji: '✅' },
  abandoned: { label: 'Abandoned',    color: '#94a3b8', emoji: '🚫' },
}

const GENRE_CONFIG: Record<Genre, { label: string; color: string }> = {
  fiction:    { label: 'Fiction',     color: '#6366f1' },
  nonfiction: { label: 'Non-fiction', color: '#3b82f6' },
  scifi:      { label: 'Sci-Fi',      color: '#a855f7' },
  fantasy:    { label: 'Fantasy',     color: '#22c55e' },
  biography:  { label: 'Biography',   color: '#f59e0b' },
  selfhelp:   { label: 'Self-Help',   color: '#ec4899' },
  history:    { label: 'History',     color: '#f97316' },
  science:    { label: 'Science',     color: '#0ea5e9' },
  business:   { label: 'Business',    color: '#84cc16' },
  other:      { label: 'Other',       color: '#94a3b8' },
}

const STORAGE_KEY = 'reading_challenge'
const CHALLENGE_KEY = 'reading_challenge_meta'

export default function ReadingChallenge() {
  const { toastSuccess } = useToast()
  const currentYear = new Date().getFullYear()
  const [books, setBooks] = useState<ChallengeBook[]>([])
  const [challenge, setChallenge] = useState<ReadingChallenge>({ id: '1', year: currentYear, goal: 24, theme: '' })
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterGenre, setFilterGenre] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [form, setForm] = useState<Omit<ChallengeBook, 'id'>>({
    title: '', author: '', genre: 'nonfiction', pages: 0, status: 'want',
    rating: 0, startDate: '', finishDate: '', notes: '', challenge: currentYear.toString(),
  })
  const [cForm, setCForm] = useState({ goal: 24, theme: '' })

  useEffect(() => {
    try {
      setBooks(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      const c = JSON.parse(localStorage.getItem(CHALLENGE_KEY) || 'null')
      if (c) { setChallenge(c); setCForm({ goal: c.goal, theme: c.theme }) }
    } catch { /**/ }
  }, [])

  const saveBooks = (u: ChallengeBook[]) => { setBooks(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const b: ChallengeBook = { id: Date.now().toString(), ...form }
    saveBooks([b, ...books])
    setForm({ title: '', author: '', genre: 'nonfiction', pages: 0, status: 'want', rating: 0, startDate: '', finishDate: '', notes: '', challenge: currentYear.toString() })
    setShowForm(false)
    toastSuccess(`"${form.title}" added`)
  }

  const saveChallenge = () => {
    const c = { ...challenge, ...cForm }
    setChallenge(c)
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(c))
    setShowChallengeForm(false)
    toastSuccess('Challenge updated!')
  }

  const updateStatus = (id: string, status: BookStatus) => {
    const today = new Date().toISOString().split('T')[0]
    saveBooks(books.map(b => b.id === id ? {
      ...b, status,
      startDate: status === 'reading' && !b.startDate ? today : b.startDate,
      finishDate: status === 'done' && !b.finishDate ? today : b.finishDate,
    } : b))
    if (status === 'done') toastSuccess('Book finished! 🎉')
  }

  const yearBooks = books.filter(b => b.challenge === currentYear.toString())
  const doneThisYear = yearBooks.filter(b => b.status === 'done').length
  const pagesRead = books.filter(b => b.status === 'done').reduce((s, b) => s + b.pages, 0)
  const avgRating = books.filter(b => b.rating > 0).length
    ? (books.filter(b => b.rating > 0).reduce((s, b) => s + b.rating, 0) / books.filter(b => b.rating > 0).length).toFixed(1)
    : '—'

  const filtered = books.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterGenre !== 'all' && b.genre !== filterGenre) return false
    return true
  })

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-amber-400" />
            Reading Challenge
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your annual reading goals.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </div>

      {/* Challenge progress */}
      <div className="game-card p-4 border border-amber-500/20">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-semibold text-white">{currentYear} Challenge</span>
            {challenge.theme && <span className="text-xs text-amber-400 ml-2">"{challenge.theme}"</span>}
          </div>
          <button onClick={() => setShowChallengeForm(true)} className="text-xs text-slate-500 hover:text-slate-300">Edit</button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-bold text-amber-400">{doneThisYear}</span>
          <span className="text-slate-500">/ {challenge.goal} books</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(100, (doneThisYear / challenge.goal) * 100)}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span>📄 {pagesRead.toLocaleString()} pages read</span>
          <span>⭐ {avgRating} avg rating</span>
          <span>📚 {books.length} total books</span>
        </div>
      </div>

      {showChallengeForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-2">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs text-slate-500">Goal:</span>
              <input type="number" value={cForm.goal} min={1}
                onChange={e => setCForm(f => ({ ...f, goal: Number(e.target.value) }))}
                className="game-input w-20 text-sm text-center" />
              <span className="text-xs text-slate-500">books</span>
            </div>
            <input value={cForm.theme} onChange={e => setCForm(f => ({ ...f, theme: e.target.value }))}
              placeholder="Challenge theme (optional)" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveChallenge} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowChallengeForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="game-input text-sm flex-1">
          <option value="all">All ({books.length})</option>
          {(Object.entries(STATUS_CONFIG) as [BookStatus, typeof STATUS_CONFIG.want][]).map(([k, s]) => (
            <option key={k} value={k}>{s.emoji} {s.label} ({books.filter(b => b.status === k).length})</option>
          ))}
        </select>
        <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} className="game-input text-sm flex-1">
          <option value="all">All genres</option>
          {(Object.entries(GENRE_CONFIG) as [Genre, typeof GENRE_CONFIG.fiction][]).map(([k, g]) => (
            <option key={k} value={k}>{g.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Book</h3>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title *" className="game-input flex-1" autoFocus />
            <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              placeholder="Author" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value as Genre }))} className="game-input text-sm flex-1">
              {(Object.entries(GENRE_CONFIG) as [Genre, typeof GENRE_CONFIG.fiction][]).map(([k, g]) => (
                <option key={k} value={k}>{g.label}</option>
              ))}
            </select>
            <input type="number" value={form.pages || ''} min={0}
              onChange={e => setForm(f => ({ ...f, pages: Number(e.target.value) }))}
              placeholder="Pages" className="game-input w-24 text-sm text-center" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(STATUS_CONFIG) as [BookStatus, typeof STATUS_CONFIG.want][]).map(([k, s]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.status === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.status === k ? { background: s.color + '30', color: s.color } : {}}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          {form.status === 'done' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rating:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className={`text-xl ${form.rating >= n ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
              ))}
            </div>
          )}
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / review" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Add Book</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(b => {
          const s = STATUS_CONFIG[b.status]
          const g = GENRE_CONFIG[b.genre]
          return (
            <div key={b.id} className={`game-card p-4 flex gap-3 ${b.status === 'done' ? '' : ''}`}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium text-sm ${b.status === 'abandoned' ? 'line-through text-slate-500' : 'text-white'}`}>{b.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: g.color + '20', color: g.color }}>{g.label}</span>
                </div>
                {b.author && <p className="text-xs text-slate-500 mt-0.5">by {b.author}</p>}
                {b.pages > 0 && <p className="text-xs text-slate-600">{b.pages} pages</p>}
                {b.rating > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${b.rating >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />)}
                  </div>
                )}
                {b.notes && <p className="text-xs text-slate-500 mt-1 italic">{b.notes}</p>}
                <div className="flex gap-1.5 mt-2">
                  {(Object.keys(STATUS_CONFIG) as BookStatus[]).map(st => (
                    <button key={st} onClick={() => updateStatus(b.id, st)}
                      className={`px-2 py-0.5 rounded-full text-xs ${b.status === st ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                      style={b.status === st ? { background: STATUS_CONFIG[st].color + '30', color: STATUS_CONFIG[st].color } : {}}>
                      {STATUS_CONFIG[st].emoji}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => saveBooks(books.filter(x => x.id !== b.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Add books to start your reading challenge!</p>
          </div>
        )}
      </div>
    </div>
  )
}
