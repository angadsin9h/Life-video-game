import { useEffect, useState } from 'react'
import { TrendingUp, Plus, Search, Tag, Trash2, BookOpen, Lightbulb, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface GrowthEntry {
  id: string
  date: string
  type: 'lesson' | 'insight' | 'win' | 'mistake' | 'idea' | 'quote'
  title: string
  content: string
  source: string
  tags: string[]
  starred: boolean
}

const ENTRY_TYPES = [
  { value: 'lesson', label: 'Lesson', emoji: '📘', color: '#3b82f6' },
  { value: 'insight', label: 'Insight', emoji: '💡', color: '#eab308' },
  { value: 'win', label: 'Win', emoji: '🏆', color: '#22c55e' },
  { value: 'mistake', label: 'Mistake', emoji: '🔥', color: '#ef4444' },
  { value: 'idea', label: 'Idea', emoji: '⚡', color: '#8b5cf6' },
  { value: 'quote', label: 'Quote', emoji: '💬', color: '#14b8a6' },
] as const

type EntryType = typeof ENTRY_TYPES[number]['value']

const STORAGE_KEY = 'growth_log'

export default function GrowthLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GrowthEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<EntryType | 'all' | 'starred'>('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<{ type: EntryType; title: string; content: string; source: string; tags: string }>({
    type: 'lesson', title: '', content: '', source: '', tags: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  const persist = (updated: GrowthEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addEntry = () => {
    if (!form.title.trim() && !form.content.trim()) return
    const entry: GrowthEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: form.type,
      title: form.title,
      content: form.content,
      source: form.source,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      starred: false,
    }
    persist([entry, ...entries])
    setForm({ type: 'lesson', title: '', content: '', source: '', tags: '' })
    setShowForm(false)
    toastSuccess('Growth entry added!')
  }

  const toggleStar = (id: string) => persist(entries.map(e => e.id === id ? { ...e, starred: !e.starred } : e))
  const deleteEntry = (id: string) => persist(entries.filter(e => e.id !== id))

  const filtered = entries.filter(e => {
    if (filter === 'starred') return e.starred
    if (filter !== 'all' && e.type !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q))
    }
    return true
  })

  const countByType = (type: EntryType) => entries.filter(e => e.type === type).length

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Growth Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture lessons, insights, wins, and ideas</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Type stats */}
      <div className="flex gap-2 flex-wrap">
        {ENTRY_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilter(filter === t.value ? 'all' : t.value as EntryType)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={filter === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#64748b' }}>
            {t.emoji} {t.label} <span className="opacity-60">({countByType(t.value)})</span>
          </button>
        ))}
        <button onClick={() => setFilter('starred')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === 'starred' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500' : 'bg-slate-800 text-slate-500'}`}>
          ⭐ Starred ({entries.filter(e => e.starred).length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search entries..." className="game-input w-full pl-9" />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-green-500/20">
          <h3 className="font-semibold text-slate-300">New Growth Entry</h3>
          <div className="flex gap-2 flex-wrap">
            {ENTRY_TYPES.map(t => (
              <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.type === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)" className="game-input w-full" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write the lesson, insight, or idea in detail..." className="game-input w-full h-24 resize-none" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Source (book, person, experience...)" className="game-input w-full" />
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="Tags (comma separated)" className="game-input w-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={addEntry} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save Entry
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-3">
        {filtered.map(e => {
          const t = ENTRY_TYPES.find(et => et.value === e.type)
          return (
            <div key={e.id} className="game-card p-4 space-y-2" style={{ borderLeft: `3px solid ${t?.color || '#64748b'}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t?.emoji}</span>
                  <div>
                    {e.title && <div className="font-semibold text-white text-sm">{e.title}</div>}
                    <div className="text-xs text-slate-500">{e.date}{e.source && ` · ${e.source}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleStar(e.id)} className={`p-1 transition-colors ${e.starred ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`}>
                    ⭐
                  </button>
                  <button onClick={() => deleteEntry(e.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {e.content && <p className="text-sm text-slate-300 leading-relaxed">{e.content}</p>}
              {e.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {e.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-0.5 text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          {search ? <p>No entries match "{search}"</p> : (
            <>
              <p className="mb-2">No growth entries yet.</p>
              <p className="text-sm mb-5">Every lesson learned, every insight gained — capture it here.</p>
              <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Add First Entry
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
