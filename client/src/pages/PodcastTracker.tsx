import { useState, useEffect } from 'react'
import { Headphones, Plus, Trash2, Star, BookOpen, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface PodcastEpisode {
  id: string
  show: string
  episode: string
  date: string
  duration: number
  rating: number
  keyTakeaways: string
  actionItems: string
  tags: string[]
  listened: boolean
  createdAt: string
}

const TAGS = ['Business', 'Health', 'Psychology', 'Tech', 'Finance', 'Mindset', 'History', 'Science', 'Leadership', 'Creativity']
const STORAGE_KEY = 'podcast_tracker'

export default function PodcastTracker() {
  const { toastSuccess } = useToast()
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [form, setForm] = useState({
    show: '', episode: '', date: new Date().toISOString().split('T')[0],
    duration: 45, rating: 4, keyTakeaways: '', actionItems: '', tags: [] as string[], listened: true
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setEpisodes(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: PodcastEpisode[]) => {
    setEpisodes(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addEpisode = () => {
    if (!form.show.trim() || !form.episode.trim()) return
    const ep: PodcastEpisode = {
      id: Date.now().toString(),
      show: form.show.trim(),
      episode: form.episode.trim(),
      date: form.date,
      duration: form.duration,
      rating: form.rating,
      keyTakeaways: form.keyTakeaways.trim(),
      actionItems: form.actionItems.trim(),
      tags: form.tags,
      listened: form.listened,
      createdAt: new Date().toISOString(),
    }
    save([ep, ...episodes])
    setForm({ show: '', episode: '', date: new Date().toISOString().split('T')[0], duration: 45, rating: 4, keyTakeaways: '', actionItems: '', tags: [], listened: true })
    setShowForm(false)
    toastSuccess(`Logged: "${ep.episode}"`)
  }

  const toggleTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))
  }

  const uniqueShows = [...new Set(episodes.map(e => e.show))]
  const filtered = filter === 'all' ? episodes : episodes.filter(e => e.show === filter || e.tags.includes(filter))
  const totalHours = Math.round(episodes.reduce((s, e) => s + e.duration, 0) / 60)
  const avgRating = episodes.length ? (episodes.reduce((s, e) => s + e.rating, 0) / episodes.length).toFixed(1) : '—'

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Headphones className="w-7 h-7 text-indigo-400" />
            Podcast Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log episodes, capture insights, take action.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log Episode
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-indigo-400">{episodes.length}</div>
          <div className="text-xs text-slate-500">Episodes</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Listened</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{avgRating}</div>
          <div className="text-xs text-slate-500">Avg Rating</div>
        </div>
      </div>

      {/* Filter by show */}
      {uniqueShows.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            All
          </button>
          {uniqueShows.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-indigo-500/20">
          <h3 className="font-semibold text-slate-300">Log Episode</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.show} onChange={e => setForm(f => ({ ...f, show: e.target.value }))}
              placeholder="Show name..." className="game-input w-full" autoFocus />
            <input value={form.date} type="date" onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input w-full" />
          </div>
          <input value={form.episode} onChange={e => setForm(f => ({ ...f, episode: e.target.value }))}
            placeholder="Episode title..." className="game-input w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
              <input type="number" min="5" max="300" value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Rating</label>
              <div className="flex gap-1 pt-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}>
                    <Star className={`w-5 h-5 ${n <= form.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <textarea value={form.keyTakeaways} onChange={e => setForm(f => ({ ...f, keyTakeaways: e.target.value }))}
            placeholder="Key takeaways from this episode..." className="game-input w-full h-20 resize-none" />
          <input value={form.actionItems} onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))}
            placeholder="Action item from this episode..." className="game-input w-full" />
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-all ${form.tags.includes(t) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addEpisode} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold">Save Episode</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Episode list */}
      <div className="space-y-3">
        {filtered.map(ep => {
          const isExpanded = expanded === ep.id
          return (
            <div key={ep.id} className="game-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-indigo-400 font-medium">{ep.show}</span>
                    <span className="text-xs text-slate-600">{ep.date}</span>
                    <span className="text-xs text-slate-600">{ep.duration}min</span>
                  </div>
                  <div className="font-semibold text-white text-sm mt-0.5">{ep.episode}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${n <= ep.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                    ))}
                    {ep.tags.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 ml-1">{t}</span>
                    ))}
                  </div>
                  {ep.keyTakeaways && (
                    <p className={`text-xs text-slate-400 mt-1.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {ep.keyTakeaways}
                    </p>
                  )}
                  {isExpanded && ep.actionItems && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-400">{ep.actionItems}</p>
                    </div>
                  )}
                  {(ep.keyTakeaways?.length > 80 || ep.actionItems) && (
                    <button onClick={() => setExpanded(isExpanded ? null : ep.id)}
                      className="text-xs text-slate-600 hover:text-slate-400 mt-1 flex items-center gap-0.5">
                      {isExpanded ? <><ChevronUp className="w-3 h-3" /> less</> : <><ChevronDown className="w-3 h-3" /> more</>}
                    </button>
                  )}
                </div>
                <button onClick={() => save(episodes.filter(e => e.id !== ep.id))} className="p-1 text-slate-700 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {episodes.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No podcast episodes logged yet.</p>
          <p className="text-sm">Track what you learn from podcasts and turn insights into action.</p>
        </div>
      )}
    </div>
  )
}
