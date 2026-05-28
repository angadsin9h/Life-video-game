import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Save, CheckCircle, TrendingUp, Award, Calendar, Smile } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface WinEntry {
  id: string
  text: string
  category: 'health' | 'work' | 'relationships' | 'growth' | 'joy' | 'other'
  impact: 1 | 2 | 3
}

interface DailyWin {
  id: string
  date: string
  wins: WinEntry[]
  mood: 1 | 2 | 3 | 4 | 5
  gratitude: string
}

const STORAGE_KEY = 'daily_wins_log'

const CATEGORY_COLORS: Record<WinEntry['category'], string> = {
  health: '#22c55e',
  work: '#3b82f6',
  relationships: '#ec4899',
  growth: '#a855f7',
  joy: '#f59e0b',
  other: '#64748b',
}

const CATEGORY_LABELS: Record<WinEntry['category'], string> = {
  health: 'Health',
  work: 'Work',
  relationships: 'Relationships',
  growth: 'Growth',
  joy: 'Joy',
  other: 'Other',
}

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' }

const IMPACT_LABELS: Record<number, string> = { 1: 'Small', 2: 'Medium', 3: 'Big' }

const IMPACT_COLORS: Record<number, string> = {
  1: 'bg-slate-700 text-slate-400 border border-slate-600',
  2: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  3: 'bg-violet-500/20 text-violet-400 border border-violet-500/40',
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function shiftDay(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function calcStreak(logs: DailyWin[]): number {
  if (logs.length === 0) return 0
  const dateSet = new Set(logs.filter(l => l.wins.length > 0).map(l => l.date))
  let streak = 0
  let cur = todayStr()
  while (dateSet.has(cur)) {
    streak++
    cur = shiftDay(cur, -1)
  }
  // If today has no entry, check if yesterday does (streak from yesterday)
  if (streak === 0) {
    cur = shiftDay(todayStr(), -1)
    while (dateSet.has(cur)) {
      streak++
      cur = shiftDay(cur, -1)
    }
  }
  return streak
}

export default function DailyWinsLog() {
  const { toastSuccess } = useToast()
  const today = todayStr()

  const [logs, setLogs] = useState<DailyWin[]>([])
  const [todayEntry, setTodayEntry] = useState<DailyWin>({
    id: Date.now().toString(),
    date: today,
    wins: [],
    mood: 3,
    gratitude: '',
  })

  // New win form state
  const [winText, setWinText] = useState('')
  const [winCategory, setWinCategory] = useState<WinEntry['category']>('growth')
  const [winImpact, setWinImpact] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    try {
      const stored: DailyWin[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setLogs(stored)
      const existing = stored.find(l => l.date === today)
      if (existing) setTodayEntry(existing)
    } catch { /**/ }
  }, [])

  const persistLogs = (updated: DailyWin[]) => {
    setLogs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addWin = () => {
    if (!winText.trim()) return
    const entry: WinEntry = {
      id: Date.now().toString(),
      text: winText.trim(),
      category: winCategory,
      impact: winImpact,
    }
    setTodayEntry(prev => ({ ...prev, wins: [...prev.wins, entry] }))
    setWinText('')
    setWinCategory('growth')
    setWinImpact(1)
  }

  const removeWin = (id: string) => {
    setTodayEntry(prev => ({ ...prev, wins: prev.wins.filter(w => w.id !== id) }))
  }

  const saveToday = () => {
    const toSave = { ...todayEntry }
    const others = logs.filter(l => l.date !== today)
    persistLogs([toSave, ...others].sort((a, b) => b.date.localeCompare(a.date)))
    toastSuccess('Wins saved!', `${todayEntry.wins.length} win${todayEntry.wins.length !== 1 ? 's' : ''} logged for today`)
  }

  // Streak
  const streak = calcStreak(logs)

  // Stats
  const allWinCounts = logs.map(l => l.wins.length)
  const totalWins = allWinCounts.reduce((a, b) => a + b, 0)
  const avgPerDay = logs.length > 0 ? (totalWins / logs.length).toFixed(1) : '0'
  const bestDay = allWinCounts.length > 0 ? Math.max(...allWinCounts) : 0

  // Last 7 days mini calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => shiftDay(today, -(6 - i)))
  const logByDate = new Map(logs.map(l => [l.date, l]))

  function dayDotColor(date: string): string {
    // also consider todayEntry for today
    const entry = date === today ? todayEntry : logByDate.get(date)
    const count = entry ? entry.wins.length : 0
    if (count === 0) return '#334155'
    if (count === 1) return '#3b82f6'
    return '#22c55e'
  }

  // Recent 5 days (excluding today if not saved)
  const recentDays = logs.slice(0, 5)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Daily Wins Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture what went right today.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="flex justify-center mb-1"><TrendingUp className="w-4 h-4 text-green-400" /></div>
          <div className="text-xl font-bold text-white">{totalWins}</div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
        <div className="game-card p-3">
          <div className="flex justify-center mb-1"><CheckCircle className="w-4 h-4 text-blue-400" /></div>
          <div className="text-xl font-bold text-white">{avgPerDay}</div>
          <div className="text-xs text-slate-500">Avg / Day</div>
        </div>
        <div className="game-card p-3">
          <div className="flex justify-center mb-1"><Award className="w-4 h-4 text-yellow-400" /></div>
          <div className="text-xl font-bold text-white">{bestDay}</div>
          <div className="text-xs text-slate-500">Best Day</div>
        </div>
      </div>

      {/* 7-day mini calendar */}
      <div className="game-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last 7 Days</span>
        </div>
        <div className="flex justify-between">
          {last7Days.map(date => {
            const d = new Date(date + 'T12:00:00')
            const label = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
            const isToday = date === today
            return (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <span className={`text-xs ${isToday ? 'text-yellow-400 font-bold' : 'text-slate-500'}`}>{label}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dayDotColor(date) }}
                  title={date}
                />
                <span className="text-xs text-slate-600">{d.getDate()}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-3 justify-center">
          {[['#334155', 'No wins'], ['#3b82f6', '1 win'], ['#22c55e', '2+ wins']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's form */}
      <div className="game-card p-5 space-y-4 border border-yellow-500/20">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          Today's Wins — {formatDate(today)}
        </h3>

        {/* Add win input */}
        <div className="space-y-2">
          <input
            value={winText}
            onChange={e => setWinText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWin()}
            placeholder="What went well today?"
            className="game-input w-full"
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={winCategory}
              onChange={e => setWinCategory(e.target.value as WinEntry['category'])}
              className="game-input text-sm flex-1 min-w-[130px]"
            >
              {(Object.entries(CATEGORY_LABELS) as [WinEntry['category'], string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setWinImpact(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${winImpact === n ? IMPACT_COLORS[n] : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                >
                  {IMPACT_LABELS[n]}
                </button>
              ))}
            </div>
            <button
              onClick={addWin}
              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Added wins chips */}
        {todayEntry.wins.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {todayEntry.wins.map(w => (
              <div
                key={w.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: CATEGORY_COLORS[w.category] + '20', border: `1px solid ${CATEGORY_COLORS[w.category]}40`, color: CATEGORY_COLORS[w.category] }}
              >
                <span className="text-slate-200 font-medium">{w.text}</span>
                <span className="text-xs opacity-70">{CATEGORY_LABELS[w.category]} · {IMPACT_LABELS[w.impact]}</span>
                <button onClick={() => removeWin(w.id)} className="ml-1 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mood picker */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Smile className="w-4 h-4 text-slate-400" />
            <label className="text-xs text-slate-400">How's your mood?</label>
          </div>
          <div className="flex gap-3 justify-start">
            {([1, 2, 3, 4, 5] as const).map(n => (
              <button
                key={n}
                onClick={() => setTodayEntry(prev => ({ ...prev, mood: n }))}
                className={`text-2xl transition-transform hover:scale-125 ${todayEntry.mood === n ? 'scale-125' : 'opacity-40'}`}
              >
                {MOOD_EMOJIS[n]}
              </button>
            ))}
          </div>
        </div>

        {/* Gratitude */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">One sentence of gratitude</label>
          <textarea
            value={todayEntry.gratitude}
            onChange={e => setTodayEntry(prev => ({ ...prev, gratitude: e.target.value }))}
            placeholder="I'm grateful for..."
            rows={2}
            className="game-input w-full resize-none"
          />
        </div>

        {/* Save button */}
        <button
          onClick={saveToday}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Today's Wins
        </button>
      </div>

      {/* Recent days */}
      {recentDays.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Days</h3>
          {recentDays.map(log => (
            <div key={log.id} className="game-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{formatDate(log.date)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MOOD_EMOJIS[log.mood]}</span>
                  <span className="text-xs text-slate-500">{log.wins.length} win{log.wins.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {log.wins.length > 0 && (
                <ul className="space-y-1">
                  {log.wins.map(w => (
                    <li key={w.id} className="flex items-start gap-2 text-sm text-slate-300">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[w.category] }}
                      />
                      <span>{w.text}</span>
                      <span className="text-xs text-slate-500 ml-auto flex-shrink-0">{CATEGORY_LABELS[w.category]}</span>
                    </li>
                  ))}
                </ul>
              )}
              {log.gratitude && (
                <p className="text-xs text-slate-500 italic border-t border-slate-700 pt-2 mt-1">"{log.gratitude}"</p>
              )}
            </div>
          ))}
        </div>
      )}

      {logs.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Log your first win today. Every positive moment counts.</p>
        </div>
      )}
    </div>
  )
}
