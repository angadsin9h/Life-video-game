import { useState, useEffect } from 'react'
import { Brain, Plus, X, Flame, Shield, Target, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ResponseType =
  | 'Stayed Calm'
  | 'Pushed Through'
  | 'Asked for Help'
  | 'Adapted Plan'
  | 'Accepted & Let Go'
  | 'Reframed'
  | 'Used Routine'
  | 'Breathed Through It'
  | 'Failed but Learned'
  | 'Froze'

type StrengthType =
  | 'Focus'
  | 'Resilience'
  | 'Confidence'
  | 'Discipline'
  | 'Emotional Control'
  | 'Optimism'
  | 'Toughness'
  | 'Adaptability'
  | 'Courage'
  | 'Persistence'

interface MentalStrengthEntry {
  id: string
  situation: string
  pressureLevel: number
  responseType: ResponseType
  whatYouToldYourself: string
  physicalSensations: string
  howItResolved: string
  mentalStrengthUsed: StrengthType
  lessonForNextTime: string
  strengthRating: number
  mentalScore: number
  date: string
  createdAt: string
}

const RESPONSE_TYPES: ResponseType[] = [
  'Stayed Calm', 'Pushed Through', 'Asked for Help', 'Adapted Plan',
  'Accepted & Let Go', 'Reframed', 'Used Routine', 'Breathed Through It',
  'Failed but Learned', 'Froze',
]

const STRENGTH_TYPES: StrengthType[] = [
  'Focus', 'Resilience', 'Confidence', 'Discipline', 'Emotional Control',
  'Optimism', 'Toughness', 'Adaptability', 'Courage', 'Persistence',
]

const STORAGE_KEY = 'mental_strength_log'

const defaultForm = (): Omit<MentalStrengthEntry, 'id' | 'createdAt' | 'mentalScore'> => ({
  situation: '',
  pressureLevel: 5,
  responseType: 'Stayed Calm',
  whatYouToldYourself: '',
  physicalSensations: '',
  howItResolved: '',
  mentalStrengthUsed: 'Resilience',
  lessonForNextTime: '',
  strengthRating: 7,
  date: new Date().toISOString().split('T')[0],
})

function getMostCommon<T extends string>(arr: T[]): T | null {
  if (!arr.length) return null
  const counts: Partial<Record<T, number>> = {}
  for (const v of arr) counts[v] = (counts[v] ?? 0) + 1
  return arr.reduce((a, b) => (counts[a] ?? 0) >= (counts[b] ?? 0) ? a : b)
}

function getStreak(entries: MentalStrengthEntry[]): number {
  if (!entries.length) return 0
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let current = today
  for (const d of dates) {
    if (d === current) {
      streak++
      const prev = new Date(current)
      prev.setDate(prev.getDate() - 1)
      current = prev.toISOString().split('T')[0]
    } else {
      break
    }
  }
  return streak
}

export default function MentalStrengthLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MentalStrengthEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: MentalStrengthEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.situation.trim()) return
    const entry: MentalStrengthEntry = {
      id: Date.now().toString(),
      ...form,
      mentalScore: form.strengthRating * 10,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(defaultForm())
    setShowForm(false)
    toastSuccess('Mental strength logged — pressure builds diamonds.')
  }

  const streak = getStreak(entries)
  const avgRating = entries.length
    ? Math.round((entries.reduce((s, e) => s + e.strengthRating, 0) / entries.length) * 10) / 10
    : 0
  const topResponse = getMostCommon(entries.map(e => e.responseType))
  const topStrength = getMostCommon(entries.map(e => e.mentalStrengthUsed))
  const last7 = entries.slice(0, 7)

  const pressureColor = (p: number) =>
    p >= 8 ? 'text-red-400' : p >= 5 ? 'text-amber-400' : 'text-green-400'

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Mental Strength Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your ability to perform under pressure.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xl font-bold text-white">{streak}</span>
          </div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{avgRating}/10</div>
          <div className="text-xs text-slate-500">Avg Strength</div>
        </div>
        <div className="game-card p-3 text-center col-span-1">
          <div className="text-sm font-semibold text-amber-300 truncate">{topResponse ?? '—'}</div>
          <div className="text-xs text-slate-500">Top Response</div>
        </div>
        <div className="game-card p-3 text-center col-span-1">
          <div className="text-sm font-semibold text-blue-300 truncate">{topStrength ?? '—'}</div>
          <div className="text-xs text-slate-500">Top Strength</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Log Mental Strength Event</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            value={form.situation}
            onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="What challenging situation did you face? *"
            className="game-input w-full text-sm"
            autoFocus
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">Pressure Level: <span className={pressureColor(form.pressureLevel)}>{form.pressureLevel}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.pressureLevel}
              onChange={e => setForm(f => ({ ...f, pressureLevel: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.responseType}
              onChange={e => setForm(f => ({ ...f, responseType: e.target.value as ResponseType }))}
              className="game-input text-sm"
            >
              {RESPONSE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={form.mentalStrengthUsed}
              onChange={e => setForm(f => ({ ...f, mentalStrengthUsed: e.target.value as StrengthType }))}
              className="game-input text-sm"
            >
              {STRENGTH_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <input
            value={form.whatYouToldYourself}
            onChange={e => setForm(f => ({ ...f, whatYouToldYourself: e.target.value }))}
            placeholder="What did you tell yourself? (internal monologue)"
            className="game-input w-full text-sm"
          />
          <input
            value={form.physicalSensations}
            onChange={e => setForm(f => ({ ...f, physicalSensations: e.target.value }))}
            placeholder="What did you feel in your body?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.howItResolved}
            onChange={e => setForm(f => ({ ...f, howItResolved: e.target.value }))}
            placeholder="How did it resolve?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.lessonForNextTime}
            onChange={e => setForm(f => ({ ...f, lessonForNextTime: e.target.value }))}
            placeholder="Lesson for next time"
            className="game-input w-full text-sm"
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">Strength Rating: <span className="text-violet-300">{form.strengthRating}/10</span> → Mental Score: <span className="text-green-400">{form.strengthRating * 10}</span></p>
            <input
              type="range" min={1} max={10} value={form.strengthRating}
              onChange={e => setForm(f => ({ ...f, strengthRating: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400"
            />
          </div>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
              Log Entry
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Last 7 entries */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Entries</h2>
        {last7.map(e => (
          <div key={e.id} className="game-card p-3 border-l-2 border-violet-500/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{e.situation}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-xs px-1.5 py-0.5 bg-violet-900/50 text-violet-300 rounded">{e.responseType}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded">{e.mentalStrengthUsed}</span>
                  <span className={`text-xs font-semibold ${pressureColor(e.pressureLevel)}`}>P:{e.pressureLevel}</span>
                  <span className="text-xs text-green-400 font-semibold">Score: {e.mentalScore}</span>
                </div>
                {e.lessonForNextTime && (
                  <p className="text-xs text-amber-300/80 mt-1 truncate">Lesson: {e.lessonForNextTime}</p>
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
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Pressure reveals who you are. Start logging.</p>
          </div>
        )}
      </div>

      {entries.length > 7 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{entries.length - 7} more entries in history</span>
        </div>
      )}
    </div>
  )
}
