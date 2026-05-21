import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BalanceArea = 'work' | 'family' | 'health' | 'social' | 'finances' | 'spirituality' | 'creativity' | 'learning' | 'rest' | 'purpose'
type BalanceTrend = 'declining' | 'stable' | 'improving' | 'thriving'

interface BalanceEntry {
  id: string
  area: BalanceArea
  trend: BalanceTrend
  currentScore: number
  targetScore: number
  whatIsWorking: string
  whatIsLacking: string
  oneAction: string
  tradeoffs: string
  weeklyHours: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<BalanceArea, { label: string; emoji: string; color: string }> = {
  work:         { label: 'Work',         emoji: '💼', color: '#3b82f6' },
  family:       { label: 'Family',       emoji: '👨‍👩‍👧', color: '#ec4899' },
  health:       { label: 'Health',       emoji: '💪', color: '#22c55e' },
  social:       { label: 'Social',       emoji: '👥', color: '#f97316' },
  finances:     { label: 'Finances',     emoji: '💰', color: '#f59e0b' },
  spirituality: { label: 'Spirituality', emoji: '✨', color: '#a855f7' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#84cc16' },
  learning:     { label: 'Learning',     emoji: '📚', color: '#6366f1' },
  rest:         { label: 'Rest',         emoji: '😴', color: '#94a3b8' },
  purpose:      { label: 'Purpose',      emoji: '🌟', color: '#ef4444' },
}

const TREND_CONFIG: Record<BalanceTrend, { label: string; color: string; emoji: string }> = {
  declining:  { label: 'Declining',  color: '#ef4444', emoji: '📉' },
  stable:     { label: 'Stable',     color: '#f59e0b', emoji: '➡️' },
  improving:  { label: 'Improving',  color: '#22c55e', emoji: '📈' },
  thriving:   { label: 'Thriving',   color: '#a855f7', emoji: '🚀' },
}

const STORAGE_KEY = 'life_balance_log'

export default function LifeBalance() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BalanceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BalanceEntry, 'id' | 'createdAt'>>({
    area: 'work', trend: 'stable', currentScore: 6, targetScore: 9,
    whatIsWorking: '', whatIsLacking: '', oneAction: '', tradeoffs: '',
    weeklyHours: 20, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BalanceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatIsWorking.trim() && !form.whatIsLacking.trim()) return
    const e: BalanceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatIsWorking: '', whatIsLacking: '', oneAction: '', tradeoffs: '' }))
    setShowForm(false)
    toastSuccess('Balance check done — integration beats perfection ⚖️')
  }

  const thriving = entries.filter(e => e.trend === 'thriving').length
  const avgScore = entries.length ? Math.round(entries.reduce((s, e) => s + e.currentScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-sky-400" />
            Life Balance
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and rebalance your investment across life's dimensions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Check
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Checks</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{thriving}</div>
          <div className="text-xs text-slate-500">Thriving</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-sky-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-sky-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Life Balance Check</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as BalanceArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [BalanceArea, typeof AREA_CONFIG.work][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.trend} onChange={e => setForm(f => ({ ...f, trend: e.target.value as BalanceTrend }))} className="game-input text-sm flex-1">
              {(Object.entries(TREND_CONFIG) as [BalanceTrend, typeof TREND_CONFIG.stable][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatIsWorking} onChange={e => setForm(f => ({ ...f, whatIsWorking: e.target.value }))}
            placeholder="What's working in this area?" className="game-input w-full text-sm" autoFocus />
          <input value={form.whatIsLacking} onChange={e => setForm(f => ({ ...f, whatIsLacking: e.target.value }))}
            placeholder="What's lacking or needs attention?" className="game-input w-full text-sm" />
          <input value={form.oneAction} onChange={e => setForm(f => ({ ...f, oneAction: e.target.value }))}
            placeholder="One action to improve balance here" className="game-input w-full text-sm" />
          <input value={form.tradeoffs} onChange={e => setForm(f => ({ ...f, tradeoffs: e.target.value }))}
            placeholder="What are the tradeoffs?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current: {form.currentScore}/10</p>
              <input type="range" min={1} max={10} value={form.currentScore}
                onChange={e => setForm(f => ({ ...f, currentScore: Number(e.target.value) }))}
                className="w-full h-1 accent-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target: {form.targetScore}/10</p>
              <input type="range" min={1} max={10} value={form.targetScore}
                onChange={e => setForm(f => ({ ...f, targetScore: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Weekly hours: {form.weeklyHours}h</p>
            <input type="range" min={0} max={80} value={form.weeklyHours}
              onChange={e => setForm(f => ({ ...f, weeklyHours: Number(e.target.value) }))}
              className="w-full h-1 accent-sky-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">Log Check</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const t = TREND_CONFIG[e.trend]
          const gap = e.targetScore - e.currentScore
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs">{t.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-sky-400">{e.currentScore}/10</span>
                  {gap > 0 && <span className="text-xs text-red-400">gap: {gap}</span>}
                </div>
                <div className="flex gap-1 mt-1.5">
                  <div className="flex-1 bg-slate-700 rounded-full h-1">
                    <div className="h-1 rounded-full bg-sky-500" style={{ width: `${e.currentScore * 10}%` }} />
                  </div>
                </div>
                {e.oneAction && <p className="text-xs text-green-300/70 mt-0.5">→ {e.oneAction}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Balance is not a destination. It's a daily practice.</p>
          </div>
        )}
      </div>
    </div>
  )
}
