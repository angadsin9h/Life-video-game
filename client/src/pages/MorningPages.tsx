import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Sun, Save, BookOpen, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Entry {
  date: string
  content: string
  word_count: number
  saved_at: string
}

const TARGET_WORDS = 750
const WRITING_PROMPTS = [
  "What's on your mind right now? Let it all out without judgment.",
  "How do you feel this morning? Where is that feeling in your body?",
  "What's been weighing on you lately? Write through it.",
  "What would make today a great day?",
  "What are you grateful for? Go deeper than usual.",
  "What's one thing you keep avoiding? Why?",
  "If you had no fear, what would you do today?",
  "What would you tell your past self from a year ago?",
  "What does your ideal life look like in 5 years?",
  "What needs to change? What's holding you back from changing it?",
  "Write a letter to someone you need to forgive (including yourself).",
  "What patterns do you notice in your life that you want to break?",
  "What brings you the most joy? Are you doing enough of it?",
  "What are you pretending not to know?",
]

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

export default function MorningPages() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [date, setDate] = useState(today)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isWriting, setIsWriting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const prompt = WRITING_PROMPTS[dayOfYear % WRITING_PROMPTS.length]

  useEffect(() => {
    loadEntries()
  }, [])

  useEffect(() => {
    loadEntry(date)
  }, [date])

  const loadEntries = async () => {
    const res = await axios.get('/api/journal?limit=90')
    setEntries((res.data as any[]).filter(e => e.content?.length > 200).map(e => ({
      date: e.date, content: e.content, word_count: e.word_count || countWords(e.content), saved_at: e.updated_at || e.created_at,
    })))
    setLoading(false)
  }

  const loadEntry = async (d: string) => {
    const res = await axios.get(`/api/journal/${d}`)
    if ((res.data as any)?.content) {
      setContent((res.data as any).content)
      setSaved(true)
    } else {
      setContent('')
      setSaved(false)
    }
  }

  const handleFocus = () => {
    if (!isWriting) {
      setIsWriting(true)
      timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
    }
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const save = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/journal', { date, content, word_count: countWords(content) })
      setSaved(true)
      toastSuccess('Morning pages saved!')
      await loadEntries()
    } finally { setSaving(false) }
  }

  const wordCount = countWords(content)
  const progress = Math.min(1, wordCount / TARGET_WORDS)
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const prevDay = () => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }

  const nextDay = () => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    if (d.toISOString().split('T')[0] <= today) setDate(d.toISOString().split('T')[0])
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className={`space-y-4 ${fullscreen ? 'fixed inset-0 bg-slate-950 z-50 p-8 overflow-auto' : 'max-w-2xl mx-auto'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Morning Pages
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">750 words of unfiltered thought</p>
        </div>
        <div className="flex items-center gap-2">
          {isWriting && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Clock className="w-3 h-3" /> {formatTime(timeElapsed)}
            </div>
          )}
          <button onClick={() => setFullscreen(f => !f)}
            className="px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors">
            {fullscreen ? 'Exit' : 'Focus'}
          </button>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={prevDay} className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-300 flex-1 text-center">
          {date === today ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
        <button onClick={nextDay} disabled={date >= today} className="p-1 text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Writing prompt */}
      {date === today && !content && (
        <div className="game-card p-3 border border-yellow-500/20 bg-yellow-900/5">
          <div className="text-xs text-yellow-400 font-semibold mb-1">Today's prompt (or write freely)</div>
          <p className="text-sm text-slate-400 italic">"{prompt}"</p>
        </div>
      )}

      {/* Word count progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{wordCount} words</span>
          <span className={wordCount >= TARGET_WORDS ? 'text-green-400 font-semibold' : ''}>{wordCount >= TARGET_WORDS ? '✓ Target reached!' : `${TARGET_WORDS - wordCount} to go`}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%`, background: progress >= 1 ? '#22c55e' : 'linear-gradient(to right, #f97316, #eab308)' }} />
        </div>
      </div>

      {/* Text area */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => { setContent(e.target.value); setSaved(false) }}
        onFocus={handleFocus}
        placeholder="Just write. Don't think, don't edit, don't stop. Let the words flow..."
        className={`w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm leading-relaxed placeholder-slate-700 focus:outline-none focus:border-yellow-500/30 resize-none transition-colors ${fullscreen ? 'h-[60vh]' : 'h-64'}`}
        autoFocus={fullscreen}
      />

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || !content.trim() || (saved && wordCount < 10)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            saved ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-yellow-600 hover:bg-yellow-500 text-white'
          } disabled:opacity-50`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
        {wordCount >= TARGET_WORDS && (
          <span className="text-xs text-green-400 font-semibold">🎉 750 words complete!</span>
        )}
      </div>

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Recent Entries
          </h3>
          {entries.slice(0, 5).map(e => (
            <button key={e.date} onClick={() => setDate(e.date)}
              className={`w-full game-card p-3 text-left hover:border-yellow-500/30 transition-all ${date === e.date ? 'border-yellow-500/30 bg-yellow-900/5' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">{e.date}</span>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <BookOpen className="w-3 h-3" />
                  {e.word_count} words
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 truncate">{e.content.slice(0, 80)}…</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
