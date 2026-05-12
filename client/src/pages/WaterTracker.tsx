import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Droplets, Plus, Minus, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface WaterLog {
  date: string
  glasses: number
  goal: number
}

function GlassIcon({ filled, size = 'md' }: { filled: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-10 h-12' : size === 'sm' ? 'w-6 h-8' : 'w-8 h-10'
  return (
    <svg viewBox="0 0 30 40" className={s}>
      {/* Glass shape */}
      <path d="M5,3 L8,37 H22 L25,3 Z" fill="none" stroke={filled ? '#38bdf8' : '#334155'} strokeWidth="2" strokeLinejoin="round" />
      {filled && (
        <path d="M8,37 L9,10 H21 L22,37 Z" fill="#0ea5e940" />
      )}
      {filled && (
        <path d="M8.5,37 L9.5,12 H20.5 L21.5,37 Z" fill="#38bdf8" opacity="0.6" />
      )}
    </svg>
  )
}

function WaterBottle({ pct }: { pct: number }) {
  const fillH = Math.round(pct * 80)
  return (
    <svg viewBox="0 0 60 140" className="w-16 h-40 mx-auto">
      {/* Bottle outline */}
      <path d="M22,10 L22,5 L38,5 L38,10 Q45,15 45,25 L45,115 Q45,130 30,130 Q15,130 15,115 L15,25 Q15,15 22,10 Z"
        fill="none" stroke="#334155" strokeWidth="2" />
      {/* Water fill */}
      {pct > 0 && (
        <clipPath id="bottle-clip">
          <path d="M22,10 L22,5 L38,5 L38,10 Q45,15 45,25 L45,115 Q45,130 30,130 Q15,130 15,115 L15,25 Q15,15 22,10 Z" />
        </clipPath>
      )}
      {pct > 0 && (
        <rect x="0" y={130 - fillH} width="60" height={fillH + 10}
          fill="#38bdf8" opacity="0.5" clipPath="url(#bottle-clip)" />
      )}
      {pct > 0 && (
        <rect x="0" y={130 - fillH} width="60" height="4"
          fill="#7dd3fc" opacity="0.7" clipPath="url(#bottle-clip)" />
      )}
      {/* Percentage text */}
      <text x="30" y="75" textAnchor="middle" fill={pct > 0.5 ? '#0f172a' : '#94a3b8'} fontSize="11" fontWeight="700">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

export default function WaterTracker() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<WaterLog>({ date: today, glasses: 0, goal: 8 })
  const [history, setHistory] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState(8)
  const [editGoal, setEditGoal] = useState(false)

  const load = useCallback(async () => {
    const [todayRes, histRes] = await Promise.all([
      axios.get<WaterLog>(`/api/water/${today}`),
      axios.get<WaterLog[]>('/api/water/history/week'),
    ])
    setLog(todayRes.data)
    setGoal(todayRes.data.goal || 8)
    setHistory(histRes.data)
  }, [today])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const update = async (newGlasses: number, newGoal?: number) => {
    const g = newGoal ?? goal
    const res = await axios.post<WaterLog>(`/api/water/${today}`, { glasses: newGlasses, goal: g })
    setLog(res.data)
    if (newGlasses === g) toastSuccess(`Goal reached! 💧`)
  }

  const add = () => {
    if (log.glasses < 20) update(log.glasses + 1)
  }

  const remove = () => {
    if (log.glasses > 0) update(log.glasses - 1)
  }

  const saveGoal = () => {
    update(log.glasses, goal)
    setEditGoal(false)
    toastSuccess('Goal updated!')
  }

  const pct = Math.min(1, log.glasses / (log.goal || 8))
  const avgWeek = history.reduce((s, h) => s + h.glasses, 0) / Math.max(1, history.length)
  const daysHitGoal = history.filter(h => h.glasses >= h.goal).length

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Droplets className="w-7 h-7 text-blue-400" />
          Water Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Stay hydrated for peak performance</p>
      </div>

      {/* Main tracker */}
      <div className="game-card p-6 text-center border border-blue-500/20">
        <WaterBottle pct={pct} />

        <div className="mt-4">
          <div className="text-4xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {log.glasses}
            <span className="text-xl text-slate-500">/{log.goal}</span>
          </div>
          <div className="text-slate-400 text-sm mt-1">glasses today</div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${pct * 100}%` }} />
        </div>

        {pct >= 1 && (
          <div className="mt-2 text-sm text-blue-400 font-semibold">💧 Daily goal reached!</div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <button onClick={remove} disabled={log.glasses === 0}
            className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors disabled:opacity-30 text-xl">
            <Minus className="w-5 h-5" />
          </button>
          <button onClick={add} disabled={log.glasses >= 20}
            className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-blue-500/30 disabled:opacity-30">
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={remove} disabled={log.glasses === 0} className="w-12 h-12 opacity-0 pointer-events-none">
            {/* spacer */}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2">Tap + to add a glass of water</p>
      </div>

      {/* Glass grid */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-400">Today's Glasses</span>
          {editGoal ? (
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="20" value={goal}
                onChange={e => setGoal(parseInt(e.target.value) || 8)}
                className="game-input w-16 text-sm text-center" />
              <button onClick={saveGoal} className="text-xs text-blue-400 hover:text-blue-300">Save</button>
            </div>
          ) : (
            <button onClick={() => setEditGoal(true)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Goal: {log.goal} glasses
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: log.goal }).map((_, i) => (
            <button key={i} onClick={() => update(i < log.glasses ? i : i + 1)}
              className="transition-transform hover:scale-110">
              <GlassIcon filled={i < log.glasses} size="md" />
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{avgWeek.toFixed(1)}</div>
          <div className="text-xs text-slate-500">7-day avg</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{daysHitGoal}</div>
          <div className="text-xs text-slate-500">Goals hit</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{Math.round(log.glasses * 250)}ml</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
      </div>

      {/* 7-day history */}
      <div className="game-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-400">This Week</span>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {history.map(h => {
            const barPct = Math.min(1, h.glasses / Math.max(h.goal, 1))
            const isToday = h.date === today
            return (
              <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm transition-all duration-500 relative"
                  style={{ height: `${Math.max(4, barPct * 52)}px`, backgroundColor: isToday ? '#3b82f6' : h.glasses >= h.goal ? '#22c55e' : '#334155' }}>
                  {h.glasses >= h.goal && !isToday && (
                    <div className="absolute -top-1 left-0 right-0 flex justify-center">
                      <div className="w-1 h-1 rounded-full bg-green-400" />
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-600">
                  {new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-600">Mon</span>
          <span className="text-xs text-slate-600">Sun</span>
        </div>
      </div>
    </div>
  )
}
