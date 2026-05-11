import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, Save, Trash2, BookOpen, Loader2 } from 'lucide-react'

interface JournalEntry {
  id: number
  date: string
  content: string
  word_count: number
  created_at: string
  updated_at: string
}

interface RecentEntry {
  id: number
  date: string
  word_count: number
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

function getDailyPrompt(dateStr: string): string {
  const seed = dateStr.replace(/-/g, '').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0)
  return PROMPTS[Math.abs(seed) % PROMPTS.length]
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
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

  const loadEntry = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const res = await axios.get<JournalEntry | null>(`/api/journal/${d}`)
      const text = res.data?.content ?? ''
      setContent(text)
      setSavedContent(text)
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    } catch {
      setContent('')
      setSavedContent('')
      setWordCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRecent = useCallback(async () => {
    try {
      const res = await axios.get<RecentEntry[]>('/api/journal')
      setRecentEntries(res.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadEntry(date)
    loadRecent()
  }, [date, loadEntry, loadRecent])

  const handleChange = (val: string) => {
    setContent(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.post('/api/journal', { date, content })
      setSavedContent(content)
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
    setWordCount(0)
    loadRecent()
  }

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  const today = new Date().toISOString().split('T')[0]
  const isDirty = content !== savedContent
  const dailyPrompt = getDailyPrompt(date)

  const entryDates = new Set(recentEntries.map(e => e.date))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Journal</h1>
        <p className="text-slate-400 mt-1">Daily reflections — your story, one entry at a time</p>
      </div>

      {/* Date navigator */}
      <div className="game-card p-4 flex items-center justify-between">
        <button
          onClick={() => changeDate(-1)}
          className="game-btn-secondary p-2 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center flex-1 px-4">
          <div className="font-semibold text-slate-200">{formatDateDisplay(date)}</div>
          {date === today && <div className="text-xs text-violet-400 mt-0.5">Today</div>}
          {entryDates.has(date) && date !== today && <div className="text-xs text-green-400 mt-0.5">✓ Entry saved</div>}
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

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <textarea
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-slate-500 resize-none leading-relaxed text-sm"
            style={{ minHeight: '280px', fontFamily: 'inherit' }}
            placeholder="Start writing your thoughts for today... There are no rules here. Just you and your words."
            value={content}
            onChange={e => handleChange(e.target.value)}
          />
        )}

        {/* Footer: word count + actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
            {wordCount >= 50 && <span className="text-green-400 ml-2">✓ Great entry!</span>}
            {wordCount >= 200 && <span className="text-violet-400 ml-1">⚡ Deep reflection!</span>}
          </span>
          <div className="flex items-center gap-2">
            {savedContent && (
              <button
                onClick={handleDelete}
                className="text-slate-600 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty || !content.trim()}
              className={`game-btn-primary flex items-center gap-2 text-sm py-2 ${saved ? 'bg-green-600 border-green-500 hover:bg-green-600' : ''}`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <>✓ Saved</>
              ) : (
                <><Save className="w-4 h-4" /> Save</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Writing streaks / stats */}
      {recentEntries.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-400" />
              Recent Entries
            </h3>
            <span className="text-xs text-slate-500">{recentEntries.length} entries total</span>
          </div>
          <div className="space-y-2">
            {recentEntries.slice(0, 7).map(entry => (
              <button
                key={entry.date}
                onClick={() => setDate(entry.date)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                  entry.date === date
                    ? 'bg-violet-600/20 border border-violet-500/40'
                    : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    {formatDateDisplay(entry.date)}
                  </span>
                  {entry.date === today && (
                    <span className="ml-2 text-xs text-violet-400">Today</span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{entry.word_count}w</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
