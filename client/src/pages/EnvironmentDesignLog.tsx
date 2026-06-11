import React, { useState, useEffect } from 'react'
import { Home, Plus, Trash2, Edit3, Check, X, LayoutGrid, Zap, TrendingUp, Circle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EnvironmentZone = {
  id: string
  name: string
  type: 'work' | 'rest' | 'creative' | 'social' | 'movement' | 'digital'
  currentState: string
  idealState: string
  improvements: EnvironmentImprovement[]
  energyRating: number
}

type EnvironmentImprovement = {
  id: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  cost: 'high' | 'medium' | 'low' | 'free'
  status: 'planned' | 'in-progress' | 'done'
}

const STORAGE_KEY = 'lq-environmentdesignlog'

const ZONE_TYPE_CONFIG: Record<EnvironmentZone['type'], { label: string; color: string }> = {
  work:     { label: 'Work',     color: '#f59e0b' },
  rest:     { label: 'Rest',     color: '#6366f1' },
  creative: { label: 'Creative', color: '#f97316' },
  social:   { label: 'Social',   color: '#10b981' },
  movement: { label: 'Movement', color: '#22c55e' },
  digital:  { label: 'Digital',  color: '#3b82f6' },
}

const STATUS_CONFIG: Record<EnvironmentImprovement['status'], { label: string; color: string }> = {
  planned:    { label: 'Planned',     color: '#94a3b8' },
  'in-progress': { label: 'In Progress', color: '#f59e0b' },
  done:       { label: 'Done',        color: '#22c55e' },
}

const IMPACT_VAL: Record<string, number> = { high: 2, medium: 1, low: 0 }
const EFFORT_VAL: Record<string, number> = { low: 0, medium: 1, high: 2 }

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

type ImprovementFormState = Omit<EnvironmentImprovement, 'id'>

const defaultImpForm = (): ImprovementFormState => ({
  description: '',
  impact: 'medium',
  effort: 'medium',
  cost: 'medium',
  status: 'planned',
})

type ZoneFormState = Omit<EnvironmentZone, 'id' | 'improvements'>

const defaultZoneForm = (): ZoneFormState => ({
  name: '',
  type: 'work',
  currentState: '',
  idealState: '',
  energyRating: 5,
})

const HomeIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Home className={className} style={style} />
)
const PlusIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Plus className={className} style={style} />
)
const TrashIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Trash2 className={className} style={style} />
)
const EditIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Edit3 className={className} style={style} />
)
const CheckIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Check className={className} style={style} />
)
const XIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <X className={className} style={style} />
)
const GridIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <LayoutGrid className={className} style={style} />
)
const ZapIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Zap className={className} style={style} />
)
const TrendIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <TrendingUp className={className} style={style} />
)
const CircleIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <Circle className={className} style={style} />
)

function ImprovementMatrix({ improvements }: { improvements: EnvironmentImprovement[] }) {
  const W = 320
  const H = 280
  const pad = 40
  const innerW = W - pad * 2
  const innerH = H - pad * 2

  const xPos = (effort: string) => {
    if (effort === 'low') return pad + innerW * 0.2
    if (effort === 'medium') return pad + innerW * 0.5
    return pad + innerW * 0.8
  }
  const yPos = (impact: string) => {
    if (impact === 'high') return pad + innerH * 0.2
    if (impact === 'medium') return pad + innerH * 0.5
    return pad + innerH * 0.8
  }

  return (
    <svg width={W} height={H} className="w-full max-w-xs">
      <rect x={pad} y={pad} width={innerW / 2} height={innerH / 2}
        fill="#f59e0b" fillOpacity={0.12} rx={4} />
      <text x={pad + innerW * 0.08} y={pad + 14} fontSize={9} fill="#f59e0b" fontWeight="600">QUICK WINS</text>

      <rect x={pad + innerW / 2} y={pad} width={innerW / 2} height={innerH / 2}
        fill="#6366f1" fillOpacity={0.07} rx={4} />
      <text x={pad + innerW * 0.62} y={pad + 14} fontSize={9} fill="#6366f1" fontWeight="600">BIG BETS</text>

      <rect x={pad} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2}
        fill="#22c55e" fillOpacity={0.07} rx={4} />
      <text x={pad + innerW * 0.08} y={pad + innerH / 2 + 14} fontSize={9} fill="#22c55e" fontWeight="600">FILL INS</text>

      <rect x={pad + innerW / 2} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2}
        fill="#475569" fillOpacity={0.07} rx={4} />
      <text x={pad + innerW * 0.6} y={pad + innerH / 2 + 14} fontSize={9} fill="#94a3b8" fontWeight="600">AVOID</text>

      <line x1={pad} y1={pad + innerH} x2={pad + innerW} y2={pad + innerH} stroke="#475569" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={pad + innerH} stroke="#475569" strokeWidth={1} />
      <line x1={pad + innerW / 2} y1={pad} x2={pad + innerW / 2} y2={pad + innerH} stroke="#475569" strokeWidth={0.5} strokeDasharray="4,3" />
      <line x1={pad} y1={pad + innerH / 2} x2={pad + innerW} y2={pad + innerH / 2} stroke="#475569" strokeWidth={0.5} strokeDasharray="4,3" />

      <text x={pad + innerW / 2} y={H - 6} fontSize={9} fill="#94a3b8" textAnchor="middle">Effort →</text>
      <text x={10} y={pad + innerH / 2} fontSize={9} fill="#94a3b8" textAnchor="middle" transform={`rotate(-90, 10, ${pad + innerH / 2})`}>Impact ↑</text>

      {improvements.map((imp) => {
        const cx = xPos(imp.effort) + (Math.random() * 12 - 6)
        const cy = yPos(imp.impact) + (Math.random() * 12 - 6)
        return (
          <circle key={imp.id} cx={cx} cy={cy} r={6}
            fill={STATUS_CONFIG[imp.status].color}
            fillOpacity={0.85}
            stroke="#1e293b"
            strokeWidth={1.5}>
            <title>{imp.description} ({imp.status})</title>
          </circle>
        )
      })}
    </svg>
  )
}

function EnergyBarChart({ zones }: { zones: EnvironmentZone[] }) {
  if (zones.length === 0) return <div className="text-slate-500 text-sm text-center py-4">No zones yet</div>

  const barH = 22
  const labelW = 90
  const W = 320
  const barMaxW = W - labelW - 50

  return (
    <svg width={W} height={zones.length * (barH + 8) + 10} className="w-full max-w-xs">
      {zones.map((z, i) => {
        const barW = (z.energyRating / 10) * barMaxW
        const y = i * (barH + 8) + 5
        const color = ZONE_TYPE_CONFIG[z.type].color
        return (
          <g key={z.id}>
            <text x={0} y={y + barH / 2 + 4} fontSize={11} fill="#cbd5e1" dominantBaseline="middle">
              {z.name.length > 12 ? z.name.slice(0, 12) + '…' : z.name}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} fill="#1e293b" rx={4} />
            <rect x={labelW} y={y} width={barW} height={barH} fill={color} fillOpacity={0.8} rx={4} />
            <text x={labelW + barW + 5} y={y + barH / 2 + 4} fontSize={11} fill={color} fontWeight="600" dominantBaseline="middle">
              {z.energyRating}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function MiniDonut({ done, total }: { done: number; total: number }) {
  const r = 28
  const cx = 34
  const cy = 34
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  const dash = pct * circ

  return (
    <svg width={68} height={68}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#22c55e" strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="#f8fafc" fontWeight="700">
        {total > 0 ? Math.round(pct * 100) : 0}%
      </text>
    </svg>
  )
}

export default function EnvironmentDesignLog() {
  const { toastSuccess } = useToast()
  const [zones, setZones] = useState<EnvironmentZone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [showZoneForm, setShowZoneForm] = useState(false)
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [zoneForm, setZoneForm] = useState<ZoneFormState>(defaultZoneForm())
  const [showImpForm, setShowImpForm] = useState(false)
  const [impForm, setImpForm] = useState<ImprovementFormState>(defaultImpForm())
  const [activeTab, setActiveTab] = useState<'zones' | 'matrix' | 'energy' | 'progress'>('zones')

  useEffect(() => {
    try {
      setZones(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const persist = (updated: EnvironmentZone[]) => {
    setZones(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveZone = () => {
    if (!zoneForm.name.trim()) return
    if (editingZoneId) {
      persist(zones.map(z => z.id === editingZoneId ? { ...z, ...zoneForm } : z))
      setEditingZoneId(null)
      toastSuccess('Zone updated')
    } else {
      const newZone: EnvironmentZone = { id: uid(), improvements: [], ...zoneForm }
      persist([...zones, newZone])
      toastSuccess('Zone added to your environment design')
    }
    setZoneForm(defaultZoneForm())
    setShowZoneForm(false)
  }

  const deleteZone = (id: string) => {
    persist(zones.filter(z => z.id !== id))
    if (selectedZoneId === id) setSelectedZoneId(null)
  }

  const startEditZone = (z: EnvironmentZone) => {
    setZoneForm({ name: z.name, type: z.type, currentState: z.currentState, idealState: z.idealState, energyRating: z.energyRating })
    setEditingZoneId(z.id)
    setShowZoneForm(true)
  }

  const saveImprovement = () => {
    if (!impForm.description.trim() || !selectedZoneId) return
    const imp: EnvironmentImprovement = { id: uid(), ...impForm }
    persist(zones.map(z => z.id === selectedZoneId ? { ...z, improvements: [...z.improvements, imp] } : z))
    setImpForm(defaultImpForm())
    setShowImpForm(false)
    toastSuccess('Improvement added to your plan')
  }

  const updateImpStatus = (zoneId: string, impId: string, status: EnvironmentImprovement['status']) => {
    persist(zones.map(z => z.id === zoneId
      ? { ...z, improvements: z.improvements.map(i => i.id === impId ? { ...i, status } : i) }
      : z
    ))
    if (status === 'done') toastSuccess('Improvement complete — your space evolves!')
  }

  const deleteImprovement = (zoneId: string, impId: string) => {
    persist(zones.map(z => z.id === zoneId
      ? { ...z, improvements: z.improvements.filter(i => i.id !== impId) }
      : z
    ))
  }

  const allImps = zones.flatMap(z => z.improvements)
  const doneCount = allImps.filter(i => i.status === 'done').length
  const inProgressCount = allImps.filter(i => i.status === 'in-progress').length
  const plannedCount = allImps.filter(i => i.status === 'planned').length
  const avgEnergy = zones.length > 0
    ? (zones.reduce((s, z) => s + z.energyRating, 0) / zones.length).toFixed(1)
    : '—'

  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null

  const sortedByMatrix = [...allImps].sort((a, b) => {
    const scoreA = IMPACT_VAL[a.impact] - EFFORT_VAL[a.effort]
    const scoreB = IMPACT_VAL[b.impact] - EFFORT_VAL[b.effort]
    return scoreB - scoreA
  })
  const quickWins = sortedByMatrix.filter(i => i.impact === 'high' && i.effort === 'low')

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <HomeIcon className="w-6 h-6" style={{ color: '#f59e0b' }} />
            Environment Design
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design your spaces for peak performance</p>
        </div>
        <div className="game-card text-center px-4 py-2" style={{ borderColor: '#f59e0b33' }}>
          <div className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Orbitron, monospace' }}>{avgEnergy}</div>
          <div className="text-xs text-slate-400">Env Score</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['zones', 'matrix', 'energy', 'progress'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-800'}`}
            style={activeTab === tab ? { background: '#f59e0b' } : {}}>
            {tab === 'matrix' ? 'Impact Matrix' : tab === 'energy' ? 'Energy Bars' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'zones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Zones ({zones.length})</h2>
            <button onClick={() => { setShowZoneForm(true); setEditingZoneId(null); setZoneForm(defaultZoneForm()) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-900"
              style={{ background: '#f59e0b' }}>
              <PlusIcon className="w-4 h-4" /> Add Zone
            </button>
          </div>

          {showZoneForm && (
            <div className="game-card space-y-3" style={{ borderColor: '#f59e0b33' }}>
              <h3 className="font-semibold text-white">{editingZoneId ? 'Edit Zone' : 'New Zone'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Name</label>
                  <input className="game-input w-full" value={zoneForm.name}
                    onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Home Office, Bedroom…" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select className="game-input w-full" value={zoneForm.type}
                    onChange={e => setZoneForm(f => ({ ...f, type: e.target.value as EnvironmentZone['type'] }))}>
                    {Object.entries(ZONE_TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current State</label>
                <textarea className="game-input w-full" rows={2} value={zoneForm.currentState}
                  onChange={e => setZoneForm(f => ({ ...f, currentState: e.target.value }))}
                  placeholder="Describe how this space is set up today…" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ideal State</label>
                <textarea className="game-input w-full" rows={2} value={zoneForm.idealState}
                  onChange={e => setZoneForm(f => ({ ...f, idealState: e.target.value }))}
                  placeholder="Describe the ideal version of this space…" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Energy Rating: {zoneForm.energyRating}/10</label>
                <input type="range" min={1} max={10} value={zoneForm.energyRating}
                  onChange={e => setZoneForm(f => ({ ...f, energyRating: parseInt(e.target.value) }))}
                  className="w-full accent-amber-400" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowZoneForm(false); setEditingZoneId(null) }}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-400 bg-slate-700 hover:bg-slate-600">Cancel</button>
                <button onClick={saveZone}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-900"
                  style={{ background: '#f59e0b' }}>Save Zone</button>
              </div>
            </div>
          )}

          {zones.length === 0 && (
            <div className="game-card text-center py-10 text-slate-500">
              <HomeIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="font-medium">No zones yet</div>
              <div className="text-sm mt-1">Add your first environment zone to get started</div>
            </div>
          )}

          {zones.map(zone => (
            <div key={zone.id} className="game-card space-y-3"
              style={{ borderColor: selectedZoneId === zone.id ? ZONE_TYPE_CONFIG[zone.type].color + '66' : undefined }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setSelectedZoneId(selectedZoneId === zone.id ? null : zone.id)}>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold text-slate-900"
                    style={{ background: ZONE_TYPE_CONFIG[zone.type].color }}>
                    {ZONE_TYPE_CONFIG[zone.type].label}
                  </span>
                  <span className="font-semibold text-white">{zone.name}</span>
                  <span className="text-xs text-slate-400">⚡ {zone.energyRating}/10</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEditZone(zone)} className="p-1 text-slate-500 hover:text-amber-400 rounded">
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteZone(zone.id)} className="p-1 text-slate-500 hover:text-red-400 rounded">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedZoneId === zone.id && (
                <div className="space-y-3 border-t border-slate-700 pt-3">
                  {zone.currentState && (
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Current</div>
                      <div className="text-sm text-slate-300">{zone.currentState}</div>
                    </div>
                  )}
                  {zone.idealState && (
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Ideal</div>
                      <div className="text-sm text-slate-300">{zone.idealState}</div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-300">Improvements ({zone.improvements.length})</div>
                      <button onClick={() => { setShowImpForm(true); setImpForm(defaultImpForm()) }}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded text-slate-900 font-medium"
                        style={{ background: '#f59e0b' }}>
                        <PlusIcon className="w-3 h-3" /> Add
                      </button>
                    </div>

                    {showImpForm && selectedZoneId === zone.id && (
                      <div className="bg-slate-800 rounded-lg p-3 space-y-2 border border-slate-700">
                        <input className="game-input w-full text-sm" value={impForm.description}
                          onChange={e => setImpForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Describe the improvement…" />
                        <div className="grid grid-cols-3 gap-2">
                          {(['impact', 'effort', 'cost'] as const).map(field => (
                            <div key={field}>
                              <label className="block text-xs text-slate-500 mb-0.5 capitalize">{field}</label>
                              <select className="game-input w-full text-xs" value={impForm[field]}
                                onChange={e => setImpForm(f => ({ ...f, [field]: e.target.value as 'high' | 'medium' | 'low' | 'free' }))}>
                                {field === 'cost'
                                  ? ['free', 'low', 'medium', 'high'].map(v => <option key={v} value={v}>{v}</option>)
                                  : ['low', 'medium', 'high'].map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowImpForm(false)} className="px-2 py-1 text-xs rounded text-slate-400 bg-slate-700">Cancel</button>
                          <button onClick={saveImprovement} className="px-2 py-1 text-xs rounded text-slate-900 font-medium" style={{ background: '#f59e0b' }}>Add</button>
                        </div>
                      </div>
                    )}

                    {zone.improvements.map(imp => (
                      <div key={imp.id} className="flex items-start gap-2 bg-slate-800 rounded-lg px-3 py-2">
                        <div className="flex-1">
                          <div className="text-sm text-slate-200">{imp.description}</div>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e293b', color: '#f59e0b' }}>
                              impact: {imp.impact}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e293b', color: '#94a3b8' }}>
                              effort: {imp.effort}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e293b', color: '#10b981' }}>
                              cost: {imp.cost}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <select
                            className="text-xs rounded px-1 py-0.5 border-0 font-medium"
                            style={{ background: STATUS_CONFIG[imp.status].color + '22', color: STATUS_CONFIG[imp.status].color }}
                            value={imp.status}
                            onChange={e => updateImpStatus(zone.id, imp.id, e.target.value as EnvironmentImprovement['status'])}>
                            <option value="planned">Planned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          <button onClick={() => deleteImprovement(zone.id, imp.id)} className="p-1 text-slate-600 hover:text-red-400 rounded">
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="game-card" style={{ borderColor: '#f59e0b33' }}>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <GridIcon className="w-5 h-5" style={{ color: '#f59e0b' }} />
              Impact vs Effort Matrix
            </h2>
            <p className="text-xs text-slate-400 mb-4">All improvements plotted by impact and effort. Amber zone = quick wins.</p>
            <div className="flex justify-center">
              <ImprovementMatrix improvements={allImps} />
            </div>
            <div className="flex gap-4 mt-3 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CircleIcon className="w-3 h-3" style={{ color: v.color }} />
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          {quickWins.length > 0 && (
            <div className="game-card" style={{ borderColor: '#f59e0b55', background: '#f59e0b0a' }}>
              <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <ZapIcon className="w-4 h-4" /> Quick Wins ({quickWins.length})
              </h3>
              <div className="space-y-1.5">
                {quickWins.map(imp => (
                  <div key={imp.id} className="text-sm text-slate-300 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: STATUS_CONFIG[imp.status].color }} />
                    {imp.description}
                    <span className="text-xs text-slate-500 ml-auto">{imp.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allImps.length === 0 && (
            <div className="text-center py-8 text-slate-500">Add improvements to zones to see them in the matrix</div>
          )}
        </div>
      )}

      {activeTab === 'energy' && (
        <div className="game-card" style={{ borderColor: '#f59e0b33' }}>
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <ZapIcon className="w-5 h-5" style={{ color: '#f59e0b' }} />
            Zone Energy Ratings
          </h2>
          <p className="text-xs text-slate-400 mb-4">How energizing each zone currently feels (1–10)</p>
          <div className="flex justify-start overflow-x-auto">
            <EnergyBarChart zones={zones} />
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            {Object.entries(ZONE_TYPE_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: v.color }} />
                {v.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-4">
          <div className="game-card" style={{ borderColor: '#f59e0b33' }}>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <TrendIcon className="w-5 h-5" style={{ color: '#f59e0b' }} />
              Improvement Progress
            </h2>
            <div className="flex items-center gap-6">
              <MiniDonut done={doneCount} total={allImps.length} />
              <div className="space-y-2">
                {[
                  { label: 'Planned', count: plannedCount, color: '#94a3b8' },
                  { label: 'In Progress', count: inProgressCount, color: '#f59e0b' },
                  { label: 'Done', count: doneCount, color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm text-slate-300">{s.label}</span>
                    <span className="font-bold ml-1" style={{ color: s.color }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-400">
              Total improvements: <span className="text-white font-semibold">{allImps.length}</span>
              {allImps.length > 0 && (
                <> &nbsp;·&nbsp; Completion: <span className="font-semibold" style={{ color: '#22c55e' }}>
                  {Math.round((doneCount / allImps.length) * 100)}%
                </span></>
              )}
            </div>
          </div>

          {zones.map(z => (
            <div key={z.id} className="game-card" style={{ borderColor: ZONE_TYPE_CONFIG[z.type].color + '33' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white text-sm">{z.name}</span>
                <span className="text-xs px-2 py-0.5 rounded text-slate-900 font-medium"
                  style={{ background: ZONE_TYPE_CONFIG[z.type].color }}>
                  {z.improvements.filter(i => i.status === 'done').length}/{z.improvements.length} done
                </span>
              </div>
              {z.improvements.length > 0 && (
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(z.improvements.filter(i => i.status === 'done').length / z.improvements.length) * 100}%`,
                      background: ZONE_TYPE_CONFIG[z.type].color,
                    }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
