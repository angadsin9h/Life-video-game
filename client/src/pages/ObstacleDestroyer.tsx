import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { Shield, Flame, Target, Plus, X, Trophy, AlertCircle, RefreshCw, CheckCircle2, Circle, TrendingUp } from 'lucide-react'

const OBSTACLE_TYPES = [
  'Fear', 'Skill Gap', 'Resource Constraint', 'Relationship Issue',
  'Health Challenge', 'Mental Block', 'External Circumstance', 'Time', 'Money', 'Confidence',
]

const HOW_LONG_OPTIONS = ['Just appeared', 'Days', 'Weeks', 'Months', 'Years']

const STORAGE_KEY = 'obstacle_destroyer_log'

interface ObstacleEntry {
  id: string
  createdAt: string
  status: 'Active' | 'Destroyed'
  obstacleTitle: string
  obstacleType: string
  howBigIsThis: number
  howLongStuck: string
  whatYouTried: string
  rootCause: string
  worstCase: string
  bestCase: string
  reframe: string
  nextBoldMove: string
  resourcesNeeded: string
  whoCanHelp: string
  obstacleScore: number
}

const EMPTY_FORM = {
  obstacleTitle: '',
  obstacleType: 'Fear',
  howBigIsThis: 5,
  howLongStuck: 'Just appeared',
  whatYouTried: '',
  rootCause: '',
  worstCase: '',
  bestCase: '',
  reframe: '',
  nextBoldMove: '',
  resourcesNeeded: '',
  whoCanHelp: '',
}

type FormState = typeof EMPTY_FORM

function computeScore(form: FormState): number {
  const base = (10 - form.howBigIsThis) * 10
  const bonus = form.nextBoldMove.trim() ? 10 : 0
  return Math.min(100, base + bonus)
}

function typeColor(t: string): string {
  const map: Record<string, string> = {
    'Fear': 'bg-red-900/60 text-red-300 border-red-500/40',
    'Skill Gap': 'bg-blue-900/60 text-blue-300 border-blue-500/40',
    'Resource Constraint': 'bg-amber-900/60 text-amber-300 border-amber-500/40',
    'Relationship Issue': 'bg-pink-900/60 text-pink-300 border-pink-500/40',
    'Health Challenge': 'bg-green-900/60 text-green-300 border-green-500/40',
    'Mental Block': 'bg-violet-900/60 text-violet-300 border-violet-500/40',
    'External Circumstance': 'bg-slate-700/60 text-slate-300 border-slate-500/40',
    'Time': 'bg-cyan-900/60 text-cyan-300 border-cyan-500/40',
    'Money': 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40',
    'Confidence': 'bg-orange-900/60 text-orange-300 border-orange-500/40',
  }
  return map[t] ?? 'bg-slate-700/60 text-slate-300 border-slate-500/40'
}

export default function ObstacleDestroyer() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ObstacleEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {
      setEntries([])
    }
  }, [])

  const save = (updated: ObstacleEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleSubmit = () => {
    if (!form.obstacleTitle.trim()) return
    const entry: ObstacleEntry = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'Active',
      ...form,
      obstacleScore: computeScore(form),
    }
    save([entry, ...entries])
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Obstacle logged. Time to destroy it!')
  }

  const markDestroyed = (id: string) => {
    save(entries.map(e => e.id === id ? { ...e, status: 'Destroyed' as const } : e))
    toastSuccess('Obstacle destroyed! You are unstoppable!')
  }

  const destroyedCount = entries.filter(e => e.status === 'Destroyed').length
  const last5 = entries.slice(0, 5)

  const typeCounts: Record<string, number> = {}
  entries.forEach(e => { typeCounts[e.obstacleType] = (typeCounts[e.obstacleType] ?? 0) + 1 })
  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-8 h-8 text-violet-400" />
            Obstacle Destroyer
          </h1>
          <p className="text-slate-400 mt-1">Turn obstacles into fuel. Every challenge is training.</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Obstacle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{entries.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Logged</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{destroyedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Obstacles Destroyed</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-sm font-bold text-amber-400 truncate" style={{ fontFamily: 'Orbitron, monospace' }}>{mostCommonType}</div>
          <div className="text-xs text-slate-400 mt-1">Most Common Type</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-5 border border-violet-500/30 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-violet-400" />
              Name Your Obstacle
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Obstacle Title *</label>
              <input
                className="game-input w-full"
                placeholder="e.g. Fear of public speaking"
                value={form.obstacleTitle}
                onChange={e => setForm(f => ({ ...f, obstacleTitle: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Obstacle Type</label>
              <select
                className="game-input w-full"
                value={form.obstacleType}
                onChange={e => setForm(f => ({ ...f, obstacleType: e.target.value }))}
              >
                {OBSTACLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Perceived Size: {form.howBigIsThis}/10
              </label>
              <input
                type="range" min={1} max={10} value={form.howBigIsThis}
                onChange={e => setForm(f => ({ ...f, howBigIsThis: Number(e.target.value) }))}
                className="w-full accent-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">How Long Stuck?</label>
              <select
                className="game-input w-full"
                value={form.howLongStuck}
                onChange={e => setForm(f => ({ ...f, howLongStuck: e.target.value }))}
              >
                {HOW_LONG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">What You've Already Tried</label>
            <textarea
              className="game-input w-full resize-none"
              rows={2}
              placeholder="List everything you've attempted..."
              value={form.whatYouTried}
              onChange={e => setForm(f => ({ ...f, whatYouTried: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Root Cause</label>
              <input
                className="game-input w-full"
                placeholder="The real reason this exists..."
                value={form.rootCause}
                onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Who Can Help?</label>
              <input
                className="game-input w-full"
                placeholder="Person, mentor, community..."
                value={form.whoCanHelp}
                onChange={e => setForm(f => ({ ...f, whoCanHelp: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Worst Case (if nothing changes)</label>
              <input
                className="game-input w-full"
                placeholder="What happens if you stay stuck?"
                value={form.worstCase}
                onChange={e => setForm(f => ({ ...f, worstCase: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Best Case (if you destroy this)</label>
              <input
                className="game-input w-full"
                placeholder="What becomes possible?"
                value={form.bestCase}
                onChange={e => setForm(f => ({ ...f, bestCase: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Reframe — What if this obstacle IS the training?</label>
            <input
              className="game-input w-full"
              placeholder="How might this challenge be exactly what you need?"
              value={form.reframe}
              onChange={e => setForm(f => ({ ...f, reframe: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Next Bold Move (next 24 hours) +10 score bonus</label>
            <input
              className="game-input w-full"
              placeholder="One action you will take TODAY..."
              value={form.nextBoldMove}
              onChange={e => setForm(f => ({ ...f, nextBoldMove: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Resources Needed</label>
            <input
              className="game-input w-full"
              placeholder="Tools, knowledge, time, money..."
              value={form.resourcesNeeded}
              onChange={e => setForm(f => ({ ...f, resourcesNeeded: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Obstacle Score: <span className="text-violet-400 font-bold text-lg">{computeScore(form)}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setForm(EMPTY_FORM); setShowForm(false) }}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.obstacleTitle.trim()}
                className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                Log Obstacle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Obstacles */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          Recent Obstacles (last 5)
        </h2>

        {last5.length === 0 ? (
          <div className="game-card p-10 text-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">No obstacles logged yet. Every hero has obstacles. Name yours.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold text-sm transition-colors"
            >
              Log Your First Obstacle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {last5.map(entry => (
              <div key={entry.id} className="game-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {entry.status === 'Destroyed'
                      ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                      : <Circle className="w-5 h-5 text-slate-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor(entry.obstacleType)}`}>
                        {entry.obstacleType}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        entry.status === 'Destroyed'
                          ? 'bg-green-900/60 text-green-300 border-green-500/40'
                          : 'bg-amber-900/60 text-amber-300 border-amber-500/40'
                      }`}>
                        {entry.status}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className={`text-base font-bold ${entry.status === 'Destroyed' ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {entry.obstacleTitle}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-slate-500">Size: {entry.howBigIsThis}/10</span>
                      <span className="text-xs text-slate-500">Stuck: {entry.howLongStuck}</span>
                      <span className="text-xs text-violet-400 font-semibold">Score: {entry.obstacleScore}</span>
                    </div>
                    {entry.nextBoldMove && (
                      <p className="text-xs text-amber-400 mt-1">Bold Move: {entry.nextBoldMove}</p>
                    )}
                  </div>
                  {entry.status === 'Active' && (
                    <button
                      onClick={() => markDestroyed(entry.id)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-900/40 hover:bg-green-800/60 text-green-400 text-xs font-semibold transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Destroy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {entries.length > 5 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
          <TrendingUp className="w-4 h-4" />
          {entries.length - 5} more obstacles in history
        </div>
      )}

      {/* Reframe reminder */}
      <div className="game-card p-4 border border-violet-500/20 bg-violet-900/10">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-300">The Destroyer's Mindset</p>
            <p className="text-xs text-slate-400 mt-1">
              Every obstacle you face is sharpening you. The size of your challenge is a measure of the level you're operating at.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
