import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, TrendingUp } from 'lucide-react'

interface AreaScore {
  id: string
  label: string
  color: string
  fillColor: string
  score: number
  description: string
}

const AREAS: Omit<AreaScore, 'score'>[] = [
  { id: 'health',        label: 'Health',       color: '#22c55e', fillColor: '#22c55e30', description: 'Physical fitness, sleep, nutrition' },
  { id: 'mind',         label: 'Mind',         color: '#06b6d4', fillColor: '#06b6d430', description: 'Learning, mental clarity, focus' },
  { id: 'work',         label: 'Work',         color: '#8b5cf6', fillColor: '#8b5cf630', description: 'Career, productivity, finances' },
  { id: 'social',       label: 'Social',       color: '#eab308', fillColor: '#eab30830', description: 'Relationships, community, connection' },
  { id: 'growth',       label: 'Growth',       color: '#f97316', fillColor: '#f9731630', description: 'Personal development, habits, goals' },
  { id: 'creativity',   label: 'Creativity',   color: '#ec4899', fillColor: '#ec489930', description: 'Creative expression, art, hobbies' },
  { id: 'spiritual',    label: 'Spiritual',    color: '#a78bfa', fillColor: '#a78bfa30', description: 'Meaning, values, mindfulness' },
  { id: 'environment',  label: 'Environment',  color: '#34d399', fillColor: '#34d39930', description: 'Home, workspace, surroundings' },
]

const NUM_AREAS = AREAS.length

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function WheelSVG({ scores, hoveredIdx, setHoveredIdx }: {
  scores: AreaScore[]
  hoveredIdx: number | null
  setHoveredIdx: (i: number | null) => void
}) {
  const cx = 200, cy = 200, maxR = 160, minR = 10

  const spokes = scores.map((_, i) => {
    const angle = (360 / NUM_AREAS) * i
    const outer = polarToXY(angle, maxR, cx, cy)
    return { angle, outer }
  })

  // Build polygon for each area
  const getPolygon = (idx: number, score: number) => {
    const r = minR + (score / 10) * (maxR - minR)
    return polarToXY((360 / NUM_AREAS) * idx, r, cx, cy)
  }

  const polygonPoints = scores.map((s, i) => getPolygon(i, s.score))
  const polygonStr = polygonPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Grid rings
  const rings = [2, 4, 6, 8, 10]

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-sm mx-auto">
      {/* Grid rings */}
      {rings.map(r => {
        const radius = minR + (r / 10) * (maxR - minR)
        const pts = Array.from({ length: NUM_AREAS }, (_, i) => {
          const p = polarToXY((360 / NUM_AREAS) * i, radius, cx, cy)
          return `${p.x},${p.y}`
        }).join(' ')
        return (
          <polygon key={r} points={pts} fill="none" stroke="#1e293b" strokeWidth="1" />
        )
      })}

      {/* Spokes */}
      {spokes.map(({ angle, outer }, i) => (
        <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
          stroke="#1e293b" strokeWidth="1" />
      ))}

      {/* Fill polygon */}
      <polygon points={polygonStr} fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Area segments (hover) */}
      {scores.map((area, i) => {
        const next = (i + 1) % NUM_AREAS
        const r = minR + (area.score / 10) * (maxR - minR)
        const rNext = minR + (scores[next].score / 10) * (maxR - minR)
        const p1 = polarToXY((360 / NUM_AREAS) * i, maxR, cx, cy)
        const p2 = polarToXY((360 / NUM_AREAS) * next, maxR, cx, cy)
        const p3 = polarToXY((360 / NUM_AREAS) * next, rNext, cx, cy)
        const p4 = polarToXY((360 / NUM_AREAS) * i, r, cx, cy)
        const isHovered = hoveredIdx === i
        return (
          <polygon key={area.id}
            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
            fill={isHovered ? area.fillColor : 'transparent'}
            stroke="transparent" strokeWidth="2"
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        )
      })}

      {/* Score dots */}
      {scores.map((area, i) => {
        const r = minR + (area.score / 10) * (maxR - minR)
        const p = polarToXY((360 / NUM_AREAS) * i, r, cx, cy)
        return (
          <circle key={area.id} cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3.5}
            fill={area.color} stroke="#0f172a" strokeWidth="1.5"
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        )
      })}

      {/* Labels */}
      {scores.map((area, i) => {
        const labelR = maxR + 24
        const p = polarToXY((360 / NUM_AREAS) * i, labelR, cx, cy)
        const anchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle'
        return (
          <text key={area.id} x={p.x} y={p.y + 4} textAnchor={anchor}
            fill={hoveredIdx === i ? area.color : '#64748b'}
            fontSize="11" fontWeight="600"
            className="cursor-pointer transition-all select-none"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}>
            {area.label}
          </text>
        )
      })}

      {/* Center score */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="700">
        {(scores.reduce((s, a) => s + a.score, 0) / scores.length).toFixed(1)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#475569" fontSize="10">
        avg score
      </text>
    </svg>
  )
}

const SCORE_LABELS = ['', 'Very Poor', 'Poor', 'Below Avg', 'Needs Work', 'Mediocre', 'Fair', 'Good', 'Great', 'Excellent', 'Perfect']

export default function LifeWheel() {
  const [scores, setScores] = useState<AreaScore[]>(() =>
    AREAS.map(a => ({ ...a, score: 5 }))
  )
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Try to load data from existing life areas to pre-fill
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, habitsRes, sleepRes] = await Promise.all([
          axios.get('/api/stats').catch(() => ({ data: null })),
          axios.get('/api/habits').catch(() => ({ data: [] })),
          axios.get('/api/sleep').catch(() => ({ data: [] })),
        ])
        const stats = statsRes.data
        const habits = habitsRes.data as any[]
        const sleepLogs = sleepRes.data as any[]

        const newScores = [...scores]

        // Health: based on sleep quality + workout habits + avg sleep
        if (sleepLogs.length > 0) {
          const avgQuality = sleepLogs.slice(0, 7).reduce((s: number, l: any) => s + (l.quality || 3), 0) / Math.min(7, sleepLogs.length)
          const avgHours = sleepLogs.slice(0, 7).reduce((s: number, l: any) => s + (l.duration_minutes || 420) / 60, 0) / Math.min(7, sleepLogs.length)
          const healthScore = Math.round((avgQuality / 5) * 5 + (Math.min(avgHours, 9) / 9) * 5)
          newScores[0] = { ...newScores[0], score: Math.max(1, Math.min(10, healthScore)) }
        }

        // Growth: based on habit completion rate
        if (habits.length > 0) {
          const completedToday = habits.filter((h: any) => h.completedToday).length
          const rate = habits.length > 0 ? (completedToday / habits.length) * 10 : 5
          newScores[4] = { ...newScores[4], score: Math.max(1, Math.min(10, Math.round(rate))) }
        }

        // Load saved wheel from localStorage if available
        const stored = localStorage.getItem('life_wheel_scores')
        if (stored) {
          const saved = JSON.parse(stored) as Record<string, number>
          const restored = AREAS.map((a, i) => ({
            ...a,
            score: saved[a.id] ?? newScores[i].score,
          }))
          setScores(restored)
        } else {
          setScores(newScores)
        }
        setDataLoaded(true)
      } catch {
        setDataLoaded(true)
      }
    }
    fetchData()
  }, [])

  const updateScore = (idx: number, score: number) => {
    setScores(prev => prev.map((a, i) => i === idx ? { ...a, score } : a))
    setSaved(false)
  }

  const saveScores = () => {
    const obj: Record<string, number> = {}
    scores.forEach(a => { obj[a.id] = a.score })
    localStorage.setItem('life_wheel_scores', JSON.stringify(obj))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const avgScore = scores.reduce((s, a) => s + a.score, 0) / scores.length
  const lowestArea = scores.reduce((min, a) => a.score < min.score ? a : min)
  const highestArea = scores.reduce((max, a) => a.score > max.score ? a : max)
  const imbalance = Math.max(...scores.map(a => a.score)) - Math.min(...scores.map(a => a.score))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Life Balance Wheel
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Rate each life area to see your balance</p>
        </div>
        <button onClick={saveScores}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            saved ? 'bg-green-600/30 text-green-400 border border-green-500/30' : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {/* Wheel */}
      <div className="game-card p-4">
        <WheelSVG scores={scores} hoveredIdx={hoveredIdx} setHoveredIdx={setHoveredIdx} />
      </div>

      {/* Hovered area detail */}
      {hoveredIdx !== null && (
        <div className="game-card p-3 border" style={{ borderColor: scores[hoveredIdx].color + '40' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200" style={{ color: scores[hoveredIdx].color }}>
                {scores[hoveredIdx].label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{scores[hoveredIdx].description}</div>
            </div>
            <div className="text-3xl font-bold" style={{ color: scores[hoveredIdx].color }}>
              {scores[hoveredIdx].score}/10
            </div>
          </div>
        </div>
      )}

      {/* Score sliders */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Rate Each Area (1–10)</h3>
        {scores.map((area, i) => (
          <div key={area.id} className="game-card p-3"
            onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm font-semibold text-slate-300">{area.label}</div>
              <input type="range" min="1" max="10" value={area.score}
                onChange={e => updateScore(i, parseInt(e.target.value))}
                className="flex-1"
                style={{ accentColor: area.color }} />
              <div className="w-16 text-right">
                <span className="text-lg font-bold" style={{ color: area.color }}>{area.score}</span>
                <span className="text-xs text-slate-600 block leading-none">{SCORE_LABELS[area.score]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{avgScore.toFixed(1)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Average score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: highestArea.color }}>{highestArea.score}</div>
          <div className="text-xs text-slate-500 mt-0.5">Best: {highestArea.label}</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: lowestArea.color }}>{lowestArea.score}</div>
          <div className="text-xs text-slate-500 mt-0.5">Needs work: {lowestArea.label}</div>
        </div>
      </div>

      {/* Insight cards */}
      <div className="space-y-2">
        <div className="game-card p-3 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm text-slate-300">
              {imbalance <= 2
                ? 'Your life is well-balanced across all areas.'
                : imbalance <= 4
                  ? `Moderate imbalance detected. Focus more on ${lowestArea.label}.`
                  : `Significant imbalance — ${lowestArea.label} (${lowestArea.score}/10) needs urgent attention.`}
            </div>
            {lowestArea.score <= 4 && (
              <div className="text-xs text-slate-500 mt-1">
                Consider dedicating specific time blocks to improve your {lowestArea.label.toLowerCase()} score.
              </div>
            )}
          </div>
        </div>
        {avgScore >= 7 && (
          <div className="game-card p-3 text-center text-sm text-green-400 font-semibold">
            🏆 Outstanding life balance! You're thriving across most areas.
          </div>
        )}
      </div>
    </div>
  )
}
