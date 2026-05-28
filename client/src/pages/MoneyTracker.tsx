import { useState, useEffect } from 'react'
import { PiggyBank, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TxType = 'income' | 'expense' | 'transfer' | 'investment'
type TxCategory = 'salary' | 'freelance' | 'investment-return' | 'gift' | 'rent' | 'utilities' | 'groceries' | 'dining' | 'transport' | 'health' | 'entertainment' | 'clothing' | 'education' | 'savings' | 'other'

interface Transaction {
  id: string
  date: string
  type: TxType
  category: TxCategory
  description: string
  amount: number
  account: string
  createdAt: string
}

const CAT_CONFIG: Record<TxCategory, { label: string; emoji: string }> = {
  salary:             { label: 'Salary',          emoji: '💼' },
  freelance:          { label: 'Freelance',        emoji: '💻' },
  'investment-return':{ label: 'Investment',       emoji: '📈' },
  gift:               { label: 'Gift',             emoji: '🎁' },
  rent:               { label: 'Rent',             emoji: '🏠' },
  utilities:          { label: 'Utilities',        emoji: '💡' },
  groceries:          { label: 'Groceries',        emoji: '🛒' },
  dining:             { label: 'Dining',           emoji: '🍽️' },
  transport:          { label: 'Transport',        emoji: '🚗' },
  health:             { label: 'Health',           emoji: '❤️' },
  entertainment:      { label: 'Entertainment',    emoji: '🎮' },
  clothing:           { label: 'Clothing',         emoji: '👕' },
  education:          { label: 'Education',        emoji: '📚' },
  savings:            { label: 'Savings',          emoji: '💰' },
  other:              { label: 'Other',            emoji: '📦' },
}

const STORAGE_KEY = 'money_tracker_txs'

export default function MoneyTracker() {
  const { toastSuccess } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<Transaction, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'expense', category: 'groceries', description: '', amount: 0, account: 'main',
  })

  useEffect(() => {
    try { setTransactions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Transaction[]) => { setTransactions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.description.trim() || form.amount <= 0) return
    const t: Transaction = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([t, ...transactions])
    setForm({ date: new Date().toISOString().split('T')[0], type: 'expense', category: 'groceries', description: '', amount: 0, account: 'main' })
    setShowForm(false)
    toastSuccess('Transaction logged 💰')
  }

  const filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTxs = transactions.filter(t => t.date.startsWith(thisMonth))
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = monthIncome - monthExpense

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <PiggyBank className="w-7 h-7 text-emerald-400" />
            Money Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log every transaction. Know your money.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="game-card p-4 border border-emerald-500/20">
        <p className="text-xs text-slate-500 mb-3">This month — {thisMonth}</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-0.5">
              <TrendingUp className="w-3 h-3 text-green-400" /> In
            </div>
            <div className="font-bold text-green-400">${monthIncome.toLocaleString()}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-0.5">
              <TrendingDown className="w-3 h-3 text-red-400" /> Out
            </div>
            <div className="font-bold text-red-400">${monthExpense.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Net</div>
            <div className={`font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>${net.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'income', 'expense', 'investment'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl text-xs capitalize ${filterType === t ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Transaction</h3>
          <div className="flex gap-2">
            {['income', 'expense', 'investment', 'transfer'].map(tp => (
              <button key={tp} onClick={() => setForm(f => ({ ...f, type: tp as TxType }))}
                className={`flex-1 py-1.5 rounded-xl text-xs capitalize ${form.type === tp ? (tp === 'income' ? 'bg-green-700/30 text-green-400' : tp === 'expense' ? 'bg-red-700/30 text-red-400' : 'bg-blue-700/30 text-blue-400') : 'bg-slate-800 text-slate-500'}`}>
                {tp}
              </button>
            ))}
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TxCategory }))} className="game-input text-sm w-full">
            {(Object.entries(CAT_CONFIG) as [TxCategory, typeof CAT_CONFIG.salary][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <input type="number" value={form.amount || ''} min={0} step="0.01"
              onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
              placeholder="Amount" className="game-input w-28 text-sm" autoFocus />
          </div>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description *" className="game-input w-full" />
          <input value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))}
            placeholder="Account" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {filtered.slice(0, 50).map(t => {
          const c = CAT_CONFIG[t.category]
          const isIncome = t.type === 'income' || t.type === 'investment'
          return (
            <div key={t.id} className="game-card p-3 flex items-center gap-3">
              <span className="text-xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white truncate">{t.description}</span>
                </div>
                <p className="text-xs text-slate-500">{t.date} · {c.label}</p>
              </div>
              <span className={`text-sm font-semibold flex-shrink-0 ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                {isIncome ? '+' : '-'}${t.amount.toLocaleString()}
              </span>
              <button onClick={() => save(transactions.filter(x => x.id !== t.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track every dollar to take control of your finances.</p>
          </div>
        )}
      </div>
    </div>
  )
}
