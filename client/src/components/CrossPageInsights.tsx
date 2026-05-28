import { Link } from 'react-router-dom'
import { Lightbulb, ArrowRight, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { useLifeData, LifeDimension } from '../hooks/useLifeData'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrossPageInsightsProps {
  contextKey: string
  compact?: boolean
}

interface CorrelationConfig {
  affects: string[]
  affectedBy: string[]
  tips: string[]
}

// ─── Correlation map (by label key, lowercase) ────────────────────────────────

const CORRELATIONS: Record<string, CorrelationConfig> = {
  sleep: {
    affectedBy: ['energy', 'willpower', 'peace'],
    affects:    ['energy', 'mind', 'body', 'excellence'],
    tips: [
      'Your willpower log shows patterns that affect sleep',
      'Track your energy to see sleep correlations',
    ],
  },
  energy: {
    affectedBy: ['sleep', 'body', 'joy'],
    affects:    ['excellence', 'mind', 'willpower', 'joy'],
    tips: [
      'Sleep quality is the #1 driver of energy levels',
      'Log your body metrics to spot energy patterns',
    ],
  },
  willpower: {
    affectedBy: ['sleep', 'energy', 'peace'],
    affects:    ['excellence', 'growth', 'resilience'],
    tips: [
      'Low sleep often depletes willpower reserves',
      'Tracking peace can reveal willpower triggers',
    ],
  },
  mind: {
    affectedBy: ['sleep', 'energy', 'body'],
    affects:    ['growth', 'excellence', 'purpose'],
    tips: [
      'Sleep quality directly impacts cognitive sharpness',
      'Physical activity boosts neuroplasticity significantly',
    ],
  },
  body: {
    affectedBy: ['sleep', 'energy', 'joy'],
    affects:    ['energy', 'mind', 'willpower', 'excellence'],
    tips: [
      'Recovery (sleep) directly affects physical performance',
      'Energy levels predict workout quality',
    ],
  },
  joy: {
    affectedBy: ['peace', 'social', 'purpose'],
    affects:    ['energy', 'willpower', 'excellence'],
    tips: [
      'Inner peace creates the foundation for lasting joy',
      'Social connections are a powerful joy amplifier',
    ],
  },
  peace: {
    affectedBy: ['willpower', 'purpose', 'resilience'],
    affects:    ['sleep', 'joy', 'energy'],
    tips: [
      'Willpower depletion often disturbs inner peace',
      'A clear purpose significantly boosts peace of mind',
    ],
  },
  purpose: {
    affectedBy: ['growth', 'resilience', 'social'],
    affects:    ['joy', 'excellence', 'peace'],
    tips: [
      'Growth mindset work deepens your sense of purpose',
      'Strong social connections clarify your purpose',
    ],
  },
  social: {
    affectedBy: ['energy', 'peace', 'joy'],
    affects:    ['purpose', 'joy', 'resilience'],
    tips: [
      'Energy levels affect the quality of social interactions',
      'Peace of mind improves how you show up socially',
    ],
  },
  growth: {
    affectedBy: ['mind', 'willpower', 'resilience'],
    affects:    ['purpose', 'excellence', 'social'],
    tips: [
      'Cognitive sharpness unlocks faster growth',
      'Resilience is the engine behind sustained growth',
    ],
  },
  resilience: {
    affectedBy: ['sleep', 'willpower', 'purpose'],
    affects:    ['growth', 'peace', 'excellence'],
    tips: [
      'Sleep is one of the strongest resilience restorers',
      'A strong sense of purpose builds emotional resilience',
    ],
  },
  excellence: {
    affectedBy: ['energy', 'mind', 'willpower'],
    affects:    ['growth', 'purpose', 'social'],
    tips: [
      'Peak energy is the prerequisite for daily excellence',
      'Mental sharpness amplifies the quality of your output',
    ],
  },
  'life review': {
    affectedBy: ['purpose', 'growth', 'excellence'],
    affects:    ['purpose', 'resilience', 'peace'],
    tips: [
      'Regular life reviews deepen your sense of purpose',
      'Reviewing progress builds resilience through perspective',
    ],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCorrelation(contextKey: string): CorrelationConfig {
  const k = contextKey.toLowerCase()
  return (
    CORRELATIONS[k] ?? {
      affectedBy: [],
      affects: [],
      tips: ['Keep tracking consistently to reveal insights'],
    }
  )
}

function findDim(dimensions: LifeDimension[], label: string): LifeDimension | undefined {
  return dimensions.find(d => d.label.toLowerCase() === label.toLowerCase())
}

interface Insight {
  type: 'warning' | 'positive' | 'tip'
  text: string
  icon: 'up' | 'down' | 'neutral'
}

function buildInsights(
  contextKey: string,
  dimensions: LifeDimension[],
): Insight[] {
  const corr = getCorrelation(contextKey)
  const insights: Insight[] = []

  const ctxDim = findDim(dimensions, contextKey)
  const ctxScore = ctxDim?.score ?? null

  // affectedBy: if any prerequisite is low, warn
  corr.affectedBy.forEach(depLabel => {
    const dep = findDim(dimensions, depLabel)
    if (!dep || dep.score === null) return
    if (dep.score < 60 && ctxScore !== null && ctxScore < 70) {
      insights.push({
        type: 'warning',
        text: `Your ${dep.label.toLowerCase()} score (${Math.round(dep.score)}) may be dragging down your ${contextKey} — they're strongly correlated`,
        icon: 'down',
      })
    } else if (dep.score >= 80) {
      insights.push({
        type: 'positive',
        text: `Strong ${dep.label.toLowerCase()} (${Math.round(dep.score)}) is positively supporting your ${contextKey}`,
        icon: 'up',
      })
    }
  })

  // affects: show what this dimension influences
  if (ctxScore !== null && ctxScore >= 80) {
    const first = corr.affects[0]
    if (first) {
      insights.push({
        type: 'positive',
        text: `High ${contextKey} score (${Math.round(ctxScore)}) is boosting your ${first} — keep it up`,
        icon: 'up',
      })
    }
  }

  // Fill with static tips if needed
  if (insights.length < 2) {
    corr.tips.slice(0, 2 - insights.length).forEach(tip => {
      insights.push({ type: 'tip', text: tip, icon: 'neutral' })
    })
  }

  return insights.slice(0, 3)
}

function getQuickLinks(
  contextKey: string,
  dimensions: LifeDimension[],
): LifeDimension[] {
  const corr = getCorrelation(contextKey)
  const candidates = [...corr.affectedBy, ...corr.affects]
  return candidates
    .map(label => findDim(dimensions, label))
    .filter((d): d is LifeDimension => d !== undefined)
    .filter(d => d.score !== null && d.score < 70)
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
    .slice(0, 2)
}

// ─── Insight Icon ─────────────────────────────────────────────────────────────

function InsightIcon({ icon }: { icon: Insight['icon'] }) {
  if (icon === 'up') return <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
  if (icon === 'down') return <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
  return <Lightbulb className="w-4 h-4 text-violet-400 shrink-0" />
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CrossPageInsights({ contextKey, compact = false }: CrossPageInsightsProps) {
  const { dimensions } = useLifeData()
  const insights = buildInsights(contextKey, dimensions)
  const links = getQuickLinks(contextKey, dimensions)

  if (compact) {
    const first = insights[0]
    const firstLink = links[0]
    if (!first) return null
    return (
      <div className="game-card p-3 flex items-start gap-2">
        <InsightIcon icon={first.icon} />
        <p className="text-xs text-slate-400 flex-1 leading-relaxed">{first.text}</p>
        {firstLink && (
          <Link
            to={firstLink.route}
            className="ml-2 shrink-0 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {firstLink.emoji} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="game-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Platform Insights</h3>
          <p className="text-xs text-slate-500">Based on your cross-platform data</p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3 mb-4">
        {insights.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Log more entries to unlock cross-page insights.</p>
        ) : (
          insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-3 rounded-lg text-xs leading-relaxed ${
                insight.type === 'warning'
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                  : insight.type === 'positive'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-200'
                  : 'bg-slate-700/50 border border-slate-600/50 text-slate-300'
              }`}
            >
              <InsightIcon icon={insight.icon} />
              <span>{insight.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Quick Links */}
      {links.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
            Needs attention
          </p>
          <div className="flex flex-wrap gap-2">
            {links.map(dim => (
              <Link
                key={dim.key + dim.label}
                to={dim.route}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-violet-500/50 transition-all text-xs text-slate-300 hover:text-white"
              >
                <span>{dim.emoji}</span>
                <span>{dim.label}</span>
                {dim.score !== null && (
                  <span
                    className="font-mono text-xs ml-1"
                    style={{ color: dim.score < 50 ? '#ef4444' : '#f59e0b' }}
                  >
                    {Math.round(dim.score)}
                  </span>
                )}
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
