import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, Star, RefreshCw, Heart, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface JarEntry {
  id: string
  text: string
  category: string
  date: string
  starred: boolean
}

const CATEGORIES = [
  { name: 'People', color: '#ec4899', emoji: '👥' },
  { name: 'Experiences', color: '#f97316', emoji: '🌟' },
  { name: 'Growth', color: '#a855f7', emoji: '🌱' },
  { name: 'Simple Things', color: '#22c55e', emoji: '☀️' },
  { name: 'Health', color: '#10b981', emoji: '💪' },
  { name: 'Work', color: '#3b82f6', emoji: '💼' },
  { name: 'Random', color: '#f59e0b', emoji: '✨' },
]

const PROMPTS = [
  'What made you smile today?',
  'Who helped you recently?',
  'What ability are you grateful for?',
  'What simple pleasure did you enjoy?',
  'What challenge taught you something?',
  'What moment felt magical?',
  'What do you take for granted that others don\'t have?',
  'What beauty did you notice today?',
]

const STORAGE_KEY = 'gratitude_jar'

export default function GratitudeJar() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [entries, setEntries] = useState<JarEntry[]>([])
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Simple Things')
  const [filter, setFilter] = useState('all')
  const [prompt, setPrompt] = useState('')
  const [viewMode, setViewMode] = useState<'jar' | 'list'>('jar')
  const [showStarred, setShowStarred] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setEntries(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  }, [])

  const save = (updated: JarEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addEntry = () => {
    if (!text.trim()) return
    const entry: JarEntry = {
      id: Date.now().toString(),
      text: text.trim(),
      category,
      date: today,
      starred: false,
    }
    save([entry, ...entries])
    setText('')
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
    toastSuccess('Dropped into your gratitude jar 💛')
  }

  const toggleStar = (id: string) => {
    save(entries.map(e => e.id === id ? { ...e, starred: !e.starred } : e))
  }

  const del = (id: string) => save(entries.filter(e => e.id !== id))

  const randomEntry = () => {
    if (entries.length === 0) return
    const r = entries[Math.floor(Math.random() * entries.length)]
    setPrompt(`💛 "${r.text}"`)
  }

  const displayed = showStarred
    ? entries.filter(e => e.starred)
    : filter === 'all' ? entries : entries.filter(e => e.category === filter)

  const todayCount = entries.filter(e => e.date === today).length
  const streak = (() => {
    let s = 0
    const d = new Date(today)
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (!entries.some(e => e.date === ds)) break
      s++
      d.setDate(d.getDate() - 1)
    }
    return s
  })()

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Gratitude Jar
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Drop in gratitude. Pull out joy.</p>
        </div>
        <button onClick={randomEntry} title="Random gratitude"
          className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-yellow-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-pink-400">{todayCount}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
      </div>

      {/* Prompt */}
      <div className="game-card p-4 border border-yellow-500/20">
        <p className="text-sm text-yellow-300 italic mb-3">"{prompt}"</p>
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry()}
            placeholder="What are you grateful for right now?"
            className="game-input flex-1" autoFocus />
          <button onClick={addEntry} className="p-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {CATEGORIES.map(c => (
            <button key={c.name} onClick={() => setCategory(c.name)}
              className={`px-2 py-0.5 rounded-full text-xs transition-all ${category === c.name ? 'text-white' : 'text-slate-500 bg-slate-800'}`}
              style={category === c.name ? { background: c.color + '40', color: c.color, border: `1px solid ${c.color}60` } : {}}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter + view toggle */}
      {entries.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowStarred(s => !s)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${showStarred ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Star className="w-3 h-3" /> Starred ({entries.filter(e => e.starred).length})
          </button>
          {!showStarred && (
            <>
              <button onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                All
              </button>
              {CATEGORIES.filter(c => entries.some(e => e.category === c.name)).map(c => (
                <button key={c.name} onClick={() => setFilter(c.name)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === c.name ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={filter === c.name ? { background: c.color + '30', color: c.color } : {}}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </>
          )}
          <div className="ml-auto flex gap-1">
            <button onClick={() => setViewMode('jar')}
              className={`px-2 py-1 rounded text-xs ${viewMode === 'jar' ? 'bg-yellow-600 text-white' : 'text-slate-500'}`}>
              Jar
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-xs ${viewMode === 'list' ? 'bg-yellow-600 text-white' : 'text-slate-500'}`}>
              List
            </button>
          </div>
        </div>
      )}

      {/* Entries */}
      {viewMode === 'jar' ? (
        <div className="columns-2 gap-3 space-y-3">
          {displayed.map(e => {
            const cat = CATEGORIES.find(c => c.name === e.category) || CATEGORIES[0]
            return (
              <div key={e.id} className="break-inside-avoid game-card p-3 mb-3 group relative"
                style={{ borderLeft: `3px solid ${cat.color}` }}>
                <span className="text-xs mb-1 block" style={{ color: cat.color }}>{cat.emoji} {e.category}</span>
                <p className="text-sm text-white leading-relaxed">{e.text}</p>
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleStar(e.id)}>
                    <Star className={`w-3.5 h-3.5 ${e.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-yellow-400'}`} />
                  </button>
                  <span className="text-xs text-slate-700 flex-1">{e.date}</span>
                  <button onClick={() => del(e.id)}>
                    <X className="w-3.5 h-3.5 text-slate-700 hover:text-red-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(e => {
            const cat = CATEGORIES.find(c => c.name === e.category) || CATEGORIES[0]
            return (
              <div key={e.id} className="game-card p-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{e.text}</p>
                  <span className="text-xs text-slate-600">{e.date}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleStar(e.id)}>
                    <Star className={`w-3.5 h-3.5 ${e.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-yellow-400'}`} />
                  </button>
                  <button onClick={() => del(e.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-slate-700 hover:text-red-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Your gratitude jar is empty.</p>
          <p className="text-sm">Drop in your first note of gratitude above.</p>
        </div>
      )}
    </div>
  )
}
