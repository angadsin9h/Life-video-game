import React, { useState, useEffect } from 'react'
import { Sun, Moon, Zap, Brain, Users, Coffee, Dumbbell, Heart, Settings, Plus, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TaskType = 'deep' | 'shallow' | 'admin' | 'creative' | 'social' | 'recovery' | 'movement'

type EnergyBlock = {
  id: string
  hour: number
  planned: number
  actual: number
  taskType: TaskType
  notes: string
}

type EnergyDay = {
  id: string
  date: string
  blocks: EnergyBlock[]
  overallRating: number
  energyHighlight: string
  energyDrain: string
}

type EnergyProfile = {
  chronotype: 'early-bird' | 'moderate' | 'night-owl'
  peakHours: number[]
  lowHours: number[]
  notes: string
}

const STORAGE_KEY = 'lq-energyarchitecture'
const TRACKED_HOURS = Array.from({ length: 17 }, (_, i) => i + 6)

const TASK_CONFIG: Record<TaskType, { label: string; color: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  deep:      { label: 'Deep Work',  color: '#0ea5e9', Icon: Brain },
  shallow:   { label: 'Shallow',   color: '#94a3b8', Icon: Coffee },
  admin:     { label: 'Admin',      color: '#a78bfa', Icon: Settings },
  creative:  { label: 'Creative',   color: '#f59e0b', Icon: Zap },
  social:    { label: 'Social',     color: '#34d399', Icon: Users },
  recovery:  { label: 'Recovery',   color: '#f472b6', Icon: Heart },
  movement:  { label: 'Movement',   color: '#fb923c', Icon: Dumbbell },
}

const CHRONOTYPE_CONFIG = {
  'early-bird': { label: 'Early Bird', icon: '🌅', desc: 'Peak before noon' },
  'moderate':   { label: 'Moderate',   icon: '☀️',  desc: 'Peak mid-morning to early afternoon' },
  'night-owl':  { label: 'Night Owl',  icon: '🦉',  desc: 'Peak afternoon to evening' },
}

function makeDefaultBlocks(): EnergyBlock[] {
  return TRACKED_HOURS.map(hour => ({
    id: `${hour}`,
    hour,
    planned: 5,
    actual: 0,
    taskType: 'shallow' as TaskType,
    notes: '',
  }))
}

function makeTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function EnergyLabel({ value }: { value: number }) {
  const labels: Record<number, string> = { 1: 'Dead', 2: 'Very Low', 3: 'Low', 4: 'Below Avg', 5: 'Average', 6: 'Good', 7: 'High', 8: 'Very High', 9: 'Peak', 10: 'Transcendent' }
  return <span className="text-xs text-slate-400">{labels[value] ?? ''}</span>
}

function EnergyColor(v: number): string {
  if (v <= 3) return '#ef4444'
  if (v <= 5) return '#f59e0b'
  if (v <= 7) return '#22d3ee'
  return '#a3e635'
}

type StorageShape = {
  profile: EnergyProfile
  days: EnergyDay[]
}

export default function EnergyArchitecture() {
  const { toastSuccess } = useToast()
  const [tab, setTab] = useState<'plan' | 'track' | 'history' | 'profile'>('plan')
  const [profile, setProfile] = useState<EnergyProfile>({
    chronotype: 'moderate',
    peakHours: [],
    lowHours: [],
    notes: '',
  })
  const [days, setDays] = useState<EnergyDay[]>([])
  const [todayDate] = useState(makeTodayKey())
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({ overallRating: 7, energyHighlight: '', energyDrain: '' })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StorageShape
        setProfile(parsed.profile ?? profile)
        setDays(parsed.days ?? [])
      }
    } catch { /**/ }
  }, [])

  const persist = (nextProfile: EnergyProfile, nextDays: EnergyDay[]) => {
    const data: StorageShape = { profile: nextProfile, days: nextDays }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const todayEntry = days.find(d => d.date === todayDate)
  const todayBlocks: EnergyBlock[] = todayEntry?.blocks ?? makeDefaultBlocks()

  const upsertToday = (blocks: EnergyBlock[]) => {
    const next: EnergyDay = todayEntry
      ? { ...todayEntry, blocks }
      : { id: todayDate, date: todayDate, blocks, overallRating: 7, energyHighlight: '', energyDrain: '' }
    const updated = days.filter(d => d.date !== todayDate).concat(next)
    setDays(updated)
    persist(profile, updated)
  }

  const updateBlock = (id: string, patch: Partial<EnergyBlock>) => {
    const updated = todayBlocks.map(b => b.id === id ? { ...b, ...patch } : b)
    upsertToday(updated)
  }

  const saveProfile = (p: EnergyProfile) => {
    setProfile(p)
    persist(p, days)
    toastSuccess('Profile saved', 'Your energy profile has been updated')
  }

  const saveDayReview = () => {
    const next: EnergyDay = todayEntry
      ? { ...todayEntry, ...reviewForm }
      : { id: todayDate, date: todayDate, blocks: todayBlocks, ...reviewForm }
    const updated = days.filter(d => d.date !== todayDate).concat(next)
    setDays(updated)
    persist(profile, updated)
    toastSuccess('Day reviewed', 'Your energy day has been saved')
  }

  const togglePeakHour = (h: number, type: 'peak' | 'low') => {
    const key = type === 'peak' ? 'peakHours' : 'lowHours'
    const opposite = type === 'peak' ? 'lowHours' : 'peakHours'
    const arr = profile[key]
    const oppArr = profile[opposite]
    const next: EnergyProfile = {
      ...profile,
      [key]: arr.includes(h) ? arr.filter(x => x !== h) : [...arr, h],
      [opposite]: oppArr.filter(x => x !== h),
    }
    setProfile(next)
  }

  const loggedBlocks = todayBlocks.filter(b => b.actual > 0)

  const svgW = 640
  const svgH = 180
  const padL = 36
  const padR = 16
  const padT = 16
  const padB = 28
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB
  const hCount = TRACKED_HOURS.length
  const xOf = (i: number) => padL + (i / (hCount - 1)) * chartW
  const yOf = (v: number) => padT + chartH - ((v - 1) / 9) * chartH

  const plannedPoints = todayBlocks.map((b, i) => `${xOf(i)},${yOf(b.planned)}`).join(' ')
  const actualBlocks = todayBlocks.filter(b => b.actual > 0)

  type AreaSegment = { x1: number; y1p: number; y1a: number; x2: number; y2p: number; y2a: number; above: boolean }
  const areaSegments: AreaSegment[] = []
  for (let i = 0; i < todayBlocks.length - 1; i++) {
    const b1 = todayBlocks[i]
    const b2 = todayBlocks[i + 1]
    if (b1.actual > 0 && b2.actual > 0) {
      areaSegments.push({
        x1: xOf(i), y1p: yOf(b1.planned), y1a: yOf(b1.actual),
        x2: xOf(i + 1), y2p: yOf(b2.planned), y2a: yOf(b2.actual),
        above: (b1.actual + b2.actual) / 2 > (b1.planned + b2.planned) / 2,
      })
    }
  }

  const avgByHour: number[] = TRACKED_HOURS.map(hour => {
    const vals = days.flatMap(d => d.blocks.filter(b => b.hour === hour && b.actual > 0).map(b => b.actual))
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  })

  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const heatmapData: number[][] = DOW.map((_, dow) =>
    TRACKED_HOURS.map(hour => {
      const vals = days.filter(d => new Date(d.date).getDay() === dow)
        .flatMap(d => d.blocks.filter(b => b.hour === hour && b.actual > 0).map(b => b.actual))
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    })
  )

  function heatColor(v: number): string {
    if (v === 0) return '#1e293b'
    if (v < 4) return '#7f1d1d'
    if (v < 6) return '#78350f'
    if (v < 8) return '#164e63'
    return '#065f46'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
            <Zap className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              Energy Architecture
            </h1>
            <p className="text-sm text-slate-400">Design your day's energy curve</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl w-fit">
          {(['plan', 'track', 'history', 'profile'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'plan' && (
          <div className="space-y-6">
            <div className="game-card p-6">
              <h2 className="text-lg font-semibold text-teal-400 mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Energy Curve — {todayDate}
              </h2>
              <p className="text-xs text-slate-500 mb-4">Plan your energy level for each hour. Drag to see planned vs actual.</p>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 200 }}>
                <defs>
                  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#0c1424" />
                  </linearGradient>
                </defs>
                <rect x={0} y={0} width={svgW} height={svgH} fill="url(#bgGrad)" rx={8} />
                {[2, 4, 6, 8, 10].map(v => (
                  <g key={v}>
                    <line x1={padL} y1={yOf(v)} x2={svgW - padR} y2={yOf(v)} stroke="#1e293b" strokeWidth={1} />
                    <text x={padL - 4} y={yOf(v) + 4} fill="#475569" fontSize={9} textAnchor="end">{v}</text>
                  </g>
                ))}
                {TRACKED_HOURS.map((h, i) => (
                  <text key={h} x={xOf(i)} y={svgH - 6} fill="#475569" fontSize={8} textAnchor="middle">
                    {i % 2 === 0 ? formatHour(h) : ''}
                  </text>
                ))}
                {areaSegments.map((seg, i) => (
                  <polygon
                    key={i}
                    points={`${seg.x1},${seg.y1p} ${seg.x1},${seg.y1a} ${seg.x2},${seg.y2a} ${seg.x2},${seg.y2p}`}
                    fill={seg.above ? '#16a34a' : '#dc2626'}
                    fillOpacity={0.25}
                  />
                ))}
                <polyline points={plannedPoints} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3" strokeLinecap="round" />
                {actualBlocks.length > 1 && (
                  <polyline
                    points={actualBlocks.map((b) => {
                      const i = TRACKED_HOURS.indexOf(b.hour)
                      return `${xOf(i)},${yOf(b.actual)}`
                    }).join(' ')}
                    fill="none" stroke="#2dd4bf" strokeWidth={2.5} strokeLinecap="round"
                  />
                )}
                {todayBlocks.map((b, i) => (
                  <circle key={b.id} cx={xOf(i)} cy={yOf(b.planned)} r={3} fill="#f59e0b" />
                ))}
                {actualBlocks.map((b) => {
                  const i = TRACKED_HOURS.indexOf(b.hour)
                  return <circle key={b.id + 'a'} cx={xOf(i)} cy={yOf(b.actual)} r={3.5} fill="#2dd4bf" />
                })}
              </svg>
              <div className="flex items-center gap-6 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-0.5 bg-amber-400" style={{ borderTop: '2px dashed #f59e0b' }} /> Planned</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-0.5 bg-teal-400" /> Actual</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-green-700/50" /> Above plan</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-700/50" /> Below plan</span>
              </div>
            </div>

            <div className="space-y-3">
              {todayBlocks.map(block => {
                const cfg = TASK_CONFIG[block.taskType]
                const isOpen = expandedBlock === block.id
                return (
                  <div key={block.id} className="game-card overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors"
                      onClick={() => setExpandedBlock(isOpen ? null : block.id)}
                    >
                      <span className="text-slate-500 text-xs w-10 text-right">{formatHour(block.hour)}</span>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex gap-1 items-center">
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div
                              key={j}
                              className="w-4 h-4 rounded-sm transition-all"
                              style={{ background: j < block.planned ? EnergyColor(block.planned) : '#1e293b', opacity: j < block.planned ? 1 : 0.3 }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                        {block.actual > 0 && (
                          <span className="text-xs text-slate-400">actual: {block.actual}</span>
                        )}
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
                        <div className="mt-3">
                          <label className="text-xs text-slate-400 mb-1 block">Planned Energy: {block.planned} <EnergyLabel value={block.planned} /></label>
                          <input
                            type="range" min={1} max={10} value={block.planned}
                            onChange={e => updateBlock(block.id, { planned: Number(e.target.value) })}
                            className="w-full accent-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-2 block">Task Type</label>
                          <div className="flex flex-wrap gap-2">
                            {(Object.keys(TASK_CONFIG) as TaskType[]).map(tt => {
                              const c = TASK_CONFIG[tt]
                              const TIcon = c.Icon
                              return (
                                <button
                                  key={tt}
                                  onClick={() => updateBlock(block.id, { taskType: tt })}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-all ${
                                    block.taskType === tt ? 'border-opacity-100 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                  }`}
                                  style={block.taskType === tt ? { borderColor: c.color, background: c.color + '22', color: c.color } : {}}
                                >
                                  <TIcon className="w-3 h-3" />
                                  {c.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                          <input
                            type="text"
                            value={block.notes}
                            onChange={e => updateBlock(block.id, { notes: e.target.value })}
                            placeholder="What's planned for this hour?"
                            className="game-input w-full text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'track' && (
          <div className="space-y-6">
            <div className="game-card p-6">
              <h2 className="text-lg font-semibold text-teal-400 mb-4">Log Actual Energy</h2>
              <p className="text-xs text-slate-500 mb-4">Record how energized you actually felt each hour.</p>
              <div className="space-y-4">
                {todayBlocks.map(block => (
                  <div key={block.id} className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm w-12">{formatHour(block.hour)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">Planned: {block.planned}</span>
                        {block.actual > 0 && (
                          <span className="text-xs" style={{ color: block.actual >= block.planned ? '#34d399' : '#f87171' }}>
                            Actual: {block.actual} ({block.actual >= block.planned ? '+' : ''}{block.actual - block.planned})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <button
                            key={j}
                            onClick={() => updateBlock(block.id, { actual: block.actual === j + 1 ? 0 : j + 1 })}
                            className="w-7 h-7 rounded text-xs font-bold transition-all border"
                            style={{
                              background: j < block.actual ? EnergyColor(block.actual) + '40' : '#1e293b',
                              borderColor: j < block.actual ? EnergyColor(block.actual) : '#334155',
                              color: j < block.actual ? EnergyColor(block.actual) : '#475569',
                            }}
                          >
                            {j + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="w-12 h-10 flex items-center justify-center rounded-lg border border-slate-700" style={{ background: block.planned > 0 ? EnergyColor(block.planned) + '15' : '' }}>
                      <span className="text-lg font-bold" style={{ color: block.actual > 0 ? EnergyColor(block.actual) : '#475569' }}>
                        {block.actual > 0 ? block.actual : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="game-card p-6">
              <h2 className="text-lg font-semibold text-teal-400 mb-4">Day Review</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Overall Day Rating: {reviewForm.overallRating}/10</label>
                  <input
                    type="range" min={1} max={10} value={reviewForm.overallRating}
                    onChange={e => setReviewForm(f => ({ ...f, overallRating: Number(e.target.value) }))}
                    className="w-full accent-teal-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Energy Highlight (best moment)</label>
                  <input
                    type="text"
                    value={reviewForm.energyHighlight}
                    onChange={e => setReviewForm(f => ({ ...f, energyHighlight: e.target.value }))}
                    placeholder="When did you feel most alive today?"
                    className="game-input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Biggest Energy Drain</label>
                  <input
                    type="text"
                    value={reviewForm.energyDrain}
                    onChange={e => setReviewForm(f => ({ ...f, energyDrain: e.target.value }))}
                    placeholder="What drained you most today?"
                    className="game-input w-full"
                  />
                </div>
                <button onClick={saveDayReview} className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors">
                  Save Day Review
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-6">
            <div className="game-card p-6">
              <h2 className="text-lg font-semibold text-teal-400 mb-2">Average Energy by Hour</h2>
              <p className="text-xs text-slate-500 mb-4">Your consistent patterns across all logged days.</p>
              <div className="flex items-end gap-1 h-32">
                {TRACKED_HOURS.map((h, i) => {
                  const avg = avgByHour[i]
                  const heightPct = avg > 0 ? (avg / 10) * 100 : 4
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{ height: `${heightPct}%`, background: avg > 0 ? EnergyColor(avg) : '#1e293b', minHeight: 4 }}
                        title={avg > 0 ? `${formatHour(h)}: ${avg.toFixed(1)} avg` : `${formatHour(h)}: no data`}
                      />
                      {profile.peakHours.includes(h) && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {profile.lowHours.includes(h) && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      <span className="text-slate-600" style={{ fontSize: 7 }}>{i % 3 === 0 ? formatHour(h) : ''}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Peak hours</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Low hours</span>
              </div>
            </div>

            <div className="game-card p-6 overflow-x-auto">
              <h2 className="text-lg font-semibold text-teal-400 mb-2">Heatmap: Hour × Day of Week</h2>
              <p className="text-xs text-slate-500 mb-4">Average actual energy — darker green = higher energy.</p>
              <div className="min-w-max">
                <div className="flex gap-0.5 mb-1">
                  <div className="w-10" />
                  {TRACKED_HOURS.map((h, i) => (
                    <div key={h} className="w-7 text-center" style={{ fontSize: 8, color: '#475569' }}>
                      {i % 3 === 0 ? formatHour(h) : ''}
                    </div>
                  ))}
                </div>
                {DOW.map((day, di) => (
                  <div key={day} className="flex gap-0.5 mb-0.5 items-center">
                    <div className="w-10 text-xs text-slate-500 text-right pr-1">{day}</div>
                    {heatmapData[di].map((val, hi) => (
                      <div
                        key={hi}
                        className="w-7 h-7 rounded-sm"
                        style={{ background: heatColor(val) }}
                        title={val > 0 ? `${day} ${formatHour(TRACKED_HOURS[hi])}: ${val.toFixed(1)}` : 'No data'}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="game-card p-6">
              <h2 className="text-lg font-semibold text-teal-400 mb-4">Recent Days</h2>
              {days.length === 0 ? (
                <p className="text-slate-500 text-sm">No days logged yet. Start tracking your energy!</p>
              ) : (
                <div className="space-y-2">
                  {[...days].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(day => {
                    const logged = day.blocks.filter(b => b.actual > 0)
                    const avgActual = logged.length ? logged.reduce((s, b) => s + b.actual, 0) / logged.length : 0
                    return (
                      <div key={day.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                        <span className="text-sm text-slate-300 w-24">{day.date}</span>
                        <div className="flex-1">
                          <div className="flex gap-0.5">
                            {day.blocks.map(b => (
                              <div
                                key={b.id}
                                className="h-4 flex-1 rounded-sm"
                                style={{ background: b.actual > 0 ? EnergyColor(b.actual) : '#1e293b' }}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm font-bold" style={{ color: EnergyColor(Math.round(avgActual)) }}>
                          {avgActual > 0 ? avgActual.toFixed(1) : '—'}
                        </span>
                        <span className="text-xs text-amber-400">{day.overallRating}/10</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-6">
            <div className="game-card p-6">
              <h2 className="text-lg font-semibold text-teal-400 mb-4">Chronotype</h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(Object.keys(CHRONOTYPE_CONFIG) as EnergyProfile['chronotype'][]).map(ct => {
                  const c = CHRONOTYPE_CONFIG[ct]
                  return (
                    <button
                      key={ct}
                      onClick={() => setProfile(p => ({ ...p, chronotype: ct }))}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        profile.chronotype === ct
                          ? 'border-teal-500 bg-teal-500/10 text-white'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{c.icon}</div>
                      <div className="font-semibold text-sm">{c.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
                    </button>
                  )
                })}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Mark Your Peak Hours <span className="text-amber-400">(click to toggle)</span></h3>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 24 }, (_, h) => (
                    <button
                      key={h}
                      onClick={() => togglePeakHour(h, 'peak')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                        profile.peakHours.includes(h)
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {formatHour(h)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Mark Your Low Energy Hours <span className="text-red-400">(click to toggle)</span></h3>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 24 }, (_, h) => (
                    <button
                      key={h}
                      onClick={() => togglePeakHour(h, 'low')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                        profile.lowHours.includes(h)
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {formatHour(h)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-slate-400 mb-1 block">Notes about your energy patterns</label>
                <textarea
                  value={profile.notes}
                  onChange={e => setProfile(p => ({ ...p, notes: e.target.value }))}
                  placeholder="What affects your energy? Meals, exercise, sleep timing..."
                  className="game-input w-full resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={() => saveProfile(profile)}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Save Profile
              </button>
            </div>

            <div className="game-card p-6">
              <h2 className="text-sm font-semibold text-slate-400 mb-3">Your Energy Profile Summary</h2>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{CHRONOTYPE_CONFIG[profile.chronotype].icon}</span>
                <div>
                  <div className="font-semibold text-white">{CHRONOTYPE_CONFIG[profile.chronotype].label}</div>
                  <div className="text-xs text-slate-500">{CHRONOTYPE_CONFIG[profile.chronotype].desc}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.peakHours.map(h => (
                  <span key={h} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">{formatHour(h)}</span>
                ))}
              </div>
              {profile.peakHours.length === 0 && <p className="text-xs text-slate-600">No peak hours marked yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
