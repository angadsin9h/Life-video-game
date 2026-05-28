import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type InvestmentCategory = 'skills' | 'relationships' | 'health' | 'knowledge' | 'experiences' | 'tools' | 'environment' | 'mindset' | 'network' | 'creative'
type InvestmentReturn = 'poor' | 'fair' | 'good' | 'excellent' | 'life-changing'

interface LifeInvestmentEntry {
  id: string
  category: InvestmentCategory
  investmentReturn: InvestmentReturn
  whatYouInvested: string
  resourceCost: string
  timeCost: string
  theReturn: string
  unexpectedBenefits: string
  wouldDoAgain: boolean
  roiScore: number
  date: string
  createdAt: string
}

const CAT_CONFIG: Record<InvestmentCategory, { label: string; emoji: string; color: string }> = {
  skills:        { label: 'Skills',        emoji: '⚒️', color: '#3b82f6' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  knowledge:     { label: 'Knowledge',     emoji: '📚', color: '#6366f1' },
  experiences:   { label: 'Experiences',   emoji: '🌍', color: '#f59e0b' },
  tools:         { label: 'Tools',         emoji: '🔧', color: '#94a3b8' },
  environment:   { label: 'Environment',   emoji: '🏠', color: '#10b981' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#a855f7' },
  network:       { label: 'Network',       emoji: '🤝', color: '#f97316' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#84cc16' },
}

const RETURN_CONFIG: Record<InvestmentReturn, { label: string; color: string; emoji: string }> = {
  poor:           { label: 'Poor',         color: '#ef4444', emoji: '📉' },
  fair:           { label: 'Fair',         color: '#f59e0b', emoji: '➡️' },
  good:           { label: 'Good',         color: '#22c55e', emoji: '📈' },
  excellent:      { label: 'Excellent',    color: '#3b82f6', emoji: '🚀' },
  'life-changing':{ label: 'Life-Changing',color: '#a855f7', emoji: '✨' },
}

const STORAGE_KEY = 'life_investments_log'

export default function LifeInvestments() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeInvestmentEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeInvestmentEntry, 'id' | 'createdAt'>>({
    category: 'skills', investmentReturn: 'good', whatYouInvested: '',
    resourceCost: '', timeCost: '', theReturn: '',
    unexpectedBenefits: '', wouldDoAgain: true, roiScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeInvestmentEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouInvested.trim()) return
    const e: LifeInvestmentEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatYouInvested: '', resourceCost: '', timeCost: '', theReturn: '', unexpectedBenefits: '' }))
    setShowForm(false)
    toastSuccess('Life investment logged — invest in yourself, the return is eternal 📈')
  }

  const lifeChanging = entries.filter(e => e.investmentReturn === 'life-changing' || e.investmentReturn === 'excellent').length
  const avgROI = entries.length ? Math.round(entries.reduce((s, e) => s + e.roiScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Life Investments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track the best investments you've made in your growth and life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Investments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{lifeChanging}</div>
          <div className="text-xs text-slate-500">Life-Changing</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{avgROI}/10</div>
          <div className="text-xs text-slate-500">Avg ROI</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Life Investment</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as InvestmentCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [InvestmentCategory, typeof CAT_CONFIG.skills][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.investmentReturn} onChange={e => setForm(f => ({ ...f, investmentReturn: e.target.value as InvestmentReturn }))} className="game-input text-sm flex-1">
              {(Object.entries(RETURN_CONFIG) as [InvestmentReturn, typeof RETURN_CONFIG.good][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatYouInvested} onChange={e => setForm(f => ({ ...f, whatYouInvested: e.target.value }))}
            placeholder="What did you invest in? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <input value={form.resourceCost} onChange={e => setForm(f => ({ ...f, resourceCost: e.target.value }))}
              placeholder="Money / resource cost" className="game-input text-sm flex-1" />
            <input value={form.timeCost} onChange={e => setForm(f => ({ ...f, timeCost: e.target.value }))}
              placeholder="Time invested" className="game-input text-sm flex-1" />
          </div>
          <textarea value={form.theReturn} onChange={e => setForm(f => ({ ...f, theReturn: e.target.value }))}
            placeholder="What was the return on this investment?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.unexpectedBenefits} onChange={e => setForm(f => ({ ...f, unexpectedBenefits: e.target.value }))}
            placeholder="Unexpected benefits you received" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={form.wouldDoAgain}
              onChange={e => setForm(f => ({ ...f, wouldDoAgain: e.target.checked }))} className="accent-emerald-400" />
            Would make this investment again
          </label>
          <div>
            <p className="text-xs text-slate-500 mb-1">ROI score: {form.roiScore}/10</p>
            <input type="range" min={1} max={10} value={form.roiScore}
              onChange={e => setForm(f => ({ ...f, roiScore: Number(e.target.value) }))}
              className="w-full h-1 accent-emerald-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Save Investment</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CAT_CONFIG[e.category]
          const r = RETURN_CONFIG[e.investmentReturn]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.whatYouInvested}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.emoji} {r.label}</span>
                  <span className="text-xs text-emerald-400">📈 {e.roiScore}/10</span>
                  {e.wouldDoAgain && <span className="text-xs text-green-400">✓ Again</span>}
                </div>
                {e.theReturn && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.theReturn}</p>}
                {e.unexpectedBenefits && <p className="text-xs text-yellow-300/70 mt-0.5">✨ {e.unexpectedBenefits}</p>}
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
            <p className="text-sm">The best investment you can ever make is in yourself.</p>
          </div>
        )}
      </div>
    </div>
  )
}
