import { useState, useEffect, useRef, useCallback } from 'react'
import { Target, Clock, CheckCircle2, Layers } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface HorizonData {
  '1y-where': string
  '1y-start': string
  '1y-stop': string
  '3y-becoming': string
  '3y-built': string
  '3y-life': string
  '5y-legacy': string
  '5y-achievement': string
  '5y-relationships': string
  '10y-work': string
  '10y-impact': string
  '10y-transformation': string
}

const EMPTY_PLAN: HorizonData = {
  '1y-where': '',
  '1y-start': '',
  '1y-stop': '',
  '3y-becoming': '',
  '3y-built': '',
  '3y-life': '',
  '5y-legacy': '',
  '5y-achievement': '',
  '5y-relationships': '',
  '10y-work': '',
  '10y-impact': '',
  '10y-transformation': '',
}

const STORAGE_KEY = 'strategic_life_plan'

const HORIZONS = [
  {
    id: '1y' as const,
    label: '1 Year',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-900/20',
    dot: 'bg-violet-500',
    fields: [
      { key: '1y-where' as keyof HorizonData, label: 'Where do you want to be?', placeholder: 'Describe your life in one year...' },
      { key: '1y-start' as keyof HorizonData, label: 'What must you start?', placeholder: 'New habits, projects, relationships...' },
      { key: '1y-stop' as keyof HorizonData, label: 'What must you stop?', placeholder: 'Patterns, beliefs, behaviors to release...' },
    ],
  },
  {
    id: '3y' as const,
    label: '3 Years',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-900/20',
    dot: 'bg-blue-500',
    fields: [
      { key: '3y-becoming' as keyof HorizonData, label: 'Who are you becoming?', placeholder: 'The person you are evolving into...' },
      { key: '3y-built' as keyof HorizonData, label: 'What have you built?', placeholder: 'Projects, systems, skills, legacy...' },
      { key: '3y-life' as keyof HorizonData, label: 'What does your life look like?', placeholder: 'Daily reality, environment, relationships...' },
    ],
  },
  {
    id: '5y' as const,
    label: '5 Years',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-900/20',
    dot: 'bg-emerald-500',
    fields: [
      { key: '5y-legacy' as keyof HorizonData, label: 'What is your legacy starting to show?', placeholder: 'How others experience your impact...' },
      { key: '5y-achievement' as keyof HorizonData, label: 'Your biggest achievement', placeholder: 'The thing you are most proud of...' },
      { key: '5y-relationships' as keyof HorizonData, label: 'Your relationships', placeholder: 'How you love and are loved...' },
    ],
  },
  {
    id: '10y' as const,
    label: '10 Years',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-900/20',
    dot: 'bg-amber-500',
    fields: [
      { key: '10y-work' as keyof HorizonData, label: "Your life's defining work", placeholder: 'The mission that defines your era...' },
      { key: '10y-impact' as keyof HorizonData, label: 'Your impact on others', placeholder: 'How the world is different because of you...' },
      { key: '10y-transformation' as keyof HorizonData, label: 'Your personal transformation', placeholder: 'Who you became across this decade...' },
    ],
  },
]

export default function StrategicLifePlan() {
  const { toastSuccess } = useToast()
  const [plan, setPlan] = useState<HorizonData>(EMPTY_PLAN)
  const [activeHorizon, setActiveHorizon] = useState<string>('1y')
  const [lastSaved, setLastSaved] = useState<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.plan) setPlan({ ...EMPTY_PLAN, ...parsed.plan })
        if (parsed.savedAt) setLastSaved(parsed.savedAt)
      }
    } catch { /**/ }
  }, [])

  const save = useCallback((data: HorizonData) => {
    const savedAt = new Date().toLocaleString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan: data, savedAt }))
    setLastSaved(savedAt)
    toastSuccess('Plan saved', 'Your future is being written.')
  }, [toastSuccess])

  const updateField = (key: keyof HorizonData, value: string) => {
    const updated = { ...plan, [key]: value }
    setPlan(updated)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(updated), 800)
  }

  const filledCount = Object.values(plan).filter(v => v.trim().length > 0).length
  const completeness = Math.round((filledCount / 12) * 100)

  const currentHorizon = HORIZONS.find(h => h.id === activeHorizon) ?? HORIZONS[0]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Target className="w-7 h-7 text-violet-400" />
          Strategic Life Plan
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Your future is written here.</p>
      </div>

      {/* Timeline */}
      <div className="game-card p-4">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 h-0.5 bg-slate-700 top-1/2 -translate-y-1/2 z-0" />
          {HORIZONS.map(h => (
            <button
              key={h.id}
              onClick={() => setActiveHorizon(h.id)}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  activeHorizon === h.id
                    ? `${h.dot} border-white scale-125`
                    : `bg-slate-700 border-slate-600`
                }`}
              />
              <span className={`text-xs font-semibold ${activeHorizon === h.id ? h.color : 'text-slate-500'}`}>
                {h.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Plan Completeness */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Plan Completeness</span>
          </div>
          <span className="text-sm font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {completeness}%
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-500">{filledCount} / 12 fields filled</span>
          {lastSaved && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Saved {lastSaved}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Horizon Fields */}
      <div className={`game-card p-4 border ${currentHorizon.border} space-y-4`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${currentHorizon.dot}`} />
          <h2 className={`text-base font-bold ${currentHorizon.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {currentHorizon.label} Horizon
          </h2>
        </div>
        {currentHorizon.fields.map(field => {
          const val = plan[field.key]
          return (
            <div key={field.key} className={`rounded-xl p-3 ${currentHorizon.bg}`}>
              <div className="flex items-center gap-1.5 mb-2">
                {val.trim().length > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                <label className="text-xs font-semibold text-slate-300">{field.label}</label>
              </div>
              <textarea
                value={val}
                onChange={e => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="game-input w-full text-sm resize-none"
              />
            </div>
          )
        })}
      </div>

      {/* Horizon Quick Nav */}
      <div className="grid grid-cols-4 gap-2">
        {HORIZONS.map(h => {
          const filled = h.fields.filter(f => plan[f.key].trim().length > 0).length
          return (
            <button
              key={h.id}
              onClick={() => setActiveHorizon(h.id)}
              className={`game-card p-3 text-center transition-all ${
                activeHorizon === h.id ? `border ${h.border}` : ''
              }`}
            >
              <div className={`text-xs font-bold ${h.color}`}>{h.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{filled}/3</div>
            </button>
          )
        })}
      </div>

      {completeness === 100 && (
        <div className="game-card p-4 border border-green-500/30 bg-green-900/20 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-300">Your strategic life plan is complete.</p>
          <p className="text-xs text-slate-400 mt-1">Review it monthly. Refine it as you grow.</p>
        </div>
      )}
    </div>
  )
}
