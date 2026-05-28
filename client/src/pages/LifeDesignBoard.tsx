import { useState, useEffect, useRef } from 'react'
import { useToast } from '../contexts/ToastContext'
import {
  Compass, Star, Brain, Heart, TrendingUp, Globe, Zap, Sun,
  CheckCircle2, BarChart3, Layers, Target,
} from 'lucide-react'

const STORAGE_KEY = 'life_design_board'

interface AreaData {
  currentReality: string
  idealVision: string
  gap: string
  nextStep: string
}

interface LifeDesignState {
  [area: string]: AreaData
}

interface AreaConfig {
  name: string
  icon: React.ReactNode
  accent: string
  border: string
  bg: string
}

const LIFE_AREAS: AreaConfig[] = [
  {
    name: 'Career & Purpose',
    icon: <Target className="w-4 h-4" />,
    accent: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-900/10',
  },
  {
    name: 'Health & Body',
    icon: <Zap className="w-4 h-4" />,
    accent: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-900/10',
  },
  {
    name: 'Mind & Learning',
    icon: <Brain className="w-4 h-4" />,
    accent: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-900/10',
  },
  {
    name: 'Love & Relationships',
    icon: <Heart className="w-4 h-4" />,
    accent: 'text-pink-400',
    border: 'border-pink-500/30',
    bg: 'bg-pink-900/10',
  },
  {
    name: 'Money & Wealth',
    icon: <TrendingUp className="w-4 h-4" />,
    accent: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-900/10',
  },
  {
    name: 'Adventure & Fun',
    icon: <Compass className="w-4 h-4" />,
    accent: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-900/10',
  },
  {
    name: 'Contribution & Impact',
    icon: <Globe className="w-4 h-4" />,
    accent: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-900/10',
  },
  {
    name: 'Spirituality & Peace',
    icon: <Sun className="w-4 h-4" />,
    accent: 'text-slate-300',
    border: 'border-slate-500/30',
    bg: 'bg-slate-800/40',
  },
]

const FIELD_LABELS: { key: keyof AreaData; label: string; placeholder: string }[] = [
  { key: 'currentReality', label: 'Current Reality', placeholder: 'Where are you right now in this area?' },
  { key: 'idealVision', label: 'Ideal Vision', placeholder: 'Where do you want to be? Paint the dream.' },
  { key: 'gap', label: 'The Gap', placeholder: "What's between here and your vision?" },
  { key: 'nextStep', label: 'Next Step', placeholder: 'One concrete action to take.' },
]

const EMPTY_AREA: AreaData = { currentReality: '', idealVision: '', gap: '', nextStep: '' }

function countFilled(data: AreaData): number {
  return Object.values(data).filter(v => v.trim()).length
}

function loadFromStorage(): LifeDesignState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  const state: LifeDesignState = {}
  LIFE_AREAS.forEach(a => { state[a.name] = { ...EMPTY_AREA } })
  return state
}

export default function LifeDesignBoard() {
  const { toastSuccess } = useToast()
  const [design, setDesign] = useState<LifeDesignState>(loadFromStorage)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedRef = useRef(false)

  // Auto-save with debounce
  useEffect(() => {
    if (!savedRef.current) {
      savedRef.current = true
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
      toastSuccess('Life design auto-saved.')
    }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [design])

  const updateField = (area: string, field: keyof AreaData, value: string) => {
    setDesign(d => ({
      ...d,
      [area]: { ...(d[area] ?? EMPTY_AREA), [field]: value },
    }))
  }

  // Stats
  const totalFields = 8 * 4 // 32
  const totalFilled = LIFE_AREAS.reduce((sum, a) => sum + countFilled(design[a.name] ?? EMPTY_AREA), 0)
  const completeness = Math.round((totalFilled / totalFields) * 100)

  const areaCounts = LIFE_AREAS.map(a => ({ name: a.name, count: countFilled(design[a.name] ?? EMPTY_AREA) }))
  const mostDefined = areaCounts.sort((a, b) => b.count - a.count)[0]
  const biggestGap = [...areaCounts].sort((a, b) => a.count - b.count)[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Layers className="w-8 h-8 text-violet-400" />
          Life Design Board
        </h1>
        <p className="text-slate-400 mt-1">Plan and visualize your ideal life across all areas. Auto-saves as you type.</p>
      </div>

      {/* Stats */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-slate-300">Design Completeness</span>
          </div>
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {completeness}%
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="text-xs text-slate-500">{totalFilled} / {totalFields} fields filled</div>
          <div className="flex gap-4">
            <div className="text-xs">
              <span className="text-slate-500">Most defined: </span>
              <span className="text-green-400 font-medium">{mostDefined?.name}</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-500">Biggest gap: </span>
              <span className="text-amber-400 font-medium">{biggestGap?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LIFE_AREAS.map(area => {
          const areaData = design[area.name] ?? EMPTY_AREA
          const filled = countFilled(areaData)
          return (
            <div key={area.name} className={`game-card p-4 border ${area.border} ${area.bg} space-y-4 flex flex-col`}>
              {/* Card header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={area.accent}>{area.icon}</span>
                  <h3 className={`text-sm font-bold ${area.accent}`}>{area.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i < filled ? area.accent.replace('text-', 'bg-') : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-3 flex-1">
                {FIELD_LABELS.map(fl => (
                  <div key={fl.key}>
                    <label className="block text-xs text-slate-500 mb-1">{fl.label}</label>
                    <input
                      className="game-input w-full text-xs"
                      placeholder={fl.placeholder}
                      value={areaData[fl.key]}
                      onChange={e => updateField(area.name, fl.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Completion indicator */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                {filled === 4
                  ? <CheckCircle2 className={`w-3.5 h-3.5 ${area.accent}`} />
                  : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                }
                <span className="text-xs text-slate-500">{filled}/4 defined</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Completeness breakdown table */}
      <div className="game-card p-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-violet-400" />
          Area Progress
        </h2>
        <div className="space-y-2">
          {LIFE_AREAS.map((area, i) => {
            const filled = countFilled(design[area.name] ?? EMPTY_AREA)
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-40 text-xs font-medium ${area.accent} flex-shrink-0 truncate`}>{area.name}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${area.accent.replace('text-', 'bg-')}`}
                    style={{ width: `${(filled / 4) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{filled}/4</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tip */}
      <div className="game-card p-4 border border-violet-500/20 bg-violet-900/10">
        <div className="flex items-start gap-3">
          <Compass className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-300">Life Design Principle</p>
            <p className="text-xs text-slate-400 mt-1">
              You don't rise to the level of your goals — you fall to the level of your systems. Design your life on purpose.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
