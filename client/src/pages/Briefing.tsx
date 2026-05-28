import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Sun, RefreshCw, CheckCircle2, Circle, Droplets, Moon, Flame, Target, Flag } from 'lucide-react'

interface BriefingData {
  date: string
  streak: number
  intentions: Array<{ id: number; text: string; completed: number }>
  mood: { mood: number; emoji: string; label: string } | null
  habits: Array<{ id: number; title: string; emoji: string; completedToday: boolean }>
  upcomingGoals: Array<{ id: number; title: string; category: string; target_date: string }>
  todayScore: number | null
  yesterdayScore: number | null
  weeklyGoals: Array<{ id: number; text: string; completed: number; category: string }>
  sleep: { bedtime: string; wake_time: string; duration_minutes: number; quality: number } | null
  water: { glasses: number; goal: number }
  quote: { text: string; author: string }
  habitsTotal: number
  habitsDone: number
}

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄']

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Briefing() {
  const [data, setData] = useState<BriefingData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get<BriefingData>('/api/briefing')
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  if (!data) return <div className="text-center py-12 text-slate-500">Failed to load briefing</div>

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-8 h-8 text-yellow-400" />
            Daily Briefing
          </h1>
          <p className="text-slate-400 mt-1">{today}</p>
        </div>
        <button onClick={load} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quote of the day */}
      <div className="game-card p-5 border border-yellow-500/20 bg-yellow-900/5">
        <div className="text-slate-300 italic text-sm leading-relaxed">"{data.quote.text}"</div>
        <div className="text-yellow-400 text-xs font-semibold mt-2">— {data.quote.author}</div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>{data.streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {data.todayScore !== null ? data.todayScore : '—'}
          </div>
          <div className="text-xs text-slate-500">Today's Score</div>
          {data.yesterdayScore !== null && (
            <div className={`text-xs mt-0.5 ${data.todayScore !== null && data.todayScore >= data.yesterdayScore ? 'text-green-400' : 'text-slate-600'}`}>
              vs {data.yesterdayScore} yesterday
            </div>
          )}
        </div>
        <div className="game-card p-3 text-center">
          {data.mood ? (
            <>
              <div className="text-xl mb-0.5">{data.mood.emoji}</div>
              <div className="text-xs text-slate-400">{data.mood.label}</div>
            </>
          ) : (
            <>
              <div className="text-xl mb-0.5 opacity-30">😶</div>
              <Link to="/mood" className="text-xs text-violet-400 hover:underline">Log mood</Link>
            </>
          )}
        </div>
      </div>

      {/* Sleep + Water */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-300">Last Night</span>
          </div>
          {data.sleep && data.sleep.duration_minutes > 0 ? (
            <>
              <div className="text-lg font-bold text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {fmtDuration(data.sleep.duration_minutes)}
              </div>
              <div className={`text-xs mt-0.5 ${data.sleep.duration_minutes >= 7 * 60 ? 'text-green-400' : 'text-orange-400'}`}>
                {data.sleep.duration_minutes >= 8 * 60 ? 'Optimal' : data.sleep.duration_minutes >= 7 * 60 ? 'Good' : 'Short'}
              </div>
            </>
          ) : (
            <Link to="/sleep" className="text-xs text-indigo-400 hover:underline">Log sleep →</Link>
          )}
        </div>
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-300">Hydration</span>
          </div>
          <div className="text-lg font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {data.water.glasses}/{data.water.goal}
          </div>
          <div className="text-xs mt-0.5 text-slate-500">glasses today</div>
        </div>
      </div>

      {/* Intentions */}
      {data.intentions.length > 0 ? (
        <div className="game-card p-5 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              Today's Intentions
            </h3>
            <Link to="/intentions" className="text-xs text-yellow-500 hover:text-yellow-400">Edit →</Link>
          </div>
          <div className="space-y-2">
            {data.intentions.map((i, idx) => (
              <div key={i.id} className={`flex items-center gap-2 ${i.completed ? 'opacity-50' : ''}`}>
                {i.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                }
                <span className={`text-sm ${i.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {idx + 1}. {i.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Link to="/intentions" className="game-card p-4 flex items-center gap-3 border border-dashed border-slate-600 hover:border-yellow-500/40 transition-colors block">
          <Target className="w-5 h-5 text-yellow-400 opacity-60" />
          <span className="text-sm text-slate-500 hover:text-slate-300">Set today's intentions →</span>
        </Link>
      )}

      {/* Habits */}
      {data.habits.length > 0 && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-violet-400" />
              Habits
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-violet-400">{data.habitsDone}/{data.habitsTotal}</span>
              <Link to="/habits" className="text-xs text-violet-400 hover:text-violet-300">Manage →</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {data.habits.map(h => (
              <div
                key={h.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm ${
                  h.completedToday ? 'bg-green-900/20 text-green-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {h.completedToday
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  : <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                }
                <span className="text-xs flex-shrink-0">{h.emoji}</span>
                <span className={`text-xs truncate ${h.completedToday ? 'line-through opacity-60' : ''}`}>{h.title}</span>
              </div>
            ))}
          </div>
          {data.habitsDone === data.habitsTotal && data.habitsTotal > 0 && (
            <div className="text-center text-green-400 text-xs font-semibold mt-2">🏆 All habits complete!</div>
          )}
        </div>
      )}

      {/* Weekly Big 3 */}
      {data.weeklyGoals.length > 0 && (
        <div className="game-card p-5 border border-violet-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Flag className="w-4 h-4 text-violet-400" />
              This Week's Big 3
            </h3>
            <Link to="/weekly-goals" className="text-xs text-violet-400 hover:text-violet-300">View →</Link>
          </div>
          <div className="space-y-2">
            {data.weeklyGoals.map((g, idx) => (
              <div key={g.id} className={`flex items-center gap-2 ${g.completed ? 'opacity-50' : ''}`}>
                {g.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0 text-center text-xs leading-4 text-slate-600">{idx + 1}</div>
                }
                <span className={`text-sm ${g.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{g.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming goal deadlines */}
      {data.upcomingGoals.length > 0 && (
        <div className="game-card p-5 border border-orange-500/20">
          <h3 className="font-semibold text-slate-200 mb-3">⏰ Deadlines This Week</h3>
          <div className="space-y-2">
            {data.upcomingGoals.map(g => {
              const daysLeft = Math.ceil((new Date(g.target_date).getTime() - Date.now()) / 86400000)
              return (
                <div key={g.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{g.title}</span>
                  <span className={`text-xs font-bold ${daysLeft <= 0 ? 'text-red-400' : daysLeft <= 2 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {daysLeft <= 0 ? 'Overdue!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                  </span>
                </div>
              )
            })}
          </div>
          <Link to="/goals" className="text-xs text-orange-400 hover:underline mt-2 block">View all goals →</Link>
        </div>
      )}

      {/* Quick action links */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { to: '/log', emoji: '📝', label: 'Log Tasks' },
          { to: '/breathing', emoji: '🌬️', label: 'Breathe' },
          { to: '/journal', emoji: '📖', label: 'Journal' },
        ].map(({ to, emoji, label }) => (
          <Link
            key={to}
            to={to}
            className="game-card p-3 text-center hover:border-violet-500/40 transition-colors"
          >
            <div className="text-xl mb-1">{emoji}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
