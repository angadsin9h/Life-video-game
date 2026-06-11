import React, { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, Search, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EventType = 'loss' | 'change' | 'surprise' | 'failure' | 'opportunity' | 'crisis' | 'transition'

type AdaptabilityEvent = {
  id: string
  date: string
  event: string
  type: EventType
  severity: number
  initialReaction: string
  adaptationStrategy: string
  timeToAdapt: number
  growthGained: string
  adaptabilityRating: number
  wouldDoSame: boolean
}

type Tab = 'log' | 'profile' | 'scatter' | 'growth'

const TYPE_CONFIG: Record<EventType, { label: string; color: string }> = {
  loss:        { label: 'Loss',        color: '#6366f1' },
  change:      { label: 'Change',      color: '#3b82f6' },
  surprise:    { label: 'Surprise',    color: '#f59e0b' },
  failure:     { label: 'Failure',     color: '#ef4444' },
  opportunity: { label: 'Opportunity', color: '#22c55e' },
  crisis:      { label: 'Crisis',      color: '#dc2626' },
  transition:  { label: 'Transition',  color: '#8b5cf6' },
}

const EVENT_TYPES = Object.keys(TYPE_CONFIG) as EventType[]

const STORAGE_KEY = 'lq-adaptabilitylog'

const emptyForm = (): Omit<AdaptabilityEvent, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  event: '',
  type: 'change',
  severity: 5,
  initialReaction: '',
  adaptationStrategy: '',
  timeToAdapt: 1,
  growthGained: '',
  adaptabilityRating: 7,
  wouldDoSame: false,
})

function RadarChart({ events }: { events: AdaptabilityEvent[] }) {
  const axes = EVENT_TYPES.filter(t => t !== 'transition')
  const N = axes.length
  const W = 260
  const H = 260
  const cx = W / 2
  const cy = H / 2
  const R = 90

  const avg = (type: EventType): number => {
    const group = events.filter(e => e.type === type)
    if (!group.length) return 0
    return group.reduce((s, e) => s + e.adaptabilityRating, 0) / group.length
  }

  const point = (i: number, val: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2
    const r = (val / 10) * R
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const labelPoint = (i: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2
    const r = R + 18
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const gridPoints = (frac: number): string =>
    axes.map((_, i) => {
      const angle = (Math.PI * 2 * i) / N - Math.PI / 2
      const r = frac * R
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')

  const dataPoints = axes.map((t, i) => point(i, avg(t)))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

  return (
    <svg width={W} height={H} className="block mx-auto">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPoints(f)} fill="none" stroke="#1e3a5f" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const angle = (Math.PI * 2 * i) / N - Math.PI / 2
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + R * Math.cos(angle)}
            y2={cy + R * Math.sin(angle)}
            stroke="#1e3a5f" strokeWidth={1}
          />
        )
      })}
      <path d={dataPath} fill="#0d9488" fillOpacity={0.25} stroke="#0d9488" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#0d9488" />
      ))}
      {axes.map((t, i) => {
        const lp = labelPoint(i)
        const a = avg(t)
        const cfg = TYPE_CONFIG[t]
        return (
          <g key={t}>
            <text x={lp.x} y={lp.y - 4} textAnchor="middle" fill={cfg.color} fontSize={9} fontWeight="bold">
              {cfg.label}
            </text>
            <text x={lp.x} y={lp.y + 7} textAnchor="middle" fill="#64748b" fontSize={8}>
              {a ? a.toFixed(1) : '—'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ScatterPlot({ events }: { events: AdaptabilityEvent[] }) {
  const W = 300
  const H = 260
  const PX = 44
  const PY = 20
  const PB = 30

  const plotW = W - PX - 12
  const plotH = H - PY - PB

  const px = (sev: number) => PX + ((sev - 1) / 9) * plotW
  const py = (days: number) => {
    const maxDays = Math.max(...events.map(e => e.timeToAdapt), 30)
    return PY + plotH - (days / maxDays) * plotH
  }

  const maxDays = Math.max(...events.map(e => e.timeToAdapt), 30)

  const yTicks = [0, Math.round(maxDays * 0.25), Math.round(maxDays * 0.5), Math.round(maxDays * 0.75), maxDays]

  return (
    <svg width={W} height={H} className="block mx-auto">
      {yTicks.map(v => {
        const y = PY + plotH - (v / maxDays) * plotH
        return (
          <g key={v}>
            <line x1={PX} y1={y} x2={W - 12} y2={y} stroke="#1e3a5f" strokeWidth={1} />
            <text x={PX - 4} y={y + 3} textAnchor="end" fill="#475569" fontSize={8}>{v}d</text>
          </g>
        )
      })}
      {[1, 3, 5, 7, 9].map(v => {
        const x = px(v)
        return (
          <g key={v}>
            <line x1={x} y1={PY} x2={x} y2={PY + plotH} stroke="#1e3a5f" strokeWidth={1} />
            <text x={x} y={H - 6} textAnchor="middle" fill="#475569" fontSize={8}>{v}</text>
          </g>
        )
      })}
      <rect x={PX} y={PY} width={plotW} height={plotH} fill="none" stroke="#1e3a5f" strokeWidth={1} rx={2} />
      <text x={W / 2} y={H - 1} textAnchor="middle" fill="#64748b" fontSize={9}>Severity →</text>
      <text x={10} y={H / 2} textAnchor="middle" fill="#64748b" fontSize={9} transform={`rotate(-90, 10, ${H / 2})`}>Days to Adapt</text>

      {events.map(e => {
        const x = px(e.severity)
        const y = py(e.timeToAdapt)
        const col = TYPE_CONFIG[e.type].color
        return (
          <g key={e.id}>
            <circle cx={x} cy={y} r={5} fill={col} fillOpacity={0.75} stroke="#0f172a" strokeWidth={1} />
          </g>
        )
      })}
    </svg>
  )
}

export default function AdaptabilityLog() {
  const { toastSuccess } = useToast()
  const [events, setEvents] = useState<AdaptabilityEvent[]>([])
  const [tab, setTab] = useState<Tab>('log')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AdaptabilityEvent, 'id'>>(emptyForm())
  const [search, setSearch] = useState('')

  useEffect(() => {
    try { setEvents(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (next: AdaptabilityEvent[]) => {
    setEvents(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const submit = () => {
    if (!form.event.trim()) return
    const ev: AdaptabilityEvent = { id: Date.now().toString(), ...form }
    persist([ev, ...events])
    setForm(emptyForm())
    setShowForm(false)
    toastSuccess('Adaptability event logged', form.event)
  }

  const deleteEvent = (id: string) => persist(events.filter(e => e.id !== id))

  const avgRating = events.length
    ? events.reduce((s, e) => s + e.adaptabilityRating, 0) / events.length
    : 0

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const recent = events.filter(e => new Date(e.date) >= sixMonthsAgo)
  const older = events.filter(e => new Date(e.date) < sixMonthsAgo)

  const recentAvg = recent.length ? recent.reduce((s, e) => s + e.adaptabilityRating, 0) / recent.length : 0
  const olderAvg = older.length ? older.reduce((s, e) => s + e.adaptabilityRating, 0) / older.length : 0
  const trend = olderAvg ? recentAvg - olderAvg : 0

  const filteredGrowth = events.filter(
    e => e.growthGained && e.growthGained.toLowerCase().includes(search.toLowerCase())
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'log', label: 'Log' },
    { key: 'profile', label: 'Radar' },
    { key: 'scatter', label: 'Scatter' },
    { key: 'growth', label: 'Growth' },
  ]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-orange-400 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              Adaptability Log
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Track how you respond to disruption. Build your resilience muscle.</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setTab('log') }}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-2xl font-bold text-teal-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {(avgRating * 10).toFixed(0)}
          </div>
          <div className="text-xs text-slate-500">Adaptability Score</div>
          {trend !== 0 && (
            <div className={`text-xs mt-0.5 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)} vs 6mo ago
            </div>
          )}
        </div>
        <div className="game-card p-3">
          <div className="text-2xl font-bold text-white">{events.length}</div>
          <div className="text-xs text-slate-500">Events Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-2xl font-bold text-orange-400">
            {events.length ? Math.round(events.reduce((s, e) => s + e.timeToAdapt, 0) / events.length) : 0}d
          </div>
          <div className="text-xs text-slate-500">Avg Adapt Time</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2 px-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'bg-teal-700 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <div className="space-y-3">
          {showForm && (
            <div className="game-card p-5 border border-teal-500/20 space-y-3">
              <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider">Log an Event</h2>
              <textarea
                value={form.event}
                onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
                placeholder="What changed or disrupted you? *"
                className="game-input w-full h-14 resize-none text-sm"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="game-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))}
                    className="game-input w-full text-sm"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Severity: {form.severity}/10</p>
                  <input
                    type="range" min={1} max={10} value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: Number(e.target.value) }))}
                    className="w-full h-1 accent-orange-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Adaptability: {form.adaptabilityRating}/10</p>
                  <input
                    type="range" min={1} max={10} value={form.adaptabilityRating}
                    onChange={e => setForm(f => ({ ...f, adaptabilityRating: Number(e.target.value) }))}
                    className="w-full h-1 accent-teal-400"
                  />
                </div>
              </div>
              <input
                value={form.initialReaction}
                onChange={e => setForm(f => ({ ...f, initialReaction: e.target.value }))}
                placeholder="Your first response / reaction"
                className="game-input w-full text-sm"
              />
              <textarea
                value={form.adaptationStrategy}
                onChange={e => setForm(f => ({ ...f, adaptationStrategy: e.target.value }))}
                placeholder="How you adapted — what strategies worked?"
                className="game-input w-full h-14 resize-none text-sm"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Days to feel adapted</label>
                  <input
                    type="number"
                    min={0}
                    value={form.timeToAdapt}
                    onChange={e => setForm(f => ({ ...f, timeToAdapt: Math.max(0, Number(e.target.value)) }))}
                    className="game-input w-full text-sm"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.wouldDoSame}
                      onChange={e => setForm(f => ({ ...f, wouldDoSame: e.target.checked }))}
                      className="accent-teal-400"
                    />
                    Would do same again
                  </label>
                </div>
              </div>
              <textarea
                value={form.growthGained}
                onChange={e => setForm(f => ({ ...f, growthGained: e.target.value }))}
                placeholder="What did you gain or learn from this?"
                className="game-input w-full h-14 resize-none text-sm"
              />
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
                  Save Event
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {events.length === 0 && !showForm && (
            <div className="text-center py-12 text-slate-500">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No events logged yet. Start tracking how you handle disruption.</p>
            </div>
          )}

          {events.map(e => {
            const cfg = TYPE_CONFIG[e.type]
            return (
              <div key={e.id} className="game-card p-4" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{e.event}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: cfg.color + '20', color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>{e.date}</span>
                      <span>Severity <span className="text-orange-400">{e.severity}/10</span></span>
                      <span>Adapt <span className="text-teal-400">{e.adaptabilityRating}/10</span></span>
                      <span>{e.timeToAdapt}d to adapt</span>
                    </div>
                    {e.adaptationStrategy && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{e.adaptationStrategy}</p>
                    )}
                    {e.growthGained && (
                      <p className="text-xs text-teal-300/80 mt-1">
                        <TrendingUp className="w-3 h-3 inline mr-1" />{e.growthGained}
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteEvent(e.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'profile' && (
        <div className="game-card p-5">
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-1">Resilience Profile</h2>
          <p className="text-xs text-slate-500 mb-4">Average adaptability rating by disruption type</p>
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">Log events to see your resilience profile.</p>
            </div>
          ) : (
            <>
              <RadarChart events={events} />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {EVENT_TYPES.filter(t => t !== 'transition').map(t => {
                  const group = events.filter(e => e.type === t)
                  const avg = group.length
                    ? (group.reduce((s, e) => s + e.adaptabilityRating, 0) / group.length).toFixed(1)
                    : '—'
                  const cfg = TYPE_CONFIG[t]
                  return (
                    <div key={t} className="text-center">
                      <div className="text-xs font-bold" style={{ color: cfg.color }}>{avg}</div>
                      <div className="text-xs text-slate-500">{cfg.label}</div>
                      <div className="text-xs text-slate-600">n={group.length}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'scatter' && (
        <div className="game-card p-5">
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-1">Adaptation Efficiency</h2>
          <p className="text-xs text-slate-500 mb-4">Severity vs days to adapt — high severity doesn't always mean slow adaptation</p>
          {events.length < 2 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">Log at least 2 events to see the scatter plot.</p>
            </div>
          ) : (
            <>
              <ScatterPlot events={events} />
              <div className="mt-4 flex flex-wrap gap-3">
                {EVENT_TYPES.map(t => {
                  const count = events.filter(e => e.type === t).length
                  if (!count) return null
                  const cfg = TYPE_CONFIG[t]
                  return (
                    <span key={t} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <span style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-slate-600">({count})</span>
                    </span>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'growth' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search growth gains..."
              className="game-input w-full pl-9 text-sm"
            />
          </div>
          {filteredGrowth.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">
                {events.length === 0
                  ? 'No events logged yet.'
                  : search
                  ? 'No growth gains match your search.'
                  : 'No growth gains recorded yet. Add them when logging events.'}
              </p>
            </div>
          ) : (
            filteredGrowth.map(e => {
              const cfg = TYPE_CONFIG[e.type]
              return (
                <div key={e.id} className="game-card p-4" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-teal-300">{e.growthGained}</p>
                      <div className="flex gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                        <span>{e.event}</span>
                        <span>{e.date}</span>
                        <span>Rating {e.adaptabilityRating}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
