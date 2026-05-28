import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EnergyCategory = 'people' | 'activities' | 'environments' | 'thoughts' | 'food' | 'habits' | 'media' | 'work' | 'other'
type EnergyEffect = 'drains' | 'neutral' | 'energizes'

interface EnergyItem {
  id: string
  category: EnergyCategory
  name: string
  effect: EnergyEffect
  intensity: number
  notes: string
  action: string
  createdAt: string
}

const CAT_CONFIG: Record<EnergyCategory, { label: string; emoji: string; color: string }> = {
  people:      { label: 'People',      emoji: '👥', color: '#3b82f6' },
  activities:  { label: 'Activities',  emoji: '🏃', color: '#22c55e' },
  environments:{ label: 'Places',      emoji: '🏠', color: '#f59e0b' },
  thoughts:    { label: 'Thoughts',    emoji: '💭', color: '#a855f7' },
  food:        { label: 'Food',        emoji: '🍎', color: '#84cc16' },
  habits:      { label: 'Habits',      emoji: '🔄', color: '#6366f1' },
  media:       { label: 'Media',       emoji: '📱', color: '#f97316' },
  work:        { label: 'Work',        emoji: '💼', color: '#0ea5e9' },
  other:       { label: 'Other',       emoji: '⚡', color: '#94a3b8' },
}

const EFFECT_CONFIG: Record<EnergyEffect, { label: string; color: string; emoji: string }> = {
  drains:    { label: 'Drains Energy',   color: '#ef4444', emoji: '🔻' },
  neutral:   { label: 'Neutral',         color: '#94a3b8', emoji: '➖' },
  energizes: { label: 'Gives Energy',    color: '#22c55e', emoji: '🔺' },
}

const STORAGE_KEY = 'energy_audit'

export default function EnergyAudit() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<EnergyItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterEffect, setFilterEffect] = useState<string>('all')
  const [form, setForm] = useState<Omit<EnergyItem, 'id' | 'createdAt'>>({
    category: 'people', name: '', effect: 'drains', intensity: 3, notes: '', action: '',
  })

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EnergyItem[]) => { setItems(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const i: EnergyItem = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([i, ...items])
    setForm(f => ({ ...f, name: '', notes: '', action: '' }))
    setShowForm(false)
    toastSuccess('Energy item added ⚡')
  }

  const filtered = items.filter(i => filterEffect === 'all' || i.effect === filterEffect)
  const drains = items.filter(i => i.effect === 'drains').length
  const energizers = items.filter(i => i.effect === 'energizes').length
  const netScore = energizers - drains

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Energy Audit
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map what drains vs energizes you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{energizers}</div>
          <div className="text-xs text-slate-500">Energizers</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{drains}</div>
          <div className="text-xs text-slate-500">Drains</div>
        </div>
        <div className="game-card p-3">
          <div className={`text-xl font-bold ${netScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netScore > 0 ? '+' : ''}{netScore}
          </div>
          <div className="text-xs text-slate-500">Net Score</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterEffect('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterEffect === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(EFFECT_CONFIG) as [EnergyEffect, typeof EFFECT_CONFIG.drains][]).map(([k, e]) => (
          <button key={k} onClick={() => setFilterEffect(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterEffect === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterEffect === k ? { background: e.color + '30', color: e.color } : {}}>
            {e.emoji} {e.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Energy Item</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as EnergyCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [EnergyCategory, typeof CAT_CONFIG.people][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.effect} onChange={e => setForm(f => ({ ...f, effect: e.target.value as EnergyEffect }))} className="game-input text-sm flex-1">
              {(Object.entries(EFFECT_CONFIG) as [EnergyEffect, typeof EFFECT_CONFIG.drains][]).map(([k, ef]) => (
                <option key={k} value={k}>{ef.emoji} {ef.label}</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name / description *" className="game-input w-full" autoFocus />
          <div>
            <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/5</p>
            <input type="range" min={1} max={5} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / when it affects you..." className="game-input w-full text-sm" />
          <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="Action: more of it / less of it / eliminate..." className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(item => {
          const c = CAT_CONFIG[item.category]
          const ef = EFFECT_CONFIG[item.effect]
          const isExp = expanded === item.id
          return (
            <div key={item.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${ef.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : item.id)}>
                <span className="text-xl">{ef.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{item.name}</span>
                    <span className="text-xs">{c.emoji} {c.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: ef.color }}>{ef.label} · Intensity: {'●'.repeat(item.intensity)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {item.notes && <p className="text-xs text-slate-300">{item.notes}</p>}
                  {item.action && <p className="text-xs text-blue-300">🎯 Action: {item.action}</p>}
                  <button onClick={() => save(items.filter(x => x.id !== item.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Know your energy sources and drains. Design your life accordingly.</p>
          </div>
        )}
      </div>
    </div>
  )
}
