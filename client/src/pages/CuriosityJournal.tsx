import { useState, useEffect } from 'react'
import { Lightbulb, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CuriosityDomain = 'science' | 'history' | 'philosophy' | 'technology' | 'nature' | 'people' | 'culture' | 'art' | 'math' | 'other'
type CuriosityStatus = 'wondering' | 'researching' | 'answered' | 'rabbit-hole'

interface CuriosityEntry {
  id: string
  question: string
  domain: CuriosityDomain
  status: CuriosityStatus
  trigger: string
  research: string
  answer: string
  relatedQuestions: string
  resources: string
  fascination: number
  createdAt: string
}

const DOMAIN_CONFIG: Record<CuriosityDomain, { label: string; emoji: string; color: string }> = {
  science:     { label: 'Science',     emoji: '🔬', color: '#3b82f6' },
  history:     { label: 'History',     emoji: '📜', color: '#f59e0b' },
  philosophy:  { label: 'Philosophy',  emoji: '🤔', color: '#6366f1' },
  technology:  { label: 'Technology',  emoji: '⚙️', color: '#22c55e' },
  nature:      { label: 'Nature',      emoji: '🌿', color: '#10b981' },
  people:      { label: 'People',      emoji: '👥', color: '#ec4899' },
  culture:     { label: 'Culture',     emoji: '🌍', color: '#f97316' },
  art:         { label: 'Art',         emoji: '🎨', color: '#a855f7' },
  math:        { label: 'Math',        emoji: '📐', color: '#0ea5e9' },
  other:       { label: 'Other',       emoji: '💡', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<CuriosityStatus, { label: string; emoji: string; color: string }> = {
  wondering:    { label: 'Wondering',    emoji: '🤔', color: '#f59e0b' },
  researching:  { label: 'Researching', emoji: '🔍', color: '#3b82f6' },
  answered:     { label: 'Answered',    emoji: '✅', color: '#22c55e' },
  'rabbit-hole':{ label: 'Rabbit Hole', emoji: '🐇', color: '#a855f7' },
}

const STORAGE_KEY = 'curiosity_journal'

export default function CuriosityJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CuriosityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [form, setForm] = useState<Omit<CuriosityEntry, 'id' | 'createdAt'>>({
    question: '', domain: 'science', status: 'wondering', trigger: '',
    research: '', answer: '', relatedQuestions: '', resources: '', fascination: 3,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CuriosityEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.question.trim()) return
    const e: CuriosityEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, question: '', trigger: '', research: '', answer: '', relatedQuestions: '', resources: '' }))
    setShowForm(false)
    toastSuccess('Curiosity captured 💡')
  }

  const filtered = entries.filter(e => filterDomain === 'all' || e.domain === filterDomain)
  const answered = entries.filter(e => e.status === 'answered').length
  const rabbitHoles = entries.filter(e => e.status === 'rabbit-hole').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Curiosity Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track every question your curious mind asks.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Ask
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Questions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{answered}</div>
          <div className="text-xs text-slate-500">Answered</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{rabbitHoles}</div>
          <div className="text-xs text-slate-500">Rabbit Holes</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterDomain('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(DOMAIN_CONFIG) as [CuriosityDomain, typeof DOMAIN_CONFIG.science][]).map(([k, d]) => (
          <button key={k} onClick={() => setFilterDomain(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterDomain === k ? { background: d.color + '30', color: d.color } : {}}>
            {d.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture a Question</h3>
          <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="What are you curious about? *" className="game-input w-full h-14 resize-none" autoFocus />
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as CuriosityDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [CuriosityDomain, typeof DOMAIN_CONFIG.science][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CuriosityStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [CuriosityStatus, typeof STATUS_CONFIG.wondering][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggered this question?" className="game-input w-full text-sm" />
          <textarea value={form.research} onChange={e => setForm(f => ({ ...f, research: e.target.value }))}
            placeholder="Research notes / what you've found..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
            placeholder="The answer (if found)..." className="game-input w-full text-sm" />
          <input value={form.relatedQuestions} onChange={e => setForm(f => ({ ...f, relatedQuestions: e.target.value }))}
            placeholder="Related questions this raised..." className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Fascination: {form.fascination}/5</p>
            <input type="range" min={1} max={5} value={form.fascination}
              onChange={e => setForm(f => ({ ...f, fascination: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const s = STATUS_CONFIG[e.status]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${d.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm leading-snug truncate">{e.question}</p>
                  <p className="text-xs text-slate-500">{d.label} · {'⭐'.repeat(e.fascination)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.trigger && <p className="text-xs text-slate-400">💭 Triggered by: {e.trigger}</p>}
                  {e.research && <p className="text-xs text-blue-300">🔍 {e.research}</p>}
                  {e.answer && <p className="text-xs text-green-300">✅ {e.answer}</p>}
                  {e.relatedQuestions && <p className="text-xs text-yellow-300">❓ Related: {e.relatedQuestions}</p>}
                  <div className="flex gap-2 mt-1">
                    <select value={e.status} onChange={ev => save(entries.map(x => x.id === e.id ? { ...x, status: ev.target.value as CuriosityStatus } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {(Object.entries(STATUS_CONFIG) as [CuriosityStatus, typeof STATUS_CONFIG.wondering][]).map(([k, st]) => (
                        <option key={k} value={k}>{st.emoji} {st.label}</option>
                      ))}
                    </select>
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Stay curious. Capture every question that fascinates you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
