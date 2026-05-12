import { useEffect, useState } from 'react'
import { BookOpen, Plus, Trash2, ExternalLink, Search, Tag, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ContentItem {
  id: string
  title: string
  type: 'article' | 'video' | 'podcast' | 'book' | 'course' | 'tool' | 'other'
  url: string
  tags: string[]
  status: 'unread' | 'reading' | 'done' | 'saved'
  rating: number
  notes: string
  addedAt: string
  finishedAt: string
}

const CONTENT_TYPES = [
  { value: 'article', label: 'Article', emoji: '📄', color: '#3b82f6' },
  { value: 'video', label: 'Video', emoji: '🎬', color: '#ef4444' },
  { value: 'podcast', label: 'Podcast', emoji: '🎙️', color: '#8b5cf6' },
  { value: 'book', label: 'Book', emoji: '📚', color: '#f97316' },
  { value: 'course', label: 'Course', emoji: '🎓', color: '#22c55e' },
  { value: 'tool', label: 'Tool', emoji: '🔧', color: '#eab308' },
  { value: 'other', label: 'Other', emoji: '📦', color: '#64748b' },
]

const STATUS_CONFIG = {
  unread: { label: 'To Read', color: '#64748b', bg: '#1e293b' },
  saved: { label: 'Saved', color: '#3b82f6', bg: '#1e3a5f33' },
  reading: { label: 'In Progress', color: '#eab308', bg: '#78350f33' },
  done: { label: 'Done', color: '#22c55e', bg: '#14532d33' },
}

const STORAGE_KEY = 'content_library'

export default function ContentLibrary() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<ContentItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [form, setForm] = useState({ title: '', type: 'article' as ContentItem['type'], url: '', tags: '', notes: '' })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setItems(JSON.parse(saved))
  }, [])

  const persist = (updated: ContentItem[]) => {
    setItems(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addItem = () => {
    if (!form.title.trim()) return
    const item: ContentItem = {
      id: Date.now().toString(),
      title: form.title,
      type: form.type,
      url: form.url,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      status: 'unread',
      rating: 0,
      notes: form.notes,
      addedAt: new Date().toISOString().split('T')[0],
      finishedAt: '',
    }
    persist([item, ...items])
    setForm({ title: '', type: 'article', url: '', tags: '', notes: '' })
    setShowForm(false)
    toastSuccess('Added to library!')
  }

  const updateStatus = (id: string, status: ContentItem['status']) => {
    persist(items.map(i => i.id === id ? { ...i, status, finishedAt: status === 'done' ? new Date().toISOString().split('T')[0] : i.finishedAt } : i))
  }

  const updateRating = (id: string, rating: number) => {
    persist(items.map(i => i.id === id ? { ...i, rating } : i))
  }

  const deleteItem = (id: string) => persist(items.filter(i => i.id !== id))

  const filtered = items.filter(i => {
    if (filterType !== 'all' && i.type !== filterType) return false
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return i.title.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q)) || i.notes.toLowerCase().includes(q)
    }
    return true
  })

  const byType = Object.fromEntries(CONTENT_TYPES.map(t => [t.value, items.filter(i => i.type === t.value).length]))
  const doneCount = items.filter(i => i.status === 'done').length
  const avgRating = items.filter(i => i.rating > 0).length > 0
    ? +(items.filter(i => i.rating > 0).reduce((s, i) => s + i.rating, 0) / items.filter(i => i.rating > 0).length).toFixed(1)
    : 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-blue-400" />
            Content Library
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Save articles, videos, books, and resources</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{items.length}</div>
          <div className="text-xs text-slate-500">Saved</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{doneCount}</div>
          <div className="text-xs text-slate-500">Consumed</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{items.filter(i => i.status === 'reading').length}</div>
          <div className="text-xs text-slate-500">In Progress</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{avgRating > 0 ? `${avgRating}★` : '—'}</div>
          <div className="text-xs text-slate-500">Avg Rating</div>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterType === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All ({items.length})
        </button>
        {CONTENT_TYPES.map(t => byType[t.value] > 0 && (
          <button key={t.value} onClick={() => setFilterType(filterType === t.value ? 'all' : t.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={filterType === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#64748b' }}>
            {t.emoji} {t.label} ({byType[t.value]})
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="game-input w-full pl-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="game-input text-sm">
          <option value="all">All Status</option>
          <option value="unread">To Read</option>
          <option value="saved">Saved</option>
          <option value="reading">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <h3 className="font-semibold text-slate-300">Add to Library</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title" className="game-input w-full" autoFocus />
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map(t => (
              <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value as ContentItem['type'] }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.type === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="URL (optional)" className="game-input w-full" />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (comma separated)" className="game-input w-full" />
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Why save this? What do you want to learn?" className="game-input w-full h-16 resize-none" />
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save to Library
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-3">
        {filtered.map(item => {
          const typeConfig = CONTENT_TYPES.find(t => t.value === item.type)
          const statusConfig = STATUS_CONFIG[item.status]
          return (
            <div key={item.id} className="game-card p-4" style={{ borderLeft: `3px solid ${typeConfig?.color || '#64748b'}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-lg">{typeConfig?.emoji}</span>
                    <span className="font-semibold text-white text-sm">{item.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {item.notes && <p className="text-xs text-slate-500 mb-1">{item.notes}</p>}
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map(t => (
                      <span key={t} className="flex items-center gap-0.5 text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-500 hover:text-blue-400 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => deleteItem(item.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <select value={item.status} onChange={e => updateStatus(item.id, e.target.value as ContentItem['status'])}
                  className="text-xs bg-slate-800 text-slate-400 border border-slate-700 rounded-lg px-2 py-1">
                  <option value="unread">To Read</option>
                  <option value="saved">Saved</option>
                  <option value="reading">In Progress</option>
                  <option value="done">Done</option>
                </select>
                {item.status === 'done' && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => updateRating(item.id, star)}>
                        <Star className={`w-4 h-4 ${star <= item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-xs text-slate-600 ml-auto">{item.addedAt}</span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          {search ? <p>No items match "{search}"</p> : (
            <>
              <p className="mb-4">Your library is empty.</p>
              <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Add First Item
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
