import { useState, useMemo } from 'react'
import {
  Zap, Plus, Trash2, Save, TrendingUp, Target,
  BookOpen, Award, CheckCircle, Brain, RefreshCw,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SkillCategory = 'technical' | 'creative' | 'physical' | 'social' | 'cognitive' | 'professional'

interface PracticeSession {
  id: string
  date: string
  minutes: number
  notes: string
  levelAfter: number
}

interface Skill {
  id: string
  name: string
  category: SkillCategory
  currentLevel: number
  targetLevel: number
  practiceMinutes: number
  sessions: PracticeSession[]
  resources: string[]
  whyLearning: string
  nextMilestone: string
  createdAt: string
}

const STORAGE_KEY = 'skill_levelup_log'

const CATEGORIES: SkillCategory[] = ['technical', 'creative', 'physical', 'social', 'cognitive', 'professional']

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  technical: 'text-cyan-400 bg-cyan-900/30 border-cyan-500/40',
  creative: 'text-pink-400 bg-pink-900/30 border-pink-500/40',
  physical: 'text-green-400 bg-green-900/30 border-green-500/40',
  social: 'text-orange-400 bg-orange-900/30 border-orange-500/40',
  cognitive: 'text-violet-400 bg-violet-900/30 border-violet-500/40',
  professional: 'text-blue-400 bg-blue-900/30 border-blue-500/40',
}

const CATEGORY_BAR_COLORS: Record<SkillCategory, string> = {
  technical: 'bg-cyan-500',
  creative: 'bg-pink-500',
  physical: 'bg-green-500',
  social: 'bg-orange-500',
  cognitive: 'bg-violet-500',
  professional: 'bg-blue-500',
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function loadSkills(): Skill[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Skill[]
  } catch {
    return []
  }
}

function saveSkills(skills: Skill[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills))
}

function LevelBar({ current, target }: { current: number; target: number }) {
  const pct = Math.round((current / 10) * 100)
  const targetPct = Math.round((target / 10) * 100)
  return (
    <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
      {/* Target marker */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60 z-10"
        style={{ left: `${targetPct}%` }}
        title={`Target: ${target}`}
      />
      {/* Current fill */}
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

interface LogPracticeFormProps {
  skillId: string
  currentLevel: number
  onSave: (skillId: string, session: PracticeSession, newLevel: number) => void
  onCancel: () => void
}

function LogPracticeForm({ skillId, currentLevel, onSave, onCancel }: LogPracticeFormProps) {
  const [date, setDate] = useState(todayStr())
  const [minutes, setMinutes] = useState(30)
  const [notes, setNotes] = useState('')
  const [levelAfter, setLevelAfter] = useState(currentLevel)

  const handleSubmit = () => {
    if (minutes <= 0) return
    const session: PracticeSession = {
      id: uid(),
      date,
      minutes,
      notes: notes.trim(),
      levelAfter,
    }
    onSave(skillId, session, levelAfter)
  }

  return (
    <div className="space-y-3 p-3 bg-slate-800/80 rounded-xl border border-violet-500/20 mt-2">
      <div className="text-xs font-semibold text-slate-300">Log Practice Session</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">Date</label>
          <input
            type="date"
            className="game-input w-full text-xs"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">Minutes</label>
          <input
            type="number"
            min={1}
            max={480}
            className="game-input w-full text-xs"
            value={minutes}
            onChange={e => setMinutes(Math.max(1, Number(e.target.value)))}
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-slate-500 mb-1 block">Notes</label>
        <input
          className="game-input w-full text-xs"
          placeholder="What did you practice?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] text-slate-500 mb-1 block">
          Self-rated level after this session: <span className="text-violet-400 font-bold">{levelAfter}</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={levelAfter}
          onChange={e => setLevelAfter(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
          <span>1</span><span>5</span><span>10</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={minutes <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-3 h-3" /> Log Session
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface SkillCardProps {
  skill: Skill
  onDelete: (id: string) => void
  onLogSession: (skillId: string, session: PracticeSession, newLevel: number) => void
}

function SkillCard({ skill, onDelete, onLogSession }: SkillCardProps) {
  const [showLog, setShowLog] = useState(false)
  const [levelUpBanner, setLevelUpBanner] = useState(false)

  const lastSession = skill.sessions.length > 0
    ? skill.sessions.reduce((a, b) => a.date > b.date ? a : b)
    : null

  const atTarget = skill.currentLevel >= skill.targetLevel

  const handleSaveSession = (skillId: string, session: PracticeSession, newLevel: number) => {
    const didLevelUp = newLevel > skill.currentLevel
    onLogSession(skillId, session, newLevel)
    setShowLog(false)
    if (didLevelUp) {
      setLevelUpBanner(true)
      setTimeout(() => setLevelUpBanner(false), 3000)
    }
  }

  return (
    <div className="game-card p-4 flex flex-col gap-3">
      {/* Level Up Banner */}
      {levelUpBanner && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-300 text-sm font-bold animate-pulse">
          <Zap className="w-4 h-4" />
          Level Up! Keep going!
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{skill.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[skill.category]}`}>
              {skill.category}
            </span>
            {atTarget && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-yellow-400 bg-yellow-900/30 border-yellow-500/40 flex items-center gap-1">
                <Award className="w-3 h-3" /> At Target
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(skill.id)}
          className="p-1 text-slate-600 hover:text-red-400 flex-shrink-0 transition-colors"
          title="Delete skill"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Level display */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {skill.currentLevel}
          </span>
          <span className="text-xs text-slate-500">/ 10</span>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Target className="w-3 h-3" />
          Target: <span className="text-yellow-400 font-semibold ml-0.5">{skill.targetLevel}</span>
        </div>
      </div>

      {/* Progress bar */}
      <LevelBar current={skill.currentLevel} target={skill.targetLevel} />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>Lv 1</span>
        <span>Lv 10</span>
      </div>

      {/* Practice stats */}
      <div className="flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          {minutesToHours(skill.practiceMinutes)} practiced
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 text-slate-500" />
          {skill.sessions.length} session{skill.sessions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {lastSession && (
        <p className="text-[11px] text-slate-500">
          Last: {lastSession.date} · {minutesToHours(lastSession.minutes)}
          {lastSession.notes ? ` · ${lastSession.notes}` : ''}
        </p>
      )}

      {/* Next milestone */}
      {skill.nextMilestone && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <Target className="w-3 h-3 flex-shrink-0 text-slate-500" />
          {skill.nextMilestone}
        </p>
      )}

      {/* Why learning */}
      {skill.whyLearning && (
        <p className="text-[11px] text-slate-500 italic">"{skill.whyLearning}"</p>
      )}

      {/* Resources */}
      {skill.resources.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.resources.map((r, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/60 text-slate-400 text-[10px] rounded-full"
            >
              <BookOpen className="w-2.5 h-2.5" />
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Log practice button */}
      {!showLog ? (
        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 text-xs font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Log Practice
        </button>
      ) : (
        <LogPracticeForm
          skillId={skill.id}
          currentLevel={skill.currentLevel}
          onSave={handleSaveSession}
          onCancel={() => setShowLog(false)}
        />
      )}
    </div>
  )
}

const EMPTY_FORM = {
  name: '',
  category: 'technical' as SkillCategory,
  currentLevel: 1,
  targetLevel: 5,
  whyLearning: '',
  nextMilestone: '',
  resourcesText: '',
}

export default function SkillLevelUp() {
  const { toastSuccess } = useToast()
  const [skills, setSkills] = useState<Skill[]>(loadSkills)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const persist = (updated: Skill[]) => {
    setSkills(updated)
    saveSkills(updated)
  }

  const handleAddSkill = () => {
    if (!form.name.trim()) return
    const resources = form.resourcesText
      .split(',')
      .map(r => r.trim())
      .filter(Boolean)
    const now = new Date().toISOString()
    const skill: Skill = {
      id: uid(),
      name: form.name.trim(),
      category: form.category,
      currentLevel: form.currentLevel,
      targetLevel: form.targetLevel,
      practiceMinutes: 0,
      sessions: [],
      resources,
      whyLearning: form.whyLearning.trim(),
      nextMilestone: form.nextMilestone.trim(),
      createdAt: now,
    }
    persist([skill, ...skills])
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Skill added!', `"${skill.name}" is now being tracked`)
  }

  const handleDeleteSkill = (id: string) => {
    persist(skills.filter(s => s.id !== id))
    toastSuccess('Skill removed')
  }

  const handleLogSession = (skillId: string, session: PracticeSession, newLevel: number) => {
    const updated = skills.map(s => {
      if (s.id !== skillId) return s
      const wasLevelUp = newLevel > s.currentLevel
      const updatedSkill: Skill = {
        ...s,
        currentLevel: newLevel,
        practiceMinutes: s.practiceMinutes + session.minutes,
        sessions: [session, ...s.sessions],
      }
      if (wasLevelUp) {
        toastSuccess('Level Up!', `${s.name} reached level ${newLevel}!`)
      } else {
        toastSuccess('Practice logged!', `+${minutesToHours(session.minutes)} for ${s.name}`)
      }
      return updatedSkill
    })
    persist(updated)
  }

  // Stats
  const totalSkills = skills.length
  const totalMinutes = skills.reduce((s, sk) => s + sk.practiceMinutes, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const mostPracticed = useMemo(() => {
    if (skills.length === 0) return null
    return skills.reduce((a, b) => a.practiceMinutes > b.practiceMinutes ? a : b)
  }, [skills])
  const atTargetCount = skills.filter(s => s.currentLevel >= s.targetLevel).length

  // Chart data — top 8 by practice minutes
  const chartSkills = useMemo(() => {
    return [...skills]
      .sort((a, b) => b.practiceMinutes - a.practiceMinutes)
      .slice(0, 8)
  }, [skills])
  const maxMinutes = chartSkills.length > 0 ? Math.max(...chartSkills.map(s => s.practiceMinutes), 1) : 1

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Brain className="w-7 h-7 text-violet-400" />
            Skill Level Up
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your skills, log practice, reach mastery</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showForm
              ? 'bg-slate-700 text-slate-300 border border-slate-600'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Skill'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalSkills}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Skills Tracked</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalHours}h
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Total Practice</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-sm font-bold text-green-400 truncate px-1">
            {mostPracticed ? mostPracticed.name : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Most Practiced</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {atTargetCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">At Target Level</div>
        </div>
      </div>

      {/* Add Skill Form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border-violet-500/20">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" /> New Skill
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Skill Name</label>
              <input
                autoFocus
                className="game-input w-full text-sm"
                placeholder="e.g. Python, Guitar, Public Speaking..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Category</label>
              <select
                className="game-input w-full text-sm"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as SkillCategory }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">
                Current Level: <span className="text-violet-400 font-bold">{form.currentLevel}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={form.currentLevel}
                onChange={e => setForm(f => ({ ...f, currentLevel: Number(e.target.value) }))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                <span>1 (Beginner)</span><span>10 (Master)</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">
                Target Level: <span className="text-yellow-400 font-bold">{form.targetLevel}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={form.targetLevel}
                onChange={e => setForm(f => ({ ...f, targetLevel: Number(e.target.value) }))}
                className="w-full accent-yellow-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                <span>1</span><span>10</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Why are you learning this?</label>
            <textarea
              className="game-input w-full text-sm resize-none min-h-[60px]"
              placeholder="Your motivation..."
              value={form.whyLearning}
              onChange={e => setForm(f => ({ ...f, whyLearning: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Next Milestone</label>
            <input
              className="game-input w-full text-sm"
              placeholder="e.g. Build a small project, finish chapter 5..."
              value={form.nextMilestone}
              onChange={e => setForm(f => ({ ...f, nextMilestone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Learning Resources (comma-separated)</label>
            <input
              className="game-input w-full text-sm"
              placeholder="e.g. Udemy course, The Pragmatic Programmer, YouTube..."
              value={form.resourcesText}
              onChange={e => setForm(f => ({ ...f, resourcesText: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSkill}
              disabled={!form.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Save Skill
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl border border-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Practice Hours Bar Chart */}
      {skills.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Practice Hours by Skill</span>
          </div>
          <div className="space-y-2.5">
            {chartSkills.map(skill => {
              const barPct = maxMinutes > 0 ? (skill.practiceMinutes / maxMinutes) * 100 : 0
              return (
                <div key={skill.id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-28 flex-shrink-0 truncate" title={skill.name}>
                    {skill.name}
                  </span>
                  <div className="flex-1 relative h-5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${CATEGORY_BAR_COLORS[skill.category]}`}
                      style={{ width: `${barPct}%` }}
                    />
                    {skill.practiceMinutes > 0 && (
                      <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-semibold text-white/80">
                        {minutesToHours(skill.practiceMinutes)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 w-8 text-right flex-shrink-0">
                    Lv {skill.currentLevel}
                  </span>
                </div>
              )
            })}
          </div>
          {skills.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">No practice logged yet</p>
          )}
        </div>
      )}

      {/* Skill Cards */}
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onDelete={handleDeleteSkill}
              onLogSession={handleLogSession}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <Brain className="w-14 h-14 mx-auto mb-4 opacity-20 text-violet-400" />
          <p className="text-lg font-medium text-slate-400 mb-1">No skills tracked yet</p>
          <p className="text-sm mb-4">Add a skill you're actively developing and start logging practice.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors"
          >
            Add your first skill
          </button>
        </div>
      )}

      {/* Category legend */}
      {skills.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Skills by Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const count = skills.filter(s => s.category === cat).length
              if (count === 0) return null
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[cat]}`}
                >
                  <span className="font-semibold">{cat}</span>
                  <span className="bg-slate-800/60 px-1.5 rounded-full font-bold">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
