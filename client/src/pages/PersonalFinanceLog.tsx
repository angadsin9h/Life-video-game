import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Plus, X, BarChart3, Brain, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TransactionType = 'Income' | 'Essential Expense' | 'Investment' | 'Savings' | 'Lifestyle' | 'Giving' | 'Debt Payment' | 'Business'
type EmotionType = 'Excited' | 'Content' | 'Guilty' | 'Anxious' | 'Proud' | 'Neutral' | 'Regretful' | 'Grateful'

interface FinanceEntry {
  id: string
  date: string
  transactionType: TransactionType
  amount: number
  category: string
  emotion: EmotionType
  intentional: boolean
  alignedWithValues: boolean
  notes: string
  financeScore: number
  createdAt: string
}

const STORAGE_KEY = 'personal_finance_log'

const TRANSACTION_TYPES: TransactionType[] = [
  'Income', 'Essential Expense', 'Investment', 'Savings',
  'Lifestyle', 'Giving', 'Debt Payment', 'Business',
]
const EMOTIONS: EmotionType[] = ['Excited', 'Content', 'Guilty', 'Anxious', 'Proud', 'Neutral', 'Regretful', 'Grateful']

const TYPE_COLORS: Record<TransactionType, string> = {
  Income: '#22c55e',
  'Essential Expense': '#f59e0b',
  Investment: '#6366f1',
  Savings: '#3b82f6',
  Lifestyle: '#f97316',
  Giving: '#14b8a6',
  'Debt Payment': '#ef4444',
  Business: '#a855f7',
}

const EMOTION_COLORS: Record<EmotionType, string> = {
  Excited: '#f59e0b',
  Content: '#22c55e',
  Guilty: '#ef4444',
  Anxious: '#f97316',
  Proud: '#6366f1',
  Neutral: '#64748b',
  Regretful: '#dc2626',
  Grateful: '#10b981',
}

const INCOME_TYPES: Set<TransactionType> = new Set(['Income', 'Business'])
const EXPENSE_TYPES: Set<TransactionType> = new Set(['Essential Expense', 'Lifestyle', 'Debt Payment'])
const INVEST_TYPES: Set<TransactionType> = new Set(['Investment'])
const SAVE_TYPES: Set<TransactionType> = new Set(['Savings'])

function calcFinanceScore(intentional: boolean, alignedWithValues: boolean): number {
  if (intentional && alignedWithValues) return 100
  if (intentional || alignedWithValues) return 70
  return 40
}

function thisMonth(entries: FinanceEntry[]): FinanceEntry[] {
  const now = new Date()
  return entries.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
}

function last30Days(entries: FinanceEntry[]): FinanceEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  return entries.filter(e => new Date(e.date) >= cutoff)
}

export default function PersonalFinanceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<FinanceEntry, 'id' | 'financeScore' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'Income',
    amount: 0,
    category: '',
    emotion: 'Neutral',
    intentional: true,
    alignedWithValues: true,
    notes: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (u: FinanceEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const submit = () => {
    if (!form.amount || form.amount <= 0) return
    const entry: FinanceEntry = {
      id: Date.now().toString(),
      ...form,
      financeScore: calcFinanceScore(form.intentional, form.alignedWithValues),
      createdAt: new Date().toISOString(),
    }
    persist([entry, ...entries])
    setForm(f => ({ ...f, amount: 0, category: '', notes: '' }))
    setShowForm(false)
    toastSuccess('Transaction logged — every dollar is a vote for your values!')
  }

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const monthEntries = thisMonth(entries)
  const last30 = last30Days(entries)

  const income = monthEntries.filter(e => INCOME_TYPES.has(e.transactionType)).reduce((s, e) => s + e.amount, 0)
  const expenses = monthEntries.filter(e => EXPENSE_TYPES.has(e.transactionType)).reduce((s, e) => s + e.amount, 0)
  const investments = monthEntries.filter(e => INVEST_TYPES.has(e.transactionType)).reduce((s, e) => s + e.amount, 0)
  const savings = monthEntries.filter(e => SAVE_TYPES.has(e.transactionType)).reduce((s, e) => s + e.amount, 0)
  const netCashFlow = income - expenses

  const mindsetScore = last30.length
    ? Math.round(last30.reduce((s, e) => s + e.financeScore, 0) / last30.length)
    : 0

  const emotionCounts: Partial<Record<EmotionType, number>> = {}
  entries.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1 })
  const topEmotion = (Object.entries(emotionCounts) as [EmotionType, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const intentionalCount = entries.filter(e => e.intentional).length
  const intentionalPct = entries.length ? Math.round((intentionalCount / entries.length) * 100) : 0

  const last10 = entries.slice(0, 10)

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Personal Finance Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Mindful money tracking with a wealth mindset.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Monthly totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-3 border border-green-500/20">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><ArrowUp className="w-3 h-3 text-green-400" /> Income this month</div>
          <div className="text-xl font-bold text-green-400">${fmt(income)}</div>
        </div>
        <div className="game-card p-3 border border-amber-500/20">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><ArrowDown className="w-3 h-3 text-amber-400" /> Expenses this month</div>
          <div className="text-xl font-bold text-amber-400">${fmt(expenses)}</div>
        </div>
        <div className="game-card p-3 border border-violet-500/20">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><TrendingUp className="w-3 h-3 text-violet-400" /> Investments</div>
          <div className="text-xl font-bold text-violet-400">${fmt(investments)}</div>
        </div>
        <div className="game-card p-3 border border-blue-500/20">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><TrendingUp className="w-3 h-3 text-blue-400" /> Savings</div>
          <div className="text-xl font-bold text-blue-400">${fmt(savings)}</div>
        </div>
      </div>

      {/* Net cash flow */}
      <div className={`game-card p-3 border ${netCashFlow >= 0 ? 'border-green-500/20' : 'border-red-500/20'} flex items-center justify-between`}>
        <div>
          <div className="text-xs text-slate-500">Net Cash Flow This Month</div>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netCashFlow >= 0 ? '+' : '-'}${fmt(Math.abs(netCashFlow))}
          </div>
        </div>
        {netCashFlow >= 0
          ? <TrendingUp className="w-8 h-8 text-green-400/40" />
          : <TrendingDown className="w-8 h-8 text-red-400/40" />}
      </div>

      {/* Mindset & behavior stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{mindsetScore}</div>
          <div className="text-xs text-slate-500">Mindset Score</div>
          <div className="text-xs text-slate-600">last 30 days</div>
        </div>
        <div className="game-card p-3">
          <div className="text-sm font-bold text-pink-400 mt-1">{topEmotion ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">Top Emotion</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{intentionalPct}%</div>
          <div className="text-xs text-slate-500">Intentional</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Log Transaction</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.transactionType} onChange={e => set('transactionType', e.target.value as TransactionType)} className="game-input text-sm">
              {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))}
              placeholder="Amount ($)" className="game-input text-sm" min={0} step={0.01} />
          </div>
          <input value={form.category} onChange={e => set('category', e.target.value)}
            placeholder="What specifically? (e.g. Salary, Rent, Books)" className="game-input w-full text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.emotion} onChange={e => set('emotion', e.target.value as EmotionType)} className="game-input text-sm">
              {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="game-input text-sm" />
          </div>
          <input value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Notes (optional)" className="game-input w-full text-sm" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.intentional} onChange={e => set('intentional', e.target.checked)}
                className="accent-green-500" />
              Intentional / planned
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.alignedWithValues} onChange={e => set('alignedWithValues', e.target.checked)}
                className="accent-green-500" />
              Aligned with values
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Finance Score: <span className="text-green-400 font-semibold">{calcFinanceScore(form.intentional, form.alignedWithValues)}</span>
          </p>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
              Save Transaction
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Emotion frequency */}
      {entries.length > 0 && (
        <div className="game-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" /> Emotion Frequency
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(emotionCounts) as [EmotionType, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([em, count]) => (
                <div key={em} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                  style={{ background: EMOTION_COLORS[em] + '20', color: EMOTION_COLORS[em] }}>
                  <span>{em}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Type breakdown */}
      {monthEntries.length > 0 && (
        <div className="game-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-400" /> This Month by Type
          </h3>
          {TRANSACTION_TYPES.filter(t => monthEntries.some(e => e.transactionType === t)).map(t => {
            const total = monthEntries.filter(e => e.transactionType === t).reduce((s, e) => s + e.amount, 0)
            const allTotal = monthEntries.reduce((s, e) => s + e.amount, 0)
            const pct = allTotal > 0 ? (total / allTotal) * 100 : 0
            return (
              <div key={t} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-32 truncate">{t}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: TYPE_COLORS[t] }} />
                </div>
                <span className="text-xs text-slate-400 w-20 text-right">${fmt(total)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Mini ledger */}
      {last10.length > 0 && (
        <div className="game-card p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Transactions</h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Type</th>
                <th className="pb-2 pr-3">Category</th>
                <th className="pb-2 pr-3">Amount</th>
                <th className="pb-2 pr-3">Emotion</th>
                <th className="pb-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {last10.map(e => (
                <tr key={e.id} className="border-t border-slate-700/50">
                  <td className="py-1.5 pr-3 text-slate-400">{e.date}</td>
                  <td className="py-1.5 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: TYPE_COLORS[e.transactionType] + '25', color: TYPE_COLORS[e.transactionType] }}>
                      {e.transactionType}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-slate-300 max-w-[80px] truncate">{e.category || '—'}</td>
                  <td className="py-1.5 pr-3">
                    <span className={INCOME_TYPES.has(e.transactionType) ? 'text-green-400' : 'text-amber-400'}>
                      {INCOME_TYPES.has(e.transactionType) ? '+' : '-'}${fmt(e.amount)}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3" style={{ color: EMOTION_COLORS[e.emotion] }}>{e.emotion}</td>
                  <td className="py-1.5 text-blue-400 font-semibold">{e.financeScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Every dollar is a decision. Track them with intention.</p>
        </div>
      )}
    </div>
  )
}
