import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Save, Heart, Sparkles, Target, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'anticipation_journal_log'

type Category = 'event' | 'achievement' | 'experience' | 'connection' | 'growth' | 'pleasure' | 'travel'
type Timeframe = 'today' | 'this-week' | 'this-month' | 'this-year' | 'someday'

interface Anticipation {
  id: string
  title: string
  description: string
  date: string
  category: Category
  excitement: 1 | 2 | 3 | 4 | 5
  timeframe: Timeframe
  completed: boolean
  completedDate: string
  completedNote: string
}

const CATEGORIES: { value: Category; emoji: string; label: string }[] = [
  { value: 'event', emoji: '🎉', label: 'Event' },
  { value: 'achievement', emoji: '🏆', label: 'Achievement' },
  { value: 'experience', emoji: '🌟', label: 'Experience' },
  { value: 'connection', emoji: '💝', label: 'Connection' },
  { value: 'growth', emoji: '📈', label: 'Growth' },
  { value: 'pleasure', emoji: '😊', label: 'Pleasure' },
  { value: 'travel', emoji: '✈️', label: 'Travel' },
]

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
  { value: 'someday', label: 'Someday' },
]

function load(): Anticipation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function persist(items: Anticipation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function categoryEmoji(cat: Category): string {
  return CATEGORIES.find(c => c.value === cat)?.emoji ?? '🌟'
}

function categoryLabel(cat: Category): string {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat
}

function timeframeLabel(tf: Timeframe): string {
  return TIMEFRAMES.find(t => t.value === tf)?.label ?? tf
}

function blankForm() {
  return {
    title: '',
    description: '',
    date: '',
    category: 'experience' as Category,
    excitement: 3 as 1 | 2 | 3 | 4 | 5,
    timeframe: 'this-month' as Timeframe,
  }
}

export default function AnticipationJournal() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<Anticipation[]>([])
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blankForm())

  // Completion dialog state
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completedNote, setCompletedNote] = useState('')

  // Expand state for cards
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setItems(load())
  }, [])

  const save = (updated: Anticipation[]) => {
    setItems(updated)
    persist(updated)
  }

  const addItem = () => {
    if (!form.title.trim()) return
    const item: Anticipation = {
      id: Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      category: form.category,
      excitement: form.excitement,
      timeframe: form.timeframe,
      completed: false,
      completedDate: '',
      completedNote: '',
    }
    save([item, ...items])
    setForm(blankForm())
    setShowForm(false)
    toastSuccess('Added to your joy list! 🎉')
  }

  const deleteItem = (id: string) => {
    save(items.filter(i => i.id !== id))
  }

  const startComplete = (id: string) => {
    setCompletingId(id)
    setCompletedNote('')
  }

  const confirmComplete = () => {
    if (!completingId) return
    save(
      items.map(i =>
        i.id === completingId
          ? { ...i, completed: true, completedDate: today(), completedNote: completedNote.trim() }
          : i
      )
    )
    setCompletingId(null)
    setCompletedNote('')
    toastSuccess('Lived it! Marked as completed ✅')
  }

  const activeItems = items.filter(i => !i.completed)
  const completedItems = items.filter(i => i.completed)

  // Group active by timeframe
  const grouped: Partial<Record<Timeframe, Anticipation[]>> = {}
  for (const tf of TIMEFRAMES) {
    const group = activeItems.filter(i => i.timeframe === tf.value)
    if (group.length > 0) grouped[tf.value] = group
  }

  // Stats
  const avgExcitement =
    activeItems.length > 0
      ? (activeItems.reduce((s, i) => s + i.excitement, 0) / activeItems.length).toFixed(1)
      : '—'

  const catCounts: Partial<Record<Category, number>> = {}
  for (const i of activeItems) {
    catCounts[i.category] = (catCounts[i.category] ?? 0) + 1
  }
  const topCat = (Object.entries(catCounts) as [Category, number][]).sort((a, b) => b[1] - a[1])[0]

  // Excitement distribution for SVG chart
  const exciteCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const i of activeItems) {
    exciteCounts[i.excitement] = (exciteCounts[i.excitement] ?? 0) + 1
  }
  const maxExciteCount = Math.max(...Object.values(exciteCounts), 1)

  const CHART_HEIGHT = 60
  const BAR_W = 28
  const BAR_GAP = 8
  const CHART_W = (BAR_W + BAR_GAP) * 5 - BAR_GAP

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-pink-400" />
            Anticipation Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Joy lives in what you're looking forward to</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <Target className="w-4 h-4 text-pink-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-pink-400">{activeItems.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3 text-center">
          <Heart className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{completedItems.length}</div>
          <div className="text-xs text-slate-500">Lived</div>
        </div>
        <div className="game-card p-3 text-center">
          <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{avgExcitement}</div>
          <div className="text-xs text-slate-500">Avg Excitement</div>
        </div>
        <div className="game-card p-3 text-center">
          <Star className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-violet-400">
            {topCat ? categoryEmoji(topCat[0]) : '—'}
          </div>
          <div className="text-xs text-slate-500">
            {topCat ? categoryLabel(topCat[0]) : 'No data'}
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-pink-500/20 bg-pink-900/5">
          <h3 className="text-sm font-semibold text-pink-300 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Something to look forward to
          </h3>

          <div className="space-y-3">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What are you looking forward to?"
              className="game-input w-full"
              autoFocus
            />
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Why does this excite you? Any details..."
              className="game-input w-full h-20 resize-none text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(f => ({ ...f, category: c.value }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${form.category === c.value
                    ? 'bg-pink-900/40 text-pink-300 border border-pink-500/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">When? (optional)</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="game-input w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Timeframe</label>
              <div className="flex flex-wrap gap-1">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setForm(f => ({ ...f, timeframe: tf.value }))}
                    className={`px-2 py-0.5 rounded-full text-xs transition-all ${form.timeframe === tf.value
                      ? 'bg-pink-900/40 text-pink-300 border border-pink-500/40'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Excitement */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Excitement Level</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setForm(f => ({ ...f, excitement: r }))}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                  style={form.excitement === r
                    ? { background: '#ec489933', border: '1.5px solid #ec4899', color: '#f9a8d4' }
                    : { background: '#1e293b', border: '1.5px solid #334155', color: '#64748b' }}
                >
                  {'★'.repeat(r)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addItem}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" /> Save to Joy List
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(blankForm()) }}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Completion dialog */}
      {completingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="game-card p-6 space-y-4 w-full max-w-md border border-green-500/30">
            <div className="flex items-center gap-2 text-green-400">
              <Heart className="w-5 h-5" />
              <h3 className="font-semibold">You lived it! How was it?</h3>
            </div>
            <textarea
              value={completedNote}
              onChange={e => setCompletedNote(e.target.value)}
              placeholder="Share your reflection — did it live up to the anticipation?"
              className="game-input w-full h-28 resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={confirmComplete}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Mark as Completed ✅
              </button>
              <button
                onClick={() => setCompletingId(null)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'active' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Looking Forward ({activeItems.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'completed' ? 'bg-green-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Lived It ({completedItems.length})
        </button>
      </div>

      {/* Active anticipations grouped by timeframe */}
      {tab === 'active' && (
        <div className="space-y-6">
          {activeItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nothing in your joy list yet.</p>
              <p className="text-sm mt-1">Add something you're looking forward to!</p>
            </div>
          ) : (
            <>
              {TIMEFRAMES.map(tf => {
                const group = grouped[tf.value]
                if (!group) return null
                return (
                  <div key={tf.value}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{tf.label}</h3>
                      <div className="flex-1 h-px bg-slate-700" />
                    </div>
                    <div className="space-y-2">
                      {group.map(item => {
                        const isExpanded = expandedId === item.id
                        return (
                          <div key={item.id} className="game-card overflow-hidden">
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl flex-shrink-0">{categoryEmoji(item.category)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <button
                                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                      className="text-sm font-semibold text-slate-200 text-left hover:text-white transition-colors"
                                    >
                                      {item.title}
                                    </button>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs font-medium text-yellow-400">{'★'.repeat(item.excitement)}</span>
                                    <span
                                      className="text-xs px-2 py-0.5 rounded-full bg-pink-900/30 text-pink-300 border border-pink-500/30"
                                    >
                                      {timeframeLabel(item.timeframe)}
                                    </span>
                                    {item.date && (
                                      <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {isExpanded && item.description && (
                                <p className="text-sm text-slate-400 mt-3 ml-9 leading-relaxed">{item.description}</p>
                              )}

                              {isExpanded && (
                                <div className="flex gap-2 mt-3 ml-9">
                                  <button
                                    onClick={() => startComplete(item.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 hover:bg-green-800/40 text-green-400 rounded-lg text-xs font-medium transition-colors border border-green-500/30"
                                  >
                                    <Heart className="w-3.5 h-3.5" /> I lived it!
                                  </button>
                                  <button
                                    onClick={() => deleteItem(item.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-lg text-xs transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Excitement distribution chart */}
              {activeItems.length > 0 && (
                <div className="game-card p-4">
                  <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Excitement Distribution
                  </h3>
                  <div className="flex items-end justify-center gap-2" style={{ height: `${CHART_HEIGHT + 24}px` }}>
                    {([1, 2, 3, 4, 5] as const).map(level => {
                      const count = exciteCounts[level] ?? 0
                      const barH = maxExciteCount > 0 ? Math.max((count / maxExciteCount) * CHART_HEIGHT, count > 0 ? 4 : 0) : 0
                      return (
                        <div key={level} className="flex flex-col items-center gap-1" style={{ width: BAR_W }}>
                          <span className="text-xs text-slate-500">{count}</span>
                          <svg width={BAR_W} height={CHART_HEIGHT} className="overflow-visible">
                            <rect
                              x={0}
                              y={CHART_HEIGHT - barH}
                              width={BAR_W}
                              height={barH}
                              rx={4}
                              fill={count > 0 ? '#ec489966' : '#1e293b'}
                              stroke={count > 0 ? '#ec4899' : '#334155'}
                              strokeWidth={1}
                            />
                          </svg>
                          <span className="text-xs text-yellow-400">{'★'.repeat(level)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Completed tab */}
      {tab === 'completed' && (
        <div className="space-y-3">
          {completedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nothing completed yet.</p>
              <p className="text-sm mt-1">Mark items as lived to see them here.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                You've lived through {completedItems.length} anticipated moment{completedItems.length !== 1 ? 's' : ''}!
              </p>
              {completedItems.map(item => (
                <div key={item.id} className="game-card p-4 border-l-2 border-green-500/60">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{categoryEmoji(item.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-200">{item.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                        <span className="text-yellow-400">{'★'.repeat(item.excitement)}</span>
                        <span>·</span>
                        <span>{categoryLabel(item.category)}</span>
                        {item.completedDate && (
                          <>
                            <span>·</span>
                            <span className="text-green-400">Lived {formatDate(item.completedDate)}</span>
                          </>
                        )}
                      </div>
                      {item.completedNote && (
                        <p className="text-sm text-slate-400 italic mt-2 leading-relaxed">"{item.completedNote}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
