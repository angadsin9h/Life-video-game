import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ProjectType = 'community' | 'charity' | 'event' | 'group' | 'initiative' | 'collaboration' | 'mentorship' | 'advocacy' | 'other'
type ProjectStatus = 'idea' | 'planning' | 'active' | 'paused' | 'completed' | 'abandoned'

interface SocialProject {
  id: string
  type: ProjectType
  name: string
  mission: string
  impact: string
  people: string[]
  status: ProjectStatus
  progress: number
  nextStep: string
  startDate: string
  endDate: string
  lessons: string
  createdAt: string
}

const TYPE_CONFIG: Record<ProjectType, { label: string; emoji: string; color: string }> = {
  community:     { label: 'Community',     emoji: '🏘️', color: '#22c55e' },
  charity:       { label: 'Charity',       emoji: '❤️', color: '#ef4444' },
  event:         { label: 'Event',         emoji: '🎉', color: '#f59e0b' },
  group:         { label: 'Group',         emoji: '👥', color: '#3b82f6' },
  initiative:    { label: 'Initiative',    emoji: '🚀', color: '#a855f7' },
  collaboration: { label: 'Collaboration', emoji: '🤝', color: '#6366f1' },
  mentorship:    { label: 'Mentorship',    emoji: '🎓', color: '#f97316' },
  advocacy:      { label: 'Advocacy',      emoji: '📢', color: '#ec4899' },
  other:         { label: 'Other',         emoji: '🌟', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  idea:      { label: 'Idea',      color: '#94a3b8' },
  planning:  { label: 'Planning',  color: '#f59e0b' },
  active:    { label: 'Active',    color: '#22c55e' },
  paused:    { label: 'Paused',    color: '#3b82f6' },
  completed: { label: 'Completed', color: '#a855f7' },
  abandoned: { label: 'Abandoned', color: '#475569' },
}

const STORAGE_KEY = 'social_projects'

export default function SocialProjects() {
  const { toastSuccess } = useToast()
  const [projects, setProjects] = useState<SocialProject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [newPerson, setNewPerson] = useState('')
  const [form, setForm] = useState<Omit<SocialProject, 'id' | 'createdAt'>>({
    type: 'community', name: '', mission: '', impact: '', people: [],
    status: 'idea', progress: 0, nextStep: '', startDate: '', endDate: '', lessons: '',
  })

  useEffect(() => {
    try { setProjects(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SocialProject[]) => { setProjects(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const p: SocialProject = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([p, ...projects])
    setForm(f => ({ ...f, name: '', mission: '', impact: '', people: [], nextStep: '', lessons: '' }))
    setNewPerson('')
    setShowForm(false)
    toastSuccess('Social project added 🤝')
  }

  const filtered = projects.filter(p => filterType === 'all' || p.type === filterType)
  const active = projects.filter(p => p.status === 'active').length
  const completed = projects.filter(p => p.status === 'completed').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-green-400" />
            Social Projects
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track community projects, initiatives and collaborations.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{projects.length}</div>
          <div className="text-xs text-slate-500">Projects</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [ProjectType, typeof TYPE_CONFIG.community][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Social Project</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ProjectType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ProjectType, typeof TYPE_CONFIG.community][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))} className="game-input text-sm flex-1">
              {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Project name *" className="game-input w-full" autoFocus />
          <textarea value={form.mission} onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}
            placeholder="Mission / goal of this project..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="Who / what does it impact?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newPerson} onChange={e => setNewPerson(e.target.value)}
              placeholder="Add collaborator..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newPerson.trim()) { setForm(f => ({ ...f, people: [...f.people, newPerson.trim()] })); setNewPerson('') } }} />
            <button onClick={() => { if (newPerson.trim()) { setForm(f => ({ ...f, people: [...f.people, newPerson.trim()] })); setNewPerson('') } }}
              className="px-3 py-1.5 bg-green-700/30 text-green-400 rounded-xl text-xs">Add</button>
          </div>
          {form.people.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.people.map((p, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full text-xs">
                  👤 {p}
                  <button onClick={() => setForm(fo => ({ ...fo, people: fo.people.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="Next action step" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Progress: {form.progress}%</p>
              <input type="range" min={0} max={100} step={5} value={form.progress}
                onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="game-input text-sm flex-1" placeholder="Start date" />
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="game-input text-sm flex-1" placeholder="End date" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(p => {
          const t = TYPE_CONFIG[p.type]
          const s = STATUS_CONFIG[p.status]
          const isExp = expanded === p.id
          return (
            <div key={p.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : p.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{p.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-700 rounded-full">
                      <div className="h-1 rounded-full" style={{ width: `${p.progress}%`, background: t.color }} />
                    </div>
                    <span className="text-xs text-slate-500">{p.progress}%</span>
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {p.mission && <p className="text-xs text-slate-300">{p.mission}</p>}
                  {p.impact && <p className="text-xs text-green-300">🌍 {p.impact}</p>}
                  {p.people.length > 0 && <p className="text-xs text-blue-300">👥 {p.people.join(', ')}</p>}
                  {p.nextStep && <p className="text-xs text-yellow-300">→ {p.nextStep}</p>}
                  <div className="flex gap-2 items-center">
                    <select value={p.status} onChange={ev => save(projects.map(x => x.id === p.id ? { ...x, status: ev.target.value as ProjectStatus } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {Object.entries(STATUS_CONFIG).map(([k, st]) => <option key={k} value={k}>{st.label}</option>)}
                    </select>
                    <button onClick={() => save(projects.filter(x => x.id !== p.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The best projects bring people together. What social impact will you create?</p>
          </div>
        )}
      </div>
    </div>
  )
}
