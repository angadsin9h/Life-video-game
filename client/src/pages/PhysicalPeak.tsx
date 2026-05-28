import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PeakArea = 'strength' | 'endurance' | 'flexibility' | 'speed' | 'power' | 'balance' | 'recovery' | 'nutrition' | 'sleep' | 'breathwork'
type PeakLevel = 'sedentary' | 'active' | 'training' | 'athletic' | 'elite' | 'peak'

interface PhysicalPeakEntry {
  id: string
  area: PeakArea
  level: PeakLevel
  currentMetric: string
  targetMetric: string
  trainingApproach: string
  keyBreakthrough: string
  limitationFaced: string
  recoveryProtocol: string
  feelInBody: string
  performanceScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<PeakArea, { label: string; emoji: string; color: string }> = {
  strength:   { label: 'Strength',    emoji: '💪', color: '#ef4444' },
  endurance:  { label: 'Endurance',   emoji: '🏃', color: '#f97316' },
  flexibility: { label: 'Flexibility', emoji: '🧘', color: '#22c55e' },
  speed:      { label: 'Speed',       emoji: '⚡', color: '#f59e0b' },
  power:      { label: 'Power',       emoji: '🔥', color: '#a855f7' },
  balance:    { label: 'Balance',     emoji: '⚖️', color: '#3b82f6' },
  recovery:   { label: 'Recovery',    emoji: '😴', color: '#6366f1' },
  nutrition:  { label: 'Nutrition',   emoji: '🥗', color: '#10b981' },
  sleep:      { label: 'Sleep',       emoji: '🌙', color: '#94a3b8' },
  breathwork: { label: 'Breathwork',  emoji: '🌊', color: '#ec4899' },
}

const LEVEL_CONFIG: Record<PeakLevel, { label: string; color: string }> = {
  sedentary: { label: 'Sedentary', color: '#94a3b8' },
  active:    { label: 'Active',    color: '#22c55e' },
  training:  { label: 'Training',  color: '#3b82f6' },
  athletic:  { label: 'Athletic',  color: '#f59e0b' },
  elite:     { label: 'Elite',     color: '#f97316' },
  peak:      { label: 'Peak',      color: '#a855f7' },
}

const STORAGE_KEY = 'physical_peak_log'

export default function PhysicalPeak() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PhysicalPeakEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PhysicalPeakEntry, 'id' | 'createdAt'>>({
    area: 'strength', level: 'training', currentMetric: '',
    targetMetric: '', trainingApproach: '', keyBreakthrough: '',
    limitationFaced: '', recoveryProtocol: '', feelInBody: '', performanceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PhysicalPeakEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.currentMetric.trim()) return
    const e: PhysicalPeakEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, currentMetric: '', targetMetric: '', trainingApproach: '', keyBreakthrough: '', limitationFaced: '', recoveryProtocol: '', feelInBody: '' }))
    setShowForm(false)
    toastSuccess('Physical peak logged — your body is capable of more than your mind believes 💪')
  }

  const elite = entries.filter(e => e.level === 'elite' || e.level === 'peak').length
  const avgPerf = entries.length ? Math.round(entries.reduce((s, e) => s + e.performanceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-red-400" />
            Physical Peak
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your journey to peak physical performance.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Areas</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{elite}</div>
          <div className="text-xs text-slate-500">Elite+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{avgPerf}/10</div>
          <div className="text-xs text-slate-500">Avg Performance</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Physical Peak</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as PeakArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [PeakArea, typeof AREA_CONFIG.strength][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as PeakLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(LEVEL_CONFIG) as [PeakLevel, typeof LEVEL_CONFIG.training][]).map(([k, l]) => (
                <option key={k} value={k}>{l.label}</option>
              ))}
            </select>
          </div>
          <input value={form.currentMetric} onChange={e => setForm(f => ({ ...f, currentMetric: e.target.value }))}
            placeholder="Current metric / baseline *" className="game-input w-full text-sm" autoFocus />
          <input value={form.targetMetric} onChange={e => setForm(f => ({ ...f, targetMetric: e.target.value }))}
            placeholder="Target metric / goal" className="game-input w-full text-sm" />
          <input value={form.trainingApproach} onChange={e => setForm(f => ({ ...f, trainingApproach: e.target.value }))}
            placeholder="Training approach being used" className="game-input w-full text-sm" />
          <input value={form.keyBreakthrough} onChange={e => setForm(f => ({ ...f, keyBreakthrough: e.target.value }))}
            placeholder="Key physical breakthrough" className="game-input w-full text-sm" />
          <input value={form.limitationFaced} onChange={e => setForm(f => ({ ...f, limitationFaced: e.target.value }))}
            placeholder="Current limitation or plateau" className="game-input w-full text-sm" />
          <input value={form.recoveryProtocol} onChange={e => setForm(f => ({ ...f, recoveryProtocol: e.target.value }))}
            placeholder="Recovery protocol" className="game-input w-full text-sm" />
          <input value={form.feelInBody} onChange={e => setForm(f => ({ ...f, feelInBody: e.target.value }))}
            placeholder="How you feel in your body right now" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Performance level: {form.performanceScore}/10</p>
            <input type="range" min={1} max={10} value={form.performanceScore}
              onChange={e => setForm(f => ({ ...f, performanceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-red-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const l = LEVEL_CONFIG[e.level]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>{l.label}</span>
                  <span className="text-xs text-red-400">💪 {e.performanceScore}/10</span>
                </div>
                {e.currentMetric && <p className="text-xs text-slate-300 mt-1">{e.currentMetric}{e.targetMetric ? ` → ${e.targetMetric}` : ''}</p>}
                {e.keyBreakthrough && <p className="text-xs text-yellow-300/70 mt-0.5">🔥 {e.keyBreakthrough}</p>}
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
            <p className="text-sm">Your body is the vehicle for everything you want to create in life.</p>
          </div>
        )}
      </div>
    </div>
  )
}
