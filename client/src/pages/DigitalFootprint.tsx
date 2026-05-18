import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FootprintCategory = 'social' | 'professional' | 'content' | 'data' | 'subscription' | 'account' | 'device' | 'other'
type PrivacyLevel = 'public' | 'semi-public' | 'private' | 'anonymous'

interface FootprintEntry {
  id: string
  platform: string
  category: FootprintCategory
  privacy: PrivacyLevel
  username: string
  purpose: string
  dataShared: string
  active: boolean
  wantToDelete: boolean
  notes: string
  createdAt: string
}

const CAT_CONFIG: Record<FootprintCategory, { label: string; emoji: string; color: string }> = {
  social:       { label: 'Social Media',  emoji: '📱', color: '#3b82f6' },
  professional: { label: 'Professional',  emoji: '💼', color: '#f59e0b' },
  content:      { label: 'Content',       emoji: '🎬', color: '#a855f7' },
  data:         { label: 'Data / Privacy',emoji: '🔒', color: '#ef4444' },
  subscription: { label: 'Subscription',  emoji: '📧', color: '#22c55e' },
  account:      { label: 'Account',       emoji: '👤', color: '#6366f1' },
  device:       { label: 'Device',        emoji: '💻', color: '#0ea5e9' },
  other:        { label: 'Other',         emoji: '🌐', color: '#94a3b8' },
}

const PRIVACY_CONFIG: Record<PrivacyLevel, { label: string; color: string }> = {
  public:        { label: 'Public',       color: '#ef4444' },
  'semi-public': { label: 'Semi-Public',  color: '#f59e0b' },
  private:       { label: 'Private',      color: '#22c55e' },
  anonymous:     { label: 'Anonymous',    color: '#3b82f6' },
}

const STORAGE_KEY = 'digital_footprint'

export default function DigitalFootprint() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FootprintEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<FootprintEntry, 'id' | 'createdAt'>>({
    platform: '', category: 'social', privacy: 'public', username: '',
    purpose: '', dataShared: '', active: true, wantToDelete: false, notes: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FootprintEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.platform.trim()) return
    const e: FootprintEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ platform: '', category: 'social', privacy: 'public', username: '', purpose: '', dataShared: '', active: true, wantToDelete: false, notes: '' })
    setShowForm(false)
    toastSuccess('Entry added 🌐')
  }

  const filtered = entries.filter(e => filterCat === 'all' || e.category === filterCat)
  const publicCount = entries.filter(e => e.privacy === 'public').length
  const toDelete = entries.filter(e => e.wantToDelete).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-blue-400" />
            Digital Footprint
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your online presence and data exposure.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Platforms</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{publicCount}</div>
          <div className="text-xs text-slate-500">Public</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{toDelete}</div>
          <div className="text-xs text-slate-500">To Delete</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [FootprintCategory, typeof CAT_CONFIG.social][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Platform / Account</h3>
          <div className="flex gap-2">
            <input value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              placeholder="Platform name *" className="game-input flex-1" autoFocus />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as FootprintCategory }))} className="game-input text-sm">
              {(Object.entries(CAT_CONFIG) as [FootprintCategory, typeof CAT_CONFIG.social][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Username / handle" className="game-input flex-1 text-sm" />
            <select value={form.privacy} onChange={e => setForm(f => ({ ...f, privacy: e.target.value as PrivacyLevel }))} className="game-input text-sm">
              {(Object.entries(PRIVACY_CONFIG) as [PrivacyLevel, typeof PRIVACY_CONFIG.public][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="Purpose / why you use it..." className="game-input w-full text-sm" />
          <input value={form.dataShared} onChange={e => setForm(f => ({ ...f, dataShared: e.target.value }))}
            placeholder="Data shared (email, phone, location...)" className="game-input w-full text-sm" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              Active account
            </label>
            <label className="flex items-center gap-2 text-xs text-red-400 cursor-pointer">
              <input type="checkbox" checked={form.wantToDelete} onChange={e => setForm(f => ({ ...f, wantToDelete: e.target.checked }))} />
              Want to delete
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const c = CAT_CONFIG[e.category]
          const p = PRIVACY_CONFIG[e.privacy]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.platform}</span>
                    {e.wantToDelete && <span className="text-xs bg-red-900/30 text-red-400 px-1.5 rounded">Delete</span>}
                    {!e.active && <span className="text-xs bg-slate-700 text-slate-400 px-1.5 rounded">Inactive</span>}
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · <span style={{ color: p.color }}>{p.label}</span>{e.username && ` · @${e.username}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.purpose && <p className="text-xs text-slate-300">🎯 {e.purpose}</p>}
                  {e.dataShared && <p className="text-xs text-red-300">📊 Data: {e.dataShared}</p>}
                  {e.notes && <p className="text-xs text-slate-400">{e.notes}</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => save(entries.map(x => x.id === e.id ? { ...x, wantToDelete: !x.wantToDelete } : x))}
                      className="text-xs text-red-600 hover:text-red-400">
                      {e.wantToDelete ? 'Keep' : 'Mark for deletion'}
                    </button>
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
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Map your digital presence and reclaim your privacy.</p>
          </div>
        )}
      </div>
    </div>
  )
}
