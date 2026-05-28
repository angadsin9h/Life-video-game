import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, Zap, RefreshCw, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

interface InsightsData {
  weakestCat: string | null
  bestCat: string | null
  catAvgMinutes: Record<string, number>
  weeklyTrend: { last7Avg: number; prev7Avg: number; delta: number } | null
}

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_ACTIONS: Record<string, string[]> = {
  health: ['30min workout or walk', 'Meditate for 15min', 'Cook a healthy meal', 'Go to sleep on time'],
  mind:   ['Read for 30min', 'Learn something new', 'Practice a skill', 'Solve a challenge'],
  work:   ['Focus on your #1 priority', 'Clear your email inbox', 'Deep work session', 'Review your goals'],
  social: ['Reach out to a friend', 'Family time', 'Help someone', 'Schedule a catch-up'],
  growth: ['Reflect and journal', 'Learn a new skill', 'Try something uncomfortable', 'Read about your field'],
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export default function FocusRecommendation() {
  const [data, setData] = useState<InsightsData | null>(null)

  useEffect(() => {
    axios.get<InsightsData>('/api/insights')
      .then(r => setData(r.data))
      .catch(() => {})
  }, [])

  if (!data) return null

  const focusCat = data.weakestCat || 'work'
  const actions = CAT_ACTIONS[focusCat] || CAT_ACTIONS.work
  const suggestion = actions[getDayOfYear() % actions.length]
  const trendUp = (data.weeklyTrend?.delta ?? 0) > 5
  const trendDown = (data.weeklyTrend?.delta ?? 0) < -5

  return (
    <div className="game-card p-4 border border-cyan-500/20 bg-cyan-500/5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Today's Focus</h3>
      </div>

      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{CAT_ICONS[focusCat]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-200 capitalize">{focusCat}</div>
          <div className="text-xs text-slate-400 mt-0.5">{suggestion}</div>
          {data.catAvgMinutes && data.catAvgMinutes[focusCat] === 0 && (
            <div className="text-xs text-orange-400 mt-1">⚠️ You rarely log this category</div>
          )}
        </div>
        <Link to="/log" className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-600/30 transition-colors">
          <Zap className="w-3 h-3" /> Log
        </Link>
      </div>

      {(trendUp || trendDown) && (
        <div className={`mt-3 flex items-center gap-1.5 text-xs ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {trendUp
            ? `Up ${data.weeklyTrend!.delta} pts vs last week — keep going!`
            : `Down ${Math.abs(data.weeklyTrend!.delta)} pts vs last week — refocus today`}
        </div>
      )}
    </div>
  )
}
