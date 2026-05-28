import { useState, useEffect } from 'react'
import { PiggyBank, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BudgetCategory = 'housing' | 'food' | 'transport' | 'health' | 'entertainment' | 'clothing' | 'education' | 'savings' | 'utilities' | 'personal' | 'other'
type EntryType = 'income' | 'expense'

interface BudgetEntry {
  id: string
  month: string
  type: EntryType
  category: BudgetCategory
  description: string
  amount: number
  createdAt: string
}

const CAT_CONFIG: Record<BudgetCategory, { label: string; emoji: string; color: string }> = {
  housing:       { label: 'Housing',       emoji: '🏠', color: '#6366f1' },
  food:          { label: 'Food',          emoji: '🍔', color: '#f59e0b' },
  transport:     { label: 'Transport',     emoji: '🚗', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '❤️', color: '#ef4444' },
  entertainment: { label: 'Entertainment', emoji: '🎮', color: '#a855f7' },
  clothing:      { label: 'Clothing',      emoji: '👕', color: '#ec4899' },
  education:     { label: 'Education',     emoji: '📚', color: '#22c55e' },
  savings:       { label: 'Savings',       emoji: '💰', color: '#84cc16' },
  utilities:     { label: 'Utilities',     emoji: '💡', color: '#f97316' },
  personal:      { label: 'Personal',      emoji: '🧴', color: '#0ea5e9' },
  other:         { label: 'Other',         emoji: '📦', color: '#94a3b8' },
}

const STORAGE_KEY = 'budget_planner'

export default function BudgetPlanner() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BudgetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [form, setForm] = useState<Omit<BudgetEntry, 'id' | 'createdAt'>>({
    month: new Date().toISOString().slice(0, 7),
    type: 'expense', category: 'food', description: '', amount: 0,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BudgetEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.description.trim() || form.amount <= 0) return
    const e: BudgetEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ month: selectedMonth, type: 'expense', category: 'food', description: '', amount: 0 })
    setShowForm(false)
    toastSuccess('Entry added 💰')
  }

  const monthEntries = entries.filter(e => e.month === selectedMonth)
  const income = monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expenses = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const balance = income - expenses
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const byCategory = Object.entries(
    monthEntries.filter(e => e.type === 'expense').reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <PiggyBank className="w-7 h-7 text-green-400" />
            Budget Planner
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Plan and track your monthly budget.</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, month: selectedMonth })) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="game-input text-sm flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-3 border border-green-500/20">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><TrendingUp className="w-3.5 h-3.5 text-green-400" /> Income</div>
          <div className="text-xl font-bold text-green-400">${income.toLocaleString()}</div>
        </div>
        <div className="game-card p-3 border border-red-500/20">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><TrendingDown className="w-3.5 h-3.5 text-red-400" /> Expenses</div>
          <div className="text-xl font-bold text-red-400">${expenses.toLocaleString()}</div>
        </div>
        <div className="game-card p-3 col-span-1">
          <div className="text-xs text-slate-500 mb-1">Balance</div>
          <div className={`text-xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${balance.toLocaleString()}</div>
        </div>
        <div className="game-card p-3 col-span-1">
          <div className="text-xs text-slate-500 mb-1">Savings Rate</div>
          <div className={`text-xl font-bold ${savingsRate >= 20 ? 'text-green-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>{savingsRate}%</div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="game-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Spending by category</p>
          <div className="space-y-2">
            {byCategory.map(([cat, amount]) => {
              const c = CAT_CONFIG[cat as BudgetCategory]
              const pct = expenses > 0 ? (amount / expenses) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{c.emoji} {c.label}</span>
                    <span className="text-slate-400">${amount.toLocaleString()} · {Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Entry</h3>
          <div className="flex gap-2">
            <button onClick={() => setForm(f => ({ ...f, type: 'income' }))}
              className={`flex-1 py-2 rounded-xl text-sm ${form.type === 'income' ? 'bg-green-700/30 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
              Income
            </button>
            <button onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
              className={`flex-1 py-2 rounded-xl text-sm ${form.type === 'expense' ? 'bg-red-700/30 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
              Expense
            </button>
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as BudgetCategory }))} className="game-input text-sm w-full">
            {(Object.entries(CAT_CONFIG) as [BudgetCategory, typeof CAT_CONFIG.food][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description *" className="game-input flex-1" autoFocus />
            <input type="number" value={form.amount || ''} min={0}
              onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
              placeholder="Amount $" className="game-input w-28 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {monthEntries.length > 0 && (
          <p className="text-xs text-slate-600 uppercase tracking-wider">{selectedMonth} entries</p>
        )}
        {monthEntries.map(e => {
          const c = CAT_CONFIG[e.category]
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3"
              style={{ borderLeft: `3px solid ${e.type === 'income' ? '#22c55e' : '#ef4444'}` }}>
              <span className="text-xl">{c.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{e.description}</span>
                  <span className="text-xs text-slate-500">{c.label}</span>
                </div>
                <p className="text-xs text-slate-600">{e.type}</p>
              </div>
              <span className={`text-sm font-semibold ${e.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {e.type === 'income' ? '+' : '-'}${e.amount.toLocaleString()}
              </span>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {monthEntries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start tracking your income and expenses.</p>
          </div>
        )}
      </div>
    </div>
  )
}
