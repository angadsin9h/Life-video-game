import React, { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Search, Star, ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-timewarp'

type PerspectiveKey = 'future-5' | 'future-10' | 'future-20' | 'past-5' | 'past-10' | 'deathbed'
type DomainKey = 'career' | 'relationships' | 'health' | 'finance' | 'purpose' | 'daily'

type TimeWarpEntry = {
  id: string
  date: string
  perspective: PerspectiveKey
  situation: string
  warpedAdvice: string
  keyInsight: string
  actionables: string[]
  emotionalShift: number
  domain: DomainKey
}

type Tab = 'new' | 'archive' | 'compare' | 'letter'

const PERSPECTIVE_CONFIG: Record<PerspectiveKey, { label: string; color: string; glow: string; description: string }> = {
  'future-5':  { label: 'Future Self (5yr)',  color: '#60a5fa', glow: '#3b82f680', description: '5 years from now' },
  'future-10': { label: 'Future Self (10yr)', color: '#818cf8', glow: '#6366f180', description: '10 years from now' },
  'future-20': { label: 'Future Self (20yr)', color: '#f59e0b', glow: '#f59e0b80', description: '20 years from now' },
  'past-5':    { label: 'Past Self (5yr ago)', color: '#fb923c', glow: '#f9731680', description: '5 years ago' },
  'past-10':   { label: 'Past Self (10yr ago)', color: '#fbbf24', glow: '#f59e0b80', description: '10 years ago' },
  'deathbed':  { label: 'Deathbed View',      color: '#e2e8f0', glow: '#94a3b880', description: 'Final clarity' },
}

const DOMAIN_CONFIG: Record<DomainKey, { label: string; color: string }> = {
  career:        { label: 'Career',        color: '#60a5fa' },
  relationships: { label: 'Relationships', color: '#f472b6' },
  health:        { label: 'Health',        color: '#4ade80' },
  finance:       { label: 'Finance',       color: '#facc15' },
  purpose:       { label: 'Purpose',       color: '#c084fc' },
  daily:         { label: 'Daily Life',    color: '#94a3b8' },
}

const BLANK_FORM: Omit<TimeWarpEntry, 'id' | 'date'> = {
  perspective: 'future-5',
  situation: '',
  warpedAdvice: '',
  keyInsight: '',
  actionables: ['', '', ''],
  emotionalShift: 0,
  domain: 'career',
}

function StarfieldSVG() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    cx: (i * 137.5) % 100,
    cy: (i * 79.3) % 100,
    r: i % 5 === 0 ? 1.2 : 0.6,
    opacity: 0.2 + (i % 4) * 0.1,
  }))
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.opacity} />
      ))}
    </svg>
  )
}

function PortalGradient({ color, glow }: { color: string; glow: string }) {
  return (
    <svg viewBox="0 0 120 120" className="w-16 h-16 flex-shrink-0">
      <defs>
        <radialGradient id={`portal-${color.slice(1)}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="60%" stopColor={glow} stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="55" fill={`url(#portal-${color.slice(1)})`} />
      <circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="60" r="25" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="60" cy="60" r="10" fill={color} opacity="0.5" />
    </svg>
  )
}

function ClarityChart({ entries }: { entries: TimeWarpEntry[] }) {
  if (entries.length === 0) return null
  const byPersp = Object.keys(PERSPECTIVE_CONFIG).map(k => {
    const pk = k as PerspectiveKey
    const group = entries.filter(e => e.perspective === pk)
    const avg = group.length ? group.reduce((s, e) => s + e.emotionalShift, 0) / group.length : null
    return { key: pk, label: PERSPECTIVE_CONFIG[pk].label.split('(')[0].trim(), avg, count: group.length, color: PERSPECTIVE_CONFIG[pk].color }
  }).filter(d => d.avg !== null) as { key: PerspectiveKey; label: string; avg: number; count: number; color: string }[]

  const maxVal = 5
  const barH = 20
  const gap = 8
  const labelW = 90
  const chartW = 200
  const totalH = byPersp.length * (barH + gap)

  return (
    <svg viewBox={`0 0 ${labelW + chartW + 20} ${totalH + 10}`} className="w-full" style={{ maxHeight: 220 }}>
      {byPersp.map((d, i) => {
        const y = i * (barH + gap) + 5
        const normalised = (d.avg + maxVal) / (maxVal * 2)
        const barWidth = normalised * chartW
        const midX = labelW + (chartW / 2)
        return (
          <g key={d.key}>
            <text x={labelW - 6} y={y + barH / 2 + 4} textAnchor="end" fill="#94a3b8" fontSize="9">{d.label}</text>
            <rect x={labelW} y={y} width={chartW} height={barH} rx="4" fill="#1e293b" />
            <rect x={midX} y={y} width={0} height={barH} rx="0" fill="transparent" />
            {d.avg >= 0
              ? <rect x={midX} y={y} width={(d.avg / maxVal) * (chartW / 2)} height={barH} rx="0" fill={d.color} opacity="0.7" />
              : <rect x={midX + (d.avg / maxVal) * (chartW / 2)} y={y} width={Math.abs(d.avg / maxVal) * (chartW / 2)} height={barH} rx="0" fill="#f87171" opacity="0.6" />
            }
            <line x1={midX} y1={y} x2={midX} y2={y + barH} stroke="#475569" strokeWidth="1" />
            <text x={labelW + chartW + 4} y={y + barH / 2 + 4} fill={d.color} fontSize="8">{d.avg > 0 ? '+' : ''}{d.avg.toFixed(1)}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function TimeWarpLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<TimeWarpEntry[]>([])
  const [tab, setTab] = useState<Tab>('new')
  const [form, setForm] = useState<Omit<TimeWarpEntry, 'id' | 'date'>>(BLANK_FORM)
  const [search, setSearch] = useState('')
  const [filterDomain, setFilterDomain] = useState<DomainKey | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  function persist(updated: TimeWarpEntry[]) {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function submit() {
    if (!form.situation.trim() || !form.warpedAdvice.trim() || !form.keyInsight.trim()) return
    const entry: TimeWarpEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...form,
      actionables: form.actionables.filter(a => a.trim()),
    }
    persist([entry, ...entries])
    setForm(BLANK_FORM)
    toastSuccess('Time warp logged — perspective shifts everything')
  }

  function remove(id: string) {
    persist(entries.filter(e => e.id !== id))
  }

  const filtered = entries.filter(e => {
    const matchDomain = filterDomain === 'all' || e.domain === filterDomain
    const q = search.toLowerCase()
    const matchSearch = !q || e.situation.toLowerCase().includes(q) || e.keyInsight.toLowerCase().includes(q) || e.warpedAdvice.toLowerCase().includes(q)
    return matchDomain && matchSearch
  })

  const topPerspectives = Object.keys(PERSPECTIVE_CONFIG).map(k => {
    const pk = k as PerspectiveKey
    const group = entries.filter(e => e.perspective === pk)
    const avg = group.length ? group.reduce((s, e) => s + e.emotionalShift, 0) / group.length : -99
    return { key: pk, avg, count: group.length }
  }).filter(d => d.count > 0).sort((a, b) => b.avg - a.avg)

  const futureLetter = entries
    .filter(e => e.perspective.startsWith('future'))
    .sort((a, b) => b.emotionalShift - a.emotionalShift)
    .slice(0, 5)

  const compareEntries = entries.filter(e => compareIds.includes(e.id))

  function toggleCompare(id: string) {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev)
  }

  const pCfg = PERSPECTIVE_CONFIG[form.perspective]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="relative game-card p-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', minHeight: 100 }}>
        <StarfieldSVG />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
              <Clock className="w-7 h-7 text-blue-400" />
              Time Warp Log
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gain clarity by shifting your perspective across time.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-300" style={{ fontFamily: 'Orbitron, monospace' }}>{entries.length}</div>
            <div className="text-xs text-slate-500">Warps</div>
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="game-card p-3">
            <div className="text-lg font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {topPerspectives.length > 0 ? PERSPECTIVE_CONFIG[topPerspectives[0].key].label.split('(')[0].trim() : '—'}
            </div>
            <div className="text-xs text-slate-500">Top Perspective</div>
          </div>
          <div className="game-card p-3">
            <div className="text-lg font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {entries.length > 0
                ? (entries.reduce((s, e) => s + e.emotionalShift, 0) / entries.length).toFixed(1)
                : '0'}
            </div>
            <div className="text-xs text-slate-500">Avg Clarity</div>
          </div>
          <div className="game-card p-3">
            <div className="text-lg font-bold text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {new Set(entries.map(e => e.perspective)).size}
            </div>
            <div className="text-xs text-slate-500">Perspectives</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['new', 'archive', 'compare', 'letter'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {t === 'new' ? '+ New Warp' : t === 'letter' ? 'Future Letter' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="game-card p-5 space-y-4" style={{ border: `1px solid ${pCfg.color}40` }}>
          <div className="flex items-center gap-3">
            <PortalGradient color={pCfg.color} glow={pCfg.glow} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">New Time Warp Session</h3>
              <p className="text-xs text-slate-500 mt-0.5">Step into another version of yourself to see clearly.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Perspective</label>
              <select value={form.perspective}
                onChange={e => setForm(f => ({ ...f, perspective: e.target.value as PerspectiveKey }))}
                className="game-input w-full text-sm">
                {(Object.entries(PERSPECTIVE_CONFIG) as [PerspectiveKey, typeof pCfg][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Domain</label>
              <select value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value as DomainKey }))}
                className="game-input w-full text-sm">
                {(Object.entries(DOMAIN_CONFIG) as [DomainKey, typeof DOMAIN_CONFIG.career][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Current situation / decision</label>
            <textarea value={form.situation}
              onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
              placeholder="What are you facing right now?" rows={2}
              className="game-input w-full text-sm resize-none" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block" style={{ color: pCfg.color }}>
              What does your {pCfg.description} self say?
            </label>
            <textarea value={form.warpedAdvice}
              onChange={e => setForm(f => ({ ...f, warpedAdvice: e.target.value }))}
              placeholder={`Write in first person as your ${pCfg.description} self...`} rows={3}
              className="game-input w-full text-sm resize-none" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Key insight extracted</label>
            <input value={form.keyInsight}
              onChange={e => setForm(f => ({ ...f, keyInsight: e.target.value }))}
              placeholder="The core truth this perspective reveals..." className="game-input w-full text-sm" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Actionables (up to 3)</label>
            <div className="space-y-2">
              {form.actionables.map((a, i) => (
                <input key={i} value={a}
                  onChange={e => setForm(f => ({ ...f, actionables: f.actionables.map((x, j) => j === i ? e.target.value : x) }))}
                  placeholder={`Action ${i + 1}`} className="game-input w-full text-sm" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-500">Emotional shift / clarity gained</label>
              <span className="text-xs font-semibold" style={{ color: form.emotionalShift >= 0 ? '#4ade80' : '#f87171' }}>
                {form.emotionalShift > 0 ? '+' : ''}{form.emotionalShift}
              </span>
            </div>
            <input type="range" min={-5} max={5} step={1} value={form.emotionalShift}
              onChange={e => setForm(f => ({ ...f, emotionalShift: Number(e.target.value) }))}
              className="w-full h-1" style={{ accentColor: pCfg.color }} />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
              <span>-5 Darker</span><span>0</span><span>+5 Clearer</span>
            </div>
          </div>

          <button onClick={submit}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: `linear-gradient(90deg, ${pCfg.color}80, ${pCfg.glow})` }}>
            Log Time Warp
          </button>
        </div>
      )}

      {tab === 'archive' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search insights, situations..." className="game-input w-full text-sm pl-9" />
            </div>
            <select value={filterDomain}
              onChange={e => setFilterDomain(e.target.value as DomainKey | 'all')}
              className="game-input text-sm">
              <option value="all">All domains</option>
              {(Object.entries(DOMAIN_CONFIG) as [DomainKey, typeof DOMAIN_CONFIG.career][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {entries.length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Clarity by Perspective</h3>
              <ClarityChart entries={entries} />
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(e => {
              const pc = PERSPECTIVE_CONFIG[e.perspective]
              const dc = DOMAIN_CONFIG[e.domain]
              const isExpanded = expandedId === e.id
              return (
                <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${pc.color}` }}>
                  <button className="w-full p-3 text-left flex items-start gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                    <PortalGradient color={pc.color} glow={pc.glow} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-semibold" style={{ color: pc.color }}>{pc.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: dc.color + '20', color: dc.color }}>{dc.label}</span>
                        <span className="text-xs" style={{ color: e.emotionalShift >= 0 ? '#4ade80' : '#f87171' }}>
                          {e.emotionalShift > 0 ? '+' : ''}{e.emotionalShift} clarity
                        </span>
                        <span className="text-xs text-slate-600 ml-auto">{e.date}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{e.situation}</p>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium line-clamp-1">"{e.keyInsight}"</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-800 pt-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Warped advice</p>
                        <p className="text-xs text-slate-300 italic">"{e.warpedAdvice}"</p>
                      </div>
                      {e.actionables.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Actionables</p>
                          <ul className="space-y-0.5">
                            {e.actionables.map((a, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                                <span style={{ color: pc.color }}>→</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <button onClick={() => toggleCompare(e.id)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${compareIds.includes(e.id) ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                          {compareIds.includes(e.id) ? 'Remove from compare' : 'Add to compare'}
                        </button>
                        <button onClick={() => remove(e.id)} className="text-slate-700 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-600">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No warps found. Step through the portal.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Select up to 4 entries from the Archive tab to compare perspectives on the same or different situations.</p>
          {compareEntries.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Go to Archive and add entries to compare.</p>
            </div>
          )}
          {compareEntries.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(compareEntries.length, 2)}, 1fr)` }}>
              {compareEntries.map(e => {
                const pc = PERSPECTIVE_CONFIG[e.perspective]
                const dc = DOMAIN_CONFIG[e.domain]
                return (
                  <div key={e.id} className="game-card p-4 space-y-2" style={{ borderTop: `3px solid ${pc.color}` }}>
                    <div className="flex items-center gap-2">
                      <PortalGradient color={pc.color} glow={pc.glow} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: pc.color }}>{pc.label}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: dc.color + '20', color: dc.color }}>{dc.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Situation</p>
                    <p className="text-xs text-slate-300">{e.situation}</p>
                    <p className="text-xs text-slate-500 font-medium">Advice</p>
                    <p className="text-xs text-slate-300 italic">"{e.warpedAdvice}"</p>
                    <p className="text-xs text-slate-500 font-medium">Key insight</p>
                    <p className="text-xs text-blue-300 font-semibold">"{e.keyInsight}"</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Clarity:</span>
                      <span className="text-xs font-bold" style={{ color: e.emotionalShift >= 0 ? '#4ade80' : '#f87171' }}>
                        {e.emotionalShift > 0 ? '+' : ''}{e.emotionalShift}
                      </span>
                    </div>
                    <button onClick={() => toggleCompare(e.id)} className="text-xs text-slate-600 hover:text-red-400 mt-1">Remove</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'letter' && (
        <div className="space-y-4">
          {futureLetter.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Log future-self warps to generate your letter.</p>
            </div>
          ) : (
            <div className="game-card p-6 space-y-4"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', fontFamily: 'Georgia, serif' }}>
              <div className="text-center">
                <Mail className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
                <h2 className="text-lg font-bold text-yellow-300">Letter from Your Future Self</h2>
                <p className="text-xs text-slate-500 mt-1">Compiled from your highest-clarity future warps</p>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-300 italic mb-4">Dear present me,</p>
                {futureLetter.map((e, i) => {
                  const pc = PERSPECTIVE_CONFIG[e.perspective]
                  return (
                    <div key={e.id} className="mb-4">
                      <p className="text-xs font-semibold mb-1" style={{ color: pc.color }}>— From {pc.label}</p>
                      <p className="text-sm text-slate-200 italic leading-relaxed">"{e.warpedAdvice}"</p>
                      {i < futureLetter.length - 1 && <div className="mt-3 border-b border-slate-800" />}
                    </div>
                  )
                })}
                <div className="mt-4 border-t border-slate-700 pt-4">
                  <p className="text-sm text-slate-400 italic mb-3">The lessons I want you to carry:</p>
                  <ul className="space-y-2">
                    {futureLetter.map(e => (
                      <li key={e.id} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-yellow-400 mt-0.5">★</span>
                        {e.keyInsight}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-slate-400 italic mt-4 text-right">With love and hard-won clarity,<br />
                  <span className="text-white font-semibold">Your Future Self</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
