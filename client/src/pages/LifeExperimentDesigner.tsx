import { useState, useEffect, useMemo } from 'react'
import { FlaskConical, Plus, Trash2, Save, Zap, BarChart3, ChevronDown, ChevronUp, RefreshCw, Calendar, CheckCircle, Target, Lightbulb } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExperimentCheckIn {
  date: string
  day: number
  score: 1 | 2 | 3 | 4 | 5
  notes: string
  completed: boolean
}

interface LifeExperiment {
  id: string
  title: string
  hypothesis: string
  action: string
  duration: number
  category: 'health' | 'productivity' | 'relationships' | 'mindset' | 'finance' | 'creativity' | 'habits' | 'nutrition' | 'sleep'
  startDate: string
  endDate: string
  status: 'planned' | 'active' | 'completed' | 'abandoned'
  checkIns: ExperimentCheckIn[]
  'hypothesis_result': string
  conclusion: string
  wouldRepeat: boolean | null
  tags: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'life_experiment_designer'

const CATEGORY_CONFIG: Record<LifeExperiment['category'], { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',        emoji: '💪', color: '#ef4444' },
  productivity:  { label: 'Productivity',  emoji: '⚡', color: '#f59e0b' },
  relationships: { label: 'Relationships', emoji: '💝', color: '#ec4899' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#a855f7' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#22c55e' },
  creativity:    { label: 'Creativity',    emoji: '🎨', color: '#f97316' },
  habits:        { label: 'Habits',        emoji: '🔄', color: '#3b82f6' },
  nutrition:     { label: 'Nutrition',     emoji: '🥗', color: '#84cc16' },
  sleep:         { label: 'Sleep',         emoji: '😴', color: '#6366f1' },
}

const STATUS_COLORS: Record<LifeExperiment['status'], string> = {
  planned:   '#94a3b8',
  active:    '#22c55e',
  completed: '#3b82f6',
  abandoned: '#ef4444',
}

const today = () => new Date().toISOString().split('T')[0]

const addDays = (date: string, days: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const daysBetween = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.ceil(ms / 86400000))
}

// ─── Blank form ───────────────────────────────────────────────────────────────

type ExpForm = {
  title: string
  hypothesis: string
  action: string
  duration: number
  category: LifeExperiment['category']
  startDate: string
  tagInput: string
  tags: string[]
}

const blankForm = (): ExpForm => ({
  title: '',
  hypothesis: '',
  action: '',
  duration: 30,
  category: 'habits',
  startDate: today(),
  tagInput: '',
  tags: [],
})

// ─── Component ───────────────────────────────────────────────────────────────

export default function LifeExperimentDesigner() {
  const { toastSuccess } = useToast()

  const [experiments, setExperiments] = useState<LifeExperiment[]>([])
  const [activeTab, setActiveTab] = useState<'design' | 'active' | 'planned' | 'completed' | 'stats'>('design')
  const [form, setForm] = useState<ExpForm>(blankForm())

  // per-experiment expanded state
  const [expandedCheckIns, setExpandedCheckIns] = useState<Record<string, boolean>>({})

  // check-in forms per active experiment
  const [checkInForms, setCheckInForms] = useState<Record<string, { completed: boolean; score: 1|2|3|4|5; notes: string }>>({})

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setExperiments(JSON.parse(raw) as LifeExperiment[])
    } catch { /* ignore */ }
  }, [])

  const persist = (updated: LifeExperiment[]) => {
    setExperiments(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // ─── Form helpers ─────────────────────────────────────────────────────────

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && form.tagInput.trim()) {
      e.preventDefault()
      const tag = form.tagInput.trim()
      if (!form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag], tagInput: '' }))
      else setForm(f => ({ ...f, tagInput: '' }))
    }
  }

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))

  // ─── Save new experiment ─────────────────────────────────────────────────

  const saveExperiment = () => {
    if (!form.title.trim() || !form.hypothesis.trim()) return
    const end = addDays(form.startDate, form.duration)
    const exp: LifeExperiment = {
      id: Date.now().toString(),
      title: form.title.trim(),
      hypothesis: form.hypothesis.trim(),
      action: form.action.trim(),
      duration: form.duration,
      category: form.category,
      startDate: form.startDate,
      endDate: end,
      status: 'planned',
      checkIns: [],
      'hypothesis_result': '',
      conclusion: '',
      wouldRepeat: null,
      tags: form.tags,
    }
    persist([exp, ...experiments])
    setForm(blankForm())
    toastSuccess('Experiment designed! 🔬')
  }

  // ─── Experiment actions ───────────────────────────────────────────────────

  const startExperiment = (id: string) => {
    persist(experiments.map(e => {
      if (e.id !== id) return e
      const start = today()
      return { ...e, status: 'active', startDate: start, endDate: addDays(start, e.duration) }
    }))
    toastSuccess('Experiment started! Good luck 🔬')
  }

  const abandonExperiment = (id: string) => {
    persist(experiments.map(e => e.id === id ? { ...e, status: 'abandoned' } : e))
  }

  const completeExperiment = (id: string) => {
    persist(experiments.map(e => e.id === id ? { ...e, status: 'completed' } : e))
    toastSuccess('Experiment completed! Time to reflect.')
  }

  const deleteExperiment = (id: string) => {
    persist(experiments.filter(e => e.id !== id))
  }

  const updateExperiment = (id: string, patch: Partial<LifeExperiment>) => {
    persist(experiments.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  // ─── Check-in ────────────────────────────────────────────────────────────

  const logCheckIn = (expId: string) => {
    const cf = checkInForms[expId] ?? { completed: true, score: 3 as const, notes: '' }
    const exp = experiments.find(e => e.id === expId)
    if (!exp) return
    const dayNum = daysBetween(exp.startDate, today()) + 1
    const ci: ExperimentCheckIn = {
      date: today(),
      day: dayNum,
      score: cf.score,
      notes: cf.notes,
      completed: cf.completed,
    }
    const updated = experiments.map(e => {
      if (e.id !== expId) return e
      const checkIns = [...e.checkIns.filter(c => c.date !== today()), ci]
      return { ...e, checkIns }
    })
    persist(updated)
    setCheckInForms(f => ({ ...f, [expId]: { completed: true, score: 3, notes: '' } }))
    toastSuccess('Day logged! Keep going 💪')
  }

  // ─── Derived ─────────────────────────────────────────────────────────────

  const active = experiments.filter(e => e.status === 'active')
  const planned = experiments.filter(e => e.status === 'planned')
  const completed = experiments.filter(e => e.status === 'completed')

  const stats = useMemo(() => {
    const ran = experiments.filter(e => e.status === 'completed' || e.status === 'abandoned')
    const completionRates = completed.map(e => {
      const rate = e.duration > 0 ? (e.checkIns.filter(c => c.completed).length / e.duration) * 100 : 0
      return rate
    })
    const avgCompletion = completionRates.length > 0
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0
    const catCounts: Partial<Record<LifeExperiment['category'], number>> = {}
    ran.forEach(e => { catCounts[e.category] = (catCounts[e.category] ?? 0) + 1 })
    let topCat: LifeExperiment['category'] = 'habits'
    let topCount = 0
    ;(Object.entries(catCounts) as [LifeExperiment['category'], number][]).forEach(([k, v]) => {
      if (v > topCount) { topCat = k; topCount = v }
    })
    const insightsCount = completed.filter(e => e.conclusion.trim().length > 0).length
    return { totalRan: ran.length, avgCompletion, topCat, insightsCount }
  }, [experiments, completed])

  // ─── SVG Gantt chart ─────────────────────────────────────────────────────

  const GanttChart = () => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startRef = sixMonthsAgo.toISOString().split('T')[0]
    const endRef = today()
    const totalDays = daysBetween(startRef, endRef) || 1

    const visible = experiments.filter(e => e.endDate >= startRef && e.startDate <= endRef)
    if (visible.length === 0) return (
      <div className="text-center py-6 text-slate-600 text-xs">No experiments in the last 6 months</div>
    )

    const rowH = 20
    const labelW = 80
    const W = 300
    const chartW = W - labelW - 8
    const H = visible.length * rowH + 20

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: `${H}px` }}>
        {/* month grid lines */}
        {[0, 1, 2, 3, 4, 5, 6].map(m => {
          const d = new Date(sixMonthsAgo)
          d.setMonth(d.getMonth() + m)
          const label = d.toLocaleDateString('en-US', { month: 'short' })
          const dayOffset = daysBetween(startRef, d.toISOString().split('T')[0])
          const x = labelW + (dayOffset / totalDays) * chartW
          return (
            <g key={m}>
              <line x1={x} y1={0} x2={x} y2={H - 12} stroke="#334155" strokeWidth="0.5" />
              <text x={x} y={H} fill="#475569" fontSize="7" textAnchor="middle">{label}</text>
            </g>
          )
        })}

        {visible.map((exp, i) => {
          const cfg = CATEGORY_CONFIG[exp.category]
          const s = Math.max(0, daysBetween(startRef, exp.startDate))
          const e = Math.min(totalDays, daysBetween(startRef, exp.endDate))
          const x = labelW + (s / totalDays) * chartW
          const barW = Math.max(4, ((e - s) / totalDays) * chartW)
          const y = i * rowH + 4

          return (
            <g key={exp.id}>
              <text x={0} y={y + 11} fill="#94a3b8" fontSize="8" dominantBaseline="middle">
                {exp.title.slice(0, 10)}{exp.title.length > 10 ? '…' : ''}
              </text>
              <rect
                x={x} y={y} width={barW} height={14}
                fill={cfg.color + '66'} stroke={cfg.color} strokeWidth="1" rx="3"
              />
              <text x={x + 3} y={y + 9} fill={cfg.color} fontSize="7" dominantBaseline="middle">
                {cfg.emoji}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  // ─── Helpers to render score stars ────────────────────────────────────────

  const avgScore = (exp: LifeExperiment) => {
    if (exp.checkIns.length === 0) return 0
    return Math.round((exp.checkIns.reduce((s, c) => s + c.score, 0) / exp.checkIns.length) * 10) / 10
  }

  const completionRate = (exp: LifeExperiment) => {
    if (exp.duration <= 0) return 0
    return Math.round((exp.checkIns.filter(c => c.completed).length / exp.duration) * 100)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FlaskConical className="w-7 h-7 text-cyan-400" />
            Life Experiment Designer
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Treat your life like a lab. Design, run, and learn from experiments.</p>
        </div>
      </div>

      {/* Stats pills */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-2">
          <div className="text-lg font-bold text-cyan-400">{experiments.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-2">
          <div className="text-lg font-bold text-green-400">{active.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-2">
          <div className="text-lg font-bold text-blue-400">{completed.length}</div>
          <div className="text-xs text-slate-500">Done</div>
        </div>
        <div className="game-card p-2">
          <div className="text-lg font-bold text-yellow-400">{stats.insightsCount}</div>
          <div className="text-xs text-slate-500">Insights</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl overflow-x-auto">
        {([
          { key: 'design',    label: 'Design',    icon: FlaskConical },
          { key: 'active',    label: `Active (${active.length})`,   icon: Zap },
          { key: 'planned',   label: `Planned (${planned.length})`,  icon: Calendar },
          { key: 'completed', label: 'Completed', icon: CheckCircle },
          { key: 'stats',     label: 'Stats',     icon: BarChart3 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === key ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Design */}
      {activeTab === 'design' && (
        <div className="game-card p-4 space-y-4 border border-cyan-500/20">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            Design New Experiment
          </h3>

          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Experiment title *"
            className="game-input w-full text-sm"
            autoFocus
          />

          <textarea
            value={form.hypothesis}
            onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))}
            placeholder="I believe that if I ___, then ___ will happen *"
            className="game-input w-full text-sm resize-none"
            rows={2}
          />

          <textarea
            value={form.action}
            onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="Specifically, I will... (concrete action)"
            className="game-input w-full text-sm resize-none"
            rows={2}
          />

          {/* Category chips */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [LifeExperiment['category'], typeof CATEGORY_CONFIG.health][]).map(([k, cfg]) => {
                const selected = form.category === k
                return (
                  <button
                    key={k}
                    onClick={() => setForm(f => ({ ...f, category: k }))}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={
                      selected
                        ? { background: cfg.color + '33', color: cfg.color, border: `1px solid ${cfg.color}` }
                        : { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
                    }
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="game-input w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="game-input w-full text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tags (press Enter to add)</label>
            <input
              value={form.tagInput}
              onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
              onKeyDown={handleTagKey}
              placeholder="e.g. morning, energy"
              className="game-input w-full text-sm"
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={saveExperiment}
            disabled={!form.title.trim() || !form.hypothesis.trim()}
            className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Design Experiment
          </button>
        </div>
      )}

      {/* Tab: Active */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {active.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Zap className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No active experiments. Start one from Planned!</p>
            </div>
          )}
          {active.map(exp => {
            const cfg = CATEGORY_CONFIG[exp.category]
            const daysIn = daysBetween(exp.startDate, today()) + 1
            const pct = Math.min(100, Math.round((daysIn / exp.duration) * 100))
            const cf = checkInForms[exp.id] ?? { completed: true, score: 3 as const, notes: '' }
            const todayCheckedIn = exp.checkIns.some(c => c.date === today())
            const expanded = expandedCheckIns[exp.id] ?? false

            return (
              <div key={exp.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{cfg.emoji}</span>
                      <span className="text-sm font-semibold text-white">{exp.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cfg.color + '20', color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 italic">{exp.hypothesis}</p>
                  </div>
                  <button onClick={() => deleteExperiment(exp.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Day {Math.min(daysIn, exp.duration)} / {exp.duration}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">Started {exp.startDate} · Ends {exp.endDate}</div>
                </div>

                {/* Today's check-in */}
                <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-cyan-400" />
                    Today's Check-In
                    {todayCheckedIn && <span className="text-green-400 ml-1">✓ Logged</span>}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cf.completed}
                      onChange={e => setCheckInForms(f => ({ ...f, [exp.id]: { ...cf, completed: e.target.checked } }))}
                      className="rounded"
                    />
                    Did the experiment action today?
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-10">Score:</span>
                    {([1, 2, 3, 4, 5] as const).map(n => (
                      <button
                        key={n}
                        onClick={() => setCheckInForms(f => ({ ...f, [exp.id]: { ...cf, score: n } }))}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          cf.score === n
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input
                    value={cf.notes}
                    onChange={e => setCheckInForms(f => ({ ...f, [exp.id]: { ...cf, notes: e.target.value } }))}
                    placeholder="Notes for today..."
                    className="game-input w-full text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => logCheckIn(exp.id)}
                      className="flex-1 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Log Day {Math.min(daysIn, exp.duration)}
                    </button>
                    <button
                      onClick={() => completeExperiment(exp.id)}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => abandonExperiment(exp.id)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-xs"
                    >
                      Abandon
                    </button>
                  </div>
                </div>

                {/* Check-ins expandable */}
                {exp.checkIns.length > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedCheckIns(s => ({ ...s, [exp.id]: !expanded }))}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                    >
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {exp.checkIns.length} check-in{exp.checkIns.length !== 1 ? 's' : ''} · avg score {avgScore(exp)}/5
                    </button>
                    {expanded && (
                      <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                        {[...exp.checkIns].sort((a, b) => b.day - a.day).map(ci => (
                          <div key={ci.date} className="flex items-center gap-2 text-xs bg-slate-800/40 rounded px-2 py-1">
                            <span className="text-slate-500 w-14 flex-shrink-0">Day {ci.day}</span>
                            <span className={ci.completed ? 'text-green-400' : 'text-slate-600'}>
                              {ci.completed ? '✓' : '✗'}
                            </span>
                            <span className="text-yellow-400">{'★'.repeat(ci.score)}</span>
                            {ci.notes && <span className="text-slate-400 truncate">{ci.notes}</span>}
                            <span className="text-slate-600 ml-auto flex-shrink-0">{ci.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Planned */}
      {activeTab === 'planned' && (
        <div className="space-y-3">
          {planned.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No planned experiments. Design one in the Design tab!</p>
            </div>
          )}
          {planned.map(exp => {
            const cfg = CATEGORY_CONFIG[exp.category]
            return (
              <div key={exp.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${STATUS_COLORS.planned}` }}>
                <span className="text-xl">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{exp.title}</div>
                  <div className="text-xs text-slate-500 truncate">{exp.hypothesis}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-600">{exp.duration} days</span>
                    {exp.tags.map(t => (
                      <span key={t} className="text-xs text-cyan-600">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => startExperiment(exp.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Start
                  </button>
                  <button onClick={() => deleteExperiment(exp.id)} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Completed */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completed.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Complete some experiments to see results here.</p>
            </div>
          )}
          {completed.map(exp => {
            const cfg = CATEGORY_CONFIG[exp.category]
            const cr = completionRate(exp)
            const as_ = avgScore(exp)
            const result = exp['hypothesis_result']
            const resultBadge = result === 'confirmed'
              ? { label: '✅ Confirmed', color: '#22c55e' }
              : result === 'rejected'
              ? { label: '❌ Rejected', color: '#ef4444' }
              : { label: '🤔 Inconclusive', color: '#94a3b8' }

            return (
              <div key={exp.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${STATUS_COLORS.completed}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{cfg.emoji}</span>
                      <span className="text-sm font-semibold text-white">{exp.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: resultBadge.color + '20', color: resultBadge.color }}>
                        {resultBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 italic">{exp.hypothesis}</p>
                  </div>
                  <button onClick={() => deleteExperiment(exp.id)} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-4 text-xs text-center">
                  <div>
                    <div className="font-bold text-blue-400">{exp.duration}d</div>
                    <div className="text-slate-600">Duration</div>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-400">{as_}/5</div>
                    <div className="text-slate-600">Avg Score</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-400">{cr}%</div>
                    <div className="text-slate-600">Completion</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-300">{exp.checkIns.length}</div>
                    <div className="text-slate-600">Check-ins</div>
                  </div>
                </div>

                {/* Hypothesis result */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Was the hypothesis confirmed?</label>
                  <select
                    value={exp['hypothesis_result']}
                    onChange={e => updateExperiment(exp.id, { 'hypothesis_result': e.target.value })}
                    className="game-input w-full text-xs"
                  >
                    <option value="">— Select result —</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="rejected">❌ Rejected</option>
                    <option value="inconclusive">🤔 Inconclusive</option>
                  </select>
                </div>

                {/* Conclusion */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Conclusion / Key Insight</label>
                  <textarea
                    value={exp.conclusion}
                    onChange={e => updateExperiment(exp.id, { conclusion: e.target.value })}
                    placeholder="What did you learn? What will you change?"
                    className="game-input w-full text-xs resize-none"
                    rows={2}
                  />
                </div>

                {/* Would repeat */}
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exp.wouldRepeat === true}
                    onChange={e => updateExperiment(exp.id, { wouldRepeat: e.target.checked })}
                  />
                  I would repeat this experiment
                </label>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Experiments Run', value: stats.totalRan, color: 'text-cyan-400' },
              { label: 'Avg Completion Rate', value: `${stats.avgCompletion}%`, color: 'text-green-400' },
              { label: 'Most Tested Category', value: CATEGORY_CONFIG[stats.topCat]?.emoji + ' ' + CATEGORY_CONFIG[stats.topCat]?.label, color: 'text-yellow-400' },
              { label: 'Insights Gained', value: stats.insightsCount, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="game-card p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Gantt chart */}
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Experiment Timeline (last 6 months)
            </h3>
            <GanttChart />
          </div>

          {/* Category breakdown */}
          {experiments.length > 0 && (
            <div className="game-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Experiments by Category
              </h3>
              {(Object.entries(CATEGORY_CONFIG) as [LifeExperiment['category'], typeof CATEGORY_CONFIG.health][]).map(([k, cfg]) => {
                const count = experiments.filter(e => e.category === k).length
                if (count === 0) return null
                const pct = Math.round((count / experiments.length) * 100)
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
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
