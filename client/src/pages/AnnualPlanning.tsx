import { useState, useEffect, useCallback } from 'react'
import { Target, Star, Zap, Heart, Users, TrendingUp, Plus, Trash2, Save, Flag, Award, ChevronRight, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface BigRock {
  id: string
  title: string
  area: string
  why: string
  q1Milestone: string
  q2Milestone: string
  q3Milestone: string
  q4Milestone: string
  quartersDone: number[]
  completed: boolean
}

interface QuarterReview {
  quarter: 1 | 2 | 3 | 4
  wins: string
  lessons: string
  adjustments: string
  rating: number
}

interface AnnualPlan {
  year: number
  theme: string
  themeEmoji: string
  intention: string
  bigRocks: BigRock[]
  quarterReviews: QuarterReview[]
}

const STORAGE_KEY = 'annual_planning'

const AREA_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  'health':        { label: 'Health',        color: '#ef4444', icon: '💪' },
  'wealth':        { label: 'Wealth',        color: '#22c55e', icon: '💰' },
  'relationships': { label: 'Relationships', color: '#ec4899', icon: '❤️' },
  'growth':        { label: 'Growth',        color: '#a855f7', icon: '🌱' },
  'career':        { label: 'Career',        color: '#3b82f6', icon: '🚀' },
  'joy':           { label: 'Joy',           color: '#f59e0b', icon: '✨' },
  'other':         { label: 'Other',         color: '#94a3b8', icon: '⭐' },
}

const THEME_EMOJIS = ['🌟', '🔥', '⚡', '🎯', '🌊', '🦁', '🌙', '🌈', '🏔️', '🦅']

const QUARTER_COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#22c55e']

const defaultReviews = (): QuarterReview[] =>
  ([1, 2, 3, 4] as const).map(q => ({ quarter: q, wins: '', lessons: '', adjustments: '', rating: 7 }))

const defaultPlan = (year: number): AnnualPlan => ({
  year,
  theme: '',
  themeEmoji: '🌟',
  intention: '',
  bigRocks: [],
  quarterReviews: defaultReviews(),
})

function newBigRock(): BigRock {
  return {
    id: Date.now().toString(),
    title: '',
    area: 'growth',
    why: '',
    q1Milestone: '',
    q2Milestone: '',
    q3Milestone: '',
    q4Milestone: '',
    quartersDone: [],
    completed: false,
  }
}

// SVG year progress visual
function YearProgressVisual({ plan }: { plan: AnnualPlan }) {
  const rocks = plan.bigRocks
  const totalRocks = rocks.length
  const fullyDone = rocks.filter(r => r.quartersDone.length === 4).length
  const pct = totalRocks > 0 ? fullyDone / totalRocks : 0

  const cx = 80
  const cy = 80
  const r = 60
  const strokeW = 14
  const circumference = 2 * Math.PI * r

  // Quarterly segments — each covers 25% of circumference
  const quarterTotals = [1, 2, 3, 4].map(q =>
    rocks.filter(rock => rock.quartersDone.includes(q)).length
  )

  // Compute dash array for full circle progress
  const progressDash = pct * circumference

  return (
    <div className="flex items-center gap-4">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeW} />

        {/* Quarterly arcs (each 90 degrees) */}
        {[0, 1, 2, 3].map(qi => {
          const startAngle = qi * 90 - 90
          const endAngle = startAngle + 88
          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          const x1 = cx + r * Math.cos(startRad)
          const y1 = cy + r * Math.sin(startRad)
          const x2 = cx + r * Math.cos(endRad)
          const y2 = cy + r * Math.sin(endRad)
          const filled = totalRocks > 0 && quarterTotals[qi] > 0
          return (
            <path
              key={qi}
              d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={filled ? QUARTER_COLORS[qi] : '#334155'}
              strokeWidth={strokeW}
              strokeLinecap="round"
              opacity={filled ? 0.85 : 0.3}
            />
          )
        })}

        {/* Overall progress ring overlay */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(139,92,246,0.25)"
          strokeWidth={strokeW + 4}
          strokeDasharray={`${progressDash} ${circumference - progressDash}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />

        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="bold" fontFamily="Orbitron, monospace">
          {Math.round(pct * 100)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize="9">
          COMPLETE
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" fill="#64748b" fontSize="9">
          {fullyDone}/{totalRocks} rocks
        </text>
      </svg>

      <div className="space-y-1.5">
        {[0, 1, 2, 3].map(qi => (
          <div key={qi} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: QUARTER_COLORS[qi] }} />
            <span className="text-xs text-slate-400">Q{qi + 1}</span>
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden" style={{ minWidth: 60 }}>
              {totalRocks > 0 && (
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(quarterTotals[qi] / totalRocks) * 100}%`,
                    backgroundColor: QUARTER_COLORS[qi],
                  }}
                />
              )}
            </div>
            <span className="text-xs text-slate-500 w-8 text-right">{quarterTotals[qi]}/{totalRocks}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnnualPlanning() {
  const { toastSuccess } = useToast()
  const currentYear = new Date().getFullYear()
  const [plan, setPlan] = useState<AnnualPlan>(defaultPlan(currentYear))
  const [expandedRock, setExpandedRock] = useState<string | null>(null)
  const [expandedReview, setExpandedReview] = useState<number | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AnnualPlan
        // Ensure quarterReviews is populated
        if (!parsed.quarterReviews || parsed.quarterReviews.length < 4) {
          parsed.quarterReviews = defaultReviews()
        }
        setPlan(parsed)
      }
    } catch { /**/ }
  }, [])

  const persist = useCallback((next: AnnualPlan) => {
    setPlan(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const updatePlanField = <K extends keyof AnnualPlan>(key: K, value: AnnualPlan[K]) => {
    persist({ ...plan, [key]: value })
  }

  const addBigRock = () => {
    if (plan.bigRocks.length >= 5) return
    const rock = newBigRock()
    persist({ ...plan, bigRocks: [...plan.bigRocks, rock] })
    setExpandedRock(rock.id)
  }

  const updateRock = (id: string, updates: Partial<BigRock>) => {
    persist({
      ...plan,
      bigRocks: plan.bigRocks.map(r => r.id === id ? { ...r, ...updates } : r),
    })
  }

  const deleteRock = (id: string) => {
    persist({ ...plan, bigRocks: plan.bigRocks.filter(r => r.id !== id) })
    if (expandedRock === id) setExpandedRock(null)
    toastSuccess('Big rock removed')
  }

  const toggleQuarter = (id: string, q: number) => {
    const rock = plan.bigRocks.find(r => r.id === id)
    if (!rock) return
    const done = rock.quartersDone.includes(q)
      ? rock.quartersDone.filter(x => x !== q)
      : [...rock.quartersDone, q].sort()
    updateRock(id, { quartersDone: done })
  }

  const updateReview = (quarter: 1 | 2 | 3 | 4, updates: Partial<QuarterReview>) => {
    persist({
      ...plan,
      quarterReviews: plan.quarterReviews.map(r =>
        r.quarter === quarter ? { ...r, ...updates } : r
      ),
    })
  }

  const savePlan = () => {
    persist({ ...plan })
    toastSuccess('Annual plan saved!')
  }

  // Stats
  const totalRocks = plan.bigRocks.length
  const completedRocks = plan.bigRocks.filter(r => r.completed).length
  const totalMilestones = plan.bigRocks.reduce((acc, r) => acc + r.quartersDone.length, 0)
  const avgRating = plan.quarterReviews.filter(r => r.wins || r.lessons).length > 0
    ? (plan.quarterReviews.reduce((a, r) => a + r.rating, 0) / 4).toFixed(1)
    : '—'

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Calendar className="w-7 h-7 text-violet-400" />
            Annual Planning
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set your year theme, big rocks, and quarterly milestones.</p>
        </div>
        <button
          onClick={savePlan}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-2.5">
          <div className="text-lg font-bold text-violet-400">{totalRocks}</div>
          <div className="text-[10px] text-slate-500">Big Rocks</div>
        </div>
        <div className="game-card p-2.5">
          <div className="text-lg font-bold text-green-400">{completedRocks}</div>
          <div className="text-[10px] text-slate-500">Completed</div>
        </div>
        <div className="game-card p-2.5">
          <div className="text-lg font-bold text-amber-400">{totalMilestones}</div>
          <div className="text-[10px] text-slate-500">Milestones</div>
        </div>
        <div className="game-card p-2.5">
          <div className="text-lg font-bold text-cyan-400">{avgRating}</div>
          <div className="text-[10px] text-slate-500">Year Score</div>
        </div>
      </div>

      {/* Year Header Card */}
      <div className="game-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Flag className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Year Setup</span>
        </div>

        {/* Year picker + emoji */}
        <div className="flex gap-2">
          <div className="space-y-1 flex-1">
            <p className="text-[10px] text-slate-500 uppercase">Year</p>
            <select
              value={plan.year}
              onChange={e => updatePlanField('year', Number(e.target.value))}
              className="game-input w-full text-sm"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-[10px] text-slate-500 uppercase">Theme</p>
            <input
              value={plan.theme}
              onChange={e => updatePlanField('theme', e.target.value)}
              onBlur={() => persist(plan)}
              placeholder="e.g. Year of Clarity"
              className="game-input w-full text-sm"
            />
          </div>
        </div>

        {/* Emoji picker */}
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 uppercase">Theme Emoji</p>
          <div className="flex gap-1.5 flex-wrap">
            {THEME_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => updatePlanField('themeEmoji', e)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border transition-all ${
                  plan.themeEmoji === e
                    ? 'bg-violet-700/50 border-violet-500'
                    : 'bg-slate-800 border-slate-700 hover:border-violet-500/50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Year intention */}
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 uppercase">Year Intention</p>
          <textarea
            value={plan.intention}
            onChange={e => updatePlanField('intention', e.target.value)}
            onBlur={() => persist(plan)}
            placeholder="Write a paragraph about your intention for this year..."
            className="game-input w-full h-16 resize-none text-sm"
          />
        </div>

        {plan.theme && (
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.15) 100%)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <span className="text-2xl">{plan.themeEmoji}</span>
            <p className="text-white font-bold mt-1" style={{ fontFamily: 'Orbitron, monospace' }}>
              {plan.year}: {plan.theme}
            </p>
          </div>
        )}
      </div>

      {/* Year Progress Visual */}
      {plan.bigRocks.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Year Progress</span>
          </div>
          <YearProgressVisual plan={plan} />
        </div>
      )}

      {/* Big Rocks Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Big Rocks ({totalRocks}/5)</span>
          </div>
          {totalRocks < 5 && (
            <button
              onClick={addBigRock}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rock
            </button>
          )}
        </div>

        {plan.bigRocks.length === 0 && (
          <div className="text-center py-8 text-slate-600 game-card">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Add up to 5 big rocks — your most important annual goals.</p>
            <button
              onClick={addBigRock}
              className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add First Big Rock
            </button>
          </div>
        )}

        {plan.bigRocks.map((rock, idx) => {
          const areaConf = AREA_CONFIG[rock.area] ?? AREA_CONFIG['other']
          const isExpanded = expandedRock === rock.id
          const milestonesHit = rock.quartersDone.length
          const quarterKeys: Array<'q1Milestone' | 'q2Milestone' | 'q3Milestone' | 'q4Milestone'> =
            ['q1Milestone', 'q2Milestone', 'q3Milestone', 'q4Milestone']

          return (
            <div
              key={rock.id}
              className="game-card overflow-hidden"
              style={{ borderLeft: `3px solid ${areaConf.color}` }}
            >
              {/* Rock header */}
              <div
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/30"
                onClick={() => setExpandedRock(isExpanded ? null : rock.id)}
              >
                <span className="text-lg">{areaConf.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">#{idx + 1}</span>
                    {rock.title
                      ? <span className="text-sm text-white font-medium truncate">{rock.title}</span>
                      : <span className="text-sm text-slate-500 italic">Untitled rock</span>
                    }
                    {rock.completed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Done</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">{areaConf.label}</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(q => (
                        <span
                          key={q}
                          className={`text-[10px] font-bold px-1 rounded ${
                            rock.quartersDone.includes(q)
                              ? 'text-white'
                              : 'text-slate-600'
                          }`}
                          style={rock.quartersDone.includes(q) ? { color: QUARTER_COLORS[q - 1] } : {}}
                        >
                          Q{q}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">{milestonesHit}/4 milestones</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>

              {/* Rock detail */}
              {isExpanded && (
                <div className="border-t border-slate-700 p-3 space-y-3">
                  <input
                    value={rock.title}
                    onChange={e => updateRock(rock.id, { title: e.target.value })}
                    placeholder="Big rock title *"
                    className="game-input w-full text-sm"
                    autoFocus
                  />

                  <div className="flex gap-2">
                    <select
                      value={rock.area}
                      onChange={e => updateRock(rock.id, { area: e.target.value })}
                      className="game-input text-sm flex-1"
                    >
                      {Object.entries(AREA_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateRock(rock.id, { completed: !rock.completed })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        rock.completed
                          ? 'bg-green-700/40 border-green-500 text-green-300'
                          : 'bg-slate-700 border-slate-600 text-slate-400'
                      }`}
                    >
                      {rock.completed ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>

                  <textarea
                    value={rock.why}
                    onChange={e => updateRock(rock.id, { why: e.target.value })}
                    placeholder="Why does this rock matter to you?"
                    className="game-input w-full h-10 resize-none text-sm"
                  />

                  {/* Quarterly milestones */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Quarterly Milestones</p>
                    {[1, 2, 3, 4].map((q, qi) => (
                      <div key={q} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleQuarter(rock.id, q)}
                          className={`shrink-0 w-14 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            rock.quartersDone.includes(q)
                              ? 'text-white border-transparent'
                              : 'bg-slate-800 border-slate-600 text-slate-500'
                          }`}
                          style={rock.quartersDone.includes(q) ? { backgroundColor: QUARTER_COLORS[qi], borderColor: QUARTER_COLORS[qi] } : {}}
                        >
                          {rock.quartersDone.includes(q) ? `Q${q} ✓` : `Q${q}`}
                        </button>
                        <input
                          value={rock[quarterKeys[qi]]}
                          onChange={e => updateRock(rock.id, { [quarterKeys[qi]]: e.target.value })}
                          placeholder={`Q${q} milestone...`}
                          className={`game-input flex-1 text-xs ${rock.quartersDone.includes(q) ? 'line-through text-slate-500' : ''}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => deleteRock(rock.id)}
                      className="flex items-center gap-1 text-slate-600 hover:text-red-400 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quarter Reviews */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-400">Quarterly Reviews</span>
        </div>

        {plan.quarterReviews.map((review, qi) => {
          const isExpanded = expandedReview === review.quarter
          const hasContent = review.wins || review.lessons || review.adjustments

          return (
            <div key={review.quarter} className="game-card overflow-hidden">
              <div
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/30"
                onClick={() => setExpandedReview(isExpanded ? null : review.quarter)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: QUARTER_COLORS[qi] + '33', border: `1.5px solid ${QUARTER_COLORS[qi]}` }}
                >
                  Q{review.quarter}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Quarter {review.quarter} Review</p>
                  <p className="text-[10px] text-slate-500">
                    {hasContent ? `Rating: ${review.rating}/10` : 'Not started'}
                  </p>
                </div>
                {hasContent && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(review.rating, 10) }, (_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: review.rating >= 7 ? '#22c55e' : review.rating >= 4 ? '#f59e0b' : '#ef4444' }}
                      />
                    ))}
                  </div>
                )}
                <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>

              {isExpanded && (
                <div className="border-t border-slate-700 p-3 space-y-3">
                  <div>
                    <p className="text-[10px] text-green-400 uppercase font-semibold mb-1">Wins</p>
                    <textarea
                      value={review.wins}
                      onChange={e => updateReview(review.quarter, { wins: e.target.value })}
                      onBlur={() => persist(plan)}
                      placeholder="What went well this quarter?"
                      className="game-input w-full h-14 resize-none text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-400 uppercase font-semibold mb-1">Lessons</p>
                    <textarea
                      value={review.lessons}
                      onChange={e => updateReview(review.quarter, { lessons: e.target.value })}
                      onBlur={() => persist(plan)}
                      placeholder="What did you learn?"
                      className="game-input w-full h-14 resize-none text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-400 uppercase font-semibold mb-1">Adjustments</p>
                    <textarea
                      value={review.adjustments}
                      onChange={e => updateReview(review.quarter, { adjustments: e.target.value })}
                      onBlur={() => persist(plan)}
                      placeholder="What will you adjust next quarter?"
                      className="game-input w-full h-14 resize-none text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Quarter Rating</p>
                      <span className="text-sm font-bold" style={{ color: review.rating >= 7 ? '#22c55e' : review.rating >= 4 ? '#f59e0b' : '#ef4444' }}>
                        {review.rating}/10
                      </span>
                    </div>
                    <input
                      type="range" min={1} max={10}
                      value={review.rating}
                      onChange={e => updateReview(review.quarter, { rating: Number(e.target.value) })}
                      className="w-full h-1.5"
                      style={{ accentColor: QUARTER_COLORS[qi] }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom save */}
      <button
        onClick={savePlan}
        className="w-full py-3 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" /> Save Annual Plan
      </button>
    </div>
  )
}
