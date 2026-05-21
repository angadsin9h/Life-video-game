import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EnergyCategory = 'physical' | 'mental' | 'emotional' | 'spiritual' | 'social' | 'creative'
type EnergyImpact = 'drain' | 'neutral' | 'maintain' | 'boost' | 'transform'

interface EnergyBudgetEntry {
  id: string
  category: EnergyCategory
  impact: EnergyImpact
  activity: string
  energyBefore: number
  energyAfter: number
  durationMins: number
  whatMadeItDrain: string
  whatMadeItBoost: string
  optimizationIdea: string
  doMore: boolean
  date: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<EnergyCategory, { label: string; emoji: string; color: string }> = {
  physical:  { label: 'Physical',  emoji: '💪', color: '#ef4444' },
  mental:    { label: 'Mental',    emoji: '🧠', color: '#3b82f6' },
  emotional: { label: 'Emotional', emoji: '❤️', color: '#ec4899' },
  spiritual: { label: 'Spiritual', emoji: '✨', color: '#a855f7' },
  social:    { label: 'Social',    emoji: '👥', color: '#22c55e' },
  creative:  { label: 'Creative',  emoji: '🎨', color: '#f97316' },
}

const IMPACT_CONFIG: Record<EnergyImpact, { label: string; color: string }> = {
  drain:     { label: 'Draining',    color: '#ef4444' },
  neutral:   { label: 'Neutral',     color: '#94a3b8' },
  maintain:  { label: 'Maintaining', color: '#f59e0b' },
  boost:     { label: 'Boosting',    color: '#3b82f6' },
  transform: { label: 'Energizing',  color: '#22c55e' },
}

const STORAGE_KEY = 'energy_budget_log'

export default function EnergyBudget() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EnergyBudgetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EnergyBudgetEntry, 'id' | 'createdAt'>>({
    category: 'physical', impact: 'boost', activity: '',
    energyBefore: 5, energyAfter: 7, durationMins: 30,
    whatMadeItDrain: '', whatMadeItBoost: '', optimizationIdea: '', doMore: true,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EnergyBudgetEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.activity.trim()) return
    const e: EnergyBudgetEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, activity: '', whatMadeItDrain: '', whatMadeItBoost: '', optimizationIdea: '' }))
    setShowForm(false)
    toastSuccess('Energy logged — guard your energy like your most precious resource ⚡')
  }

  const boosters = entries.filter(e => e.impact === 'boost' || e.impact === 'transform').length
  const avgNet = entries.length
    ? Math.round(entries.reduce((s, e) => s + (e.energyAfter - e.energyBefore), 0) / entries.length * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Energy Budget
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track what drains and boosts you to optimize your energy.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Activities</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{boosters}</div>
          <div className="text-xs text-slate-500">Boosters</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: avgNet >= 0 ? '#22c55e' : '#ef4444' }}>{avgNet > 0 ? '+' : ''}{avgNet}</div>
          <div className="text-xs text-slate-500">Avg Net Energy</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Energy Activity</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as EnergyCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CATEGORY_CONFIG) as [EnergyCategory, typeof CATEGORY_CONFIG.physical][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value as EnergyImpact }))} className="game-input text-sm flex-1">
              {(Object.entries(IMPACT_CONFIG) as [EnergyImpact, typeof IMPACT_CONFIG.boost][]).map(([k, i]) => (
                <option key={k} value={k}>{i.label}</option>
              ))}
            </select>
          </div>
          <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="Activity name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy before: {form.energyBefore}/10</p>
              <input type="range" min={1} max={10} value={form.energyBefore}
                onChange={e => setForm(f => ({ ...f, energyBefore: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy after: {form.energyAfter}/10</p>
              <input type="range" min={1} max={10} value={form.energyAfter}
                onChange={e => setForm(f => ({ ...f, energyAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Duration: {form.durationMins} min</p>
            <input type="range" min={5} max={480} step={5} value={form.durationMins}
              onChange={e => setForm(f => ({ ...f, durationMins: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <input value={form.whatMadeItDrain} onChange={e => setForm(f => ({ ...f, whatMadeItDrain: e.target.value }))}
            placeholder="What made it drain energy?" className="game-input w-full text-sm" />
          <input value={form.whatMadeItBoost} onChange={e => setForm(f => ({ ...f, whatMadeItBoost: e.target.value }))}
            placeholder="What made it boost energy?" className="game-input w-full text-sm" />
          <input value={form.optimizationIdea} onChange={e => setForm(f => ({ ...f, optimizationIdea: e.target.value }))}
            placeholder="Optimization idea" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.doMore} onChange={e => setForm(f => ({ ...f, doMore: e.target.checked }))}
              className="w-4 h-4 accent-yellow-400" />
            Do more of this
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CATEGORY_CONFIG[e.category]
          const i = IMPACT_CONFIG[e.impact]
          const net = e.energyAfter - e.energyBefore
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.activity}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: i.color + '20', color: i.color }}>{i.label}</span>
                  <span className="text-xs" style={{ color: net >= 0 ? '#22c55e' : '#ef4444' }}>{net > 0 ? '+' : ''}{net}</span>
                  {e.doMore && <span className="text-xs text-yellow-400">★ Do more</span>}
                </div>
                {e.optimizationIdea && <p className="text-xs text-slate-400 mt-1 line-clamp-1">💡 {e.optimizationIdea}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Energy, not time, is your most precious resource.</p>
          </div>
        )}
      </div>
    </div>
  )
}
