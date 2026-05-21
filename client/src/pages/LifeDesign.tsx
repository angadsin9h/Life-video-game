import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DesignArea = 'career' | 'relationships' | 'lifestyle' | 'health' | 'finance' | 'creativity' | 'contribution' | 'environment' | 'growth' | 'other'
type DesignHorizon = 'now' | 'one-year' | 'three-year' | 'five-year' | 'ten-year' | 'lifetime'

interface LifeDesignEntry {
  id: string
  area: DesignArea
  horizon: DesignHorizon
  vision: string
  currentReality: string
  gap: string
  experiments: string[]
  northStar: boolean
  energyScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<DesignArea, { label: string; emoji: string; color: string }> = {
  career:       { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  relationships:{ label: 'Relationships',emoji: '❤️', color: '#ec4899' },
  lifestyle:    { label: 'Lifestyle',    emoji: '🌴', color: '#22c55e' },
  health:       { label: 'Health',       emoji: '💪', color: '#ef4444' },
  finance:      { label: 'Finance',      emoji: '💰', color: '#f59e0b' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#a855f7' },
  contribution: { label: 'Contribution', emoji: '🌍', color: '#0ea5e9' },
  environment:  { label: 'Environment',  emoji: '🏠', color: '#84cc16' },
  growth:       { label: 'Growth',       emoji: '🌱', color: '#6366f1' },
  other:        { label: 'Other',        emoji: '✨', color: '#94a3b8' },
}

const HORIZON_CONFIG: Record<DesignHorizon, { label: string; color: string }> = {
  now:         { label: 'Right Now',  color: '#ef4444' },
  'one-year':  { label: '1 Year',     color: '#f97316' },
  'three-year':{ label: '3 Years',    color: '#f59e0b' },
  'five-year': { label: '5 Years',    color: '#22c55e' },
  'ten-year':  { label: '10 Years',   color: '#3b82f6' },
  lifetime:    { label: 'Lifetime',   color: '#a855f7' },
}

const STORAGE_KEY = 'life_design'

export default function LifeDesign() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeDesignEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newExp, setNewExp] = useState('')
  const [form, setForm] = useState<Omit<LifeDesignEntry, 'id' | 'createdAt'>>({
    area: 'career', horizon: 'one-year', vision: '', currentReality: '',
    gap: '', experiments: [], northStar: false, energyScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeDesignEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addExp = () => {
    if (!newExp.trim()) return
    setForm(f => ({ ...f, experiments: [...f.experiments, newExp.trim()] }))
    setNewExp('')
  }

  const submit = () => {
    if (!form.vision.trim()) return
    const e: LifeDesignEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, vision: '', currentReality: '', gap: '', experiments: [], northStar: false }))
    setNewExp('')
    setShowForm(false)
    toastSuccess('Life design entry saved 🧭')
  }

  const northStars = entries.filter(e => e.northStar).length
  const areas = [...new Set(entries.map(e => e.area))].length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-teal-400" />
            Life Design
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Intentionally design your life across all horizons.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Design
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Visions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{areas}</div>
          <div className="text-xs text-slate-500">Life Areas</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{northStars}</div>
          <div className="text-xs text-slate-500">North Stars</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Design a Life Area</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as DesignArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [DesignArea, typeof AREA_CONFIG.career][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.horizon} onChange={e => setForm(f => ({ ...f, horizon: e.target.value as DesignHorizon }))} className="game-input text-sm flex-1">
              {(Object.entries(HORIZON_CONFIG) as [DesignHorizon, typeof HORIZON_CONFIG.now][]).map(([k, h]) => (
                <option key={k} value={k}>{h.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.value }))}
            placeholder="Paint the vision — what does this look like ideally? *" className="game-input w-full h-16 resize-none text-sm" autoFocus />
          <textarea value={form.currentReality} onChange={e => setForm(f => ({ ...f, currentReality: e.target.value }))}
            placeholder="Current reality — where are you now?" className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.gap} onChange={e => setForm(f => ({ ...f, gap: e.target.value }))}
            placeholder="The gap — what needs to change?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newExp} onChange={e => setNewExp(e.target.value)}
              placeholder="Experiment to run..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') addExp() }} />
            <button onClick={addExp} className="px-3 py-1.5 bg-teal-700/30 text-teal-400 rounded-xl text-xs">+</button>
          </div>
          {form.experiments.length > 0 && (
            <div className="space-y-0.5">
              {form.experiments.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-teal-300">
                  <span>🧪</span><span className="flex-1">{ex}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, experiments: fo.experiments.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy alignment: {form.energyScore}/10</p>
              <input type="range" min={1} max={10} value={form.energyScore}
                onChange={e => setForm(f => ({ ...f, energyScore: Number(e.target.value) }))}
                className="w-full h-1 accent-teal-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.northStar} onChange={e => setForm(f => ({ ...f, northStar: e.target.checked }))} />
              ⭐ North Star
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Save Vision</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const h = HORIZON_CONFIG[e.horizon]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: h.color + '20', color: h.color }}>{h.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  {e.northStar && <span className="text-xs text-yellow-400">⭐ North Star</span>}
                  <span className="text-xs text-teal-400">⚡ {e.energyScore}/10</span>
                </div>
                <p className="text-xs text-white mt-1 line-clamp-2">{e.vision}</p>
                {e.gap && <p className="text-xs text-orange-300/80 mt-0.5">Gap: {e.gap}</p>}
                {e.experiments.length > 0 && <p className="text-xs text-teal-300/70 mt-0.5">🧪 {e.experiments.length} experiment(s)</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Design your life on purpose. Start with one area.</p>
          </div>
        )}
      </div>
    </div>
  )
}
