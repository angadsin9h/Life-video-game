import { useState, useEffect } from 'react'
import { Pencil, Plus, Trash2, ChevronDown, ChevronUp, Star, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CreativeType = 'writing' | 'music' | 'art' | 'photography' | 'film' | 'design' | 'crafts' | 'coding' | 'other'
type ProjectStatus = 'idea' | 'active' | 'blocked' | 'done' | 'shelved'

interface CreativeProject {
  id: string
  title: string
  type: CreativeType
  status: ProjectStatus
  description: string
  inspiration: string
  progress: number
  timeSpent: number
  nextStep: string
  tags: string[]
  starred: boolean
  createdAt: string
  updatedAt: string
}

interface CreativeNote {
  id: string
  projectId: string
  note: string
  date: string
}

const TYPE_CONFIG: Record<CreativeType, { label: string; emoji: string; color: string }> = {
  writing:     { label: 'Writing',     emoji: '✍️', color: '#6366f1' },
  music:       { label: 'Music',       emoji: '🎵', color: '#f97316' },
  art:         { label: 'Art',         emoji: '🎨', color: '#ec4899' },
  photography: { label: 'Photography', emoji: '📷', color: '#3b82f6' },
  film:        { label: 'Film',        emoji: '🎬', color: '#ef4444' },
  design:      { label: 'Design',      emoji: '🎭', color: '#a855f7' },
  crafts:      { label: 'Crafts',      emoji: '🧵', color: '#22c55e' },
  coding:      { label: 'Coding',      emoji: '💻', color: '#f59e0b' },
  other:       { label: 'Other',       emoji: '🌟', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  idea:    { label: 'Idea',    color: '#6366f1' },
  active:  { label: 'Active',  color: '#22c55e' },
  blocked: { label: 'Blocked', color: '#ef4444' },
  done:    { label: 'Done',    color: '#94a3b8' },
  shelved: { label: 'Shelved', color: '#475569' },
}

const STORAGE_KEY = 'creative_projects'
const NOTES_KEY = 'creative_notes'

export default function CreativeProjects() {
  const { toastSuccess } = useToast()
  const [projects, setProjects] = useState<CreativeProject[]>([])
  const [notes, setNotes] = useState<CreativeNote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addingNote, setAddingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [form, setForm] = useState<Omit<CreativeProject, 'id' | 'createdAt' | 'updatedAt' | 'starred'> & { tagInput: string }>({
    title: '', type: 'writing', status: 'idea', description: '', inspiration: '', progress: 0,
    timeSpent: 0, nextStep: '', tags: [], tagInput: '',
  })
  const [logTimeId, setLogTimeId] = useState<string | null>(null)
  const [logHours, setLogHours] = useState(1)

  useEffect(() => {
    try {
      setProjects(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setNotes(JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveProjects = (u: CreativeProject[]) => { setProjects(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveNotes = (u: CreativeNote[]) => { setNotes(u); localStorage.setItem(NOTES_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const tags = form.tagInput.split(',').map(t => t.trim()).filter(Boolean)
    const now = new Date().toISOString()
    const p: CreativeProject = { id: Date.now().toString(), ...form, tags, starred: false, createdAt: now, updatedAt: now }
    saveProjects([p, ...projects])
    setForm({ title: '', type: 'writing', status: 'idea', description: '', inspiration: '', progress: 0, timeSpent: 0, nextStep: '', tags: [], tagInput: '' })
    setShowForm(false)
    toastSuccess(`"${form.title}" created ${TYPE_CONFIG[form.type].emoji}`)
  }

  const del = (id: string) => saveProjects(projects.filter(p => p.id !== id))
  const toggleStar = (id: string) => saveProjects(projects.map(p => p.id === id ? { ...p, starred: !p.starred } : p))
  const updateStatus = (id: string, status: ProjectStatus) => saveProjects(projects.map(p => p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
  const updateProgress = (id: string, progress: number) => saveProjects(projects.map(p => p.id === id ? { ...p, progress, updatedAt: new Date().toISOString() } : p))

  const addNote = (projectId: string) => {
    if (!noteText.trim()) return
    const n: CreativeNote = { id: Date.now().toString(), projectId, note: noteText, date: new Date().toISOString().split('T')[0] }
    saveNotes([n, ...notes])
    setNoteText('')
    setAddingNote(null)
    toastSuccess('Note added')
  }

  const logTime = (id: string) => {
    saveProjects(projects.map(p => p.id === id ? { ...p, timeSpent: p.timeSpent + logHours, updatedAt: new Date().toISOString() } : p))
    setLogTimeId(null)
    toastSuccess(`${logHours}h logged`)
  }

  const filtered = projects.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Pencil className="w-7 h-7 text-pink-400" />
            Creative Projects
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage all your creative work in one place.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-white">{projects.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{projects.filter(p => p.status === 'active').length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-slate-400">{projects.filter(p => p.status === 'done').length}</div>
          <div className="text-xs text-slate-500">Done</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-pink-400">{projects.reduce((s, p) => s + p.timeSpent, 0)}h</div>
          <div className="text-xs text-slate-500">Hours</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="game-input text-sm">
          <option value="all">All types</option>
          {(Object.entries(TYPE_CONFIG) as [CreativeType, typeof TYPE_CONFIG.writing][]).map(([k, t]) => (
            <option key={k} value={k}>{t.emoji} {t.label}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="game-input text-sm">
          <option value="all">All status</option>
          {(Object.entries(STATUS_CONFIG) as [ProjectStatus, typeof STATUS_CONFIG.idea][]).map(([k, s]) => (
            <option key={k} value={k}>{s.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Creative Project</h3>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Project title *" className="game-input flex-1" autoFocus />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CreativeType }))} className="game-input text-sm w-32">
              {(Object.entries(TYPE_CONFIG) as [CreativeType, typeof TYPE_CONFIG.writing][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the project..." className="game-input w-full h-16 resize-none text-sm" />
          <input value={form.inspiration} onChange={e => setForm(f => ({ ...f, inspiration: e.target.value }))}
            placeholder="What inspired this?" className="game-input w-full text-sm" />
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="Next step..." className="game-input w-full text-sm" />
          <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
            placeholder="Tags (comma-separated)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Create Project</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(p => {
          const t = TYPE_CONFIG[p.type]
          const s = STATUS_CONFIG[p.status]
          const isExp = expanded === p.id
          const pNotes = notes.filter(n => n.projectId === p.id)
          return (
            <div key={p.id} className="game-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${p.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>{p.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                      {p.starred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                    </div>
                    {p.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: t.color }} />
                      </div>
                      <span className="text-xs text-slate-500">{p.progress}%</span>
                      {p.timeSpent > 0 && <span className="text-xs text-slate-600">{p.timeSpent}h</span>}
                    </div>
                    {p.nextStep && <p className="text-xs text-yellow-500 mt-1">→ {p.nextStep}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleStar(p.id)}>
                      <Star className={`w-3.5 h-3.5 ${p.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-yellow-400'}`} />
                    </button>
                    <button onClick={() => setExpanded(isExp ? null : p.id)} className="text-slate-600 hover:text-slate-300">
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => del(p.id)}>
                      <X className="w-3.5 h-3.5 text-slate-700 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-3">
                  {p.inspiration && <p className="text-xs text-slate-400 italic">💡 {p.inspiration}</p>}
                  {p.tags.length > 0 && (
                    <div className="flex gap-1">{p.tags.map(tag => <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">#{tag}</span>)}</div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Progress: {p.progress}%</p>
                    <input type="range" min={0} max={100} value={p.progress}
                      onChange={e => updateProgress(p.id, Number(e.target.value))}
                      className="w-full h-1 accent-pink-400" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(st => (
                      <button key={st} onClick={() => updateStatus(p.id, st)}
                        className={`px-2 py-0.5 rounded-full text-xs ${p.status === st ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                        style={p.status === st ? { background: STATUS_CONFIG[st].color + '30', color: STATUS_CONFIG[st].color } : {}}>
                        {STATUS_CONFIG[st].label}
                      </button>
                    ))}
                  </div>
                  {logTimeId === p.id ? (
                    <div className="flex gap-2 items-center">
                      <input type="number" value={logHours} min={0.5} step={0.5}
                        onChange={e => setLogHours(Number(e.target.value))}
                        className="game-input w-16 text-sm text-center" />
                      <span className="text-xs text-slate-500">hours</span>
                      <button onClick={() => logTime(p.id)} className="px-3 py-1 bg-pink-700 text-white rounded-lg text-xs">Log</button>
                      <button onClick={() => setLogTimeId(null)} className="text-xs text-slate-600">cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setLogTimeId(p.id)} className="text-xs text-slate-500 hover:text-pink-400">+ Log time worked</button>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Notes ({pNotes.length})</p>
                    {addingNote === p.id ? (
                      <div className="flex gap-2">
                        <input value={noteText} onChange={e => setNoteText(e.target.value)}
                          placeholder="Add note..." className="game-input flex-1 text-sm" autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') addNote(p.id) }} />
                        <button onClick={() => addNote(p.id)} className="px-3 py-1 bg-pink-700 text-white rounded-lg text-xs">Add</button>
                        <button onClick={() => setAddingNote(null)} className="text-xs text-slate-600">×</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingNote(p.id)} className="text-xs text-slate-500 hover:text-slate-300">+ Add note</button>
                    )}
                    {pNotes.slice(0, 3).map(n => (
                      <div key={n.id} className="flex items-start gap-2 mt-1.5">
                        <span className="text-xs text-slate-600 w-16 flex-shrink-0">{n.date}</span>
                        <p className="text-xs text-slate-400 flex-1">{n.note}</p>
                        <button onClick={() => saveNotes(notes.filter(x => x.id !== n.id))} className="text-slate-700 hover:text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Pencil className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No creative projects yet. Start creating!</p>
          </div>
        )}
      </div>
    </div>
  )
}
