import { useState, useEffect } from 'react'
import { Briefcase, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MilestoneType = 'promotion' | 'skill' | 'project' | 'recognition' | 'network' | 'income' | 'leadership' | 'certification' | 'launch' | 'other'
type MilestoneStatus = 'achieved' | 'in-progress' | 'planned' | 'target'

interface CareerMilestone {
  id: string
  milestoneType: MilestoneType
  status: MilestoneStatus
  title: string
  description: string
  impact: string
  skills: string
  targetDate: string
  achievedDate: string
  nextMilestone: string
  significance: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<MilestoneType, { label: string; emoji: string; color: string }> = {
  promotion:     { label: 'Promotion',     emoji: '🚀', color: '#f59e0b' },
  skill:         { label: 'Skill Gained',  emoji: '⚡', color: '#3b82f6' },
  project:       { label: 'Project Win',   emoji: '🏆', color: '#22c55e' },
  recognition:   { label: 'Recognition',   emoji: '🌟', color: '#ec4899' },
  network:       { label: 'Key Connection',emoji: '🤝', color: '#0ea5e9' },
  income:        { label: 'Income Goal',   emoji: '💰', color: '#84cc16' },
  leadership:    { label: 'Leadership',    emoji: '👑', color: '#a855f7' },
  certification: { label: 'Certification', emoji: '📜', color: '#6366f1' },
  launch:        { label: 'Launch',        emoji: '🎯', color: '#f97316' },
  other:         { label: 'Other',         emoji: '💼', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string }> = {
  achieved:    { label: 'Achieved! ✅', color: '#22c55e' },
  'in-progress':{ label: 'In Progress',  color: '#3b82f6' },
  planned:     { label: 'Planned',       color: '#94a3b8' },
  target:      { label: 'Target',        color: '#f59e0b' },
}

const STORAGE_KEY = 'career_milestones'

export default function CareerMilestones() {
  const { toastSuccess } = useToast()
  const [milestones, setMilestones] = useState<CareerMilestone[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CareerMilestone, 'id' | 'createdAt'>>({
    milestoneType: 'project', status: 'target', title: '', description: '',
    impact: '', skills: '', targetDate: '', achievedDate: '', nextMilestone: '',
    significance: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setMilestones(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CareerMilestone[]) => { setMilestones(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const m: CareerMilestone = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...milestones])
    setForm(f => ({ ...f, title: '', description: '', impact: '', skills: '', targetDate: '', achievedDate: '', nextMilestone: '' }))
    setShowForm(false)
    toastSuccess('Career milestone logged 🚀')
  }

  const achieved = milestones.filter(m => m.status === 'achieved').length
  const avgSig = milestones.length ? Math.round(milestones.reduce((s, m) => s + m.significance, 0) / milestones.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Briefcase className="w-7 h-7 text-yellow-400" />
            Career Milestones
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map every career achievement and set your next target.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{milestones.length}</div>
          <div className="text-xs text-slate-500">Milestones</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgSig}/10</div>
          <div className="text-xs text-slate-500">Avg Significance</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Career Milestone</h3>
          <div className="flex gap-2">
            <select value={form.milestoneType} onChange={e => setForm(f => ({ ...f, milestoneType: e.target.value as MilestoneType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [MilestoneType, typeof TYPE_CONFIG.promotion][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as MilestoneStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [MilestoneStatus, typeof STATUS_CONFIG.achieved][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Milestone title *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the milestone and what it meant" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="Impact — how did this change your career?" className="game-input w-full text-sm" />
          <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="Skills demonstrated or gained" className="game-input w-full text-sm" />
          <input value={form.nextMilestone} onChange={e => setForm(f => ({ ...f, nextMilestone: e.target.value }))}
            placeholder="What's the next milestone this leads to?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target date</p>
              <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Achieved date</p>
              <input type="date" value={form.achievedDate} onChange={e => setForm(f => ({ ...f, achievedDate: e.target.value }))} className="game-input w-full text-sm" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Significance: {form.significance}/10</p>
            <input type="range" min={1} max={10} value={form.significance}
              onChange={e => setForm(f => ({ ...f, significance: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {milestones.map(m => {
          const t = TYPE_CONFIG[m.milestoneType]
          const s = STATUS_CONFIG[m.status]
          return (
            <div key={m.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{m.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-yellow-400">⭐ {m.significance}/10</span>
                </div>
                {m.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{m.description}</p>}
                {m.impact && <p className="text-xs text-green-300 mt-0.5">→ {m.impact}</p>}
                {m.nextMilestone && <p className="text-xs text-blue-300/70 mt-0.5">Next: {m.nextMilestone}</p>}
              </div>
              <button onClick={() => save(milestones.filter(x => x.id !== m.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {milestones.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your career is your magnum opus. Document every milestone.</p>
          </div>
        )}
      </div>
    </div>
  )
}
