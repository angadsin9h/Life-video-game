import React, { useState, useEffect, useMemo } from 'react'
import {
  BookOpen, Plus, Trash2, Brain, Star, Search, Tag,
  MessageSquare, Headphones, Newspaper, Video, Mic, GraduationCap,
  CheckCircle, BarChart3,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-learning-review'

type SourceType = 'book' | 'video' | 'course' | 'podcast' | 'experience' | 'conversation' | 'article'

type LearningStatus = 'new' | 'reviewing' | 'mastered'

type Learning = {
  id: string
  date: string
  source: string
  sourceType: SourceType
  insight: string
  application: string
  tags: string[]
  reviewDates: string[]
  reviewCount: number
  retentionScore: number
  status: LearningStatus
}

interface StoreData {
  learnings: Learning[]
}

const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; icon: React.ElementType; color: string }> = {
  book:         { label: 'Book',         icon: BookOpen,      color: '#3b82f6' },
  video:        { label: 'Video',        icon: Video,         color: '#ef4444' },
  course:       { label: 'Course',       icon: GraduationCap, color: '#8b5cf6' },
  podcast:      { label: 'Podcast',      icon: Headphones,    color: '#f59e0b' },
  experience:   { label: 'Experience',   icon: Star,          color: '#22c55e' },
  conversation: { label: 'Conversation', icon: MessageSquare, color: '#06b6d4' },
  article:      { label: 'Article',      icon: Newspaper,     color: '#ec4899' },
}

const STATUS_CONFIG: Record<LearningStatus, { label: string; color: string; bg: string }> = {
  new:       { label: 'New',       color: '#06b6d4', bg: '#06b6d422' },
  reviewing: { label: 'Reviewing', color: '#f59e0b', bg: '#f59e0b22' },
  mastered:  { label: 'Mastered',  color: '#22c55e', bg: '#22c55e22' },
}

const SPACED_OFFSETS = [1, 3, 7, 21, 60]

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function scheduleReviews(fromDate: string): string[] {
  return SPACED_OFFSETS.map(offset => addDays(fromDate, offset))
}

function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoreData
  } catch { /* ignore */ }
  return { learnings: [] }
}

function saveStore(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function retentionColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 5) return '#f59e0b'
  return '#ef4444'
}

type Tab = 'reviews' | 'capture' | 'library' | 'analytics'

export default function LearningReview() {
  const { toastSuccess } = useToast()

  const [learnings, setLearnings] = useState<Learning[]>([])
  const [tab, setTab] = useState<Tab>('reviews')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<SourceType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<LearningStatus | 'all'>('all')

  const [captureForm, setCaptureForm] = useState<{
    source: string
    sourceType: SourceType
    insight: string
    application: string
    tags: string
  }>({
    source: '',
    sourceType: 'book',
    insight: '',
    application: '',
    tags: '',
  })

  const [reviewScores, setReviewScores] = useState<Record<string, number>>({})
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const data = loadStore()
    setLearnings(data.learnings)
  }, [])

  function persist(next: Learning[]) {
    setLearnings(next)
    saveStore({ learnings: next })
  }

  function captureLearning() {
    if (!captureForm.source.trim() || !captureForm.insight.trim()) return
    const todayStr = today()
    const tags = captureForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    const newLearning: Learning = {
      id: Date.now().toString(),
      date: todayStr,
      source: captureForm.source.trim(),
      sourceType: captureForm.sourceType,
      insight: captureForm.insight.trim(),
      application: captureForm.application.trim(),
      tags,
      reviewDates: scheduleReviews(todayStr),
      reviewCount: 0,
      retentionScore: 5,
      status: 'new',
    }
    persist([newLearning, ...learnings])
    setCaptureForm({ source: '', sourceType: 'book', insight: '', application: '', tags: '' })
    toastSuccess('Learning captured! First review scheduled for tomorrow.')
    setTab('reviews')
  }

  function markReviewed(id: string) {
    const score = reviewScores[id] ?? 5
    const todayStr = today()
    const next = learnings.map(l => {
      if (l.id !== id) return l
      const newCount = l.reviewCount + 1
      const nextReviewOffset = SPACED_OFFSETS[newCount] ?? 90
      const newDates = [...l.reviewDates.filter(d => d > todayStr), addDays(todayStr, nextReviewOffset)]
      const newStatus: LearningStatus = score >= 9 ? 'mastered' : newCount >= 2 ? 'reviewing' : 'new'
      return {
        ...l,
        reviewCount: newCount,
        retentionScore: score,
        reviewDates: newDates,
        status: newStatus,
      }
    })
    persist(next)
    setReviewed(prev => new Set([...prev, id]))
    toastSuccess(score >= 9 ? 'Mastered! This learning is locked in.' : 'Review logged. Next review scheduled.')
  }

  function deleteLearning(id: string) {
    persist(learnings.filter(l => l.id !== id))
  }

  const todayStr = today()

  const dueToday = useMemo(
    () => learnings.filter(l => l.status !== 'mastered' && l.reviewDates.some(d => d <= todayStr) && !reviewed.has(l.id)),
    [learnings, todayStr, reviewed],
  )

  const filteredLibrary = useMemo(() => {
    return learnings.filter(l => {
      if (filterType !== 'all' && l.sourceType !== filterType) return false
      if (filterStatus !== 'all' && l.status !== filterStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          l.insight.toLowerCase().includes(q) ||
          l.source.toLowerCase().includes(q) ||
          l.tags.some(t => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [learnings, filterType, filterStatus, searchQuery])

  const tagFrequency = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const l of learnings) {
      for (const t of l.tags) {
        freq[t] = (freq[t] ?? 0) + 1
      }
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30)
  }, [learnings])

  const maxTagFreq = tagFrequency[0]?.[1] ?? 1

  const retentionOverTime = useMemo(() => {
    const byDate: Record<string, number[]> = {}
    for (const l of learnings) {
      if (!byDate[l.date]) byDate[l.date] = []
      byDate[l.date].push(l.retentionScore)
    }
    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, scores]) => ({
        date,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      }))
  }, [learnings])

  const maxRetention = Math.max(...retentionOverTime.map(r => r.avg), 10)

  const bySourceType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of learnings) {
      counts[l.sourceType] = (counts[l.sourceType] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [learnings])

  const totalByStatus = useMemo(() => ({
    new: learnings.filter(l => l.status === 'new').length,
    reviewing: learnings.filter(l => l.status === 'reviewing').length,
    mastered: learnings.filter(l => l.status === 'mastered').length,
  }), [learnings])

  const CHART_W = 360
  const CHART_H = 120
  const CHART_PAD = 28

  const areaPoints = retentionOverTime.map((p, i) => {
    const x = CHART_PAD + (i / Math.max(retentionOverTime.length - 1, 1)) * (CHART_W - CHART_PAD * 2)
    const y = CHART_H - CHART_PAD - (p.avg / maxRetention) * (CHART_H - CHART_PAD * 1.5)
    return { x, y, ...p }
  })

  const areaPath = areaPoints.length > 1
    ? `M ${areaPoints[0].x} ${areaPoints[0].y} ` +
      areaPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${areaPoints[areaPoints.length - 1].x} ${CHART_H - CHART_PAD} L ${areaPoints[0].x} ${CHART_H - CHART_PAD} Z`
    : ''

  const linePath = areaPoints.length > 1
    ? `M ${areaPoints[0].x} ${areaPoints[0].y} ` + areaPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : ''

  const totalDonut = bySourceType.reduce((acc, [, c]) => acc + c, 0) || 1
  const donutR = 36
  const donutCx = 44
  const donutCy = 44
  const circumference = 2 * Math.PI * donutR
  let donutOffset = 0

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'reviews',   label: 'Reviews', badge: dueToday.length },
    { id: 'capture',   label: 'Capture' },
    { id: 'library',   label: 'Library' },
    { id: 'analytics', label: 'Analytics' },
  ]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-indigo-400" />
            Learning Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Spaced repetition to lock in what you learn.</p>
        </div>
        {dueToday.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/40 border border-indigo-500/30 rounded-xl">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-indigo-300">{dueToday.length} due</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>{learnings.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalByStatus.new}</div>
          <div className="text-xs text-slate-500">New</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalByStatus.reviewing}</div>
          <div className="text-xs text-slate-500">Reviewing</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalByStatus.mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              tab === t.id ? 'bg-indigo-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'reviews' && (
        <div className="space-y-4">
          {dueToday.length === 0 && (
            <div className="text-center py-14 text-slate-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold text-slate-400 mb-1">All caught up!</p>
              <p className="text-xs">No reviews due today. Capture new learnings or check back tomorrow.</p>
            </div>
          )}
          {dueToday.map(l => {
            const TypeIcon = SOURCE_TYPE_CONFIG[l.sourceType].icon
            const score = reviewScores[l.id] ?? l.retentionScore
            const wasReviewed = reviewed.has(l.id)
            return (
              <div
                key={l.id}
                className={`game-card p-4 border ${wasReviewed ? 'border-green-500/20 opacity-60' : 'border-indigo-500/20'}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <TypeIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: SOURCE_TYPE_CONFIG[l.sourceType].color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold" style={{ color: SOURCE_TYPE_CONFIG[l.sourceType].color }}>
                        {l.source}
                      </span>
                      <span className="text-xs text-slate-500">{l.date}</span>
                      <span className="text-xs text-slate-500">Review #{l.reviewCount + 1}</span>
                    </div>
                    <p className="text-sm text-white mb-2">{l.insight}</p>
                    {l.application && (
                      <p className="text-xs text-indigo-300/80 italic">Apply: {l.application}</p>
                    )}
                  </div>
                </div>

                {!wasReviewed && (
                  <div className="border-t border-slate-700/50 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400">How well do you remember this?</p>
                      <span className="text-sm font-bold" style={{ color: retentionColor(score) }}>{score}/10</span>
                    </div>
                    <input
                      type="range" min={1} max={10}
                      value={score}
                      onChange={e => setReviewScores(prev => ({ ...prev, [l.id]: Number(e.target.value) }))}
                      className="w-full h-1 mb-3"
                      style={{ accentColor: retentionColor(score) }}
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 mb-3">
                      <span>Forgot</span><span>Vague</span><span>Clear</span><span>Perfect</span>
                    </div>
                    <button
                      onClick={() => markReviewed(l.id)}
                      className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold"
                    >
                      Mark Reviewed
                    </button>
                  </div>
                )}

                {wasReviewed && (
                  <div className="flex items-center gap-2 text-xs text-green-400 border-t border-slate-700/50 pt-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Reviewed — retention: {reviewScores[l.id] ?? l.retentionScore}/10
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'capture' && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-indigo-400">Capture New Learning</h3>
          <div className="flex gap-2">
            <input
              value={captureForm.source}
              onChange={e => setCaptureForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Source name *"
              className="game-input text-sm flex-1"
              autoFocus
            />
            <select
              value={captureForm.sourceType}
              onChange={e => setCaptureForm(f => ({ ...f, sourceType: e.target.value as SourceType }))}
              className="game-input text-sm"
            >
              {(Object.entries(SOURCE_TYPE_CONFIG) as [SourceType, { label: string; icon: React.ElementType; color: string }][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Key Insight *</label>
            <textarea
              value={captureForm.insight}
              onChange={e => setCaptureForm(f => ({ ...f, insight: e.target.value }))}
              placeholder="What did you learn? Write it in your own words."
              className="game-input w-full h-24 resize-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">How to Apply</label>
            <textarea
              value={captureForm.application}
              onChange={e => setCaptureForm(f => ({ ...f, application: e.target.value }))}
              placeholder="How will you use this? What action will you take?"
              className="game-input w-full h-16 resize-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tags (comma-separated)</label>
            <input
              value={captureForm.tags}
              onChange={e => setCaptureForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. productivity, mindset, habits"
              className="game-input w-full text-sm"
            />
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            Reviews auto-scheduled: tomorrow, +3d, +7d, +21d, +60d
          </div>
          <div className="flex gap-2">
            <button
              onClick={captureLearning}
              className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold"
            >
              Capture Learning
            </button>
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search insights, sources, tags…"
                className="game-input w-full pl-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              All types
            </button>
            {(Object.entries(SOURCE_TYPE_CONFIG) as [SourceType, { label: string; icon: React.ElementType; color: string }][]).map(([k, c]) => {
              const Icon = c.icon
              return (
                <button
                  key={k}
                  onClick={() => setFilterType(filterType === k ? 'all' : k)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  style={filterType === k ? { background: c.color + '44', color: c.color, border: `1px solid ${c.color}66` } : {}}
                >
                  <Icon className="w-3 h-3" />
                  {c.label}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            {(['all', 'new', 'reviewing', 'mastered'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                  filterStatus === s
                    ? s === 'all' ? 'bg-indigo-700 text-white' : ''
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                style={filterStatus === s && s !== 'all' ? {
                  background: STATUS_CONFIG[s].bg,
                  color: STATUS_CONFIG[s].color,
                  border: `1px solid ${STATUS_CONFIG[s].color}55`,
                } : {}}
              >
                {s === 'all' ? 'All status' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {filteredLibrary.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No learnings found.</p>
            </div>
          )}

          {filteredLibrary.map(l => {
            const TypeIcon = SOURCE_TYPE_CONFIG[l.sourceType].icon
            const st = STATUS_CONFIG[l.status]
            return (
              <div key={l.id} className="game-card p-3" style={{ borderLeft: `3px solid ${SOURCE_TYPE_CONFIG[l.sourceType].color}` }}>
                <div className="flex items-start gap-3">
                  <TypeIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: SOURCE_TYPE_CONFIG[l.sourceType].color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-slate-300">{l.source}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}44` }}
                      >
                        {st.label}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ color: retentionColor(l.retentionScore) }}
                      >
                        {l.retentionScore}/10
                      </span>
                      <span className="text-xs text-slate-600">{l.date}</span>
                    </div>
                    <p className="text-xs text-white mb-1 line-clamp-2">{l.insight}</p>
                    {l.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {l.tags.map(t => (
                          <span key={t} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-500/20">
                            <Tag className="w-2.5 h-2.5" />{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteLearning(l.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-4">
          {learnings.length === 0 && (
            <div className="text-center py-14 text-slate-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Capture learnings to see analytics.</p>
            </div>
          )}

          {retentionOverTime.length > 1 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Average Retention Over Time
              </h3>
              <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="overflow-visible">
                {[2.5, 5, 7.5, 10].map(v => {
                  const y = CHART_H - CHART_PAD - (v / maxRetention) * (CHART_H - CHART_PAD * 1.5)
                  return (
                    <g key={v}>
                      <line x1={CHART_PAD} y1={y} x2={CHART_W - CHART_PAD} y2={y} stroke="#1e293b" strokeWidth={1} />
                      <text x={CHART_PAD - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#334155">{v}</text>
                    </g>
                  )
                })}
                {areaPath && (
                  <path d={areaPath} fill="#6366f133" />
                )}
                {linePath && (
                  <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" />
                )}
                {areaPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3} fill="#6366f1" />
                    <title>{p.date}: {p.avg.toFixed(1)}</title>
                  </g>
                ))}
                {areaPoints.length > 0 && (
                  <>
                    <text x={areaPoints[0].x} y={CHART_H - 4} textAnchor="middle" fontSize={8} fill="#334155">
                      {areaPoints[0].date.slice(5)}
                    </text>
                    <text x={areaPoints[areaPoints.length - 1].x} y={CHART_H - 4} textAnchor="middle" fontSize={8} fill="#334155">
                      {areaPoints[areaPoints.length - 1].date.slice(5)}
                    </text>
                  </>
                )}
              </svg>
            </div>
          )}

          {bySourceType.length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Source Type Breakdown</h3>
              <div className="flex items-center gap-6">
                <svg width="88" height="88" viewBox="0 0 88 88" className="flex-shrink-0">
                  {bySourceType.map(([type, count]) => {
                    const sourceType = type as SourceType
                    const arc = (count / totalDonut) * circumference
                    const strokeDasharray = `${arc} ${circumference - arc}`
                    const strokeDashoffset = -donutOffset
                    donutOffset += arc
                    return (
                      <circle
                        key={type}
                        cx={donutCx} cy={donutCy} r={donutR}
                        fill="none"
                        stroke={SOURCE_TYPE_CONFIG[sourceType]?.color ?? '#64748b'}
                        strokeWidth={12}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: `${donutCx}px ${donutCy}px` }}
                      >
                        <title>{type}: {count}</title>
                      </circle>
                    )
                  })}
                  <text x={donutCx} y={donutCy + 4} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#f8fafc">{learnings.length}</text>
                </svg>
                <div className="flex-1 space-y-1.5">
                  {bySourceType.map(([type, count]) => {
                    const sourceType = type as SourceType
                    const cfg = SOURCE_TYPE_CONFIG[sourceType]
                    const Icon = cfg?.icon ?? Mic
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: cfg?.color ?? '#64748b' }} />
                        <span className="text-xs text-slate-400 flex-1">{cfg?.label ?? type}</span>
                        <span className="text-xs font-semibold text-slate-300">{count}</span>
                        <span className="text-xs text-slate-600">{Math.round(count / totalDonut * 100)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tagFrequency.length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                Knowledge Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tagFrequency.map(([tag, freq]) => {
                  const size = 10 + (freq / maxTagFreq) * 10
                  const opacity = 0.5 + (freq / maxTagFreq) * 0.5
                  return (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 cursor-default"
                      style={{ fontSize: size, opacity }}
                      title={`${tag}: ${freq} learning${freq !== 1 ? 's' : ''}`}
                    >
                      {tag}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Retention Score Guide</h3>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span>1–4: Low — needs more review, consider rewording the insight</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span>5–7: Building — keep reviewing on schedule</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span>8–10: Strong — knowledge is becoming durable</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
