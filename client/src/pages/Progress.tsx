import { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, Award, Flame, Clock } from 'lucide-react'
import ProgressChart from '../components/ProgressChart'

interface Stats {
  last30Days: Array<{ date: string; score: number }>
  weeklyAvg: number
  monthlyAvg: number
  categoryAvgMinutes: Record<string, number>
  currentStreak: number
  bestStreak: number
  totalHours: number
  bestDay: { date: string; score: number } | null
}

export default function Progress() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get<Stats>('/api/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-6 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-64 bg-slate-800 rounded-xl" />)}</div>

  const lineData = (stats?.last30Days ?? []).slice().reverse().map(d => ({
    date: d.date.slice(5),
    score: d.score,
  }))

  const catMins = stats?.categoryAvgMinutes ?? {}
  const pieData = [
    { name: 'Health', value: catMins.health || 0 },
    { name: 'Mind', value: catMins.mind || 0 },
    { name: 'Work', value: catMins.work || 0 },
    { name: 'Social', value: catMins.social || 0 },
    { name: 'Growth', value: catMins.growth || 0 },
  ].filter(d => d.value > 0)

  const barData = [{ name: 'Daily Avg', health: catMins.health || 0, mind: catMins.mind || 0, work: catMins.work || 0, social: catMins.social || 0, growth: catMins.growth || 0 }]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Progress</h1>
        <p className="text-slate-400 mt-1">Your journey at a glance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Weekly Avg', value: stats?.weeklyAvg ?? 0, icon: <TrendingUp className="w-5 h-5 text-violet-400" />, suffix: 'pts' },
          { label: 'Best Day', value: stats?.bestDay?.score ?? 0, icon: <Award className="w-5 h-5 text-yellow-400" />, suffix: 'pts' },
          { label: 'Best Streak', value: stats?.bestStreak ?? 0, icon: <Flame className="w-5 h-5 text-orange-400" />, suffix: 'days' },
          { label: 'Total Hours', value: stats?.totalHours ?? 0, icon: <Clock className="w-5 h-5 text-cyan-400" />, suffix: 'hrs' },
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="game-card p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Score Over Time (Last 30 Days)</h2>
        <ProgressChart type="line" data={lineData} dataKeys={['score']} colors={['#8b5cf6']} xKey="date" />
      </div>

      {/* Bar chart */}
      <div className="game-card p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Avg Daily Minutes by Category</h2>
        <ProgressChart type="bar" data={barData} dataKeys={['health','mind','work','social','growth']} colors={['#22c55e','#06b6d4','#8b5cf6','#f59e0b','#ef4444']} xKey="name" />
      </div>

      {/* Pie chart */}
      <div className="game-card p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Time Distribution by Category</h2>
        <ProgressChart type="pie" data={pieData} colors={['#22c55e','#06b6d4','#8b5cf6','#f59e0b','#ef4444']} />
      </div>
    </div>
  )
}
