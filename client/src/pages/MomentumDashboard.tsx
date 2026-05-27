import { useState, useEffect, useMemo, useCallback } from 'react'
import { Flame, Zap, Star, Plus, Trash2, Save, Activity, Target, Calendar, BarChart3, TrendingUp, Award, ArrowRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'momentum_tracker_log'

// Keys to scan for cross-page activity
const ACTIVITY_LOG_KEYS = [
  'mindful_sleep_log',
  'energy_budget_log',
  'daily_excellence_log',
  'growth_mindset_log',
  'willpower_log',
] as const

type LogKey = typeof ACTIVITY_LOG_KEYS[number]

interface MomentumEntry {
  id: string
  date: string
  area: string
  win: string
  impact: 1 | 2 | 3
}

interface MomentumData {
  entries: MomentumEntry[]
  weeklyIntention: string
  lastUpdated: string
}

const AREA_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'health',        label: 'Health',        emoji: '🏃' },
  { value: 'work',          label: 'Work',          emoji: '💼' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️' },
  { value: 'growth',        label: 'Growth',        emoji: '🧠' },
  { value: 'fun',           label: 'Fun / Joy',     emoji: '🎉' },
  { value: 'spirituality',  label: 'Spirituality',  emoji: '🙏' },
  { value: 'finance',       label: 'Finance',       emoji: '💰' },
  { value: 'mindset',       label: 'Mindset',       emoji: '⚡' },
]

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function daysAgoStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function loadMomentumData(): MomentumData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MomentumData
      // Support existing MomentumTracker format (array) vs our format (object)
      if (Array.isArray(parsed)) {
        return { entries: [], weeklyIntention: '', lastUpdated: '' }
      }
      if (parsed.entries) return parsed
    }
  } catch { /**/ }
  return { entries: [], weeklyIntention: '', lastUpdated: '' }
}

function saveMomentumData(d: MomentumData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

function readStreak(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const n = Number(raw)
    if (!isNaN(n)) return n
    // Maybe stored as JSON array — compute streak
    const arr = JSON.parse(raw) as Array<{ date?: string; createdAt?: string }>
    if (!Array.isArray(arr)) return 0
    const today = todayStr()
    let streak = 0
    for (let i = 0; i < 60; i++) {
      const day = daysAgoStr(i)
      const found = arr.some(e => {
        const d = e.date ?? (e.createdAt ? e.createdAt.split('T')[0] : '')
        return d === day
      })
      if (found) streak++
      else if (i > 0) break
    }
    return streak
  } catch { return 0 }
}

function readUniqueDaysInLast7(key: LogKey): Set<string> {
  const days = new Set<string>()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return days
    const arr = JSON.parse(raw) as Array<{ date?: string; createdAt?: string }>
    if (!Array.isArray(arr)) return days
    const cutoff = daysAgoStr(6)
    arr.forEach(e => {
      const d = e.date ?? (e.createdAt ? e.createdAt.split('T')[0] : '')
      if (d >= cutoff) days.add(d)
    })
  } catch { /**/ }
  return days
}

function computeMomentumScore(): number {
  const lifeStreak = Math.min(30, readStreak('life_streak'))
  const morningStreak = Math.min(30, readStreak('morning_ritual_streak'))

  // streaks → 0-30 and 0-20
  const streakPoints = Math.round((lifeStreak / 30) * 30)
  const morningPoints = Math.round((morningStreak / 30) * 20)

  // Cross-page activity: count unique days in last 7 per log, each day ≤ 10 pts
  const dayActivity: Map<string, number> = new Map()
  ACTIVITY_LOG_KEYS.forEach(key => {
    readUniqueDaysInLast7(key).forEach(day => {
      dayActivity.set(day, (dayActivity.get(day) ?? 0) + 1)
    })
  })
  // each active day → up to 10 pts (1 log = 2 pts, 5 logs = 10 pts)
  let activityPoints = 0
  dayActivity.forEach(count => {
    activityPoints += Math.min(10, count * 2)
  })
  activityPoints = Math.min(50, activityPoints)

  return Math.min(100, streakPoints + morningPoints + activityPoints)
}

function computeDayMomentum(day: string): number {
  let count = 0
  ACTIVITY_LOG_KEYS.forEach(key => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const arr = JSON.parse(raw) as Array<{ date?: string; createdAt?: string }>
      if (!Array.isArray(arr)) return
      if (arr.some(e => {
        const d = e.date ?? (e.createdAt ? e.createdAt.split('T')[0] : '')
        return d === day
      })) count++
    } catch { /**/ }
  })
  // 0-5 logs → 0-100 score estimate
  return Math.min(100, count * 20)
}

function areaEmoji(area: string): string {
  return AREA_OPTIONS.find(a => a.value === area)?.emoji ?? '⭐'
}

function impactStars(impact: 1 | 2 | 3): string {
  return '★'.repeat(impact) + '☆'.repeat(3 - impact)
}

function impactColor(impact: 1 | 2 | 3): string {
  if (impact === 3) return 'text-yellow-400'
  if (impact === 2) return 'text-amber-400'
  return 'text-slate-400'
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-teal-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === todayStr()) return 'Today'
  if (dateStr === daysAgoStr(1)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function MomentumDashboard() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<MomentumData>(loadMomentumData)
  const [momentumScore, setMomentumScore] = useState<number>(0)
  const [lifeStreak, setLifeStreak] = useState<number>(0)
  const [morningStreak, setMorningStreak] = useState<number>(0)
  const [intention, setIntention] = useState<string>(data.weeklyIntention)

  // Add win form
  const [winArea, setWinArea] = useState<string>('health')
  const [winText, setWinText] = useState<string>('')
  const [winImpact, setWinImpact] = useState<1 | 2 | 3>(2)

  useEffect(() => {
    setMomentumScore(computeMomentumScore())
    setLifeStreak(readStreak('life_streak'))
    setMorningStreak(readStreak('morning_ritual_streak'))
  }, [])

  const persist = useCallback((next: MomentumData) => {
    setData(next)
    saveMomentumData(next)
  }, [])

  const addWin = () => {
    if (!winText.trim()) return
    const entry: MomentumEntry = {
      id: Date.now().toString(),
      date: todayStr(),
      area: winArea,
      win: winText.trim(),
      impact: winImpact,
    }
    const next: MomentumData = {
      ...data,
      entries: [entry, ...data.entries],
      lastUpdated: new Date().toISOString(),
    }
    persist(next)
    setWinText('')
    toastSuccess('Win logged!', `${areaEmoji(winArea)} ${entry.win}`)
  }

  const removeWin = (id: string) => {
    persist({
      ...data,
      entries: data.entries.filter(e => e.id !== id),
      lastUpdated: new Date().toISOString(),
    })
  }

  const saveIntention = () => {
    persist({ ...data, weeklyIntention: intention, lastUpdated: new Date().toISOString() })
    toastSuccess('Weekly intention saved')
  }

  const last10Wins = useMemo(() => data.entries.slice(0, 10), [data.entries])

  // 7-day activity grid data
  const sevenDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = daysAgoStr(6 - i)
      const logCounts: Record<LogKey, boolean> = {
        'mindful_sleep_log': false,
        'energy_budget_log': false,
        'daily_excellence_log': false,
        'growth_mindset_log': false,
        'willpower_log': false,
      }
      ACTIVITY_LOG_KEYS.forEach(key => {
        try {
          const raw = localStorage.getItem(key)
          if (!raw) return
          const arr = JSON.parse(raw) as Array<{ date?: string; createdAt?: string }>
          if (!Array.isArray(arr)) return
          logCounts[key] = arr.some(e => {
            const d = e.date ?? (e.createdAt ? e.createdAt.split('T')[0] : '')
            return d === day
          })
        } catch { /**/ }
      })
      const activeCount = Object.values(logCounts).filter(Boolean).length
      return { day, logCounts, activeCount }
    })
  }, [])

  // 7-day trend line data
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = daysAgoStr(6 - i)
      const score = computeDayMomentum(day)
      // Check if we have a win logged that day for a bonus
      const wins = data.entries.filter(e => e.date === day)
      const winBonus = Math.min(20, wins.reduce((s, e) => s + e.impact * 5, 0))
      return { day, score: Math.min(100, score + winBonus) }
    })
  }, [data.entries])

  // SVG line chart
  const SVG_W = 360
  const SVG_H = 80
  const PAD = 10
  const chartW = SVG_W - PAD * 2
  const chartH = SVG_H - PAD * 2

  const linePoints = trendData.map((d, i) => {
    const x = PAD + (i / (trendData.length - 1)) * chartW
    const y = PAD + chartH - (d.score / 100) * chartH
    return `${x},${y}`
  }).join(' ')

  const areaPoints =
    linePoints +
    ` ${SVG_W - PAD},${SVG_H - PAD} ${PAD},${SVG_H - PAD}`

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Zap className="w-7 h-7 text-amber-400" />
          Momentum Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Your all-in-one momentum view — streaks, wins, and life activity.</p>
      </div>

      {/* Momentum Score Hero */}
      <div className="game-card p-6 text-center border border-amber-500/20">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Momentum Score</p>
        <div className={`text-8xl font-bold ${scoreColor(momentumScore)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {momentumScore}
        </div>
        <p className="text-slate-400 text-sm mt-2">
          {momentumScore >= 80 ? 'Unstoppable — you\'re in full flow!' :
           momentumScore >= 60 ? 'Strong momentum — keep the engine running.' :
           momentumScore >= 40 ? 'Building — every log counts.' :
           'Time to restart the engines. Log something today.'}
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>Streak power (max 50)</span>
          <ArrowRight className="w-3 h-3" />
          <span>Activity across 7 days (max 50)</span>
        </div>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-4">
        <StreakCard label="Life Streak" streak={lifeStreak} color="text-orange-400" borderColor="border-orange-500/20" />
        <StreakCard label="Morning Ritual" streak={morningStreak} color="text-amber-400" borderColor="border-amber-500/20" />
      </div>

      {/* Add Win Form */}
      <div className="game-card p-5 border border-green-500/20 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-green-400" />
          Log a Win
        </h3>
        <div className="flex gap-2 flex-wrap">
          <select
            value={winArea}
            onChange={e => setWinArea(e.target.value)}
            className="game-input text-sm"
          >
            {AREA_OPTIONS.map(a => (
              <option key={a.value} value={a.value}>{a.emoji} {a.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            {([1, 2, 3] as const).map(n => (
              <button
                key={n}
                onClick={() => setWinImpact(n)}
                className={`text-xl transition-opacity ${winImpact >= n ? 'text-yellow-400 opacity-100' : 'text-slate-600 opacity-50'}`}
                title={n === 1 ? 'Low impact' : n === 2 ? 'Medium impact' : 'High impact'}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={winText}
            onChange={e => setWinText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWin()}
            className="game-input flex-1 text-sm"
            placeholder="Describe your win..."
            autoComplete="off"
          />
          <button
            onClick={addWin}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Win Feed */}
      {last10Wins.length > 0 && (
        <div className="game-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Recent Wins
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {last10Wins.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
                <span className="text-xl flex-shrink-0 mt-0.5">{areaEmoji(entry.area)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-snug">{entry.win}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold tracking-wider ${impactColor(entry.impact)}`}>
                      {impactStars(entry.impact)}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                  </div>
                </div>
                <button onClick={() => removeWin(entry.id)} className="text-slate-600 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day activity grid */}
      <div className="game-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          7-Day Activity Grid
        </h3>
        <div className="flex gap-1 text-xs text-slate-500 mb-1">
          {ACTIVITY_LOG_KEYS.map(k => (
            <span key={k} className="flex-1 text-center truncate" style={{ fontSize: 9 }}>
              {k.replace('_log', '').replace('_', ' ')}
            </span>
          ))}
        </div>
        <div className="space-y-1.5">
          {sevenDays.map(({ day, logCounts, activeCount }) => (
            <div key={day} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-12 flex-shrink-0">{day.slice(5)}</span>
              <div className="flex gap-1 flex-1">
                {ACTIVITY_LOG_KEYS.map(key => (
                  <div
                    key={key}
                    className={`flex-1 h-4 rounded-sm transition-colors ${logCounts[key] ? 'bg-teal-500 opacity-90' : 'bg-slate-700 opacity-40'}`}
                    title={`${key}: ${logCounts[key] ? 'logged' : 'no entry'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{activeCount}/5</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
          <span className="w-3 h-3 bg-teal-500 rounded-sm inline-block" /> Logged
          <span className="w-3 h-3 bg-slate-700 rounded-sm inline-block ml-2" /> No entry
        </div>
      </div>

      {/* Momentum Trend SVG */}
      <div className="game-card p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          7-Day Momentum Trend
        </h3>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block', height: 80 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[25, 50, 75].map(pct => {
            const y = PAD + chartH - (pct / 100) * chartH
            return (
              <line key={pct} x1={PAD} y1={y} x2={SVG_W - PAD} y2={y}
                stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
            )
          })}
          {/* Area fill */}
          <polygon points={areaPoints} fill="url(#trendGrad)" stroke="none" />
          {/* Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Dots */}
          {trendData.map((d, i) => {
            const x = PAD + (i / (trendData.length - 1)) * chartW
            const y = PAD + chartH - (d.score / 100) * chartH
            return (
              <circle key={d.day} cx={x} cy={y} r="3.5" fill="#8b5cf6" stroke="#0f172a" strokeWidth="1.5" />
            )
          })}
        </svg>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>{trendData[0].day.slice(5)}</span>
          <span>Momentum (0–100)</span>
          <span>{trendData[trendData.length - 1].day.slice(5)}</span>
        </div>
      </div>

      {/* Weekly intention */}
      <div className="game-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-400" />
          Weekly Intention
        </h3>
        <textarea
          value={intention}
          onChange={e => setIntention(e.target.value)}
          rows={3}
          className="game-input w-full resize-none text-sm"
          placeholder="What is your momentum focus this week? What single action would compound the most?"
        />
        <button
          onClick={saveIntention}
          className="flex items-center gap-2 px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold"
        >
          <Save className="w-4 h-4" />
          Save Intention
        </button>
        {data.lastUpdated && (
          <p className="text-xs text-slate-600">Last updated: {new Date(data.lastUpdated).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}

interface StreakCardProps {
  label: string
  streak: number
  color: string
  borderColor: string
}

function StreakCard({ label, streak, color, borderColor }: StreakCardProps) {
  return (
    <div className={`game-card p-4 text-center border ${borderColor}`}>
      <Flame className={`w-7 h-7 mx-auto mb-1 ${color}`} />
      <div className={`text-4xl font-bold ${color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
        {streak}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      <div className="text-xs text-slate-600 mt-1">
        {streak === 0 ? 'Start today' : streak === 1 ? '1 day' : `${streak} days`}
      </div>
    </div>
  )
}
