import { useState, useEffect } from 'react'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SkillCategory = 'technical' | 'creative' | 'physical' | 'interpersonal' | 'cognitive' | 'business' | 'leadership' | 'communication' | 'spiritual' | 'craft'
type MasteryStage = 'unconscious-incompetent' | 'conscious-incompetent' | 'conscious-competent' | 'unconscious-competent' | 'mastery'
type LearningMethod = 'practice' | 'study' | 'coaching' | 'teaching' | 'building' | 'deliberate' | 'immersion' | 'reflection'

interface SkillEntry {
  id: string
  skillName: string
  category: SkillCategory
  stage: MasteryStage
  method: LearningMethod
  why: string
  currentLevel: string
  nextMilestone: string
  dailyPractice: string
  hoursTotal: number
  hoursPerWeek: number
  masteryScore: number
  date: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<SkillCategory, { label: string; emoji: string; color: string }> = {
  technical:     { label: 'Technical',     emoji: '💻', color: '#3b82f6' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f97316' },
  physical:      { label: 'Physical',      emoji: '💪', color: '#ef4444' },
  interpersonal: { label: 'Interpersonal', emoji: '🤝', color: '#22c55e' },
  cognitive:     { label: 'Cognitive',     emoji: '🧠', color: '#6366f1' },
  business:      { label: 'Business',      emoji: '💼', color: '#f59e0b' },
  leadership:    { label: 'Leadership',    emoji: '🚀', color: '#a855f7' },
  communication: { label: 'Communication', emoji: '🗣️', color: '#ec4899' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#84cc16' },
  craft:         { label: 'Craft',         emoji: '🔨', color: '#0ea5e9' },
}

const STAGE_CONFIG: Record<MasteryStage, { label: string; color: string; pct: number }> = {
  'unconscious-incompetent':{ label: 'Unaware',    color: '#94a3b8', pct: 10 },
  'conscious-incompetent':  { label: 'Aware',      color: '#f97316', pct: 30 },
  'conscious-competent':    { label: 'Learning',   color: '#f59e0b', pct: 60 },
  'unconscious-competent':  { label: 'Proficient', color: '#22c55e', pct: 85 },
  mastery:                  { label: 'Mastery',    color: '#a855f7', pct: 100 },
}

const METHOD_CONFIG: Record<LearningMethod, { label: string; emoji: string }> = {
  practice:    { label: 'Practice',    emoji: '🔁' },
  study:       { label: 'Study',       emoji: '📚' },
  coaching:    { label: 'Coaching',    emoji: '🎓' },
  teaching:    { label: 'Teaching',    emoji: '👩‍🏫' },
  building:    { label: 'Building',    emoji: '🔨' },
  deliberate:  { label: 'Deliberate',  emoji: '🎯' },
  immersion:   { label: 'Immersion',   emoji: '🌊' },
  reflection:  { label: 'Reflection',  emoji: '🪞' },
}

const STORAGE_KEY = 'skill_mastery_log'

export default function SkillMastery() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SkillEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SkillEntry, 'id' | 'createdAt'>>({
    skillName: '', category: 'technical', stage: 'conscious-incompetent', method: 'deliberate',
    why: '', currentLevel: '', nextMilestone: '', dailyPractice: '',
    hoursTotal: 0, hoursPerWeek: 5, masteryScore: 3,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SkillEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.skillName.trim()) return
    const e: SkillEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, skillName: '', why: '', currentLevel: '', nextMilestone: '', dailyPractice: '' }))
    setShowForm(false)
    toastSuccess('Skill tracked — mastery is 10,000 hours, one rep at a time 🏆')
  }

  const mastered = entries.filter(e => e.stage === 'mastery').length
  const totalHours = entries.reduce((s, e) => s + e.hoursTotal, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <GraduationCap className="w-7 h-7 text-yellow-400" />
            Skill Mastery
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your journey to mastery across every skill.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Track
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Skills</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Total Hours</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Track Skill</h3>
          <input value={form.skillName} onChange={e => setForm(f => ({ ...f, skillName: e.target.value }))}
            placeholder="Skill name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SkillCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CATEGORY_CONFIG) as [SkillCategory, typeof CATEGORY_CONFIG.technical][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as LearningMethod }))} className="game-input text-sm flex-1">
              {(Object.entries(METHOD_CONFIG) as [LearningMethod, typeof METHOD_CONFIG.practice][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>
          <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as MasteryStage }))} className="game-input w-full text-sm">
            {(Object.entries(STAGE_CONFIG) as [MasteryStage, typeof STAGE_CONFIG['mastery']][]).map(([k, s]) => (
              <option key={k} value={k}>{s.label}</option>
            ))}
          </select>
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why are you mastering this skill?" className="game-input w-full text-sm" />
          <input value={form.currentLevel} onChange={e => setForm(f => ({ ...f, currentLevel: e.target.value }))}
            placeholder="Where are you right now?" className="game-input w-full text-sm" />
          <input value={form.nextMilestone} onChange={e => setForm(f => ({ ...f, nextMilestone: e.target.value }))}
            placeholder="Next mastery milestone" className="game-input w-full text-sm" />
          <input value={form.dailyPractice} onChange={e => setForm(f => ({ ...f, dailyPractice: e.target.value }))}
            placeholder="Daily practice routine" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Total hours: {form.hoursTotal}h</p>
              <input type="range" min={0} max={10000} step={10} value={form.hoursTotal}
                onChange={e => setForm(f => ({ ...f, hoursTotal: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">h/week: {form.hoursPerWeek}h</p>
              <input type="range" min={1} max={40} value={form.hoursPerWeek}
                onChange={e => setForm(f => ({ ...f, hoursPerWeek: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Track Skill</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CATEGORY_CONFIG[e.category]
          const s = STAGE_CONFIG[e.stage]
          const m = METHOD_CONFIG[e.method]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.skillName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{m.emoji} {m.label}</span>
                  <span className="text-xs text-yellow-400">⏱ {e.hoursTotal}h</span>
                </div>
                <div className="mt-1.5 bg-slate-700 rounded-full h-1">
                  <div className="h-1 rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                {e.nextMilestone && <p className="text-xs text-blue-300/70 mt-0.5">Next: {e.nextMilestone}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">World-class performance requires world-class skills. Track yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}
