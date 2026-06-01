import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, Save, TrendingUp, Star, Zap, Target, RefreshCw, CheckCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface CognitiveExercise {
  type: 'reading' | 'puzzles' | 'meditation' | 'learning' | 'writing' | 'memory' | 'math' | 'strategy' | 'creative' | 'language'
  duration: number
  difficulty: 1|2|3
  notes: string
}

interface CognitiveDayEntry {
  id: string
  date: string
  exercises: CognitiveExercise[]
  mentalClarityScore: 1|2|3|4|5|6|7|8|9|10
  focusQuality: 1|2|3|4|5
  brainFogLevel: 1|2|3|4|5
  cognitiveInsight: string
  notes: string
}

const STORAGE_KEY = 'cognitive_fitness_log'

const EXERCISE_CONFIG: Record<CognitiveExercise['type'], { label: string; emoji: string; color: string }> = {
  reading:    { label: 'Reading',    emoji: '📚', color: '#3b82f6' },
  puzzles:    { label: 'Puzzles',    emoji: '🧩', color: '#f59e0b' },
  meditation: { label: 'Meditation', emoji: '🧘', color: '#a855f7' },
  learning:   { label: 'Learning',   emoji: '🎓', color: '#22c55e' },
  writing:    { label: 'Writing',    emoji: '✍️',  color: '#06b6d4' },
  memory:     { label: 'Memory',     emoji: '🧠', color: '#ec4899' },
  math:       { label: 'Math',       emoji: '🔢', color: '#f97316' },
  strategy:   { label: 'Strategy',   emoji: '♟',  color: '#6366f1' },
  creative:   { label: 'Creative',   emoji: '🎨', color: '#14b8a6' },
  language:   { label: 'Language',   emoji: '🌐', color: '#84cc16' },
}

const FOG_EMOJIS = ['☀️', '🌤', '⛅', '🌥', '☁️']

const EXERCISE_TYPES = Object.keys(EXERCISE_CONFIG) as CognitiveExercise['type'][]

const DIFFICULTY_LABELS: Record<1|2|3, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }

const LEVEL_THRESHOLDS = [
  { name: 'Beginner',     minSessions: 0,   minClarity: 0,   xpNeeded: 10,  color: '#94a3b8' },
  { name: 'Apprentice',   minSessions: 10,  minClarity: 5,   xpNeeded: 25,  color: '#22c55e' },
  { name: 'Practitioner', minSessions: 25,  minClarity: 6,   xpNeeded: 50,  color: '#3b82f6' },
  { name: 'Expert',       minSessions: 50,  minClarity: 7,   xpNeeded: 100, color: '#a855f7' },
  { name: 'Master',       minSessions: 100, minClarity: 8,   xpNeeded: Infinity, color: '#f59e0b' },
]

const blankExercise = (): CognitiveExercise => ({ type: 'reading', duration: 20, difficulty: 1, notes: '' })

const blankForm = (): Omit<CognitiveDayEntry, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  exercises: [],
  mentalClarityScore: 7,
  focusQuality: 3,
  brainFogLevel: 2,
  cognitiveInsight: '',
  notes: '',
})

function computeStreak(entries: CognitiveDayEntry[]): number {
  if (!entries.length) return 0
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  let prev: string | null = null
  for (const e of sorted) {
    if (e.exercises.length === 0) break
    if (prev === null) {
      streak = 1
      prev = e.date
    } else {
      const prevDate = new Date(prev)
      const thisDate = new Date(e.date)
      const diff = Math.round((prevDate.getTime() - thisDate.getTime()) / 86400000)
      if (diff === 1) {
        streak++
        prev = e.date
      } else {
        break
      }
    }
  }
  return streak
}

function clarityColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

export default function CognitiveFitnessLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CognitiveDayEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CognitiveDayEntry, 'id'>>(blankForm())
  const [newExercise, setNewExercise] = useState<CognitiveExercise>(blankExercise())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (u: CognitiveDayEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const addExercise = () => {
    if (newExercise.duration <= 0) return
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...newExercise }] }))
    setNewExercise(blankExercise())
  }

  const removeExercise = (i: number) => {
    setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }))
  }

  const submit = () => {
    const entry: CognitiveDayEntry = { id: Date.now().toString(), ...form }
    persist([entry, ...entries])
    setForm(blankForm())
    setNewExercise(blankExercise())
    setShowForm(false)
    toastSuccess('Brain training logged! 🧠')
  }

  // Derived stats
  const streak = computeStreak(entries)

  const totalMins = entries.reduce((s, e) => s + e.exercises.reduce((ss, ex) => ss + ex.duration, 0), 0)
  const totalSessions = entries.length

  const last30 = entries.slice(0, 30)
  const avg30Clarity = last30.length
    ? +(last30.reduce((s, e) => s + e.mentalClarityScore, 0) / last30.length).toFixed(1)
    : 0

  // Longest streak (brute-force over history)
  const longestStreak = (() => {
    if (!entries.length) return 0
    const sorted = [...entries].filter(e => e.exercises.length > 0).sort((a, b) => a.date.localeCompare(b.date))
    let max = 0, cur = 0, prev: string | null = null
    for (const e of sorted) {
      if (prev === null) { cur = 1; prev = e.date }
      else {
        const diff = Math.round((new Date(e.date).getTime() - new Date(prev).getTime()) / 86400000)
        if (diff === 1) { cur++; }
        else { cur = 1 }
        prev = e.date
      }
      if (cur > max) max = cur
    }
    return max
  })()

  // Cognitive level
  const levelIdx = (() => {
    let idx = 0
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      const t = LEVEL_THRESHOLDS[i]
      if (totalSessions >= t.minSessions && avg30Clarity >= t.minClarity) idx = i
    }
    return idx
  })()
  const currentLevel = LEVEL_THRESHOLDS[levelIdx]
  const nextLevel = LEVEL_THRESHOLDS[levelIdx + 1]
  const xpProgress = nextLevel
    ? Math.min(100, Math.round(((totalSessions - currentLevel.minSessions) / (nextLevel.minSessions - currentLevel.minSessions)) * 100))
    : 100

  // 14-day clarity trend
  const last14 = entries.slice(0, 14).reverse()
  const clarityMax = 10
  const chartW = 280, chartH = 80

  // Exercise distribution last 30 days
  const exerciseMins: Partial<Record<CognitiveExercise['type'], number>> = {}
  for (const e of last30) {
    for (const ex of e.exercises) {
      exerciseMins[ex.type] = (exerciseMins[ex.type] || 0) + ex.duration
    }
  }
  const exEntries = Object.entries(exerciseMins) as [CognitiveExercise['type'], number][]
  const maxExMins = exEntries.length ? Math.max(...exEntries.map(([, m]) => m)) : 1

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Cognitive Fitness
            {streak > 0 && (
              <span className="ml-2 text-sm px-2 py-0.5 bg-orange-900/40 text-orange-400 rounded-full font-semibold">
                🔥 {streak} day streak
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track cognitive exercises and keep your mind sharp.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Day
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="flex items-center justify-center gap-1 mb-1"><Zap className="w-3.5 h-3.5 text-yellow-400" /></div>
          <div className="text-xl font-bold text-yellow-400">{totalMins}<span className="text-sm text-slate-500">m</span></div>
          <div className="text-xs text-slate-500">Total Training</div>
        </div>
        <div className="game-card p-3">
          <div className="flex items-center justify-center gap-1 mb-1"><TrendingUp className="w-3.5 h-3.5 text-violet-400" /></div>
          <div className="text-xl font-bold text-violet-400">{avg30Clarity || '—'}<span className="text-sm text-slate-500">/10</span></div>
          <div className="text-xs text-slate-500">Avg Clarity (30d)</div>
        </div>
        <div className="game-card p-3">
          <div className="flex items-center justify-center gap-1 mb-1"><RefreshCw className="w-3.5 h-3.5 text-orange-400" /></div>
          <div className="text-xl font-bold text-orange-400">{longestStreak}</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
      </div>

      {/* Cognitive Level */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: currentLevel.color }} />
            <span className="font-bold text-sm" style={{ color: currentLevel.color }}>{currentLevel.name}</span>
          </div>
          {nextLevel && (
            <span className="text-xs text-slate-500">Next: {nextLevel.name}</span>
          )}
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpProgress}%`, background: currentLevel.color }} />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>{totalSessions} sessions</span>
          {nextLevel && <span>{nextLevel.minSessions} needed for {nextLevel.name}</span>}
          {!nextLevel && <span className="text-yellow-400">Max level!</span>}
        </div>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-white">Log Today's Brain Training</h3>

          {/* Date */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm w-full" />
          </div>

          {/* Mental clarity */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Mental Clarity Score: {form.mentalClarityScore}/10</label>
            <div className="flex gap-1">
              {([1,2,3,4,5,6,7,8,9,10] as const).map(n => (
                <button key={n}
                  onClick={() => setForm(f => ({ ...f, mentalClarityScore: n }))}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: form.mentalClarityScore === n ? clarityColor(n) + '40' : '#1e293b',
                    border: form.mentalClarityScore === n ? `1px solid ${clarityColor(n)}` : '1px solid transparent',
                    color: form.mentalClarityScore === n ? clarityColor(n) : '#475569',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Focus quality */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Focus Quality</label>
            <div className="flex gap-2">
              {([1,2,3,4,5] as const).map(n => (
                <button key={n}
                  onClick={() => setForm(f => ({ ...f, focusQuality: n }))}
                  className="flex-1 py-2 rounded-lg text-lg transition-all"
                  style={{
                    background: form.focusQuality >= n ? '#fbbf2420' : '#1e293b',
                    border: form.focusQuality >= n ? '1px solid #fbbf24' : '1px solid transparent',
                  }}>
                  <Star className="w-4 h-4 mx-auto" style={{ color: form.focusQuality >= n ? '#fbbf24' : '#475569', fill: form.focusQuality >= n ? '#fbbf24' : 'transparent' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Brain fog */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Brain Fog Level</label>
            <div className="flex gap-2">
              {([1,2,3,4,5] as const).map(n => (
                <button key={n}
                  onClick={() => setForm(f => ({ ...f, brainFogLevel: n }))}
                  className="flex-1 py-2 rounded-lg text-xl transition-all"
                  style={{
                    background: form.brainFogLevel === n ? '#ffffff10' : '#1e293b',
                    border: form.brainFogLevel === n ? '1px solid #94a3b8' : '1px solid transparent',
                  }}>
                  {FOG_EMOJIS[n - 1]}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-1">
              <span>Clear</span><span>Light</span><span>Moderate</span><span>Heavy</span><span>Dense</span>
            </div>
          </div>

          {/* Exercises */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Exercises
              {form.exercises.length > 0 && (
                <span className="ml-2 text-violet-400">
                  {form.exercises.reduce((s, e) => s + e.duration, 0)}min total
                </span>
              )}
            </label>

            {/* Exercise type chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {EXERCISE_TYPES.map(t => {
                const cfg = EXERCISE_CONFIG[t]
                return (
                  <button key={t}
                    onClick={() => setNewExercise(e => ({ ...e, type: t }))}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: newExercise.type === t ? cfg.color + '30' : '#1e293b',
                      border: newExercise.type === t ? `1px solid ${cfg.color}` : '1px solid #334155',
                      color: newExercise.type === t ? cfg.color : '#64748b',
                    }}>
                    {cfg.emoji} {cfg.label}
                  </button>
                )
              })}
            </div>

            {/* Duration + difficulty */}
            <div className="flex gap-2 mb-3">
              <input type="number" min={1} value={newExercise.duration || ''}
                onChange={e => setNewExercise(ex => ({ ...ex, duration: Number(e.target.value) }))}
                placeholder="Minutes" className="game-input text-sm flex-1" />
              <select value={newExercise.difficulty}
                onChange={e => setNewExercise(ex => ({ ...ex, difficulty: Number(e.target.value) as 1|2|3 }))}
                className="game-input text-sm flex-1">
                {([1,2,3] as const).map(d => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                ))}
              </select>
              <button onClick={addExercise}
                className="px-3 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Added exercises */}
            {form.exercises.map((ex, i) => {
              const cfg = EXERCISE_CONFIG[ex.type]
              return (
                <div key={i} className="flex items-center gap-2 mb-1.5 py-1.5 px-2 rounded-lg bg-slate-700/50">
                  <span className="text-base">{cfg.emoji}</span>
                  <span className="text-xs text-slate-300 flex-1">{cfg.label}</span>
                  <span className="text-xs text-slate-400">{ex.duration}min</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cfg.color + '25', color: cfg.color }}>
                    {DIFFICULTY_LABELS[ex.difficulty]}
                  </span>
                  <button onClick={() => removeExercise(i)} className="text-slate-600 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Cognitive insight */}
          <textarea value={form.cognitiveInsight}
            onChange={e => setForm(f => ({ ...f, cognitiveInsight: e.target.value }))}
            placeholder="Any 'aha' moment or insight today?"
            className="game-input w-full h-16 resize-none text-sm" />

          {/* Notes */}
          <textarea value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..."
            className="game-input w-full h-12 resize-none text-sm" />

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={submit}
              className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
              <Save className="w-4 h-4" /> Save Entry
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clarity trend chart (14 days) */}
      {last14.length > 1 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Clarity Trend (14 days)
          </h3>
          <div className="overflow-x-auto">
            <svg width={chartW} height={chartH + 20} className="w-full" viewBox={`0 0 ${chartW} ${chartH + 20}`}>
              {/* Grid lines */}
              {[2, 5, 8, 10].map(v => {
                const y = chartH - (v / clarityMax) * chartH
                return (
                  <g key={v}>
                    <line x1={0} y1={y} x2={chartW} y2={y} stroke="#334155" strokeWidth={0.5} strokeDasharray="4 4" />
                    <text x={2} y={y - 2} fill="#475569" fontSize={8}>{v}</text>
                  </g>
                )
              })}
              {/* Line */}
              {last14.length > 1 && (() => {
                const pts = last14.map((e, i) => {
                  const x = (i / (last14.length - 1)) * chartW
                  const y = chartH - (e.mentalClarityScore / clarityMax) * chartH
                  return `${x},${y}`
                })
                return (
                  <>
                    <polyline
                      points={pts.join(' ')}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round" />
                    {last14.map((e, i) => {
                      const x = (i / (last14.length - 1)) * chartW
                      const y = chartH - (e.mentalClarityScore / clarityMax) * chartH
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r={3} fill={clarityColor(e.mentalClarityScore)} stroke="#0f172a" strokeWidth={1} />
                          <title>{e.date}: {e.mentalClarityScore}/10</title>
                        </g>
                      )
                    })}
                  </>
                )
              })()}
              {/* Day labels */}
              {last14.map((e, i) => {
                if (i % 2 !== 0 && i !== last14.length - 1) return null
                const x = (i / (last14.length - 1)) * chartW
                return (
                  <text key={i} x={x} y={chartH + 14} fill="#475569" fontSize={8} textAnchor="middle">
                    {new Date(e.date + 'T12:00:00').toLocaleDateString('en', { month: 'numeric', day: 'numeric' })}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Exercise distribution (last 30 days) */}
      {exEntries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Exercise Distribution <span className="text-slate-600 normal-case">(last 30 days)</span>
          </h3>
          <div className="space-y-2">
            {exEntries.sort((a, b) => b[1] - a[1]).map(([type, mins]) => {
              const cfg = EXERCISE_CONFIG[type]
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center flex-shrink-0">{cfg.emoji}</span>
                  <div className="w-16 text-xs text-slate-400 truncate">{cfg.label}</div>
                  <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${maxExMins > 0 ? (mins / maxExMins) * 100 : 0}%`,
                        background: cfg.color,
                      }} />
                  </div>
                  <div className="w-10 text-xs text-slate-400 text-right">{mins}m</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Entries</h3>
          <div className="space-y-2">
            {entries.slice(0, 7).map(e => {
              const totalMinsEntry = e.exercises.reduce((s, ex) => s + ex.duration, 0)
              const isExpanded = expandedId === e.id
              const scoreColor = clarityColor(e.mentalClarityScore)
              return (
                <div key={e.id} className="border-b border-slate-700/50 last:border-0 pb-2">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                    <div className="text-xs text-slate-500 w-20 flex-shrink-0">{e.date}</div>
                    <div className="flex-1 flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-300">{totalMinsEntry}min</span>
                      <span className="text-xs text-slate-500">{FOG_EMOJIS[e.brainFogLevel - 1]}</span>
                      {e.exercises.length > 0 && (
                        <span className="text-xs text-violet-400">{e.exercises.length} exercise{e.exercises.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: scoreColor + '25', color: scoreColor }}>
                      {e.mentalClarityScore}/10
                    </div>
                    <CheckCircle className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    <button
                      onClick={ev => { ev.stopPropagation(); persist(entries.filter(x => x.id !== e.id)) }}
                      className="text-slate-700 hover:text-red-400 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 pl-24 space-y-1">
                      {e.exercises.map((ex, i) => {
                        const cfg = EXERCISE_CONFIG[ex.type]
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span>{cfg.emoji}</span>
                            <span className="text-slate-300">{cfg.label}</span>
                            <span className="text-slate-500">{ex.duration}min</span>
                            <span className="text-slate-600">· {DIFFICULTY_LABELS[ex.difficulty]}</span>
                          </div>
                        )
                      })}
                      {e.cognitiveInsight && (
                        <p className="text-xs text-yellow-300/70 mt-1">💡 {e.cognitiveInsight}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-14 text-slate-500">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Train your mind like you train your body. Start your first session.</p>
        </div>
      )}
    </div>
  )
}
