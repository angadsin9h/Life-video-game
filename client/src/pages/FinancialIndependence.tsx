import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FIArea = 'savings' | 'investments' | 'income' | 'debt' | 'expenses' | 'passive' | 'emergency' | 'tax' | 'insurance' | 'other'
type FIStatus = 'tracking' | 'on-track' | 'ahead' | 'behind' | 'achieved'

interface FIEntry {
  id: string
  area: FIArea
  status: FIStatus
  title: string
  currentAmount: number
  targetAmount: number
  monthlyContribution: number
  notes: string
  targetDate: string
  currency: string
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<FIArea, { label: string; emoji: string; color: string }> = {
  savings:     { label: 'Savings',           emoji: '🏦', color: '#22c55e' },
  investments: { label: 'Investments',       emoji: '📈', color: '#3b82f6' },
  income:      { label: 'Income Streams',    emoji: '💰', color: '#f59e0b' },
  debt:        { label: 'Debt Payoff',       emoji: '🔴', color: '#ef4444' },
  expenses:    { label: 'Expense Reduction', emoji: '✂️', color: '#a855f7' },
  passive:     { label: 'Passive Income',    emoji: '🌱', color: '#84cc16' },
  emergency:   { label: 'Emergency Fund',    emoji: '🛡️', color: '#6366f1' },
  tax:         { label: 'Tax Optimization',  emoji: '📋', color: '#0ea5e9' },
  insurance:   { label: 'Insurance',         emoji: '☂️', color: '#f97316' },
  other:       { label: 'Other',             emoji: '💼', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<FIStatus, { label: string; color: string }> = {
  tracking:  { label: 'Tracking',  color: '#94a3b8' },
  'on-track':{ label: 'On Track',  color: '#3b82f6' },
  ahead:     { label: 'Ahead! 🚀', color: '#22c55e' },
  behind:    { label: 'Behind',    color: '#f59e0b' },
  achieved:  { label: 'Achieved!', color: '#a855f7' },
}

const STORAGE_KEY = 'financial_independence'

export default function FinancialIndependence() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FIEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<FIEntry, 'id' | 'createdAt'>>({
    area: 'savings', status: 'tracking', title: '', currentAmount: 0,
    targetAmount: 0, monthlyContribution: 0, notes: '', targetDate: '',
    currency: '$', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FIEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: FIEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', currentAmount: 0, targetAmount: 0, monthlyContribution: 0, notes: '', targetDate: '' }))
    setShowForm(false)
    toastSuccess('FI milestone tracked 📈')
  }

  const achieved = entries.filter(e => e.status === 'achieved').length
  const totalCurrent = entries.reduce((s, e) => s + e.currentAmount, 0)
  const totalTarget = entries.reduce((s, e) => s + e.targetAmount, 0)
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Financial Freedom
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your path to financial independence milestone by milestone.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Milestones</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{overallPct}%</div>
          <div className="text-xs text-slate-500">Overall Progress</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
      </div>

      {totalTarget > 0 && (
        <div className="game-card p-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Overall FI Progress</span><span>{overallPct}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="h-2 rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New FI Milestone</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as FIArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [FIArea, typeof AREA_CONFIG.savings][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FIStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [FIStatus, typeof STATUS_CONFIG.tracking][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Milestone title *" className="game-input w-full text-sm" autoFocus />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Current</p>
              <input type="number" min={0} value={form.currentAmount}
                onChange={e => setForm(f => ({ ...f, currentAmount: Number(e.target.value) }))} className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Target</p>
              <input type="number" min={0} value={form.targetAmount}
                onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Monthly</p>
              <input type="number" min={0} value={form.monthlyContribution}
                onChange={e => setForm(f => ({ ...f, monthlyContribution: Number(e.target.value) }))} className="game-input w-full text-sm" />
            </div>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / strategy" className="game-input w-full text-sm" />
          <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
            className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save Milestone</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          const pct = e.targetAmount > 0 ? Math.min(100, Math.round((e.currentAmount / e.targetAmount) * 100)) : 0
          return (
            <div key={e.id} className="game-card p-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  {e.targetAmount > 0 && (
                    <>
                      <p className="text-xs text-slate-400 mt-0.5">{e.currency}{e.currentAmount.toLocaleString()} / {e.currency}{e.targetAmount.toLocaleString()}</p>
                      <div className="mt-1 w-full bg-slate-700 rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                      </div>
                    </>
                  )}
                  {e.monthlyContribution > 0 && <p className="text-xs text-green-300/70 mt-0.5">+{e.currency}{e.monthlyContribution}/mo</p>}
                  {e.notes && <p className="text-xs text-slate-500 mt-0.5">{e.notes}</p>}
                </div>
                <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Financial freedom is built one intentional milestone at a time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
