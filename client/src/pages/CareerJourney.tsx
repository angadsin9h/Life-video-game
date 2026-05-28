import { useState, useEffect } from 'react'
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EntryType = 'job' | 'achievement' | 'skill-gained' | 'feedback' | 'goal' | 'network' | 'course' | 'project' | 'other'

interface CareerEntry {
  id: string
  date: string
  type: EntryType
  title: string
  company: string
  description: string
  impact: string
  skills: string
  reflection: string
  isHighlight: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<EntryType, { label: string; emoji: string; color: string }> = {
  job:           { label: 'Job/Role',      emoji: '💼', color: '#6366f1' },
  achievement:   { label: 'Achievement',   emoji: '🏆', color: '#f59e0b' },
  'skill-gained':{ label: 'Skill Gained',  emoji: '⚡', color: '#22c55e' },
  feedback:      { label: 'Feedback',      emoji: '💬', color: '#3b82f6' },
  goal:          { label: 'Career Goal',   emoji: '🎯', color: '#a855f7' },
  network:       { label: 'Networking',    emoji: '🤝', color: '#f97316' },
  course:        { label: 'Course/Cert',   emoji: '📜', color: '#ec4899' },
  project:       { label: 'Project',       emoji: '🔨', color: '#0ea5e9' },
  other:         { label: 'Other',         emoji: '📌', color: '#94a3b8' },
}

const STORAGE_KEY = 'career_journey'

export default function CareerJourney() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CareerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<CareerEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'achievement', title: '', company: '', description: '',
    impact: '', skills: '', reflection: '', isHighlight: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CareerEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: CareerEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], type: 'achievement', title: '', company: '', description: '', impact: '', skills: '', reflection: '', isHighlight: false })
    setShowForm(false)
    toastSuccess('Career entry saved 💼')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const highlights = entries.filter(e => e.isHighlight).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Briefcase className="w-7 h-7 text-indigo-400" />
            Career Journey
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Chronicle your professional path and growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{highlights}</div>
          <div className="text-xs text-slate-500">Highlights</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{entries.filter(e => e.type === 'achievement').length}</div>
          <div className="text-xs text-slate-500">Achievements</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Career Entry</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [EntryType, typeof TYPE_CONFIG.job][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            placeholder="Company / organization" className="game-input w-full text-sm" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description..." className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="Impact / result (quantify if possible)" className="game-input w-full text-sm" />
          <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="Skills involved / gained" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isHighlight} onChange={e => setForm(f => ({ ...f, isHighlight: e.target.checked }))} className="accent-yellow-400" />
            Career highlight (for resume/portfolio)
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{e.isHighlight ? '⭐' : t.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                  </div>
                  <p className="text-xs text-slate-500">{e.date}{e.company && ` · ${e.company}`} · {t.label}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {e.description && <p className="text-xs text-slate-300">{e.description}</p>}
                  {e.impact && <p className="text-xs text-green-300">📊 {e.impact}</p>}
                  {e.skills && <p className="text-xs text-blue-300">⚡ {e.skills}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Document your career journey — every step matters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
