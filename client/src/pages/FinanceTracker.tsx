import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, Plus, Trash2, BarChart3, Target, Star, X, ChevronDown, RefreshCw, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ──────────────────────────────────────────────────────────────────

type TransactionType = 'income' | 'expense'

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string
  createdAt: string
}

interface StorageData {
  transactions: Transaction[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'finance_tracker'

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Side Hustle', 'Gift', 'Other'] as const
const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Education', 'Savings', 'Investment', 'Other'] as const

const INCOME_COLORS: Record<string, string> = {
  Salary: '#22c55e',
  Freelance: '#3b82f6',
  Investment: '#8b5cf6',
  'Side Hustle': '#f59e0b',
  Gift: '#ec4899',
  Other: '#64748b',
}

const EXPENSE_COLORS: Record<string, string> = {
  Housing: '#ef4444',
  Food: '#f97316',
  Transport: '#3b82f6',
  Entertainment: '#8b5cf6',
  Health: '#22c55e',
  Education: '#06b6d4',
  Savings: '#10b981',
  Investment: '#a855f7',
  Other: '#64748b',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const todayStr = () => new Date().toISOString().split('T')[0]

// ─── Component ───────────────────────────────────────────────────────────────

export default function FinanceTracker() {
  const { toastSuccess } = useToast()

  const [data, setData] = useState<StorageData>({ transactions: [] })
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'trends'>('overview')
  const [filterMonth, setFilterMonth] = useState(monthKey(new Date()))

  const [form, setForm] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    category: 'Food',
    description: '',
    date: todayStr(),
  })

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setData(JSON.parse(raw))
      } catch { /* ignore */ }
    }
  }, [])

  const persist = (updated: StorageData) => {
    setData(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // When type changes, reset category to first option of that type
  const handleTypeChange = (type: TransactionType) => {
    setForm(f => ({
      ...f,
      type,
      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    }))
  }

  const addTransaction = () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0 || !form.date) return

    const tx: Transaction = {
      id: Date.now().toString(),
      type: form.type,
      amount,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      createdAt: new Date().toISOString(),
    }

    const updated = { transactions: [tx, ...data.transactions] }
    persist(updated)
    setForm(f => ({ ...f, amount: '', description: '', date: todayStr() }))
    setShowForm(false)
    toastSuccess(`${form.type === 'income' ? 'Income' : 'Expense'} added!`, `${form.category} — ${fmt(amount)}`)
  }

  const deleteTransaction = (id: string) => {
    persist({ transactions: data.transactions.filter(t => t.id !== id) })
    toastSuccess('Transaction removed')
  }

  // ─── Derived data ───────────────────────────────────────────────────────────

  const monthTxs = useMemo(() =>
    data.transactions.filter(t => t.date.startsWith(filterMonth)),
    [data.transactions, filterMonth]
  )

  const monthIncome = useMemo(() =>
    monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  )

  const monthExpenses = useMemo(() =>
    monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  )

  const netSavings = monthIncome - monthExpenses
  const savingsRate = monthIncome > 0 ? (netSavings / monthIncome) * 100 : 0

  // Category breakdown for expenses
  const expenseCategoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [monthTxs])

  // Category breakdown for income
  const incomeCategoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'income').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [monthTxs])

  // Last 6 months trend
  const trendData = useMemo(() => {
    const months: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(monthKey(d))
    }
    return months.map(mk => {
      const txs = data.transactions.filter(t => t.date.startsWith(mk))
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { key: mk, label: monthLabel(mk), income, expense }
    })
  }, [data.transactions])

  const trendMax = useMemo(() =>
    Math.max(...trendData.flatMap(d => [d.income, d.expense]), 1),
    [trendData]
  )

  // Available months for filter (months that have data + current)
  const availableMonths = useMemo(() => {
    const keys = new Set<string>()
    keys.add(monthKey(new Date()))
    data.transactions.forEach(t => keys.add(t.date.slice(0, 7)))
    return Array.from(keys).sort((a, b) => b.localeCompare(a))
  }, [data.transactions])

  // ─── Categories for current form type ───────────────────────────────────────

  const currentCategories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  // ─── Sorted transactions ────────────────────────────────────────────────────

  const sortedTxs = [...monthTxs].sort((a, b) => b.date.localeCompare(a.date))

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
            <TrendingUp className="w-7 h-7 text-green-400" />
            Finance Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Income, expenses, and savings overview</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showForm
              ? 'bg-slate-700 text-slate-300'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/30">
          <h3 className="font-semibold text-slate-300">New Transaction</h3>

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700">
            {(['income', 'expense'] as const).map(t => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${
                  form.type === t
                    ? t === 'income'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="game-input w-full"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="game-input w-full"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {currentCategories.map(cat => {
                const color = form.type === 'income' ? INCOME_COLORS[cat] : EXPENSE_COLORS[cat]
                const selected = form.category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
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

          {/* Description */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTransaction()}
              placeholder="What was this for?"
              className="game-input w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={addTransaction}
              disabled={!form.amount || parseFloat(form.amount) <= 0}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${
                form.type === 'income'
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              Add {form.type === 'income' ? 'Income' : 'Expense'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="game-input flex-1 text-sm"
        >
          {availableMonths.map(mk => (
            <option key={mk} value={mk}>{monthLabel(mk)}</option>
          ))}
        </select>
        <button
          onClick={() => setFilterMonth(monthKey(new Date()))}
          className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
          title="Go to current month"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Income</div>
          <div className="text-lg font-bold text-green-400">{fmt(monthIncome)}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Expenses</div>
          <div className="text-lg font-bold text-red-400">{fmt(monthExpenses)}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Net Savings</div>
          <div className={`text-lg font-bold ${netSavings >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {netSavings >= 0 ? '' : '-'}{fmt(netSavings)}
          </div>
        </div>
      </div>

      {/* Savings Rate */}
      {monthIncome > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300 font-medium">Savings Rate</span>
            </div>
            <span className={`text-sm font-bold ${savingsRate >= 20 ? 'text-green-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, savingsRate))}%`,
                background: savingsRate >= 20 ? '#22c55e' : savingsRate >= 10 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>0%</span>
            <span className="text-slate-500">Goal: 20%+</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
        {([
          { key: 'overview', label: 'Breakdown', icon: BarChart3 },
          { key: 'transactions', label: 'Transactions', icon: Star },
          { key: 'trends', label: '6-Month Trend', icon: TrendingUp },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === key
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Breakdown */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Expense breakdown */}
          {expenseCategoryTotals.length > 0 && (
            <div className="game-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-400" />
                Top Expense Categories
              </h3>
              {expenseCategoryTotals.map(([cat, total]) => {
                const pct = monthExpenses > 0 ? (total / monthExpenses) * 100 : 0
                const color = EXPENSE_COLORS[cat] || '#64748b'
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{fmt(total)}</span>
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

          {/* Income breakdown */}
          {incomeCategoryTotals.length > 0 && (
            <div className="game-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                Income Sources
              </h3>
              {incomeCategoryTotals.map(([cat, total]) => {
                const pct = monthIncome > 0 ? (total / monthIncome) * 100 : 0
                const color = INCOME_COLORS[cat] || '#64748b'
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{fmt(total)}</span>
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

          {monthTxs.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No transactions for {monthLabel(filterMonth)}.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-2">
          {sortedTxs.length > 0 ? sortedTxs.map(tx => {
            const color = tx.type === 'income'
              ? (INCOME_COLORS[tx.category] || '#22c55e')
              : (EXPENSE_COLORS[tx.category] || '#ef4444')
            return (
              <div key={tx.id} className="game-card p-3 flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-200 font-medium truncate">
                      {tx.description || tx.category}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: color + '22', color }}
                    >
                      {tx.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{tx.date}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          }) : (
            <div className="text-center py-10 text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No transactions yet for {monthLabel(filterMonth)}.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Add First Transaction
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: 6-Month Trend */}
      {activeTab === 'trends' && (
        <div className="game-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            6-Month Income vs Expenses
          </h3>

          <div className="flex items-end gap-2 h-36">
            {trendData.map(d => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                {/* Bars */}
                <div className="w-full flex gap-0.5 items-end" style={{ height: '112px' }}>
                  {/* Income bar */}
                  <div
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{
                      height: `${trendMax > 0 ? (d.income / trendMax) * 100 : 0}%`,
                      minHeight: d.income > 0 ? '4px' : '0',
                      background: '#22c55e',
                    }}
                    title={`Income: ${fmt(d.income)}`}
                  />
                  {/* Expense bar */}
                  <div
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{
                      height: `${trendMax > 0 ? (d.expense / trendMax) * 100 : 0}%`,
                      minHeight: d.expense > 0 ? '4px' : '0',
                      background: '#ef4444',
                    }}
                    title={`Expenses: ${fmt(d.expense)}`}
                  />
                </div>
                {/* Label */}
                <div className="text-xs text-slate-500 text-center whitespace-nowrap">
                  {d.label.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-slate-400">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-xs text-slate-400">Expenses</span>
            </div>
          </div>

          {/* Monthly net summary table */}
          <div className="border-t border-slate-700 pt-3 space-y-1.5">
            {trendData.map(d => {
              const net = d.income - d.expense
              return (
                <div key={d.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 w-20">{d.label}</span>
                  <span className="text-green-400">{fmt(d.income)}</span>
                  <span className="text-red-400">{fmt(d.expense)}</span>
                  <span className={`font-semibold ${net >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    {net >= 0 ? '+' : ''}{fmt(net)}
                  </span>
                </div>
              )
            })}
            {/* Header for the table */}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-700/50 pt-1">
            <span className="w-20">Month</span>
            <span>Income</span>
            <span>Expenses</span>
            <span>Net</span>
          </div>
        </div>
      )}

      {/* All-time stats footer */}
      {data.transactions.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-slate-300">All-Time Stats</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-base font-bold text-green-400">
                {fmt(data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}
              </div>
              <div className="text-xs text-slate-500">Total Income</div>
            </div>
            <div>
              <div className="text-base font-bold text-red-400">
                {fmt(data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
              </div>
              <div className="text-xs text-slate-500">Total Spent</div>
            </div>
            <div>
              <div className="text-base font-bold text-slate-300">{data.transactions.length}</div>
              <div className="text-xs text-slate-500">Transactions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
