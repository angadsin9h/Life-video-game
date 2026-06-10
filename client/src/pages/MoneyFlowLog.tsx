import React, { useState, useEffect } from 'react'
import {
  DollarSign, Plus, TrendingUp, TrendingDown, Repeat, Gift, PiggyBank,
  Heart, Zap, Smile, Frown, Meh, AlertCircle, CheckCircle, X, ChevronDown
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-money-flow'

type FlowType = 'income' | 'expense' | 'investment' | 'gift' | 'saving'
type EmotionBefore = 'anxious' | 'neutral' | 'excited' | 'grateful' | 'guilty'
type EmotionAfter = 'regret' | 'neutral' | 'satisfied' | 'empowered' | 'stressed'
type FlowCategory =
  | 'housing' | 'food' | 'transport' | 'health' | 'entertainment'
  | 'education' | 'business' | 'personal' | 'giving' | 'savings'

type FlowEntry = {
  id: string
  date: string
  type: FlowType
  amount: number
  category: FlowCategory
  description: string
  emotionBefore: EmotionBefore
  emotionAfter: EmotionAfter
  aligned: boolean
  notes: string
}

const TYPE_CONFIG: Record<FlowType, { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string }> }> = {
  income:     { label: 'Income',     color: 'text-emerald-400',  bg: 'bg-emerald-900/40',  Icon: TrendingUp },
  expense:    { label: 'Expense',    color: 'text-red-400',      bg: 'bg-red-900/40',      Icon: TrendingDown },
  investment: { label: 'Investment', color: 'text-blue-400',     bg: 'bg-blue-900/40',     Icon: Repeat },
  gift:       { label: 'Gift',       color: 'text-pink-400',     bg: 'bg-pink-900/40',     Icon: Gift },
  saving:     { label: 'Saving',     color: 'text-yellow-400',   bg: 'bg-yellow-900/40',   Icon: PiggyBank },
}

const CATEGORIES: FlowCategory[] = [
  'housing', 'food', 'transport', 'health', 'entertainment',
  'education', 'business', 'personal', 'giving', 'savings',
]

const EMOTIONS_BEFORE: EmotionBefore[] = ['anxious', 'neutral', 'excited', 'grateful', 'guilty']
const EMOTIONS_AFTER: EmotionAfter[] = ['regret', 'neutral', 'satisfied', 'empowered', 'stressed']

const EMOTION_BEFORE_COLORS: Record<EmotionBefore, string> = {
  anxious:  'bg-orange-800/60 text-orange-300',
  neutral:  'bg-slate-700/60 text-slate-300',
  excited:  'bg-yellow-800/60 text-yellow-300',
  grateful: 'bg-emerald-800/60 text-emerald-300',
  guilty:   'bg-red-800/60 text-red-300',
}

const EMOTION_AFTER_COLORS: Record<EmotionAfter, string> = {
  regret:    'bg-red-800/60 text-red-300',
  neutral:   'bg-slate-700/60 text-slate-300',
  satisfied: 'bg-emerald-800/60 text-emerald-300',
  empowered: 'bg-blue-800/60 text-blue-300',
  stressed:  'bg-orange-800/60 text-orange-300',
}

const CATEGORY_COLORS: Record<FlowCategory, string> = {
  housing:       '#10b981',
  food:          '#f59e0b',
  transport:     '#3b82f6',
  health:        '#ec4899',
  entertainment: '#8b5cf6',
  education:     '#06b6d4',
  business:      '#84cc16',
  personal:      '#f97316',
  giving:        '#e11d48',
  savings:       '#fbbf24',
}

const blankForm = (): Omit<FlowEntry, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  type: 'expense',
  amount: 0,
  category: 'food',
  description: '',
  emotionBefore: 'neutral',
  emotionAfter: 'neutral',
  aligned: true,
  notes: '',
})

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

type DonutSegment = {
  category: FlowCategory
  value: number
  percent: number
  startAngle: number
  endAngle: number
}

function buildDonut(entries: FlowEntry[]): DonutSegment[] {
  const expenses = entries.filter(e => e.type === 'expense')
  const totals: Partial<Record<FlowCategory, number>> = {}
  let sum = 0
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] ?? 0) + e.amount
    sum += e.amount
  }
  if (sum === 0) return []
  const segments: DonutSegment[] = []
  let angle = -Math.PI / 2
  for (const cat of CATEGORIES) {
    const val = totals[cat] ?? 0
    if (val === 0) continue
    const pct = val / sum
    const sweep = pct * 2 * Math.PI
    segments.push({
      category: cat,
      value: val,
      percent: pct * 100,
      startAngle: angle,
      endAngle: angle + sweep,
    })
    angle += sweep
  }
  return segments
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeOrig(largeArc)} 1 ${x2} ${y2} Z`
}

function largeOrig(v: number): number { return v }

export default function MoneyFlowLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FlowEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<FlowEntry, 'id'>>(blankForm())
  const [activeTab, setActiveTab] = useState<'dashboard' | 'story' | 'emotions'>('dashboard')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw) as FlowEntry[])
    } catch { /* ignore */ }
  }, [])

  function persist(next: FlowEntry[]) {
    setEntries(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function handleAdd() {
    if (!form.description.trim() || form.amount <= 0) return
    const next: FlowEntry = { ...form, id: generateId() }
    persist([next, ...entries])
    toastSuccess('Flow entry added', `${TYPE_CONFIG[form.type].label} of $${form.amount.toFixed(2)} logged`)
    setForm(blankForm())
    setShowForm(false)
  }

  function handleDelete(id: string) {
    persist(entries.filter(e => e.id !== id))
  }

  const currentMonth = getCurrentMonth()
  const monthEntries = entries.filter(e => e.date.startsWith(currentMonth))

  const totalIncome = monthEntries.filter(e => e.type === 'income' || e.type === 'gift').reduce((s, e) => s + e.amount, 0)
  const totalExpense = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const totalInvest = monthEntries.filter(e => e.type === 'investment' || e.type === 'saving').reduce((s, e) => s + e.amount, 0)
  const netFlow = totalIncome - totalExpense

  const alignedCount = entries.filter(e => e.aligned).length
  const consciousnessScore = entries.length === 0 ? 0 : Math.round((alignedCount / entries.length) * 100)

  const donutSegments = buildDonut(monthEntries)

  const barMax = Math.max(totalIncome, totalExpense, totalInvest, 1)

  const emotionRegret: Record<EmotionBefore, number> = { anxious: 0, neutral: 0, excited: 0, grateful: 0, guilty: 0 }
  const emotionEmpower: Record<EmotionBefore, number> = { anxious: 0, neutral: 0, excited: 0, grateful: 0, guilty: 0 }
  for (const e of entries) {
    if (e.emotionAfter === 'regret') emotionRegret[e.emotionBefore]++
    if (e.emotionAfter === 'empowered') emotionEmpower[e.emotionBefore]++
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #0d1f0d 50%, #111 100%)' }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #065f46, #ca8a04)' }}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                MoneyFlow Log
              </h1>
              <p className="text-sm text-emerald-400/70">Track the story your money tells</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #065f46, #ca8a04)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
            Add Flow
          </button>
        </div>

        {/* Consciousness Score */}
        <div className="game-card p-5 flex items-center justify-between"
          style={{ border: '1px solid rgba(202,138,4,0.4)', background: 'linear-gradient(135deg, rgba(6,95,70,0.3), rgba(15,23,42,0.8))' }}>
          <div>
            <div className="text-xs uppercase tracking-widest text-yellow-500/70 mb-1">Money Consciousness Score</div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {consciousnessScore}
              </span>
              <span className="text-2xl text-yellow-500/60 mb-1">%</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{alignedCount} of {entries.length} aligned transactions</div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-1">Net Flow</div>
              <div className={`text-xl font-bold ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                style={{ fontFamily: 'Orbitron, monospace' }}>
                {netFlow >= 0 ? '+' : ''}${netFlow.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Entries</div>
              <div className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                {entries.length}
              </div>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="game-card p-5 space-y-4"
            style={{ border: '1px solid rgba(6,95,70,0.5)', background: 'rgba(6,95,70,0.15)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">New Flow Entry</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_CONFIG) as FlowType[]).map(t => {
                const cfg = TYPE_CONFIG[t]
                const active = form.type === t
                return (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? cfg.bg + ' ' + cfg.color + ' ring-1 ring-current' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
                  >
                    <cfg.Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount || ''}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="game-input w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as FlowCategory }))}
                    className="game-input w-full appearance-none pr-8"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="game-input w-full"
                  placeholder="What was this for?"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Emotion Before</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS_BEFORE.map(em => (
                    <button
                      key={em}
                      onClick={() => setForm(f => ({ ...f, emotionBefore: em }))}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${form.emotionBefore === em ? EMOTION_BEFORE_COLORS[em] + ' ring-1 ring-current' : 'bg-slate-800/60 text-slate-500'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Emotion After</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS_AFTER.map(em => (
                    <button
                      key={em}
                      onClick={() => setForm(f => ({ ...f, emotionAfter: em }))}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${form.emotionAfter === em ? EMOTION_AFTER_COLORS[em] + ' ring-1 ring-current' : 'bg-slate-800/60 text-slate-500'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.aligned}
                  onChange={e => setForm(f => ({ ...f, aligned: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-slate-300">Aligned with my values</span>
              </label>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="game-input w-full resize-none"
                rows={2}
                placeholder="Any reflections..."
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!form.description.trim() || form.amount <= 0}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #065f46, #ca8a04)', color: '#fff' }}
            >
              Log Flow Entry
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {(['dashboard', 'story', 'emotions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab
                ? 'bg-emerald-800/60 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'bg-slate-800/40 text-slate-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Monthly Summary Bars */}
            <div className="game-card p-5" style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Monthly Overview</h3>
              <div className="space-y-3">
                {[
                  { label: 'Income', value: totalIncome, color: '#10b981' },
                  { label: 'Expenses', value: totalExpense, color: '#ef4444' },
                  { label: 'Invested / Saved', value: totalInvest, color: '#3b82f6' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-semibold" style={{ color }}>${value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(value / barMax) * 100}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut Chart */}
            {donutSegments.length > 0 && (
              <div className="game-card p-5" style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Expense Breakdown</h3>
                <div className="flex items-center gap-6 flex-wrap">
                  <svg viewBox="0 0 120 120" className="w-32 h-32 flex-shrink-0">
                    {donutSegments.map(seg => (
                      <path
                        key={seg.category}
                        d={arcPath(60, 60, 52, seg.startAngle, seg.endAngle)}
                        fill={CATEGORY_COLORS[seg.category]}
                        opacity={0.85}
                      />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#0d1f0d" />
                    <text x="60" y="64" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">
                      Expenses
                    </text>
                  </svg>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    {donutSegments.map(seg => (
                      <div key={seg.category} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[seg.category] }} />
                        <span className="text-slate-300 capitalize flex-1">{seg.category}</span>
                        <span className="text-slate-400">{seg.percent.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Story Tab */}
        {activeTab === 'story' && (
          <div className="space-y-3">
            {entries.length === 0 && (
              <div className="game-card p-8 text-center text-slate-500">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No entries yet. Start logging your money flow.</p>
              </div>
            )}
            {entries.slice(0, 30).map(entry => {
              const cfg = TYPE_CONFIG[entry.type]
              return (
                <div key={entry.id} className="game-card p-4 flex gap-3"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className={`flex-shrink-0 p-2 rounded-lg ${cfg.bg}`}>
                    <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-white text-sm">{entry.description}</span>
                        <span className="text-xs text-slate-500 ml-2 capitalize">{entry.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-bold text-sm ${cfg.color}`}>${entry.amount.toFixed(2)}</span>
                        <button onClick={() => handleDelete(entry.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${EMOTION_BEFORE_COLORS[entry.emotionBefore]}`}>
                        before: {entry.emotionBefore}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${EMOTION_AFTER_COLORS[entry.emotionAfter]}`}>
                        after: {entry.emotionAfter}
                      </span>
                      {entry.aligned ? (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-900/60 text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> aligned
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700/60 text-slate-400 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> misaligned
                        </span>
                      )}
                    </div>
                    {entry.notes && <p className="text-xs text-slate-500 mt-1.5 italic">{entry.notes}</p>}
                    <div className="text-xs text-slate-600 mt-1">{entry.date}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Emotions Tab */}
        {activeTab === 'emotions' && (
          <div className="space-y-5">
            <div className="game-card p-5" style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Emotional Spending Patterns</h3>
              {entries.length === 0 ? (
                <p className="text-slate-500 text-sm">Log some entries to see patterns.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Frown className="w-3.5 h-3.5" /> Emotions leading to regret
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {EMOTIONS_BEFORE.map(em => {
                        const count = emotionRegret[em]
                        if (count === 0) return null
                        return (
                          <div key={em} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${EMOTION_BEFORE_COLORS[em]}`}>
                            {em}: {count}x
                          </div>
                        )
                      })}
                      {EMOTIONS_BEFORE.every(em => emotionRegret[em] === 0) && (
                        <span className="text-slate-500 text-sm">No regret patterns yet</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Smile className="w-3.5 h-3.5" /> Emotions leading to empowerment
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {EMOTIONS_BEFORE.map(em => {
                        const count = emotionEmpower[em]
                        if (count === 0) return null
                        return (
                          <div key={em} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${EMOTION_BEFORE_COLORS[em]}`}>
                            {em}: {count}x
                          </div>
                        )
                      })}
                      {EMOTIONS_BEFORE.every(em => emotionEmpower[em] === 0) && (
                        <span className="text-slate-500 text-sm">No empowerment patterns yet</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-3 uppercase tracking-wider">
                      <Meh className="w-3.5 h-3.5 inline mr-1" /> Aligned vs Misaligned Spending
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                          {entries.filter(e => e.aligned).length}
                        </div>
                        <div className="text-xs text-slate-400">Aligned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                          {entries.filter(e => !e.aligned).length}
                        </div>
                        <div className="text-xs text-slate-400">Misaligned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                          {entries.filter(e => e.type === 'expense' && e.aligned).reduce((s, e) => s + e.amount, 0).toFixed(0)}
                        </div>
                        <div className="text-xs text-slate-400">$ Aligned Spend</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aligned vs misaligned by amount */}
            {entries.length > 0 && (
              <div className="game-card p-5" style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Value Alignment by Category</h3>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => {
                    const catEntries = entries.filter(e => e.category === cat)
                    if (catEntries.length === 0) return null
                    const alignedAmt = catEntries.filter(e => e.aligned).reduce((s, e) => s + e.amount, 0)
                    const totalAmt = catEntries.reduce((s, e) => s + e.amount, 0)
                    const pct = totalAmt === 0 ? 0 : (alignedAmt / totalAmt) * 100
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 capitalize">{cat}</span>
                          <span className="text-slate-400">{pct.toFixed(0)}% aligned</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
