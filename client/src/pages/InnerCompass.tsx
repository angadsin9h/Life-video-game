import React, { useState, useEffect } from 'react'
import { Compass, Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CompassCheck = {
  id: string
  date: string
  decision: string
  options: string[]
  valuesAlignment: number
  intuitionPull: string
  logicFavors: string
  fearChoosing: string
  loveChoosing: string
  chosen: string
  reasoning: string
  outcome: string
  outcomeRating: number
  reviewed: boolean
}

const STORAGE_KEY = 'lq-innercompass'

const emptyForm = (): Omit<CompassCheck, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  decision: '',
  options: ['', ''],
  valuesAlignment: 7,
  intuitionPull: '',
  logicFavors: '',
  fearChoosing: '',
  loveChoosing: '',
  chosen: '',
  reasoning: '',
  outcome: '',
  outcomeRating: 0,
  reviewed: false,
})

function CompassRoseSVG({ intuition, logic, fear, love }: { intuition: string; logic: string; fear: string; love: string }) {
  const cx = 200
  const cy = 200
  const r = 80
  const petalLen = 110
  const petalW = 28

  const petals = [
    { label: 'Intuition', sub: intuition, angle: -90, color: '#22d3ee', textY: cy - petalLen - 18 },
    { label: 'Logic',     sub: logic,     angle: 0,   color: '#3b82f6', textY: cy },
    { label: 'Fear',      sub: fear,      angle: 90,  color: '#f87171', textY: cy + petalLen + 26 },
    { label: 'Love',      sub: love,      angle: 180, color: '#fb7185', textY: cy },
  ]

  return (
    <svg viewBox="0 0 400 400" width="100%" style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}>
      <defs>
        <radialGradient id="roseGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b45309" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={170} fill="url(#roseGlow)" />
      <circle cx={cx} cy={cy} r={r} fill="#0f172a" stroke="#b45309" strokeWidth="1.5" />

      {petals.map((p) => {
        const rad = (p.angle * Math.PI) / 180
        const x1 = cx + Math.cos(rad) * (r - 10)
        const y1 = cy + Math.sin(rad) * (r - 10)
        const x2 = cx + Math.cos(rad) * (r + petalLen)
        const y2 = cy + Math.sin(rad) * (r + petalLen)
        const nx = -Math.sin(rad)
        const ny = Math.cos(rad)
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2
        const cpx = mx + nx * petalW * 1.5
        const cpy = my + ny * petalW * 1.5
        const cpx2 = mx - nx * petalW * 1.5
        const cpy2 = my - ny * petalW * 1.5

        const labelX = cx + Math.cos(rad) * (r + petalLen + 20)
        const labelY = cy + Math.sin(rad) * (r + petalLen + 20)
        const subX = cx + Math.cos(rad) * (r + petalLen + 36)
        const subY = cy + Math.sin(rad) * (r + petalLen + 36)

        return (
          <g key={p.label}>
            <path
              d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2} Q ${cpx2} ${cpy2} ${x1} ${y1} Z`}
              fill={p.color + '30'}
              stroke={p.color}
              strokeWidth="1.5"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={p.color}
              fontSize="11"
              fontWeight="700"
              fontFamily="Orbitron, monospace"
              letterSpacing="0.5"
            >
              {p.label.toUpperCase()}
            </text>
            {p.sub && (
              <text
                x={subX}
                y={subY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#cbd5e1"
                fontSize="9.5"
                fontFamily="sans-serif"
              >
                {p.sub.length > 16 ? p.sub.slice(0, 15) + '…' : p.sub}
              </text>
            )}
          </g>
        )
      })}

      {[45, 135, 225, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        return (
          <line
            key={angle}
            x1={cx + Math.cos(rad) * (r - 5)}
            y1={cy + Math.sin(rad) * (r - 5)}
            x2={cx + Math.cos(rad) * (r + 55)}
            y2={cy + Math.sin(rad) * (r + 55)}
            stroke="#b4530940"
            strokeWidth="1"
          />
        )
      })}

      <circle cx={cx} cy={cy} r={10} fill="#b45309" />
      <circle cx={cx} cy={cy} r={4} fill="#fde68a" />
    </svg>
  )
}

export default function InnerCompass() {
  const { toastSuccess } = useToast()
  const [checks, setChecks] = useState<CompassCheck[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CompassCheck, 'id'>>(emptyForm())
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<Record<string, { outcome: string; outcomeRating: number }>>({})
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [tab, setTab] = useState<'new' | 'review' | 'archive'>('new')

  useEffect(() => {
    try { setChecks(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: CompassCheck[]) => {
    setChecks(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.decision.trim() || form.options.filter(o => o.trim()).length < 2) return
    const entry: CompassCheck = { id: Date.now().toString(), ...form, options: form.options.filter(o => o.trim()) }
    persist([entry, ...checks])
    setForm(emptyForm())
    setShowForm(false)
    toastSuccess('Compass check saved — trust the process')
  }

  const addOption = () => {
    if (form.options.length >= 4) return
    setForm(f => ({ ...f, options: [...f.options, ''] }))
  }

  const removeOption = (i: number) => {
    setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))
  }

  const updateOption = (i: number, val: string) => {
    setForm(f => {
      const opts = [...f.options]
      opts[i] = val
      return { ...f, options: opts }
    })
  }

  const submitReview = (id: string) => {
    const data = reviewData[id]
    if (!data?.outcome?.trim()) return
    persist(checks.map(c => c.id === id ? { ...c, outcome: data.outcome, outcomeRating: data.outcomeRating, reviewed: true } : c))
    setExpandedReview(null)
    toastSuccess('Outcome recorded — wisdom gained')
  }

  const deleteCheck = (id: string) => persist(checks.filter(c => c.id !== id))

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const reviewQueue = checks.filter(c => !c.reviewed && !c.outcome && new Date(c.date) <= thirtyDaysAgo)

  const reviewed = checks.filter(c => c.reviewed)
  const intuitionLoveAgreed = reviewed.filter(c => c.intuitionPull === c.loveChoosing)
  const highRatedAgreed = intuitionLoveAgreed.filter(c => c.outcomeRating >= 7).length
  const agreementPercent = intuitionLoveAgreed.length > 0
    ? Math.round((highRatedAgreed / intuitionLoveAgreed.length) * 100)
    : null

  const sorted = [...checks].sort((a, b) => {
    const d = new Date(a.date).getTime() - new Date(b.date).getTime()
    return sortDir === 'desc' ? -d : d
  })

  const ratingColor = (r: number) => {
    if (r >= 8) return '#22c55e'
    if (r >= 5) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7" style={{ color: '#b45309' }} />
            Inner Compass
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Align decisions with your values, intuition, and vision.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setTab('new') }}
          className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-semibold"
          style={{ background: '#92400e' }}
        >
          <Plus className="w-4 h-4" /> Check
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{checks.length}</div>
          <div className="text-xs text-slate-500">Decisions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: '#f59e0b' }}>{reviewQueue.length}</div>
          <div className="text-xs text-slate-500">Awaiting Review</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">
            {agreementPercent !== null ? `${agreementPercent}%` : '—'}
          </div>
          <div className="text-xs text-slate-500">Intuition+Love Hit</div>
        </div>
      </div>

      {agreementPercent !== null && (
        <div className="game-card p-3" style={{ borderLeft: '3px solid #22d3ee' }}>
          <p className="text-xs text-slate-300">
            When <span className="text-cyan-400 font-semibold">intuition</span> and <span className="text-rose-400 font-semibold">love</span> agreed,{' '}
            <span className="text-white font-bold">{agreementPercent}%</span> of reviewed decisions rated 7 or higher.
            ({intuitionLoveAgreed.length} data point{intuitionLoveAgreed.length !== 1 ? 's' : ''})
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {(['new', 'review', 'archive'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? 'text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            style={tab === t ? { background: '#78350f', color: '#fde68a' } : {}}
          >
            {t === 'review' ? `Review (${reviewQueue.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'new' && showForm && (
        <div className="game-card p-4 space-y-3" style={{ borderColor: '#92400e40', border: '1px solid' }}>
          <h3 className="text-sm font-semibold text-white">New Compass Check</h3>

          <div className="flex gap-2">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm"
              style={{ width: 140 }}
            />
          </div>

          <textarea
            value={form.decision}
            onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}
            placeholder="What decision are you facing? *"
            className="game-input w-full text-sm resize-none"
            rows={2}
            autoFocus
          />

          <div className="space-y-2">
            <p className="text-xs text-slate-500">Options (2–4)</p>
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}${i < 2 ? ' *' : ''}`}
                  className="game-input flex-1 text-sm"
                />
                {form.options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="text-slate-600 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {form.options.length < 4 && (
              <button
                onClick={addOption}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Values alignment: <span style={{ color: '#f59e0b' }}>{form.valuesAlignment}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.valuesAlignment}
              onChange={e => setForm(f => ({ ...f, valuesAlignment: Number(e.target.value) }))}
              className="w-full h-1"
              style={{ accentColor: '#b45309' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs mb-1" style={{ color: '#22d3ee' }}>Intuition pulls toward</p>
              <input
                value={form.intuitionPull}
                onChange={e => setForm(f => ({ ...f, intuitionPull: e.target.value }))}
                placeholder="Which option?"
                className="game-input w-full text-sm"
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#3b82f6' }}>Logic favors</p>
              <input
                value={form.logicFavors}
                onChange={e => setForm(f => ({ ...f, logicFavors: e.target.value }))}
                placeholder="Which option?"
                className="game-input w-full text-sm"
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#f87171' }}>Fear would choose</p>
              <input
                value={form.fearChoosing}
                onChange={e => setForm(f => ({ ...f, fearChoosing: e.target.value }))}
                placeholder="Which option?"
                className="game-input w-full text-sm"
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#fb7185' }}>Love / growth chooses</p>
              <input
                value={form.loveChoosing}
                onChange={e => setForm(f => ({ ...f, loveChoosing: e.target.value }))}
                placeholder="Which option?"
                className="game-input w-full text-sm"
              />
            </div>
          </div>

          {(form.intuitionPull || form.logicFavors || form.fearChoosing || form.loveChoosing) && (
            <div className="py-2">
              <CompassRoseSVG
                intuition={form.intuitionPull}
                logic={form.logicFavors}
                fear={form.fearChoosing}
                love={form.loveChoosing}
              />
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 mb-1">Final choice</p>
            <select
              value={form.chosen}
              onChange={e => setForm(f => ({ ...f, chosen: e.target.value }))}
              className="game-input w-full text-sm"
            >
              <option value="">Select an option…</option>
              {form.options.filter(o => o.trim()).map((o, i) => (
                <option key={i} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <textarea
            value={form.reasoning}
            onChange={e => setForm(f => ({ ...f, reasoning: e.target.value }))}
            placeholder="Your reasoning…"
            className="game-input w-full text-sm resize-none"
            rows={2}
          />

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!form.decision.trim() || form.options.filter(o => o.trim()).length < 2}
              className="flex-1 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: '#92400e' }}
            >
              Save Check
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm()) }}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tab === 'new' && !showForm && checks.length === 0 && (
        <div className="text-center py-14 text-slate-500">
          <Compass className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Your compass is ready. Log a decision to see the rose.</p>
        </div>
      )}

      {tab === 'new' && !showForm && checks.length > 0 && (
        <div className="space-y-2">
          {checks.slice(0, 5).map(c => (
            <div key={c.id} className="game-card p-3" style={{ borderLeft: '3px solid #b45309' }}>
              <p className="text-sm font-medium text-white line-clamp-1">{c.decision}</p>
              <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                <span>{c.date}</span>
                {c.chosen && <span style={{ color: '#f59e0b' }}>→ {c.chosen}</span>}
                {c.reviewed && c.outcomeRating > 0 && (
                  <span className="font-semibold" style={{ color: ratingColor(c.outcomeRating) }}>
                    {c.outcomeRating}/10
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'review' && (
        <div className="space-y-3">
          {reviewQueue.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No decisions awaiting outcome review.</p>
              <p className="text-xs mt-1 text-slate-600">Decisions 30+ days old with no outcome recorded will appear here.</p>
            </div>
          )}
          {reviewQueue.map(c => (
            <div key={c.id} className="game-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-1">{c.decision}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.date} · chose: <span style={{ color: '#f59e0b' }}>{c.chosen || '—'}</span></p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#78350f40', color: '#fde68a' }}>
                    Awaiting outcome
                  </span>
                  <button onClick={() => setExpandedReview(expandedReview === c.id ? null : c.id)}>
                    {expandedReview === c.id
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
              {expandedReview === c.id && (
                <div className="mt-3 space-y-2 pt-3 border-t border-slate-700">
                  <textarea
                    value={reviewData[c.id]?.outcome ?? ''}
                    onChange={e => setReviewData(r => ({ ...r, [c.id]: { ...r[c.id], outcome: e.target.value, outcomeRating: r[c.id]?.outcomeRating ?? 5 } }))}
                    placeholder="How did it turn out? *"
                    className="game-input w-full text-sm resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Outcome rating: <span style={{ color: '#f59e0b' }}>{reviewData[c.id]?.outcomeRating ?? 5}/10</span>
                    </p>
                    <input
                      type="range" min={1} max={10}
                      value={reviewData[c.id]?.outcomeRating ?? 5}
                      onChange={e => setReviewData(r => ({ ...r, [c.id]: { ...r[c.id], outcome: r[c.id]?.outcome ?? '', outcomeRating: Number(e.target.value) } }))}
                      className="w-full h-1"
                      style={{ accentColor: '#b45309' }}
                    />
                  </div>
                  <button
                    onClick={() => submitReview(c.id)}
                    className="w-full py-2 text-white rounded-xl text-sm font-semibold"
                    style={{ background: '#92400e' }}
                  >
                    Save Outcome
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'archive' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              Date {sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
          {sorted.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No decisions archived yet.</p>
            </div>
          )}
          {sorted.map(c => (
            <div key={c.id} className="game-card p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-2">{c.decision}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500">{c.date}</span>
                    {c.chosen && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#78350f40', color: '#fde68a' }}>
                        → {c.chosen}
                      </span>
                    )}
                    {c.reviewed && c.outcomeRating > 0 && (
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: ratingColor(c.outcomeRating) + '25', color: ratingColor(c.outcomeRating) }}
                      >
                        {c.outcomeRating}/10
                      </span>
                    )}
                    {!c.reviewed && <span className="text-xs text-slate-600">no outcome</span>}
                  </div>
                  {c.reasoning && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.reasoning}</p>}
                </div>
                <button onClick={() => deleteCheck(c.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
