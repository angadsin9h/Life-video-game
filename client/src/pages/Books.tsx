import { useEffect, useState } from 'react'
import axios from 'axios'
import { BookOpen, Plus, Star, ChevronDown, ChevronUp, Trash2, Edit3, Check, X } from 'lucide-react'

interface Book {
  id: number
  title: string
  author: string
  genre: string
  total_pages: number
  current_page: number
  status: 'want-to-read' | 'reading' | 'completed'
  rating: number
  notes: string
  started_at: string | null
  finished_at: string | null
  created_at: string
}

interface Stats {
  total: number
  completed: number
  reading: number
  totalPages: number
  avgRating: number
}

const GENRES = ['non-fiction', 'self-help', 'biography', 'science', 'business', 'philosophy', 'fiction', 'technical', 'history', 'other']
const STATUS_LABELS = { 'want-to-read': '📚 Want to Read', 'reading': '📖 Reading', 'completed': '✅ Completed' }
const STATUS_COLORS = {
  'want-to-read': 'text-slate-400 border-slate-600 bg-slate-800',
  'reading': 'text-cyan-400 border-cyan-500/30 bg-cyan-900/10',
  'completed': 'text-green-400 border-green-500/30 bg-green-900/10',
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onChange?.(value === i ? 0 : i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`w-4 h-4 ${i <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | Book['status']>('all')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingProgress, setEditingProgress] = useState<number | null>(null)
  const [progressVal, setProgressVal] = useState('')
  const [form, setForm] = useState({ title: '', author: '', genre: 'non-fiction', total_pages: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const [booksRes, statsRes] = await Promise.all([
      axios.get<Book[]>('/api/books'),
      axios.get<Stats>('/api/books/stats/summary'),
    ])
    setBooks(booksRes.data)
    setStats(statsRes.data)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const addBook = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await axios.post('/api/books', {
        title: form.title,
        author: form.author,
        genre: form.genre,
        total_pages: parseInt(form.total_pages) || 0,
      })
      setForm({ title: '', author: '', genre: 'non-fiction', total_pages: '' })
      setShowForm(false)
      await load()
    } finally { setSubmitting(false) }
  }

  const updateStatus = async (book: Book, status: Book['status']) => {
    await axios.patch(`/api/books/${book.id}`, { status })
    await load()
  }

  const updateRating = async (book: Book, rating: number) => {
    await axios.patch(`/api/books/${book.id}`, { rating })
    await load()
  }

  const saveProgress = async (book: Book) => {
    const pg = parseInt(progressVal)
    if (isNaN(pg)) { setEditingProgress(null); return }
    const newPage = Math.max(0, Math.min(pg, book.total_pages || pg))
    const status = newPage >= (book.total_pages || 1) ? 'completed' : 'reading'
    await axios.patch(`/api/books/${book.id}`, { current_page: newPage, status })
    setEditingProgress(null)
    await load()
  }

  const deleteBook = async (id: number) => {
    await axios.delete(`/api/books/${id}`)
    setBooks(prev => prev.filter(b => b.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const filtered = statusFilter === 'all' ? books : books.filter(b => b.status === statusFilter)

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-8 h-8 text-cyan-400" />
            Books
          </h1>
          <p className="text-slate-400 mt-1">Track your reading journey</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="game-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Completed', value: stats.completed, color: 'text-green-400' },
            { label: 'Reading', value: stats.reading, color: 'text-cyan-400' },
            { label: 'Pages Read', value: stats.totalPages.toLocaleString(), color: 'text-violet-400' },
            { label: 'Avg Rating', value: stats.avgRating > 0 ? `${stats.avgRating}★` : '—', color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="game-card p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-3 border border-violet-500/30">
          <h3 className="font-semibold text-slate-200">Add a Book</h3>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addBook()}
            placeholder="Book title *"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              placeholder="Author"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <input
              type="number"
              value={form.total_pages}
              onChange={e => setForm(f => ({ ...f, total_pages: e.target.value }))}
              placeholder="Pages"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <select
            value={form.genre}
            onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          >
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={addBook} disabled={submitting || !form.title.trim()} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors">
              {submitting ? 'Adding…' : 'Add Book'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'reading', 'want-to-read', 'completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              statusFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            {s === 'all' ? `All (${books.length})` : `${STATUS_LABELS[s]} (${books.filter(b => b.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Books list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{statusFilter === 'all' ? 'No books yet. Add your first!' : 'No books with this status.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(book => {
            const pct = book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0
            const isExpanded = expandedId === book.id
            return (
              <div key={book.id} className={`game-card border transition-all ${STATUS_COLORS[book.status]}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-200 leading-tight">{book.title}</div>
                      {book.author && <div className="text-xs text-slate-500 mt-0.5">{book.author}</div>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{book.genre}</span>
                        <span className={`text-xs font-medium ${
                          book.status === 'completed' ? 'text-green-400' : book.status === 'reading' ? 'text-cyan-400' : 'text-slate-500'
                        }`}>{STATUS_LABELS[book.status]}</span>
                        {book.status === 'completed' && book.rating > 0 && (
                          <StarRating value={book.rating} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : book.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteBook(book.id)} className="p-1.5 text-slate-700 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {book.total_pages > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        {editingProgress === book.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={progressVal}
                              onChange={e => setProgressVal(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveProgress(book); if (e.key === 'Escape') setEditingProgress(null) }}
                              autoFocus
                              className="w-20 bg-slate-700 border border-violet-500 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
                              placeholder={String(book.current_page)}
                            />
                            <span className="text-xs text-slate-500">/ {book.total_pages}</span>
                            <button onClick={() => saveProgress(book)} className="text-green-400"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingProgress(null)} className="text-slate-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingProgress(book.id); setProgressVal(String(book.current_page)) }}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>p.{book.current_page} / {book.total_pages}</span>
                          </button>
                        )}
                        <span className={`text-xs font-bold ml-auto ${pct >= 80 ? 'text-green-400' : 'text-slate-500'}`}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: book.status === 'completed' ? '#22c55e' : '#06b6d4',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                    {/* Status change buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {(['want-to-read', 'reading', 'completed'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(book, s)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            book.status === s ? 'bg-violet-600/30 border-violet-500 text-violet-300' : 'border-slate-700 text-slate-500 hover:border-slate-500'
                          }`}
                        >
                          {s.replace('-', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Rating for completed books */}
                    {book.status === 'completed' && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Your rating:</span>
                        <StarRating value={book.rating} onChange={r => updateRating(book, r)} />
                        {book.rating > 0 && <span className="text-xs text-slate-500">{book.rating}/5</span>}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex gap-4 text-xs text-slate-500">
                      {book.started_at && <span>Started: {new Date(book.started_at).toLocaleDateString()}</span>}
                      {book.finished_at && <span>Finished: {new Date(book.finished_at).toLocaleDateString()}</span>}
                      {book.started_at && book.finished_at && (
                        <span>{Math.round((new Date(book.finished_at).getTime() - new Date(book.started_at).getTime()) / 86400000)}d to finish</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
