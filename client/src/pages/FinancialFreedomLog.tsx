import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Target, Plus, Trash2, Save, Star, BarChart3, ChevronDown, ChevronUp, RefreshCw, Calendar, CheckCircle, Flag, Lightbulb } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FreedomMilestone {
  id: string
  title: string
  targetAmount: number
  achievedDate: string
  notes: string
}

interface MonthlySnapshot {
  id: string
  month: string
  netWorth: number
  liquidSavings: number
  investments: number
  totalDebt: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  fiNumber: number
  fiProgress: number
  notes: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'financial_freedom_log'

const currentMonth = () => new Date().toISOString().slice(0, 7)

const fmt = (n: number) => {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toLocaleString()}`
}

function freedomScore(savingsRate: number, fiProgress: number, debtRatio: number): number {
  const srScore = Math.min(40, (savingsRate / 50) * 40)
  const fiScore = Math.min(40, (fiProgress / 100) * 40)
  const debtScore = Math.max(0, 20 - debtRatio * 20)
  return Math.round(Math.max(1, Math.min(100, srScore + fiScore + debtScore)))
}

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Freedom Achieved', color: '#f59e0b' }
  if (score >= 70) return { label: 'FI Pioneer', color: '#a855f7' }
  if (score >= 55) return { label: 'FI Seeker', color: '#3b82f6' }
  if (score >= 40) return { label: 'Accumulator', color: '#22c55e' }
  if (score >= 25) return { label: 'Saver', color: '#84cc16' }
  return { label: 'Financial Beginner', color: '#94a3b8' }
}

interface StorageShape {
  snapshots: MonthlySnapshot[]
  milestones: FreedomMilestone[]
}

const EMPTY: StorageShape = { snapshots: [], milestones: [] }

// ─── Component ───────────────────────────────────────────────────────────────

export default function FinancialFreedomLog() {
  const { toastSuccess } = useToast()

  const [data, setData] = useState<StorageShape>(EMPTY)
  const [activeTab, setActiveTab] = useState<'log' | 'progress' | 'charts' | 'milestones'>('log')

  // form state
  const [form, setForm] = useState({
    month: currentMonth(),
    netWorth: 0,
    liquidSavings: 0,
    investments: 0,
    totalDebt: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    fiNumber: 0,
    notes: '',
  })

  // milestone form
  const [milestoneForm, setMilestoneForm] = useState({ title: '', targetAmount: 0 })
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StorageShape>
        setData({ snapshots: parsed.snapshots ?? [], milestones: parsed.milestones ?? [] })
      }
    } catch { /* ignore */ }
  }, [])

  const persist = (updated: StorageShape) => {
    setData(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // ─── Computed form values ─────────────────────────────────────────────────

  const liveSavingsRate = form.monthlyIncome > 0
    ? Math.round(((form.monthlyIncome - form.monthlyExpenses) / form.monthlyIncome) * 100 * 10) / 10
    : 0

  const liveAnnualExpenses = form.monthlyExpenses * 12
  const liveFiNumber = form.fiNumber > 0 ? form.fiNumber : liveAnnualExpenses * 25
  const liveFiProgress = liveFiNumber > 0 ? Math.round((form.netWorth / liveFiNumber) * 100 * 10) / 10 : 0

  // set FI number auto when expenses change
  const handleExpensesChange = (val: number) => {
    setForm(f => ({ ...f, monthlyExpenses: val, fiNumber: val * 12 * 25 }))
  }

  // ─── Derived from snapshots ───────────────────────────────────────────────

  const sorted = useMemo(
    () => [...data.snapshots].sort((a, b) => a.month.localeCompare(b.month)),
    [data.snapshots]
  )

  const latest = sorted[sorted.length - 1]

  const yearsToFI = useMemo(() => {
    if (!latest) return null
    const annualSurplus = (latest.monthlyIncome - latest.monthlyExpenses) * 12
    const remaining = latest.fiNumber - latest.netWorth
    if (annualSurplus <= 0 || remaining <= 0) return null
    return Math.round((remaining / annualSurplus) * 10) / 10
  }, [latest])

  const latestDebtRatio = latest && latest.netWorth > 0
    ? Math.min(1, latest.totalDebt / Math.max(1, latest.netWorth + latest.totalDebt))
    : 0

  const latestScore = latest
    ? freedomScore(latest.savingsRate, latest.fiProgress, latestDebtRatio)
    : 0

  const { label: scoreLbl, color: scoreColor } = scoreLabel(latestScore)

  // ─── Actions ─────────────────────────────────────────────────────────────

  const saveSnapshot = () => {
    if (!form.month) return
    const sr = form.monthlyIncome > 0
      ? Math.round(((form.monthlyIncome - form.monthlyExpenses) / form.monthlyIncome) * 100 * 10) / 10
      : 0
    const fi = form.fiNumber > 0 ? form.fiNumber : form.monthlyExpenses * 12 * 25
    const fip = fi > 0 ? Math.round((form.netWorth / fi) * 100 * 10) / 10 : 0

    const snap: MonthlySnapshot = {
      id: Date.now().toString(),
      month: form.month,
      netWorth: form.netWorth,
      liquidSavings: form.liquidSavings,
      investments: form.investments,
      totalDebt: form.totalDebt,
      monthlyIncome: form.monthlyIncome,
      monthlyExpenses: form.monthlyExpenses,
      savingsRate: sr,
      fiNumber: fi,
      fiProgress: fip,
      notes: form.notes,
    }

    // replace if same month, else prepend
    const existing = data.snapshots.findIndex(s => s.month === form.month)
    const updated = existing >= 0
      ? data.snapshots.map((s, i) => (i === existing ? snap : s))
      : [snap, ...data.snapshots]

    persist({ ...data, snapshots: updated })
    setForm(f => ({ ...f, notes: '' }))
    toastSuccess('Snapshot saved! 💰')
  }

  const deleteSnapshot = (id: string) => {
    persist({ ...data, snapshots: data.snapshots.filter(s => s.id !== id) })
  }

  const addMilestone = () => {
    if (!milestoneForm.title.trim() || milestoneForm.targetAmount <= 0) return
    const m: FreedomMilestone = {
      id: Date.now().toString(),
      title: milestoneForm.title.trim(),
      targetAmount: milestoneForm.targetAmount,
      achievedDate: '',
      notes: '',
    }
    persist({ ...data, milestones: [m, ...data.milestones] })
    setMilestoneForm({ title: '', targetAmount: 0 })
    setShowMilestoneForm(false)
  }

  const markAchieved = (id: string) => {
    persist({
      ...data,
      milestones: data.milestones.map(m =>
        m.id === id ? { ...m, achievedDate: new Date().toISOString().split('T')[0] } : m
      ),
    })
    toastSuccess('Milestone achieved! 🏆')
  }

  const deleteMilestone = (id: string) => {
    persist({ ...data, milestones: data.milestones.filter(m => m.id !== id) })
  }

  // ─── SVG charts ──────────────────────────────────────────────────────────

  const chartSnapshots = sorted.slice(-12)

  const NetWorthChart = () => {
    if (chartSnapshots.length < 2) return null
    const vals = chartSnapshots.map(s => s.netWorth)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1
    const W = 300
    const H = 100
    const pad = 8
    const points = chartSnapshots.map((s, i) => {
      const x = pad + (i / (chartSnapshots.length - 1)) * (W - pad * 2)
      const y = H - pad - ((s.netWorth - min) / range) * (H - pad * 2)
      return `${x},${y}`
    })
    const polyline = points.join(' ')
    const lastP = points[points.length - 1]
    const [lx, ly] = lastP.split(',').map(Number)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '100px' }}>
        <polyline
          points={polyline}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {chartSnapshots.map((s, i) => {
          const [px, py] = points[i].split(',').map(Number)
          return <circle key={s.id} cx={px} cy={py} r="3" fill="#22c55e" />
        })}
        <circle cx={lx} cy={ly} r="5" fill="#22c55e" opacity="0.4" />
        <text x={W - pad} y={ly - 6} fill="#22c55e" fontSize="9" textAnchor="end">{fmt(chartSnapshots[chartSnapshots.length - 1].netWorth)}</text>
      </svg>
    )
  }

  const SavingsRateChart = () => {
    if (chartSnapshots.length === 0) return null
    const max = Math.max(...chartSnapshots.map(s => Math.abs(s.savingsRate)), 1)
    const W = 300
    const H = 80
    const barW = Math.max(4, (W - 16) / chartSnapshots.length - 2)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '80px' }}>
        {chartSnapshots.map((s, i) => {
          const barH = Math.max(3, (Math.abs(s.savingsRate) / max) * (H - 16))
          const x = 8 + i * ((W - 16) / chartSnapshots.length)
          const y = H - 8 - barH
          const color = s.savingsRate >= 0 ? '#22c55e' : '#ef4444'
          return (
            <g key={s.id}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx="2" />
              <text x={x + barW / 2} y={H - 1} fill="#64748b" fontSize="7" textAnchor="middle">
                {s.month.slice(5)}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Financial Freedom Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your journey to financial independence — the big picture.</p>
        </div>
      </div>

      {/* Key metric pills */}
      {latest && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="game-card p-3">
            <div className="text-lg font-bold text-green-400">{latest.savingsRate.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">Savings Rate</div>
          </div>
          <div className="game-card p-3">
            <div className="text-lg font-bold text-blue-400">{latest.fiProgress.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">FI Progress</div>
          </div>
          <div className="game-card p-3">
            <div className="text-lg font-bold" style={{ color: scoreColor }}>{latestScore}</div>
            <div className="text-xs text-slate-500">Freedom Score</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
        {([
          { key: 'log', label: 'Log Month', icon: Calendar },
          { key: 'progress', label: 'Progress', icon: Target },
          { key: 'charts', label: 'Charts', icon: BarChart3 },
          { key: 'milestones', label: 'Milestones', icon: Flag },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === key ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Log Month */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          <div className="game-card p-4 space-y-3 border border-green-500/20">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-green-400" />
              Log This Month
            </h3>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Month</label>
              <input
                type="month"
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                className="game-input w-full text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Net Worth ($)</label>
                <input type="number" value={form.netWorth || ''} onChange={e => setForm(f => ({ ...f, netWorth: Number(e.target.value) }))}
                  placeholder="0" className="game-input w-full text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Liquid Savings ($)</label>
                <input type="number" value={form.liquidSavings || ''} onChange={e => setForm(f => ({ ...f, liquidSavings: Number(e.target.value) }))}
                  placeholder="0" className="game-input w-full text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Investments ($)</label>
                <input type="number" value={form.investments || ''} onChange={e => setForm(f => ({ ...f, investments: Number(e.target.value) }))}
                  placeholder="0" className="game-input w-full text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Total Debt ($)</label>
                <input type="number" value={form.totalDebt || ''} onChange={e => setForm(f => ({ ...f, totalDebt: Number(e.target.value) }))}
                  placeholder="0" className="game-input w-full text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Monthly Income ($)</label>
                <input type="number" value={form.monthlyIncome || ''} onChange={e => setForm(f => ({ ...f, monthlyIncome: Number(e.target.value) }))}
                  placeholder="0" className="game-input w-full text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Monthly Expenses ($)</label>
                <input type="number" value={form.monthlyExpenses || ''} onChange={e => handleExpensesChange(Number(e.target.value))}
                  placeholder="0" className="game-input w-full text-sm" />
              </div>
            </div>

            {/* Live computed */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/60 rounded-xl text-center text-xs">
              <div>
                <div className={`font-bold text-base ${liveSavingsRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>{liveSavingsRate.toFixed(1)}%</div>
                <div className="text-slate-500">Savings Rate</div>
              </div>
              <div>
                <div className="font-bold text-base text-blue-400">{fmt(liveFiNumber)}</div>
                <div className="text-slate-500">FI Number (25×)</div>
              </div>
              <div>
                <div className={`font-bold text-base ${liveFiProgress >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>{liveFiProgress.toFixed(1)}%</div>
                <div className="text-slate-500">FI Progress</div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">FI Number (editable, default 25× annual expenses)</label>
              <input type="number" value={form.fiNumber || ''} onChange={e => setForm(f => ({ ...f, fiNumber: Number(e.target.value) }))}
                placeholder={String(liveAnnualExpenses * 25 || 0)} className="game-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any observations this month..." className="game-input w-full text-sm" />
            </div>
            <button onClick={saveSnapshot}
              className="w-full py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              Save Snapshot
            </button>
          </div>

          {/* Recent snapshots */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Snapshots</h3>
            {sorted.slice().reverse().slice(0, 6).map(snap => (
              <div key={snap.id} className="game-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{snap.month}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{snap.savingsRate.toFixed(1)}% saved</span>
                    <span className="text-xs text-slate-500">{snap.fiProgress.toFixed(1)}% FI</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">NW: {fmt(snap.netWorth)} · Debt: {fmt(snap.totalDebt)}</div>
                </div>
                <button onClick={() => deleteSnapshot(snap.id)} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {data.snapshots.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Log your first monthly snapshot above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Progress */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {latest ? (
            <>
              {/* Big FI progress */}
              <div className="game-card p-6 text-center space-y-4">
                <div className="text-slate-400 text-sm">Financial Independence Progress</div>
                <div className="text-6xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {latest.fiProgress.toFixed(1)}%
                </div>
                <div className="w-full bg-slate-700 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-5 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, latest.fiProgress)}%`,
                      background: 'linear-gradient(to right, #22c55e, #84cc16)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{fmt(latest.netWorth)} net worth</span>
                  <span>FI: {fmt(latest.fiNumber)}</span>
                </div>
                {yearsToFI !== null && (
                  <div className="p-3 bg-slate-800/60 rounded-xl text-sm text-slate-300 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 text-green-400" />
                    At current savings rate, FI in <strong className="text-green-400 ml-1">{yearsToFI} years</strong>
                  </div>
                )}
              </div>

              {/* Key metrics */}
              <div className="game-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Key Metrics — {latest.month}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Savings Rate', value: `${latest.savingsRate.toFixed(1)}%`, color: 'text-green-400' },
                    { label: 'Monthly Surplus', value: fmt(latest.monthlyIncome - latest.monthlyExpenses), color: 'text-blue-400' },
                    { label: 'FI Number', value: fmt(latest.fiNumber), color: 'text-purple-400' },
                    { label: 'Years to FI', value: yearsToFI !== null ? `${yearsToFI} yrs` : '—', color: 'text-yellow-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                      <div className={`text-lg font-bold ${color}`}>{value}</div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Freedom score */}
              <div className="game-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Freedom Score
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold" style={{ color: scoreColor, fontFamily: 'Orbitron, monospace' }}>
                    {latestScore}
                  </div>
                  <div>
                    <div className="text-base font-semibold" style={{ color: scoreColor }}>{scoreLbl}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Based on savings rate, FI progress, and debt ratio</div>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{ width: `${latestScore}%`, background: scoreColor }} />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Financial Beginner</span>
                  <span>Freedom Achieved</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Log your first monthly snapshot to see progress.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Charts */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Net Worth Over Time
            </h3>
            {chartSnapshots.length >= 2 ? (
              <NetWorthChart />
            ) : (
              <div className="text-center py-6 text-slate-600 text-xs">Need at least 2 snapshots</div>
            )}
          </div>

          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Savings Rate % per Month
            </h3>
            {chartSnapshots.length > 0 ? (
              <SavingsRateChart />
            ) : (
              <div className="text-center py-6 text-slate-600 text-xs">No data yet</div>
            )}
          </div>

          {sorted.length > 0 && (
            <div className="game-card p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-1">All Snapshots</h3>
              {sorted.slice().reverse().map(snap => (
                <div key={snap.id} className="flex items-center gap-3 text-xs py-1 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 w-16 flex-shrink-0">{snap.month}</span>
                  <span className="text-green-400 font-medium">{fmt(snap.netWorth)}</span>
                  <span className="text-slate-500">SR: {snap.savingsRate.toFixed(1)}%</span>
                  <span className="text-blue-400">FI: {snap.fiProgress.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowMilestoneForm(s => !s)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
              showMilestoneForm ? 'bg-slate-700 text-slate-400' : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            {showMilestoneForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showMilestoneForm ? 'Cancel' : 'Add Milestone'}
          </button>

          {showMilestoneForm && (
            <div className="game-card p-4 space-y-3 border border-green-500/20">
              <h3 className="text-sm font-semibold text-white">New Freedom Milestone</h3>
              <input
                value={milestoneForm.title}
                onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Milestone title (e.g. First $100K)"
                className="game-input w-full text-sm"
                autoFocus
              />
              <input
                type="number"
                value={milestoneForm.targetAmount || ''}
                onChange={e => setMilestoneForm(f => ({ ...f, targetAmount: Number(e.target.value) }))}
                placeholder="Target amount ($)"
                className="game-input w-full text-sm"
              />
              <button onClick={addMilestone}
                className="w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
                Add Milestone
              </button>
            </div>
          )}

          <div className="space-y-3">
            {data.milestones.map(m => {
              const current = latest?.netWorth ?? 0
              const pct = m.targetAmount > 0 ? Math.min(100, Math.round((current / m.targetAmount) * 100)) : 0
              const done = !!m.achievedDate || current >= m.targetAmount
              return (
                <div key={m.id} className="game-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {done
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <Target className="w-4 h-4 text-slate-500" />}
                      <span className={`text-sm font-medium ${done ? 'text-green-400' : 'text-white'}`}>{m.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!m.achievedDate && (
                        <button onClick={() => markAchieved(m.id)}
                          className="text-xs px-2 py-1 bg-green-700/40 text-green-400 rounded-lg hover:bg-green-700/60">
                          Mark Done
                        </button>
                      )}
                      <button onClick={() => deleteMilestone(m.id)} className="text-slate-700 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmt(current)} / {fmt(m.targetAmount)} · {pct}%
                    {m.achievedDate && <span className="ml-2 text-green-400">✓ {m.achievedDate}</span>}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: done ? '#22c55e' : '#3b82f6' }}
                    />
                  </div>
                </div>
              )
            })}
            {data.milestones.length === 0 && !showMilestoneForm && (
              <div className="text-center py-10 text-slate-500">
                <Flag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Set freedom milestones to celebrate your journey.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
