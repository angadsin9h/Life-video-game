import { useState, useEffect } from 'react'
import { Leaf, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EcoAction = 'transport' | 'food' | 'energy' | 'shopping' | 'waste' | 'water' | 'nature' | 'advocacy' | 'community' | 'other'
type ImpactLevel = 'small' | 'medium' | 'large'

interface ClimateEntry {
  id: string
  action: EcoAction
  impact: ImpactLevel
  title: string
  description: string
  co2Saved: number
  moneySaved: number
  date: string
  isHabit: boolean
  createdAt: string
}

const ACTION_CONFIG: Record<EcoAction, { label: string; emoji: string; color: string }> = {
  transport: { label: 'Transport',   emoji: '🚴', color: '#22c55e' },
  food:      { label: 'Food',        emoji: '🥦', color: '#84cc16' },
  energy:    { label: 'Energy',      emoji: '⚡', color: '#f59e0b' },
  shopping:  { label: 'Shopping',    emoji: '♻️', color: '#3b82f6' },
  waste:     { label: 'Waste',       emoji: '🗑️', color: '#f97316' },
  water:     { label: 'Water',       emoji: '💧', color: '#0ea5e9' },
  nature:    { label: 'Nature',      emoji: '🌿', color: '#10b981' },
  advocacy:  { label: 'Advocacy',    emoji: '📢', color: '#a855f7' },
  community: { label: 'Community',   emoji: '🤝', color: '#6366f1' },
  other:     { label: 'Other',       emoji: '🌍', color: '#94a3b8' },
}

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; color: string }> = {
  small:  { label: 'Small',  color: '#84cc16' },
  medium: { label: 'Medium', color: '#f59e0b' },
  large:  { label: 'Large',  color: '#22c55e' },
}

const STORAGE_KEY = 'climate_log'

export default function ClimateLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ClimateEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [form, setForm] = useState<Omit<ClimateEntry, 'id' | 'createdAt'>>({
    action: 'transport', impact: 'medium', title: '', description: '',
    co2Saved: 0, moneySaved: 0, date: new Date().toISOString().split('T')[0], isHabit: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ClimateEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: ClimateEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', description: '', co2Saved: 0, moneySaved: 0 }))
    setShowForm(false)
    toastSuccess('Eco action logged 🌍')
  }

  const filtered = entries.filter(e => filterAction === 'all' || e.action === filterAction)
  const totalCO2 = entries.reduce((s, e) => s + e.co2Saved, 0)
  const totalMoney = entries.reduce((s, e) => s + e.moneySaved, 0)
  const habits = entries.filter(e => e.isHabit).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Leaf className="w-7 h-7 text-green-400" />
            Climate Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your positive impact on the planet.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{totalCO2.toFixed(1)}</div>
          <div className="text-xs text-slate-500">kg CO₂ saved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">${totalMoney}</div>
          <div className="text-xs text-slate-500">Money saved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{habits}</div>
          <div className="text-xs text-slate-500">Habits formed</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterAction('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterAction === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(ACTION_CONFIG) as [EcoAction, typeof ACTION_CONFIG.transport][]).map(([k, a]) => (
          <button key={k} onClick={() => setFilterAction(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterAction === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterAction === k ? { background: a.color + '30', color: a.color } : {}}>
            {a.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Eco Action</h3>
          <div className="flex gap-2">
            <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value as EcoAction }))} className="game-input text-sm flex-1">
              {(Object.entries(ACTION_CONFIG) as [EcoAction, typeof ACTION_CONFIG.transport][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value as ImpactLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(IMPACT_CONFIG) as [ImpactLevel, typeof IMPACT_CONFIG.small][]).map(([k, i]) => (
                <option key={k} value={k}>{i.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What did you do? *" className="game-input w-full" autoFocus />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="More details..." className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">CO₂ saved (kg)</p>
              <input type="number" value={form.co2Saved || ''} min={0} step={0.1}
                onChange={e => setForm(f => ({ ...f, co2Saved: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Money saved ($)</p>
              <input type="number" value={form.moneySaved || ''} min={0}
                onChange={e => setForm(f => ({ ...f, moneySaved: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isHabit} onChange={e => setForm(f => ({ ...f, isHabit: e.target.checked }))} />
              Recurring habit
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const a = ACTION_CONFIG[e.action]
          const i = IMPACT_CONFIG[e.impact]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    {e.isHabit && <span className="text-xs text-green-500">🔄 habit</span>}
                  </div>
                  <p className="text-xs text-slate-500">{a.label} · <span style={{ color: i.color }}>{i.label} impact</span>{e.co2Saved > 0 && ` · ${e.co2Saved}kg CO₂`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.description && <p className="text-xs text-slate-300">{e.description}</p>}
                  <div className="flex gap-4 text-xs text-slate-500">
                    {e.co2Saved > 0 && <span className="text-green-400">🌍 {e.co2Saved}kg CO₂ saved</span>}
                    {e.moneySaved > 0 && <span className="text-yellow-400">💰 ${e.moneySaved} saved</span>}
                  </div>
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Leaf className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Small actions compound. Start logging your climate wins.</p>
          </div>
        )}
      </div>
    </div>
  )
}
