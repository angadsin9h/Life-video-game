import { useState } from 'react'
import { TrendingUp, DollarSign, Target, Layers, Lightbulb, ArrowUp, ArrowDown, Minus, Star, BarChart3, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'wealth_builder_log'

type WealthArea =
  | 'Income'
  | 'Savings'
  | 'Investments'
  | 'Debt Reduction'
  | 'Side Income'
  | 'Skills/Earning Power'
  | 'Mindset'
  | 'Generosity'

const WEALTH_AREAS: WealthArea[] = [
  'Income', 'Savings', 'Investments', 'Debt Reduction',
  'Side Income', 'Skills/Earning Power', 'Mindset', 'Generosity',
]

interface WealthEntry {
  id: string
  wealthArea: WealthArea
  amountChange: number
  wealthMindsetRating: number
  action: string
  belief: string
  obstacle: string
  lesson: string
  nextStep: string
  wealthScore: number
  date: string
  createdAt: string
}

function loadEntries(): WealthEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as WealthEntry[]
  } catch { /* ignore */ }
  return []
}

function saveEntries(entries: WealthEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* ignore */ }
}

function formatMoney(n: number): string {
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return (n >= 0 ? '+$' : '-$') + formatted
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const AREA_COLORS: Record<WealthArea, string> = {
  'Income': 'text-green-400',
  'Savings': 'text-blue-400',
  'Investments': 'text-violet-400',
  'Debt Reduction': 'text-amber-400',
  'Side Income': 'text-emerald-400',
  'Skills/Earning Power': 'text-pink-400',
  'Mindset': 'text-indigo-400',
  'Generosity': 'text-rose-400',
}

const DEFAULT_FORM = {
  wealthArea: 'Income' as WealthArea,
  amountChange: 0,
  wealthMindsetRating: 7,
  action: '',
  belief: '',
  obstacle: '',
  lesson: '',
  nextStep: '',
}

export default function WealthBuilder() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WealthEntry[]>(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...DEFAULT_FORM })

  // Compute net wealth
  const netWealth = entries.reduce((sum, e) => sum + e.amountChange, 0)

  // Per-area totals
  const areaTotals = WEALTH_AREAS.map(area => {
    const areaEntries = entries.filter(e => e.wealthArea === area)
    const total = areaEntries.reduce((s, e) => s + e.amountChange, 0)
    return { area, total, count: areaEntries.length }
  })

  // Previous entry for same area (for percentage change display)
  const prevSameArea = entries
    .filter(e => e.wealthArea === form.wealthArea)
    .slice(-1)[0] ?? null

  const percentageChange = prevSameArea && prevSameArea.amountChange !== 0
    ? ((form.amountChange - prevSameArea.amountChange) / Math.abs(prevSameArea.amountChange)) * 100
    : null

  // Mindset trend last 7 days
  const last7Days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Days.push(d.toISOString().slice(0, 10))
  }
  const mindsetDots = last7Days.map(day => {
    const dayEntries = entries.filter(e => e.date === day)
    if (!dayEntries.length) return null
    const avg = dayEntries.reduce((s, e) => s + e.wealthMindsetRating, 0) / dayEntries.length
    return avg
  })

  // Last 7 entries
  const last7Entries = [...entries].reverse().slice(0, 7)

  function handleSubmit() {
    const entry: WealthEntry = {
      id: Date.now().toString(),
      wealthArea: form.wealthArea,
      amountChange: form.amountChange,
      wealthMindsetRating: form.wealthMindsetRating,
      action: form.action,
      belief: form.belief,
      obstacle: form.obstacle,
      lesson: form.lesson,
      nextStep: form.nextStep,
      wealthScore: form.wealthMindsetRating * 10,
      date: todayStr(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...entries, entry]
    setEntries(updated)
    saveEntries(updated)
    toastSuccess('Wealth entry logged', `${entry.wealthArea} — Score ${entry.wealthScore}`)
    setForm({ ...DEFAULT_FORM })
    setShowForm(false)
  }

  function mindsetDotColor(val: number): string {
    if (val >= 8) return 'bg-green-400'
    if (val >= 6) return 'bg-blue-400'
    if (val >= 4) return 'bg-amber-400'
    return 'bg-red-400'
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="w-6 h-6 text-green-400" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
          Wealth Builder
        </h1>
      </div>
      <p className="text-slate-400 text-sm mb-6">Track financial growth with a wealth mindset.</p>

      {/* Net Wealth Summary */}
      <div className="game-card mb-4 border border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">Net Wealth Summary</div>
            <div
              className={`text-3xl font-black ${netWealth >= 0 ? 'text-green-400' : 'text-red-400'}`}
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              {formatMoney(netWealth)}
            </div>
            <div className="text-xs text-slate-500 mt-1">{entries.length} total entries</div>
          </div>
          <div className="text-right">
            <Star className="w-5 h-5 text-amber-400 ml-auto mb-1" />
            <div className="text-sm text-slate-400">
              Avg Mindset: {entries.length
                ? (entries.reduce((s, e) => s + e.wealthMindsetRating, 0) / entries.length).toFixed(1)
                : '—'}/10
            </div>
          </div>
        </div>
      </div>

      {/* Per-area totals */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold">Wealth by Area</span>
        </div>
        <div className="space-y-2">
          {areaTotals.map(({ area, total, count }) => (
            <div key={area} className="flex items-center justify-between py-1 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${AREA_COLORS[area]}`}>{area}</span>
                {count > 0 && <span className="text-xs text-slate-500">({count})</span>}
              </div>
              <div className="flex items-center gap-1">
                {total > 0 ? <ArrowUp className="w-3 h-3 text-green-400" />
                  : total < 0 ? <ArrowDown className="w-3 h-3 text-red-400" />
                  : <Minus className="w-3 h-3 text-slate-500" />}
                <span className={`text-sm font-semibold ${total > 0 ? 'text-green-400' : total < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {count > 0 ? formatMoney(total) : '$0'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mindset Trend */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">7-Day Mindset Trend</span>
        </div>
        <div className="flex gap-2 items-end">
          {mindsetDots.map((val, i) => {
            const label = new Date(last7Days[i] + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
            return (
              <div key={last7Days[i]} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${val !== null ? mindsetDotColor(val) : 'bg-slate-700'}`}
                >
                  {val !== null && (
                    <span className="text-xs font-bold text-white">{val.toFixed(0)}</span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Log Button */}
      {!showForm && (
        <button
          className="w-full game-btn-primary mb-4 flex items-center justify-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <TrendingUp className="w-4 h-4" /> Log Wealth Entry
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="game-card mb-4 border border-green-500/20">
          <h3 className="font-bold text-green-300 mb-4">New Wealth Entry</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">Wealth Area</label>
              <select className="game-input w-full mt-1"
                value={form.wealthArea}
                onChange={e => setForm(f => ({ ...f, wealthArea: e.target.value as WealthArea }))}>
                {WEALTH_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Amount Change ($)</label>
              <input
                type="number"
                className="game-input w-full mt-1"
                placeholder="e.g. 500 or -200"
                value={form.amountChange}
                onChange={e => setForm(f => ({ ...f, amountChange: Number(e.target.value) }))}
              />
              {percentageChange !== null && (
                <div className={`text-xs mt-1 ${percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}% vs previous {form.wealthArea} entry
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-400">Wealth Mindset Rating: {form.wealthMindsetRating}/10</label>
              <input type="range" min={1} max={10} value={form.wealthMindsetRating}
                onChange={e => setForm(f => ({ ...f, wealthMindsetRating: Number(e.target.value) }))}
                className="w-full accent-green-500 mt-1" />
              <div className="text-xs text-slate-500">Score: {form.wealthMindsetRating * 10}/100</div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Financial Action Taken</label>
              <input className="game-input w-full mt-1" placeholder="What did you do?"
                value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Wealth Belief You Acted From</label>
              <input className="game-input w-full mt-1" placeholder="e.g. Money flows to those who create value"
                value={form.belief} onChange={e => setForm(f => ({ ...f, belief: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Financial Obstacle Faced</label>
              <input className="game-input w-full mt-1" placeholder="What stood in your way?"
                value={form.obstacle} onChange={e => setForm(f => ({ ...f, obstacle: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Lesson Learned</label>
              <input className="game-input w-full mt-1" placeholder="What did you learn?"
                value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Next Step</label>
              <input className="game-input w-full mt-1" placeholder="What's your next move?"
                value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg font-semibold"
                onClick={handleSubmit}>Save Entry</button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg"
                onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Last 7 entries */}
      {last7Entries.length > 0 && (
        <div className="game-card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold">Last 7 Entries</span>
          </div>
          <div className="space-y-2">
            {last7Entries.map(e => (
              <div key={e.id} className="flex items-start justify-between bg-slate-800/50 rounded-lg px-3 py-2 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${AREA_COLORS[e.wealthArea]}`}>{e.wealthArea}</span>
                    <span className="text-xs text-slate-500">{e.date}</span>
                  </div>
                  {e.action && <p className="text-xs text-slate-400 mt-0.5 truncate">{e.action}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-bold ${e.amountChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatMoney(e.amountChange)}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-violet-400">{e.wealthScore}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center text-slate-500 py-12">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">No entries yet. Log your first wealth action above.</p>
        </div>
      )}
    </div>
  )
}
