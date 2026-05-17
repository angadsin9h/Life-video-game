import { useState, useEffect, useMemo } from 'react'
import { Pencil, Plus, Trash2, Edit2, Sparkles, RotateCcw, BookOpen, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface JournalEntry {
  id: string
  date: string
  title: string
  content: string
  mood: string
  wordCount: number
  createdAt: string
}

const MOODS = ['😊', '🤔', '😤', '😴', '🔥', '✨']

const WRITING_PROMPTS = [
  'Write about a door you wish you had opened sooner.',
  'Describe a color you have never been able to explain to anyone.',
  'A stranger hands you a folded note. What does it say?',
  'Write the last page of a book you will never finish.',
  'What would your ten-year-old self think of today?',
  'Describe the sound of a memory you keep returning to.',
  'You wake up speaking a language you do not recognize. What happens next?',
  'Write a letter to the city you grew up in.',
  'What is the kindest thing no one ever noticed you doing?',
  'Describe a meal that changed something in you.',
  'Write about a version of yourself that almost happened.',
  'What does your most honest silence sound like?',
  'Tell the story of something you lost that you never looked for.',
  'Describe a place that only exists in your imagination — in vivid detail.',
  'Write the conversation you keep rehearsing in your head.',
  'What would you do with one extra hour that no one else could see?',
  'Describe the texture of regret. Then describe the texture of relief.',
  'Write about a habit you have that you have never told anyone.',
  'What is the bravest small thing you have ever done?',
  'Write about a question you stopped asking and why.',
]

const STORAGE_KEY = 'creative_journal'
const GOAL_KEY = 'creative_journal_goal'

function loadEntries(): JournalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveEntries(entries: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0
  const dateSet = new Set(entries.map(e => e.date))
  let streak = 0
  const base = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (dateSet.has(ds)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export default function CreativeJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * WRITING_PROMPTS.length))
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem(GOAL_KEY)
    return saved ? parseInt(saved, 10) : 300
  })
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formMood, setFormMood] = useState('😊')
  const [formDate, setFormDate] = useState(today())

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  const formWordCount = countWords(formContent)

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date))
  }, [entries])

  // Stats
  const totalWords = entries.reduce((s, e) => s + e.wordCount, 0)
  const avgWords = entries.length > 0 ? Math.round(totalWords / entries.length) : 0
  const streak = computeStreak(entries)

  // Today's words for daily goal
  const todayStr = today()
  const todayWords = entries.filter(e => e.date === todayStr).reduce((s, e) => s + e.wordCount, 0)
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((todayWords / dailyGoal) * 100)) : 0

  const newPrompt = () => {
    setPromptIndex(i => {
      let next = Math.floor(Math.random() * WRITING_PROMPTS.length)
      if (next === i) next = (next + 1) % WRITING_PROMPTS.length
      return next
    })
  }

  const usePrompt = () => {
    setFormContent(prev => {
      const prompt = WRITING_PROMPTS[promptIndex]
      if (prev.trim() === '') return prompt + '\n\n'
      return prev + '\n\n' + prompt + '\n\n'
    })
  }

  const resetForm = () => {
    setFormTitle('')
    setFormContent('')
    setFormMood('😊')
    setFormDate(today())
    setEditingId(null)
    setShowForm(false)
  }

  const startNew = () => {
    setEditingId(null)
    setFormTitle('')
    setFormContent('')
    setFormMood('😊')
    setFormDate(today())
    setShowForm(true)
  }

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setFormTitle(entry.title)
    setFormContent(entry.content)
    setFormMood(entry.mood)
    setFormDate(entry.date)
    setShowForm(true)
    setExpandedId(null)
  }

  const submit = () => {
    if (!formContent.trim()) return
    const wc = countWords(formContent)

    if (editingId) {
      const updated = entries.map(e =>
        e.id === editingId
          ? { ...e, title: formTitle.trim(), content: formContent, mood: formMood, date: formDate, wordCount: wc }
          : e
      )
      saveEntries(updated)
      setEntries(updated)
      toastSuccess('Entry updated!')
    } else {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        date: formDate,
        title: formTitle.trim(),
        content: formContent,
        mood: formMood,
        wordCount: wc,
        createdAt: new Date().toISOString(),
      }
      const updated = [entry, ...entries]
      saveEntries(updated)
      setEntries(updated)
      toastSuccess('Entry saved!', `${wc} words written`)
    }
    resetForm()
  }

  const removeEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    saveEntries(updated)
    setEntries(updated)
    toastSuccess('Entry deleted')
  }

  const saveGoal = () => {
    const val = parseInt(goalInput, 10)
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val)
      localStorage.setItem(GOAL_KEY, String(val))
      toastSuccess('Daily goal updated!', `${val} words/day`)
    }
    setShowGoalEdit(false)
    setGoalInput('')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-white flex items-center gap-3"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Pencil className="w-8 h-8 text-violet-400" />
            Creative Journal
          </h1>
          <p className="text-slate-400 mt-1">Free-form expression — write without limits</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {entries.length}
          </div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
          </div>
          <div className="text-xs text-slate-500">Total Words</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400 flex items-center justify-center gap-1" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-4 h-4" />{streak}
          </div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgWords}
          </div>
          <div className="text-xs text-slate-500">Avg Words</div>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-slate-300">Daily Writing Goal</span>
          </div>
          <button
            onClick={() => { setShowGoalEdit(g => !g); setGoalInput(String(dailyGoal)) }}
            className="text-xs text-slate-500 hover:text-violet-400 transition-colors"
          >
            {showGoalEdit ? 'Cancel' : 'Edit goal'}
          </button>
        </div>

        {showGoalEdit ? (
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveGoal()}
              placeholder="Words per day"
              className="game-input flex-1 text-sm"
              min={1}
            />
            <button
              onClick={saveGoal}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{todayWords} / {dailyGoal} words today</span>
              <span className={goalPct >= 100 ? 'text-green-400 font-semibold' : 'text-slate-500'}>
                {goalPct >= 100 ? 'Goal reached!' : `${goalPct}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${goalPct}%`,
                  background: goalPct >= 100 ? '#22c55e' : 'linear-gradient(to right, #8b5cf6, #a78bfa)',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Writing Prompt */}
      <div className="game-card p-4 border border-violet-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-slate-300">Writing Prompt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={usePrompt}
              className="text-xs px-2 py-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 transition-colors"
            >
              Use prompt
            </button>
            <button
              onClick={newPrompt}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
              title="New prompt"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-300 italic leading-relaxed">
          "{WRITING_PROMPTS[promptIndex]}"
        </p>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200">
              {editingId ? 'Edit Entry' : 'New Entry'}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Date + mood row */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              max={today()}
              className="game-input text-sm"
            />
            <div className="flex gap-1">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setFormMood(m)}
                  className={`text-xl px-2 py-1 rounded-lg transition-all ${
                    formMood === m
                      ? 'bg-violet-600/30 ring-1 ring-violet-500/50 scale-110'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Title (optional)"
            className="game-input w-full text-sm"
          />

          {/* Content textarea */}
          <div className="relative">
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder="Write freely... no rules, no judgment. Let the words come."
              className="game-input w-full resize-none text-sm leading-relaxed"
              style={{ minHeight: '240px' }}
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500 select-none">
              {formWordCount} {formWordCount === 1 ? 'word' : 'words'}
              {formWordCount >= 100 && <span className="text-violet-400 ml-1">✨</span>}
              {formWordCount >= 500 && <span className="text-yellow-400 ml-1">🔥</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!formContent.trim()}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {editingId ? 'Update Entry' : 'Save Entry'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entry List */}
      <div className="space-y-3">
        {sorted.length === 0 && !showForm ? (
          <div className="text-center py-16 text-slate-500">
            <Pencil className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="mb-2">Your journal is empty.</p>
            <p className="text-xs text-slate-600">Use the prompt above or write freely — every word counts.</p>
            <button
              onClick={startNew}
              className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Write first entry
            </button>
          </div>
        ) : (
          sorted.map(entry => {
            const isExpanded = expandedId === entry.id
            return (
              <div key={entry.id} className="game-card p-4">
                {/* Entry header */}
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{entry.mood}</span>
                      <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{entry.wordCount} words</span>
                    </div>
                    {entry.title && (
                      <div className="text-sm font-semibold text-slate-200 mt-1">{entry.title}</div>
                    )}
                    {!isExpanded && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {entry.content.slice(0, 120)}{entry.content.length > 120 ? '…' : ''}
                      </p>
                    )}
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(entry)}
                      className="p-1.5 text-slate-600 hover:text-violet-400 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      Collapse ↑
                    </button>
                  </div>
                )}

                {/* Date badge bottom */}
                {!isExpanded && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-700">{formatDateShort(entry.date)}</span>
                    <button
                      onClick={() => setExpandedId(entry.id)}
                      className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      Read more ↓
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
