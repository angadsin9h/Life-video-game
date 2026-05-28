import { useState, useEffect } from 'react'
import { Sun, Save, Heart, Sparkles, Target, ChevronDown, ChevronUp, RefreshCw, TrendingUp, Award } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface GratitudeEntry {
  id: string
  date: string
  prompt1: string
  prompt2: string
  prompt3: string
  prompt4: string
  prompt5: string
  affirmation: string
  mood: 1 | 2 | 3 | 4 | 5
  completedAt: string
}

const STORAGE_KEY = 'morning_gratitude_log'

const PROMPTS: { key: keyof Pick<GratitudeEntry, 'prompt1' | 'prompt2' | 'prompt3' | 'prompt4' | 'prompt5'>; label: string; placeholder: string }[] = [
  { key: 'prompt1', label: 'I am grateful for...', placeholder: 'Something you appreciate, big or small...' },
  { key: 'prompt2', label: 'Something I\'m looking forward to today...', placeholder: 'A meeting, a meal, a moment...' },
  { key: 'prompt3', label: 'A person I appreciate...', placeholder: 'Someone who matters to you and why...' },
  { key: 'prompt4', label: 'A challenge I\'m grateful for...', placeholder: 'A difficulty that\'s making you stronger...' },
  { key: 'prompt5', label: 'Something about myself I appreciate...', placeholder: 'A quality, skill, or effort you\'re proud of...' },
]

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' }

const AFFIRMATIONS = [
  'I am capable of great things today.',
  'I choose to show up fully.',
  'I grow through every challenge.',
  'I am worthy of love and success.',
  'Today I make progress, not perfection.',
  'I am grateful and full of possibility.',
  'My mindset shapes my reality.',
  'I bring value wherever I go.',
]

// Stopwords to filter from word cloud
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'my', 'i', 'is', 'am', 'are', 'was', 'be', 'been', 'that',
  'this', 'it', 'its', 'have', 'has', 'had', 'do', 'does', 'did', 'so',
  'as', 'by', 'from', 'up', 'about', 'into', 'through', 'very', 'just',
  'me', 'we', 'he', 'she', 'they', 'his', 'her', 'our', 'their', 'which',
  'who', 'how', 'what', 'when', 'where', 'why', 'can', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'not', 'no', 'if', 'then',
  'than', 'more', 'most', 'also', 'some', 'any', 'all', 'each',
])

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function calcStreak(logs: GratitudeEntry[]): number {
  if (logs.length === 0) return 0
  const dateSet = new Set(logs.map(l => l.date))
  const today = todayStr()
  let streak = 0
  let cur = today
  if (dateSet.has(cur)) {
    while (dateSet.has(cur)) {
      streak++
      const d = new Date(cur + 'T12:00:00')
      d.setDate(d.getDate() - 1)
      cur = d.toISOString().split('T')[0]
    }
  } else {
    const d = new Date(today + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    cur = d.toISOString().split('T')[0]
    while (dateSet.has(cur)) {
      streak++
      const dt = new Date(cur + 'T12:00:00')
      dt.setDate(dt.getDate() - 1)
      cur = dt.toISOString().split('T')[0]
    }
  }
  return streak
}

function calcLongestStreak(logs: GratitudeEntry[]): number {
  if (logs.length === 0) return 0
  const dates = [...new Set(logs.map(l => l.date))].sort()
  let longest = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T12:00:00')
    const curr = new Date(dates[i] + 'T12:00:00')
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}

function buildWordCloud(logs: GratitudeEntry[]): { word: string; count: number }[] {
  const freq = new Map<string, number>()
  logs.forEach(l => {
    const text = l.prompt1
    text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
      .forEach(w => freq.set(w, (freq.get(w) ?? 0) + 1))
  })
  return [...freq.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

function emptyEntry(date: string): GratitudeEntry {
  return {
    id: Date.now().toString(),
    date,
    prompt1: '',
    prompt2: '',
    prompt3: '',
    prompt4: '',
    prompt5: '',
    affirmation: '',
    mood: 3,
    completedAt: '',
  }
}

export default function MorningGratitudeRitual() {
  const { toastSuccess } = useToast()
  const today = todayStr()

  const [logs, setLogs] = useState<GratitudeEntry[]>([])
  const [entry, setEntry] = useState<GratitudeEntry>(emptyEntry(today))
  const [completed, setCompleted] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored: GratitudeEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setLogs(stored)
      const existing = stored.find(l => l.date === today)
      if (existing) {
        setEntry(existing)
        setCompleted(true)
      }
    } catch { /**/ }
  }, [])

  const setField = (field: keyof GratitudeEntry, value: string | number) => {
    setEntry(prev => ({ ...prev, [field]: value }))
  }

  const randomAffirmation = () => {
    const a = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
    setField('affirmation', a)
  }

  const complete = () => {
    const toSave: GratitudeEntry = { ...entry, completedAt: new Date().toISOString() }
    const others = logs.filter(l => l.date !== today)
    const updated = [toSave, ...others].sort((a, b) => b.date.localeCompare(a.date))
    setLogs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setEntry(toSave)
    setCompleted(true)
    toastSuccess('Practice complete!', 'Your mindset is set for today.')
  }

  const streak = calcStreak(logs)
  const longestStreak = calcLongestStreak(logs)
  const avgMood = logs.length > 0
    ? (logs.reduce((s, l) => s + l.mood, 0) / logs.length).toFixed(1)
    : '—'

  const wordCloud = buildWordCloud(logs)
  const maxCount = wordCloud[0]?.count ?? 1
  const recent5 = logs.filter(l => l.date !== today).slice(0, 5)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-amber-400" />
            Morning Gratitude
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">5 minutes to set your mindset for the day.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="flex justify-center mb-1"><Sparkles className="w-4 h-4 text-amber-400" /></div>
          <div className="text-xl font-bold text-white">{logs.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="flex justify-center mb-1"><TrendingUp className="w-4 h-4 text-green-400" /></div>
          <div className="text-xl font-bold text-white">{avgMood}</div>
          <div className="text-xs text-slate-500">Avg Mood</div>
        </div>
        <div className="game-card p-3">
          <div className="flex justify-center mb-1"><Award className="w-4 h-4 text-violet-400" /></div>
          <div className="text-xl font-bold text-white">{longestStreak}</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
      </div>

      {/* Completion banner */}
      {completed && (
        <div className="rounded-xl px-4 py-3 text-center font-semibold text-amber-200 border border-amber-500/40" style={{ background: 'linear-gradient(135deg, #92400e40, #78350f40)' }}>
          ✨ Practice complete! Your mindset is set for today.
        </div>
      )}

      {/* Today's practice */}
      <div className="game-card p-5 space-y-5 border border-amber-500/20">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          Today's Practice — {formatDate(today)}
        </h3>

        {PROMPTS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs text-amber-300/80 font-medium block">{label}</label>
            <textarea
              value={entry[key]}
              onChange={e => setField(key, e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="game-input w-full resize-none text-sm"
            />
          </div>
        ))}

        {/* Affirmation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-amber-300/80 font-medium">Today's affirmation</label>
            <button
              onClick={randomAffirmation}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Random
            </button>
          </div>
          <input
            value={entry.affirmation}
            onChange={e => setField('affirmation', e.target.value)}
            placeholder="I am..."
            className="game-input w-full text-sm"
          />
        </div>

        {/* Mood picker */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">How do you feel right now?</label>
          <div className="flex gap-3">
            {([1, 2, 3, 4, 5] as const).map(n => (
              <button
                key={n}
                onClick={() => setField('mood', n)}
                className={`text-2xl transition-transform hover:scale-125 ${entry.mood === n ? 'scale-125' : 'opacity-40'}`}
              >
                {MOOD_EMOJIS[n]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={complete}
          className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold transition-colors"
        >
          <Target className="w-4 h-4" />
          {completed ? 'Update Practice' : 'Complete Practice'}
        </button>
      </div>

      {/* Word cloud */}
      {wordCloud.length > 0 && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Gratitude Cloud
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            {wordCloud.map(({ word, count }) => {
              const scale = 0.7 + (count / maxCount) * 1.1
              const opacity = 0.5 + (count / maxCount) * 0.5
              return (
                <span
                  key={word}
                  className="text-amber-300 font-medium capitalize"
                  style={{ fontSize: `${scale}rem`, opacity }}
                  title={`${count} time${count !== 1 ? 's' : ''}`}
                >
                  {word}
                </span>
              )
            })}
          </div>
          <p className="text-xs text-slate-600 mt-3">Top words from your gratitude entries</p>
        </div>
      )}

      {/* Recent entries */}
      {recent5.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Sessions</h3>
          {recent5.map(log => {
            const isOpen = expandedId === log.id
            return (
              <div key={log.id} className="game-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : log.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{MOOD_EMOJIS[log.mood]}</span>
                    <div>
                      <span className="text-sm font-semibold text-white">{formatDate(log.date)}</span>
                      {log.prompt1 && (
                        <p className="text-xs text-slate-500 truncate max-w-[220px]">{log.prompt1}</p>
                      )}
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  }
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
                    {PROMPTS.map(({ key, label }) => (
                      log[key] ? (
                        <div key={key}>
                          <p className="text-xs text-amber-300/70 font-medium mb-0.5">{label}</p>
                          <p className="text-sm text-slate-300">{log[key]}</p>
                        </div>
                      ) : null
                    ))}
                    {log.affirmation && (
                      <div>
                        <p className="text-xs text-amber-300/70 font-medium mb-0.5">Affirmation</p>
                        <p className="text-sm text-slate-300 italic">"{log.affirmation}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {logs.length === 0 && !completed && (
        <div className="text-center py-12 text-slate-500">
          <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start your day with intention. Complete your first morning practice above.</p>
        </div>
      )}
    </div>
  )
}
