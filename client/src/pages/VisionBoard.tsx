import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Edit3, Check, X } from 'lucide-react'

interface VisionItem {
  id: string
  area: string
  title: string
  description: string
  affirmation: string
  emoji: string
  color: string
  achieved: boolean
  createdAt: string
}

const LIFE_AREAS = [
  { key: 'health',    label: 'Health & Fitness',   emoji: '💪', color: '#22c55e' },
  { key: 'career',    label: 'Career & Finance',   emoji: '💼', color: '#3b82f6' },
  { key: 'love',      label: 'Love & Family',      emoji: '❤️', color: '#ec4899' },
  { key: 'growth',    label: 'Learning & Growth',  emoji: '🧠', color: '#8b5cf6' },
  { key: 'adventure', label: 'Adventure & Travel', emoji: '✈️', color: '#f97316' },
  { key: 'creative',  label: 'Creative & Hobbies', emoji: '🎨', color: '#f59e0b' },
  { key: 'spirit',    label: 'Mindfulness & Soul', emoji: '🌟', color: '#14b8a6' },
  { key: 'home',      label: 'Home & Environment', emoji: '🏡', color: '#84cc16' },
]

const STORAGE_KEY = 'vision_board_items'

function loadItems(): VisionItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function persist(items: VisionItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function VisionBoard() {
  const [items, setItems] = useState<VisionItem[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ area: 'health', title: '', description: '', affirmation: '', emoji: '⭐' })

  useEffect(() => { setItems(loadItems()) }, [])

  const add = () => {
    if (!form.title.trim()) return
    const area = LIFE_AREAS.find(a => a.key === form.area)
    const newItem: VisionItem = {
      id: Date.now().toString(),
      area: form.area,
      title: form.title,
      description: form.description,
      affirmation: form.affirmation,
      emoji: form.emoji || area?.emoji || '⭐',
      color: area?.color || '#8b5cf6',
      achieved: false,
      createdAt: new Date().toISOString().split('T')[0],
    }
    const updated = [...items, newItem]
    setItems(updated)
    persist(updated)
    setForm({ area: 'health', title: '', description: '', affirmation: '', emoji: '⭐' })
    setShowAdd(false)
  }

  const toggleAchieved = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, achieved: !i.achieved } : i)
    setItems(updated)
    persist(updated)
  }

  const remove = (id: string) => {
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    persist(updated)
  }

  const displayItems = selectedArea ? items.filter(i => i.area === selectedArea) : items
  const achievedCount = items.filter(i => i.achieved).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Vision Board
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Visualize the life you're building</p>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <div className="text-sm text-slate-400">
              <span className="text-yellow-400 font-bold">{achievedCount}</span>/{items.length} achieved
            </div>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Add Vision
          </button>
        </div>
      </div>

      {/* Area filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedArea(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!selectedArea ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
          All Areas
        </button>
        {LIFE_AREAS.map(a => {
          const count = items.filter(i => i.area === a.key).length
          if (count === 0) return null
          return (
            <button key={a.key} onClick={() => setSelectedArea(selectedArea === a.key ? null : a.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={selectedArea === a.key
                ? { background: a.color + '33', color: a.color, border: `1px solid ${a.color}` }
                : { background: '#1e293b', color: '#94a3b8' }
              }>
              {a.emoji} {a.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="game-card p-5 border border-yellow-500/20 space-y-4">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> New Vision
          </h3>
          <div className="flex flex-wrap gap-2">
            {LIFE_AREAS.map(a => (
              <button key={a.key} onClick={() => setForm(f => ({ ...f, area: a.key, emoji: a.emoji }))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={form.area === a.key
                  ? { background: a.color + '33', color: a.color, border: `1px solid ${a.color}` }
                  : { background: '#1e293b', color: '#94a3b8' }
                }>
                {a.emoji} {a.label}
              </button>
            ))}
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What do you want to achieve? (e.g. Run a marathon)"
            className="game-input w-full" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what this looks and feels like when achieved..."
            className="game-input w-full h-20 resize-none" />
          <input value={form.affirmation} onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))}
            placeholder="Affirmation: I am, I have, I do... (e.g. I am a strong, healthy runner)"
            className="game-input w-full" />
          <div className="flex gap-2">
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              placeholder="emoji" className="game-input w-20 text-center text-lg" maxLength={2} />
            <button onClick={add} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Add to Board
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Vision grid */}
      {displayItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map(item => {
            const area = LIFE_AREAS.find(a => a.key === item.area)
            return (
              <div key={item.id}
                className={`game-card p-5 relative group transition-all ${item.achieved ? 'opacity-70' : ''}`}
                style={{ borderLeft: `4px solid ${item.color}` }}>
                {/* Achieved overlay */}
                {item.achieved && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-green-900/20">
                    <span className="text-green-400 text-4xl font-bold rotate-[-15deg] opacity-60">ACHIEVED</span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{item.emoji}</div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleAchieved(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${item.achieved ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-500 hover:text-green-400'}`}>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(item.id)} className="p-1.5 bg-slate-700 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: item.color }}>
                  {area?.label}
                </div>
                <h3 className="font-bold text-white mb-2 leading-snug">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-3">{item.description}</p>
                )}
                {item.affirmation && (
                  <div className="mt-auto p-2.5 rounded-lg border italic text-xs" style={{ background: item.color + '11', borderColor: item.color + '33', color: item.color }}>
                    "{item.affirmation}"
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg mb-2">Your vision board is empty</p>
          <p className="text-sm mb-5">What does your ideal life look like?</p>
          <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors">
            Create Your First Vision
          </button>
        </div>
      )}

      {/* Life area completions */}
      {items.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Progress by Area</h3>
          <div className="space-y-2">
            {LIFE_AREAS.filter(a => items.some(i => i.area === a.key)).map(a => {
              const areaItems = items.filter(i => i.area === a.key)
              const done = areaItems.filter(i => i.achieved).length
              const pct = areaItems.length > 0 ? (done / areaItems.length) * 100 : 0
              return (
                <div key={a.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{a.emoji} {a.label}</span>
                    <span className="text-slate-500">{done}/{areaItems.length}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: a.color }} />
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
