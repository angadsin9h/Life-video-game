import { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DebtType = 'credit-card' | 'student-loan' | 'mortgage' | 'car-loan' | 'personal-loan' | 'medical' | 'family' | 'business' | 'other'
type PayoffStrategy = 'avalanche' | 'snowball' | 'minimum' | 'custom'

interface Debt {
  id: string
  type: DebtType
  name: string
  balance: number
  originalBalance: number
  interestRate: number
  minimumPayment: number
  actualPayment: number
  strategy: PayoffStrategy
  dueDate: string
  targetPayoffDate: string
  notes: string
  isPriority: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<DebtType, { label: string; emoji: string; color: string }> = {
  'credit-card':  { label: 'Credit Card',   emoji: '💳', color: '#ef4444' },
  'student-loan': { label: 'Student Loan',  emoji: '🎓', color: '#3b82f6' },
  mortgage:       { label: 'Mortgage',      emoji: '🏠', color: '#22c55e' },
  'car-loan':     { label: 'Car Loan',      emoji: '🚗', color: '#f97316' },
  'personal-loan':{ label: 'Personal Loan', emoji: '💰', color: '#a855f7' },
  medical:        { label: 'Medical',       emoji: '🏥', color: '#f59e0b' },
  family:         { label: 'Family',        emoji: '👨‍👩‍👧', color: '#0ea5e9' },
  business:       { label: 'Business',      emoji: '💼', color: '#6366f1' },
  other:          { label: 'Other',         emoji: '📋', color: '#94a3b8' },
}

const STORAGE_KEY = 'personal_debts'

export default function PersonalDebts() {
  const { toastSuccess } = useToast()
  const [debts, setDebts] = useState<Debt[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Debt, 'id' | 'createdAt'>>({
    type: 'credit-card', name: '', balance: 0, originalBalance: 0,
    interestRate: 0, minimumPayment: 0, actualPayment: 0,
    strategy: 'avalanche', dueDate: '', targetPayoffDate: '', notes: '', isPriority: false,
  })

  useEffect(() => {
    try { setDebts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Debt[]) => { setDebts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const d: Debt = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([d, ...debts])
    setForm(f => ({ ...f, name: '', notes: '', balance: 0, originalBalance: 0 }))
    setShowForm(false)
    toastSuccess('Debt tracked 💳')
  }

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalOriginal = debts.reduce((s, d) => s + d.originalBalance, 0)
  const paidOff = totalOriginal > 0 ? Math.round(((totalOriginal - totalDebt) / totalOriginal) * 100) : 0
  const highestRate = debts.length ? Math.max(...debts.map(d => d.interestRate)) : 0

  const makePayment = (id: string, amount: number) => {
    save(debts.map(d => d.id === id ? { ...d, balance: Math.max(0, d.balance - amount) } : d))
    toastSuccess('Payment recorded!')
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <CreditCard className="w-7 h-7 text-red-400" />
            Debt Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and eliminate every debt with a clear strategy.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">${totalDebt.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Total Debt</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{paidOff}%</div>
          <div className="text-xs text-slate-500">Paid Off</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{highestRate}%</div>
          <div className="text-xs text-slate-500">Highest Rate</div>
        </div>
      </div>

      {totalDebt > 0 && totalOriginal > 0 && (
        <div className="game-card p-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Overall payoff progress</span>
            <span>{paidOff}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${paidOff}%` }} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Debt</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DebtType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [DebtType, typeof TYPE_CONFIG.mortgage][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value as PayoffStrategy }))} className="game-input text-sm flex-1">
              <option value="avalanche">Avalanche</option>
              <option value="snowball">Snowball</option>
              <option value="minimum">Minimum</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Debt name *" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Current balance ($)</p>
              <input type="number" value={form.balance} min={0} step={0.01}
                onChange={e => setForm(f => ({ ...f, balance: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Original balance ($)</p>
              <input type="number" value={form.originalBalance} min={0} step={0.01}
                onChange={e => setForm(f => ({ ...f, originalBalance: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Interest rate (%)</p>
              <input type="number" value={form.interestRate} min={0} step={0.1}
                onChange={e => setForm(f => ({ ...f, interestRate: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Min payment ($)</p>
              <input type="number" value={form.minimumPayment} min={0} step={0.01}
                onChange={e => setForm(f => ({ ...f, minimumPayment: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <input type="date" value={form.targetPayoffDate} onChange={e => setForm(f => ({ ...f, targetPayoffDate: e.target.value }))}
              className="game-input text-xs flex-1" />
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isPriority} onChange={e => setForm(f => ({ ...f, isPriority: e.target.checked }))} />
              Priority
            </label>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {debts.sort((a, b) => b.interestRate - a.interestRate).map(d => {
          const t = TYPE_CONFIG[d.type]
          const pct = d.originalBalance > 0 ? Math.round(((d.originalBalance - d.balance) / d.originalBalance) * 100) : 0
          return (
            <div key={d.id} className="game-card p-3" style={{ borderLeft: `3px solid ${d.isPriority ? '#f59e0b' : t.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{d.name}</span>
                    {d.isPriority && <span className="text-xs text-yellow-400">★ Priority</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-red-400">${d.balance.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">{d.interestRate}% APR</span>
                    <span className="text-xs text-slate-500">min ${d.minimumPayment}</span>
                  </div>
                  {d.originalBalance > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{pct}% paid</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button onClick={() => makePayment(d.id, d.minimumPayment)}
                    className="px-2 py-1 bg-green-700/30 text-green-300 rounded-lg text-xs whitespace-nowrap">
                    Pay ${d.minimumPayment}
                  </button>
                  <button onClick={() => save(debts.filter(x => x.id !== d.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {debts.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Face your debts directly. What you track, you can conquer.</p>
          </div>
        )}
      </div>
    </div>
  )
}
