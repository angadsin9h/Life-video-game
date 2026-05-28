import { useState, useEffect } from 'react'
import { Star, Plus, Check, Trash2, MapPin, Filter, Edit2, X, Save, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface BucketItem {
  id: string
  title: string
  description: string
  category: string
  priority: 'dream' | 'high' | 'medium' | 'low'
  targetDate: string
  completedDate: string
  status: 'active' | 'in-progress' | 'done'
  tags: string[]
  createdAt: string
}

const CATEGORIES = [
  'Travel', 'Adventure', 'Learning', 'Career', 'Health', 'Relationships',
  'Creative', 'Personal Growth', 'Financial', 'Experiences', 'Giving Back',
]

const CATEGORY_EMOJIS: Record<string, string> = {
  'Travel': '✈️', 'Adventure': '🏔️', 'Learning': '📚', 'Career': '💼',
  'Health': '💪', 'Relationships': '❤️', 'Creative': '🎨', 'Personal Growth': '🌱',
  'Financial': '💰', 'Experiences': '🎭', 'Giving Back': '🤝',
}

const PRIORITY_COLORS: Record<string, string> = {
  dream: '#a855f7',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#64748b',
}

const STORAGE_KEY = 'bucket_list'

const DEFAULT_ITEMS: BucketItem[] = [
  { id: '1', title: 'See the Northern Lights', description: 'Watch aurora borealis in Iceland or Norway', category: 'Travel', priority: 'dream', targetDate: '', completedDate: '', status: 'active', tags: ['nature', 'beauty'], createdAt: new Date().toISOString() },
  { id: '2', title: 'Run a marathon', description: 'Train for and complete a full 26.2-mile marathon', category: 'Health', priority: 'high', targetDate: '', completedDate: '', status: 'active', tags: ['fitness', 'endurance'], createdAt: new Date().toISOString() },
  { id: '3', title: 'Learn a new language', description: 'Reach B2 level in Spanish or Japanese', category: 'Learning', priority: 'medium', targetDate: '', completedDate: '', status: 'active', tags: ['skills', 'culture'], createdAt: new Date().toISOString() },
]

export default function BucketList() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<BucketItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'in-progress' | 'done'>('all')
  const [filterCategory, setFilterCategory] = useState('All')
  const [form, setForm] = useState({
    title: '', description: '', category: 'Travel', priority: 'high' as BucketItem['priority'],
    targetDate: '', tags: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    setItems(saved ? JSON.parse(saved) : DEFAULT_ITEMS)
  }, [])

  const save = (updated: BucketItem[]) => {
    setItems(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addItem = () => {
    if (!form.title.trim()) return
    const item: BucketItem = {
      id: Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      targetDate: form.targetDate,
      completedDate: '',
      status: 'active',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    }
    save([item, ...items])
    setForm({ title: '', description: '', category: 'Travel', priority: 'high', targetDate: '', tags: '' })
    setShowForm(false)
    toastSuccess('Bucket list item added! 🌟')
  }

  const markDone = (id: string) => {
    save(items.map(it => it.id === id ? { ...it, status: 'done', completedDate: new Date().toISOString().split('T')[0] } : it))
    toastSuccess('Dream achieved! 🎉')
  }

  const toggleInProgress = (id: string) => {
    save(items.map(it => it.id === id ? { ...it, status: it.status === 'in-progress' ? 'active' : 'in-progress' } : it))
  }

  const deleteItem = (id: string) => {
    save(items.filter(it => it.id !== id))
  }

  const filtered = items.filter(it => {
    if (filterStatus !== 'all' && it.status !== filterStatus) return false
    if (filterCategory !== 'All' && it.category !== filterCategory) return false
    return true
  })

  const total = items.length
  const done = items.filter(i => i.status === 'done').length
  const inProgress = items.filter(i => i.status === 'in-progress').length
  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Bucket List
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">100 things to do before you die</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Dream
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{total}</div>
          <div className="text-xs text-slate-500">Total Dreams</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{done}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{inProgress}</div>
          <div className="text-xs text-slate-500">In Progress</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{total > 0 ? Math.round((done / total) * 100) : 0}%</div>
          <div className="text-xs text-slate-500">Complete</div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="game-card p-4">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Life Progress</span>
            <span>{done}/{total} achieved</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-300">Add Dream</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What's your dream? (e.g. Climb Kilimanjaro)" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="More details..." className="game-input w-full h-16 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="game-input w-full">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as BucketItem['priority'] }))}
                className="game-input w-full">
                <option value="dream">⭐ Dream (bucket)</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">⚫ Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Date (optional)</label>
              <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="nature, travel, solo" className="game-input w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Star className="w-4 h-4 inline mr-1.5" />Add to List
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'in-progress', 'done'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="h-px w-px mx-1" />
        {['All', ...categories].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterCategory === c ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
            {c !== 'All' ? CATEGORY_EMOJIS[c] + ' ' : ''}{c}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No items match your filter.</p>
          </div>
        )}
        {filtered.map(item => (
          <div key={item.id} className={`game-card p-4 transition-opacity ${item.status === 'done' ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {item.status === 'done' ? (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  </div>
                ) : (
                  <button onClick={() => markDone(item.id)}
                    className="w-6 h-6 rounded-full border-2 border-slate-600 hover:border-green-400 transition-colors" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold ${item.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
                    {item.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {CATEGORY_EMOJIS[item.category]} {item.category}
                  </span>
                  <span className="text-xs font-bold" style={{ color: PRIORITY_COLORS[item.priority] }}>
                    {item.priority === 'dream' ? '⭐ Dream' : item.priority}
                  </span>
                  {item.status === 'in-progress' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">In Progress</span>
                  )}
                </div>
                {item.description && <p className="text-sm text-slate-400 mt-1">{item.description}</p>}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {item.targetDate && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />Target: {item.targetDate}
                    </span>
                  )}
                  {item.completedDate && (
                    <span className="text-xs text-green-400">✓ Achieved {item.completedDate}</span>
                  )}
                  {item.tags.map(t => (
                    <span key={t} className="text-xs text-slate-600">#{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.status !== 'done' && (
                  <button onClick={() => toggleInProgress(item.id)}
                    className="p-1 text-slate-600 hover:text-blue-400 transition-colors text-xs"
                    title={item.status === 'in-progress' ? 'Mark active' : 'Mark in progress'}>
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => deleteItem(item.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {items.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">By Category</h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => {
              const catItems = items.filter(i => i.category === cat)
              const catDone = catItems.filter(i => i.status === 'done').length
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm">{CATEGORY_EMOJIS[cat]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-400 truncate">{cat}</span>
                      <span className="text-slate-500">{catDone}/{catItems.length}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${catItems.length > 0 ? (catDone / catItems.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
