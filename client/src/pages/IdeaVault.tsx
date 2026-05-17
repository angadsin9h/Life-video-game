import { useState, useMemo } from 'react'
import { Lightbulb, Plus, Trash2, Edit2, Search, Copy, Tag, Flag, Check, X, Save } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type IdeaCategory = 'Business' | 'Creative' | 'Personal' | 'Technical' | 'Learning' | 'Random'
type IdeaPriority = 'Low' | 'Medium' | 'High'
type IdeaStatus = 'Raw' | 'Developing' | 'Done'

interface Idea {
  id: string
  text: string
  category: IdeaCategory
  tags: string[]
  priority: IdeaPriority
  status: IdeaStatus
  createdAt: string
}

const STORAGE_KEY = 'idea_vault'

const CATEGORIES: IdeaCategory[] = ['Business', 'Creative', 'Personal', 'Technical', 'Learning', 'Random']

const CATEGORY_COLORS: Record<IdeaCategory, string> = {
  Business:  'text-blue-400 bg-blue-900/30 border-blue-500/40',
  Creative:  'text-pink-400 bg-pink-900/30 border-pink-500/40',
  Personal:  'text-green-400 bg-green-900/30 border-green-500/40',
  Technical: 'text-cyan-400 bg-cyan-900/30 border-cyan-500/40',
  Learning:  'text-yellow-400 bg-yellow-900/30 border-yellow-500/40',
  Random:    'text-slate-400 bg-slate-700/50 border-slate-500/40',
}

const PRIORITY_COLORS: Record<IdeaPriority, string> = {
  Low:    'text-slate-400',
  Medium: 'text-yellow-400',
  High:   'text-red-400',
}

const PRIORITY_DOT: Record<IdeaPriority, string> = {
  Low:    'bg-slate-500',
  Medium: 'bg-yellow-500',
  High:   'bg-red-500',
}

const STATUS_NEXT: Record<IdeaStatus, IdeaStatus> = {
  Raw:        'Developing',
  Developing: 'Done',
  Done:       'Raw',
}

const STATUS_STYLE: Record<IdeaStatus, string> = {
  Raw:        'text-slate-400 bg-slate-700/60 border-slate-600/50',
  Developing: 'text-violet-400 bg-violet-900/30 border-violet-500/40',
  Done:       'text-green-400 bg-green-900/30 border-green-500/40',
}

function load(): Idea[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function save(ideas: Idea[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return d >= startOfWeek
}

interface IdeaCardProps {
  idea: Idea
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Idea>) => void
}

function IdeaCard({ idea, onDelete, onUpdate }: IdeaCardProps) {
  const { toastSuccess } = useToast()
  const [editing, setEditing] = useState(false)
  const [draftText, setDraftText] = useState(idea.text)
  const [draftCategory, setDraftCategory] = useState<IdeaCategory>(idea.category)
  const [draftTags, setDraftTags] = useState(idea.tags.join(', '))
  const [draftPriority, setDraftPriority] = useState<IdeaPriority>(idea.priority)

  const handleSave = () => {
    if (!draftText.trim()) return
    const parsedTags = draftTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    onUpdate(idea.id, {
      text: draftText.trim(),
      category: draftCategory,
      tags: parsedTags,
      priority: draftPriority,
    })
    setEditing(false)
    toastSuccess('Idea updated!')
  }

  const handleCancel = () => {
    setDraftText(idea.text)
    setDraftCategory(idea.category)
    setDraftTags(idea.tags.join(', '))
    setDraftPriority(idea.priority)
    setEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(idea.text).then(() => {
      toastSuccess('Copied to clipboard!')
    }).catch(() => {
      toastSuccess('Copied!')
    })
  }

  const handleStatusCycle = () => {
    onUpdate(idea.id, { status: STATUS_NEXT[idea.status] })
  }

  return (
    <div className="game-card p-4 flex flex-col gap-3 group transition-all hover:border-slate-600">
      {editing ? (
        <div className="space-y-3">
          <textarea
            className="game-input w-full min-h-[80px] resize-none text-sm"
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 flex-wrap">
            <select
              className="game-input text-xs flex-1"
              value={draftCategory}
              onChange={e => setDraftCategory(e.target.value as IdeaCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="game-input text-xs w-28"
              value={draftPriority}
              onChange={e => setDraftPriority(e.target.value as IdeaPriority)}
            >
              {(['Low', 'Medium', 'High'] as IdeaPriority[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <input
            className="game-input w-full text-xs"
            placeholder="Tags (comma-separated)"
            value={draftTags}
            onChange={e => setDraftTags(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!draftText.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[idea.category]}`}>
                {idea.category}
              </span>
              <button
                onClick={handleStatusCycle}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${STATUS_STYLE[idea.status]}`}
                title="Click to advance status"
              >
                {idea.status}
              </button>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditing(true)}
                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(idea.id)}
                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Idea text */}
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{idea.text}</p>

          {/* Tags */}
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {idea.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/60 text-slate-400 text-[10px] rounded-full"
                >
                  <Tag className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`flex items-center gap-1 font-medium ${PRIORITY_COLORS[idea.priority]}`}>
                <Flag className="w-2.5 h-2.5" />
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${PRIORITY_DOT[idea.priority]}`} />
                {idea.priority}
              </span>
            </div>
            <span className="text-[10px] text-slate-600">{formatDate(idea.createdAt)}</span>
          </div>
        </>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  text: '',
  category: 'Random' as IdeaCategory,
  tags: '',
  priority: 'Medium' as IdeaPriority,
}

export default function IdeaVault() {
  const { toastSuccess } = useToast()
  const [ideas, setIdeas] = useState<Idea[]>(load)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [searchQ, setSearchQ] = useState('')
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | 'All'>('All')
  const [filterPriority, setFilterPriority] = useState<IdeaPriority | 'All'>('All')

  const persist = (updated: Idea[]) => {
    setIdeas(updated)
    save(updated)
  }

  const handleAdd = () => {
    if (!form.text.trim()) return
    const parsedTags = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    const newIdea: Idea = {
      id: uid(),
      text: form.text.trim(),
      category: form.category,
      tags: parsedTags,
      priority: form.priority,
      status: 'Raw',
      createdAt: new Date().toISOString(),
    }
    const updated = [newIdea, ...ideas]
    persist(updated)
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Idea captured!', form.category)
  }

  const handleDelete = (id: string) => {
    persist(ideas.filter(i => i.id !== id))
    toastSuccess('Idea removed')
  }

  const handleUpdate = (id: string, updates: Partial<Idea>) => {
    persist(ideas.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const filtered = useMemo(() => {
    return ideas
      .filter(idea => {
        if (filterCategory !== 'All' && idea.category !== filterCategory) return false
        if (filterPriority !== 'All' && idea.priority !== filterPriority) return false
        if (searchQ) {
          const q = searchQ.toLowerCase()
          const inText = idea.text.toLowerCase().includes(q)
          const inTags = idea.tags.some(t => t.toLowerCase().includes(q))
          const inCat  = idea.category.toLowerCase().includes(q)
          if (!inText && !inTags && !inCat) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [ideas, filterCategory, filterPriority, searchQ])

  // Stats
  const thisWeekCount = ideas.filter(i => isThisWeek(i.createdAt)).length
  const categoryCounts = CATEGORIES.reduce<Record<IdeaCategory, number>>((acc, cat) => {
    acc[cat] = ideas.filter(i => i.category === cat).length
    return acc
  }, {} as Record<IdeaCategory, number>)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Idea Vault
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture every spark — your second brain</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showForm
              ? 'bg-slate-700 text-slate-300 border border-slate-600'
              : 'bg-yellow-600 hover:bg-yellow-500 text-white border border-yellow-500'
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Capture Idea'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {ideas.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Total Ideas</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {thisWeekCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">This Week</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {ideas.filter(i => i.status === 'Developing').length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Developing</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {ideas.filter(i => i.status === 'Done').length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Done</div>
        </div>
      </div>

      {/* Category breakdown */}
      {ideas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter(c => categoryCounts[c] > 0).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? 'All' : cat)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterCategory === cat
                  ? CATEGORY_COLORS[cat]
                  : 'text-slate-500 border-slate-700 hover:border-slate-500'
              }`}
            >
              {cat}
              <span className="font-bold">{categoryCounts[cat]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick-capture form */}
      {showForm && (
        <div className="game-card p-4 space-y-3 border-yellow-500/20 glowing-border-gold">
          <textarea
            autoFocus
            rows={3}
            className="game-input w-full resize-none text-sm"
            placeholder="What's the idea? Describe it freely…"
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd()
            }}
          />
          <div className="flex gap-2 flex-wrap">
            <select
              className="game-input text-sm flex-1"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as IdeaCategory }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="game-input text-sm w-32"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as IdeaPriority }))}
            >
              {(['Low', 'Medium', 'High'] as IdeaPriority[]).map(p => (
                <option key={p} value={p}>{p} Priority</option>
              ))}
            </select>
          </div>
          <input
            className="game-input w-full text-sm"
            placeholder="Tags (comma-separated): startup, design, mvp"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.text.trim()}
              className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" /> Capture Idea
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl border border-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            className="game-input w-full pl-9 text-sm"
            placeholder="Search ideas, tags, categories…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
        <select
          className="game-input text-sm"
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as IdeaPriority | 'All')}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        {(filterCategory !== 'All' || filterPriority !== 'All' || searchQ) && (
          <button
            onClick={() => { setFilterCategory('All'); setFilterPriority('All'); setSearchQ('') }}
            className="flex items-center gap-1 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {ideas.length > 0 && (
        <div className="text-xs text-slate-500 px-1">
          {filtered.length === ideas.length
            ? `${ideas.length} idea${ideas.length !== 1 ? 's' : ''}`
            : `${filtered.length} of ${ideas.length} ideas`}
        </div>
      )}

      {/* Ideas grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Lightbulb className="w-14 h-14 mx-auto mb-4 opacity-20 text-yellow-400" />
          <p className="text-lg font-medium text-slate-400 mb-1">No ideas yet</p>
          <p className="text-sm mb-4">Start capturing ideas — even half-baked ones count.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-xl transition-colors"
          >
            Capture your first idea
          </button>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No ideas match your filters.</p>
          <button
            onClick={() => { setFilterCategory('All'); setFilterPriority('All'); setSearchQ('') }}
            className="mt-2 text-xs text-violet-400 hover:text-violet-300 underline transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
