import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, Plus, Trash2, Star, Target, BarChart3, Check, X, ChevronDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Asset {
  id: string
  name: string
  value: number
  category: AssetCategory
  createdAt: string
}

interface Liability {
  id: string
  name: string
  balance: number
  category: LiabilityCategory
  createdAt: string
}

interface NetWorthSnapshot {
  id: string
  label: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  date: string
}

interface StorageData {
  assets: Asset[]
  liabilities: Liability[]
  snapshots: NetWorthSnapshot[]
  goal: number | null
}

type AssetCategory = 'Cash' | 'Investments' | 'Real Estate' | 'Vehicle' | 'Business' | 'Other'
type LiabilityCategory = 'Mortgage' | 'Student Loan' | 'Car Loan' | 'Credit Card' | 'Personal Loan' | 'Other'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'net_worth_tracker'

const ASSET_CATEGORIES: AssetCategory[] = ['Cash', 'Investments', 'Real Estate', 'Vehicle', 'Business', 'Other']
const LIABILITY_CATEGORIES: LiabilityCategory[] = ['Mortgage', 'Student Loan', 'Car Loan', 'Credit Card', 'Personal Loan', 'Other']

const ASSET_COLORS: Record<AssetCategory, string> = {
  Cash: '#22c55e',
  Investments: '#3b82f6',
  'Real Estate': '#f97316',
  Vehicle: '#8b5cf6',
  Business: '#f59e0b',
  Other: '#64748b',
}

const LIABILITY_COLORS: Record<LiabilityCategory, string> = {
  Mortgage: '#ef4444',
  'Student Loan': '#f97316',
  'Car Loan': '#8b5cf6',
  'Credit Card': '#ec4899',
  'Personal Loan': '#f59e0b',
  Other: '#64748b',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const fmtFull = (n: number) => {
  const sign = n < 0 ? '-$' : '$'
  return `${sign}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const currentMonthLabel = () =>
  new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

const EMPTY_DATA: StorageData = { assets: [], liabilities: [], snapshots: [], goal: null }

// ─── Component ───────────────────────────────────────────────────────────────

export default function NetWorthTracker() {
  const { toastSuccess } = useToast()

  const [data, setData] = useState<StorageData>(EMPTY_DATA)
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'liabilities' | 'history'>('overview')
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [showLiabilityForm, setShowLiabilityForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  const [assetForm, setAssetForm] = useState({
    name: '',
    value: '',
    category: 'Cash' as AssetCategory,
  })

  const [liabilityForm, setLiabilityForm] = useState({
    name: '',
    balance: '',
    category: 'Credit Card' as LiabilityCategory,
  })

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<StorageData>
        setData({
          assets: parsed.assets ?? [],
          liabilities: parsed.liabilities ?? [],
          snapshots: parsed.snapshots ?? [],
          goal: parsed.goal ?? null,
        })
      } catch { /* ignore */ }
    }
  }, [])

  const persist = (updated: StorageData) => {
    setData(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const totalAssets = useMemo(() =>
    data.assets.reduce((s, a) => s + a.value, 0),
    [data.assets]
  )

  const totalLiabilities = useMemo(() =>
    data.liabilities.reduce((s, l) => s + l.balance, 0),
    [data.liabilities]
  )

  const netWorth = totalAssets - totalLiabilities

  const goalProgress = data.goal && data.goal > 0
    ? Math.max(0, Math.min(100, (netWorth / data.goal) * 100))
    : null

  // Asset category totals
  const assetsByCategory = useMemo(() => {
    const map: Partial<Record<AssetCategory, number>> = {}
    data.assets.forEach(a => {
      map[a.category] = (map[a.category] || 0) + a.value
    })
    return Object.entries(map) as [AssetCategory, number][]
  }, [data.assets])

  // Liability category totals
  const liabilitiesByCategory = useMemo(() => {
    const map: Partial<Record<LiabilityCategory, number>> = {}
    data.liabilities.forEach(l => {
      map[l.category] = (map[l.category] || 0) + l.balance
    })
    return Object.entries(map) as [LiabilityCategory, number][]
  }, [data.liabilities])

  // Chart: determine scale for history bars
  const snapshotMax = useMemo(() => {
    if (data.snapshots.length === 0) return 1
    return Math.max(
      ...data.snapshots.map(s => Math.abs(s.netWorth)),
      1
    )
  }, [data.snapshots])

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const addAsset = () => {
    const value = parseFloat(assetForm.value)
    if (!assetForm.name.trim() || !value || value <= 0) return
    const asset: Asset = {
      id: Date.now().toString(),
      name: assetForm.name.trim(),
      value,
      category: assetForm.category,
      createdAt: new Date().toISOString(),
    }
    persist({ ...data, assets: [...data.assets, asset] })
    setAssetForm({ name: '', value: '', category: 'Cash' })
    setShowAssetForm(false)
    toastSuccess('Asset added!', `${assetForm.category} — ${fmtFull(value)}`)
  }

  const deleteAsset = (id: string) => {
    persist({ ...data, assets: data.assets.filter(a => a.id !== id) })
    toastSuccess('Asset removed')
  }

  const addLiability = () => {
    const balance = parseFloat(liabilityForm.balance)
    if (!liabilityForm.name.trim() || !balance || balance <= 0) return
    const liability: Liability = {
      id: Date.now().toString(),
      name: liabilityForm.name.trim(),
      balance,
      category: liabilityForm.category,
      createdAt: new Date().toISOString(),
    }
    persist({ ...data, liabilities: [...data.liabilities, liability] })
    setLiabilityForm({ name: '', balance: '', category: 'Credit Card' })
    setShowLiabilityForm(false)
    toastSuccess('Liability added!', `${liabilityForm.category} — ${fmtFull(balance)}`)
  }

  const deleteLiability = (id: string) => {
    persist({ ...data, liabilities: data.liabilities.filter(l => l.id !== id) })
    toastSuccess('Liability removed')
  }

  const saveSnapshot = () => {
    const snapshot: NetWorthSnapshot = {
      id: Date.now().toString(),
      label: currentMonthLabel(),
      totalAssets,
      totalLiabilities,
      netWorth,
      date: new Date().toISOString().split('T')[0],
    }
    persist({ ...data, snapshots: [...data.snapshots, snapshot] })
    toastSuccess('Snapshot saved!', `Net worth: ${fmtFull(netWorth)}`)
  }

  const deleteSnapshot = (id: string) => {
    persist({ ...data, snapshots: data.snapshots.filter(s => s.id !== id) })
  }

  const setGoal = () => {
    const val = parseFloat(goalInput)
    if (!val) return
    persist({ ...data, goal: val })
    setGoalInput('')
    setShowGoalForm(false)
    toastSuccess('Goal set!', `Target net worth: ${fmtFull(val)}`)
  }

  const clearGoal = () => {
    persist({ ...data, goal: null })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <TrendingUp className="w-7 h-7 text-blue-400" />
            Net Worth Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Assets, liabilities, and wealth progress</p>
        </div>
        <button
          onClick={saveSnapshot}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          title="Save current snapshot"
        >
          <Check className="w-4 h-4" />
          Snapshot
        </button>
      </div>

      {/* Net Worth Hero */}
      <div className="game-card p-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: netWorth >= 0
              ? 'radial-gradient(circle at 50% 50%, #3b82f6, transparent)'
              : 'radial-gradient(circle at 50% 50%, #ef4444, transparent)',
          }}
        />
        <div className="relative">
          <div className="text-slate-400 text-sm mb-1">Current Net Worth</div>
          <div
            className={`text-4xl font-bold mb-1 ${netWorth >= 0 ? 'text-blue-400' : 'text-red-400'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {fmtFull(netWorth)}
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-sm">
            <div>
              <span className="text-green-400 font-semibold">{fmt(totalAssets)}</span>
              <span className="text-slate-500 text-xs ml-1">assets</span>
            </div>
            <div className="text-slate-600">—</div>
            <div>
              <span className="text-red-400 font-semibold">{fmt(totalLiabilities)}</span>
              <span className="text-slate-500 text-xs ml-1">liabilities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress */}
      {data.goal !== null ? (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-slate-300">Net Worth Goal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-yellow-400">{fmt(data.goal)}</span>
              <button onClick={clearGoal} className="text-slate-600 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${goalProgress ?? 0}%`,
                background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{(goalProgress ?? 0).toFixed(1)}% of goal</span>
            <span>{netWorth < data.goal ? `${fmtFull(data.goal - netWorth)} to go` : 'Goal reached!'}</span>
          </div>
        </div>
      ) : (
        <div className="game-card p-3">
          {showGoalForm ? (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setGoal(); if (e.key === 'Escape') setShowGoalForm(false) }}
                placeholder="Net worth goal ($)"
                className="game-input flex-1 text-sm"
                autoFocus
              />
              <button
                onClick={setGoal}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Set
              </button>
              <button onClick={() => setShowGoalForm(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowGoalForm(true)}
              className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-slate-700 hover:border-yellow-500/40 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-medium transition-all"
            >
              <Target className="w-3.5 h-3.5" />
              Set a net worth goal
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
        {([
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'assets', label: 'Assets', icon: Star },
          { key: 'liabilities', label: 'Liabilities', icon: ChevronDown },
          { key: 'history', label: 'History', icon: TrendingUp },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === key
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Assets by category */}
          {assetsByCategory.length > 0 && (
            <div className="game-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                Assets by Category
              </h3>
              {assetsByCategory.map(([cat, total]) => {
                const pct = totalAssets > 0 ? (total / totalAssets) * 100 : 0
                const color = ASSET_COLORS[cat]
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{fmtFull(total)}</span>
                        <span className="text-xs text-slate-600 w-9 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Liabilities by category */}
          {liabilitiesByCategory.length > 0 && (
            <div className="game-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-400" />
                Liabilities by Category
              </h3>
              {liabilitiesByCategory.map(([cat, total]) => {
                const pct = totalLiabilities > 0 ? (total / totalLiabilities) * 100 : 0
                const color = LIABILITY_COLORS[cat]
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{fmtFull(total)}</span>
                        <span className="text-xs text-slate-600 w-9 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {data.assets.length === 0 && data.liabilities.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Add assets and liabilities to see your overview.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Assets */}
      {activeTab === 'assets' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAssetForm(s => !s)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
              showAssetForm
                ? 'bg-slate-700 text-slate-400'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {showAssetForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAssetForm ? 'Cancel' : 'Add Asset'}
          </button>

          {showAssetForm && (
            <div className="game-card p-4 space-y-3 border border-green-500/30">
              <h3 className="text-sm font-semibold text-slate-300">New Asset</h3>
              <input
                type="text"
                value={assetForm.name}
                onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Asset name (e.g. Checking Account)"
                className="game-input w-full"
                autoFocus
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={assetForm.value}
                onChange={e => setAssetForm(f => ({ ...f, value: e.target.value }))}
                placeholder="Value ($)"
                className="game-input w-full"
              />
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {ASSET_CATEGORIES.map(cat => {
                    const color = ASSET_COLORS[cat]
                    const selected = assetForm.category === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setAssetForm(f => ({ ...f, category: cat }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={
                          selected
                            ? { background: color + '33', color, border: `1px solid ${color}` }
                            : { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
                        }
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
              <button
                onClick={addAsset}
                disabled={!assetForm.name.trim() || !assetForm.value || parseFloat(assetForm.value) <= 0}
                className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Add Asset
              </button>
            </div>
          )}

          {data.assets.length > 0 ? (
            <div className="space-y-2">
              {data.assets.map(asset => {
                const color = ASSET_COLORS[asset.category]
                return (
                  <div key={asset.id} className="game-card p-3 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 font-medium truncate">{asset.name}</div>
                      <div className="text-xs" style={{ color }}>{asset.category}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-green-400">{fmtFull(asset.value)}</span>
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="text-slate-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl">
                <span className="text-sm font-semibold text-slate-300">Total Assets</span>
                <span className="text-sm font-bold text-green-400">{fmtFull(totalAssets)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No assets added yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Liabilities */}
      {activeTab === 'liabilities' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowLiabilityForm(s => !s)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
              showLiabilityForm
                ? 'bg-slate-700 text-slate-400'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {showLiabilityForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showLiabilityForm ? 'Cancel' : 'Add Liability'}
          </button>

          {showLiabilityForm && (
            <div className="game-card p-4 space-y-3 border border-red-500/30">
              <h3 className="text-sm font-semibold text-slate-300">New Liability</h3>
              <input
                type="text"
                value={liabilityForm.name}
                onChange={e => setLiabilityForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Liability name (e.g. Visa Credit Card)"
                className="game-input w-full"
                autoFocus
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={liabilityForm.balance}
                onChange={e => setLiabilityForm(f => ({ ...f, balance: e.target.value }))}
                placeholder="Balance owed ($)"
                className="game-input w-full"
              />
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {LIABILITY_CATEGORIES.map(cat => {
                    const color = LIABILITY_COLORS[cat]
                    const selected = liabilityForm.category === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setLiabilityForm(f => ({ ...f, category: cat }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={
                          selected
                            ? { background: color + '33', color, border: `1px solid ${color}` }
                            : { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
                        }
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
              <button
                onClick={addLiability}
                disabled={!liabilityForm.name.trim() || !liabilityForm.balance || parseFloat(liabilityForm.balance) <= 0}
                className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Add Liability
              </button>
            </div>
          )}

          {data.liabilities.length > 0 ? (
            <div className="space-y-2">
              {data.liabilities.map(liability => {
                const color = LIABILITY_COLORS[liability.category]
                return (
                  <div key={liability.id} className="game-card p-3 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 font-medium truncate">{liability.name}</div>
                      <div className="text-xs" style={{ color }}>{liability.category}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-red-400">{fmtFull(liability.balance)}</span>
                      <button
                        onClick={() => deleteLiability(liability.id)}
                        className="text-slate-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl">
                <span className="text-sm font-semibold text-slate-300">Total Liabilities</span>
                <span className="text-sm font-bold text-red-400">{fmtFull(totalLiabilities)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <ChevronDown className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No liabilities added yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Save snapshot CTA */}
          <button
            onClick={saveSnapshot}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Check className="w-4 h-4" />
            Save Current Snapshot ({currentMonthLabel()})
          </button>

          {data.snapshots.length > 0 ? (
            <>
              {/* Bar chart */}
              <div className="game-card p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Net Worth Over Time
                </h3>
                <div className="flex items-end gap-2" style={{ height: '128px' }}>
                  {data.snapshots.slice(-12).map(snap => {
                    const isPositive = snap.netWorth >= 0
                    const barHeight = snapshotMax > 0
                      ? Math.max(4, (Math.abs(snap.netWorth) / snapshotMax) * 100)
                      : 4
                    return (
                      <div
                        key={snap.id}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${snap.label}: ${fmtFull(snap.netWorth)}`}
                      >
                        <div className="w-full flex items-end justify-center" style={{ height: '108px' }}>
                          <div
                            className="w-full rounded-t transition-all duration-500"
                            style={{
                              height: `${barHeight}%`,
                              background: isPositive
                                ? 'linear-gradient(to top, #3b82f6, #06b6d4)'
                                : 'linear-gradient(to top, #ef4444, #f97316)',
                            }}
                          />
                        </div>
                        <div className="text-xs text-slate-600 text-center truncate w-full" style={{ fontSize: '9px' }}>
                          {snap.label.split(' ')[0]}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 justify-center mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: '#3b82f6' }} />
                    <span className="text-xs text-slate-400">Positive</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: '#ef4444' }} />
                    <span className="text-xs text-slate-400">Negative</span>
                  </div>
                </div>
              </div>

              {/* Snapshot list */}
              <div className="space-y-2">
                {[...data.snapshots].reverse().map(snap => {
                  const isPositive = snap.netWorth >= 0
                  return (
                    <div key={snap.id} className="game-card p-3 flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: isPositive ? '#3b82f6' : '#ef4444' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 font-medium">{snap.label}</div>
                        <div className="text-xs text-slate-500">
                          Assets: {fmt(snap.totalAssets)} · Liabilities: {fmt(snap.totalLiabilities)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-sm font-bold ${isPositive ? 'text-blue-400' : 'text-red-400'}`}>
                          {fmtFull(snap.netWorth)}
                        </span>
                        <button
                          onClick={() => deleteSnapshot(snap.id)}
                          className="text-slate-700 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No snapshots yet.</p>
              <p className="text-xs text-slate-600 mt-1">Save monthly snapshots to track your wealth over time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
