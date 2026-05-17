import { useState, useEffect, useCallback } from 'react'
import {
  Target, Plus, Trash2, TrendingUp, Check,
  ChevronDown, ChevronUp, Star, Calendar, X, Flag
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ConfidenceLevel = 'On Track' | 'At Risk' | 'Off Track'
type LifeArea = 'Work' | 'Health' | 'Finance' | 'Relationships' | 'Growth' | 'Other'
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

interface KeyResult {
  id: string
  description: string
  currentValue: number
  targetValue: number
  unit: string
  confidence: ConfidenceLevel
  lifeArea: LifeArea
}

interface CheckIn {
  id: string
  week: string
  updates: Record<string, number>
  note: string
  createdAt: string
}

interface Objective {
  id: string
  title: string
  keyResults: KeyResult[]
}

interface QuarterlyOKR {
  id: string
  quarter: Quarter
  year: number
  objective: Objective
  checkIns: CheckIn[]
  createdAt: string
  archived: boolean
}

const STORAGE_KEY = 'personal_okr'
const LIFE_AREAS: LifeArea[] = ['Work', 'Health', 'Finance', 'Relationships', 'Growth', 'Other']
const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  'On Track': 'text-green-400 bg-green-900/30 border-green-500/40',
  'At Risk': 'text-yellow-400 bg-yellow-900/30 border-yellow-500/40',
  'Off Track': 'text-red-400 bg-red-900/30 border-red-500/40',
}

const AREA_COLORS: Record<LifeArea, string> = {
  Work: 'text-blue-400 bg-blue-900/20',
  Health: 'text-green-400 bg-green-900/20',
  Finance: 'text-yellow-400 bg-yellow-900/20',
  Relationships: 'text-pink-400 bg-pink-900/20',
  Growth: 'text-purple-400 bg-purple-900/20',
  Other: 'text-slate-400 bg-slate-800',
}

function getCurrentQuarter(): { quarter: Quarter; year: number } {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  if (month < 3) return { quarter: 'Q1', year }
  if (month < 6) return { quarter: 'Q2', year }
  if (month < 9) return { quarter: 'Q3', year }
  return { quarter: 'Q4', year }
}

function getCurrentWeek(): string {
  const now = new Date()
  const start = new Date(now)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)
  return start.toISOString().split('T')[0]
}

function krCompletion(kr: KeyResult): number {
  if (kr.targetValue === 0) return 0
  return Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
}

function okrScore(krs: KeyResult[]): number {
  if (krs.length === 0) return 0
  const total = krs.reduce((sum, kr) => sum + krCompletion(kr), 0)
  return Math.round(total / krs.length)
}

function blankKR(id: string): KeyResult {
  return {
    id,
    description: '',
    currentValue: 0,
    targetValue: 100,
    unit: '%',
    confidence: 'On Track',
    lifeArea: 'Work',
  }
}

function blankOKR(quarter: Quarter, year: number): QuarterlyOKR {
  return {
    id: Date.now().toString(),
    quarter,
    year,
    objective: {
      id: 'obj-' + Date.now(),
      title: '',
      keyResults: [
        blankKR('kr-1-' + Date.now()),
        blankKR('kr-2-' + Date.now()),
        blankKR('kr-3-' + Date.now()),
      ],
    },
    checkIns: [],
    createdAt: new Date().toISOString(),
    archived: false,
  }
}

function loadOKRs(): QuarterlyOKR[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveOKRs(okrs: QuarterlyOKR[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(okrs))
}

export default function PersonalOKR() {
  const { toastSuccess } = useToast()
  const { quarter: currentQ, year: currentYear } = getCurrentQuarter()

  const [okrs, setOKRs] = useState<QuarterlyOKR[]>([])
  const [activeOKR, setActiveOKR] = useState<QuarterlyOKR | null>(null)

  // New OKR form
  const [newQuarter, setNewQuarter] = useState<Quarter>(currentQ)
  const [newYear, setNewYear] = useState<number>(currentYear)
  const [showNewForm, setShowNewForm] = useState(false)

  // Check-in form
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkInValues, setCheckInValues] = useState<Record<string, string>>({})
  const [checkInNote, setCheckInNote] = useState('')

  // History
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [expandedKR, setExpandedKR] = useState<string | null>(null)

  const load = useCallback(() => {
    const all = loadOKRs()
    setOKRs(all)
    const active = all.find(o => o.quarter === currentQ && o.year === currentYear && !o.archived)
    setActiveOKR(active || null)
  }, [currentQ, currentYear])

  useEffect(() => { load() }, [load])

  const persist = (updated: QuarterlyOKR, all: QuarterlyOKR[]) => {
    const idx = all.findIndex(o => o.id === updated.id)
    const next = idx >= 0
      ? all.map(o => o.id === updated.id ? updated : o)
      : [...all, updated]
    saveOKRs(next)
    setOKRs(next)
    setActiveOKR(updated)
  }

  const createOKR = () => {
    const existing = okrs.find(o => o.quarter === newQuarter && o.year === newYear && !o.archived)
    if (existing) {
      setActiveOKR(existing)
      setShowNewForm(false)
      return
    }
    const okr = blankOKR(newQuarter, newYear)
    const all = loadOKRs()
    const next = [...all, okr]
    saveOKRs(next)
    setOKRs(next)
    setActiveOKR(okr)
    setShowNewForm(false)
    toastSuccess('OKR created!', `${newQuarter} ${newYear}`)
  }

  const updateObjectiveTitle = (title: string) => {
    if (!activeOKR) return
    persist({ ...activeOKR, objective: { ...activeOKR.objective, title } }, okrs)
  }

  const updateKR = (krId: string, patch: Partial<KeyResult>) => {
    if (!activeOKR) return
    const updated = {
      ...activeOKR,
      objective: {
        ...activeOKR.objective,
        keyResults: activeOKR.objective.keyResults.map(kr =>
          kr.id === krId ? { ...kr, ...patch } : kr
        ),
      },
    }
    persist(updated, okrs)
  }

  const addKR = () => {
    if (!activeOKR) return
    if (activeOKR.objective.keyResults.length >= 5) return
    const kr = blankKR('kr-' + Date.now())
    const updated = {
      ...activeOKR,
      objective: {
        ...activeOKR.objective,
        keyResults: [...activeOKR.objective.keyResults, kr],
      },
    }
    persist(updated, okrs)
  }

  const removeKR = (krId: string) => {
    if (!activeOKR) return
    const updated = {
      ...activeOKR,
      objective: {
        ...activeOKR.objective,
        keyResults: activeOKR.objective.keyResults.filter(kr => kr.id !== krId),
      },
    }
    persist(updated, okrs)
  }

  const submitCheckIn = () => {
    if (!activeOKR) return
    const updates: Record<string, number> = {}
    activeOKR.objective.keyResults.forEach(kr => {
      const val = parseFloat(checkInValues[kr.id] || '')
      if (!isNaN(val)) updates[kr.id] = val
    })

    // Apply updates to KR current values
    const updatedKRs = activeOKR.objective.keyResults.map(kr => ({
      ...kr,
      currentValue: updates[kr.id] !== undefined ? updates[kr.id] : kr.currentValue,
    }))

    const checkIn: CheckIn = {
      id: Date.now().toString(),
      week: getCurrentWeek(),
      updates,
      note: checkInNote,
      createdAt: new Date().toISOString(),
    }

    const updated: QuarterlyOKR = {
      ...activeOKR,
      objective: { ...activeOKR.objective, keyResults: updatedKRs },
      checkIns: [...activeOKR.checkIns, checkIn],
    }

    persist(updated, okrs)
    setCheckInValues({})
    setCheckInNote('')
    setShowCheckIn(false)
    toastSuccess('Check-in saved!', 'KR values updated.')
  }

  const archiveOKR = () => {
    if (!activeOKR) return
    const updated = { ...activeOKR, archived: true }
    persist(updated, okrs)
    setActiveOKR(null)
    toastSuccess('OKR archived')
  }

  const score = activeOKR ? okrScore(activeOKR.objective.keyResults) : 0
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'

  const pastOKRs = okrs.filter(o => o.archived || (o.quarter !== currentQ || o.year !== currentYear))
    .sort((a, b) => {
      const qa = parseInt(a.quarter.slice(1))
      const qb = parseInt(b.quarter.slice(1))
      return b.year !== a.year ? b.year - a.year : qb - qa
    })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-emerald-400" />
            Personal OKR
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Quarterly Objectives & Key Results</p>
        </div>
        <div className="flex gap-2">
          {activeOKR && (
            <button
              onClick={() => setShowCheckIn(true)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Weekly Check-in
            </button>
          )}
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            New OKR
          </button>
        </div>
      </div>

      {/* New OKR form */}
      {showNewForm && (
        <div className="game-card p-4 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-emerald-300">Create OKR</span>
            <button onClick={() => setShowNewForm(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <select
              value={newQuarter}
              onChange={e => setNewQuarter(e.target.value as Quarter)}
              className="game-input flex-1"
            >
              {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <select
              value={newYear}
              onChange={e => setNewYear(parseInt(e.target.value))}
              className="game-input flex-1"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={createOKR}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* No active OKR */}
      {!activeOKR && !showNewForm && (
        <div className="game-card p-8 text-center">
          <Flag className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold mb-1">No OKR for {currentQ} {currentYear}</p>
          <p className="text-slate-500 text-sm mb-4">Define your quarterly objective and key results.</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Create {currentQ} OKR
          </button>
        </div>
      )}

      {/* Active OKR */}
      {activeOKR && (
        <>
          {/* Quarter badge + OKR Score */}
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-emerald-400">
                  {activeOKR.quarter} {activeOKR.year}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">OKR Score</span>
                <span
                  className="text-xl font-black"
                  style={{ color: scoreColor, fontFamily: 'Orbitron, monospace' }}
                >
                  {score}%
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, backgroundColor: scoreColor }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0%</span>
              <span className={score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500'}>
                {score >= 70 ? 'Strong' : score >= 40 ? 'Progressing' : 'Needs focus'}
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* Objective */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Objective</span>
            </div>
            <input
              placeholder="e.g. Become a healthier, more productive version of myself…"
              value={activeOKR.objective.title}
              onChange={e => updateObjectiveTitle(e.target.value)}
              className="game-input w-full text-base font-semibold"
            />
          </div>

          {/* Key Results */}
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Key Results ({activeOKR.objective.keyResults.length}/5)
                </span>
              </div>
              {activeOKR.objective.keyResults.length < 5 && (
                <button
                  onClick={addKR}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add KR
                </button>
              )}
            </div>

            <div className="space-y-4">
              {activeOKR.objective.keyResults.map((kr, idx) => {
                const pct = krCompletion(kr)
                const isExpanded = expandedKR === kr.id
                return (
                  <div key={kr.id} className="border border-slate-700/60 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedKR(isExpanded ? null : kr.id)}
                      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-600 flex-shrink-0">KR{idx + 1}</span>
                        <span className="text-sm text-slate-300 truncate">
                          {kr.description || 'Untitled key result'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${CONFIDENCE_COLORS[kr.confidence]}`}
                        >
                          {kr.confidence}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">{pct}%</span>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-500" />
                          : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-4 pt-2 border-t border-slate-700/50 space-y-3">
                        {/* Description */}
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Description</label>
                          <input
                            placeholder="Measurable result…"
                            value={kr.description}
                            onChange={e => updateKR(kr.id, { description: e.target.value })}
                            className="game-input w-full text-sm"
                          />
                        </div>

                        {/* Values */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Current</label>
                            <input
                              type="number"
                              value={kr.currentValue}
                              onChange={e => updateKR(kr.id, { currentValue: parseFloat(e.target.value) || 0 })}
                              className="game-input w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Target</label>
                            <input
                              type="number"
                              value={kr.targetValue}
                              onChange={e => updateKR(kr.id, { targetValue: parseFloat(e.target.value) || 0 })}
                              className="game-input w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Unit</label>
                            <input
                              placeholder="%, hrs, $…"
                              value={kr.unit}
                              onChange={e => updateKR(kr.id, { unit: e.target.value })}
                              className="game-input w-full text-sm"
                            />
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <div className="text-xs text-slate-600 mt-1 text-right">
                            {kr.currentValue} / {kr.targetValue} {kr.unit}
                          </div>
                        </div>

                        {/* Confidence + Life Area */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Confidence</label>
                            <select
                              value={kr.confidence}
                              onChange={e => updateKR(kr.id, { confidence: e.target.value as ConfidenceLevel })}
                              className="game-input w-full text-sm"
                            >
                              {(['On Track', 'At Risk', 'Off Track'] as ConfidenceLevel[]).map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Life Area</label>
                            <select
                              value={kr.lifeArea}
                              onChange={e => updateKR(kr.id, { lifeArea: e.target.value as LifeArea })}
                              className="game-input w-full text-sm"
                            >
                              {LIFE_AREAS.map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Life area badge */}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${AREA_COLORS[kr.lifeArea]}`}>
                            {kr.lifeArea}
                          </span>
                          {activeOKR.objective.keyResults.length > 1 && (
                            <button
                              onClick={() => removeKR(kr.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors flex items-center gap-1 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove KR
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Life Area alignment summary */}
          <div className="game-card p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Alignment by Life Area
            </div>
            <div className="flex flex-wrap gap-2">
              {activeOKR.objective.keyResults.map(kr => (
                <div key={kr.id} className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${AREA_COLORS[kr.lifeArea]}`}>
                    {kr.lifeArea}
                  </span>
                  <span className="text-xs text-slate-500">{krCompletion(kr)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Check-in form */}
          {showCheckIn && (
            <div className="game-card p-5 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-emerald-300">Weekly Check-in</div>
                  <div className="text-xs text-slate-500">Week of {getCurrentWeek()}</div>
                </div>
                <button onClick={() => setShowCheckIn(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {activeOKR.objective.keyResults.map(kr => (
                  <div key={kr.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex-1 truncate">{kr.description || 'KR'}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-slate-600">was {kr.currentValue}{kr.unit}</span>
                      <input
                        type="number"
                        placeholder="new value"
                        value={checkInValues[kr.id] || ''}
                        onChange={e => setCheckInValues(prev => ({ ...prev, [kr.id]: e.target.value }))}
                        className="game-input w-24 text-sm text-right"
                      />
                      <span className="text-xs text-slate-500 w-6">{kr.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                rows={2}
                placeholder="Check-in note (optional)…"
                value={checkInNote}
                onChange={e => setCheckInNote(e.target.value)}
                className="game-input w-full text-sm resize-none mb-3"
              />

              <div className="flex gap-2">
                <button
                  onClick={submitCheckIn}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Save Check-in
                </button>
                <button
                  onClick={() => setShowCheckIn(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Check-in history */}
          {activeOKR.checkIns.length > 0 && (
            <div className="game-card p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Check-in History ({activeOKR.checkIns.length})
              </div>
              <div className="space-y-2">
                {[...activeOKR.checkIns].reverse().slice(0, 5).map(ci => (
                  <div key={ci.id} className="flex items-start gap-3 py-2 border-b border-slate-700/40 last:border-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-400 font-medium">Week of {ci.week}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {activeOKR.objective.keyResults.map(kr =>
                          ci.updates[kr.id] !== undefined ? (
                            <span key={kr.id} className="text-xs text-slate-500">
                              {kr.description
                                ? kr.description.slice(0, 20) + (kr.description.length > 20 ? '…' : '')
                                : 'KR'}
                              : <span className="text-emerald-400 font-semibold">{ci.updates[kr.id]}{kr.unit}</span>
                            </span>
                          ) : null
                        )}
                      </div>
                      {ci.note && <div className="text-xs text-slate-600 italic mt-1">"{ci.note}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archive button */}
          <div className="flex justify-end">
            <button
              onClick={archiveOKR}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Archive this OKR
            </button>
          </div>
        </>
      )}

      {/* Historical quarters */}
      {pastOKRs.length > 0 && (
        <div className="game-card p-4">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Past Quarters ({pastOKRs.length})
            </div>
            {historyExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {historyExpanded && (
            <div className="mt-4 space-y-3">
              {pastOKRs.map(okr => {
                const s = okrScore(okr.objective.keyResults)
                const sc = s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={okr.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-emerald-400">{okr.quarter} {okr.year}</div>
                        {okr.objective.title && (
                          <div className="text-sm text-slate-300 mt-0.5">{okr.objective.title}</div>
                        )}
                      </div>
                      <span
                        className="text-lg font-black flex-shrink-0"
                        style={{ color: sc, fontFamily: 'Orbitron, monospace' }}
                      >
                        {s}%
                      </span>
                    </div>

                    {/* KR progress bars */}
                    <div className="space-y-1.5">
                      {okr.objective.keyResults.map((kr, idx) => {
                        const p = krCompletion(kr)
                        return (
                          <div key={kr.id} className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 w-8 flex-shrink-0">KR{idx + 1}</span>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${p}%`,
                                  backgroundColor: p >= 70 ? '#22c55e' : p >= 40 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{p}%</span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-xs text-slate-600 mt-2">
                      {okr.checkIns.length} check-in{okr.checkIns.length !== 1 ? 's' : ''}
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
