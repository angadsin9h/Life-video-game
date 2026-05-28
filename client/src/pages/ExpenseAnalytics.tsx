import { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, DollarSign, PieChart, Calendar, ArrowUp, ArrowDown } from 'lucide-react'

interface Expense {
  id: number
  date: string
  amount: number
  category: string
  description: string
  type: 'expense' | 'income'
}

interface CategorySummary {
  category: string
  total: number
  count: number
  pct: number
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  entertainment: '#8b5cf6',
  shopping: '#ec4899',
  health: '#22c55e',
  bills: '#ef4444',
  education: '#14b8a6',
  savings: '#84cc16',
  income: '#10b981',
  other: '#94a3b8',
}

export default function ExpenseAnalytics() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('month')

  useEffect(() => {
    axios.get('/api/expenses?limit=500').then(r => {
      setExpenses(r.data as Expense[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const cutoff = new Date(now)
  if (period === 'week') cutoff.setDate(cutoff.getDate() - 7)
  else if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1)
  else cutoff.setMonth(cutoff.getMonth() - 3)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filtered = expenses.filter(e => e.date >= cutoffStr)
  const expenseItems = filtered.filter(e => e.type === 'expense' || !e.type)
  const incomeItems = filtered.filter(e => e.type === 'income')

  const totalExpenses = expenseItems.reduce((s, e) => s + e.amount, 0)
  const totalIncome = incomeItems.reduce((s, e) => s + e.amount, 0)
  const net = totalIncome - totalExpenses

  const byCategory: Record<string, CategorySummary> = {}
  for (const e of expenseItems) {
    const cat = e.category || 'other'
    if (!byCategory[cat]) byCategory[cat] = { category: cat, total: 0, count: 0, pct: 0 }
    byCategory[cat].total += e.amount
    byCategory[cat].count++
  }
  const catList = Object.values(byCategory)
    .map(c => ({ ...c, pct: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)

  // Daily spending for chart
  const days: Record<string, number> = {}
  const chartDays = period === 'week' ? 7 : period === 'month' ? 30 : 90
  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days[d.toISOString().split('T')[0]] = 0
  }
  for (const e of expenseItems) {
    if (days[e.date] !== undefined) days[e.date] += e.amount
  }
  const dailyData = Object.entries(days).map(([date, amount]) => ({ date, amount }))
  const maxDay = Math.max(...dailyData.map(d => d.amount), 1)

  // Monthly comparison
  const thisMonthStr = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const lastMonthStr = lastMonth.toISOString().slice(0, 7)
  const thisMonthTotal = expenses.filter(e => e.date?.startsWith(thisMonthStr) && e.type !== 'income').reduce((s, e) => s + e.amount, 0)
  const lastMonthTotal = expenses.filter(e => e.date?.startsWith(lastMonthStr) && e.type !== 'income').reduce((s, e) => s + e.amount, 0)
  const monthChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  const avgDaily = totalExpenses / chartDays

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Expense Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Understand where your money goes</p>
        </div>
        <div className="flex gap-1">
          {(['week', 'month', '3months'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              {p === '3months' ? '3M' : p === 'month' ? '1M' : '7D'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Spent', value: `$${totalExpenses.toFixed(0)}`, icon: DollarSign, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: 'Total Income', value: `$${totalIncome.toFixed(0)}`, icon: ArrowUp, color: 'text-green-400', bg: 'bg-green-900/20' },
          { label: 'Net', value: `${net >= 0 ? '+' : ''}$${net.toFixed(0)}`, icon: net >= 0 ? ArrowUp : ArrowDown, color: net >= 0 ? 'text-green-400' : 'text-red-400', bg: net >= 0 ? 'bg-green-900/20' : 'bg-red-900/20' },
          { label: 'Daily Avg', value: `$${avgDaily.toFixed(0)}`, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-900/20' },
        ].map(t => (
          <div key={t.label} className={`game-card p-4 ${t.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className={`text-xl font-bold ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Month-over-month */}
      {lastMonthTotal > 0 && (
        <div className="game-card p-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">vs. last month</span>
          <div className={`flex items-center gap-1 font-bold text-sm ${monthChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {monthChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(monthChange).toFixed(1)}% {monthChange > 0 ? 'more' : 'less'} than last month
          </div>
        </div>
      )}

      {/* Daily spending chart */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4" /> Daily Spending
        </h3>
        <div className="flex items-end gap-0.5 h-24">
          {dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                {d.date}: ${d.amount.toFixed(0)}
              </div>
              <div className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${(d.amount / maxDay) * 100}%`,
                  background: d.amount > avgDaily * 2 ? '#ef4444' : d.amount > avgDaily ? '#f97316' : '#22c55e',
                  minHeight: d.amount > 0 ? '2px' : '0',
                }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>{dailyData[0]?.date?.slice(5)}</span>
          <span>avg ${avgDaily.toFixed(0)}/day</span>
          <span>{dailyData[dailyData.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>

      {/* Category breakdown */}
      {catList.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> By Category
          </h3>
          <div className="space-y-3">
            {catList.map(c => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{c.category}</span>
                  <span className="text-slate-400">${c.total.toFixed(0)} <span className="text-slate-600">({c.pct.toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${c.pct}%`, background: CATEGORY_COLORS[c.category] || '#94a3b8' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Donut-like legend */}
          <div className="flex flex-wrap gap-2 mt-4">
            {catList.slice(0, 6).map(c => (
              <div key={c.category} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: CATEGORY_COLORS[c.category] || '#94a3b8' }} />
                <span className="capitalize">{c.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No expense data yet. Start tracking in the Expenses page.</p>
        </div>
      )}
    </div>
  )
}
