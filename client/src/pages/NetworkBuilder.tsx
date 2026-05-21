import { useState, useEffect } from 'react'
import { Network, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ContactSphere = 'professional' | 'mentor' | 'peer' | 'friend' | 'community' | 'family' | 'client' | 'collaborator' | 'inspiration' | 'other'
type RelationshipStrength = 'weak' | 'acquaintance' | 'friendly' | 'close' | 'deep'
type LastContactRecency = 'this-week' | 'this-month' | 'this-quarter' | 'this-year' | 'overdue'

interface NetworkContact {
  id: string
  name: string
  sphere: ContactSphere
  strength: RelationshipStrength
  recency: LastContactRecency
  role: string
  howWeMet: string
  valueExchanged: string
  nextStep: string
  tags: string
  date: string
  createdAt: string
}

const SPHERE_CONFIG: Record<ContactSphere, { label: string; emoji: string; color: string }> = {
  professional:  { label: 'Professional',  emoji: '💼', color: '#3b82f6' },
  mentor:        { label: 'Mentor',        emoji: '🎓', color: '#f59e0b' },
  peer:          { label: 'Peer',          emoji: '🤝', color: '#22c55e' },
  friend:        { label: 'Friend',        emoji: '😊', color: '#ec4899' },
  community:     { label: 'Community',     emoji: '🌍', color: '#84cc16' },
  family:        { label: 'Family',        emoji: '👨‍👩‍👧', color: '#ef4444' },
  client:        { label: 'Client',        emoji: '💰', color: '#6366f1' },
  collaborator:  { label: 'Collaborator',  emoji: '🔗', color: '#a855f7' },
  inspiration:   { label: 'Inspiration',   emoji: '⭐', color: '#f97316' },
  other:         { label: 'Other',         emoji: '👤', color: '#94a3b8' },
}

const STRENGTH_CONFIG: Record<RelationshipStrength, { label: string; color: string }> = {
  weak:         { label: 'Weak',         color: '#94a3b8' },
  acquaintance: { label: 'Acquaintance', color: '#3b82f6' },
  friendly:     { label: 'Friendly',     color: '#22c55e' },
  close:        { label: 'Close',        color: '#f59e0b' },
  deep:         { label: 'Deep',         color: '#a855f7' },
}

const RECENCY_CONFIG: Record<LastContactRecency, { label: string; color: string }> = {
  'this-week':    { label: 'This Week',    color: '#22c55e' },
  'this-month':   { label: 'This Month',   color: '#84cc16' },
  'this-quarter': { label: 'This Quarter', color: '#f59e0b' },
  'this-year':    { label: 'This Year',    color: '#f97316' },
  overdue:        { label: 'Overdue',      color: '#ef4444' },
}

const STORAGE_KEY = 'network_builder'

export default function NetworkBuilder() {
  const { toastSuccess } = useToast()
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterSphere, setFilterSphere] = useState<ContactSphere | 'all'>('all')
  const [form, setForm] = useState<Omit<NetworkContact, 'id' | 'createdAt'>>({
    name: '', sphere: 'professional', strength: 'acquaintance', recency: 'this-month',
    role: '', howWeMet: '', valueExchanged: '', nextStep: '', tags: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: NetworkContact[]) => { setContacts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const c: NetworkContact = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([c, ...contacts])
    setForm(f => ({ ...f, name: '', role: '', howWeMet: '', valueExchanged: '', nextStep: '', tags: '' }))
    setShowForm(false)
    toastSuccess('Contact added — your network is your net worth 🤝')
  }

  const visible = filterSphere === 'all' ? contacts : contacts.filter(c => c.sphere === filterSphere)
  const overdue = contacts.filter(c => c.recency === 'overdue').length
  const deep = contacts.filter(c => c.strength === 'deep' || c.strength === 'close').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Network className="w-7 h-7 text-blue-400" />
            Network Builder
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Intentionally grow and nurture your network.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{contacts.length}</div>
          <div className="text-xs text-slate-500">Contacts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{deep}</div>
          <div className="text-xs text-slate-500">Deep Ties</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{overdue}</div>
          <div className="text-xs text-slate-500">Overdue</div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['all', ...Object.keys(SPHERE_CONFIG)] as (ContactSphere | 'all')[]).map(s => (
          <button key={s} onClick={() => setFilterSphere(s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterSphere === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {s === 'all' ? 'All' : SPHERE_CONFIG[s as ContactSphere].emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Contact</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.sphere} onChange={e => setForm(f => ({ ...f, sphere: e.target.value as ContactSphere }))} className="game-input text-sm flex-1">
              {(Object.entries(SPHERE_CONFIG) as [ContactSphere, typeof SPHERE_CONFIG.professional][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value as RelationshipStrength }))} className="game-input text-sm flex-1">
              {(Object.entries(STRENGTH_CONFIG) as [RelationshipStrength, typeof STRENGTH_CONFIG.acquaintance][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="Their role / title" className="game-input text-sm flex-1" />
            <select value={form.recency} onChange={e => setForm(f => ({ ...f, recency: e.target.value as LastContactRecency }))} className="game-input text-sm flex-1">
              {(Object.entries(RECENCY_CONFIG) as [LastContactRecency, typeof RECENCY_CONFIG['this-week']][]).map(([k, r]) => (
                <option key={k} value={k}>{r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.howWeMet} onChange={e => setForm(f => ({ ...f, howWeMet: e.target.value }))}
            placeholder="How you met" className="game-input w-full text-sm" />
          <input value={form.valueExchanged} onChange={e => setForm(f => ({ ...f, valueExchanged: e.target.value }))}
            placeholder="Value exchanged or shared" className="game-input w-full text-sm" />
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="Next step to nurture this relationship" className="game-input w-full text-sm" />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (e.g. investor, design, NYC)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Add Contact</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {visible.map(c => {
          const sp = SPHERE_CONFIG[c.sphere]
          const st = STRENGTH_CONFIG[c.strength]
          const rc = RECENCY_CONFIG[c.recency]
          return (
            <div key={c.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${st.color}` }}>
              <span className="text-2xl">{sp.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{c.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: rc.color + '20', color: rc.color }}>{rc.label}</span>
                  <span className="text-xs text-slate-500">{sp.label}</span>
                </div>
                {c.role && <p className="text-xs text-slate-400 mt-0.5">{c.role}</p>}
                {c.nextStep && <p className="text-xs text-blue-300/80 mt-0.5">Next: {c.nextStep}</p>}
                {c.tags && <p className="text-xs text-slate-600 mt-0.5">{c.tags}</p>}
              </div>
              <button onClick={() => save(contacts.filter(x => x.id !== c.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {visible.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Network className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your network is one of your greatest assets. Build it intentionally.</p>
          </div>
        )}
      </div>
    </div>
  )
}
