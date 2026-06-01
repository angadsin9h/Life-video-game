import { useState, useEffect } from 'react'
import { Users, Activity, Plus, Trash2, Save, TrendingUp, Star, Zap, Heart, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'body_language_tracker'

type Context = 'presentation' | 'meeting' | 'social' | 'date' | 'negotiation' | 'casual' | 'conflict' | 'interview'
type Posture = 'open' | 'closed' | 'neutral'
type EyeContact = 'strong' | 'moderate' | 'weak' | 'avoided'
type FacialExpression = 'relaxed' | 'tense' | 'engaged' | 'distracted'
type Voice = 'confident' | 'hesitant' | 'calm' | 'rushed'
type Gestures = 'expansive' | 'minimal' | 'fidgety' | 'controlled'
type Space = 'comfortable' | 'invaded' | 'distant'

interface BodyLanguageObservation {
  id: string
  date: string
  context: Context
  signals: {
    posture: Posture
    eyeContact: EyeContact
    facialExpression: FacialExpression
    voice: Voice
    gestures: Gestures
    space: Space
  }
  overallImpact: 1 | 2 | 3 | 4 | 5
  received: string
  improvements: string[]
  wins: string[]
  notes: string
}

const CONTEXT_CONFIG: Record<Context, { label: string; emoji: string; color: string }> = {
  presentation: { label: 'Presentation', emoji: '🎤', color: '#ef4444' },
  meeting:      { label: 'Meeting',      emoji: '💼', color: '#3b82f6' },
  social:       { label: 'Social',       emoji: '🎉', color: '#22c55e' },
  date:         { label: 'Date',         emoji: '💕', color: '#ec4899' },
  negotiation:  { label: 'Negotiation',  emoji: '🤝', color: '#f97316' },
  casual:       { label: 'Casual',       emoji: '😊', color: '#84cc16' },
  conflict:     { label: 'Conflict',     emoji: '⚡', color: '#f59e0b' },
  interview:    { label: 'Interview',    emoji: '🏢', color: '#a855f7' },
}

const POSTURE_OPTIONS: { value: Posture; label: string }[] = [
  { value: 'open',    label: 'Open'    },
  { value: 'closed',  label: 'Closed'  },
  { value: 'neutral', label: 'Neutral' },
]

const EYE_CONTACT_OPTIONS: { value: EyeContact; label: string }[] = [
  { value: 'strong',   label: 'Strong'   },
  { value: 'moderate', label: 'Moderate' },
  { value: 'weak',     label: 'Weak'     },
  { value: 'avoided',  label: 'Avoided'  },
]

const FACIAL_OPTIONS: { value: FacialExpression; label: string }[] = [
  { value: 'relaxed',    label: 'Relaxed'    },
  { value: 'tense',      label: 'Tense'      },
  { value: 'engaged',    label: 'Engaged'    },
  { value: 'distracted', label: 'Distracted' },
]

const VOICE_OPTIONS: { value: Voice; label: string }[] = [
  { value: 'confident', label: 'Confident' },
  { value: 'hesitant',  label: 'Hesitant'  },
  { value: 'calm',      label: 'Calm'      },
  { value: 'rushed',    label: 'Rushed'    },
]

const GESTURES_OPTIONS: { value: Gestures; label: string }[] = [
  { value: 'expansive',  label: 'Expansive'  },
  { value: 'minimal',    label: 'Minimal'    },
  { value: 'fidgety',    label: 'Fidgety'    },
  { value: 'controlled', label: 'Controlled' },
]

const SPACE_OPTIONS: { value: Space; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'invaded',     label: 'Invaded'     },
  { value: 'distant',     label: 'Distant'     },
]

const POSITIVE_SIGNALS: Record<string, string[]> = {
  posture: ['open'],
  eyeContact: ['strong', 'moderate'],
  facialExpression: ['relaxed', 'engaged'],
  voice: ['confident', 'calm'],
  gestures: ['expansive', 'controlled'],
  space: ['comfortable'],
}

const SIGNAL_LABELS: Record<string, string> = {
  posture: 'Posture',
  eyeContact: 'Eye Contact',
  facialExpression: 'Facial Expression',
  voice: 'Voice',
  gestures: 'Gestures',
  space: 'Space',
}

type SignalKey = 'posture' | 'eyeContact' | 'facialExpression' | 'voice' | 'gestures' | 'space'
const SIGNAL_KEYS: SignalKey[] = ['posture', 'eyeContact', 'facialExpression', 'voice', 'gestures', 'space']

const blankForm = (): Omit<BodyLanguageObservation, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  context: 'social',
  signals: {
    posture: 'neutral',
    eyeContact: 'moderate',
    facialExpression: 'relaxed',
    voice: 'calm',
    gestures: 'minimal',
    space: 'comfortable',
  },
  overallImpact: 3,
  received: '',
  improvements: [],
  wins: [],
  notes: '',
})

function SignalPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
            style={
              value === opt.value
                ? { background: '#6366f133', color: '#818cf8', border: '1px solid #6366f1' }
                : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StarRating({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void
}) {
  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4, 5] as const).map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star
            className="w-5 h-5 transition-colors"
            style={{ color: n <= value ? '#f59e0b' : '#334155', fill: n <= value ? '#f59e0b' : 'none' }}
          />
        </button>
      ))}
    </div>
  )
}

function ListAdder({
  placeholder,
  items,
  onChange,
}: {
  placeholder: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !items.includes(v)) {
      onChange([...items, v])
      setInput('')
    }
  }
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="game-input flex-1 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-300 border border-slate-700"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-slate-500 hover:text-red-400 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function BodyLanguageTracker() {
  const { toastSuccess } = useToast()
  const [observations, setObservations] = useState<BodyLanguageObservation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BodyLanguageObservation, 'id'>>(blankForm())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try {
      setObservations(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const persist = (updated: BodyLanguageObservation[]) => {
    setObservations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    const obs: BodyLanguageObservation = { id: Date.now().toString(), ...form }
    persist([obs, ...observations])
    setForm(blankForm())
    setShowForm(false)
    toastSuccess('Body language logged! 💪')
  }

  const setSignal = <K extends SignalKey>(key: K, value: BodyLanguageObservation['signals'][K]) => {
    setForm(f => ({ ...f, signals: { ...f.signals, [key]: value } }))
  }

  // Progress by signal — last 30 entries
  const last30 = observations.slice(0, 30)
  const signalProgress = SIGNAL_KEYS.map(key => {
    if (last30.length === 0) return { key, label: SIGNAL_LABELS[key], best: '-', pct: 0 }
    const positives = POSITIVE_SIGNALS[key]
    const counts: Record<string, number> = {}
    last30.forEach(o => {
      const v = o.signals[key] as string
      counts[v] = (counts[v] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const top = sorted[0]
    const topIsPositive = positives.includes(top[0])
    const posCount = positives.reduce((s, p) => s + (counts[p] || 0), 0)
    const posPct = Math.round((posCount / last30.length) * 100)
    return { key, label: SIGNAL_LABELS[key], best: top[0], pct: topIsPositive ? posPct : posPct, topVal: top[0], topCount: top[1], total: last30.length }
  })

  // Context breakdown — avg impact per context
  const contextScores: Record<string, number[]> = {}
  observations.forEach(o => {
    if (!contextScores[o.context]) contextScores[o.context] = []
    contextScores[o.context].push(o.overallImpact)
  })
  const contextAvgs = (Object.entries(contextScores) as [Context, number[]][]).map(([ctx, scores]) => ({
    ctx,
    label: CONTEXT_CONFIG[ctx].label,
    emoji: CONTEXT_CONFIG[ctx].emoji,
    color: CONTEXT_CONFIG[ctx].color,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  })).sort((a, b) => b.avg - a.avg)
  const maxContextAvg = 5

  // Improvement tracker — deduplicated, top 10
  const improvCounts: Record<string, number> = {}
  observations.forEach(o => o.improvements.forEach(imp => { improvCounts[imp] = (improvCounts[imp] || 0) + 1 }))
  const topImprovements = Object.entries(improvCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Win wall
  const allWins: string[] = []
  observations.forEach(o => o.wins.forEach(w => allWins.push(w)))

  const avgImpact = observations.length
    ? (observations.reduce((s, o) => s + o.overallImpact, 0) / observations.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Activity className="w-7 h-7 text-purple-400" />
            Body Language Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log and improve your non-verbal communication.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{observations.length}</div>
          <div className="text-xs text-slate-500">Observations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgImpact}</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{allWins.length}</div>
          <div className="text-xs text-slate-500">Wins Captured</div>
        </div>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-white">Log an Observation</h3>

          {/* Context chips */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-medium">Context</span>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CONTEXT_CONFIG) as [Context, typeof CONTEXT_CONFIG.social][]).map(([k, c]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, context: k }))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={
                    form.context === k
                      ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` }
                      : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }
                  }
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Signal selectors */}
          <div className="space-y-3">
            <SignalPills
              label="Posture"
              options={POSTURE_OPTIONS}
              value={form.signals.posture}
              onChange={v => setSignal('posture', v)}
            />
            <SignalPills
              label="Eye Contact"
              options={EYE_CONTACT_OPTIONS}
              value={form.signals.eyeContact}
              onChange={v => setSignal('eyeContact', v)}
            />
            <SignalPills
              label="Facial Expression"
              options={FACIAL_OPTIONS}
              value={form.signals.facialExpression}
              onChange={v => setSignal('facialExpression', v)}
            />
            <SignalPills
              label="Voice"
              options={VOICE_OPTIONS}
              value={form.signals.voice}
              onChange={v => setSignal('voice', v)}
            />
            <SignalPills
              label="Gestures"
              options={GESTURES_OPTIONS}
              value={form.signals.gestures}
              onChange={v => setSignal('gestures', v)}
            />
            <SignalPills
              label="Space"
              options={SPACE_OPTIONS}
              value={form.signals.space}
              onChange={v => setSignal('space', v)}
            />
          </div>

          {/* Overall impact */}
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Overall Impact</span>
            <StarRating
              value={form.overallImpact}
              onChange={v => setForm(f => ({ ...f, overallImpact: v }))}
            />
          </div>

          {/* Received */}
          <textarea
            value={form.received}
            onChange={e => setForm(f => ({ ...f, received: e.target.value }))}
            placeholder="How did others seem to respond?"
            className="game-input w-full h-16 resize-none text-sm"
          />

          {/* Improvements */}
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Improvements for next time</span>
            <ListAdder
              placeholder="Add improvement..."
              items={form.improvements}
              onChange={items => setForm(f => ({ ...f, improvements: items }))}
            />
          </div>

          {/* Wins */}
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">What worked well (wins)</span>
            <ListAdder
              placeholder="Add a win..."
              items={form.wins}
              onChange={items => setForm(f => ({ ...f, wins: items }))}
            />
          </div>

          {/* Notes + date */}
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Additional notes..."
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

          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Progress by signal */}
      {last30.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Progress by Signal
            <span className="text-xs text-slate-500 font-normal">(last 30 entries)</span>
          </h3>
          <div className="space-y-2">
            {signalProgress.map(sp => {
              const posCount = POSITIVE_SIGNALS[sp.key].reduce((s, p) => {
                const counts: Record<string, number> = {}
                last30.forEach(o => { const v = o.signals[sp.key as SignalKey] as string; counts[v] = (counts[v] || 0) + 1 })
                return s + (counts[p] || 0)
              }, 0)
              const pct = last30.length > 0 ? Math.round((posCount / last30.length) * 100) : 0
              const topCounts: Record<string, number> = {}
              last30.forEach(o => { const v = o.signals[sp.key as SignalKey] as string; topCounts[v] = (topCounts[v] || 0) + 1 })
              const topEntry = Object.entries(topCounts).sort((a, b) => b[1] - a[1])[0]
              return (
                <div key={sp.key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-28 shrink-0">{sp.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: pct >= 60 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-36 shrink-0">
                    {topEntry ? topEntry[0].charAt(0).toUpperCase() + topEntry[0].slice(1) : '—'} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Context breakdown — SVG horizontal bars */}
      {contextAvgs.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Avg Impact by Context
          </h3>
          <svg width="100%" viewBox={`0 0 400 ${contextAvgs.length * 30 + 10}`} className="overflow-visible">
            {contextAvgs.map((c, i) => {
              const barW = (c.avg / maxContextAvg) * 270
              return (
                <g key={c.ctx} transform={`translate(0, ${i * 30})`}>
                  <text x="0" y="14" fontSize="11" fill="#94a3b8">
                    {c.emoji} {c.label}
                  </text>
                  <rect x="120" y="4" width={barW} height="16" rx="4" fill={c.color + '55'} />
                  <rect x="120" y="4" width={barW} height="16" rx="4" fill={c.color + '33'} />
                  <rect x="120" y="4" width={barW > 0 ? Math.min(barW, 6) : 0} height="16" rx="4" fill={c.color} />
                  <rect x="120" y="4" width={barW} height="16" rx="4" fill="url(#barGrad)" />
                  <rect x="120" y="4" width={barW} height="16" rx="4" fill={c.color} fillOpacity="0.5" />
                  <text x={125 + barW} y="15" fontSize="11" fill={c.color} fontWeight="600">
                    {c.avg.toFixed(1)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Improvement tracker */}
      {topImprovements.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Top Improvements to Make
          </h3>
          <div className="space-y-2">
            {topImprovements.map(([imp, count]) => (
              <div key={imp} className="flex items-center gap-2">
                <span className="flex-1 text-xs text-slate-300">{imp}</span>
                <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">
                  ×{count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Win wall */}
      {allWins.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Star className="w-4 h-4 text-green-400" />
            Win Wall
          </h3>
          <div className="max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {allWins.map((win, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20"
                >
                  {win}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent observations */}
      {observations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Observations</h3>
          {observations.slice(0, 10).map(o => {
            const ctx = CONTEXT_CONFIG[o.context]
            const isExpanded = expandedId === o.id
            return (
              <div key={o.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${ctx.color}` }}>
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                >
                  <span className="text-xl">{ctx.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ color: ctx.color }}>{ctx.label}</span>
                      <span className="text-xs text-slate-500">{o.date}</span>
                      <div className="flex gap-0.5">
                        {([1, 2, 3, 4, 5] as const).map(n => (
                          <Star
                            key={n}
                            className="w-3 h-3"
                            style={{ color: n <= o.overallImpact ? '#f59e0b' : '#334155', fill: n <= o.overallImpact ? '#f59e0b' : 'none' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); persist(observations.filter(x => x.id !== o.id)) }}
                      className="text-slate-700 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2">
                      {SIGNAL_KEYS.map(key => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-slate-500">{SIGNAL_LABELS[key]}</span>
                          <span className="text-slate-300 capitalize">{o.signals[key]}</span>
                        </div>
                      ))}
                    </div>
                    {o.received && (
                      <p className="text-xs text-slate-400"><span className="text-slate-500">Received: </span>{o.received}</p>
                    )}
                    {o.wins.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {o.wins.map((w, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs">✓ {w}</span>
                        ))}
                      </div>
                    )}
                    {o.improvements.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {o.improvements.map((imp, i) => (
                          <span key={i} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full text-xs">→ {imp}</span>
                        ))}
                      </div>
                    )}
                    {o.notes && <p className="text-xs text-slate-500 italic">{o.notes}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {observations.length === 0 && !showForm && (
        <div className="text-center py-14 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">93% of communication is non-verbal. Start tracking your body language.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log First Observation
          </button>
        </div>
      )}
    </div>
  )
}
