import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BookGenre = 'self-help' | 'biography' | 'philosophy' | 'science' | 'fiction' | 'business' | 'history' | 'psychology' | 'spirituality' | 'other'
type ReadStatus = 'want-to-read' | 'reading' | 'completed' | 'paused' | 'abandoned'

interface Book {
  id: string
  genre: BookGenre
  status: ReadStatus
  title: string
  author: string
  pages: number
  pagesRead: number
  rating: number
  keyTakeaway: string
  topQuote: string
  wouldRecommend: boolean
  startDate: string
  finishDate: string
  createdAt: string
}

const GENRE_CONFIG: Record<BookGenre, { label: string; emoji: string; color: string }> = {
  'self-help':   { label: 'Self-Help',   emoji: '⚡', color: '#f59e0b' },
  biography:     { label: 'Biography',   emoji: '👤', color: '#3b82f6' },
  philosophy:    { label: 'Philosophy',  emoji: '🏛️', color: '#6366f1' },
  science:       { label: 'Science',     emoji: '🔬', color: '#0ea5e9' },
  fiction:       { label: 'Fiction',     emoji: '📖', color: '#ec4899' },
  business:      { label: 'Business',    emoji: '💼', color: '#22c55e' },
  history:       { label: 'History',     emoji: '🏺', color: '#f97316' },
  psychology:    { label: 'Psychology',  emoji: '🧠', color: '#a855f7' },
  spirituality:  { label: 'Spirituality',emoji: '✨', color: '#84cc16' },
  other:         { label: 'Other',       emoji: '📚', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ReadStatus, { label: string; color: string }> = {
  'want-to-read': { label: 'Want to Read', color: '#94a3b8' },
  reading:        { label: 'Reading',      color: '#3b82f6' },
  completed:      { label: 'Completed ✓', color: '#22c55e' },
  paused:         { label: 'Paused',       color: '#f59e0b' },
  abandoned:      { label: 'Abandoned',    color: '#ef4444' },
}

const STORAGE_KEY = 'reading_list_v2'

export default function ReadingList() {
  const { toastSuccess } = useToast()
  const [books, setBooks] = useState<Book[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [form, setForm] = useState<Omit<Book, 'id' | 'createdAt'>>({
    genre: 'self-help', status: 'want-to-read', title: '', author: '', pages: 0,
    pagesRead: 0, rating: 0, keyTakeaway: '', topQuote: '',
    wouldRecommend: false, startDate: '', finishDate: '',
  })

  useEffect(() => {
    try { setBooks(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Book[]) => { setBooks(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const b: Book = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([b, ...books])
    setForm(f => ({ ...f, title: '', author: '', keyTakeaway: '', topQuote: '' }))
    setShowForm(false)
    toastSuccess('Book added 📚')
  }

  const filtered = books.filter(b => filterStatus === 'all' || b.status === filterStatus)
  const completed = books.filter(b => b.status === 'completed').length
  const reading = books.filter(b => b.status === 'reading').length
  const avgRating = completed > 0
    ? Math.round(books.filter(b => b.status === 'completed' && b.rating > 0).reduce((s, b) => s + b.rating, 0) / completed * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-yellow-400" />
            Reading List
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track every book, capture key insights and recommendations.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-2">
          <div className="text-lg font-bold text-white">{books.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-2">
          <div className="text-lg font-bold text-blue-400">{reading}</div>
          <div className="text-xs text-slate-500">Reading</div>
        </div>
        <div className="game-card p-2">
          <div className="text-lg font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-500">Done</div>
        </div>
        <div className="game-card p-2">
          <div className="text-lg font-bold text-yellow-400">{avgRating || '-'}</div>
          <div className="text-xs text-slate-500">Avg ★</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(STATUS_CONFIG) as [ReadStatus, typeof STATUS_CONFIG.reading][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilterStatus(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterStatus === k ? { background: s.color + '30', color: s.color } : {}}>
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Book</h3>
          <div className="flex gap-2">
            <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value as BookGenre }))} className="game-input text-sm flex-1">
              {(Object.entries(GENRE_CONFIG) as [BookGenre, typeof GENRE_CONFIG.fiction][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ReadStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ReadStatus, typeof STATUS_CONFIG.reading][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Book title *" className="game-input w-full" autoFocus />
          <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            placeholder="Author" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Pages</p>
              <input type="number" value={form.pages} min={0}
                onChange={e => setForm(f => ({ ...f, pages: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Pages Read</p>
              <input type="number" value={form.pagesRead} min={0}
                onChange={e => setForm(f => ({ ...f, pagesRead: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Rating</p>
              <input type="number" value={form.rating} min={0} max={10} step={0.5}
                onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <textarea value={form.keyTakeaway} onChange={e => setForm(f => ({ ...f, keyTakeaway: e.target.value }))}
            placeholder="Key takeaway / lesson from this book" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.topQuote} onChange={e => setForm(f => ({ ...f, topQuote: e.target.value }))}
            placeholder="Top quote from this book" className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-3 items-center">
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="game-input text-xs flex-1" />
            <input type="date" value={form.finishDate} onChange={e => setForm(f => ({ ...f, finishDate: e.target.value }))}
              className="game-input text-xs flex-1" />
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.wouldRecommend} onChange={e => setForm(f => ({ ...f, wouldRecommend: e.target.checked }))} />
              Recommend
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(b => {
          const g = GENRE_CONFIG[b.genre]
          const s = STATUS_CONFIG[b.status]
          const pct = b.pages > 0 ? Math.round((b.pagesRead / b.pages) * 100) : 0
          return (
            <div key={b.id} className="game-card p-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{g.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{b.title}</span>
                    {b.rating > 0 && <span className="text-xs text-yellow-400">★{b.rating}</span>}
                    {b.wouldRecommend && <span className="text-xs text-green-400">👍</span>}
                  </div>
                  {b.author && <p className="text-xs text-slate-500">{b.author} · {g.label}</p>}
                  {b.pages > 0 && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-700 rounded-full">
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                      <span className="text-xs text-slate-600">{pct}%</span>
                    </div>
                  )}
                  {b.keyTakeaway && <p className="text-xs text-blue-300 mt-0.5 italic">💡 {b.keyTakeaway}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <select value={b.status} onChange={ev => save(books.map(x => x.id === b.id ? { ...x, status: ev.target.value as ReadStatus } : x))}
                    className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                    {(Object.entries(STATUS_CONFIG) as [ReadStatus, typeof STATUS_CONFIG.reading][]).map(([k, st]) => (
                      <option key={k} value={k}>{st.label}</option>
                    ))}
                  </select>
                  <button onClick={() => save(books.filter(x => x.id !== b.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Leaders are readers. What will you read next?</p>
          </div>
        )}
      </div>
    </div>
  )
}
