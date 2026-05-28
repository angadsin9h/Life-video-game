import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { BookOpen, Plus, Star, Trash2, X, Search, Edit3, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ReadingNote {
  id: number
  book_title: string
  author: string | null
  highlight: string
  note: string | null
  chapter: string | null
  page_number: number | null
  type: string
  tags: string | null
  starred: number
  created_at: string
}

interface BookSummary {
  book_title: string
  author: string | null
  note_count: number
}

const NOTE_TYPES = [
  { id: 'highlight', label: 'Highlight', emoji: '✨' },
  { id: 'quote', label: 'Quote', emoji: '💬' },
  { id: 'idea', label: 'Idea', emoji: '💡' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'action', label: 'Action', emoji: '🎯' },
]

const TYPE_COLORS: Record<string, string> = {
  highlight: 'border-l-yellow-500 bg-yellow-900/5',
  quote: 'border-l-violet-500 bg-violet-900/5',
  idea: 'border-l-green-500 bg-green-900/5',
  question: 'border-l-blue-500 bg-blue-900/5',
  action: 'border-l-orange-500 bg-orange-900/5',
}

export default function ReadingNotes() {
  const { toastSuccess } = useToast()
  const [notes, setNotes] = useState<ReadingNote[]>([])
  const [books, setBooks] = useState<BookSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [showStarred, setShowStarred] = useState(false)
  const [form, setForm] = useState({
    book_title: '', author: '', highlight: '', note: '',
    chapter: '', page_number: '', type: 'highlight',
  })
  const [saving, setSaving] = useState(false)
  const [editNote, setEditNote] = useState<{ id: number; text: string } | null>(null)

  const load = useCallback(async () => {
    const params: any = {}
    if (selectedBook) params.book = selectedBook
    if (showStarred) params.starred = '1'
    const [notesRes, booksRes] = await Promise.all([
      axios.get<ReadingNote[]>('/api/reading-notes', { params }),
      axios.get<BookSummary[]>('/api/reading-notes/books'),
    ])
    setNotes(notesRes.data)
    setBooks(booksRes.data)
  }, [selectedBook, showStarred])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const addNote = async () => {
    if (!form.book_title.trim() || !form.highlight.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/reading-notes', {
        ...form,
        page_number: form.page_number ? parseInt(form.page_number) : null,
      })
      setForm({ book_title: '', author: '', highlight: '', note: '', chapter: '', page_number: '', type: 'highlight' })
      setShowAdd(false)
      await load()
      toastSuccess('Note saved!')
    } finally { setSaving(false) }
  }

  const toggleStar = async (note: ReadingNote) => {
    await axios.patch(`/api/reading-notes/${note.id}`, { starred: !note.starred })
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, starred: n.starred ? 0 : 1 } : n))
  }

  const saveNoteText = async () => {
    if (!editNote) return
    await axios.patch(`/api/reading-notes/${editNote.id}`, { note: editNote.text })
    setNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, note: editNote.text } : n))
    setEditNote(null)
    toastSuccess('Note updated!')
  }

  const deleteNote = async (id: number) => {
    await axios.delete(`/api/reading-notes/${id}`)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const filtered = notes.filter(n => {
    if (search) {
      const s = search.toLowerCase()
      return n.highlight.toLowerCase().includes(s) || n.book_title.toLowerCase().includes(s) || (n.note || '').toLowerCase().includes(s)
    }
    return true
  })

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-amber-400" />
            Reading Notes
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {notes.length} notes · {books.length} books
          </p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showAdd ? 'bg-slate-700 text-slate-300' : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}>
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <div className="flex gap-2">
            <input autoFocus placeholder="Book title…" value={form.book_title}
              onChange={e => setForm(f => ({ ...f, book_title: e.target.value }))}
              list="book-list" className="game-input flex-1 font-semibold" />
            <input placeholder="Author…" value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              className="game-input w-32 text-sm" />
            <datalist id="book-list">
              {books.map(b => <option key={b.book_title} value={b.book_title} />)}
            </datalist>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {NOTE_TYPES.map(t => (
              <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  form.type === t.id ? 'bg-amber-600/30 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                }`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <textarea rows={3} placeholder="Highlight or quote…" value={form.highlight}
            onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <textarea rows={2} placeholder="Your thoughts on this…" value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <div className="flex gap-2">
            <input placeholder="Chapter…" value={form.chapter}
              onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))}
              className="game-input flex-1 text-sm" />
            <input placeholder="Page" type="number" value={form.page_number}
              onChange={e => setForm(f => ({ ...f, page_number: e.target.value }))}
              className="game-input w-20 text-sm" />
          </div>
          <button onClick={addNote} disabled={saving || !form.book_title.trim() || !form.highlight.trim()}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 relative min-w-40">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)}
            className="game-input w-full pl-8 text-sm" />
        </div>
        <button onClick={() => setShowStarred(s => !s)}
          className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            showStarred ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}>
          <Star className="w-3.5 h-3.5" /> Starred
        </button>
      </div>

      {/* Book filter */}
      {books.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setSelectedBook(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              !selectedBook ? 'bg-amber-600/30 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
            }`}>
            All books
          </button>
          {books.map(b => (
            <button key={b.book_title} onClick={() => setSelectedBook(b.book_title === selectedBook ? null : b.book_title)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedBook === b.book_title ? 'bg-amber-600/30 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
              }`}>
              {b.book_title} <span className="opacity-60">({b.note_count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map(n => {
          const typeInfo = NOTE_TYPES.find(t => t.id === n.type) || NOTE_TYPES[0]
          const cc = TYPE_COLORS[n.type] || TYPE_COLORS.highlight
          return (
            <div key={n.id} className={`game-card p-4 border-l-4 ${cc}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-amber-400">{n.book_title}</span>
                    {n.author && <span className="text-xs text-slate-600">by {n.author}</span>}
                    <span className="text-xs text-slate-600">{typeInfo.emoji} {typeInfo.label}</span>
                    {n.page_number && <span className="text-xs text-slate-600">p.{n.page_number}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleStar(n)}
                    className={`p-1 transition-colors ${n.starred ? 'text-yellow-400' : 'text-slate-700 hover:text-yellow-400'}`}>
                    <Star className="w-3.5 h-3.5" fill={n.starred ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => deleteNote(n.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <blockquote className="text-slate-200 text-sm leading-relaxed border-l-2 border-slate-600 pl-3 italic">
                "{n.highlight}"
              </blockquote>
              {editNote?.id === n.id ? (
                <div className="mt-2 flex gap-2">
                  <textarea value={editNote.text} onChange={e => setEditNote({ ...editNote, text: e.target.value })}
                    rows={2} className="game-input flex-1 text-sm resize-none" autoFocus />
                  <div className="flex flex-col gap-1">
                    <button onClick={saveNoteText} className="p-1.5 text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditNote(null)} className="p-1.5 text-slate-600 hover:text-slate-400"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-start gap-2">
                  {n.note ? (
                    <p className="text-xs text-slate-400 flex-1">💭 {n.note}</p>
                  ) : (
                    <span className="text-xs text-slate-700 flex-1">No note added</span>
                  )}
                  <button onClick={() => setEditNote({ id: n.id, text: n.note || '' })}
                    className="text-slate-700 hover:text-slate-400 transition-colors flex-shrink-0">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )
        }) : (
          <div className="text-center py-16 text-slate-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No notes match your search' : 'No reading notes yet'}</p>
            <p className="text-xs mt-1">Capture highlights and ideas as you read</p>
          </div>
        )}
      </div>
    </div>
  )
}
