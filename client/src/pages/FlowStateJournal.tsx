import React, { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, Star, TrendingUp, Flame } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FlowEntry = {
  id: string
  date: string
  activity: string
  duration: number
  depthRating: number
  triggerConditions: string[]
  obstacles: string[]
  peakMoment: string
  emotionalState: 'energized' | 'calm' | 'focused' | 'playful'
  environmentFactors: string
  notes: string
}

const STORAGE_KEY = 'lq-flow-state-journal'

const TRIGGER_OPTIONS = [
  'Quiet environment',
  'Clear goal',
  'Challenge-skill balance',
  'No interruptions',
  'Physical comfort',
  'Energized body',
  'Music/white noise',
]

const OBSTACLE_OPTIONS = [
  'Noise',
  'Fatigue',
  'Unclear goal',
  'Emotional distress',
  'Hunger',
  'Social interruption',
]

const EMOTIONAL_STATES: FlowEntry['emotionalState'][] = ['energized', 'calm', 'focused', 'playful']

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const emotionalColor: Record<FlowEntry['emotionalState'], string> = {
  energized: '#f59e0b',
  calm: '#06b6d4',
  focused: '#6366f1',
  playful: '#ec4899',
}

function depthGlow(rating: number): string {
  if (rating >= 8) return '0 0 12px 2px rgba(251,191,36,0.5)'
  if (rating >= 5) return '0 0 8px 1px rgba(99,102,241,0.4)'
  return 'none'
}

function depthColor(rating: number): string {
  if (rating >= 8) return '#fbbf24'
  if (rating >= 5) return '#6366f1'
  return '#64748b'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function FlowStateJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FlowEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<FlowEntry, 'id' | 'date'>>({
    activity: '',
    duration: 60,
    depthRating: 7,
    triggerConditions: [],
    obstacles: [],
    peakMoment: '',
    emotionalState: 'focused',
    environmentFactors: '',
    notes: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setEntries(JSON.parse(saved) as FlowEntry[])
  }, [])

  const persist = (updated: FlowEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const resetForm = () => {
    setForm({
      activity: '',
      duration: 60,
      depthRating: 7,
      triggerConditions: [],
      obstacles: [],
      peakMoment: '',
      emotionalState: 'focused',
      environmentFactors: '',
      notes: '',
    })
  }

  const saveEntry = () => {
    if (!form.activity.trim()) return
    const entry: FlowEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...form,
    }
    persist([entry, ...entries])
    resetForm()
    setShowForm(false)
    toastSuccess('Flow session logged!', `${form.activity} — depth ${form.depthRating}/10`)
  }

  const deleteEntry = (id: string) => {
    persist(entries.filter(e => e.id !== id))
  }

  const toggleItem = (field: 'triggerConditions' | 'obstacles', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(x => x !== value)
        : [...f[field], value],
    }))
  }

  const flowStreak = (() => {
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const hasDeepFlow = entries.some(e => e.date === dateStr && e.depthRating >= 7)
      if (hasDeepFlow) streak++
      else if (i > 0) break
    }
    return streak
  })()

  const depthByDow = DAYS.map((_, dow) => {
    const relevant = entries.filter(e => new Date(e.date + 'T12:00:00').getDay() === dow)
    if (relevant.length === 0) return 0
    return relevant.reduce((s, e) => s + e.depthRating, 0) / relevant.length
  })

  const maxDow = Math.max(...depthByDow, 1)

  const triggerFreq = TRIGGER_OPTIONS.map(t => ({
    label: t,
    count: entries.filter(e => e.triggerConditions.includes(t)).length,
  })).sort((a, b) => b.count - a.count).slice(0, 3)

  const obstacleFreq = OBSTACLE_OPTIONS.map(o => ({
    label: o,
    count: entries.filter(e => e.obstacles.includes(o)).length,
  })).sort((a, b) => b.count - a.count).slice(0, 3)

  const svgW = 280
  const svgH = 100
  const barW = 28
  const barGap = 12
  const chartLeft = 24

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Zap className="w-7 h-7 text-violet-400" />
            Flow State Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track deep work sessions and optimise your flow triggers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Flow
        </button>
      </div>

      {flowStreak > 0 && (
        <div
          className="game-card p-4 flex items-center gap-3"
          style={{ borderLeft: '3px solid #f59e0b', background: 'rgba(251,191,36,0.06)' }}
        >
          <Flame className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <span className="text-amber-400 font-bold text-lg" style={{ fontFamily: 'Orbitron, monospace' }}>
              {flowStreak}-day
            </span>
            <span className="text-slate-300 text-sm ml-2">Deep Flow Streak (≥7 depth)</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-5 space-y-5 border border-violet-500/30">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" /> New Flow Entry
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Activity</label>
              <input
                value={form.activity}
                onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
                placeholder="What were you working on?"
                className="game-input w-full"
                autoFocus
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-400">Duration</label>
                <span className="text-violet-300 font-semibold">{formatDuration(form.duration)}</span>
              </div>
              <input
                type="range"
                min={15}
                max={480}
                step={15}
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}
                className="w-full accent-violet-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-400">Depth Rating</label>
                <span className="font-bold" style={{ color: depthColor(form.depthRating) }}>
                  {form.depthRating}/10
                </span>
              </div>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, depthRating: n }))}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className="w-4 h-4"
                      fill={n <= form.depthRating ? depthColor(form.depthRating) : 'transparent'}
                      stroke={n <= form.depthRating ? depthColor(form.depthRating) : '#334155'}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Emotional State</label>
            <div className="flex gap-2">
              {EMOTIONAL_STATES.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, emotionalState: s }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border"
                  style={
                    form.emotionalState === s
                      ? { background: `${emotionalColor[s]}22`, color: emotionalColor[s], borderColor: emotionalColor[s] }
                      : { background: '#1e293b', color: '#64748b', borderColor: 'transparent' }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Trigger Conditions (what helped you enter flow)</label>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleItem('triggerConditions', t)}
                  className="px-2 py-1 rounded-lg text-xs transition-all border"
                  style={
                    form.triggerConditions.includes(t)
                      ? { background: '#7c3aed33', color: '#a78bfa', borderColor: '#7c3aed' }
                      : { background: '#1e293b', color: '#64748b', borderColor: 'transparent' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Obstacles (what disrupted or could have disrupted)</label>
            <div className="flex flex-wrap gap-2">
              {OBSTACLE_OPTIONS.map(o => (
                <button
                  key={o}
                  onClick={() => toggleItem('obstacles', o)}
                  className="px-2 py-1 rounded-lg text-xs transition-all border"
                  style={
                    form.obstacles.includes(o)
                      ? { background: '#ef444433', color: '#f87171', borderColor: '#ef4444' }
                      : { background: '#1e293b', color: '#64748b', borderColor: 'transparent' }
                  }
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Peak Moment</label>
            <input
              value={form.peakMoment}
              onChange={e => setForm(f => ({ ...f, peakMoment: e.target.value }))}
              placeholder="Describe the best moment of this session..."
              className="game-input w-full"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Environment Factors</label>
            <input
              value={form.environmentFactors}
              onChange={e => setForm(f => ({ ...f, environmentFactors: e.target.value }))}
              placeholder="Location, setup, time of day, temperature..."
              className="game-input w-full"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any other observations..."
              className="game-input w-full h-16 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveEntry}
              disabled={!form.activity.trim()}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Save Flow Entry
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length >= 3 && (
        <div className="game-card p-5 space-y-5">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" /> Flow Patterns
          </h3>

          <div>
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide">Avg Depth by Day of Week</p>
            <svg width={svgW} height={svgH} className="overflow-visible">
              {DAYS.map((day, i) => {
                const val = depthByDow[i]
                const barH = (val / maxDow) * (svgH - 20)
                const x = chartLeft + i * (barW + barGap)
                const y = svgH - 16 - barH
                const col = val >= 8 ? '#fbbf24' : val >= 5 ? '#818cf8' : '#334155'
                return (
                  <g key={day}>
                    <rect x={x} y={y} width={barW} height={barH} rx={4} fill={col} fillOpacity={0.85} />
                    <text x={x + barW / 2} y={svgH - 2} textAnchor="middle" fontSize={9} fill="#64748b">{day}</text>
                    {val > 0 && (
                      <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={8} fill={col}>
                        {val.toFixed(1)}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Top Triggers</p>
              {triggerFreq.map((t, i) => (
                <div key={t.label} className="flex items-center gap-2 mb-1.5">
                  <span className="text-violet-400 text-xs font-bold w-4">#{i + 1}</span>
                  <span className="text-xs text-slate-300 flex-1 truncate">{t.label}</span>
                  <span className="text-xs text-slate-500">{t.count}x</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Top Obstacles</p>
              {obstacleFreq.map((o, i) => (
                <div key={o.label} className="flex items-center gap-2 mb-1.5">
                  <span className="text-red-400 text-xs font-bold w-4">#{i + 1}</span>
                  <span className="text-xs text-slate-300 flex-1 truncate">{o.label}</span>
                  <span className="text-xs text-slate-500">{o.count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="game-card overflow-hidden cursor-pointer"
            style={{
              borderLeft: `3px solid ${depthColor(entry.depthRating)}`,
              boxShadow: depthGlow(entry.depthRating),
            }}
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-200 text-sm">{entry.activity}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                      style={{
                        background: `${emotionalColor[entry.emotionalState]}22`,
                        color: emotionalColor[entry.emotionalState],
                      }}
                    >
                      {entry.emotionalState}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <Star
                          key={n}
                          className="w-3 h-3"
                          fill={n <= entry.depthRating ? depthColor(entry.depthRating) : 'transparent'}
                          stroke={n <= entry.depthRating ? depthColor(entry.depthRating) : '#1e293b'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{formatDuration(entry.duration)}</span>
                    <span className="text-xs text-slate-600">{entry.date}</span>
                  </div>
                  {entry.peakMoment && (
                    <p className="text-xs text-indigo-300/70 italic mt-1.5 line-clamp-1">
                      &ldquo;{entry.peakMoment}&rdquo;
                    </p>
                  )}
                  {(entry.triggerConditions.length > 0 || entry.obstacles.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.triggerConditions.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] bg-violet-900/40 text-violet-400 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                      {entry.obstacles.slice(0, 2).map(o => (
                        <span key={o} className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">
                          ⚠ {o}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={ev => { ev.stopPropagation(); deleteEntry(entry.id) }}
                  className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {expandedId === entry.id && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-sm">
                  {entry.environmentFactors && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase">Environment:</span>
                      <p className="text-slate-300 mt-0.5">{entry.environmentFactors}</p>
                    </div>
                  )}
                  {entry.notes && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase">Notes:</span>
                      <p className="text-slate-300 mt-0.5">{entry.notes}</p>
                    </div>
                  )}
                  {entry.triggerConditions.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase">All Triggers:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.triggerConditions.map(t => (
                          <span key={t} className="text-xs bg-violet-900/40 text-violet-300 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {entry.obstacles.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase">Obstacles:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.obstacles.map(o => (
                          <span key={o} className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded">{o}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No flow entries yet.</p>
          <p className="text-sm mb-5">Start tracking your deep work sessions to discover your flow patterns.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log Your First Flow Session
          </button>
        </div>
      )}
    </div>
  )
}
