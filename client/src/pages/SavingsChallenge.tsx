import { useEffect, useState } from 'react'
import { PiggyBank, Plus, Trash2, Check, TrendingUp, Target, Trophy, Star, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ChallengeStatus = 'active' | 'completed' | 'abandoned'

interface Deposit {
  id: string
  date: string
  amount: number
  note: string
}

interface SavingsChallenge {
  id: string
  name: string
  goalAmount: number
  targetDate: string
  category: string
  color: string
  status: ChallengeStatus
  deposits: Deposit[]
  createdAt: string
  celebratedAt: string | null
}

const CATEGORIES = [
  { value: 'Emergency Fund', emoji: '🛡️', color: '#ef4444' },
  { value: 'Vacation', emoji: '✈️', color: '#3b82f6' },
  { value: 'Gadget', emoji: '📱', color: '#8b5cf6' },
  { value: 'Investment', emoji: '📈', color: '#22c55e' },
  { value: 'Gift', emoji: '🎁', color: '#ec4899' },
  { value: 'Other', emoji: '🎯', color: '#64748b' },
]

const QUICK_AMOUNTS = [10, 25, 50, 100, 500]

const STORAGE_KEY = 'savings_challenges'

const fmt = (n: number) =>
  `$${n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const daysRemaining = (targetDate: string): number | null => {
  if (!targetDate) return null
  return Math.ceil((new Date(targetDate + 'T12:00:00').getTime() - Date.now()) / 86400000)
}

const totalDeposited = (deposits: Deposit[]): number =>
  deposits.reduce((s, d) => s + d.amount, 0)

const weeklyRate = (challenge: SavingsChallenge): number => {
  const saved = totalDeposited(challenge.deposits)
  if (saved === 0) return 0
  const msPerWeek = 7 * 86400000
  const weeks =
    Math.max(1, (Date.now() - new Date(challenge.createdAt).getTime()) / msPerWeek)
  return saved / weeks
}

const catInfo = (cat: string) =>
  CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1]

export default function SavingsChallenge() {
  const { toastSuccess } = useToast()
  const [challenges, setChallenges] = useState<SavingsChallenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [depositingId, setDepositingId] = useState<string | null>(null)
  const [customAmt, setCustomAmt] = useState('')
  const [depositNote, setDepositNote] = useState('')
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0])
  const [filter, setFilter] = useState<'active' | 'completed' | 'abandoned' | 'all'>('active')

  const [form, setForm] = useState({
    name: '',
    goalAmount: '',
    targetDate: '',
    category: 'Emergency Fund',
    color: '#22c55e',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setChallenges(JSON.parse(saved))
  }, [])

  const persist = (updated: SavingsChallenge[]) => {
    setChallenges(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addChallenge = () => {
    if (!form.name.trim() || !form.goalAmount) return
    const info = catInfo(form.category)
    const c: SavingsChallenge = {
      id: Date.now().toString(),
      name: form.name.trim(),
      goalAmount: parseFloat(form.goalAmount),
      targetDate: form.targetDate,
      category: form.category,
      color: form.color || info.color,
      status: 'active',
      deposits: [],
      createdAt: new Date().toISOString(),
      celebratedAt: null,
    }
    persist([...challenges, c])
    setForm({ name: '', goalAmount: '', targetDate: '', category: 'Emergency Fund', color: '#22c55e' })
    setShowForm(false)
    toastSuccess('Savings challenge created!')
  }

  const logDeposit = (id: string, amount: number) => {
    if (amount <= 0) return
    const today = depositDate || new Date().toISOString().split('T')[0]
    const updated = challenges.map(c => {
      if (c.id !== id) return c
      const deposit: Deposit = {
        id: Date.now().toString(),
        date: today,
        amount,
        note: depositNote.trim(),
      }
      const newDeposits = [deposit, ...c.deposits]
      const saved = totalDeposited(newDeposits)
      const justCompleted = saved >= c.goalAmount && c.status === 'active' && !c.celebratedAt
      if (justCompleted) {
        setTimeout(() => toastSuccess('Challenge Complete!', `You hit your goal of ${fmt(c.goalAmount)}! 🎉`), 50)
      }
      return {
        ...c,
        deposits: newDeposits,
        status: (saved >= c.goalAmount ? 'completed' : c.status) as ChallengeStatus,
        celebratedAt: justCompleted ? new Date().toISOString() : c.celebratedAt,
      }
    })
    persist(updated)
    setDepositingId(null)
    setCustomAmt('')
    setDepositNote('')
    setDepositDate(new Date().toISOString().split('T')[0])
    toastSuccess('Deposit logged!')
  }

  const quickDeposit = (id: string, amount: number) => {
    const c = challenges.find(ch => ch.id === id)
    if (!c) return
    const today = new Date().toISOString().split('T')[0]
    const deposit: Deposit = { id: Date.now().toString(), date: today, amount, note: '' }
    const newDeposits = [deposit, ...c.deposits]
    const saved = totalDeposited(newDeposits)
    const justCompleted = saved >= c.goalAmount && c.status === 'active' && !c.celebratedAt
    if (justCompleted) {
      setTimeout(() => toastSuccess('Challenge Complete!', `You hit your goal of ${fmt(c.goalAmount)}! 🎉`), 50)
    }
    const updated = challenges.map(ch =>
      ch.id !== id ? ch : {
        ...ch,
        deposits: newDeposits,
        status: (saved >= ch.goalAmount ? 'completed' : ch.status) as ChallengeStatus,
        celebratedAt: justCompleted ? new Date().toISOString() : ch.celebratedAt,
      }
    )
    persist(updated)
    toastSuccess(`+${fmt(amount)} deposited!`)
  }

  const abandonChallenge = (id: string) => {
    const updated = challenges.map(c =>
      c.id === id ? { ...c, status: 'abandoned' as ChallengeStatus } : c
    )
    persist(updated)
  }

  const deleteChallenge = (id: string) => {
    persist(challenges.filter(c => c.id !== id))
  }

  const filtered = challenges.filter(c =>
    filter === 'all' ? true : c.status === filter
  )

  const totalSaved = challenges.reduce((s, c) => s + totalDeposited(c.deposits), 0)
  const completedCount = challenges.filter(c => c.status === 'completed').length
  const avgRate = challenges.length > 0
    ? challenges.reduce((s, c) => s + weeklyRate(c), 0) / challenges.length
    : 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <PiggyBank className="w-7 h-7 text-green-400" />
            Savings Challenge
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Gamified savings goals — save it, unlock it</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showForm
              ? 'bg-slate-700 text-slate-300'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Challenge'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <PiggyBank className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{challenges.length}</div>
          <div className="text-xs text-slate-500">Challenges</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-400">{fmt(totalSaved)}</div>
          <div className="text-xs text-slate-500">Total Saved</div>
        </div>
        <div className="game-card p-3 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{completedCount}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3 text-center">
          <Star className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-violet-400">{fmt(avgRate)}/wk</div>
          <div className="text-xs text-slate-500">Avg Rate</div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-green-500/20">
          <h3 className="font-semibold text-slate-300">New Savings Challenge</h3>
          <input
            autoFocus
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Challenge name (e.g. Japan Trip Fund)"
            className="game-input w-full"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Goal Amount ($)</label>
              <input
                type="number"
                value={form.goalAmount}
                onChange={e => setForm(f => ({ ...f, goalAmount: e.target.value }))}
                placeholder="5000"
                className="game-input w-full"
                min="1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Date (optional)</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                className="game-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setForm(f => ({ ...f, category: cat.value, color: cat.color }))}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={
                    form.category === cat.value
                      ? { background: cat.color + '33', color: cat.color, border: `1px solid ${cat.color}` }
                      : { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
                  }
                >
                  {cat.emoji} {cat.value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="h-9 w-20 rounded-lg cursor-pointer bg-slate-700 border border-slate-600"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addChallenge}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Challenge
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {challenges.length > 0 && (
        <div className="flex gap-1.5">
          {(['active', 'completed', 'abandoned', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                  : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Challenges list */}
      <div className="space-y-4">
        {filtered.map(c => {
          const saved = totalDeposited(c.deposits)
          const pct = c.goalAmount > 0 ? Math.min(100, (saved / c.goalAmount) * 100) : 0
          const isComplete = c.status === 'completed'
          const isAbandoned = c.status === 'abandoned'
          const days = daysRemaining(c.targetDate)
          const info = catInfo(c.category)
          const isExpanded = expanded === c.id
          const isDepositing = depositingId === c.id

          return (
            <div
              key={c.id}
              className={`game-card overflow-hidden ${isAbandoned ? 'opacity-60' : ''}`}
              style={{ borderLeft: `3px solid ${c.color}` }}
            >
              {/* Card header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : c.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl flex-shrink-0">{info.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        {isComplete && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Complete!
                          </span>
                        )}
                        {isAbandoned && (
                          <span className="text-xs bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">Abandoned</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {info.value} ·{' '}
                        <span style={{ color: c.color }} className="font-semibold">
                          {fmt(saved)} / {fmt(c.goalAmount)}
                        </span>
                        {days !== null && (
                          <span className={`ml-2 ${days < 0 ? 'text-red-400' : days < 14 ? 'text-yellow-400' : ''}`}>
                            · {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{pct.toFixed(0)}% saved</span>
                    {!isComplete && <span>{fmt(Math.max(0, c.goalAmount - saved))} to go</span>}
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: isComplete
                          ? 'linear-gradient(to right, #22c55e, #86efac)'
                          : c.color,
                      }}
                    />
                  </div>
                </div>

                {/* Quick deposit buttons */}
                {!isComplete && !isAbandoned && (
                  <div className="flex gap-1.5 mt-3 flex-wrap" onClick={e => e.stopPropagation()}>
                    {QUICK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => quickDeposit(c.id, amt)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        +{fmt(amt)}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setDepositingId(isDepositing ? null : c.id)
                        setCustomAmt('')
                        setDepositNote('')
                        setDepositDate(new Date().toISOString().split('T')[0])
                      }}
                      className="px-2 py-1 bg-slate-700 hover:bg-green-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Custom
                    </button>
                  </div>
                )}
              </div>

              {/* Custom deposit row */}
              {isDepositing && !isComplete && !isAbandoned && (
                <div className="px-4 pb-3 border-t border-slate-700 pt-3 space-y-2" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customAmt}
                      onChange={e => setCustomAmt(e.target.value)}
                      placeholder="Amount ($)"
                      className="game-input flex-1 text-sm"
                      min="0"
                      autoFocus
                    />
                    <input
                      type="date"
                      value={depositDate}
                      onChange={e => setDepositDate(e.target.value)}
                      className="game-input text-sm"
                    />
                  </div>
                  <input
                    value={depositNote}
                    onChange={e => setDepositNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="game-input w-full text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => logDeposit(c.id, parseFloat(customAmt) || 0)}
                      className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Log Deposit
                    </button>
                    <button
                      onClick={() => setDepositingId(null)}
                      className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded section: deposit history */}
              {isExpanded && (
                <div className="border-t border-slate-700 px-4 pb-4 pt-3 space-y-3">
                  {/* Total deposited callout */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      {c.deposits.length} deposit{c.deposits.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: c.color }} className="font-semibold">
                      Total: {fmt(saved)}
                    </span>
                  </div>

                  {/* Deposit history */}
                  {c.deposits.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {c.deposits.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-xs bg-slate-900/50 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-green-400 font-semibold">+{fmt(d.amount)}</span>
                            {d.note && <span className="text-slate-500 ml-2">{d.note}</span>}
                          </div>
                          <span className="text-slate-600">{d.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 text-center py-2">No deposits yet — start saving!</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {!isComplete && !isAbandoned && (
                      <button
                        onClick={() => abandonChallenge(c.id)}
                        className="text-xs text-slate-600 hover:text-yellow-400 transition-colors"
                      >
                        Mark as abandoned
                      </button>
                    )}
                    <button
                      onClick={() => deleteChallenge(c.id)}
                      className="text-xs text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {challenges.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2 font-medium">No savings challenges yet.</p>
          <p className="text-xs text-slate-600 mb-5">Turn your financial goals into a game.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Start Your First Challenge
          </button>
        </div>
      )}

      {challenges.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-slate-600">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No {filter} challenges.</p>
        </div>
      )}
    </div>
  )
}
