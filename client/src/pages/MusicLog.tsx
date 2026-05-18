import { useState, useEffect } from 'react'
import { Headphones, Plus, Trash2, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MusicType = 'song' | 'album' | 'artist' | 'playlist' | 'concert'
type MusicMood = 'energizing' | 'relaxing' | 'emotional' | 'focus' | 'happy' | 'melancholy' | 'nostalgic'

interface MusicEntry {
  id: string
  type: MusicType
  title: string
  artist: string
  genre: string
  mood: MusicMood
  rating: number
  note: string
  dateDiscovered: string
  isFavorite: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<MusicType, { label: string; emoji: string; color: string }> = {
  song:     { label: 'Song',     emoji: '🎵', color: '#f59e0b' },
  album:    { label: 'Album',    emoji: '💿', color: '#6366f1' },
  artist:   { label: 'Artist',  emoji: '🎤', color: '#ec4899' },
  playlist: { label: 'Playlist',emoji: '🎧', color: '#22c55e' },
  concert:  { label: 'Concert', emoji: '🎸', color: '#f97316' },
}

const MOOD_CONFIG: Record<MusicMood, { label: string; color: string }> = {
  energizing: { label: 'Energizing', color: '#f97316' },
  relaxing:   { label: 'Relaxing',   color: '#3b82f6' },
  emotional:  { label: 'Emotional',  color: '#ec4899' },
  focus:      { label: 'Focus',      color: '#6366f1' },
  happy:      { label: 'Happy',      color: '#f59e0b' },
  melancholy: { label: 'Melancholy', color: '#94a3b8' },
  nostalgic:  { label: 'Nostalgic',  color: '#a855f7' },
}

const STORAGE_KEY = 'music_log'

export default function MusicLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MusicEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<MusicEntry, 'id' | 'createdAt'>>({
    type: 'song', title: '', artist: '', genre: '', mood: 'happy',
    rating: 4, note: '', dateDiscovered: new Date().toISOString().split('T')[0], isFavorite: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MusicEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: MusicEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ type: 'song', title: '', artist: '', genre: '', mood: 'happy', rating: 4, note: '', dateDiscovered: new Date().toISOString().split('T')[0], isFavorite: false })
    setShowForm(false)
    toastSuccess('Music logged 🎵')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const favorites = entries.filter(e => e.isFavorite).length
  const avgRating = entries.length ? Math.round(entries.reduce((s, e) => s + e.rating, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Headphones className="w-7 h-7 text-yellow-400" />
            Music Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track music that moves your soul.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgRating}/5</div>
          <div className="text-xs text-slate-500">Avg Rating</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Music</h3>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(TYPE_CONFIG) as [MusicType, typeof TYPE_CONFIG.song][]).map(([k, t]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                className={`px-2.5 py-1 rounded-xl text-xs ${form.type === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.type === k ? { background: t.color + '30', color: t.color } : {}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <input value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
              placeholder="Artist" className="game-input flex-1 text-sm" />
            <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
              placeholder="Genre" className="game-input flex-1 text-sm" />
          </div>
          <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value as MusicMood }))} className="game-input text-sm w-full">
            {(Object.entries(MOOD_CONFIG) as [MusicMood, typeof MOOD_CONFIG.happy][]).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Rating:</span>
            {[1, 2, 3, 4, 5].map(r => (
              <button key={r} onClick={() => setForm(f => ({ ...f, rating: r }))}
                className={`text-lg ${r <= form.rating ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
            ))}
          </div>
          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Why this music matters..." className="game-input w-full h-12 resize-none text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} className="accent-yellow-400" />
            Favorite
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const m = MOOD_CONFIG[e.mood]
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{e.isFavorite ? '⭐' : t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-white text-sm truncate">{e.title}</span>
                  <span className="text-xs text-yellow-400 flex-shrink-0">{'★'.repeat(e.rating)}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{e.artist && `${e.artist} · `}{m.label}</p>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Headphones className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log music that inspires, moves, and defines you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
