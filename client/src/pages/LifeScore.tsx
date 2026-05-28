import { useEffect, useState } from 'react'
import axios from 'axios'
import { Sparkles, TrendingUp, TrendingDown, Minus, Heart, Brain, Briefcase, Users, Rocket, Flame, Trophy, Star } from 'lucide-react'

interface Stats {
  currentStreak: number
  bestStreak: number
  totalHours: number
  weeklyAvg: number
  monthlyAvg: number
  bestDay: { date: string; score: number } | null
  last30Days: Array<{ date: string; score: number }>
}

interface HabitStats {
  id: number; title: string; emoji: string; streak: number; totalCompletions: number
}

interface MetricsHistory {
  date: string; weight: number | null; sleep_hours: number | null
  water_glasses: number | null; energy: number | null; steps: number | null
}

interface MoodEntry { date: string; mood: number }

interface Achievement { key: string; rarity: string; unlocked: boolean }

const CAT_ICONS: Record<string, React.ReactNode> = {
  health: <Heart className="w-5 h-5" />,
  mind:   <Brain className="w-5 h-5" />,
  work:   <Briefcase className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  growth: <Rocket className="w-5 h-5" />,
}
const CAT_COLORS: Record<string, string> = {
  health: 'text-green-400 border-green-500/30 bg-green-900/10',
  mind:   'text-cyan-400 border-cyan-500/30 bg-cyan-900/10',
  work:   'text-violet-400 border-violet-500/30 bg-violet-900/10',
  social: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10',
  growth: 'text-orange-400 border-orange-500/30 bg-orange-900/10',
}

function grade(score: number): { letter: string; color: string; label: string } {
  if (score >= 90) return { letter: 'S', color: 'text-yellow-400', label: 'Legendary' }
  if (score >= 80) return { letter: 'A', color: 'text-green-400', label: 'Elite' }
  if (score >= 70) return { letter: 'B', color: 'text-cyan-400', label: 'Strong' }
  if (score >= 55) return { letter: 'C', color: 'text-blue-400', label: 'Solid' }
  if (score >= 40) return { letter: 'D', color: 'text-yellow-500', label: 'Growing' }
  return { letter: 'F', color: 'text-red-400', label: 'Needs Work' }
}

function trendIcon(values: number[]) {
  if (values.length < 2) return <Minus className="w-4 h-4 text-slate-500" />
  const first = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2)
  const second = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 2)
  if (second > first + 2) return <TrendingUp className="w-4 h-4 text-green-400" />
  if (second < first - 2) return <TrendingDown className="w-4 h-4 text-red-400" />
  return <Minus className="w-4 h-4 text-slate-500" />
}

function RadarRing({ scores }: { scores: Record<string, number> }) {
  const cats = ['health', 'mind', 'work', 'social', 'growth']
  const N = cats.length
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 16

  const angleOf = (i: number) => (i / N) * 2 * Math.PI - Math.PI / 2

  const point = (i: number, r: number) => {
    const a = angleOf(i)
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }

  const gridLevels = [25, 50, 75, 100]

  // Axes
  const axisLines = cats.map((_, i) => {
    const [x, y] = point(i, maxR)
    return `M${cx},${cy}L${x},${y}`
  }).join(' ')

  // Grid polygons
  const gridPaths = gridLevels.map(lvl => {
    const r = (lvl / 100) * maxR
    const pts = cats.map((_, i) => point(i, r).join(',')).join(' ')
    return <polygon key={lvl} points={pts} fill="none" stroke="#1e293b" strokeWidth="1" />
  })

  // Score polygon
  const scorePts = cats.map((cat, i) => {
    const r = ((scores[cat] ?? 0) / 100) * maxR
    return point(i, r).join(',')
  }).join(' ')

  // Labels
  const labels = cats.map((cat, i) => {
    const [x, y] = point(i, maxR + 12)
    return { cat, x, y }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid */}
      {gridPaths}
      {/* Axes */}
      <path d={axisLines} stroke="#1e293b" strokeWidth="1" fill="none" />
      {/* Score area */}
      <polygon points={scorePts} fill="#8b5cf640" stroke="#8b5cf6" strokeWidth="2" />
      {/* Dots */}
      {cats.map((cat, i) => {
        const r = ((scores[cat] ?? 0) / 100) * maxR
        const [x, y] = point(i, r)
        return <circle key={cat} cx={x} cy={y} r="4" fill="#8b5cf6" />
      })}
      {/* Labels */}
      {labels.map(({ cat, x, y }) => (
        <text key={cat} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fill="#64748b" fontFamily="sans-serif" className="select-none capitalize">
          {cat}
        </text>
      ))}
    </svg>
  )
}

function MiniBar({ value, max = 100, color = 'bg-violet-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function LifeScore() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [habits, setHabits] = useState<HabitStats[]>([])
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([])
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<HabitStats[]>('/api/habits'),
      axios.get<MetricsHistory[]>('/api/metrics/history?days=30'),
      axios.get<{ entries: MoodEntry[] }>('/api/mood/history?days=30'),
      axios.get<{ achievements: Achievement[] }>('/api/achievements'),
    ]).then(([sRes, hRes, mRes, moRes, aRes]) => {
      setStats(sRes.data)
      setHabits(hRes.data)
      setMetricsHistory(mRes.data)
      setMoods(moRes.data.entries ?? [])
      setAchievements(aRes.data.achievements)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
    </div>
  )

  const scores30 = stats?.last30Days ?? []
  const avg30 = scores30.length ? Math.round(scores30.reduce((s, d) => s + d.score, 0) / scores30.length) : 0

  // Category scores: estimate from last 30 days logs via stats
  // We approximate per-category from score and habits data
  const habitsByCategory: Record<string, HabitStats[]> = {}
  habits.forEach(h => { if (!habitsByCategory[h.streak !== undefined ? 'health' : 'health']) habitsByCategory['health'] = []; })
  // Category scores from completion rate
  const catHabitScore = (cat: string) => {
    const ch = habits.filter(h => (h as any).category === cat)
    if (!ch.length) return avg30
    const avgStreak = ch.reduce((s, h) => s + Math.min(h.streak, 30), 0) / ch.length
    return Math.min(100, Math.round((avgStreak / 30) * 100))
  }

  // Compute component scores
  const streakScore = Math.min(100, Math.round((stats?.currentStreak ?? 0) * 5))
  const consistencyScore = scores30.length ? Math.round((scores30.filter(d => d.score > 0).length / 30) * 100) : 0
  const qualityScore = avg30
  const habitScore = habits.length
    ? Math.round((habits.filter(h => h.streak > 0).length / habits.length) * 100)
    : 0
  const achievementScore = Math.min(100, achievements.filter(a => a.unlocked).length * 5)
  const moodScore = moods.length
    ? Math.min(100, Math.round((moods.reduce((s, m) => s + m.mood, 0) / moods.length) * 20))
    : 50
  const sleepScore = metricsHistory.length
    ? Math.min(100, Math.round((metricsHistory.filter(m => m.sleep_hours !== null && m.sleep_hours >= 7).length / metricsHistory.length) * 100))
    : 50
  const energyScore = metricsHistory.filter(m => m.energy).length
    ? Math.min(100, Math.round((metricsHistory.filter(m => m.energy !== null).reduce((s, m) => s + (m.energy ?? 0), 0) / metricsHistory.filter(m => m.energy !== null).length) * 20))
    : 50

  const overallScore = Math.round(
    (consistencyScore * 0.25 + qualityScore * 0.25 + habitScore * 0.15 + streakScore * 0.15 + moodScore * 0.10 + sleepScore * 0.05 + achievementScore * 0.05)
  )
  const g = grade(overallScore)

  const catScores: Record<string, number> = {
    health: Math.round((habitScore * 0.4 + sleepScore * 0.3 + energyScore * 0.3)),
    mind:   Math.round((moodScore * 0.5 + consistencyScore * 0.3 + achievementScore * 0.2)),
    work:   Math.round((qualityScore * 0.6 + consistencyScore * 0.4)),
    social: Math.round(avg30 * 0.7 + moodScore * 0.3),
    growth: Math.round((achievementScore * 0.4 + habitScore * 0.3 + streakScore * 0.3)),
  }

  const pillars = [
    { key: 'consistency', label: 'Consistency', value: consistencyScore, color: 'bg-violet-500', desc: 'Days active in last 30' },
    { key: 'quality',     label: 'Score Quality', value: qualityScore, color: 'bg-cyan-500', desc: 'Avg daily score' },
    { key: 'habits',      label: 'Habit Streak', value: habitScore, color: 'bg-orange-500', desc: 'Habits with active streaks' },
    { key: 'streak',      label: 'Streak Power', value: streakScore, color: 'bg-yellow-500', desc: `${stats?.currentStreak ?? 0} day streak` },
    { key: 'mood',        label: 'Mood Quality', value: moodScore, color: 'bg-pink-500', desc: 'Avg mood last 30 days' },
    { key: 'sleep',       label: 'Sleep Quality', value: sleepScore, color: 'bg-blue-500', desc: 'Nights with 7+ hours' },
  ]

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const legendaryCount = achievements.filter(a => a.unlocked && a.rarity === 'legendary').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Sparkles className="w-8 h-8 text-yellow-400" />
          Life Score Report
        </h1>
        <p className="text-slate-400 mt-1">A holistic view of your life game — powered by your 30-day data</p>
      </div>

      {/* Overall Score */}
      <div className="game-card p-6 text-center border border-violet-500/30 bg-violet-900/5">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Overall Life Score</div>
        <div className={`text-8xl font-bold mb-1 ${g.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {g.letter}
        </div>
        <div className={`text-2xl font-bold mb-1 ${g.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {overallScore}
        </div>
        <div className="text-slate-400 text-lg">{g.label}</div>
        <div className="mt-4 max-w-xs mx-auto">
          <MiniBar value={overallScore} color="bg-violet-500" />
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm text-slate-500">
          <span>🔥 {stats?.currentStreak ?? 0}d streak</span>
          <span>📅 {consistencyScore}% active</span>
          <span>🏆 {unlockedCount} achievements</span>
        </div>
      </div>

      {/* Radar chart + category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Life Dimensions
          </h3>
          <RadarRing scores={catScores} />
        </div>
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">Category Grades</h3>
          <div className="space-y-3">
            {Object.entries(catScores).map(([cat, score]) => {
              const g = grade(score)
              return (
                <div key={cat} className={`flex items-center gap-3 p-2.5 rounded-xl border ${CAT_COLORS[cat]}`}>
                  <span className={CAT_COLORS[cat].split(' ')[0]}>{CAT_ICONS[cat]}</span>
                  <span className="flex-1 text-sm text-slate-200 capitalize font-medium">{cat}</span>
                  <div className="flex items-center gap-2">
                    {trendIcon(scores30.map(d => d.score))}
                    <span className={`text-lg font-bold ${g.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{g.letter}</span>
                    <span className="text-xs text-slate-500 w-6">{score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Pillars breakdown */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          Score Pillars
        </h3>
        <div className="space-y-4">
          {pillars.map(p => (
            <div key={p.key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-slate-200">{p.label}</span>
                  <span className="text-xs text-slate-600 ml-2">{p.desc}</span>
                </div>
                <span className={`text-sm font-bold ${grade(p.value).color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {p.value}
                </span>
              </div>
              <MiniBar value={p.value} color={p.color} />
            </div>
          ))}
        </div>
      </div>

      {/* RPG Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '🔥', label: 'Best Streak', value: stats?.bestStreak ?? 0, color: 'text-orange-400' },
          { icon: '⏱', label: 'Total Hours', value: stats?.totalHours ?? 0, color: 'text-cyan-400' },
          { icon: '🏅', label: 'Achievements', value: unlockedCount, color: 'text-yellow-400' },
          { icon: '⚡', label: 'Legendary', value: legendaryCount, color: 'text-violet-400' },
        ].map(stat => (
          <div key={stat.label} className="game-card p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-xl font-bold ${stat.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Improvement tips */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Level-Up Opportunities
        </h3>
        <div className="space-y-2">
          {pillars
            .filter(p => p.value < 70)
            .sort((a, b) => a.value - b.value)
            .slice(0, 3)
            .map(p => (
              <div key={p.key} className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl">
                <span className="text-yellow-500 mt-0.5">→</span>
                <div>
                  <span className="text-sm font-medium text-slate-200">{p.label}</span>
                  <span className={`ml-2 text-xs font-bold ${grade(p.value).color}`}>{p.value}/100</span>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc} — focus here for biggest gains</p>
                </div>
              </div>
            ))
          }
          {pillars.every(p => p.value >= 70) && (
            <p className="text-center text-green-400 font-semibold py-4">
              🌟 All pillars are strong — you're in elite territory!
            </p>
          )}
        </div>
      </div>

      {/* Habit champions */}
      {habits.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Top Habits
          </h3>
          <div className="space-y-2">
            {[...habits].sort((a, b) => b.streak - a.streak).slice(0, 5).map((h, i) => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-slate-600 text-sm w-4">{i + 1}.</span>
                <span className="text-xl">{h.emoji}</span>
                <span className="flex-1 text-sm text-slate-200">{h.title}</span>
                <span className="text-orange-400 text-sm font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />{h.streak}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-slate-700">
        <p>Score calculated from: consistency (25%), quality (25%), habits (15%), streaks (15%), mood (10%), sleep (5%), achievements (5%)</p>
        <p className="mt-1">Updated daily as you log your life</p>
      </div>
    </div>
  )
}
