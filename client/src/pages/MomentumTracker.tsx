import { useState, useEffect, useMemo } from 'react'
import { Zap, Flame, TrendingUp, TrendingDown, Calendar, ChevronRight, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'momentum_tracker_log'

interface MomentumEntry {
  date: string
  morningScore: number
  afternoonScore: number
  eveningScore: number
  biggestAction: string
  momentumKiller: string
  tomorrowFuel: string
  overallMomentum: number
  momentumScore: number
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function loadEntries(): MomentumEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MomentumEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: MomentumEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function calcScore(m: number, a: number, e: number, o: number): number {
  return Math.round(((m + a + e + o) / 4) * 10)
}

function calcStreak(entries: MomentumEntry[]): number {
  if (entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today)
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]
    if (sorted[i].date !== expectedStr) break
    if (sorted[i].momentumScore > 60) streak++
    else break
  }
  return streak
}

interface SliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}

function Slider({ label, value, onChange, color }: SliderProps) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm text-slate-300">{label}</label>
        <span className={`text-sm font-bold ${color}`}>{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-violet-500"
      />
    </div>
  )
}

export default function MomentumTracker() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MomentumEntry[]>(loadEntries)
  const today = todayStr()

  const existing = entries.find(e => e.date === today)

  const [morningScore, setMorningScore] = useState<number>(existing?.morningScore ?? 5)
  const [afternoonScore, setAfternoonScore] = useState<number>(existing?.afternoonScore ?? 5)
  const [eveningScore, setEveningScore] = useState<number>(existing?.eveningScore ?? 5)
  const [biggestAction, setBiggestAction] = useState<string>(existing?.biggestAction ?? '')
  const [momentumKiller, setMomentumKiller] = useState<string>(existing?.momentumKiller ?? '')
  const [tomorrowFuel, setTomorrowFuel] = useState<string>(existing?.tomorrowFuel ?? '')
  const [overallMomentum, setOverallMomentum] = useState<number>(existing?.overallMomentum ?? 5)

  const momentumScore = calcScore(morningScore, afternoonScore, eveningScore, overallMomentum)

  const streak = useMemo(() => calcStreak(entries), [entries])

  const last14: { date: string; score: number }[] = useMemo(() => {
    const days: { date: string; score: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const found = entries.find(e => e.date === ds)
      days.push({ date: ds, score: found ? found.momentumScore : 0 })
    }
    return days
  }, [entries])

  const velocity: 'up' | 'down' | 'flat' = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
    const last7 = sorted.slice(0, 7)
    const prev7 = sorted.slice(7, 14)
    if (last7.length < 3 || prev7.length < 3) return 'flat'
    const avg = (arr: MomentumEntry[]) => arr.reduce((s, e) => s + e.momentumScore, 0) / arr.length
    const diff = avg(last7) - avg(prev7)
    if (diff > 3) return 'up'
    if (diff < -3) return 'down'
    return 'flat'
  }, [entries])

  const last5 = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  }, [entries])

  function handleSave() {
    const entry: MomentumEntry = {
      date: today,
      morningScore,
      afternoonScore,
      eveningScore,
      biggestAction,
      momentumKiller,
      tomorrowFuel,
      overallMomentum,
      momentumScore,
    }
    const updated = entries.filter(e => e.date !== today)
    updated.push(entry)
    saveEntries(updated)
    setEntries(updated)
    toastSuccess('Momentum logged!', `Score: ${momentumScore}/100`)
  }

  const scoreColor = momentumScore >= 70 ? 'text-green-400' : momentumScore >= 50 ? 'text-amber-400' : 'text-red-400'

  const chartPoints = useMemo(() => {
    const W = 400
    const H = 80
    const pad = 8
    const chartW = W - pad * 2
    const chartH = H - pad * 2
    const pts = last14.map((d, i) => {
      const x = pad + (i / 13) * chartW
      const y = d.score > 0 ? pad + chartH - (d.score / 100) * chartH : H - pad
      return `${x},${y}`
    })
    return { pts, W, H, pad }
  }, [last14])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Zap className="w-8 h-8 text-amber-400" />
          Momentum Tracker
        </h1>
        <p className="text-slate-400 mt-1">Track the compounding effect of consistent positive actions</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-500">Momentum Streak</div>
        </div>
        <div className="game-card p-4 text-center">
          {velocity === 'up' ? (
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
          ) : velocity === 'down' ? (
            <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-1" />
          ) : (
            <BarChart3 className="w-6 h-6 text-slate-400 mx-auto mb-1" />
          )}
          <div className={`text-lg font-bold ${velocity === 'up' ? 'text-green-400' : velocity === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
            {velocity === 'up' ? 'Rising' : velocity === 'down' ? 'Falling' : 'Steady'}
          </div>
          <div className="text-xs text-slate-500">Velocity</div>
        </div>
        <div className="game-card p-4 text-center">
          <Zap className="w-6 h-6 text-violet-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{entries.length}</div>
          <div className="text-xs text-slate-500">Days Logged</div>
        </div>
      </div>

      {/* 14-day chart */}
      {entries.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            14-Day Momentum Chart
          </h3>
          <svg viewBox={`0 0 ${chartPoints.W} ${chartPoints.H}`} className="w-full" style={{ height: 80 }}>
            <defs>
              <linearGradient id="momGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <polyline
              points={chartPoints.pts.join(' ') + ` ${400 - chartPoints.pad},${chartPoints.H - chartPoints.pad} ${chartPoints.pad},${chartPoints.H - chartPoints.pad}`}
              fill="url(#momGrad)"
              stroke="none"
            />
            <polyline
              points={chartPoints.pts.join(' ')}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {last14.map((d, i) => {
              if (d.score === 0) return null
              const [x, y] = chartPoints.pts[i].split(',').map(Number)
              return <circle key={d.date} cx={x} cy={y} r="3" fill="#8b5cf6" stroke="#0f172a" strokeWidth="1.5" />
            })}
          </svg>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>{last14[0].date.slice(5)}</span>
            <span>Score (0-100)</span>
            <span>{last14[13].date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Log form */}
      <div className="game-card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            {existing ? 'Update Today' : "Log Today's Momentum"}
          </h3>
          <span className="text-slate-500 text-sm">{today}</span>
        </div>

        <Slider label="Morning Score" value={morningScore} onChange={setMorningScore} color="text-amber-400" />
        <Slider label="Afternoon Score" value={afternoonScore} onChange={setAfternoonScore} color="text-blue-400" />
        <Slider label="Evening Score" value={eveningScore} onChange={setEveningScore} color="text-violet-400" />
        <Slider label="Overall Momentum" value={overallMomentum} onChange={setOverallMomentum} color="text-green-400" />

        <div>
          <label className="text-sm text-slate-300 block mb-1">Biggest Momentum-Building Action</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="The most momentum-building thing you did..."
            value={biggestAction}
            onChange={e => setBiggestAction(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-1">Momentum Killer</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="What slowed you down?"
            value={momentumKiller}
            onChange={e => setMomentumKiller(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-1">Tomorrow's Fuel</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="What will carry momentum into tomorrow?"
            value={tomorrowFuel}
            onChange={e => setTomorrowFuel(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div>
            <span className="text-sm text-slate-400">Momentum Score</span>
            <div className={`text-3xl font-bold ${scoreColor}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {momentumScore}<span className="text-lg text-slate-500">/100</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {existing ? 'Update' : 'Log Momentum'}
          </button>
        </div>
      </div>

      {/* Last 5 entries */}
      {last5.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">Recent Entries</h3>
          <div className="space-y-3">
            {last5.map(entry => (
              <div key={entry.date} className="flex items-start gap-4 p-3 bg-slate-800/50 rounded-lg">
                <div className="text-center min-w-[48px]">
                  <div className={`text-lg font-bold ${entry.momentumScore >= 70 ? 'text-green-400' : entry.momentumScore >= 50 ? 'text-amber-400' : 'text-red-400'}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {entry.momentumScore}
                  </div>
                  <div className="text-xs text-slate-600">{entry.date.slice(5)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  {entry.biggestAction && (
                    <p className="text-sm text-slate-300 truncate">
                      <span className="text-slate-500">Action:</span> {entry.biggestAction}
                    </p>
                  )}
                  {entry.tomorrowFuel && (
                    <p className="text-sm text-slate-400 truncate">
                      <span className="text-slate-500">Fuel:</span> {entry.tomorrowFuel}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
