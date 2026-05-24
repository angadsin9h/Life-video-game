import { useState, useEffect } from 'react'
import { Zap, Brain, Star, Activity, Trophy, Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'weekly_power_log'

interface WeeklyEntry {
  weekStart: string
  weekEnd: string
  wins: [string, string, string]
  lessons: [string, string, string]
  nextFocus: [string, string, string]
  rating: number
  savedAt: string
  stats: WeekStats
}

interface WeekStats {
  avgSleep: number
  avgEnergy: number
  avgWillpower: number
  avgSharpness: number
  avgPerformance: number
  dailyDriverEntries: number
}

interface DailyDriverEntry {
  date: string
  energy: number
  score: number
}

interface WillpowerEntry {
  date: string
  willpowerScore: number
}

interface SleepEntry {
  date: string
  sleepScore: number
}

interface EnergyEntry {
  date: string
  energyScore?: number
  score?: number
}

interface NeuroplasticityEntry {
  date: string
  sharpnessScore?: number
  score?: number
}

interface HighPerformanceEntry {
  date: string
  performanceScore?: number
  score?: number
}

function getWeekBounds(): { start: string; end: string; startDate: Date; endDate: Date } {
  const now = new Date()
  const day = now.getDay()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - day)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    startDate,
    endDate,
  }
}

function isInWeek(dateStr: string, startDate: Date, endDate: Date): boolean {
  const d = new Date(dateStr)
  return d >= startDate && d <= endDate
}

function avgOf(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

function loadWeekStats(startDate: Date, endDate: Date): WeekStats {
  function parseLog<T>(key: string): T[] {
    try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
  }

  const ddLog = parseLog<DailyDriverEntry>('daily_driver_log')
  const wpLog = parseLog<WillpowerEntry>('willpower_log')
  const slLog = parseLog<SleepEntry>('mindful_sleep_log')
  const enLog = parseLog<EnergyEntry>('energy_budget_log')
  const npLog = parseLog<NeuroplasticityEntry>('neuroplasticity_log')
  const hpLog = parseLog<HighPerformanceEntry>('high_performance_log')

  const inWeek = (d: string) => isInWeek(d, startDate, endDate)

  const ddEntries = ddLog.filter(e => inWeek(e.date))
  const wpEntries = wpLog.filter(e => inWeek(e.date))
  const slEntries = slLog.filter(e => inWeek(e.date))
  const enEntries = enLog.filter(e => inWeek(e.date))
  const npEntries = npLog.filter(e => inWeek(e.date))
  const hpEntries = hpLog.filter(e => inWeek(e.date))

  return {
    avgSleep: avgOf(slEntries.map(e => e.sleepScore ?? 0)),
    avgEnergy: avgOf(enEntries.map(e => e.energyScore ?? e.score ?? 0)),
    avgWillpower: avgOf(wpEntries.map(e => e.willpowerScore ?? 0)),
    avgSharpness: avgOf(npEntries.map(e => e.sharpnessScore ?? e.score ?? 0)),
    avgPerformance: avgOf(hpEntries.map(e => e.performanceScore ?? e.score ?? 0)),
    dailyDriverEntries: ddEntries.length,
  }
}

function loadLog(): WeeklyEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

const STAT_CARDS = [
  { key: 'avgSleep', label: 'Avg Sleep', icon: <Star className="w-5 h-5 text-indigo-400" />, color: 'text-indigo-400', suffix: '' },
  { key: 'avgEnergy', label: 'Avg Energy', icon: <Zap className="w-5 h-5 text-amber-400" />, color: 'text-amber-400', suffix: '' },
  { key: 'avgWillpower', label: 'Avg Willpower', icon: <Activity className="w-5 h-5 text-red-400" />, color: 'text-red-400', suffix: '' },
  { key: 'avgSharpness', label: 'Avg Sharpness', icon: <Brain className="w-5 h-5 text-emerald-400" />, color: 'text-emerald-400', suffix: '' },
  { key: 'avgPerformance', label: 'Avg Performance', icon: <Trophy className="w-5 h-5 text-violet-400" />, color: 'text-violet-400', suffix: '' },
  { key: 'dailyDriverEntries', label: 'Driver Entries', icon: <Calendar className="w-5 h-5 text-sky-400" />, color: 'text-sky-400', suffix: '/7' },
] as const

export default function WeeklyPowerSession() {
  const { toastSuccess } = useToast()
  const { start, end, startDate, endDate } = getWeekBounds()
  const stats = loadWeekStats(startDate, endDate)

  const [log, setLog] = useState<WeeklyEntry[]>(loadLog)
  const [wins, setWins] = useState<[string, string, string]>(['', '', ''])
  const [lessons, setLessons] = useState<[string, string, string]>(['', '', ''])
  const [nextFocus, setNextFocus] = useState<[string, string, string]>(['', '', ''])
  const [rating, setRating] = useState(7)

  const last4 = log.slice(-4)
  const maxRating = 10

  function setTriple<T extends [string, string, string]>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    idx: number,
    val: string,
  ) {
    setter(prev => {
      const next = [...prev] as T
      next[idx] = val
      return next
    })
  }

  function handleSave() {
    const entry: WeeklyEntry = {
      weekStart: start,
      weekEnd: end,
      wins,
      lessons,
      nextFocus,
      rating,
      savedAt: new Date().toISOString(),
      stats,
    }
    const updated = log.filter(e => e.weekStart !== start)
    updated.push(entry)
    setLog(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
    toastSuccess('Weekly Power Session saved!', `Week rating: ${rating}/10`)
  }

  const barMaxH = 80

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-6 h-6 text-violet-400" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            Weekly Power Session
          </h1>
        </div>
        <p className="text-slate-400 text-sm">
          Week of <span className="text-violet-400">{start}</span> → <span className="text-violet-400">{end}</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {STAT_CARDS.map(card => {
          const val = stats[card.key]
          return (
            <div key={card.key} className="game-card flex items-center gap-3">
              {card.icon}
              <div>
                <p className="text-xs text-slate-400">{card.label}</p>
                <p className={`text-xl font-bold ${card.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {val}{card.suffix}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Week Wins */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">Week's Biggest Wins</span>
        </div>
        {([0, 1, 2] as const).map(i => (
          <textarea
            key={i}
            className="game-input w-full mb-2 last:mb-0 resize-none h-16"
            placeholder={`Win #${i + 1}...`}
            value={wins[i]}
            onChange={e => setTriple(setWins, i, e.target.value)}
          />
        ))}
      </div>

      {/* Week Lessons */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">Key Lessons Learned</span>
        </div>
        {([0, 1, 2] as const).map(i => (
          <textarea
            key={i}
            className="game-input w-full mb-2 last:mb-0 resize-none h-16"
            placeholder={`Lesson #${i + 1}...`}
            value={lessons[i]}
            onChange={e => setTriple(setLessons, i, e.target.value)}
          />
        ))}
      </div>

      {/* Next Week Focus */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">Next Week's Focus</span>
        </div>
        {([0, 1, 2] as const).map(i => (
          <input
            key={i}
            type="text"
            className="game-input w-full mb-2 last:mb-0"
            placeholder={`Focus #${i + 1}...`}
            value={nextFocus[i]}
            onChange={e => setTriple(setNextFocus, i, e.target.value)}
          />
        ))}
      </div>

      {/* Overall Rating */}
      <div className="game-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">Overall Week Rating</span>
          <span className="ml-auto text-amber-400 font-bold text-xl" style={{ fontFamily: 'Orbitron, monospace' }}>{rating}/10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="w-full accent-amber-400"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Rough week</span><span>Peak week</span>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all mb-6 flex items-center justify-center gap-2"
      >
        <Trophy className="w-5 h-5" />
        Save Weekly Power Session
      </button>

      {/* Mini bar chart */}
      {last4.length > 0 && (
        <div className="game-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="font-semibold text-sm">Last 4 Week Ratings</span>
          </div>
          <div className="flex items-end gap-4 justify-center h-24">
            {last4.map((entry, i) => {
              const barH = Math.round((entry.rating / maxRating) * barMaxH)
              const isGood = entry.rating >= 7
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400">{entry.rating}</span>
                  <svg width="32" height={barMaxH}>
                    <rect
                      x="4"
                      y={barMaxH - barH}
                      width="24"
                      height={barH}
                      rx="4"
                      fill={isGood ? '#7c3aed' : '#475569'}
                    />
                  </svg>
                  <span className="text-xs text-slate-600">{entry.weekStart.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
