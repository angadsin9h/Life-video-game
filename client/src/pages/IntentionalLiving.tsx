import { useState, useEffect } from 'react'
import { Target, ChevronDown, ChevronUp, CheckCircle, TrendingUp, Heart, Star, Calendar, Clock, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'intentional_living_log'

type AreaKey = 'health' | 'relationships' | 'work' | 'growth' | 'creativity' | 'spirituality' | 'finances' | 'fun'
type ReactionVsResponse = 'mostly-reacted' | 'mixed' | 'mostly-responded'
type Score1to5 = 1 | 2 | 3 | 4 | 5
type Score1to10 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

interface IntentionalityCheck {
  area: AreaKey
  intentional: boolean
  score: Score1to5
  note: string
}

interface IntentionalLivingEntry {
  id: string
  date: string
  checks: IntentionalityCheck[]
  reactionVsResponse: ReactionVsResponse
  presentMoments: number
  automaticPilot: number
  biggestIntention: string
  biggestReaction: string
  tomorrowIntention: string
  overallScore: Score1to10
}

const AREAS: { key: AreaKey; label: string; emoji: string }[] = [
  { key: 'health', label: 'Health', emoji: '💪' },
  { key: 'relationships', label: 'Relationships', emoji: '💝' },
  { key: 'work', label: 'Work', emoji: '💼' },
  { key: 'growth', label: 'Growth', emoji: '📈' },
  { key: 'creativity', label: 'Creativity', emoji: '🎨' },
  { key: 'spirituality', label: 'Spirituality', emoji: '🙏' },
  { key: 'finances', label: 'Finances', emoji: '💰' },
  { key: 'fun', label: 'Fun', emoji: '😄' },
]

const RVR_OPTIONS: { value: ReactionVsResponse; label: string; desc: string }[] = [
  { value: 'mostly-reacted', label: 'Mostly Reacted', desc: 'Ran on autopilot' },
  { value: 'mixed', label: 'Mixed', desc: 'Some of both' },
  { value: 'mostly-responded', label: 'Mostly Responded', desc: 'Paused and chose' },
]

const RVR_COLORS: Record<ReactionVsResponse, string> = {
  'mostly-reacted': 'bg-red-500/20 text-red-300 border-red-500/30',
  'mixed': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'mostly-responded': 'bg-green-500/20 text-green-300 border-green-500/30',
}

const RVR_BAR_COLORS: Record<ReactionVsResponse, string> = {
  'mostly-reacted': 'bg-red-500',
  'mixed': 'bg-yellow-500',
  'mostly-responded': 'bg-green-500',
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function buildDefaultChecks(): IntentionalityCheck[] {
  return AREAS.map(a => ({ area: a.key, intentional: false, score: 3 as Score1to5, note: '' }))
}

function buildDefaultEntry(): Omit<IntentionalLivingEntry, 'id' | 'date'> {
  return {
    checks: buildDefaultChecks(),
    reactionVsResponse: 'mixed',
    presentMoments: 3,
    automaticPilot: 4,
    biggestIntention: '',
    biggestReaction: '',
    tomorrowIntention: '',
    overallScore: 5,
  }
}

function loadEntries(): IntentionalLivingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as IntentionalLivingEntry[]
  } catch { /**/ }
  return []
}

function saveEntries(entries: IntentionalLivingEntry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /**/ }
}

function getLast14Scores(entries: IntentionalLivingEntry[]): { date: string; score: number | null }[] {
  const today = new Date(getToday() + 'T12:00:00')
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateStr)
    return { date: dateStr, score: entry ? entry.overallScore : null }
  })
}

function getAreaStats(entries: IntentionalLivingEntry[]): Record<AreaKey, { intentionalRate: number; avgScore: number }> {
  const today = new Date(getToday() + 'T12:00:00')
  const result = {} as Record<AreaKey, { intentionalRate: number; avgScore: number }>

  for (const area of AREAS) {
    let intentionalCount = 0
    let scoreSum = 0
    let scoreCount = 0
    let dayCount = 0

    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = entries.find(e => e.date === dateStr)
      if (!entry) { dayCount++; continue }
      dayCount++
      const check = entry.checks.find(c => c.area === area.key)
      if (check?.intentional) {
        intentionalCount++
        scoreSum += check.score
        scoreCount++
      }
    }

    result[area.key] = {
      intentionalRate: dayCount > 0 ? Math.round((intentionalCount / dayCount) * 100) : 0,
      avgScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0,
    }
  }

  return result
}

function getRvrRatio(entries: IntentionalLivingEntry[]): Record<ReactionVsResponse, number> {
  const today = new Date(getToday() + 'T12:00:00')
  const counts: Record<ReactionVsResponse, number> = { 'mostly-reacted': 0, 'mixed': 0, 'mostly-responded': 0 }
  let total = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateStr)
    if (!entry) continue
    counts[entry.reactionVsResponse]++
    total++
  }
  if (total === 0) return { 'mostly-reacted': 33, 'mixed': 34, 'mostly-responded': 33 }
  return {
    'mostly-reacted': Math.round((counts['mostly-reacted'] / total) * 100),
    'mixed': Math.round((counts['mixed'] / total) * 100),
    'mostly-responded': Math.round((counts['mostly-responded'] / total) * 100),
  }
}

function getGeneralStats(entries: IntentionalLivingEntry[]): {
  avgScore: number
  mostIntentionalArea: string
  leastIntentionalArea: string
  avgPresentMoments: number
} {
  const today = new Date(getToday() + 'T12:00:00')
  let scoreSum = 0; let scoreCount = 0
  let presentSum = 0; let presentCount = 0

  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateStr)
    if (!entry) continue
    scoreSum += entry.overallScore
    scoreCount++
    presentSum += entry.presentMoments
    presentCount++
  }

  const areaStats = getAreaStats(entries)
  const sorted = [...AREAS].sort((a, b) => areaStats[b.key].intentionalRate - areaStats[a.key].intentionalRate)
  const mostIntentionalArea = sorted[0] ? `${sorted[0].emoji} ${sorted[0].label}` : '—'
  const leastIntentionalArea = sorted[sorted.length - 1] ? `${sorted[sorted.length - 1].emoji} ${sorted[sorted.length - 1].label}` : '—'

  return {
    avgScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0,
    mostIntentionalArea,
    leastIntentionalArea,
    avgPresentMoments: presentCount > 0 ? Math.round((presentSum / presentCount) * 10) / 10 : 0,
  }
}

export default function IntentionalLiving() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<IntentionalLivingEntry[]>([])
  const [form, setForm] = useState<Omit<IntentionalLivingEntry, 'id' | 'date'>>(buildDefaultEntry())
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  const today = getToday()

  useEffect(() => {
    const loaded = loadEntries()
    setEntries(loaded)
    const todayEntry = loaded.find(e => e.date === today)
    if (todayEntry) {
      const { id: _id, date: _date, ...rest } = todayEntry
      setForm(rest)
    }
  }, [today])

  const persist = (updated: IntentionalLivingEntry[]) => {
    setEntries(updated)
    saveEntries(updated)
  }

  const updateCheck = (area: AreaKey, field: 'intentional' | 'score' | 'note', value: boolean | number | string) => {
    setForm(f => ({
      ...f,
      checks: f.checks.map(c =>
        c.area === area ? { ...c, [field]: value } : c
      ),
    }))
  }

  const handleSave = () => {
    const existing = entries.find(e => e.date === today)
    let updated: IntentionalLivingEntry[]
    if (existing) {
      updated = entries.map(e => e.date === today ? { ...e, ...form } : e)
    } else {
      const newEntry: IntentionalLivingEntry = {
        id: Date.now().toString(),
        date: today,
        ...form,
      }
      updated = [newEntry, ...entries]
    }
    persist(updated)
    toastSuccess('Intentionality logged! 🎯')
  }

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const todayEntry = entries.find(e => e.date === today)
  const chartData = getLast14Scores(entries)
  const areaStats = getAreaStats(entries)
  const rvrRatio = getRvrRatio(entries)
  const generalStats = getGeneralStats(entries)
  const recent7 = entries.slice(0, 7)
  const last7Intentions = entries.slice(0, 7).filter(e => e.tomorrowIntention.trim())

  // SVG line chart helpers
  const chartWidth = 280
  const chartHeight = 100
  const validPoints = chartData.filter(d => d.score !== null)
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth
    const y = d.score !== null ? chartHeight - ((d.score - 1) / 9) * chartHeight : null
    return { x, y, ...d }
  })
  const pathD = (() => {
    const segs: string[] = []
    let inSeg = false
    for (const p of points) {
      if (p.y !== null) {
        if (!inSeg) { segs.push(`M ${p.x} ${p.y}`); inSeg = true }
        else segs.push(`L ${p.x} ${p.y}`)
      } else {
        inSeg = false
      }
    }
    return segs.join(' ')
  })()

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-teal-300 flex items-center gap-2">
              <Target className="w-6 h-6" /> Intentional Living
            </h1>
            <p className="text-slate-400 text-sm mt-1">Daily check-in on living with purpose and choice</p>
          </div>
          {todayEntry && (
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-400">{todayEntry.overallScore}/10</div>
              <div className="text-xs text-slate-500">today's score</div>
            </div>
          )}
        </div>

        {/* Daily check-in form */}
        <div className="game-card p-4 space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-400" />
            <span className="font-semibold text-teal-300">Daily Check-In — {today}</span>
          </div>

          {/* 8 area rows */}
          <div className="space-y-2">
            {AREAS.map(area => {
              const check = form.checks.find(c => c.area === area.key)!
              return (
                <div key={area.key} className="bg-slate-700/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base">{area.emoji}</span>
                    <span className="text-sm font-semibold text-slate-200 w-24">{area.label}</span>
                    {/* Intentional toggle */}
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => updateCheck(area.key, 'intentional', true)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${check.intentional ? 'bg-teal-600 text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => updateCheck(area.key, 'intentional', false)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${!check.intentional ? 'bg-slate-500 text-slate-200' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'}`}
                      >
                        No
                      </button>
                    </div>
                    {/* Score 1-5 only if intentional */}
                    {check.intentional && (
                      <div className="flex gap-1 ml-2">
                        {([1, 2, 3, 4, 5] as Score1to5[]).map(n => (
                          <button
                            key={n}
                            onClick={() => updateCheck(area.key, 'score', n)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${check.score === n ? 'bg-teal-500 text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    className="game-input w-full text-xs"
                    placeholder={`Note for ${area.label.toLowerCase()}...`}
                    value={check.note}
                    onChange={e => updateCheck(area.key, 'note', e.target.value)}
                  />
                </div>
              )
            })}
          </div>

          {/* Reaction vs Response */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block font-semibold">Reaction vs Response today</label>
            <div className="grid grid-cols-3 gap-2">
              {RVR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, reactionVsResponse: opt.value }))}
                  className={`p-3 rounded-xl border text-left transition-colors ${form.reactionVsResponse === opt.value ? RVR_COLORS[opt.value] : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Present moments */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center justify-between">
              <span>Present moments today</span>
              <span className="text-teal-400 font-bold">{form.presentMoments}/10</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, presentMoments: Math.max(0, f.presentMoments - 1) }))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-lg transition-colors flex items-center justify-center"
              >
                −
              </button>
              <div className="flex gap-1 flex-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setForm(f => ({ ...f, presentMoments: i + 1 }))}
                    className={`flex-1 h-6 rounded transition-colors ${i < form.presentMoments ? 'bg-teal-500' : 'bg-slate-700'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, presentMoments: Math.min(10, f.presentMoments + 1) }))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-lg transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Autopilot hours */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Autopilot hours</span>
              <span className="text-orange-400 font-bold">{form.automaticPilot}h</span>
            </div>
            <input
              type="range" min={0} max={12} step={1}
              className="w-full accent-orange-400"
              value={form.automaticPilot}
              onChange={e => setForm(f => ({ ...f, automaticPilot: Number(e.target.value) }))}
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0h</span><span>6h</span><span>12h</span>
            </div>
          </div>

          {/* Biggest intention */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block font-semibold">Most intentional thing I did today</label>
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="The most intentional thing I did today..."
              value={form.biggestIntention}
              onChange={e => setForm(f => ({ ...f, biggestIntention: e.target.value }))}
            />
          </div>

          {/* Biggest reaction */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block font-semibold">Most reactive thing I did today</label>
            <textarea
              className="game-input w-full resize-none text-sm"
              rows={2}
              placeholder="The most reactive thing I did today..."
              value={form.biggestReaction}
              onChange={e => setForm(f => ({ ...f, biggestReaction: e.target.value }))}
            />
          </div>

          {/* Tomorrow's intention */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block font-semibold">One clear intention for tomorrow</label>
            <input
              className="game-input w-full"
              placeholder="Tomorrow I intend to..."
              value={form.tomorrowIntention}
              onChange={e => setForm(f => ({ ...f, tomorrowIntention: e.target.value }))}
            />
          </div>

          {/* Overall score */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400 font-semibold">Overall intentionality score today</span>
              <span className="text-teal-400 font-bold text-base">{form.overallScore}/10</span>
            </div>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as Score1to10[]).map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, overallScore: n }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    form.overallScore >= n
                      ? n <= 3 ? 'bg-red-500 text-white' : n <= 6 ? 'bg-yellow-500 text-slate-900' : 'bg-teal-500 text-white'
                      : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" />
            {todayEntry ? 'Update Check-In' : 'Save Check-In'}
          </button>
        </div>

        {/* Intentionality score trend — SVG line chart */}
        {validPoints.length > 1 && (
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span className="font-semibold text-slate-300 text-sm">Score Trend (last 14 days)</span>
            </div>
            <div className="overflow-x-auto">
              <svg width={chartWidth + 20} height={chartHeight + 30} className="mx-auto">
                {/* Grid lines */}
                {[1, 3, 5, 7, 10].map(v => {
                  const y = chartHeight - ((v - 1) / 9) * chartHeight
                  return (
                    <g key={v}>
                      <line x1={10} y1={y} x2={chartWidth + 10} y2={y} stroke="#334155" strokeWidth={1} />
                      <text x={4} y={y + 4} fontSize={9} fill="#64748b" textAnchor="end">{v}</text>
                    </g>
                  )
                })}
                {/* Line */}
                <g transform="translate(10,0)">
                  <path d={pathD} fill="none" stroke="#14b8a6" strokeWidth={2} strokeLinejoin="round" />
                  {points.filter(p => p.y !== null).map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y!} r={3} fill="#14b8a6" />
                  ))}
                </g>
                {/* X-axis labels — show every 4th */}
                {chartData.filter((_, i) => i % 4 === 0).map((d, idx) => {
                  const x = 10 + ((idx * 4) / (chartData.length - 1)) * chartWidth
                  const label = d.date.slice(5)
                  return (
                    <text key={idx} x={x} y={chartHeight + 20} fontSize={9} fill="#64748b" textAnchor="middle">{label}</text>
                  )
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Area breakdown */}
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-slate-300 text-sm">Area Breakdown (last 30 days)</span>
          </div>
          <div className="space-y-3">
            {AREAS.map(area => {
              const stat = areaStats[area.key]
              return (
                <div key={area.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">{area.emoji} {area.label}</span>
                    <span className="text-slate-400">{stat.intentionalRate}% intentional{stat.avgScore > 0 ? ` · avg ${stat.avgScore}` : ''}</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${stat.intentionalRate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reaction vs Response ratio */}
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-slate-300 text-sm">Reaction vs Response (last 30 days)</span>
          </div>
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5 mb-3">
            {(['mostly-reacted', 'mixed', 'mostly-responded'] as ReactionVsResponse[]).map(key => (
              rvrRatio[key] > 0 && (
                <div
                  key={key}
                  className={`${RVR_BAR_COLORS[key]} flex items-center justify-center text-xs font-bold text-white transition-all`}
                  style={{ width: `${rvrRatio[key]}%` }}
                >
                  {rvrRatio[key] >= 15 ? `${rvrRatio[key]}%` : ''}
                </div>
              )
            ))}
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Reacted {rvrRatio['mostly-reacted']}%</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> Mixed {rvrRatio['mixed']}%</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Responded {rvrRatio['mostly-responded']}%</div>
          </div>
        </div>

        {/* General stats */}
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="font-semibold text-slate-300 text-sm">Stats (last 30 days)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-teal-400">{generalStats.avgScore || '—'}</div>
              <div className="text-xs text-slate-400 mt-1">Avg overall score</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{generalStats.avgPresentMoments || '—'}</div>
              <div className="text-xs text-slate-400 mt-1">Avg present moments</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-sm font-bold text-green-400">{generalStats.mostIntentionalArea || '—'}</div>
              <div className="text-xs text-slate-400 mt-1">Most intentional area</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-sm font-bold text-orange-400">{generalStats.leastIntentionalArea || '—'}</div>
              <div className="text-xs text-slate-400 mt-1">Least intentional area</div>
            </div>
          </div>
        </div>

        {/* Tomorrow's intentions list */}
        {last7Intentions.length > 0 && (
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span className="font-semibold text-slate-300 text-sm">Tomorrow's Intentions — Did You Follow Through?</span>
            </div>
            <div className="space-y-2">
              {last7Intentions.map(entry => (
                <div key={entry.id} className="flex gap-3 items-start">
                  <span className="text-xs text-slate-500 w-20 flex-shrink-0 mt-0.5">{entry.date}</span>
                  <p className="text-sm text-slate-300 flex-1">{entry.tomorrowIntention}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent entries */}
        {recent7.length > 0 && (
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-300 text-sm">Recent Entries</span>
            </div>
            <div className="space-y-2">
              {recent7.map(entry => {
                const isExpanded = expandedEntries.has(entry.id)
                return (
                  <div key={entry.id} className="border border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleEntry(entry.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{entry.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                          entry.overallScore >= 8 ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : entry.overallScore >= 5 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                          {entry.overallScore}/10
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${RVR_COLORS[entry.reactionVsResponse]}`}>
                          {entry.reactionVsResponse === 'mostly-reacted' ? 'Reacted' : entry.reactionVsResponse === 'mixed' ? 'Mixed' : 'Responded'}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
                        <div className="grid grid-cols-4 gap-2">
                          {entry.checks.filter(c => c.intentional).map(c => {
                            const area = AREAS.find(a => a.key === c.area)
                            return area ? (
                              <div key={c.area} className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-2 text-center">
                                <div className="text-base">{area.emoji}</div>
                                <div className="text-xs text-teal-300 font-semibold">{area.label}</div>
                                <div className="text-xs text-slate-400">{c.score}/5</div>
                              </div>
                            ) : null
                          })}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-slate-700/50 rounded-lg p-2">
                            <div className="text-slate-500">Present moments</div>
                            <div className="text-slate-200 font-bold">{entry.presentMoments}/10</div>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-2">
                            <div className="text-slate-500">Autopilot</div>
                            <div className="text-slate-200 font-bold">{entry.automaticPilot}h</div>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-2">
                            <div className="text-slate-500">Intentional areas</div>
                            <div className="text-slate-200 font-bold">{entry.checks.filter(c => c.intentional).length}/8</div>
                          </div>
                        </div>
                        {entry.biggestIntention && (
                          <p className="text-xs text-slate-300"><span className="text-teal-400 font-semibold">Most intentional: </span>{entry.biggestIntention}</p>
                        )}
                        {entry.biggestReaction && (
                          <p className="text-xs text-slate-300"><span className="text-orange-400 font-semibold">Most reactive: </span>{entry.biggestReaction}</p>
                        )}
                        {entry.tomorrowIntention && (
                          <p className="text-xs text-slate-300"><span className="text-violet-400 font-semibold">Tomorrow: </span>{entry.tomorrowIntention}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
