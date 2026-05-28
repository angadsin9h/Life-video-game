import { useState, useEffect, useCallback } from 'react'
import { Target, Edit2, Check, Copy, Sparkles, Star, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AreaVision {
  vision10yr: string
  milestone3yr: string
  milestone1yr: string
  currentReality: string
}

type LifeVisionData = Record<string, AreaVision>

// ─── Life Areas ───────────────────────────────────────────────────────────────

const LIFE_AREAS = [
  {
    key: 'career',
    name: 'Career',
    emoji: '💼',
    color: '#3b82f6',
    description: 'Work, purpose, professional impact',
  },
  {
    key: 'relationships',
    name: 'Relationships',
    emoji: '💞',
    color: '#ec4899',
    description: 'Partner, family, friendships',
  },
  {
    key: 'health',
    name: 'Health',
    emoji: '💪',
    color: '#22c55e',
    description: 'Body, fitness, longevity',
  },
  {
    key: 'finances',
    name: 'Finances',
    emoji: '💰',
    color: '#eab308',
    description: 'Wealth, freedom, security',
  },
  {
    key: 'adventures',
    name: 'Adventures',
    emoji: '🌍',
    color: '#f97316',
    description: 'Travel, experiences, exploration',
  },
  {
    key: 'growth',
    name: 'Personal Growth',
    emoji: '🧠',
    color: '#8b5cf6',
    description: 'Learning, wisdom, becoming',
  },
  {
    key: 'home',
    name: 'Home & Environment',
    emoji: '🏡',
    color: '#14b8a6',
    description: 'Living space, surroundings, sanctuary',
  },
  {
    key: 'spirituality',
    name: 'Spirituality',
    emoji: '✨',
    color: '#a78bfa',
    description: 'Purpose, connection, inner peace',
  },
  {
    key: 'hobbies',
    name: 'Fun & Hobbies',
    emoji: '🎨',
    color: '#fb7185',
    description: 'Joy, creativity, passions',
  },
  {
    key: 'legacy',
    name: 'Legacy',
    emoji: '🌱',
    color: '#84cc16',
    description: 'Impact, contribution, memory',
  },
]

// ─── Vision Quotes ────────────────────────────────────────────────────────────

const VISION_QUOTES = [
  { text: 'The clearest sign of wisdom is seeing who you could become.', author: 'Marcus Aurelius' },
  { text: "Vision without execution is hallucination.", author: 'Thomas Edison' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: 'Your vision will become clear only when you can look into your own heart.', author: 'Carl Jung' },
  { text: 'Create the highest, grandest vision possible for your life — because you become what you believe.', author: 'Oprah Winfrey' },
  { text: 'If you don\'t design your own life plan, chances are you\'ll fall into someone else\'s plan.', author: 'Jim Rohn' },
  { text: 'The only thing worse than being blind is having sight but no vision.', author: 'Helen Keller' },
]

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'life_vision'

function loadVision(): LifeVisionData {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveVision(data: LifeVisionData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function emptyArea(): AreaVision {
  return { vision10yr: '', milestone3yr: '', milestone1yr: '', currentReality: '' }
}

function isAreaComplete(area: AreaVision): boolean {
  return (
    area.vision10yr.trim().length > 0 &&
    area.milestone3yr.trim().length > 0 &&
    area.milestone1yr.trim().length > 0 &&
    area.currentReality.trim().length > 0
  )
}

function visionScore(data: LifeVisionData): number {
  if (LIFE_AREAS.length === 0) return 0
  const complete = LIFE_AREAS.filter(a => {
    const d = data[a.key]
    return d && isAreaComplete(d)
  }).length
  return Math.round((complete / LIFE_AREAS.length) * 100)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LifeVision() {
  const { toastSuccess } = useToast()

  const [visionData, setVisionData] = useState<LifeVisionData>(() => loadVision())
  const [editingArea, setEditingArea] = useState<string | null>(null)
  const [draftFields, setDraftFields] = useState<AreaVision>(emptyArea())
  const [quoteIdx] = useState<number>(() => {
    const seed = new Date().getDate() + new Date().getMonth() * 31
    return seed % VISION_QUOTES.length
  })
  const [copied, setCopied] = useState(false)

  const score = visionScore(visionData)
  const completedCount = LIFE_AREAS.filter(a => {
    const d = visionData[a.key]
    return d && isAreaComplete(d)
  }).length

  // Open an area for editing
  const openArea = (key: string) => {
    const existing = visionData[key] || emptyArea()
    setDraftFields({ ...existing })
    setEditingArea(key)
  }

  const closeArea = () => {
    setEditingArea(null)
    setDraftFields(emptyArea())
  }

  const saveArea = (key: string) => {
    const updated: LifeVisionData = {
      ...visionData,
      [key]: { ...draftFields },
    }
    setVisionData(updated)
    saveVision(updated)
    const area = LIFE_AREAS.find(a => a.key === key)
    toastSuccess(`${area?.name || 'Area'} vision saved!`)
    closeArea()
  }

  const handleDraftChange = (field: keyof AreaVision, value: string) => {
    setDraftFields(prev => ({ ...prev, [field]: value }))
  }

  // Copy vision summary to clipboard
  const copyVisionSummary = useCallback(() => {
    const lines: string[] = ['MY 10-YEAR LIFE VISION', '='.repeat(40), '']

    for (const area of LIFE_AREAS) {
      const d = visionData[area.key]
      if (!d) continue

      const hasContent =
        d.vision10yr.trim() || d.milestone3yr.trim() || d.milestone1yr.trim() || d.currentReality.trim()
      if (!hasContent) continue

      lines.push(`${area.emoji} ${area.name.toUpperCase()}`)
      lines.push('-'.repeat(30))
      if (d.currentReality.trim()) lines.push(`Current Reality: ${d.currentReality.trim()}`)
      if (d.milestone1yr.trim()) lines.push(`1-Year Milestone: ${d.milestone1yr.trim()}`)
      if (d.milestone3yr.trim()) lines.push(`3-Year Milestone: ${d.milestone3yr.trim()}`)
      if (d.vision10yr.trim()) lines.push(`10-Year Vision: ${d.vision10yr.trim()}`)
      lines.push('')
    }

    lines.push(`Vision Score: ${score}% complete (${completedCount}/${LIFE_AREAS.length} areas fully defined)`)

    const text = lines.join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toastSuccess('Vision copied to clipboard!', 'Share it, print it, post it.')
      setTimeout(() => setCopied(false), 2500)
    })
  }, [visionData, score, completedCount, toastSuccess])

  const quote = VISION_QUOTES[quoteIdx]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Eye className="w-7 h-7 text-cyan-400" />
            Life Vision
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define your 10-year future across every dimension of life</p>
        </div>
        <button
          onClick={copyVisionSummary}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Summary'}
        </button>
      </div>

      {/* ── Quote Banner ── */}
      <div className="game-card p-5 border border-cyan-500/20 bg-cyan-900/5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-200 text-sm italic leading-relaxed">"{quote.text}"</p>
            <p className="text-xs text-slate-500 mt-1">— {quote.author}</p>
          </div>
        </div>
      </div>

      {/* ── Vision Score ── */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-slate-200">Overall Vision Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {score}%
            </span>
            <span className="text-xs text-slate-500">{completedCount}/{LIFE_AREAS.length} complete</span>
          </div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${score}%`,
              background: score === 100
                ? '#22c55e'
                : 'linear-gradient(to right, #06b6d4, #8b5cf6)',
            }}
          />
        </div>
        {score === 0 && (
          <p className="text-xs text-slate-600 mt-2">Click any life area below to begin defining your vision</p>
        )}
        {score === 100 && (
          <p className="text-xs text-green-400 mt-2 font-semibold">All areas complete — your full life vision is defined!</p>
        )}
      </div>

      {/* ── Life Areas Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LIFE_AREAS.map(area => {
          const data = visionData[area.key] || emptyArea()
          const complete = isAreaComplete(data)
          const hasAny =
            data.vision10yr.trim() ||
            data.milestone3yr.trim() ||
            data.milestone1yr.trim() ||
            data.currentReality.trim()
          const isOpen = editingArea === area.key

          return (
            <div
              key={area.key}
              className="game-card p-5 transition-all"
              style={isOpen ? { borderColor: area.color, borderWidth: '1.5px' } : undefined}
            >
              {/* Area Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{area.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{area.name}</h3>
                    <p className="text-xs text-slate-500">{area.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {complete && (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                  )}
                  {!complete && hasAny && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: area.color, opacity: 0.7 }}
                    />
                  )}
                  <button
                    onClick={() => isOpen ? closeArea() : openArea(area.key)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-slate-700"
                  >
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <Edit2 className="w-4 h-4 text-slate-500" />
                    }
                  </button>
                </div>
              </div>

              {/* Vision preview (collapsed) */}
              {!isOpen && hasAny && (
                <div className="space-y-1.5">
                  {data.vision10yr.trim() && (
                    <div>
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">10-Year Vision  </span>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{data.vision10yr}</p>
                    </div>
                  )}
                  {!data.vision10yr.trim() && data.currentReality.trim() && (
                    <div>
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Current Reality  </span>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{data.currentReality}</p>
                    </div>
                  )}
                  <div className="flex gap-1 mt-2">
                    {(['currentReality', 'milestone1yr', 'milestone3yr', 'vision10yr'] as const).map(field => (
                      <div
                        key={field}
                        className="flex-1 h-1 rounded-full"
                        style={{
                          background: data[field].trim()
                            ? area.color
                            : '#1e293b',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!isOpen && !hasAny && (
                <button
                  onClick={() => openArea(area.key)}
                  className="w-full py-3 text-xs text-slate-600 hover:text-slate-400 border border-dashed border-slate-700 hover:border-slate-600 rounded-xl transition-colors"
                >
                  + Define your {area.name.toLowerCase()} vision
                </button>
              )}

              {/* Expanded Editor */}
              {isOpen && (
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: area.color }}>
                      Current Reality
                    </label>
                    <p className="text-xs text-slate-600 mb-1">Where are you right now in this area?</p>
                    <textarea
                      value={draftFields.currentReality}
                      onChange={e => handleDraftChange('currentReality', e.target.value)}
                      placeholder="Be honest — what does your current situation look like?"
                      className="game-input w-full min-h-[70px] resize-y text-sm leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: area.color }}>
                      1-Year Milestone
                    </label>
                    <p className="text-xs text-slate-600 mb-1">What will you have accomplished 1 year from now?</p>
                    <textarea
                      value={draftFields.milestone1yr}
                      onChange={e => handleDraftChange('milestone1yr', e.target.value)}
                      placeholder="Specific, measurable progress you can make in 12 months..."
                      className="game-input w-full min-h-[70px] resize-y text-sm leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: area.color }}>
                      3-Year Milestone
                    </label>
                    <p className="text-xs text-slate-600 mb-1">Where will you be in 3 years if you stay on course?</p>
                    <textarea
                      value={draftFields.milestone3yr}
                      onChange={e => handleDraftChange('milestone3yr', e.target.value)}
                      placeholder="Significant growth, achievements, transformations..."
                      className="game-input w-full min-h-[70px] resize-y text-sm leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: area.color }}>
                      10-Year Vision
                    </label>
                    <p className="text-xs text-slate-600 mb-1">Dream boldly — what does your ideal life look like in 10 years?</p>
                    <textarea
                      value={draftFields.vision10yr}
                      onChange={e => handleDraftChange('vision10yr', e.target.value)}
                      placeholder="Write in present tense as if it's already real. Be vivid, specific, inspiring..."
                      className="game-input w-full min-h-[90px] resize-y text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => saveArea(area.key)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-white"
                      style={{ background: area.color }}
                    >
                      <Check className="w-4 h-4" />
                      Save Vision
                    </button>
                    <button
                      onClick={closeArea}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    {isAreaComplete(draftFields) && (
                      <span className="text-xs text-green-400 font-semibold ml-auto">All fields filled</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Area Completion Summary ── */}
      {completedCount > 0 && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Completion by Area
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {LIFE_AREAS.map(area => {
              const data = visionData[area.key] || emptyArea()
              const filled = (
                ['vision10yr', 'milestone3yr', 'milestone1yr', 'currentReality'] as const
              ).filter(f => data[f].trim().length > 0).length
              const pct = (filled / 4) * 100

              return (
                <div key={area.key} className="text-center">
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-lg border-2"
                    style={{
                      borderColor: pct === 100 ? area.color : '#334155',
                      background: pct === 100 ? area.color + '22' : 'transparent',
                    }}
                  >
                    {area.emoji}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{area.name}</p>
                  <p className="text-xs font-semibold" style={{ color: pct > 0 ? area.color : '#475569' }}>
                    {filled}/4
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty State CTA ── */}
      {completedCount === 0 && Object.keys(visionData).length === 0 && (
        <div className="text-center py-8 text-slate-600">
          <p className="text-sm">Start by clicking any life area above to define your vision</p>
          <p className="text-xs mt-1">The clearer your vision, the more powerfully you move toward it</p>
        </div>
      )}
    </div>
  )
}
