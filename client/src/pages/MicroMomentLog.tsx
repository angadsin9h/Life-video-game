import { useState, useEffect } from 'react'
import { Sparkles, Heart, Star, Flame, Sun, Smile, TrendingUp, Calendar, Trophy, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'micro_moment_log'

const MOMENT_TYPES = [
  'Joy Spark', 'Connection Flash', 'Beauty Noticed', 'Insight Strike',
  'Kindness Received', 'Kindness Given', 'Laughter', 'Awe',
  'Peace', 'Curiosity', 'Pride', 'Love Felt',
]

const TYPE_COLORS: Record<string, string> = {
  'Joy Spark': 'amber',
  'Connection Flash': 'pink',
  'Beauty Noticed': 'violet',
  'Insight Strike': 'blue',
  'Kindness Received': 'green',
  'Kindness Given': 'teal',
  'Laughter': 'yellow',
  'Awe': 'purple',
  'Peace': 'sky',
  'Curiosity': 'orange',
  'Pride': 'rose',
  'Love Felt': 'red',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  'Joy Spark': Sparkles,
  'Connection Flash': Zap,
  'Beauty Noticed': Sun,
  'Insight Strike': Star,
  'Kindness Received': Heart,
  'Kindness Given': Heart,
  'Laughter': Smile,
  'Awe': Star,
  'Peace': Sun,
  'Curiosity': Sparkles,
  'Pride': Trophy,
  'Love Felt': Heart,
}

interface MicroMoment {
  id: string
  date: string
  momentType: string
  description: string
  whereWereYou: string
  whoWasInvolved: string
  whyItMattered: string
  savourRating: number
  momentScore: number
}

function loadLog(): MicroMoment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MicroMoment[]
  } catch {
    return []
  }
}

function saveLog(entries: MicroMoment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function calcStreak(entries: MicroMoment[]): number {
  const dates = new Set(entries.map(e => e.date.slice(0, 10)))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) streak++
    else break
  }
  return streak
}

function mostCommon(arr: string[]): string {
  if (!arr.length) return '-'
  const freq: Record<string, number> = {}
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
}

export default function MicroMomentLog() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<MicroMoment[]>([])

  const [momentType, setMomentType] = useState('')
  const [description, setDescription] = useState('')
  const [whereWereYou, setWhereWereYou] = useState('')
  const [whoWasInvolved, setWhoWasInvolved] = useState('')
  const [whyItMattered, setWhyItMattered] = useState('')
  const [savourRating, setSavourRating] = useState(7)

  useEffect(() => {
    setLog(loadLog())
  }, [])

  const score = savourRating * 10

  function handleSave() {
    if (!momentType || !description.trim()) return
    const entry: MicroMoment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      momentType, description, whereWereYou, whoWasInvolved,
      whyItMattered, savourRating, momentScore: score,
    }
    const updated = [entry, ...log]
    saveLog(updated)
    setLog(updated)
    toastSuccess('Moment Captured', `Savour score: ${score}/100`)
    setMomentType('')
    setDescription('')
    setWhereWereYou('')
    setWhoWasInvolved('')
    setWhyItMattered('')
    setSavourRating(7)
  }

  const streak = calcStreak(log)
  const todayCount = log.filter(e => e.date.slice(0, 10) === todayKey()).length
  const mostCommonType = mostCommon(log.map(e => e.momentType))
  const last7daysEntries = log.filter(e => {
    const d = new Date(e.date)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    return d >= cutoff
  })
  const avgSavour = last7daysEntries.length
    ? Math.round(last7daysEntries.reduce((s, e) => s + e.savourRating, 0) / last7daysEntries.length * 10) / 10
    : 0
  const gallery = log.slice(0, 20)

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-pink-500/20">
            <Heart className="w-7 h-7 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Micro Moment Log</h1>
            <p className="text-slate-400 text-sm">Capture the tiny moments that make life beautiful</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="game-card text-center">
            <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-300">{todayCount}</div>
            <div className="text-xs text-slate-400">Today</div>
          </div>
          <div className="game-card text-center">
            <Sparkles className="w-4 h-4 text-violet-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-violet-300">{log.length}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div className="game-card text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-orange-300">{streak}</div>
            <div className="text-xs text-slate-400">Streak</div>
          </div>
          <div className="game-card text-center">
            <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-amber-300">{avgSavour}</div>
            <div className="text-xs text-slate-400">Avg Savour</div>
          </div>
        </div>

        {log.length > 0 && (
          <div className="game-card mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Most common moment: </span>
              <span className={`px-2 py-0.5 rounded-full text-xs bg-${TYPE_COLORS[mostCommonType] || 'violet'}-500/20 text-${TYPE_COLORS[mostCommonType] || 'violet'}-300`}>
                {mostCommonType}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="game-card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" /> Capture a Moment
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Moment Type *</label>
              <select
                className="game-input w-full"
                value={momentType}
                onChange={e => setMomentType(e.target.value)}
              >
                <option value="">Select type...</option>
                {MOMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Describe the Moment * (1-2 sentences)</label>
              <input
                className="game-input w-full"
                placeholder="What happened? Paint the picture..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Where were you?</label>
                <input
                  className="game-input w-full"
                  placeholder="Location..."
                  value={whereWereYou}
                  onChange={e => setWhereWereYou(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Who was involved?</label>
                <input
                  className="game-input w-full"
                  placeholder="Optional"
                  value={whoWasInvolved}
                  onChange={e => setWhoWasInvolved(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Why will you remember this?</label>
              <input
                className="game-input w-full"
                placeholder="Why did it matter?"
                value={whyItMattered}
                onChange={e => setWhyItMattered(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Savour Rating: {savourRating}/10</label>
              <input
                type="range" min={1} max={10}
                className="w-full accent-pink-500"
                value={savourRating}
                onChange={e => setSavourRating(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Barely noticed</span><span>Deeply savoured</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!momentType || !description.trim()}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" /> Capture Moment
            </button>
          </div>
        </div>

        {/* Moment Gallery */}
        {gallery.length > 0 && (
          <div className="game-card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Moment Gallery
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {gallery.map(entry => {
                const color = TYPE_COLORS[entry.momentType] || 'violet'
                const Icon = TYPE_ICONS[entry.momentType] || Sparkles
                return (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}
                  >
                    <Icon className={`w-4 h-4 text-${color}-400 mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium text-${color}-300`}>{entry.momentType}</span>
                        <span className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-white">{entry.description}</p>
                      {entry.whereWereYou && (
                        <p className="text-xs text-slate-400 mt-1">{entry.whereWereYou}{entry.whoWasInvolved ? ` · ${entry.whoWasInvolved}` : ''}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-amber-300">{entry.savourRating}/10</div>
                    </div>
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
