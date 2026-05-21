import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EnergySource = 'sleep' | 'food' | 'exercise' | 'social' | 'sunlight' | 'nature' | 'rest' | 'meditation' | 'hydration' | 'breathwork'
type EnergyDrain = 'overwork' | 'stress' | 'conflict' | 'screen' | 'junk-food' | 'poor-sleep' | 'social-media' | 'negativity' | 'sedentary' | 'dehydration'

interface BodyBudgetEntry {
  id: string
  sources: EnergySource[]
  drains: EnergyDrain[]
  netEnergy: number
  physicalEnergy: number
  mentalEnergy: number
  emotionalEnergy: number
  notes: string
  date: string
  createdAt: string
}

const SOURCE_CONFIG: Record<EnergySource, { label: string; emoji: string; boost: number }> = {
  sleep:       { label: 'Good Sleep',    emoji: '😴', boost: 3 },
  food:        { label: 'Quality Food',  emoji: '🥗', boost: 2 },
  exercise:    { label: 'Exercise',      emoji: '💪', boost: 2 },
  social:      { label: 'Connection',    emoji: '❤️', boost: 1 },
  sunlight:    { label: 'Sunlight',      emoji: '☀️', boost: 1 },
  nature:      { label: 'Nature',        emoji: '🌿', boost: 1 },
  rest:        { label: 'Rest',          emoji: '🛋️', boost: 2 },
  meditation:  { label: 'Meditation',    emoji: '🧘', boost: 2 },
  hydration:   { label: 'Hydration',     emoji: '💧', boost: 1 },
  breathwork:  { label: 'Breathwork',    emoji: '🌬️', boost: 1 },
}

const DRAIN_CONFIG: Record<EnergyDrain, { label: string; emoji: string; cost: number }> = {
  overwork:      { label: 'Overwork',       emoji: '😫', cost: 3 },
  stress:        { label: 'Stress',         emoji: '😰', cost: 2 },
  conflict:      { label: 'Conflict',       emoji: '⚡', cost: 2 },
  screen:        { label: 'Screen Time',    emoji: '📱', cost: 1 },
  'junk-food':   { label: 'Junk Food',      emoji: '🍕', cost: 1 },
  'poor-sleep':  { label: 'Poor Sleep',     emoji: '😪', cost: 3 },
  'social-media':{ label: 'Social Media',   emoji: '📲', cost: 1 },
  negativity:    { label: 'Negativity',     emoji: '😤', cost: 2 },
  sedentary:     { label: 'Sedentary',      emoji: '🛋️', cost: 1 },
  dehydration:   { label: 'Dehydration',    emoji: '🏜️', cost: 1 },
}

const STORAGE_KEY = 'body_budget'

export default function BodyBudget() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BodyBudgetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BodyBudgetEntry, 'id' | 'createdAt'>>({
    sources: [], drains: [], netEnergy: 7, physicalEnergy: 7, mentalEnergy: 7,
    emotionalEnergy: 7, notes: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BodyBudgetEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const toggleSource = (s: EnergySource) =>
    setForm(f => ({ ...f, sources: f.sources.includes(s) ? f.sources.filter(x => x !== s) : [...f.sources, s] }))

  const toggleDrain = (d: EnergyDrain) =>
    setForm(f => ({ ...f, drains: f.drains.includes(d) ? f.drains.filter(x => x !== d) : [...f.drains, d] }))

  const calcNet = () => {
    const gained = form.sources.reduce((s, src) => s + SOURCE_CONFIG[src].boost, 0)
    const spent = form.drains.reduce((s, d) => s + DRAIN_CONFIG[d].cost, 0)
    return gained - spent
  }

  const submit = () => {
    const e: BodyBudgetEntry = { id: Date.now().toString(), ...form, netEnergy: calcNet(), createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, sources: [], drains: [], notes: '' }))
    setShowForm(false)
    toastSuccess('Body budget logged — energy is your currency ⚡')
  }

  const avgNet = entries.length ? Math.round(entries.reduce((s, e) => s + e.netEnergy, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-cyan-400" />
            Body Budget
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your daily energy inputs and outputs.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Days Logged</div>
        </div>
        <div className="game-card p-3">
          <div className={`text-xl font-bold ${avgNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>{avgNet > 0 ? '+' : ''}{avgNet}</div>
          <div className="text-xs text-slate-500">Avg Net Energy</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">
            {entries.length ? Math.round(entries.reduce((s, e) => s + e.physicalEnergy, 0) / entries.length) : 0}/10
          </div>
          <div className="text-xs text-slate-500">Avg Physical</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Body Budget</h3>
          <p className="text-xs text-green-400 font-medium">Energy Sources ✅</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(SOURCE_CONFIG) as [EnergySource, typeof SOURCE_CONFIG.sleep][]).map(([k, s]) => (
              <button key={k} onClick={() => toggleSource(k)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${form.sources.includes(k) ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-red-400 font-medium">Energy Drains ❌</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(DRAIN_CONFIG) as [EnergyDrain, typeof DRAIN_CONFIG.overwork][]).map(([k, d]) => (
              <button key={k} onClick={() => toggleDrain(k)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${form.drains.includes(k) ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['physicalEnergy', 'mentalEnergy', 'emotionalEnergy'] as const).map(key => (
              <div key={key}>
                <p className="text-xs text-slate-500 mb-1">{key.replace('Energy', '').replace(/([A-Z])/g, ' $1').trim()}: {form[key]}/10</p>
                <input type="range" min={1} max={10} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className="w-full h-1 accent-cyan-400" />
              </div>
            ))}
          </div>
          <div className="text-center text-sm font-bold">
            Net: <span className={calcNet() >= 0 ? 'text-green-400' : 'text-red-400'}>{calcNet() > 0 ? '+' : ''}{calcNet()}</span>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes about your energy today" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${e.netEnergy >= 0 ? '#22c55e' : '#ef4444'}` }}>
            <span className="text-2xl">⚡</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">{e.date}</span>
                <span className={`text-xs font-bold ${e.netEnergy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Net: {e.netEnergy > 0 ? '+' : ''}{e.netEnergy}
                </span>
                <span className="text-xs text-cyan-400">💪 {e.physicalEnergy}/10</span>
                <span className="text-xs text-purple-400">🧠 {e.mentalEnergy}/10</span>
              </div>
              {e.sources.length > 0 && (
                <p className="text-xs text-green-300/80 mt-1">+{e.sources.map(s => SOURCE_CONFIG[s].emoji).join(' ')}</p>
              )}
              {e.drains.length > 0 && (
                <p className="text-xs text-red-300/70 mt-0.5">-{e.drains.map(d => DRAIN_CONFIG[d].emoji).join(' ')}</p>
              )}
            </div>
            <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Energy is your most valuable resource. Track it wisely.</p>
          </div>
        )}
      </div>
    </div>
  )
}
