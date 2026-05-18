import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ConflictStatus = 'unresolved' | 'ongoing' | 'resolved' | 'accepted'
type ConflictSide = 'my_fault' | 'shared' | 'their_fault' | 'unclear'

interface ConflictEntry {
  id: string
  date: string
  person: string
  relationship: string
  summary: string
  myPerspective: string
  theirPerspective: string
  myRole: ConflictSide
  emotions: string
  wantedOutcome: string
  resolution: string
  lesson: string
  status: ConflictStatus
  createdAt: string
}

const STATUS_CONFIG: Record<ConflictStatus, { label: string; color: string }> = {
  unresolved: { label: 'Unresolved', color: '#ef4444' },
  ongoing:    { label: 'Ongoing',    color: '#f59e0b' },
  resolved:   { label: 'Resolved',   color: '#22c55e' },
  accepted:   { label: 'Accepted',   color: '#94a3b8' },
}

const ROLE_CONFIG: Record<ConflictSide, { label: string; color: string }> = {
  my_fault:    { label: 'Mostly me',    color: '#ef4444' },
  shared:      { label: 'Both sides',   color: '#f59e0b' },
  their_fault: { label: 'Mostly them',  color: '#3b82f6' },
  unclear:     { label: 'Unclear',      color: '#94a3b8' },
}

const STORAGE_KEY = 'conflict_log'

export default function ConflictLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ConflictEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [form, setForm] = useState<Omit<ConflictEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], person: '', relationship: '', summary: '',
    myPerspective: '', theirPerspective: '', myRole: 'shared', emotions: '',
    wantedOutcome: '', resolution: '', lesson: '', status: 'unresolved',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ConflictEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.person.trim() || !form.summary.trim()) return
    const e: ConflictEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], person: '', relationship: '', summary: '', myPerspective: '', theirPerspective: '', myRole: 'shared', emotions: '', wantedOutcome: '', resolution: '', lesson: '', status: 'unresolved' })
    setShowForm(false)
    toastSuccess('Conflict logged')
  }

  const updateStatus = (id: string, status: ConflictStatus) => {
    save(entries.map(e => e.id === id ? { ...e, status } : e))
    if (status === 'resolved') toastSuccess('Conflict resolved! 🕊️')
  }

  const filtered = filterStatus === 'all' ? entries : entries.filter(e => e.status === filterStatus)
  const unresolvedCount = entries.filter(e => e.status === 'unresolved' || e.status === 'ongoing').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-orange-400" />
            Conflict Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Process conflicts with empathy and grow from them.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{unresolvedCount}</div>
          <div className="text-xs text-slate-500">Unresolved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{entries.filter(e => e.status === 'resolved').length}</div>
          <div className="text-xs text-slate-500">Resolved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 rounded-full text-xs ${filterStatus === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
        {(Object.entries(STATUS_CONFIG) as [ConflictStatus, typeof STATUS_CONFIG.unresolved][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilterStatus(k)}
            className="px-3 py-1 rounded-full text-xs"
            style={filterStatus === k ? { background: s.color + '30', color: s.color } : { background: '#1e293b', color: '#64748b' }}>
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log a Conflict</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm" />
            <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              placeholder="With who? *" className="game-input flex-1" autoFocus />
            <input value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
              placeholder="Relationship" className="game-input flex-1 text-sm" />
          </div>
          <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            placeholder="What happened? *" className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.myPerspective} onChange={e => setForm(f => ({ ...f, myPerspective: e.target.value }))}
            placeholder="My perspective and feelings" className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.theirPerspective} onChange={e => setForm(f => ({ ...f, theirPerspective: e.target.value }))}
            placeholder="Their perspective (try to understand it)" className="game-input w-full h-14 resize-none text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1.5">My role in this conflict:</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(ROLE_CONFIG) as [ConflictSide, typeof ROLE_CONFIG.shared][]).map(([k, r]) => (
                <button key={k} onClick={() => setForm(f => ({ ...f, myRole: k }))}
                  className={`px-2.5 py-1 rounded-full text-xs ${form.myRole === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={form.myRole === k ? { background: r.color + '30', color: r.color } : {}}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <input value={form.emotions} onChange={e => setForm(f => ({ ...f, emotions: e.target.value }))}
            placeholder="Emotions I'm feeling" className="game-input w-full text-sm" />
          <input value={form.wantedOutcome} onChange={e => setForm(f => ({ ...f, wantedOutcome: e.target.value }))}
            placeholder="What I want to happen" className="game-input w-full text-sm" />
          <textarea value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="What can I learn from this?" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const s = STATUS_CONFIG[e.status]
          const r = ROLE_CONFIG[e.myRole]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">With {e.person}</span>
                    {e.relationship && <span className="text-xs text-slate-500">{e.relationship}</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{e.summary}</p>
                  <span className="text-xs text-slate-600">{e.date}</span>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-sm text-slate-300">{e.summary}</p>
                  {e.myPerspective && <p className="text-sm text-slate-400"><span className="text-slate-500">Me: </span>{e.myPerspective}</p>}
                  {e.theirPerspective && <p className="text-sm text-slate-400"><span className="text-slate-500">Them: </span>{e.theirPerspective}</p>}
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>My role: {r.label}</span>
                  {e.emotions && <p className="text-xs text-slate-400">Feelings: {e.emotions}</p>}
                  {e.wantedOutcome && <p className="text-xs text-blue-400">Wanted: {e.wantedOutcome}</p>}
                  {e.lesson && <p className="text-sm text-teal-400 italic">💡 {e.lesson}</p>}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {(Object.keys(STATUS_CONFIG) as ConflictStatus[]).map(st => (
                      <button key={st} onClick={() => updateStatus(e.id, st)}
                        className={`px-2 py-0.5 rounded-full text-xs ${e.status === st ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                        style={e.status === st ? { background: STATUS_CONFIG[st].color + '30', color: STATUS_CONFIG[st].color } : {}}>
                        {STATUS_CONFIG[st].label}
                      </button>
                    ))}
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No conflicts logged. Hopefully that's good! 🕊️</p>
          </div>
        )}
      </div>
    </div>
  )
}
