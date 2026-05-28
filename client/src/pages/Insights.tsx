import { useEffect, useState } from 'react'
import axios from 'axios'
import { Brain, TrendingUp, TrendingDown, Minus, Lightbulb, Star } from 'lucide-react'

interface Insight {
  type: 'positive' | 'warning' | 'info' | 'opportunity'
  text: string
}

interface DowAvg { day: string; avg: number; count: number }

interface InsightsData {
  insights: Insight[]
  weeklyTrend: { last7Avg: number; prev7Avg: number; delta: number } | null
  bestCat: string | null
  weakestCat: string | null
  bestDow: string | null
  worstDow: string | null
  longestDrought: number
  perfectDays30: number
  scoreStdDev: number
  catAvgMinutes: Record<string, number>
  scoreDist: Record<string, number>
  dowAvgs: DowAvg[]
  monthlyTotal: number
  totalDaysLogged: number
}

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_COLORS: Record<string, string> = {
  health: 'text-green-400', mind: 'text-cyan-400', work: 'text-violet-400', social: 'text-yellow-400', growth: 'text-red-400',
}
const CAT_BAR: Record<string, string> = {
  health: 'bar-health', mind: 'bar-mind', work: 'bar-work', social: 'bar-social', growth: 'bar-growth',
}

const INSIGHT_STYLES: Record<string, { bg: string; border: string; icon: string; iconClass: string }> = {
  positive:    { bg: 'bg-green-900/20',  border: 'border-green-700/40',  icon: '✅', iconClass: 'text-green-400' },
  warning:     { bg: 'bg-orange-900/20', border: 'border-orange-700/40', icon: '⚠️', iconClass: 'text-orange-400' },
  info:        { bg: 'bg-blue-900/20',   border: 'border-blue-700/40',   icon: '💡', iconClass: 'text-blue-400' },
  opportunity: { bg: 'bg-violet-900/20', border: 'border-violet-700/40', icon: '🎯', iconClass: 'text-violet-400' },
}

const CAT_MAX: Record<string, number> = { health: 25, mind: 25, work: 25, social: 10, growth: 15 }

const DAILY_TIPS = [
  "💡 You can't improve what you don't track. Every day logged is data for your future self.",
  "⚡ The Pomodoro technique (25 min work + 5 min break) can double your effective output.",
  "🔥 Small streaks beat big bursts. Consistency is the real cheat code.",
  "🧠 Sleep is your most underrated performance tool. Prioritize 7-9 hours.",
  "💪 The habit of logging keeps you accountable even on bad days — especially on bad days.",
  "🌱 Your weakest category is your biggest opportunity. Even 15 minutes moves the needle.",
  "🎯 Before bed: write down 3 things you'll do tomorrow. Wake up with a plan.",
  "☯️ Balance is rare. Most people over-index on work and ignore health/social. Check yours.",
  "🏆 Achievements are earned, not given. Every streak day is a vote for who you're becoming.",
  "🚀 The compound effect: improve 1% daily, and in a year you'll be 37x better.",
]

function getTodayTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length]
}

export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get<InsightsData>('/api/insights')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  const tip = getTodayTip()
  const { weeklyTrend, insights, bestCat, weakestCat, bestDow, worstDow, perfectDays30, scoreStdDev, catAvgMinutes, scoreDist, dowAvgs, monthlyTotal, totalDaysLogged } = data ?? {}

  const TrendIcon = !weeklyTrend || weeklyTrend.delta === 0
    ? Minus
    : weeklyTrend.delta > 0 ? TrendingUp : TrendingDown
  const trendColor = !weeklyTrend || weeklyTrend.delta === 0
    ? 'text-slate-400'
    : weeklyTrend.delta > 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Brain className="w-8 h-8 text-cyan-400" />
          Insights
        </h1>
        <p className="text-slate-400 mt-1">AI-generated analysis of your performance patterns</p>
      </div>

      {/* Daily tip */}
      <div className="game-card p-4 border border-yellow-500/30 bg-yellow-900/10">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-yellow-500 uppercase tracking-widest mb-1">Daily Insight</div>
            <p className="text-sm text-slate-200">{tip}</p>
          </div>
        </div>
      </div>

      {/* Weekly trend */}
      {weeklyTrend && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            Week-over-Week Trend
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500 mb-1">This week avg</div>
              <div className="text-2xl font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                {weeklyTrend.last7Avg}
              </div>
              <div className="text-xs text-slate-600">pts</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Change</div>
              <div className={`text-2xl font-bold ${trendColor}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                {weeklyTrend.delta > 0 ? '+' : ''}{weeklyTrend.delta}
              </div>
              <div className="text-xs text-slate-600">pts</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Last week avg</div>
              <div className="text-2xl font-bold text-slate-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {weeklyTrend.prev7Avg}
              </div>
              <div className="text-xs text-slate-600">pts</div>
            </div>
          </div>
        </div>
      )}

      {/* AI insights */}
      {insights && insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Star className="w-4 h-4" />
            Pattern Analysis
          </h2>
          {insights.map((ins, i) => {
            const style = INSIGHT_STYLES[ins.type] ?? INSIGHT_STYLES.info
            return (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${style.bg} ${style.border}`}>
                <span className="text-lg flex-shrink-0">{style.icon}</span>
                <p className="text-sm text-slate-200">{ins.text}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Category breakdown */}
      {catAvgMinutes && Object.values(catAvgMinutes).some(v => v > 0) && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">Average Daily Minutes by Category</h3>
          <div className="space-y-3">
            {['health', 'mind', 'work', 'social', 'growth'].map(cat => {
              const mins = catAvgMinutes[cat] ?? 0
              const maxExpected = 60
              const pct = Math.min(100, Math.round((mins / maxExpected) * 100))
              const isBest = cat === bestCat
              const isWeakest = cat === weakestCat && bestCat !== weakestCat
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${isBest ? CAT_COLORS[cat] : 'text-slate-300'}`}>
                      {CAT_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      {isBest && <span className="ml-1 text-xs text-yellow-400">★ Best</span>}
                      {isWeakest && <span className="ml-1 text-xs text-orange-400">↑ Focus here</span>}
                    </span>
                    <span className="text-slate-400">{mins}m/day avg</span>
                  </div>
                  <div className="stat-bar h-2">
                    <div className={`stat-bar-fill ${CAT_BAR[cat]} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick facts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Best Day', value: bestDow ?? '—', icon: '📅', color: 'text-cyan-400' },
          { label: 'Perfect Days', value: `${perfectDays30 ?? 0}`, icon: '💎', sub: 'last 30', color: 'text-yellow-400' },
          { label: 'Score Variance', value: `±${scoreStdDev ?? 0}`, icon: '📊', sub: 'std dev', color: 'text-violet-400' },
          { label: 'Days Logged', value: `${totalDaysLogged ?? 0}`, icon: '📓', sub: 'all time', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            {s.icon && <div className="text-2xl mb-1">{s.icon}</div>}
            <div className={`text-lg font-bold ${s.color} capitalize`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            {s.sub && <div className="text-xs text-slate-600">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Day-of-week performance chart */}
      {dowAvgs && dowAvgs.some(d => d.count > 0) && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-1">Performance by Day of Week</h3>
          <p className="text-xs text-slate-500 mb-4">Average score per weekday</p>
          <div className="flex items-end gap-2 h-28">
            {dowAvgs.map(d => {
              const pct = d.avg / 100
              const isBest = d.day === bestDow?.slice(0, 3)
              const isWorst = d.day === worstDow?.slice(0, 3)
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-bold text-slate-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                    {d.count > 0 ? d.avg : '—'}
                  </div>
                  <div className="w-full flex items-end" style={{ height: '72px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ${
                        isBest ? 'bg-green-500' : isWorst ? 'bg-orange-500/60' : 'bg-violet-600/60'
                      }`}
                      style={{ height: d.count > 0 ? `${Math.max(4, pct * 72)}px` : '4px' }}
                    />
                  </div>
                  <div className={`text-[10px] ${isBest ? 'text-green-400 font-bold' : 'text-slate-500'}`}>{d.day}</div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            {bestDow && <span><span className="text-green-400">■</span> Best: {bestDow}</span>}
            {worstDow && worstDow !== bestDow && <span><span className="text-orange-400">■</span> Weakest: {worstDow}</span>}
          </div>
        </div>
      )}

      {/* Score distribution */}
      {scoreDist && Object.values(scoreDist).some(v => v > 0) && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-1">Score Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Last 30 days — where do your scores cluster?</p>
          {(() => {
            const buckets = [
              { label: '0–24', key: '0-24', color: 'bg-red-500/70' },
              { label: '25–49', key: '25-49', color: 'bg-orange-500/70' },
              { label: '50–74', key: '50-74', color: 'bg-yellow-500/70' },
              { label: '75–99', key: '75-99', color: 'bg-cyan-500/70' },
              { label: '100', key: '100', color: 'bg-green-500' },
            ]
            const maxVal = Math.max(...buckets.map(b => scoreDist[b.key] ?? 0), 1)
            return (
              <div className="space-y-2">
                {buckets.map(b => {
                  const val = scoreDist[b.key] ?? 0
                  return (
                    <div key={b.key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-12 text-right">{b.label}</span>
                      <div className="flex-1 stat-bar h-5">
                        <div className={`${b.color} h-full rounded-r transition-all duration-700`} style={{ width: `${(val / maxVal) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-300 w-6 text-right">{val}</span>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {!insights?.length && !weeklyTrend && (
        <div className="text-center py-12 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Log a few days to unlock personalized insights.</p>
        </div>
      )}
    </div>
  )
}
