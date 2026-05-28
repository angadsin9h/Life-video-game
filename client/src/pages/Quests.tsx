import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Scroll, CheckCircle2, Circle, Zap, Calendar, TrendingUp } from 'lucide-react'

interface Quest {
  id: number
  quest_id: string
  title: string
  description: string
  category: string
  target_minutes: number
  bonus_xp: number
  completed: number
  completed_at: string | null
  date: string
}

interface HistoryRow {
  date: string
  total: number
  done: number
}

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_COLORS: Record<string, string> = {
  health: 'border-green-500/40 bg-green-500/10 text-green-400',
  mind: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  work: 'border-violet-500/40 bg-violet-500/10 text-violet-400',
  social: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  growth: 'border-red-500/40 bg-red-500/10 text-red-400',
}

function getGreeting(completedToday: number, total: number) {
  if (completedToday === total && total > 0) return { text: '🎉 All quests complete! Amazing work!', color: 'text-green-400' }
  if (completedToday > 0) return { text: `⚡ ${completedToday}/${total} quests done — keep pushing!`, color: 'text-yellow-400' }
  return { text: '🗺️ Your quests await. Start logging to complete them!', color: 'text-slate-400' }
}

export default function Quests() {
  const [todayQuests, setTodayQuests] = useState<Quest[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get<Quest[]>('/api/quests/today'),
      axios.get<HistoryRow[]>('/api/quests/history'),
    ]).then(([tRes, hRes]) => {
      setTodayQuests(tRes.data)
      setHistory(hRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  const completedToday = todayQuests.filter(q => q.completed).length
  const totalXpAvailable = todayQuests.reduce((s, q) => s + q.bonus_xp, 0)
  const earnedXp = todayQuests.filter(q => q.completed).reduce((s, q) => s + q.bonus_xp, 0)
  const greeting = getGreeting(completedToday, todayQuests.length)

  const totalHistoryDone = history.reduce((s, r) => s + r.done, 0)
  const totalHistoryAll = history.reduce((s, r) => s + r.total, 0)
  const completionRate = totalHistoryAll > 0 ? Math.round((totalHistoryDone / totalHistoryAll) * 100) : 0
  const perfectDays = history.filter(r => r.done === r.total && r.total > 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Scroll className="w-8 h-8 text-yellow-400" />
          Daily Quests
        </h1>
        <p className="text-slate-400 mt-1">3 unique quests generated each day — refresh every midnight</p>
      </div>

      {/* Status banner */}
      <div className="game-card p-4 flex items-center justify-between">
        <div className={`font-semibold ${greeting.color}`}>{greeting.text}</div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Quest XP</div>
          <div className="text-sm font-bold text-yellow-400">{earnedXp}/{totalXpAvailable} XP</div>
        </div>
      </div>

      {/* Today's quests */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today's Quests
        </h2>
        {todayQuests.map(quest => (
          <div
            key={quest.id}
            className={`game-card p-4 border transition-all ${
              quest.completed
                ? 'border-green-500/30 bg-green-500/5'
                : `border-slate-700 hover:border-slate-600`
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`mt-0.5 flex-shrink-0 ${quest.completed ? 'text-green-400' : 'text-slate-500'}`}>
                {quest.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold ${quest.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                    {quest.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${CAT_COLORS[quest.category] ?? 'text-slate-400 border-slate-600'}`}>
                    {CAT_ICONS[quest.category]} {quest.category}
                  </span>
                </div>
                <p className={`text-sm mt-0.5 ${quest.completed ? 'text-slate-600' : 'text-slate-400'}`}>
                  {quest.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>⏱ {quest.target_minutes}+ min</span>
                  <span className="text-yellow-500 font-semibold">+{quest.bonus_xp} XP</span>
                  {quest.completed && quest.completed_at && (
                    <span className="text-green-500">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {todayQuests.length === 0 && (
          <div className="game-card p-8 text-center text-slate-500">
            <Scroll className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No quests loaded yet.</p>
          </div>
        )}
      </div>

      {/* How quests work */}
      <div className="game-card p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">How quests work</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• 3 quests are generated daily — same quests appear if you reload</li>
          <li>• Complete them by <Link to="/log" className="text-violet-400 hover:underline">logging activities</Link> in the matching category</li>
          <li>• Quests auto-complete when you hit the target minutes</li>
          <li>• Quest XP is counted in your total XP and level</li>
        </ul>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <div className="flex justify-center mb-1"><Zap className="w-5 h-5 text-yellow-400" /></div>
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalHistoryDone}
          </div>
          <div className="text-xs text-slate-500 mt-1">Quests Completed</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="flex justify-center mb-1"><TrendingUp className="w-5 h-5 text-green-400" /></div>
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {completionRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Completion Rate</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="flex justify-center mb-1"><CheckCircle2 className="w-5 h-5 text-violet-400" /></div>
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {perfectDays}
          </div>
          <div className="text-xs text-slate-500 mt-1">Perfect Days</div>
        </div>
      </div>

      {/* Quest history */}
      {history.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Quest History
          </h3>
          <div className="space-y-2">
            {history.slice(0, 14).map(row => (
              <div key={row.date} className="flex items-center gap-3">
                <div className="text-xs text-slate-500 w-24 flex-shrink-0">{row.date}</div>
                <div className="flex-1 stat-bar h-2">
                  <div
                    className={`stat-bar-fill transition-all ${row.done === row.total && row.total > 0 ? 'bar-health' : 'bar-work'}`}
                    style={{ width: `${row.total > 0 ? (row.done / row.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 w-8 text-right flex-shrink-0">
                  {row.done}/{row.total}
                </div>
                {row.done === row.total && row.total > 0 && (
                  <span className="text-xs text-green-400">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
