import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, Edit3, Check, X, TrendingUp, Heart, Brain, Briefcase, Users, Rocket } from 'lucide-react'

interface GoalEntry {
  category: string
  weekly_minutes: number
  actual_minutes: number
  pct: number
  surplus: number
}

interface GoalsResponse {
  weekStart: string
  weekEnd: string
  goals: GoalEntry[]
}

const CAT_CONFIG: Record<string, { color: string; bar: string; icon: React.ReactNode; emoji: string }> = {
  health: { color: 'text-green-400', bar: 'bg-green-500',   icon: <Heart className="w-4 h-4" />,    emoji: '❤️' },
  mind:   { color: 'text-cyan-400',  bar: 'bg-cyan-500',    icon: <Brain className="w-4 h-4" />,    emoji: '🧠' },
  work:   { color: 'text-violet-400',bar: 'bg-violet-500',  icon: <Briefcase className="w-4 h-4" />,emoji: '💼' },
  social: { color: 'text-yellow-400',bar: 'bg-yellow-500',  icon: <Users className="w-4 h-4" />,    emoji: '👥' },
  growth: { color: 'text-orange-400',bar: 'bg-orange-500',  icon: <Rocket className="w-4 h-4" />,   emoji: '🚀' },
}

function fmt(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function CategoryGoals() {
  const [data, setData] = useState<GoalsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    axios.get<GoalsResponse>('/api/category-goals/progress')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const startEdit = (cat: string, currentMins: number) => {
    setEditing(cat)
    setEditVal(String(currentMins))
  }

  const saveGoal = async (cat: string) => {
    const mins = parseInt(editVal)
    if (!mins || mins < 0) return
    setSaving(true)
    try {
      await axios.put(`/api/category-goals/${cat}`, { weekly_minutes: mins })
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  const totalGoal = data?.goals.reduce((s, g) => s + g.weekly_minutes, 0) ?? 0
  const totalActual = data?.goals.reduce((s, g) => s + g.actual_minutes, 0) ?? 0
  const overallPct = totalGoal > 0 ? Math.min(100, Math.round((totalActual / totalGoal) * 100)) : 0
  const goalsHit = data?.goals.filter(g => g.pct >= 100).length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Target className="w-8 h-8 text-violet-400" />
          Weekly Time Goals
        </h1>
        <p className="text-slate-400 mt-1">Set weekly minute targets per life category</p>
        {data && (
          <p className="text-xs text-slate-600 mt-1">
            Week: {data.weekStart} → {data.weekEnd}
          </p>
        )}
      </div>

      {/* Overall progress */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-slate-200">Overall Weekly Progress</div>
            <div className="text-xs text-slate-500">{fmt(totalActual)} of {fmt(totalGoal)} goal</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {overallPct}%
            </div>
            <div className="text-xs text-slate-500">{goalsHit}/5 goals hit</div>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${overallPct >= 100 ? 'bg-green-500' : 'bg-violet-500'}`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
        {overallPct >= 100 && (
          <div className="text-center text-green-400 text-sm font-semibold mt-2">
            🌟 Weekly goals crushed!
          </div>
        )}
      </div>

      {/* Per-category goals */}
      <div className="space-y-3">
        {data?.goals.map(goal => {
          const cfg = CAT_CONFIG[goal.category] ?? CAT_CONFIG.health
          const isEditing = editing === goal.category
          const over = goal.pct >= 100
          const daysLeft = (() => {
            const today = new Date()
            const dow = today.getDay()
            return dow === 0 ? 0 : 7 - dow
          })()
          const pace = daysLeft > 0 ? Math.ceil((goal.weekly_minutes - goal.actual_minutes) / daysLeft) : 0

          return (
            <div key={goal.category} className="game-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{cfg.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold capitalize ${cfg.color}`}>{goal.category}</span>
                    {over && <span className="text-xs bg-green-800/40 text-green-400 px-2 py-0.5 rounded-full">✓ Done</span>}
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveGoal(goal.category)}
                        className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                        placeholder="minutes"
                        min={0}
                        max={1440}
                        autoFocus
                      />
                      <span className="text-xs text-slate-500">min/week</span>
                      <button onClick={() => saveGoal(goal.category)} disabled={saving}
                        className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditing(null)}
                        className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">Goal: {fmt(goal.weekly_minutes)}/week</span>
                      <button onClick={() => startEdit(goal.category, goal.weekly_minutes)}
                        className="text-slate-600 hover:text-slate-400 transition-colors">
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${over ? 'text-green-400' : cfg.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {goal.pct}%
                  </div>
                  <div className="text-xs text-slate-500">{fmt(goal.actual_minutes)} logged</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-green-500' : cfg.bar}`}
                  style={{ width: `${goal.pct}%` }}
                />
              </div>

              {/* Pacing info */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{fmt(goal.actual_minutes)} / {fmt(goal.weekly_minutes)}</span>
                {!over && goal.actual_minutes < goal.weekly_minutes && daysLeft > 0 && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Need {fmt(pace)}/day for {daysLeft} more day{daysLeft > 1 ? 's' : ''}
                  </span>
                )}
                {over && goal.surplus > 0 && (
                  <span className="text-green-600">+{fmt(goal.surplus)} bonus</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tips */}
      <div className="game-card p-4 border border-violet-500/20">
        <h3 className="text-sm font-semibold text-violet-400 mb-2">💡 How Category Goals Work</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• Goals reset every Monday — plan your week around them</li>
          <li>• Time logged via Log Tasks automatically counts toward your goals</li>
          <li>• Click ✏️ to edit any goal's weekly minute target</li>
          <li>• The "pace needed" tells you how much daily time to hit your goal</li>
        </ul>
      </div>
    </div>
  )
}
