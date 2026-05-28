import { useState, useEffect } from 'react'
import { Sun, Plus, Clock, Flame, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PracticeType =
  | 'Prayer' | 'Meditation' | 'Gratitude' | 'Scripture/Reading' | 'Nature'
  | 'Service' | 'Ceremony' | 'Journaling' | 'Contemplation' | 'Community'
  | 'Silence' | 'Fasting' | 'Other'

type Feeling =
  | 'Connected' | 'Peaceful' | 'Expanded' | 'Grateful' | 'Humbled' | 'Joyful'
  | 'Confused' | 'Challenged' | 'Dry' | 'Renewed' | 'Overwhelmed' | 'Clear'

interface SpiritualEntry {
  id: string
  practiceType: PracticeType
  tradition: string
  duration: number
  depth: number
  presence: number
  insight: string
  feeling: Feeling
  synchronicity: string
  prayerOrIntention: string
  spiritualScore: number
  date: string
  createdAt: string
}

const STORAGE_KEY = 'spiritual_log'

const PRACTICE_TYPES: PracticeType[] = [
  'Prayer', 'Meditation', 'Gratitude', 'Scripture/Reading', 'Nature',
  'Service', 'Ceremony', 'Journaling', 'Contemplation', 'Community',
  'Silence', 'Fasting', 'Other',
]

const FEELINGS: Feeling[] = [
  'Connected', 'Peaceful', 'Expanded', 'Grateful', 'Humbled', 'Joyful',
  'Confused', 'Challenged', 'Dry', 'Renewed', 'Overwhelmed', 'Clear',
]

const PRACTICE_EMOJIS: Record<PracticeType, string> = {
  'Prayer':           '🙏',
  'Meditation':       '🧘',
  'Gratitude':        '🌟',
  'Scripture/Reading':'📖',
  'Nature':           '🌿',
  'Service':          '🤲',
  'Ceremony':         '🕯️',
  'Journaling':       '📝',
  'Contemplation':    '🌌',
  'Community':        '👥',
  'Silence':          '🤫',
  'Fasting':          '⚡',
  'Other':            '✨',
}

const FEELING_COLORS: Record<Feeling, string> = {
  Connected:   '#22c55e',
  Peaceful:    '#3b82f6',
  Expanded:    '#8b5cf6',
  Grateful:    '#f59e0b',
  Humbled:     '#94a3b8',
  Joyful:      '#eab308',
  Confused:    '#f97316',
  Challenged:  '#ef4444',
  Dry:         '#64748b',
  Renewed:     '#10b981',
  Overwhelmed: '#dc2626',
  Clear:       '#06b6d4',
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getStreak(entries: SpiritualEntry[]): number {
  if (entries.length === 0) return 0
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (entries.some(e => e.date === ds)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function daysAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff}d ago`
  } catch {
    return '?'
  }
}

export default function SpiritualLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SpiritualEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SpiritualEntry, 'id' | 'createdAt' | 'spiritualScore'>>({
    practiceType: 'Meditation',
    tradition: '',
    duration: 20,
    depth: 7,
    presence: 7,
    insight: '',
    feeling: 'Peaceful',
    synchronicity: '',
    prayerOrIntention: '',
    date: todayStr(),
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (e: SpiritualEntry[]) => {
    setEntries(e)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(e))
  }

  const submit = () => {
    const spiritualScore = Math.round(((form.depth + form.presence) / 2) * 10)
    const entry: SpiritualEntry = {
      id: Date.now().toString(),
      ...form,
      spiritualScore,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(f => ({ ...f, insight: '', synchronicity: '', prayerOrIntention: '', tradition: '' }))
    setShowForm(false)
    toastSuccess('Spiritual practice logged — the unseen shapes the seen.')
  }

  const streak = getStreak(entries)
  const totalMinutes = entries.reduce((s, e) => s + e.duration, 0)

  const last7 = entries.filter(e => {
    const d = new Date(e.date)
    const diff = (new Date().getTime() - d.getTime()) / 86400000
    return diff <= 7
  })
  const avgDepth7 = last7.length ? (last7.reduce((s, e) => s + e.depth, 0) / last7.length).toFixed(1) : '—'
  const avgPresence7 = last7.length ? (last7.reduce((s, e) => s + e.presence, 0) / last7.length).toFixed(1) : '—'

  // Practice type breakdown
  const typeCounts: Partial<Record<PracticeType, number>> = {}
  for (const e of entries) {
    typeCounts[e.practiceType] = (typeCounts[e.practiceType] ?? 0) + 1
  }
  const maxCount = Math.max(...Object.values(typeCounts).map(v => v ?? 0), 1)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-violet-400" />
            Spiritual Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track practices, experiences and growth across any path.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgDepth7}</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgPresence7}</div>
          <div className="text-xs text-slate-500">Avg Presence</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{totalMinutes}</div>
          <div className="text-xs text-slate-500">Total Mins</div>
        </div>
      </div>

      {/* Practice type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="game-card p-4">
          <h2 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Practice Breakdown</h2>
          <div className="space-y-2">
            {(Object.entries(typeCounts) as [PracticeType, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-base w-6">{PRACTICE_EMOJIS[type]}</span>
                  <span className="text-xs text-slate-300 w-32 truncate">{type}</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-violet-500 rounded-full"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Spiritual Practice</h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.practiceType}
              onChange={e => setForm(f => ({ ...f, practiceType: e.target.value as PracticeType }))}
              className="game-input text-sm"
            >
              {PRACTICE_TYPES.map(t => <option key={t} value={t}>{PRACTICE_EMOJIS[t]} {t}</option>)}
            </select>
            <select
              value={form.feeling}
              onChange={e => setForm(f => ({ ...f, feeling: e.target.value as Feeling }))}
              className="game-input text-sm"
            >
              {FEELINGS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.tradition}
              onChange={e => setForm(f => ({ ...f, tradition: e.target.value }))}
              placeholder="Tradition / path (optional)"
              className="game-input text-sm"
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Duration: {form.duration} min
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full accent-violet-400 h-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Depth: {form.depth}/10
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.depth}
                onChange={e => setForm(f => ({ ...f, depth: Number(e.target.value) }))}
                className="w-full accent-violet-400 h-1"
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" /> Presence: {form.presence}/10
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.presence}
                onChange={e => setForm(f => ({ ...f, presence: Number(e.target.value) }))}
                className="w-full accent-blue-400 h-1"
              />
            </div>
          </div>
          <div className="text-xs text-violet-400 text-center">
            Spiritual Score: {Math.round(((form.depth + form.presence) / 2) * 10)}/100
          </div>
          <textarea
            value={form.insight}
            onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="What came through? (insight, revelation, feeling)"
            className="game-input w-full text-sm resize-none h-20"
          />
          <input
            value={form.prayerOrIntention}
            onChange={e => setForm(f => ({ ...f, prayerOrIntention: e.target.value }))}
            placeholder="Prayer or intention set"
            className="game-input w-full text-sm"
          />
          <input
            value={form.synchronicity}
            onChange={e => setForm(f => ({ ...f, synchronicity: e.target.value }))}
            placeholder="Any meaningful coincidences or signs?"
            className="game-input w-full text-sm"
          />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Last 5 entries */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Recent Practices</h2>
          <div className="space-y-3">
            {entries.slice(0, 5).map(e => {
              const feelingColor = FEELING_COLORS[e.feeling]
              return (
                <div key={e.id} className="game-card p-3 border-l-4" style={{ borderLeftColor: feelingColor }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{PRACTICE_EMOJIS[e.practiceType]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">{e.practiceType}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: feelingColor + '22', color: feelingColor }}
                        >
                          {e.feeling}
                        </span>
                        <span className="text-xs text-slate-500">{e.duration}min</span>
                        <span className="text-xs text-slate-500">{daysAgo(e.date)}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        <span>Depth {e.depth}/10</span>
                        <span>Presence {e.presence}/10</span>
                        <span className="text-violet-400">Score {e.spiritualScore}</span>
                      </div>
                      {e.insight && (
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 italic">"{e.insight}"</p>
                      )}
                      {e.synchronicity && (
                        <p className="text-xs text-amber-300/70 mt-0.5 line-clamp-1">✨ {e.synchronicity}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Sun className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">The spiritual life is not about perfection. It is about connection.</p>
        </div>
      )}
    </div>
  )
}
