import React, { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, Check, X, Waves } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-resonance'

type ResonanceType = 'high' | 'low' | 'mixed'
type DomainKey = 'work' | 'social' | 'creative' | 'values' | 'body' | 'environment' | 'identity'

type ResonanceEntry = {
  id: string
  date: string
  trigger: string
  resonanceType: ResonanceType
  domain: DomainKey
  bodySignal: string
  authentic: boolean
  performative: boolean
  insight: string
  action: string
  followedThrough: boolean
}

type Tab = 'checkin' | 'map' | 'portrait' | 'followthrough'

const RESONANCE_CONFIG: Record<ResonanceType, { label: string; color: string; bg: string }> = {
  high:  { label: 'High Resonance',  color: '#a78bfa', bg: '#7c3aed20' },
  low:   { label: 'Low Resonance',   color: '#f87171', bg: '#ef444420' },
  mixed: { label: 'Mixed',           color: '#fb923c', bg: '#f9731620' },
}

const DOMAIN_CONFIG: Record<DomainKey, { label: string; color: string }> = {
  work:        { label: 'Work',        color: '#60a5fa' },
  social:      { label: 'Social',      color: '#f472b6' },
  creative:    { label: 'Creative',    color: '#fb923c' },
  values:      { label: 'Values',      color: '#a78bfa' },
  body:        { label: 'Body',        color: '#4ade80' },
  environment: { label: 'Environment', color: '#34d399' },
  identity:    { label: 'Identity',    color: '#facc15' },
}

const BLANK_FORM: Omit<ResonanceEntry, 'id' | 'date' | 'followedThrough'> = {
  trigger: '',
  resonanceType: 'high',
  domain: 'work',
  bodySignal: '',
  authentic: false,
  performative: false,
  insight: '',
  action: '',
}

function ResonanceMapSVG({ entries }: { entries: ResonanceEntry[] }) {
  if (entries.length === 0) return null

  const domains = Object.keys(DOMAIN_CONFIG) as DomainKey[]
  const W = 340
  const H = 220
  const padL = 80
  const padB = 30
  const chartW = W - padL - 10
  const chartH = H - padB - 20

  const domainFreq = domains.map(d => ({
    domain: d,
    count: entries.filter(e => e.domain === d).length,
  }))
  const maxFreq = Math.max(...domainFreq.map(d => d.count), 1)

  const points = entries.map(e => {
    const dIdx = domains.indexOf(e.domain)
    const domainFreqCount = entries.filter(x => x.domain === e.domain).length
    const xNorm = domainFreqCount / maxFreq
    const authCount = entries.filter(x => x.domain === e.domain && x.authentic).length
    const perfCount = entries.filter(x => x.domain === e.domain && x.performative).length
    const total = authCount + perfCount || 1
    const yNorm = authCount / total
    const x = padL + xNorm * chartW
    const y = (H - padB) - yNorm * chartH
    return { e, x, y }
  })

  const jittered = points.map((p, i) => ({
    ...p,
    x: p.x + ((i * 17) % 20) - 10,
    y: p.y + ((i * 13) % 16) - 8,
  }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
      <line x1={padL} y1={H - padB} x2={W - 10} y2={H - padB} stroke="#334155" strokeWidth="1" />
      <line x1={padL} y1={20} x2={padL} y2={H - padB} stroke="#334155" strokeWidth="1" />
      <text x={padL - 5} y={24} textAnchor="end" fill="#64748b" fontSize="8">Authentic</text>
      <text x={padL - 5} y={H - padB + 2} textAnchor="end" fill="#64748b" fontSize="8">Performative</text>
      <text x={padL} y={H - 4} fill="#64748b" fontSize="8">Rare</text>
      <text x={W - 15} y={H - 4} fill="#64748b" fontSize="8">Frequent</text>
      {jittered.map(({ e, x, y }, i) => {
        const rc = RESONANCE_CONFIG[e.resonanceType]
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill={rc.color} opacity="0.7" />
            <circle cx={x} cy={y} r="5" fill="none" stroke={rc.color} strokeWidth="1" opacity="0.5" />
          </g>
        )
      })}
      <g>
        {(['high', 'low', 'mixed'] as ResonanceType[]).map((rt, i) => (
          <g key={rt}>
            <circle cx={padL + 10 + i * 70} cy={15} r="4" fill={RESONANCE_CONFIG[rt].color} opacity="0.7" />
            <text x={padL + 16 + i * 70} y={18} fill="#94a3b8" fontSize="7">{RESONANCE_CONFIG[rt].label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

function AlignmentRing({ score }: { score: number }) {
  const r = 52
  const cx = 68
  const cy = 68
  const circumference = 2 * Math.PI * r
  const filled = (score / 100) * circumference
  const color = score >= 70 ? '#a78bfa' : score >= 40 ? '#fb923c' : '#f87171'
  return (
    <svg viewBox="0 0 136 136" className="w-32 h-32 mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity="0.85" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="bold"
        style={{ fontFamily: 'Orbitron, monospace' }}>{score}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="8">Alignment</text>
    </svg>
  )
}

export default function ResonanceJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ResonanceEntry[]>([])
  const [tab, setTab] = useState<Tab>('checkin')
  const [form, setForm] = useState<Omit<ResonanceEntry, 'id' | 'date' | 'followedThrough'>>(BLANK_FORM)

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  function persist(updated: ResonanceEntry[]) {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function submit() {
    if (!form.trigger.trim() || !form.bodySignal.trim()) return
    const entry: ResonanceEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...form,
      followedThrough: false,
    }
    persist([entry, ...entries])
    setForm(BLANK_FORM)
    toastSuccess('Resonance checked — your body knows the truth')
  }

  function remove(id: string) {
    persist(entries.filter(e => e.id !== id))
  }

  function toggleFollowThrough(id: string) {
    persist(entries.map(e => e.id === id ? { ...e, followedThrough: !e.followedThrough } : e))
  }

  const alignmentScore = entries.length
    ? Math.round((entries.filter(e => e.authentic && e.resonanceType === 'high').length / entries.length) * 100)
    : 0

  const highAuthenticEntries = entries.filter(e => e.authentic && e.resonanceType === 'high')

  const domainFreq = (Object.keys(DOMAIN_CONFIG) as DomainKey[]).map(d => ({
    domain: d,
    highAuth: entries.filter(e => e.domain === d && e.authentic && e.resonanceType === 'high').length,
  })).filter(d => d.highAuth > 0).sort((a, b) => b.highAuth - a.highAuth)

  const withAction = entries.filter(e => e.action.trim())
  const followedCount = withAction.filter(e => e.followedThrough).length
  const followRate = withAction.length ? Math.round((followedCount / withAction.length) * 100) : 0

  const rc = RESONANCE_CONFIG[form.resonanceType]
  const dc = DOMAIN_CONFIG[form.domain]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="game-card p-5"
        style={{ background: 'linear-gradient(135deg, #0f1a10 0%, #1a0d2e 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
              <Waves className="w-7 h-7 text-violet-400" />
              Resonance Journal
            </h1>
            <p className="text-slate-400 text-sm mt-1">Track what feels authentic vs performative in your life.</p>
          </div>
          <AlignmentRing score={alignmentScore} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-lg font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{entries.length}</div>
          <div className="text-xs text-slate-500">Check-ins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-lg font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{highAuthenticEntries.length}</div>
          <div className="text-xs text-slate-500">High Authentic</div>
        </div>
        <div className="game-card p-3">
          <div className="text-lg font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>{followRate}%</div>
          <div className="text-xs text-slate-500">Follow-through</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['checkin', 'map', 'portrait', 'followthrough'] as Tab[]).map(t => {
          const labels: Record<Tab, string> = {
            checkin: '+ Check-in',
            map: 'Resonance Map',
            portrait: 'Authentic Portrait',
            followthrough: 'Follow-through',
          }
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {labels[t]}
            </button>
          )
        })}
      </div>

      {tab === 'checkin' && (
        <div className="game-card p-5 space-y-4" style={{ border: `1px solid ${rc.color}40` }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: rc.bg }}>
              <Waves className="w-6 h-6" style={{ color: rc.color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Resonance Check-in</h3>
              <p className="text-xs text-slate-500">What is your body and soul telling you right now?</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">What triggered this check-in?</label>
            <input value={form.trigger}
              onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
              placeholder="A conversation, task, decision, moment..." className="game-input w-full text-sm" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Resonance type</label>
              <div className="flex flex-col gap-1.5">
                {(['high', 'low', 'mixed'] as ResonanceType[]).map(rt => (
                  <button key={rt} onClick={() => setForm(f => ({ ...f, resonanceType: rt }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-all"
                    style={{
                      background: form.resonanceType === rt ? RESONANCE_CONFIG[rt].bg : '#1e293b',
                      color: form.resonanceType === rt ? RESONANCE_CONFIG[rt].color : '#64748b',
                      border: `1px solid ${form.resonanceType === rt ? RESONANCE_CONFIG[rt].color + '60' : 'transparent'}`,
                    }}>
                    {RESONANCE_CONFIG[rt].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Domain</label>
              <select value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value as DomainKey }))}
                className="game-input w-full text-sm">
                {(Object.entries(DOMAIN_CONFIG) as [DomainKey, typeof dc][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#4ade80' }}>
              Body signal — how does your body feel right now?
            </label>
            <textarea value={form.bodySignal}
              onChange={e => setForm(f => ({ ...f, bodySignal: e.target.value }))}
              placeholder="Tight chest, open heart, butterflies, heaviness, lightness, expansive, contracted..." rows={2}
              className="game-input w-full text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Authenticity check</label>
              <div className="space-y-2">
                <button onClick={() => setForm(f => ({ ...f, authentic: !f.authentic }))}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm"
                  style={{
                    background: form.authentic ? '#16a34a20' : '#1e293b',
                    border: `1px solid ${form.authentic ? '#4ade8060' : 'transparent'}`,
                    color: form.authentic ? '#4ade80' : '#64748b',
                  }}>
                  {form.authentic ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-sm border border-slate-600" />}
                  Authentic to self
                </button>
                <button onClick={() => setForm(f => ({ ...f, performative: !f.performative }))}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm"
                  style={{
                    background: form.performative ? '#dc262620' : '#1e293b',
                    border: `1px solid ${form.performative ? '#f8717160' : 'transparent'}`,
                    color: form.performative ? '#f87171' : '#64748b',
                  }}>
                  {form.performative ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-sm border border-slate-600" />}
                  For external approval
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Insight</label>
                <textarea value={form.insight}
                  onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
                  placeholder="What does this tell you?" rows={2}
                  className="game-input w-full text-sm resize-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Action to take</label>
            <input value={form.action}
              onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
              placeholder="What will you do based on this resonance check?" className="game-input w-full text-sm" />
          </div>

          <button onClick={submit}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: `linear-gradient(90deg, #7c3aed, #a855f7)` }}>
            Log Resonance Check-in
          </button>

          {entries.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-500 font-semibold">Recent check-ins</p>
              {entries.slice(0, 5).map(e => {
                const erc = RESONANCE_CONFIG[e.resonanceType]
                const edc = DOMAIN_CONFIG[e.domain]
                return (
                  <div key={e.id} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: '#0f172a' }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: erc.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-300 line-clamp-1">{e.trigger}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: edc.color + '20', color: edc.color }}>{edc.label}</span>
                      </div>
                      <div className="flex gap-2 mt-0.5">
                        {e.authentic && <span className="text-xs text-green-400">✓ Authentic</span>}
                        {e.performative && <span className="text-xs text-red-400">✗ Performative</span>}
                      </div>
                    </div>
                    <button onClick={() => remove(e.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'map' && (
        <div className="space-y-4">
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Resonance Map</h3>
            <p className="text-xs text-slate-500 mb-3">X = how often you engage with a domain, Y = authentic vs performative ratio</p>
            <ResonanceMapSVG entries={entries} />
            {entries.length === 0 && (
              <div className="text-center py-8 text-slate-600">
                <Waves className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">Log check-ins to see your resonance map.</p>
              </div>
            )}
          </div>
          <div className="game-card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Domain breakdown</h3>
            <div className="space-y-2">
              {(Object.keys(DOMAIN_CONFIG) as DomainKey[]).map(d => {
                const total = entries.filter(e => e.domain === d).length
                if (total === 0) return null
                const highAuth = entries.filter(e => e.domain === d && e.authentic && e.resonanceType === 'high').length
                const pct = Math.round((highAuth / total) * 100)
                const dCfg = DOMAIN_CONFIG[d]
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">{dCfg.label}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: dCfg.color }} />
                    </div>
                    <span className="text-xs font-semibold w-10 text-right" style={{ color: dCfg.color }}>{pct}%</span>
                    <span className="text-xs text-slate-600 w-12 text-right">{total} entries</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'portrait' && (
        <div className="space-y-4">
          <div className="game-card p-5 space-y-4"
            style={{ background: 'linear-gradient(135deg, #0f1a10 0%, #1a0d2e 100%)', border: '1px solid #7c3aed40' }}>
            <div className="text-center">
              <Heart className="w-8 h-8 mx-auto text-violet-400 mb-2" />
              <h2 className="text-lg font-bold text-violet-300" style={{ fontFamily: 'Orbitron, monospace' }}>
                Your Authentic Self Portrait
              </h2>
              <p className="text-xs text-slate-500 mt-1">Derived from your high-resonance authentic check-ins</p>
            </div>

            <AlignmentRing score={alignmentScore} />

            {domainFreq.length > 0 ? (
              <div>
                <p className="text-sm text-slate-300 text-center mb-3">
                  Your authentic self deeply resonates with:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {domainFreq.map(({ domain, highAuth }) => {
                    const dCfg = DOMAIN_CONFIG[domain]
                    return (
                      <div key={domain} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: dCfg.color + '20', color: dCfg.color, border: `1px solid ${dCfg.color}40` }}>
                        {dCfg.label} ({highAuth})
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center">Log high-resonance authentic entries to reveal your portrait.</p>
            )}

            {highAuthenticEntries.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Authentic moments</p>
                {highAuthenticEntries.slice(0, 5).map(e => (
                  <div key={e.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-violet-400" />
                    <div>
                      <p className="text-xs text-slate-300">{e.trigger}</p>
                      {e.insight && <p className="text-xs text-slate-500 italic mt-0.5">"{e.insight}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {entries.filter(e => e.performative).length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Areas of performativity to examine</p>
                {(Object.keys(DOMAIN_CONFIG) as DomainKey[])
                  .filter(d => entries.some(e => e.domain === d && e.performative))
                  .map(d => {
                    const dCfg = DOMAIN_CONFIG[d]
                    const count = entries.filter(e => e.domain === d && e.performative).length
                    return (
                      <div key={d} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-xs" style={{ color: dCfg.color }}>{dCfg.label}</span>
                        <span className="text-xs text-slate-600">({count} times)</span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'followthrough' && (
        <div className="space-y-4">
          <div className="game-card p-4 text-center">
            <h3 className="text-sm font-semibold text-white mb-1">Action Follow-through Rate</h3>
            <div className="text-3xl font-bold mt-3 mb-1" style={{ color: followRate >= 70 ? '#4ade80' : followRate >= 40 ? '#fb923c' : '#f87171', fontFamily: 'Orbitron, monospace' }}>
              {followRate}%
            </div>
            <p className="text-xs text-slate-500">{followedCount} of {withAction.length} actions completed</p>
            {withAction.length > 0 && (
              <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${followRate}%`, background: followRate >= 70 ? '#4ade80' : followRate >= 40 ? '#fb923c' : '#f87171' }} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            {withAction.length === 0 && (
              <div className="text-center py-10 text-slate-600">
                <Check className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Log check-ins with actions to track follow-through.</p>
              </div>
            )}
            {withAction.map(e => {
              const erc = RESONANCE_CONFIG[e.resonanceType]
              const edc = DOMAIN_CONFIG[e.domain]
              return (
                <div key={e.id} className="game-card p-3 flex items-start gap-3"
                  style={{ borderLeft: `3px solid ${e.followedThrough ? '#4ade80' : '#475569'}` }}>
                  <button onClick={() => toggleFollowThrough(e.id)}
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                    style={{
                      background: e.followedThrough ? '#16a34a' : '#1e293b',
                      border: `2px solid ${e.followedThrough ? '#4ade80' : '#475569'}`,
                    }}>
                    {e.followedThrough && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: erc.bg, color: erc.color }}>{erc.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: edc.color + '20', color: edc.color }}>{edc.label}</span>
                      <span className="text-xs text-slate-600">{e.date}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-0.5 line-clamp-1">{e.trigger}</p>
                    <p className="text-xs text-violet-300 font-medium">Action: {e.action}</p>
                    {!e.followedThrough && (
                      <p className="text-xs text-slate-600 mt-0.5 italic">Tap the circle when done</p>
                    )}
                    {e.followedThrough && (
                      <p className="text-xs text-green-400 mt-0.5">Completed</p>
                    )}
                  </div>
                  <button onClick={() => remove(e.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
