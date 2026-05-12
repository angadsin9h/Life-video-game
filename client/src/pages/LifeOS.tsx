import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Zap, Heart, Brain, Briefcase, Users, TrendingUp, Moon, Droplets, BookOpen, Dumbbell, Clock, Target, Flame, Trophy, Activity } from 'lucide-react'

interface OSData {
  score: number
  streak: number
  level: number
  habitsCompleted: number
  habitsTotal: number
  waterGlasses: number
  waterGoal: number
  sleepHours: number
  sleepQuality: number
  moodRating: number
  tasksCompleted: number
  tasksTotal: number
  focusMinutes: number
  categoryMins: Record<string, number>
  weekScores: Array<{ date: string; score: number }>
  activeChallenges: number
  activeProjects: number
  journalStreak: number
  xp: number
}

const AREA_CONFIG = [
  { id: 'health', label: 'Health', icon: Heart, color: '#22c55e', route: '/metrics' },
  { id: 'mind', label: 'Mind', icon: Brain, color: '#06b6d4', route: '/focus-stats' },
  { id: 'work', label: 'Work', icon: Briefcase, color: '#8b5cf6', route: '/taskboard' },
  { id: 'social', label: 'Social', icon: Users, color: '#eab308', route: '/journal' },
  { id: 'growth', label: 'Growth', icon: TrendingUp, color: '#f97316', route: '/goals' },
]

function MetricTile({ label, value, sub, icon: Icon, color, route, pulse }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; route: string; pulse?: boolean
}) {
  return (
    <Link to={route} className="game-card p-3 hover:scale-105 transition-all group block">
      <div className="flex items-start justify-between">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
        {pulse && <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-400" />}
      </div>
      <div className="mt-2">
        <div className="text-xl font-bold text-slate-100 group-hover:text-white transition-colors">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </Link>
  )
}

function AreaBar({ id, label, icon: Icon, color, minutes, maxMinutes }: {
  id: string; label: string; icon: React.ElementType; color: string; minutes: number; maxMinutes: number
}) {
  const pct = maxMinutes > 0 ? Math.min(100, (minutes / maxMinutes) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
      <div className="w-20 text-xs text-slate-400">{label}</div>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-xs text-slate-600 w-10 text-right">{minutes > 0 ? `${minutes}m` : '—'}</div>
    </div>
  )
}

export default function LifeOS() {
  const today = new Date().toISOString().split('T')[0]
  const [data, setData] = useState<Partial<OSData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/stats').catch(() => ({ data: null })),
      axios.get(`/api/logs/${today}`).catch(() => ({ data: null })),
      axios.get('/api/habits').catch(() => ({ data: [] })),
      axios.get(`/api/water/${today}`).catch(() => ({ data: { glasses: 0, goal: 8 } })),
      axios.get('/api/sleep?limit=1').catch(() => ({ data: [] })),
      axios.get('/api/mood/today').catch(() => ({ data: null })),
      axios.get('/api/timer/sessions').catch(() => ({ data: [] })),
      axios.get('/api/timeline?limit=7').catch(() => ({ data: [] })),
      axios.get('/api/achievements').catch(() => ({ data: { achievements: [], totalXp: 0 } })),
      axios.get('/api/projects?status=active').catch(() => ({ data: [] })),
      axios.get('/api/habit-challenges').catch(() => ({ data: [] })),
    ]).then(([statsRes, logRes, habitsRes, waterRes, sleepRes, moodRes, sessionsRes, timelineRes, achRes, projectsRes, challengesRes]) => {
      const stats = statsRes.data as any
      const log = logRes.data as any
      const habits = habitsRes.data as any[]
      const water = waterRes.data as any
      const sleepLogs = sleepRes.data as any[]
      const mood = moodRes.data as any
      const sessions = sessionsRes.data as any[]
      const timeline = timelineRes.data as any[]
      const ach = achRes.data as any
      const projects = projectsRes.data as any[]
      const challenges = challengesRes.data as any[]

      const completedHabits = habits.filter(h => h.completedToday).length
      const todayTasks = log?.tasks || []
      const todayFocusMins = sessions.filter(s => s.date === today).reduce((sum: number, s: any) => sum + s.duration_minutes, 0)
      const recentSleep = sleepLogs[0]
      const totalXp = ach.totalXp || 0
      const level = Math.floor(totalXp / 500) + 1

      const catMins: Record<string, number> = { health: 0, mind: 0, work: 0, social: 0, growth: 0 }
      todayTasks.filter((t: any) => t.completed).forEach((t: any) => {
        if (catMins[t.category] !== undefined) catMins[t.category] += t.duration_minutes
      })

      setData({
        score: log?.score || 0,
        streak: stats?.currentStreak || 0,
        level,
        habitsCompleted: completedHabits,
        habitsTotal: habits.length,
        waterGlasses: water.glasses,
        waterGoal: water.goal,
        sleepHours: recentSleep ? Math.round(recentSleep.duration_minutes / 60 * 10) / 10 : 0,
        sleepQuality: recentSleep?.quality || 0,
        moodRating: mood?.mood || 0,
        tasksCompleted: todayTasks.filter((t: any) => t.completed).length,
        tasksTotal: todayTasks.length,
        focusMinutes: todayFocusMins,
        categoryMins: catMins,
        weekScores: timeline.slice().reverse(),
        activeChallenges: challenges.filter((c: any) => c.status === 'active').length,
        activeProjects: projects.length,
        xp: totalXp,
      })
    }).finally(() => setLoading(false))
  }, [today])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}</div>
      <div className="h-40 bg-slate-800 rounded-xl" />
    </div>
  )

  const maxCatMins = Math.max(...Object.values(data.categoryMins || {}), 30)
  const overallScore = data.score || 0
  const scoreColor = overallScore >= 70 ? '#22c55e' : overallScore >= 40 ? '#eab308' : '#ef4444'

  const weekAvg = data.weekScores && data.weekScores.length > 0
    ? Math.round(data.weekScores.reduce((s, d) => s + d.score, 0) / data.weekScores.length)
    : 0

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-violet-400" />
            Life OS
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: scoreColor, fontFamily: 'Orbitron, monospace' }}>
            {overallScore}
          </div>
          <div className="text-xs text-slate-500">Today's score</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${overallScore}%`, background: `linear-gradient(to right, #8b5cf6, ${scoreColor})` }} />
      </div>

      {/* Top metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile label="Level" value={`LVL ${data.level}`} sub={`${data.xp?.toLocaleString()} XP`}
          icon={Trophy} color="#eab308" route="/xp-log" />
        <MetricTile label="Streak" value={`${data.streak}d`} sub="consecutive days"
          icon={Flame} color="#f97316" route="/streaks" pulse={(data.streak || 0) > 0} />
        <MetricTile label="Habits" value={`${data.habitsCompleted}/${data.habitsTotal}`} sub="today"
          icon={Activity} color="#22c55e" route="/habits" pulse={data.habitsCompleted === data.habitsTotal && (data.habitsTotal || 0) > 0} />
        <MetricTile label="Focus" value={data.focusMinutes ? `${data.focusMinutes}m` : '—'} sub="today"
          icon={Clock} color="#8b5cf6" route="/focus-stats" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile label="Sleep" value={data.sleepHours ? `${data.sleepHours}h` : '—'} sub={data.sleepQuality ? `Quality ${data.sleepQuality}/5` : 'not logged'}
          icon={Moon} color="#a78bfa" route="/sleep" />
        <MetricTile label="Water" value={`${data.waterGlasses}/${data.waterGoal}`} sub="glasses"
          icon={Droplets} color="#38bdf8" route="/water" />
        <MetricTile label="Tasks" value={`${data.tasksCompleted}/${data.tasksTotal}`} sub="done today"
          icon={Target} color="#06b6d4" route="/taskboard" />
        <MetricTile label="Week avg" value={weekAvg} sub="7-day score"
          icon={TrendingUp} color="#ec4899" route="/timeline" />
      </div>

      {/* Today's category breakdown */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Today by Category</h3>
        <div className="space-y-2.5">
          {AREA_CONFIG.map(area => (
            <AreaBar key={area.id} id={area.id} label={area.label}
              icon={area.icon} color={area.color}
              minutes={data.categoryMins?.[area.id] || 0}
              maxMinutes={maxCatMins} />
          ))}
        </div>
      </div>

      {/* Week chart */}
      {(data.weekScores?.length || 0) > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">This Week</h3>
          <div className="flex items-end gap-2 h-16">
            {data.weekScores!.map(d => {
              const barH = Math.max(4, (d.score / 100) * 56)
              const isToday = d.date === today
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm transition-all duration-500 relative"
                    style={{
                      height: `${barH}px`,
                      background: isToday ? 'linear-gradient(to top, #8b5cf6, #a78bfa)' :
                        d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#eab308' : '#334155'
                    }}>
                    {isToday && (
                      <div className="absolute -top-4 left-0 right-0 text-center text-xs text-violet-400 font-bold">{d.score}</div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-600">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Log Tasks', emoji: '📋', route: '/log' },
            { label: 'Focus Timer', emoji: '⏱️', route: '/timer' },
            { label: 'Check In', emoji: '✨', route: '/checkin' },
            { label: 'AI Coach', emoji: '🤖', route: '/ai-coach' },
            { label: 'Journal', emoji: '📖', route: '/journal' },
            { label: 'Habits', emoji: '🔄', route: '/habits' },
            ...(data.activeChallenges ? [{ label: `${data.activeChallenges} Challenges`, emoji: '⚔️', route: '/habit-challenges' }] : []),
            ...(data.activeProjects ? [{ label: `${data.activeProjects} Projects`, emoji: '📁', route: '/projects' }] : []),
          ].slice(0, 6).map(({ label, emoji, route }) => (
            <Link key={route} to={route}
              className="game-card p-3 flex items-center gap-2 hover:border-violet-500/40 hover:bg-violet-900/10 transition-all group">
              <span className="text-xl">{emoji}</span>
              <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-200">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
