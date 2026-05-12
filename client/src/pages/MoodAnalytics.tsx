import { useEffect, useState } from 'react'
import axios from 'axios'
import { Heart, TrendingUp, BarChart3, Zap } from 'lucide-react'

interface DataPoint {
  date: string
  mood: number
  score: number
  moodLabel: string
  moodEmoji: string
}

interface MoodBucket {
  label: string
  emoji: string
  count: number
  avgScore: number
}

interface CorrelationData {
  dataPoints: DataPoint[]
  moodScoreMap: Record<number, MoodBucket>
  correlation: number | null
}

const MOOD_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#facc15', 4: '#4ade80', 5: '#8b5cf6'
}
const MOOD_BAR: Record<number, string> = {
  1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-400', 5: 'bg-violet-500'
}

function correlationLabel(r: number | null): { label: string; color: string; desc: string } {
  if (r === null) return { label: 'Calculating…', color: 'text-slate-500', desc: 'Log more data to see correlation' }
  if (r >= 0.6)  return { label: 'Strong Positive', color: 'text-green-400', desc: 'Higher mood strongly predicts higher score' }
  if (r >= 0.3)  return { label: 'Moderate Positive', color: 'text-cyan-400', desc: 'Mood and score tend to rise together' }
  if (r >= 0.1)  return { label: 'Weak Positive', color: 'text-blue-400', desc: 'Slight tendency to move together' }
  if (r >= -0.1) return { label: 'No Correlation', color: 'text-slate-400', desc: 'Mood and productivity are independent' }
  if (r >= -0.3) return { label: 'Weak Negative', color: 'text-orange-400', desc: 'Sometimes mood inversely relates to score' }
  return { label: 'Negative Correlation', color: 'text-red-400', desc: 'High mood days may coincide with lower scores' }
}

function ScatterDot({ x: px, y: py, mood, score, date }: { x: number; y: number; mood: number; score: number; date: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <g>
      <circle
        cx={px}
        cy={py}
        r={hovered ? 7 : 5}
        fill={MOOD_COLORS[mood]}
        opacity={0.85}
        style={{ cursor: 'pointer', transition: 'r 0.1s' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {hovered && (
        <g>
          <rect x={px + 8} y={py - 20} width={100} height={36} fill="#0f172a" rx="4" stroke="#334155" strokeWidth="1" />
          <text x={px + 14} y={py - 6} fontSize="10" fill="#e2e8f0">{date}</text>
          <text x={px + 14} y={py + 8} fontSize="10" fill={MOOD_COLORS[mood]}>Mood: {mood} · Score: {score}</text>
        </g>
      )}
    </g>
  )
}

export default function MoodAnalytics() {
  const [data, setData] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get<CorrelationData>('/api/mood/correlation?days=60')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
    </div>
  )

  const corr = data?.correlation ?? null
  const corrInfo = correlationLabel(corr)
  const points = data?.dataPoints ?? []
  const moodMap = data?.moodScoreMap ?? {}

  // Scatter plot data
  const W = 400; const H = 240; const PAD = 40
  const maxScore = Math.max(...points.map(p => p.score), 100)
  const toX = (mood: number) => PAD + ((mood - 1) / 4) * (W - PAD * 2)
  const toY = (score: number) => H - PAD - (score / maxScore) * (H - PAD * 1.5)

  // Avg score per mood for bar chart
  const moodEntries = [1, 2, 3, 4, 5].map(m => ({ mood: m, ...(moodMap[m] ?? { label: '?', emoji: '?', count: 0, avgScore: 0 }) }))
  const maxAvg = Math.max(...moodEntries.map(m => m.avgScore), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Heart className="w-8 h-8 text-pink-400" />
          Mood Analytics
        </h1>
        <p className="text-slate-400 mt-1">How your mood correlates with productivity</p>
      </div>

      {/* Correlation score */}
      <div className="game-card p-6 text-center">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Pearson Correlation (r)</div>
        <div className={`text-5xl font-bold mb-2 ${corrInfo.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {corr !== null ? (corr > 0 ? '+' : '') + corr.toFixed(2) : '—'}
        </div>
        <div className={`text-lg font-semibold ${corrInfo.color} mb-1`}>{corrInfo.label}</div>
        <div className="text-sm text-slate-500">{corrInfo.desc}</div>
        <div className="text-xs text-slate-600 mt-2">Based on {points.length} paired mood+score days</div>
      </div>

      {/* Scatter plot */}
      {points.length >= 3 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            Mood vs. Daily Score
          </h3>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '260px' }}>
              {/* Grid lines */}
              {[25, 50, 75, 100].map(v => {
                const y = toY(v)
                return (
                  <g key={v}>
                    <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#1e293b" strokeWidth="1" />
                    <text x={PAD - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#334155">{v}</text>
                  </g>
                )
              })}
              {/* X axis mood labels */}
              {[1, 2, 3, 4, 5].map(m => (
                <text key={m} x={toX(m)} y={H - 4} textAnchor="middle" fontSize="12" fill="#475569">
                  {['😭','😔','😐','😊','🤩'][m - 1]}
                </text>
              ))}
              {/* Axis labels */}
              <text x={PAD} y={H - 16} fontSize="8" fill="#334155">Mood 1</text>
              <text x={W - PAD} y={H - 16} textAnchor="end" fontSize="8" fill="#334155">Mood 5</text>
              {/* Trend line */}
              {corr !== null && points.length >= 3 && (() => {
                const n = points.length
                const meanMood = points.reduce((s, p) => s + p.mood, 0) / n
                const meanScore = points.reduce((s, p) => s + p.score, 0) / n
                const b = points.reduce((s, p) => s + (p.mood - meanMood) * (p.score - meanScore), 0) /
                          points.reduce((s, p) => s + (p.mood - meanMood) ** 2, 0)
                const a = meanScore - b * meanMood
                const x1 = 1; const x2 = 5
                const y1 = a + b * x1; const y2 = a + b * x2
                return (
                  <line
                    x1={toX(x1)} y1={toY(y1)} x2={toX(x2)} y2={toY(y2)}
                    stroke="#8b5cf680" strokeWidth="2" strokeDasharray="4,3"
                  />
                )
              })()}
              {/* Data points */}
              {points.map(p => (
                <ScatterDot key={p.date} x={toX(p.mood)} y={toY(p.score)} mood={p.mood} score={p.score} date={p.date} />
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Avg score per mood */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Average Score by Mood
        </h3>
        <div className="space-y-3">
          {moodEntries.map(({ mood, emoji, label, count, avgScore }) => (
            <div key={mood} className={count === 0 ? 'opacity-30' : ''}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emoji}</span>
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className="text-xs text-slate-600">({count} days)</span>
                </div>
                <span className={`text-sm font-bold ${MOOD_BAR[mood].replace('bg-', 'text-')}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {avgScore > 0 ? `${avgScore} pts` : '—'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${MOOD_BAR[mood]} rounded-full transition-all duration-700`}
                  style={{ width: `${(avgScore / maxAvg) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      {points.length >= 5 && (
        <div className="game-card p-5 border border-violet-500/20">
          <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Key Insight
          </h3>
          {(() => {
            const best = moodEntries.filter(m => m.count > 0).sort((a, b) => b.avgScore - a.avgScore)[0]
            const worst = moodEntries.filter(m => m.count > 0).sort((a, b) => a.avgScore - b.avgScore)[0]
            const diff = best?.avgScore - worst?.avgScore
            return (
              <p className="text-sm text-slate-400">
                On your <span className="text-slate-200 font-semibold">{best?.emoji} {best?.label}</span> days, you average{' '}
                <span className="text-violet-400 font-bold">{best?.avgScore} pts</span> — that's{' '}
                <span className="text-green-400 font-bold">+{diff} pts</span> more than your{' '}
                <span className="text-slate-200 font-semibold">{worst?.emoji} {worst?.label}</span> days ({worst?.avgScore} pts).{' '}
                {corr !== null && corr >= 0.3 && 'Your mood is a strong predictor of your output — invest in how you feel.'}
                {corr !== null && corr < 0.3 && corr >= -0.1 && 'You\'re able to perform regardless of how you feel — impressive discipline.'}
              </p>
            )
          })()}
        </div>
      )}

      {points.length < 3 && (
        <div className="text-center py-8 text-slate-500">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Log your mood daily for at least 3 days to see analytics.</p>
        </div>
      )}
    </div>
  )
}
