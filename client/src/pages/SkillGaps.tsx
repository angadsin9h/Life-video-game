import { useState, useEffect } from 'react'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SkillDomain = 'technical' | 'leadership' | 'communication' | 'creative' | 'financial' | 'emotional' | 'physical' | 'social' | 'strategic' | 'other'
type SkillPriority = 'critical' | 'high' | 'medium' | 'low'
type SkillStatus = 'not-started' | 'learning' | 'practicing' | 'proficient' | 'mastered'

interface SkillGap {
  id: string
  skillName: string
  domain: SkillDomain
  priority: SkillPriority
  status: SkillStatus
  currentLevel: number
  targetLevel: number
  whyNeeded: string
  learningPlan: string
  resources: string
  deadline: string
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<SkillDomain, { label: string; emoji: string; color: string }> = {
  technical:     { label: 'Technical',     emoji: '💻', color: '#3b82f6' },
  leadership:    { label: 'Leadership',    emoji: '👑', color: '#f59e0b' },
  communication: { label: 'Communication', emoji: '💬', color: '#22c55e' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#a855f7' },
  financial:     { label: 'Financial',     emoji: '💰', color: '#84cc16' },
  emotional:     { label: 'Emotional',     emoji: '❤️', color: '#ec4899' },
  physical:      { label: 'Physical',      emoji: '💪', color: '#ef4444' },
  social:        { label: 'Social',        emoji: '🤝', color: '#0ea5e9' },
  strategic:     { label: 'Strategic',     emoji: '🎯', color: '#6366f1' },
  other:         { label: 'Other',         emoji: '⚡', color: '#94a3b8' },
}

const PRIORITY_CONFIG: Record<SkillPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#ef4444' },
  high:     { label: 'High',     color: '#f97316' },
  medium:   { label: 'Medium',   color: '#f59e0b' },
  low:      { label: 'Low',      color: '#94a3b8' },
}

const STATUS_CONFIG: Record<SkillStatus, { label: string; color: string; pct: number }> = {
  'not-started': { label: 'Not Started', color: '#94a3b8', pct: 0  },
  learning:      { label: 'Learning',    color: '#3b82f6', pct: 25 },
  practicing:    { label: 'Practicing',  color: '#f59e0b', pct: 55 },
  proficient:    { label: 'Proficient',  color: '#22c55e', pct: 80 },
  mastered:      { label: 'Mastered',    color: '#a855f7', pct: 100},
}

const STORAGE_KEY = 'skill_gaps'

export default function SkillGaps() {
  const { toastSuccess } = useToast()
  const [gaps, setGaps] = useState<SkillGap[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SkillGap, 'id' | 'createdAt'>>({
    skillName: '', domain: 'technical', priority: 'high', status: 'not-started',
    currentLevel: 2, targetLevel: 8, whyNeeded: '', learningPlan: '',
    resources: '', deadline: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setGaps(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SkillGap[]) => { setGaps(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.skillName.trim()) return
    const g: SkillGap = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([g, ...gaps])
    setForm(f => ({ ...f, skillName: '', whyNeeded: '', learningPlan: '', resources: '', deadline: '' }))
    setShowForm(false)
    toastSuccess('Skill gap mapped 📚')
  }

  const critical = gaps.filter(g => g.priority === 'critical').length
  const mastered = gaps.filter(g => g.status === 'mastered').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <GraduationCap className="w-7 h-7 text-blue-400" />
            Skill Gaps
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map the skills you need, plan how to get them.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Map
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{gaps.length}</div>
          <div className="text-xs text-slate-500">Gaps Mapped</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{critical}</div>
          <div className="text-xs text-slate-500">Critical</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Skill Gap</h3>
          <input value={form.skillName} onChange={e => setForm(f => ({ ...f, skillName: e.target.value }))}
            placeholder="Skill name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as SkillDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [SkillDomain, typeof DOMAIN_CONFIG.technical][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as SkillPriority }))} className="game-input text-sm flex-1">
              {(Object.entries(PRIORITY_CONFIG) as [SkillPriority, typeof PRIORITY_CONFIG.critical][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SkillStatus }))} className="game-input w-full text-sm">
            {(Object.entries(STATUS_CONFIG) as [SkillStatus, typeof STATUS_CONFIG['not-started']][]).map(([k, s]) => (
              <option key={k} value={k}>{s.label}</option>
            ))}
          </select>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current level: {form.currentLevel}/10</p>
              <input type="range" min={1} max={10} value={form.currentLevel}
                onChange={e => setForm(f => ({ ...f, currentLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target level: {form.targetLevel}/10</p>
              <input type="range" min={1} max={10} value={form.targetLevel}
                onChange={e => setForm(f => ({ ...f, targetLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <input value={form.whyNeeded} onChange={e => setForm(f => ({ ...f, whyNeeded: e.target.value }))}
            placeholder="Why is this skill critical for you?" className="game-input w-full text-sm" />
          <textarea value={form.learningPlan} onChange={e => setForm(f => ({ ...f, learningPlan: e.target.value }))}
            placeholder="Learning plan — how will you develop this?" className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.resources} onChange={e => setForm(f => ({ ...f, resources: e.target.value }))}
            placeholder="Resources (books, courses, mentors)" className="game-input w-full text-sm" />
          <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {gaps.sort((a, b) => {
          const order: Record<SkillPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
          return order[a.priority] - order[b.priority]
        }).map(g => {
          const d = DOMAIN_CONFIG[g.domain]
          const p = PRIORITY_CONFIG[g.priority]
          const s = STATUS_CONFIG[g.status]
          const gap = g.targetLevel - g.currentLevel
          return (
            <div key={g.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{g.skillName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-red-400">{g.currentLevel}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${(g.currentLevel / g.targetLevel) * 100}%`, background: d.color }} />
                  </div>
                  <span className="text-xs text-green-400">{g.targetLevel}</span>
                  <span className="text-xs text-slate-500">Gap: {gap}</span>
                </div>
                {g.whyNeeded && <p className="text-xs text-slate-400 mt-0.5">{g.whyNeeded}</p>}
              </div>
              <button onClick={() => save(gaps.filter(x => x.id !== g.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {gaps.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The gap between where you are and where you want to be is made of skills.</p>
          </div>
        )}
      </div>
    </div>
  )
}
