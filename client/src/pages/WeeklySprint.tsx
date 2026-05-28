import { useState, useEffect, useCallback } from 'react'
import {
  Flag, Check, Plus, Trash2, ChevronDown, ChevronUp,
  Star, Calendar, Target, X, RefreshCw
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface SprintPriority {
  id: string
  text: string
  status: 'not-started' | 'done'
}

interface DayTask {
  id: string
  text: string
  done: boolean
}

interface WeekSprint {
  id: string
  weekStart: string
  theme: string
  priorities: SprintPriority[]
  mustAvoid: string[]
  keyMetric: string
  keyMetricValue: string
  dailyTasks: Record<string, DayTask[]>
  closed: boolean
  rating: number
  closeNotes: string
  createdAt: string
  closedAt?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const STORAGE_KEY = 'weekly_sprints'

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatWeekRange(monday: string): string {
  const start = new Date(monday + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function loadSprints(): WeekSprint[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveSprints(sprints: WeekSprint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sprints))
}

function blankSprint(weekStart: string): WeekSprint {
  const dayTasks: Record<string, DayTask[]> = {}
  DAY_KEYS.forEach(k => { dayTasks[k] = [] })
  return {
    id: Date.now().toString(),
    weekStart,
    theme: '',
    priorities: [
      { id: 'p1', text: '', status: 'not-started' },
      { id: 'p2', text: '', status: 'not-started' },
      { id: 'p3', text: '', status: 'not-started' },
    ],
    mustAvoid: ['', '', ''],
    keyMetric: '',
    keyMetricValue: '',
    dailyTasks: dayTasks,
    closed: false,
    rating: 0,
    closeNotes: '',
    createdAt: new Date().toISOString(),
  }
}

export default function WeeklySprint() {
  const { toastSuccess } = useToast()
  const currentMonday = getMonday(new Date())

  const [sprints, setSprints] = useState<WeekSprint[]>([])
  const [activeSprint, setActiveSprint] = useState<WeekSprint | null>(null)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [newDayTask, setNewDayTask] = useState<Record<string, string>>({})
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closeRating, setCloseRating] = useState(0)
  const [closeNotes, setCloseNotes] = useState('')
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const load = useCallback(() => {
    const all = loadSprints()
    setSprints(all)
    const current = all.find(s => s.weekStart === currentMonday && !s.closed)
    setActiveSprint(current || null)
  }, [currentMonday])

  useEffect(() => { load() }, [load])

  const persist = (updated: WeekSprint, allSprints: WeekSprint[]) => {
    const idx = allSprints.findIndex(s => s.id === updated.id)
    const next = idx >= 0
      ? allSprints.map(s => s.id === updated.id ? updated : s)
      : [...allSprints, updated]
    saveSprints(next)
    setSprints(next)
    setActiveSprint(updated)
  }

  const startSprint = () => {
    const sprint = blankSprint(currentMonday)
    const all = loadSprints()
    const next = [...all, sprint]
    saveSprints(next)
    setSprints(next)
    setActiveSprint(sprint)
    toastSuccess('Sprint started!', formatWeekRange(currentMonday))
  }

  const updateSprint = (patch: Partial<WeekSprint>) => {
    if (!activeSprint) return
    const updated = { ...activeSprint, ...patch }
    persist(updated, sprints)
  }

  const updatePriority = (id: string, patch: Partial<SprintPriority>) => {
    if (!activeSprint) return
    const updated = {
      ...activeSprint,
      priorities: activeSprint.priorities.map(p => p.id === id ? { ...p, ...patch } : p),
    }
    persist(updated, sprints)
  }

  const updateMustAvoid = (idx: number, val: string) => {
    if (!activeSprint) return
    const updated = activeSprint.mustAvoid.map((v, i) => i === idx ? val : v)
    updateSprint({ mustAvoid: updated })
  }

  const addDayTask = (dayKey: string) => {
    if (!activeSprint) return
    const text = (newDayTask[dayKey] || '').trim()
    if (!text) return
    const task: DayTask = { id: Date.now().toString(), text, done: false }
    const updated = {
      ...activeSprint,
      dailyTasks: {
        ...activeSprint.dailyTasks,
        [dayKey]: [...(activeSprint.dailyTasks[dayKey] || []), task],
      },
    }
    persist(updated, sprints)
    setNewDayTask(prev => ({ ...prev, [dayKey]: '' }))
  }

  const toggleDayTask = (dayKey: string, taskId: string) => {
    if (!activeSprint) return
    const updated = {
      ...activeSprint,
      dailyTasks: {
        ...activeSprint.dailyTasks,
        [dayKey]: activeSprint.dailyTasks[dayKey].map(t =>
          t.id === taskId ? { ...t, done: !t.done } : t
        ),
      },
    }
    persist(updated, sprints)
  }

  const deleteDayTask = (dayKey: string, taskId: string) => {
    if (!activeSprint) return
    const updated = {
      ...activeSprint,
      dailyTasks: {
        ...activeSprint.dailyTasks,
        [dayKey]: activeSprint.dailyTasks[dayKey].filter(t => t.id !== taskId),
      },
    }
    persist(updated, sprints)
  }

  const closeSprint = () => {
    if (!activeSprint) return
    const updated: WeekSprint = {
      ...activeSprint,
      closed: true,
      rating: closeRating,
      closeNotes,
      closedAt: new Date().toISOString(),
    }
    persist(updated, sprints)
    setActiveSprint(null)
    setShowCloseForm(false)
    setCloseRating(0)
    setCloseNotes('')
    toastSuccess('Sprint closed!', 'Great work this week.')
  }

  // Health metrics
  const priorityDone = activeSprint
    ? activeSprint.priorities.filter(p => p.text.trim() && p.status === 'done').length
    : 0
  const priorityTotal = activeSprint
    ? activeSprint.priorities.filter(p => p.text.trim()).length
    : 0
  const priorityPct = priorityTotal > 0 ? Math.round((priorityDone / priorityTotal) * 100) : 0

  const allTasks = activeSprint
    ? DAY_KEYS.flatMap(k => activeSprint.dailyTasks[k] || [])
    : []
  const tasksDone = allTasks.filter(t => t.done).length
  const tasksTotal = allTasks.length
  const tasksPct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0

  const pastSprints = sprints.filter(s => s.closed).sort(
    (a, b) => new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime()
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flag className="w-7 h-7 text-purple-400" />
            Weekly Sprint
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{formatWeekRange(currentMonday)}</p>
        </div>
        {activeSprint && (
          <button
            onClick={() => setShowCloseForm(true)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Close Sprint
          </button>
        )}
      </div>

      {/* No active sprint */}
      {!activeSprint && (
        <div className="game-card p-8 text-center">
          <RefreshCw className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold mb-1">No active sprint this week</p>
          <p className="text-slate-500 text-sm mb-4">Start a focused sprint to plan your week with intention.</p>
          <button
            onClick={startSprint}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Start Sprint
          </button>
        </div>
      )}

      {/* Active sprint */}
      {activeSprint && (
        <>
          {/* Sprint Health */}
          <div className="game-card p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sprint Health</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Priorities</span>
                  <span className="text-white font-semibold">{priorityDone}/{priorityTotal}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${priorityPct}%`,
                      backgroundColor: priorityPct === 100 ? '#22c55e' : '#a855f7',
                    }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">{priorityPct}% done</div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Daily Tasks</span>
                  <span className="text-white font-semibold">{tasksDone}/{tasksTotal}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${tasksPct}%`,
                      backgroundColor: tasksPct === 100 ? '#22c55e' : '#3b82f6',
                    }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">{tasksPct}% done</div>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="game-card p-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Sprint Theme / Focus
            </label>
            <input
              placeholder="e.g. 'Ship the MVP' or 'Recovery Week'…"
              value={activeSprint.theme}
              onChange={e => updateSprint({ theme: e.target.value })}
              className="game-input w-full text-lg font-semibold"
            />
          </div>

          {/* Top 3 Priorities */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top 3 Priorities</span>
            </div>
            <div className="space-y-3">
              {activeSprint.priorities.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-4">{idx + 1}.</span>
                  <input
                    placeholder={`Priority ${idx + 1}…`}
                    value={p.text}
                    onChange={e => updatePriority(p.id, { text: e.target.value })}
                    className="game-input flex-1 text-sm"
                  />
                  <button
                    onClick={() => updatePriority(p.id, { status: p.status === 'done' ? 'not-started' : 'done' })}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                      p.status === 'done'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'border-slate-600 hover:border-green-500 text-slate-600'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Must Avoid */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Must Avoid</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">3 things to actively avoid this sprint</p>
            <div className="space-y-2">
              {activeSprint.mustAvoid.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-red-500 text-sm w-4">✗</span>
                  <input
                    placeholder={`Avoid #${idx + 1}…`}
                    value={item}
                    onChange={e => updateMustAvoid(idx, e.target.value)}
                    className="game-input flex-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Key Metric */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Metric to Track</span>
            </div>
            <div className="flex gap-2">
              <input
                placeholder="e.g. Pull requests merged, km run…"
                value={activeSprint.keyMetric}
                onChange={e => updateSprint({ keyMetric: e.target.value })}
                className="game-input flex-1 text-sm"
              />
              <input
                placeholder="Value"
                value={activeSprint.keyMetricValue}
                onChange={e => updateSprint({ keyMetricValue: e.target.value })}
                className="game-input w-24 text-sm"
              />
            </div>
          </div>

          {/* Daily Tasks */}
          <div className="game-card p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Daily Tasks</div>
            <div className="space-y-2">
              {DAY_KEYS.map((key, idx) => {
                const tasks = activeSprint.dailyTasks[key] || []
                const doneTasks = tasks.filter(t => t.done).length
                const isExpanded = expandedDay === key
                return (
                  <div key={key} className="border border-slate-700/60 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : key)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-300">{DAYS[idx]}</span>
                        {tasks.length > 0 && (
                          <span className="text-xs text-slate-500">
                            {doneTasks}/{tasks.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {tasks.length > 0 && (
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%` }}
                            />
                          </div>
                        )}
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-500" />
                          : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-700/50 space-y-2">
                        {tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2">
                            <button
                              onClick={() => toggleDayTask(key, task.id)}
                              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                                task.done
                                  ? 'bg-green-600 border-green-500'
                                  : 'border-slate-600 hover:border-green-500'
                              }`}
                            >
                              {task.done && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span className={`flex-1 text-sm ${task.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                              {task.text}
                            </span>
                            <button
                              onClick={() => deleteDayTask(key, task.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <input
                            placeholder="Add task…"
                            value={newDayTask[key] || ''}
                            onChange={e => setNewDayTask(prev => ({ ...prev, [key]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addDayTask(key)}
                            className="game-input flex-1 text-sm"
                          />
                          <button
                            onClick={() => addDayTask(key)}
                            disabled={!(newDayTask[key] || '').trim()}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-40"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Close Sprint Form */}
          {showCloseForm && (
            <div className="game-card p-5 border border-purple-500/40">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-purple-300">End-of-Week Review</div>
                <button onClick={() => setShowCloseForm(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <div className="text-xs text-slate-500 mb-2">Rate this sprint</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setCloseRating(n)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className="w-7 h-7 transition-colors"
                        fill={n <= closeRating ? '#facc15' : 'none'}
                        stroke={n <= closeRating ? '#facc15' : '#475569'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">Reflection notes</label>
                <textarea
                  rows={3}
                  placeholder="What went well? What would you change?"
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  className="game-input w-full text-sm resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeSprint}
                  disabled={closeRating === 0}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-40"
                >
                  Close Sprint
                </button>
                <button
                  onClick={() => setShowCloseForm(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sprint History */}
      {pastSprints.length > 0 && (
        <div className="game-card p-4">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sprint History ({pastSprints.length})
            </div>
            {historyExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {historyExpanded && (
            <div className="mt-4 space-y-3">
              {pastSprints.map(sprint => {
                const priDone = sprint.priorities.filter(p => p.text.trim() && p.status === 'done').length
                const priTotal = sprint.priorities.filter(p => p.text.trim()).length
                const allT = DAY_KEYS.flatMap(k => sprint.dailyTasks[k] || [])
                const tDone = allT.filter(t => t.done).length
                return (
                  <div key={sprint.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-300">
                          {formatWeekRange(sprint.weekStart)}
                        </div>
                        {sprint.theme && (
                          <div className="text-xs text-purple-400 mt-0.5">"{sprint.theme}"</div>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className="w-4 h-4"
                            fill={n <= sprint.rating ? '#facc15' : 'none'}
                            stroke={n <= sprint.rating ? '#facc15' : '#334155'}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>Priorities: {priDone}/{priTotal}</span>
                      <span>Tasks: {tDone}/{allT.length}</span>
                    </div>
                    {sprint.closeNotes && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{sprint.closeNotes}"</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
