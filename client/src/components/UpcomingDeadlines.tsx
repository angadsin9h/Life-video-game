import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { AlertCircle, Clock } from 'lucide-react'

interface Goal {
  id: number
  title: string
  category: string
  target_date: string
  completed: number
}

function getDaysLeft(targetDate: string): number {
  const today = new Date().toISOString().split('T')[0]
  return Math.ceil((new Date(targetDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
}

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }

export default function UpcomingDeadlines() {
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    axios.get<Goal[]>('/api/goals')
      .then(r => {
        const upcoming = r.data
          .filter(g => !g.completed && g.target_date && getDaysLeft(g.target_date) <= 14 && getDaysLeft(g.target_date) >= 0)
          .sort((a, b) => getDaysLeft(a.target_date!) - getDaysLeft(b.target_date!))
          .slice(0, 4)
        setGoals(upcoming)
      })
      .catch(() => {})
  }, [])

  if (goals.length === 0) return null

  return (
    <div className="game-card p-4 border border-orange-500/20 bg-orange-500/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Upcoming Deadlines</h3>
        </div>
        <Link to="/goals" className="text-xs text-orange-400 hover:text-orange-300">View all →</Link>
      </div>
      <div className="space-y-2">
        {goals.map(goal => {
          const days = getDaysLeft(goal.target_date)
          const urgent = days <= 3
          return (
            <div key={goal.id} className="flex items-center gap-3">
              <span className="text-sm">{CAT_ICONS[goal.category]}</span>
              <span className="flex-1 text-sm text-slate-200 truncate">{goal.title}</span>
              <div className={`flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${urgent ? 'text-red-400' : 'text-orange-400'}`}>
                {urgent && <AlertCircle className="w-3 h-3" />}
                {days === 0 ? 'Today!' : `${days}d`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
