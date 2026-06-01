import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, Plus, Trash2, Save, Star, ChevronDown, ChevronUp, BarChart3, Brain } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'habit_reflection_log'

interface HabitReflection {
  id: string
  date: string
  period: 'weekly' | 'monthly' | 'quarterly'
  habitName: string
  phase: 'building' | 'maintaining' | 'struggling' | 'broken' | 'mastered'
  streakAtTime: number
  whatWorked: string
  whatDidntWork: string
  keyInsight: string
  adjustment: string
  commitment: string
  energyRequired: 1 | 2 | 3
  enjoyment: 1 | 2 | 3 | 4 | 5
  overallRating: 1 | 2 | 3 | 4 | 5
}

const PHASES: { value: HabitReflection['phase']; label: string; emoji: string; color: string }[] = [
  { value: 'building',    label: 'Building',    emoji: '🌱', color: '#22c55e' },
  { value: 'maintaining', label: 'Maintaining', emoji: '✅', color: '#3b82f6' },
  { value: 'struggling',  label: 'Struggling',  emoji: '😰', color: '#f59e0b' },
  { value: 'broken',      label: 'Broken',      emoji: '💔', color: '#ef4444' },
  { value: 'mastered',    label: 'Mastered',    emoji: '🏆', color: '#a855f7' },
]

const PERIODS: HabitReflection['period'][] = ['weekly', 'monthly', 'quarterly']

function phaseColor(phase: HabitReflection['phase']): string {
  return PHASES.find(p => p.value === phase)?.color ?? '#64748b'
}

function phaseEmoji(phase: HabitReflection['phase']): string {
  return PHASES.find(p => p.value === phase)?.emoji ?? ''
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
      ))}
    </span>
  )
}

function RatingPicker({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <span className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange((i + 1) as never)}
          className="transition-colors"
        >
          <Star className={`w-5 h-5 ${i < value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600 hover:text-yellow-300'}`} />
        </button>
      ))}
    </span>
  )
}

const emptyForm = (): Omit<HabitReflection, 'id' | 'date'> => ({
  period: 'weekly',
  habitName: '',
  phase: 'building',
  streakAtTime: 0,
  whatWorked: '',
  whatDidntWork: '',
  keyInsight: '',
  adjustment: '',
  commitment: '',
  energyRequired: 2,
  enjoyment: 3,
  overallRating: 3,
})

export default function HabitReflectionLog() {
  const { toastSuccess } = useToast()
  const [reflections, setReflections] = useState<HabitReflection[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setReflections(JSON.parse(saved))
    } catch { /**/ }
  }, [])

  const persist = (updated: HabitReflection[]) => {
    setReflections(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveReflection = () => {
    if (!form.habitName.trim()) return
    const entry: HabitReflection = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...form,
    }
    persist([entry, ...reflections])
    setForm(emptyForm())
    setShowForm(false)
    toastSuccess('Habit reflection logged! 🔄')
  }

  const deleteReflection = (id: string) => persist(reflections.filter(r => r.id !== id))

  const setField = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  // --- Derived data ---

  // Habit health map: group by habitName, latest phase + rating + trend
  const habitMap: Record<string, HabitReflection[]> = {}
  reflections.forEach(r => {
    if (!habitMap[r.habitName]) habitMap[r.habitName] = []
    habitMap[r.habitName].push(r)
  })

  interface HabitHealth {
    name: string
    latest: HabitReflection
    avgRating: number
    trend: 'improving' | 'declining' | 'stable'
    count: number
  }

  const habitHealthList: HabitHealth[] = Object.entries(habitMap).map(([name, refs]) => {
    const sorted = [...refs].sort((a, b) => b.date.localeCompare(a.date))
    const latest = sorted[0]
    const avgRating = Math.round((sorted.reduce((s, r) => s + r.overallRating, 0) / sorted.length) * 10) / 10

    let trend: HabitHealth['trend'] = 'stable'
    if (sorted.length >= 3) {
      const recent = sorted.slice(0, 3).map(r => r.overallRating)
      if (recent[0] > recent[1] && recent[1] >= recent[2]) trend = 'improving'
      else if (recent[0] < recent[1] && recent[1] <= recent[2]) trend = 'declining'
    }
    return { name, latest, avgRating, trend, count: sorted.length }
  })

  // Insights wall: all non-empty keyInsight, newest first
  const insights = reflections
    .filter(r => r.keyInsight.trim())
    .sort((a, b) => b.date.localeCompare(a.date))

  // Phase distribution
  const phaseCounts: Record<HabitReflection['phase'], number> = {
    building: 0, maintaining: 0, struggling: 0, broken: 0, mastered: 0,
  }
  reflections.forEach(r => { phaseCounts[r.phase]++ })
  const maxPhaseCount = Math.max(...Object.values(phaseCounts), 1)

  // Recent reflections (last 10)
  const recent = [...reflections].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  // Most reflected habits (top 5 by count)
  const topHabits = Object.entries(habitMap)
    .map(([name, rfs]) => ({ name, count: rfs.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-cyan-400" />
            Habit Reflection Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Deep reflections on your habit journey</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Reflection
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-cyan-400">{reflections.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Reflections</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{Object.keys(habitMap).length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Habits Tracked</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{insights.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Insights</div>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-cyan-500/20">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" /> New Habit Reflection
          </h3>

          {/* Habit name */}
          <input
            value={form.habitName}
            onChange={e => setField('habitName', e.target.value)}
            placeholder="Habit name *"
            className="game-input w-full"
            autoFocus
          />

          {/* Period selector */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Period</p>
            <div className="flex gap-2">
              {PERIODS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setField('period', p)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium capitalize transition-all ${form.period === p ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Phase selector */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Phase</p>
            <div className="flex flex-wrap gap-2">
              {PHASES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setField('phase', p.value)}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
                  style={form.phase === p.value
                    ? { background: p.color + '33', color: p.color, border: `1px solid ${p.color}` }
                    : { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Streak at time */}
          <input
            type="number"
            min={0}
            value={form.streakAtTime}
            onChange={e => setField('streakAtTime', Math.max(0, Number(e.target.value)))}
            placeholder="Streak at time of reflection (days)"
            className="game-input w-full"
          />

          {/* Text areas */}
          <textarea
            value={form.whatWorked}
            onChange={e => setField('whatWorked', e.target.value)}
            placeholder="What worked well?"
            className="game-input w-full h-20 resize-none"
          />
          <textarea
            value={form.whatDidntWork}
            onChange={e => setField('whatDidntWork', e.target.value)}
            placeholder="What didn't work?"
            className="game-input w-full h-20 resize-none"
          />
          <textarea
            value={form.keyInsight}
            onChange={e => setField('keyInsight', e.target.value)}
            placeholder="Key insight from this period..."
            className="game-input w-full h-16 resize-none"
          />
          <input
            value={form.adjustment}
            onChange={e => setField('adjustment', e.target.value)}
            placeholder="What will I change going forward?"
            className="game-input w-full"
          />
          <input
            value={form.commitment}
            onChange={e => setField('commitment', e.target.value)}
            placeholder="I commit to..."
            className="game-input w-full"
          />

          {/* Energy required */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Energy Required</p>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setField('energyRequired', n)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${form.energyRequired === n ? 'bg-orange-600/30 text-orange-300 border border-orange-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'}`}
                >
                  {n === 1 ? '⚡ Low' : n === 2 ? '⚡⚡ Medium' : '⚡⚡⚡ High'}
                </button>
              ))}
            </div>
          </div>

          {/* Enjoyment */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Enjoyment</p>
            <RatingPicker
              value={form.enjoyment}
              max={5}
              onChange={v => setField('enjoyment', v as HabitReflection['enjoyment'])}
            />
          </div>

          {/* Overall rating */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Overall Rating</p>
            <RatingPicker
              value={form.overallRating}
              max={5}
              onChange={v => setField('overallRating', v as HabitReflection['overallRating'])}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveReflection}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" /> Save Reflection
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {reflections.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No reflections yet.</p>
          <p className="text-sm mb-5">Regular reflection is what separates habits that stick from ones that fade.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log First Reflection
          </button>
        </div>
      )}

      {reflections.length > 0 && (
        <>
          {/* Habit health map */}
          <div className="game-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Habit Health Map
            </h3>
            {habitHealthList.map(h => (
              <div key={h.name} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm truncate">{h.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: phaseColor(h.latest.phase) + '25', color: phaseColor(h.latest.phase), border: `1px solid ${phaseColor(h.latest.phase)}50` }}
                    >
                      {phaseEmoji(h.latest.phase)} {h.latest.phase}
                    </span>
                    <span className={`text-xs font-medium ${h.trend === 'improving' ? 'text-green-400' : h.trend === 'declining' ? 'text-red-400' : 'text-slate-500'}`}>
                      {h.trend === 'improving' ? '↑ Improving' : h.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{h.count} reflection{h.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StarRating value={Math.round(h.avgRating)} />
                  <span className="text-xs text-slate-600">{h.avgRating}/5</span>
                </div>
              </div>
            ))}
          </div>

          {/* Phase distribution chart */}
          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" /> Phase Distribution
            </h3>
            <div className="flex gap-3 items-end h-28">
              {PHASES.map(p => {
                const count = phaseCounts[p.value]
                const barH = maxPhaseCount > 0 ? Math.round((count / maxPhaseCount) * 88) : 0
                return (
                  <div key={p.value} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold" style={{ color: p.color }}>{count}</span>
                    <div className="w-full flex flex-col justify-end" style={{ height: 88 }}>
                      <div
                        className="w-full rounded-t transition-all"
                        style={{ height: Math.max(barH, count > 0 ? 4 : 0), background: p.color + 'aa' }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 text-center leading-tight">{p.emoji}<br />{p.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insights wall */}
          {insights.length > 0 && (
            <div className="game-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-yellow-400" /> Insights Wall
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {insights.map(r => (
                  <div key={r.id} className="bg-slate-800/60 border-l-4 rounded-r-lg p-3" style={{ borderColor: phaseColor(r.phase) }}>
                    <p className="text-sm text-slate-200 leading-relaxed italic">"{r.keyInsight}"</p>
                    <p className="text-xs text-slate-500 mt-1">{r.habitName} · {r.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most reflected habits */}
          {topHabits.length > 0 && (
            <div className="game-card p-5 space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" /> Most Reflected Habits
              </h3>
              {topHabits.map((h, i) => (
                <div key={h.name} className="flex items-center gap-3">
                  <span className="text-slate-600 text-sm w-5 text-right">{i + 1}.</span>
                  <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-600/70 transition-all"
                      style={{ width: `${Math.round((h.count / topHabits[0].count) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-300 w-32 truncate">{h.name}</span>
                  <span className="text-xs text-slate-500 w-12 text-right">{h.count}x</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent reflections (last 10, collapsible) */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1">Recent Reflections</h3>
            {recent.map(r => {
              const isExp = expanded === r.id
              return (
                <div key={r.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${phaseColor(r.phase)}` }}>
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(isExp ? null : r.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{r.habitName}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: phaseColor(r.phase) + '25', color: phaseColor(r.phase) }}
                        >
                          {phaseEmoji(r.phase)} {r.phase}
                        </span>
                        <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full capitalize">{r.period}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating value={r.overallRating} />
                        <span className="text-xs text-slate-500">{r.date}</span>
                      </div>
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />}
                  </div>

                  {isExp && (
                    <div className="border-t border-slate-800 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                        <div>Streak at time: <span className="text-white">{r.streakAtTime} days</span></div>
                        <div>Energy: <span className="text-white">{r.energyRequired === 1 ? 'Low' : r.energyRequired === 2 ? 'Medium' : 'High'}</span></div>
                        <div className="flex items-center gap-1">Enjoyment: <StarRating value={r.enjoyment} /></div>
                        <div className="flex items-center gap-1">Rating: <StarRating value={r.overallRating} /></div>
                      </div>
                      {r.whatWorked && (
                        <div>
                          <p className="text-xs text-green-400 font-semibold mb-0.5">What worked</p>
                          <p className="text-sm text-slate-300">{r.whatWorked}</p>
                        </div>
                      )}
                      {r.whatDidntWork && (
                        <div>
                          <p className="text-xs text-red-400 font-semibold mb-0.5">What didn't work</p>
                          <p className="text-sm text-slate-300">{r.whatDidntWork}</p>
                        </div>
                      )}
                      {r.keyInsight && (
                        <div>
                          <p className="text-xs text-yellow-400 font-semibold mb-0.5">Key insight</p>
                          <p className="text-sm text-slate-200 italic">"{r.keyInsight}"</p>
                        </div>
                      )}
                      {r.adjustment && (
                        <div>
                          <p className="text-xs text-cyan-400 font-semibold mb-0.5">Adjustment</p>
                          <p className="text-sm text-slate-300">{r.adjustment}</p>
                        </div>
                      )}
                      {r.commitment && (
                        <div>
                          <p className="text-xs text-violet-400 font-semibold mb-0.5">Commitment</p>
                          <p className="text-sm text-slate-300">{r.commitment}</p>
                        </div>
                      )}
                      <button
                        onClick={() => deleteReflection(r.id)}
                        className="flex items-center gap-1 text-slate-600 hover:text-red-400 transition-colors text-xs mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
