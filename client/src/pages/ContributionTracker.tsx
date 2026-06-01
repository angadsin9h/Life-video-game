import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, Star, Zap, Target, TrendingUp, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'contribution_tracker_log'

type ContributionType =
  | 'help'
  | 'teaching'
  | 'creating'
  | 'giving'
  | 'supporting'
  | 'volunteering'
  | 'mentoring'
  | 'sharing'
  | 'building'

type RecipientType =
  | 'individual'
  | 'group'
  | 'community'
  | 'organization'
  | 'online'
  | 'environment'
  | 'future'

interface Contribution {
  id: string
  date: string
  type: ContributionType
  recipient: RecipientType
  description: string
  timeSpent: number
  impact: 1 | 2 | 3 | 4 | 5
  feeling: 1 | 2 | 3 | 4 | 5
  anonymous: boolean
  tags: string[]
}

const TYPE_CONFIG: Record<ContributionType, { label: string; emoji: string; color: string }> = {
  help:        { label: 'Help',        emoji: '🙏',   color: '#22c55e' },
  teaching:    { label: 'Teaching',    emoji: '👨‍🏫',  color: '#3b82f6' },
  creating:    { label: 'Creating',    emoji: '🎨',   color: '#a855f7' },
  giving:      { label: 'Giving',      emoji: '🎁',   color: '#f59e0b' },
  supporting:  { label: 'Supporting',  emoji: '💪',   color: '#6366f1' },
  volunteering:{ label: 'Volunteering',emoji: '🤝',   color: '#10b981' },
  mentoring:   { label: 'Mentoring',   emoji: '🧭',   color: '#ec4899' },
  sharing:     { label: 'Sharing',     emoji: '📢',   color: '#f97316' },
  building:    { label: 'Building',    emoji: '🔨',   color: '#64748b' },
}

const RECIPIENT_CONFIG: Record<RecipientType, { label: string; emoji: string }> = {
  individual:   { label: 'Individual',   emoji: '👤' },
  group:        { label: 'Group',        emoji: '👥' },
  community:    { label: 'Community',    emoji: '🏘' },
  organization: { label: 'Organization', emoji: '🏢' },
  online:       { label: 'Online',       emoji: '💻' },
  environment:  { label: 'Environment',  emoji: '🌿' },
  future:       { label: 'Future',       emoji: '🌟' },
}

const GIVING_LABELS: [number, string][] = [
  [20, 'Seed'],
  [40, 'Sprout'],
  [60, 'Giver'],
  [80, 'Contributor'],
  [100, 'Changemaker'],
]

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtMins(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function getLast8Weeks(): { start: string; end: string; label: string }[] {
  const weeks: { start: string; end: string; label: string }[] = []
  for (let w = 7; w >= 0; w--) {
    const end = new Date()
    end.setDate(end.getDate() - w * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    weeks.push({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: `W${8 - w}`,
    })
  }
  return weeks
}

function computeStreak(contributions: Contribution[]): number {
  if (contributions.length === 0) return 0
  const dates = new Set(contributions.map(c => c.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (dates.has(d.toISOString().slice(0, 10))) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function computeGivingScore(contributions: Contribution[]): number {
  if (contributions.length === 0) return 0
  const totalScore = contributions.length * 5
  const avgImpact = contributions.reduce((s, c) => s + c.impact, 0) / contributions.length
  const impactScore = avgImpact * 10

  const dates = new Set(contributions.map(c => c.date))
  const streak = computeStreak(contributions)
  const consistencyBonus = Math.min(streak * 2, 20)

  const raw = Math.min(totalScore, 50) + Math.min(impactScore, 50) * 0.6 + consistencyBonus
  return Math.min(100, Math.round(raw))
}

function getGivingLabel(score: number): string {
  for (const [threshold, label] of GIVING_LABELS) {
    if (score <= threshold) return label
  }
  return 'Changemaker'
}

function loadContributions(): Contribution[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Contribution[]
  } catch { /* ignore */ }
  return []
}

function saveContributions(data: Contribution[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

const DEFAULT_FORM: Omit<Contribution, 'id'> = {
  date: todayStr(),
  type: 'help',
  recipient: 'individual',
  description: '',
  timeSpent: 30,
  impact: 3,
  feeling: 3,
  anonymous: false,
  tags: [],
}

export default function ContributionTracker() {
  const { toastSuccess } = useToast()
  const [contributions, setContributions] = useState<Contribution[]>(loadContributions)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Contribution, 'id'>>({ ...DEFAULT_FORM, date: todayStr() })
  const [tagInput, setTagInput] = useState('')
  const [showChart, setShowChart] = useState(true)

  useEffect(() => { saveContributions(contributions) }, [contributions])

  // ---- Stats ----
  const streak = computeStreak(contributions)
  const givingScore = computeGivingScore(contributions)
  const givingLabel = getGivingLabel(givingScore)
  const totalHours = contributions.reduce((s, c) => s + c.timeSpent, 0) / 60
  const avgImpact = contributions.length > 0
    ? (contributions.reduce((s, c) => s + c.impact, 0) / contributions.length).toFixed(1)
    : '—'
  const avgFeeling = contributions.length > 0
    ? (contributions.reduce((s, c) => s + c.feeling, 0) / contributions.length).toFixed(1)
    : '—'

  const typeCounts: Partial<Record<ContributionType, number>> = {}
  for (const c of contributions) {
    typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1
  }
  const mostGivenType = (Object.entries(typeCounts) as [ContributionType, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  // ---- 7-day chart data ----
  const last7 = getLast7Days()
  const dailyMins = last7.map(day => ({
    day,
    label: new Date(day).toLocaleDateString('en', { weekday: 'short' }),
    minutes: contributions.filter(c => c.date === day).reduce((s, c) => s + c.timeSpent, 0),
  }))
  const maxDailyMins = Math.max(...dailyMins.map(d => d.minutes), 1)

  // ---- Category breakdown last 30d ----
  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)
  const recent30 = contributions.filter(c => new Date(c.date) >= cutoff30)
  const typeMins = (Object.keys(TYPE_CONFIG) as ContributionType[]).map(type => ({
    type,
    minutes: recent30.filter(c => c.type === type).reduce((s, c) => s + c.timeSpent, 0),
  })).filter(t => t.minutes > 0).sort((a, b) => b.minutes - a.minutes)
  const maxTypeMins = Math.max(...typeMins.map(t => t.minutes), 1)

  // ---- Impact over time (8 weeks) ----
  const weeks = getLast8Weeks()
  const weeklyImpact = weeks.map(w => {
    const wcs = contributions.filter(c => c.date >= w.start && c.date <= w.end)
    return {
      label: w.label,
      avg: wcs.length > 0 ? wcs.reduce((s, c) => s + c.impact, 0) / wcs.length : null,
    }
  })

  // ---- Form helpers ----
  function addTag() {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }))
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))
  }

  function saveContribution() {
    if (!form.description.trim()) return
    const c: Contribution = { ...form, id: Date.now().toString() }
    setContributions(prev => [c, ...prev])
    setForm({ ...DEFAULT_FORM, date: todayStr() })
    setTagInput('')
    setShowForm(false)
    toastSuccess('Contribution logged! 🌟')
  }

  function deleteContribution(id: string) {
    setContributions(prev => prev.filter(c => c.id !== id))
  }

  const recentContributions = contributions.slice(0, 10)

  // ---- SVG Impact line chart ----
  const CHART_W = 300
  const CHART_H = 60
  const validWeeks = weeklyImpact.filter(w => w.avg !== null)

  const impactPoints = weeklyImpact.map((w, i) => {
    const x = (i / (weeklyImpact.length - 1)) * CHART_W
    const y = w.avg !== null ? CHART_H - ((w.avg - 1) / 4) * CHART_H : null
    return { x, y, label: w.label, avg: w.avg }
  })

  const polyline = impactPoints
    .filter(p => p.y !== null)
    .map(p => `${p.x},${p.y}`)
    .join(' ')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-rose-400" />
            Contribution Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your acts of service and build a giving mindset.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Contribution
        </button>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-rose-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-500 mt-0.5">Day Streak 🔥</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>{givingScore}</div>
          <div className="text-xs text-slate-500 mt-0.5">{givingLabel}</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-emerald-400" style={{ fontFamily: 'Orbitron, monospace' }}>{contributions.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Contributions</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-sky-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-slate-500 mt-0.5">Hours Given</div>
        </div>
      </div>

      {/* Giving score bar */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Giving Score
          </h3>
          <span className="text-sm font-bold text-yellow-400">{givingScore}/100 · {givingLabel}</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${givingScore}%`,
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {GIVING_LABELS.map(([, label]) => (
            <span key={label} className="text-[9px] text-slate-600">{label}</span>
          ))}
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-rose-500/20">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" /> Log a Contribution
          </h3>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">What did you contribute? *</label>
            <input
              className="game-input w-full"
              placeholder="Describe your contribution..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(TYPE_CONFIG) as [ContributionType, typeof TYPE_CONFIG.help][]).map(([k, t]) => (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, type: k }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={
                    form.type === k
                      ? { background: t.color + '30', color: t.color, border: `1px solid ${t.color}` }
                      : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                  }
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Recipient</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(RECIPIENT_CONFIG) as [RecipientType, typeof RECIPIENT_CONFIG.individual][]).map(([k, r]) => (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, recipient: k }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={
                    form.recipient === k
                      ? { background: '#6366f130', color: '#818cf8', border: '1px solid #6366f1' }
                      : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                  }
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Time Spent (minutes)</label>
              <input
                type="number"
                min={1}
                max={480}
                className="game-input w-full"
                value={form.timeSpent}
                onChange={e => setForm(f => ({ ...f, timeSpent: Math.max(1, Number(e.target.value)) }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input
                type="date"
                className="game-input w-full"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Impact (1–5)</label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, impact: n }))}
                    className="flex-1 py-1.5 rounded-lg text-sm transition-all border"
                    style={
                      form.impact >= n
                        ? { background: '#22c55e30', borderColor: '#22c55e', color: '#4ade80' }
                        : { background: '#1e293b', borderColor: '#334155', color: '#475569' }
                    }
                  >
                    <Target className="w-3 h-3 mx-auto" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-1">{form.impact}/5</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">How it felt (1–5)</label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, feeling: n }))}
                    className="flex-1 py-1.5 rounded-lg text-sm transition-all border"
                    style={
                      form.feeling >= n
                        ? { background: '#f59e0b30', borderColor: '#f59e0b', color: '#fbbf24' }
                        : { background: '#1e293b', borderColor: '#334155', color: '#475569' }
                    }
                  >
                    <Star className="w-3 h-3 mx-auto" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-1">{form.feeling}/5</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, anonymous: !f.anonymous }))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all border"
              style={
                form.anonymous
                  ? { background: '#6366f130', borderColor: '#6366f1', color: '#818cf8' }
                  : { background: '#1e293b', borderColor: '#334155', color: '#64748b' }
              }
            >
              {form.anonymous ? '🎭 Anonymous' : '👤 Named'}
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tags</label>
            <div className="flex gap-2">
              <input
                className="game-input flex-1 text-sm"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveContribution}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Save Contribution
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 7-day chart */}
      {contributions.length > 0 && (
        <div className="game-card p-4">
          <button
            className="w-full flex items-center justify-between mb-3"
            onClick={() => setShowChart(v => !v)}
          >
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> 7-Day Contributions
            </h3>
            {showChart ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showChart && (
            <svg viewBox="0 0 350 90" width="100%" style={{ display: 'block' }}>
              {dailyMins.map((day, i) => {
                const barH = maxDailyMins > 0 ? (day.minutes / maxDailyMins) * 60 : 0
                const x = i * 50 + 5
                const y = 65 - barH
                return (
                  <g key={day.day}>
                    <rect
                      x={x} y={y} width={40} height={barH}
                      rx={4}
                      fill={day.minutes > 0 ? '#e11d48' : '#1e293b'}
                      opacity={day.minutes > 0 ? 0.85 : 0.4}
                    />
                    {day.minutes > 0 && (
                      <text x={x + 20} y={y - 3} textAnchor="middle" fontSize={8} fill="#f43f5e" fontFamily="monospace">
                        {fmtMins(day.minutes)}
                      </text>
                    )}
                    <text x={x + 20} y={80} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="sans-serif">
                      {day.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>
      )}

      {/* Category breakdown (last 30d) */}
      {typeMins.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Category Breakdown (last 30d)
          </h3>
          <svg viewBox={`0 0 360 ${typeMins.length * 28 + 10}`} width="100%" style={{ display: 'block' }}>
            {typeMins.map((item, i) => {
              const t = TYPE_CONFIG[item.type]
              const y = i * 28 + 5
              const barW = (item.minutes / maxTypeMins) * 200
              return (
                <g key={item.type}>
                  <text x={95} y={y + 11} textAnchor="end" dominantBaseline="middle"
                    fontSize={11} fill="#94a3b8" fontFamily="sans-serif">
                    {t.emoji} {t.label}
                  </text>
                  <rect x={101} y={y} width={barW} height={20} rx={4} fill={t.color} opacity={0.85} />
                  <text x={107 + barW} y={y + 10} dominantBaseline="middle"
                    fontSize={9} fill={t.color} fontFamily="monospace">
                    {fmtMins(item.minutes)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Impact over time (8 weeks) */}
      {validWeeks.length >= 2 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" /> Impact Over Time (8 weeks)
          </h3>
          <svg viewBox="0 0 320 80" width="100%" style={{ display: 'block' }}>
            {/* Y-axis labels */}
            {[1, 3, 5].map(v => {
              const y = CHART_H - ((v - 1) / 4) * CHART_H + 5
              return (
                <text key={v} x={12} y={y} textAnchor="middle" fontSize={8} fill="#475569" fontFamily="monospace">
                  {v}
                </text>
              )
            })}
            {/* Grid lines */}
            {[1, 3, 5].map(v => {
              const y = CHART_H - ((v - 1) / 4) * CHART_H + 5
              return (
                <line key={v} x1={20} y1={y} x2={310} y2={y} stroke="#1e293b" strokeWidth={1} />
              )
            })}
            {/* Line */}
            {polyline && (
              <polyline
                points={impactPoints
                  .filter(p => p.y !== null)
                  .map(p => `${p.x + 20},${(p.y ?? 0) + 5}`)
                  .join(' ')}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            )}
            {/* Dots + labels */}
            {impactPoints.map((p, i) => (
              <g key={i}>
                {p.y !== null && (
                  <circle cx={p.x + 20} cy={p.y + 5} r={3} fill="#f43f5e" />
                )}
                <text x={p.x + 20} y={75} textAnchor="middle" fontSize={8} fill="#64748b" fontFamily="sans-serif">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Stats row */}
      {contributions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>{avgImpact}</div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Impact</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>{avgFeeling}</div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Feeling</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
              {totalHours.toFixed(1)}h
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Total Hours</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-lg font-bold text-slate-200">
              {mostGivenType ? TYPE_CONFIG[mostGivenType].emoji : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {mostGivenType ? TYPE_CONFIG[mostGivenType].label : 'No data'}
            </div>
          </div>
        </div>
      )}

      {/* Recent contributions */}
      {recentContributions.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4" /> Recent Contributions
          </h3>
          <div className="space-y-2">
            {recentContributions.map(c => {
              const t = TYPE_CONFIG[c.type]
              const r = RECIPIENT_CONFIG[c.recipient]
              return (
                <div
                  key={c.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl"
                  style={{ background: t.color + '10', borderLeft: `3px solid ${t.color}` }}
                >
                  <span className="text-base flex-shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{c.description}</span>
                      {c.anonymous && <span className="text-[10px] text-slate-600">anon</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
                      <span>{c.date}</span>
                      <span>·</span>
                      <span>{r.emoji} {r.label}</span>
                      <span>·</span>
                      <span>{fmtMins(c.timeSpent)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5"
                            style={{ color: i < c.impact ? '#f59e0b' : '#334155', fill: i < c.impact ? '#f59e0b' : 'none' }}
                          />
                        ))}
                      </span>
                    </div>
                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-[10px]">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteContribution(c.id)}
                    className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {contributions.length === 0 && !showForm && (
        <div className="text-center py-14 text-slate-500">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1 text-sm">No contributions logged yet.</p>
          <p className="text-xs text-slate-600 mb-4">Every act of giving — big or small — counts.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log First Contribution
          </button>
        </div>
      )}
    </div>
  )
}
