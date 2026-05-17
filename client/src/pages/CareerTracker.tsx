import { useEffect, useState } from 'react'
import { Briefcase, Plus, Trash2, Star, TrendingUp, Check, Trophy, Target, Copy, X, ChevronDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ── Types ──────────────────────────────────────────────────────────────────

type GoalTimeframe = '3mo' | '6mo' | '1yr' | '3yr' | '5yr'
type GoalCategory = 'Skills' | 'Network' | 'Role' | 'Income' | 'Projects' | 'Education'
type GoalStatus = 'Not Started' | 'In Progress' | 'Complete'
type WinImpact = 'Low' | 'Medium' | 'High' | 'Game-changer'
type Tab = 'goals' | 'skills' | 'wins'

interface CareerGoal {
  id: string
  title: string
  description: string
  timeframe: GoalTimeframe
  category: GoalCategory
  status: GoalStatus
  progress: number
  createdAt: string
}

interface Skill {
  id: string
  name: string
  category: string
  current: number
  target: number
  createdAt: string
}

interface CareerWin {
  id: string
  title: string
  description: string
  impact: WinImpact
  date: string
}

interface StoredData {
  goals: CareerGoal[]
  skills: Skill[]
  wins: CareerWin[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'career_tracker'

const TIMEFRAMES: GoalTimeframe[] = ['3mo', '6mo', '1yr', '3yr', '5yr']
const GOAL_CATEGORIES: GoalCategory[] = ['Skills', 'Network', 'Role', 'Income', 'Projects', 'Education']
const STATUSES: GoalStatus[] = ['Not Started', 'In Progress', 'Complete']
const WIN_IMPACTS: WinImpact[] = ['Low', 'Medium', 'High', 'Game-changer']

const TIMEFRAME_LABELS: Record<GoalTimeframe, string> = {
  '3mo': '3 Months',
  '6mo': '6 Months',
  '1yr': '1 Year',
  '3yr': '3 Years',
  '5yr': '5 Years',
}

const STATUS_META: Record<GoalStatus, { color: string; bg: string }> = {
  'Not Started': { color: '#94a3b8', bg: '#1e293b'   },
  'In Progress': { color: '#38bdf8', bg: '#0c4a6e33' },
  'Complete':    { color: '#22c55e', bg: '#14532d33' },
}

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  Skills:    '#a78bfa',
  Network:   '#38bdf8',
  Role:      '#fb923c',
  Income:    '#22c55e',
  Projects:  '#f472b6',
  Education: '#facc15',
}

const IMPACT_META: Record<WinImpact, { color: string; bg: string }> = {
  'Low':          { color: '#94a3b8', bg: '#1e293b'   },
  'Medium':       { color: '#38bdf8', bg: '#0c4a6e33' },
  'High':         { color: '#fb923c', bg: '#431407aa' },
  'Game-changer': { color: '#facc15', bg: '#422006aa' },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function currentYear(): number {
  return new Date().getFullYear()
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<StoredData>
      return { goals: p.goals ?? [], skills: p.skills ?? [], wins: p.wins ?? [] }
    }
  } catch { /* ignore */ }
  return { goals: [], skills: [], wins: [] }
}

// ── StarRating sub-component ───────────────────────────────────────────────

function StarRating({
  value,
  max = 5,
  onChange,
  color = '#facc15',
  readOnly = false,
}: {
  value: number
  max?: number
  onChange?: (v: number) => void
  color?: string
  readOnly?: boolean
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className="transition-colors"
          style={{ color: n <= value ? color : '#334155', cursor: readOnly ? 'default' : 'pointer' }}
        >
          <Star className="w-4 h-4" fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CareerTracker() {
  const { toastSuccess } = useToast()

  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [wins, setWins] = useState<CareerWin[]>([])
  const [tab, setTab] = useState<Tab>('goals')

  // Goal form state
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState<Omit<CareerGoal, 'id' | 'createdAt'>>({
    title: '', description: '', timeframe: '1yr', category: 'Skills',
    status: 'Not Started', progress: 0,
  })
  const [tfFilter, setTfFilter] = useState<GoalTimeframe | 'All'>('All')

  // Skill form state
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [skillForm, setSkillForm] = useState<Omit<Skill, 'id' | 'createdAt'>>({
    name: '', category: '', current: 1, target: 5,
  })

  // Win form state
  const [showWinForm, setShowWinForm] = useState(false)
  const [winForm, setWinForm] = useState<Omit<CareerWin, 'id'>>({
    title: '', description: '', impact: 'Medium', date: today(),
  })
  const [impactFilter, setImpactFilter] = useState<WinImpact | 'All'>('All')

  // ── Load ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const data = loadData()
    setGoals(data.goals)
    setSkills(data.skills)
    setWins(data.wins)
  }, [])

  // ── Persist ────────────────────────────────────────────────────────────

  function persist(g: CareerGoal[], s: Skill[], w: CareerWin[]) {
    setGoals(g)
    setSkills(s)
    setWins(w)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals: g, skills: s, wins: w }))
  }

  // ── Goal actions ───────────────────────────────────────────────────────

  function addGoal() {
    if (!goalForm.title.trim()) return
    const goal: CareerGoal = {
      id: Date.now().toString(),
      createdAt: today(),
      ...goalForm,
      title: goalForm.title.trim(),
    }
    persist([goal, ...goals], skills, wins)
    setGoalForm({ title: '', description: '', timeframe: '1yr', category: 'Skills', status: 'Not Started', progress: 0 })
    setShowGoalForm(false)
    toastSuccess('Career goal added!', goal.title)
  }

  function updateGoalStatus(id: string, status: GoalStatus) {
    persist(
      goals.map(g => g.id === id ? { ...g, status, progress: status === 'Complete' ? 100 : g.progress } : g),
      skills,
      wins,
    )
  }

  function updateGoalProgress(id: string, progress: number) {
    persist(goals.map(g => g.id === id ? { ...g, progress } : g), skills, wins)
  }

  function removeGoal(id: string) {
    persist(goals.filter(g => g.id !== id), skills, wins)
  }

  // ── Skill actions ──────────────────────────────────────────────────────

  function addSkill() {
    if (!skillForm.name.trim()) return
    const skill: Skill = {
      id: Date.now().toString(),
      createdAt: today(),
      ...skillForm,
      name: skillForm.name.trim(),
    }
    persist(goals, [skill, ...skills], wins)
    setSkillForm({ name: '', category: '', current: 1, target: 5 })
    setShowSkillForm(false)
    toastSuccess('Skill added!', skillForm.name)
  }

  function removeSkill(id: string) {
    persist(goals, skills.filter(s => s.id !== id), wins)
  }

  // ── Win actions ────────────────────────────────────────────────────────

  function addWin() {
    if (!winForm.title.trim()) return
    const win: CareerWin = {
      id: Date.now().toString(),
      ...winForm,
      title: winForm.title.trim(),
    }
    persist(goals, skills, [win, ...wins])
    setWinForm({ title: '', description: '', impact: 'Medium', date: today() })
    setShowWinForm(false)
    toastSuccess('Career win logged!', 'Keep stacking those victories!')
  }

  function removeWin(id: string) {
    persist(goals, skills, wins.filter(w => w.id !== id))
  }

  function copyWin(win: CareerWin) {
    const text = [win.title, win.date, '', win.description, `Impact: ${win.impact}`]
      .filter(Boolean)
      .join('\n')
    navigator.clipboard.writeText(text).then(
      () => toastSuccess('Copied to clipboard!', 'Ready to paste into your resume or LinkedIn.'),
      () => toastSuccess('Copy failed', 'Please copy manually.'),
    )
  }

  // ── Derived stats ──────────────────────────────────────────────────────

  const activeGoals = goals.filter(g => g.status !== 'Complete').length
  const skillsTracked = skills.length
  const winsThisYear = wins.filter(w => w.date.startsWith(String(currentYear()))).length

  const filteredGoals = tfFilter === 'All' ? goals : goals.filter(g => g.timeframe === tfFilter)
  const sortedSkillsByGap = [...skills].sort((a, b) => (b.target - b.current) - (a.target - a.current))
  const filteredWins = impactFilter === 'All' ? wins : wins.filter(w => w.impact === impactFilter)

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          <Briefcase className="w-7 h-7 text-blue-400" />
          Career Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Goals, skills, and wins — your career in one place</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Target className="w-4 h-4 text-blue-400" />
            <div className="text-xl font-bold text-blue-400">{activeGoals}</div>
          </div>
          <div className="text-xs text-slate-500">Active Goals</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <div className="text-xl font-bold text-purple-400">{skillsTracked}</div>
          </div>
          <div className="text-xs text-slate-500">Skills Tracked</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <div className="text-xl font-bold text-yellow-400">{winsThisYear}</div>
          </div>
          <div className="text-xs text-slate-500">Wins This Year</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl">
        {(['goals', 'skills', 'wins'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
            style={tab === t ? { background: '#1e40af', color: '#fff' } : { color: '#64748b' }}
          >
            {t === 'goals' ? 'Goals' : t === 'skills' ? 'Skills' : 'Wins'}
          </button>
        ))}
      </div>

      {/* ══ GOALS TAB ══════════════════════════════════════════════════════ */}
      {tab === 'goals' && (
        <div className="space-y-4">
          {/* Filter + Add */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(['All', ...TIMEFRAMES] as (GoalTimeframe | 'All')[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTfFilter(tf)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={
                    tfFilter === tf
                      ? { background: '#1e40af', color: '#fff' }
                      : { background: '#1e293b', color: '#64748b' }
                  }
                >
                  {tf === 'All' ? 'All' : TIMEFRAME_LABELS[tf]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGoalForm(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </button>
          </div>

          {/* Goal form */}
          {showGoalForm && (
            <div className="game-card p-5 space-y-4 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-300">New Career Goal</h3>
                <button onClick={() => setShowGoalForm(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Goal Title</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Get promoted to Senior Engineer"
                  className="game-input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description (optional)</label>
                <textarea
                  value={goalForm.description}
                  onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="More detail about this goal..."
                  className="game-input w-full h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Timeframe</label>
                  <div className="relative">
                    <select
                      value={goalForm.timeframe}
                      onChange={e => setGoalForm(f => ({ ...f, timeframe: e.target.value as GoalTimeframe }))}
                      className="game-input w-full appearance-none pr-7"
                    >
                      {TIMEFRAMES.map(tf => (
                        <option key={tf} value={tf}>{TIMEFRAME_LABELS[tf]}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <div className="relative">
                    <select
                      value={goalForm.category}
                      onChange={e => setGoalForm(f => ({ ...f, category: e.target.value as GoalCategory }))}
                      className="game-input w-full appearance-none pr-7"
                    >
                      {GOAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Status</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(s => {
                    const meta = STATUS_META[s]
                    return (
                      <button
                        key={s}
                        onClick={() => setGoalForm(f => ({ ...f, status: s }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={
                          goalForm.status === s
                            ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.color}` }
                            : { background: '#1e293b', color: '#64748b' }
                        }
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-400">Progress</label>
                  <span className="text-blue-400 font-bold">{goalForm.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goalForm.progress}
                  onChange={e => setGoalForm(f => ({ ...f, progress: +e.target.value }))}
                  className="w-full accent-blue-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addGoal}
                  disabled={!goalForm.title.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Goal
                </button>
                <button
                  onClick={() => setShowGoalForm(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Goal cards */}
          <div className="space-y-3">
            {filteredGoals.map(goal => {
              const statusMeta = STATUS_META[goal.status]
              const catColor = CATEGORY_COLORS[goal.category]
              return (
                <div
                  key={goal.id}
                  className="game-card p-4 space-y-3"
                  style={{ borderLeft: `3px solid ${catColor}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: statusMeta.bg, color: statusMeta.color }}
                        >
                          {goal.status}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#1e293b', color: catColor }}
                        >
                          {goal.category}
                        </span>
                        <span className="text-xs text-slate-500">{TIMEFRAME_LABELS[goal.timeframe]}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{goal.title}</p>
                      {goal.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-blue-400 font-bold">{goal.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%`, background: catColor }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={e => updateGoalProgress(goal.id, +e.target.value)}
                      className="w-full accent-blue-400 mt-1"
                    />
                  </div>

                  {/* Quick status */}
                  <div className="flex gap-2 flex-wrap">
                    {STATUSES.map(s => {
                      const meta = STATUS_META[s]
                      return (
                        <button
                          key={s}
                          onClick={() => updateGoalStatus(goal.id, s)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                          style={
                            goal.status === s
                              ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.color}` }
                              : { background: '#0f172a', color: '#475569' }
                          }
                        >
                          {s === 'Complete' && <Check className="w-3 h-3" />}
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredGoals.length === 0 && !showGoalForm && (
            <div className="text-center py-12 text-slate-500">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="mb-4">No career goals yet. Start mapping your path.</p>
              <button
                onClick={() => setShowGoalForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Add First Goal
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ SKILLS TAB ═════════════════════════════════════════════════════ */}
      {tab === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Skills Inventory</h2>
            <button
              onClick={() => setShowSkillForm(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Skill
            </button>
          </div>

          {/* Skill form */}
          {showSkillForm && (
            <div className="game-card p-5 space-y-4 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-300">Add Skill</h3>
                <button onClick={() => setShowSkillForm(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Skill Name</label>
                  <input
                    type="text"
                    value={skillForm.name}
                    onChange={e => setSkillForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. TypeScript"
                    className="game-input w-full"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <input
                    type="text"
                    value={skillForm.category}
                    onChange={e => setSkillForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Technical"
                    className="game-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Current Level</label>
                  <StarRating
                    value={skillForm.current}
                    onChange={v => setSkillForm(f => ({ ...f, current: v }))}
                    color="#a78bfa"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Target Level</label>
                  <StarRating
                    value={skillForm.target}
                    onChange={v => setSkillForm(f => ({ ...f, target: v }))}
                    color="#22c55e"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addSkill}
                  disabled={!skillForm.name.trim()}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Add Skill
                </button>
                <button
                  onClick={() => setShowSkillForm(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Gap analysis note */}
          {skills.length > 0 && (
            <div className="game-card p-3 bg-purple-950/20 border border-purple-500/20">
              <p className="text-xs text-purple-400 font-semibold mb-0.5">Gap Analysis</p>
              <p className="text-xs text-slate-400">Skills sorted by gap between current and target — highest gap first.</p>
            </div>
          )}

          {/* Skills list */}
          <div className="space-y-3">
            {sortedSkillsByGap.map(skill => {
              const gap = skill.target - skill.current
              const gapColor =
                gap === 0 ? '#22c55e'
                : gap <= 1 ? '#facc15'
                : gap <= 2 ? '#fb923c'
                : '#ef4444'
              const pct = skill.target > 0 ? Math.round((skill.current / skill.target) * 100) : 100
              return (
                <div key={skill.id} className="game-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{skill.name}</p>
                      {skill.category && <span className="text-xs text-slate-500">{skill.category}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {gap === 0 ? (
                        <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mastered
                        </span>
                      ) : (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: gapColor, background: `${gapColor}22` }}
                        >
                          Gap: {gap}
                        </span>
                      )}
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Current</p>
                      <StarRating value={skill.current} color="#a78bfa" readOnly />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Target
                        {gap > 0 && (
                          <span className="ml-1 font-semibold" style={{ color: '#fb923c' }}>
                            (+{gap} needed)
                          </span>
                        )}
                      </p>
                      <StarRating value={skill.target} color="#22c55e" readOnly />
                    </div>
                  </div>

                  {/* Gap progress bar */}
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: gapColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {skills.length === 0 && !showSkillForm && (
            <div className="text-center py-12 text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="mb-4">No skills tracked yet. Build your inventory.</p>
              <button
                onClick={() => setShowSkillForm(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Add First Skill
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ WINS TAB ═══════════════════════════════════════════════════════ */}
      {tab === 'wins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(['All', ...WIN_IMPACTS] as (WinImpact | 'All')[]).map(imp => (
                <button
                  key={imp}
                  onClick={() => setImpactFilter(imp)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={
                    impactFilter === imp
                      ? imp === 'All'
                        ? { background: '#1e40af', color: '#fff' }
                        : { background: IMPACT_META[imp as WinImpact].bg, color: IMPACT_META[imp as WinImpact].color, border: `1px solid ${IMPACT_META[imp as WinImpact].color}` }
                      : { background: '#1e293b', color: '#64748b' }
                  }
                >
                  {imp}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWinForm(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Log Win
            </button>
          </div>

          {/* Win form */}
          {showWinForm && (
            <div className="game-card p-5 space-y-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-300">Log a Career Win</h3>
                <button onClick={() => setShowWinForm(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Win Title</label>
                <input
                  type="text"
                  value={winForm.title}
                  onChange={e => setWinForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Led migration to new architecture"
                  className="game-input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea
                  value={winForm.description}
                  onChange={e => setWinForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What did you do? What was your role and outcome?"
                  className="game-input w-full h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Impact Level</label>
                  <div className="flex flex-col gap-1.5">
                    {WIN_IMPACTS.map(imp => {
                      const meta = IMPACT_META[imp]
                      return (
                        <button
                          key={imp}
                          onClick={() => setWinForm(f => ({ ...f, impact: imp }))}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-left transition-all"
                          style={
                            winForm.impact === imp
                              ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.color}` }
                              : { background: '#1e293b', color: '#64748b' }
                          }
                        >
                          {imp}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={winForm.date}
                    onChange={e => setWinForm(f => ({ ...f, date: e.target.value }))}
                    className="game-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addWin}
                  disabled={!winForm.title.trim()}
                  className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Win
                </button>
                <button
                  onClick={() => setShowWinForm(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Wins list */}
          <div className="space-y-3">
            {filteredWins.map(win => {
              const impactMeta = IMPACT_META[win.impact]
              return (
                <div
                  key={win.id}
                  className="game-card p-4 space-y-2"
                  style={{ borderLeft: `3px solid ${impactMeta.color}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: impactMeta.bg, color: impactMeta.color }}
                        >
                          {win.impact}
                        </span>
                        <span className="text-xs text-slate-500">{win.date}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{win.title}</p>
                      {win.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{win.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => copyWin(win)}
                        title="Copy to clipboard"
                        className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeWin(win.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredWins.length === 0 && !showWinForm && (
            <div className="text-center py-12 text-slate-500">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="mb-2">
                {impactFilter === 'All' ? 'No wins logged yet.' : `No ${impactFilter} wins yet.`}
              </p>
              {impactFilter === 'All' && (
                <p className="text-sm mb-5">Every achievement matters — big or small. Start your record.</p>
              )}
              {impactFilter === 'All' && (
                <button
                  onClick={() => setShowWinForm(true)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Log First Win
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
