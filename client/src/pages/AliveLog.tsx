import React, { useState, useEffect } from 'react'
import { Flame, Plus, Trash2, Wind, Heart, Zap, Compass, BookOpen, Music, Sun, Leaf } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AliveCategory = 'nature' | 'connection' | 'creation' | 'movement' | 'learning' | 'adventure' | 'flow' | 'love'

type AliveEntry = {
  id: string
  date: string
  moment: string
  category: AliveCategory
  intensity: number
  location: string
  withWhom: string
  sensoryDetails: string
  bodyFeeling: string
  insight: string
  spontaneous: boolean
}

const STORAGE_KEY = 'lq-alive-log'

const CAT_CONFIG: Record<AliveCategory, { label: string; color: string; bg: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  nature:     { label: 'Nature',     color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   Icon: Leaf },
  connection: { label: 'Connection', color: '#f97316', bg: 'rgba(249,115,22,0.15)',  Icon: Heart },
  creation:   { label: 'Creation',   color: '#a855f7', bg: 'rgba(168,85,247,0.15)', Icon: Music },
  movement:   { label: 'Movement',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   Icon: Zap },
  learning:   { label: 'Learning',   color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  Icon: BookOpen },
  adventure:  { label: 'Adventure',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', Icon: Compass },
  flow:       { label: 'Flow',       color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   Icon: Wind },
  love:       { label: 'Love',       color: '#ec4899', bg: 'rgba(236,72,153,0.15)', Icon: Sun },
}

const CATEGORIES: AliveCategory[] = ['nature', 'connection', 'creation', 'movement', 'learning', 'adventure', 'flow', 'love']

const emptyForm = (): Omit<AliveEntry, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  moment: '',
  category: 'nature',
  intensity: 7,
  location: '',
  withWhom: '',
  sensoryDetails: '',
  bodyFeeling: '',
  insight: '',
  spontaneous: true,
})

function getDayOfYear(dateStr: string): number {
  const d = new Date(dateStr)
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export default function AliveLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AliveEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AliveEntry, 'id'>>(emptyForm())
  const [activeTab, setActiveTab] = useState<'portrait' | 'capture' | 'patterns' | 'blueprint' | 'calendar'>('portrait')

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: AliveEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addEntry = () => {
    if (!form.moment.trim()) return
    const entry: AliveEntry = { ...form, id: Date.now().toString() }
    save([entry, ...entries])
    setForm(emptyForm())
    setShowForm(false)
    toastSuccess('Alive moment captured', 'Stay vibrant.')
  }

  const removeEntry = (id: string) => {
    save(entries.filter(e => e.id !== id))
  }

  const getCatCounts = () => {
    const counts: Partial<Record<AliveCategory, number>> = {}
    entries.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1 })
    return counts
  }

  const getTopCats = () =>
    Object.entries(getCatCounts())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) as [AliveCategory, number][]

  const getTopLocations = () => {
    const counts: Record<string, number> = {}
    entries.forEach(e => { if (e.location.trim()) { const k = e.location.trim(); counts[k] = (counts[k] || 0) + 1 } })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }

  const getTopCompanions = () => {
    const counts: Record<string, number> = {}
    entries.forEach(e => { if (e.withWhom.trim()) { const k = e.withWhom.trim(); counts[k] = (counts[k] || 0) + 1 } })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }

  const getStreak = () => {
    if (entries.length === 0) return 0
    const days = [...new Set(entries.map(e => e.date))].sort().reverse()
    let streak = 0
    let cur = new Date()
    for (const day of days) {
      const d = new Date(day)
      const diff = Math.round((cur.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diff > 1) break
      streak++
      cur = d
    }
    return streak
  }

  const avgIntensity = entries.length
    ? (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1)
    : '0'
  const spontaneousCount = entries.filter(e => e.spontaneous).length
  const topCats = getTopCats()
  const topLocations = getTopLocations()
  const topCompanions = getTopCompanions()
  const streak = getStreak()
  const catCounts = getCatCounts()

  const now = new Date()
  const year = now.getFullYear()
  const monthStart = new Date(year, now.getMonth(), 1)
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate()
  const firstDow = monthStart.getDay()
  const monthStr = now.toISOString().slice(0, 7)
  const entriesByDate: Record<string, number> = {}
  entries.filter(e => e.date.startsWith(monthStr)).forEach(e => {
    entriesByDate[e.date] = Math.max(entriesByDate[e.date] || 0, e.intensity)
  })

  const bubbleSvgW = 560
  const bubbleSvgH = 320

  const pseudoPositions = entries.slice(0, 60).map((entry, i) => {
    const seed = getDayOfYear(entry.date) * 17 + i * 137
    const angle = (seed * 2.399963) % (Math.PI * 2)
    const r = 20 + ((seed % 100) / 100) * (Math.min(bubbleSvgW, bubbleSvgH) / 2 - 30)
    const cx = bubbleSvgW / 2 + Math.cos(angle) * r * (bubbleSvgW / bubbleSvgH) * 0.85
    const cy = bubbleSvgH / 2 + Math.sin(angle) * r * 0.7
    return { entry, cx, cy }
  })

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(135deg, #0a0a00 0%, #0d0a1a 30%, #0a1510 70%, #160a0a 100%)' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <Flame className="w-7 h-7" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#f97316', fontFamily: 'Orbitron, monospace' }}>Alive Log</h1>
              <p className="text-sm" style={{ color: '#a0714f' }}>Track the moments that make life worth living.</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setActiveTab('capture') }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
            Capture Moment
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Moments Logged', value: entries.length.toString(), color: '#f97316' },
            { label: 'Avg Intensity', value: `${avgIntensity}/10`, color: '#ef4444' },
            { label: 'Day Streak', value: `${streak}d`, color: '#06b6d4' },
            { label: 'Spontaneous', value: `${spontaneousCount}`, color: '#22c55e' },
          ].map(stat => (
            <div key={stat.label} className="game-card p-4 text-center" style={{ border: `1px solid ${stat.color}33` }}>
              <div className="text-2xl font-bold" style={{ color: stat.color, fontFamily: 'Orbitron, monospace' }}>{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: '#888' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['portrait', 'capture', 'patterns', 'blueprint', 'calendar'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
              style={{
                background: activeTab === tab ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === tab ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab ? '#f97316' : '#888',
              }}
            >
              {tab === 'portrait' ? 'Alive Portrait' : tab === 'capture' ? 'Capture' : tab === 'patterns' ? 'Vitality Patterns' : tab === 'blueprint' ? 'Alive Blueprint' : '30-Day Calendar'}
            </button>
          ))}
        </div>

        {activeTab === 'portrait' && (
          <div className="game-card p-5" style={{ border: '1px solid rgba(249,115,22,0.25)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
              <span className="font-bold" style={{ color: '#f97316' }}>Your Alive Portrait</span>
              <span className="text-xs ml-auto" style={{ color: '#888' }}>Each bubble = one moment</span>
            </div>
            {entries.length === 0 ? (
              <div className="text-center py-16">
                <Flame className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(249,115,22,0.2)' }} />
                <p style={{ color: '#888' }}>Capture your first alive moment to build your portrait.</p>
              </div>
            ) : (
              <>
                <svg width="100%" viewBox={`0 0 ${bubbleSvgW} ${bubbleSvgH}`} style={{ overflow: 'visible' }}>
                  <defs>
                    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(249,115,22,0.05)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </radialGradient>
                  </defs>
                  <ellipse cx={bubbleSvgW / 2} cy={bubbleSvgH / 2} rx={bubbleSvgW * 0.45} ry={bubbleSvgH * 0.45} fill="url(#bgGlow)" />
                  {pseudoPositions.map(({ entry, cx, cy }, i) => {
                    const radius = 4 + entry.intensity * 2.2
                    const color = CAT_CONFIG[entry.category].color
                    return (
                      <g key={entry.id}>
                        <circle cx={cx} cy={cy} r={radius + 3} fill={color} fillOpacity={0.08} />
                        <circle cx={cx} cy={cy} r={radius} fill={color} fillOpacity={0.65} stroke={color} strokeWidth={1.5}>
                          <title>{entry.moment.slice(0, 80)} ({CAT_CONFIG[entry.category].label}, {entry.date})</title>
                        </circle>
                        {radius > 12 && (
                          <text x={cx} y={cy + 3} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={7}>
                            {entry.intensity}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </svg>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {CATEGORIES.filter(c => entries.some(e => e.category === c)).map(c => {
                    const CatIcon = CAT_CONFIG[c].Icon
                    return (
                      <div key={c} className="flex items-center gap-1.5 text-xs" style={{ color: CAT_CONFIG[c].color }}>
                        <CatIcon className="w-3 h-3" />
                        {CAT_CONFIG[c].label}
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>({catCounts[c] || 0})</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'capture' && (
          <div className="game-card p-5 space-y-4" style={{ border: '1px solid rgba(249,115,22,0.35)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" style={{ color: '#f97316' }} />
              <span className="font-bold" style={{ color: '#f97316' }}>Capture an Alive Moment</span>
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: '#a0714f' }}>What made you feel alive?</label>
              <textarea
                className="game-input w-full h-24 resize-none"
                placeholder="Describe the moment in vivid detail..."
                value={form.moment}
                onChange={e => setForm(f => ({ ...f, moment: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs mb-2" style={{ color: '#a0714f' }}>Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(c => {
                  const CatIcon = CAT_CONFIG[c].Icon
                  return (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, category: c }))}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                      style={{
                        background: form.category === c ? CAT_CONFIG[c].bg : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.category === c ? CAT_CONFIG[c].color : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <CatIcon className="w-5 h-5" style={{ color: form.category === c ? CAT_CONFIG[c].color : '#666' }} />
                      <span className="text-xs" style={{ color: form.category === c ? CAT_CONFIG[c].color : '#666' }}>{CAT_CONFIG[c].label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#a0714f' }}>Intensity: {form.intensity}/10</label>
                <input
                  type="range" min={1} max={10}
                  value={form.intensity}
                  onChange={e => setForm(f => ({ ...f, intensity: +e.target.value }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a0714f' }}>Date</label>
                <input
                  type="date"
                  className="game-input w-full"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a0714f' }}>Location</label>
                <input
                  className="game-input w-full"
                  placeholder="Where were you?"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a0714f' }}>With Whom</label>
                <input
                  className="game-input w-full"
                  placeholder="Alone, or who was there?"
                  value={form.withWhom}
                  onChange={e => setForm(f => ({ ...f, withWhom: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: '#a0714f' }}>Sensory Details</label>
              <textarea
                className="game-input w-full h-16 resize-none"
                placeholder="Sights, sounds, smells that anchored the moment..."
                value={form.sensoryDetails}
                onChange={e => setForm(f => ({ ...f, sensoryDetails: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a0714f' }}>How It Felt Physically</label>
                <textarea
                  className="game-input w-full h-16 resize-none"
                  placeholder="Describe the body sensation..."
                  value={form.bodyFeeling}
                  onChange={e => setForm(f => ({ ...f, bodyFeeling: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a0714f' }}>Insight</label>
                <textarea
                  className="game-input w-full h-16 resize-none"
                  placeholder="What does this reveal about you?"
                  value={form.insight}
                  onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs" style={{ color: '#a0714f' }}>Was this spontaneous?</label>
              <button
                onClick={() => setForm(f => ({ ...f, spontaneous: !f.spontaneous }))}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: form.spontaneous ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${form.spontaneous ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                  color: form.spontaneous ? '#4ade80' : '#888',
                }}
              >
                {form.spontaneous ? 'Spontaneous' : 'Planned'}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={addEntry}
                className="px-6 py-2 rounded-xl font-semibold"
                style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', color: '#fff' }}
              >
                Save Moment
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm()) }}
                className="px-6 py-2 rounded-xl font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Clear
              </button>
            </div>

            {entries.length > 0 && (
              <div className="mt-6 space-y-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold" style={{ color: '#888' }}>RECENT MOMENTS</p>
                {entries.slice(0, 5).map(entry => {
                  const CatIcon = CAT_CONFIG[entry.category].Icon
                  return (
                    <div key={entry.id} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: CAT_CONFIG[entry.category].bg }}>
                          <CatIcon className="w-4 h-4" style={{ color: CAT_CONFIG[entry.category].color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: '#e5d5c5' }}>{entry.moment}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: CAT_CONFIG[entry.category].color }}>{CAT_CONFIG[entry.category].label}</span>
                            <span className="text-xs" style={{ color: '#666' }}>{entry.date}</span>
                            <span className="text-xs font-bold" style={{ color: '#f97316' }}>{entry.intensity}/10</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeEntry(entry.id)} className="ml-2 hover:text-red-400 flex-shrink-0" style={{ color: '#555' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="game-card p-5" style={{ border: '1px solid rgba(249,115,22,0.25)' }}>
              <p className="font-bold mb-4" style={{ color: '#f97316' }}>Category Frequency</p>
              {CATEGORIES.filter(c => catCounts[c]).length === 0 ? (
                <p className="text-sm" style={{ color: '#888' }}>No entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {(Object.entries(catCounts) as [AliveCategory, number][])
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const maxCount = Math.max(...Object.values(catCounts) as number[])
                      const CatIcon = CAT_CONFIG[cat].Icon
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <CatIcon className="w-4 h-4 flex-shrink-0" style={{ color: CAT_CONFIG[cat].color }} />
                          <span className="text-sm w-24 flex-shrink-0" style={{ color: CAT_CONFIG[cat].color }}>{CAT_CONFIG[cat].label}</span>
                          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${(count / maxCount) * 100}%`, background: CAT_CONFIG[cat].color }}
                            />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: '#888' }}>{count}</span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="game-card p-5" style={{ border: '1px solid rgba(6,182,212,0.25)' }}>
                <p className="font-bold mb-3" style={{ color: '#06b6d4' }}>Alone vs With Others</p>
                {entries.length === 0 ? (
                  <p className="text-sm" style={{ color: '#888' }}>No data yet.</p>
                ) : (() => {
                  const alone = entries.filter(e => !e.withWhom.trim() || e.withWhom.toLowerCase().includes('alone')).length
                  const together = entries.length - alone
                  const pct = Math.round((alone / entries.length) * 100)
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: '#06b6d4' }}>Solo ({alone})</span>
                          <span style={{ color: '#f97316' }}>Together ({together})</span>
                        </div>
                        <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(249,115,22,0.3)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#06b6d4' }} />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="game-card p-5" style={{ border: '1px solid rgba(34,197,94,0.25)' }}>
                <p className="font-bold mb-3" style={{ color: '#22c55e' }}>Spontaneous vs Planned</p>
                {entries.length === 0 ? (
                  <p className="text-sm" style={{ color: '#888' }}>No data yet.</p>
                ) : (() => {
                  const sp = entries.filter(e => e.spontaneous).length
                  const pl = entries.length - sp
                  const pct = Math.round((sp / entries.length) * 100)
                  return (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: '#22c55e' }}>Spontaneous ({sp})</span>
                        <span style={{ color: '#a855f7' }}>Planned ({pl})</span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(168,85,247,0.3)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#22c55e' }} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blueprint' && (
          <div className="game-card p-6" style={{ border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.04)' }}>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
              <span className="font-bold text-lg" style={{ color: '#f97316' }}>Your Alive Blueprint</span>
            </div>
            {entries.length < 3 ? (
              <p className="text-sm text-center py-8" style={{ color: '#888' }}>Log at least 3 moments to generate your blueprint.</p>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: '#f97316' }}>RECIPE FOR FEELING ALIVE</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#f5d5b8' }}>
                    You come alive most through{' '}
                    {topCats.map((([c]) => CAT_CONFIG[c as AliveCategory].label)).join(', ')}.
                    {topLocations.length > 0 && ` Your peak locations are ${topLocations.map(([l]) => l).join(' and ')}.`}
                    {spontaneousCount > entries.length / 2
                      ? ' Most of your alive moments happen spontaneously — stay open to the unexpected.'
                      : ' You create aliveness through intentional planning.'}
                  </p>
                </div>

                {topCats.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#888' }}>TOP 3 ALIVE CATEGORIES</p>
                    <div className="flex gap-3 flex-wrap">
                      {topCats.map(([cat, count]) => {
                        const CatIcon = CAT_CONFIG[cat].Icon
                        return (
                          <div key={cat} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: CAT_CONFIG[cat].bg, border: `1px solid ${CAT_CONFIG[cat].color}44` }}>
                            <CatIcon className="w-4 h-4" style={{ color: CAT_CONFIG[cat].color }} />
                            <span className="font-semibold text-sm" style={{ color: CAT_CONFIG[cat].color }}>{CAT_CONFIG[cat].label}</span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{count}×</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {topLocations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#888' }}>BEST LOCATIONS</p>
                    <div className="flex flex-wrap gap-2">
                      {topLocations.map(([loc, count]) => (
                        <span key={loc} className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                          {loc} <span className="opacity-60">({count}×)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {topCompanions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#888' }}>BEST COMPANIONS</p>
                    <div className="flex flex-wrap gap-2">
                      {topCompanions.map(([who, count]) => (
                        <span key={who} className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>
                          {who} <span className="opacity-60">({count}×)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="game-card p-5" style={{ border: '1px solid rgba(249,115,22,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
                <span className="font-bold" style={{ color: '#f97316' }}>
                  {now.toLocaleString('default', { month: 'long' })} {year}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: '#06b6d4' }}>{streak}d streak</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs py-1" style={{ color: '#666' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const intensity = entriesByDate[dateStr]
                const isToday = day === now.getDate()
                const alpha = intensity ? 0.25 + (intensity / 10) * 0.75 : 0
                return (
                  <div
                    key={day}
                    className="aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all"
                    style={{
                      background: intensity
                        ? `rgba(249,115,22,${alpha})`
                        : 'rgba(255,255,255,0.04)',
                      border: isToday ? '1.5px solid #f97316' : '1px solid rgba(255,255,255,0.06)',
                      color: intensity ? '#fff' : '#555',
                    }}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs" style={{ color: '#666' }}>Less alive</span>
              {[0.25, 0.45, 0.65, 0.85, 1].map(alpha => (
                <div key={alpha} className="w-4 h-4 rounded" style={{ background: `rgba(249,115,22,${alpha})` }} />
              ))}
              <span className="text-xs" style={{ color: '#666' }}>More alive</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
