import { useState, useEffect, useRef, useCallback } from 'react'
import { BookOpen, Layers, Lightbulb, Zap, Heart, Star, Target, Globe, Shield, Eye } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'personal_playbook'

interface PlaybookData {
  coreIdentity: string
  nonNegotiables: string
  peakPerformanceRecipe: string
  rechargeProtocol: string
  decisionCriteria: string
  morningStandard: string
  eveningCloser: string
  oneYearVision: string
  lastUpdated: string
}

const DEFAULT_PLAYBOOK: PlaybookData = {
  coreIdentity: '',
  nonNegotiables: '',
  peakPerformanceRecipe: '',
  rechargeProtocol: '',
  decisionCriteria: '',
  morningStandard: '',
  eveningCloser: '',
  oneYearVision: '',
  lastUpdated: '',
}

type PlaybookKey = keyof Omit<PlaybookData, 'lastUpdated'>

interface Section {
  key: PlaybookKey
  title: string
  subtitle: string
  placeholder: string
  icon: React.ReactNode
  accentColor: string
}

const SECTIONS: Section[] = [
  {
    key: 'coreIdentity',
    title: 'My Core Identity',
    subtitle: 'Who you are at your best — your character, values, and non-negotiable traits.',
    placeholder: 'I am someone who...\nAt my best, I show up as...\nMy core values are...',
    icon: <Shield className="w-5 h-5 text-violet-400" />,
    accentColor: 'border-violet-500/30',
  },
  {
    key: 'nonNegotiables',
    title: 'My Non-Negotiables',
    subtitle: 'Daily and weekly habits so fundamental that skipping them is not an option.',
    placeholder: '• Morning meditation — non-negotiable\n• 8 hours sleep — non-negotiable\n• Daily movement — non-negotiable\n•...',
    icon: <Star className="w-5 h-5 text-amber-400" />,
    accentColor: 'border-amber-500/30',
  },
  {
    key: 'peakPerformanceRecipe',
    title: 'My Peak Performance Recipe',
    subtitle: 'The specific conditions, environment, and inputs that unlock your best work.',
    placeholder: 'I perform at my peak when...\nI need these conditions to do great work...\nMy optimal work schedule looks like...',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    accentColor: 'border-yellow-500/30',
  },
  {
    key: 'rechargeProtocol',
    title: 'My Recharge Protocol',
    subtitle: 'How you restore energy, recalibrate, and come back to yourself.',
    placeholder: 'When I am depleted, I restore by...\nActivities that genuinely recharge me...\nWarning signs I need to rest...',
    icon: <Heart className="w-5 h-5 text-pink-400" />,
    accentColor: 'border-pink-500/30',
  },
  {
    key: 'decisionCriteria',
    title: 'My Decision Criteria',
    subtitle: 'The filters and principles you use to make decisions aligned with your values.',
    placeholder: 'I say YES when...\nI say NO when...\nMy decision framework...\nWhen in doubt, I ask myself...',
    icon: <Lightbulb className="w-5 h-5 text-sky-400" />,
    accentColor: 'border-sky-500/30',
  },
  {
    key: 'morningStandard',
    title: 'My Morning Standard',
    subtitle: 'What a perfect morning looks like — the ritual that sets you up for a great day.',
    placeholder: 'My ideal morning starts at...\nFirst things I do upon waking...\nMy morning routine includes...\nBy 9am I want to feel...',
    icon: <Lightbulb className="w-5 h-5 text-orange-400" />,
    accentColor: 'border-orange-500/30',
  },
  {
    key: 'eveningCloser',
    title: 'My Evening Closer',
    subtitle: 'How you intentionally close each day — shutdown rituals and wind-down practices.',
    placeholder: 'My evening starts winding down at...\nHow I close out the workday...\nBefore bed I always...\nMy sleep setup includes...',
    icon: <Eye className="w-5 h-5 text-indigo-400" />,
    accentColor: 'border-indigo-500/30',
  },
  {
    key: 'oneYearVision',
    title: 'My 1-Year Vision',
    subtitle: 'What life looks like in 12 months — vivid, specific, and inspiring.',
    placeholder: 'In 12 months from now...\nMy health looks like...\nMy career/business looks like...\nMy relationships look like...\nI feel...',
    icon: <Globe className="w-5 h-5 text-emerald-400" />,
    accentColor: 'border-emerald-500/30',
  },
]

function loadPlaybook(): PlaybookData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_PLAYBOOK, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_PLAYBOOK }
}

function computeCompleteness(data: PlaybookData): number {
  const keys: PlaybookKey[] = [
    'coreIdentity', 'nonNegotiables', 'peakPerformanceRecipe', 'rechargeProtocol',
    'decisionCriteria', 'morningStandard', 'eveningCloser', 'oneYearVision',
  ]
  const filled = keys.filter(k => data[k].trim().length > 0).length
  return Math.round((filled / keys.length) * 100)
}

export default function PersonalPlaybook() {
  const { toastSuccess } = useToast()
  const [playbook, setPlaybook] = useState<PlaybookData>(loadPlaybook)
  const [lastSaved, setLastSaved] = useState<string>(loadPlaybook().lastUpdated || '')
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const completeness = computeCompleteness(playbook)

  const completenessColor =
    completeness >= 75 ? 'bg-emerald-500' :
    completeness >= 50 ? 'bg-violet-500' :
    completeness >= 25 ? 'bg-amber-500' : 'bg-slate-600'

  const savePlaybook = useCallback((data: PlaybookData) => {
    const withTimestamp = { ...data, lastUpdated: new Date().toISOString() }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp))
      setLastSaved(withTimestamp.lastUpdated)
    } catch { /* ignore */ }
  }, [])

  function handleChange(key: PlaybookKey, value: string) {
    const updated = { ...playbook, [key]: value }
    setPlaybook(updated)

    // Debounce per field
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }
    debounceTimers.current[key] = setTimeout(() => {
      savePlaybook(updated)
      toastSuccess('Playbook auto-saved', key.replace(/([A-Z])/g, ' $1').trim())
    }, 1200)
  }

  // Cleanup on unmount
  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      Object.values(timers).forEach(t => clearTimeout(t))
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-6 h-6 text-violet-400" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            Personal Playbook
          </h1>
        </div>
        <p className="text-slate-400 text-sm">Your living personal operating manual — auto-saved as you type.</p>
      </div>

      {/* Completeness Card */}
      <div className="game-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span className="font-semibold text-sm">Playbook Completeness</span>
          </div>
          <span
            className="text-2xl font-black text-violet-400"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {completeness}%
          </span>
        </div>

        <div className="bg-slate-700/50 rounded-full h-3 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${completenessColor}`}
            style={{ width: `${completeness}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>{SECTIONS.filter(s => playbook[s.key].trim().length > 0).length} of {SECTIONS.length} sections filled</span>
          {lastSaved && (
            <span>Last saved: {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>

        {completeness < 100 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {SECTIONS.filter(s => !playbook[s.key].trim()).map(s => (
              <span key={s.key} className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                {s.title}
              </span>
            ))}
          </div>
        )}

        {completeness === 100 && (
          <div className="mt-3 text-center text-sm text-emerald-400 font-semibold">
            Your playbook is complete. You have your operating manual.
          </div>
        )}
      </div>

      {/* Target Progress Overview */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {SECTIONS.map(section => {
          const isFilled = playbook[section.key].trim().length > 0
          return (
            <div
              key={section.key}
              className={`game-card text-center py-3 border ${isFilled ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-slate-700/50'}`}
            >
              <div className="flex justify-center mb-1">{section.icon}</div>
              <p className="text-xs text-slate-400 leading-tight">
                {section.title.replace('My ', '')}
              </p>
              {isFilled && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mt-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {SECTIONS.map(section => {
          const isFilled = playbook[section.key].trim().length > 0
          return (
            <div key={section.key} className={`game-card border ${section.accentColor}`}>
              {/* Section header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="mt-0.5">{section.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-100">{section.title}</h3>
                    {isFilled && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Filled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{section.subtitle}</p>
                </div>
              </div>

              {/* Character count */}
              <div className="flex justify-end mb-2">
                <span className="text-xs text-slate-600">
                  {playbook[section.key].length} chars
                </span>
              </div>

              {/* Textarea */}
              <textarea
                className="game-input w-full resize-none"
                rows={5}
                placeholder={section.placeholder}
                value={playbook[section.key]}
                onChange={e => handleChange(section.key, e.target.value)}
              />
            </div>
          )
        })}
      </div>

      {/* Bottom status */}
      <div className="mt-6 text-center text-xs text-slate-500">
        <Target className="w-3 h-3 inline mr-1" />
        Changes auto-save as you type. Your playbook lives at{' '}
        <span className="text-slate-400 font-mono">{STORAGE_KEY}</span>
      </div>
    </div>
  )
}
