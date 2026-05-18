import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AdventureType = 'hike' | 'road-trip' | 'camping' | 'urban' | 'water' | 'winter' | 'sky' | 'cultural' | 'food' | 'spontaneous' | 'challenge' | 'other'

interface Adventure {
  id: string
  title: string
  type: AdventureType
  location: string
  companions: string
  description: string
  highlights: string
  challenges: string
  wouldReturn: boolean
  rating: number
  photos: string
  date: string
  duration: string
  createdAt: string
}

const TYPE_CONFIG: Record<AdventureType, { label: string; emoji: string; color: string }> = {
  hike:        { label: 'Hiking',       emoji: '🥾', color: '#22c55e' },
  'road-trip': { label: 'Road Trip',   emoji: '🚗', color: '#f59e0b' },
  camping:     { label: 'Camping',      emoji: '⛺', color: '#84cc16' },
  urban:       { label: 'Urban Explore',emoji: '🏙️', color: '#3b82f6' },
  water:       { label: 'Water',        emoji: '🌊', color: '#0ea5e9' },
  winter:      { label: 'Winter',       emoji: '❄️', color: '#6366f1' },
  sky:         { label: 'Sky',          emoji: '🪂', color: '#a855f7' },
  cultural:    { label: 'Cultural',     emoji: '🏛️', color: '#f97316' },
  food:        { label: 'Food Hunt',    emoji: '🍜', color: '#ec4899' },
  spontaneous: { label: 'Spontaneous',  emoji: '⚡', color: '#ef4444' },
  challenge:   { label: 'Challenge',    emoji: '🏔️', color: '#dc2626' },
  other:       { label: 'Other',        emoji: '🌟', color: '#94a3b8' },
}

const STORAGE_KEY = 'adventure_log'

export default function AdventureLog() {
  const { toastSuccess } = useToast()
  const [adventures, setAdventures] = useState<Adventure[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<Adventure, 'id' | 'createdAt'>>({
    title: '', type: 'hike', location: '', companions: '', description: '',
    highlights: '', challenges: '', wouldReturn: true, rating: 4,
    photos: '', date: new Date().toISOString().split('T')[0], duration: '',
  })

  useEffect(() => {
    try { setAdventures(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Adventure[]) => { setAdventures(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const a: Adventure = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([a, ...adventures])
    setForm(f => ({ ...f, title: '', location: '', companions: '', description: '', highlights: '', challenges: '', photos: '', duration: '' }))
    setShowForm(false)
    toastSuccess('Adventure logged! 🗺️')
  }

  const filtered = adventures.filter(a => filterType === 'all' || a.type === filterType)
  const wouldReturn = adventures.filter(a => a.wouldReturn).length
  const avgRating = adventures.length > 0 ? Math.round(adventures.reduce((s, a) => s + a.rating, 0) / adventures.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <MapPin className="w-7 h-7 text-green-400" />
            Adventure Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Chronicle your adventures and explorations.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{adventures.length}</div>
          <div className="text-xs text-slate-500">Adventures</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgRating}</div>
          <div className="text-xs text-slate-500">Avg Rating</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{wouldReturn}</div>
          <div className="text-xs text-slate-500">Would Return</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [AdventureType, typeof TYPE_CONFIG.hike][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Adventure</h3>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Adventure title *" className="game-input flex-1" autoFocus />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AdventureType }))} className="game-input text-sm">
              {(Object.entries(TYPE_CONFIG) as [AdventureType, typeof TYPE_CONFIG.hike][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Location" className="game-input flex-1 text-sm" />
            <input value={form.companions} onChange={e => setForm(f => ({ ...f, companions: e.target.value }))}
              placeholder="With who?" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="Duration" className="game-input flex-1 text-sm" />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What happened? Tell the story..." className="game-input w-full h-16 resize-none text-sm" />
          <input value={form.highlights} onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))}
            placeholder="Highlights / best moments..." className="game-input w-full text-sm" />
          <input value={form.challenges} onChange={e => setForm(f => ({ ...f, challenges: e.target.value }))}
            placeholder="Challenges faced..." className="game-input w-full text-sm" />
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Rating: {form.rating}/5</p>
              <input type="range" min={1} max={5} value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.wouldReturn} onChange={e => setForm(f => ({ ...f, wouldReturn: e.target.checked }))} />
              Would return
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(a => {
          const t = TYPE_CONFIG[a.type]
          const isExp = expanded === a.id
          return (
            <div key={a.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : a.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{a.title}</span>
                    {a.wouldReturn && <span className="text-xs text-green-500">↩️</span>}
                  </div>
                  <p className="text-xs text-slate-500">{t.label}{a.location && ` · ${a.location}`} · {'★'.repeat(a.rating)}{'☆'.repeat(5 - a.rating)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {a.description && <p className="text-xs text-slate-300">{a.description}</p>}
                  {a.highlights && <p className="text-xs text-yellow-300">⭐ {a.highlights}</p>}
                  {a.challenges && <p className="text-xs text-red-300">⚡ {a.challenges}</p>}
                  {a.companions && <p className="text-xs text-blue-300">👥 {a.companions}</p>}
                  {a.duration && <p className="text-xs text-slate-400">⏱️ {a.duration}</p>}
                  <button onClick={() => save(adventures.filter(x => x.id !== a.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Life is an adventure. Start logging your stories.</p>
          </div>
        )}
      </div>
    </div>
  )
}
