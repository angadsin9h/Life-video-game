import { useEffect, useState } from 'react'
import axios from 'axios'
import { DollarSign, Plus, Trash2, TrendingUp, Edit3, Check } from 'lucide-react'

interface Expense {
  id: number
  date: string
  amount: number
  category: string
  description: string
}

interface MonthData {
  expenses: Expense[]
  totals: Record<string, number>
  budgets: Record<string, number>
}

const CATEGORIES = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'other']
const CAT_ICONS: Record<string, string> = {
  food: '🍔', transport: '🚗', entertainment: '🎬', shopping: '🛍️', bills: '📄', health: '💊', other: '💰',
}
const CAT_COLORS: Record<string, string> = {
  food: 'text-orange-400', transport: 'text-blue-400', entertainment: 'text-purple-400',
  shopping: 'text-pink-400', bills: 'text-red-400', health: 'text-green-400', other: 'text-slate-400',
}

function fmtCurrency(n: number): string {
  return `$${n.toFixed(2)}`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Expenses() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [data, setData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetVal, setBudgetVal] = useState('')
  const [form, setForm] = useState({ date: today.toISOString().split('T')[0], amount: '', category: 'food', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get<MonthData>(`/api/expenses/month/${year}/${month}`)
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year, month])

  const addExpense = async () => {
    if (!form.amount || !form.date) return
    setSubmitting(true)
    try {
      await axios.post('/api/expenses', form)
      setForm(f => ({ ...f, amount: '', description: '' }))
      setShowForm(false)
      await load()
    } finally { setSubmitting(false) }
  }

  const deleteExpense = async (id: number) => {
    await axios.delete(`/api/expenses/${id}`)
    setData(prev => prev ? { ...prev, expenses: prev.expenses.filter(e => e.id !== id) } : prev)
    await load()
  }

  const saveBudget = async (cat: string) => {
    const val = parseFloat(budgetVal)
    if (!isNaN(val)) {
      await axios.put(`/api/expenses/budgets/${cat}`, { monthly_limit: val })
      await load()
    }
    setEditingBudget(null)
  }

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m)
    setYear(y)
  }

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const totalSpent = data ? Object.values(data.totals).reduce((s, v) => s + v, 0) : 0
  const totalBudget = data ? Object.values(data.budgets).reduce((s, v) => s + v, 0) : 0
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1
  const budgetPct = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0

  const groupedByDate: Record<string, Expense[]> = {}
  if (data) {
    data.expenses.forEach(e => {
      if (!groupedByDate[e.date]) groupedByDate[e.date] = []
      groupedByDate[e.date].push(e)
    })
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <DollarSign className="w-8 h-8 text-green-400" />
            Expenses
          </h1>
          <p className="text-slate-400 mt-1">Track spending, stick to budgets</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="game-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between game-card p-4">
        <button onClick={() => changeMonth(-1)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">←</button>
        <div className="text-center">
          <div className={`font-semibold ${isCurrentMonth ? 'text-green-400' : 'text-slate-200'}`}>{monthName}</div>
          {isCurrentMonth && <div className="text-xs text-slate-500">Current Month</div>}
        </div>
        <button onClick={() => changeMonth(1)} disabled={isCurrentMonth} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors">→</button>
      </div>

      {/* Month summary */}
      {data && (
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Month Overview
            </h3>
            <div className="text-right">
              <div className={`text-xl font-bold ${budgetPct > 100 ? 'text-red-400' : budgetPct > 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                {fmtCurrency(totalSpent)}
              </div>
              <div className="text-xs text-slate-500">/ {fmtCurrency(totalBudget)} budget</div>
            </div>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(budgetPct, 100)}%`,
                background: budgetPct > 100 ? '#ef4444' : budgetPct > 80 ? '#f59e0b' : '#22c55e',
              }}
            />
          </div>

          <div className="space-y-3">
            {CATEGORIES.map(cat => {
              const spent = data.totals[cat] || 0
              const budget = data.budgets[cat] || 0
              const pct = budget > 0 ? Math.round(spent / budget * 100) : 0
              if (spent === 0 && budget === 0) return null
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{CAT_ICONS[cat]}</span>
                    <span className={`text-sm font-medium flex-1 ${CAT_COLORS[cat]}`}>{cat}</span>
                    <span className="text-xs text-slate-400">{fmtCurrency(spent)}</span>
                    <span className="text-xs text-slate-600">/</span>
                    {editingBudget === cat ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">$</span>
                        <input
                          type="number"
                          value={budgetVal}
                          onChange={e => setBudgetVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveBudget(cat); if (e.key === 'Escape') setEditingBudget(null) }}
                          autoFocus
                          className="w-16 bg-slate-700 border border-violet-500 rounded px-1 py-0.5 text-xs text-slate-200 focus:outline-none"
                        />
                        <button onClick={() => saveBudget(cat)} className="text-green-400"><Check className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingBudget(cat); setBudgetVal(String(budget)) }}
                        className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"
                      >
                        {fmtCurrency(budget)} <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <span className={`text-xs w-10 text-right font-bold ${pct > 100 ? 'text-red-400' : pct > 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {pct}%
                    </span>
                  </div>
                  {(spent > 0 || budget > 0) && (
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-3 border border-violet-500/30">
          <h3 className="font-semibold text-slate-200">Add Expense</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addExpense()}
            placeholder="Description (optional)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <div className="flex gap-2">
            <button onClick={addExpense} disabled={submitting || !form.amount} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors">
              {submitting ? 'Adding…' : 'Add Expense'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expenses by date */}
      {data && Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, exps]) => {
            const dayTotal = exps.reduce((s, e) => s + e.amount, 0)
            return (
              <div key={date} className="game-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-sm font-semibold text-slate-300">{fmtDate(date)}</span>
                  <span className="text-sm font-bold text-slate-200">{fmtCurrency(dayTotal)}</span>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {exps.map(exp => (
                    <div key={exp.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-sm flex-shrink-0">{CAT_ICONS[exp.category]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200">{exp.description || exp.category}</div>
                        <div className={`text-xs ${CAT_COLORS[exp.category]}`}>{exp.category}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-slate-200">{fmtCurrency(exp.amount)}</span>
                        <button onClick={() => deleteExpense(exp.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No expenses for {monthName}. Add your first!</p>
        </div>
      )}
    </div>
  )
}
