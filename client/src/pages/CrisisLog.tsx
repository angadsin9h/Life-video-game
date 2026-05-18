import { useState, useEffect } from 'react'
import { AlertOctagon, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CrisisType = 'mental-health' | 'financial' | 'relationship' | 'health' | 'work' | 'family' | 'identity' | 'loss' | 'other'
type CrisisPhase = 'acute' | 'managing' | 'recovering' | 'resolved' | 'lessons-learned'

interface CrisisEntry {
  id: string
  type: CrisisType
  phase: CrisisPhase
  title: string
  what: string
  howHandled: string
  support: string
  resources: string[]
  painLevel: number
  growthRating: number
  date: string
  resolvedDate: string
  keyLesson: string
  createdAt: string
}

const TYPE_CONFIG: Record<CrisisType, { label: string; emoji: string; color: string }> = {
  'mental-health': { label: 'Mental Health', emoji: '🧠', color: '#a855f7' },
  financial:       { label: 'Financial',     emoji: '💸', color: '#ef4444' },
  relationship:    { label: 'Relationship',  emoji: '💔', color: '#ec4899' },
  health:          { label: 'Health',        emoji: '🏥', color: '#f97316' },
  work:            { label: 'Work',          emoji: '💼', color: '#3b82f6' },
  family:          { label: 'Family',        emoji: '👨‍👩‍👧', color: '#22c55e' },
  identity:        { label: 'Identity',      emoji: '🔍', color: '#6366f1' },
  loss:            { label: 'Loss / Grief',  emoji: '🕊️', color: '#94a3b8' },
  other:           { label: 'Other',         emoji: '⚡', color: '#f59e0b' },
}

const PHASE_CONFIG: Record<CrisisPhase, { label: string; color: string }> = {
  acute:           { label: 'Acute',          color: '#ef4444' },
  managing:        { label: 'Managing',        color: '#f97316' },
  recovering:      { label: 'Recovering',      color: '#f59e0b' },
  resolved:        { label: 'Resolved',        color: '#22c55e' },
  'lessons-learned': { label: 'Integrated',   color: '#a855f7' },
}

const STORAGE_KEY = 'crisis_log'

export default function CrisisLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CrisisEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newResource, setNewResource] = useState('')
  const [form, setForm] = useState<Omit<CrisisEntry, 'id' | 'createdAt'>>({
    type: 'mental-health', phase: 'acute', title: '', what: '', howHandled: '',
    support: '', resources: [], painLevel: 7, growthRating: 5,
    date: new Date().toISOString().split('T')[0], resolvedDate: '', keyLesson: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CrisisEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: CrisisEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', what: '', howHandled: '', support: '', resources: [], keyLesson: '', resolvedDate: '' }))
    setNewResource('')
    setShowForm(false)
    toastSuccess('Crisis entry logged 💪')
  }

  const resolved = entries.filter(e => e.phase === 'resolved' || e.phase === 'lessons-learned').length
  const avgGrowth = entries.length ? Math.round(entries.reduce((s, e) => s + e.growthRating, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertOctagon className="w-7 h-7 text-red-400" />
            Crisis Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document crises and the strength they built in you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{resolved}</div>
          <div className="text-xs text-slate-500">Resolved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgGrowth}/10</div>
          <div className="text-xs text-slate-500">Avg Growth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Crisis</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CrisisType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [CrisisType, typeof TYPE_CONFIG.health][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as CrisisPhase }))} className="game-input text-sm flex-1">
              {(Object.entries(PHASE_CONFIG) as [CrisisPhase, typeof PHASE_CONFIG.acute][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Crisis title *" className="game-input w-full" autoFocus />
          <textarea value={form.what} onChange={e => setForm(f => ({ ...f, what: e.target.value }))}
            placeholder="What happened?" className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.howHandled} onChange={e => setForm(f => ({ ...f, howHandled: e.target.value }))}
            placeholder="How did you handle it?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.support} onChange={e => setForm(f => ({ ...f, support: e.target.value }))}
            placeholder="Who / what supported you?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newResource} onChange={e => setNewResource(e.target.value)}
              placeholder="Resource (book, hotline, etc.)" className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newResource.trim()) { setForm(f => ({ ...f, resources: [...f.resources, newResource.trim()] })); setNewResource('') } }} />
            <button onClick={() => { if (newResource.trim()) { setForm(f => ({ ...f, resources: [...f.resources, newResource.trim()] })); setNewResource('') } }}
              className="px-3 py-1.5 bg-red-700/30 text-red-400 rounded-xl text-xs">Add</button>
          </div>
          {form.resources.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.resources.map((r, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-red-900/30 text-red-300 rounded-full text-xs">
                  {r}
                  <button onClick={() => setForm(fo => ({ ...fo, resources: fo.resources.filter((_, j) => j !== i) }))} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Pain level: {form.painLevel}/10</p>
              <input type="range" min={1} max={10} value={form.painLevel}
                onChange={e => setForm(f => ({ ...f, painLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Growth gained: {form.growthRating}/10</p>
              <input type="range" min={0} max={10} value={form.growthRating}
                onChange={e => setForm(f => ({ ...f, growthRating: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
          </div>
          <input value={form.keyLesson} onChange={e => setForm(f => ({ ...f, keyLesson: e.target.value }))}
            placeholder="Key lesson learned..." className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-xs flex-1" />
            <input type="date" value={form.resolvedDate} onChange={e => setForm(f => ({ ...f, resolvedDate: e.target.value }))} className="game-input text-xs flex-1" placeholder="Resolved date" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.type]
          const p = PHASE_CONFIG[e.phase]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${p.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · pain {e.painLevel}/10 · growth {e.growthRating}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.what && <p className="text-xs text-slate-300">{e.what}</p>}
                  {e.howHandled && <p className="text-xs text-blue-300">🛡️ {e.howHandled}</p>}
                  {e.support && <p className="text-xs text-green-300">🤝 Support: {e.support}</p>}
                  {e.resources.length > 0 && <p className="text-xs text-slate-400">📚 {e.resources.join(', ')}</p>}
                  {e.keyLesson && <p className="text-xs text-yellow-300">💡 {e.keyLesson}</p>}
                  <div className="flex gap-2 items-center">
                    <select value={e.phase} onChange={ev => save(entries.map(x => x.id === e.id ? { ...x, phase: ev.target.value as CrisisPhase } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {(Object.entries(PHASE_CONFIG) as [CrisisPhase, typeof PHASE_CONFIG.acute][]).map(([k, ph]) => (
                        <option key={k} value={k}>{ph.label}</option>
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
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every crisis you survived made you stronger. Document them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
