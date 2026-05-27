import { Link } from 'react-router-dom'
import { Zap, Trophy, Flame, ChevronRight } from 'lucide-react'
import { useLifeData } from '../hooks/useLifeData'

// ─── Streak helper ────────────────────────────────────────────────────────────

function getStreak(loggedToday: boolean): number {
  try {
    const raw = localStorage.getItem('life_streak')
    const today = new Date().toISOString().split('T')[0]

    interface StreakData {
      streak: number
      lastDate: string
    }

    const data: StreakData = raw
      ? (JSON.parse(raw) as StreakData)
      : { streak: 0, lastDate: '' }

    if (data.lastDate === today) {
      // Already recorded today — return current streak
      return data.streak
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]

    let newStreak = data.streak
    if (loggedToday) {
      if (data.lastDate === yStr) {
        // Continued streak
        newStreak = data.streak + 1
      } else {
        // Broken or new streak
        newStreak = 1
      }
      const updated: StreakData = { streak: newStreak, lastDate: today }
      localStorage.setItem('life_streak', JSON.stringify(updated))
    } else if (data.lastDate !== yStr && data.lastDate !== today) {
      // Streak broken — do NOT write yet, just show 0
      newStreak = 0
    }

    return newStreak
  } catch {
    return 0
  }
}

// ─── Score color ──────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlatformStatusBar() {
  const { overallScore, loggedToday, totalDimensions } = useLifeData()
  const streak = getStreak(loggedToday > 0)

  return (
    <div className="w-full h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-4 text-xs select-none z-40">
      {/* Life Score */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Trophy className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-slate-400 hidden sm:inline">Life Score</span>
        <span className={`font-bold font-mono ${scoreColor(overallScore)}`}>
          {overallScore}
        </span>
      </div>

      <div className="w-px h-4 bg-slate-700 shrink-0" />

      {/* Logged today */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-slate-400 hidden sm:inline">Today</span>
        <span className="font-mono text-slate-200">
          {loggedToday}
          <span className="text-slate-500">/{totalDimensions}</span>
        </span>
      </div>

      <div className="w-px h-4 bg-slate-700 shrink-0" />

      {/* Streak */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Flame className="w-3.5 h-3.5 text-orange-400" />
        <span className="font-mono text-slate-200">{streak}</span>
        <span className="text-slate-400 hidden sm:inline">day streak</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command Center link */}
      <Link
        to="/command-center"
        className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors font-medium shrink-0"
      >
        <span className="hidden sm:inline">Command Center</span>
        <span className="sm:hidden">Hub</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
