import { useState, useEffect } from 'react'
import { Trophy, Plus, Star, Target, Flame, Search, Calendar, Users, CheckCircle2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface WinEntry {
  id: string
  title: string
  category: string
  size: string
  story: string
  whoHelped: string
  whatItTook: string
  date: string
  emotionFelt: string
}

const CATEGORIES = ['Health', 'Mind', 'Relationships', 'Career', 'Finances', 'Personal', 'Creative', 'Spiritual', 'Social']
const SIZES = ['Micro Win', 'Small Win', 'Big Win', 'Life-Changing']
const SIZE_LABELS: Record<string, string> = {
  'Micro Win': 'Micro Win 🔹',
  'Small Win': 'Small Win ⭐',
  'Big Win': 'Big Win 🏆',
  'Life-Changing': 'Life-Changing 🚀',
}
const EMOTIONS = ['Proud', 'Grateful', 'Relieved', 'Excited', 'Inspired', 'Peaceful', 'Joyful', 'Confident', 'Amazed']

const CATEGORY_COLORS: Record<string, string> = {
  Health: 'border-red-500/40 bg-red-500/10',
  Mind: 'border-violet-500/40 bg-violet-500/10',
  Relationships: 'border-pink-500/40 bg-pink-500/10',
  Career: 'border-amber-500/40 bg-amber-500/10',
  Finances: 'border-emerald-500/40 bg-emerald-500/10',
  Personal: 'border-blue-500/40 bg-blue-500/10',
  Creative: 'border-orange-500/40 bg-orange-500/10',
  Spiritual: 'border-indigo-500/40 bg-indigo-500/10',
  Social: 'border-teal-500/40 bg-teal-500/10',
}

const SIZE_BADGE: Record<string, string> = {
  'Micro Win': 'bg-slate-600 text-slate-200',
  'Small Win': 'bg-amber-500/20 text-amber-300',
  'Big Win': 'bg-violet-500/20 text-violet-300',
  'Life-Changing': 'bg-green-500/20 text-green-300',
}

const STORAGE_KEY = 'win_board_log'

const defaultForm = {
  title: '',
  category: 'Personal',
  size: 'Small Win',
  story: '',
  whoHelped: '',
  whatItTook: '',
  date: new Date().toISOString().split('T')[0],
  emotionFelt: 'Proud',
}

export default function WinBoard() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WinEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [sizeFilter, setSizeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setEntries(JSON.parse(saved))
    } catch {}
  }, [])

  const persist = (updated: WinEntry[]) => {
    setEntries(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    const entry: WinEntry = { ...form, id: Date.now().toString() }
    persist([entry, ...entries])
    setForm({ ...defaultForm, date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    toastSuccess('Win logged!', SIZE_LABELS[form.size])
  }

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const thisMonth = today.slice(0, 7)
  const thisMonthCount = entries.filter(e => e.date.startsWith(thisMonth)).length

  const sizeCounts = SIZES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = entries.filter(e => e.size === s).length
    return acc
  }, {})

  // Win streak: consecutive days with at least 1 win
  const uniqueDays = [...new Set(entries.map(e => e.date))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  if (uniqueDays.length > 0) {
    const start = new Date(today)
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(start)
      expected.setDate(expected.getDate() - i)
      const expectedStr = expected.toISOString().split('T')[0]
      if (uniqueDays[i] === expectedStr) streak++
      else break
    }
  }

  const filtered = entries.filter(e => {
    if (sizeFilter !== 'All' && e.size !== sizeFilter) return false
    if (categoryFilter !== 'All' && e.category !== categoryFilter) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.story.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
              <Trophy className="w-6 h-6" /> Win Board
            </h1>
            <p className="text-slate-400 text-sm mt-1">Your personal hall of victories</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Win
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-amber-300">{entries.length}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-green-300">{thisMonthCount}</div>
            <div className="text-xs text-slate-400">This Month</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-violet-300">{streak}</div>
            <div className="text-xs text-slate-400">Day Streak</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-blue-300">{sizeCounts['Life-Changing'] ?? 0}</div>
            <div className="text-xs text-slate-400">Life-Changing</div>
          </div>
        </div>

        {/* Size breakdown */}
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map(s => (
            <div key={s} className="game-card text-center py-2">
              <div className="text-lg font-bold text-slate-200">{sizeCounts[s] ?? 0}</div>
              <div className="text-xs text-slate-500 truncate">{SIZE_LABELS[s]}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="game-card space-y-4">
            <h2 className="font-bold text-amber-300 flex items-center gap-2">
              <Star className="w-4 h-4" /> Record a Win
            </h2>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Win Headline</label>
              <input
                className="game-input w-full"
                placeholder="What did you win?"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <select className="game-input w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Size</label>
                <select className="game-input w-full" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                  {SIZES.map(s => <option key={s} value={s}>{SIZE_LABELS[s]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Story / Context</label>
              <input className="game-input w-full" placeholder="The context and story behind this win..." value={form.story} onChange={e => setForm({ ...form, story: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Who Helped? (optional)</label>
                <input className="game-input w-full" placeholder="Who supported you?" value={form.whoHelped} onChange={e => setForm({ ...form, whoHelped: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What It Took</label>
                <input className="game-input w-full" placeholder="Effort / sacrifice..." value={form.whatItTook} onChange={e => setForm({ ...form, whatItTook: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input type="date" className="game-input w-full" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Emotion Felt</label>
                <select className="game-input w-full" value={form.emotionFelt} onChange={e => setForm({ ...form, emotionFelt: e.target.value })}>
                  {EMOTIONS.map(em => <option key={em}>{em}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
              >
                Save Win
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {entries.length > 0 && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="game-input w-full pl-9"
                placeholder="Search wins..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Size filter */}
            <div className="flex gap-2 flex-wrap">
              {['All', ...SIZES].map(s => (
                <button
                  key={s}
                  onClick={() => setSizeFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    sizeFilter === s ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {s === 'All' ? 'All' : SIZE_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {['All', ...CATEGORIES].map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Win Wall */}
        {filtered.length > 0 ? (
          <div className="columns-2 gap-3 space-y-0">
            {filtered.map(e => (
              <div
                key={e.id}
                className={`game-card border break-inside-avoid mb-3 ${CATEGORY_COLORS[e.category] ?? 'border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SIZE_BADGE[e.size] ?? 'bg-slate-600 text-slate-200'}`}>
                    {SIZE_LABELS[e.size]}
                  </span>
                  <span className="text-xs text-slate-500 flex-shrink-0">{e.date}</span>
                </div>
                <h3 className="font-bold text-slate-100 text-sm leading-snug">{e.title}</h3>
                {e.story && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.story}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-slate-500">{e.category}</span>
                  <span className="text-xs text-amber-300">{e.emotionFelt}</span>
                </div>
                {e.whoHelped && (
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500 truncate">{e.whoHelped}</span>
                  </div>
                )}
                {e.whatItTook && (
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-slate-400 truncate">{e.whatItTook}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="game-card text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {entries.length === 0 ? (
              <p>No wins yet. Add your first victory!</p>
            ) : (
              <p>No wins match your filter.</p>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3 h-3" />
            {filtered.length} win{filtered.length !== 1 ? 's' : ''} shown
            {(sizeFilter !== 'All' || categoryFilter !== 'All' || search) && ` (filtered from ${entries.length})`}
          </div>
        )}

        {/* Calendar / date info */}
        {entries.length > 0 && (
          <div className="game-card">
            <h2 className="font-bold text-amber-300 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" /> Win Summary
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400 text-xs mb-1">By Size</div>
                {SIZES.map(s => (
                  <div key={s} className="flex justify-between py-0.5">
                    <span className="text-slate-300 text-xs">{SIZE_LABELS[s]}</span>
                    <span className="text-slate-200 font-semibold">{sizeCounts[s] ?? 0}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">By Category (top 5)</div>
                {CATEGORIES
                  .map(c => ({ c, count: entries.filter(e => e.category === c).length }))
                  .filter(x => x.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map(({ c, count }) => (
                    <div key={c} className="flex justify-between py-0.5">
                      <span className="text-slate-300 text-xs">{c}</span>
                      <span className="text-slate-200 font-semibold">{count}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
