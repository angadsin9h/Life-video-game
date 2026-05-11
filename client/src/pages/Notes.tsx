import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, Pin, Edit3, Check, X, FileText, Search, Tag } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Note {
  id: number
  content: string
  tags: string
  pinned: number
  color: string
  created_at: string
  updated_at: string
}

const COLORS = [
  { id: 'slate',  bg: 'bg-slate-800',  border: 'border-slate-600',  label: 'Default' },
  { id: 'violet', bg: 'bg-violet-900', border: 'border-violet-600', label: 'Purple'  },
  { id: 'cyan',   bg: 'bg-cyan-900',   border: 'border-cyan-600',   label: 'Cyan'    },
  { id: 'green',  bg: 'bg-green-900',  border: 'border-green-600',  label: 'Green'   },
  { id: 'orange', bg: 'bg-orange-900', border: 'border-orange-600', label: 'Orange'  },
  { id: 'red',    bg: 'bg-red-900',    border: 'border-red-600',    label: 'Red'     },
]

const COLOR_MAP: Record<string, { bg: string; border: string }> = Object.fromEntries(
  COLORS.map(c => [c.id, { bg: c.bg, border: c.border }])
)

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
  onPin,
}: {
  note: Note
  onUpdate: (id: number, updates: Partial<Note>) => void
  onDelete: (id: number) => void
  onPin: (id: number, pinned: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.content)
  const [draftTags, setDraftTags] = useState(note.tags)
  const [selectedColor, setSelectedColor] = useState(note.color)

  const save = () => {
    if (!draft.trim()) return
    onUpdate(note.id, { content: draft, tags: draftTags, color: selectedColor })
    setEditing(false)
  }

  const cancel = () => {
    setDraft(note.content)
    setDraftTags(note.tags)
    setSelectedColor(note.color)
    setEditing(false)
  }

  const colors = COLOR_MAP[note.color] ?? COLOR_MAP.slate
  const tags = note.tags ? note.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className={`rounded-xl border p-4 ${colors.bg} ${colors.border} transition-all hover:border-opacity-80 relative group`}>
      {note.pinned ? (
        <div className="absolute top-2 right-2 text-violet-400">
          <Pin className="w-3.5 h-3.5 rotate-45" />
        </div>
      ) : null}

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-slate-600 text-slate-200 text-sm resize-none focus:outline-none focus:border-violet-500 min-h-[80px]"
            autoFocus
          />
          <input
            type="text"
            value={draftTags}
            onChange={e => setDraftTags(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-400 border-0 border-b border-slate-700 focus:outline-none focus:border-violet-500"
            placeholder="Tags: ideas, work, health (comma-separated)"
          />
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c.id} onClick={() => setSelectedColor(c.id)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${c.bg} ${selectedColor === c.id ? 'border-white scale-125' : 'border-transparent'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-slate-700/60 text-slate-400 text-[10px] rounded-full flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-slate-600">{timeAgo(note.updated_at)}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onPin(note.id, !note.pinned)}
                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-violet-400 transition-colors" title="Pin">
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditing(true)}
                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-colors" title="Edit">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(note.id)}
                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newColor, setNewColor] = useState('slate')
  const [searchQ, setSearchQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const { toastSuccess } = useToast()

  const load = useCallback(async () => {
    const res = await axios.get<Note[]>('/api/notes')
    setNotes(res.data)
  }, [])

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)) }, [load])

  const addNote = async () => {
    if (!newContent.trim()) return
    setAdding(true)
    try {
      await axios.post('/api/notes', { content: newContent.trim(), tags: newTags, color: newColor })
      setNewContent('')
      setNewTags('')
      setNewColor('slate')
      setShowAddForm(false)
      toastSuccess('Note captured!')
      await load()
    } finally { setAdding(false) }
  }

  const updateNote = async (id: number, updates: Partial<Note>) => {
    await axios.put(`/api/notes/${id}`, updates)
    await load()
  }

  const deleteNote = async (id: number) => {
    await axios.delete(`/api/notes/${id}`)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const pinNote = async (id: number, pinned: boolean) => {
    await axios.put(`/api/notes/${id}`, { pinned })
    await load()
  }

  const filtered = notes.filter(n => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return n.content.toLowerCase().includes(q) || n.tags.toLowerCase().includes(q)
  })

  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  if (loading) return <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FileText className="w-8 h-8 text-cyan-400" />
            Notes
          </h1>
          <p className="text-slate-400 mt-1">Quick capture — ideas, thoughts, reminders</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="game-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          className="game-input w-full pl-9"
          placeholder="Search notes and tags…"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
        />
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="game-card p-4 space-y-3 border-cyan-500/30 glowing-border">
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            className="game-input w-full min-h-[100px] resize-none"
            placeholder="What's on your mind? Ideas, todos, thoughts…"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote() }}
          />
          <input
            type="text"
            className="game-input w-full text-sm"
            placeholder="Tags (comma-separated): ideas, work, health"
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Color:</span>
            {COLORS.map(c => (
              <button key={c.id} onClick={() => setNewColor(c.id)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${c.bg} ${newColor === c.id ? 'border-white scale-125' : 'border-transparent'}`}
                title={c.label}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addNote} disabled={adding || !newContent.trim()} className="game-btn-primary flex-1 text-sm">
              {adding ? 'Saving…' : '⌘↵ Save Note'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="game-btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Stats */}
      {notes.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
          <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          {pinned.length > 0 && <span>{pinned.length} pinned</span>}
          {(() => {
            const allTags = notes.flatMap(n => n.tags ? n.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
            const uniqueTags = [...new Set(allTags)]
            return uniqueTags.length > 0 ? <span>{uniqueTags.length} tag{uniqueTags.length !== 1 ? 's' : ''}</span> : null
          })()}
        </div>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Pin className="w-3 h-3" /> Pinned
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinned.map(note => (
              <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onPin={pinNote} />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Other Notes</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unpinned.map(note => (
              <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onPin={pinNote} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && notes.length > 0 && (
        <div className="text-center py-8 text-slate-500">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No notes match "<span className="text-slate-400">{searchQ}</span>"</p>
        </div>
      )}

      {notes.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <FileText className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-1">No notes yet</p>
          <p className="text-sm">Capture ideas, reminders, and thoughts as they come to you.</p>
          <button onClick={() => setShowAddForm(true)} className="game-btn-primary mt-4 text-sm">
            Create your first note
          </button>
        </div>
      )}
    </div>
  )
}
