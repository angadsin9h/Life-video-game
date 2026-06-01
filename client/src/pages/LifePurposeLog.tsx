import { useState, useCallback } from 'react'
import { Sparkles, Plus, Trash2, Save, Star, Target, TrendingUp, BookOpen, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'life_purpose_log'

interface PurposeMoment {
  id: string
  date: string
  description: string
  category: 'work' | 'relationships' | 'creativity' | 'service' | 'growth' | 'teaching' | 'exploration' | 'making'
  alignment: 1 | 2 | 3 | 4 | 5
  feeling: string
}

interface PurposeStatement {
  id: string
  date: string
  statement: string
  version: number
  reflection: string
}

type MomentCategory = PurposeMoment['category']

interface StorageShape {
  moments: PurposeMoment[]
  statements: PurposeStatement[]
}

const CATEGORY_CONFIG: Record<MomentCategory, { emoji: string; label: string; color: string }> = {
  work:          { emoji: '💼', label: 'Work',         color: '#3b82f6' },
  relationships: { emoji: '💝', label: 'Relationships', color: '#ec4899' },
  creativity:    { emoji: '🎨', label: 'Creativity',   color: '#f97316' },
  service:       { emoji: '🤝', label: 'Service',      color: '#10b981' },
  growth:        { emoji: '📈', label: 'Growth',       color: '#a855f7' },
  teaching:      { emoji: '👨‍🏫', label: 'Teaching',    color: '#f59e0b' },
  exploration:   { emoji: '🧭', label: 'Exploration',  color: '#06b6d4' },
  making:        { emoji: '🔨', label: 'Making',       color: '#84cc16' },
}

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as MomentCategory[]

function load(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { moments: [], statements: [] }
    const parsed = JSON.parse(raw) as Partial<StorageShape>
    return {
      moments: parsed.moments ?? [],
      statements: parsed.statements ?? [],
    }
  } catch {
    return { moments: [], statements: [] }
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getMonthKey(date: string): string {
  return date.slice(0, 7)
}

function getLast6Months(): string[] {
  const months: string[] = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

const blankMomentForm = (): Omit<PurposeMoment, 'id'> => ({
  date: today(),
  description: '',
  category: 'work',
  alignment: 3,
  feeling: '',
})

export default function LifePurposeLog() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StorageShape>(load)
  const [activeTab, setActiveTab] = useState<'moments' | 'statements'>('moments')

  // Moments form
  const [momentForm, setMomentForm] = useState<Omit<PurposeMoment, 'id'>>(blankMomentForm)
  const [showMomentForm, setShowMomentForm] = useState(false)
  const [expandedMomentId, setExpandedMomentId] = useState<string | null>(null)

  // Statements form
  const [statementText, setStatementText] = useState('')
  const [statementReflection, setStatementReflection] = useState('')
  const [expandedStatementId, setExpandedStatementId] = useState<string | null>(null)

  const persist = useCallback((updated: StorageShape) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setData(updated)
  }, [])

  function saveMoment() {
    if (!momentForm.description.trim()) return
    const moment: PurposeMoment = { id: Date.now().toString(), ...momentForm }
    persist({ ...data, moments: [moment, ...data.moments] })
    toastSuccess('Purpose moment captured! ✨')
    setMomentForm(blankMomentForm())
    setShowMomentForm(false)
  }

  function removeMoment(id: string) {
    persist({ ...data, moments: data.moments.filter(m => m.id !== id) })
  }

  function saveStatement() {
    if (!statementText.trim()) return
    const version = data.statements.length > 0
      ? Math.max(...data.statements.map(s => s.version)) + 1
      : 1
    const statement: PurposeStatement = {
      id: Date.now().toString(),
      date: today(),
      statement: statementText.trim(),
      version,
      reflection: statementReflection.trim(),
    }
    persist({ ...data, statements: [statement, ...data.statements] })
    toastSuccess('Purpose statement updated! 🎯')
    setStatementText('')
    setStatementReflection('')
  }

  function removeStatement(id: string) {
    persist({ ...data, statements: data.statements.filter(s => s.id !== id) })
  }

  // Stats
  const totalMoments = data.moments.length
  const avgAlignment = totalMoments
    ? data.moments.reduce((s, m) => s + m.alignment, 0) / totalMoments
    : 0

  const catCounts: Partial<Record<MomentCategory, number>> = {}
  for (const m of data.moments) {
    catCounts[m.category] = (catCounts[m.category] ?? 0) + 1
  }
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]
  const maxCatCount = Math.max(1, ...CATEGORIES.map(c => catCounts[c] ?? 0))

  // Alignment trend — last 6 months
  const last6 = getLast6Months()
  const monthlyAvg = last6.map(key => {
    const monthMoments = data.moments.filter(m => getMonthKey(m.date) === key)
    if (!monthMoments.length) return { key, avg: 0, count: 0 }
    return {
      key,
      avg: monthMoments.reduce((s, m) => s + m.alignment, 0) / monthMoments.length,
      count: monthMoments.length,
    }
  })

  const svgW = 300
  const svgH = 80
  const padL = 24
  const padR = 12
  const padT = 10
  const padB = 20
  const innerW = svgW - padL - padR
  const innerH = svgH - padT - padB
  const xStep = last6.length > 1 ? innerW / (last6.length - 1) : 0

  function toX(i: number) { return padL + i * xStep }
  function toY(v: number) { return padT + innerH - (v / 5) * innerH }

  const linePoints = monthlyAvg
    .map((m, i) => m.count > 0 ? `${toX(i)},${toY(m.avg)}` : null)
    .filter((p): p is string => p !== null)

  const validIndices = monthlyAvg.map((m, i) => ({ ...m, i })).filter(m => m.count > 0)

  const sortedMoments = [...data.moments].sort((a, b) => b.date.localeCompare(a.date))
  const sortedStatements = [...data.statements].sort((a, b) => b.version - a.version)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Life Purpose Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your evolving sense of purpose — moments and statements.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{totalMoments}</div>
          <div className="text-xs text-slate-500">Moments</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">
            {avgAlignment ? avgAlignment.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Alignment</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400">
            {topCategory ? CATEGORY_CONFIG[topCategory[0] as MomentCategory].emoji : '—'}
          </div>
          <div className="text-xs text-slate-500">
            {topCategory ? CATEGORY_CONFIG[topCategory[0] as MomentCategory].label : 'N/A'}
          </div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{data.statements.length}</div>
          <div className="text-xs text-slate-500">Versions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['moments', 'statements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-violet-600/40 text-violet-300 border border-violet-500/40'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'moments' ? <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Moments</span>
              : <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Purpose Statements</span>}
          </button>
        ))}
      </div>

      {/* ─── MOMENTS TAB ─── */}
      {activeTab === 'moments' && (
        <div className="space-y-5">
          {/* Log form trigger */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowMomentForm(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Log Moment
            </button>
          </div>

          {/* Moment form */}
          {showMomentForm && (
            <div className="game-card p-5 space-y-4 border border-violet-500/20">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <h3 className="font-semibold text-white">Log a Purpose Moment</h3>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">What happened that felt purposeful?</label>
                <textarea
                  className="game-input w-full resize-none"
                  rows={3}
                  placeholder="Describe the moment, activity, or experience..."
                  value={momentForm.description}
                  onChange={e => setMomentForm(f => ({ ...f, description: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setMomentForm(f => ({ ...f, category: c }))}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        momentForm.category === c
                          ? 'bg-violet-600/40 text-violet-300 border border-violet-500/40'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {CATEGORY_CONFIG[c].emoji} {CATEGORY_CONFIG[c].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Alignment with your purpose ({momentForm.alignment}/5)
                </label>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => setMomentForm(f => ({ ...f, alignment: n }))}
                      className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center ${
                        momentForm.alignment >= n ? 'text-yellow-400' : 'text-slate-700'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${momentForm.alignment >= n ? 'fill-yellow-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">How did it make you feel?</label>
                <input
                  className="game-input w-full"
                  placeholder="Alive, clear, connected, energized..."
                  value={momentForm.feeling}
                  onChange={e => setMomentForm(f => ({ ...f, feeling: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowMomentForm(false); setMomentForm(blankMomentForm()) }}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMoment}
                  disabled={!momentForm.description.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          )}

          {/* Category breakdown SVG bars */}
          {totalMoments > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Purpose by Category</h3>
              <svg viewBox={`0 0 400 ${CATEGORIES.length * 26 + 8}`} width="100%" style={{ display: 'block' }}>
                {CATEGORIES.map((c, i) => {
                  const count = catCounts[c] ?? 0
                  const barW = count > 0 ? (count / maxCatCount) * 220 : 0
                  const y = i * 26 + 4
                  const cfg = CATEGORY_CONFIG[c]
                  return (
                    <g key={c}>
                      <text x={110} y={y + 9} textAnchor="end" dominantBaseline="middle"
                        fontSize={10} fill="#94a3b8" fontFamily="sans-serif">
                        {cfg.emoji} {cfg.label}
                      </text>
                      <rect x={116} y={y} width={Math.max(barW, 0)} height={16} rx={4} fill={cfg.color} opacity={0.75} />
                      {count > 0 && (
                        <text x={120 + barW} y={y + 8} dominantBaseline="middle"
                          fontSize={9} fill={cfg.color} fontFamily="monospace">
                          {count}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
          )}

          {/* Alignment trend */}
          {totalMoments > 0 && (
            <div className="game-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-medium text-slate-400">Alignment Trend (last 6 months)</h3>
              </div>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ height: 80 }}>
                {/* grid lines */}
                {[1, 2, 3, 4, 5].map(v => (
                  <line key={v} x1={padL} y1={toY(v)} x2={svgW - padR} y2={toY(v)}
                    stroke="#1e293b" strokeWidth="1" />
                ))}
                {/* bars */}
                {monthlyAvg.map((m, i) => m.count > 0 ? (
                  <rect
                    key={m.key}
                    x={toX(i) - 10}
                    y={toY(m.avg)}
                    width={20}
                    height={innerH - (toY(m.avg) - padT)}
                    rx={3}
                    fill="#7c3aed"
                    opacity={0.6}
                  />
                ) : null)}
                {/* line */}
                {validIndices.length >= 2 && (
                  <polyline
                    points={linePoints.join(' ')}
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {/* dots */}
                {validIndices.map(m => (
                  <circle key={m.key} cx={toX(m.i)} cy={toY(m.avg)} r="3.5"
                    fill="#a78bfa" stroke="#0f172a" strokeWidth="1.5" />
                ))}
                {/* x labels */}
                {last6.map((key, i) => (
                  <text key={key} x={toX(i)} y={svgH - 4} textAnchor="middle"
                    fontSize={8} fill="#475569" fontFamily="sans-serif">
                    {monthLabel(key)}
                  </text>
                ))}
              </svg>
            </div>
          )}

          {/* Moments list */}
          <div className="space-y-2">
            {sortedMoments.map(moment => (
              <div key={moment.id} className="game-card overflow-hidden border border-slate-700/50">
                <button
                  className="w-full p-3 text-left"
                  onClick={() => setExpandedMomentId(expandedMomentId === moment.id ? null : moment.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{CATEGORY_CONFIG[moment.category].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-medium" style={{ color: CATEGORY_CONFIG[moment.category].color }}>
                          {CATEGORY_CONFIG[moment.category].label}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(moment.date)}</span>
                        <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                          {'★'.repeat(moment.alignment)}{'☆'.repeat(5 - moment.alignment)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{moment.description}</p>
                    </div>
                  </div>
                </button>
                {expandedMomentId === moment.id && (
                  <div className="border-t border-slate-800 px-4 pb-3 pt-2 space-y-2">
                    {moment.feeling && (
                      <p className="text-xs text-slate-400 italic">
                        <span className="text-violet-400 not-italic font-medium">Feeling: </span>
                        {moment.feeling}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeMoment(moment.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {totalMoments === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="mb-1">No purpose moments logged yet.</p>
                <p className="text-sm text-slate-600">Notice moments when you feel most alive.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STATEMENTS TAB ─── */}
      {activeTab === 'statements' && (
        <div className="space-y-5">
          {/* Draft statement form */}
          <div className="game-card p-5 space-y-4 border border-violet-500/20">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-white">
                {data.statements.length > 0 ? `Update Purpose Statement (v${Math.max(...data.statements.map(s => s.version)) + 1})` : 'Write Your First Purpose Statement'}
              </h3>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Your purpose statement</label>
              <textarea
                className="game-input w-full resize-none"
                rows={4}
                placeholder="My purpose is to... / I exist to... / I'm here to..."
                value={statementText}
                onChange={e => setStatementText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reflection — what's changed or clarified?</label>
              <textarea
                className="game-input w-full resize-none"
                rows={3}
                placeholder="What life experiences or insights led to this version?"
                value={statementReflection}
                onChange={e => setStatementReflection(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveStatement}
                disabled={!statementText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Save className="w-4 h-4" /> Save Statement
              </button>
            </div>
          </div>

          {/* Statement timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400">Your Purpose History</h3>
            {sortedStatements.map((stmt, idx) => (
              <div
                key={stmt.id}
                className="game-card p-4 border border-slate-700/50 relative"
              >
                {/* Version badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 border border-violet-500/30 font-mono">
                      v{stmt.version}
                    </span>
                    {idx === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-500/30">
                        Current
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{formatDate(stmt.date)}</span>
                  </div>
                  <button
                    onClick={() => removeStatement(stmt.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Statement */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedStatementId(expandedStatementId === stmt.id ? null : stmt.id)}
                >
                  <p className="text-sm text-slate-200 font-medium leading-relaxed italic">
                    "{stmt.statement}"
                  </p>
                </button>

                {/* Reflection */}
                {expandedStatementId === stmt.id && stmt.reflection && (
                  <div className="mt-3 p-3 bg-violet-900/10 rounded-xl border border-violet-500/20">
                    <p className="text-xs text-violet-400 font-medium mb-1">Reflection</p>
                    <p className="text-xs text-slate-300">{stmt.reflection}</p>
                  </div>
                )}

                {/* Timeline connector */}
                {idx < sortedStatements.length - 1 && (
                  <div className="absolute -bottom-3 left-6 w-0.5 h-3 bg-slate-700" />
                )}
              </div>
            ))}

            {data.statements.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="mb-1">No purpose statements yet.</p>
                <p className="text-sm text-slate-600">Write your first one above — it will evolve over time.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
