import { useState, useEffect } from 'react'
import { Users, Activity, Plus, Trash2, Save, TrendingUp, Heart, BarChart3, ChevronDown, ChevronUp, Calendar, Brain, Smile } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'social_energy_log'

type InteractionType = 'one-on-one' | 'small-group' | 'large-group' | 'online' | 'public' | 'family' | 'work'
type Feeling = 'energized' | 'drained' | 'neutral' | 'inspired' | 'anxious' | 'joyful' | 'depleted'

interface SocialInteraction {
  id: string
  personOrGroup: string
  type: InteractionType
  duration: number
  energyBefore: 1 | 2 | 3 | 4 | 5
  energyAfter: 1 | 2 | 3 | 4 | 5
  qualityScore: 1 | 2 | 3 | 4 | 5
  feeling: Feeling
  note: string
}

interface SocialEnergyEntry {
  id: string
  date: string
  interactions: SocialInteraction[]
  totalSocialTime: number
  socialBattery: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  solitudeMinutes: number
  notes: string
}

const TYPE_CONFIG: Record<InteractionType, { label: string; emoji: string; color: string }> = {
  'one-on-one':  { label: '1-on-1',      emoji: '👤', color: '#3b82f6' },
  'small-group': { label: 'Small Group',  emoji: '👥', color: '#22c55e' },
  'large-group': { label: 'Large Group',  emoji: '🎉', color: '#f97316' },
  online:        { label: 'Online',       emoji: '💻', color: '#06b6d4' },
  public:        { label: 'Public',       emoji: '🌐', color: '#a855f7' },
  family:        { label: 'Family',       emoji: '👨‍👩‍👧', color: '#ec4899' },
  work:          { label: 'Work',         emoji: '💼', color: '#f59e0b' },
}

const FEELING_CONFIG: Record<Feeling, { label: string; emoji: string; color: string }> = {
  energized: { label: 'Energized', emoji: '⚡', color: '#22c55e' },
  drained:   { label: 'Drained',   emoji: '😮‍💨', color: '#ef4444' },
  neutral:   { label: 'Neutral',   emoji: '😐', color: '#64748b' },
  inspired:  { label: 'Inspired',  emoji: '✨', color: '#f59e0b' },
  anxious:   { label: 'Anxious',   emoji: '😰', color: '#f97316' },
  joyful:    { label: 'Joyful',    emoji: '😄', color: '#a855f7' },
  depleted:  { label: 'Depleted',  emoji: '🪫', color: '#94a3b8' },
}

const BATTERY_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#ef4444', 3: '#f97316', 4: '#f97316',
  5: '#f59e0b', 6: '#f59e0b', 7: '#84cc16', 8: '#22c55e',
  9: '#22c55e', 10: '#10b981',
}

const INTERACTION_TYPES = Object.keys(TYPE_CONFIG) as InteractionType[]
const FEELINGS = Object.keys(FEELING_CONFIG) as Feeling[]

function batteryColor(level: number): string {
  return BATTERY_COLORS[level] ?? '#64748b'
}

function batteryLabel(level: number): string {
  if (level >= 9) return 'Fully Charged'
  if (level >= 7) return 'High Energy'
  if (level >= 5) return 'Moderate'
  if (level >= 3) return 'Low'
  return 'Depleted'
}

const blankInteraction = (): Omit<SocialInteraction, 'id'> => ({
  personOrGroup: '',
  type: 'one-on-one',
  duration: 30,
  energyBefore: 3,
  energyAfter: 3,
  qualityScore: 3,
  feeling: 'neutral',
  note: '',
})

const blankEntry = (): Omit<SocialEnergyEntry, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  interactions: [],
  totalSocialTime: 0,
  socialBattery: 5,
  solitudeMinutes: 0,
  notes: '',
})

function EnergyDots({
  value,
  max,
  onChange,
  color,
}: {
  value: number
  max: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="w-6 h-6 rounded-full border-2 transition-all"
          style={
            n <= value
              ? { background: color, borderColor: color }
              : { background: 'transparent', borderColor: '#334155' }
          }
        />
      ))}
    </div>
  )
}

export default function SocialEnergyLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SocialEnergyEntry[]>([])
  const [form, setForm] = useState<Omit<SocialEnergyEntry, 'id'>>(blankEntry())
  const [iForm, setIForm] = useState<Omit<SocialInteraction, 'id'>>(blankInteraction())
  const [showIForm, setShowIForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const persist = (updated: SocialEnergyEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addInteraction = () => {
    if (!iForm.personOrGroup.trim()) return
    const interaction: SocialInteraction = { id: Date.now().toString(), ...iForm }
    const newInteractions = [...form.interactions, interaction]
    const totalTime = newInteractions.reduce((s, i) => s + i.duration, 0)
    setForm(f => ({ ...f, interactions: newInteractions, totalSocialTime: totalTime }))
    setIForm(blankInteraction())
    setShowIForm(false)
  }

  const removeInteraction = (id: string) => {
    const newInteractions = form.interactions.filter(i => i.id !== id)
    setForm(f => ({ ...f, interactions: newInteractions, totalSocialTime: newInteractions.reduce((s, i) => s + i.duration, 0) }))
  }

  const submit = () => {
    const entry: SocialEnergyEntry = { id: Date.now().toString(), ...form }
    persist([entry, ...entries])
    setForm(blankEntry())
    setShowIForm(false)
    toastSuccess('Social energy logged! 🔋')
  }

  // Last 30 days data
  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)
  const last30 = entries.filter(e => new Date(e.date) >= cutoff30)

  // Energizing vs draining
  const allInteractions30: SocialInteraction[] = []
  last30.forEach(e => e.interactions.forEach(i => allInteractions30.push(i)))
  const energizingCount = allInteractions30.filter(i => i.feeling === 'energized' || i.feeling === 'inspired' || i.feeling === 'joyful').length
  const drainingCount = allInteractions30.filter(i => i.feeling === 'drained' || i.feeling === 'depleted' || i.feeling === 'anxious').length
  const totalFiltered = allInteractions30.length
  const energizingPct = totalFiltered > 0 ? Math.round((energizingCount / totalFiltered) * 100) : 0
  const drainingPct = totalFiltered > 0 ? Math.round((drainingCount / totalFiltered) * 100) : 0

  // Best interaction types — avg quality
  const typeQuality: Record<string, number[]> = {}
  entries.forEach(e => e.interactions.forEach(i => {
    if (!typeQuality[i.type]) typeQuality[i.type] = []
    typeQuality[i.type].push(i.qualityScore)
  }))
  const typeAvgs = (Object.entries(typeQuality) as [InteractionType, number[]][]).map(([t, scores]) => ({
    type: t,
    label: TYPE_CONFIG[t].label,
    emoji: TYPE_CONFIG[t].emoji,
    color: TYPE_CONFIG[t].color,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  })).sort((a, b) => b.avg - a.avg)

  // Social battery trend — last 14 days
  const last14: { date: string; battery: number }[] = []
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const cutoff14 = new Date()
  cutoff14.setDate(cutoff14.getDate() - 14)
  sortedEntries.filter(e => new Date(e.date) >= cutoff14).forEach(e => {
    last14.push({ date: e.date, battery: e.socialBattery })
  })

  // Stats
  const avgBattery30 = last30.length > 0
    ? (last30.reduce((s, e) => s + e.socialBattery, 0) / last30.length).toFixed(1)
    : '—'
  const totalSocialHours = entries.reduce((s, e) => s + e.totalSocialTime, 0) / 60

  const typeEnergy: Record<string, number[]> = {}
  entries.forEach(e => e.interactions.forEach(i => {
    if (!typeEnergy[i.type]) typeEnergy[i.type] = []
    typeEnergy[i.type].push(i.energyAfter - i.energyBefore)
  }))
  const typeEnergyAvgs = (Object.entries(typeEnergy) as [InteractionType, number[]][]).map(([t, deltas]) => ({
    type: t,
    avg: deltas.reduce((a, b) => a + b, 0) / deltas.length,
  }))
  const mostEnergizingType = typeEnergyAvgs.sort((a, b) => b.avg - a.avg)[0]
  const mostDrainingType = [...typeEnergyAvgs].sort((a, b) => a.avg - b.avg)[0]

  // Today's (or last entry's) interactions for energy delta viz
  const todayInteractions = entries.length > 0 ? entries[0].interactions : form.interactions
  const showDeltaViz = todayInteractions.length > 0

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Heart className="w-7 h-7 text-pink-400" />
            Social Energy Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Understand your introvert/extrovert patterns and social fuel.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-pink-400">{avgBattery30}/10</div>
          <div className="text-xs text-slate-500">Avg Battery (30d)</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{totalSocialHours.toFixed(1)}h</div>
          <div className="text-xs text-slate-500">Social Hours</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-sm font-bold text-green-400 truncate">
            {mostEnergizingType ? TYPE_CONFIG[mostEnergizingType.type as InteractionType]?.emoji + ' ' + TYPE_CONFIG[mostEnergizingType.type as InteractionType]?.label : '—'}
          </div>
          <div className="text-xs text-slate-500">Most Energizing</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-sm font-bold text-red-400 truncate">
            {mostDrainingType ? TYPE_CONFIG[mostDrainingType.type as InteractionType]?.emoji + ' ' + TYPE_CONFIG[mostDrainingType.type as InteractionType]?.label : '—'}
          </div>
          <div className="text-xs text-slate-500">Most Draining</div>
        </div>
      </div>

      {/* Today's Log Form */}
      <div className="game-card p-4 border border-pink-500/10 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Brain className="w-4 h-4 text-pink-400" />
          Today's Social Log
        </h3>

        {/* Social battery */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Social Battery</span>
            <span style={{ color: batteryColor(form.socialBattery) }}>
              {form.socialBattery}/10 — {batteryLabel(form.socialBattery)}
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setForm(f => ({ ...f, socialBattery: n }))}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-all border"
                style={
                  form.socialBattery === n
                    ? { background: batteryColor(n) + '33', color: batteryColor(n), borderColor: batteryColor(n) }
                    : { background: '#1e293b', color: '#64748b', borderColor: '#334155' }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Solitude */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 w-36 shrink-0">Solitude minutes today</label>
          <input
            type="number"
            value={form.solitudeMinutes}
            onChange={e => setForm(f => ({ ...f, solitudeMinutes: Math.max(0, Number(e.target.value)) }))}
            min={0}
            className="game-input w-24 text-sm"
          />
        </div>

        {/* Interactions list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Interactions ({form.interactions.length}) — {form.totalSocialTime} min total
            </span>
            <button
              type="button"
              onClick={() => setShowIForm(s => !s)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {/* Add interaction form */}
          {showIForm && (
            <div className="bg-slate-800/50 rounded-xl p-3 space-y-3 border border-slate-700">
              <input
                value={iForm.personOrGroup}
                onChange={e => setIForm(f => ({ ...f, personOrGroup: e.target.value }))}
                placeholder="Person or group name *"
                className="game-input w-full text-sm"
                autoFocus
              />

              {/* Type chips */}
              <div className="flex flex-wrap gap-1.5">
                {INTERACTION_TYPES.map(t => {
                  const c = TYPE_CONFIG[t]
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setIForm(f => ({ ...f, type: t }))}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                      style={
                        iForm.type === t
                          ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` }
                          : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }
                      }
                    >
                      {c.emoji} {c.label}
                    </button>
                  )
                })}
              </div>

              {/* Duration + energy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    value={iForm.duration}
                    onChange={e => setIForm(f => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))}
                    min={1}
                    className="game-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Quality (1-5)</label>
                  <EnergyDots
                    value={iForm.qualityScore}
                    max={5}
                    onChange={v => setIForm(f => ({ ...f, qualityScore: v as 1 | 2 | 3 | 4 | 5 }))}
                    color="#f59e0b"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Energy before (1-5)</label>
                  <EnergyDots
                    value={iForm.energyBefore}
                    max={5}
                    onChange={v => setIForm(f => ({ ...f, energyBefore: v as 1 | 2 | 3 | 4 | 5 }))}
                    color="#3b82f6"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Energy after (1-5)</label>
                  <EnergyDots
                    value={iForm.energyAfter}
                    max={5}
                    onChange={v => setIForm(f => ({ ...f, energyAfter: v as 1 | 2 | 3 | 4 | 5 }))}
                    color={iForm.energyAfter >= iForm.energyBefore ? '#22c55e' : '#ef4444'}
                  />
                </div>
              </div>

              {/* Feeling chips */}
              <div className="flex flex-wrap gap-1.5">
                {FEELINGS.map(f => {
                  const c = FEELING_CONFIG[f]
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setIForm(fi => ({ ...fi, feeling: f }))}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                      style={
                        iForm.feeling === f
                          ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` }
                          : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }
                      }
                    >
                      {c.emoji} {c.label}
                    </button>
                  )
                })}
              </div>

              <input
                value={iForm.note}
                onChange={e => setIForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Note..."
                className="game-input w-full text-sm"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addInteraction}
                  className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Add Interaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowIForm(false)}
                  className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Interactions list */}
          {form.interactions.length > 0 && (
            <div className="space-y-1.5">
              {form.interactions.map(i => {
                const tc = TYPE_CONFIG[i.type]
                const fc = FEELING_CONFIG[i.feeling]
                const delta = i.energyAfter - i.energyBefore
                return (
                  <div key={i.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-xl border border-slate-700">
                    <span className="text-base">{tc.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-300 font-medium truncate block">{i.personOrGroup}</span>
                      <span className="text-xs text-slate-500">{i.duration}m · {fc.emoji} {fc.label}</span>
                    </div>
                    <span
                      className="text-xs font-bold shrink-0"
                      style={{ color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#64748b' }}
                    >
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInteraction(i.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Notes + date */}
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Notes about today's social life..."
          className="game-input w-full h-12 resize-none text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input text-xs"
          />
        </div>

        <button
          onClick={submit}
          className="w-full flex items-center justify-center gap-2 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Save className="w-4 h-4" /> Save Day
        </button>
      </div>

      {/* Energy delta visualization */}
      {showDeltaViz && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Energy Delta per Interaction
          </h3>
          <svg width="100%" viewBox={`0 0 400 ${todayInteractions.length * 36 + 10}`} className="overflow-visible">
            {todayInteractions.map((inter, i) => {
              const tc = TYPE_CONFIG[inter.type]
              const beforeW = (inter.energyBefore / 5) * 90
              const afterW = (inter.energyAfter / 5) * 90
              const afterColor = inter.energyAfter >= inter.energyBefore ? '#22c55e' : '#ef4444'
              return (
                <g key={inter.id} transform={`translate(0, ${i * 36})`}>
                  <text x="0" y="14" fontSize="10" fill="#94a3b8">
                    {tc.emoji} {inter.personOrGroup.length > 12 ? inter.personOrGroup.slice(0, 12) + '…' : inter.personOrGroup}
                  </text>
                  {/* Before bar */}
                  <rect x="110" y="2" width={beforeW} height="10" rx="3" fill="#3b82f6" fillOpacity="0.6" />
                  <text x="205" y="11" fontSize="9" fill="#94a3b8">→</text>
                  {/* After bar */}
                  <rect x="215" y="2" width={afterW} height="10" rx="3" fill={afterColor} fillOpacity="0.7" />
                  <text x="312" y="11" fontSize="9" fill={afterColor} fontWeight="600">
                    {inter.energyAfter > inter.energyBefore ? '+' : ''}{inter.energyAfter - inter.energyBefore}
                  </text>
                  {/* labels row */}
                  <text x="110" y="26" fontSize="8" fill="#475569">before: {inter.energyBefore}</text>
                  <text x="215" y="26" fontSize="8" fill="#475569">after: {inter.energyAfter}</text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Energizing vs draining donut */}
      {allInteractions30.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Smile className="w-4 h-4 text-yellow-400" />
            Energizing vs Draining
            <span className="text-xs text-slate-500 font-normal">(last 30 days)</span>
          </h3>
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 120 60" className="w-40 shrink-0">
              {/* SVG 2-segment horizontal bar */}
              <rect x="0" y="20" width="120" height="20" rx="6" fill="#1e293b" />
              <rect x="0" y="20" width={energizingPct * 1.2} height="20" rx="6" fill="#22c55e" fillOpacity="0.8" />
              <rect x={energizingPct * 1.2} y="20" width={drainingPct * 1.2} height="20" fill="#ef4444" fillOpacity="0.7" />
              <text x="60" y="14" fontSize="9" fill="#94a3b8" textAnchor="middle">Interactions</text>
              <text x={Math.min(energizingPct * 0.6, 110)} y="34" fontSize="9" fill="#fff" textAnchor="middle">{energizingPct}%</text>
              {drainingPct > 0 && (
                <text x={Math.min(energizingPct * 1.2 + drainingPct * 0.6, 115)} y="34" fontSize="9" fill="#fff" textAnchor="middle">{drainingPct}%</text>
              )}
            </svg>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500/80" />
                <span className="text-slate-300">Energizing/Joyful/Inspired: <span className="text-green-400 font-bold">{energizingCount}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500/70" />
                <span className="text-slate-300">Drained/Depleted/Anxious: <span className="text-red-400 font-bold">{drainingCount}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-500/50" />
                <span className="text-slate-300">Neutral: <span className="text-slate-400 font-bold">{totalFiltered - energizingCount - drainingCount}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Best interaction types */}
      {typeAvgs.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Avg Quality by Interaction Type
          </h3>
          <svg width="100%" viewBox={`0 0 400 ${typeAvgs.length * 30 + 10}`} className="overflow-visible">
            {typeAvgs.map((t, i) => {
              const barW = (t.avg / 5) * 260
              return (
                <g key={t.type} transform={`translate(0, ${i * 30})`}>
                  <text x="0" y="14" fontSize="11" fill="#94a3b8">
                    {t.emoji} {t.label}
                  </text>
                  <rect x="110" y="4" width={barW} height="16" rx="4" fill={t.color} fillOpacity="0.5" />
                  <text x={115 + barW} y="16" fontSize="11" fill={t.color} fontWeight="600">
                    {t.avg.toFixed(1)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Social battery trend — line chart */}
      {last14.length > 1 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            Social Battery Trend
            <span className="text-xs text-slate-500 font-normal">(last 14 days)</span>
          </h3>
          <svg viewBox="0 0 400 80" className="w-full overflow-visible">
            {/* Grid lines */}
            {[2, 4, 6, 8, 10].map(v => (
              <line
                key={v}
                x1="30"
                y1={70 - ((v - 1) / 9) * 60}
                x2="390"
                y2={70 - ((v - 1) / 9) * 60}
                stroke="#1e293b"
                strokeWidth="1"
              />
            ))}
            {/* Y axis labels */}
            {[2, 6, 10].map(v => (
              <text key={v} x="24" y={70 - ((v - 1) / 9) * 60 + 4} fontSize="8" fill="#475569" textAnchor="end">
                {v}
              </text>
            ))}
            {/* Line */}
            <polyline
              points={last14.map((d, i) => {
                const x = 30 + (i / Math.max(last14.length - 1, 1)) * 360
                const y = 70 - ((d.battery - 1) / 9) * 60
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="#ec4899"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots */}
            {last14.map((d, i) => {
              const x = 30 + (i / Math.max(last14.length - 1, 1)) * 360
              const y = 70 - ((d.battery - 1) / 9) * 60
              return (
                <circle key={i} cx={x} cy={y} r="3" fill={batteryColor(d.battery)} />
              )
            })}
            {/* X axis labels */}
            {last14.map((d, i) => {
              const x = 30 + (i / Math.max(last14.length - 1, 1)) * 360
              if (i % 3 === 0 || i === last14.length - 1) {
                return (
                  <text key={i} x={x} y="80" fontSize="7" fill="#475569" textAnchor="middle">
                    {d.date.slice(5)}
                  </text>
                )
              }
              return null
            })}
          </svg>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Recent Days
          </h3>
          {entries.slice(0, 7).map(e => {
            const isExpanded = expandedId === e.id
            const bc = batteryColor(e.socialBattery)
            return (
              <div key={e.id} className="game-card overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: bc + '22', color: bc, border: `2px solid ${bc}` }}
                  >
                    {e.socialBattery}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-300">{e.date}</span>
                      <span className="text-xs text-slate-500">{e.interactions.length} interactions</span>
                      <span className="text-xs text-slate-500">{e.totalSocialTime} min social</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </div>
                {isExpanded && e.interactions.length > 0 && (
                  <div className="px-3 pb-3 border-t border-slate-800 space-y-1.5 pt-2">
                    {e.interactions.map(i => {
                      const tc = TYPE_CONFIG[i.type]
                      const fc = FEELING_CONFIG[i.feeling]
                      const delta = i.energyAfter - i.energyBefore
                      return (
                        <div key={i.id} className="flex items-center gap-2 text-xs">
                          <span>{tc.emoji}</span>
                          <span className="text-slate-300 flex-1 truncate">{i.personOrGroup}</span>
                          <span className="text-slate-500">{i.duration}m</span>
                          <span>{fc.emoji}</span>
                          <span style={{ color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#64748b' }} className="font-bold w-6 text-right">
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        </div>
                      )
                    })}
                    {e.notes && <p className="text-xs text-slate-500 italic pt-1">{e.notes}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-14 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start logging your social interactions to understand your energy patterns.</p>
        </div>
      )}
    </div>
  )
}
