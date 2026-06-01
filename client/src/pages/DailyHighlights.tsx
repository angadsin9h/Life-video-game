import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Save, Sparkles, Sun, Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'daily_highlights_log'

interface Highlight {
  id: string
  text: string
  category: 'moment' | 'win' | 'connection' | 'discovery' | 'gratitude' | 'fun'
  starred: boolean
}

interface DailyHighlightEntry {
  id: string
  date: string
  highlights: Highlight[]
  dayRating: 1 | 2 | 3 | 4 | 5
  oneWord: string
  notes: string
}

const CATEGORIES: { value: Highlight['category']; emoji: string; label: string }[] = [
  { value: 'moment', emoji: '✨', label: 'Moment' },
  { value: 'win', emoji: '🏆', label: 'Win' },
  { value: 'connection', emoji: '💝', label: 'Connection' },
  { value: 'discovery', emoji: '💡', label: 'Discovery' },
  { value: 'gratitude', emoji: '🙏', label: 'Gratitude' },
  { value: 'fun', emoji: '😄', label: 'Fun' },
]

const RATING_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#10b981',
}

function ratingColor(r: number): string {
  return RATING_COLORS[r] ?? '#334155'
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function load(): DailyHighlightEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function persist(entries: DailyHighlightEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function blankHighlight(): Highlight {
  return { id: Date.now().toString() + Math.random(), text: '', category: 'moment', starred: false }
}

function categoryEmoji(cat: Highlight['category']): string {
  return CATEGORIES.find(c => c.value === cat)?.emoji ?? '✨'
}

export default function DailyHighlights() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DailyHighlightEntry[]>([])
  const [tab, setTab] = useState<'today' | 'starred' | 'recent'>('today')

  // Form state
  const [oneWord, setOneWord] = useState('')
  const [dayRating, setDayRating] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [highlights, setHighlights] = useState<Highlight[]>([blankHighlight(), blankHighlight(), blankHighlight()])
  const [notes, setNotes] = useState('')

  // Recent entries expand state
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  useEffect(() => {
    const saved = load()
    setEntries(saved)
    // Pre-fill form if today already exists
    const todayEntry = saved.find(e => e.date === today())
    if (todayEntry) {
      setOneWord(todayEntry.oneWord)
      setDayRating(todayEntry.dayRating)
      setHighlights(todayEntry.highlights.length > 0 ? todayEntry.highlights : [blankHighlight(), blankHighlight(), blankHighlight()])
      setNotes(todayEntry.notes)
    }
  }, [])

  // Streak: consecutive days up to and including today
  const streak = (() => {
    const dateSet = new Set(entries.map(e => e.date))
    let s = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (dateSet.has(ds)) {
        s++
        d.setDate(d.getDate() - 1)
      } else if (s === 0 && ds === today()) {
        // today not yet filled — check yesterday
        d.setDate(d.getDate() - 1)
        if (!dateSet.has(d.toISOString().split('T')[0])) break
      } else {
        break
      }
    }
    return s
  })()

  const updateHighlight = (idx: number, partial: Partial<Highlight>) => {
    setHighlights(prev => prev.map((h, i) => i === idx ? { ...h, ...partial } : h))
  }

  const addHighlight = () => {
    if (highlights.length < 5) setHighlights(prev => [...prev, blankHighlight()])
  }

  const removeHighlight = (idx: number) => {
    if (highlights.length > 1) setHighlights(prev => prev.filter((_, i) => i !== idx))
  }

  const saveToday = () => {
    const validHighlights = highlights.filter(h => h.text.trim())
    if (validHighlights.length === 0) return

    const entry: DailyHighlightEntry = {
      id: today(),
      date: today(),
      highlights: validHighlights,
      dayRating,
      oneWord: oneWord.trim(),
      notes: notes.trim(),
    }

    const updated = [entry, ...entries.filter(e => e.date !== today())]
    updated.sort((a, b) => b.date.localeCompare(a.date))
    setEntries(updated)
    persist(updated)
    toastSuccess("Today's highlights captured! ⭐")
  }

  // 21-day calendar
  const calendarDays: { date: string; entry: DailyHighlightEntry | undefined }[] = []
  for (let i = 20; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    calendarDays.push({ date: ds, entry: entries.find(e => e.date === ds) })
  }

  // Starred highlights across all entries (most recent first)
  const starredHighlights: { highlight: Highlight; entry: DailyHighlightEntry }[] = []
  for (const entry of entries) {
    for (const h of entry.highlights) {
      if (h.starred) starredHighlights.push({ highlight: h, entry })
    }
  }

  // Stats
  const totalDays = entries.length
  const totalHighlights = entries.reduce((sum, e) => sum + e.highlights.length, 0)
  const catCounts: Partial<Record<Highlight['category'], number>> = {}
  for (const e of entries) {
    for (const h of e.highlights) {
      catCounts[h.category] = (catCounts[h.category] ?? 0) + 1
    }
  }
  const topCategory = (Object.entries(catCounts) as [Highlight['category'], number][]).sort((a, b) => b[1] - a[1])[0]

  // Recent 7 entries
  const recentEntries = entries.slice(0, 7)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Daily Highlights
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Archive life's best moments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
            <div className="text-xs text-slate-500">day streak</div>
          </div>
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Calendar className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-violet-400">{totalDays}</div>
          <div className="text-xs text-slate-500">Days Logged</div>
        </div>
        <div className="game-card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-400">{totalHighlights}</div>
          <div className="text-xs text-slate-500">Highlights</div>
        </div>
        <div className="game-card p-4 text-center">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-yellow-400">
            {topCategory ? categoryEmoji(topCategory[0]) : '—'}
          </div>
          <div className="text-xs text-slate-500">
            {topCategory ? CATEGORIES.find(c => c.value === topCategory[0])?.label : 'No data'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['today', 'starred', 'recent'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            {t === 'today' ? "Today's Highlights" : t === 'starred' ? '⭐ Starred' : 'Recent Days'}
          </button>
        ))}
      </div>

      {/* Today's Highlights Form */}
      {tab === 'today' && (
        <div className="space-y-4">
          {/* One word + rating */}
          <div className="game-card p-5 space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Describe today in one word</label>
              <input
                value={oneWord}
                onChange={e => setOneWord(e.target.value.split(' ')[0])}
                placeholder="e.g. Productive, Peaceful, Adventurous..."
                className="game-input w-full"
                maxLength={30}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Day Rating</label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setDayRating(r)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                    style={dayRating === r
                      ? { background: ratingColor(r) + '33', border: `1.5px solid ${ratingColor(r)}`, color: ratingColor(r) }
                      : { background: '#1e293b', border: '1.5px solid #334155', color: '#64748b' }}
                  >
                    {'★'.repeat(r)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="game-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Highlights ({highlights.length}/5)</label>
              {highlights.length < 5 && (
                <button
                  onClick={addHighlight}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>

            {highlights.map((h, idx) => (
              <div key={h.id} className="space-y-2 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex gap-2">
                  <input
                    value={h.text}
                    onChange={e => updateHighlight(idx, { text: e.target.value })}
                    placeholder={`Highlight ${idx + 1}...`}
                    className="game-input flex-1 text-sm"
                  />
                  <button
                    onClick={() => updateHighlight(idx, { starred: !h.starred })}
                    className="p-2 rounded-lg transition-colors hover:bg-slate-700"
                    title="Star this highlight"
                  >
                    <Star className={`w-4 h-4 ${h.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                  </button>
                  {highlights.length > 1 && (
                    <button
                      onClick={() => removeHighlight(idx)}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-slate-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => updateHighlight(idx, { category: c.value })}
                      className={`px-2 py-0.5 rounded-full text-xs transition-all ${h.category === c.value
                        ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/40'
                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="game-card p-5">
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any other thoughts about today..."
              className="game-input w-full h-24 resize-none text-sm"
            />
          </div>

          <button
            onClick={saveToday}
            className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Today's Highlights
          </button>

          {/* 21-day calendar */}
          <div className="game-card p-4">
            <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> 21-Day Overview
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map(({ date, entry }) => (
                <div key={date} className="relative group">
                  <div
                    className="w-full aspect-square rounded-full flex items-center justify-center text-xs font-bold cursor-default transition-transform hover:scale-110"
                    style={{
                      background: entry ? ratingColor(entry.dayRating) + '55' : '#1e293b',
                      border: entry ? `1.5px solid ${ratingColor(entry.dayRating)}` : '1.5px solid #334155',
                      color: entry ? ratingColor(entry.dayRating) : '#475569',
                    }}
                    title={entry ? `${date}: "${entry.oneWord || '—'}" (${entry.dayRating}★)` : date}
                  >
                    {new Date(date + 'T12:00:00').getDate()}
                  </div>
                  {entry && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-slate-700 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                      {date} · {entry.oneWord || '—'} · {entry.dayRating}★
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 justify-center text-xs text-slate-600">
              {[1, 2, 3, 4, 5].map(r => (
                <div key={r} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: ratingColor(r) }} />
                  <span>{r}★</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Starred moments */}
      {tab === 'starred' && (
        <div className="space-y-3">
          {starredHighlights.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No starred highlights yet.</p>
              <p className="text-sm mt-1">Star your favourite moments as you log them.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">{starredHighlights.length} starred moment{starredHighlights.length !== 1 ? 's' : ''}</p>
              {starredHighlights.map(({ highlight, entry }) => (
                <div key={highlight.id} className="game-card p-4 border-l-2" style={{ borderLeftColor: '#eab308' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{categoryEmoji(highlight.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-relaxed">{highlight.text}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span>{formatDate(entry.date)}</span>
                        {entry.oneWord && (
                          <>
                            <span>·</span>
                            <span className="italic text-slate-400">"{entry.oneWord}"</span>
                          </>
                        )}
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Recent Days */}
      {tab === 'recent' && (
        <div className="space-y-3">
          {recentEntries.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Sun className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No entries yet. Start logging today!</p>
            </div>
          ) : (
            recentEntries.map(entry => {
              const isExpanded = expandedEntry === entry.id
              return (
                <div key={entry.id} className="game-card overflow-hidden">
                  <button
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: ratingColor(entry.dayRating) + '33', color: ratingColor(entry.dayRating), border: `1.5px solid ${ratingColor(entry.dayRating)}` }}
                    >
                      {entry.dayRating}★
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-200">{formatDate(entry.date)}</div>
                      {entry.oneWord && <div className="text-xs text-slate-400 italic">"{entry.oneWord}"</div>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                      <span>{entry.highlights.length} highlight{entry.highlights.length !== 1 ? 's' : ''}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3">
                      {entry.highlights.map(h => (
                        <div key={h.id} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-base flex-shrink-0">{categoryEmoji(h.category)}</span>
                          <span className="leading-relaxed">{h.text}</span>
                          {h.starred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 ml-auto flex-shrink-0" />}
                        </div>
                      ))}
                      {entry.notes && (
                        <p className="text-xs text-slate-500 italic mt-2 pt-2 border-t border-slate-700/40">{entry.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
