import { useState } from 'react'
import { Plus, Trash2, Save, Star, Zap, Target, TrendingUp, ChevronDown, ChevronUp, RefreshCw, Palette, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'creative_sprint_log'

interface CreativeSprint {
  id: string
  date: string
  startTime: string
  duration: number
  medium: 'writing' | 'coding' | 'design' | 'music' | 'art' | 'video' | 'photography' | 'craft' | 'other'
  project: string
  goal: string
  output: string
  flowLevel: 1|2|3|4|5
  qualityFeeling: 1|2|3|4|5
  blockers: string[]
  breakthroughs: string[]
  energyBefore: 1|2|3|4|5
  energyAfter: 1|2|3|4|5
  wouldRepeatConditions: boolean
  notes: string
}

const MEDIUM_CONFIG: Record<CreativeSprint['medium'], { label: string; emoji: string; color: string }> = {
  writing:     { label: 'Writing',      emoji: '✍️',  color: '#6366f1' },
  coding:      { label: 'Coding',       emoji: '💻',  color: '#22c55e' },
  design:      { label: 'Design',       emoji: '🎨',  color: '#f97316' },
  music:       { label: 'Music',        emoji: '🎵',  color: '#ec4899' },
  art:         { label: 'Art',          emoji: '🖌',  color: '#f59e0b' },
  video:       { label: 'Video',        emoji: '🎬',  color: '#ef4444' },
  photography: { label: 'Photography',  emoji: '📸',  color: '#3b82f6' },
  craft:       { label: 'Craft',        emoji: '🔨',  color: '#84cc16' },
  other:       { label: 'Other',        emoji: '🔲',  color: '#94a3b8' },
}

function loadSprints(): CreativeSprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CreativeSprint[]
  } catch { /* ignore */ }
  return []
}

function saveSprints(sprints: CreativeSprint[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sprints)) } catch { /* ignore */ }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function calcStreak(sprints: CreativeSprint[]): number {
  if (sprints.length === 0) return 0
  const days = [...new Set(sprints.map(s => s.date))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  let cursor = todayStr()
  for (const day of days) {
    if (day === cursor) {
      streak++
      const d = new Date(cursor)
      d.setDate(d.getDate() - 1)
      cursor = d.toISOString().slice(0, 10)
    } else {
      break
    }
  }
  return streak
}

const EMPTY_FORM: Omit<CreativeSprint, 'id'> = {
  date: todayStr(),
  startTime: '',
  duration: 30,
  medium: 'writing',
  project: '',
  goal: '',
  output: '',
  flowLevel: 3,
  qualityFeeling: 3,
  blockers: [],
  breakthroughs: [],
  energyBefore: 3,
  energyAfter: 3,
  wouldRepeatConditions: false,
  notes: '',
}

export default function CreativeSprintLog() {
  const { toastSuccess } = useToast()
  const [sprints, setSprints] = useState<CreativeSprint[]>(loadSprints)

  const [tab, setTab] = useState<'log' | 'dashboard' | 'projects' | 'breakthroughs'>('dashboard')
  const [form, setForm] = useState<Omit<CreativeSprint, 'id'>>({ ...EMPTY_FORM })
  const [blockerInput, setBlockerInput] = useState('')
  const [breakthroughInput, setBreakthroughInput] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ─── Save sprint ──────────────────────────────────────────────────────────
  function handleSave() {
    if (!form.project.trim()) return
    const sprint: CreativeSprint = { id: Date.now().toString(), ...form }
    const updated = [sprint, ...sprints]
    setSprints(updated)
    saveSprints(updated)
    setForm({ ...EMPTY_FORM })
    setBlockerInput('')
    setBreakthroughInput('')
    toastSuccess('Creative sprint logged! 🎨')
  }

  function handleDeleteSprint(id: string) {
    const updated = sprints.filter(s => s.id !== id)
    setSprints(updated)
    saveSprints(updated)
  }

  function addBlocker() {
    if (!blockerInput.trim()) return
    setForm(f => ({ ...f, blockers: [...f.blockers, blockerInput.trim()] }))
    setBlockerInput('')
  }

  function removeBlocker(i: number) {
    setForm(f => ({ ...f, blockers: f.blockers.filter((_, idx) => idx !== i) }))
  }

  function addBreakthrough() {
    if (!breakthroughInput.trim()) return
    setForm(f => ({ ...f, breakthroughs: [...f.breakthroughs, breakthroughInput.trim()] }))
    setBreakthroughInput('')
  }

  function removeBreakthrough(i: number) {
    setForm(f => ({ ...f, breakthroughs: f.breakthroughs.filter((_, idx) => idx !== i) }))
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const streak = calcStreak(sprints)
  const totalMinutes = sprints.reduce((s, sp) => s + sp.duration, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const avgFlow = sprints.length
    ? (sprints.reduce((s, sp) => s + sp.flowLevel, 0) / sprints.length).toFixed(1)
    : '—'
  const avgQuality = sprints.length
    ? (sprints.reduce((s, sp) => s + sp.qualityFeeling, 0) / sprints.length).toFixed(1)
    : '—'

  const mediumCounts: Partial<Record<CreativeSprint['medium'], number>> = {}
  sprints.forEach(sp => { mediumCounts[sp.medium] = (mediumCounts[sp.medium] ?? 0) + 1 })
  const mostSprintedMedium = (Object.entries(mediumCounts) as [CreativeSprint['medium'], number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // ─── Project breakdown ─────────────────────────────────────────────────────
  const projectMap: Record<string, { sessions: number; minutes: number }> = {}
  sprints.forEach(sp => {
    const key = sp.project.trim() || 'Unnamed'
    if (!projectMap[key]) projectMap[key] = { sessions: 0, minutes: 0 }
    projectMap[key].sessions++
    projectMap[key].minutes += sp.duration
  })
  const projects = Object.entries(projectMap)
    .map(([name, data]) => ({ name, ...data, hours: (data.minutes / 60).toFixed(1) }))
    .sort((a, b) => b.minutes - a.minutes)

  // ─── Breakthroughs wall ───────────────────────────────────────────────────
  const allBreakthroughs = sprints.flatMap(sp =>
    sp.breakthroughs.map(b => ({ text: b, date: sp.date, medium: sp.medium }))
  ).reverse()

  // ─── Flow scatter chart (last 30 days) ────────────────────────────────────
  const thirty = new Date()
  thirty.setDate(thirty.getDate() - 29)
  const thirtyStr = thirty.toISOString().slice(0, 10)
  const recentSprints = sprints.filter(s => s.date >= thirtyStr)

  const W = 420; const H = 180
  const PAD = { top: 14, right: 14, bottom: 24, left: 28 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minDate = thirty
  const maxDuration = Math.max(...recentSprints.map(s => s.duration), 60)

  function scatterX(dateStr: string) {
    const d = new Date(dateStr)
    const ratio = (d.getTime() - minDate.getTime()) / (29 * 86400000)
    return PAD.left + Math.min(Math.max(ratio, 0), 1) * chartW
  }
  function scatterY(flow: number) {
    return PAD.top + chartH - ((flow - 1) / 4) * chartH
  }
  function scatterR(duration: number) {
    return 3 + (duration / maxDuration) * 9
  }

  // ─── Recent 10 sprints ────────────────────────────────────────────────────
  const recent10 = sprints.slice(0, 10)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            Creative Sprint Log
          </h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-xl">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 font-bold text-sm">{streak}d streak</span>
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-5">Log focused creative bursts. Track flow, output, and momentum.</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="game-card text-center p-3">
          <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-xl font-black text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>{sprints.length}</div>
          <div className="text-xs text-slate-400">Sessions</div>
        </div>
        <div className="game-card text-center p-3">
          <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalHours}h</div>
          <div className="text-xs text-slate-400">Total Hours</div>
        </div>
        <div className="game-card text-center p-3">
          <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-black text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgFlow}</div>
          <div className="text-xs text-slate-400">Avg Flow</div>
        </div>
        <div className="game-card text-center p-3">
          <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-black text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgQuality}</div>
          <div className="text-xs text-slate-400">Avg Quality</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['dashboard', 'log', 'projects', 'breakthroughs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {t === 'dashboard' ? 'Dashboard' : t === 'log' ? 'Log Sprint' : t === 'projects' ? 'Projects' : 'Breakthroughs'}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* Most sprinted medium */}
          {mostSprintedMedium && (
            <div className="game-card border border-purple-500/20 p-3 text-sm flex items-center gap-2">
              <span className="text-xl">{MEDIUM_CONFIG[mostSprintedMedium].emoji}</span>
              <span className="text-slate-400">Most active: </span>
              <span className="font-semibold" style={{ color: MEDIUM_CONFIG[mostSprintedMedium].color }}>
                {MEDIUM_CONFIG[mostSprintedMedium].label}
              </span>
            </div>
          )}

          {/* Flow scatter chart */}
          {recentSprints.length >= 2 && (
            <div className="game-card">
              <h3 className="font-semibold text-slate-300 mb-3 flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Flow by Day (last 30) — dot size = duration
              </h3>
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '200px' }}>
                  {/* Grid lines */}
                  {[1,2,3,4,5].map(v => {
                    const y = scatterY(v)
                    return (
                      <g key={v}>
                        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e293b" strokeWidth="1" />
                        <text x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#475569">
                          {v}
                        </text>
                      </g>
                    )
                  })}
                  {/* Axis labels */}
                  <text x={PAD.left} y={H - 4} fontSize="8" fill="#334155">-30d</text>
                  <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize="8" fill="#334155">today</text>
                  <text x={PAD.left - 6} y={PAD.top - 2} textAnchor="end" fontSize="7" fill="#334155">flow</text>
                  {/* Dots */}
                  {recentSprints.map(sp => (
                    <circle
                      key={sp.id}
                      cx={scatterX(sp.date)}
                      cy={scatterY(sp.flowLevel)}
                      r={scatterR(sp.duration)}
                      fill={MEDIUM_CONFIG[sp.medium].color}
                      opacity={0.75}
                    />
                  ))}
                </svg>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(Object.keys(MEDIUM_CONFIG) as CreativeSprint['medium'][]).filter(m =>
                  recentSprints.some(s => s.medium === m)
                ).map(m => (
                  <span key={m} className="text-xs flex items-center gap-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: MEDIUM_CONFIG[m].color }}
                    />
                    <span className="text-slate-400">{MEDIUM_CONFIG[m].label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent 10 sprints */}
          {recent10.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-400" /> Recent Sprints
              </h4>
              {recent10.map(sp => {
                const m = MEDIUM_CONFIG[sp.medium]
                const isExpanded = expandedId === sp.id
                return (
                  <div key={sp.id} className="game-card" style={{ borderLeft: `3px solid ${m.color}` }}>
                    <button
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => setExpandedId(isExpanded ? null : sp.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">{m.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-200 truncate">{sp.project || 'Untitled'}</div>
                          <div className="text-xs text-slate-500">{sp.date} · {sp.duration}min</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                          <Zap className="w-3 h-3" />{sp.flowLevel}
                        </span>
                        <span className="text-xs text-amber-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3" />{sp.qualityFeeling}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="mt-3 space-y-2 text-sm border-t border-slate-700 pt-3">
                        {sp.goal && <div><span className="text-slate-500">Goal: </span><span className="text-slate-300">{sp.goal}</span></div>}
                        {sp.output && <div><span className="text-slate-500">Output: </span><span className="text-slate-300">{sp.output}</span></div>}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <span>Energy before: {sp.energyBefore}/5</span>
                          <span>Energy after: {sp.energyAfter}/5</span>
                          {sp.startTime && <span>Start: {sp.startTime}</span>}
                          <span>Repeat conditions: {sp.wouldRepeatConditions ? 'Yes ✓' : 'No'}</span>
                        </div>
                        {sp.blockers.length > 0 && (
                          <div>
                            <span className="text-slate-500 text-xs">Blockers: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sp.blockers.map((b, i) => (
                                <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-1.5 py-0.5 rounded">{b}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {sp.breakthroughs.length > 0 && (
                          <div>
                            <span className="text-slate-500 text-xs">Breakthroughs: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sp.breakthroughs.map((b, i) => (
                                <span key={i} className="text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-1.5 py-0.5 rounded">✨ {b}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {sp.notes && <div className="text-xs text-slate-400 italic">{sp.notes}</div>}
                        <button
                          onClick={() => handleDeleteSprint(sp.id)}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors mt-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {sprints.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Palette className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">Log your first creative sprint to start tracking momentum.</p>
            </div>
          )}
        </div>
      )}

      {/* ── LOG SPRINT TAB ────────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="game-card border border-purple-500/20">
          <h3 className="font-bold text-purple-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log a Creative Sprint
          </h3>
          <div className="space-y-4">
            {/* Medium chips */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Medium</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(MEDIUM_CONFIG) as [CreativeSprint['medium'], typeof MEDIUM_CONFIG.writing][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setForm(f => ({ ...f, medium: key }))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${form.medium === key ? 'text-white border-transparent' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                    style={form.medium === key ? { backgroundColor: cfg.color + 'cc', borderColor: cfg.color } : {}}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + start time + duration */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  className="game-input w-full"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Start Time</label>
                <input
                  type="time"
                  className="game-input w-full"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Duration (min)</label>
                <input
                  type="number"
                  className="game-input w-full"
                  value={form.duration}
                  min={1}
                  onChange={e => setForm(f => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))}
                />
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Project</label>
              <input
                className="game-input w-full"
                placeholder="Project name..."
                value={form.project}
                onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
              />
            </div>

            {/* Goal */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Goal — what you set out to do</label>
              <textarea
                className="game-input w-full resize-none"
                rows={2}
                placeholder="What did you aim to accomplish?"
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              />
            </div>

            {/* Output */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Output — what you actually produced</label>
              <textarea
                className="game-input w-full resize-none"
                rows={2}
                placeholder="What did you actually create or produce?"
                value={form.output}
                onChange={e => setForm(f => ({ ...f, output: e.target.value }))}
              />
            </div>

            {/* Flow level */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Flow Level — <span className="text-yellow-400 font-semibold">{form.flowLevel}/5</span>
              </label>
              <div className="flex gap-2">
                {([1,2,3,4,5] as CreativeSprint['flowLevel'][]).map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, flowLevel: n }))}
                    className={`flex-1 py-2 rounded-lg border transition-all flex flex-col items-center gap-0.5 ${form.flowLevel >= n ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-600 hover:border-slate-500'}`}
                  >
                    <Zap className={`w-4 h-4 ${form.flowLevel >= n ? 'text-yellow-400' : 'text-slate-600'}`} />
                    <span className="text-xs">{n}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality feeling */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Quality Feeling — <span className="text-amber-400 font-semibold">{form.qualityFeeling}/5</span>
              </label>
              <div className="flex gap-2">
                {([1,2,3,4,5] as CreativeSprint['qualityFeeling'][]).map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, qualityFeeling: n }))}
                    className={`flex-1 py-2 rounded-lg border transition-all flex flex-col items-center gap-0.5 ${form.qualityFeeling >= n ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-600 hover:border-slate-500'}`}
                  >
                    <Star className={`w-4 h-4 ${form.qualityFeeling >= n ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span className="text-xs">{n}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy before/after */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Energy Before</label>
                <div className="flex gap-1">
                  {([1,2,3,4,5] as CreativeSprint['energyBefore'][]).map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, energyBefore: n }))}
                      className={`flex-1 h-8 rounded text-xs border font-semibold transition-all ${form.energyBefore >= n ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Energy After</label>
                <div className="flex gap-1">
                  {([1,2,3,4,5] as CreativeSprint['energyAfter'][]).map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, energyAfter: n }))}
                      className={`flex-1 h-8 rounded text-xs border font-semibold transition-all ${form.energyAfter >= n ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Blockers */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Blockers</label>
              <div className="flex gap-2 mb-2">
                <input
                  className="game-input flex-1"
                  placeholder="Add a blocker..."
                  value={blockerInput}
                  onChange={e => setBlockerInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBlocker())}
                />
                <button
                  onClick={addBlocker}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.blockers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.blockers.map((b, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-full">
                      {b}
                      <button onClick={() => removeBlocker(i)} className="hover:text-red-200">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Breakthroughs */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Breakthroughs</label>
              <div className="flex gap-2 mb-2">
                <input
                  className="game-input flex-1"
                  placeholder="Add a breakthrough..."
                  value={breakthroughInput}
                  onChange={e => setBreakthroughInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBreakthrough())}
                />
                <button
                  onClick={addBreakthrough}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.breakthroughs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.breakthroughs.map((b, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                      ✨ {b}
                      <button onClick={() => removeBreakthrough(i)} className="hover:text-yellow-200">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Would repeat conditions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, wouldRepeatConditions: !f.wouldRepeatConditions }))}
                className={`w-10 h-6 rounded-full border transition-all relative flex-shrink-0 ${form.wouldRepeatConditions ? 'bg-purple-600 border-purple-500' : 'bg-slate-700 border-slate-600'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.wouldRepeatConditions ? 'left-4' : 'left-0.5'}`}
                />
              </button>
              <span className="text-sm text-slate-300">Would repeat these conditions</span>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Notes</label>
              <textarea
                className="game-input w-full resize-none"
                rows={2}
                placeholder="Anything else about this sprint..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              disabled={!form.project.trim()}
              onClick={handleSave}
            >
              <Save className="w-4 h-4" /> Save Sprint
            </button>
          </div>
        </div>
      )}

      {/* ── PROJECTS TAB ──────────────────────────────────────────────────── */}
      {tab === 'projects' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> Project Breakdown
          </h3>
          {projects.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <Target className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">No sprints logged yet.</p>
            </div>
          )}
          {projects.map(p => (
            <div key={p.name} className="game-card">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-100 truncate flex-1">{p.name}</span>
                <span className="text-purple-400 font-bold text-sm ml-2">{p.hours}h</span>
              </div>
              <div className="text-xs text-slate-400">{p.sessions} session{p.sessions !== 1 ? 's' : ''} · {p.minutes} min total</div>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min((p.minutes / (projects[0]?.minutes ?? 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BREAKTHROUGHS TAB ─────────────────────────────────────────────── */}
      {tab === 'breakthroughs' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Breakthroughs Wall
          </h3>
          {allBreakthroughs.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <Star className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">Log sprints with breakthroughs to see them here.</p>
            </div>
          )}
          {allBreakthroughs.map((b, i) => {
            const m = MEDIUM_CONFIG[b.medium]
            return (
              <div
                key={i}
                className="game-card border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3"
              >
                <span className="text-xl flex-shrink-0">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-yellow-200 font-medium">{b.text}</p>
                  <div className="text-xs text-slate-500 mt-0.5">{b.date} · {m.label}</div>
                </div>
                <span className="text-lg flex-shrink-0">✨</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
