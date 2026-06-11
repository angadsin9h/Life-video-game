import React, { useState, useEffect } from 'react'
import { Star, Plus, Trash2, ChevronUp, ChevronDown, CheckCircle2, Circle, BarChart2, Flame, Clock, Pencil, X, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExcellenceRitual = {
  id: string
  name: string
  domain: 'morning' | 'work' | 'movement' | 'creative' | 'social' | 'evening' | 'weekly'
  steps: RitualStep[]
  targetDuration: number
  trigger: string
  anchor: string
  whyImportant: string
  active: boolean
}

type RitualStep = {
  id: string
  action: string
  duration: number
  notes: string
}

type RitualPractice = {
  id: string
  ritualId: string
  date: string
  completed: boolean
  actualDuration: number
  qualityRating: number
  modification: string
}

const STORAGE_KEY = 'lq-ritualsofexcellence'

const DOMAIN_CONFIG: Record<ExcellenceRitual['domain'], { label: string; color: string }> = {
  morning:  { label: 'Morning',  color: '#f59e0b' },
  work:     { label: 'Work',     color: '#3b82f6' },
  movement: { label: 'Movement', color: '#22c55e' },
  creative: { label: 'Creative', color: '#a855f7' },
  social:   { label: 'Social',   color: '#10b981' },
  evening:  { label: 'Evening',  color: '#6366f1' },
  weekly:   { label: 'Weekly',   color: '#ec4899' },
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
}

type RitualFormState = Omit<ExcellenceRitual, 'id' | 'steps'>

const defaultRitualForm = (): RitualFormState => ({
  name: '',
  domain: 'morning',
  targetDuration: 20,
  trigger: '',
  anchor: '',
  whyImportant: '',
  active: true,
})

type PracticeFormState = {
  actualDuration: number
  qualityRating: number
  modification: string
}

const StarIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Star className={className} style={style} />
)
const PlusIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Plus className={className} style={style} />
)
const TrashIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Trash2 className={className} style={style} />
)
const ChevUpIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <ChevronUp className={className} style={style} />
)
const ChevDownIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <ChevronDown className={className} style={style} />
)
const CheckCircleIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <CheckCircle2 className={className} style={style} />
)
const CircleIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Circle className={className} style={style} />
)
const BarChartIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <BarChart2 className={className} style={style} />
)
const FlameIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Flame className={className} style={style} />
)
const ClockIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Clock className={className} style={style} />
)
const PencilIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Pencil className={className} style={style} />
)
const XIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <X className={className} style={style} />
)
const CheckIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Check className={className} style={style} />
)

function StepTimelineBar({ steps }: { steps: RitualStep[] }) {
  const total = steps.reduce((s, st) => s + st.duration, 0)
  if (total === 0 || steps.length === 0) return (
    <div className="text-xs text-slate-500 py-2">No steps with duration</div>
  )

  const W = 320
  const barH = 28
  const labelH = 16
  const H = barH + labelH + 8
  const colors = ['#10b981', '#f59e0b', '#a855f7', '#3b82f6', '#ec4899', '#22c55e', '#6366f1', '#f97316']

  let offsetPx = 0

  return (
    <svg width={W} height={H} className="w-full max-w-sm">
      {steps.map((st, i) => {
        const w = (st.duration / total) * W
        const x = offsetPx
        offsetPx += w
        const color = colors[i % colors.length]
        return (
          <g key={st.id}>
            <rect x={x} y={0} width={w} height={barH} fill={color} fillOpacity={0.85} rx={i === 0 ? 4 : i === steps.length - 1 ? 4 : 0} />
            {w > 30 && (
              <text x={x + w / 2} y={barH / 2 + 4} fontSize={9} fill="#0f172a" textAnchor="middle" fontWeight="600">
                {st.duration}m
              </text>
            )}
            <text
              x={x + w / 2}
              y={barH + labelH}
              fontSize={8}
              fill={color}
              textAnchor="middle"
              transform={w < 28 ? `rotate(-35, ${x + w / 2}, ${barH + labelH})` : undefined}
            >
              {st.action.length > 10 ? st.action.slice(0, 10) + '…' : st.action}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function CompletionBarChart({
  rituals,
  practices,
}: {
  rituals: ExcellenceRitual[]
  practices: RitualPractice[]
}) {
  const days = last30Days()
  const activeRituals = rituals.filter(r => r.active)

  if (activeRituals.length === 0) return (
    <div className="text-slate-500 text-sm text-center py-4">No active rituals</div>
  )

  const barH = 20
  const labelW = 100
  const W = 320
  const barMaxW = W - labelW - 40

  return (
    <svg width={W} height={activeRituals.length * (barH + 8) + 10} className="w-full max-w-sm">
      {activeRituals.map((r, i) => {
        const y = i * (barH + 8) + 5
        const completed = days.filter(d =>
          practices.some(p => p.ritualId === r.id && p.date === d && p.completed)
        ).length
        const pct = completed / 30
        const barW = pct * barMaxW
        const color = DOMAIN_CONFIG[r.domain].color

        return (
          <g key={r.id}>
            <text x={0} y={y + barH / 2 + 4} fontSize={10} fill="#cbd5e1" dominantBaseline="middle">
              {r.name.length > 13 ? r.name.slice(0, 13) + '…' : r.name}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} fill="#1e293b" rx={4} />
            <rect x={labelW} y={y} width={barW} height={barH} fill={color} fillOpacity={0.8} rx={4} />
            <text x={labelW + barW + 5} y={y + barH / 2 + 4} fontSize={10} fill={color} fontWeight="600" dominantBaseline="middle">
              {completed}/30
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function computeStreak(ritualId: string, practices: RitualPractice[]): { current: number; best: number } {
  const completed = new Set(
    practices.filter(p => p.ritualId === ritualId && p.completed).map(p => p.date)
  )
  const today = new Date()
  let current = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (completed.has(d.toISOString().split('T')[0])) {
      current++
    } else {
      break
    }
  }

  const sortedDates = [...completed].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const ds of sortedDates) {
    const cur = new Date(ds)
    if (prev) {
      const diff = (cur.getTime() - prev.getTime()) / 86400000
      if (diff === 1) {
        run++
      } else {
        best = Math.max(best, run)
        run = 1
      }
    } else {
      run = 1
    }
    prev = cur
  }
  best = Math.max(best, run)
  return { current, best }
}

export default function RitualsOfExcellence() {
  const { toastSuccess } = useToast()
  const [rituals, setRituals] = useState<ExcellenceRitual[]>([])
  const [practices, setPractices] = useState<RitualPractice[]>([])
  const [activeTab, setActiveTab] = useState<'designer' | 'practice' | 'analytics' | 'timeline' | 'streaks'>('practice')
  const [showRitualForm, setShowRitualForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [ritualForm, setRitualForm] = useState<RitualFormState>(defaultRitualForm())
  const [newStep, setNewStep] = useState<Omit<RitualStep, 'id'>>({ action: '', duration: 5, notes: '' })
  const [formSteps, setFormSteps] = useState<RitualStep[]>([])
  const [selectedRitualId, setSelectedRitualId] = useState<string | null>(null)
  const [practiceForm, setPracticeForm] = useState<Record<string, PracticeFormState>>({})
  const [timelineRitualId, setTimelineRitualId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as {
        rituals?: ExcellenceRitual[]
        practices?: RitualPractice[]
      }
      setRituals(stored.rituals ?? [])
      setPractices(stored.practices ?? [])
    } catch { /**/ }
  }, [])

  const persist = (r: ExcellenceRitual[], p: RitualPractice[]) => {
    setRituals(r)
    setPractices(p)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rituals: r, practices: p }))
  }

  const saveRitual = () => {
    if (!ritualForm.name.trim()) return
    if (editingId) {
      persist(
        rituals.map(r => r.id === editingId ? { ...r, ...ritualForm, steps: formSteps } : r),
        practices
      )
      setEditingId(null)
      toastSuccess('Ritual refined — excellence compounds')
    } else {
      const newRitual: ExcellenceRitual = { id: uid(), steps: formSteps, ...ritualForm }
      persist([...rituals, newRitual], practices)
      toastSuccess('New ritual of excellence created')
    }
    setRitualForm(defaultRitualForm())
    setFormSteps([])
    setShowRitualForm(false)
  }

  const startEdit = (r: ExcellenceRitual) => {
    setRitualForm({ name: r.name, domain: r.domain, targetDuration: r.targetDuration, trigger: r.trigger, anchor: r.anchor, whyImportant: r.whyImportant, active: r.active })
    setFormSteps([...r.steps])
    setEditingId(r.id)
    setShowRitualForm(true)
    setActiveTab('designer')
  }

  const deleteRitual = (id: string) => {
    persist(rituals.filter(r => r.id !== id), practices.filter(p => p.ritualId !== id))
  }

  const addStep = () => {
    if (!newStep.action.trim()) return
    setFormSteps(s => [...s, { id: uid(), ...newStep }])
    setNewStep({ action: '', duration: 5, notes: '' })
  }

  const moveStep = (idx: number, dir: -1 | 1) => {
    setFormSteps(s => {
      const arr = [...s]
      const swapIdx = idx + dir
      if (swapIdx < 0 || swapIdx >= arr.length) return arr;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]]
      return arr
    })
  }

  const removeStep = (id: string) => {
    setFormSteps(s => s.filter(st => st.id !== id))
  }

  const getTodayPractice = (ritualId: string): RitualPractice | undefined => {
    return practices.find(p => p.ritualId === ritualId && p.date === todayStr())
  }

  const logPractice = (ritual: ExcellenceRitual, completed: boolean) => {
    const existing = getTodayPractice(ritual.id)
    const form = practiceForm[ritual.id] ?? { actualDuration: ritual.targetDuration, qualityRating: 7, modification: '' }
    if (existing) {
      const updated: RitualPractice = { ...existing, completed, actualDuration: form.actualDuration, qualityRating: form.qualityRating, modification: form.modification }
      persist(rituals, practices.map(p => p.id === existing.id ? updated : p))
    } else {
      const p: RitualPractice = {
        id: uid(),
        ritualId: ritual.id,
        date: todayStr(),
        completed,
        actualDuration: form.actualDuration,
        qualityRating: form.qualityRating,
        modification: form.modification,
      }
      persist(rituals, [...practices, p])
    }
    if (completed) toastSuccess(`${ritual.name} — excellence practiced!`)
  }

  const setPracticeField = (ritualId: string, field: keyof PracticeFormState, value: string | number) => {
    setPracticeForm(f => ({
      ...f,
      [ritualId]: { ...(f[ritualId] ?? { actualDuration: 0, qualityRating: 7, modification: '' }), [field]: value },
    }))
  }

  const activeRituals = rituals.filter(r => r.active)
  const todayDone = activeRituals.filter(r => getTodayPractice(r.id)?.completed).length
  const timelineRitual = rituals.find(r => r.id === timelineRitualId) ?? null

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <StarIcon className="w-6 h-6" style={{ color: '#10b981' }} />
            Rituals of Excellence
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Anchor excellence through intentional ritual</p>
        </div>
        <div className="game-card text-center px-4 py-2" style={{ borderColor: '#10b98133' }}>
          <div className="text-2xl font-bold" style={{ color: '#10b981', fontFamily: 'Orbitron, monospace' }}>
            {todayDone}/{activeRituals.length}
          </div>
          <div className="text-xs text-slate-400">Today</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['practice', 'designer', 'analytics', 'timeline', 'streaks'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-800'}`}
            style={activeTab === tab ? { background: '#10b981' } : {}}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'practice' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Today's Rituals</h2>
          {activeRituals.length === 0 && (
            <div className="game-card text-center py-10 text-slate-500">
              <StarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div>No active rituals yet</div>
              <div className="text-sm mt-1">Create rituals in the Designer tab</div>
            </div>
          )}
          {activeRituals.map(ritual => {
            const todayP = getTodayPractice(ritual.id)
            const isExpanded = selectedRitualId === ritual.id
            const pf = practiceForm[ritual.id] ?? { actualDuration: ritual.targetDuration, qualityRating: 7, modification: '' }

            return (
              <div key={ritual.id} className="game-card"
                style={{ borderColor: todayP?.completed ? '#10b98166' : undefined }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedRitualId(isExpanded ? null : ritual.id)}
                    className="flex-1 text-left flex items-center gap-2">
                    {todayP?.completed
                      ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} />
                      : <CircleIcon className="w-5 h-5 flex-shrink-0 text-slate-600" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{ritual.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded text-slate-900 font-medium"
                          style={{ background: DOMAIN_CONFIG[ritual.domain].color }}>
                          {DOMAIN_CONFIG[ritual.domain].label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {ritual.targetDuration}min · {ritual.steps.length} steps
                        {ritual.trigger && <> · {ritual.trigger}</>}
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(ritual)} className="p-1 text-slate-500 hover:text-emerald-400 rounded">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRitual(ritual.id)} className="p-1 text-slate-500 hover:text-red-400 rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-3">
                    {ritual.whyImportant && (
                      <div className="text-xs text-slate-400 italic">"{ritual.whyImportant}"</div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Actual Duration (min)</label>
                        <input type="number" className="game-input w-full text-sm" min={0}
                          value={pf.actualDuration}
                          onChange={e => setPracticeField(ritual.id, 'actualDuration', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Quality: {pf.qualityRating}/10</label>
                        <input type="range" min={1} max={10} value={pf.qualityRating}
                          onChange={e => setPracticeField(ritual.id, 'qualityRating', parseInt(e.target.value))}
                          className="w-full accent-emerald-400 mt-2" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Modification / Notes</label>
                      <input className="game-input w-full text-sm" value={pf.modification}
                        onChange={e => setPracticeField(ritual.id, 'modification', e.target.value)}
                        placeholder="Any changes made today…" />
                    </div>
                    {ritual.steps.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Steps</div>
                        <div className="space-y-1">
                          {ritual.steps.map((st, idx) => (
                            <div key={st.id} className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-4 h-4 rounded-full flex items-center justify-center text-slate-900 font-bold flex-shrink-0"
                                style={{ background: '#10b981', fontSize: 9 }}>{idx + 1}</span>
                              <span>{st.action}</span>
                              <span className="text-slate-500 ml-auto">{st.duration}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => logPractice(ritual, false)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-700 hover:bg-slate-600">
                        Skip
                      </button>
                      <button onClick={() => logPractice(ritual, true)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold text-slate-900"
                        style={{ background: '#10b981' }}>
                        <CheckIcon className="w-4 h-4 inline mr-1" />
                        Complete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'designer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Ritual Library ({rituals.length})</h2>
            <button onClick={() => { setShowRitualForm(true); setEditingId(null); setRitualForm(defaultRitualForm()); setFormSteps([]) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-900"
              style={{ background: '#10b981' }}>
              <PlusIcon className="w-4 h-4" /> New Ritual
            </button>
          </div>

          {showRitualForm && (
            <div className="game-card space-y-3" style={{ borderColor: '#10b98133' }}>
              <h3 className="font-semibold text-white">{editingId ? 'Edit Ritual' : 'Design New Ritual'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Name</label>
                  <input className="game-input w-full" value={ritualForm.name}
                    onChange={e => setRitualForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Morning Mastery, Deep Work…" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Domain</label>
                  <select className="game-input w-full" value={ritualForm.domain}
                    onChange={e => setRitualForm(f => ({ ...f, domain: e.target.value as ExcellenceRitual['domain'] }))}>
                    {Object.entries(DOMAIN_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Duration (min)</label>
                  <input type="number" className="game-input w-full" min={1} value={ritualForm.targetDuration}
                    onChange={e => setRitualForm(f => ({ ...f, targetDuration: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={ritualForm.active}
                      onChange={e => setRitualForm(f => ({ ...f, active: e.target.checked }))}
                      className="accent-emerald-400 w-4 h-4" />
                    <span className="text-sm text-slate-300">Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Trigger</label>
                <input className="game-input w-full" value={ritualForm.trigger}
                  onChange={e => setRitualForm(f => ({ ...f, trigger: e.target.value }))}
                  placeholder="What triggers this ritual…" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Anchor (habit stack)</label>
                <input className="game-input w-full" value={ritualForm.anchor}
                  onChange={e => setRitualForm(f => ({ ...f, anchor: e.target.value }))}
                  placeholder="After I [anchor]…" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Why Important</label>
                <textarea className="game-input w-full" rows={2} value={ritualForm.whyImportant}
                  onChange={e => setRitualForm(f => ({ ...f, whyImportant: e.target.value }))}
                  placeholder="The deeper purpose of this ritual…" />
              </div>

              <div className="border-t border-slate-700 pt-3">
                <div className="text-sm font-medium text-slate-300 mb-2">Steps ({formSteps.length})</div>
                {formSteps.map((st, idx) => (
                  <div key={st.id} className="flex items-center gap-2 mb-1.5 bg-slate-800 rounded-lg px-2 py-1.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-slate-900 font-bold flex-shrink-0"
                      style={{ background: '#10b981', fontSize: 9 }}>{idx + 1}</span>
                    <span className="flex-1 text-sm text-slate-200 truncate">{st.action}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">{st.duration}m</span>
                    <button onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                      className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveStep(idx, 1)} disabled={idx === formSteps.length - 1}
                      className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeStep(st.id)} className="p-0.5 text-slate-600 hover:text-red-400">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input className="game-input flex-1 text-sm" value={newStep.action}
                    onChange={e => setNewStep(s => ({ ...s, action: e.target.value }))}
                    placeholder="Step action…"
                    onKeyDown={e => e.key === 'Enter' && addStep()} />
                  <input type="number" className="game-input w-16 text-sm" min={1} value={newStep.duration}
                    onChange={e => setNewStep(s => ({ ...s, duration: parseInt(e.target.value) || 1 }))} />
                  <button onClick={addStep} className="px-2 py-1 rounded-lg text-slate-900"
                    style={{ background: '#10b981' }}>
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => { setShowRitualForm(false); setEditingId(null) }}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600">Cancel</button>
                <button onClick={saveRitual}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-900"
                  style={{ background: '#10b981' }}>Save Ritual</button>
              </div>
            </div>
          )}

          {rituals.length === 0 && (
            <div className="game-card text-center py-10 text-slate-500">
              <StarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div>No rituals designed yet</div>
            </div>
          )}

          {rituals.map(r => (
            <div key={r.id} className="game-card" style={{ borderColor: DOMAIN_CONFIG[r.domain].color + '33' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{r.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded text-slate-900 font-medium"
                      style={{ background: DOMAIN_CONFIG[r.domain].color }}>
                      {DOMAIN_CONFIG[r.domain].label}
                    </span>
                    {!r.active && <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-700 rounded">Inactive</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {r.targetDuration}min · {r.steps.length} steps
                    {r.trigger && <> · Trigger: {r.trigger}</>}
                  </div>
                  {r.anchor && <div className="text-xs text-slate-500 mt-0.5">Anchor: {r.anchor}</div>}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => startEdit(r)} className="p-1 text-slate-500 hover:text-emerald-400 rounded">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRitual(r.id)} className="p-1 text-slate-500 hover:text-red-400 rounded">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="game-card" style={{ borderColor: '#10b98133' }}>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <BarChartIcon className="w-5 h-5" style={{ color: '#10b981' }} />
              Completion Rate — Last 30 Days
            </h2>
            <p className="text-xs text-slate-400 mb-4">How consistently each ritual gets done</p>
            <div className="overflow-x-auto">
              <CompletionBarChart rituals={rituals} practices={practices} />
            </div>
          </div>

          {activeRituals.map(ritual => {
            const rPractices = practices.filter(p => p.ritualId === ritual.id && p.completed)
            const avgQ = rPractices.length > 0
              ? (rPractices.reduce((s, p) => s + p.qualityRating, 0) / rPractices.length).toFixed(1)
              : '—'
            const avgD = rPractices.length > 0
              ? Math.round(rPractices.reduce((s, p) => s + p.actualDuration, 0) / rPractices.length)
              : 0

            return (
              <div key={ritual.id} className="game-card" style={{ borderColor: DOMAIN_CONFIG[ritual.domain].color + '33' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">{ritual.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded text-slate-900"
                    style={{ background: DOMAIN_CONFIG[ritual.domain].color }}>
                    {DOMAIN_CONFIG[ritual.domain].label}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Avg Quality: <span className="font-bold" style={{ color: '#f59e0b' }}>{avgQ}</span></span>
                  <span>Avg Duration: <span className="font-bold text-slate-200">{avgD}m</span></span>
                  <span>Total sessions: <span className="font-bold text-slate-200">{rPractices.length}</span></span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="game-card" style={{ borderColor: '#10b98133' }}>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <ClockIcon className="w-5 h-5" style={{ color: '#10b981' }} />
              Step Timeline
            </h2>
            <p className="text-xs text-slate-400 mb-3">Select a ritual to see its step breakdown</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {rituals.map(r => (
                <button key={r.id} onClick={() => setTimelineRitualId(timelineRitualId === r.id ? null : r.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={timelineRitualId === r.id
                    ? { background: DOMAIN_CONFIG[r.domain].color, color: '#0f172a' }
                    : { background: '#1e293b', color: '#cbd5e1' }}>
                  {r.name}
                </button>
              ))}
            </div>

            {timelineRitual ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-300">
                  <span className="font-medium">{timelineRitual.name}</span>
                  <span className="text-slate-500 ml-2">
                    {timelineRitual.steps.reduce((s, st) => s + st.duration, 0)}min total
                  </span>
                </div>
                <div className="overflow-x-auto pb-2">
                  <StepTimelineBar steps={timelineRitual.steps} />
                </div>
                <div className="space-y-1 mt-2">
                  {timelineRitual.steps.map((st, idx) => (
                    <div key={st.id} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-slate-900 font-bold flex-shrink-0"
                        style={{ background: '#10b981', fontSize: 9 }}>{idx + 1}</span>
                      <span className="flex-1">{st.action}</span>
                      <span className="text-slate-500">{st.duration}m</span>
                      {st.notes && <span className="text-slate-600 italic">{st.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">Select a ritual above</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'streaks' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FlameIcon className="w-5 h-5" style={{ color: '#f59e0b' }} />
            Streaks
          </h2>
          {activeRituals.length === 0 && (
            <div className="text-center py-8 text-slate-500">No active rituals</div>
          )}
          {activeRituals.map(r => {
            const { current, best } = computeStreak(r.id, practices)
            const pct = best > 0 ? current / best : 0

            return (
              <div key={r.id} className="game-card" style={{ borderColor: DOMAIN_CONFIG[r.domain].color + '33' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-white">{r.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{DOMAIN_CONFIG[r.domain].label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: current > 0 ? '#f59e0b' : '#475569', fontFamily: 'Orbitron, monospace' }}>
                      {current}
                    </div>
                    <div className="text-xs text-slate-500">current</div>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct * 100}%`, background: '#f59e0b' }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0</span>
                  <span className="flex items-center gap-1">
                    <FlameIcon className="w-3 h-3" style={{ color: '#f59e0b' }} />
                    Best: {best} days
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
