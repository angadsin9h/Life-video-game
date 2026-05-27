import { useState, useEffect, useCallback } from 'react'
import { Target, TrendingUp, Plus, Trash2, Save, BarChart3, Activity, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'life_alignment_log'

interface LifeArea {
  id: string
  label: string
  emoji: string
  ideal: number
  actual: number
  satisfaction: number
  actions: string[]
}

interface AlignmentData {
  areas: LifeArea[]
  lastUpdated: string
  weeklyReflection: string
}

const DEFAULT_AREAS: LifeArea[] = [
  { id: 'health',        label: 'Health',        emoji: '🏃', ideal: 20, actual: 10, satisfaction: 6, actions: [] },
  { id: 'work',          label: 'Work',          emoji: '💼', ideal: 25, actual: 40, satisfaction: 5, actions: [] },
  { id: 'relationships', label: 'Relationships', emoji: '❤️', ideal: 20, actual: 10, satisfaction: 5, actions: [] },
  { id: 'growth',        label: 'Growth',        emoji: '🧠', ideal: 15, actual: 10, satisfaction: 6, actions: [] },
  { id: 'fun',           label: 'Fun / Joy',     emoji: '🎉', ideal: 10, actual:  5, satisfaction: 4, actions: [] },
  { id: 'spirituality',  label: 'Spirituality',  emoji: '🙏', ideal:  5, actual:  5, satisfaction: 7, actions: [] },
  { id: 'finance',       label: 'Finance',       emoji: '💰', ideal:  5, actual: 10, satisfaction: 6, actions: [] },
]

function loadData(): AlignmentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AlignmentData
  } catch { /**/ }
  return { areas: DEFAULT_AREAS, lastUpdated: '', weeklyReflection: '' }
}

function calcAlignmentScore(areas: LifeArea[]): number {
  const totalGap = areas.reduce((sum, a) => sum + Math.abs(a.ideal - a.actual), 0)
  return Math.max(0, Math.round(100 - totalGap / 2))
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-teal-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function LifeAlignmentPage() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<AlignmentData>(loadData)
  const [reflection, setReflection] = useState<string>(data.weeklyReflection)
  const [newAreaLabel, setNewAreaLabel] = useState<string>('')
  const [newAreaEmoji, setNewAreaEmoji] = useState<string>('⭐')
  const [showAddArea, setShowAddArea] = useState<boolean>(false)

  const areas = data.areas
  const alignmentScore = calcAlignmentScore(areas)
  const idealSum = areas.reduce((s, a) => s + a.ideal, 0)
  const idealWarning = Math.abs(idealSum - 100) > 10

  const persist = useCallback((next: AlignmentData) => {
    setData(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const updateArea = (id: string, patch: Partial<LifeArea>) => {
    persist({
      ...data,
      areas: areas.map(a => a.id === id ? { ...a, ...patch } : a),
      lastUpdated: new Date().toISOString(),
    })
  }

  const addAction = (id: string, action: string) => {
    if (!action.trim()) return
    const area = areas.find(a => a.id === id)
    if (!area) return
    updateArea(id, { actions: [...area.actions, action.trim()] })
  }

  const removeAction = (id: string, idx: number) => {
    const area = areas.find(a => a.id === id)
    if (!area) return
    updateArea(id, { actions: area.actions.filter((_, i) => i !== idx) })
  }

  const saveReflection = () => {
    persist({ ...data, weeklyReflection: reflection, lastUpdated: new Date().toISOString() })
    toastSuccess('Alignment saved', 'Your life energy audit has been updated.')
  }

  const resetToDefaults = () => {
    persist({ areas: DEFAULT_AREAS, lastUpdated: new Date().toISOString(), weeklyReflection: reflection })
    toastSuccess('Reset to defaults')
  }

  const addCustomArea = () => {
    if (!newAreaLabel.trim()) return
    const newArea: LifeArea = {
      id: `custom_${Date.now()}`,
      label: newAreaLabel.trim(),
      emoji: newAreaEmoji || '⭐',
      ideal: 5,
      actual: 5,
      satisfaction: 5,
      actions: [],
    }
    persist({ ...data, areas: [...areas, newArea], lastUpdated: new Date().toISOString() })
    setNewAreaLabel('')
    setNewAreaEmoji('⭐')
    setShowAddArea(false)
    toastSuccess('Area added', newArea.label)
  }

  const removeArea = (id: string) => {
    if (DEFAULT_AREAS.some(a => a.id === id)) return
    persist({ ...data, areas: areas.filter(a => a.id !== id), lastUpdated: new Date().toISOString() })
  }

  const gapAreas = areas.filter(a => Math.abs(a.ideal - a.actual) > 5)

  // SVG chart dimensions
  const SVG_W = 400
  const ROW_H = 36
  const BAR_MAX_W = 200
  const LABEL_W = 110
  const CHART_H = areas.length * ROW_H + 16

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-teal-400" />
            Life Alignment
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Energy audit — compare where you want to invest vs where you actually do.</p>
        </div>
        <button onClick={resetToDefaults} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Alignment Score Hero */}
      <div className="game-card p-5 text-center border border-teal-500/20">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Alignment Score</p>
        <div className={`text-7xl font-bold ${scoreColor(alignmentScore)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {alignmentScore}
        </div>
        <p className="text-slate-400 text-sm mt-1">
          {alignmentScore >= 80 ? 'Highly aligned — great balance!' :
           alignmentScore >= 60 ? 'Good alignment with some gaps to close.' :
           alignmentScore >= 40 ? 'Noticeable misalignment — take action.' :
           'Significant gaps — energy audit needed urgently.'}
        </p>
        {idealWarning && (
          <p className="text-amber-400 text-xs mt-2 bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-1.5">
            ⚠ Ideal percentages sum to {idealSum}% — they should add up to ~100%.
          </p>
        )}
      </div>

      {/* Dual Bar Chart */}
      <div className="game-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-teal-400" />
          Ideal vs Actual Energy Distribution
        </h3>
        <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-teal-500 inline-block" /> Ideal</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-purple-500 inline-block" /> Actual</span>
        </div>
        <svg
          viewBox={`0 0 ${SVG_W} ${CHART_H}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
        >
          {areas.map((area, i) => {
            const y = i * ROW_H + 8
            const idealW = (area.ideal / 100) * BAR_MAX_W
            const actualW = (area.actual / 100) * BAR_MAX_W
            const gap = area.ideal - area.actual
            const hasGap = Math.abs(gap) > 5
            return (
              <g key={area.id}>
                {/* Label */}
                <text x={LABEL_W - 6} y={y + 9} textAnchor="end" dominantBaseline="middle"
                  fontSize="11" fill="#94a3b8" fontFamily="sans-serif">
                  {area.emoji} {area.label}
                </text>
                {/* Ideal bar */}
                <rect x={LABEL_W} y={y} width={idealW} height={10} rx={3} fill="#14b8a6" opacity={0.85} />
                <text x={LABEL_W + idealW + 4} y={y + 5} dominantBaseline="middle"
                  fontSize="9" fill="#14b8a6" fontFamily="monospace">{area.ideal}%</text>
                {/* Actual bar */}
                <rect x={LABEL_W} y={y + 13} width={actualW} height={10} rx={3} fill="#a855f7" opacity={0.8} />
                <text x={LABEL_W + actualW + 4} y={y + 18} dominantBaseline="middle"
                  fontSize="9" fill="#a855f7" fontFamily="monospace">{area.actual}%</text>
                {/* Gap indicator */}
                {hasGap && (
                  <text x={SVG_W - 4} y={y + 11} textAnchor="end" dominantBaseline="middle"
                    fontSize="9" fill={gap > 0 ? '#f59e0b' : '#ef4444'} fontFamily="monospace">
                    {gap > 0 ? `↑+${gap}%` : `↓${gap}%`}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Sliders per area */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Adjust Your Allocations
        </h3>
        {areas.map(area => (
          <div key={area.id} className="game-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-sm">{area.emoji} {area.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Sat: <span className="text-amber-400 font-bold">{area.satisfaction}/10</span>
                </span>
                {!DEFAULT_AREAS.some(d => d.id === area.id) && (
                  <button onClick={() => removeArea(area.id)} className="text-slate-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Ideal %</span>
                  <span className="text-teal-400 font-bold">{area.ideal}%</span>
                </div>
                <input
                  type="range" min={0} max={60} value={area.ideal}
                  onChange={e => updateArea(area.id, { ideal: Number(e.target.value) })}
                  className="w-full h-1.5 accent-teal-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Actual %</span>
                  <span className="text-purple-400 font-bold">{area.actual}%</span>
                </div>
                <input
                  type="range" min={0} max={60} value={area.actual}
                  onChange={e => updateArea(area.id, { actual: Number(e.target.value) })}
                  className="w-full h-1.5 accent-purple-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Satisfaction</span>
                  <span className="text-amber-400 font-bold">{area.satisfaction}/10</span>
                </div>
                <input
                  type="range" min={1} max={10} value={area.satisfaction}
                  onChange={e => updateArea(area.id, { satisfaction: Number(e.target.value) })}
                  className="w-full h-1.5 accent-amber-400"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add custom area */}
        {showAddArea ? (
          <div className="game-card p-4 space-y-3 border border-teal-500/20">
            <p className="text-sm font-semibold text-white">Add Custom Area</p>
            <div className="flex gap-2">
              <input
                value={newAreaEmoji}
                onChange={e => setNewAreaEmoji(e.target.value)}
                className="game-input w-14 text-center"
                placeholder="🌟"
                maxLength={4}
              />
              <input
                value={newAreaLabel}
                onChange={e => setNewAreaLabel(e.target.value)}
                className="game-input flex-1"
                placeholder="Area name"
                onKeyDown={e => e.key === 'Enter' && addCustomArea()}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addCustomArea} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold">
                Add Area
              </button>
              <button onClick={() => setShowAddArea(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddArea(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-600 hover:border-teal-500/60 rounded-xl text-slate-500 hover:text-teal-400 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add custom area
          </button>
        )}
      </div>

      {/* Gap cards */}
      {gapAreas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Gaps to Close
          </h3>
          {gapAreas.map(area => {
            const gap = area.ideal - area.actual
            return (
              <GapCard
                key={area.id}
                area={area}
                gap={gap}
                onAddAction={(action) => addAction(area.id, action)}
                onRemoveAction={(idx) => removeAction(area.id, idx)}
              />
            )
          })}
        </div>
      )}

      {/* Weekly reflection */}
      <div className="game-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Weekly Reflection</h3>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          rows={4}
          className="game-input w-full resize-none text-sm"
          placeholder="What patterns do you notice in your energy distribution? What one shift would create the biggest alignment improvement this week?"
        />
        <button
          onClick={saveReflection}
          className="flex items-center gap-2 px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold"
        >
          <Save className="w-4 h-4" />
          Save Reflection
        </button>
        {data.lastUpdated && (
          <p className="text-xs text-slate-600">Last saved: {new Date(data.lastUpdated).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}

interface GapCardProps {
  area: LifeArea
  gap: number
  onAddAction: (action: string) => void
  onRemoveAction: (idx: number) => void
}

function GapCard({ area, gap, onAddAction, onRemoveAction }: GapCardProps) {
  const [input, setInput] = useState<string>('')

  const submit = () => {
    if (!input.trim()) return
    onAddAction(input)
    setInput('')
  }

  const isUnder = gap > 0  // ideal > actual: under-investing
  const color = isUnder ? 'border-amber-500/30 bg-amber-900/5' : 'border-red-500/30 bg-red-900/5'
  const badgeColor = isUnder ? 'text-amber-400 bg-amber-900/30' : 'text-red-400 bg-red-900/30'
  const label = isUnder ? `Under-investing by ${gap}%` : `Over-investing by ${Math.abs(gap)}%`

  return (
    <div className={`game-card p-4 border ${color} space-y-3`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-medium text-white text-sm">{area.emoji} {area.label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{label}</span>
      </div>
      <div className="flex gap-2 text-xs text-slate-400">
        <span>Ideal <strong className="text-teal-400">{area.ideal}%</strong></span>
        <span>·</span>
        <span>Actual <strong className="text-purple-400">{area.actual}%</strong></span>
        <span>·</span>
        <span>Sat <strong className="text-amber-400">{area.satisfaction}/10</strong></span>
      </div>
      {area.actions.length > 0 && (
        <ul className="space-y-1">
          {area.actions.map((action, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-700/60 rounded-lg px-2.5 py-1.5">
              <span className="flex-1">{action}</span>
              <button onClick={() => onRemoveAction(idx)} className="text-slate-600 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="game-input flex-1 text-xs"
          placeholder="Action to close this gap..."
        />
        <button onClick={submit} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default LifeAlignmentPage
