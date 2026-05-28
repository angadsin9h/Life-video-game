import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CircleTier = 'inner' | 'close' | 'trusted' | 'network' | 'acquaintance'
type RelationshipType = 'friend' | 'mentor' | 'mentee' | 'colleague' | 'family' | 'romantic' | 'accountability' | 'other'
type ConnectionHealth = 'thriving' | 'good' | 'maintenance' | 'strained' | 'dormant'

interface SocialContact {
  id: string
  name: string
  tier: CircleTier
  relationshipType: RelationshipType
  health: ConnectionHealth
  sharedValues: string
  lastContact: string
  nextStep: string
  whatTheyBringToMyLife: string
  whatIBringToTheirLife: string
  contactFrequency: string
  createdAt: string
}

const TIER_CONFIG: Record<CircleTier, { label: string; emoji: string; color: string; size: number }> = {
  inner:       { label: 'Inner Circle',  emoji: '🔴', color: '#ef4444', size: 5 },
  close:       { label: 'Close',         emoji: '🟠', color: '#f97316', size: 15 },
  trusted:     { label: 'Trusted',       emoji: '🟡', color: '#f59e0b', size: 50 },
  network:     { label: 'Network',       emoji: '🟢', color: '#22c55e', size: 150 },
  acquaintance:{ label: 'Acquaintance',  emoji: '🔵', color: '#3b82f6', size: 500 },
}

const TYPE_CONFIG: Record<RelationshipType, { label: string }> = {
  friend:         { label: 'Friend'          },
  mentor:         { label: 'Mentor'          },
  mentee:         { label: 'Mentee'          },
  colleague:      { label: 'Colleague'       },
  family:         { label: 'Family'          },
  romantic:       { label: 'Romantic'        },
  accountability: { label: 'Accountability'  },
  other:          { label: 'Other'           },
}

const HEALTH_CONFIG: Record<ConnectionHealth, { label: string; color: string; emoji: string }> = {
  thriving:    { label: 'Thriving',    color: '#22c55e', emoji: '🌟' },
  good:        { label: 'Good',        color: '#84cc16', emoji: '✅' },
  maintenance: { label: 'Maintenance', color: '#f59e0b', emoji: '🔧' },
  strained:    { label: 'Strained',    color: '#f97316', emoji: '⚠️' },
  dormant:     { label: 'Dormant',     color: '#94a3b8', emoji: '💤' },
}

const STORAGE_KEY = 'social_circle'

export default function SocialCircle() {
  const { toastSuccess } = useToast()
  const [contacts, setContacts] = useState<SocialContact[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterTier, setFilterTier] = useState<CircleTier | 'all'>('all')
  const [form, setForm] = useState<Omit<SocialContact, 'id' | 'createdAt'>>({
    name: '', tier: 'close', relationshipType: 'friend', health: 'good',
    sharedValues: '', lastContact: '', nextStep: '',
    whatTheyBringToMyLife: '', whatIBringToTheirLife: '', contactFrequency: 'monthly',
  })

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SocialContact[]) => { setContacts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const c: SocialContact = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([c, ...contacts])
    setForm(f => ({ ...f, name: '', sharedValues: '', lastContact: '', nextStep: '', whatTheyBringToMyLife: '', whatIBringToTheirLife: '' }))
    setShowForm(false)
    toastSuccess('Contact added to your circle 👥')
  }

  const filtered = filterTier === 'all' ? contacts : contacts.filter(c => c.tier === filterTier)
  const innerCount = contacts.filter(c => c.tier === 'inner').length
  const thriving = contacts.filter(c => c.health === 'thriving').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-blue-400" />
            Social Circle
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your relationships by tier and nurture them intentionally.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{contacts.length}</div>
          <div className="text-xs text-slate-500">In Circle</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{innerCount}</div>
          <div className="text-xs text-slate-500">Inner Circle</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{thriving}</div>
          <div className="text-xs text-slate-500">Thriving</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterTier('all')}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filterTier === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
        {(Object.entries(TIER_CONFIG) as [CircleTier, typeof TIER_CONFIG.inner][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterTier(k)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filterTier === k ? 'text-white' : 'bg-slate-800 text-slate-400'}`}
            style={filterTier === k ? { background: t.color } : {}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add to Circle</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value as CircleTier }))} className="game-input text-sm flex-1">
              {(Object.entries(TIER_CONFIG) as [CircleTier, typeof TIER_CONFIG.inner][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.relationshipType} onChange={e => setForm(f => ({ ...f, relationshipType: e.target.value as RelationshipType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [RelationshipType, typeof TYPE_CONFIG.friend][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <select value={form.health} onChange={e => setForm(f => ({ ...f, health: e.target.value as ConnectionHealth }))} className="game-input w-full text-sm">
            {(Object.entries(HEALTH_CONFIG) as [ConnectionHealth, typeof HEALTH_CONFIG.thriving][]).map(([k, h]) => (
              <option key={k} value={k}>{h.emoji} {h.label}</option>
            ))}
          </select>
          <input value={form.whatTheyBringToMyLife} onChange={e => setForm(f => ({ ...f, whatTheyBringToMyLife: e.target.value }))}
            placeholder="What do they bring to your life?" className="game-input w-full text-sm" />
          <input value={form.whatIBringToTheirLife} onChange={e => setForm(f => ({ ...f, whatIBringToTheirLife: e.target.value }))}
            placeholder="What do you bring to their life?" className="game-input w-full text-sm" />
          <input value={form.sharedValues} onChange={e => setForm(f => ({ ...f, sharedValues: e.target.value }))}
            placeholder="Shared values / common ground" className="game-input w-full text-sm" />
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="Next step to nurture this relationship" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={form.contactFrequency} onChange={e => setForm(f => ({ ...f, contactFrequency: e.target.value }))}
              placeholder="Contact frequency (weekly, monthly...)" className="game-input flex-1 text-sm" />
            <input type="date" value={form.lastContact} onChange={e => setForm(f => ({ ...f, lastContact: e.target.value }))}
              className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Add to Circle</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(c => {
          const t = TIER_CONFIG[c.tier]
          const h = HEALTH_CONFIG[c.health]
          const rel = TYPE_CONFIG[c.relationshipType]
          return (
            <div key={c.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: t.color + '30', color: t.color }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  <span className="text-xs">{h.emoji}</span>
                  <span className="text-xs text-slate-500">{t.label} · {rel.label}</span>
                </div>
                {c.whatTheyBringToMyLife && <p className="text-xs text-slate-400 mt-0.5">💎 {c.whatTheyBringToMyLife}</p>}
                {c.nextStep && <p className="text-xs text-blue-300 mt-0.5">→ {c.nextStep}</p>}
                {c.contactFrequency && <p className="text-xs text-slate-600 mt-0.5">📅 {c.contactFrequency}</p>}
              </div>
              <button onClick={() => save(contacts.filter(x => x.id !== c.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You are the average of the five people around you. Choose wisely.</p>
          </div>
        )}
      </div>
    </div>
  )
}
