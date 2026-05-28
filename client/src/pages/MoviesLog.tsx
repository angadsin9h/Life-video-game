import { useState, useEffect } from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MediaType = 'movie' | 'series' | 'documentary' | 'short' | 'anime'
type WatchStatus = 'watched' | 'watching' | 'want-to-watch' | 'dropped'

interface MediaEntry {
  id: string
  type: MediaType
  title: string
  genre: string
  year: string
  status: WatchStatus
  rating: number
  review: string
  dateWatched: string
  isFavorite: boolean
  recommendedBy: string
  createdAt: string
}

const TYPE_CONFIG: Record<MediaType, { label: string; emoji: string; color: string }> = {
  movie:       { label: 'Movie',       emoji: '🎬', color: '#f59e0b' },
  series:      { label: 'Series',      emoji: '📺', color: '#6366f1' },
  documentary: { label: 'Documentary', emoji: '🎥', color: '#22c55e' },
  short:       { label: 'Short Film',  emoji: '🎞️', color: '#3b82f6' },
  anime:       { label: 'Anime',       emoji: '⛩️', color: '#ec4899' },
}

const STATUS_CONFIG: Record<WatchStatus, { label: string; color: string }> = {
  'watched':       { label: 'Watched',      color: '#22c55e' },
  'watching':      { label: 'Watching',     color: '#3b82f6' },
  'want-to-watch': { label: 'Want to Watch',color: '#a855f7' },
  'dropped':       { label: 'Dropped',      color: '#94a3b8' },
}

const STORAGE_KEY = 'movies_log'

export default function MoviesLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MediaEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [form, setForm] = useState<Omit<MediaEntry, 'id' | 'createdAt'>>({
    type: 'movie', title: '', genre: '', year: '', status: 'watched',
    rating: 0, review: '', dateWatched: new Date().toISOString().split('T')[0],
    isFavorite: false, recommendedBy: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MediaEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: MediaEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ type: 'movie', title: '', genre: '', year: '', status: 'watched', rating: 0, review: '', dateWatched: new Date().toISOString().split('T')[0], isFavorite: false, recommendedBy: '' })
    setShowForm(false)
    toastSuccess('Added to watch log 🎬')
  }

  const filtered = entries.filter(e => filterStatus === 'all' || e.status === filterStatus)
  const watched = entries.filter(e => e.status === 'watched').length
  const favorites = entries.filter(e => e.isFavorite).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Eye className="w-7 h-7 text-blue-400" />
            Movies & Shows
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track everything you watch and want to watch.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{watched}</div>
          <div className="text-xs text-slate-500">Watched</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(STATUS_CONFIG) as [WatchStatus, typeof STATUS_CONFIG.watched][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilterStatus(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterStatus === k ? { background: s.color + '30', color: s.color } : {}}>
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Entry</h3>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(TYPE_CONFIG) as [MediaType, typeof TYPE_CONFIG.movie][]).map(([k, t]) => (
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
            <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
              placeholder="Genre" className="game-input flex-1 text-sm" />
            <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              placeholder="Year" className="game-input w-20 text-sm" />
          </div>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as WatchStatus }))} className="game-input text-sm w-full">
            {(Object.entries(STATUS_CONFIG) as [WatchStatus, typeof STATUS_CONFIG.watched][]).map(([k, s]) => (
              <option key={k} value={k}>{s.label}</option>
            ))}
          </select>
          {(form.status === 'watched' || form.status === 'dropped') && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Rating:</span>
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setForm(f => ({ ...f, rating: r }))}
                  className={`text-lg ${r <= form.rating ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
              ))}
            </div>
          )}
          <textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))}
            placeholder="Your review / thoughts..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.recommendedBy} onChange={e => setForm(f => ({ ...f, recommendedBy: e.target.value }))}
              placeholder="Recommended by..." className="game-input flex-1 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} className="accent-blue-400" />
            All-time favorite
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{e.isFavorite ? '⭐' : t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm truncate">{e.title}</span>
                  {e.rating > 0 && <span className="text-xs text-yellow-400 flex-shrink-0">{'★'.repeat(e.rating)}</span>}
                </div>
                <p className="text-xs text-slate-500">{t.label}{e.genre && ` · ${e.genre}`}{e.year && ` · ${e.year}`}</p>
                {e.review && <p className="text-xs text-slate-600 truncate italic">"{e.review}"</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Build your personal movie & show library.</p>
          </div>
        )}
      </div>
    </div>
  )
}
