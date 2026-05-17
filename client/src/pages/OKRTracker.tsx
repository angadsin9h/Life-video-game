import { Target, Plus, Trash2, Trophy, ChevronDown, Check, Edit2, X, Save } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'

interface KeyResult {
  id: string
  text: string
  target: number
  current: number
  unit: string
}

interface Objective {
  id: string
  title: string
  description: string
  quarter: string
  keyResults: KeyResult[]
  createdAt: string
}

const STORAGE_KEY = 'okr_tracker'

function getQuarters(): string[] {
  const now = new Date()
  const year = now.getFullYear()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  const quarters: string[] = []
  for (let offset = -2; offset <= 2; offset++) {
    let tq = q + offset
    let ty = year
    while (tq <= 0) { tq += 4; ty -= 1 }
    while (tq > 4)  { tq -= 4; ty += 1 }
    quarters.push(`Q${tq} ${ty}`)
  }
  return quarters
}

function getCurrentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `Q${q} ${now.getFullYear()}`
}

function krProgress(kr: KeyResult): number {
  if (kr.target <= 0) return 0
  return Math.min(100, Math.round((kr.current / kr.target) * 100))
}

function objectiveProgress(obj: Objective): number {
  if (obj.keyResults.length === 0) return 0
  const total = obj.keyResults.reduce((sum, kr) => sum + krProgress(kr), 0)
  return Math.round(total / obj.keyResults.length)
}

function progressColor(pct: number): string {
  if (pct >= 80) return 'text-green-400'
  if (pct >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function progressBarColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

function progressBorderColor(pct: number): string {
  if (pct >= 80) return 'border-green-500/30'
  if (pct >= 50) return 'border-yellow-500/30'
  return 'border-red-500/30'
}

function loadData(): Objective[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function persist(data: Objective[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const UNIT_OPTIONS = ['%', 'times', 'kg', 'lbs', 'hrs', 'days', 'km', 'miles', 'books', 'sessions', 'items', 'pts', 'calls', 'reps', 'custom']

// ── Inline key-result editor ──────────────────────────────────────────────────
interface KREditorProps {
  onAdd: (kr: Omit<KeyResult, 'id'>) => void
  onCancel: () => void
}

function KREditor({ onAdd, onCancel }: KREditorProps) {
  const [text, setText] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('%')
  const [customUnit, setCustomUnit] = useState('')

  const submit = () => {
    const t = parseFloat(target)
    if (!text.trim() || isNaN(t) || t <= 0) return
    onAdd({ text: text.trim(), target: t, current: 0, unit: unit === 'custom' ? customUnit.trim() || 'units' : unit })
  }

  return (
    <div className="mt-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
      <input
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Key result (e.g. Run 3x per week)"
        className="game-input w-full text-sm"
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Target"
          min={0}
          className="game-input w-28 text-sm"
        />
        <select value={unit} onChange={e => setUnit(e.target.value)} className="game-input flex-1 text-sm">
          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        {unit === 'custom' && (
          <input
            value={customUnit}
            onChange={e => setCustomUnit(e.target.value)}
            placeholder="unit name"
            className="game-input w-24 text-sm"
          />
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!text.trim() || !target || parseFloat(target) <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Add KR
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Key Result row ────────────────────────────────────────────────────────────
interface KRRowProps {
  kr: KeyResult
  onUpdateProgress: (id: string, current: number) => void
  onDelete: (id: string) => void
}

function KRRow({ kr, onUpdateProgress, onDelete }: KRRowProps) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(kr.current))
  const pct = krProgress(kr)

  const save = () => {
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0) onUpdateProgress(kr.id, n)
    setEditing(false)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-300 leading-snug">{kr.text}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {editing ? (
                <>
                  <input
                    autoFocus
                    type="number"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
                    className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs text-white"
                    min={0}
                  />
                  <span className="text-xs text-slate-500">{kr.unit}</span>
                  <button onClick={save} className="text-green-400 hover:text-green-300 transition-colors">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className={`text-xs font-semibold tabular-nums ${progressColor(pct)}`}>
                    {kr.current}/{kr.target} {kr.unit}
                  </span>
                  <button
                    onClick={() => { setVal(String(kr.current)); setEditing(true) }}
                    className="text-slate-600 hover:text-slate-400 transition-colors"
                    title="Edit progress"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDelete(kr.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors"
                    title="Delete key result"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBarColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums w-9 text-right ${progressColor(pct)}`}>{pct}%</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OKRTracker() {
  const { toastSuccess } = useToast()
  const quarters = getQuarters()
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter())
  const [objectives, setObjectives] = useState<Objective[]>(() => loadData())
  const [showQDropdown, setShowQDropdown] = useState(false)

  // New objective form
  const [showAddObj, setShowAddObj] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Per-objective KR add toggle: objId → boolean
  const [addingKRFor, setAddingKRFor] = useState<string | null>(null)

  const save = (updated: Objective[]) => {
    setObjectives(updated)
    persist(updated)
  }

  // ── Quarter objectives ──
  const quarterObjs = objectives.filter(o => o.quarter === selectedQuarter)

  // ── Stats ──
  const totalObjs = quarterObjs.length
  const avgCompletion = totalObjs > 0
    ? Math.round(quarterObjs.reduce((s, o) => s + objectiveProgress(o), 0) / totalObjs)
    : 0
  const fullyComplete = quarterObjs.filter(o => objectiveProgress(o) >= 100).length

  // ── Add objective ──
  const addObjective = () => {
    if (!newTitle.trim()) return
    const obj: Objective = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      quarter: selectedQuarter,
      keyResults: [],
      createdAt: new Date().toISOString(),
    }
    save([...objectives, obj])
    setNewTitle('')
    setNewDesc('')
    setShowAddObj(false)
    toastSuccess('Objective added!', `"${obj.title}" is now in ${selectedQuarter}`)
  }

  // ── Delete objective ──
  const deleteObjective = (id: string) => {
    save(objectives.filter(o => o.id !== id))
    toastSuccess('Objective removed')
  }

  // ── Add key result ──
  const addKeyResult = (objId: string, kr: Omit<KeyResult, 'id'>) => {
    const newKR: KeyResult = { ...kr, id: `${objId}_${Date.now()}` }
    save(objectives.map(o => o.id === objId ? { ...o, keyResults: [...o.keyResults, newKR] } : o))
    setAddingKRFor(null)
    toastSuccess('Key result added!')
  }

  // ── Delete key result ──
  const deleteKeyResult = (objId: string, krId: string) => {
    save(objectives.map(o => o.id === objId
      ? { ...o, keyResults: o.keyResults.filter(k => k.id !== krId) }
      : o
    ))
  }

  // ── Update KR progress ──
  const updateKRProgress = (objId: string, krId: string, current: number) => {
    save(objectives.map(o => o.id === objId
      ? { ...o, keyResults: o.keyResults.map(k => k.id === krId ? { ...k, current } : k) }
      : o
    ))
    toastSuccess('Progress updated!')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-white flex items-center gap-3"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Target className="w-8 h-8 text-violet-400" />
            OKR Tracker
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Objectives &amp; Key Results — quarter by quarter</p>
        </div>

        {/* Quarter selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowQDropdown(d => !d)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/50 text-slate-200 rounded-xl text-sm font-semibold transition-all"
          >
            <span>{selectedQuarter}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showQDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showQDropdown && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl min-w-[140px]">
              {quarters.map(q => (
                <button
                  key={q}
                  onClick={() => { setSelectedQuarter(q); setShowQDropdown(false) }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    q === selectedQuarter
                      ? 'bg-violet-600/20 text-violet-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {q}
                  {q === selectedQuarter && <Check className="w-3.5 h-3.5" />}
                  {q === getCurrentQuarter() && q !== selectedQuarter && (
                    <span className="text-xs text-slate-600">now</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {totalObjs > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {totalObjs}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Objectives</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className={`text-2xl font-bold ${progressColor(avgCompletion)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {avgCompletion}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Avg completion</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className={`text-2xl font-bold ${fullyComplete > 0 ? 'text-green-400' : 'text-slate-600'}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {fullyComplete}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Fully complete</div>
          </div>
        </div>
      )}

      {/* Overall progress bar (when there are objectives) */}
      {totalObjs > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className={`w-4 h-4 ${avgCompletion >= 80 ? 'text-yellow-400' : 'text-slate-600'}`} />
              <span className="text-sm font-semibold text-slate-200">{selectedQuarter} Progress</span>
            </div>
            <span className={`text-sm font-bold ${progressColor(avgCompletion)}`}>{avgCompletion}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressBarColor(avgCompletion)}`}
              style={{ width: `${avgCompletion}%` }}
            />
          </div>
          {avgCompletion >= 100 && (
            <p className="text-center text-green-400 text-sm font-semibold mt-2">
              All objectives achieved this quarter!
            </p>
          )}
        </div>
      )}

      {/* Add Objective button / form */}
      <div>
        {!showAddObj ? (
          <button
            onClick={() => setShowAddObj(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Objective
          </button>
        ) : (
          <div className="game-card p-5 border border-violet-500/30 space-y-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" /> New Objective — {selectedQuarter}
            </h3>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addObjective()}
              placeholder="Objective title (e.g. Ship v2 of the product)"
              className="game-input w-full"
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Why does this matter? (optional)"
              className="game-input w-full text-sm resize-none h-16"
            />
            <div className="flex gap-2">
              <button
                onClick={addObjective}
                disabled={!newTitle.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" /> Save Objective
              </button>
              <button
                onClick={() => { setShowAddObj(false); setNewTitle(''); setNewDesc('') }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm rounded-xl transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Objectives list */}
      {quarterObjs.length > 0 ? (
        <div className="space-y-4">
          {quarterObjs.map(obj => {
            const pct = objectiveProgress(obj)
            return (
              <div
                key={obj.id}
                className={`game-card p-5 border ${progressBorderColor(pct)} transition-all`}
              >
                {/* Objective header */}
                <div className="flex items-start gap-3">
                  {/* Circle progress indicator */}
                  <div className="relative w-12 h-12 flex-shrink-0 mt-0.5">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke={pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${pct * 0.88} 88`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                        {pct}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-white leading-snug">{obj.title}</h2>
                        {obj.description && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{obj.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-600">{obj.quarter}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-600">{obj.keyResults.length} key result{obj.keyResults.length !== 1 ? 's' : ''}</span>
                          {pct >= 100 && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full">
                              <Trophy className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteObjective(obj.id)}
                        className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        title="Delete objective"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key results */}
                {obj.keyResults.length > 0 && (
                  <div className="mt-4 space-y-3 pl-15">
                    <div className="border-t border-slate-800 pt-3 space-y-3">
                      {obj.keyResults.map(kr => (
                        <KRRow
                          key={kr.id}
                          kr={kr}
                          onUpdateProgress={(krId, current) => updateKRProgress(obj.id, krId, current)}
                          onDelete={krId => deleteKeyResult(obj.id, krId)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Add KR inline */}
                {addingKRFor === obj.id ? (
                  <div className="mt-3">
                    <KREditor
                      onAdd={kr => addKeyResult(obj.id, kr)}
                      onCancel={() => setAddingKRFor(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingKRFor(obj.id)}
                    className="mt-4 flex items-center gap-1.5 text-xs text-slate-600 hover:text-violet-400 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add key result
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-600">
          <Target className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium text-slate-500">No objectives for {selectedQuarter}</p>
          <p className="text-sm mt-1">Add your first objective to start tracking progress</p>
          {!showAddObj && (
            <button
              onClick={() => setShowAddObj(true)}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" /> Add First Objective
            </button>
          )}
        </div>
      )}

      {/* Help card */}
      {objectives.length === 0 && (
        <div className="game-card p-4 border border-violet-500/20">
          <h3 className="text-sm font-semibold text-violet-400 mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> How OKRs Work
          </h3>
          <ul className="text-xs text-slate-500 space-y-1.5">
            <li>• An <span className="text-slate-400 font-medium">Objective</span> is a qualitative goal — ambitious and inspiring</li>
            <li>• <span className="text-slate-400 font-medium">Key Results</span> are measurable outcomes that define success</li>
            <li>• Aim for 2–5 key results per objective</li>
            <li>• Green = 80%+, Yellow = 50–79%, Red = below 50%</li>
            <li>• Review and update your progress weekly</li>
          </ul>
        </div>
      )}
    </div>
  )
}
