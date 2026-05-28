import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RelType = 'mentor' | 'mentee'

interface MentoringRelation {
  id: string
  name: string
  role: string
  type: RelType
  goal: string
  startDate: string
  tags: string[]
}

interface MentoringSession {
  id: string
  relationId: string
  date: string
  duration: number
  agenda: string
  insights: string
  actionItems: string[]
  rating: number
}

const STORAGE_KEY = 'mentoring_relations'
const SESSIONS_KEY = 'mentoring_sessions'

export default function MentoringJournal() {
  const { toastSuccess } = useToast()
  const [relations, setRelations] = useState<MentoringRelation[]>([])
  const [sessions, setSessions] = useState<MentoringSession[]>([])
  const [activeRel, setActiveRel] = useState<string | null>(null)
  const [showRelForm, setShowRelForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [relForm, setRelForm] = useState({ name: '', role: '', type: 'mentor' as RelType, goal: '', startDate: new Date().toISOString().split('T')[0], tags: [] as string[], tagInput: '' })
  const [sessForm, setSessForm] = useState({ date: new Date().toISOString().split('T')[0], duration: 30, agenda: '', insights: '', actionInput: '', rating: 5 })
  const [actionItems, setActionItems] = useState<string[]>([])

  useEffect(() => {
    try {
      setRelations(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setSessions(JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveRelations = (u: MentoringRelation[]) => { setRelations(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveSessions = (u: MentoringSession[]) => { setSessions(u); localStorage.setItem(SESSIONS_KEY, JSON.stringify(u)) }

  const addRelation = () => {
    if (!relForm.name.trim()) return
    const tags = relForm.tagInput.split(',').map(t => t.trim()).filter(Boolean)
    const r: MentoringRelation = { id: Date.now().toString(), ...relForm, tags }
    saveRelations([...relations, r])
    setRelForm({ name: '', role: '', type: 'mentor', goal: '', startDate: new Date().toISOString().split('T')[0], tags: [], tagInput: '' })
    setShowRelForm(false)
    setActiveRel(r.id)
    toastSuccess(`${relForm.name} added`)
  }

  const addSession = () => {
    if (!sessForm.agenda.trim() || !activeRel) return
    const s: MentoringSession = { id: Date.now().toString(), relationId: activeRel, ...sessForm, actionItems }
    saveSessions([s, ...sessions])
    setSessForm({ date: new Date().toISOString().split('T')[0], duration: 30, agenda: '', insights: '', actionInput: '', rating: 5 })
    setActionItems([])
    setShowSessionForm(false)
    toastSuccess('Session logged')
  }

  const rel = relations.find(r => r.id === activeRel)
  const relSessions = sessions.filter(s => s.relationId === activeRel)
  const totalMinutes = relSessions.reduce((s, x) => s + x.duration, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Users className="w-7 h-7 text-indigo-400" />
          Mentoring Journal
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track mentoring sessions and growth conversations.</p>
      </div>

      {/* Relations */}
      <div className="flex gap-2 flex-wrap">
        {relations.map(r => (
          <button key={r.id} onClick={() => setActiveRel(r.id)}
            className={`px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 ${activeRel === r.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {r.name}
            <span className={`text-xs px-1 rounded ${r.type === 'mentor' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {r.type}
            </span>
          </button>
        ))}
        <button onClick={() => setShowRelForm(true)} className="px-3 py-1.5 rounded-xl text-sm bg-slate-800 text-slate-500 hover:text-slate-300 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {showRelForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-2">
          <h3 className="text-sm font-semibold text-white">New Mentoring Relationship</h3>
          <div className="flex gap-2">
            <input value={relForm.name} onChange={e => setRelForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *" className="game-input flex-1" autoFocus />
            <select value={relForm.type} onChange={e => setRelForm(f => ({ ...f, type: e.target.value as RelType }))} className="game-input text-sm w-28">
              <option value="mentor">They mentor me</option>
              <option value="mentee">I mentor them</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input value={relForm.role} onChange={e => setRelForm(f => ({ ...f, role: e.target.value }))}
              placeholder="Their role/title" className="game-input flex-1 text-sm" />
            <input type="date" value={relForm.startDate} onChange={e => setRelForm(f => ({ ...f, startDate: e.target.value }))}
              className="game-input text-sm" />
          </div>
          <textarea value={relForm.goal} onChange={e => setRelForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Goal for this mentoring relationship" className="game-input w-full h-16 resize-none text-sm" />
          <input value={relForm.tagInput} onChange={e => setRelForm(f => ({ ...f, tagInput: e.target.value }))}
            placeholder="Tags (comma-separated)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={addRelation} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Add</button>
            <button onClick={() => setShowRelForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {rel && (
        <>
          <div className="game-card p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-white">{rel.name}</span>
                {rel.role && <span className="text-xs text-slate-500 ml-2">{rel.role}</span>}
              </div>
              <button onClick={() => setShowSessionForm(true)}
                className="text-xs px-3 py-1.5 bg-indigo-700/30 text-indigo-400 rounded-lg hover:bg-indigo-700/50">
                + Log session
              </button>
            </div>
            {rel.goal && <p className="text-xs text-slate-500 italic mb-2">🎯 {rel.goal}</p>}
            <div className="flex gap-4 text-center">
              <div><div className="text-lg font-bold text-white">{relSessions.length}</div><div className="text-xs text-slate-500">Sessions</div></div>
              <div><div className="text-lg font-bold text-indigo-400">{Math.round(totalMinutes / 60)}h</div><div className="text-xs text-slate-500">Total</div></div>
              {relSessions.length > 0 && <div><div className="text-lg font-bold text-yellow-400">{(relSessions.reduce((s, x) => s + x.rating, 0) / relSessions.length).toFixed(1)}</div><div className="text-xs text-slate-500">Avg Rating</div></div>}
            </div>
          </div>

          {showSessionForm && (
            <div className="game-card p-4 border border-indigo-500/20 space-y-2">
              <h3 className="text-sm font-semibold text-white">Log Session</h3>
              <div className="flex gap-2">
                <input type="date" value={sessForm.date} onChange={e => setSessForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm" />
                <input type="number" value={sessForm.duration} min={15} step={15}
                  onChange={e => setSessForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="game-input w-20 text-sm text-center" />
                <span className="flex items-center text-xs text-slate-500">min</span>
              </div>
              <textarea value={sessForm.agenda} onChange={e => setSessForm(f => ({ ...f, agenda: e.target.value }))}
                placeholder="What did you discuss? *" className="game-input w-full h-20 resize-none text-sm" autoFocus />
              <textarea value={sessForm.insights} onChange={e => setSessForm(f => ({ ...f, insights: e.target.value }))}
                placeholder="Key insights / takeaways" className="game-input w-full h-16 resize-none text-sm" />
              <div>
                <div className="flex gap-2 mb-1">
                  <input value={sessForm.actionInput} onChange={e => setSessForm(f => ({ ...f, actionInput: e.target.value }))}
                    placeholder="Action item..." className="game-input flex-1 text-sm"
                    onKeyDown={e => { if (e.key === 'Enter' && sessForm.actionInput.trim()) { setActionItems(a => [...a, sessForm.actionInput.trim()]); setSessForm(f => ({ ...f, actionInput: '' })) } }} />
                  <button onClick={() => { if (sessForm.actionInput.trim()) { setActionItems(a => [...a, sessForm.actionInput.trim()]); setSessForm(f => ({ ...f, actionInput: '' })) } }}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs">Add</button>
                </div>
                {actionItems.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-sm text-slate-400">
                    <span className="text-indigo-400">→</span>{a}
                    <button onClick={() => setActionItems(items => items.filter((_, j) => j !== i))} className="ml-auto text-slate-700 hover:text-red-400 text-xs">×</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Rating: {sessForm.rating}/10</span>
                <input type="range" min={1} max={10} value={sessForm.rating}
                  onChange={e => setSessForm(f => ({ ...f, rating: Number(e.target.value) }))}
                  className="flex-1 h-1 accent-indigo-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={addSession} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save Session</button>
                <button onClick={() => setShowSessionForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {relSessions.map(s => {
              const isExp = expanded === s.id
              return (
                <div key={s.id} className="game-card overflow-hidden">
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center">{s.duration}m</div>
                    <div className="flex-1">
                      <p className="text-sm text-white line-clamp-1">{s.agenda}</p>
                      <span className="text-xs text-slate-600">{s.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-400">{'★'.repeat(Math.round(s.rating / 2))}</span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                    </div>
                  </div>
                  {isExp && (
                    <div className="border-t border-slate-800 p-3 space-y-2">
                      <p className="text-sm text-slate-300 leading-relaxed">{s.agenda}</p>
                      {s.insights && <p className="text-sm text-slate-400 italic">💡 {s.insights}</p>}
                      {s.actionItems.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Action items:</p>
                          {s.actionItems.map((a, i) => <p key={i} className="text-xs text-indigo-400">→ {a}</p>)}
                        </div>
                      )}
                      <button onClick={() => saveSessions(sessions.filter(x => x.id !== s.id))}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {relSessions.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No sessions logged yet.</div>
            )}
          </div>
        </>
      )}

      {relations.length === 0 && !showRelForm && (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="mb-1">Track mentoring relationships and sessions.</p>
          <p className="text-sm">Add a mentor or mentee to get started.</p>
        </div>
      )}
    </div>
  )
}
