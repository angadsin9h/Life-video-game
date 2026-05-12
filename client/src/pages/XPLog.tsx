import { useEffect, useState } from 'react'
import axios from 'axios'
import { Swords, Zap, Trophy, Star, TrendingUp, Calendar } from 'lucide-react'

interface DailyLog {
  date: string
  score: number
  xp_earned: number
  tasks: Task[]
}

interface Task {
  category: string
  task_name: string
  duration_minutes: number
  completed: number
}

interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  earned_at: string
}

const CAT_XP: Record<string, number> = { health: 20, mind: 15, work: 20, social: 10, growth: 15 }
const CAT_COLORS: Record<string, string> = {
  health: 'text-green-400', mind: 'text-cyan-400', work: 'text-violet-400',
  social: 'text-yellow-400', growth: 'text-orange-400',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }

function getXP(task: Task): number {
  const base = CAT_XP[task.category] || 10
  if (task.duration_minutes >= 60) return base * 1.5
  if (task.duration_minutes >= 30) return base
  return base * 0.5
}

const XP_PER_DAY = 100

export default function XPLog() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'log' | 'achievements'>('log')

  useEffect(() => {
    Promise.all([
      axios.get('/api/logs').catch(() => ({ data: [] })),
      axios.get('/api/achievements').catch(() => ({ data: { achievements: [] } })),
      axios.get('/api/stats').catch(() => ({ data: null })),
    ]).then(([logsRes, achRes, statsRes]) => {
      const rawLogs = (logsRes.data as any[]).slice(0, 30)
      setLogs(rawLogs)
      setAchievements((achRes.data as any).achievements || [])
      setStats(statsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const totalXP = logs.reduce((s, l) => s + (l.xp_earned || 0), 0)
  const level = Math.floor(totalXP / XP_PER_DAY) + 1
  const xpInLevel = totalXP % XP_PER_DAY
  const earnedAchievements = achievements.filter(a => a.earned_at)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Swords className="w-7 h-7 text-yellow-400" />
          XP Combat Log
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Your XP history and achievement unlocks</p>
      </div>

      {/* Level card */}
      <div className="game-card p-5 border border-yellow-500/20 bg-yellow-900/5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {level}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-100">Level {level}</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-xs text-slate-500 mb-1.5">{xpInLevel}/{XP_PER_DAY} XP to next level</div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all"
                style={{ width: `${(xpInLevel / XP_PER_DAY) * 100}%` }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{totalXP.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total XP</div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => setView('log')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === 'log' ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
          }`}>
          XP Log
        </button>
        <button onClick={() => setView('achievements')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === 'achievements' ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
          }`}>
          Achievements ({earnedAchievements.length})
        </button>
      </div>

      {view === 'log' && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No XP earned yet</p>
              <p className="text-xs mt-1">Complete tasks to earn XP</p>
            </div>
          ) : logs.map(log => {
            const completedTasks = log.tasks.filter(t => t.completed)
            const dayXP = log.xp_earned || completedTasks.reduce((s, t) => s + getXP(t), 0)
            const date = new Date(log.date + 'T12:00:00')
            const today = new Date().toISOString().split('T')[0]
            const isToday = log.date === today
            return (
              <div key={log.date} className={`game-card p-4 ${isToday ? 'border-yellow-500/30 bg-yellow-900/5' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-300">
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {log.score > 0 && (
                      <span className="text-xs text-slate-600">· Score {log.score}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                    <Zap className="w-4 h-4" />
                    +{Math.round(dayXP)} XP
                  </div>
                </div>
                {completedTasks.length > 0 && (
                  <div className="space-y-1">
                    {completedTasks.slice(0, 4).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span>{CAT_ICONS[t.category] || '📌'}</span>
                        <span className="text-slate-400 flex-1 truncate">{t.task_name}</span>
                        <span className="text-slate-600">{t.duration_minutes}m</span>
                        <span className={`font-semibold ${CAT_COLORS[t.category] || 'text-slate-400'}`}>
                          +{Math.round(getXP(t))} XP
                        </span>
                      </div>
                    ))}
                    {completedTasks.length > 4 && (
                      <div className="text-xs text-slate-600">+{completedTasks.length - 4} more tasks</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {earnedAchievements.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-slate-600">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No achievements yet</p>
              <p className="text-xs mt-1">Complete tasks to unlock achievements</p>
            </div>
          ) : earnedAchievements.map(a => (
            <div key={a.id} className="game-card p-3 border border-yellow-500/20 bg-yellow-900/5">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{a.icon || '🏆'}</div>
                <div>
                  <div className="font-semibold text-yellow-400 text-sm">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.description}</div>
                  {a.earned_at && (
                    <div className="text-xs text-slate-700 mt-1">
                      {new Date(a.earned_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
