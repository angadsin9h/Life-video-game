import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Flame, Trophy, RefreshCw, Moon, Droplets, Dumbbell, BookOpen, Apple, Star, TrendingUp } from 'lucide-react'

interface StreakItem {
  id: string
  label: string
  emoji: string
  streak: number
  bestStreak: number
  icon: React.ReactNode
  color: string
  link: string
  subtitle: string
}

interface Stats { currentStreak: number; bestStreak: number }
interface Habit { id: number; title: string; emoji: string; streak: number; bestStreak?: number }
interface SleepStats { avgHours: number; streak7: number }

function StreakCard({ item }: { item: StreakItem }) {
  const pct = item.bestStreak > 0 ? Math.min(100, (item.streak / item.bestStreak) * 100) : 0
  const isAtBest = item.streak > 0 && item.streak >= item.bestStreak

  return (
    <Link to={item.link} className="game-card p-4 hover:border-slate-600 transition-all group block">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 flex-shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-slate-200">{item.label}</span>
            {isAtBest && item.streak > 0 && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">Personal Best!</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mb-2">{item.subtitle}</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Flame className={`w-4 h-4 ${item.streak > 0 ? 'text-orange-400' : 'text-slate-700'}`} />
              <span className={`text-lg font-bold ${item.streak > 0 ? item.color.split(' ')[0] : 'text-slate-700'}`}
                style={{ fontFamily: 'Orbitron, monospace' }}>
                {item.streak}
              </span>
              <span className="text-xs text-slate-600">day{item.streak !== 1 ? 's' : ''}</span>
            </div>
            {item.bestStreak > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Trophy className="w-3 h-3" />
                <span>best: {item.bestStreak}</span>
              </div>
            )}
          </div>
          {item.bestStreak > 0 && (
            <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isAtBest ? 'bg-yellow-500' : 'bg-orange-500/60'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Streaks() {
  const [appStreak, setAppStreak] = useState(0)
  const [appBest, setAppBest] = useState(0)
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitDone7, setHabitDone7] = useState(0)
  const [workoutStreak, setWorkoutStreak] = useState(0)
  const [journalStreak, setJournalStreak] = useState(0)
  const [sleepStreak, setSleepStreak] = useState(0)
  const [waterStreak, setWaterStreak] = useState(0)
  const [nutritionStreak, setNutritionStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      axios.get<Stats>('/api/stats'),
      axios.get<Habit[]>('/api/habits'),
    ]).then(([statsRes, habitsRes]) => {
      setAppStreak(statsRes.data.currentStreak)
      setAppBest(statsRes.data.bestStreak)
      setHabits(habitsRes.data)
    }).catch(console.error)

    // Load streaks from individual routes
    axios.get<Array<{ date: string }>>('/api/journal')
      .then(r => {
        let s = 0
        const dateSet = new Set(r.data.map((e: any) => e.date))
        let d = new Date()
        while (dateSet.has(d.toISOString().split('T')[0])) {
          s++
          d.setDate(d.getDate() - 1)
        }
        setJournalStreak(s)
      }).catch(() => {})

    axios.get<Array<{ date: string; duration_minutes: number }>>('/api/sleep')
      .then(r => {
        let s = 0
        const dateSet = new Set(r.data.filter((e: any) => e.duration_minutes > 0).map((e: any) => e.date))
        let d = new Date()
        d.setDate(d.getDate() - 1) // sleep streak from yesterday
        while (dateSet.has(d.toISOString().split('T')[0])) {
          s++
          d.setDate(d.getDate() - 1)
        }
        setSleepStreak(s)
      }).catch(() => {})

    axios.get<Array<{ date: string; glasses: number }>>('/api/water/history/week')
      .then(r => {
        let s = 0
        const goalMet = r.data.filter((e: any) => e.glasses >= (e.goal || 8))
        const dateSet = new Set(goalMet.map((e: any) => e.date))
        let d = new Date()
        while (dateSet.has(d.toISOString().split('T')[0])) {
          s++
          d.setDate(d.getDate() - 1)
        }
        setWaterStreak(s)
      }).catch(() => {})

    setLoading(false)
  }, [])

  if (loading) return <div className="space-y-3 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}</div>

  const totalHabitStreak = habits.reduce((s, h) => s + h.streak, 0)
  const avgHabitStreak = habits.length > 0 ? Math.round(totalHabitStreak / habits.length) : 0
  const topHabits = [...habits].sort((a, b) => b.streak - a.streak).slice(0, 5)

  const streaks: StreakItem[] = [
    {
      id: 'app',
      label: 'App Streak',
      emoji: '🎮',
      streak: appStreak,
      bestStreak: appBest,
      icon: <Flame className="w-5 h-5" />,
      color: 'text-orange-400',
      link: '/',
      subtitle: 'Consecutive days with logged activities',
    },
    {
      id: 'journal',
      label: 'Journal Streak',
      emoji: '📖',
      streak: journalStreak,
      bestStreak: journalStreak,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-amber-400',
      link: '/journal',
      subtitle: 'Consecutive days with journal entries',
    },
    {
      id: 'sleep',
      label: 'Sleep Tracking',
      emoji: '🌙',
      streak: sleepStreak,
      bestStreak: sleepStreak,
      icon: <Moon className="w-5 h-5" />,
      color: 'text-indigo-400',
      link: '/sleep',
      subtitle: 'Consecutive days with sleep logged',
    },
    {
      id: 'water',
      label: 'Hydration Goal',
      emoji: '💧',
      streak: waterStreak,
      bestStreak: waterStreak,
      icon: <Droplets className="w-5 h-5" />,
      color: 'text-cyan-400',
      link: '/briefing',
      subtitle: 'Consecutive days hitting water goal',
    },
  ]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Flame className="w-7 h-7 text-orange-400" />
          Streak Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">All your active streaks in one place</p>
      </div>

      {/* App streak hero */}
      <div className="game-card p-6 text-center border border-orange-500/20 bg-orange-900/5">
        <Flame className="w-10 h-10 text-orange-400 mx-auto mb-2" />
        <div className="text-5xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>
          {appStreak}
        </div>
        <div className="text-slate-400 mt-1">day streak</div>
        {appBest > 0 && (
          <div className="text-xs text-slate-600 mt-2 flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3" />
            Personal best: {appBest} days
          </div>
        )}
        {appStreak > 0 && (
          <div className="mt-3 text-sm text-orange-300">
            {appStreak >= 100 ? '🏆 Legendary Dedication!' :
             appStreak >= 30 ? '⚡ Incredible momentum!' :
             appStreak >= 7 ? '🔥 On fire! Keep going!' :
             '🌱 Building momentum!'}
          </div>
        )}
      </div>

      {/* Streak grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {streaks.map(item => <StreakCard key={item.id} item={item} />)}
      </div>

      {/* Habit streaks */}
      {habits.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-violet-400" />
              Habit Streaks
            </h3>
            <div className="text-xs text-slate-500">Avg: {avgHabitStreak}d</div>
          </div>
          <div className="space-y-3">
            {topHabits.map(h => {
              const pct = Math.min(100, h.streak > 0 ? Math.min(100, h.streak * 3.3) : 0)
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-200 truncate">{h.title}</span>
                      <span className="text-sm font-bold text-orange-400 flex-shrink-0 ml-2 flex items-center gap-1">
                        <Flame className={`w-3.5 h-3.5 ${h.streak > 0 ? 'text-orange-400' : 'text-slate-700'}`} />
                        {h.streak}d
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${h.streak >= 30 ? 'bg-yellow-500' : h.streak >= 7 ? 'bg-orange-500' : 'bg-violet-500/60'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {habits.length > 5 && (
            <Link to="/habits" className="text-xs text-violet-400 hover:text-violet-300 mt-3 block text-right">
              View all {habits.length} habits →
            </Link>
          )}
        </div>
      )}

      {/* Streak tips */}
      <div className="game-card p-5 border border-violet-500/20">
        <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          Streak Science
        </h3>
        <div className="space-y-2 text-xs text-slate-400">
          {[
            '7-day streaks: Your brain starts forming a pattern recognition for the habit.',
            '21-day streaks: The habit becomes easier to maintain than to skip.',
            '66-day streaks: Research shows this is when habits become truly automatic.',
            "Don't break the chain: Missing two days in a row is the real streak killer.",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <Star className="w-3 h-3 text-violet-500 mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
