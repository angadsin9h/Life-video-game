import { useEffect, useState, useMemo } from 'react'
import {
  TrendingUp, Plus, Trash2, Check, Star, BookOpen,
  Clock, Target, ChevronDown, X,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface LearningSession {
  id: string
  hours: number
  notes: string
  date: string
}

interface Milestone {
  id: string
  name: string
  hoursRequired: number   // cumulative hours threshold to unlock
  description: string
  unlockedAt: string | null
}

interface Resource {
  id: string
  name: string
  url: string
  type: 'Course' | 'Book' | 'Video' | 'Practice' | 'Mentor'
}

interface SkillRoadmapItem {
  id: string
  skillName: string
  goalDescription: string
  totalEstimatedHours: number
  sessions: LearningSession[]
  milestones: Milestone[]
  resources: Resource[]
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'skill_roadmap'

const RESOURCE_TYPES = ['Course', 'Book', 'Video', 'Practice', 'Mentor'] as const
type ResourceType = typeof RESOURCE_TYPES[number]

const RESOURCE_COLORS: Record<ResourceType, string> = {
  Course:   '#8b5cf6',
  Book:     '#06b6d4',
  Video:    '#f97316',
  Practice: '#22c55e',
  Mentor:   '#eab308',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function weekStartStr(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function totalHoursLogged(item: SkillRoadmapItem): number {
  return item.sessions.reduce((acc, s) => acc + s.hours, 0)
}

function progressPct(item: SkillRoadmapItem): number {
  if (item.totalEstimatedHours === 0) return 0
  return Math.min(100, Math.round((totalHoursLogged(item) / item.totalEstimatedHours) * 100))
}

function getMilestoneStatus(milestone: Milestone, hoursLogged: number): 'locked' | 'unlocked' {
  return hoursLogged >= milestone.hoursRequired ? 'unlocked' : 'locked'
}

function getNextMilestone(item: SkillRoadmapItem): { milestone: Milestone; skill: string; hoursLeft: number } | null {
  const logged = totalHoursLogged(item)
  const next = item.milestones
    .filter(m => logged < m.hoursRequired)
    .sort((a, b) => a.hoursRequired - b.hoursRequired)[0]
  if (!next) return null
  return { milestone: next, skill: item.skillName, hoursLeft: +(next.hoursRequired - logged).toFixed(1) }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadRoadmaps(): SkillRoadmapItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SkillRoadmapItem[]
  } catch { /* ignore */ }
  return []
}

function saveRoadmaps(items: SkillRoadmapItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SkillRoadmap() {
  const { toastSuccess, toastError } = useToast()
  const today = todayStr()

  // ── State ──────────────────────────────────────────────────────────────────

  const [roadmaps, setRoadmaps] = useState<SkillRoadmapItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Section open flags per-roadmap
  const [openSection, setOpenSection] = useState<Record<string, 'sessions' | 'milestones' | 'resources' | null>>({})

  // Create roadmap form
  const [showCreate, setShowCreate] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newGoalDesc, setNewGoalDesc] = useState('')
  const [newTotalHours, setNewTotalHours] = useState(100)

  // Log session form
  const [logSessionId, setLogSessionId] = useState<string | null>(null)
  const [sessionHours, setSessionHours] = useState(1)
  const [sessionNotes, setSessionNotes] = useState('')

  // Add milestone form
  const [addMilestoneId, setAddMilestoneId] = useState<string | null>(null)
  const [milName, setMilName] = useState('')
  const [milHours, setMilHours] = useState(10)
  const [milDesc, setMilDesc] = useState('')

  // Add resource form
  const [addResourceId, setAddResourceId] = useState<string | null>(null)
  const [resName, setResName] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [resType, setResType] = useState<ResourceType>('Course')

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setRoadmaps(loadRoadmaps())
  }, [])

  function persist(next: SkillRoadmapItem[]) {
    setRoadmaps(next)
    saveRoadmaps(next)
  }

  // ── Roadmap management ──────────────────────────────────────────────────────

  function createRoadmap() {
    const name = newSkillName.trim()
    const goal = newGoalDesc.trim()
    if (!name) { toastError('Enter a skill name'); return }
    if (!goal)  { toastError('Enter a goal description'); return }
    if (newTotalHours <= 0) { toastError('Estimated hours must be > 0'); return }

    const item: SkillRoadmapItem = {
      id: Date.now().toString(),
      skillName: name,
      goalDescription: goal,
      totalEstimatedHours: newTotalHours,
      sessions: [],
      milestones: [],
      resources: [],
      createdAt: today,
    }
    persist([...roadmaps, item])
    setNewSkillName('')
    setNewGoalDesc('')
    setNewTotalHours(100)
    setShowCreate(false)
    toastSuccess(`Roadmap for "${name}" created!`)
  }

  function deleteRoadmap(id: string) {
    persist(roadmaps.filter(r => r.id !== id))
    if (expandedId === id) setExpandedId(null)
    toastSuccess('Roadmap deleted')
  }

  // ── Session logging ─────────────────────────────────────────────────────────

  function logSession(roadmapId: string) {
    if (sessionHours <= 0) { toastError('Hours must be > 0'); return }

    const session: LearningSession = {
      id: Date.now().toString(),
      hours: sessionHours,
      notes: sessionNotes.trim(),
      date: today,
    }

    const updated = roadmaps.map(r => {
      if (r.id !== roadmapId) return r
      const newSessions = [session, ...r.sessions]
      const hoursLogged = newSessions.reduce((acc, s) => acc + s.hours, 0)
      // Auto-unlock milestones
      const updatedMilestones = r.milestones.map(m => ({
        ...m,
        unlockedAt: hoursLogged >= m.hoursRequired && !m.unlockedAt ? today : m.unlockedAt,
      }))
      return { ...r, sessions: newSessions, milestones: updatedMilestones }
    })

    persist(updated)
    setSessionHours(1)
    setSessionNotes('')
    setLogSessionId(null)
    toastSuccess(`Logged ${sessionHours}h!`, 'Keep up the great work')
  }

  function deleteSession(roadmapId: string, sessionId: string) {
    persist(roadmaps.map(r =>
      r.id === roadmapId
        ? { ...r, sessions: r.sessions.filter(s => s.id !== sessionId) }
        : r
    ))
  }

  // ── Milestone management ────────────────────────────────────────────────────

  function addMilestone(roadmapId: string) {
    const name = milName.trim()
    const desc = milDesc.trim()
    if (!name) { toastError('Enter a milestone name'); return }
    if (milHours <= 0) { toastError('Hours must be > 0'); return }

    const roadmap = roadmaps.find(r => r.id === roadmapId)
    if (!roadmap) return
    const hoursLogged = totalHoursLogged(roadmap)

    const milestone: Milestone = {
      id: Date.now().toString(),
      name,
      hoursRequired: milHours,
      description: desc,
      unlockedAt: hoursLogged >= milHours ? today : null,
    }

    persist(roadmaps.map(r =>
      r.id === roadmapId
        ? { ...r, milestones: [...r.milestones, milestone].sort((a, b) => a.hoursRequired - b.hoursRequired) }
        : r
    ))
    setMilName('')
    setMilHours(10)
    setMilDesc('')
    setAddMilestoneId(null)
    toastSuccess('Milestone added!')
  }

  function deleteMilestone(roadmapId: string, milestoneId: string) {
    persist(roadmaps.map(r =>
      r.id === roadmapId
        ? { ...r, milestones: r.milestones.filter(m => m.id !== milestoneId) }
        : r
    ))
  }

  // ── Resource management ─────────────────────────────────────────────────────

  function addResource(roadmapId: string) {
    const name = resName.trim()
    if (!name) { toastError('Enter a resource name'); return }

    const resource: Resource = {
      id: Date.now().toString(),
      name,
      url: resUrl.trim(),
      type: resType,
    }

    persist(roadmaps.map(r =>
      r.id === roadmapId ? { ...r, resources: [...r.resources, resource] } : r
    ))
    setResName('')
    setResUrl('')
    setResType('Course')
    setAddResourceId(null)
    toastSuccess('Resource added!')
  }

  function deleteResource(roadmapId: string, resourceId: string) {
    persist(roadmaps.map(r =>
      r.id === roadmapId
        ? { ...r, resources: r.resources.filter(res => res.id !== resourceId) }
        : r
    ))
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo((): {
    totalSkills: number
    weekHours: number
    nearestMilestone: { name: string; skill: string; hoursLeft: number } | null
  } => {
    const totalSkills = roadmaps.length
    const weekStart = weekStartStr()
    const weekHours = roadmaps.reduce((acc, r) =>
      acc + r.sessions.filter(s => s.date >= weekStart).reduce((a, s) => a + s.hours, 0), 0
    )

    let nearestMilestone: { name: string; skill: string; hoursLeft: number } | null = null
    let minHoursLeft = Infinity
    roadmaps.forEach(r => {
      const next = getNextMilestone(r)
      if (next && next.hoursLeft < minHoursLeft) {
        minHoursLeft = next.hoursLeft
        nearestMilestone = { name: next.milestone.name, skill: next.skill, hoursLeft: next.hoursLeft }
      }
    })

    return { totalSkills, weekHours: +weekHours.toFixed(1), nearestMilestone }
  }, [roadmaps])

  function toggleSection(id: string, section: 'sessions' | 'milestones' | 'resources') {
    setOpenSection(prev => ({
      ...prev,
      [id]: prev[id] === section ? null : section,
    }))
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Skill Roadmap
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Visual skill development timelines</p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Skill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div
            className="text-2xl font-bold text-emerald-400"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {stats.totalSkills}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Skills Active</div>
        </div>
        <div className="game-card p-3 text-center">
          <div
            className="text-2xl font-bold text-blue-400"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {stats.weekHours}h
          </div>
          <div className="text-xs text-slate-500 mt-0.5">This Week</div>
        </div>
        <div className="game-card p-3 text-center">
          {(() => {
            const nm = stats.nearestMilestone
            return nm ? (
              <>
                <div className="text-sm font-bold text-amber-400 truncate" title={nm.name}>
                  {nm.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {nm.hoursLeft}h away
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-slate-500">—</div>
                <div className="text-xs text-slate-600 mt-0.5">Next Milestone</div>
              </>
            )
          })()}
          <div className="text-[10px] text-slate-600">Nearest Milestone</div>
        </div>
      </div>

      {/* Create roadmap form */}
      {showCreate && (
        <div className="game-card p-5 space-y-4 border border-emerald-500/30">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            New Skill Roadmap
          </h3>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Skill Name *</label>
            <input
              className="game-input w-full text-sm"
              placeholder="e.g. TypeScript, Spanish, Piano, Machine Learning…"
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Goal Description *</label>
            <textarea
              className="game-input w-full h-16 resize-none text-sm"
              placeholder="What does mastery look like for you? What will you be able to do?"
              value={newGoalDesc}
              onChange={e => setNewGoalDesc(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400">Estimated Hours to Master</label>
              <span className="text-xs font-bold text-emerald-400">{newTotalHours}h</span>
            </div>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={newTotalHours}
              onChange={e => setNewTotalHours(+e.target.value)}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
              <span>10h</span>
              <span>500h</span>
              <span>1000h</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={createRoadmap}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Roadmap
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewSkillName(''); setNewGoalDesc('') }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Roadmap list */}
      {roadmaps.length === 0 && !showCreate ? (
        <div className="text-center py-16 text-slate-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-base mb-1">No skill roadmaps yet.</p>
          <p className="text-sm mb-5">Create your first roadmap to start tracking skill development.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Create First Roadmap
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {roadmaps.map(roadmap => {
            const logged = totalHoursLogged(roadmap)
            const pct = progressPct(roadmap)
            const isExpanded = expandedId === roadmap.id
            const section = openSection[roadmap.id] ?? null
            const nextMil = getNextMilestone(roadmap)

            return (
              <div key={roadmap.id} className="game-card">
                {/* Roadmap header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Progress ring / icon */}
                    <div className="relative flex-shrink-0 w-12 h-12">
                      <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-emerald-400">{pct}%</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100">{roadmap.skillName}</span>
                        {pct >= 100 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3" /> Mastered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{roadmap.goalDescription}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {logged.toFixed(1)}h / {roadmap.totalEstimatedHours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {roadmap.sessions.length} session{roadmap.sessions.length !== 1 ? 's' : ''}
                        </span>
                        {nextMil && (
                          <span className="flex items-center gap-1 text-amber-400/80">
                            <Target className="w-3 h-3" />
                            {nextMil.hoursLeft}h to "{nextMil.milestone.name}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setLogSessionId(logSessionId === roadmap.id ? null : roadmap.id)
                          setSessionHours(1)
                          setSessionNotes('')
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 transition-all"
                      >
                        + Log
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : roadmap.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteRoadmap(roadmap.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Log session inline form */}
                {logSessionId === roadmap.id && (
                  <div className="mx-4 mb-3 p-3 bg-slate-900/60 rounded-xl space-y-2 border border-emerald-500/30">
                    <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Log Learning Session
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-500">Hours spent</label>
                        <span className="text-xs font-bold text-emerald-400">{sessionHours}h</span>
                      </div>
                      <input
                        type="range"
                        min={0.25}
                        max={12}
                        step={0.25}
                        value={sessionHours}
                        onChange={e => setSessionHours(+e.target.value)}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1 block">What did you practice?</label>
                      <input
                        className="game-input w-full text-sm"
                        placeholder="Topics covered, exercises done…"
                        value={sessionNotes}
                        onChange={e => setSessionNotes(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && logSession(roadmap.id)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => logSession(roadmap.id)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Session
                      </button>
                      <button
                        onClick={() => setLogSessionId(null)}
                        className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-700">
                    {/* Section tabs */}
                    <div className="flex border-b border-slate-700">
                      {(['milestones', 'sessions', 'resources'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => toggleSection(roadmap.id, tab)}
                          className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors"
                          style={
                            section === tab
                              ? { color: '#10b981', borderBottom: '2px solid #10b981' }
                              : { color: '#64748b' }
                          }
                        >
                          {tab}
                          {tab === 'milestones' && ` (${roadmap.milestones.length})`}
                          {tab === 'sessions' && ` (${roadmap.sessions.length})`}
                          {tab === 'resources' && ` (${roadmap.resources.length})`}
                        </button>
                      ))}
                    </div>

                    {/* ── Milestones ────────────────────────────────────────── */}
                    {section === 'milestones' && (
                      <div className="p-4 space-y-4">
                        {/* Timeline */}
                        <div className="relative">
                          {roadmap.milestones.length === 0 ? (
                            <p className="text-xs text-slate-600 italic text-center py-2">
                              No milestones yet. Add one below.
                            </p>
                          ) : (
                            <div className="relative pl-6">
                              {/* Vertical line */}
                              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-700" />

                              <div className="space-y-4">
                                {roadmap.milestones.map(m => {
                                  const status = getMilestoneStatus(m, logged)
                                  return (
                                    <div key={m.id} className="relative flex items-start gap-3">
                                      {/* Marker */}
                                      <div
                                        className="absolute -left-4 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                                        style={
                                          status === 'unlocked'
                                            ? { background: '#10b981', borderColor: '#10b981' }
                                            : { background: '#1e293b', borderColor: '#475569' }
                                        }
                                      >
                                        {status === 'unlocked' && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0 pb-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            className="text-sm font-semibold"
                                            style={{ color: status === 'unlocked' ? '#10b981' : '#94a3b8' }}
                                          >
                                            {m.name}
                                          </span>
                                          <span className="text-[10px] text-slate-500">
                                            @ {m.hoursRequired}h
                                          </span>
                                          {status === 'unlocked' && m.unlockedAt && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                              Unlocked {m.unlockedAt}
                                            </span>
                                          )}
                                          {status === 'locked' && (
                                            <span className="text-[10px] text-amber-400/70">
                                              {(m.hoursRequired - logged).toFixed(1)}h left
                                            </span>
                                          )}
                                        </div>
                                        {m.description && (
                                          <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                                        )}
                                      </div>

                                      <button
                                        onClick={() => deleteMilestone(roadmap.id, m.id)}
                                        className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Add milestone form */}
                        {addMilestoneId === roadmap.id ? (
                          <div className="p-3 bg-slate-900/60 rounded-xl space-y-2 border border-slate-700">
                            <div>
                              <label className="text-[11px] text-slate-500 mb-1 block">Milestone Name *</label>
                              <input
                                className="game-input w-full text-sm"
                                placeholder="e.g. Build first project, Pass exam…"
                                value={milName}
                                onChange={e => setMilName(e.target.value)}
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] text-slate-500">Hours required (cumulative)</label>
                                <span className="text-xs font-bold text-emerald-400">{milHours}h</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={roadmap.totalEstimatedHours}
                                step={1}
                                value={milHours}
                                onChange={e => setMilHours(+e.target.value)}
                                className="w-full accent-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500 mb-1 block">Description (optional)</label>
                              <input
                                className="game-input w-full text-sm"
                                placeholder="What does this milestone represent?"
                                value={milDesc}
                                onChange={e => setMilDesc(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addMilestone(roadmap.id)}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                              >
                                Add Milestone
                              </button>
                              <button
                                onClick={() => setAddMilestoneId(null)}
                                className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddMilestoneId(roadmap.id); setMilHours(Math.round(roadmap.totalEstimatedHours * 0.25)) }}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Milestone
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── Sessions ──────────────────────────────────────────── */}
                    {section === 'sessions' && (
                      <div className="p-4 space-y-3">
                        {roadmap.sessions.length === 0 ? (
                          <p className="text-xs text-slate-600 italic text-center py-2">
                            No sessions logged yet. Use the "+ Log" button to add one.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {roadmap.sessions.slice(0, 20).map(session => (
                              <div
                                key={session.id}
                                className="flex items-start gap-2 py-2.5 px-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-emerald-400">{session.hours}h</span>
                                    <span className="text-xs text-slate-500">{session.date}</span>
                                  </div>
                                  {session.notes && (
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{session.notes}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteSession(roadmap.id, session.id)}
                                  className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {roadmap.sessions.length > 20 && (
                              <p className="text-xs text-slate-600 text-center">
                                +{roadmap.sessions.length - 20} older sessions
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Resources ─────────────────────────────────────────── */}
                    {section === 'resources' && (
                      <div className="p-4 space-y-3">
                        {roadmap.resources.length === 0 ? (
                          <p className="text-xs text-slate-600 italic text-center py-2">
                            No resources yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {roadmap.resources.map(res => {
                              const color = RESOURCE_COLORS[res.type]
                              return (
                                <div
                                  key={res.id}
                                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                                >
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold"
                                    style={{ background: color + '22', color, border: `1px solid ${color}44` }}
                                  >
                                    {res.type}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    {res.url ? (
                                      <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-slate-200 hover:text-emerald-400 transition-colors truncate block"
                                      >
                                        {res.name}
                                      </a>
                                    ) : (
                                      <span className="text-sm text-slate-200 truncate block">{res.name}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => deleteResource(roadmap.id, res.id)}
                                    className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Add resource form */}
                        {addResourceId === roadmap.id ? (
                          <div className="p-3 bg-slate-900/60 rounded-xl space-y-2 border border-slate-700">
                            <div>
                              <label className="text-[11px] text-slate-500 mb-1 block">Resource Name *</label>
                              <input
                                className="game-input w-full text-sm"
                                placeholder="e.g. The Rust Programming Book, Udemy Course…"
                                value={resName}
                                onChange={e => setResName(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500 mb-1 block">URL (optional)</label>
                              <input
                                className="game-input w-full text-sm"
                                placeholder="https://…"
                                value={resUrl}
                                onChange={e => setResUrl(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500 mb-1.5 block">Type</label>
                              <div className="flex flex-wrap gap-1.5">
                                {RESOURCE_TYPES.map(t => {
                                  const active = resType === t
                                  const color = RESOURCE_COLORS[t]
                                  return (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => setResType(t)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                                      style={
                                        active
                                          ? { background: color + '33', color, border: `1px solid ${color}` }
                                          : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                                      }
                                    >
                                      {active && <Check className="w-3 h-3 inline mr-1" />}
                                      {t}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addResource(roadmap.id)}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                              >
                                Add Resource
                              </button>
                              <button
                                onClick={() => setAddResourceId(null)}
                                className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddResourceId(roadmap.id)}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Resource
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
