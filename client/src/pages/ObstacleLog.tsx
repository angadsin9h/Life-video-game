import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, Trash2, Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ObstacleStatus = 'active' | 'overcome' | 'accepted'

interface Obstacle {
  id: string
  title: string
  category: string
  severity: number
  status: ObstacleStatus
  notes: string
  strategy: string
  outcome: string
  createdAt: string
  resolvedAt: string
}

const CATEGORIES = [
  'Work', 'Health', 'Finance', 'Relationships', 'Mental', 'Physical', 'Learning', 'Other',
]

const CATEGORY_COLORS: Record<string, string> = {
  'Work':          'bg-blue-900/60 text-blue-300 border-blue-500/40',
  'Health':        'bg-green-900/60 text-green-300 border-green-500/40',
  'Finance':       'bg-emerald-900/60 text-emerald-300 border-emerald-500/40',
  'Relationships': 'bg-pink-900/60 text-pink-300 border-pink-500/40',
  'Mental':        'bg-violet-900/60 text-violet-300 border-violet-500/40',
  'Physical':      'bg-orange-900/60 text-orange-300 border-orange-500/40',
  'Learning':      'bg-cyan-900/60 text-cyan-300 border-cyan-500/40',
  'Other':         'bg-slate-700/60 text-slate-300 border-slate-500/40',
}

const STORAGE_KEY = 'obstacle_log'

const EMPTY_FORM = {
  title: '',
  category: 'Work',
  severity: 3,
  notes: '',
  strategy: '',
}

function severityColor(s: number): string {
  if (s <= 1) return 'bg-green-500'
  if (s <= 2) return 'bg-lime-500'
  if (s <= 3) return 'bg-amber-500'
  if (s <= 4) return 'bg-orange-500'
  return 'bg-red-500'
}

function severityTextColor(s: number): string {
  if (s <= 1) return 'text-green-400'
  if (s <= 2) return 'text-lime-400'
  if (s <= 3) return 'text-amber-400'
  if (s <= 4) return 'text-orange-400'
  return 'text-red-400'
}

function severityLabel(s: number): string {
  if (s <= 1) return 'Minor'
  if (s <= 2) return 'Low'
  if (s <= 3) return 'Moderate'
  if (s <= 4) return 'High'
  return 'Critical'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ObstacleLog() {
  const { toastSuccess } = useToast()
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [outcomeTarget, setOutcomeTarget] = useState<string | null>(null)
  const [outcomeText, setOutcomeText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setObstacles(JSON.parse(saved))
      } catch {
        setObstacles([])
      }
    }
  }, [])

  const save = (updated: Obstacle[]) => {
    setObstacles(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addObstacle = () => {
    if (!form.title.trim()) return
    const newOb: Obstacle = {
      id: Date.now().toString(),
      title: form.title.trim(),
      category: form.category,
      severity: form.severity,
      status: 'active',
      notes: form.notes.trim(),
      strategy: form.strategy.trim(),
      outcome: '',
      createdAt: new Date().toISOString(),
      resolvedAt: '',
    }
    save([newOb, ...obstacles])
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Obstacle logged. You got this!')
  }

  const markOvercome = (id: string) => {
    setOutcomeTarget(id)
    setOutcomeText('')
  }

  const confirmOvercome = () => {
    if (!outcomeTarget) return
    save(
      obstacles.map(ob =>
        ob.id === outcomeTarget
          ? { ...ob, status: 'overcome' as ObstacleStatus, outcome: outcomeText.trim(), resolvedAt: new Date().toISOString() }
          : ob
      )
    )
    toastSuccess('Obstacle overcome! Great work!')
    setOutcomeTarget(null)
    setOutcomeText('')
  }

  const markAccepted = (id: string) => {
    save(
      obstacles.map(ob =>
        ob.id === id
          ? { ...ob, status: 'accepted' as ObstacleStatus, resolvedAt: new Date().toISOString() }
          : ob
      )
    )
    toastSuccess('Obstacle accepted. Wisdom unlocked.')
  }

  const deleteObstacle = (id: string) => {
    save(obstacles.filter(ob => ob.id !== id))
    toastSuccess('Obstacle removed from log.')
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const active = obstacles.filter(ob => ob.status === 'active')
  const resolved = obstacles.filter(ob => ob.status !== 'active')
  const overcomeCount = obstacles.filter(ob => ob.status === 'overcome').length
  const overcomeRate = obstacles.length > 0 ? Math.round((overcomeCount / obstacles.length) * 100) : 0
  const avgSeverity = obstacles.length > 0
    ? (obstacles.reduce((sum, ob) => sum + ob.severity, 0) / obstacles.length).toFixed(1)
    : '—'

  const renderCard = (ob: Obstacle) => {
    const isExpanded = expandedId === ob.id
    const isResolved = ob.status !== 'active'
    const catColor = CATEGORY_COLORS[ob.category] ?? CATEGORY_COLORS['Other']

    return (
      <div
        key={ob.id}
        className={`game-card p-4 transition-all ${isResolved ? 'opacity-60' : ''}`}
      >
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Severity bar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
            <div className="flex flex-col-reverse gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <div
                  key={s}
                  className={`w-2.5 h-2.5 rounded-sm ${s <= ob.severity ? severityColor(ob.severity) : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500">{ob.severity}/5</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
                {ob.category}
              </span>
              {ob.status === 'overcome' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-900/60 text-green-300 border-green-500/40">
                  Overcome
                </span>
              )}
              {ob.status === 'accepted' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-700/60 text-slate-300 border-slate-500/40">
                  Accepted
                </span>
              )}
              <span className={`text-xs ml-auto font-semibold ${isResolved ? 'text-slate-500' : severityTextColor(ob.severity)}`}>
                {severityLabel(ob.severity)}
              </span>
            </div>

            <h3 className={`text-base font-bold ${isResolved ? 'text-slate-400 line-through' : 'text-white'}`}>
              {ob.title}
            </h3>

            <p className="text-xs text-slate-500 mt-0.5">
              Logged {formatDate(ob.createdAt)}
              {ob.resolvedAt ? ` · Resolved ${formatDate(ob.resolvedAt)}` : ''}
            </p>

            {ob.strategy && (
              <p className="text-sm text-slate-400 mt-2 italic">
                Strategy: {ob.strategy}
              </p>
            )}

            {ob.status === 'overcome' && ob.outcome && (
              <p className="text-sm text-green-400 mt-1">
                Outcome: {ob.outcome}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isResolved && (
              <>
                <button
                  onClick={() => markOvercome(ob.id)}
                  title="Mark as overcome"
                  className="p-1.5 rounded-lg bg-green-900/40 hover:bg-green-800/60 text-green-400 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => markAccepted(ob.id)}
                  title="Accept obstacle"
                  className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600/60 text-slate-400 transition-colors text-xs font-semibold px-2"
                >
                  Accept
                </button>
              </>
            )}
            <button
              onClick={() => toggleExpand(ob.id)}
              title="Toggle details"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              {isExpanded
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
              }
            </button>
            <button
              onClick={() => deleteObstacle(ob.id)}
              title="Delete"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded notes */}
        {isExpanded && ob.notes && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-slate-300">{ob.notes}</p>
          </div>
        )}

        {isExpanded && !ob.notes && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 italic">No additional notes.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Obstacle Log
          </h1>
          <p className="text-slate-400 mt-1">Track challenges and celebrate every victory</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Log Obstacle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {obstacles.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total Tracked</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {overcomeCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Overcome</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {overcomeRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Success Rate</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgSeverity}
          </div>
          <div className="text-xs text-slate-400 mt-1">Avg Severity</div>
        </div>
      </div>

      {/* Add Obstacle Form */}
      {showForm && (
        <div className="game-card p-5 border border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Log New Obstacle</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Obstacle Title *</label>
                <input
                  className="game-input w-full"
                  placeholder="e.g. Struggling with burnout"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  className="game-input w-full"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Severity: {form.severity}/5 — {severityLabel(form.severity)}
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: Number(e.target.value) }))}
                className="w-full accent-red-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Strategy to address it</label>
              <input
                className="game-input w-full"
                placeholder="What's your plan of attack?"
                value={form.strategy}
                onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <textarea
                className="game-input w-full resize-none"
                rows={3}
                placeholder="Additional context, feelings, or details..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addObstacle}
                disabled={!form.title.trim()}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                Log Obstacle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overcome outcome modal */}
      {outcomeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="game-card p-6 w-full max-w-md border border-green-500/30">
            <h3 className="text-lg font-bold text-white mb-2">How did you overcome it?</h3>
            <p className="text-sm text-slate-400 mb-4">
              Share the outcome — this helps you reflect and inspires future you.
            </p>
            <textarea
              className="game-input w-full resize-none mb-4"
              rows={3}
              placeholder="What worked? What did you learn?"
              value={outcomeText}
              onChange={e => setOutcomeText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOutcomeTarget(null)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmOvercome}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark Overcome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Obstacle List */}
      {obstacles.length === 0 ? (
        <div className="game-card p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No obstacles logged</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Life throws challenges at everyone. Log an obstacle to start tracking it — awareness is the first step to overcoming it.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
          >
            Log your first obstacle
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active section */}
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Active Obstacles ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map(ob => renderCard(ob))}
              </div>
            </div>
          )}

          {/* Resolved section */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Resolved ({resolved.length})
              </h2>
              <div className="space-y-3">
                {resolved.map(ob => renderCard(ob))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
