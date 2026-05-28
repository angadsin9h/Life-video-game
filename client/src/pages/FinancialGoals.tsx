import { useEffect, useState } from 'react'
import { DollarSign, Plus, Trash2, TrendingUp, Target, PiggyBank } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  category: string
  color: string
  notes: string
  contributions: { date: string; amount: number; note: string }[]
}

const CATEGORIES = [
  { value: 'emergency', label: 'Emergency Fund', emoji: '🛡️', color: '#ef4444' },
  { value: 'vacation', label: 'Vacation', emoji: '✈️', color: '#3b82f6' },
  { value: 'investment', label: 'Investment', emoji: '📈', color: '#22c55e' },
  { value: 'purchase', label: 'Major Purchase', emoji: '🏠', color: '#f97316' },
  { value: 'education', label: 'Education', emoji: '📚', color: '#8b5cf6' },
  { value: 'retirement', label: 'Retirement', emoji: '🌴', color: '#14b8a6' },
  { value: 'debt', label: 'Debt Payoff', emoji: '💳', color: '#ec4899' },
  { value: 'other', label: 'Other', emoji: '🎯', color: '#64748b' },
]

const STORAGE_KEY = 'financial_goals'

export default function FinancialGoals() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'emergency', notes: '' })
  const [contributing, setContributing] = useState<string | null>(null)
  const [contribution, setContribution] = useState({ amount: '', note: '' })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setGoals(JSON.parse(saved))
  }, [])

  const save = (updated: FinancialGoal[]) => {
    setGoals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addGoal = () => {
    if (!form.name.trim() || !form.targetAmount) return
    const cat = CATEGORIES.find(c => c.value === form.category)
    const g: FinancialGoal = {
      id: Date.now().toString(),
      name: form.name,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      deadline: form.deadline,
      category: form.category,
      color: cat?.color || '#64748b',
      notes: form.notes,
      contributions: [],
    }
    save([...goals, g])
    setForm({ name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'emergency', notes: '' })
    setShowForm(false)
    toastSuccess('Financial goal added!')
  }

  const addContribution = (id: string) => {
    const amt = parseFloat(contribution.amount)
    if (!amt || amt <= 0) return
    const updated = goals.map(g => {
      if (g.id !== id) return g
      return {
        ...g,
        currentAmount: g.currentAmount + amt,
        contributions: [{ date: new Date().toISOString().split('T')[0], amount: amt, note: contribution.note }, ...g.contributions],
      }
    })
    save(updated)
    setContributing(null)
    setContribution({ amount: '', note: '' })
    toastSuccess('Contribution added!')
  }

  const deleteGoal = (id: string) => {
    save(goals.filter(g => g.id !== id))
  }

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const completed = goals.filter(g => g.currentAmount >= g.targetAmount).length

  const daysUntil = (d: string) => d ? Math.ceil((new Date(d + 'T12:00:00').getTime() - Date.now()) / 86400000) : null

  const formatCurrency = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <PiggyBank className="w-7 h-7 text-green-400" />
            Financial Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track savings goals and milestones</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{formatCurrency(totalSaved)}</div>
          <div className="text-xs text-slate-500">Total Saved</div>
        </div>
        <div className="game-card p-3 text-center">
          <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-400">{formatCurrency(totalTarget)}</div>
          <div className="text-xs text-slate-500">Total Target</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-violet-400">{completed}/{goals.length}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
      </div>

      {/* Overall progress */}
      {totalTarget > 0 && (
        <div className="game-card p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Overall Progress</span>
            <span className="text-white font-semibold">{Math.round((totalSaved / totalTarget) * 100)}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalSaved / totalTarget) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-green-500/20">
          <h3 className="font-semibold text-slate-300">New Financial Goal</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Goal name (e.g. Emergency Fund)" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Amount ($)</label>
              <input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                placeholder="10000" className="game-input w-full" min="0" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Already Saved ($)</label>
              <input type="number" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
                placeholder="0" className="game-input w-full" min="0" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.category === c.value ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Date (optional)</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Why is this important?" className="game-input w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addGoal} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Add Goal
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-4">
        {goals.map(g => {
          const cat = CATEGORIES.find(c => c.value === g.category)
          const pct = Math.min(100, g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0)
          const done = g.currentAmount >= g.targetAmount
          const days = daysUntil(g.deadline)
          const remaining = g.targetAmount - g.currentAmount

          return (
            <div key={g.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${g.color}` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat?.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      {g.name}
                      {done && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Complete!</span>}
                    </h3>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                      {days !== null && <span className={`ml-2 ${days < 0 ? 'text-red-400' : days < 30 ? 'text-yellow-400' : ''}`}>
                        · {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteGoal(g.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{pct.toFixed(0)}% saved</span>
                  {!done && <span>{formatCurrency(remaining)} to go</span>}
                </div>
                <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
                </div>
              </div>

              {g.notes && <p className="text-xs text-slate-500 italic">{g.notes}</p>}

              {/* Recent contributions */}
              {g.contributions.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {g.contributions.slice(0, 3).map((c, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      +{formatCurrency(c.amount)} on {c.date.slice(5)}
                    </span>
                  ))}
                  {g.contributions.length > 3 && <span className="text-xs text-slate-600">+{g.contributions.length - 3} more</span>}
                </div>
              )}

              {!done && (
                contributing === g.id ? (
                  <div className="flex gap-2 items-center">
                    <input type="number" value={contribution.amount} onChange={e => setContribution(c => ({ ...c, amount: e.target.value }))}
                      placeholder="Amount ($)" className="game-input flex-1 text-xs" min="0" />
                    <input value={contribution.note} onChange={e => setContribution(c => ({ ...c, note: e.target.value }))}
                      placeholder="Note" className="game-input flex-1 text-xs" />
                    <button onClick={() => addContribution(g.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold">Add</button>
                    <button onClick={() => setContributing(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setContributing(g.id)}
                    className="w-full py-1.5 border border-dashed border-slate-700 hover:border-green-500/40 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-medium transition-all">
                    + Add Contribution
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      {goals.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No financial goals yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Set Your First Goal
          </button>
        </div>
      )}
    </div>
  )
}
