import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RatioCategory = 'savings' | 'debt' | 'investment' | 'expense' | 'income' | 'emergency' | 'insurance' | 'other'

interface FinanceRatio {
  id: string
  category: RatioCategory
  name: string
  description: string
  formula: string
  currentValue: number
  targetValue: number
  unit: string
  isHigherBetter: boolean
  history: Array<{ date: string; value: number }>
  notes: string
  createdAt: string
}

const CAT_CONFIG: Record<RatioCategory, { label: string; emoji: string; color: string }> = {
  savings:    { label: 'Savings',    emoji: '💰', color: '#22c55e' },
  debt:       { label: 'Debt',       emoji: '📉', color: '#ef4444' },
  investment: { label: 'Investment', emoji: '📈', color: '#3b82f6' },
  expense:    { label: 'Expense',    emoji: '💸', color: '#f97316' },
  income:     { label: 'Income',     emoji: '💵', color: '#f59e0b' },
  emergency:  { label: 'Emergency',  emoji: '🛡️', color: '#6366f1' },
  insurance:  { label: 'Insurance',  emoji: '🏥', color: '#a855f7' },
  other:      { label: 'Other',      emoji: '📊', color: '#94a3b8' },
}

const PRESETS = [
  { name: 'Savings Rate', description: 'Savings ÷ Income', formula: 'Savings / Gross Income', category: 'savings' as RatioCategory, unit: '%', targetValue: 20, isHigherBetter: true },
  { name: 'Emergency Fund Months', description: 'Months of expenses covered', formula: 'Emergency Fund / Monthly Expenses', category: 'emergency' as RatioCategory, unit: 'months', targetValue: 6, isHigherBetter: true },
  { name: 'Debt-to-Income', description: 'Monthly debt ÷ Income', formula: 'Monthly Debt Payments / Monthly Income', category: 'debt' as RatioCategory, unit: '%', targetValue: 36, isHigherBetter: false },
  { name: 'Investment Rate', description: 'Invested ÷ Income', formula: 'Investments / Gross Income', category: 'investment' as RatioCategory, unit: '%', targetValue: 15, isHigherBetter: true },
  { name: 'Housing Cost Ratio', description: 'Housing ÷ Income', formula: 'Housing Costs / Gross Income', category: 'expense' as RatioCategory, unit: '%', targetValue: 28, isHigherBetter: false },
]

const STORAGE_KEY = 'finance_ratios'

export default function PersonalFinanceRatios() {
  const { toastSuccess } = useToast()
  const [ratios, setRatios] = useState<FinanceRatio[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<FinanceRatio, 'id' | 'createdAt' | 'history'>>({
    category: 'savings', name: '', description: '', formula: '', currentValue: 0,
    targetValue: 20, unit: '%', isHigherBetter: true, notes: '',
  })

  useEffect(() => {
    try { setRatios(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FinanceRatio[]) => { setRatios(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const r: FinanceRatio = {
      id: Date.now().toString(), ...form,
      history: [{ date: new Date().toISOString().split('T')[0], value: form.currentValue }],
      createdAt: new Date().toISOString(),
    }
    save([r, ...ratios])
    setForm(f => ({ ...f, name: '', description: '', formula: '', notes: '', currentValue: 0 }))
    setShowForm(false)
    toastSuccess('Finance ratio added 📊')
  }

  const updateValue = (id: string, value: number) => {
    save(ratios.map(r => r.id === id ? {
      ...r, currentValue: value,
      history: [...r.history, { date: new Date().toISOString().split('T')[0], value }],
    } : r))
    toastSuccess('Value updated!')
  }

  const loadPreset = (p: typeof PRESETS[0]) => {
    setForm(f => ({ ...f, name: p.name, description: p.description, formula: p.formula, category: p.category, unit: p.unit, targetValue: p.targetValue, isHigherBetter: p.isHigherBetter }))
    setShowForm(true)
  }

  const filtered = ratios.filter(r => filterCat === 'all' || r.category === filterCat)
  const onTrack = ratios.filter(r => r.isHigherBetter ? r.currentValue >= r.targetValue : r.currentValue <= r.targetValue).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Finance Ratios
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track key personal finance metrics and ratios.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{ratios.length}</div>
          <div className="text-xs text-slate-500">Ratios</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{onTrack}</div>
          <div className="text-xs text-slate-500">On Target</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{ratios.length - onTrack}</div>
          <div className="text-xs text-slate-500">Off Target</div>
        </div>
      </div>

      {!showForm && (
        <div className="game-card p-3">
          <p className="text-xs text-slate-500 mb-2">Quick add from preset:</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button key={p.name} onClick={() => loadPreset(p)}
                className="px-2 py-1 bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs">
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [RatioCategory, typeof CAT_CONFIG.savings][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Finance Ratio</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as RatioCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [RatioCategory, typeof CAT_CONFIG.savings][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ratio name *" className="game-input w-full" autoFocus />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description" className="game-input w-full text-sm" />
          <input value={form.formula} onChange={e => setForm(f => ({ ...f, formula: e.target.value }))}
            placeholder="Formula (e.g., Savings / Income)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current Value</p>
              <input type="number" value={form.currentValue} step={0.1}
                onChange={e => setForm(f => ({ ...f, currentValue: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target</p>
              <input type="number" value={form.targetValue} step={0.1}
                onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="w-16">
              <p className="text-xs text-slate-500 mb-1">Unit</p>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isHigherBetter} onChange={e => setForm(f => ({ ...f, isHigherBetter: e.target.checked }))} />
            Higher value is better (unchecked = lower is better)
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const c = CAT_CONFIG[r.category]
          const isExp = expanded === r.id
          const onTrackR = r.isHigherBetter ? r.currentValue >= r.targetValue : r.currentValue <= r.targetValue
          const pct = r.isHigherBetter
            ? Math.min(100, Math.round(r.currentValue / r.targetValue * 100))
            : Math.min(100, Math.round((1 - (r.currentValue - r.targetValue) / r.targetValue) * 100))
          return (
            <div key={r.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${onTrackR ? '#22c55e' : '#ef4444'}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : r.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white text-sm">{r.name}</span>
                    <span className={`text-sm font-bold ${onTrackR ? 'text-green-400' : 'text-red-400'}`}>
                      {r.currentValue}{r.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%`, background: onTrackR ? '#22c55e' : '#f59e0b' }} />
                    </div>
                    <span className="text-xs text-slate-500">target: {r.targetValue}{r.unit}</span>
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {r.description && <p className="text-xs text-slate-300">{r.description}</p>}
                  {r.formula && <p className="text-xs text-blue-300">📐 {r.formula}</p>}
                  {r.history.length > 1 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">History:</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {r.history.slice(-5).map((h, i) => (
                          <div key={i} className="text-center">
                            <div className="text-xs font-bold" style={{ color: c.color }}>{h.value}{r.unit}</div>
                            <div className="text-xs text-slate-600">{h.date.slice(5)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Update:</span>
                    <input type="number" defaultValue={r.currentValue} step={0.1} id={`val-${r.id}`}
                      className="game-input w-24 text-sm" />
                    <button onClick={() => {
                      const input = document.getElementById(`val-${r.id}`) as HTMLInputElement
                      if (input) updateValue(r.id, Number(input.value))
                    }} className="px-2 py-1 bg-green-700/30 text-green-400 rounded text-xs">Save</button>
                  </div>
                  <button onClick={() => save(ratios.filter(x => x.id !== r.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">What gets measured gets managed. Track your financial health.</p>
          </div>
        )}
      </div>
    </div>
  )
}
