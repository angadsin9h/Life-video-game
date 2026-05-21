import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AdvisorRole = 'mentor' | 'coach' | 'model' | 'peer' | 'challenger' | 'sponsor' | 'therapist' | 'teacher'
type AdvisorStatus = 'active' | 'occasional' | 'past' | 'imaginary' | 'book'

interface AdvisorEntry {
  id: string
  name: string
  role: AdvisorRole
  status: AdvisorStatus
  domain: string
  bestLesson: string
  howTheyHelp: string
  lastContactOrRead: string
  keyQuestion: string
  influenceScore: number
  date: string
  createdAt: string
}

const ROLE_CONFIG: Record<AdvisorRole, { label: string; emoji: string; color: string }> = {
  mentor:     { label: 'Mentor',     emoji: '🎓', color: '#f59e0b' },
  coach:      { label: 'Coach',      emoji: '🏆', color: '#3b82f6' },
  model:      { label: 'Role Model', emoji: '⭐', color: '#a855f7' },
  peer:       { label: 'Peer',       emoji: '🤝', color: '#22c55e' },
  challenger: { label: 'Challenger', emoji: '⚡', color: '#ef4444' },
  sponsor:    { label: 'Sponsor',    emoji: '🚀', color: '#6366f1' },
  therapist:  { label: 'Therapist',  emoji: '🌿', color: '#84cc16' },
  teacher:    { label: 'Teacher',    emoji: '📚', color: '#ec4899' },
}

const STATUS_CONFIG: Record<AdvisorStatus, { label: string; color: string }> = {
  active:     { label: 'Active',     color: '#22c55e' },
  occasional: { label: 'Occasional', color: '#f59e0b' },
  past:       { label: 'Past',       color: '#94a3b8' },
  imaginary:  { label: 'Imaginary',  color: '#a855f7' },
  book:       { label: 'From Book',  color: '#3b82f6' },
}

const STORAGE_KEY = 'personal_boardroom'

export default function PersonalBoardroom() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AdvisorEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AdvisorEntry, 'id' | 'createdAt'>>({
    name: '', role: 'mentor', status: 'active', domain: '',
    bestLesson: '', howTheyHelp: '', lastContactOrRead: '', keyQuestion: '',
    influenceScore: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AdvisorEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const e: AdvisorEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, name: '', domain: '', bestLesson: '', howTheyHelp: '', lastContactOrRead: '', keyQuestion: '' }))
    setShowForm(false)
    toastSuccess('Boardroom member added — surround yourself with greatness 🏛️')
  }

  const active = entries.filter(e => e.status === 'active').length
  const avgInfluence = entries.length ? Math.round(entries.reduce((s, e) => s + e.influenceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-amber-400" />
            Personal Boardroom
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your inner circle of advisors, mentors, and role models.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Members</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgInfluence}/10</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Boardroom Member</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AdvisorRole }))} className="game-input text-sm flex-1">
              {(Object.entries(ROLE_CONFIG) as [AdvisorRole, typeof ROLE_CONFIG.mentor][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AdvisorStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [AdvisorStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
            placeholder="Domain they advise you on" className="game-input w-full text-sm" />
          <textarea value={form.bestLesson} onChange={e => setForm(f => ({ ...f, bestLesson: e.target.value }))}
            placeholder="Best lesson they've taught you" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howTheyHelp} onChange={e => setForm(f => ({ ...f, howTheyHelp: e.target.value }))}
            placeholder="How they help you grow" className="game-input w-full text-sm" />
          <input value={form.lastContactOrRead} onChange={e => setForm(f => ({ ...f, lastContactOrRead: e.target.value }))}
            placeholder="Last contact / book read / encounter" className="game-input w-full text-sm" />
          <input value={form.keyQuestion} onChange={e => setForm(f => ({ ...f, keyQuestion: e.target.value }))}
            placeholder="Key question you'd ask them now" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Influence score: {form.influenceScore}/10</p>
            <input type="range" min={1} max={10} value={form.influenceScore}
              onChange={e => setForm(f => ({ ...f, influenceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Add Member</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const r = ROLE_CONFIG[e.role]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  {e.domain && <span className="text-xs text-slate-500">{e.domain}</span>}
                  <span className="text-xs text-amber-400">⭐ {e.influenceScore}/10</span>
                </div>
                {e.bestLesson && <p className="text-xs text-slate-400 mt-1 line-clamp-2">"{e.bestLesson}"</p>}
                {e.keyQuestion && <p className="text-xs text-blue-300/70 mt-0.5">❓ {e.keyQuestion}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You are the average of your five advisors. Choose wisely.</p>
          </div>
        )}
      </div>
    </div>
  )
}
