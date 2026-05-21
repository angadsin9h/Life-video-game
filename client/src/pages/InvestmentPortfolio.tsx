import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AssetClass = 'stocks' | 'etf' | 'crypto' | 'real-estate' | 'bonds' | 'commodities' | 'cash' | 'business' | 'alternative' | 'other'
type InvestmentStatus = 'holding' | 'watching' | 'sold' | 'planned'

interface InvestmentEntry {
  id: string
  assetClass: AssetClass
  status: InvestmentStatus
  name: string
  ticker: string
  shares: number
  avgCostBasis: number
  currentPrice: number
  thesis: string
  riskLevel: number
  allocationPct: number
  date: string
  createdAt: string
}

const CLASS_CONFIG: Record<AssetClass, { label: string; emoji: string; color: string }> = {
  stocks:        { label: 'Stocks',       emoji: '📈', color: '#22c55e' },
  etf:           { label: 'ETFs',         emoji: '🗂️', color: '#3b82f6' },
  crypto:        { label: 'Crypto',       emoji: '₿',  color: '#f59e0b' },
  'real-estate': { label: 'Real Estate',  emoji: '🏠', color: '#f97316' },
  bonds:         { label: 'Bonds',        emoji: '📋', color: '#6366f1' },
  commodities:   { label: 'Commodities',  emoji: '🥇', color: '#84cc16' },
  cash:          { label: 'Cash',         emoji: '💵', color: '#94a3b8' },
  business:      { label: 'Business',     emoji: '💼', color: '#a855f7' },
  alternative:   { label: 'Alternative',  emoji: '🔮', color: '#ec4899' },
  other:         { label: 'Other',        emoji: '📊', color: '#0ea5e9' },
}

const STATUS_CONFIG: Record<InvestmentStatus, { label: string; color: string }> = {
  holding:  { label: 'Holding',  color: '#22c55e' },
  watching: { label: 'Watching', color: '#f59e0b' },
  sold:     { label: 'Sold',     color: '#94a3b8' },
  planned:  { label: 'Planned',  color: '#3b82f6' },
}

const STORAGE_KEY = 'investment_portfolio'

export default function InvestmentPortfolio() {
  const { toastSuccess } = useToast()
  const [holdings, setHoldings] = useState<InvestmentEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<InvestmentEntry, 'id' | 'createdAt'>>({
    assetClass: 'stocks', status: 'holding', name: '', ticker: '',
    shares: 0, avgCostBasis: 0, currentPrice: 0, thesis: '',
    riskLevel: 5, allocationPct: 0,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setHoldings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: InvestmentEntry[]) => { setHoldings(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const e: InvestmentEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...holdings])
    setForm(f => ({ ...f, name: '', ticker: '', shares: 0, avgCostBasis: 0, currentPrice: 0, thesis: '', allocationPct: 0 }))
    setShowForm(false)
    toastSuccess('Investment tracked — grow your wealth 📈')
  }

  const totalValue = holdings.filter(h => h.status === 'holding').reduce((s, h) => s + h.shares * h.currentPrice, 0)
  const totalCost = holdings.filter(h => h.status === 'holding').reduce((s, h) => s + h.shares * h.avgCostBasis, 0)
  const gainLoss = totalValue - totalCost
  const gainPct = totalCost > 0 ? Math.round((gainLoss / totalCost) * 100) : 0

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Investment Portfolio
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your investments and build long-term wealth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{fmt(totalValue)}</div>
          <div className="text-xs text-slate-500">Total Value</div>
        </div>
        <div className="game-card p-3">
          <div className={`text-xl font-bold ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{gainLoss >= 0 ? '+' : ''}{gainPct}%</div>
          <div className="text-xs text-slate-500">Total Return</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{holdings.filter(h => h.status === 'holding').length}</div>
          <div className="text-xs text-slate-500">Holdings</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Investment</h3>
          <div className="flex gap-2">
            <select value={form.assetClass} onChange={e => setForm(f => ({ ...f, assetClass: e.target.value as AssetClass }))} className="game-input text-sm flex-1">
              {(Object.entries(CLASS_CONFIG) as [AssetClass, typeof CLASS_CONFIG.stocks][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as InvestmentStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [InvestmentStatus, typeof STATUS_CONFIG.holding][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Investment name *" className="game-input text-sm flex-1" autoFocus />
            <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}
              placeholder="Ticker" className="game-input text-sm w-24" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Shares</p>
              <input type="number" value={form.shares || ''} onChange={e => setForm(f => ({ ...f, shares: Number(e.target.value) }))}
                placeholder="0" className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Avg Cost ($)</p>
              <input type="number" step="0.01" value={form.avgCostBasis || ''} onChange={e => setForm(f => ({ ...f, avgCostBasis: Number(e.target.value) }))}
                placeholder="0" className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Current ($)</p>
              <input type="number" step="0.01" value={form.currentPrice || ''} onChange={e => setForm(f => ({ ...f, currentPrice: Number(e.target.value) }))}
                placeholder="0" className="game-input w-full text-sm" />
            </div>
          </div>
          <textarea value={form.thesis} onChange={e => setForm(f => ({ ...f, thesis: e.target.value }))}
            placeholder="Investment thesis — why do you own this?" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Risk: {form.riskLevel}/10</p>
              <input type="range" min={1} max={10} value={form.riskLevel}
                onChange={e => setForm(f => ({ ...f, riskLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Allocation: {form.allocationPct}%</p>
              <input type="range" min={0} max={100} value={form.allocationPct}
                onChange={e => setForm(f => ({ ...f, allocationPct: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {holdings.map(h => {
          const c = CLASS_CONFIG[h.assetClass]
          const s = STATUS_CONFIG[h.status]
          const value = h.shares * h.currentPrice
          const cost = h.shares * h.avgCostBasis
          const ret = cost > 0 ? Math.round(((value - cost) / cost) * 100) : 0
          return (
            <div key={h.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{h.name}</span>
                  {h.ticker && <span className="text-xs text-slate-500">{h.ticker}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-white font-bold">{fmt(value)}</span>
                  <span className={`text-xs ${ret >= 0 ? 'text-green-400' : 'text-red-400'}`}>{ret >= 0 ? '+' : ''}{ret}%</span>
                  <span className="text-xs text-slate-500">{h.allocationPct}% alloc</span>
                </div>
                {h.thesis && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{h.thesis}</p>}
              </div>
              <button onClick={() => save(holdings.filter(x => x.id !== h.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {holdings.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Compound interest is the eighth wonder of the world. Start tracking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
