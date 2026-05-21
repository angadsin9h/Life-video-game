import { useState, useEffect } from 'react'
import { AlertOctagon, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ObstacleType = 'internal' | 'external' | 'skill' | 'resource' | 'time' | 'fear' | 'belief' | 'relationship' | 'system' | 'unknown'
type ObstaclePhase = 'identified' | 'analyzing' | 'strategizing' | 'overcoming' | 'overcome' | 'recurring'

interface ObstacleMapEntry {
  id: string
  obstacleType: ObstacleType
  phase: ObstaclePhase
  obstacle: string
  goalBlocked: string
  rootCause: string
  strategy: string
  resource: string
  firstStep: string
  severity: number
  likelihood: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<ObstacleType, { label: string; emoji: string; color: string }> = {
  internal:     { label: 'Internal',     emoji: '🧠', color: '#a855f7' },
  external:     { label: 'External',     emoji: '🌍', color: '#3b82f6' },
  skill:        { label: 'Skill Gap',    emoji: '📚', color: '#6366f1' },
  resource:     { label: 'Resources',    emoji: '💰', color: '#22c55e' },
  time:         { label: 'Time',         emoji: '⏰', color: '#f59e0b' },
  fear:         { label: 'Fear',         emoji: '😰', color: '#ef4444' },
  belief:       { label: 'Belief',       emoji: '💭', color: '#f97316' },
  relationship: { label: 'Relationship', emoji: '👥', color: '#ec4899' },
  system:       { label: 'System',       emoji: '⚙️', color: '#84cc16' },
  unknown:      { label: 'Unknown',      emoji: '❓', color: '#94a3b8' },
}

const PHASE_CONFIG: Record<ObstaclePhase, { label: string; color: string; emoji: string }> = {
  identified:   { label: 'Identified',   color: '#f59e0b', emoji: '👁️' },
  analyzing:    { label: 'Analyzing',    color: '#6366f1', emoji: '🔍' },
  strategizing: { label: 'Strategizing', color: '#3b82f6', emoji: '🗺️' },
  overcoming:   { label: 'Overcoming',   color: '#f97316', emoji: '⚔️' },
  overcome:     { label: 'Overcome',     color: '#22c55e', emoji: '✅' },
  recurring:    { label: 'Recurring',    color: '#ef4444', emoji: '🔄' },
}

const STORAGE_KEY = 'obstacle_map'

export default function ObstacleMap() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ObstacleMapEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ObstacleMapEntry, 'id' | 'createdAt'>>({
    obstacleType: 'internal', phase: 'identified', obstacle: '', goalBlocked: '',
    rootCause: '', strategy: '', resource: '', firstStep: '', severity: 7, likelihood: 6,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ObstacleMapEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.obstacle.trim()) return
    const e: ObstacleMapEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, obstacle: '', goalBlocked: '', rootCause: '', strategy: '', resource: '', firstStep: '' }))
    setShowForm(false)
    toastSuccess('Obstacle mapped — awareness is the first step to overcoming ⚔️')
  }

  const overcome = entries.filter(e => e.phase === 'overcome').length
  const active = entries.filter(e => e.phase !== 'overcome').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertOctagon className="w-7 h-7 text-orange-400" />
            Obstacle Map
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your obstacles. Develop strategy. Break through.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Map
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Mapped</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{active}</div>
          <div className="text-xs text-slate-500">In Progress</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{overcome}</div>
          <div className="text-xs text-slate-500">Overcome</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Obstacle</h3>
          <div className="flex gap-2">
            <select value={form.obstacleType} onChange={e => setForm(f => ({ ...f, obstacleType: e.target.value as ObstacleType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ObstacleType, typeof TYPE_CONFIG.internal][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as ObstaclePhase }))} className="game-input text-sm flex-1">
              {(Object.entries(PHASE_CONFIG) as [ObstaclePhase, typeof PHASE_CONFIG.identified][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.obstacle} onChange={e => setForm(f => ({ ...f, obstacle: e.target.value }))}
            placeholder="Describe the obstacle clearly *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.goalBlocked} onChange={e => setForm(f => ({ ...f, goalBlocked: e.target.value }))}
            placeholder="Which goal is this blocking?" className="game-input w-full text-sm" />
          <input value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
            placeholder="Root cause of this obstacle" className="game-input w-full text-sm" />
          <input value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
            placeholder="Your strategy to overcome it" className="game-input w-full text-sm" />
          <input value={form.resource} onChange={e => setForm(f => ({ ...f, resource: e.target.value }))}
            placeholder="Resources or help needed" className="game-input w-full text-sm" />
          <input value={form.firstStep} onChange={e => setForm(f => ({ ...f, firstStep: e.target.value }))}
            placeholder="First concrete step you can take today" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Severity: {form.severity}/10</p>
              <input type="range" min={1} max={10} value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Likelihood: {form.likelihood}/10</p>
              <input type="range" min={1} max={10} value={form.likelihood}
                onChange={e => setForm(f => ({ ...f, likelihood: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Map Obstacle</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.obstacleType]
          const p = PHASE_CONFIG[e.phase]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{p.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs text-orange-400">🔥 {e.severity}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.obstacle}</p>
                {e.strategy && <p className="text-xs text-green-300/80 mt-0.5">Strategy: {e.strategy}</p>}
                {e.firstStep && <p className="text-xs text-blue-300/70 mt-0.5">Next: {e.firstStep}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The obstacle is the way. Map it. Overcome it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
