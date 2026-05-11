import { useEffect, useState } from 'react'
import axios from 'axios'
import { Trophy, Flame, Clock, Star, Shield, Zap, TrendingUp } from 'lucide-react'

interface Stats {
  last30Days: Array<{ date: string; score: number }>
  weeklyAvg: number; monthlyAvg: number
  categoryAvgMinutes: Record<string, number>
  categoryTotalMinutes: Record<string, number>
  currentStreak: number; bestStreak: number; totalHours: number
  bestDay: { date: string; score: number } | null
}
interface AchievementsData { totalXp: number; unlockedCount: number }

interface Milestone {
  label: string
  value: number | string
  target: number
  unit: string
  icon: string
  tiers: Array<{ threshold: number; label: string; color: string }>
  current: number
}

function getTierInfo(value: number, tiers: Array<{ threshold: number; label: string; color: string }>) {
  const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold)
  return sorted.find(t => value >= t.threshold) ?? { threshold: 0, label: 'Beginner', color: 'text-slate-500' }
}

function MilestoneCard({ m }: { m: Milestone }) {
  const tier = getTierInfo(m.current, m.tiers)
  const sortedTiers = [...m.tiers].sort((a, b) => a.threshold - b.threshold)
  const nextTier = sortedTiers.find(t => m.current < t.threshold)
  const pct = nextTier ? Math.min(100, Math.round((m.current / nextTier.threshold) * 100)) : 100

  return (
    <div className="game-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{m.icon}</span>
          <div>
            <div className="text-sm font-semibold text-slate-200">{m.label}</div>
            <div className={`text-xs font-bold ${tier.color}`}>{tier.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
            {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
          </div>
          <div className="text-xs text-slate-500">{m.unit}</div>
        </div>
      </div>
      <div className="stat-bar h-1.5 mb-1">
        <div
          className={`stat-bar-fill transition-all duration-1000 ${pct >= 100 ? 'bar-health' : 'bar-work'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {nextTier ? (
        <div className="text-xs text-slate-500">
          {pct}% to <span className={nextTier.color}>{nextTier.label}</span>
          {' '}({nextTier.threshold - m.current} {m.unit} away)
        </div>
      ) : (
        <div className="text-xs text-yellow-400 font-semibold">✨ Maximum tier reached!</div>
      )}
    </div>
  )
}

const RANK_TIERS = [
  { min: 0,  label: 'Initiate',    color: 'text-slate-500',   emoji: '🌱', desc: 'Your journey begins' },
  { min: 10, label: 'Apprentice',  color: 'text-green-400',   emoji: '⚔️', desc: 'Growing stronger' },
  { min: 20, label: 'Warrior',     color: 'text-cyan-400',    emoji: '🛡️', desc: 'Battle-hardened' },
  { min: 35, label: 'Champion',    color: 'text-blue-400',    emoji: '🏆', desc: 'Rising to glory' },
  { min: 55, label: 'Hero',        color: 'text-violet-400',  emoji: '⚡', desc: 'Others look up to you' },
  { min: 80, label: 'Legend',      color: 'text-yellow-400',  emoji: '🌟', desc: 'Your name echoes' },
  { min: 110, label: 'Myth',       color: 'text-orange-400',  emoji: '🔥', desc: 'Beyond mortal limits' },
  { min: 150, label: 'Transcendent',color: 'text-pink-400',   emoji: '🌌', desc: 'Touched the infinite' },
]

function getOverallRank(totalHours: number, bestStreak: number, unlockedAchievements: number) {
  const score = totalHours * 0.5 + bestStreak * 2 + unlockedAchievements * 3
  const sorted = [...RANK_TIERS].sort((a, b) => b.min - a.min)
  return sorted.find(t => score >= t.min) ?? RANK_TIERS[0]
}

export default function Milestones() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [achData, setAchData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<AchievementsData>('/api/achievements'),
    ]).then(([s, a]) => {
      setStats(s.data); setAchData(a.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  const totalHours = stats?.totalHours ?? 0
  const bestStreak = stats?.bestStreak ?? 0
  const unlockedCount = achData?.unlockedCount ?? 0
  const rank = getOverallRank(totalHours, bestStreak, unlockedCount)

  const allDays = stats?.last30Days ?? []
  const perfectDays = allDays.filter(d => d.score >= 100).length
  const avgScore = allDays.length > 0 ? Math.round(allDays.reduce((s, d) => s + d.score, 0) / allDays.length) : 0

  const catTotals = stats?.categoryTotalMinutes ?? {}
  const totalCatMins = Object.values(catTotals).reduce((a, b) => a + b, 0)

  const milestones: Milestone[] = [
    {
      label: 'Total Hours Invested',
      icon: '⏱️', value: totalHours, unit: 'hours', current: totalHours, target: 500,
      tiers: [
        { threshold: 1,   label: 'Getting Started', color: 'text-slate-400' },
        { threshold: 10,  label: 'Committed',        color: 'text-green-400' },
        { threshold: 50,  label: 'Dedicated',        color: 'text-cyan-400'  },
        { threshold: 100, label: 'Veteran',          color: 'text-blue-400'  },
        { threshold: 250, label: 'Elite',            color: 'text-violet-400'},
        { threshold: 500, label: 'Legendary',        color: 'text-yellow-400'},
      ],
    },
    {
      label: 'Best Streak',
      icon: '🔥', value: `${bestStreak}d`, unit: 'days', current: bestStreak, target: 100,
      tiers: [
        { threshold: 1,  label: 'First Fire',    color: 'text-slate-400'  },
        { threshold: 7,  label: 'One Week',      color: 'text-green-400'  },
        { threshold: 21, label: 'Three Weeks',   color: 'text-cyan-400'   },
        { threshold: 30, label: 'One Month',     color: 'text-blue-400'   },
        { threshold: 60, label: 'Two Months',    color: 'text-violet-400' },
        { threshold: 100, label: 'Centurion',    color: 'text-yellow-400' },
      ],
    },
    {
      label: 'Achievements Unlocked',
      icon: '🏆', value: `${unlockedCount}/30`, unit: 'achievements', current: unlockedCount, target: 30,
      tiers: [
        { threshold: 1,  label: 'Beginner',    color: 'text-slate-400'  },
        { threshold: 5,  label: 'Explorer',    color: 'text-green-400'  },
        { threshold: 10, label: 'Hunter',      color: 'text-cyan-400'   },
        { threshold: 20, label: 'Collector',   color: 'text-blue-400'   },
        { threshold: 25, label: 'Completionist',color: 'text-violet-400'},
        { threshold: 30, label: 'Perfectionist',color: 'text-yellow-400'},
      ],
    },
    {
      label: 'Perfect Days (100 pts)',
      icon: '💎', value: perfectDays, unit: 'days', current: perfectDays, target: 30,
      tiers: [
        { threshold: 1,  label: 'First Perfection', color: 'text-slate-400'  },
        { threshold: 5,  label: 'Consistent',       color: 'text-green-400'  },
        { threshold: 10, label: 'Disciplined',      color: 'text-cyan-400'   },
        { threshold: 20, label: 'Relentless',       color: 'text-violet-400' },
        { threshold: 30, label: 'Unstoppable',      color: 'text-yellow-400' },
      ],
    },
    {
      label: 'Average Score (30 days)',
      icon: '📊', value: `${avgScore} pts`, unit: 'avg pts', current: avgScore, target: 100,
      tiers: [
        { threshold: 20, label: 'Warming Up',   color: 'text-slate-400'  },
        { threshold: 40, label: 'Progressing',  color: 'text-green-400'  },
        { threshold: 60, label: 'Performing',   color: 'text-cyan-400'   },
        { threshold: 75, label: 'Excelling',    color: 'text-blue-400'   },
        { threshold: 90, label: 'Peak',         color: 'text-violet-400' },
        { threshold: 100, label: 'Flawless',    color: 'text-yellow-400' },
      ],
    },
    {
      label: 'Total Minutes Logged',
      icon: '📝', value: `${Math.round(totalCatMins / 60)}h`, unit: 'hours', current: Math.round(totalCatMins / 60), target: 500,
      tiers: [
        { threshold: 1,   label: 'First Log',   color: 'text-slate-400'  },
        { threshold: 25,  label: 'Active',      color: 'text-green-400'  },
        { threshold: 100, label: 'Consistent',  color: 'text-cyan-400'   },
        { threshold: 250, label: 'Prolific',    color: 'text-violet-400' },
        { threshold: 500, label: 'Epic',        color: 'text-yellow-400' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Trophy className="w-8 h-8 text-yellow-400" />
          Milestones
        </h1>
        <p className="text-slate-400 mt-1">Your Hall of Fame — every record tells your story</p>
      </div>

      {/* Overall rank card */}
      <div className="game-card p-6 glowing-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 50%, #8b5cf6, transparent 70%)' }} />
        <div className="relative text-center">
          <div className="text-6xl mb-2 animate-float">{rank.emoji}</div>
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Overall Rank</div>
          <div className={`text-4xl font-bold ${rank.color} neon-text`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {rank.label}
          </div>
          <div className="text-sm text-slate-400 mt-1 italic">"{rank.desc}"</div>

          {/* Rank progression */}
          <div className="mt-5 flex items-center justify-center gap-1 flex-wrap">
            {RANK_TIERS.map((t, i) => {
              const rankScore = totalHours * 0.5 + bestStreak * 2 + unlockedCount * 3
              const isActive = rankScore >= t.min && (i === RANK_TIERS.length - 1 || rankScore < RANK_TIERS[i + 1].min)
              const isPast = rankScore >= t.min && !isActive
              return (
                <div
                  key={t.label}
                  className={`flex flex-col items-center gap-0.5 px-1 ${isActive ? 'scale-110' : ''}`}
                  title={`${t.label}: ${t.min} score`}
                >
                  <span className={`text-sm ${isActive || isPast ? t.color : 'text-slate-700'}`}>
                    {isActive ? '▼' : ''}
                  </span>
                  <span className={`text-lg ${isActive || isPast ? '' : 'opacity-20'}`}>{t.emoji}</span>
                  <span className={`text-xs ${isActive ? t.color : isPast ? 'text-slate-500' : 'text-slate-700'}`}>
                    {t.label.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Hours', value: totalHours, icon: <Clock className="w-5 h-5 text-cyan-400" />, color: 'text-cyan-400' },
          { label: 'Best Streak', value: `${bestStreak}d`, icon: <Flame className="w-5 h-5 text-orange-400" />, color: 'text-orange-400' },
          { label: 'Achievements', value: `${unlockedCount}/30`, icon: <Star className="w-5 h-5 text-yellow-400" />, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Milestone cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Progress Milestones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestones.map(m => <MilestoneCard key={m.label} m={m} />)}
        </div>
      </div>

      {/* Inspirational comparison */}
      <div className="game-card p-5 border border-violet-500/20">
        <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          Perspective
        </h3>
        <div className="space-y-2 text-sm text-slate-400">
          {totalHours >= 1 && <p>⏱️ You've invested <span className="text-slate-200 font-semibold">{totalHours} hours</span> in yourself — that's {Math.round(totalHours / 10 * 10) / 10}% of a 1000-hour mastery journey.</p>}
          {bestStreak >= 7 && <p>🔥 Your best streak of <span className="text-slate-200 font-semibold">{bestStreak} days</span> puts you ahead of most people who quit in the first week.</p>}
          {perfectDays >= 1 && <p>💎 You've had <span className="text-slate-200 font-semibold">{perfectDays} perfect days</span> — days where you nailed every category. That's elite.</p>}
          {unlockedCount >= 5 && <p>🏆 <span className="text-slate-200 font-semibold">{unlockedCount} achievements</span> unlocked — you're in the top tier of dedicated self-improvers.</p>}
          {totalHours < 1 && bestStreak < 7 && (
            <p>🌱 Every legend started at zero. Log your first day and watch the journey begin. The only direction from here is up.</p>
          )}
        </div>
      </div>
    </div>
  )
}
