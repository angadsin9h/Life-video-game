interface DataPoint {
  date: string
  score: number
}

interface Props {
  data: DataPoint[]
  height?: number
  showLabels?: boolean
  className?: string
}

export default function ScoreSparkline({ data, height = 80, showLabels = false, className = '' }: Props) {
  if (!data || data.length < 2) {
    return <div className={`h-${height / 4} bg-slate-800 rounded animate-pulse ${className}`} />
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
  const values = sorted.map(d => d.score)
  const min = Math.min(...values)
  const max = Math.max(...values, 10)
  const W = 400
  const H = height
  const pad = { top: 8, bottom: showLabels ? 20 : 8, left: 4, right: 4 }
  const chartH = H - pad.top - pad.bottom
  const chartW = W - pad.left - pad.right

  const toX = (i: number) => pad.left + (i / (sorted.length - 1)) * chartW
  const toY = (v: number) => pad.top + chartH - ((v - min) / (max - min || 1)) * chartH

  const pathD = sorted.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.score)}`).join(' ')
  const areaD = `${pathD} L ${toX(sorted.length - 1)} ${H - pad.bottom} L ${pad.left} ${H - pad.bottom} Z`

  const last = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  const trend = last.score >= prev.score ? 'up' : 'down'
  const trendColor = trend === 'up' ? '#22c55e' : '#f87171'

  // Color based on average score
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const lineColor = avg >= 80 ? '#22c55e' : avg >= 60 ? '#eab308' : avg >= 40 ? '#f97316' : '#8b5cf6'
  const areaColor = avg >= 80 ? '#22c55e20' : avg >= 60 ? '#eab30820' : avg >= 40 ? '#f9741620' : '#8b5cf620'

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[25, 50, 75, 100].map(y => {
          const yPos = toY(y)
          if (yPos < pad.top || yPos > H - pad.bottom) return null
          return (
            <line
              key={y}
              x1={pad.left} y1={yPos} x2={W - pad.right} y2={yPos}
              stroke="#1e293b" strokeWidth="1" strokeDasharray="2,4"
            />
          )
        })}

        {/* Area fill */}
        <path d={areaD} fill={areaColor} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Today's dot */}
        <circle
          cx={toX(sorted.length - 1)}
          cy={toY(last.score)}
          r="4"
          fill={trendColor}
          stroke="#0f172a"
          strokeWidth="2"
        />

        {showLabels && sorted.length > 0 && (
          <>
            <text x={pad.left} y={H - 4} fontSize="9" fill="#475569">
              {sorted[0].date.slice(5)}
            </text>
            <text x={W - pad.right} y={H - 4} fontSize="9" fill="#475569" textAnchor="end">
              {last.date.slice(5)}
            </text>
          </>
        )}
      </svg>

      {/* Latest score badge */}
      <div className="absolute top-1 right-2 text-right">
        <div className="text-xs text-slate-500">Latest</div>
        <div className="text-sm font-bold" style={{ color: lineColor, fontFamily: 'Orbitron, monospace' }}>
          {last.score}
        </div>
      </div>
    </div>
  )
}
