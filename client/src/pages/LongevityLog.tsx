import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save, CheckSquare, Square, Leaf, Sun, Moon, Users, Heart, Flame, Wind, MapPin, Edit3, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LongevityPillar = {
  id: string
  name: string
  category: 'movement' | 'nutrition' | 'stress' | 'social' | 'purpose' | 'sleep' | 'environment'
  description: string
  targetBehavior: string
  frequency: 'daily' | 'weekly'
  active: boolean
}

type LongevityEntry = {
  id: string
  date: string
  completedPillarIds: string[]
  overallScore: number
  bodyFeel: number
  mentalClarity: number
  socialConnection: number
  notes: string
}

const STORAGE_KEY = 'lq-longevitylog'

const CAT_COLOR: Record<LongevityPillar['category'], string> = {
  movement:    '#22c55e',
  nutrition:   '#84cc16',
  stress:      '#0ea5e9',
  social:      '#f59e0b',
  purpose:     '#8b5cf6',
  sleep:       '#6366f1',
  environment: '#14b8a6',
}

const CAT_LABEL: Record<LongevityPillar['category'], string> = {
  movement:    'Movement',
  nutrition:   'Nutrition',
  stress:      'Stress',
  social:      'Social',
  purpose:     'Purpose',
  sleep:       'Sleep',
  environment: 'Environment',
}

const DEFAULT_PILLARS: LongevityPillar[] = [
  { id: 'p1', name: 'Movement Snacks', category: 'movement', description: 'Natural movement throughout the day', targetBehavior: 'Walk, stretch, or move every 30–60 min', frequency: 'daily', active: true },
  { id: 'p2', name: 'Plant-Rich Eating', category: 'nutrition', description: 'Diet centered on whole plants', targetBehavior: 'Make 80%+ of meals plant-based', frequency: 'daily', active: true },
  { id: 'p3', name: 'Quality Sleep', category: 'sleep', description: '7–9 hours of restorative sleep', targetBehavior: 'Sleep 7–9 hours at consistent times', frequency: 'daily', active: true },
  { id: 'p4', name: 'Stress Downshift', category: 'stress', description: 'Daily ritual to shed accumulated stress', targetBehavior: '10+ min of meditation, prayer, or quiet', frequency: 'daily', active: true },
  { id: 'p5', name: 'Purpose Practice', category: 'purpose', description: 'Ikigai — know why you wake up', targetBehavior: 'Engage with your why for 15+ min', frequency: 'daily', active: true },
  { id: 'p6', name: 'Close Friends Time', category: 'social', description: 'Deep connection with loved ones', targetBehavior: 'Meaningful time with close people', frequency: 'weekly', active: true },
  { id: 'p7', name: 'Belonging & Community', category: 'social', description: 'Part of a faith or values community', targetBehavior: 'Attend or participate in community event', frequency: 'weekly', active: true },
  { id: 'p8', name: 'Moderate / No Alcohol', category: 'nutrition', description: 'Minimal alcohol intake', targetBehavior: '0–1 drinks/day max, preferably none', frequency: 'daily', active: true },
  { id: 'p9', name: 'No Smoking', category: 'environment', description: 'Tobacco-free living', targetBehavior: 'Zero tobacco or smoke exposure', frequency: 'daily', active: true },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function CategoryIcon({ category, className, style }: { category: LongevityPillar['category']; className?: string; style?: React.CSSProperties }): React.ReactElement {
  const props = { className, style }
  switch (category) {
    case 'movement':    return <Flame {...props} />
    case 'nutrition':   return <Leaf {...props} />
    case 'stress':      return <Wind {...props} />
    case 'social':      return <Users {...props} />
    case 'purpose':     return <Sun {...props} />
    case 'sleep':       return <Moon {...props} />
    case 'environment': return <MapPin {...props} />
  }
}

function GaugeChart({ score }: { score: number }): React.ReactElement {
  const cx = 100, cy = 100, r = 80
  const startAngle = 200
  const endAngle = 340
  const totalArc = startAngle + (360 - startAngle) + endAngle
  const pct = Math.min(100, Math.max(0, score)) / 100
  const arcSpan = 280
  const filled = pct * arcSpan

  function polarToXY(angle: number, radius: number): [number, number] {
    const rad = ((angle - 90) * Math.PI) / 180
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
  }

  function arcPath(startDeg: number, endDeg: number, innerR: number, outerR: number): string {
    const [ox1, oy1] = polarToXY(startDeg, outerR)
    const [ox2, oy2] = polarToXY(endDeg, outerR)
    const [ix2, iy2] = polarToXY(endDeg, innerR)
    const [ix1, iy1] = polarToXY(startDeg, innerR)
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
  }

  const gaugeDeg = 130
  const bgEnd = gaugeDeg + arcSpan
  const fillEnd = gaugeDeg + filled

  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'

  return (
    <svg viewBox="0 0 200 160" className="w-full max-w-xs mx-auto">
      <path d={arcPath(gaugeDeg, bgEnd, 60, 80)} fill="#1e293b" />
      {filled > 0 && <path d={arcPath(gaugeDeg, fillEnd, 60, 80)} fill={color} />}
      <text x={cx} y={cy + 10} textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">{Math.round(score)}</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#94a3b8" fontSize="9">BLUE ZONE SCORE</text>
      <text x={cx} y={cy - 20} textAnchor="middle" fill="#64748b" fontSize="8">0</text>
      <text x={cx + 55} y={cy - 55} textAnchor="middle" fill="#64748b" fontSize="8">50</text>
      <text x={cx + 80} y={cy + 5} textAnchor="middle" fill="#64748b" fontSize="8">100</text>
    </svg>
  )
}

function AreaChart({ entries }: { entries: LongevityEntry[] }): React.ReactElement {
  const last30 = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  if (last30.length === 0) {
    return <div className="text-center text-slate-500 py-8 text-sm">No data yet</div>
  }

  const W = 520, H = 120, PAD = { t: 10, b: 30, l: 30, r: 10 }
  const chartW = W - PAD.l - PAD.r
  const chartH = H - PAD.t - PAD.b
  const n = last30.length

  function xPos(i: number): number { return PAD.l + (i / Math.max(n - 1, 1)) * chartW }
  function yPos(v: number): number { return PAD.t + chartH - (v / 100) * chartH }

  const points = last30.map((e, i) => ({ x: xPos(i), y: yPos(e.overallScore) }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.t + chartH} L ${points[0].x} ${PAD.t + chartH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={yPos(v)} x2={W - PAD.r} y2={yPos(v)} stroke="#1e293b" strokeWidth="1" />
          <text x={PAD.l - 4} y={yPos(v) + 4} fill="#64748b" fontSize="8" textAnchor="end">{v}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#22c55e" />
      ))}
      {last30.length > 0 && (
        <>
          <text x={PAD.l} y={H - 5} fill="#64748b" fontSize="8">{last30[0].date.slice(5)}</text>
          <text x={W - PAD.r} y={H - 5} fill="#64748b" fontSize="8" textAnchor="end">{last30[last30.length - 1].date.slice(5)}</text>
        </>
      )}
    </svg>
  )
}

function Heatmap({ entries, pillar }: { entries: LongevityEntry[]; pillar: LongevityPillar }): React.ReactElement {
  const days = 60
  const endDate = new Date()
  const dateMap = new Map<string, boolean>()

  for (let i = 0; i < days; i++) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().slice(0, 10)
    const entry = entries.find(e => e.date === key)
    dateMap.set(key, entry ? entry.completedPillarIds.includes(pillar.id) : false)
  }

  const CELL = 10, GAP = 2
  const cols = 10, rows = 6
  const cells = Array.from(dateMap.entries())

  return (
    <svg viewBox={`0 0 ${cols * (CELL + GAP)} ${rows * (CELL + GAP)}`} className="w-full max-w-xs">
      {cells.map(([, done], i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        return (
          <rect
            key={i}
            x={col * (CELL + GAP)}
            y={row * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx="2"
            fill={done ? CAT_COLOR[pillar.category] : '#1e293b'}
            opacity={done ? 0.85 : 1}
          />
        )
      })}
    </svg>
  )
}

export default function LongevityLog(): React.ReactElement {
  const { toastSuccess } = useToast()

  const [pillars, setPillars] = useState<LongevityPillar[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY + '-pillars')
      return raw ? (JSON.parse(raw) as LongevityPillar[]) : DEFAULT_PILLARS
    } catch { return DEFAULT_PILLARS }
  })

  const [entries, setEntries] = useState<LongevityEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY + '-entries')
      return raw ? (JSON.parse(raw) as LongevityEntry[]) : []
    } catch { return [] }
  })

  const [tab, setTab] = useState<'checkin' | 'pillars' | 'trends' | 'heatmap'>('checkin')

  const todayStr = today()
  const existingEntry = entries.find(e => e.date === todayStr)

  const [checkedIds, setCheckedIds] = useState<string[]>(existingEntry?.completedPillarIds ?? [])
  const [sliders, setSliders] = useState({
    overallScore:     existingEntry?.overallScore ?? 5,
    bodyFeel:         existingEntry?.bodyFeel ?? 5,
    mentalClarity:    existingEntry?.mentalClarity ?? 5,
    socialConnection: existingEntry?.socialConnection ?? 5,
  })
  const [notes, setNotes] = useState(existingEntry?.notes ?? '')

  const [showAddPillar, setShowAddPillar] = useState(false)
  const [newPillar, setNewPillar] = useState<Omit<LongevityPillar, 'id' | 'active'>>({
    name: '', category: 'movement', description: '', targetBehavior: '', frequency: 'daily',
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '-pillars', JSON.stringify(pillars))
  }, [pillars])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '-entries', JSON.stringify(entries))
  }, [entries])

  const activePillars = pillars.filter(p => p.active)

  function computeScore(ids: string[], s: typeof sliders): number {
    const completionPct = activePillars.length > 0 ? (ids.length / activePillars.length) * 100 : 0
    const sliderAvg = (s.overallScore + s.bodyFeel + s.mentalClarity + s.socialConnection) / 4
    return completionPct * 0.5 + sliderAvg * 5
  }

  const liveScore = computeScore(checkedIds, sliders)

  function togglePillar(id: string): void {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function saveCheckin(): void {
    const score = computeScore(checkedIds, sliders)
    const entry: LongevityEntry = {
      id: existingEntry?.id ?? Date.now().toString(),
      date: todayStr,
      completedPillarIds: checkedIds,
      overallScore: score,
      bodyFeel: sliders.bodyFeel,
      mentalClarity: sliders.mentalClarity,
      socialConnection: sliders.socialConnection,
      notes,
    }
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== todayStr)
      return [...filtered, entry]
    })
    toastSuccess('Check-in saved', `Blue Zone Score: ${Math.round(score)}`)
  }

  function addPillar(): void {
    if (!newPillar.name.trim()) return
    const p: LongevityPillar = { ...newPillar, id: Date.now().toString(), active: true }
    setPillars(prev => [...prev, p])
    setNewPillar({ name: '', category: 'movement', description: '', targetBehavior: '', frequency: 'daily' })
    setShowAddPillar(false)
    toastSuccess('Pillar added', newPillar.name)
  }

  function togglePillarActive(id: string): void {
    setPillars(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p))
  }

  function deletePillar(id: string): void {
    setPillars(prev => prev.filter(p => p.id !== id))
  }

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'checkin',  label: 'Daily Check-in' },
    { key: 'pillars',  label: 'Pillars' },
    { key: 'trends',   label: '30-Day Trend' },
    { key: 'heatmap',  label: 'Heatmap' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6" style={{ color: '#e2e8f0' }}>
      <div className="flex items-center gap-3">
        <Leaf className="w-8 h-8" style={{ color: '#22c55e' }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#22c55e' }}>Longevity Log</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Blue Zone principles · Live long & well</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? '#22c55e' : '#1e293b',
              color: tab === t.key ? '#fff' : '#94a3b8',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'checkin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="game-card p-6">
            <GaugeChart score={liveScore} />
            <div className="mt-4 space-y-4">
              {((['overallScore', 'bodyFeel', 'mentalClarity', 'socialConnection'] as const)).map(key => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#94a3b8' }}>{key === 'overallScore' ? 'Overall Feel' : key === 'bodyFeel' ? 'Body Feel' : key === 'mentalClarity' ? 'Mental Clarity' : 'Social Connection'}</span>
                    <span style={{ color: '#22c55e' }}>{sliders[key]}/10</span>
                  </div>
                  <input
                    type="range" min="1" max="10" value={sliders[key]}
                    onChange={e => setSliders(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full accent-green-500"
                    style={{ accentColor: '#22c55e' }}
                  />
                </div>
              ))}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes for today..."
                className="game-input w-full text-sm"
                rows={3}
              />
              <button onClick={saveCheckin} className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{ background: '#22c55e', color: '#fff' }}>
                <Save className="w-4 h-4" /> Save Check-in
              </button>
            </div>
          </div>

          <div className="game-card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#22c55e' }}>Today's Pillars</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {activePillars.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePillar(p.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                  style={{ background: checkedIds.includes(p.id) ? '#0f2a1a' : '#0f172a', border: `1px solid ${checkedIds.includes(p.id) ? CAT_COLOR[p.category] : '#1e293b'}` }}
                >
                  {checkedIds.includes(p.id)
                    ? <CheckSquare className="w-5 h-5 shrink-0" style={{ color: CAT_COLOR[p.category] }} />
                    : <Square className="w-5 h-5 shrink-0" style={{ color: '#475569' }} />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: checkedIds.includes(p.id) ? '#e2e8f0' : '#94a3b8' }}>{p.name}</div>
                    <div className="text-xs truncate" style={{ color: '#475569' }}>{p.targetBehavior}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: CAT_COLOR[p.category] + '22', color: CAT_COLOR[p.category] }}>
                    {CAT_LABEL[p.category]}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm" style={{ color: '#64748b' }}>
              {checkedIds.length} / {activePillars.length} completed
            </div>
          </div>
        </div>
      )}

      {tab === 'pillars' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold" style={{ color: '#22c55e' }}>Longevity Pillars</h2>
            <button onClick={() => setShowAddPillar(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: '#22c55e', color: '#fff' }}>
              <Plus className="w-4 h-4" /> Add Pillar
            </button>
          </div>

          {showAddPillar && (
            <div className="game-card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">New Pillar</h3>
                <button onClick={() => setShowAddPillar(false)}><X className="w-4 h-4" style={{ color: '#64748b' }} /></button>
              </div>
              <input className="game-input w-full" placeholder="Name" value={newPillar.name} onChange={e => setNewPillar(prev => ({ ...prev, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="game-input" value={newPillar.category} onChange={e => setNewPillar(prev => ({ ...prev, category: e.target.value as LongevityPillar['category'] }))}>
                  {(Object.keys(CAT_LABEL) as LongevityPillar['category'][]).map(c => (
                    <option key={c} value={c}>{CAT_LABEL[c]}</option>
                  ))}
                </select>
                <select className="game-input" value={newPillar.frequency} onChange={e => setNewPillar(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <input className="game-input w-full" placeholder="Target behavior" value={newPillar.targetBehavior} onChange={e => setNewPillar(prev => ({ ...prev, targetBehavior: e.target.value }))} />
              <input className="game-input w-full" placeholder="Description" value={newPillar.description} onChange={e => setNewPillar(prev => ({ ...prev, description: e.target.value }))} />
              <button onClick={addPillar} className="w-full py-2 rounded-lg font-semibold" style={{ background: '#22c55e', color: '#fff' }}>Add</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pillars.map(p => (
              <div key={p.id} className="game-card p-4 flex items-start gap-3" style={{ opacity: p.active ? 1 : 0.5 }}>
                <div className="p-2 rounded-lg shrink-0" style={{ background: CAT_COLOR[p.category] + '20' }}>
                  <CategoryIcon category={p.category} className="w-5 h-5" style={{ color: CAT_COLOR[p.category] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: CAT_COLOR[p.category] + '22', color: CAT_COLOR[p.category] }}>{CAT_LABEL[p.category]}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e293b', color: '#64748b' }}>{p.frequency}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>{p.targetBehavior}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => togglePillarActive(p.id)} className="text-xs px-2 py-1 rounded" style={{ background: p.active ? '#14532d' : '#1e293b', color: p.active ? '#22c55e' : '#64748b' }}>
                    {p.active ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => deletePillar(p.id)}>
                    <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'trends' && (
        <div className="game-card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#22c55e' }}>30-Day Blue Zone Score</h2>
          <AreaChart entries={entries} />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Avg Score', value: entries.length > 0 ? Math.round(entries.slice(-30).reduce((s, e) => s + e.overallScore, 0) / Math.min(entries.length, 30)) : '-' },
              { label: 'Days Logged', value: entries.length },
              { label: 'Best Score', value: entries.length > 0 ? Math.round(Math.max(...entries.map(e => e.overallScore))) : '-' },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-lg" style={{ background: '#0f172a' }}>
                <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: '#22c55e' }}>60-Day Pillar Adherence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pillars.filter(p => p.active).map(p => (
              <div key={p.id} className="game-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon category={p.category} className="w-4 h-4" style={{ color: CAT_COLOR[p.category] }} />
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <Heatmap entries={entries} pillar={p} />
                <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#475569' }}>
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#1e293b' }} /> Miss
                  <div className="w-3 h-3 rounded-sm ml-2" style={{ background: CAT_COLOR[p.category] }} /> Done
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
