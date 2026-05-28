import { useState, useEffect } from 'react'
import { Network, Plus, Trash2, Edit2, Check, X, Star, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Contact {
  id: string
  name: string
  role: string
  category: 'mentor' | 'peer' | 'collaborator' | 'friend' | 'family' | 'professional'
  strength: 1 | 2 | 3
  lastContact: string
  notes: string
  tags: string[]
  starred: boolean
}

const CATEGORY_CONFIG = {
  mentor:       { label: 'Mentor',        color: '#a855f7' },
  peer:         { label: 'Peer',          color: '#3b82f6' },
  collaborator: { label: 'Collaborator',  color: '#f59e0b' },
  friend:       { label: 'Friend',        color: '#22c55e' },
  family:       { label: 'Family',        color: '#ec4899' },
  professional: { label: 'Professional',  color: '#6366f1' },
}

const STORAGE_KEY = 'network_map'
const BLANK: Omit<Contact, 'id' | 'starred'> = {
  name: '', role: '', category: 'peer', strength: 2,
  lastContact: new Date().toISOString().split('T')[0], notes: '', tags: [],
}

export default function NetworkMap() {
  const { toastSuccess } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK, tagInput: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterStrength, setFilterStrength] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: Contact[]) => {
    setContacts(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.name.trim()) return
    const tags = form.tagInput.split(',').map(t => t.trim()).filter(Boolean)
    if (editId) {
      save(contacts.map(c => c.id === editId ? { ...c, ...form, tags } : c))
      toastSuccess('Contact updated')
    } else {
      const c: Contact = { id: Date.now().toString(), ...form, tags, starred: false }
      save([c, ...contacts])
      toastSuccess(`${form.name} added to network`)
    }
    resetForm()
  }

  const resetForm = () => {
    setForm({ ...BLANK, tagInput: '' })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (c: Contact) => {
    setForm({ ...c, tagInput: c.tags.join(', ') })
    setEditId(c.id)
    setShowForm(true)
  }

  const del = (id: string) => save(contacts.filter(c => c.id !== id))
  const toggleStar = (id: string) => save(contacts.map(c => c.id === id ? { ...c, starred: !c.starred } : c))

  const daysSince = (dateStr: string) => {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (d === 0) return 'today'
    if (d === 1) return '1 day ago'
    if (d < 30) return `${d}d ago`
    if (d < 365) return `${Math.floor(d / 30)}mo ago`
    return `${Math.floor(d / 365)}y ago`
  }

  const needsReconnect = (c: Contact) => {
    const days = Math.floor((Date.now() - new Date(c.lastContact).getTime()) / 86400000)
    if (c.strength === 3) return days > 14
    if (c.strength === 2) return days > 30
    return days > 90
  }

  const filtered = contacts.filter(c => {
    if (filterCat !== 'all' && c.category !== filterCat) return false
    if (filterStrength !== 'all' && c.strength !== Number(filterStrength)) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.role.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const reconnect = contacts.filter(needsReconnect)
  const catCounts = Object.keys(CATEGORY_CONFIG).reduce((acc, k) => ({ ...acc, [k]: contacts.filter(c => c.category === k).length }), {} as Record<string, number>)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Network className="w-7 h-7 text-blue-400" />
            Network Map
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your personal & professional network.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{contacts.length}</div>
          <div className="text-xs text-slate-500">Total Contacts</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{reconnect.length}</div>
          <div className="text-xs text-slate-500">Reconnect Soon</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{contacts.filter(c => c.strength === 3).length}</div>
          <div className="text-xs text-slate-500">Close Ties</div>
        </div>
      </div>

      {/* Reconnect alerts */}
      {reconnect.length > 0 && (
        <div className="game-card p-4 border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Time to reconnect</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {reconnect.map(c => (
              <span key={c.id} className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-300">
                {c.name} · {daysSince(c.lastContact)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1 rounded-full text-xs ${filterCat === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          All ({contacts.length})
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [Contact['category'], typeof CATEGORY_CONFIG.peer][]).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterCat(key)}
            className={`px-3 py-1 rounded-full text-xs transition-colors`}
            style={filterCat === key ? { background: cfg.color + '30', color: cfg.color } : { background: '#1e293b', color: '#64748b' }}>
            {cfg.label} ({catCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Search + strength filter */}
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts..." className="game-input flex-1 text-sm" />
        <select value={filterStrength} onChange={e => setFilterStrength(e.target.value)} className="game-input text-sm">
          <option value="all">All ties</option>
          <option value="3">Strong (★★★)</option>
          <option value="2">Medium (★★)</option>
          <option value="1">Weak (★)</option>
        </select>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="game-card p-4 border border-blue-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-white">{editId ? 'Edit Contact' : 'New Contact'}</h3>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *" className="game-input text-sm" autoFocus />
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="Role / Company" className="game-input text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Contact['category'] }))}
              className="game-input text-sm flex-1">
              {(Object.entries(CATEGORY_CONFIG) as [Contact['category'], typeof CATEGORY_CONFIG.peer][]).map(([k, cfg]) => (
                <option key={k} value={k}>{cfg.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 px-3 bg-slate-800 rounded-xl">
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, strength: n as 1 | 2 | 3 }))}
                  className={`text-lg ${form.strength >= n ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.lastContact} onChange={e => setForm(f => ({ ...f, lastContact: e.target.value }))}
              className="game-input text-sm" />
            <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
              placeholder="Tags (comma-sep)" className="game-input flex-1 text-sm" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-16 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">
              {editId ? 'Update' : 'Add Contact'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="space-y-2">
        {filtered.map(c => {
          const cfg = CATEGORY_CONFIG[c.category]
          return (
            <div key={c.id} className={`game-card p-4 ${needsReconnect(c) ? 'border-l-2 border-yellow-500/50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: cfg.color + '20', color: cfg.color }}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
                    <span className="text-yellow-400 text-xs">{'★'.repeat(c.strength)}<span className="text-slate-700">{'★'.repeat(3 - c.strength)}</span></span>
                  </div>
                  {c.role && <p className="text-xs text-slate-500 mt-0.5">{c.role}</p>}
                  <p className="text-xs text-slate-600 mt-0.5">Last contact: {daysSince(c.lastContact)}</p>
                  {c.notes && <p className="text-xs text-slate-500 mt-1 italic">{c.notes}</p>}
                  {c.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {c.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">#{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleStar(c.id)}>
                    <Star className={`w-3.5 h-3.5 ${c.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-yellow-400'}`} />
                  </button>
                  <button onClick={() => startEdit(c)}>
                    <Edit2 className="w-3.5 h-3.5 text-slate-700 hover:text-slate-300" />
                  </button>
                  <button onClick={() => del(c.id)}>
                    <X className="w-3.5 h-3.5 text-slate-700 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Network className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No contacts yet. Build your network!</p>
          </div>
        )}
      </div>
    </div>
  )
}
