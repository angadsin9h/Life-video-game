import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, ChevronDown, ChevronUp, Check, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TimeHorizon = '10year' | '5year' | '1year' | '90day' | '30day' | 'weekly'

interface Goal {
  id: string
  text: string
  horizon: TimeHorizon
  parentId: string | null
  completed: boolean
  completedAt: string
  notes: string
  createdAt: string
}

const HORIZONS: { key: TimeHorizon; label: string; emoji: string; color: string; desc: string }[] = [
  { key: '10year', label: '10-Year Vision', emoji: '🌟', color: '#a855f7', desc: 'Where you want to be in a decade' },
  { key: '5year', label: '5-Year Goals', emoji: '🎯', color: '#6366f1', desc: 'Major milestones in 5 years' },
  { key: '1year', label: '1-Year Goals', emoji: '📅', color: '#3b82f6', desc: 'What you will achieve this year' },
  { key: '90day', label: '90-Day Sprint', emoji: '🚀', color: '#22c55e', desc: 'Next 90 days focus areas' },
  { key: '30day', label: '30-Day Targets', emoji: '⚡', color: '#f59e0b', desc: 'This month\'s key outcomes' },
  { key: 'weekly', label: 'Weekly Big 3', emoji: '🔥', color: '#ef4444', desc: 'This week\'s most important goals' },
]

const STORAGE_KEY = 'goal_hierarchy'

export default function GoalHierarchy() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeHorizon, setActiveHorizon] = useState<TimeHorizon>('90day')
  const [collapsed, setCollapsed] = useState<Record<TimeHorizon, boolean>>({} as Record<TimeHorizon, boolean>)
  const [addingTo, setAddingTo] = useState<TimeHorizon | null>(null)
  const [newText, setNewText] = useState('')
  const [viewMode, setViewMode] = useState<'hierarchy' | 'focus'>('hierarchy')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setGoals(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: Goal[]) => {
    setGoals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addGoal = (horizon: TimeHorizon) => {
    if (!newText.trim()) return
    const goal: Goal = {
      id: Date.now().toString(),
      text: newText.trim(),
      horizon,
      parentId: null,
      completed: false,
      completedAt: '',
      notes: '',
      createdAt: new Date().toISOString(),
    }
    save([goal, ...goals])
    setNewText('')
    setAddingTo(null)
    toastSuccess('Goal added!')
  }

  const toggleComplete = (id: string) => {
    save(goals.map(g => g.id === id ? { ...g, completed: !g.completed, completedAt: !g.completed ? new Date().toISOString().split('T')[0] : '' } : g))
  }

  const del = (id: string) => save(goals.filter(g => g.id !== id))

  const getGoalsFor = (horizon: TimeHorizon) => goals.filter(g => g.horizon === horizon)
  const completionRate = (horizon: TimeHorizon) => {
    const hs = getGoalsFor(horizon)
    if (hs.length === 0) return 0
    return Math.round((hs.filter(g => g.completed).length / hs.length) * 100)
  }

  const activeHorizonData = HORIZONS.find(h => h.key === activeHorizon)!

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-green-400" />
            Goal Hierarchy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">From 10-year vision to this week's priorities</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode(v => v === 'hierarchy' ? 'focus' : 'hierarchy')}
            className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors">
            {viewMode === 'hierarchy' ? 'Focus View' : 'Full View'}
          </button>
        </div>
      </div>

      {/* Overview bar */}
      <div className="game-card p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {HORIZONS.map(h => {
            const rate = completionRate(h.key)
            const count = getGoalsFor(h.key).length
            return (
              <button key={h.key} onClick={() => setActiveHorizon(h.key)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${activeHorizon === h.key ? 'bg-slate-700' : 'hover:bg-slate-800'}`}>
                <span className="text-xl">{h.emoji}</span>
                <span className="text-xs text-slate-400 whitespace-nowrap">{h.label.split(' ')[0]}</span>
                {count > 0 && (
                  <div className="w-8 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${rate}%`, background: h.color }} />
                  </div>
                )}
                {count > 0 && <span className="text-[10px] text-slate-600">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {viewMode === 'hierarchy' && (
        <div className="space-y-3">
          {HORIZONS.map(h => {
            const horizonGoals = getGoalsFor(h.key)
            const rate = completionRate(h.key)
            const isCollapsed = collapsed[h.key]
            return (
              <div key={h.key} className="game-card overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{h.label}</div>
                    <div className="text-xs text-slate-500">{h.desc}</div>
                    {horizonGoals.length > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: h.color }} />
                        </div>
                        <span className="text-xs text-slate-500">{horizonGoals.filter(g => g.completed).length}/{horizonGoals.length}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setAddingTo(addingTo === h.key ? null : h.key)}
                      className="p-1.5 text-slate-500 hover:text-green-400 transition-colors"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => setCollapsed(c => ({ ...c, [h.key]: !c[h.key] }))} className="p-1 text-slate-600">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {addingTo === h.key && (
                  <div className="px-4 pb-3 flex gap-2 border-t border-slate-800">
                    <input value={newText} onChange={e => setNewText(e.target.value)}
                      placeholder={`Add ${h.label} goal...`} className="game-input flex-1 text-sm py-1.5"
                      autoFocus onKeyDown={e => { if (e.key === 'Enter') addGoal(h.key); if (e.key === 'Escape') setAddingTo(null) }} />
                    <button onClick={() => addGoal(h.key)} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs">Add</button>
                  </div>
                )}

                {!isCollapsed && horizonGoals.length > 0 && (
                  <div className="border-t border-slate-800">
                    {horizonGoals.map(goal => (
                      <div key={goal.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 last:border-0 ${goal.completed ? 'opacity-50' : ''}`}>
                        <button onClick={() => toggleComplete(goal.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${goal.completed ? 'border-transparent' : 'border-slate-600 hover:border-green-400'}`}
                          style={goal.completed ? { background: h.color + '30', borderColor: h.color } : {}}>
                          {goal.completed && <Check className="w-3 h-3" style={{ color: h.color }} />}
                        </button>
                        <div className={`flex-1 text-sm ${goal.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{goal.text}</div>
                        {goal.completedAt && <span className="text-xs text-slate-600">{goal.completedAt}</span>}
                        <button onClick={() => del(goal.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'focus' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {HORIZONS.map(h => (
              <button key={h.key} onClick={() => setActiveHorizon(h.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeHorizon === h.key ? 'text-white' : 'text-slate-500 bg-slate-800 hover:text-slate-300'}`}
                style={activeHorizon === h.key ? { background: h.color + '30', color: h.color, border: `1px solid ${h.color}50` } : {}}>
                {h.emoji} {h.label}
              </button>
            ))}
          </div>

          <div className="game-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{activeHorizonData.emoji}</span>
              <div>
                <div className="font-bold text-white">{activeHorizonData.label}</div>
                <div className="text-xs text-slate-400">{activeHorizonData.desc}</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <input value={newText} onChange={e => setNewText(e.target.value)}
                placeholder={`Add goal...`} className="game-input flex-1"
                onKeyDown={e => e.key === 'Enter' && addGoal(activeHorizon)} />
              <button onClick={() => addGoal(activeHorizon)}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: activeHorizonData.color }}>Add</button>
            </div>

            <div className="space-y-2">
              {getGoalsFor(activeHorizon).map(goal => (
                <div key={goal.id} className={`flex items-center gap-3 p-3 rounded-xl border ${goal.completed ? 'opacity-50 border-slate-800' : 'border-slate-700'}`}>
                  <button onClick={() => toggleComplete(goal.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${goal.completed ? 'border-transparent' : 'border-slate-600 hover:border-green-400'}`}
                    style={goal.completed ? { background: activeHorizonData.color + '30', borderColor: activeHorizonData.color } : {}}>
                    {goal.completed && <Check className="w-3.5 h-3.5" style={{ color: activeHorizonData.color }} />}
                  </button>
                  <span className={`flex-1 text-sm ${goal.completed ? 'line-through text-slate-500' : 'text-white'}`}>{goal.text}</span>
                  <button onClick={() => del(goal.id)} className="p-1 text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {getGoalsFor(activeHorizon).length === 0 && (
                <div className="text-center py-8 text-slate-600 text-sm">No goals set for this horizon yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
