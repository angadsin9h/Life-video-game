import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FriendTier = 'close' | 'good' | 'acquaintance' | 'online' | 'reconnect'
type FriendStatus = 'active' | 'drifting' | 'reconnecting' | 'lost-touch'

interface Friend {
  id: string
  name: string
  tier: FriendTier
  status: FriendStatus
  howMet: string
  sharedInterests: string
  lastContact: string
  nextAction: string
  memories: string
  notes: string
  score: number
  createdAt: string
}

const TIER_CONFIG: Record<FriendTier, { label: string; emoji: string; color: string }> = {
  close:       { label: 'Close Friend',    emoji: '💛', color: '#f59e0b' },
  good:        { label: 'Good Friend',     emoji: '💚', color: '#22c55e' },
  acquaintance:{ label: 'Acquaintance',    emoji: '🤝', color: '#3b82f6' },
  online:      { label: 'Online Friend',   emoji: '💻', color: '#a855f7' },
  reconnect:   { label: 'Want to Reconnect', emoji: '🔄', color: '#f97316' },
}

const STATUS_CONFIG: Record<FriendStatus, { label: string; color: string }> = {
  active:       { label: 'Active',       color: '#22c55e' },
  drifting:     { label: 'Drifting',     color: '#f59e0b' },
  reconnecting: { label: 'Reconnecting', color: '#3b82f6' },
  'lost-touch': { label: 'Lost Touch',   color: '#ef4444' },
}

const STORAGE_KEY = 'friendship_tracker'

export default function FriendshipTracker() {
  const { toastSuccess } = useToast()
  const [friends, setFriends] = useState<Friend[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterTier, setFilterTier] = useState<string>('all')
  const [form, setForm] = useState<Omit<Friend, 'id' | 'createdAt'>>({
    name: '', tier: 'good', status: 'active', howMet: '', sharedInterests: '',
    lastContact: '', nextAction: '', memories: '', notes: '', score: 3,
  })

  useEffect(() => {
    try { setFriends(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Friend[]) => { setFriends(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const f: Friend = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([f, ...friends])
    setForm({ name: '', tier: 'good', status: 'active', howMet: '', sharedInterests: '', lastContact: '', nextAction: '', memories: '', notes: '', score: 3 })
    setShowForm(false)
    toastSuccess('Friend added 👥')
  }

  const filtered = friends.filter(f => filterTier === 'all' || f.tier === filterTier)
  const closeFriends = friends.filter(f => f.tier === 'close').length
  const needsAttention = friends.filter(f => f.status === 'drifting' || f.status === 'lost-touch').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-green-400" />
            Friendship Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Nurture your relationships intentionally.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{friends.length}</div>
          <div className="text-xs text-slate-500">Friends</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{closeFriends}</div>
          <div className="text-xs text-slate-500">Close</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{needsAttention}</div>
          <div className="text-xs text-slate-500">Needs Attention</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterTier('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTier === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TIER_CONFIG) as [FriendTier, typeof TIER_CONFIG.close][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterTier(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTier === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterTier === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Friend</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *" className="game-input flex-1" autoFocus />
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value as FriendTier }))} className="game-input text-sm">
              {(Object.entries(TIER_CONFIG) as [FriendTier, typeof TIER_CONFIG.close][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FriendStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [FriendStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
            <input type="date" value={form.lastContact} onChange={e => setForm(f => ({ ...f, lastContact: e.target.value }))}
              className="game-input text-sm flex-1" placeholder="Last contact" />
          </div>
          <input value={form.howMet} onChange={e => setForm(f => ({ ...f, howMet: e.target.value }))}
            placeholder="How you met..." className="game-input w-full text-sm" />
          <input value={form.sharedInterests} onChange={e => setForm(f => ({ ...f, sharedInterests: e.target.value }))}
            placeholder="Shared interests..." className="game-input w-full text-sm" />
          <input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
            placeholder="Next action to strengthen this friendship..." className="game-input w-full text-sm" />
          <input value={form.memories} onChange={e => setForm(f => ({ ...f, memories: e.target.value }))}
            placeholder="Favorite memories together..." className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Friendship score: {form.score}/5</p>
            <input type="range" min={1} max={5} value={form.score}
              onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(fr => {
          const t = TIER_CONFIG[fr.tier]
          const s = STATUS_CONFIG[fr.status]
          const isExp = expanded === fr.id
          return (
            <div key={fr.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : fr.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{fr.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label}{fr.lastContact && ` · Last: ${fr.lastContact}`}</p>
                  <p className="text-xs text-slate-600">{'★'.repeat(fr.score)}{'☆'.repeat(5 - fr.score)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {fr.howMet && <p className="text-xs text-slate-400">👋 Met: {fr.howMet}</p>}
                  {fr.sharedInterests && <p className="text-xs text-blue-300">🎯 Shared: {fr.sharedInterests}</p>}
                  {fr.nextAction && <p className="text-xs text-green-300">📅 Next: {fr.nextAction}</p>}
                  {fr.memories && <p className="text-xs text-yellow-300">💭 {fr.memories}</p>}
                  {fr.notes && <p className="text-xs text-slate-400">{fr.notes}</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => save(friends.map(x => x.id === fr.id ? { ...x, lastContact: new Date().toISOString().split('T')[0] } : x))}
                      className="text-xs text-green-600 hover:text-green-400">Mark contacted today</button>
                    <button onClick={() => save(friends.filter(x => x.id !== fr.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <p className="text-sm">Build and maintain your circle intentionally.</p>
          </div>
        )}
      </div>
    </div>
  )
}
