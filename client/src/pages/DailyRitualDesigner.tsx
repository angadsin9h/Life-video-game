import { useState, useEffect, useMemo } from 'react'
import { Sun, Plus, Trash2, Save, Star, Heart, CheckCircle, ChevronDown, ChevronUp, RefreshCw, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'daily_ritual_designer'

type StepCategory = 'mind' | 'body' | 'soul' | 'work' | 'relationship' | 'creative'
type RitualTime = 'morning' | 'midday' | 'evening' | 'pre-sleep' | 'custom'
type RitualColor = 'yellow' | 'violet' | 'blue' | 'green' | 'pink'

interface RitualStep {
  id: string
  name: string
  duration: number
  category: StepCategory
  optional: boolean
  cue: string
  notes: string
}

interface Ritual {
  id: string
  name: string
  time: RitualTime
  targetDuration: number
  steps: RitualStep[]
  active: boolean
  color: RitualColor
}

interface RitualLog {
  id: string
  date: string
  ritualId: string
  completed: boolean
  completedSteps: string[]
  actualDuration: number
  qualityScore: 1 | 2 | 3 | 4 | 5
  notes: string
}

interface StoredData {
  rituals: Ritual[]
  logs: RitualLog[]
}

const STEP_CAT_CONFIG: Record<StepCategory, { label: string; color: string; emoji: string }> = {
  mind:         { label: 'Mind',         color: '#a855f7', emoji: '🧠' },
  body:         { label: 'Body',         color: '#22c55e', emoji: '💪' },
  soul:         { label: 'Soul',         color: '#f59e0b', emoji: '✨' },
  work:         { label: 'Work',         color: '#3b82f6', emoji: '💼' },
  relationship: { label: 'Relationship', color: '#ec4899', emoji: '💝' },
  creative:     { label: 'Creative',     color: '#f97316', emoji: '🎨' },
}

const TIME_ORDER: Record<RitualTime, number> = {
  morning: 0, midday: 1, evening: 2, 'pre-sleep': 3, custom: 4,
}

const TIME_LABELS: Record<RitualTime, string> = {
  morning: '🌅 Morning', midday: '☀️ Midday', evening: '🌆 Evening',
  'pre-sleep': '🌙 Pre-Sleep', custom: '⚙️ Custom',
}

const COLOR_CLASSES: Record<RitualColor, { bg: string; text: string; border: string; barBg: string }> = {
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40', barBg: 'bg-yellow-400' },
  violet: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/40', barBg: 'bg-violet-400' },
  blue:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/40',   barBg: 'bg-blue-400'   },
  green:  { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/40',  barBg: 'bg-green-400'  },
  pink:   { bg: 'bg-pink-500/20',   text: 'text-pink-400',   border: 'border-pink-500/40',   barBg: 'bg-pink-400'   },
}

const COLORS: RitualColor[] = ['yellow', 'violet', 'blue', 'green', 'pink']

const COLOR_SWATCH: Record<RitualColor, string> = {
  yellow: '#facc15', violet: '#a855f7', blue: '#3b82f6', green: '#22c55e', pink: '#ec4899',
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function shiftDay(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function loadData(): StoredData {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { rituals: [], logs: [] }
  } catch {
    return { rituals: [], logs: [] }
  }
}

function calcRitualStreak(ritualId: string, logs: RitualLog[]): number {
  const daySet = new Set(logs.filter(l => l.ritualId === ritualId && l.completed).map(l => l.date))
  let streak = 0
  let cur = todayStr()
  while (daySet.has(cur)) { streak++; cur = shiftDay(cur, -1) }
  if (streak === 0) {
    cur = shiftDay(todayStr(), -1)
    while (daySet.has(cur)) { streak++; cur = shiftDay(cur, -1) }
  }
  return streak
}

function calcCompletionRate(ritualId: string, logs: RitualLog[]): number {
  const thirty = shiftDay(todayStr(), -29)
  const recent = logs.filter(l => l.ritualId === ritualId && l.date >= thirty)
  if (recent.length === 0) return 0
  return Math.round((recent.filter(l => l.completed).length / 30) * 100)
}

function defaultStep(): Omit<RitualStep, 'id'> {
  return { name: '', duration: 10, category: 'mind', optional: false, cue: '', notes: '' }
}

function defaultRitualForm() {
  return { name: '', time: 'morning' as RitualTime, targetDuration: 30, color: 'yellow' as RitualColor }
}

export default function DailyRitualDesigner() {
  const { toastSuccess } = useToast()

  const [data, setData] = useState<StoredData>(loadData)
  const [activeTab, setActiveTab] = useState<'design' | 'today' | 'history'>('design')

  // Design tab state
  const [showCreateRitual, setShowCreateRitual] = useState(false)
  const [ritualForm, setRitualForm] = useState(defaultRitualForm())
  const [expandedRitual, setExpandedRitual] = useState<string | null>(null)
  const [addingStepTo, setAddingStepTo] = useState<string | null>(null)
  const [stepForm, setStepForm] = useState<Omit<RitualStep, 'id'>>(defaultStep())
  const [editingStep, setEditingStep] = useState<{ ritualId: string; stepId: string } | null>(null)

  // Today tab state: map ritualId -> { completedSteps, logForm }
  const [todayState, setTodayState] = useState<Record<string, {
    completedSteps: string[]
    quality: 1 | 2 | 3 | 4 | 5
    actualDuration: number
    notes: string
    saved: boolean
  }>>({})

  const today = todayStr()

  function persist(updated: StoredData) {
    setData(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Init today state from logs
  useEffect(() => {
    const init: typeof todayState = {}
    data.rituals.filter(r => r.active).forEach(r => {
      const existing = data.logs.find(l => l.ritualId === r.id && l.date === today)
      init[r.id] = existing
        ? { completedSteps: existing.completedSteps, quality: existing.qualityScore, actualDuration: existing.actualDuration, notes: existing.notes, saved: true }
        : { completedSteps: [], quality: 3, actualDuration: r.targetDuration, notes: '', saved: false }
    })
    setTodayState(init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.rituals.length, today])

  // Design: create ritual
  function createRitual() {
    if (!ritualForm.name.trim()) return
    const r: Ritual = {
      id: Date.now().toString(),
      name: ritualForm.name.trim(),
      time: ritualForm.time,
      targetDuration: ritualForm.targetDuration,
      color: ritualForm.color,
      steps: [],
      active: true,
    }
    persist({ ...data, rituals: [...data.rituals, r] })
    setRitualForm(defaultRitualForm())
    setShowCreateRitual(false)
    setExpandedRitual(r.id)
    toastSuccess('Ritual created!')
  }

  function deleteRitual(id: string) {
    persist({ ...data, rituals: data.rituals.filter(r => r.id !== id) })
  }

  function toggleRitualActive(id: string) {
    persist({ ...data, rituals: data.rituals.map(r => r.id === id ? { ...r, active: !r.active } : r) })
  }

  // Design: steps
  function addStep(ritualId: string) {
    if (!stepForm.name.trim()) return
    const step: RitualStep = { ...stepForm, id: Date.now().toString() }
    persist({
      ...data,
      rituals: data.rituals.map(r => r.id === ritualId ? { ...r, steps: [...r.steps, step] } : r),
    })
    setStepForm(defaultStep())
    setAddingStepTo(null)
    toastSuccess('Step added!')
  }

  function deleteStep(ritualId: string, stepId: string) {
    persist({
      ...data,
      rituals: data.rituals.map(r => r.id === ritualId ? { ...r, steps: r.steps.filter(s => s.id !== stepId) } : r),
    })
  }

  function saveEditStep(ritualId: string, stepId: string) {
    persist({
      ...data,
      rituals: data.rituals.map(r =>
        r.id === ritualId
          ? { ...r, steps: r.steps.map(s => s.id === stepId ? { ...stepForm, id: stepId } : s) }
          : r
      ),
    })
    setEditingStep(null)
    setStepForm(defaultStep())
  }

  function startEditStep(ritualId: string, step: RitualStep) {
    setEditingStep({ ritualId, stepId: step.id })
    setStepForm({ name: step.name, duration: step.duration, category: step.category, optional: step.optional, cue: step.cue, notes: step.notes })
  }

  // Today: toggle step
  function toggleStep(ritualId: string, stepId: string) {
    setTodayState(prev => {
      const cur = prev[ritualId] ?? { completedSteps: [], quality: 3, actualDuration: 0, notes: '', saved: false }
      const done = cur.completedSteps.includes(stepId)
      return {
        ...prev,
        [ritualId]: {
          ...cur,
          completedSteps: done ? cur.completedSteps.filter(s => s !== stepId) : [...cur.completedSteps, stepId],
          saved: false,
        },
      }
    })
  }

  function saveRitualLog(ritual: Ritual) {
    const state = todayState[ritual.id]
    if (!state) return
    const log: RitualLog = {
      id: Date.now().toString(),
      date: today,
      ritualId: ritual.id,
      completed: state.completedSteps.length === ritual.steps.length || ritual.steps.length === 0,
      completedSteps: state.completedSteps,
      actualDuration: state.actualDuration,
      qualityScore: state.quality,
      notes: state.notes,
    }
    const otherLogs = data.logs.filter(l => !(l.ritualId === ritual.id && l.date === today))
    persist({ ...data, logs: [...otherLogs, log] })
    setTodayState(prev => ({ ...prev, [ritual.id]: { ...prev[ritual.id], saved: true } }))
    toastSuccess('Ritual complete! ✨')
  }

  // History helpers
  const sortedActiveRituals = useMemo(
    () => [...data.rituals.filter(r => r.active)].sort((a, b) => TIME_ORDER[a.time] - TIME_ORDER[b.time]),
    [data.rituals]
  )

  const bestRitual = useMemo((): Ritual | null => {
    if (data.rituals.length === 0) return null
    let best: Ritual | null = null
    let bestAvg = 0
    data.rituals.forEach(r => {
      const rLogs = data.logs.filter(l => l.ritualId === r.id && l.qualityScore)
      if (rLogs.length === 0) return
      const avg = rLogs.reduce((s, l) => s + l.qualityScore, 0) / rLogs.length
      if (avg > bestAvg) { bestAvg = avg; best = r }
    })
    return best
  }, [data])

  const recentLogs = useMemo(
    () => [...data.logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15),
    [data.logs]
  )

  const ritualById = useMemo(() => {
    const m: Record<string, Ritual> = {}
    data.rituals.forEach(r => { m[r.id] = r })
    return m
  }, [data.rituals])

  // 21-day heatmap
  const heatmapDays = Array.from({ length: 21 }, (_, i) => shiftDay(today, -(20 - i)))

  function heatColor(log: RitualLog | undefined): string {
    if (!log || !log.completed) return '#1e293b'
    const q = log.qualityScore
    if (q >= 5) return '#22c55e'
    if (q >= 4) return '#3b82f6'
    if (q >= 3) return '#f59e0b'
    if (q >= 2) return '#f97316'
    return '#ef4444'
  }

  const logsByRitualDate = useMemo(() => {
    const m: Record<string, RitualLog> = {}
    data.logs.forEach(l => { m[`${l.ritualId}__${l.date}`] = l })
    return m
  }, [data.logs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Daily Ritual Designer
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design and track your ideal daily rituals.</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-violet-400">{data.rituals.filter(r => r.active).length}</div>
          <div className="text-xs text-slate-500">active rituals</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['design', 'today', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── DESIGN TAB ── */}
      {activeTab === 'design' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowCreateRitual(!showCreateRitual)}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showCreateRitual ? 'Cancel' : 'Create New Ritual'}
          </button>

          {showCreateRitual && (
            <div className="game-card p-4 space-y-3 border border-violet-500/30">
              <h3 className="font-semibold text-white">New Ritual</h3>
              <input
                className="game-input w-full"
                placeholder="Ritual name (e.g. Morning Power Ritual)"
                value={ritualForm.name}
                onChange={e => setRitualForm(f => ({ ...f, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Time of Day</label>
                  <select
                    className="game-input w-full"
                    value={ritualForm.time}
                    onChange={e => setRitualForm(f => ({ ...f, time: e.target.value as RitualTime }))}
                  >
                    {(Object.entries(TIME_LABELS) as [RitualTime, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Target Duration (min)</label>
                  <input
                    type="number"
                    className="game-input w-full"
                    value={ritualForm.targetDuration}
                    onChange={e => setRitualForm(f => ({ ...f, targetDuration: Number(e.target.value) }))}
                    min={1}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setRitualForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: COLOR_SWATCH[c],
                        borderColor: ritualForm.color === c ? '#fff' : 'transparent',
                        transform: ritualForm.color === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={createRitual}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" /> Create Ritual
              </button>
            </div>
          )}

          {data.rituals.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No rituals yet. Create your first one above.</p>
            </div>
          )}

          {[...data.rituals].sort((a, b) => TIME_ORDER[a.time] - TIME_ORDER[b.time]).map(ritual => {
            const cls = COLOR_CLASSES[ritual.color]
            const isExpanded = expandedRitual === ritual.id
            const totalDur = ritual.steps.reduce((s, st) => s + st.duration, 0)

            return (
              <div key={ritual.id} className={`game-card border ${cls.border}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${cls.text}`}>{TIME_LABELS[ritual.time]}</span>
                        {!ritual.active && <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">inactive</span>}
                      </div>
                      <div className="font-semibold text-white mt-0.5">{ritual.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {totalDur} min ({ritual.steps.length} steps)
                        </span>
                        <span className="text-xs text-slate-500">target {ritual.targetDuration} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleRitualActive(ritual.id)}
                        className={`p-1.5 rounded-lg transition-colors ${ritual.active ? 'text-green-400 hover:text-slate-400' : 'text-slate-500 hover:text-green-400'}`}
                        title={ritual.active ? 'Deactivate' : 'Activate'}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedRitual(isExpanded ? null : ritual.id)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteRitual(ritual.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-700 px-4 pb-4 space-y-3 pt-3">
                    {/* Steps list */}
                    <div className="space-y-2">
                      {ritual.steps.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-2">No steps yet. Add some below.</p>
                      )}
                      {ritual.steps.map((step, idx) => {
                        const sc = STEP_CAT_CONFIG[step.category]
                        const isEditing = editingStep?.ritualId === ritual.id && editingStep?.stepId === step.id

                        if (isEditing) {
                          return (
                            <div key={step.id} className="p-3 bg-slate-900/50 rounded-xl space-y-2">
                              <input
                                className="game-input w-full text-sm"
                                value={stepForm.name}
                                onChange={e => setStepForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Step name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  className="game-input w-full text-sm"
                                  value={stepForm.duration}
                                  onChange={e => setStepForm(f => ({ ...f, duration: Number(e.target.value) }))}
                                  placeholder="Minutes"
                                  min={1}
                                />
                                <select
                                  className="game-input w-full text-sm"
                                  value={stepForm.category}
                                  onChange={e => setStepForm(f => ({ ...f, category: e.target.value as StepCategory }))}
                                >
                                  {(Object.entries(STEP_CAT_CONFIG) as [StepCategory, typeof STEP_CAT_CONFIG.mind][]).map(([k, c]) => (
                                    <option key={k} value={k}>{c.emoji} {c.label}</option>
                                  ))}
                                </select>
                              </div>
                              <input
                                className="game-input w-full text-sm"
                                value={stepForm.cue}
                                onChange={e => setStepForm(f => ({ ...f, cue: e.target.value }))}
                                placeholder="Cue / trigger"
                              />
                              <input
                                className="game-input w-full text-sm"
                                value={stepForm.notes}
                                onChange={e => setStepForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Notes"
                              />
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={stepForm.optional}
                                  onChange={e => setStepForm(f => ({ ...f, optional: e.target.checked }))}
                                  className="w-4 h-4 accent-violet-500"
                                />
                                <span className="text-xs text-slate-400">Optional step</span>
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEditStep(ritual.id, step.id)}
                                  className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingStep(null); setStepForm(defaultStep()) }}
                                  className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div key={step.id} className="flex items-center gap-2.5 p-2.5 bg-slate-900/40 rounded-xl" style={{ opacity: step.optional ? 0.7 : 1 }}>
                            <span className="text-slate-500 text-xs w-4 text-center">{idx + 1}</span>
                            <span className="text-sm">{sc.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-200">{step.name}</span>
                                {step.optional && <span className="text-xs text-slate-500">optional</span>}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {step.duration} min
                                {step.cue && ` · cue: ${step.cue}`}
                                {step.notes && ` · ${step.notes}`}
                              </div>
                            </div>
                            <span className="text-xs flex-shrink-0" style={{ color: sc.color }}>{sc.label}</span>
                            <button
                              onClick={() => startEditStep(ritual.id, step)}
                              className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteStep(ritual.id, step.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add step form */}
                    {addingStepTo === ritual.id ? (
                      <div className="p-3 bg-slate-900/50 rounded-xl space-y-2 border border-dashed border-slate-600">
                        <h4 className="text-xs font-semibold text-slate-400">Add Step</h4>
                        <input
                          className="game-input w-full text-sm"
                          placeholder="Step name"
                          value={stepForm.name}
                          onChange={e => setStepForm(f => ({ ...f, name: e.target.value }))}
                          autoFocus
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            className="game-input w-full text-sm"
                            placeholder="Minutes"
                            value={stepForm.duration}
                            onChange={e => setStepForm(f => ({ ...f, duration: Number(e.target.value) }))}
                            min={1}
                          />
                          <select
                            className="game-input w-full text-sm"
                            value={stepForm.category}
                            onChange={e => setStepForm(f => ({ ...f, category: e.target.value as StepCategory }))}
                          >
                            {(Object.entries(STEP_CAT_CONFIG) as [StepCategory, typeof STEP_CAT_CONFIG.mind][]).map(([k, c]) => (
                              <option key={k} value={k}>{c.emoji} {c.label}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          className="game-input w-full text-sm"
                          placeholder="Cue / trigger (what starts this step)"
                          value={stepForm.cue}
                          onChange={e => setStepForm(f => ({ ...f, cue: e.target.value }))}
                        />
                        <input
                          className="game-input w-full text-sm"
                          placeholder="Notes"
                          value={stepForm.notes}
                          onChange={e => setStepForm(f => ({ ...f, notes: e.target.value }))}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stepForm.optional}
                            onChange={e => setStepForm(f => ({ ...f, optional: e.target.checked }))}
                            className="w-4 h-4 accent-violet-500"
                          />
                          <span className="text-xs text-slate-400">Optional step</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addStep(ritual.id)}
                            className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 inline mr-1" />Add Step
                          </button>
                          <button
                            onClick={() => { setAddingStepTo(null); setStepForm(defaultStep()) }}
                            className="px-3 py-2 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingStepTo(ritual.id); setStepForm(defaultStep()) }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-600 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Step
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TODAY TAB ── */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          {sortedActiveRituals.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No active rituals. Create some in the Design tab.</p>
            </div>
          )}

          {sortedActiveRituals.map(ritual => {
            const cls = COLOR_CLASSES[ritual.color]
            const state = todayState[ritual.id] ?? { completedSteps: [], quality: 3, actualDuration: ritual.targetDuration, notes: '', saved: false }
            const doneCount = state.completedSteps.length
            const totalSteps = ritual.steps.length
            const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0
            const streak = calcRitualStreak(ritual.id, data.logs)

            return (
              <div key={ritual.id} className={`game-card border ${cls.border}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">{ritual.name}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs ${cls.text}`}>{TIME_LABELS[ritual.time]}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{ritual.targetDuration} min
                        </span>
                        <span className="text-xs text-orange-400">🔥 {streak}d streak</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${cls.text}`}>{pct}%</div>
                      <div className="text-xs text-slate-500">{doneCount}/{totalSteps}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-300 ${cls.barBg}`} style={{ width: `${pct}%` }} />
                  </div>

                  {/* Steps checklist */}
                  {ritual.steps.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {ritual.steps.map(step => {
                        const done = state.completedSteps.includes(step.id)
                        const sc = STEP_CAT_CONFIG[step.category]
                        return (
                          <button
                            key={step.id}
                            onClick={() => toggleStep(ritual.id, step.id)}
                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${done ? 'bg-slate-900/60' : 'bg-slate-800/50 hover:bg-slate-800'} ${step.optional ? 'opacity-60' : ''}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${done ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                              {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-sm">{sc.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {step.name}
                              </span>
                              {step.optional && <span className="text-xs text-slate-600 ml-2">optional</span>}
                            </div>
                            <span className="text-xs text-slate-500 flex-shrink-0">{step.duration}m</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Log form */}
                  <div className="border-t border-slate-700 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Quality (1-5)</label>
                        <div className="flex gap-1">
                          {([1, 2, 3, 4, 5] as const).map(n => (
                            <button
                              key={n}
                              onClick={() => setTodayState(prev => ({
                                ...prev,
                                [ritual.id]: { ...prev[ritual.id], quality: n, saved: false },
                              }))}
                              className={`flex-1 py-1.5 rounded-lg text-sm transition-colors ${state.quality >= n ? `${cls.bg} ${cls.text}` : 'bg-slate-700 text-slate-500'}`}
                            >
                              <Star className="w-3 h-3 inline" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Actual Duration (min)</label>
                        <input
                          type="number"
                          className="game-input w-full text-sm"
                          value={state.actualDuration}
                          onChange={e => setTodayState(prev => ({
                            ...prev,
                            [ritual.id]: { ...prev[ritual.id], actualDuration: Number(e.target.value), saved: false },
                          }))}
                          min={0}
                        />
                      </div>
                    </div>
                    <textarea
                      className="game-input w-full text-sm resize-none"
                      rows={2}
                      placeholder="Notes about this ritual session..."
                      value={state.notes}
                      onChange={e => setTodayState(prev => ({
                        ...prev,
                        [ritual.id]: { ...prev[ritual.id], notes: e.target.value, saved: false },
                      }))}
                    />
                    <button
                      onClick={() => saveRitualLog(ritual)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors ${state.saved ? 'bg-slate-700 text-slate-400' : `bg-violet-600 hover:bg-violet-500 text-white`}`}
                    >
                      <Save className="w-4 h-4" />
                      {state.saved ? 'Saved ✓' : 'Save Ritual Log'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* Best ritual */}
          {bestRitual && (
            <div className={`game-card p-4 border ${COLOR_CLASSES[bestRitual.color].border}`}>
              <div className="flex items-center gap-2">
                <Heart className={`w-5 h-5 ${COLOR_CLASSES[bestRitual.color].text}`} />
                <div>
                  <div className="text-xs text-slate-400">Best Ritual by Avg Quality</div>
                  <div className="font-semibold text-white">{bestRitual.name}</div>
                </div>
              </div>
            </div>
          )}

          {/* 21-day heatmap per ritual */}
          {data.rituals.filter(r => r.active).length > 0 && (
            <div className="game-card p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                21-Day Heatmap
              </h3>
              <div className="space-y-3">
                {data.rituals.filter(r => r.active).map(ritual => {
                  const cls = COLOR_CLASSES[ritual.color]
                  const compRate = calcCompletionRate(ritual.id, data.logs)
                  return (
                    <div key={ritual.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${cls.text} truncate max-w-[120px]`}>{ritual.name}</span>
                        <span className="text-xs text-slate-500">{compRate}% last 30d</span>
                      </div>
                      <div className="flex gap-1 overflow-x-auto pb-0.5">
                        {heatmapDays.map(d => {
                          const log = logsByRitualDate[`${ritual.id}__${d}`]
                          const isToday = d === today
                          return (
                            <div
                              key={d}
                              className="w-5 h-5 rounded flex-shrink-0 transition-colors"
                              style={{
                                backgroundColor: heatColor(log),
                                border: isToday ? '2px solid #facc15' : '1px solid #1e293b',
                              }}
                              title={`${d}: ${log ? (log.completed ? `quality ${log.qualityScore}` : 'incomplete') : 'no log'}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div className="flex gap-3 mt-3 flex-wrap">
                {[
                  { color: '#1e293b', label: 'None' },
                  { color: '#ef4444', label: 'Q1' },
                  { color: '#f97316', label: 'Q2' },
                  { color: '#f59e0b', label: 'Q3' },
                  { color: '#3b82f6', label: 'Q4' },
                  { color: '#22c55e', label: 'Q5' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion rates */}
          {data.rituals.length > 0 && (
            <div className="game-card p-4">
              <h3 className="font-semibold text-white mb-3">Completion Rate (last 30 days)</h3>
              <div className="space-y-3">
                {data.rituals.map(r => {
                  const rate = calcCompletionRate(r.id, data.logs)
                  const cls = COLOR_CLASSES[r.color]
                  return (
                    <div key={r.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 truncate">{r.name}</span>
                        <span className={cls.text}>{rate}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cls.barBg} transition-all duration-500`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent logs */}
          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Recent Logs</h3>
            {recentLogs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No logs yet. Start completing rituals!</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map(log => {
                  const ritual = ritualById[log.ritualId]
                  if (!ritual) return null
                  const cls = COLOR_CLASSES[ritual.color]
                  const stepFrac = ritual.steps.length > 0
                    ? `${log.completedSteps.length}/${ritual.steps.length}`
                    : '—'
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 bg-slate-900/40 rounded-xl">
                      <div className="text-xs text-slate-500 w-20 flex-shrink-0">{log.date}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${cls.text}`}>{ritual.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {stepFrac} steps · {log.actualDuration}m
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: log.qualityScore }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400" />
                        ))}
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.completed ? 'bg-green-400' : 'bg-slate-600'}`} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
