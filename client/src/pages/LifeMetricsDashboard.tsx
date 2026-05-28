import { useEffect, useState } from 'react'
import axios from 'axios'
import { Activity, TrendingUp, Moon, Heart, Dumbbell, BookOpen, Droplets, Clock } from 'lucide-react'

interface MetricCard {
  label: string
  value: string | number
  unit: string
  trend: 'up' | 'down' | 'neutral'
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  subtext: string
}

interface SleepData { duration_minutes: number; quality: number; date: string }
interface MoodData { mood: number; date: string }
interface WorkoutData { duration_minutes: number; date: string }
interface WaterData { amount_ml: number; date: string }
interface FocusData { duration_minutes: number; date: string; created_at: string }

export default function LifeMetricsDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [weekScore, setWeekScore] = useState(0)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const prevWeekStart = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

    try {
      const [sleepR, moodR, workoutR, waterR, focusR] = await Promise.allSettled([
        axios.get('/api/sleep?limit=14'),
        axios.get('/api/mood?limit=14'),
        axios.get('/api/workouts?limit=14'),
        axios.get('/api/water?limit=14'),
        axios.get('/api/timer/sessions?limit=50'),
      ])

      const sleepLogs: SleepData[] = sleepR.status === 'fulfilled' ? (sleepR.value.data as SleepData[]) : []
      const moodLogs: MoodData[] = moodR.status === 'fulfilled' ? (moodR.value.data as MoodData[]) : []
      const workouts: WorkoutData[] = workoutR.status === 'fulfilled' ? (workoutR.value.data as WorkoutData[]) : []
      const water: WaterData[] = waterR.status === 'fulfilled' ? (waterR.value.data as WaterData[]) : []
      const focus: FocusData[] = focusR.status === 'fulfilled' ? (focusR.value.data as FocusData[]) : []

      // This week vs last week helpers
      const thisWeek = <T extends { date?: string; created_at?: string }>(arr: T[]) =>
        arr.filter(l => (l.date || l.created_at?.split('T')[0] || '') >= sevenDaysAgo)
      const lastWeek = <T extends { date?: string; created_at?: string }>(arr: T[]) =>
        arr.filter(l => {
          const d = l.date || l.created_at?.split('T')[0] || ''
          return d >= prevWeekStart && d < sevenDaysAgo
        })

      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0
      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

      // Sleep
      const thisSleep = thisWeek(sleepLogs)
      const lastSleep = lastWeek(sleepLogs)
      const avgSleepMins = avg(thisSleep.map(l => l.duration_minutes))
      const prevAvgSleep = avg(lastSleep.map(l => l.duration_minutes))
      const avgSleepQuality = avg(thisSleep.map(l => l.quality))

      // Mood
      const thisMood = thisWeek(moodLogs)
      const lastMood = lastWeek(moodLogs)
      const avgMood = avg(thisMood.map(l => l.mood))
      const prevMood = avg(lastMood.map(l => l.mood))

      // Workouts
      const thisWorkouts = thisWeek(workouts)
      const lastWorkouts = lastWeek(workouts)

      // Water (today)
      const todayWater = water.filter(l => l.date === today)
      const avgWaterMl = avg(thisWeek(water).map(l => l.amount_ml))

      // Focus
      const thisFocus = focus.filter(l => (l.created_at || '').split('T')[0] >= sevenDaysAgo)
      const totalFocusMins = sum(thisFocus.map(l => l.duration_minutes))
      const prevFocusMins = sum(focus.filter(l => {
        const d = (l.created_at || '').split('T')[0]
        return d >= prevWeekStart && d < sevenDaysAgo
      }).map(l => l.duration_minutes))

      const trend = (curr: number, prev: number): 'up' | 'down' | 'neutral' =>
        curr > prev * 1.05 ? 'up' : curr < prev * 0.95 ? 'down' : 'neutral'

      const cards: MetricCard[] = [
        {
          label: 'Avg Sleep',
          value: avgSleepMins > 0 ? `${Math.floor(avgSleepMins / 60)}h${Math.round(avgSleepMins % 60)}m` : '—',
          unit: '/ night',
          trend: trend(avgSleepMins, prevAvgSleep),
          color: '#3b82f6',
          icon: Moon,
          subtext: avgSleepQuality > 0 ? `Quality: ${avgSleepQuality.toFixed(1)}/5` : 'No data',
        },
        {
          label: 'Avg Mood',
          value: avgMood > 0 ? avgMood.toFixed(1) : '—',
          unit: '/ 10',
          trend: trend(avgMood, prevMood),
          color: avgMood >= 7 ? '#22c55e' : avgMood >= 5 ? '#eab308' : '#ef4444',
          icon: Heart,
          subtext: `${thisMood.length} logs this week`,
        },
        {
          label: 'Workouts',
          value: thisWorkouts.length,
          unit: 'sessions',
          trend: trend(thisWorkouts.length, lastWorkouts.length),
          color: '#22c55e',
          icon: Dumbbell,
          subtext: thisWorkouts.length > 0 ? `${Math.round(avg(thisWorkouts.map(w => w.duration_minutes)))}m avg` : 'None logged',
        },
        {
          label: 'Focus Time',
          value: totalFocusMins >= 60 ? `${Math.floor(totalFocusMins / 60)}h${Math.round(totalFocusMins % 60)}m` : `${totalFocusMins}m`,
          unit: 'this week',
          trend: trend(totalFocusMins, prevFocusMins),
          color: '#8b5cf6',
          icon: Clock,
          subtext: `${thisFocus.length} focus sessions`,
        },
        {
          label: 'Avg Water',
          value: avgWaterMl > 0 ? `${(avgWaterMl / 1000).toFixed(1)}L` : '—',
          unit: '/ day',
          trend: 'neutral',
          color: '#06b6d4',
          icon: Droplets,
          subtext: `Today: ${sum(todayWater.map(w => w.amount_ml))}ml`,
        },
        {
          label: 'Active Days',
          value: new Set([...thisSleep.map(l => l.date), ...thisMood.map(l => l.date), ...thisWorkouts.map(l => l.date)]).size,
          unit: '/ 7 days',
          trend: 'neutral',
          color: '#f97316',
          icon: Activity,
          subtext: 'Days with any tracking',
        },
      ]

      setMetrics(cards)

      // Life score: weighted average of normalized metrics
      const sleepScore = avgSleepMins > 0 ? Math.min(100, (avgSleepMins / 480) * 100) : 0
      const moodScore = avgMood > 0 ? (avgMood / 10) * 100 : 0
      const workoutScore = Math.min(100, (thisWorkouts.length / 4) * 100)
      const focusScore = Math.min(100, (totalFocusMins / 600) * 100)
      const score = Math.round((sleepScore * 0.3 + moodScore * 0.3 + workoutScore * 0.2 + focusScore * 0.2))
      setWeekScore(score)
    } finally {
      setLoading(false)
    }
  }

  const trendIcon = (t: 'up' | 'down' | 'neutral') =>
    t === 'up' ? '↑' : t === 'down' ? '↓' : '→'
  const trendColor = (t: 'up' | 'down' | 'neutral', isGood = true) =>
    t === 'neutral' ? '#64748b' : (t === 'up') === isGood ? '#22c55e' : '#ef4444'

  const scoreGrade = weekScore >= 90 ? 'S' : weekScore >= 80 ? 'A' : weekScore >= 70 ? 'B' : weekScore >= 60 ? 'C' : weekScore >= 50 ? 'D' : 'F'
  const scoreColor = weekScore >= 80 ? '#22c55e' : weekScore >= 60 ? '#eab308' : '#ef4444'

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Activity className="w-7 h-7 text-green-400" />
          Life Metrics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">7-day overview across all health dimensions</p>
      </div>

      {/* Weekly score */}
      <div className="game-card p-5 flex items-center gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: scoreColor }}>{scoreGrade}</div>
          <div className="text-xs text-slate-500 mt-1">Grade</div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-white mb-1">Week Score: {weekScore}/100</div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${weekScore}%`, background: scoreColor }} />
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {weekScore >= 80 ? 'Outstanding week! Keep the momentum.' :
             weekScore >= 60 ? 'Good progress. Push harder next week.' :
             'Room for improvement. Focus on sleep and mood first.'}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="game-card p-4">
            <div className="flex items-center justify-between mb-2">
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
              <span className="text-xs font-bold" style={{ color: trendColor(m.trend) }}>
                {trendIcon(m.trend)}
              </span>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs text-slate-500">{m.label} {m.unit}</div>
            <div className="text-[11px] text-slate-600 mt-1">{m.subtext}</div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="game-card p-4 border border-green-500/10 bg-green-900/5">
        <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> This Week's Insights
        </h3>
        <div className="space-y-2 text-sm text-slate-400">
          {weekScore >= 80 && <p>• Excellent across the board. You're in a high-performance week.</p>}
          {weekScore < 60 && <p>• Your overall score is low. Prioritize sleep and mood tracking first.</p>}
          {metrics.find(m => m.label === 'Workouts' && typeof m.value === 'number' && m.value < 3) && (
            <p>• Less than 3 workouts this week. Aim for at least 3-4 for optimal performance.</p>
          )}
          {metrics.find(m => m.label === 'Avg Sleep' && m.value === '—') && (
            <p>• No sleep data logged. Start tracking sleep to unlock insights.</p>
          )}
          {metrics.find(m => m.label === 'Focus Time' && m.value === '0m') && (
            <p>• No focus sessions this week. Use the Focus Timer to build deep work habits.</p>
          )}
          <p>• Consistency beats intensity. Log every day to see patterns emerge.</p>
        </div>
      </div>
    </div>
  )
}
