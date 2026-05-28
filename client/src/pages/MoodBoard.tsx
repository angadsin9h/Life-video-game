import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Sparkles } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BoardCategory = 'vision' | 'goals' | 'values' | 'affirmations' | 'aesthetics' | 'people' | 'places' | 'feelings'

interface BoardItem {
  id: string
  category: BoardCategory
  content: string
  emoji: string
  color: string
  starred: boolean
  createdAt: string
}

const CATEGORY_CONFIG: Record<BoardCategory, { label: string; color: string; placeholder: string }> = {
  vision:       { label: 'Vision',        color: '#a855f7', placeholder: 'Where I see myself...' },
  goals:        { label: 'Goals',         color: '#22c55e', placeholder: 'What I want to achieve...' },
  values:       { label: 'Values',        color: '#f59e0b', placeholder: 'What matters most to me...' },
  affirmations: { label: 'Affirmations',  color: '#3b82f6', placeholder: 'I am, I have, I create...' },
  aesthetics:   { label: 'Aesthetics',    color: '#ec4899', placeholder: 'My style, my space, my vibe...' },
  people:       { label: 'People',        color: '#f97316', placeholder: 'People who inspire me...' },
  places:       { label: 'Places',        color: '#10b981', placeholder: 'Places I want to be or feel...' },
  feelings:     { label: 'Feelings',      color: '#6366f1', placeholder: 'How I want to feel...' },
}

const EMOJIS = ['✨', '🌟', '💫', '🎯', '🌈', '💎', '🦋', '🌸', '🔥', '⚡', '🌊', '🏔️', '🌙', '☀️', '🎨', '💜', '🌿', '🦁', '🚀', '💡']

const COLORS = ['#a855f7', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#f97316', '#10b981', '#6366f1', '#ef4444', '#94a3b8']

const STORAGE_KEY = 'mood_board'

export default function MoodBoard() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<BoardItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState<BoardCategory | 'all'>('all')
  const [form, setForm] = useState<Omit<BoardItem, 'id' | 'starred' | 'createdAt'>>({
    category: 'vision', content: '', emoji: '✨', color: '#a855f7',
  })

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BoardItem[]) => { setItems(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim()) return
    const item: BoardItem = { id: Date.now().toString(), ...form, starred: false, createdAt: new Date().toISOString() }
    save([...items, item])
    setForm(f => ({ ...f, content: '' }))
    setShowForm(false)
    toastSuccess('Added to mood board ✨')
  }

  const toggleStar = (id: string) => save(items.map(i => i.id === id ? { ...i, starred: !i.starred } : i))
  const del = (id: string) => save(items.filter(i => i.id !== id))

  const displayed = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory)
  const starred = items.filter(i => i.starred)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-purple-400" />
            Mood Board
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">A visual collage of your vision, values, and dreams.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${activeCategory === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          All ({items.length})
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [BoardCategory, typeof CATEGORY_CONFIG.vision][]).map(([k, c]) => {
          const count = items.filter(i => i.category === k).length
          return count > 0 ? (
            <button key={k} onClick={() => setActiveCategory(k)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={activeCategory === k ? { background: c.color + '30', color: c.color } : { background: '#1e293b', color: '#64748b' }}>
              {c.label} ({count})
            </button>
          ) : null
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add to Board</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.entries(CATEGORY_CONFIG) as [BoardCategory, typeof CATEGORY_CONFIG.vision][]).map(([k, c]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, category: k, color: c.color }))}
                className={`py-1.5 rounded-lg text-xs text-center transition-all ${form.category === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.category === k ? { background: c.color + '30', color: c.color } : {}}>
                {c.label}
              </button>
            ))}
          </div>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder={CATEGORY_CONFIG[form.category].placeholder}
            className="game-input w-full h-20 resize-none text-sm" autoFocus />
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Choose emoji:</p>
            <div className="flex gap-1.5 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`text-xl p-1 rounded-lg ${form.emoji === e ? 'bg-purple-700/30 ring-1 ring-purple-500' : 'bg-slate-800'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Card color:</p>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Add to Board</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Starred section */}
      {starred.length > 0 && activeCategory === 'all' && (
        <div>
          <p className="text-xs text-yellow-400 font-semibold mb-2">★ PINNED</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {starred.map(item => (
              <div key={item.id} className="relative p-4 rounded-xl overflow-hidden group"
                style={{ background: item.color + '15', border: `1px solid ${item.color}30` }}>
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-sm text-white leading-relaxed">{item.content}</p>
                <span className="text-xs mt-1 opacity-60" style={{ color: item.color }}>{CATEGORY_CONFIG[item.category].label}</span>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleStar(item.id)} className="text-yellow-400">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  </button>
                  <button onClick={() => del(item.id)} className="text-slate-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main board */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {displayed.filter(i => !i.starred || activeCategory !== 'all').map(item => (
          <div key={item.id} className="relative p-4 rounded-xl overflow-hidden group"
            style={{ background: item.color + '10', border: `1px solid ${item.color}25` }}>
            <div className="text-3xl mb-2">{item.emoji}</div>
            <p className="text-sm text-white leading-relaxed">{item.content}</p>
            <span className="text-xs mt-1 opacity-60" style={{ color: item.color }}>{CATEGORY_CONFIG[item.category].label}</span>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => toggleStar(item.id)}>
                <Star className={`w-3.5 h-3.5 ${item.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`} />
              </button>
              <button onClick={() => del(item.id)} className="text-slate-600 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {displayed.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Your mood board is empty.</p>
          <p className="text-sm">Add cards to visualize your vision and values.</p>
        </div>
      )}
    </div>
  )
}
