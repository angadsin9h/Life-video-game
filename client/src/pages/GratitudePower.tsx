import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import {
  Heart, Star, Sparkles, Sun, TrendingUp, Calendar,
  Plus, CheckCircle2, Award, Flame,
} from 'lucide-react'

const STORAGE_KEY = 'gratitude_power_log'

type GratitudeDepthType = 'Micro (small things)' | 'Standard (daily blessings)' | 'Deep (profound gifts)' | 'Transformational (gratitude for pain)'

const DEPTH_OPTIONS: GratitudeDepthType[] = [
  'Micro (small things)',
  'Standard (daily blessings)',
  'Deep (profound gifts)',
  'Transformational (gratitude for pain)',
]

const DEPTH_SCORE: Record<GratitudeDepthType, number> = {
  'Micro (small things)': 5,
  'Standard (daily blessings)': 7,
  'Deep (profound gifts)': 8.5,
  'Transformational (gratitude for pain)': 10,
}

const DEPTH_STYLE: Record<GratitudeDepthType, string> = {
  'Micro (small things)': 'bg-slate-700/60 text-slate-300 border-slate-500/40',
  'Standard (daily blessings)': 'bg-blue-900/60 text-blue-300 border-blue-500/40',
  'Deep (profound gifts)': 'bg-violet-900/60 text-violet-300 border-violet-500/40',
  'Transformational (gratitude for pain)': 'bg-amber-900/60 text-amber-300 border-amber-500/40',
}

const DEPTH_PILL: Record<GratitudeDepthType, string> = {
  'Micro (small things)': 'bg-slate-700 text-slate-300',
  'Standard (daily blessings)': 'bg-blue-900/80 text-blue-300',
  'Deep (profound gifts)': 'bg-violet-900/80 text-violet-300',
  'Transformational (gratitude for pain)': 'bg-amber-900/80 text-amber-300',
}

interface GratitudeEntry {
  id: string
  date: string
  gratitudeDepth: GratitudeDepthType
  entry1: string
  entry2: string
  entry3: string
  whyItMatters1: string
  whyItMatters2: string
  whyItMatters3: string
  personToThank: string
  challengeGratitude: string
  bodyGratitude: string
  todaysMiracle: string
  gratitudeScore: number
}

interface FormState {
  gratitudeDepth: GratitudeDepthType
  entry1: string
  entry2: string
  entry3: string
  whyItMatters1: string
  whyItMatters2: string
  whyItMatters3: string
  personToThank: string
  challengeGratitude: string
  bodyGratitude: string
  todaysMiracle: string
}

const EMPTY_FORM: FormState = {
  gratitudeDepth: 'Standard (daily blessings)',
  entry1: '',
  entry2: '',
  entry3: '',
  whyItMatters1: '',
  whyItMatters2: '',
  whyItMatters3: '',
  personToThank: '',
  challengeGratitude: '',
  bodyGratitude: '',
  todaysMiracle: '',
}

function computeGratitudeScore(depth: GratitudeDepthType): number {
  return Math.round(DEPTH_SCORE[depth] * 10)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getStreakCount(entries: GratitudeEntry[]): number {
  const days = [...new Set(entries.map(e => e.date.split('T')[0]))].sort().reverse()
  let streak = 0
  for (let i = 0; i < days.length; i++) {
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    const exp = expected.toISOString().split('T')[0]
    if (days[i] === exp) streak++
    else break
  }
  return streak
}

function shortDepth(d: GratitudeDepthType): string {
  return d.split(' (')[0]
}

export default function GratitudePower() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {
      setEntries([])
    }
  }, [])

  const saveEntries = (updated: GratitudeEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleSubmit = () => {
    if (!form.entry1.trim()) return
    const entry: GratitudeEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...form,
      gratitudeScore: computeGratitudeScore(form.gratitudeDepth),
    }
    saveEntries([entry, ...entries])
    toastSuccess('Gratitude logged. The universe notices what you notice.')
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const streak = getStreakCount(entries)

  // Stats
  const totalEntries = entries.length
  const avgScore = totalEntries
    ? Math.round(entries.reduce((s, e) => s + e.gratitudeScore, 0) / totalEntries)
    : 0

  // Last 7 depths
  const last7 = entries.slice(0, 7)

  // Gratitude wall (last 10 entry1 values)
  const wall = entries.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-8 h-8 text-pink-400" />
            Gratitude Power
          </h1>
          <p className="text-slate-400 mt-1">Deep, structured gratitude that goes beyond surface thankfulness.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-700 hover:bg-pink-600 text-white font-semibold transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-pink-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-400 mt-1">Gratitude Streak</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalEntries}</div>
          <div className="text-xs text-slate-400 mt-1">Total Entries</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgScore}</div>
          <div className="text-xs text-slate-400 mt-1">Avg Score</div>
        </div>
      </div>

      {/* Depth evolution last 7 */}
      {last7.length > 0 && (
        <div className="game-card p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            Gratitude Depth Evolution (Last 7)
          </h2>
          <div className="flex flex-wrap gap-2">
            {last7.map(e => (
              <div key={e.id} className="flex flex-col items-center gap-1">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${DEPTH_PILL[e.gratitudeDepth]}`}>
                  {shortDepth(e.gratitudeDepth)}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="game-card p-5 border border-pink-500/30 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              Today's Gratitude Practice
            </h3>
          </div>

          {/* Depth selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Gratitude Depth Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEPTH_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setForm(f => ({ ...f, gratitudeDepth: d }))}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    form.gratitudeDepth === d
                      ? DEPTH_STYLE[d]
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 3 entries + why */}
          {([
            { entry: 'entry1' as const, why: 'whyItMatters1' as const, num: 1 },
            { entry: 'entry2' as const, why: 'whyItMatters2' as const, num: 2 },
            { entry: 'entry3' as const, why: 'whyItMatters3' as const, num: 3 },
          ]).map(({ entry, why, num }) => (
            <div key={num} className="space-y-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Gratitude #{num} *{num === 1 ? ' (required)' : ''}</label>
                <input
                  className="game-input w-full"
                  placeholder={`I am grateful for...`}
                  value={form[entry]}
                  onChange={e => setForm(f => ({ ...f, [entry]: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Why It Matters #{num}</label>
                <input
                  className="game-input w-full"
                  placeholder="Because it..."
                  value={form[why]}
                  onChange={e => setForm(f => ({ ...f, [why]: e.target.value }))}
                />
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Person to Thank (optional)</label>
              <input
                className="game-input w-full"
                placeholder="Who deserves acknowledgment today?"
                value={form.personToThank}
                onChange={e => setForm(f => ({ ...f, personToThank: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Today's Miracle (smallest miracle)</label>
              <input
                className="game-input w-full"
                placeholder="What tiny miracle did you notice?"
                value={form.todaysMiracle}
                onChange={e => setForm(f => ({ ...f, todaysMiracle: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Challenge Gratitude (something difficult you're grateful for)</label>
            <input
              className="game-input w-full"
              placeholder="Even this hard thing has taught me / given me..."
              value={form.challengeGratitude}
              onChange={e => setForm(f => ({ ...f, challengeGratitude: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Body Gratitude (something about your body)</label>
            <input
              className="game-input w-full"
              placeholder="My body allows me to..."
              value={form.bodyGratitude}
              onChange={e => setForm(f => ({ ...f, bodyGratitude: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Gratitude Score: <span className="text-pink-400 font-bold text-lg">{computeGratitudeScore(form.gratitudeDepth)}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.entry1.trim()}
                className="px-4 py-2 rounded-lg bg-pink-700 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                Log Gratitude
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gratitude Wall */}
      {wall.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-pink-400" />
            Gratitude Wall (Last 10)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wall.map(e => (
              <div key={e.id} className="game-card p-4 border border-pink-500/20">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DEPTH_PILL[e.gratitudeDepth]}`}>
                    {shortDepth(e.gratitudeDepth)}
                  </span>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-white text-sm font-medium leading-snug">"{e.entry1}"</p>
                {e.whyItMatters1 && (
                  <p className="text-xs text-slate-400 mt-1 italic">{e.whyItMatters1}</p>
                )}
                {e.todaysMiracle && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {e.todaysMiracle}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="game-card p-10 text-center">
          <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Gratitude is the gateway to abundance. Start your practice today.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-pink-700 hover:bg-pink-600 text-white font-semibold text-sm transition-colors"
          >
            Begin Practice
          </button>
        </div>
      )}

      {/* Tip */}
      <div className="game-card p-4 border border-pink-500/20 bg-pink-900/10">
        <div className="flex items-start gap-3">
          <Flame className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-pink-300">Gratitude Power Principle</p>
            <p className="text-xs text-slate-400 mt-1">
              What you appreciate, appreciates. Gratitude isn't just feeling good — it's a lens that reveals abundance already present.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
