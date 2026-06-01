import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, Save, CheckCircle, ChevronDown, ChevronUp, Calendar, BarChart3, Flag, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'personal_growth_plan'

interface GrowthAction {
  id: string
  description: string
  dueDate: string
  completed: boolean
  completedDate: string
}

interface GrowthGoal {
  id: string
  areaId: string
  title: string
  why: string
  successCriteria: string
  targetDate: string
  actions: GrowthAction[]
  progress: number
  status: 'active' | 'completed' | 'paused'
  reflections: string[]
}

interface GrowthArea {
  id: string
  name: string
  icon: string
  priority: 1 | 2 | 3
  currentLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  desiredLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  notes: string
}

interface StorageData {
  areas: GrowthArea[]
  goals: GrowthGoal[]
}

type Tab = 'areas' | 'goals' | 'progress'

const STATUS_COLORS: Record<GrowthGoal['status'], string> = {
  active: 'text-green-400 bg-green-900/20 border-green-500/30',
  completed: 'text-violet-400 bg-violet-900/20 border-violet-500/30',
  paused: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
}

const PRIORITY_COLORS: Record<1 | 2 | 3, string> = {
  1: 'text-red-400 bg-red-900/20 border-red-500/30',
  2: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  3: 'text-slate-400 bg-slate-800 border-slate-600',
}

function calcProgress(actions: GrowthAction[]): number {
  if (actions.length === 0) return 0
  return Math.round((actions.filter(a => a.completed).length / actions.length) * 100)
}

// SVG radar chart (octagon) — currentLevel vs desiredLevel for up to 8 areas
function RadarChart({ areas }: { areas: GrowthArea[] }) {
  const display = areas.slice(0, 8)
  const n = display.length
  if (n < 3) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Add at least 3 areas to see the radar chart.
      </div>
    )
  }

  const cx = 160
  const cy = 160
  const maxR = 120
  const minR = 10

  function polarXY(i: number, level: number): { x: number; y: number } {
    const angle = ((360 / n) * i - 90) * (Math.PI / 180)
    const r = minR + (level / 10) * (maxR - minR)
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  function labelXY(i: number): { x: number; y: number } {
    const angle = ((360 / n) * i - 90) * (Math.PI / 180)
    const r = maxR + 22
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const currentPoints = display.map((a, i) => polarXY(i, a.currentLevel))
  const desiredPoints = display.map((a, i) => polarXY(i, a.desiredLevel))

  const toStr = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Grid rings at 2, 4, 6, 8, 10
  const rings = [2, 4, 6, 8, 10]

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
      {/* Grid rings */}
      {rings.map(ring => {
        const pts = display.map((_, i) => polarXY(i, ring))
        return (
          <polygon
            key={ring}
            points={toStr(pts)}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
          />
        )
      })}

      {/* Spokes */}
      {display.map((_, i) => {
        const outer = polarXY(i, 10)
        return (
          <line key={i} x1={cx} y1={cy} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="#1e293b" strokeWidth="1" />
        )
      })}

      {/* Desired polygon (outlined) */}
      <polygon
        points={toStr(desiredPoints)}
        fill="#3b82f620"
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeDasharray="4 2"
      />

      {/* Current polygon (filled) */}
      <polygon
        points={toStr(currentPoints)}
        fill="#8b5cf640"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Labels */}
      {display.map((a, i) => {
        const lp = labelXY(i)
        const anchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle'
        return (
          <text
            key={a.id}
            x={lp.x.toFixed(1)}
            y={(lp.y + 4).toFixed(1)}
            textAnchor={anchor}
            fill="#94a3b8"
            fontSize="10"
            fontWeight="600"
          >
            {a.icon} {a.name.length > 8 ? a.name.slice(0, 8) + '…' : a.name}
          </text>
        )
      })}

      {/* Center label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">Growth</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#475569" fontSize="9">Current vs Goal</text>
    </svg>
  )
}

const emptyArea = (): Omit<GrowthArea, 'id'> => ({
  name: '', icon: '🎯', priority: 2, currentLevel: 5, desiredLevel: 8, notes: '',
})

const emptyGoal = (): Omit<GrowthGoal, 'id' | 'actions' | 'progress' | 'reflections'> => ({
  areaId: '', title: '', why: '', successCriteria: '', targetDate: '', status: 'active',
})

export default function PersonalGrowthPlan() {
  const { toastSuccess } = useToast()
  const [tab, setTab] = useState<Tab>('areas')
  const [areas, setAreas] = useState<GrowthArea[]>([])
  const [goals, setGoals] = useState<GrowthGoal[]>([])

  const [showAreaForm, setShowAreaForm] = useState(false)
  const [areaForm, setAreaForm] = useState(emptyArea())
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState(emptyGoal())

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
  const [newActionText, setNewActionText] = useState<Record<string, string>>({})
  const [newActionDue, setNewActionDue] = useState<Record<string, string>>({})
  const [newReflection, setNewReflection] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data: StorageData = JSON.parse(raw)
        setAreas(data.areas ?? [])
        setGoals(data.goals ?? [])
      }
    } catch { /**/ }
  }, [])

  const persist = (a: GrowthArea[], g: GrowthGoal[]) => {
    setAreas(a)
    setGoals(g)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ areas: a, goals: g }))
  }

  const setAreaField = <K extends keyof typeof areaForm>(key: K, val: (typeof areaForm)[K]) =>
    setAreaForm(f => ({ ...f, [key]: val }))

  const setGoalField = <K extends keyof typeof goalForm>(key: K, val: (typeof goalForm)[K]) =>
    setGoalForm(f => ({ ...f, [key]: val }))

  // --- Areas CRUD ---
  const saveArea = () => {
    if (!areaForm.name.trim()) return
    if (editingAreaId) {
      const updated = areas.map(a => a.id === editingAreaId ? { id: editingAreaId, ...areaForm } : a)
      persist(updated, goals)
      setEditingAreaId(null)
    } else {
      const newArea: GrowthArea = { id: Date.now().toString(), ...areaForm }
      persist([...areas, newArea], goals)
    }
    setAreaForm(emptyArea())
    setShowAreaForm(false)
    toastSuccess('Growth area saved!')
  }

  const startEditArea = (a: GrowthArea) => {
    setEditingAreaId(a.id)
    setAreaForm({ name: a.name, icon: a.icon, priority: a.priority, currentLevel: a.currentLevel, desiredLevel: a.desiredLevel, notes: a.notes })
    setShowAreaForm(true)
  }

  const deleteArea = (id: string) => {
    persist(areas.filter(a => a.id !== id), goals.filter(g => g.areaId !== id))
  }

  // --- Goals CRUD ---
  const saveGoal = () => {
    if (!goalForm.title.trim() || !goalForm.areaId) return
    const g: GrowthGoal = {
      id: Date.now().toString(),
      ...goalForm,
      actions: [],
      progress: 0,
      reflections: [],
    }
    persist(areas, [g, ...goals])
    setGoalForm(emptyGoal())
    setShowGoalForm(false)
    toastSuccess('Growth goal added!')
  }

  const deleteGoal = (id: string) => persist(areas, goals.filter(g => g.id !== id))

  const updateGoal = (updated: GrowthGoal) => {
    persist(areas, goals.map(g => g.id === updated.id ? updated : g))
  }

  const toggleAction = (goalId: string, actionId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const actions = goal.actions.map(a =>
      a.id === actionId
        ? { ...a, completed: !a.completed, completedDate: !a.completed ? new Date().toISOString().split('T')[0] : '' }
        : a
    )
    const progress = calcProgress(actions)
    updateGoal({ ...goal, actions, progress })
  }

  const addAction = (goalId: string) => {
    const text = (newActionText[goalId] ?? '').trim()
    if (!text) return
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const action: GrowthAction = {
      id: Date.now().toString(),
      description: text,
      dueDate: newActionDue[goalId] ?? '',
      completed: false,
      completedDate: '',
    }
    const actions = [...goal.actions, action]
    updateGoal({ ...goal, actions, progress: calcProgress(actions) })
    setNewActionText(m => ({ ...m, [goalId]: '' }))
    setNewActionDue(m => ({ ...m, [goalId]: '' }))
  }

  const deleteAction = (goalId: string, actionId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const actions = goal.actions.filter(a => a.id !== actionId)
    updateGoal({ ...goal, actions, progress: calcProgress(actions) })
  }

  const addReflection = (goalId: string) => {
    const text = (newReflection[goalId] ?? '').trim()
    if (!text) return
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    updateGoal({ ...goal, reflections: [...goal.reflections, text] })
    setNewReflection(m => ({ ...m, [goalId]: '' }))
    toastSuccess('Reflection added!')
  }

  const updateGoalStatus = (goalId: string, status: GrowthGoal['status']) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    updateGoal({ ...goal, status })
  }

  // --- Progress stats ---
  const totalGoals = goals.length
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const activeGoals = goals.filter(g => g.status === 'active').length
  const pausedGoals = goals.filter(g => g.status === 'paused').length

  // Recently completed actions (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentCompletedActions: { goalTitle: string; action: GrowthAction }[] = []
  goals.forEach(g => {
    g.actions
      .filter(a => a.completed && a.completedDate && new Date(a.completedDate) >= thirtyDaysAgo)
      .forEach(a => recentCompletedActions.push({ goalTitle: g.title, action: a }))
  })
  recentCompletedActions.sort((a, b) => b.action.completedDate.localeCompare(a.action.completedDate))

  // Most active area (by completed actions count)
  const areaActionCounts: Record<string, number> = {}
  goals.forEach(g => {
    const done = g.actions.filter(a => a.completed).length
    areaActionCounts[g.areaId] = (areaActionCounts[g.areaId] ?? 0) + done
  })
  const mostActiveAreaId = Object.entries(areaActionCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostActiveArea = areas.find(a => a.id === mostActiveAreaId)

  // Days since last action completed
  const allCompletedDates = goals
    .flatMap(g => g.actions.filter(a => a.completed && a.completedDate).map(a => a.completedDate))
    .sort((a, b) => b.localeCompare(a))
  const lastCompletedDate = allCompletedDates[0]
  const daysSinceLastAction = lastCompletedDate
    ? Math.floor((Date.now() - new Date(lastCompletedDate).getTime()) / 86400000)
    : null

  // Goals grouped by area
  const goalsByArea: Record<string, GrowthGoal[]> = {}
  goals.filter(g => g.status === 'active').forEach(g => {
    if (!goalsByArea[g.areaId]) goalsByArea[g.areaId] = []
    goalsByArea[g.areaId].push(g)
  })

  const TABS: { key: Tab; label: string }[] = [
    { key: 'areas', label: 'Areas' },
    { key: 'goals', label: 'Goals' },
    { key: 'progress', label: 'Progress' },
  ]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Target className="w-7 h-7 text-violet-400" />
          Personal Growth Plan
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Your personal development roadmap</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== AREAS TAB ===== */}
      {tab === 'areas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">{areas.length} area{areas.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => { setEditingAreaId(null); setAreaForm(emptyArea()); setShowAreaForm(s => !s) }}
              className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Area
            </button>
          </div>

          {showAreaForm && (
            <div className="game-card p-5 space-y-3 border border-violet-500/20">
              <h3 className="font-semibold text-slate-300">{editingAreaId ? 'Edit' : 'New'} Growth Area</h3>
              <div className="flex gap-3">
                <input
                  value={areaForm.icon}
                  onChange={e => setAreaField('icon', e.target.value)}
                  placeholder="Emoji"
                  className="game-input w-16 text-center text-xl"
                  maxLength={2}
                />
                <input
                  value={areaForm.name}
                  onChange={e => setAreaField('name', e.target.value)}
                  placeholder="Area name *"
                  className="game-input flex-1"
                  autoFocus
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Priority</p>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAreaField('priority', p)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${areaForm.priority === p ? PRIORITY_COLORS[p] : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                    >
                      {p === 1 ? '🔴 High' : p === 2 ? '🟡 Medium' : '🟢 Low'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Current Level: {areaForm.currentLevel}/10</p>
                  <input
                    type="range" min={1} max={10} value={areaForm.currentLevel}
                    onChange={e => setAreaField('currentLevel', Number(e.target.value) as GrowthArea['currentLevel'])}
                    className="w-full accent-violet-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Desired Level: {areaForm.desiredLevel}/10</p>
                  <input
                    type="range" min={1} max={10} value={areaForm.desiredLevel}
                    onChange={e => setAreaField('desiredLevel', Number(e.target.value) as GrowthArea['desiredLevel'])}
                    className="w-full accent-blue-400"
                  />
                </div>
              </div>
              <textarea
                value={areaForm.notes}
                onChange={e => setAreaField('notes', e.target.value)}
                placeholder="Notes (optional)..."
                className="game-input w-full h-16 resize-none text-sm"
              />
              <div className="flex gap-2">
                <button onClick={saveArea} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={() => { setShowAreaForm(false); setEditingAreaId(null) }} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          {areas.length === 0 && !showAreaForm && (
            <div className="text-center py-12 text-slate-500">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Define the areas of life you want to grow in.</p>
            </div>
          )}

          <div className="space-y-3">
            {areas.map(a => {
              const gap = a.desiredLevel - a.currentLevel
              return (
                <div key={a.id} className="game-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl">{a.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{a.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[a.priority]}`}>
                            P{a.priority}
                          </span>
                        </div>
                        {a.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{a.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEditArea(a)} className="p-1.5 text-slate-600 hover:text-violet-400 transition-colors text-xs">✏️</button>
                      <button onClick={() => deleteArea(a.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Level gap bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Current: {a.currentLevel}</span>
                      <span className={gap > 0 ? 'text-blue-400' : 'text-green-400'}>
                        {gap > 0 ? `Gap: ${gap} levels` : 'At goal!'} → Desired: {a.desiredLevel}
                      </span>
                    </div>
                    <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                      {/* Desired level background */}
                      <div
                        className="absolute top-0 left-0 h-full rounded-full bg-blue-900/40"
                        style={{ width: `${(a.desiredLevel / 10) * 100}%` }}
                      />
                      {/* Current level filled */}
                      <div
                        className="absolute top-0 left-0 h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${(a.currentLevel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== GOALS TAB ===== */}
      {tab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">{goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => { setGoalForm(emptyGoal()); setShowGoalForm(s => !s) }}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </div>

          {showGoalForm && (
            <div className="game-card p-5 space-y-3 border border-green-500/20">
              <h3 className="font-semibold text-slate-300">New Growth Goal</h3>
              <select
                value={goalForm.areaId}
                onChange={e => setGoalField('areaId', e.target.value)}
                className="game-input w-full"
              >
                <option value="">Select area *</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
              <input
                value={goalForm.title}
                onChange={e => setGoalField('title', e.target.value)}
                placeholder="Goal title *"
                className="game-input w-full"
                autoFocus
              />
              <textarea
                value={goalForm.why}
                onChange={e => setGoalField('why', e.target.value)}
                placeholder="Why does this matter to you?"
                className="game-input w-full h-16 resize-none text-sm"
              />
              <textarea
                value={goalForm.successCriteria}
                onChange={e => setGoalField('successCriteria', e.target.value)}
                placeholder="How will you know you've achieved it?"
                className="game-input w-full h-16 resize-none text-sm"
              />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={e => setGoalField('targetDate', e.target.value)}
                  className="game-input flex-1"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveGoal} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Save className="w-4 h-4" /> Save Goal
                </button>
                <button onClick={() => setShowGoalForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          {goals.length === 0 && !showGoalForm && (
            <div className="text-center py-12 text-slate-500">
              <Flag className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Set goals for your growth areas.</p>
            </div>
          )}

          {/* Active goals grouped by area */}
          {areas.map(area => {
            const areaGoals = goals.filter(g => g.areaId === area.id)
            if (areaGoals.length === 0) return null
            return (
              <div key={area.id} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">{area.icon}</span>
                  <span className="text-sm font-semibold text-slate-300">{area.name}</span>
                  <span className="text-xs text-slate-600">({areaGoals.length})</span>
                </div>
                {areaGoals.map(goal => {
                  const isExp = expandedGoalId === goal.id
                  const progress = calcProgress(goal.actions)
                  return (
                    <div key={goal.id} className="game-card overflow-hidden">
                      {/* Goal header */}
                      <div
                        className="p-4 cursor-pointer flex items-start gap-3"
                        onClick={() => setExpandedGoalId(isExp ? null : goal.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{goal.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[goal.status]}`}>
                              {goal.status}
                            </span>
                          </div>
                          {goal.targetDate && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <Calendar className="w-3 h-3" /> {goal.targetDate}
                            </div>
                          )}
                          {/* Progress bar */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 shrink-0">{progress}%</span>
                          </div>
                        </div>
                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />}
                      </div>

                      {/* Expanded */}
                      {isExp && (
                        <div className="border-t border-slate-800 p-4 space-y-4">
                          {/* Why + criteria */}
                          {goal.why && (
                            <div>
                              <p className="text-xs text-violet-400 font-semibold mb-0.5">Why this matters</p>
                              <p className="text-sm text-slate-300">{goal.why}</p>
                            </div>
                          )}
                          {goal.successCriteria && (
                            <div>
                              <p className="text-xs text-green-400 font-semibold mb-0.5">Success criteria</p>
                              <p className="text-sm text-slate-300">{goal.successCriteria}</p>
                            </div>
                          )}

                          {/* Status update */}
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">Status</p>
                            <div className="flex gap-2">
                              {(['active', 'completed', 'paused'] as const).map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateGoalStatus(goal.id, s)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize transition-all ${goal.status === s ? STATUS_COLORS[s] : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Actions checklist */}
                          <div>
                            <p className="text-xs text-slate-400 font-semibold mb-2">
                              Actions ({goal.actions.filter(a => a.completed).length}/{goal.actions.length} done)
                            </p>
                            <div className="space-y-1.5">
                              {goal.actions.map(action => (
                                <div key={action.id} className="flex items-center gap-2 group">
                                  <button
                                    onClick={() => toggleAction(goal.id, action.id)}
                                    className="shrink-0"
                                  >
                                    <CheckCircle className={`w-4 h-4 transition-colors ${action.completed ? 'text-green-400 fill-green-400/20' : 'text-slate-600 hover:text-green-400'}`} />
                                  </button>
                                  <span className={`text-sm flex-1 ${action.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                    {action.description}
                                  </span>
                                  {action.dueDate && (
                                    <span className="text-xs text-slate-600">{action.dueDate}</span>
                                  )}
                                  <button
                                    onClick={() => deleteAction(goal.id, action.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {/* Add new action */}
                            <div className="flex gap-2 mt-2">
                              <input
                                value={newActionText[goal.id] ?? ''}
                                onChange={e => setNewActionText(m => ({ ...m, [goal.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') addAction(goal.id) }}
                                placeholder="Add action..."
                                className="game-input flex-1 text-sm"
                              />
                              <input
                                type="date"
                                value={newActionDue[goal.id] ?? ''}
                                onChange={e => setNewActionDue(m => ({ ...m, [goal.id]: e.target.value }))}
                                className="game-input text-sm w-36"
                              />
                              <button
                                onClick={() => addAction(goal.id)}
                                className="px-3 py-1.5 bg-green-700/30 text-green-400 hover:bg-green-700/50 rounded-xl text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Reflections */}
                          <div>
                            <p className="text-xs text-slate-400 font-semibold mb-2">Reflections ({goal.reflections.length})</p>
                            {goal.reflections.length > 0 && (
                              <div className="space-y-1 mb-2">
                                {goal.reflections.map((r, i) => (
                                  <div key={i} className="text-xs text-slate-300 bg-slate-800/60 rounded px-2 py-1.5">
                                    {r}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                value={newReflection[goal.id] ?? ''}
                                onChange={e => setNewReflection(m => ({ ...m, [goal.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') addReflection(goal.id) }}
                                placeholder="Add reflection note..."
                                className="game-input flex-1 text-sm"
                              />
                              <button
                                onClick={() => addReflection(goal.id)}
                                className="px-3 py-1.5 bg-violet-700/30 text-violet-400 hover:bg-violet-700/50 rounded-xl text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="flex items-center gap-1 text-slate-600 hover:text-red-400 transition-colors text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete goal
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Goals not matching any area (orphaned) */}
          {(() => {
            const orphaned = goals.filter(g => !areas.find(a => a.id === g.areaId))
            if (orphaned.length === 0) return null
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm font-semibold text-slate-500">Uncategorized</span>
                </div>
                {orphaned.map(goal => (
                  <div key={goal.id} className="game-card p-3 flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-300">{goal.title}</span>
                    <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* ===== PROGRESS TAB ===== */}
      {tab === 'progress' && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Goals', value: totalGoals, color: 'text-white' },
              { label: 'Active', value: activeGoals, color: 'text-green-400' },
              { label: 'Completed', value: completedGoals, color: 'text-violet-400' },
              { label: 'Paused', value: pausedGoals, color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="game-card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Streak / last action */}
          {daysSinceLastAction !== null && (
            <div className="game-card p-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-white">
                  {daysSinceLastAction === 0 ? 'Action completed today!' : `${daysSinceLastAction} day${daysSinceLastAction !== 1 ? 's' : ''} since last action`}
                </div>
                <div className="text-xs text-slate-500">Keep momentum by completing another action today.</div>
              </div>
            </div>
          )}

          {/* Most active area */}
          {mostActiveArea && (
            <div className="game-card p-4 flex items-center gap-3">
              <span className="text-2xl">{mostActiveArea.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white">Most active: {mostActiveArea.name}</div>
                <div className="text-xs text-slate-500">{areaActionCounts[mostActiveArea.id]} action{areaActionCounts[mostActiveArea.id] !== 1 ? 's' : ''} completed</div>
              </div>
            </div>
          )}

          {/* Radar chart */}
          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" /> Growth Radar
            </h3>
            <RadarChart areas={areas} />
            {areas.length >= 3 && (
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-violet-500" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-blue-500" style={{ borderTop: '1px dashed #3b82f6', background: 'transparent' }} />
                  <span>Goal</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline: recently completed actions (last 30 days) */}
          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-400" /> Recent Actions (Last 30 Days)
            </h3>
            {recentCompletedActions.length === 0 ? (
              <p className="text-slate-500 text-sm">No actions completed in the last 30 days.</p>
            ) : (
              <div className="space-y-2">
                {recentCompletedActions.slice(0, 20).map(({ goalTitle, action }) => (
                  <div key={action.id} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 leading-tight">{action.description}</p>
                      <p className="text-xs text-slate-600">{goalTitle} · {action.completedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
