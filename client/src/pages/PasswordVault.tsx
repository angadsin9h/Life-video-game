import { useState, useEffect } from 'react'
import { Lock, Plus, Trash2, Eye, EyeOff, Copy } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AccountCategory = 'social' | 'email' | 'banking' | 'work' | 'shopping' | 'streaming' | 'gaming' | 'other'

interface PasswordEntry {
  id: string
  siteName: string
  url: string
  username: string
  category: AccountCategory
  notes: string
  strength: 'weak' | 'medium' | 'strong'
  lastChanged: string
  twoFactor: boolean
  createdAt: string
}

const CAT_CONFIG: Record<AccountCategory, { label: string; emoji: string; color: string }> = {
  social:    { label: 'Social',    emoji: '📱', color: '#3b82f6' },
  email:     { label: 'Email',     emoji: '📧', color: '#f59e0b' },
  banking:   { label: 'Banking',   emoji: '🏦', color: '#22c55e' },
  work:      { label: 'Work',      emoji: '💼', color: '#6366f1' },
  shopping:  { label: 'Shopping',  emoji: '🛍️', color: '#ec4899' },
  streaming: { label: 'Streaming', emoji: '🎬', color: '#f97316' },
  gaming:    { label: 'Gaming',    emoji: '🎮', color: '#a855f7' },
  other:     { label: 'Other',     emoji: '🔐', color: '#94a3b8' },
}

const STRENGTH_CONFIG = {
  weak:   { label: 'Weak',   color: '#ef4444' },
  medium: { label: 'Medium', color: '#f59e0b' },
  strong: { label: 'Strong', color: '#22c55e' },
}

const STORAGE_KEY = 'password_vault'

export default function PasswordVault() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Omit<PasswordEntry, 'id' | 'createdAt'>>({
    siteName: '', url: '', username: '', category: 'other', notes: '',
    strength: 'medium', lastChanged: new Date().toISOString().split('T')[0], twoFactor: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PasswordEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.siteName.trim() || !form.username.trim()) return
    const e: PasswordEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ siteName: '', url: '', username: '', category: 'other', notes: '', strength: 'medium', lastChanged: new Date().toISOString().split('T')[0], twoFactor: false })
    setShowForm(false)
    toastSuccess('Account added 🔐')
  }

  const copyUsername = (username: string) => {
    navigator.clipboard?.writeText(username)
    toastSuccess('Username copied!')
  }

  const filtered = entries.filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false
    if (search && !e.siteName.toLowerCase().includes(search.toLowerCase()) && !e.username.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const weak = entries.filter(e => e.strength === 'weak').length
  const no2fa = entries.filter(e => !e.twoFactor).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Lock className="w-7 h-7 text-yellow-400" />
            Account Vault
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track accounts and security status. No passwords stored.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Accounts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{weak}</div>
          <div className="text-xs text-slate-500">Weak PWs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{no2fa}</div>
          <div className="text-xs text-slate-500">No 2FA</div>
        </div>
      </div>

      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search accounts..." className="game-input text-sm flex-1" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="game-input text-sm">
          <option value="all">All</option>
          {(Object.entries(CAT_CONFIG) as [AccountCategory, typeof CAT_CONFIG.social][]).map(([k, c]) => (
            <option key={k} value={k}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Account</h3>
          <div className="flex gap-2">
            <input value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))}
              placeholder="Site/App name *" className="game-input flex-1" autoFocus />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as AccountCategory }))} className="game-input text-sm">
              {(Object.entries(CAT_CONFIG) as [AccountCategory, typeof CAT_CONFIG.social][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Username/Email *" className="game-input flex-1 text-sm" />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="URL (optional)" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            {(['weak', 'medium', 'strong'] as const).map(s => {
              const sc = STRENGTH_CONFIG[s]
              return (
                <button key={s} onClick={() => setForm(f => ({ ...f, strength: s }))}
                  className={`flex-1 py-1.5 rounded-xl text-xs capitalize ${form.strength === s ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={form.strength === s ? { background: sc.color + '30', color: sc.color } : {}}>
                  {sc.label}
                </button>
              )
            })}
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.twoFactor} onChange={e => setForm(f => ({ ...f, twoFactor: e.target.checked }))} className="accent-green-400" />
              2FA Enabled
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Changed:</span>
              <input type="date" value={form.lastChanged} onChange={e => setForm(f => ({ ...f, lastChanged: e.target.value }))} className="game-input text-xs" />
            </div>
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (security questions hints, etc.)" className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(e => {
          const c = CAT_CONFIG[e.category]
          const s = STRENGTH_CONFIG[e.strength]
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3">
              <span className="text-xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{e.siteName}</span>
                  <span className="text-xs px-1 rounded" style={{ color: s.color }}>●</span>
                  {e.twoFactor && <span className="text-xs text-green-400">2FA</span>}
                </div>
                <p className="text-xs text-slate-500 truncate">{e.username}</p>
              </div>
              <button onClick={() => copyUsername(e.username)} className="text-slate-600 hover:text-slate-300 p-1">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Lock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track accounts and password strength. No passwords are stored.</p>
          </div>
        )}
      </div>
    </div>
  )
}
