import { useState, useEffect } from 'react'
import axios from 'axios'
import { Brain, Lightbulb, TrendingUp, CheckCircle, AlertTriangle, RefreshCw, Star } from 'lucide-react'

interface HabitData {
  id: number
  name: string
  streak: number
  total: number
  completionRate: number
  lastSeven: boolean[]
}

interface CoachInsight {
  type: 'tip' | 'warning' | 'celebration' | 'suggestion'
  title: string
  body: string
  habit?: string
}

const TIPS_BY_STREAK: Record<number, string[]> = {
  0: [
    'Start small — commit to just 2 minutes. The habit matters more than duration.',
    'Anchor new habits to existing ones: "After I brush teeth, I will..."',
    'Remove friction: lay out your workout clothes the night before.',
    'Use implementation intentions: "When X happens, I will do Y at Z place."',
  ],
  3: [
    'You\'re past day 3! Your brain is starting to form neural pathways.',
    'Stack a reward after your habit to reinforce the loop.',
    'Track your habit visually — seeing the chain motivates continuation.',
    'Tell someone about your habit. Accountability boosts follow-through by 65%.',
  ],
  7: [
    '1 week strong! This is where many people slip — stay vigilant.',
    'Vary the difficulty slightly to keep engagement high.',
    'Reflect: how does this habit make you feel? Emotion drives repetition.',
    'Consider adding a complementary habit to build a routine stack.',
  ],
  21: [
    '21 days — the automaticity is kicking in. You\'re building identity.',
    'Time to level up: increase duration, intensity, or depth.',
    'Share your habit with your community — lead by example.',
    'Add a "temptation bundling" reward to sustain long-term motivation.',
  ],
  66: [
    '66+ days — research shows this is true automaticity. This IS you now.',
    'Mentor someone else in this habit. Teaching deepens mastery.',
    'Set a stretch goal or add a related advanced habit.',
    'Document your journey — your transformation is worth recording.',
  ],
}

const HABIT_SCIENCE_FACTS = [
  'The "21 days to form a habit" myth — research shows it actually takes 18-254 days (avg 66).',
  'Missing once doesn\'t break the chain — what matters is never missing twice.',
  'Habits run on a cue → routine → reward loop (the Habit Loop).',
  'The Zeigarnik Effect: started habits create mental tension until completed.',
  'Identity-based habits ("I am a runner") outperform outcome-based ones ("I want to run 5k").',
  'Habit stacking (pairing habits) leverages existing neural pathways.',
  'The 2-Minute Rule: any habit can start with a 2-minute version.',
  'Context matters — habits tied to specific locations form faster.',
  'Social habits have 3x higher long-term adherence than solo habits.',
  'Progress tracking via a "don\'t break the chain" calendar boosts completion 27%.',
]

function getTipForStreak(streak: number): string {
  const thresholds = [66, 21, 7, 3, 0]
  for (const t of thresholds) {
    if (streak >= t) {
      const tips = TIPS_BY_STREAK[t]
      return tips[Math.floor(Math.random() * tips.length)]
    }
  }
  return TIPS_BY_STREAK[0][0]
}

function generateInsights(habits: HabitData[]): CoachInsight[] {
  const insights: CoachInsight[] = []

  const best = habits.reduce((a, b) => a.streak > b.streak ? a : b, habits[0])
  const worst = habits.filter(h => h.total > 3).reduce((a, b) => a.completionRate < b.completionRate ? a : b, habits[0])
  const recent = habits.filter(h => h.lastSeven.filter(Boolean).length >= 6)

  if (best && best.streak >= 7) {
    insights.push({
      type: 'celebration',
      title: `${best.streak}-day streak on "${best.name}"!`,
      body: getTipForStreak(best.streak),
      habit: best.name,
    })
  }

  if (worst && worst.completionRate < 0.4 && worst.total > 5) {
    insights.push({
      type: 'warning',
      title: `"${worst.name}" needs attention`,
      body: `Only ${Math.round(worst.completionRate * 100)}% completion rate. Consider simplifying it or changing the trigger cue.`,
      habit: worst.name,
    })
  }

  if (recent.length > 0) {
    insights.push({
      type: 'celebration',
      title: `${recent.length} habit${recent.length > 1 ? 's' : ''} on fire this week!`,
      body: recent.map(h => h.name).join(', ') + (recent.length > 1 ? ' — all 6+ days this week!' : ' — 6+ days this week!'),
    })
  }

  const lowStreak = habits.filter(h => h.streak === 0 && h.total > 0)
  if (lowStreak.length > 0) {
    insights.push({
      type: 'suggestion',
      title: `Restart opportunity: ${lowStreak[0].name}`,
      body: `Never miss twice. Today is the perfect day to get back on track. Start with just 2 minutes.`,
      habit: lowStreak[0].name,
    })
  }

  insights.push({
    type: 'tip',
    title: 'Habit Science',
    body: HABIT_SCIENCE_FACTS[Math.floor(Math.random() * HABIT_SCIENCE_FACTS.length)],
  })

  return insights.slice(0, 5)
}

const INSIGHT_STYLES: Record<CoachInsight['type'], { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  celebration: { bg: '#22c55e10', border: '#22c55e30', icon: <CheckCircle className="w-4 h-4 text-green-400" />, label: '🎉 Achievement' },
  warning: { bg: '#ef444410', border: '#ef444430', icon: <AlertTriangle className="w-4 h-4 text-red-400" />, label: '⚠️ Attention' },
  suggestion: { bg: '#3b82f610', border: '#3b82f630', icon: <Lightbulb className="w-4 h-4 text-blue-400" />, label: '💡 Suggestion' },
  tip: { bg: '#a855f710', border: '#a855f730', icon: <Brain className="w-4 h-4 text-violet-400" />, label: '🧠 Science' },
}

export default function HabitCoach() {
  const [habits, setHabits] = useState<HabitData[]>([])
  const [insights, setInsights] = useState<CoachInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [fact] = useState(HABIT_SCIENCE_FACTS[Math.floor(Math.random() * HABIT_SCIENCE_FACTS.length)])

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/habits')
      const rawHabits = r.data as Array<{ id: number; name: string; streak: number; total_completions: number }>

      const enriched: HabitData[] = await Promise.all(
        rawHabits.slice(0, 12).map(async h => {
          try {
            const ar = await axios.get(`/api/habits/${h.id}/analytics`)
            const analytics = ar.data as { completionRate: number; lastSeven: boolean[] }
            return {
              id: h.id,
              name: h.name,
              streak: h.streak || 0,
              total: h.total_completions || 0,
              completionRate: analytics.completionRate || 0,
              lastSeven: analytics.lastSeven || Array(7).fill(false),
            }
          } catch {
            return {
              id: h.id,
              name: h.name,
              streak: h.streak || 0,
              total: h.total_completions || 0,
              completionRate: 0,
              lastSeven: Array(7).fill(false),
            }
          }
        })
      )

      setHabits(enriched)
      if (enriched.length > 0) setInsights(generateInsights(enriched))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const avgRate = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.completionRate, 0) / habits.length * 100)
    : 0

  const topStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0
  const perfectThisWeek = habits.filter(h => h.lastSeven.every(Boolean)).length

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Habit Coach
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-powered insights to level up your habits</p>
        </div>
        <button onClick={load} className="p-2 text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{avgRate}%</div>
          <div className="text-xs text-slate-500">Avg Completion</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{topStreak}d</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{perfectThisWeek}</div>
          <div className="text-xs text-slate-500">Perfect Week</div>
        </div>
      </div>

      {/* Coach insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" /> Coach Analysis
          </h3>
          {insights.map((ins, i) => {
            const style = INSIGHT_STYLES[ins.type]
            return (
              <div key={i} className="rounded-xl p-4 border" style={{ background: style.bg, borderColor: style.border }}>
                <div className="flex items-center gap-2 mb-1">
                  {style.icon}
                  <span className="text-xs text-slate-500 font-medium">{style.label}</span>
                </div>
                <div className="font-semibold text-white text-sm mb-0.5">{ins.title}</div>
                <div className="text-slate-400 text-sm">{ins.body}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Habit heatmap */}
      {habits.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            7-Day Performance
          </h3>
          <div className="space-y-2">
            {habits.slice(0, 8).map(h => (
              <div key={h.id} className="flex items-center gap-3">
                <div className="w-28 text-xs text-slate-400 truncate flex-shrink-0">{h.name}</div>
                <div className="flex gap-1">
                  {h.lastSeven.map((done, i) => (
                    <div key={i} className="w-5 h-5 rounded-sm flex items-center justify-center text-[8px]"
                      style={{ background: done ? '#22c55e20' : '#1e293b', border: `1px solid ${done ? '#22c55e50' : '#334155'}` }}>
                      {done ? '✓' : ''}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${h.completionRate * 100}%`, background: h.completionRate >= 0.8 ? '#22c55e' : h.completionRate >= 0.5 ? '#eab308' : '#ef4444' }} />
                  </div>
                </div>
                <div className="text-xs font-bold w-10 text-right" style={{ color: h.completionRate >= 0.8 ? '#22c55e' : h.completionRate >= 0.5 ? '#eab308' : '#ef4444' }}>
                  {Math.round(h.completionRate * 100)}%
                </div>
                {h.streak > 0 && (
                  <div className="text-xs text-orange-400 w-10 text-right flex-shrink-0">🔥{h.streak}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Science fact of the day */}
      <div className="game-card p-4 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Habit Science</span>
        </div>
        <p className="text-sm text-slate-300 italic">"{fact}"</p>
      </div>

      {/* Streak leaderboard */}
      {habits.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" /> Habit Rankings
          </h3>
          <div className="space-y-2">
            {[...habits].sort((a, b) => b.streak - a.streak).slice(0, 5).map((h, i) => (
              <div key={h.id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: i === 0 ? '#fbbf2420' : i === 1 ? '#9ca3af20' : '#92400e20', color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : '#92400e' }}>
                  {i + 1}
                </div>
                <div className="flex-1 text-sm text-slate-300 truncate">{h.name}</div>
                {h.streak > 0 ? (
                  <div className="text-orange-400 text-sm font-bold">🔥 {h.streak}d</div>
                ) : (
                  <div className="text-slate-600 text-sm">—</div>
                )}
                <div className="text-xs text-slate-500 w-10 text-right">{Math.round(h.completionRate * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No habits tracked yet.</p>
          <p className="text-sm mt-1">Add habits in the Habits section to get coaching insights.</p>
        </div>
      )}
    </div>
  )
}
