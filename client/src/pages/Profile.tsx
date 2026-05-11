import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Shield, Star, Zap, Trophy, Flame, Clock, Calendar, BookOpen } from 'lucide-react'
import LifeBalanceWheel from '../components/LifeBalanceWheel'
import ScoreSparkline from '../components/ScoreSparkline'

interface Stats {
  last30Days: Array<{ date: string; score: number }>
  weeklyAvg: number; monthlyAvg: number
  categoryAvgMinutes: Record<string, number>
  currentStreak: number; bestStreak: number; totalHours: number
  bestDay: { date: string; score: number } | null
}
interface AchievementsData {
  achievements: Array<{ key: string; title: string; icon: string; xp: number; rarity: string; unlocked: boolean; unlocked_at: string | null }>
  totalXp: number; unlockedCount: number
}
interface BossData { totalDefeated: number }
interface Habit { streak: number; completedToday: boolean; totalCompletions: number }

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_MAX: Record<string, number> = { health: 25, mind: 25, work: 25, social: 10, growth: 15 }

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'uncommon', 'common']
const RARITY_COLORS: Record<string, string> = {
  legendary: 'text-yellow-400', epic: 'text-violet-400',
  rare: 'text-blue-400', uncommon: 'text-green-400', common: 'text-slate-400',
}

function getCharClass(catMins: Record<string, number>) {
  const entries = Object.entries(catMins).filter(([, v]) => v > 0)
  if (!entries.length) return { name: 'Novice', emoji: '🌱', color: 'text-slate-400', title: 'The Beginner', perk: 'Every journey starts somewhere.' }
  const total = entries.reduce((s, [, v]) => s + v, 0)
  const dom = entries.sort((a, b) => b[1] - a[1])[0]
  if (dom[1] / total < 0.35) return { name: 'Sage', emoji: '☯️', color: 'text-cyan-400', title: 'The Balanced One', perk: '+10% XP on all logged days' }
  const map: Record<string, { name: string; emoji: string; color: string; title: string; perk: string }> = {
    health: { name: 'Warrior',  emoji: '⚔️', color: 'text-green-400',  title: 'The Iron Warrior',   perk: '+25% XP on health activities'  },
    mind:   { name: 'Scholar',  emoji: '📚', color: 'text-cyan-400',   title: 'The Mind Scholar',   perk: '+25% XP on mind activities'    },
    work:   { name: 'Builder',  emoji: '⚙️', color: 'text-violet-400', title: 'The Master Builder', perk: '+25% XP on work activities'    },
    social: { name: 'Guardian', emoji: '🛡️', color: 'text-yellow-400', title: 'The Guardian',       perk: '+25% XP on social activities'  },
    growth: { name: 'Explorer', emoji: '🗺️', color: 'text-red-400',    title: 'The Explorer',       perk: '+25% XP on growth activities'  },
  }
  return map[dom[0]] || map.work
}

function getLevel(totalHours: number, streak: number, achXp: number) {
  const xp = totalHours * 10 + streak * 50 + achXp
  const level = Math.floor(xp / 500) + 1
  return { level, xp: xp % 500, nextXp: 500, totalXp: xp }
}

function getLevelTitle(level: number) {
  if (level >= 50) return 'Transcendent'
  if (level >= 40) return 'Grandmaster'
  if (level >= 30) return 'Legend'
  if (level >= 20) return 'Elite'
  if (level >= 15) return 'Expert'
  if (level >= 10) return 'Veteran'
  if (level >= 5)  return 'Adept'
  if (level >= 3)  return 'Apprentice'
  return 'Initiate'
}

export default function Profile() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [achData, setAchData] = useState<AchievementsData | null>(null)
  const [bossData, setBossData] = useState<BossData | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<AchievementsData>('/api/achievements'),
      axios.get<{ totalDefeated: number }>('/api/boss/current'),
      axios.get<Habit[]>('/api/habits'),
    ]).then(([s, a, b, h]) => {
      setStats(s.data); setAchData(a.data); setBossData(b.data); setHabits(h.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  const catMins = stats?.categoryAvgMinutes ?? {}
  const charClass = getCharClass(catMins)
  const { level, xp, nextXp, totalXp } = getLevel(stats?.totalHours ?? 0, stats?.currentStreak ?? 0, achData?.totalXp ?? 0)
  const levelTitle = getLevelTitle(level)

  const allDayScores = stats?.last30Days ?? []
  const bestScore = allDayScores.reduce((b, d) => d.score > b ? d.score : b, 0)
  const perfectDays = allDayScores.filter(d => d.score >= 100).length

  const topAch = (achData?.achievements ?? [])
    .filter(a => a.unlocked)
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))
    .slice(0, 6)

  const bestHabitStreak = Math.max(...habits.map(h => h.streak), 0)
  const totalHabitCompletions = habits.reduce((s, h) => s + h.totalCompletions, 0)

  // Power score — a composite "overall character strength" metric
  const powerScore = Math.round(
    (stats?.weeklyAvg ?? 0) * 0.3 +
    Math.min(100, (stats?.currentStreak ?? 0) * 3) * 0.2 +
    Math.min(100, (stats?.totalHours ?? 0) * 0.5) * 0.2 +
    Math.min(100, ((achData?.unlockedCount ?? 0) / 30) * 100) * 0.15 +
    Math.min(100, bestHabitStreak * 10) * 0.15
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Character Sheet</h1>
        <p className="text-slate-400 mt-1">Your RPG identity, forged from real life</p>
      </div>

      {/* Hero card */}
      <div className="game-card p-6 glowing-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 20% 50%, #8b5cf6, transparent 60%), radial-gradient(circle at 80% 50%, #06b6d4, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Class avatar */}
          <div className="w-24 h-24 rounded-2xl bg-slate-700 border-2 border-violet-500/50 flex items-center justify-center text-5xl flex-shrink-0 animate-float">
            {charClass.emoji}
          </div>
          {/* Stats */}
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">{charClass.title}</div>
            <div className={`text-3xl font-bold ${charClass.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {charClass.name}
            </div>
            <div className="text-xs text-slate-400 mt-1 italic">"{charClass.perk}"</div>
            <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start flex-wrap">
              <div className="flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded-full">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-slate-300">Lv.{level} {levelTitle}</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3 text-violet-400" />
                <span className="text-slate-300">{totalXp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded-full">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-slate-300">{stats?.currentStreak ?? 0}d streak</span>
              </div>
            </div>
          </div>
          {/* Power score */}
          <div className="flex-shrink-0 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Power</div>
            <div className="text-4xl font-bold text-violet-400 neon-text" style={{ fontFamily: 'Orbitron, monospace' }}>
              {powerScore}
            </div>
            <div className="text-xs text-slate-500 mt-1">/ 100</div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Level {level}</span>
            <span>{xp}/{nextXp} XP to Level {level + 1}</span>
          </div>
          <div className="stat-bar h-3">
            <div className="stat-bar-fill bar-work transition-all duration-1000" style={{ width: `${(xp / nextXp) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Life Balance Wheel + Attributes */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Life Balance Wheel
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <LifeBalanceWheel
            attributes={[
              { label: 'Health', value: Math.min(25, Math.round((catMins.health ?? 0) / 2)), max: 25, color: '#22c55e', icon: '❤️' },
              { label: 'Mind',   value: Math.min(25, Math.round((catMins.mind ?? 0) / 2)),   max: 25, color: '#06b6d4', icon: '🧠' },
              { label: 'Work',   value: Math.min(25, Math.round((catMins.work ?? 0) / 2)),   max: 25, color: '#8b5cf6', icon: '💼' },
              { label: 'Social', value: Math.min(10, Math.round((catMins.social ?? 0) / 3)), max: 10, color: '#f59e0b', icon: '👥' },
              { label: 'Growth', value: Math.min(15, Math.round((catMins.growth ?? 0) / 2)), max: 15, color: '#ef4444', icon: '🚀' },
            ]}
            size={200}
          />
          <div className="flex-1 space-y-3 w-full">
            {['health','mind','work','social','growth'].map(cat => {
              const avgMins = catMins[cat] ?? 0
              const maxPts = CAT_MAX[cat]
              const pts = Math.min(maxPts, Math.round(avgMins / 2))
              const pct = Math.round((pts / maxPts) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-300">{CAT_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    <span className="text-slate-400">{pts}<span className="text-slate-600">/{maxPts}</span></span>
                  </div>
                  <div className="stat-bar h-2.5">
                    <div className={`stat-bar-fill bar-${cat} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Score trend */}
      {(stats?.last30Days ?? []).length > 1 && (
        <div className="game-card p-4">
          <h3 className="font-semibold text-slate-300 mb-3 text-sm">Score Trend (30d)</h3>
          <ScoreSparkline data={stats!.last30Days} height={80} showLabels />
        </div>
      )}

      {/* Key stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Hours',       value: `${stats?.totalHours ?? 0}h`,   icon: <Clock className="w-5 h-5 text-cyan-400" />,    color: 'text-cyan-400'   },
          { label: 'Best Streak',       value: `${stats?.bestStreak ?? 0}d`,    icon: <Flame className="w-5 h-5 text-orange-400" />,  color: 'text-orange-400' },
          { label: 'Best Day Score',    value: bestScore,                        icon: <Trophy className="w-5 h-5 text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Bosses Defeated',   value: bossData?.totalDefeated ?? 0,    icon: <Shield className="w-5 h-5 text-red-400" />,    color: 'text-red-400'    },
          { label: 'Habit Completions', value: totalHabitCompletions,            icon: <Calendar className="w-5 h-5 text-green-400" />,color: 'text-green-400'  },
          { label: 'Achievements',      value: `${achData?.unlockedCount ?? 0}/30`, icon: <Star className="w-5 h-5 text-violet-400" />, color: 'text-violet-400'},
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top achievements showcase */}
      {topAch.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Rare Achievements
            </h3>
            <Link to="/achievements" className="text-xs text-violet-400 hover:text-violet-300">All →</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {topAch.map(a => (
              <div key={a.key} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-2xl mx-auto mb-1">
                  {a.icon}
                </div>
                <div className={`text-xs font-semibold ${RARITY_COLORS[a.rarity]}`}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal records */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Personal Records
        </h3>
        <div className="space-y-3 text-sm">
          {[
            { label: '🏆 Best daily score',        value: `${bestScore} pts`,                           note: stats?.bestDay?.date ?? '' },
            { label: '🔥 Longest streak',           value: `${stats?.bestStreak ?? 0} days`,             note: '' },
            { label: '⏱️ Total time invested',      value: `${stats?.totalHours ?? 0} hours`,            note: '' },
            { label: '💪 Best habit streak',        value: `${bestHabitStreak} days`,                    note: '' },
            { label: '📊 Best weekly average',      value: `${stats?.weeklyAvg ?? 0} pts`,               note: '(last 7 days)' },
            { label: '✨ Perfect days (100 pts)',   value: `${perfectDays}`,                             note: 'last 30 days' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
              <span className="text-slate-300">{r.label}</span>
              <div className="text-right">
                <span className="font-bold text-slate-200">{r.value}</span>
                {r.note && <div className="text-xs text-slate-500">{r.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
