import { useState, useEffect } from 'react'
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SkillDomain = 'technical' | 'leadership' | 'communication' | 'analytical' | 'creative' | 'interpersonal' | 'industry' | 'tools' | 'other'
type SkillPriority = 'critical' | 'important' | 'nice'
type SkillStatus = 'learning' | 'proficient' | 'expert' | 'gaps'

interface CareerSkill {
  id: string
  name: string
  domain: SkillDomain
  currentLevel: number
  targetLevel: number
  priority: SkillPriority
  status: SkillStatus
  resources: string
  nextAction: string
  lastPracticed: string
  notes: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<SkillDomain, { label: string; emoji: string; color: string }> = {
  technical:      { label: 'Technical',      emoji: '⚙️', color: '#3b82f6' },
  leadership:     { label: 'Leadership',     emoji: '👑', color: '#f59e0b' },
  communication:  { label: 'Communication',  emoji: '💬', color: '#22c55e' },
  analytical:     { label: 'Analytical',     emoji: '📊', color: '#6366f1' },
  creative:       { label: 'Creative',       emoji: '🎨', color: '#a855f7' },
  interpersonal:  { label: 'Interpersonal',  emoji: '🤝', color: '#ec4899' },
  industry:       { label: 'Industry',       emoji: '🏭', color: '#f97316' },
  tools:          { label: 'Tools/Software', emoji: '🛠️', color: '#94a3b8' },
  other:          { label: 'Other',          emoji: '📌', color: '#64748b' },
}

const PRIORITY_CONFIG: Record<SkillPriority, { label: string; color: string }> = {
  critical:  { label: 'Critical',  color: '#ef4444' },
  important: { label: 'Important', color: '#f59e0b' },
  nice:      { label: 'Nice-to-Have', color: '#22c55e' },
}

const STATUS_CONFIG: Record<SkillStatus, { label: string; color: string }> = {
  gaps:       { label: 'Has Gaps',  color: '#ef4444' },
  learning:   { label: 'Learning',  color: '#f59e0b' },
  proficient: { label: 'Proficient',color: '#3b82f6' },
  expert:     { label: 'Expert',    color: '#22c55e' },
}

const STORAGE_KEY = 'career_skills'

export default function CareerSkills() {
  const { toastSuccess } = useToast()
  const [skills, setSkills] = useState<CareerSkill[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [form, setForm] = useState<Omit<CareerSkill, 'id' | 'createdAt'>>({
    name: '', domain: 'technical', currentLevel: 5, targetLevel: 8,
    priority: 'important', status: 'learning', resources: '', nextAction: '', lastPracticed: '', notes: '',
  })

  useEffect(() => {
    try { setSkills(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CareerSkill[]) => { setSkills(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const s: CareerSkill = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...skills])
    setForm({ name: '', domain: 'technical', currentLevel: 5, targetLevel: 8, priority: 'important', status: 'learning', resources: '', nextAction: '', lastPracticed: '', notes: '' })
    setShowForm(false)
    toastSuccess('Skill added 🚀')
  }

  const critical = skills.filter(s => s.priority === 'critical').length
  const avgGap = skills.length
    ? (skills.reduce((sum, s) => sum + (s.targetLevel - s.currentLevel), 0) / skills.length).toFixed(1) : '—'

  const filtered = skills.filter(s => filterDomain === 'all' || s.domain === filterDomain)
    .sort((a, b) => {
      const pOrder = { critical: 0, important: 1, nice: 2 }
      return pOrder[a.priority] - pOrder[b.priority]
    })

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Briefcase className="w-7 h-7 text-blue-400" />
            Career Skills
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map and develop the skills that matter for your career.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{skills.length}</div>
          <div className="text-xs text-slate-500">Skills</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{critical}</div>
          <div className="text-xs text-slate-500">Critical</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgGap}</div>
          <div className="text-xs text-slate-500">Avg Gap</div>
        </div>
      </div>

      {/* Domain filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterDomain('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(DOMAIN_CONFIG) as [SkillDomain, typeof DOMAIN_CONFIG.technical][]).map(([k, d]) => {
          if (!skills.some(s => s.domain === k)) return null
          return (
            <button key={k} onClick={() => setFilterDomain(k)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterDomain === k ? { background: d.color + '30', color: d.color } : {}}>
              {d.emoji} {d.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Skill</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Skill name *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as SkillDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [SkillDomain, typeof DOMAIN_CONFIG.technical][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as SkillPriority }))} className="game-input text-sm">
              {(Object.entries(PRIORITY_CONFIG) as [SkillPriority, typeof PRIORITY_CONFIG.critical][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(STATUS_CONFIG) as [SkillStatus, typeof STATUS_CONFIG.learning][]).map(([k, s]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.status === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.status === k ? { background: s.color + '30', color: s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-32">Current: {form.currentLevel}/10</span>
              <input type="range" min={1} max={10} value={form.currentLevel}
                onChange={e => setForm(f => ({ ...f, currentLevel: Number(e.target.value) }))}
                className="flex-1 h-1 accent-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-32">Target: {form.targetLevel}/10</span>
              <input type="range" min={1} max={10} value={form.targetLevel}
                onChange={e => setForm(f => ({ ...f, targetLevel: Number(e.target.value) }))}
                className="flex-1 h-1 accent-green-400" />
            </div>
          </div>
          <textarea value={form.resources} onChange={e => setForm(f => ({ ...f, resources: e.target.value }))}
            placeholder="Resources to develop this skill..." className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
            placeholder="Next action to improve" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const d = DOMAIN_CONFIG[s.domain]
          const p = PRIORITY_CONFIG[s.priority]
          const st = STATUS_CONFIG[s.status]
          const isExp = expanded === s.id
          const gap = s.targetLevel - s.currentLevel
          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${p.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <span className="text-2xl">{d.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{s.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${s.currentLevel * 10}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{s.currentLevel}→{s.targetLevel}</span>
                    {gap > 0 && <span className="text-xs text-yellow-400">Δ{gap}</span>}
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {s.resources && <p className="text-xs text-slate-400"><span className="text-slate-500">Resources: </span>{s.resources}</p>}
                  {s.nextAction && <p className="text-xs text-blue-400">🎯 Next: {s.nextAction}</p>}
                  {s.notes && <p className="text-xs text-slate-400">{s.notes}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => save(skills.map(x => x.id === s.id ? { ...x, currentLevel: Math.min(10, x.currentLevel + 1), lastPracticed: new Date().toISOString().split('T')[0] } : x))}
                      className="flex-1 py-1.5 bg-blue-700/20 text-blue-400 rounded-xl text-xs hover:bg-blue-700/40">
                      +1 Level Up
                    </button>
                    <button onClick={() => save(skills.filter(x => x.id !== s.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Map your career skills and track development gaps.</p>
          </div>
        )}
      </div>
    </div>
  )
}
