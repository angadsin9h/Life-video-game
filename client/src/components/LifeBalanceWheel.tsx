interface Attribute {
  label: string
  value: number
  max: number
  color: string
  icon: string
}

interface Props {
  attributes: Attribute[]
  size?: number
}

export default function LifeBalanceWheel({ attributes, size = 220 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.42
  const n = attributes.length
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const angle = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2
  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  })

  const polygon = (radiusFraction: number) =>
    attributes.map((_, i) => {
      const p = pt(i, R * radiusFraction)
      return `${p.x},${p.y}`
    }).join(' ')

  const valuePath = attributes.map((a, i) => {
    const frac = Math.min(1, (a.value / a.max) || 0)
    const p = pt(i, R * frac)
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  }).join(' ') + ' Z'

  const averageFrac = attributes.length > 0
    ? attributes.reduce((sum, a) => sum + Math.min(1, (a.value / a.max) || 0), 0) / attributes.length
    : 0

  const balanceColor = averageFrac >= 0.7 ? '#22c55e' : averageFrac >= 0.5 ? '#8b5cf6' : averageFrac >= 0.3 ? '#f59e0b' : '#64748b'

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid rings */}
        {levels.map(frac => (
          <polygon
            key={frac}
            points={polygon(frac)}
            fill="none"
            stroke="#1e293b"
            strokeWidth={frac === 1 ? 1.5 : 1}
            strokeDasharray={frac < 1 ? '3,4' : undefined}
          />
        ))}

        {/* Spokes */}
        {attributes.map((_, i) => {
          const outer = pt(i, R)
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={outer.x} y2={outer.y}
              stroke="#1e293b"
              strokeWidth="1"
            />
          )
        })}

        {/* Value area */}
        <path
          d={valuePath}
          fill={`${balanceColor}25`}
          stroke={balanceColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Value dots */}
        {attributes.map((a, i) => {
          const frac = Math.min(1, (a.value / a.max) || 0)
          const p = pt(i, R * frac)
          return (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill={a.color} stroke="#0f172a" strokeWidth="1.5" />
          )
        })}

        {/* Labels */}
        {attributes.map((a, i) => {
          const p = pt(i, R + 22)
          const textAnchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle'
          return (
            <g key={i}>
              <text
                x={p.x}
                y={p.y - 5}
                textAnchor={textAnchor}
                fontSize="10"
                fill="#94a3b8"
                fontWeight="500"
              >
                {a.icon}
              </text>
              <text
                x={p.x}
                y={p.y + 7}
                textAnchor={textAnchor}
                fontSize="9"
                fill="#64748b"
              >
                {a.label}
              </text>
            </g>
          )
        })}

        {/* Center score */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="bold" fill={balanceColor} fontFamily="Orbitron, monospace">
          {Math.round(averageFrac * 100)}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="#475569">
          balance
        </text>
      </svg>
    </div>
  )
}
