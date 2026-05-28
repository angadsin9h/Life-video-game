import { useState, useCallback } from 'react'
import { Star, Plus, Trash2, Calendar, Target, Check, X, Sparkles, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Interfaces ────────────────────────────────────────────────────────────────

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'
type Alignment = 'yes' | 'no' | 'maybe'

interface WeeklyReflection {
  id: string
  date: string
  text: string
}

interface ProgressNote {
  id: string
  date: string
  aligning: string
  notAligning: string
}

interface Theme {
  id: string
  year: number
  quarter: Quarter
  word: string
  description: string
  emoji: string
  weeklyReflections: WeeklyReflection[]
  progressNotes: ProgressNote[]
  active: boolean
  createdAt: string
}

interface DailyAlignment {
  [date: string]: Alignment
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

const THEMES_KEY = 'life_themes'

function loadThemes(): Theme[] {
  try {
    const raw = localStorage.getItem(THEMES_KEY)
    if (raw) return JSON.parse(raw) as Theme[]
  } catch {}
  return []
}

function saveThemes(themes: Theme[]): void {
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes))
}

function loadDailyAlignment(date: string): Alignment | null {
  try {
    const raw = localStorage.getItem(`life_theme_daily_${date}`)
    if (raw) return JSON.parse(raw) as Alignment
  } catch {}
  return null
}

function saveDailyAlignment(date: string, value: Alignment): void {
  localStorage.setItem(`life_theme_daily_${date}`, JSON.stringify(value))
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function calcAlignmentScore(theme: Theme): { pct: number; total: number; yes: number } {
  if (!theme.active) return { pct: 0, total: 0, yes: 0 }

  // Scan from createdAt to today
  const start = new Date(theme.createdAt + 'T12:00:00')
  const end = new Date()
  let total = 0
  let yesCount = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dateStr = cur.toISOString().split('T')[0]
    const val = loadDailyAlignment(dateStr)
    if (val !== null) {
      total++
      if (val === 'yes') yesCount++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return { pct: total > 0 ? Math.round((yesCount / total) * 100) : 0, total, yes: yesCount }
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4', 'Annual']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const ALIGNMENT_OPTIONS: { value: Alignment; label: string; color: string; bg: string }[] = [
  { value: 'yes', label: 'Yes, aligned', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40' },
  { value: 'maybe', label: 'Sort of', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40' },
  { value: 'no', label: 'Not really', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' },
]

const EMOJI_OPTIONS = ['🎯', '🌟', '🔥', '💡', '🚀', '🌱', '💎', '⚡', '🦁', '🌊', '🧠', '✨', '🎨', '📚', '🌅']

// ─── Sub-components ────────────────────────────────────────────────────────────

function AlignmentBadge({ value }: { value: Alignment }) {
  const opt = ALIGNMENT_OPTIONS.find(o => o.value === value)
  if (!opt) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${opt.bg} ${opt.color}`}>
      {value === 'yes' && <Check className="w-3 h-3" />}
      {value === 'no' && <X className="w-3 h-3" />}
      {value === 'maybe' && <RefreshCw className="w-3 h-3" />}
      {opt.label}
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function LifeTheme() {
  const { toastSuccess } = useToast()
  const [themes, setThemes] = useState<Theme[]>(() => loadThemes())
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'gallery'>('active')

  // Form state
  const [formYear, setFormYear] = useState(CURRENT_YEAR)
  const [formQuarter, setFormQuarter] = useState<Quarter>('Annual')
  const [formWord, setFormWord] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formEmoji, setFormEmoji] = useState('🎯')

  // Daily alignment
  const today = getToday()
  const [todayAlignment, setTodayAlignmentState] = useState<Alignment | null>(() => loadDailyAlignment(today))

  // Reflection form
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [reflectionDate, setReflectionDate] = useState(today)

  // Progress note form
  const [showProgress, setShowProgress] = useState(false)
  const [progressAligning, setProgressAligning] = useState('')
  const [progressNotAligning, setProgressNotAligning] = useState('')

  const persist = useCallback((next: Theme[]) => {
    setThemes(next)
    saveThemes(next)
  }, [])

  const activeTheme = themes.find(t => t.active) ?? null

  const createTheme = () => {
    if (!formWord.trim()) return

    // Deactivate all previous themes
    const updated = themes.map(t => ({ ...t, active: false }))
    const newTheme: Theme = {
      id: Date.now().toString(),
      year: formYear,
      quarter: formQuarter,
      word: formWord.trim(),
      description: formDesc.trim(),
      emoji: formEmoji,
      weeklyReflections: [],
      progressNotes: [],
      active: true,
      createdAt: today,
    }
    persist([newTheme, ...updated])
    setFormWord('')
    setFormDesc('')
    setFormEmoji('🎯')
    setFormQuarter('Annual')
    setFormYear(CURRENT_YEAR)
    setShowForm(false)
    toastSuccess('Theme set!', `"${newTheme.word}" is now your active theme.`)
  }

  const deleteTheme = (id: string) => {
    const theme = themes.find(t => t.id === id)
    persist(themes.filter(t => t.id !== id))
    toastSuccess('Theme removed', theme?.word)
  }

  const setAlignment = (value: Alignment) => {
    saveDailyAlignment(today, value)
    setTodayAlignmentState(value)
    toastSuccess('Alignment logged!', `Marked as "${value}" for today.`)
  }

  const addWeeklyReflection = () => {
    if (!reflectionText.trim() || !activeTheme) return
    const entry: WeeklyReflection = {
      id: Date.now().toString(),
      date: reflectionDate,
      text: reflectionText.trim(),
    }
    persist(
      themes.map(t =>
        t.id === activeTheme.id
          ? { ...t, weeklyReflections: [entry, ...t.weeklyReflections] }
          : t
      )
    )
    setReflectionText('')
    setReflectionDate(today)
    setShowReflection(false)
    toastSuccess('Reflection saved!')
  }

  const deleteReflection = (themeId: string, refId: string) => {
    persist(
      themes.map(t =>
        t.id === themeId
          ? { ...t, weeklyReflections: t.weeklyReflections.filter(r => r.id !== refId) }
          : t
      )
    )
  }

  const addProgressNote = () => {
    if ((!progressAligning.trim() && !progressNotAligning.trim()) || !activeTheme) return
    const note: ProgressNote = {
      id: Date.now().toString(),
      date: today,
      aligning: progressAligning.trim(),
      notAligning: progressNotAligning.trim(),
    }
    persist(
      themes.map(t =>
        t.id === activeTheme.id
          ? { ...t, progressNotes: [note, ...t.progressNotes] }
          : t
      )
    )
    setProgressAligning('')
    setProgressNotAligning('')
    setShowProgress(false)
    toastSuccess('Progress note added!')
  }

  const alignScore = activeTheme ? calcAlignmentScore(activeTheme) : null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Life Theme
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set an intention. Live by a word. Shape your year.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Theme'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/30">
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Create New Theme</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Year</label>
              <select
                className="game-input w-full"
                value={formYear}
                onChange={e => setFormYear(Number(e.target.value))}
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Period</label>
              <select
                className="game-input w-full"
                value={formQuarter}
                onChange={e => setFormQuarter(e.target.value as Quarter)}
              >
                {QUARTERS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Theme Word or Phrase</label>
            <input
              className="game-input w-full"
              placeholder="e.g. Year of Focus, Quarter of Connection, Clarity..."
              value={formWord}
              onChange={e => setFormWord(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Intention / Description</label>
            <textarea
              className="game-input w-full resize-none"
              rows={3}
              placeholder="What does this theme mean to you? What do you intend to embody?"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setFormEmoji(e)}
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                  style={{
                    background: formEmoji === e ? '#ca8a04' : '#1e293b',
                    border: formEmoji === e ? '2px solid #eab308' : '2px solid transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={createTheme}
            disabled={!formWord.trim()}
            className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4 inline mr-1.5" />
            Set as Active Theme
          </button>
        </div>
      )}

      {/* Tabs */}
      {themes.length > 0 && (
        <div className="flex gap-2">
          {(['active', 'gallery'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
              style={
                activeTab === tab
                  ? { background: '#854d0e', color: '#fef3c7' }
                  : { background: '#1e293b', color: '#94a3b8' }
              }
            >
              {tab === 'active' ? 'Active Theme' : 'Theme Gallery'}
            </button>
          ))}
        </div>
      )}

      {/* ── ACTIVE THEME TAB ── */}
      {activeTab === 'active' && (
        <>
          {activeTheme ? (
            <div className="space-y-5">
              {/* Hero card */}
              <div className="game-card p-6 border border-yellow-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-[120px] opacity-5 leading-none select-none pointer-events-none">
                  {activeTheme.emoji}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{activeTheme.emoji}</span>
                    <div>
                      <div className="text-xs text-yellow-500 font-semibold uppercase tracking-wider">
                        {activeTheme.quarter === 'Annual' ? activeTheme.year : `${activeTheme.year} ${activeTheme.quarter}`}
                      </div>
                      <h2
                        className="text-3xl font-bold text-white"
                        style={{ fontFamily: 'Orbitron, monospace' }}
                      >
                        {activeTheme.word}
                      </h2>
                    </div>
                  </div>
                  {activeTheme.description && (
                    <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                      {activeTheme.description}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 mt-3">
                    Active since {formatDate(activeTheme.createdAt)}
                  </div>
                </div>
              </div>

              {/* Alignment score */}
              {alignScore && (
                <div className="game-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Target className="w-4 h-4 text-yellow-400" />
                      Alignment Score
                    </h3>
                    <span className="text-2xl font-bold text-yellow-400">{alignScore.pct}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all"
                      style={{ width: `${alignScore.pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    {alignScore.yes} "yes" days out of {alignScore.total} checked ({alignScore.total === 0 ? 'No days checked yet' : ''})
                  </div>
                </div>
              )}

              {/* Daily alignment check */}
              <div className="game-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Today's Alignment Check
                </h3>
                <p className="text-slate-400 text-sm">
                  Did today align with your theme: <span className="text-yellow-300 font-semibold">{activeTheme.word}</span>?
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALIGNMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAlignment(opt.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${opt.bg} ${opt.color}`}
                      style={
                        todayAlignment === opt.value
                          ? { opacity: 1, transform: 'scale(1.04)' }
                          : { opacity: 0.55 }
                      }
                    >
                      {opt.value === 'yes' && <Check className="w-4 h-4" />}
                      {opt.value === 'no' && <X className="w-4 h-4" />}
                      {opt.value === 'maybe' && <RefreshCw className="w-4 h-4" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {todayAlignment && (
                  <div className="text-xs text-slate-500">
                    Today's response: <AlignmentBadge value={todayAlignment} />
                  </div>
                )}
              </div>

              {/* Weekly reflection */}
              <div className="game-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Weekly Reflections
                  </h3>
                  <button
                    onClick={() => setShowReflection(v => !v)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    {showReflection ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {showReflection ? 'Cancel' : 'Add Reflection'}
                  </button>
                </div>

                {showReflection && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Date</label>
                      <input
                        type="date"
                        className="game-input"
                        value={reflectionDate}
                        max={today}
                        onChange={e => setReflectionDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Reflection</label>
                      <textarea
                        className="game-input w-full resize-none"
                        rows={3}
                        placeholder="How did this week feel in relation to your theme? What stood out?"
                        value={reflectionText}
                        onChange={e => setReflectionText(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={addWeeklyReflection}
                      disabled={!reflectionText.trim()}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Save Reflection
                    </button>
                  </div>
                )}

                {activeTheme.weeklyReflections.length === 0 && !showReflection && (
                  <p className="text-slate-600 text-sm">No reflections yet. Add one to track your journey.</p>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {activeTheme.weeklyReflections.map(ref => (
                    <div key={ref.id} className="bg-slate-800/60 rounded-xl p-3 group">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">{formatDate(ref.date)}</div>
                          <p className="text-slate-300 text-sm leading-relaxed">{ref.text}</p>
                        </div>
                        <button
                          onClick={() => deleteReflection(activeTheme.id, ref.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress notes */}
              <div className="game-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Progress Notes
                  </h3>
                  <button
                    onClick={() => setShowProgress(v => !v)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    {showProgress ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {showProgress ? 'Cancel' : 'Add Note'}
                  </button>
                </div>

                {showProgress && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs text-green-400 mb-1 block">What's aligning with your theme?</label>
                      <textarea
                        className="game-input w-full resize-none"
                        rows={2}
                        placeholder="Things going well, actions that feel on-theme..."
                        value={progressAligning}
                        onChange={e => setProgressAligning(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-red-400 mb-1 block">What's not aligning?</label>
                      <textarea
                        className="game-input w-full resize-none"
                        rows={2}
                        placeholder="Patterns, habits, or situations drifting from your theme..."
                        value={progressNotAligning}
                        onChange={e => setProgressNotAligning(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={addProgressNote}
                      disabled={!progressAligning.trim() && !progressNotAligning.trim()}
                      className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Save Progress Note
                    </button>
                  </div>
                )}

                {activeTheme.progressNotes.length === 0 && !showProgress && (
                  <p className="text-slate-600 text-sm">No progress notes yet. Track what's aligning and what isn't.</p>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {activeTheme.progressNotes.map(note => (
                    <div key={note.id} className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                      <div className="text-xs text-slate-500">{formatDate(note.date)}</div>
                      {note.aligning && (
                        <div className="flex gap-2">
                          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-slate-300 text-sm">{note.aligning}</p>
                        </div>
                      )}
                      {note.notAligning && (
                        <div className="flex gap-2">
                          <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-slate-300 text-sm">{note.notAligning}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Sparkles className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium mb-1">No active theme</p>
              <p className="text-sm mb-4">Set a theme to give your year or quarter a guiding intention.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1.5" />
                Create First Theme
              </button>
            </div>
          )}
        </>
      )}

      {/* ── GALLERY TAB ── */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {themes.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Star className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p>No themes yet.</p>
            </div>
          )}
          {themes.map(theme => {
            const score = theme.active ? calcAlignmentScore(theme) : null
            const totalReflections = theme.weeklyReflections.length
            const totalNotes = theme.progressNotes.length
            return (
              <div
                key={theme.id}
                className="game-card p-5 relative"
                style={theme.active ? { borderLeft: '3px solid #eab308' } : {}}
              >
                {theme.active && (
                  <span className="absolute top-3 right-12 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Active
                  </span>
                )}
                <button
                  onClick={() => deleteTheme(theme.id)}
                  className="absolute top-3 right-3 p-1 text-slate-600 hover:text-red-400 transition-colors"
                  title="Delete theme"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">{theme.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                      {theme.quarter === 'Annual' ? theme.year : `${theme.year} ${theme.quarter}`}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{theme.word}</h3>
                    {theme.description && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{theme.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{totalReflections} reflection{totalReflections !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Target className="w-3.5 h-3.5 text-green-400" />
                        <span>{totalNotes} progress note{totalNotes !== 1 ? 's' : ''}</span>
                      </div>
                      {score && score.total > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                          <span>{score.pct}% aligned ({score.total} days checked)</span>
                        </div>
                      )}
                    </div>

                    {/* Alignment bar for active themes */}
                    {score && score.total > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full"
                            style={{ width: `${score.pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 mt-2">
                      Created {formatDate(theme.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Recent reflections preview */}
                {theme.weeklyReflections.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Latest Reflection</div>
                    <div className="bg-slate-800/60 rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">{formatDate(theme.weeklyReflections[0].date)}</div>
                      <p className="text-slate-300 text-sm line-clamp-2">{theme.weeklyReflections[0].text}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
