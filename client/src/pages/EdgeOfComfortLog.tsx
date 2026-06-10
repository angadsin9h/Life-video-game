import React, { useState, useEffect } from 'react'
import { Flame, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ComfortChallenge = {
  id: string
  date: string
  challenge: string
  domain: 'social' | 'physical' | 'creative' | 'professional' | 'intellectual' | 'vulnerability'
  discomfortLevel: number
  outcome: 'success' | 'partial' | 'failed' | 'abandoned'
  fearBefore: string
  actualResult: string
  growthInsight: string
  wouldRepeat: boolean
  nextEdge: string
}

const STORAGE_KEY = 'lq-edge-of-comfort'

const DOMAINS: { key: ComfortChallenge['domain']; label: string; color: string }[] = [
  { key: 'social',         label: 'Social',         color: '#f97316' },
  { key: 'physical',       label: 'Physical',       color: '#ef4444' },
  { key: 'creative',       label: 'Creative',       color: '#a855f7' },
  { key: 'professional',   label: 'Professional',   color: '#3b82f6' },
  { key: 'intellectual',   label: 'Intellectual',   color: '#22c55e' },
  { key: 'vulnerability',  label: 'Vulnerability',  color: '#ec4899' },
]

const DOMAIN_COLOR: Record<ComfortChallenge['domain'], string> = Object.fromEntries(
  DOMAINS.map(d => [d.key, d.color])
) as Record<ComfortChallenge['domain'], string>

const OUTCOMES: { key: ComfortChallenge['outcome']; label: string; color: string }[] = [
  { key: 'success',   label: 'Success',   color: '#22c55e' },
  { key: 'partial',   label: 'Partial',   color: '#f59e0b' },
  { key: 'failed',    label: 'Failed',    color: '#ef4444' },
  { key: 'abandoned', label: 'Abandoned', color: '#6b7280' },
]

const OUTCOME_COLOR: Record<ComfortChallenge['outcome'], string> = Object.fromEntries(
  OUTCOMES.map(o => [o.key, o.color])
) as Record<ComfortChallenge['outcome'], string>

const BLANK_FORM: Omit<ComfortChallenge, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  challenge: '',
  domain: 'social',
  discomfortLevel: 5,
  outcome: 'success',
  fearBefore: '',
  actualResult: '',
  growthInsight: '',
  wouldRepeat: false,
  nextEdge: '',
}

function RadarChart({ challenges }: { challenges: ComfortChallenge[] }) {
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 28
  const N = DOMAINS.length

  const angleOf = (i: number) => (i / N) * 2 * Math.PI - Math.PI / 2
  const pt = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(angleOf(i)),
    cy + r * Math.sin(angleOf(i)),
  ]

  const avgPerDomain = DOMAINS.map(d => {
    const relevant = challenges.filter(c => c.domain === d.key)
    if (!relevant.length) return 0
    const avgDiscomfort = relevant.reduce((s, c) => s + c.discomfortLevel, 0) / relevant.length
    const countBonus = Math.min(relevant.length / 5, 1)
    return Math.min((avgDiscomfort / 10) * 0.7 + countBonus * 0.3, 1)
  })

  const scorePts = DOMAINS.map((_, i) => pt(i, avgPerDomain[i] * maxR).join(',')).join(' ')

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg width={size} height={size} className="mx-auto">
      {gridLevels.map(lvl => (
        <polygon
          key={lvl}
          points={DOMAINS.map((_, i) => pt(i, lvl * maxR).join(',')).join(' ')}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
        />
      ))}
      {DOMAINS.map((_, i) => {
        const [x, y] = pt(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />
      })}
      <polygon
        points={scorePts}
        fill="rgba(249,115,22,0.18)"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {DOMAINS.map((d, i) => {
        const r = avgPerDomain[i] * maxR
        const [px, py] = pt(i, r)
        return (
          <circle key={d.key} cx={px} cy={py} r={4} fill={d.color} />
        )
      })}
      {DOMAINS.map((d, i) => {
        const [lx, ly] = pt(i, maxR + 14)
        const anchor = lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle'
        return (
          <text key={d.key} x={lx} y={ly + 4} textAnchor={anchor} fill="#94a3b8" fontSize="9" fontWeight="600">
            {d.label.toUpperCase()}
          </text>
        )
      })}
    </svg>
  )
}

export default function EdgeOfComfortLog() {
  const { toastSuccess } = useToast()
  const [challenges, setChallenges] = useState<ComfortChallenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ComfortChallenge, 'id'>>(BLANK_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try { setChallenges(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: ComfortChallenge[]) => {
    setChallenges(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.challenge.trim()) return
    const entry: ComfortChallenge = { id: Date.now().toString(), ...form }
    persist([entry, ...challenges])
    setForm({ ...BLANK_FORM, date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    toastSuccess('Brave act logged — comfort zone expanding!')
  }

  const growthStreak = (() => {
    const days = [...new Set(challenges.map(c => c.date))].sort().reverse()
    let streak = 0
    let cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    for (const day of days) {
      const d = new Date(day)
      d.setHours(0, 0, 0, 0)
      const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000)
      if (diff <= 1) { streak++; cursor = d } else break
    }
    return streak
  })()

  const avgDiscomfort = challenges.length
    ? challenges.reduce((s, c) => s + c.discomfortLevel, 0) / challenges.length
    : 0

  const braveryLevel = (() => {
    const score = avgDiscomfort * (challenges.length > 0 ? Math.min(challenges.length / 10, 2) : 0)
    if (score >= 12) return { label: 'Legendary', color: '#f59e0b' }
    if (score >= 8) return { label: 'Fearless', color: '#f97316' }
    if (score >= 5) return { label: 'Bold', color: '#fb923c' }
    if (score >= 2) return { label: 'Brave', color: '#fbbf24' }
    return { label: 'Novice', color: '#94a3b8' }
  })()

  const domainCounts = DOMAINS.map(d => ({
    ...d,
    count: challenges.filter(c => c.domain === d.key).length,
  })).sort((a, b) => b.count - a.count)

  const fearGapChallenges = challenges.filter(c => c.fearBefore && c.actualResult)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-orange-400" />
            Edge of Comfort
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track brave acts. Expand your comfort zone.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{challenges.length}</div>
          <div className="text-xs text-slate-500">Acts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{growthStreak}</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgDiscomfort.toFixed(1)}</div>
          <div className="text-xs text-slate-500">Avg Edge</div>
        </div>
        <div className="game-card p-3">
          <div className="text-sm font-bold" style={{ color: braveryLevel.color }}>{braveryLevel.label}</div>
          <div className="text-xs text-slate-500">Bravery</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log a Brave Act</h3>
          <textarea
            value={form.challenge}
            onChange={e => setForm(f => ({ ...f, challenge: e.target.value }))}
            placeholder="What did you do that pushed your limits? *"
            className="game-input w-full h-14 resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value as ComfortChallenge['domain'] }))}
              className="game-input text-sm flex-1"
            >
              {DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1"
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Discomfort level: <span className="text-orange-400 font-bold">{form.discomfortLevel}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.discomfortLevel}
              onChange={e => setForm(f => ({ ...f, discomfortLevel: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {OUTCOMES.map(o => (
              <label key={o.key} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="outcome"
                  checked={form.outcome === o.key}
                  onChange={() => setForm(f => ({ ...f, outcome: o.key }))}
                  className="accent-orange-400"
                />
                <span className="text-xs" style={{ color: o.color }}>{o.label}</span>
              </label>
            ))}
          </div>
          <input
            value={form.fearBefore}
            onChange={e => setForm(f => ({ ...f, fearBefore: e.target.value }))}
            placeholder="What did you fear beforehand?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.actualResult}
            onChange={e => setForm(f => ({ ...f, actualResult: e.target.value }))}
            placeholder="What actually happened?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.growthInsight}
            onChange={e => setForm(f => ({ ...f, growthInsight: e.target.value }))}
            placeholder="Growth insight from this experience"
            className="game-input w-full text-sm"
          />
          <input
            value={form.nextEdge}
            onChange={e => setForm(f => ({ ...f, nextEdge: e.target.value }))}
            placeholder="What's the next edge in this domain?"
            className="game-input w-full text-sm"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.wouldRepeat}
              onChange={e => setForm(f => ({ ...f, wouldRepeat: e.target.checked }))}
              className="accent-orange-400"
            />
            <span className="text-xs text-slate-400">I would do this again</span>
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {challenges.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Comfort Zone Expansion Map</h3>
          <RadarChart challenges={challenges} />
          <p className="text-center text-xs text-slate-500 mt-2">Zone size = avg discomfort × frequency per domain</p>
        </div>
      )}

      {fearGapChallenges.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Fear vs Reality Gap</h3>
          {fearGapChallenges.slice(0, 3).map(c => (
            <div key={c.id} className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-2">
                <p className="text-red-400 font-semibold mb-1">I feared…</p>
                <p className="text-slate-300">{c.fearBefore}</p>
              </div>
              <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-2">
                <p className="text-green-400 font-semibold mb-1">What happened</p>
                <p className="text-slate-300">{c.actualResult}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {challenges.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Domain Leaderboard</h3>
          <div className="space-y-2">
            {domainCounts.map((d, i) => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-slate-300">{d.label}</span>
                    <span className="text-xs text-slate-500">{d.count} act{d.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: domainCounts[0].count ? `${(d.count / domainCounts[0].count) * 100}%` : '0%',
                        background: d.color,
                      }}
                    />
                  </div>
                </div>
                {d.count === 0 && <span className="text-xs text-slate-600">Neglected</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {challenges.map(c => (
          <div
            key={c.id}
            className="game-card p-3"
            style={{ borderLeft: `3px solid ${DOMAIN_COLOR[c.domain]}` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: DOMAIN_COLOR[c.domain] }}
                  >
                    {c.domain}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: OUTCOME_COLOR[c.outcome] + '22', color: OUTCOME_COLOR[c.outcome] }}
                  >
                    {c.outcome}
                  </span>
                  <span className="text-xs text-orange-400">🔥 {c.discomfortLevel}/10</span>
                  {c.wouldRepeat && <span className="text-xs text-yellow-400">↩ Repeat</span>}
                </div>
                <p className="text-sm text-white mt-1 line-clamp-2">{c.challenge}</p>
                {c.growthInsight && expandedId !== c.id && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">💡 {c.growthInsight}</p>
                )}
                {expandedId === c.id && (
                  <div className="mt-2 space-y-1.5">
                    {c.fearBefore && (
                      <p className="text-xs text-red-300/80">😨 Feared: {c.fearBefore}</p>
                    )}
                    {c.actualResult && (
                      <p className="text-xs text-green-300/80">✅ Reality: {c.actualResult}</p>
                    )}
                    {c.growthInsight && (
                      <p className="text-xs text-yellow-300/80">💡 {c.growthInsight}</p>
                    )}
                    {c.nextEdge && (
                      <p className="text-xs text-orange-300/80">→ Next edge: {c.nextEdge}</p>
                    )}
                    <p className="text-xs text-slate-600">{c.date}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="text-slate-600 hover:text-slate-300"
                >
                  {expandedId === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => persist(challenges.filter(x => x.id !== c.id))}
                  className="text-slate-700 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {challenges.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Flame className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Comfort is the enemy of growth. Log your first brave act.</p>
          </div>
        )}
      </div>
    </div>
  )
}
