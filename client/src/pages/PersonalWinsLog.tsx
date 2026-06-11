import React, { useState, useEffect } from 'react'
import { Trophy, Plus, Zap, Star, Target, Rocket, Award, Flame, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WinDomain = 'work' | 'health' | 'relationships' | 'learning' | 'finance' | 'creative' | 'personal' | 'spiritual'
type WinSize = 'micro' | 'small' | 'medium' | 'big' | 'massive'
type WhoKnows = 'private' | 'shared-with-few' | 'public'

type Win = {
  id: string
  date: string
  title: string
  domain: WinDomain
  size: WinSize
  description: string
  effort: number
  pride: number
  whoKnows: WhoKnows
  lesson: string
  celebration: string
  celebrated: boolean
}

const STORAGE_KEY = 'lq-personalwins'

const DOMAIN_CONFIG: Record<WinDomain, { label: string; color: string; bg: string }> = {
  work:          { label: 'Work',          color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  health:        { label: 'Health',        color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  relationships: { label: 'Relationships', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  learning:      { label: 'Learning',      color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  finance:       { label: 'Finance',       color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  creative:      { label: 'Creative',      color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  personal:      { label: 'Personal',      color: '#14b8a6', bg: 'rgba(20,184,166,0.15)' },
  spiritual:     { label: 'Spiritual',     color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
}

const SIZE_CONFIG: Record<WinSize, { label: string; emoji: string; scale: number; glow: string }> = {
  micro:   { label: 'Micro',   emoji: '⚡', scale: 0.75, glow: '' },
  small:   { label: 'Small',   emoji: '⭐', scale: 0.85, glow: '' },
  medium:  { label: 'Medium',  emoji: '🏆', scale: 1.0,  glow: '' },
  big:     { label: 'Big',     emoji: '🎯', scale: 1.15, glow: '0 0 12px rgba(245,158,11,0.4)' },
  massive: { label: 'Massive', emoji: '🚀', scale: 1.3,  glow: '0 0 20px rgba(245,158,11,0.6)' },
}

const ALL_DOMAINS = Object.keys(DOMAIN_CONFIG) as WinDomain[]
const ALL_SIZES = Object.keys(SIZE_CONFIG) as WinSize[]

const BLANK_WIN: Omit<Win, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  title: '',
  domain: 'personal',
  size: 'medium',
  description: '',
  effort: 7,
  pride: 8,
  whoKnows: 'private',
  lesson: '',
  celebration: '',
  celebrated: false,
}

function SliderField({ label, value, onChange, color }: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  )
}

function WinCard({ win, onToggleCelebrated }: { win: Win; onToggleCelebrated: (id: string) => void }) {
  const dc = DOMAIN_CONFIG[win.domain]
  const sc = SIZE_CONFIG[win.size]
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="game-card p-4 flex flex-col gap-2 transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: dc.bg,
        borderLeft: `3px solid ${dc.color}`,
        boxShadow: sc.glow || undefined,
        transform: `scale(${sc.scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{sc.emoji}</span>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm leading-tight truncate">{win.title}</div>
            <div className="text-xs mt-0.5" style={{ color: dc.color }}>{dc.label} · {win.date}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.color}40` }}>
            {sc.label}
          </span>
          <button onClick={() => setExpanded(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs text-slate-400">Effort <span className="text-orange-400 font-bold">{win.effort}</span></span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-slate-400">Pride <span className="text-yellow-400 font-bold">{win.pride}</span></span>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 mt-1 border-t border-white/10 pt-2">
          {win.description && <p className="text-xs text-slate-300">{win.description}</p>}
          {win.lesson && (
            <div className="text-xs">
              <span className="text-slate-500">Lesson: </span>
              <span className="text-slate-300">{win.lesson}</span>
            </div>
          )}
          {win.celebration && (
            <div className="text-xs">
              <span className="text-slate-500">Celebration: </span>
              <span className="text-slate-300">{win.celebration}</span>
            </div>
          )}
          <button
            onClick={() => onToggleCelebrated(win.id)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
            style={win.celebrated
              ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }
              : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            {win.celebrated ? <><Check className="w-3 h-3" /> Celebrated!</> : <><Trophy className="w-3 h-3" /> Mark celebrated</>}
          </button>
        </div>
      )}
    </div>
  )
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 420
  const H = 140
  const pad = { top: 10, right: 10, bottom: 24, left: 28 }
  const barW = Math.floor((W - pad.left - pad.right) / data.length) - 4

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map((t, i) => {
        const y = pad.top + (H - pad.top - pad.bottom) * (1 - t)
        return (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="#334155" strokeWidth={0.5} />
            <text x={pad.left - 4} y={y + 4} textAnchor="end" fill="#64748b" fontSize={9}>
              {Math.round(t * max)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = pad.left + i * (barW + 4)
        const barH = ((d.value / max) * (H - pad.top - pad.bottom)) || 0
        const y = H - pad.bottom - barH
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={d.color} opacity={0.8} />
            <text x={x + barW / 2} y={H - pad.bottom + 12} textAnchor="middle" fill="#94a3b8" fontSize={8}>
              {d.label.slice(0, 4)}
            </text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill={d.color} fontSize={9} fontWeight="bold">
                {d.value}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function WeekTrendChart({ wins }: { wins: Win[] }) {
  const W = 420
  const H = 100
  const pad = { top: 10, right: 10, bottom: 20, left: 28 }
  const weeks = 12

  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = new Date()
    end.setDate(end.getDate() - (weeks - 1 - i) * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const endStr = end.toISOString().split('T')[0]
    const startStr = start.toISOString().split('T')[0]
    return wins.filter(w => w.date >= startStr && w.date <= endStr).length
  })

  const max = Math.max(...buckets, 1)
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const points = buckets.map((v, i) => ({
    x: pad.left + (i / (weeks - 1)) * innerW,
    y: pad.top + innerH - (v / max) * innerH,
  }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M${points[0].x},${H - pad.bottom} ` +
    points.map(p => `L${p.x},${p.y}`).join(' ') +
    ` L${points[points.length - 1].x},${H - pad.bottom} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="winsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={pad.left} x2={W - pad.right} y1={H - pad.bottom} y2={H - pad.bottom} stroke="#334155" strokeWidth={0.5} />
      <path d={area} fill="url(#winsGrad)" />
      <polyline points={polyline} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#f59e0b" />
      ))}
      {[0, max].map((v, i) => (
        <text key={i} x={pad.left - 4} y={i === 0 ? H - pad.bottom + 4 : pad.top + 4} textAnchor="end" fill="#64748b" fontSize={9}>
          {v}
        </text>
      ))}
    </svg>
  )
}

function PrideByDomainChart({ wins }: { wins: Win[] }) {
  const data = ALL_DOMAINS.map(d => {
    const dw = wins.filter(w => w.domain === d)
    const avg = dw.length ? dw.reduce((s, w) => s + w.pride, 0) / dw.length : 0
    return { label: DOMAIN_CONFIG[d].label, value: parseFloat(avg.toFixed(1)), color: DOMAIN_CONFIG[d].color }
  }).filter(d => d.value > 0)

  if (!data.length) return <p className="text-slate-500 text-xs">No data yet</p>
  return <BarChart data={data} />
}

export default function PersonalWinsLog() {
  const { toastSuccess } = useToast()
  const [wins, setWins] = useState<Win[]>([])
  const [view, setView] = useState<'wall' | 'add' | 'analytics' | 'queue'>('wall')
  const [form, setForm] = useState<Omit<Win, 'id'>>(BLANK_WIN)
  const [domainFilter, setDomainFilter] = useState<WinDomain | 'all'>('all')

  useEffect(() => {
    try { setWins(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: Win[]) => {
    setWins(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submitWin = () => {
    if (!form.title.trim()) return
    const w: Win = { id: Date.now().toString(), ...form }
    persist([w, ...wins])
    setForm(BLANK_WIN)
    setView('wall')
    toastSuccess(`Win logged! ${SIZE_CONFIG[form.size].emoji} ${form.title}`)
  }

  const toggleCelebrated = (id: string) => {
    const updated = wins.map(w => w.id === id ? { ...w, celebrated: !w.celebrated } : w)
    persist(updated)
    const win = wins.find(w => w.id === id)
    if (win && !win.celebrated) toastSuccess('Celebrated! 🎉 You earned this.')
  }

  const visibleWins = domainFilter === 'all' ? wins : wins.filter(w => w.domain === domainFilter)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const thisMonth = wins.filter(w => w.date >= thisMonthStart)
  const lastMonth = wins.filter(w => w.date >= lastMonthStart && w.date < thisMonthStart)

  const avgPride = wins.length ? wins.reduce((s, w) => s + w.pride, 0) / wins.length : 0
  const momentumScore = parseFloat((wins.length * avgPride / 10).toFixed(1))
  const lastMonthAvgPride = lastMonth.length ? lastMonth.reduce((s, w) => s + w.pride, 0) / lastMonth.length : 0
  const lastMonthMomentum = parseFloat((lastMonth.length * lastMonthAvgPride / 10).toFixed(1))
  const momentumUp = momentumScore >= lastMonthMomentum

  const uncelebrated = wins.filter(w => !w.celebrated)

  const domainBarData = ALL_DOMAINS.map(d => ({
    label: DOMAIN_CONFIG[d].label,
    value: wins.filter(w => w.domain === d).length,
    color: DOMAIN_CONFIG[d].color,
  }))

  const f = form

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Personal Wins
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Collect. Celebrate. Build momentum.</p>
        </div>
        <button
          onClick={() => setView(view === 'add' ? 'wall' : 'add')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: '#f59e0b', color: '#000' }}
        >
          {view === 'add' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {view === 'add' ? 'Cancel' : 'Log Win'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="game-card p-3 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{wins.length}</div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
        <div className="game-card p-3 text-center">
          <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-400">{thisMonth.length}</div>
          <div className="text-xs text-slate-500">This Month</div>
        </div>
        <div className="game-card p-3 text-center">
          <Star className="w-5 h-5 text-pink-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-pink-400">{avgPride > 0 ? avgPride.toFixed(1) : '—'}</div>
          <div className="text-xs text-slate-500">Avg Pride</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="w-5 h-5 text-yellow-400" />
            {momentumUp
              ? <TrendingUp className="w-3 h-3 text-green-400" />
              : <TrendingDown className="w-3 h-3 text-red-400" />}
          </div>
          <div className="text-xl font-bold text-yellow-400">{momentumScore}</div>
          <div className="text-xs text-slate-500">Momentum</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['wall', 'analytics', 'queue'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={view === v
              ? { background: '#f59e0b', color: '#000' }
              : { background: '#1e293b', color: '#94a3b8' }}
          >
            {v === 'queue' ? `Queue (${uncelebrated.length})` : v === 'wall' ? 'Win Wall' : 'Analytics'}
          </button>
        ))}
      </div>

      {view === 'add' && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20">
          <h3 className="font-bold text-yellow-400 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Log a Win
          </h3>

          <input
            value={f.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
            placeholder="What did you win? 🏆" className="game-input w-full" autoFocus
          />

          <div>
            <div className="text-xs text-slate-400 mb-2">Domain</div>
            <div className="flex flex-wrap gap-2">
              {ALL_DOMAINS.map(d => (
                <button key={d} onClick={() => setForm(v => ({ ...v, domain: d }))}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={f.domain === d
                    ? { background: DOMAIN_CONFIG[d].bg, color: DOMAIN_CONFIG[d].color, border: `1px solid ${DOMAIN_CONFIG[d].color}` }
                    : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}>
                  {DOMAIN_CONFIG[d].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-2">Size</div>
            <div className="flex gap-2 flex-wrap">
              {ALL_SIZES.map(s => (
                <button key={s} onClick={() => setForm(v => ({ ...v, size: s }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={f.size === s
                    ? { background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }
                    : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}>
                  <span>{SIZE_CONFIG[s].emoji}</span> {SIZE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={f.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
            placeholder="Describe the win..." className="game-input w-full h-20 resize-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <SliderField label="Effort invested" value={f.effort} onChange={n => setForm(v => ({ ...v, effort: n }))} color="#f97316" />
            <SliderField label="Pride level" value={f.pride} onChange={n => setForm(v => ({ ...v, pride: n }))} color="#f59e0b" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['private', 'shared-with-few', 'public'] as WhoKnows[]).map(wk => (
              <button key={wk} onClick={() => setForm(v => ({ ...v, whoKnows: wk }))}
                className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={f.whoKnows === wk
                  ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid #6366f1' }
                  : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}>
                {wk === 'private' ? '🔒 Private' : wk === 'shared-with-few' ? '👥 Few know' : '🌍 Public'}
              </button>
            ))}
          </div>

          <input
            value={f.lesson} onChange={e => setForm(v => ({ ...v, lesson: e.target.value }))}
            placeholder="Key lesson learned..." className="game-input w-full"
          />
          <input
            value={f.celebration} onChange={e => setForm(v => ({ ...v, celebration: e.target.value }))}
            placeholder="How will you celebrate? 🎉" className="game-input w-full"
          />

          <input
            type="date" value={f.date} onChange={e => setForm(v => ({ ...v, date: e.target.value }))}
            className="game-input w-full"
          />

          <button onClick={submitWin}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#000' }}>
            Log This Win 🚀
          </button>
        </div>
      )}

      {view === 'wall' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setDomainFilter('all')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={domainFilter === 'all'
                ? { background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }
                : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}>
              All
            </button>
            {ALL_DOMAINS.map(d => (
              <button key={d} onClick={() => setDomainFilter(d)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={domainFilter === d
                  ? { background: DOMAIN_CONFIG[d].bg, color: DOMAIN_CONFIG[d].color, border: `1px solid ${DOMAIN_CONFIG[d].color}` }
                  : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}>
                {DOMAIN_CONFIG[d].label}
              </button>
            ))}
          </div>

          {visibleWins.length === 0 ? (
            <div className="game-card p-10 text-center">
              <Trophy className="w-10 h-10 text-yellow-400/40 mx-auto mb-3" />
              <p className="text-slate-500">No wins logged yet. Every step forward counts!</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 gap-4 space-y-0">
              {visibleWins.map(w => (
                <div key={w.id} className="break-inside-avoid mb-4">
                  <WinCard win={w} onToggleCelebrated={toggleCelebrated} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'analytics' && (
        <div className="space-y-5">
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" /> Wins by Domain
            </h3>
            <BarChart data={domainBarData} />
          </div>

          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" /> Win Trend (Last 12 Weeks)
            </h3>
            <WeekTrendChart wins={wins} />
          </div>

          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-pink-400" /> Avg Pride by Domain
            </h3>
            <PrideByDomainChart wins={wins} />
          </div>
        </div>
      )}

      {view === 'queue' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-slate-300">Needs Celebration</h3>
            <span className="ml-auto text-xs text-yellow-400 font-bold">{uncelebrated.length} pending</span>
          </div>

          {uncelebrated.length === 0 ? (
            <div className="game-card p-8 text-center">
              <Rocket className="w-8 h-8 text-green-400/50 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">All wins celebrated! You're on fire 🔥</p>
            </div>
          ) : (
            uncelebrated.map(w => (
              <div key={w.id} className="game-card p-4 flex items-center justify-between gap-3"
                style={{ borderLeft: `3px solid ${DOMAIN_CONFIG[w.domain].color}` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{SIZE_CONFIG[w.size].emoji}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{w.title}</div>
                    <div className="text-xs" style={{ color: DOMAIN_CONFIG[w.domain].color }}>
                      {DOMAIN_CONFIG[w.domain].label} · {w.date}
                    </div>
                    {w.celebration && (
                      <div className="text-xs text-slate-400 mt-0.5">Plan: {w.celebration}</div>
                    )}
                  </div>
                </div>
                <button onClick={() => toggleCelebrated(w.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}>
                  Celebrate 🎉
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
