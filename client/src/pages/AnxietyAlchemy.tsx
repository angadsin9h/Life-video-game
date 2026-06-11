import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Flame, Search, Filter, TrendingDown, BookOpen, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AnxietyEntry = {
  id: string
  date: string
  trigger: string
  anxietyType: 'future' | 'social' | 'performance' | 'health' | 'existential' | 'financial' | 'relationship'
  intensityBefore: number
  catastrophe: string
  probability: number
  worstCaseAction: string
  evidence_for: string
  evidence_against: string
  reframe: string
  action: string
  intensityAfter: number
}

const STORAGE_KEY = 'lq-anxietyalchemy'

const TYPE_LABELS: Record<AnxietyEntry['anxietyType'], string> = {
  future: 'Future',
  social: 'Social',
  performance: 'Performance',
  health: 'Health',
  existential: 'Existential',
  financial: 'Financial',
  relationship: 'Relationship',
}

const TYPE_COLORS: Record<AnxietyEntry['anxietyType'], string> = {
  future: '#f59e0b',
  social: '#3b82f6',
  performance: '#8b5cf6',
  health: '#22c55e',
  existential: '#6366f1',
  financial: '#10b981',
  relationship: '#ec4899',
}

type Tab = 'alchemize' | 'patterns' | 'library' | 'tracker'

type Step = 1 | 2 | 3 | 4 | 5 | 6

const STEP_TITLES: Record<Step, string> = {
  1: 'Name the Trigger',
  2: 'Worst Case + Probability',
  3: 'Evidence For & Against',
  4: 'Reframe',
  5: 'Action',
  6: 'Rate After',
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function loadEntries(): AnxietyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AnxietyEntry[]) : []
  } catch {
    return []
  }
}

function saveEntries(entries: AnxietyEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function calcStreak(entries: AnxietyEntry[]): number {
  const lowDates = new Set(
    entries.filter(e => e.intensityAfter <= 4).map(e => e.date)
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (lowDates.has(ds)) streak++
    else break
  }
  return streak
}

const IntensityDot: React.FC<{ value: number; selected: boolean; color: string; onClick: () => void }> = ({ value, selected, color, onClick }) => (
  <button
    onClick={onClick}
    className="w-8 h-8 rounded-full text-xs font-bold transition-all border"
    style={selected
      ? { background: color + '30', color, borderColor: color + '70' }
      : { background: '#1e293b', color: '#475569', borderColor: 'transparent' }
    }
  >
    {value}
  </button>
)

export default function AnxietyAlchemy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AnxietyEntry[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('alchemize')
  const [step, setStep] = useState<Step>(1)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<AnxietyEntry['anxietyType'] | 'all'>('all')

  const emptyForm = (): Omit<AnxietyEntry, 'id'> => ({
    date: todayStr(),
    trigger: '',
    anxietyType: 'future',
    intensityBefore: 7,
    catastrophe: '',
    probability: 20,
    worstCaseAction: '',
    evidence_for: '',
    evidence_against: '',
    reframe: '',
    action: '',
    intensityAfter: 5,
  })

  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  const streak = useMemo(() => calcStreak(entries), [entries])

  const avgReduction = useMemo(() => {
    if (entries.length === 0) return 0
    return entries.reduce((a, e) => a + (e.intensityBefore - e.intensityAfter), 0) / entries.length
  }, [entries])

  const patternByType = useMemo(() => {
    const map: Record<AnxietyEntry['anxietyType'], AnxietyEntry[]> = {
      future: [], social: [], performance: [], health: [],
      existential: [], financial: [], relationship: [],
    }
    entries.forEach(e => map[e.anxietyType].push(e))
    return (Object.keys(map) as AnxietyEntry['anxietyType'][])
      .map(t => ({
        type: t,
        count: map[t].length,
        avgBefore: map[t].length > 0 ? map[t].reduce((a, e) => a + e.intensityBefore, 0) / map[t].length : 0,
        avgAfter: map[t].length > 0 ? map[t].reduce((a, e) => a + e.intensityAfter, 0) / map[t].length : 0,
        avgReduction: map[t].length > 0 ? map[t].reduce((a, e) => a + (e.intensityBefore - e.intensityAfter), 0) / map[t].length : 0,
      }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [entries])

  const filteredReframes = useMemo(() => {
    return entries
      .filter(e => e.reframe.trim().length > 0)
      .filter(e => filterType === 'all' || e.anxietyType === filterType)
      .filter(e => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return e.reframe.toLowerCase().includes(q) || e.trigger.toLowerCase().includes(q)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, filterType, searchQuery])

  const trackerData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    return sorted.map(e => ({
      date: e.date,
      before: e.intensityBefore,
      after: e.intensityAfter,
      delta: e.intensityBefore - e.intensityAfter,
      type: e.anxietyType,
    }))
  }, [entries])

  const saveEntry = () => {
    const entry: AnxietyEntry = { ...form, id: Date.now().toString() }
    const updated = [entry, ...entries]
    setEntries(updated)
    saveEntries(updated)
    const reduction = form.intensityBefore - form.intensityAfter
    toastSuccess('Anxiety alchemized!', `Reduced by ${reduction} points`)
    setForm(emptyForm())
    setStep(1)
    setActiveTab('tracker')
  }

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    saveEntries(updated)
    toastSuccess('Entry removed')
  }

  const canNext = (): boolean => {
    if (step === 1) return form.trigger.trim().length > 0
    if (step === 2) return form.catastrophe.trim().length > 0 && form.worstCaseAction.trim().length > 0
    if (step === 3) return form.evidence_for.trim().length > 0 && form.evidence_against.trim().length > 0
    if (step === 4) return form.reframe.trim().length > 0
    if (step === 5) return form.action.trim().length > 0
    return true
  }

  const AMBER = '#f59e0b'
  const INDIGO = '#6366f1'

  const chartW = 300
  const chartH = 80
  const maxTrackerPts = Math.min(trackerData.length, 20)
  const trackerSlice = trackerData.slice(-maxTrackerPts)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-8 h-8" style={{ color: AMBER }} />
            Anxiety Alchemy
          </h1>
          <p className="text-slate-400 mt-1">Transform anxiety into clarity and action</p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="game-card px-3 py-2 text-center">
              <div className="text-lg font-bold" style={{ fontFamily: 'Orbitron, monospace', color: AMBER }}>{streak}d</div>
              <div className="text-xs text-slate-500">Low-anxiety streak</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center" style={{ borderTop: `2px solid ${INDIGO}` }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: INDIGO }}>{entries.length}</div>
          <div className="text-xs text-slate-500 mt-1">Alchemized</div>
        </div>
        <div className="game-card p-4 text-center" style={{ borderTop: `2px solid ${AMBER}` }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: AMBER }}>
            {avgReduction > 0 ? avgReduction.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Avg Reduction</div>
        </div>
        <div className="game-card p-4 text-center" style={{ borderTop: `2px solid #22c55e` }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#22c55e' }}>{streak}d</div>
          <div className="text-xs text-slate-500 mt-1">Streak (≤4)</div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['alchemize', 'patterns', 'library', 'tracker'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={activeTab === tab
              ? { background: '#2d1f54', color: AMBER }
              : { color: '#64748b' }}>
            {tab === 'alchemize' ? 'Alchemize' : tab === 'patterns' ? 'Patterns' : tab === 'library' ? 'Reframes' : 'Tracker'}
          </button>
        ))}
      </div>

      {activeTab === 'alchemize' && (
        <div className="space-y-4">
          <div className="flex gap-1 mb-2">
            {([1, 2, 3, 4, 5, 6] as Step[]).map(s => (
              <div key={s} className="flex-1 h-1.5 rounded-full transition-all"
                style={{ background: s <= step ? AMBER : '#1e293b' }} />
            ))}
          </div>

          <div className="game-card p-5 space-y-4" style={{ borderLeft: `3px solid ${AMBER}` }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: AMBER + '20', color: AMBER }}>
                  Step {step} of 6
                </span>
                <h3 className="font-semibold text-slate-200 mt-1">{STEP_TITLES[step]}</h3>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Date</label>
                    <input type="date" value={form.date} max={todayStr()}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="game-input w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Anxiety Type</label>
                    <select value={form.anxietyType}
                      onChange={e => setForm(f => ({ ...f, anxietyType: e.target.value as AnxietyEntry['anxietyType'] }))}
                      className="game-input w-full text-sm">
                      {(Object.keys(TYPE_LABELS) as AnxietyEntry['anxietyType'][]).map(t => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">What triggered this anxiety?</label>
                  <textarea value={form.trigger}
                    onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
                    placeholder="Describe the situation or thought that triggered your anxiety..."
                    className="game-input w-full text-sm resize-none" rows={3} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Anxiety Intensity Right Now (1–10)</label>
                    <span className="text-sm font-bold" style={{ color: AMBER }}>{form.intensityBefore}/10</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <IntensityDot key={n} value={n} selected={form.intensityBefore === n} color={AMBER}
                        onClick={() => setForm(f => ({ ...f, intensityBefore: n }))} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">What is the feared worst case?</label>
                  <textarea value={form.catastrophe}
                    onChange={e => setForm(f => ({ ...f, catastrophe: e.target.value }))}
                    placeholder="If this anxiety is telling the truth, what is the absolute worst thing that could happen?"
                    className="game-input w-full text-sm resize-none" rows={3} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Probability this worst case actually happens (%)</label>
                    <span className="text-sm font-bold" style={{ color: INDIGO }}>{form.probability}%</span>
                  </div>
                  <input type="range" min={1} max={100} value={form.probability}
                    onChange={e => setForm(f => ({ ...f, probability: parseInt(e.target.value) }))}
                    className="w-full" style={{ accentColor: INDIGO }} />
                  <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                    <span>1% — Extremely unlikely</span><span>100% — Certain</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">IF the worst case happened, what would I do?</label>
                  <textarea value={form.worstCaseAction}
                    onChange={e => setForm(f => ({ ...f, worstCaseAction: e.target.value }))}
                    placeholder="I would survive by... I could... I would reach out to..."
                    className="game-input w-full text-sm resize-none" rows={3} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1" style={{ color: '#ef444499' }}>Evidence SUPPORTING this fear</label>
                  <textarea value={form.evidence_for}
                    onChange={e => setForm(f => ({ ...f, evidence_for: e.target.value }))}
                    placeholder="What facts or experiences suggest this fear might be valid?"
                    className="game-input w-full text-sm resize-none" rows={3} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1" style={{ color: '#22c55e99' }}>Evidence AGAINST this fear</label>
                  <textarea value={form.evidence_against}
                    onChange={e => setForm(f => ({ ...f, evidence_against: e.target.value }))}
                    placeholder="What facts, past experiences, or counter-evidence challenge this fear?"
                    className="game-input w-full text-sm resize-none" rows={3} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl text-xs text-slate-400 space-y-1" style={{ background: '#1e293b' }}>
                  <p><span className="text-slate-300 font-semibold">Fear:</span> {form.catastrophe}</p>
                  <p><span className="text-slate-300 font-semibold">Probability:</span> {form.probability}%</p>
                  <p><span className="text-slate-300 font-semibold">For:</span> {form.evidence_for.slice(0, 80)}{form.evidence_for.length > 80 ? '...' : ''}</p>
                  <p><span className="text-slate-300 font-semibold">Against:</span> {form.evidence_against.slice(0, 80)}{form.evidence_against.length > 80 ? '...' : ''}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Balanced, realistic reframe</label>
                  <textarea value={form.reframe}
                    onChange={e => setForm(f => ({ ...f, reframe: e.target.value }))}
                    placeholder="Given the evidence, a more balanced view is... It's more likely that... Even if X happens, I can..."
                    className="game-input w-full text-sm resize-none" rows={4} />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl text-xs italic text-slate-300" style={{ background: '#2d1f54', borderLeft: `3px solid ${AMBER}` }}>
                  "{form.reframe}"
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">One action I can take right now</label>
                  <textarea value={form.action}
                    onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                    placeholder="A small, concrete step I can take today to address this... Even if just 5 minutes..."
                    className="game-input w-full text-sm resize-none" rows={3} />
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl text-center" style={{ background: '#1e293b' }}>
                    <div className="text-xs text-slate-500 mb-1">Before</div>
                    <div className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#ef4444' }}>
                      {form.intensityBefore}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ background: '#1e293b' }}>
                    <div className="text-xs text-slate-500 mb-1">After</div>
                    <div className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#22c55e' }}>
                      {form.intensityAfter}
                    </div>
                  </div>
                </div>

                {form.intensityAfter < form.intensityBefore && (
                  <div className="text-center py-2">
                    <div className="text-4xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: AMBER }}>
                      -{form.intensityBefore - form.intensityAfter}
                    </div>
                    <div className="text-sm text-slate-400">points reduced</div>
                    <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${((form.intensityBefore - form.intensityAfter) / form.intensityBefore) * 100}%`,
                          background: `linear-gradient(90deg, ${INDIGO}, ${AMBER})`,
                        }} />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Anxiety Intensity Now (1–10)</label>
                    <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{form.intensityAfter}/10</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <IntensityDot key={n} value={n} selected={form.intensityAfter === n} color="#22c55e"
                        onClick={() => setForm(f => ({ ...f, intensityAfter: n }))} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {step > 1 && (
                <button onClick={() => setStep(s => (s - 1) as Step)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">
                  Back
                </button>
              )}
              {step < 6 && (
                <button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canNext()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 text-slate-900"
                  style={{ background: AMBER }}>
                  Continue →
                </button>
              )}
              {step === 6 && (
                <button onClick={saveEntry}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-900 transition-colors"
                  style={{ background: AMBER }}>
                  Complete Alchemy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-4">
          {patternByType.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No patterns yet. Start alchemizing anxieties.</p>
            </div>
          ) : (
            <>
              <div className="game-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" style={{ color: AMBER }} />
                  Anxiety by Type
                </h3>
                <div className="space-y-3">
                  {patternByType.map(p => {
                    const maxCount = patternByType[0].count
                    return (
                      <div key={p.type}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[p.type] }} />
                            <span className="text-sm text-slate-300">{TYPE_LABELS[p.type]}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>{p.count} entries</span>
                            <span style={{ color: '#ef4444' }}>avg {p.avgBefore.toFixed(1)} before</span>
                            <span style={{ color: '#22c55e' }}>avg {p.avgAfter.toFixed(1)} after</span>
                            <span style={{ color: AMBER }}>-{p.avgReduction.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${(p.count / maxCount) * 100}%`, background: TYPE_COLORS[p.type] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Recent Entries</h3>
                <div className="space-y-2">
                  {[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(e => {
                    const isExpanded = expandedEntry === e.id
                    const reduction = e.intensityBefore - e.intensityAfter
                    return (
                      <div key={e.id} className="game-card overflow-hidden">
                        <div className="p-3 flex items-center gap-3 cursor-pointer"
                          onClick={() => setExpandedEntry(isExpanded ? null : e.id)}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold"
                                style={{ background: TYPE_COLORS[e.anxietyType] + '20', color: TYPE_COLORS[e.anxietyType] }}>
                                {TYPE_LABELS[e.anxietyType]}
                              </span>
                              <span className="text-sm text-slate-300 truncate">{e.trigger.slice(0, 60)}{e.trigger.length > 60 ? '...' : ''}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{e.date}</span>
                              <span style={{ color: '#ef4444' }}>{e.intensityBefore}→<span style={{ color: '#22c55e' }}>{e.intensityAfter}</span></span>
                              {reduction > 0 && <span style={{ color: AMBER }}>-{reduction} pts</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={ev => { ev.stopPropagation(); deleteEntry(e.id) }}
                              className="text-slate-600 hover:text-red-400 transition-colors p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3 text-xs text-slate-400">
                            <p><span className="text-slate-300 font-semibold">Catastrophe:</span> {e.catastrophe}</p>
                            <p><span className="text-slate-300 font-semibold">Probability:</span> {e.probability}%</p>
                            <p><span className="text-slate-300 font-semibold">If it happened:</span> {e.worstCaseAction}</p>
                            <p><span className="text-red-400">For:</span> {e.evidence_for}</p>
                            <p><span className="text-green-400">Against:</span> {e.evidence_against}</p>
                            <p className="italic" style={{ color: AMBER }}>"{e.reframe}"</p>
                            <p><span className="text-slate-300 font-semibold">Action:</span> {e.action}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={searchQuery} placeholder="Search reframes..."
                onChange={e => setSearchQuery(e.target.value)}
                className="game-input w-full text-sm pl-9" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value as AnxietyEntry['anxietyType'] | 'all')}
              className="game-input text-sm">
              <option value="all">All Types</option>
              {(Object.keys(TYPE_LABELS) as AnxietyEntry['anxietyType'][]).map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {filteredReframes.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{entries.length === 0 ? 'No entries yet.' : 'No reframes match your search.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReframes.map(e => {
                const reduction = e.intensityBefore - e.intensityAfter
                return (
                  <div key={e.id} className="game-card p-4" style={{ borderLeft: `3px solid ${TYPE_COLORS[e.anxietyType]}` }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ background: TYPE_COLORS[e.anxietyType] + '20', color: TYPE_COLORS[e.anxietyType] }}>
                          {TYPE_LABELS[e.anxietyType]}
                        </span>
                        <span className="text-xs text-slate-500">{e.date}</span>
                        {reduction > 0 && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{ background: AMBER + '20', color: AMBER }}>
                            -{reduction} pts
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{e.trigger}</p>
                    <p className="text-sm text-slate-200 italic">"{e.reframe}"</p>
                    {e.action && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Star className="w-3 h-3" style={{ color: AMBER }} /> {e.action}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {trackerData.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No data yet. Alchemize your first anxiety.</p>
            </div>
          ) : (
            <>
              <div className="game-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" style={{ color: AMBER }} />
                  Before vs After Intensity (Last {maxTrackerPts} entries)
                </h3>
                <svg width="100%" height={chartH + 30} viewBox={`0 0 ${chartW} ${chartH + 30}`} preserveAspectRatio="xMidYMid meet">
                  {trackerSlice.length > 1 && (() => {
                    const step2 = chartW / (trackerSlice.length - 1)
                    const beforePts = trackerSlice.map((d, i) => `${i * step2},${chartH - (d.before / 10) * chartH}`)
                    const afterPts = trackerSlice.map((d, i) => `${i * step2},${chartH - (d.after / 10) * chartH}`)
                    return (
                      <>
                        <polyline points={beforePts.join(' ')} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.7} />
                        <polyline points={afterPts.join(' ')} fill="none" stroke="#22c55e" strokeWidth={1.5} opacity={0.7} />
                        {trackerSlice.map((d, i) => (
                          <React.Fragment key={i}>
                            <circle cx={i * step2} cy={chartH - (d.before / 10) * chartH} r={3} fill="#ef4444" />
                            <circle cx={i * step2} cy={chartH - (d.after / 10) * chartH} r={3} fill="#22c55e" />
                          </React.Fragment>
                        ))}
                      </>
                    )
                  })()}
                  {trackerSlice.length === 1 && (
                    <>
                      <circle cx={chartW / 2} cy={chartH - (trackerSlice[0].before / 10) * chartH} r={5} fill="#ef4444" />
                      <circle cx={chartW / 2} cy={chartH - (trackerSlice[0].after / 10) * chartH} r={5} fill="#22c55e" />
                    </>
                  )}
                </svg>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-red-400" />
                    <span className="text-slate-500">Before</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-green-400" />
                    <span className="text-slate-500">After</span>
                  </div>
                </div>
              </div>

              <div className="game-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Intensity Delta Per Entry</h3>
                <div className="flex items-end gap-1 h-16">
                  {trackerSlice.map((d, i) => {
                    const pct = (d.delta / 10) * 100
                    const isNeg = d.delta < 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                          {d.date}: {d.before}→{d.after}
                        </div>
                        <div className="w-full rounded-t-sm transition-all"
                          style={{
                            height: `${Math.abs(pct)}%`,
                            minHeight: '2px',
                            background: isNeg ? '#ef444460' : AMBER,
                          }} />
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Oldest</span><span>Latest</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
