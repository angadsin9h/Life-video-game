import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2, Edit2, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AssetType = 'stock' | 'etf' | 'crypto' | 'bond' | 'realestate' | 'cash' | 'other'

interface Investment {
  id: string
  name: string
  ticker: string
  type: AssetType
  shares: number
  buyPrice: number
  currentPrice: number
  account: string
  notes: string
  buyDate: string
}

const TYPE_CONFIG: Record<AssetType, { label: string; emoji: string; color: string }> = {
  stock:       { label: 'Stock',        emoji: '📈', color: '#22c55e' },
  etf:         { label: 'ETF',          emoji: '🗂️', color: '#3b82f6' },
  crypto:      { label: 'Crypto',       emoji: '₿',  color: '#f59e0b' },
  bond:        { label: 'Bond',         emoji: '🏦', color: '#6366f1' },
  realestate:  { label: 'Real Estate',  emoji: '🏠', color: '#ec4899' },
  cash:        { label: 'Cash/MM',      emoji: '💵', color: '#94a3b8' },
  other:       { label: 'Other',        emoji: '💼', color: '#f97316' },
}

const STORAGE_KEY = 'investments'

export default function InvestmentTracker() {
  const { toastSuccess } = useToast()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<Investment, 'id'>>({
    name: '', ticker: '', type: 'stock', shares: 1, buyPrice: 0, currentPrice: 0,
    account: '', notes: '', buyDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setInvestments(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Investment[]) => { setInvestments(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    if (editId) {
      save(investments.map(i => i.id === editId ? { ...i, ...form } : i))
      toastSuccess('Investment updated')
    } else {
      save([...investments, { id: Date.now().toString(), ...form }])
      toastSuccess(`${form.name} added`)
    }
    setForm({ name: '', ticker: '', type: 'stock', shares: 1, buyPrice: 0, currentPrice: 0, account: '', notes: '', buyDate: new Date().toISOString().split('T')[0] })
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (inv: Investment) => {
    setForm({ ...inv })
    setEditId(inv.id)
    setShowForm(true)
  }

  const displayed = filterType === 'all' ? investments : investments.filter(i => i.type === filterType)

  const totalValue = investments.reduce((s, i) => s + i.shares * i.currentPrice, 0)
  const totalCost = investments.reduce((s, i) => s + i.shares * i.buyPrice, 0)
  const totalGain = totalValue - totalCost
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const allocations = Object.keys(TYPE_CONFIG).reduce((acc, k) => {
    const val = investments.filter(i => i.type === k).reduce((s, i) => s + i.shares * i.currentPrice, 0)
    return { ...acc, [k]: val }
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Investment Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your portfolio and investment performance.</p>
        </div>
        <button onClick={() => { setEditId(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Portfolio summary */}
      <div className="game-card p-4 border border-green-500/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-white">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-slate-500">Portfolio Value</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500">Total Gain/Loss</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${gainPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">Return</div>
          </div>
        </div>
        {totalValue > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1">Allocation</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {(Object.entries(TYPE_CONFIG) as [AssetType, typeof TYPE_CONFIG.stock][]).map(([k, t]) => {
                const pct = totalValue > 0 ? (allocations[k] / totalValue) * 100 : 0
                return pct > 1 ? <div key={k} style={{ width: `${pct}%`, background: t.color }} title={`${t.label}: ${pct.toFixed(1)}%`} /> : null
              })}
            </div>
            <div className="flex gap-3 flex-wrap mt-1">
              {(Object.entries(TYPE_CONFIG) as [AssetType, typeof TYPE_CONFIG.stock][]).map(([k, t]) => {
                const pct = totalValue > 0 ? (allocations[k] / totalValue) * 100 : 0
                return pct > 0 ? (
                  <span key={k} className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                    <span style={{ color: t.color }}>{t.label} {pct.toFixed(0)}%</span>
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-full text-xs ${filterType === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          All ({investments.length})
        </button>
        {(Object.entries(TYPE_CONFIG) as [AssetType, typeof TYPE_CONFIG.stock][]).map(([k, t]) => {
          const count = investments.filter(i => i.type === k).length
          return count > 0 ? (
            <button key={k} onClick={() => setFilterType(k)}
              className="px-3 py-1 rounded-full text-xs transition-colors"
              style={filterType === k ? { background: t.color + '30', color: t.color } : { background: '#1e293b', color: '#64748b' }}>
              {t.emoji} {t.label} ({count})
            </button>
          ) : null
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">{editId ? 'Edit Investment' : 'Add Investment'}</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *" className="game-input flex-1" autoFocus />
            <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              placeholder="Ticker" className="game-input w-24 text-sm uppercase" />
          </div>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AssetType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [AssetType, typeof TYPE_CONFIG.stock][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <input value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))}
              placeholder="Account" className="game-input flex-1 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Shares/Units</p>
              <input type="number" value={form.shares} min={0} step={0.001}
                onChange={e => setForm(f => ({ ...f, shares: Number(e.target.value) }))}
                className="game-input w-full text-sm text-center" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Buy Price ($)</p>
              <input type="number" value={form.buyPrice} min={0} step={0.01}
                onChange={e => setForm(f => ({ ...f, buyPrice: Number(e.target.value) }))}
                className="game-input w-full text-sm text-center" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Current Price ($)</p>
              <input type="number" value={form.currentPrice} min={0} step={0.01}
                onChange={e => setForm(f => ({ ...f, currentPrice: Number(e.target.value) }))}
                className="game-input w-full text-sm text-center" />
            </div>
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.buyDate} onChange={e => setForm(f => ({ ...f, buyDate: e.target.value }))}
              className="game-input text-sm" />
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
              {editId ? 'Update' : 'Add Investment'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {displayed.map(inv => {
          const t = TYPE_CONFIG[inv.type]
          const value = inv.shares * inv.currentPrice
          const cost = inv.shares * inv.buyPrice
          const gain = value - cost
          const gainP = cost > 0 ? (gain / cost) * 100 : 0
          return (
            <div key={inv.id} className="game-card p-4 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{inv.name}</span>
                  {inv.ticker && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{inv.ticker}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{inv.shares} shares</span>
                  {inv.account && <span>{inv.account}</span>}
                  <span>bought {inv.buyDate}</span>
                </div>
                <div className="flex gap-3 mt-1 text-sm">
                  <span className="text-white font-medium">${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                  <span className={gainP >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {gainP >= 0 ? '+' : ''}{gainP.toFixed(1)}%
                    <span className="text-xs ml-1">({gain >= 0 ? '+' : ''}{gain.toFixed(0)})</span>
                  </span>
                </div>
                {inv.notes && <p className="text-xs text-slate-500 mt-0.5 italic">{inv.notes}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(inv)} className="p-1 text-slate-700 hover:text-slate-300">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => save(investments.filter(x => x.id !== inv.id))} className="p-1 text-slate-700 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No investments tracked. Start building your portfolio!</p>
          </div>
        )}
      </div>
    </div>
  )
}
