import { useState, useEffect } from 'react'
import { Search, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ResearchCategory = 'health' | 'finance' | 'career' | 'relationships' | 'science' | 'history' | 'philosophy' | 'technology' | 'personal-dev' | 'other'
type ResearchStatus = 'active' | 'complete' | 'archived'

interface ResearchEntry {
  id: string
  topic: string
  category: ResearchCategory
  status: ResearchStatus
  question: string
  findings: string
  sources: string
  conclusions: string
  tags: string
  createdAt: string
  updatedAt: string
}

const CAT_CONFIG: Record<ResearchCategory, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',       emoji: '❤️', color: '#ef4444' },
  finance:       { label: 'Finance',      emoji: '💰', color: '#22c55e' },
  career:        { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  relationships: { label: 'Relationships',emoji: '💕', color: '#ec4899' },
  science:       { label: 'Science',      emoji: '🔬', color: '#6366f1' },
  history:       { label: 'History',      emoji: '📜', color: '#f59e0b' },
  philosophy:    { label: 'Philosophy',   emoji: '🤔', color: '#a855f7' },
  technology:    { label: 'Technology',   emoji: '⚡', color: '#0ea5e9' },
  'personal-dev':{ label: 'Personal Dev', emoji: '🌱', color: '#84cc16' },
  other:         { label: 'Other',        emoji: '🔍', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ResearchStatus, { label: string; color: string }> = {
  active:   { label: 'Researching', color: '#3b82f6' },
  complete: { label: 'Complete',    color: '#22c55e' },
  archived: { label: 'Archived',    color: '#94a3b8' },
}

const STORAGE_KEY = 'personal_research'

export default function PersonalResearch() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ResearchEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<ResearchEntry, 'id' | 'createdAt' | 'updatedAt'>>({
    topic: '', category: 'personal-dev', status: 'active',
    question: '', findings: '', sources: '', conclusions: '', tags: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ResearchEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.topic.trim()) return
    const now = new Date().toISOString()
    const e: ResearchEntry = { id: Date.now().toString(), ...form, createdAt: now, updatedAt: now }
    save([e, ...entries])
    setForm({ topic: '', category: 'personal-dev', status: 'active', question: '', findings: '', sources: '', conclusions: '', tags: '' })
    setShowForm(false)
    toastSuccess('Research topic saved 🔍')
  }

  const filtered = entries.filter(e => filterCat === 'all' || e.category === filterCat)
  const usedCats = [...new Set(entries.map(e => e.category))]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Search className="w-7 h-7 text-cyan-400" />
            Personal Research
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Curate your personal knowledge research.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Topics</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{entries.filter(e => e.status === 'active').length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{entries.filter(e => e.status === 'complete').length}</div>
          <div className="text-xs text-slate-500">Complete</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {usedCats.map(c => {
          const cfg = CAT_CONFIG[c as ResearchCategory]
          return (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === c ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterCat === c ? { background: cfg.color + '30', color: cfg.color } : {}}>
              {cfg.emoji} {cfg.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Research Topic</h3>
          <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            placeholder="Research topic *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ResearchCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [ResearchCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ResearchStatus }))} className="game-input text-sm">
              {(Object.entries(STATUS_CONFIG) as [ResearchStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="What are you trying to answer?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))}
            placeholder="Key findings and notes..." className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.conclusions} onChange={e => setForm(f => ({ ...f, conclusions: e.target.value }))}
            placeholder="Conclusions / what you've learned..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.sources} onChange={e => setForm(f => ({ ...f, sources: e.target.value }))}
            placeholder="Sources (books, articles, etc.)" className="game-input w-full text-sm" />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const c = CAT_CONFIG[e.category]
          const s = STATUS_CONFIG[e.status]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.topic}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  {e.question && <p className="text-xs text-slate-500 truncate">{e.question}</p>}
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {e.findings && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Findings:</p>
                      <p className="text-xs text-slate-300">{e.findings}</p>
                    </div>
                  )}
                  {e.conclusions && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Conclusions:</p>
                      <p className="text-xs text-green-300">{e.conclusions}</p>
                    </div>
                  )}
                  {e.sources && <p className="text-xs text-slate-500">📚 {e.sources}</p>}
                  {e.tags && <p className="text-xs text-slate-600">🏷️ {e.tags}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => save(entries.map(x => x.id === e.id ? { ...x, status: x.status === 'complete' ? 'active' : 'complete', updatedAt: new Date().toISOString() } : x))}
                      className="text-xs text-cyan-600 hover:text-cyan-400">
                      {e.status === 'complete' ? 'Reopen' : '✓ Mark complete'}
                    </button>
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">
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
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Collect and organize your personal research topics.</p>
          </div>
        )}
      </div>
    </div>
  )
}
