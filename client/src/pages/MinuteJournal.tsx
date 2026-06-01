import { useState, useEffect } from 'react'
import { BookOpen, Sun, Moon, RefreshCw, ChevronDown, ChevronUp, CheckCircle, Calendar, TrendingUp, Star, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'minute_journal_log'

interface MorningSection {
  grateful: string
  excited: string
  intention: string
  completedAt: string
}

interface EveningSection {
  highlight: string
  learned: string
  tomorrow: string
  completedAt: string
}

interface MinuteJournalEntry {
  id: string
  date: string
  morning: MorningSection
  evening: EveningSection
  streak: number
}

const emptyMorning = (): MorningSection => ({
  grateful: '',
  excited: '',
  intention: '',
  completedAt: '',
})

const emptyEvening = (): EveningSection => ({
  highlight: '',
  learned: '',
  tomorrow: '',
  completedAt: '',
})

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getNow(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function loadEntries(): MinuteJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MinuteJournalEntry[]
  } catch { /**/ }
  return []
}

function saveEntries(entries: MinuteJournalEntry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /**/ }
}

function computeStreak(entries: MinuteJournalEntry[]): number {
  const today = getToday()
  let streak = 0
  const d = new Date(today + 'T12:00:00')
  while (true) {
    const dateStr = d.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateStr)
    if (!entry || (!entry.morning.completedAt && !entry.evening.completedAt)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function getCalendarDays(entries: MinuteJournalEntry[]): { date: string; status: 'both' | 'one' | 'none' }[] {
  const days: { date: string; status: 'both' | 'one' | 'none' }[] = []
  const today = new Date(getToday() + 'T12:00:00')
  for (let i = 20; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateStr)
    const hasMorning = !!(entry?.morning.completedAt)
    const hasEvening = !!(entry?.evening.completedAt)
    let status: 'both' | 'one' | 'none' = 'none'
    if (hasMorning && hasEvening) status = 'both'
    else if (hasMorning || hasEvening) status = 'one'
    days.push({ date: dateStr, status })
  }
  return days
}

function getLast30Stats(entries: MinuteJournalEntry[]): {
  morningRate: number
  eveningRate: number
  bothRate: number
  longestStreak: number
} {
  const today = new Date(getToday() + 'T12:00:00')
  let morningCount = 0
  let eveningCount = 0
  let bothCount = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateStr)
    if (entry?.morning.completedAt) morningCount++
    if (entry?.evening.completedAt) eveningCount++
    if (entry?.morning.completedAt && entry?.evening.completedAt) bothCount++
  }

  // Compute longest streak
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  let longest = 0
  let current = 0
  let prevDate: string | null = null
  for (const entry of sorted) {
    const hasAny = !!(entry.morning.completedAt || entry.evening.completedAt)
    if (!hasAny) { current = 0; prevDate = null; continue }
    if (prevDate === null) {
      current = 1
    } else {
      const prev = new Date(prevDate + 'T12:00:00')
      const cur = new Date(entry.date + 'T12:00:00')
      prev.setDate(prev.getDate() - 1)
      if (prev.toISOString().split('T')[0] === entry.date) {
        current++
      } else {
        current = 1
      }
    }
    prevDate = entry.date
    if (current > longest) longest = current
  }

  return {
    morningRate: Math.round((morningCount / 30) * 100),
    eveningRate: Math.round((eveningCount / 30) * 100),
    bothRate: Math.round((bothCount / 30) * 100),
    longestStreak: longest,
  }
}

export default function MinuteJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MinuteJournalEntry[]>([])
  const [morning, setMorning] = useState<MorningSection>(emptyMorning())
  const [evening, setEvening] = useState<EveningSection>(emptyEvening())
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [reflection, setReflection] = useState<MinuteJournalEntry | null>(null)

  const today = getToday()

  useEffect(() => {
    const loaded = loadEntries()
    setEntries(loaded)
    const todayEntry = loaded.find(e => e.date === today)
    if (todayEntry) {
      setMorning(todayEntry.morning)
      setEvening(todayEntry.evening)
    }
  }, [today])

  const persist = (updated: MinuteJournalEntry[]) => {
    setEntries(updated)
    saveEntries(updated)
  }

  const saveMorning = () => {
    if (!morning.grateful.trim() && !morning.excited.trim() && !morning.intention.trim()) return
    const completedAt = getNow()
    const updatedMorning = { ...morning, completedAt }
    setMorning(updatedMorning)
    const streak = computeStreak(entries)
    const existing = entries.find(e => e.date === today)
    let updated: MinuteJournalEntry[]
    if (existing) {
      updated = entries.map(e => e.date === today ? { ...e, morning: updatedMorning, streak } : e)
    } else {
      const newEntry: MinuteJournalEntry = {
        id: Date.now().toString(),
        date: today,
        morning: updatedMorning,
        evening: emptyEvening(),
        streak,
      }
      updated = [newEntry, ...entries]
    }
    persist(updated)
    toastSuccess('Morning journal done! ☀️')
  }

  const saveEvening = () => {
    if (!evening.highlight.trim() && !evening.learned.trim() && !evening.tomorrow.trim()) return
    const completedAt = getNow()
    const updatedEvening = { ...evening, completedAt }
    setEvening(updatedEvening)
    const streak = computeStreak(entries)
    const existing = entries.find(e => e.date === today)
    let updated: MinuteJournalEntry[]
    if (existing) {
      updated = entries.map(e => e.date === today ? { ...e, evening: updatedEvening, streak } : e)
    } else {
      const newEntry: MinuteJournalEntry = {
        id: Date.now().toString(),
        date: today,
        morning: morning,
        evening: updatedEvening,
        streak,
      }
      updated = [newEntry, ...entries]
    }
    persist(updated)
    toastSuccess('Evening journal done! 🌙')
  }

  const pickReflection = () => {
    const past = entries.filter(e => e.date !== today)
    if (past.length === 0) return
    const random = past[Math.floor(Math.random() * past.length)]
    setReflection(random)
  }

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const todayEntry = entries.find(e => e.date === today)
  const hasMorning = !!(todayEntry?.morning.completedAt)
  const hasEvening = !!(todayEntry?.evening.completedAt)
  const streak = computeStreak(entries)
  const calendarDays = getCalendarDays(entries)
  const stats = getLast30Stats(entries)
  const recent7 = entries.slice(0, 7)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
              <BookOpen className="w-6 h-6" /> Minute Journal
            </h1>
            <p className="text-slate-400 text-sm mt-1">Consistency over perfection — 1 minute, twice a day</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-400 flex items-center gap-1 justify-end">
              <Zap className="w-5 h-5" />{streak}
            </div>
            <div className="text-xs text-slate-500">day streak</div>
          </div>
        </div>

        {/* Today's status */}
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-300">Today's Status</span>
            <span className="text-xs text-slate-500">{today}</span>
          </div>
          <div className="flex gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${hasMorning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700/60 text-slate-500'}`}>
              ☀️ Morning {hasMorning ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs">not done</span>}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${hasEvening ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-700/60 text-slate-500'}`}>
              🌙 Evening {hasEvening ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs">not done</span>}
            </div>
            {hasMorning && hasEvening && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-500/20 text-green-300 border border-green-500/30">
                <Star className="w-4 h-4" /> Both done!
              </div>
            )}
          </div>
        </div>

        {/* Today's journal — Morning & Evening side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Morning panel */}
          <div className="game-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-amber-300">Morning</span>
              {hasMorning && (
                <span className="ml-auto text-xs text-amber-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {todayEntry?.morning.completedAt}
                </span>
              )}
              {!hasMorning && <span className="ml-auto text-xs text-slate-500">Not done yet</span>}
            </div>
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="I am grateful for..."
              value={morning.grateful}
              onChange={e => setMorning(m => ({ ...m, grateful: e.target.value }))}
            />
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="I am excited about..."
              value={morning.excited}
              onChange={e => setMorning(m => ({ ...m, excited: e.target.value }))}
            />
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="My intention today is..."
              value={morning.intention}
              onChange={e => setMorning(m => ({ ...m, intention: e.target.value }))}
            />
            <button
              onClick={saveMorning}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold text-sm transition-colors"
            >
              ☀️ Save Morning
            </button>
          </div>

          {/* Evening panel */}
          <div className="game-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-indigo-300">Evening</span>
              {hasEvening && (
                <span className="ml-auto text-xs text-indigo-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {todayEntry?.evening.completedAt}
                </span>
              )}
              {!hasEvening && <span className="ml-auto text-xs text-slate-500">Not done yet</span>}
            </div>
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="Today's highlight was..."
              value={evening.highlight}
              onChange={e => setEvening(v => ({ ...v, highlight: e.target.value }))}
            />
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="Today I learned..."
              value={evening.learned}
              onChange={e => setEvening(v => ({ ...v, learned: e.target.value }))}
            />
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="Tomorrow I will..."
              value={evening.tomorrow}
              onChange={e => setEvening(v => ({ ...v, tomorrow: e.target.value }))}
            />
            <button
              onClick={saveEvening}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-colors"
            >
              🌙 Save Evening
            </button>
          </div>
        </div>

        {/* 21-day habit calendar */}
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-300 text-sm">21-Day Habit Calendar</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {calendarDays.map(day => (
              <div
                key={day.date}
                title={day.date}
                className={`w-full aspect-square rounded-md text-xs flex items-center justify-center font-semibold ${
                  day.status === 'both'
                    ? 'bg-green-500/70 text-green-100'
                    : day.status === 'one'
                    ? 'bg-yellow-500/60 text-yellow-100'
                    : 'bg-slate-700 text-slate-600'
                }`}
              >
                {new Date(day.date + 'T12:00:00').getDate()}
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/70 inline-block" /> Both done</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/60 inline-block" /> One done</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700 inline-block" /> Neither</div>
          </div>
        </div>

        {/* Consistency stats */}
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-300 text-sm">Consistency Stats (last 30 days)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.morningRate}%</div>
              <div className="text-xs text-slate-400 mt-1">☀️ Morning rate</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-indigo-400">{stats.eveningRate}%</div>
              <div className="text-xs text-slate-400 mt-1">🌙 Evening rate</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.bothRate}%</div>
              <div className="text-xs text-slate-400 mt-1">Both-done rate</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-violet-400">{stats.longestStreak}</div>
              <div className="text-xs text-slate-400 mt-1">Longest streak</div>
            </div>
          </div>
        </div>

        {/* Random reflection */}
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-violet-400" />
              <span className="font-semibold text-slate-300 text-sm">Random Reflection</span>
            </div>
            <button
              onClick={pickReflection}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-semibold transition-colors"
            >
              Pick Random
            </button>
          </div>
          {reflection ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-semibold">{reflection.date}</div>
              {reflection.morning.completedAt && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
                  <div className="text-xs font-semibold text-amber-400">☀️ Morning</div>
                  {reflection.morning.grateful && <p className="text-xs text-slate-300"><span className="text-slate-500">Grateful: </span>{reflection.morning.grateful}</p>}
                  {reflection.morning.excited && <p className="text-xs text-slate-300"><span className="text-slate-500">Excited: </span>{reflection.morning.excited}</p>}
                  {reflection.morning.intention && <p className="text-xs text-slate-300"><span className="text-slate-500">Intention: </span>{reflection.morning.intention}</p>}
                </div>
              )}
              {reflection.evening.completedAt && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 space-y-1.5">
                  <div className="text-xs font-semibold text-indigo-400">🌙 Evening</div>
                  {reflection.evening.highlight && <p className="text-xs text-slate-300"><span className="text-slate-500">Highlight: </span>{reflection.evening.highlight}</p>}
                  {reflection.evening.learned && <p className="text-xs text-slate-300"><span className="text-slate-500">Learned: </span>{reflection.evening.learned}</p>}
                  {reflection.evening.tomorrow && <p className="text-xs text-slate-300"><span className="text-slate-500">Tomorrow: </span>{reflection.evening.tomorrow}</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-2">
              {entries.filter(e => e.date !== today).length === 0
                ? 'No past entries yet. Start journaling!'
                : 'Click "Pick Random" to revisit a past entry'}
            </p>
          )}
        </div>

        {/* Recent entries */}
        {recent7.length > 0 && (
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-300 text-sm">Recent Entries</span>
            </div>
            <div className="space-y-2">
              {recent7.map(entry => {
                const isExpanded = expandedEntries.has(entry.id)
                const hasMorn = !!entry.morning.completedAt
                const hasEve = !!entry.evening.completedAt
                return (
                  <div key={entry.id} className="border border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleEntry(entry.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{entry.date}</span>
                        <span className={`text-sm ${hasMorn ? 'opacity-100' : 'opacity-30'}`}>☀️</span>
                        <span className={`text-sm ${hasEve ? 'opacity-100' : 'opacity-30'}`}>🌙</span>
                        {hasMorn && hasEve && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complete</span>}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
                        {hasMorn && (
                          <div className="space-y-1.5">
                            <div className="text-xs font-semibold text-amber-400">☀️ Morning ({entry.morning.completedAt})</div>
                            {entry.morning.grateful && <p className="text-xs text-slate-300"><span className="text-slate-500">Grateful: </span>{entry.morning.grateful}</p>}
                            {entry.morning.excited && <p className="text-xs text-slate-300"><span className="text-slate-500">Excited: </span>{entry.morning.excited}</p>}
                            {entry.morning.intention && <p className="text-xs text-slate-300"><span className="text-slate-500">Intention: </span>{entry.morning.intention}</p>}
                          </div>
                        )}
                        {hasEve && (
                          <div className="space-y-1.5">
                            <div className="text-xs font-semibold text-indigo-400">🌙 Evening ({entry.evening.completedAt})</div>
                            {entry.evening.highlight && <p className="text-xs text-slate-300"><span className="text-slate-500">Highlight: </span>{entry.evening.highlight}</p>}
                            {entry.evening.learned && <p className="text-xs text-slate-300"><span className="text-slate-500">Learned: </span>{entry.evening.learned}</p>}
                            {entry.evening.tomorrow && <p className="text-xs text-slate-300"><span className="text-slate-500">Tomorrow: </span>{entry.evening.tomorrow}</p>}
                          </div>
                        )}
                        {!hasMorn && !hasEve && (
                          <p className="text-xs text-slate-500 italic">No entries recorded for this day.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
