import { useState, useEffect } from 'react'
import { Brain, Activity, Heart, Zap, Moon, Shield, Plus } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MindBodyEntry {
  id: string
  connectionScore: number
  bodyNeed: string
  mindNeed: string
  alignmentAction: string
  date: string
  createdAt: string
}

interface DimensionData {
  label: string
  key: string
  color: string
  icon: React.ReactNode
  score: number
}

const STORAGE_KEY = 'mind_body_balance_log'

function getLatestScore(storageKey: string, field: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]')
    if (Array.isArray(data) && data.length > 0) {
      const val = Number(data[0][field])
      if (!isNaN(val) && val >= 1 && val <= 10) return val
    }
  } catch { /**/ }
  return 0
}

function SixSegmentDial({ dimensions, avg }: { dimensions: DimensionData[]; avg: number }) {
  const cx = 120
  const cy = 120
  const r = 90
  const innerR = 45
  const segmentAngle = 60

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const describeArc = (startAngle: number, endAngle: number, outerR: number, innerR2: number) => {
    const s1 = polarToCartesian(startAngle + 1, innerR2)
    const e1 = polarToCartesian(endAngle - 1, innerR2)
    const s2 = polarToCartesian(startAngle + 1, outerR)
    const e2 = polarToCartesian(endAngle - 1, outerR)
    return `M ${s1.x} ${s1.y} L ${s2.x} ${s2.y} A ${outerR} ${outerR} 0 0 1 ${e2.x} ${e2.y} L ${e1.x} ${e1.y} A ${innerR2} ${innerR2} 0 0 0 ${s1.x} ${s1.y} Z`
  }

  return (
    <svg width={240} height={240} viewBox="0 0 240 240">
      {dimensions.map((dim, i) => {
        const startAngle = i * segmentAngle
        const endAngle = startAngle + segmentAngle
        const proportion = dim.score / 10
        const maxR = r
        const fillR = innerR + (maxR - innerR) * proportion
        return (
          <g key={dim.key}>
            <path d={describeArc(startAngle, endAngle, maxR, innerR)} fill={dim.color} opacity={0.15} />
            {dim.score > 0 && (
              <path d={describeArc(startAngle, endAngle, fillR, innerR)} fill={dim.color} opacity={0.85} />
            )}
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={innerR - 2} fill="#1e293b" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold" fontFamily="Orbitron, monospace">
        {avg.toFixed(1)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        /10
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="#94a3b8" fontSize={9}>
        Balance
      </text>
    </svg>
  )
}

export default function MindBodyBalance() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindBodyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    connectionScore: 7,
    bodyNeed: '',
    mindNeed: '',
    alignmentAction: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const sleepScore = getLatestScore('mindful_sleep_log', 'sleepScore')
  const energyAfter = getLatestScore('energy_budget_log', 'energyAfter')
  const performanceScore = getLatestScore('physical_peak_log', 'performanceScore')
  const sharpnessScore = getLatestScore('neuroplasticity_log', 'sharpnessScore')
  const peaceScore = getLatestScore('inner_peace_log', 'peaceScore')
  const bodyWisdomScore = getLatestScore('body_wisdom_log', 'bodyWisdomScore')

  const dimensions: DimensionData[] = [
    { label: 'Sleep', key: 'sleep', color: '#6366f1', icon: <Moon className="w-3 h-3" />, score: sleepScore },
    { label: 'Energy', key: 'energy', color: '#f59e0b', icon: <Zap className="w-3 h-3" />, score: energyAfter },
    { label: 'Performance', key: 'performance', color: '#22c55e', icon: <Activity className="w-3 h-3" />, score: performanceScore },
    { label: 'Sharpness', key: 'sharpness', color: '#a855f7', icon: <Brain className="w-3 h-3" />, score: sharpnessScore },
    { label: 'Peace', key: 'peace', color: '#3b82f6', icon: <Heart className="w-3 h-3" />, score: peaceScore },
    { label: 'Wisdom', key: 'wisdom', color: '#10b981', icon: <Shield className="w-3 h-3" />, score: bodyWisdomScore },
  ]

  const validScores = dimensions.filter(d => d.score > 0).map(d => d.score)
  const overallAvg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0

  const mindScores = [sharpnessScore, peaceScore].filter(s => s > 0)
  const mindScore = mindScores.length > 0 ? mindScores.reduce((a, b) => a + b, 0) / mindScores.length : 0

  const bodyScores = [sleepScore, energyAfter, performanceScore, bodyWisdomScore].filter(s => s > 0)
  const bodyScore = bodyScores.length > 0 ? bodyScores.reduce((a, b) => a + b, 0) / bodyScores.length : 0

  const integrationScore = ((mindScore + bodyScore) / 2) * 10

  const save = (updated: MindBodyEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    const entry: MindBodyEntry = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(f => ({ ...f, bodyNeed: '', mindNeed: '', alignmentAction: '', connectionScore: 7 }))
    setShowForm(false)
    toastSuccess('Mind-body balance logged — integration deepens with awareness')
  }

  const last7 = entries.slice(0, 7).reverse()

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-yellow-500'
    if (score >= 4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-violet-400" />
            Mind-Body Balance
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Integrated holistic score from all your wellness logs.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Six-Segment Dial */}
      <div className="game-card p-4 flex flex-col items-center">
        <SixSegmentDial dimensions={dimensions} avg={overallAvg} />
        <div className="grid grid-cols-3 gap-2 mt-2 w-full">
          {dimensions.map(dim => (
            <div key={dim.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
              <span className="text-xs text-slate-400">{dim.label}</span>
              <span className="text-xs font-bold ml-auto" style={{ color: dim.color }}>
                {dim.score > 0 ? dim.score : '–'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {mindScore > 0 ? mindScore.toFixed(1) : '–'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Mind Score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {bodyScore > 0 ? bodyScore.toFixed(1) : '–'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Body Score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {integrationScore > 0 ? Math.round(integrationScore) : '–'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Integration</div>
        </div>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Daily Mind-Body Check-In</h3>
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Mind-body connection right now: <span className="text-violet-400 font-bold">{form.connectionScore}/10</span>
            </p>
            <input
              type="range" min={1} max={10} value={form.connectionScore}
              onChange={e => setForm(f => ({ ...f, connectionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-500"
            />
          </div>
          <input
            value={form.bodyNeed}
            onChange={e => setForm(f => ({ ...f, bodyNeed: e.target.value }))}
            placeholder="What does your body need today?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.mindNeed}
            onChange={e => setForm(f => ({ ...f, mindNeed: e.target.value }))}
            placeholder="What does your mind need today?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.alignmentAction}
            onChange={e => setForm(f => ({ ...f, alignmentAction: e.target.value }))}
            placeholder="Alignment action you will take"
            className="game-input w-full text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Last 7 Days Trend */}
      {entries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Last 7 Days</h3>
          <div className="flex items-end gap-2">
            {last7.map((entry, i) => (
              <div key={entry.id} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-6 h-6 rounded-full ${getScoreColor(entry.connectionScore)} flex items-center justify-center`}
                  title={`${entry.date}: ${entry.connectionScore}/10`}
                >
                  <span className="text-white text-xs font-bold">{entry.connectionScore}</span>
                </div>
                <span className="text-xs text-slate-600">{entry.date.slice(5)}</span>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 7 - last7.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-6 h-6 rounded-full bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Mind and body are not separate — log your first check-in.</p>
        </div>
      )}
    </div>
  )
}
