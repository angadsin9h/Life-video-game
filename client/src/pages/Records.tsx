import { useEffect, useState } from 'react'
import axios from 'axios'
import { Trophy, Flame, Clock, Star, Zap, TrendingUp, Calendar, Target } from 'lucide-react'

interface Stats {
  currentStreak: number
  bestStreak: number
  totalHours: number
  weeklyAvg: number
  monthlyAvg: number
  bestDay: { date: string; score: number } | null
  last30Days: Array<{ date: string; score: number }>
}

interface Achievement {
  key: string
  title: string
  description: string
  icon: string
  rarity: string
  xp: number
  unlocked: boolean
  unlocked_at: string | null
}

interface HabitStats {
  id: number
  title: string
  emoji: string
  streak: number
  totalCompletions: number
}

interface RecordEntry {
  icon: string
  label: string
  value: string
  sub?: string
  color: string
  glow?: boolean
}

const RARITY_COLORS: Record<string, string> = {
  legendary: 'text-yellow-400 border-yellow-500/40 bg-yellow-900/10',
  epic:      'text-violet-400 border-violet-500/40 bg-violet-900/10',
  rare:      'text-blue-400 border-blue-500/40 bg-blue-900/10',
  uncommon:  'text-green-400 border-green-500/40 bg-green-900/10',
  common:    'text-slate-400 border-slate-600 bg-slate-800/40',
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const step = value / 40
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, 20)
    return () => clearInterval(timer)
  }, [value])
  return <>{display.toLocaleString()}{suffix}</>
}

export default function Records() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [habits, setHabits] = useState<HabitStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<{ achievements: Achievement[]; totalXp: number }>('/api/achievements'),
      axios.get<HabitStats[]>('/api/habits'),
    ]).then(([statsRes, achRes, habitsRes]) => {
      setStats(statsRes.data)
      setAchievements(achRes.data.achievements.filter(a => a.unlocked).sort((a, b) => {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
        return (rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 5) - (rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 5)
      }))
      setHabits(habitsRes.data.sort((a, b) => b.streak - a.streak))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
    </div>
  )

  const scores30 = stats?.last30Days ?? []
  const highestScore = scores30.length ? Math.max(...scores30.map(d => d.score)) : 0
  const lowestNonZero = scores30.filter(d => d.score > 0).length
    ? Math.min(...scores30.filter(d => d.score > 0).map(d => d.score)) : 0
  const perfectDays = scores30.filter(d => d.score >= 100).length
  const avg30 = scores30.length ? Math.round(scores30.reduce((s, d) => s + d.score, 0) / scores30.length) : 0
  const bestHabitStreak = Math.max(...habits.map(h => h.streak), 0)
  const totalHabitReps = habits.reduce((s, h) => s + h.totalCompletions, 0)
  const unlockedAch = achievements.length
  const legendaryCount = achievements.filter(a => a.rarity === 'legendary').length

  const records: RecordEntry[] = [
    { icon: '🔥', label: 'Best Streak', value: `${stats?.bestStreak ?? 0}`, sub: 'consecutive days', color: 'text-orange-400', glow: (stats?.bestStreak ?? 0) >= 7 },
    { icon: '⚡', label: 'Current Streak', value: `${stats?.currentStreak ?? 0}`, sub: 'days', color: 'text-yellow-400' },
    { icon: '⏱', label: 'Total Hours', value: `${stats?.totalHours ?? 0}`, sub: 'logged all time', color: 'text-cyan-400' },
    { icon: '💯', label: 'Perfect Days', value: `${perfectDays}`, sub: 'last 30 days', color: 'text-green-400', glow: perfectDays >= 5 },
    { icon: '🏆', label: 'Best Day Score', value: `${stats?.bestDay?.score ?? 0}`, sub: stats?.bestDay?.date ?? '', color: 'text-violet-400', glow: (stats?.bestDay?.score ?? 0) >= 90 },
    { icon: '📈', label: 'Monthly Avg', value: `${stats?.monthlyAvg ?? 0}`, sub: 'pts/day', color: 'text-blue-400' },
    { icon: '🎯', label: 'Achievements', value: `${unlockedAch}`, sub: `${legendaryCount} legendary`, color: 'text-yellow-400' },
    { icon: '✅', label: 'Habit Reps', value: `${totalHabitReps}`, sub: 'total completions', color: 'text-green-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Trophy className="w-8 h-8 text-yellow-400" />
          Trophy Room
        </h1>
        <p className="text-slate-400 mt-1">Your personal records — proof of what you've built</p>
      </div>

      {/* Hall of Fame stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {records.map(r => (
          <div
            key={r.label}
            className={`game-card p-4 text-center transition-all ${r.glow ? 'border border-yellow-500/30 bg-yellow-900/5' : ''}`}
          >
            <div className="text-2xl mb-1">{r.icon}</div>
            <div className={`text-xl font-bold ${r.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              <AnimatedNumber value={parseInt(r.value) || 0} />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{r.label}</div>
            {r.sub && <div className="text-xs text-slate-600">{r.sub}</div>}
          </div>
        ))}
      </div>

      {/* Score range */}
      {scores30.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Score Range (Last 30 Days)
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Lowest</div>
              <div className="text-2xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>{lowestNonZero}</div>
            </div>
            <div className="flex-1 relative h-8">
              <div className="absolute inset-y-3 left-0 right-0 bg-slate-800 rounded-full" />
              {lowestNonZero > 0 && (
                <div
                  className="absolute inset-y-3 bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-1000"
                  style={{ left: `${lowestNonZero}%`, right: `${100 - highestScore}%` }}
                />
              )}
              <div
                className="absolute top-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-900 transition-all duration-1000"
                style={{ left: `calc(${avg30}% - 10px)` }}
                title={`Average: ${avg30}`}
              >
                {avg30}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Highest</div>
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{highestScore}</div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 mt-2">Yellow dot = average ({avg30})</div>
        </div>
      )}

      {/* Top habit streaks */}
      {habits.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Habit Streak Leaders
          </h3>
          <div className="space-y-3">
            {habits.slice(0, 5).map((h, i) => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-slate-600 text-sm w-4">{i + 1}.</span>
                <span className="text-xl">{h.emoji}</span>
                <span className="flex-1 text-sm text-slate-200">{h.title}</span>
                <div className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>{h.streak}</span>
                </div>
                <div className="text-xs text-slate-500 w-16 text-right">{h.totalCompletions} reps</div>
              </div>
            ))}
          </div>
          {bestHabitStreak >= 7 && (
            <div className="mt-3 text-center text-xs text-orange-400 font-semibold">
              🔥 {bestHabitStreak}-day best streak — incredible discipline!
            </div>
          )}
        </div>
      )}

      {/* Achievement showcase */}
      {achievements.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Earned Achievements
            </h3>
            <span className="text-xs text-slate-500">{achievements.length} unlocked</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {achievements.slice(0, 12).map(a => (
              <div
                key={a.key}
                className={`p-3 rounded-xl border flex items-center gap-2 ${RARITY_COLORS[a.rarity] ?? RARITY_COLORS.common}`}
              >
                <span className="text-2xl flex-shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{a.title}</div>
                  <div className="text-xs text-slate-600 capitalize">{a.rarity}</div>
                </div>
              </div>
            ))}
          </div>
          {achievements.length > 12 && (
            <p className="text-center text-xs text-slate-500 mt-3">+{achievements.length - 12} more achievements</p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!stats?.bestStreak && !achievements.length && (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Start logging to fill your Trophy Room!</p>
          <p className="text-xs mt-1">Every streak, achievement, and personal best will be showcased here.</p>
        </div>
      )}
    </div>
  )
}
