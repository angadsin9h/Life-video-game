import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WealthArea = 'earning' | 'saving' | 'investing' | 'giving' | 'spending' | 'creating' | 'inheriting' | 'protecting' | 'mindset' | 'relationships'
type WealthShift = 'scarcity' | 'cautious' | 'neutral' | 'abundant' | 'overflow'

interface WealthMindsetEntry {
  id: string
  area: WealthArea
  shift: WealthShift
  scarcityBelief: string
  abundanceReframe: string
  moneyMemory: string
  actionTaken: string
  resultSeen: string
  nextWealthMove: string
  gratitudeForWealth: string
  abundanceScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<WealthArea, { label: string; emoji: string; color: string }> = {
  earning:      { label: 'Earning',      emoji: '💰', color: '#f59e0b' },
  saving:       { label: 'Saving',       emoji: '🏦', color: '#22c55e' },
  investing:    { label: 'Investing',    emoji: '📈', color: '#3b82f6' },
  giving:       { label: 'Giving',       emoji: '🎁', color: '#ec4899' },
  spending:     { label: 'Spending',     emoji: '💳', color: '#ef4444' },
  creating:     { label: 'Creating',     emoji: '⚡', color: '#a855f7' },
  inheriting:   { label: 'Inheriting',   emoji: '🏛️', color: '#6366f1' },
  protecting:   { label: 'Protecting',   emoji: '🛡️', color: '#94a3b8' },
  mindset:      { label: 'Mindset',      emoji: '🧠', color: '#f97316' },
  relationships: { label: 'Rel. & Money', emoji: '🤝', color: '#10b981' },
}

const SHIFT_CONFIG: Record<WealthShift, { label: string; color: string }> = {
  scarcity:  { label: 'Scarcity',  color: '#ef4444' },
  cautious:  { label: 'Cautious',  color: '#f97316' },
  neutral:   { label: 'Neutral',   color: '#94a3b8' },
  abundant:  { label: 'Abundant',  color: '#3b82f6' },
  overflow:  { label: 'Overflow',  color: '#22c55e' },
}

const STORAGE_KEY = 'wealth_mindset_log'

export default function WealthMindset() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WealthMindsetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<WealthMindsetEntry, 'id' | 'createdAt'>>({
    area: 'mindset', shift: 'abundant', scarcityBelief: '',
    abundanceReframe: '', moneyMemory: '', actionTaken: '',
    resultSeen: '', nextWealthMove: '', gratitudeForWealth: '', abundanceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WealthMindsetEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.abundanceReframe.trim()) return
    const e: WealthMindsetEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, scarcityBelief: '', abundanceReframe: '', moneyMemory: '', actionTaken: '', resultSeen: '', nextWealthMove: '', gratitudeForWealth: '' }))
    setShowForm(false)
    toastSuccess('Wealth mindset logged — money flows to those who serve the most people 💰')
  }

  const abundant = entries.filter(e => e.shift === 'abundant' || e.shift === 'overflow').length
  const avgAbundance = entries.length ? Math.round(entries.reduce((s, e) => s + e.abundanceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-yellow-400" />
            Wealth Mindset
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Transform your relationship with money and abundance.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Shifts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{abundant}</div>
          <div className="text-xs text-slate-500">Abundant</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgAbundance}/10</div>
          <div className="text-xs text-slate-500">Avg Abundance</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Wealth Shift</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as WealthArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [WealthArea, typeof AREA_CONFIG.earning][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value as WealthShift }))} className="game-input text-sm flex-1">
              {(Object.entries(SHIFT_CONFIG) as [WealthShift, typeof SHIFT_CONFIG.abundant][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.scarcityBelief} onChange={e => setForm(f => ({ ...f, scarcityBelief: e.target.value }))}
            placeholder="Old scarcity belief about money" className="game-input w-full text-sm" autoFocus />
          <input value={form.abundanceReframe} onChange={e => setForm(f => ({ ...f, abundanceReframe: e.target.value }))}
            placeholder="Abundance reframe *" className="game-input w-full text-sm" />
          <input value={form.moneyMemory} onChange={e => setForm(f => ({ ...f, moneyMemory: e.target.value }))}
            placeholder="Money memory this connects to" className="game-input w-full text-sm" />
          <input value={form.actionTaken} onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value }))}
            placeholder="Abundance action you took" className="game-input w-full text-sm" />
          <input value={form.resultSeen} onChange={e => setForm(f => ({ ...f, resultSeen: e.target.value }))}
            placeholder="Result you saw from abundance thinking" className="game-input w-full text-sm" />
          <input value={form.nextWealthMove} onChange={e => setForm(f => ({ ...f, nextWealthMove: e.target.value }))}
            placeholder="Your next wealth move" className="game-input w-full text-sm" />
          <input value={form.gratitudeForWealth} onChange={e => setForm(f => ({ ...f, gratitudeForWealth: e.target.value }))}
            placeholder="What are you grateful for in your finances?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Abundance mindset: {form.abundanceScore}/10</p>
            <input type="range" min={1} max={10} value={form.abundanceScore}
              onChange={e => setForm(f => ({ ...f, abundanceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = SHIFT_CONFIG[e.shift]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-yellow-400">💰 {e.abundanceScore}/10</span>
                </div>
                {e.abundanceReframe && <p className="text-xs text-slate-300 mt-1 line-clamp-1">→ {e.abundanceReframe}</p>}
                {e.nextWealthMove && <p className="text-xs text-green-300/70 mt-0.5">⚡ {e.nextWealthMove}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Wealth begins in the mind before it appears in the bank.</p>
          </div>
        )}
      </div>
    </div>
  )
}
