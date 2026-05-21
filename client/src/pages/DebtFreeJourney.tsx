import { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DebtType = 'credit-card' | 'student-loan' | 'mortgage' | 'car-loan' | 'personal-loan' | 'medical' | 'family' | 'business' | 'tax' | 'other'
type PayoffStrategy = 'avalanche' | 'snowball' | 'consolidation' | 'minimum' | 'aggressive'

interface DebtEntry {
  id: string
  debtType: DebtType
  strategy: PayoffStrategy
  creditorName: string
  originalAmount: number
  currentBalance: number
  minimumPayment: number
  interestRate: number
  targetPayoffDate: string
  notes: string
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<DebtType, { label: string; emoji: string; color: string }> = {
  'credit-card':  { label: 'Credit Card',    emoji: '💳', color: '#ef4444' },
  'student-loan': { label: 'Student Loan',   emoji: '🎓', color: '#6366f1' },
  mortgage:       { label: 'Mortgage',       emoji: '🏠', color: '#3b82f6' },
  'car-loan':     { label: 'Car Loan',       emoji: '🚗', color: '#f97316' },
  'personal-loan':{ label: 'Personal Loan',  emoji: '💰', color: '#f59e0b' },
  medical:        { label: 'Medical',        emoji: '🏥', color: '#ec4899' },
  family:         { label: 'Family',         emoji: '👨‍👩‍👧', color: '#84cc16' },
  business:       { label: 'Business',       emoji: '💼', color: '#22c55e' },
  tax:            { label: 'Tax Debt',       emoji: '📋', color: '#a855f7' },
  other:          { label: 'Other',          emoji: '📊', color: '#94a3b8' },
}

const STRATEGY_CONFIG: Record<PayoffStrategy, { label: string; description: string }> = {
  avalanche:     { label: 'Avalanche',     description: 'Highest interest first' },
  snowball:      { label: 'Snowball',      description: 'Smallest balance first' },
  consolidation: { label: 'Consolidation', description: 'Combine into one payment' },
  minimum:       { label: 'Minimum',       description: 'Minimum payments only' },
  aggressive:    { label: 'Aggressive',    description: 'Maximum extra payments' },
}

const STORAGE_KEY = 'debt_free_journey'

export default function DebtFreeJourney() {
  const { toastSuccess } = useToast()
  const [debts, setDebts] = useState<DebtEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DebtEntry, 'id' | 'createdAt'>>({
    debtType: 'credit-card', strategy: 'avalanche', creditorName: '',
    originalAmount: 0, currentBalance: 0, minimumPayment: 0,
    interestRate: 0, targetPayoffDate: '', notes: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setDebts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DebtEntry[]) => { setDebts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.creditorName.trim()) return
    const d: DebtEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([d, ...debts])
    setForm(f => ({ ...f, creditorName: '', originalAmount: 0, currentBalance: 0, minimumPayment: 0, interestRate: 0, targetPayoffDate: '', notes: '' }))
    setShowForm(false)
    toastSuccess('Debt tracked — face it to erase it 💪')
  }

  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0)
  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0)
  const paidOff = totalOriginal > 0 ? Math.round(((totalOriginal - totalDebt) / totalOriginal) * 100) : 0

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <CreditCard className="w-7 h-7 text-red-400" />
            Debt-Free Journey
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track every debt. Watch your freedom grow.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{fmt(totalDebt)}</div>
          <div className="text-xs text-slate-500">Total Debt</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{debts.length}</div>
          <div className="text-xs text-slate-500">Accounts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{paidOff}%</div>
          <div className="text-xs text-slate-500">Paid Off</div>
        </div>
      </div>

      {totalDebt > 0 && (
        <div className="game-card p-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress to debt-free</span>
            <span>{paidOff}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${paidOff}%` }} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Debt</h3>
          <div className="flex gap-2">
            <select value={form.debtType} onChange={e => setForm(f => ({ ...f, debtType: e.target.value as DebtType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [DebtType, typeof TYPE_CONFIG.mortgage][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value as PayoffStrategy }))} className="game-input text-sm flex-1">
              {(Object.entries(STRATEGY_CONFIG) as [PayoffStrategy, typeof STRATEGY_CONFIG.avalanche][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.creditorName} onChange={e => setForm(f => ({ ...f, creditorName: e.target.value }))}
            placeholder="Creditor / account name *" className="game-input w-full text-sm" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Original Amount ($)</p>
              <input type="number" value={form.originalAmount || ''} onChange={e => setForm(f => ({ ...f, originalAmount: Number(e.target.value) }))}
                placeholder="0" className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Current Balance ($)</p>
              <input type="number" value={form.currentBalance || ''} onChange={e => setForm(f => ({ ...f, currentBalance: Number(e.target.value) }))}
                placeholder="0" className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Min. Payment ($)</p>
              <input type="number" value={form.minimumPayment || ''} onChange={e => setForm(f => ({ ...f, minimumPayment: Number(e.target.value) }))}
                placeholder="0" className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Interest Rate (%)</p>
              <input type="number" step="0.01" value={form.interestRate || ''} onChange={e => setForm(f => ({ ...f, interestRate: Number(e.target.value) }))}
                placeholder="0" className="game-input w-full text-sm" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Target payoff date</p>
            <input type="date" value={form.targetPayoffDate} onChange={e => setForm(f => ({ ...f, targetPayoffDate: e.target.value }))} className="game-input w-full text-sm" />
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes or strategy details" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Add Debt</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {debts.map(d => {
          const t = TYPE_CONFIG[d.debtType]
          const progress = d.originalAmount > 0 ? Math.round(((d.originalAmount - d.currentBalance) / d.originalAmount) * 100) : 0
          return (
            <div key={d.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.creditorName}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs text-red-400">{d.interestRate}%</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-red-400 font-bold">{fmt(d.currentBalance)}</span>
                  <span className="text-xs text-slate-600">of {fmt(d.originalAmount)}</span>
                  <span className="text-xs text-green-400">{progress}% paid</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                {d.minimumPayment > 0 && <p className="text-xs text-slate-500 mt-0.5">Min: ${d.minimumPayment}/mo</p>}
              </div>
              <button onClick={() => save(debts.filter(x => x.id !== d.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {debts.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Financial freedom starts with facing every debt you owe.</p>
          </div>
        )}
      </div>
    </div>
  )
}
