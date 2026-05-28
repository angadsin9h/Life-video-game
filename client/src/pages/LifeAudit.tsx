import { useEffect, useState } from 'react'
import { BarChart3, Save, CheckSquare, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface AuditArea {
  id: string
  name: string
  emoji: string
  color: string
  score: number
  target: number
  strengths: string
  gaps: string
  actions: string
}

const DEFAULT_AREAS: AuditArea[] = [
  { id: 'health', name: 'Health & Vitality', emoji: '💪', color: '#22c55e', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'mind', name: 'Mental Clarity', emoji: '🧠', color: '#8b5cf6', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'career', name: 'Career & Impact', emoji: '💼', color: '#3b82f6', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'finance', name: 'Financial Freedom', emoji: '💰', color: '#eab308', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'relationships', name: 'Relationships', emoji: '❤️', color: '#ec4899', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'growth', name: 'Personal Growth', emoji: '🌱', color: '#14b8a6', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'purpose', name: 'Purpose & Mission', emoji: '🎯', color: '#f97316', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'environment', name: 'Environment & Home', emoji: '🏠', color: '#64748b', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'recreation', name: 'Fun & Recreation', emoji: '🎮', color: '#ef4444', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
  { id: 'spirituality', name: 'Spirituality & Values', emoji: '✨', color: '#6366f1', score: 5, target: 9, strengths: '', gaps: '', actions: '' },
]

const STORAGE_KEY = 'life_audit'

export default function LifeAudit() {
  const { toastSuccess } = useToast()
  const [areas, setAreas] = useState<AuditArea[]>(DEFAULT_AREAS)
  const [activeArea, setActiveArea] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      setAreas(parsed.areas || DEFAULT_AREAS)
      setLastSaved(parsed.savedAt || '')
      setSaved(true)
    }
  }, [])

  const update = (id: string, field: keyof AuditArea, value: string | number) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
    setSaved(false)
  }

  const save = () => {
    const now = new Date().toLocaleString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ areas, savedAt: now }))
    setSaved(true)
    setLastSaved(now)
    toastSuccess('Life audit saved!')
  }

  const overallScore = +(areas.reduce((s, a) => s + a.score, 0) / areas.length).toFixed(1)
  const gap = +(areas.reduce((s, a) => s + a.target, 0) / areas.length - overallScore).toFixed(1)
  const topArea = [...areas].sort((a, b) => b.score - a.score)[0]
  const bottomArea = [...areas].sort((a, b) => a.score - b.score)[0]

  const active = areas.find(a => a.id === activeArea)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-violet-400" />
            Life Audit
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Honest assessment of every life dimension</p>
        </div>
        <button onClick={save}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-green-900/20 text-green-400' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
          {saved ? <CheckSquare className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Audit'}
        </button>
      </div>

      {lastSaved && <p className="text-xs text-slate-600">Last saved: {lastSaved}</p>}

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{overallScore}</div>
          <div className="text-xs text-slate-500">Overall Score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{topArea.emoji} {topArea.score}</div>
          <div className="text-xs text-slate-500">Strongest</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{bottomArea.emoji} {bottomArea.score}</div>
          <div className="text-xs text-slate-500">Needs Work</div>
        </div>
      </div>

      {/* Radar visualization (simple bars) */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Life Wheel</h3>
        <div className="relative" style={{ height: '300px' }}>
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {/* Grid circles */}
            {[2, 4, 6, 8, 10].map(r => (
              <circle key={r} cx="150" cy="150" r={r * 13} fill="none" stroke="#1e293b" strokeWidth="1" />
            ))}
            {/* Axes */}
            {areas.map((a, i) => {
              const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2
              return (
                <line key={a.id} x1="150" y1="150"
                  x2={150 + Math.cos(angle) * 130}
                  y2={150 + Math.sin(angle) * 130}
                  stroke="#1e293b" strokeWidth="1" />
              )
            })}
            {/* Current scores polygon */}
            <polygon
              points={areas.map((a, i) => {
                const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2
                const r = (a.score / 10) * 130
                return `${150 + Math.cos(angle) * r},${150 + Math.sin(angle) * r}`
              }).join(' ')}
              fill="#8b5cf633" stroke="#8b5cf6" strokeWidth="2" />
            {/* Target polygon */}
            <polygon
              points={areas.map((a, i) => {
                const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2
                const r = (a.target / 10) * 130
                return `${150 + Math.cos(angle) * r},${150 + Math.sin(angle) * r}`
              }).join(' ')}
              fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4" />
            {/* Labels */}
            {areas.map((a, i) => {
              const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2
              const x = 150 + Math.cos(angle) * 145
              const y = 150 + Math.sin(angle) * 145
              return (
                <text key={a.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                  className="text-2xl" style={{ fontSize: '14px' }}>
                  {a.emoji}
                </text>
              )
            })}
          </svg>
        </div>
        <div className="flex justify-center gap-4 text-xs text-slate-500 mt-2">
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-violet-500 inline-block" /> Current</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-slate-600 inline-block border-dashed border-t border-slate-600" /> Target</span>
        </div>
      </div>

      {/* Area list */}
      <div className="space-y-3">
        {areas.map(a => (
          <div key={a.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${a.color}` }}>
            <div className="p-4 cursor-pointer" onClick={() => setActiveArea(activeArea === a.id ? null : a.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{a.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <input type="range" min="1" max="10" value={a.score}
                        onChange={e => { e.stopPropagation(); update(a.id, 'score', +e.target.value) }}
                        className="w-32 accent-violet-400 h-1"
                        onClick={e => e.stopPropagation()} />
                      <span className="text-sm font-bold" style={{ color: a.color }}>{a.score}/10</span>
                      <span className="text-xs text-slate-600">target: {a.target}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${activeArea === a.id ? 'rotate-90' : ''}`} />
              </div>
            </div>

            {activeArea === a.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Target Score</label>
                  <input type="range" min="1" max="10" value={a.target}
                    onChange={e => update(a.id, 'target', +e.target.value)}
                    className="w-full accent-orange-400 h-1" />
                  <div className="text-xs text-orange-400 mt-1">Target: {a.target}/10</div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Current Strengths</label>
                  <textarea value={a.strengths} onChange={e => update(a.id, 'strengths', e.target.value)}
                    placeholder="What's going well in this area?" className="game-input w-full h-16 resize-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Gaps & Challenges</label>
                  <textarea value={a.gaps} onChange={e => update(a.id, 'gaps', e.target.value)}
                    placeholder="What's holding you back? What's missing?" className="game-input w-full h-16 resize-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Immediate Actions</label>
                  <textarea value={a.actions} onChange={e => update(a.id, 'actions', e.target.value)}
                    placeholder="What are 1-3 things you can do RIGHT NOW to improve this?" className="game-input w-full h-16 resize-none text-sm" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={save}
        className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors">
        Save Life Audit
      </button>
    </div>
  )
}
