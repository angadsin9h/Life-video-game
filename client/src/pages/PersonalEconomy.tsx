import { useState, useCallback } from 'react'
import { DollarSign, TrendingUp, Plus, Trash2, Save, Target, PiggyBank, CreditCard, BarChart3, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'personal_economy_log'

interface IncomeStream {
  id: string
  name: string
  type: 'active' | 'passive' | 'side'
  monthlyAmount: number
  notes: string
}

interface Debt {
  id: string
  name: string
  balance: number
  interestRate: number
  monthlyPayment: number
}

interface Investment {
  id: string
  name: string
  type: 'stocks' | 'crypto' | 'real_estate' | 'business' | 'other'
  currentValue: number
  costBasis: number
}

interface EconomyData {
  monthlyExpenses: number
  emergencyFundMonths: number
  fiNumber: number           // Financial Independence number
  incomeStreams: IncomeStream[]
  debts: Debt[]
  investments: Investment[]
  notes: string
  lastUpdated: string
}

function load(): EconomyData {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? {
      monthlyExpenses: 0,
      emergencyFundMonths: 0,
      fiNumber: 0,
      incomeStreams: [],
      debts: [],
      investments: [],
      notes: '',
      lastUpdated: '',
    }
  } catch {
    return { monthlyExpenses: 0, emergencyFundMonths: 0, fiNumber: 0, incomeStreams: [], debts: [], investments: [], notes: '', lastUpdated: '' }
  }
}

const TYPE_COLORS = { active: 'text-blue-400', passive: 'text-green-400', side: 'text-yellow-400' }
const INV_EMOJIS = { stocks: '📈', crypto: '🪙', real_estate: '🏠', business: '🏢', other: '💼' }

export default function PersonalEconomy() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<EconomyData>(load)
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'debts' | 'investments'>('overview')
  const [newIncome, setNewIncome] = useState<Omit<IncomeStream, 'id'>>({ name: '', type: 'active', monthlyAmount: 0, notes: '' })
  const [newDebt, setNewDebt] = useState<Omit<Debt, 'id'>>({ name: '', balance: 0, interestRate: 0, monthlyPayment: 0 })
  const [newInv, setNewInv] = useState<Omit<Investment, 'id'>>({ name: '', type: 'stocks', currentValue: 0, costBasis: 0 })

  const persist = useCallback((d: EconomyData) => {
    const updated = { ...d, lastUpdated: new Date().toISOString().slice(0, 10) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setData(updated)
  }, [])

  function saveOverview() { persist(data); toastSuccess('Economy data saved!') }

  const totalMonthlyIncome = data.incomeStreams.reduce((s, i) => s + i.monthlyAmount, 0)
  const totalDebt = data.debts.reduce((s, d) => s + d.balance, 0)
  const totalInvestments = data.investments.reduce((s, i) => s + i.currentValue, 0)
  const totalGain = data.investments.reduce((s, i) => s + (i.currentValue - i.costBasis), 0)
  const netWorth = totalInvestments - totalDebt
  const monthlySurplus = totalMonthlyIncome - data.monthlyExpenses
  const savingsRate = totalMonthlyIncome > 0 ? Math.round((monthlySurplus / totalMonthlyIncome) * 100) : 0
  const fiProgress = data.fiNumber > 0 ? Math.min(100, Math.round((netWorth / data.fiNumber) * 100)) : 0
  const monthsToFI = monthlySurplus > 0 && data.fiNumber > 0
    ? Math.round((data.fiNumber - netWorth) / monthlySurplus)
    : null

  function addIncome() {
    if (!newIncome.name) return
    persist({ ...data, incomeStreams: [...data.incomeStreams, { ...newIncome, id: Date.now().toString() }] })
    setNewIncome({ name: '', type: 'active', monthlyAmount: 0, notes: '' })
    toastSuccess('Income stream added!')
  }

  function addDebt() {
    if (!newDebt.name) return
    persist({ ...data, debts: [...data.debts, { ...newDebt, id: Date.now().toString() }] })
    setNewDebt({ name: '', balance: 0, interestRate: 0, monthlyPayment: 0 })
    toastSuccess('Debt added!')
  }

  function addInvestment() {
    if (!newInv.name) return
    persist({ ...data, investments: [...data.investments, { ...newInv, id: Date.now().toString() }] })
    setNewInv({ name: '', type: 'stocks', currentValue: 0, costBasis: 0 })
    toastSuccess('Investment added!')
  }

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Personal Economy</h1>
        <p className="text-slate-400 text-sm mt-1">Your financial dashboard — income, debts, investments & FI progress</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['overview', 'income', 'debts', 'investments'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Net Worth', value: fmt(netWorth), color: netWorth >= 0 ? 'text-green-400' : 'text-red-400', icon: <Star className="w-5 h-5 text-yellow-400" /> },
              { label: 'Monthly Surplus', value: fmt(monthlySurplus), color: monthlySurplus >= 0 ? 'text-green-400' : 'text-red-400', icon: <TrendingUp className="w-5 h-5 text-green-400" /> },
              { label: 'Savings Rate', value: `${savingsRate}%`, color: savingsRate >= 20 ? 'text-green-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400', icon: <PiggyBank className="w-5 h-5 text-cyan-400" /> },
              { label: 'FI Progress', value: `${fiProgress}%`, color: 'text-violet-400', icon: <Target className="w-5 h-5 text-violet-400" /> },
            ].map(m => (
              <div key={m.label} className="game-card p-4 text-center">
                <div className="flex justify-center mb-1">{m.icon}</div>
                <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* FI Progress bar */}
          {data.fiNumber > 0 && (
            <div className="game-card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium">Financial Independence Journey</span>
                <span className="text-violet-400">{fiProgress}%</span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${fiProgress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{fmt(netWorth)} saved</span>
                <span>FI number: {fmt(data.fiNumber)}</span>
              </div>
              {monthsToFI !== null && monthsToFI > 0 && (
                <div className="text-center text-xs text-slate-400 mt-2">
                  At current rate: <span className="text-white font-medium">
                    {monthsToFI > 12 ? `${Math.floor(monthsToFI / 12)}y ${monthsToFI % 12}m` : `${monthsToFI} months`}
                  </span> to FI
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white">Monthly Budget</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Monthly Expenses ($)</label>
                <input type="number" className="game-input w-full" value={data.monthlyExpenses || ''}
                  onChange={e => setData(d => ({ ...d, monthlyExpenses: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">FI Number ($)</label>
                <input type="number" className="game-input w-full" value={data.fiNumber || ''}
                  onChange={e => setData(d => ({ ...d, fiNumber: Number(e.target.value) }))} />
              </div>
            </div>
            <textarea className="game-input w-full text-sm" rows={2} placeholder="Financial notes / strategy..."
              value={data.notes} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} />
            <button onClick={saveOverview}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white">Add Income Stream</h3>
            <div className="grid grid-cols-2 gap-3">
              <input className="game-input w-full" placeholder="Name" value={newIncome.name}
                onChange={e => setNewIncome(i => ({ ...i, name: e.target.value }))} />
              <select className="game-input w-full" value={newIncome.type}
                onChange={e => setNewIncome(i => ({ ...i, type: e.target.value as IncomeStream['type'] }))}>
                <option value="active">Active</option>
                <option value="passive">Passive</option>
                <option value="side">Side hustle</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="game-input w-full" placeholder="Monthly amount ($)" value={newIncome.monthlyAmount || ''}
                onChange={e => setNewIncome(i => ({ ...i, monthlyAmount: Number(e.target.value) }))} />
              <input className="game-input w-full" placeholder="Notes" value={newIncome.notes}
                onChange={e => setNewIncome(i => ({ ...i, notes: e.target.value }))} />
            </div>
            <button onClick={addIncome}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="game-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-white">Income Streams</h3>
              <span className="text-green-400 font-bold">{fmt(totalMonthlyIncome)}/mo</span>
            </div>
            <div className="space-y-2">
              {data.incomeStreams.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                  <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.notes}</div>
                  </div>
                  <span className={`text-xs font-medium ${TYPE_COLORS[s.type]}`}>{s.type}</span>
                  <span className="text-sm font-bold text-green-400">{fmt(s.monthlyAmount)}</span>
                  <button onClick={() => persist({ ...data, incomeStreams: data.incomeStreams.filter(i => i.id !== s.id) })}
                    className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {data.incomeStreams.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No income streams added yet.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="space-y-4">
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white">Add Debt</h3>
            <div className="grid grid-cols-2 gap-3">
              <input className="game-input w-full" placeholder="Debt name" value={newDebt.name}
                onChange={e => setNewDebt(d => ({ ...d, name: e.target.value }))} />
              <input type="number" className="game-input w-full" placeholder="Balance ($)" value={newDebt.balance || ''}
                onChange={e => setNewDebt(d => ({ ...d, balance: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="game-input w-full" placeholder="Interest rate (%)" value={newDebt.interestRate || ''}
                onChange={e => setNewDebt(d => ({ ...d, interestRate: Number(e.target.value) }))} />
              <input type="number" className="game-input w-full" placeholder="Monthly payment ($)" value={newDebt.monthlyPayment || ''}
                onChange={e => setNewDebt(d => ({ ...d, monthlyPayment: Number(e.target.value) }))} />
            </div>
            <button onClick={addDebt}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Debt
            </button>
          </div>

          <div className="game-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-white">Debts</h3>
              <span className="text-red-400 font-bold">{fmt(totalDebt)} total</span>
            </div>
            <div className="space-y-2">
              {[...data.debts].sort((a, b) => b.interestRate - a.interestRate).map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                  <CreditCard className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.interestRate}% APR · {fmt(d.monthlyPayment)}/mo payment</div>
                  </div>
                  <span className="text-sm font-bold text-red-400">{fmt(d.balance)}</span>
                  <button onClick={() => persist({ ...data, debts: data.debts.filter(x => x.id !== d.id) })}
                    className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {data.debts.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No debts — you're free! 🎉</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="space-y-4">
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white">Add Investment</h3>
            <div className="grid grid-cols-2 gap-3">
              <input className="game-input w-full" placeholder="Name" value={newInv.name}
                onChange={e => setNewInv(i => ({ ...i, name: e.target.value }))} />
              <select className="game-input w-full" value={newInv.type}
                onChange={e => setNewInv(i => ({ ...i, type: e.target.value as Investment['type'] }))}>
                <option value="stocks">Stocks/ETFs</option>
                <option value="crypto">Crypto</option>
                <option value="real_estate">Real Estate</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="game-input w-full" placeholder="Current value ($)" value={newInv.currentValue || ''}
                onChange={e => setNewInv(i => ({ ...i, currentValue: Number(e.target.value) }))} />
              <input type="number" className="game-input w-full" placeholder="Cost basis ($)" value={newInv.costBasis || ''}
                onChange={e => setNewInv(i => ({ ...i, costBasis: Number(e.target.value) }))} />
            </div>
            <button onClick={addInvestment}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Investment
            </button>
          </div>

          <div className="game-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-white">Portfolio</h3>
              <div className="text-right">
                <div className="text-green-400 font-bold">{fmt(totalInvestments)}</div>
                <div className={`text-xs ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalGain >= 0 ? '+' : ''}{fmt(totalGain)} total gain
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {data.investments.map(inv => {
                const gain = inv.currentValue - inv.costBasis
                const gainPct = inv.costBasis > 0 ? Math.round((gain / inv.costBasis) * 100) : 0
                return (
                  <div key={inv.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                    <span className="text-xl">{INV_EMOJIS[inv.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{inv.name}</div>
                      <div className={`text-xs ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gain >= 0 ? '+' : ''}{gainPct}% · {gain >= 0 ? '+' : ''}{fmt(gain)}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-400">{fmt(inv.currentValue)}</span>
                    <button onClick={() => persist({ ...data, investments: data.investments.filter(x => x.id !== inv.id) })}
                      className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )
              })}
              {data.investments.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No investments tracked yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
