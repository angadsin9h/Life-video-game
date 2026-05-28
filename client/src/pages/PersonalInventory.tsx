import { useState, useEffect } from 'react'
import { Package, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ItemCategory = 'electronics' | 'vehicle' | 'furniture' | 'subscription' | 'tool' | 'clothing' | 'fitness' | 'book' | 'other'
type ItemStatus = 'owned' | 'leased' | 'borrowed' | 'sold' | 'donated'

interface InventoryItem {
  id: string
  name: string
  category: ItemCategory
  status: ItemStatus
  value: number
  purchaseDate: string
  notes: string
  location: string
  isSubscription: boolean
  monthlyFee: number
  createdAt: string
}

const CAT_CONFIG: Record<ItemCategory, { label: string; emoji: string; color: string }> = {
  electronics:  { label: 'Electronics',  emoji: '💻', color: '#3b82f6' },
  vehicle:      { label: 'Vehicle',      emoji: '🚗', color: '#f59e0b' },
  furniture:    { label: 'Furniture',    emoji: '🪑', color: '#a855f7' },
  subscription: { label: 'Subscription', emoji: '🔄', color: '#6366f1' },
  tool:         { label: 'Tool',         emoji: '🔧', color: '#94a3b8' },
  clothing:     { label: 'Clothing',     emoji: '👕', color: '#ec4899' },
  fitness:      { label: 'Fitness',      emoji: '🏋️', color: '#22c55e' },
  book:         { label: 'Book/Media',   emoji: '📚', color: '#f97316' },
  other:        { label: 'Other',        emoji: '📦', color: '#64748b' },
}

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string }> = {
  owned:   { label: 'Owned',   color: '#22c55e' },
  leased:  { label: 'Leased',  color: '#3b82f6' },
  borrowed:{ label: 'Borrowed',color: '#f59e0b' },
  sold:    { label: 'Sold',    color: '#94a3b8' },
  donated: { label: 'Donated', color: '#a855f7' },
}

const STORAGE_KEY = 'personal_inventory'

export default function PersonalInventory() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<InventoryItem, 'id' | 'createdAt'>>({
    name: '', category: 'electronics', status: 'owned', value: 0,
    purchaseDate: '', notes: '', location: '', isSubscription: false, monthlyFee: 0,
  })

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: InventoryItem[]) => { setItems(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const item: InventoryItem = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([item, ...items])
    setForm({ name: '', category: 'electronics', status: 'owned', value: 0, purchaseDate: '', notes: '', location: '', isSubscription: false, monthlyFee: 0 })
    setShowForm(false)
    toastSuccess(`"${form.name}" added to inventory`)
  }

  const owned = items.filter(i => i.status === 'owned' || i.status === 'leased')
  const totalValue = owned.reduce((s, i) => s + i.value, 0)
  const monthlySubscriptions = items.filter(i => i.isSubscription && i.status !== 'sold' && i.status !== 'donated')
  const monthlySpend = monthlySubscriptions.reduce((s, i) => s + i.monthlyFee, 0)

  const filtered = items.filter(i => filterCat === 'all' || i.category === filterCat)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Package className="w-7 h-7 text-slate-300" />
            Personal Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your assets, possessions, and subscriptions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{owned.length}</div>
          <div className="text-xs text-slate-500">Items Owned</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">${totalValue.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Est. Value</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">${monthlySpend}/mo</div>
          <div className="text-xs text-slate-500">Subscriptions</div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap flex-shrink-0 ${filterCat === 'all' ? 'bg-slate-600/40 text-slate-300 border border-slate-500/40' : 'bg-slate-800 text-slate-500'}`}>
          All ({items.length})
        </button>
        {(Object.entries(CAT_CONFIG) as [ItemCategory, typeof CAT_CONFIG.electronics][]).map(([k, c]) => {
          const count = items.filter(i => i.category === k).length
          if (count === 0) return null
          return (
            <button key={k} onClick={() => setFilterCat(k)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap flex-shrink-0 ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
              {c.emoji} {count}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-slate-600/30 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Item</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Item name *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ItemCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [ItemCategory, typeof CAT_CONFIG.electronics][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ItemStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ItemStatus, typeof STATUS_CONFIG.owned][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500">Est. Value ($)</label>
              <input type="number" value={form.value || ''} min={0}
                onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500">Purchase Date</label>
              <input type="date" value={form.purchaseDate}
                onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="Location (where is it?)" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isSubscription} onChange={e => setForm(f => ({ ...f, isSubscription: e.target.checked }))} className="accent-blue-400" />
            This is a subscription/recurring cost
          </label>
          {form.isSubscription && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Monthly fee: $</span>
              <input type="number" value={form.monthlyFee || ''} min={0}
                onChange={e => setForm(f => ({ ...f, monthlyFee: Number(e.target.value) }))}
                className="game-input w-24 text-sm" />
            </div>
          )}
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(item => {
          const c = CAT_CONFIG[item.category]
          const s = STATUS_CONFIG[item.status]
          const isExp = expanded === item.id
          return (
            <div key={item.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : item.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{item.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                    {item.isSubscription && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">🔄 Sub</span>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.value > 0 && `$${item.value.toLocaleString()}`}
                    {item.isSubscription && item.monthlyFee > 0 && ` · $${item.monthlyFee}/mo`}
                    {item.location && ` · ${item.location}`}
                  </p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {item.purchaseDate && <p className="text-xs text-slate-500">Purchased: {item.purchaseDate}</p>}
                  {item.notes && <p className="text-sm text-slate-300">{item.notes}</p>}
                  <div className="flex gap-2">
                    <select value={item.status} onChange={e => save(items.map(x => x.id === item.id ? { ...x, status: e.target.value as ItemStatus } : x))}
                      className="game-input text-xs flex-1">
                      {(Object.entries(STATUS_CONFIG) as [ItemStatus, typeof STATUS_CONFIG.owned][]).map(([k, st]) => (
                        <option key={k} value={k}>{st.label}</option>
                      ))}
                    </select>
                    <button onClick={() => save(items.filter(x => x.id !== item.id))} className="text-xs text-slate-700 hover:text-red-400 px-3">
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
            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track your belongings and know what you own.</p>
          </div>
        )}
      </div>
    </div>
  )
}
