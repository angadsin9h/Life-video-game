interface StatCardProps {
  label: string
  value: number
  maxValue: number
  color: string
  icon: React.ReactNode
}

export default function StatCard({ label, value, maxValue, color, icon }: StatCardProps) {
  const pct = Math.min(100, Math.round((value / maxValue) * 100))

  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-200">
          {value}<span className="text-slate-500 text-xs">/{maxValue}</span>
        </span>
      </div>
      <div className="stat-bar">
        <div
          className={`stat-bar-fill ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
