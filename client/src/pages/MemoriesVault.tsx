import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MemoryCategory = 'family' | 'friendship' | 'romance' | 'achievement' | 'travel' | 'milestone' | 'funny' | 'inspiring' | 'childhood' | 'other'
type MemoryEmotion = 'joy' | 'love' | 'pride' | 'nostalgia' | 'gratitude' | 'awe' | 'excitement'

interface Memory {
  id: string
  date: string
  title: string
  category: MemoryCategory
  story: string
  people: string
  place: string
  emotions: MemoryEmotion[]
  significance: number
  isFavorite: boolean
  createdAt: string
}

const CAT_CONFIG: Record<MemoryCategory, { label: string; emoji: string; color: string }> = {
  family:      { label: 'Family',      emoji: '👨‍👩‍👧', color: '#f59e0b' },
  friendship:  { label: 'Friendship',  emoji: '👫', color: '#3b82f6' },
  romance:     { label: 'Romance',     emoji: '💕', color: '#ec4899' },
  achievement: { label: 'Achievement', emoji: '🏆', color: '#22c55e' },
  travel:      { label: 'Travel',      emoji: '✈️', color: '#0ea5e9' },
  milestone:   { label: 'Milestone',   emoji: '🎯', color: '#6366f1' },
  funny:       { label: 'Funny',       emoji: '😂', color: '#f97316' },
  inspiring:   { label: 'Inspiring',   emoji: '⚡', color: '#a855f7' },
  childhood:   { label: 'Childhood',   emoji: '🧒', color: '#84cc16' },
  other:       { label: 'Other',       emoji: '💫', color: '#94a3b8' },
}

const EMOTION_CONFIG: Record<MemoryEmotion, { label: string; color: string }> = {
  joy:       { label: 'Joy',       color: '#f59e0b' },
  love:      { label: 'Love',      color: '#ec4899' },
  pride:     { label: 'Pride',     color: '#6366f1' },
  nostalgia: { label: 'Nostalgia', color: '#a855f7' },
  gratitude: { label: 'Gratitude', color: '#22c55e' },
  awe:       { label: 'Awe',       color: '#0ea5e9' },
  excitement:{ label: 'Excitement',color: '#f97316' },
}

const STORAGE_KEY = 'memories_vault'

export default function MemoriesVault() {
  const { toastSuccess } = useToast()
  const [memories, setMemories] = useState<Memory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterFav, setFilterFav] = useState(false)
  const [form, setForm] = useState<Omit<Memory, 'id' | 'createdAt'>>({
    date: '', title: '', category: 'family', story: '', people: '',
    place: '', emotions: [], significance: 8, isFavorite: false,
  })

  useEffect(() => {
    try { setMemories(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Memory[]) => { setMemories(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const toggleEmotion = (em: MemoryEmotion) => {
    setForm(f => ({
      ...f, emotions: f.emotions.includes(em) ? f.emotions.filter(e => e !== em) : [...f.emotions, em],
    }))
  }

  const submit = () => {
    if (!form.title.trim() || !form.story.trim()) return
    const m: Memory = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...memories])
    setForm({ date: '', title: '', category: 'family', story: '', people: '', place: '', emotions: [], significance: 8, isFavorite: false })
    setShowForm(false)
    toastSuccess('Memory preserved forever ✨')
  }

  const favorites = memories.filter(m => m.isFavorite).length
  const filtered = memories.filter(m => {
    if (filterCat !== 'all' && m.category !== filterCat) return false
    if (filterFav && !m.isFavorite) return false
    return true
  })

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Memories Vault
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Preserve your most precious memories forever.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{memories.length}</div>
          <div className="text-xs text-slate-500">Memories</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{memories.filter(m => m.significance >= 9).length}</div>
          <div className="text-xs text-slate-500">Core</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' && !filterFav ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}
          onClickCapture={() => setFilterFav(false)}>
          All
        </button>
        <button onClick={() => { setFilterFav(!filterFav); setFilterCat('all') }}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterFav ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          ★ Faves
        </button>
        {[...new Set(memories.map(m => m.category))].map(cat => {
          const c = CAT_CONFIG[cat as MemoryCategory]
          return (
            <button key={cat} onClick={() => { setFilterCat(cat); setFilterFav(false) }}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === cat ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterCat === cat ? { background: c.color + '30', color: c.color } : {}}>
              {c.emoji}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Preserve Memory</h3>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Memory title *" className="game-input flex-1" autoFocus />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MemoryCategory }))} className="game-input text-sm w-full">
            {(Object.entries(CAT_CONFIG) as [MemoryCategory, typeof CAT_CONFIG.family][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <textarea value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
            placeholder="Tell the story... make it vivid *" className="game-input w-full h-24 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.people} onChange={e => setForm(f => ({ ...f, people: e.target.value }))}
              placeholder="Who was there?" className="game-input flex-1 text-sm" />
            <input value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))}
              placeholder="Where?" className="game-input flex-1 text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Emotions felt:</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(EMOTION_CONFIG) as [MemoryEmotion, typeof EMOTION_CONFIG.joy][]).map(([k, em]) => (
                <button key={k} onClick={() => toggleEmotion(k)}
                  className={`px-2.5 py-1 rounded-full text-xs ${form.emotions.includes(k) ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={form.emotions.includes(k) ? { background: em.color + '30', color: em.color } : {}}>
                  {em.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-32">Significance: {form.significance}/10</span>
            <input type="range" min={1} max={10} value={form.significance}
              onChange={e => setForm(f => ({ ...f, significance: Number(e.target.value) }))}
              className="flex-1 h-1 accent-yellow-400" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} className="accent-yellow-400" />
            Add to favorites
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Preserve</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(m => {
          const c = CAT_CONFIG[m.category]
          const isExp = expanded === m.id
          return (
            <div key={m.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : m.id)}>
                <span className="text-2xl">{m.isFavorite ? '⭐' : c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{m.title}</span>
                    <span className="text-xs text-slate-500">{m.significance}/10</span>
                  </div>
                  <p className="text-xs text-slate-500">{m.date || 'Date unknown'}{m.place && ` · ${m.place}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-sm text-slate-300 leading-relaxed">{m.story}</p>
                  {m.people && <p className="text-xs text-slate-500">👥 {m.people}</p>}
                  {m.emotions.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {m.emotions.map(em => (
                        <span key={em} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: EMOTION_CONFIG[em].color + '20', color: EMOTION_CONFIG[em].color }}>
                          {EMOTION_CONFIG[em].label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => save(memories.map(x => x.id === m.id ? { ...x, isFavorite: !x.isFavorite } : x))}
                      className="text-xs text-yellow-600 hover:text-yellow-400">
                      {m.isFavorite ? '★ Unfavorite' : '☆ Favorite'}
                    </button>
                    <button onClick={() => save(memories.filter(x => x.id !== m.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Preserve the moments that make life beautiful.</p>
          </div>
        )}
      </div>
    </div>
  )
}
