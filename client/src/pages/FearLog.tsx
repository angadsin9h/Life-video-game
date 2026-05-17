import { useState, useEffect } from 'react'
import { AlertCircle, Plus, Trash2, Check, ChevronDown, ChevronUp, Star, Shield, Eye } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FearCategory = 'Social' | 'Performance' | 'Failure' | 'Health' | 'Loss' | 'Unknown' | 'Other'
type FearStatus = 'Active' | 'Facing' | 'Overcome'

interface ExposureEntry {
  id: string
  date: string
  action: string
  outcome: string
  courage: number
}

interface Fear {
  id: string
  title: string
  description: string
  category: FearCategory
  severity: number
  status: FearStatus
  createdAt: string
  exposures: ExposureEntry[]
}

const CATEGORIES: FearCategory[] = ['Social', 'Performance', 'Failure', 'Health', 'Loss', 'Unknown', 'Other']
const STORAGE_KEY = 'fear_log'

const CAT_COLORS: Record<FearCategory, string> = {
  Social: '#3b82f6',
  Performance: '#f59e0b',
  Failure: '#ef4444',
  Health: '#22c55e',
  Loss: '#8b5cf6',
  Unknown: '#6366f1',
  Other: '#64748b',
}

const STATUS_COLORS: Record<FearStatus, string> = {
  Active: '#ef4444',
  Facing: '#f97316',
  Overcome: '#22c55e',
}

const STATUS_ORDER: Record<FearStatus, number> = { Active: 0, Facing: 1, Overcome: 2 }

function severityColor(s: number): string {
  if (s <= 3) return '#22c55e'
  if (s <= 5) return '#eab308'
  if (s <= 7) return '#f97316'
  return '#ef4444'
}

function severityLabel(s: number): string {
  if (s <= 2) return 'Mild'
  if (s <= 4) return 'Moderate'
  if (s <= 6) return 'High'
  if (s <= 8) return 'Severe'
  return 'Extreme'
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

const EMPTY_FEAR = {
  title: '',
  description: '',
  category: 'Social' as FearCategory,
  severity: 5,
  status: 'Active' as FearStatus,
}

const EMPTY_EXPOSURE = {
  date: today(),
  action: '',
  outcome: '',
  courage: 3,
}

export default function FearLog() {
  const { toastSuccess } = useToast()
  const [fears, setFears] = useState<Fear[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [exposureTarget, setExposureTarget] = useState<string | null>(null)
  const [fearForm, setFearForm] = useState({ ...EMPTY_FEAR })
  const [expForm, setExpForm] = useState({ ...EMPTY_EXPOSURE })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setFears(JSON.parse(saved))
    } catch { /**/ }
  }, [])

  const persist = (updated: Fear[]) => {
    setFears(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addFear = () => {
    if (!fearForm.title.trim()) return
    const fear: Fear = {
      id: Date.now().toString(),
      title: fearForm.title.trim(),
      description: fearForm.description.trim(),
      category: fearForm.category,
      severity: fearForm.severity,
      status: fearForm.status,
      createdAt: today(),
      exposures: [],
    }
    persist([fear, ...fears])
    setFearForm({ ...EMPTY_FEAR })
    setShowAddForm(false)
    toastSuccess('Fear logged. Naming it is the first act of courage.')
  }

  const deleteFear = (id: string) => {
    persist(fears.filter(f => f.id !== id))
  }

  const updateStatus = (id: string, status: FearStatus) => {
    const updated = fears.map(f => f.id === id ? { ...f, status } : f)
    persist(updated)
    if (status === 'Overcome') toastSuccess('Fear overcome! That took real courage.')
  }

  const logExposure = (fearId: string) => {
    if (!expForm.action.trim()) return
    const entry: ExposureEntry = {
      id: Date.now().toString(),
      date: expForm.date,
      action: expForm.action.trim(),
      outcome: expForm.outcome.trim(),
      courage: expForm.courage,
    }
    const updated = fears.map(f =>
      f.id === fearId ? { ...f, exposures: [...f.exposures, entry] } : f
    )
    persist(updated)
    setExpForm({ ...EMPTY_EXPOSURE })
    setExposureTarget(null)
    toastSuccess('Exposure logged. Every step counts.')
  }

  const deleteExposure = (fearId: string, expId: string) => {
    const updated = fears.map(f =>
      f.id === fearId ? { ...f, exposures: f.exposures.filter(e => e.id !== expId) } : f
    )
    persist(updated)
  }

  const sorted = [...fears].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (statusDiff !== 0) return statusDiff
    return b.severity - a.severity
  })

  // Stats
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const overcomeFears = fears.filter(f => f.status === 'Overcome')
  const allExposures = fears.flatMap(f => f.exposures)
  const exposuresThisMonth = allExposures.filter(e => e.date >= monthStart)
  const avgCourage = allExposures.length > 0
    ? +(allExposures.reduce((s, e) => s + e.courage, 0) / allExposures.length).toFixed(1)
    : 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-orange-400" />
            Fear Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Name your fears. Face them. Overcome them.</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setExposureTarget(null) }}
          className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Fear
        </button>
      </div>

      {/* Stats */}
      {fears.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-slate-200">{fears.length}</div>
            <div className="text-xs text-slate-500">Fears Named</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-green-400">{overcomeFears.length}</div>
            <div className="text-xs text-slate-500">Overcome</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-orange-400">{exposuresThisMonth.length}</div>
            <div className="text-xs text-slate-500">Exposures / Mo</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">{avgCourage > 0 ? avgCourage : '—'}</div>
            <div className="text-xs text-slate-500">Avg Courage</div>
          </div>
        </div>
      )}

      {/* Add Fear Form */}
      {showAddForm && (
        <div className="game-card p-5 space-y-4 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-300">Name a New Fear</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-300 text-xs">cancel</button>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fear title *</label>
            <input
              value={fearForm.title}
              onChange={e => setFearForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Public speaking, Being rejected, Getting sick..."
              className="game-input w-full"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addFear()}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <textarea
              value={fearForm.description}
              onChange={e => setFearForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What specifically frightens you? When does it arise?"
              className="game-input w-full h-16 resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setFearForm(f => ({ ...f, category: c }))}
                    className="px-2 py-1 rounded-lg text-xs transition-all"
                    style={fearForm.category === c
                      ? { background: CAT_COLORS[c] + '30', color: CAT_COLORS[c], border: `1px solid ${CAT_COLORS[c]}` }
                      : { background: '#1e293b', color: '#64748b' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">Initial Status</label>
              <div className="flex flex-col gap-1.5">
                {(['Active', 'Facing', 'Overcome'] as FearStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setFearForm(f => ({ ...f, status: s }))}
                    className="px-2 py-1 rounded-lg text-xs text-left transition-all"
                    style={fearForm.status === s
                      ? { background: STATUS_COLORS[s] + '25', color: STATUS_COLORS[s], border: `1px solid ${STATUS_COLORS[s]}` }
                      : { background: '#1e293b', color: '#64748b' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="text-slate-400">Severity</label>
              <span className="font-bold" style={{ color: severityColor(fearForm.severity) }}>
                {fearForm.severity}/10 — {severityLabel(fearForm.severity)}
              </span>
            </div>
            <input
              type="range" min="1" max="10"
              value={fearForm.severity}
              onChange={e => setFearForm(f => ({ ...f, severity: +e.target.value }))}
              className="w-full accent-orange-400"
            />
          </div>

          <button
            onClick={addFear}
            className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <AlertCircle className="w-4 h-4 inline mr-1.5" />Log Fear
          </button>
        </div>
      )}

      {/* Fear List */}
      <div className="space-y-3">
        {sorted.map(fear => {
          const isExpanded = expanded === fear.id
          const isLogging = exposureTarget === fear.id
          const isOvercome = fear.status === 'Overcome'

          return (
            <div
              key={fear.id}
              className="game-card overflow-hidden"
              style={{
                borderLeft: `3px solid ${severityColor(fear.severity)}`,
                opacity: isOvercome ? 0.7 : 1,
              }}
            >
              {/* Card header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : fear.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isOvercome && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      <span className={`text-sm font-semibold ${isOvercome ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {fear.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: CAT_COLORS[fear.category] + '20', color: CAT_COLORS[fear.category] }}
                      >
                        {fear.category}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: STATUS_COLORS[fear.status] + '20', color: STATUS_COLORS[fear.status] }}
                      >
                        {fear.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium" style={{ color: severityColor(fear.severity) }}>
                        Severity {fear.severity}/10
                      </span>
                      {fear.exposures.length > 0 && (
                        <span className="text-[10px] text-slate-500">
                          {fear.exposures.length} exposure{fear.exposures.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    <button
                      onClick={e => { e.stopPropagation(); deleteFear(fear.id) }}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Severity bar */}
                <div className="mt-2 h-1 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${fear.severity * 10}%`, background: severityColor(fear.severity) }}
                  />
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-3">
                  {fear.description && (
                    <p className="text-sm text-slate-400">{fear.description}</p>
                  )}

                  {/* Status controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    {(['Active', 'Facing', 'Overcome'] as FearStatus[]).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(fear.id, s)}
                        className="px-2 py-0.5 rounded-lg text-xs transition-all"
                        style={fear.status === s
                          ? { background: STATUS_COLORS[s] + '25', color: STATUS_COLORS[s], border: `1px solid ${STATUS_COLORS[s]}` }
                          : { background: '#1e293b', color: '#475569' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Exposure attempts */}
                  {fear.exposures.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Exposure Log</div>
                      {fear.exposures.map(exp => (
                        <div key={exp.id} className="bg-slate-800/50 rounded-xl p-3 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs text-slate-500">{exp.date}</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <Star
                                      key={n}
                                      className="w-3 h-3"
                                      style={{ color: n <= exp.courage ? '#f59e0b' : '#334155', fill: n <= exp.courage ? '#f59e0b' : 'none' }}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-500">courage</span>
                              </div>
                              <p className="text-sm text-slate-300">{exp.action}</p>
                              {exp.outcome && <p className="text-xs text-slate-500 mt-0.5">{exp.outcome}</p>}
                            </div>
                            <button
                              onClick={() => deleteExposure(fear.id, exp.id)}
                              className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Log exposure button / form */}
                  {!isOvercome && (
                    <>
                      {isLogging ? (
                        <div className="space-y-3 bg-slate-800/40 rounded-xl p-3">
                          <div className="text-xs text-orange-400 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            Log Exposure
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Date</label>
                              <input
                                type="date"
                                value={expForm.date}
                                onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
                                className="game-input w-full text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Courage Rating</label>
                              <div className="flex gap-1 pt-1">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button
                                    key={n}
                                    onClick={() => setExpForm(f => ({ ...f, courage: n }))}
                                    className="transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className="w-5 h-5"
                                      style={{ color: n <= expForm.courage ? '#f59e0b' : '#334155', fill: n <= expForm.courage ? '#f59e0b' : 'none' }}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">What did you do to face it? *</label>
                            <textarea
                              value={expForm.action}
                              onChange={e => setExpForm(f => ({ ...f, action: e.target.value }))}
                              placeholder="Describe the action you took..."
                              className="game-input w-full h-16 resize-none text-sm"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Outcome</label>
                            <textarea
                              value={expForm.outcome}
                              onChange={e => setExpForm(f => ({ ...f, outcome: e.target.value }))}
                              placeholder="What happened? What did you learn?"
                              className="game-input w-full h-12 resize-none text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => logExposure(fear.id)}
                              className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Save Exposure
                            </button>
                            <button
                              onClick={() => { setExposureTarget(null); setExpForm({ ...EMPTY_EXPOSURE }) }}
                              className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setExposureTarget(fear.id); setExpForm({ ...EMPTY_EXPOSURE }) }}
                          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Log Exposure
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {fears.length === 0 && !showAddForm && (
        <div className="text-center py-16 text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1">No fears logged yet.</p>
          <p className="text-sm mb-5">Naming a fear is the first step to overcoming it.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log Your First Fear
          </button>
        </div>
      )}
    </div>
  )
}
