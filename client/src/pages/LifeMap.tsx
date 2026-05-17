import { useState, useEffect } from 'react'
import { Map, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface LifeArea {
  id: string
  name: string
  emoji: string
  color: string
  score: number
  vision: string
  currentReality: string
  gaps: string
  nextActions: string[]
  lastUpdated: string
}

const DEFAULT_AREAS: LifeArea[] = [
  { id: '1', name: 'Health & Body', emoji: '💪', color: '#22c55e', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
  { id: '2', name: 'Mind & Learning', emoji: '🧠', color: '#3b82f6', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
  { id: '3', name: 'Relationships', emoji: '❤️', color: '#ec4899', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
  { id: '4', name: 'Career & Work', emoji: '💼', color: '#f59e0b', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
  { id: '5', name: 'Finance & Wealth', emoji: '💰', color: '#10b981', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
  { id: '6', name: 'Purpose & Spirit', emoji: '✨', color: '#a855f7', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
  { id: '7', name: 'Fun & Recreation', emoji: '🎮', color: '#f97316', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
  { id: '8', name: 'Environment', emoji: '🏠', color: '#6366f1', score: 7, vision: '', currentReality: '', gaps: '', nextActions: ['', ''], lastUpdated: '' },
]

const STORAGE_KEY = 'life_map'

export default function LifeMap() {
  const { toastSuccess } = useToast()
  const [areas, setAreas] = useState<LifeArea[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<LifeArea | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setAreas(saved ? JSON.parse(saved) : DEFAULT_AREAS)
    } catch { setAreas(DEFAULT_AREAS) }
  }, [])

  const save = (updated: LifeArea[]) => {
    setAreas(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const startEdit = (area: LifeArea) => {
    setDraft({ ...area })
    setEditingId(area.id)
    setExpandedId(area.id)
  }

  const saveEdit = () => {
    if (!draft) return
    const updated = { ...draft, lastUpdated: new Date().toISOString().split('T')[0] }
    save(areas.map(a => a.id === updated.id ? updated : a))
    setEditingId(null)
    setDraft(null)
    toastSuccess('Life area updated!')
  }

  const updateScore = (id: string, score: number) => {
    save(areas.map(a => a.id === id ? { ...a, score, lastUpdated: new Date().toISOString().split('T')[0] } : a))
  }

  const avgScore = areas.length > 0 ? Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length * 10) / 10 : 0
  const lowest = [...areas].sort((a, b) => a.score - b.score)[0]
  const highest = [...areas].sort((a, b) => b.score - a.score)[0]

  // Radar SVG
  const n = areas.length
  const cx = 120, cy = 120, r = 90
  const points = areas.map((area, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const pct = area.score / 10
    return {
      x: cx + r * pct * Math.cos(angle),
      y: cy + r * pct * Math.sin(angle),
      lx: cx + (r + 20) * Math.cos(angle),
      ly: cy + (r + 20) * Math.sin(angle),
    }
  })
  const polyPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Map className="w-7 h-7 text-teal-400" />
            Life Map
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Deep dive into every dimension of your life</p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-teal-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Life Score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg">{lowest?.emoji}</div>
          <div className="text-xs text-green-400 mt-0.5">{lowest?.name.split(' ')[0]}</div>
          <div className="text-xs text-slate-500">Needs Work ({lowest?.score})</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg">{highest?.emoji}</div>
          <div className="text-xs text-yellow-400 mt-0.5">{highest?.name.split(' ')[0]}</div>
          <div className="text-xs text-slate-500">Thriving ({highest?.score})</div>
        </div>
      </div>

      {/* Radar chart */}
      <div className="game-card p-4 flex justify-center">
        <svg width="280" height="280" viewBox="0 0 280 280">
          {/* Grid rings */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map(pct => (
            <polygon key={pct} fill="none" stroke="#1e293b" strokeWidth="1"
              points={areas.map((_, i) => {
                const angle = (i / n) * 2 * Math.PI - Math.PI / 2
                return `${(cx + 20) + r * pct * Math.cos(angle)},${(cy + 20) + r * pct * Math.sin(angle)}`
              }).join(' ')} />
          ))}
          {/* Axis lines */}
          {areas.map((_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2
            return <line key={i} x1={cx + 20} y1={cy + 20} x2={(cx + 20) + r * Math.cos(angle)} y2={(cy + 20) + r * Math.sin(angle)} stroke="#334155" strokeWidth="1" />
          })}
          {/* Data polygon */}
          <polygon fill="#14b8a620" stroke="#14b8a6" strokeWidth="2"
            points={areas.map((area, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2
              const pct = area.score / 10
              return `${(cx + 20) + r * pct * Math.cos(angle)},${(cy + 20) + r * pct * Math.sin(angle)}`
            }).join(' ')} />
          {/* Labels */}
          {areas.map((area, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2
            const lx = (cx + 20) + (r + 25) * Math.cos(angle)
            const ly = (cy + 20) + (r + 25) * Math.sin(angle)
            return (
              <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="16" style={{ userSelect: 'none' }}>
                {area.emoji}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Area cards */}
      <div className="space-y-3">
        {areas.map(area => {
          const isEditing = editingId === area.id
          const isExpanded = expandedId === area.id
          const d = isEditing && draft ? draft : area

          return (
            <div key={area.id} className="game-card overflow-hidden">
              {/* Header */}
              <div className="p-4 flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{area.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{area.name}</span>
                    <span className="text-xs font-bold" style={{ color: area.color }}>{area.score}/10</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(area.score / 10) * 100}%`, background: area.color }} />
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!isEditing && (
                    <button onClick={() => startEdit(area)} className="p-1 text-slate-600 hover:text-slate-300">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : area.id)} className="p-1 text-slate-600 hover:text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Score slider (quick) */}
              <div className="px-4 pb-3 flex items-center gap-3">
                <span className="text-xs text-slate-500 flex-shrink-0">Score:</span>
                <input type="range" min="1" max="10" value={area.score}
                  onChange={e => updateScore(area.id, +e.target.value)}
                  className="flex-1" style={{ accentColor: area.color }} />
                <span className="text-xs font-bold w-6 text-right" style={{ color: area.color }}>{area.score}</span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-3">
                  {isEditing && draft ? (
                    <>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Vision (5-year)</label>
                        <textarea value={draft.vision} onChange={e => setDraft(d => d ? { ...d, vision: e.target.value } : d)}
                          placeholder="What does this area look like at its best in 5 years?" className="game-input w-full h-16 resize-none text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Current Reality</label>
                        <textarea value={draft.currentReality} onChange={e => setDraft(d => d ? { ...d, currentReality: e.target.value } : d)}
                          placeholder="Honest assessment of where you are right now" className="game-input w-full h-16 resize-none text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Gaps to Bridge</label>
                        <textarea value={draft.gaps} onChange={e => setDraft(d => d ? { ...d, gaps: e.target.value } : d)}
                          placeholder="What's missing? What's holding you back?" className="game-input w-full h-12 resize-none text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">Next Actions</label>
                        {draft.nextActions.map((action, i) => (
                          <input key={i} value={action}
                            onChange={e => setDraft(d => { if (!d) return d; const na = [...d.nextActions]; na[i] = e.target.value; return { ...d, nextActions: na } })}
                            placeholder={`Action ${i + 1}...`} className="game-input w-full mb-1.5 text-sm" />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold">
                          <Save className="w-4 h-4 inline mr-1.5" />Save
                        </button>
                        <button onClick={() => { setEditingId(null); setDraft(null) }} className="px-3 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {area.vision && <div><div className="text-xs text-teal-400 mb-0.5">Vision</div><p className="text-sm text-slate-300">{area.vision}</p></div>}
                      {area.currentReality && <div><div className="text-xs text-slate-500 mb-0.5">Current Reality</div><p className="text-sm text-slate-400">{area.currentReality}</p></div>}
                      {area.gaps && <div><div className="text-xs text-red-400 mb-0.5">Gaps</div><p className="text-sm text-slate-400">{area.gaps}</p></div>}
                      {area.nextActions.filter(Boolean).length > 0 && (
                        <div>
                          <div className="text-xs text-green-400 mb-1">Next Actions</div>
                          {area.nextActions.filter(Boolean).map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-green-400 text-xs">→</span>
                              <span className="text-slate-300">{a}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!area.vision && !area.currentReality && (
                        <button onClick={() => startEdit(area)} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                          + Add details for this area
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
