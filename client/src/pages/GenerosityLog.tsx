import React, { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, Clock, BookOpen, Eye, Gift, Smile, Star, Repeat } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type GenerosityAct = {
  id: string
  date: string
  direction: 'given' | 'received'
  type: 'time' | 'money' | 'knowledge' | 'attention' | 'gift' | 'kindness' | 'forgiveness'
  toFrom: string
  description: string
  effort: number
  feeling: string
  anonymous: boolean
  ripple: string
}

const STORAGE_KEY = 'lq-generositylog'

type ActType = GenerosityAct['type']

const TYPE_CONFIG: Record<ActType, { label: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }>; color: string }> = {
  time:        { label: 'Time',        icon: Clock,    color: '#f59e0b' },
  money:       { label: 'Money',       icon: Star,     color: '#22c55e' },
  knowledge:   { label: 'Knowledge',   icon: BookOpen, color: '#3b82f6' },
  attention:   { label: 'Attention',   icon: Eye,      color: '#a855f7' },
  gift:        { label: 'Gift',        icon: Gift,     color: '#f97316' },
  kindness:    { label: 'Kindness',    icon: Smile,    color: '#ec4899' },
  forgiveness: { label: 'Forgiveness', icon: Repeat,   color: '#10b981' },
}

const emptyForm = (): Omit<GenerosityAct, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  direction: 'given',
  type: 'kindness',
  toFrom: '',
  description: '',
  effort: 5,
  feeling: '',
  anonymous: false,
  ripple: '',
})

function BalanceBeamSVG({ given, received }: { given: number; received: number }) {
  const total = given + received
  const tiltMax = 22
  const tilt = total === 0 ? 0 : ((given - received) / Math.max(total, 1)) * tiltMax

  const cx = 220
  const cy = 140
  const beamLen = 150
  const beamHalf = beamLen / 2
  const rad = (tilt * Math.PI) / 180

  const lx = cx - beamHalf * Math.cos(rad)
  const ly = cy - beamHalf * Math.sin(rad) + beamHalf * Math.sin(rad)
  const rx = cx + beamHalf * Math.cos(rad)
  const ry = cy + beamHalf * Math.sin(rad)

  const leftTx = lx
  const leftTy = ly + 30
  const rightTx = rx
  const rightTy = ry + 30

  const beamY1 = cy - beamHalf * Math.sin(rad)
  const beamY2 = cy + beamHalf * Math.sin(rad)

  return (
    <svg viewBox="0 0 440 220" width="100%" style={{ maxWidth: 420, display: 'block', margin: '0 auto' }}>
      <line x1={cx} y1={cy - 50} x2={cx} y2={cy + 10} stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <polygon points={`${cx - 18},${cy + 10} ${cx + 18},${cy + 10} ${cx},${cy - 5}`} fill="#b45309" />

      <line
        x1={cx - beamHalf}
        y1={beamY1}
        x2={cx + beamHalf}
        y2={beamY2}
        stroke="#d97706"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <line x1={leftTx} y1={beamY1} x2={leftTx} y2={leftTy - 5} stroke="#d9770680" strokeWidth="1.5" />
      <rect
        x={leftTx - 38}
        y={leftTy - 5}
        width={76}
        height={36}
        rx={8}
        fill="#16a34a20"
        stroke="#22c55e"
        strokeWidth="1.5"
      />
      <text x={leftTx} y={leftTy + 8} textAnchor="middle" fill="#22c55e" fontSize="15" fontWeight="700" fontFamily="Orbitron, monospace">
        {given}
      </text>
      <text x={leftTx} y={leftTy + 22} textAnchor="middle" fill="#86efac" fontSize="9" fontFamily="sans-serif">
        GIVEN
      </text>

      <line x1={rightTx} y1={beamY2} x2={rightTx} y2={rightTy - 5} stroke="#d9770680" strokeWidth="1.5" />
      <rect
        x={rightTx - 38}
        y={rightTy - 5}
        width={76}
        height={36}
        rx={8}
        fill="#7c3aed20"
        stroke="#a855f7"
        strokeWidth="1.5"
      />
      <text x={rightTx} y={rightTy + 8} textAnchor="middle" fill="#a855f7" fontSize="15" fontWeight="700" fontFamily="Orbitron, monospace">
        {received}
      </text>
      <text x={rightTx} y={rightTy + 22} textAnchor="middle" fill="#c4b5fd" fontSize="9" fontFamily="sans-serif">
        RECEIVED
      </text>

      {given > received && (
        <text x={cx} y={cy - 58} textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="sans-serif">
          Generous flow ✓
        </text>
      )}
    </svg>
  )
}

function DonutSVG({ acts }: { acts: GenerosityAct[] }) {
  const cx = 100
  const cy = 100
  const r = 60
  const inner = 36

  const counts: Partial<Record<ActType, number>> = {}
  for (const a of acts) {
    counts[a.type] = (counts[a.type] ?? 0) + 1
  }
  const total = acts.length
  if (total === 0) return (
    <div className="flex items-center justify-center h-24 text-slate-600 text-xs">No given acts yet</div>
  )

  const entries = (Object.keys(counts) as ActType[]).map(k => ({
    type: k,
    count: counts[k] ?? 0,
    color: TYPE_CONFIG[k].color,
    label: TYPE_CONFIG[k].label,
  }))

  let startAngle = -Math.PI / 2
  const slices = entries.map(e => {
    const sweep = (e.count / total) * 2 * Math.PI
    const end = startAngle + sweep
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    const ix1 = cx + inner * Math.cos(startAngle)
    const iy1 = cy + inner * Math.sin(startAngle)
    const ix2 = cx + inner * Math.cos(end)
    const iy2 = cy + inner * Math.sin(end)
    const large = sweep > Math.PI ? 1 : 0
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`
    startAngle = end
    return { ...e, path }
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" width={120} height={120} style={{ flexShrink: 0 }}>
        {slices.map(s => (
          <path key={s.type} d={s.path} fill={s.color + 'cc'} stroke="#0f172a" strokeWidth="1.5" />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="#f1f5f9" fontSize="14" fontWeight="700" fontFamily="Orbitron, monospace">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1 flex-wrap min-w-0">
        {slices.map(s => (
          <div key={s.type} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-slate-400">{s.label}</span>
            <span className="text-slate-300 font-medium ml-auto pl-2">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GenerosityLog() {
  const { toastSuccess } = useToast()
  const [acts, setActs] = useState<GenerosityAct[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GenerosityAct, 'id'>>(emptyForm())
  const [tab, setTab] = useState<'log' | 'stats' | 'ripples'>('log')

  useEffect(() => {
    try { setActs(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: GenerosityAct[]) => {
    setActs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.description.trim()) return
    const act: GenerosityAct = { id: Date.now().toString(), ...form }
    persist([act, ...acts])
    setForm(emptyForm())
    setShowForm(false)
    toastSuccess(form.direction === 'given' ? 'Act of generosity logged — it ripples out' : 'Gratitude noted — you were seen')
  }

  const givenActs = acts.filter(a => a.direction === 'given')
  const receivedActs = acts.filter(a => a.direction === 'received')
  const rippleActs = acts.filter(a => a.ripple.trim())
  const anonymousCount = givenActs.filter(a => a.anonymous).length

  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthCount = acts.filter(a => a.date.startsWith(thisMonthKey)).length

  const streakWeeks = (() => {
    if (givenActs.length === 0) return 0
    const weekSet = new Set<string>()
    for (const a of givenActs) {
      const d = new Date(a.date)
      const year = d.getFullYear()
      const start = new Date(year, 0, 1)
      const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
      weekSet.add(`${year}-W${week}`)
    }
    const today = new Date()
    let streak = 0
    let checkDate = new Date(today)
    while (true) {
      const year = checkDate.getFullYear()
      const start = new Date(year, 0, 1)
      const week = Math.ceil(((checkDate.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
      const key = `${year}-W${week}`
      if (!weekSet.has(key)) break
      streak++
      checkDate.setDate(checkDate.getDate() - 7)
    }
    return streak
  })()

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-emerald-400" />
            Generosity Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cultivate an abundant giving practice.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-lg font-bold text-emerald-400">{givenActs.length}</div>
          <div className="text-xs text-slate-500">Given</div>
        </div>
        <div className="game-card p-3">
          <div className="text-lg font-bold text-amber-400">{streakWeeks}w</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-lg font-bold text-white">{thisMonthCount}</div>
          <div className="text-xs text-slate-500">This month</div>
        </div>
        <div className="game-card p-3">
          <div className="text-lg font-bold text-yellow-300">{anonymousCount}</div>
          <div className="text-xs text-slate-500">Anon ✨</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['log', 'stats', 'ripples'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
          >
            {t === 'ripples' ? `Ripples (${rippleActs.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Act</h3>

          <div className="flex gap-2">
            <button
              onClick={() => setForm(f => ({ ...f, direction: 'given' }))}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.direction === 'given' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Given
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, direction: 'received' }))}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.direction === 'received' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Received
            </button>
          </div>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input text-sm"
            style={{ width: 150 }}
          />

          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(TYPE_CONFIG) as [ActType, typeof TYPE_CONFIG.time][]).map(([k, cfg]) => {
              const Icon = cfg.icon
              return (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, type: k }))}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${form.type === k ? 'text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                  style={form.type === k ? { background: cfg.color + '30', color: cfg.color, border: `1px solid ${cfg.color}60` } : {}}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          <input
            value={form.toFrom}
            onChange={e => setForm(f => ({ ...f, toFrom: e.target.value }))}
            placeholder={form.direction === 'given' ? 'To whom?' : 'From whom?'}
            className="game-input w-full text-sm"
            autoFocus
          />

          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What was the act? *"
            className="game-input w-full text-sm resize-none"
            rows={2}
          />

          <div>
            <p className="text-xs text-slate-500 mb-1">Effort: <span className="text-amber-400">{form.effort}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.effort}
              onChange={e => setForm(f => ({ ...f, effort: Number(e.target.value) }))}
              className="w-full h-1"
              style={{ accentColor: '#10b981' }}
            />
          </div>

          <input
            value={form.feeling}
            onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))}
            placeholder="How did it feel?"
            className="game-input w-full text-sm"
          />

          <input
            value={form.ripple}
            onChange={e => setForm(f => ({ ...f, ripple: e.target.value }))}
            placeholder="Ripple effect you noticed or imagined…"
            className="game-input w-full text-sm"
          />

          {form.direction === 'given' && (
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))}
              />
              Anonymous act ✨
            </label>
          )}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!form.description.trim()}
              className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Save
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

      {tab === 'log' && (
        <div className="space-y-2">
          {acts.length === 0 && !showForm && (
            <div className="text-center py-12 text-slate-500">
              <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Generosity is a muscle — begin logging to grow it.</p>
            </div>
          )}
          {acts.map(a => {
            const cfg = TYPE_CONFIG[a.type]
            const Icon = cfg.icon
            return (
              <div
                key={a.id}
                className="game-card p-3 flex items-start gap-3"
                style={{ borderLeft: `3px solid ${a.direction === 'given' ? '#10b981' : '#f59e0b'}` }}
              >
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: (a.direction === 'given' ? '#10b981' : '#f59e0b') + '20', color: a.direction === 'given' ? '#34d399' : '#fbbf24' }}
                    >
                      {a.direction}
                    </span>
                    <span className="text-xs text-slate-500">{cfg.label}</span>
                    {a.toFrom && <span className="text-xs text-slate-400">{a.direction === 'given' ? '→' : '←'} {a.toFrom}</span>}
                    {a.anonymous && <span className="text-xs text-yellow-300">✨</span>}
                    <span className="text-xs text-slate-600 ml-auto">{a.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{a.description}</p>
                  {a.feeling && <p className="text-xs text-slate-500 mt-0.5 italic">"{a.feeling}"</p>}
                </div>
                <button onClick={() => persist(acts.filter(x => x.id !== a.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="game-card p-4">
            <p className="text-xs text-slate-500 mb-3 text-center font-semibold uppercase tracking-wide">Balance of Generosity</p>
            <BalanceBeamSVG given={givenActs.length} received={receivedActs.length} />
          </div>

          <div className="game-card p-4">
            <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wide">Given Acts by Type</p>
            <DonutSVG acts={givenActs} />
          </div>

          <div className="game-card p-4 space-y-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Giving Highlights</p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Consecutive weeks giving</span>
              <span className="text-amber-400 font-bold">{streakWeeks}w</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Acts this month</span>
              <span className="text-white font-bold">{thisMonthCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Anonymous acts</span>
              <span className="text-yellow-300 font-bold">{anonymousCount} ✨</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total given</span>
              <span className="text-emerald-400 font-bold">{givenActs.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total received</span>
              <span className="text-purple-400 font-bold">{receivedActs.length}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'ripples' && (
        <div className="space-y-3">
          {rippleActs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No ripple effects recorded yet.</p>
              <p className="text-xs mt-1 text-slate-600">When logging an act, describe the ripple you noticed or imagined.</p>
            </div>
          )}
          {rippleActs.map(a => {
            const cfg = TYPE_CONFIG[a.type]
            const Icon = cfg.icon
            return (
              <div key={a.id} className="game-card p-3" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                  <span className="text-xs font-medium text-slate-300">{a.toFrom || cfg.label}</span>
                  <span className="text-xs text-slate-600 ml-auto">{a.date}</span>
                </div>
                <p className="text-xs text-slate-400 italic">"{a.ripple}"</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
