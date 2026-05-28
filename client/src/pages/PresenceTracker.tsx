import { useState, useEffect } from 'react'
import { Sun, Plus, X, Activity, BarChart3, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SenseEngaged =
  | 'Sight'
  | 'Sound'
  | 'Touch'
  | 'Taste'
  | 'Smell'
  | 'Multiple'
  | 'Inner sense'

type DistractionType =
  | 'None'
  | 'Phone'
  | 'Thoughts'
  | 'Future worry'
  | 'Past regret'
  | 'People'
  | 'Environment'
  | 'Pain/discomfort'

type PresenceQuality =
  | 'Absorbed'
  | 'Aware'
  | 'Neutral'
  | 'Distracted'
  | 'Checked out'

interface PresenceEntry {
  id: string
  activity: string
  presenceLevel: number
  mindWandering: number
  bodyAwareness: number
  senseEngaged: SenseEngaged
  distraction: DistractionType
  presenceQuality: PresenceQuality
  briefDescription: string
  presenceScore: number
  date: string
  createdAt: string
}

const SENSES: SenseEngaged[] = ['Sight', 'Sound', 'Touch', 'Taste', 'Smell', 'Multiple', 'Inner sense']
const DISTRACTIONS: DistractionType[] = [
  'None', 'Phone', 'Thoughts', 'Future worry', 'Past regret', 'People', 'Environment', 'Pain/discomfort',
]
const PRESENCE_QUALITIES: PresenceQuality[] = ['Absorbed', 'Aware', 'Neutral', 'Distracted', 'Checked out']

const STORAGE_KEY = 'presence_tracker_log'

const defaultForm = (): Omit<PresenceEntry, 'id' | 'createdAt' | 'presenceScore'> => ({
  activity: '',
  presenceLevel: 7,
  mindWandering: 7,
  bodyAwareness: 7,
  senseEngaged: 'Multiple',
  distraction: 'None',
  presenceQuality: 'Aware',
  briefDescription: '',
  date: new Date().toISOString().split('T')[0],
})

function calcScore(presenceLevel: number, mindWandering: number, bodyAwareness: number): number {
  return Math.round(((presenceLevel + mindWandering + bodyAwareness) / 3) * 10)
}

function getMostCommon<T extends string>(arr: T[]): T | null {
  if (!arr.length) return null
  const counts: Partial<Record<T, number>> = {}
  for (const v of arr) counts[v] = (counts[v] ?? 0) + 1
  return arr.reduce((a, b) => (counts[a] ?? 0) >= (counts[b] ?? 0) ? a : b)
}

function getTodayAvg(entries: PresenceEntry[]): number {
  const today = new Date().toISOString().split('T')[0]
  const todayEntries = entries.filter(e => e.date === today)
  if (!todayEntries.length) return 0
  return Math.round(todayEntries.reduce((s, e) => s + e.presenceScore, 0) / todayEntries.length)
}

function getLast7DaysDates(): string[] {
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

const QUALITY_COLORS: Record<PresenceQuality, string> = {
  'Absorbed': 'text-green-400 bg-green-900/30',
  'Aware': 'text-blue-400 bg-blue-900/30',
  'Neutral': 'text-slate-400 bg-slate-800/50',
  'Distracted': 'text-amber-400 bg-amber-900/30',
  'Checked out': 'text-red-400 bg-red-900/30',
}

export default function PresenceTracker() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PresenceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: PresenceEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.activity.trim()) return
    const entry: PresenceEntry = {
      id: Date.now().toString(),
      ...form,
      presenceScore: calcScore(form.presenceLevel, form.mindWandering, form.bodyAwareness),
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(defaultForm())
    setShowForm(false)
    toastSuccess('Presence logged — this moment is all there is.')
  }

  const todayAvg = getTodayAvg(entries)
  const topDistraction = getMostCommon(entries.map(e => e.distraction).filter(d => d !== 'None') as DistractionType[])
  const topActivity = getMostCommon(entries.map(e => e.activity.toLowerCase().trim().split(' ').slice(0, 2).join(' ')))

  const last7Dates = getLast7DaysDates()
  const trendData = last7Dates.map(date => {
    const dayEntries = entries.filter(e => e.date === date)
    if (!dayEntries.length) return null
    return Math.round(dayEntries.reduce((s, e) => s + e.presenceScore, 0) / dayEntries.length)
  })

  const last5 = entries.slice(0, 5)

  const liveScore = calcScore(form.presenceLevel, form.mindWandering, form.bodyAwareness)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-amber-400" />
            Presence Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track how present and mindful you are throughout the day.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{todayAvg || '—'}</div>
          <div className="text-xs text-slate-500">Today's Avg</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-sm font-semibold text-red-300 truncate">{topDistraction ?? '—'}</div>
          <div className="text-xs text-slate-500">Top Distraction</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-sm font-semibold text-blue-300 truncate capitalize">{topActivity ?? '—'}</div>
          <div className="text-xs text-slate-500">Best Activity</div>
        </div>
      </div>

      {/* 7-day trend */}
      <div className="game-card p-3">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-400">7-Day Presence Trend</span>
        </div>
        <div className="flex items-end gap-1.5 justify-between">
          {last7Dates.map((date, i) => {
            const score = trendData[i]
            const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)
            return (
              <div key={date} className="flex flex-col items-center gap-1 flex-1">
                <div
                  title={score !== null ? `${score}` : 'No data'}
                  className={`w-full rounded-full ${score !== null ? getScoreColor(score) : 'bg-slate-800'}`}
                  style={{ height: score !== null ? `${Math.max(8, score * 0.32)}px` : '8px' }}
                />
                <div className="text-xs text-slate-600">{dayLabel}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Log Presence Moment</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            value={form.activity}
            onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="What were you doing? *"
            className="game-input w-full text-sm"
            autoFocus
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">Presence Level: <span className="text-amber-300">{form.presenceLevel}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.presenceLevel}
              onChange={e => setForm(f => ({ ...f, presenceLevel: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400"
            />
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1">Mind Not Wandering: <span className="text-blue-300">{form.mindWandering}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.mindWandering}
              onChange={e => setForm(f => ({ ...f, mindWandering: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400"
            />
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1">Body Awareness: <span className="text-green-300">{form.bodyAwareness}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.bodyAwareness}
              onChange={e => setForm(f => ({ ...f, bodyAwareness: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400"
            />
          </div>

          <div className="game-card p-2 text-center">
            <span className="text-xs text-slate-500">Presence Score: </span>
            <span className="text-base font-bold text-amber-300">{liveScore}</span>
            <span className="text-xs text-slate-500">/100</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.senseEngaged}
              onChange={e => setForm(f => ({ ...f, senseEngaged: e.target.value as SenseEngaged }))}
              className="game-input text-sm"
            >
              {SENSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={form.distraction}
              onChange={e => setForm(f => ({ ...f, distraction: e.target.value as DistractionType }))}
              className="game-input text-sm"
            >
              {DISTRACTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <select
            value={form.presenceQuality}
            onChange={e => setForm(f => ({ ...f, presenceQuality: e.target.value as PresenceQuality }))}
            className="game-input w-full text-sm"
          >
            {PRESENCE_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          <input
            value={form.briefDescription}
            onChange={e => setForm(f => ({ ...f, briefDescription: e.target.value }))}
            placeholder="What did you notice when present?"
            className="game-input w-full text-sm"
          />

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
              Log Entry
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Last 5 entries */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Entries</h2>
        {last5.map(e => (
          <div key={e.id} className="game-card p-3 border-l-2 border-amber-500/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{e.activity}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${QUALITY_COLORS[e.presenceQuality]}`}>
                    {e.presenceQuality}
                  </span>
                  {e.distraction !== 'None' && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-900/30 text-red-300 rounded">{e.distraction}</span>
                  )}
                  <span className="text-xs text-slate-500">{e.senseEngaged}</span>
                  <span className="text-xs text-amber-300 font-semibold ml-auto">Score: {e.presenceScore}</span>
                </div>
                {e.briefDescription && (
                  <p className="text-xs text-slate-400 mt-1 truncate italic">"{e.briefDescription}"</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">{e.date}</div>
                <button
                  onClick={() => save(entries.filter(x => x.id !== e.id))}
                  className="text-slate-700 hover:text-red-400 mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The present moment is always available. Start noticing.</p>
          </div>
        )}
      </div>

      {entries.length > 5 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{entries.length - 5} more entries in history</span>
        </div>
      )}
    </div>
  )
}
