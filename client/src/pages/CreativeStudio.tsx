import { useState } from 'react'
import { Sparkles, Flame, Clock, TrendingUp, Play, CheckCircle2, Circle, Calendar, Zap, Star, Plus } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'creative_studio_log'

type Medium =
  | 'Writing' | 'Drawing/Art' | 'Music' | 'Code/Tech' | 'Design'
  | 'Photography' | 'Video' | 'Cooking' | 'Crafts' | 'Dance' | 'Poetry' | 'Other'

type SessionType = 'Brainstorm' | 'Draft' | 'Refine' | 'Finish' | 'Explore' | 'Practice' | 'Review'

interface CreativeEntry {
  id: string
  medium: Medium
  projectName: string
  sessionType: SessionType
  duration: number
  outputCreated: string
  inspirationSource: string
  energyBefore: number
  energyAfter: number
  flowAchieved: boolean
  qualityRating: number
  nextCreativeStep: string
  creativityScore: number
  date: string
  createdAt: string
}

function loadEntries(): CreativeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CreativeEntry[]
  } catch { /* ignore */ }
  return []
}

function saveEntries(entries: CreativeEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* ignore */ }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(entries: CreativeEntry[]): number {
  if (!entries.length) return 0
  const days = new Set(entries.map(e => e.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    if (days.has(ds)) streak++
    else if (i > 0) break
  }
  return streak
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const MEDIUM_OPTIONS: Medium[] = [
  'Writing', 'Drawing/Art', 'Music', 'Code/Tech', 'Design',
  'Photography', 'Video', 'Cooking', 'Crafts', 'Dance', 'Poetry', 'Other',
]

const SESSION_TYPES: SessionType[] = ['Brainstorm', 'Draft', 'Refine', 'Finish', 'Explore', 'Practice', 'Review']

const MEDIUM_COLORS: Record<Medium, string> = {
  'Writing': 'text-blue-400',
  'Drawing/Art': 'text-pink-400',
  'Music': 'text-violet-400',
  'Code/Tech': 'text-green-400',
  'Design': 'text-amber-400',
  'Photography': 'text-sky-400',
  'Video': 'text-red-400',
  'Cooking': 'text-orange-400',
  'Crafts': 'text-teal-400',
  'Dance': 'text-purple-400',
  'Poetry': 'text-indigo-400',
  'Other': 'text-slate-400',
}

const DEFAULT_FORM = {
  medium: 'Writing' as Medium,
  projectName: '',
  sessionType: 'Draft' as SessionType,
  duration: 30,
  outputCreated: '',
  inspirationSource: '',
  energyBefore: 6,
  energyAfter: 7,
  flowAchieved: false,
  qualityRating: 7,
  nextCreativeStep: '',
}

export default function CreativeStudio() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CreativeEntry[]>(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...DEFAULT_FORM })

  const streak = computeStreak(entries)
  const totalMinutes = entries.reduce((s, e) => s + e.duration, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  // Per-medium breakdown
  const mediumBreakdown = MEDIUM_OPTIONS.map(m => {
    const mEntries = entries.filter(e => e.medium === m)
    const totalMin = mEntries.reduce((s, e) => s + e.duration, 0)
    return { medium: m, count: mEntries.length, totalMin }
  }).filter(m => m.count > 0).sort((a, b) => b.totalMin - a.totalMin)

  // Creative energy
  const avgEnergyBefore = entries.length
    ? entries.reduce((s, e) => s + e.energyBefore, 0) / entries.length
    : 0
  const avgEnergyAfter = entries.length
    ? entries.reduce((s, e) => s + e.energyAfter, 0) / entries.length
    : 0
  const energyDelta = avgEnergyAfter - avgEnergyBefore

  // Last 7 sessions
  const last7Sessions = [...entries].reverse().slice(0, 7)

  // 7-day consistency
  const last7Days = getLast7Days()
  const daysWithSessions = new Set(entries.map(e => e.date))

  function handleSubmit() {
    const entry: CreativeEntry = {
      id: Date.now().toString(),
      ...form,
      creativityScore: form.qualityRating * 10,
      date: todayStr(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...entries, entry]
    setEntries(updated)
    saveEntries(updated)
    toastSuccess('Session logged', `${form.medium} — ${form.duration} min`)
    setForm({ ...DEFAULT_FORM })
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-6 h-6 text-amber-400" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
          Creative Studio
        </h1>
      </div>
      <p className="text-slate-400 text-sm mb-6">Track your creative output and inspiration.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="game-card text-center p-3">
          <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-black text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-400">Day Streak</div>
        </div>
        <div className="game-card text-center p-3">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalHours}h</div>
          <div className="text-xs text-slate-400">Total Hours</div>
        </div>
        <div className="game-card text-center p-3">
          <Play className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-black text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{entries.length}</div>
          <div className="text-xs text-slate-400">Sessions</div>
        </div>
        <div className="game-card text-center p-3">
          <Zap className="w-4 h-4 text-pink-400 mx-auto mb-1" />
          <div className={`text-xl font-black ${energyDelta > 0 ? 'text-green-400' : energyDelta < 0 ? 'text-red-400' : 'text-slate-400'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}>
            {energyDelta > 0 ? '+' : ''}{energyDelta.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">Energy Lift</div>
        </div>
      </div>

      {/* 7-Day Consistency */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold">7-Day Consistency</span>
        </div>
        <div className="flex gap-2">
          {last7Days.map(day => {
            const has = daysWithSessions.has(day)
            const label = new Date(day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${has ? 'bg-amber-600' : 'bg-slate-700'}`}>
                  {has ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Circle className="w-4 h-4 text-slate-500" />}
                </div>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Log Button */}
      {!showForm && (
        <button className="w-full game-btn-primary mb-4 flex items-center justify-center gap-2"
          onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Log Creative Session
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="game-card mb-4 border border-amber-500/20">
          <h3 className="font-bold text-amber-300 mb-4">New Creative Session</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Medium</label>
                <select className="game-input w-full mt-1"
                  value={form.medium}
                  onChange={e => setForm(f => ({ ...f, medium: e.target.value as Medium }))}>
                  {MEDIUM_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Session Type</label>
                <select className="game-input w-full mt-1"
                  value={form.sessionType}
                  onChange={e => setForm(f => ({ ...f, sessionType: e.target.value as SessionType }))}>
                  {SESSION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Project Name</label>
              <input className="game-input w-full mt-1" placeholder="What are you working on?"
                value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Duration: {form.duration} min</label>
              <input type="range" min={5} max={240} step={5} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full accent-amber-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">What did you create/produce?</label>
              <input className="game-input w-full mt-1" placeholder="Output..."
                value={form.outputCreated} onChange={e => setForm(f => ({ ...f, outputCreated: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Inspiration Source</label>
              <input className="game-input w-full mt-1" placeholder="What sparked this?"
                value={form.inspirationSource} onChange={e => setForm(f => ({ ...f, inspirationSource: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Energy Before: {form.energyBefore}/10</label>
                <input type="range" min={1} max={10} value={form.energyBefore}
                  onChange={e => setForm(f => ({ ...f, energyBefore: Number(e.target.value) }))}
                  className="w-full accent-amber-500 mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Energy After: {form.energyAfter}/10</label>
                <input type="range" min={1} max={10} value={form.energyAfter}
                  onChange={e => setForm(f => ({ ...f, energyAfter: Number(e.target.value) }))}
                  className="w-full accent-amber-500 mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Quality Rating: {form.qualityRating}/10</label>
              <input type="range" min={1} max={10} value={form.qualityRating}
                onChange={e => setForm(f => ({ ...f, qualityRating: Number(e.target.value) }))}
                className="w-full accent-amber-500 mt-1" />
              <div className="text-xs text-slate-500">Creativity Score: {form.qualityRating * 10}/100</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-300">Flow Achieved?</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, flowAchieved: !f.flowAchieved }))}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${form.flowAchieved ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {form.flowAchieved ? 'Yes' : 'No'}
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-400">Next Creative Step</label>
              <input className="game-input w-full mt-1" placeholder="What's next?"
                value={form.nextCreativeStep} onChange={e => setForm(f => ({ ...f, nextCreativeStep: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 rounded-lg font-semibold"
                onClick={handleSubmit}>Log Session</button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg"
                onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Medium Breakdown */}
      {mediumBreakdown.length > 0 && (
        <div className="game-card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold">Medium Breakdown</span>
          </div>
          <div className="space-y-2">
            {mediumBreakdown.map(({ medium, count, totalMin }) => (
              <div key={medium} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${MEDIUM_COLORS[medium]}`}>{medium}</span>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{count} session{count !== 1 ? 's' : ''}</span>
                  <span className="text-slate-300 font-semibold">{totalMin} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last 7 Sessions */}
      {last7Sessions.length > 0 && (
        <div className="game-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">Last 7 Sessions</span>
          </div>
          <div className="space-y-2">
            {last7Sessions.map(e => (
              <div key={e.id} className="flex items-start justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${MEDIUM_COLORS[e.medium]}`}>{e.medium}</span>
                    {e.projectName && <span className="text-xs text-slate-400 truncate">{e.projectName}</span>}
                    {e.flowAchieved && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Flow</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{e.sessionType} · {e.date}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-bold text-amber-400">{e.creativityScore}/100</div>
                  <div className="text-xs text-slate-500">{e.duration} min</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center text-slate-500 py-12">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">No sessions yet. Start creating above.</p>
        </div>
      )}
    </div>
  )
}
