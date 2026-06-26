import React, { useState, useEffect } from 'react'
import { Moon, Plus, Trash2, TrendingDown, TrendingUp, Clock, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SleepNight = {
  id: string
  date: string
  targetHours: number
  actualHours: number
  quality: number
  bedtime: string
  wakeTime: string
  wakeUps: number
  dreamRecall: boolean
  notes: string
}

const STORAGE_KEY = 'lq-sleepdebtlog'

const DEFAULT_FORM: Omit<SleepNight, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  targetHours: 8,
  actualHours: 7,
  quality: 7,
  bedtime: '23:00',
  wakeTime: '06:00',
  wakeUps: 0,
  dreamRecall: false,
  notes: '',
}

function debtColor(debt: number): string {
  if (debt > 5) return '#ef4444'
  if (debt > 2) return '#f59e0b'
  return '#22c55e'
}

function debtLabel(debt: number): string {
  if (debt > 5) return 'Critical Debt'
  if (debt > 2) return 'Moderate Debt'
  if (debt > 0) return 'Minor Debt'
  return 'In Surplus'
}

function parseHM(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

export default function SleepDebtLog() {
  const { toastSuccess } = useToast()
  const [nights, setNights] = useState<SleepNight[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SleepNight, 'id'>>(DEFAULT_FORM)

  useEffect(() => {
    try { setNights(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (u: SleepNight[]) => {
    setNights(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const submit = () => {
    const n: SleepNight = { id: Date.now().toString(), ...form }
    const updated = [n, ...nights].sort((a, b) => b.date.localeCompare(a.date))
    persist(updated)
    setForm({ ...DEFAULT_FORM, date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    toastSuccess('Night logged', `${form.actualHours}h actual vs ${form.targetHours}h target`)
  }

  const sorted = [...nights].sort((a, b) => b.date.localeCompare(a.date))
  const last7 = sorted.slice(0, 7)
  const last14 = sorted.slice(0, 14)
  const last30 = sorted.slice(0, 30)

  const rollingDebt7 = last7.reduce((s, n) => s + (n.targetHours - n.actualHours), 0)
  const rollingDebt14 = last14.reduce((s, n) => s + (n.targetHours - n.actualHours), 0)
  const avgQuality = last7.length
    ? Math.round(last7.reduce((s, n) => s + n.quality, 0) / last7.length * 10) / 10
    : 0

  const cumulativeDebt = (() => {
    const pts = [...last30].reverse()
    let cum = 0
    return pts.map(n => {
      cum += n.targetHours - n.actualHours
      return { date: n.date, cum }
    })
  })()

  const SVG_W = 340
  const SVG_H = 100
  const pad = { l: 28, r: 8, t: 8, b: 20 }

  const ChartArea = () => {
    if (cumulativeDebt.length < 2) return (
      <div className="flex items-center justify-center h-24 text-slate-600 text-xs">Log at least 2 nights to see chart</div>
    )
    const vals = cumulativeDebt.map(p => p.cum)
    const minV = Math.min(...vals)
    const maxV = Math.max(...vals)
    const range = maxV - minV || 1
    const n = vals.length
    const xScale = (i: number) => pad.l + (i / (n - 1)) * (SVG_W - pad.l - pad.r)
    const yScale = (v: number) => pad.t + (1 - (v - minV) / range) * (SVG_H - pad.t - pad.b)
    const zero = yScale(0)

    const points = vals.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ')
    const firstX = xScale(0)
    const lastX = xScale(n - 1)

    const posPoints = vals.map((v, i) => `${xScale(i)},${Math.min(yScale(v), zero)}`).join(' ')
    const negPoints = vals.map((v, i) => `${xScale(i)},${Math.max(yScale(v), zero)}`).join(' ')

    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height={SVG_H}>
        <defs>
          <linearGradient id="debtRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="surplusGreen" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <line x1={pad.l} y1={zero} x2={lastX} y2={zero} stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
        <polygon
          points={`${firstX},${zero} ${posPoints} ${lastX},${zero}`}
          fill="url(#debtRed)"
        />
        <polygon
          points={`${firstX},${zero} ${negPoints} ${lastX},${zero}`}
          fill="url(#surplusGreen)"
        />
        <polyline points={points} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
        {vals.map((v, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(v)} r="2.5"
            fill={v > 0 ? '#ef4444' : '#22c55e'} />
        ))}
        <text x={pad.l - 2} y={pad.t + 4} fontSize="8" fill="#475569" textAnchor="end">{maxV.toFixed(1)}</text>
        <text x={pad.l - 2} y={SVG_H - pad.b + 4} fontSize="8" fill="#475569" textAnchor="end">{minV.toFixed(1)}</text>
      </svg>
    )
  }

  const ScatterChart = () => {
    if (last14.length < 2) return (
      <div className="flex items-center justify-center h-24 text-slate-600 text-xs">Log at least 2 nights to see scatter</div>
    )
    const btimes = last14.map(n => parseHM(n.bedtime))
    const wtimes = last14.map(n => parseHM(n.wakeTime))
    const allX = btimes
    const allY = wtimes
    const minX = Math.min(...allX), maxX = Math.max(...allX) || minX + 1
    const minY = Math.min(...allY), maxY = Math.max(...allY) || minY + 1
    const xS = (v: number) => pad.l + ((v - minX) / (maxX - minX || 1)) * (SVG_W - pad.l - pad.r)
    const yS = (v: number) => pad.t + (1 - (v - minY) / (maxY - minY || 1)) * (SVG_H - pad.t - pad.b)

    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height={SVG_H}>
        {last14.map((n, i) => (
          <g key={n.id}>
            <circle cx={xS(btimes[i])} cy={yS(wtimes[i])} r="3.5" fill="#818cf8" fillOpacity="0.7" />
          </g>
        ))}
        <text x={pad.l} y={SVG_H - 4} fontSize="8" fill="#475569">Bedtime →</text>
        <text x="4" y={pad.t + 10} fontSize="8" fill="#475569">Wake</text>
      </svg>
    )
  }

  const recoveryDays = rollingDebt7 > 0
    ? Math.ceil(rollingDebt7 / 1.5)
    : 0

  const heroColor = debtColor(rollingDebt7)

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-300" />
            Sleep Debt Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and eliminate the compound cost of under-sleeping.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#312e81' }}
        >
          <Plus className="w-4 h-4" /> Log Night
        </button>
      </div>

      <div className="game-card p-5 text-center" style={{ border: `2px solid ${heroColor}40`, background: '#0f172a' }}>
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">7-Day Sleep Debt</div>
        <div className="text-6xl font-black mb-1" style={{ color: heroColor, fontFamily: 'Orbitron, monospace' }}>
          {rollingDebt7 > 0 ? '+' : ''}{rollingDebt7.toFixed(1)}h
        </div>
        <div className="text-sm font-semibold" style={{ color: heroColor }}>{debtLabel(rollingDebt7)}</div>
        {rollingDebt7 > 0 && (
          <div className="mt-3 text-xs text-slate-400 bg-slate-800 rounded-lg px-3 py-2 inline-block">
            Clear debt: +1.5h/night for <span className="text-white font-bold">{recoveryDays} days</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: debtColor(rollingDebt14) }}>
            {rollingDebt14 > 0 ? '+' : ''}{rollingDebt14.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500">14-Day Debt</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
            <Star className="w-4 h-4" />{avgQuality}
          </div>
          <div className="text-xs text-slate-500">Avg Quality</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-300">{nights.length}</div>
          <div className="text-xs text-slate-500">Nights Logged</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 space-y-3" style={{ border: '1px solid #312e81' }}>
          <h3 className="text-sm font-semibold text-white">Log Sleep Night</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Date</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="game-input w-full text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Target Hours: {form.targetHours}h</label>
              <input type="range" min={4} max={12} step={0.5} value={form.targetHours}
                onChange={e => setForm(f => ({ ...f, targetHours: Number(e.target.value) }))}
                className="w-full mt-2 accent-indigo-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Actual Hours Slept: {form.actualHours}h</label>
            <input type="range" min={0} max={14} step={0.5} value={form.actualHours}
              onChange={e => setForm(f => ({ ...f, actualHours: Number(e.target.value) }))}
              className="w-full mt-1 accent-indigo-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Bedtime</label>
              <input type="time" value={form.bedtime}
                onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))}
                className="game-input w-full text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Wake Time</label>
              <input type="time" value={form.wakeTime}
                onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))}
                className="game-input w-full text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Sleep Quality: {form.quality}/10</label>
            <input type="range" min={1} max={10} value={form.quality}
              onChange={e => setForm(f => ({ ...f, quality: Number(e.target.value) }))}
              className="w-full mt-1 accent-indigo-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Night Wake-Ups: {form.wakeUps}</label>
            <input type="range" min={0} max={10} value={form.wakeUps}
              onChange={e => setForm(f => ({ ...f, wakeUps: Number(e.target.value) }))}
              className="w-full mt-1 accent-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="dream" checked={form.dreamRecall}
              onChange={e => setForm(f => ({ ...f, dreamRecall: e.target.checked }))}
              className="accent-indigo-400" />
            <label htmlFor="dream" className="text-xs text-slate-400">Dream recall</label>
          </div>
          <input value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit}
              className="flex-1 py-2 text-white rounded-xl text-sm font-semibold"
              style={{ background: '#312e81' }}>
              Save Night
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {cumulativeDebt.length >= 2 && (
        <div className="game-card p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Debt Accumulation (last 30 nights)
          </h3>
          <ChartArea />
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> In debt</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Surplus</span>
          </div>
        </div>
      )}

      {last14.length >= 2 && (
        <div className="game-card p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Sleep Timing Consistency (14 nights)
          </h3>
          <ScatterChart />
          <p className="text-xs text-slate-600 mt-1">Each dot = one night. Tight cluster = consistent schedule.</p>
        </div>
      )}

      {rollingDebt7 > 0 && (
        <div className="game-card p-4" style={{ borderLeft: '3px solid #f59e0b', background: '#0f172a' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Recovery Plan</span>
          </div>
          <p className="text-sm text-slate-300">
            You're carrying <span className="text-red-400 font-bold">{rollingDebt7.toFixed(1)}h</span> of sleep debt over 7 days.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Add <span className="text-white font-semibold">1.5h extra sleep</span> for <span className="text-white font-semibold">{recoveryDays} nights</span> to clear your debt.
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Chronic sleep debt raises cortisol, impairs cognition and motor skill. Treat it like financial debt — compound interest is real.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.slice(0, 20).map(n => {
          const debt = n.targetHours - n.actualHours
          const c = debtColor(Math.max(debt, 0))
          return (
            <div key={n.id} className="game-card p-3 flex items-start gap-3"
              style={{ borderLeft: `3px solid ${c}` }}>
              <Moon className="w-4 h-4 mt-0.5 text-indigo-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">{n.date}</span>
                  <span className="text-white font-semibold">{n.actualHours}h</span>
                  <span className="text-slate-500">target {n.targetHours}h</span>
                  <span style={{ color: c }}>{debt > 0 ? `−${debt.toFixed(1)}h debt` : `+${Math.abs(debt).toFixed(1)}h surplus`}</span>
                  <span className="text-yellow-400">★ {n.quality}/10</span>
                  <span className="text-slate-500">{n.bedtime}→{n.wakeTime}</span>
                </div>
                {n.notes && <p className="text-xs text-slate-500 mt-0.5">{n.notes}</p>}
              </div>
              <button onClick={() => persist(nights.filter(x => x.id !== n.id))}
                className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {nights.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-600">
            <Moon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start logging your sleep to reveal your debt pattern.</p>
          </div>
        )}
      </div>
    </div>
  )
}
