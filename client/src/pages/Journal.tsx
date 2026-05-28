import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, Save, Trash2, BookOpen, Loader2, Search, Tag, X, Hash } from 'lucide-react'

interface JournalEntry {
  id: number
  date: string
  content: string
  word_count: number
  tags: string[]
  mood: number
  created_at: string
  updated_at: string
}

interface RecentEntry {
  id: number
  date: string
  word_count: number
  tags: string[]
  mood: number
}

const PROMPTS = [
  "What was the highlight of your day?",
  "What challenged you today, and how did you respond?",
  "What are you grateful for right now?",
  "What would make tomorrow even better?",
  "What did you learn today?",
  "How did you move closer to your goals today?",
  "What drained your energy? What gave you energy?",
  "If today were a chapter in your story, what would you title it?",
  "What habit felt easiest today? Which one felt hardest?",
  "Who made a positive impact on you today?",
]

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

const TAG_COLORS = [
  'bg-violet-900/30 text-violet-400 border-violet-500/30',
  'bg-cyan-900/30 text-cyan-400 border-cyan-500/30',
  'bg-green-900/30 text-green-400 border-green-500/30',
  'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  'bg-orange-900/30 text-orange-400 border-orange-500/30',
  'bg-pink-900/30 text-pink-400 border-pink-500/30',
]

function tagColor(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffff
  return TAG_COLORS[h % TAG_COLORS.length]
}

function getDailyPrompt(dateStr: string): string {
  const seed = dateStr.replace(/-/g, '').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0)
  return PROMPTS[Math.abs(seed) % PROMPTS.length]
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Journal() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [wordCount, setWordCount] = useState(0)

  const [tags, setTags] = useState<string[]>([])
  const [savedTags, setSavedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [mood, setMood] = useState(0)
  const [savedMood, setSavedMood] = useState(0)

  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([])
  const [searchResults, setSearchResults] = useState<RecentEntry[] | null>(null)
  const [searching, setSearching] = useState(false)

  const loadEntry = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const res = await axios.get<JournalEntry | null>(`/api/journal/${d}`)
      const text = res.data?.content ?? ''
      const t = res.data?.tags ?? []
      const m = res.data?.mood ?? 0
      setContent(text)
      setSavedContent(text)
      setTags(t)
      setSavedTags(t)
      setMood(m)
      setSavedMood(m)
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    } catch {
      setContent('')
      setSavedContent('')
      setTags([])
      setSavedTags([])
      setMood(0)
      setSavedMood(0)
      setWordCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRecent = useCallback(async () => {
    try {
      const [recentRes, tagsRes] = await Promise.all([
        axios.get<RecentEntry[]>('/api/journal'),
        axios.get<{ tag: string; count: number }[]>('/api/journal/tags'),
      ])
      setRecentEntries(recentRes.data)
      setAllTags(tagsRes.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadEntry(date)
    loadRecent()
  }, [date, loadEntry, loadRecent])

  useEffect(() => {
    if (!search && !tagFilter) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set('q', search)
        if (tagFilter) params.set('tag', tagFilter)
        const res = await axios.get<RecentEntry[]>(`/api/journal/search?${params}`)
        setSearchResults(res.data)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, tagFilter])

  const handleChange = (val: string) => {
    setContent(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
    setSaved(false)
  }

  const addTag = (raw: string) => {
    const newTag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (!newTag || tags.includes(newTag) || tags.length >= 8) return
    setTags(prev => [...prev, newTag])
    setTagInput('')
    setSaved(false)
  }

  const removeTag = (t: string) => {
    setTags(prev => prev.filter(x => x !== t))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.post('/api/journal', { date, content, tags, mood })
      setSavedContent(content)
      setSavedTags(tags)
      setSavedMood(mood)
      setSaved(true)
      loadRecent()
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await axios.delete(`/api/journal/${date}`)
    setContent('')
    setSavedContent('')
    setTags([])
    setSavedTags([])
    setMood(0)
    setSavedMood(0)
    setWordCount(0)
    loadRecent()
  }

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  const today = new Date().toISOString().split('T')[0]
  const isDirty = content !== savedContent || JSON.stringify(tags) !== JSON.stringify(savedTags) || mood !== savedMood
  const dailyPrompt = getDailyPrompt(date)
  const entryDates = new Set(recentEntries.map(e => e.date))
  const displayEntries = searchResults ?? recentEntries

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Journal</h1>
        <p className="text-slate-400 mt-1">Daily reflections — your story, one entry at a time</p>
      </div>

      {/* Search + tag filter bar */}
      <div className="game-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries…"
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.slice(0, 12).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-all ${
                  tagFilter === tag ? tagColor(tag) + ' ring-1 ring-current' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                }`}
              >
                #{tag} <span className="opacity-60">{count}</span>
              </button>
            ))}
            {tagFilter && (
              <button onClick={() => setTagFilter('')} className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400 border border-slate-600 flex items-center gap-1">
                <X className="w-3 h-3" /> clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Date navigator */}
      <div className="game-card p-4 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="game-btn-secondary p-2 rounded-lg">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center flex-1 px-4">
          <div className="font-semibold text-slate-200">{formatDateDisplay(date)}</div>
          {date === today && <div className="text-xs text-violet-400 mt-0.5">Today</div>}
          {entryDates.has(date) && date !== today && <div className="text-xs text-green-400 mt-0.5">Entry saved</div>}
        </div>

        <button
          onClick={() => changeDate(1)}
          disabled={date >= today}
          className="game-btn-secondary p-2 rounded-lg disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Writing area */}
      <div className="game-card p-5 space-y-4">
        {/* Daily prompt */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-900/20 border border-violet-500/20">
          <span className="text-violet-400 text-lg flex-shrink-0">💭</span>
          <p className="text-sm text-violet-300 italic">{dailyPrompt}</p>
        </div>

        {/* Mood selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16">Today's mood</span>
          <div className="flex gap-1">
            {MOOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setMood(mood === opt.value ? 0 : opt.value); setSaved(false) }}
                title={opt.label}
                className={`text-xl transition-all rounded-lg px-1.5 py-0.5 ${
                  mood === opt.value
                    ? 'bg-violet-600/30 scale-110 ring-1 ring-violet-500/50'
                    : 'opacity-40 hover:opacity-70'
                }`}
              >
                {opt.emoji}
              </button>
            ))}
          </div>
          {mood > 0 && (
            <span className="text-xs text-slate-500">{MOOD_OPTIONS.find(m => m.value === mood)?.label}</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <textarea
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-slate-500 resize-none leading-relaxed text-sm"
            style={{ minHeight: '260px', fontFamily: 'inherit' }}
            placeholder="Start writing your thoughts for today… There are no rules here. Just you and your words."
            value={content}
            onChange={e => handleChange(e.target.value)}
          />
        )}

        {/* Tags input */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${tagColor(t)}`}>
                #{t}
                <button onClick={() => removeTag(t)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {tags.length < 8 && (
              <div className="relative">
                <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                    if (e.key === 'Backspace' && !tagInput && tags.length) removeTag(tags[tags.length - 1])
                  }}
                  placeholder="add tag…"
                  className="pl-6 pr-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-400 placeholder-slate-600 focus:outline-none focus:border-violet-500 w-24"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600">Press Enter or comma to add a tag</p>
        </div>

        {/* Footer: word count + actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
            {wordCount >= 50 && <span className="text-green-400 ml-2">Great entry!</span>}
            {wordCount >= 200 && <span className="text-violet-400 ml-1">Deep reflection!</span>}
          </span>
          <div className="flex items-center gap-2">
            {savedContent && (
              <button onClick={handleDelete} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty || !content.trim()}
              className={`game-btn-primary flex items-center gap-2 text-sm py-2 ${saved ? 'bg-green-600 border-green-500 hover:bg-green-600' : ''}`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <>Saved</> : <><Save className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </div>
      </div>

      {/* Recent / search results */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            {searchResults !== null ? `Results (${searchResults.length})` : 'Recent Entries'}
          </h3>
          {searching && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
          {!searching && !searchResults && (
            <span className="text-xs text-slate-500">{recentEntries.length} entries</span>
          )}
        </div>

        {displayEntries.length === 0 ? (
          <div className="text-center py-6 text-slate-600">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{searchResults !== null ? 'No entries match your search.' : 'Your journal is empty.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayEntries.slice(0, searchResults ? 20 : 10).map(entry => (
              <button
                key={entry.date}
                onClick={() => { setDate(entry.date); setSearch(''); setTagFilter(''); setSearchResults(null) }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  entry.date === date
                    ? 'bg-violet-600/20 border border-violet-500/40'
                    : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                }`}
              >
                <div className="flex-shrink-0 text-center min-w-[40px]">
                  <div className="text-xs text-slate-400 font-medium">{formatDateShort(entry.date)}</div>
                  {entry.mood > 0 && (
                    <div className="text-sm">{MOOD_OPTIONS.find(m => m.value === entry.mood)?.emoji}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-300 truncate">
                      {entry.date === today ? 'Today' : new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-xs text-slate-600">{entry.word_count}w</span>
                  </div>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.tags.slice(0, 4).map(t => (
                        <span key={t} className={`px-1.5 py-0 rounded-full text-xs border ${tagColor(t)}`}>
                          #{t}
                        </span>
                      ))}
                      {entry.tags.length > 4 && (
                        <span className="text-xs text-slate-600">+{entry.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {recentEntries.length === 0 && !content && (
        <div className="text-center py-8 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Your journal is empty. Write your first entry above.</p>
          <p className="text-xs mt-1">Daily reflection is one of the highest-leverage habits you can build.</p>
        </div>
      )}
    </div>
  )
}
